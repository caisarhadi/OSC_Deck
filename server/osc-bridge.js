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

const PORT = 9000;
const UE_OSC_HOST = '127.0.0.1';
const UE_OSC_PORT = 9001;
const LOCAL_OSC_PORT = 9002;

// ── OSC address mapping ─────────────────────────────────────────────

const KEY_TO_OSC = {
    tx:           '/cam/axis/tx',
    ty:           '/cam/axis/ty',
    rx:           '/cam/axis/rx',
    ry:           '/cam/axis/ry',
    rz:           '/cam/axis/rz',
    custom:       '/cam/axis/custom',
    shutter:      '/cam/knob/shutter',
    ei:           '/cam/knob/ei',
    nd:           '/cam/knob/nd',
    wb:           '/cam/knob/wb',
    fcl:          '/cam/slider/fcl',
    iris:         '/cam/slider/iris',
    fcs:          '/cam/slider/fcs',
    af:           '/cam/toggle/af',
    reset:        '/cam/toggle/reset',
    resetFcl:     '/cam/toggle/resetFcl',
    resetIris:    '/cam/toggle/resetIris',
    resetFcs:     '/cam/toggle/resetFcs',
    resetShutter: '/cam/toggle/resetShutter',
    resetEi:      '/cam/toggle/resetEi',
    resetNd:      '/cam/toggle/resetNd',
    resetWb:      '/cam/toggle/resetWb',
};

const BOOLEAN_KEYS = new Set([
    'af', 'reset',
    'resetFcl', 'resetIris', 'resetFcs',
    'resetShutter', 'resetEi', 'resetNd', 'resetWb',
]);

// Reverse map: OSC telemetry address -> JSON key
const TELEMETRY_OSC_TO_KEY = {
    '/telemetry/shutter': 'shutter',
    '/telemetry/ei':      'ei',
    '/telemetry/nd':      'nd',
    '/telemetry/wb':      'wb',
    '/telemetry/fcl':     'fcl',
    '/telemetry/iris':    'iris',
    '/telemetry/fcs':     'fcs',
};

// ── State (per-camera, seeded from first browser message) ───────────

const camStates = { A: null, B: null, C: null, D: null };

let activeCam = 'A';
let latestRaw = null;

// ── UDP / OSC Port ───────────────────────────────────────────────────

const udpPort = new osc.UDPPort({
    localAddress: '0.0.0.0',
    localPort: LOCAL_OSC_PORT,
    remoteAddress: UE_OSC_HOST,
    remotePort: UE_OSC_PORT,
    metadata: false,
});

udpPort.on('ready', () => {
    console.log(`[+] UDP OSC listening on 0.0.0.0:${LOCAL_OSC_PORT}, sending to ${UE_OSC_HOST}:${UE_OSC_PORT}`);
});

udpPort.on('message', (oscMsg) => {
    const key = TELEMETRY_OSC_TO_KEY[oscMsg.address];
    if (!key) return;

    const value = oscMsg.args && oscMsg.args.length > 0 ? oscMsg.args[0] : 0;
    const data = { [key]: value };

    wss.clients.forEach(client => {
        if (client.readyState === 1) {
            client.send(JSON.stringify({ type: 'ue_update', data }));
        }
    });
});

udpPort.on('error', (err) => {
    console.error('[!] UDP OSC error:', err.message);
});

udpPort.open();

// ── Send individual OSC messages ─────────────────────────────────────

function seedCamState(camLetter, state) {
    const seeded = {};
    for (const [key, value] of Object.entries(state)) {
        if (key !== 'cam' && key !== 'tRate' && key !== 'masterRate') {
            seeded[key] = value;
        }
    }
    camStates[camLetter] = seeded;
}

function sendOSCFromState(newState) {
    const camLetter = newState.cam !== undefined ? newState.cam : activeCam;

    // First message for this camera — seed state, don't send
    if (camStates[camLetter] === null) {
        seedCamState(camLetter, newState);
        activeCam = camLetter;
        return;
    }

    const prevCamState = camStates[camLetter];
    const powerState = newState.power !== undefined ? newState.power : (prevCamState.power || 0);

    // Camera select — only send when the active camera actually changes
    if (camLetter !== activeCam) {
        udpPort.send({ address: `/cam/${camLetter}/${powerState}/select`, args: [camLetter] }, UE_OSC_HOST, UE_OSC_PORT);
    }

    for (const [key, value] of Object.entries(newState)) {
        const baseAddress = KEY_TO_OSC[key];
        if (!baseAddress) continue;

        // Skip boolean toggles unless they are active (1)
        if (BOOLEAN_KEYS.has(key) && value !== 1) continue;

        // Only send if the value has changed for THIS camera
        if (prevCamState[key] === value) continue;

        const dynamicAddress = baseAddress.replace('/cam/', `/cam/${camLetter}/${powerState}/`);
        udpPort.send({ address: dynamicAddress, args: [value] }, UE_OSC_HOST, UE_OSC_PORT);
    }

    // Update per-camera state
    for (const [key, value] of Object.entries(newState)) {
        if (key !== 'cam' && key !== 'tRate' && key !== 'masterRate') {
            prevCamState[key] = value;
        }
    }
    activeCam = camLetter;
}

// ── HTTP Server (legacy REST kept for side-by-side) ──────────────────

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    
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
                // Broadcast to all WS clients
                wss.clients.forEach(client => {
                    if (client.readyState === 1) { // WebSocket.OPEN
                        client.send(JSON.stringify({ type: 'ue_update', data: data }));
                    }
                });
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
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

// ── WebSocket ────────────────────────────────────────────────────────

const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
    const ip = req.socket.remoteAddress;
    console.log(`[+] Browser connected: ${ip}`);

    ws.on('message', (raw) => {
        try {
            const data = JSON.parse(raw);
            sendOSCFromState(data);
            latestRaw = data;
        } catch (e) {
            console.error('[!] Bad JSON from browser:', e.message);
        }
    });

    ws.on('close', () => console.log(`[-] Browser disconnected: ${ip}`));
});

// ── Start ────────────────────────────────────────────────────────────

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
