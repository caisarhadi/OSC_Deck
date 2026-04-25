import { globalState, getActiveCamState, logBuffer } from './state.js';
import { logContent } from './dom.js';
import { fmtUnsigned } from './utils.js';

let lastSendTime = 0;
let ws = null;
let wsReady = false;

// ─── WebSocket connection to OSC bridge ───────────
const WS_URL = 'ws://localhost:9000';

export function connectOSC() {
    if (ws && ws.readyState <= 1) return; // already open or connecting
    
    ws = new WebSocket(WS_URL);
    
    ws.onopen = () => {
        wsReady = true;
        console.log('[OSC] Connected to bridge at ' + WS_URL);
    };
    ws.onclose = () => {
        wsReady = false;
        console.log('[OSC] Disconnected — retrying in 3s…');
        setTimeout(connectOSC, 3000);
    };
    ws.onerror = () => { /* onclose will fire next */ };
    ws.onmessage = (e) => {
        // Incoming OSC from external (future: UE telemetry)
        console.log('[OSC←]', e.data);
    };
}

// ─── Send OSC at ~30fps ───────────────────────────
export function throttleOSC() {
    const now = Date.now();
    if (now - lastSendTime > 33) { // ~30fps 
        const s = getActiveCamState();
        const prefix = `/cam/${globalState.activeCam}`;
        
        const f = fmtUnsigned;
        // Multiply outputs by rates
        const tx = f(s.tx * s.k5 * s.k6);
        const ty = f(s.ty * s.k5 * s.k6);
        const rx = f(s.rx * s.k5 * s.k6);
        const ry = f(s.ry * s.k5 * s.k6);
        const rz = f(s.rz * s.k5 * s.k6);

        const af = s.afOn ? 1 : 0;

        // ── Send JSON via WebSocket bridge (for VaRest) ────
        if (wsReady) {
            const payload = {
                cam: globalState.activeCam,
                
                // Axis (Joystick)
                tx: +tx,
                ty: +ty,
                rx: +rx,
                ry: +ry,
                rz: +rz,
                custom: +f(s.slider * s.k6),
                
                // Knobs
                shutter: +f(s.k1),
                ei: +f(s.k2),
                nd: +f(s.k3),
                wb: +f(s.k4),
                tRate: +f(s.k5),
                masterRate: +f(s.k6),
                
                // Sliders
                fcl: +f(s.sliderV3 * s.k6),
                iris: +f(s.sliderV2 * s.k6),
                fcs: +f(s.sliderV * s.k6),
                
                // Toggles
                af: af
            };
            ws.send(JSON.stringify(payload));
        }

        // ── Console log (OLED display) ────────────
        const msg = `${prefix}/6axis [${tx}, ${ty}, ${rx}, ${ry}, ${rz}, ${f(s.slider * s.k6)}] | ${prefix}/knobs [${f(s.k1)}, ${f(s.k2)}, ${f(s.k3)}, ${f(s.k4)}, ${f(s.k5)}, ${f(s.k6)}] | ${prefix}/sliders [${f(s.sliderV3 * s.k6)}, ${f(s.sliderV2 * s.k6)}, ${f(s.sliderV * s.k6)}] | ${prefix}/af [${af}]`;
        logBuffer.push(msg);
        if (logBuffer.length > 4) logBuffer.shift();
        
        logContent.innerHTML = logBuffer.map(l => `> ${l}`).join('<br>');
        logContent.scrollTop = logContent.scrollHeight;
        lastSendTime = now;
    }
}
