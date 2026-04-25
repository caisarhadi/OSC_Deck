import { globalState, getActiveCamState, logBuffer } from './state.js';
import { logContent } from './dom.js';
import { fmtUnsigned } from './utils.js';

let ws = null;
let wsReady = false;

// ─── WebSocket connection to OSC bridge ───────────
const WS_URL = `ws://${window.location.hostname}:9000`;

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

// ─── Send OSC ───────────────────────────
export function sendOSC() {
    const s = getActiveCamState();
    const prefix = `/cam/${globalState.activeCam}`;
    
    const f = fmtUnsigned;
        // Multiply outputs by rates
        const tx = f(s.tx * s.k5 * s.k6);
        const ty = f(s.ty * s.k5 * s.k6);
        const rx = f(s.rx * s.k6);
        const ry = f(s.ry * s.k6);
        const rz = f(s.rz * s.k6);
        const custom = f(s.slider * s.k5 * s.k6);

        const af = s.afOn ? 1 : 0;
        const resetToggle = s.resetOn ? 1 : 0;

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
                custom: +custom,
                
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
                af: af,
                reset: resetToggle
            };
            ws.send(JSON.stringify(payload));
        }

        // ── Console log (OLED display) ────────────
        const msg = `${prefix}/6axis [${tx}, ${ty}, ${rx}, ${ry}, ${rz}, ${custom}] | ${prefix}/knobs [${f(s.k1)}, ${f(s.k2)}, ${f(s.k3)}, ${f(s.k4)}, ${f(s.k5)}, ${f(s.k6)}] | ${prefix}/sliders [${f(s.sliderV3 * s.k6)}, ${f(s.sliderV2 * s.k6)}, ${f(s.sliderV * s.k6)}] | ${prefix}/toggles [AF:${af} RESET:${resetToggle}]`;
        logBuffer.push(msg);
        if (logBuffer.length > 4) logBuffer.shift();
        
        logContent.innerHTML = logBuffer.map(l => `> ${l}`).join('<br>');
        logContent.scrollTop = logContent.scrollHeight;
}
