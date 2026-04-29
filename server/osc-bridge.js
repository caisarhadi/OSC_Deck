/**
 * OSC Bridge Server
 * Bridges JSON WebSocket traffic to OSC/UDP for Unreal Engine.
 * Ports: 9000 (WS), 9001 (UDP Send), 9002 (UDP Listen)
 */

const http = require('http');
const { WebSocketServer } = require('ws');
const osc = require('osc');

// ── Config ──────────────────────────────────────────────────────────

const PORT = 9000;
const UE_OSC_HOST = '127.0.0.1';
const UE_OSC_PORT = 9001;
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

const TELEMETRY_KEYS = new Set(['shutter', 'ei', 'nd', 'wb', 'fcl', 'iris', 'fcs']);

const VALID_CAMS = new Set(['A', 'B', 'C', 'D']);

// ── Rate multiplier map ─────────────────────────────────────────────

const RATE_MULTIPLIERS = {
    tx: ['tRate', 'masterRate'],
    ty: ['tRate', 'masterRate'],
    custom: ['tRate', 'masterRate'],
    rx: ['masterRate'],
    ry: ['masterRate'],
    rz: ['masterRate'],
    fcl: ['masterRate'],
    iris: ['masterRate'],
    fcs: ['masterRate'],
};

// ── Per-camera state ────────────────────────────────────────────────

const camStates = { A: null, B: null, C: null, D: null };
let activeCam = 'A';
let currentRates = { tRate: 1, masterRate: 1 };

// ── HTTP server (WebSocket upgrade only) ────────────────────────────

const server = http.createServer((req, res) => {
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
    const args = oscMsg.args || [];
    const parts = oscMsg.address.split('/');
    if (parts.length !== 4 || parts[1] !== 'telemetry') return;
    const cam = parts[2];
    const key = parts[3];
    if (!TELEMETRY_KEYS.has(key)) return;

    // UE's OSCMessage may accumulate floats, take the last arg
    const value = args.length > 0 ? args[args.length - 1] : 0;
    console.log(`[+] OSC from UE: ${oscMsg.address} = ${value}`);

    if (cam !== activeCam) return;

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

    if (!VALID_CAMS.has(camLetter)) return;

    if (newState.tRate !== undefined) currentRates.tRate = newState.tRate;
    if (newState.masterRate !== undefined) currentRates.masterRate = newState.masterRate;

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
        udpPort.send({ address, args: [applyRateMultipliers(key, value)] }, UE_OSC_HOST, UE_OSC_PORT);
    }

    for (const [key, value] of Object.entries(newState)) {
        if (!NON_OSC_KEYS.has(key)) {
            prev[key] = value;
        }
    }
    activeCam = camLetter;
}

// ── Helpers ─────────────────────────────────────────────────────────

function applyRateMultipliers(key, value) {
    if (!RATE_MULTIPLIERS[key]) return value;
    let result = value;
    for (const rateKey of RATE_MULTIPLIERS[key]) {
        result *= currentRates[rateKey];
    }
    return result;
}

function broadcastToClients(payload) {
    const json = JSON.stringify(payload);
    wss.clients.forEach(client => {
        if (client.readyState === 1) client.send(json);
    });
}

// ── Start ───────────────────────────────────────────────────────────

server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n  ┌──────────────────────────────────────────┐`);
    console.log(`  │  OSC Bridge Server                       │`);
    console.log(`  ├──────────────────────────────────────────┤`);
    console.log(`  │  WebSocket : ws://0.0.0.0:${PORT}           │`);
    console.log(`  │  OSC Send  : ${UE_OSC_HOST}:${UE_OSC_PORT}            │`);
    console.log(`  │  OSC Listen: 0.0.0.0:${LOCAL_OSC_PORT}              │`);
    console.log(`  └──────────────────────────────────────────┘\n`);
});
