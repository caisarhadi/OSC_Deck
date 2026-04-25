/**
 * API Server
 * 
 * WebSocket server that receives JSON from the browser and
 * exposes it as a REST API endpoint for Unreal Engine (VaRest).
 * 
 * Usage:
 *   node server/osc-bridge.js
 * 
 * Endpoints:
 *   GET ws://localhost:9000      (Browser pushes state here)
 *   GET http://localhost:9000/state (Unreal fetches state here)
 */

const http = require('http');
const { WebSocketServer } = require('ws');

const PORT = 9000;

// Global state buffer (defaults)
let latestState = {
    prefix: '/cam/A',
    axis: [0, 0, 0, 0, 0],
    knobs: [0, 0, 0, 0, 0, 0],
    sliders: [0, 0, 0, 0],
    af: 0
};

// ─── HTTP Server for Unreal Engine (VaRest) ───────
const server = http.createServer((req, res) => {
    // Add CORS headers so we can query from anywhere
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.method === 'GET' && req.url === '/state') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify([latestState]));
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

// ─── WebSocket Server for Browser UI ──────────────
const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
    const ip = req.socket.remoteAddress;
    console.log(`[+] Browser connected: ${ip}`);

    ws.on('message', (raw) => {
        try {
            // Browser pushed new state, update the global buffer
            const data = JSON.parse(raw);
            latestState = data;
        } catch (e) {
            console.error('[!] Bad JSON from browser:', e.message);
        }
    });

    ws.on('close', () => console.log(`[-] Browser disconnected: ${ip}`));
});

// Start the dual server
server.listen(PORT, () => {
    console.log(`\n  ┌──────────────────────────────────────────┐`);
    console.log(`  │  API Bridge Server                       │`);
    console.log(`  ├──────────────────────────────────────────┤`);
    console.log(`  │  WebSocket : ws://localhost:${PORT}         │`);
    console.log(`  │  REST API  : http://localhost:${PORT}/state   │`);
    console.log(`  └──────────────────────────────────────────┘\n`);
});
