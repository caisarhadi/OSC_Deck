/**
 * API Bridge Server
 * 
 * WebSocket server that receives JSON from the browser and
 * exposes it as a REST API endpoint for Unreal Engine (VaRest).
 * 
 * Usage:  node server/osc-bridge.js
 * 
 * Endpoints:
 *   ws://localhost:9000        Browser pushes state here
 *   http://localhost:9000/state  Unreal fetches state here
 */

const http = require('http');
const { WebSocketServer } = require('ws');

const PORT = 9000;

let latestState = {
    cam: 'A',
    tx: 0, ty: 0, rx: 0, ry: 0, rz: 0, custom: 0,
    shutter: 0, ei: 0, nd: 0, wb: 0, tRate: 1, masterRate: 1,
    fcl: 0, iris: 0, fcs: 0,
    af: 0, reset: 0
};

const server = http.createServer((req, res) => {
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

const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
    const ip = req.socket.remoteAddress;
    console.log(`[+] Browser connected: ${ip}`);

    ws.on('message', (raw) => {
        try {
            const data = JSON.parse(raw);
            latestState = data;
        } catch (e) {
            console.error('[!] Bad JSON from browser:', e.message);
        }
    });

    ws.on('close', () => console.log(`[-] Browser disconnected: ${ip}`));
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n  ┌──────────────────────────────────────────┐`);
    console.log(`  │  API Bridge Server                       │`);
    console.log(`  ├──────────────────────────────────────────┤`);
    console.log(`  │  WebSocket : ws://0.0.0.0:${PORT}           │`);
    console.log(`  │  REST API  : http://0.0.0.0:${PORT}/state     │`);
    console.log(`  └──────────────────────────────────────────┘\n`);
});
