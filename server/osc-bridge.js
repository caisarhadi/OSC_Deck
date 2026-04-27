/**
 * API Bridge Server
 *
 * WebSocket server that receives JSON from the browser and:
 *   1. Exposes it as a REST API endpoint for Unreal Engine (VaRest)
 *   2. Sends individual OSC messages over UDP to Unreal Engine (OSC Plugin)
 *
 * Unreal Engine can send telemetry back as OSC messages on the UDP listen port,
 * which are converted to JSON and broadcast to all WebSocket clients.
 *
 * Usage:  node server/osc-bridge.js
 *
 * Ports:
 *   9000  WebSocket + HTTP   (Browser <-> Node)
 *   9001  UDP send           (Node -> Unreal)
 *   9002  UDP listen         (Unreal -> Node)
 */

const http = require('http');
const { WebSocketServer } = require('ws');
const osc = require('osc');

// ── Config ──────────────────────────────────────────────────────────

const PORT          = 9000;
const UE_OSC_HOST   = '127.0.0.1';
const UE_OSC_PORT   = 9001;
const LOCAL_OSC_PORT = 9002;

// ── OSC key sets ────────────────────────────────────────────────────

const ALLOWED_OSC_KEYS = new Set([
    'tx', 'ty', 'rx', 'ry', 'rz', 'custom',
    'shutter', 'ei', 'nd', 'wb',
    'fcl', 'iris', 'fcs',
    'af', 'reset',
    'resetFcl', 'resetIris', 'resetFcs',
    'resetShutter', 'resetEi', 'resetNd', 'resetWb',
]);

const BOOLEAN_KEYS = new Set([
    'af', 'reset',
    'resetFcl', 'resetIris', 'resetFcs',
    'resetShutter', 'resetEi', 'resetNd', 'resetWb',
]);

const NON_OSC_KEYS = new Set(['cam', 'tRate', 'masterRate']);

const TELEMETRY_OSC_TO_KEY = {
    '/telemetry/shutter': 'shutter',
    '/telemetry/ei':      'ei',
    '/telemetry/nd':      'nd',
    '/telemetry/wb':      'wb',
    '/telemetry/fcl':     'fcl',
    '/telemetry/iris':    'iris',
    '/telemetry/fcs':     'fcs',
};

// ── Per-camera state ────────────────────────────────────────────────

const camStates = { A: null, B: null, C: null, D: null };
let activeCam  = 'A';

// ── HTTP server + WebSocket ─────────────────────────────────────────

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/state') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                console.log('[+] Received from UE:', data);
                broadcastToClients({ type: 'ue_update', data });
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'ok' }));
            } catch (e) {
                console.error('[!] Bad JSON from UE:', e.message);
                res.writeHead(400);
                res.end('Bad Request');
            }
        });
        return;
    }

    if (req.method === 'GET' && req.url === '/state') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify([{ cam: activeCam, ...(camStates[activeCam] || {}) }]));
        return;
    }

    res.writeHead(404);
    res.end('Not Found');
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
    const ip = req.socket.remoteAddress;
    console.log(`[+] Browser connected: ${ip}`);

    ws.on('message', (raw) => {
        try {
            const data = JSON.parse(raw);
            sendOSCFromState(data);
        } catch (e) {
            console.error('[!] Bad JSON from browser:', e.message);
        }
    });

    ws.on('close', () => console.log(`[-] Browser disconnected: ${ip}`));
});

// ── UDP / OSC ───────────────────────────────────────────────────────

const udpPort = new osc.UDPPort({
    localAddress:  '0.0.0.0',
    localPort:     LOCAL_OSC_PORT,
    remoteAddress: UE_OSC_HOST,
    remotePort:    UE_OSC_PORT,
    metadata:      false,
});

udpPort.on('ready', () => {
    console.log(`[+] UDP OSC listening on 0.0.0.0:${LOCAL_OSC_PORT}, sending to ${UE_OSC_HOST}:${UE_OSC_PORT}`);
});

udpPort.on('message', (oscMsg) => {
    const key = TELEMETRY_OSC_TO_KEY[oscMsg.address];
    if (!key) return;

    const value = oscMsg.args && oscMsg.args.length > 0 ? oscMsg.args[0] : 0;
    broadcastToClients({ type: 'ue_update', data: { [key]: value } });
});

udpPort.on('error', (err) => {
    console.error('[!] UDP OSC error:', err.message);
});

udpPort.open();

// ── OSC send logic ──────────────────────────────────────────────────

function seedCamState(camLetter, state) {
    const seeded = {};
    for (const [key, value] of Object.entries(state)) {
        if (!NON_OSC_KEYS.has(key)) {
            seeded[key] = value;
        }
    }
    camStates[camLetter] = seeded;
}

function sendOSCFromState(newState) {
    const camLetter = newState.cam !== undefined ? newState.cam : activeCam;

    if (!camStates.hasOwnProperty(camLetter)) return;

    const power = newState.power !== undefined ? newState.power : ((camStates[camLetter] && camStates[camLetter].power) || 0);

    if (camLetter !== activeCam) {
        udpPort.send(
            { address: `/${power}/${camLetter}/select`, args: [1] },
            UE_OSC_HOST, UE_OSC_PORT
        );
    }

    if (camStates[camLetter] === null) {
        seedCamState(camLetter, newState);
        activeCam = camLetter;
        return;
    }

    const prev = camStates[camLetter];

    if (newState.power !== undefined && newState.power !== prev.power) {
        udpPort.send(
            { address: `/${power}/${camLetter}/power`, args: [power] },
            UE_OSC_HOST, UE_OSC_PORT
        );
    }

    for (const [key, value] of Object.entries(newState)) {
        if (!ALLOWED_OSC_KEYS.has(key)) continue;

        if (BOOLEAN_KEYS.has(key) && value !== 1) continue;

        if (prev[key] === value) continue;

        const address = `/${power}/${camLetter}/${key}`;
        udpPort.send({ address, args: [value] }, UE_OSC_HOST, UE_OSC_PORT);
    }

    for (const [key, value] of Object.entries(newState)) {
        if (!NON_OSC_KEYS.has(key)) {
            prev[key] = value;
        }
    }
    activeCam = camLetter;
}

// ── Helpers ─────────────────────────────────────────────────────────

function broadcastToClients(payload) {
    const json = JSON.stringify(payload);
    wss.clients.forEach(client => {
        if (client.readyState === 1) client.send(json);
    });
}

// ── Start ───────────────────────────────────────────────────────────

server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n  ┌──────────────────────────────────────────┐`);
    console.log(`  │  API Bridge Server                       │`);
    console.log(`  ├──────────────────────────────────────────┤`);
    console.log(`  │  WebSocket : ws://0.0.0.0:${PORT}           │`);
    console.log(`  │  REST API  : http://0.0.0.0:${PORT}/state     │`);
    console.log(`  │  OSC Send  : ${UE_OSC_HOST}:${UE_OSC_PORT}            │`);
    console.log(`  │  OSC Listen: 0.0.0.0:${LOCAL_OSC_PORT}              │`);
    console.log(`  └──────────────────────────────────────────┘\n`);
});
