import { globalState, getActiveCamState, logBuffer } from './state.js';
import { logContent } from './dom.js';
import { fmtUnsigned } from './utils.js';

let ws = null;
let wsReady = false;

const WS_URL = `ws://${window.location.hostname}:9000`;

export function connectOSC() {
    if (ws && ws.readyState <= 1) return;
    
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
    ws.onerror = () => {};
    ws.onmessage = (e) => {
        console.log('[OSC←]', e.data);
    };
}

export function sendOSC() {
    const s = getActiveCamState();
    const prefix = `/cam/${globalState.activeCam}`;
    
    const f = fmtUnsigned;
        const tx = f(s.tx * s.k5 * s.k6);
        const ty = f(s.ty * s.k5 * s.k6);
        const rx = f(s.rx * s.k6);
        const ry = f(s.ry * s.k6);
        const rz = f(s.rz * s.k6);
        const custom = f(s.slider * s.k5 * s.k6);

        const af = s.afOn ? 1 : 0;
        const resetToggle = s.resetOn ? 1 : 0;

        if (wsReady) {
            const payload = {
                cam: globalState.activeCam,
                power: globalState.powerOn ? 1 : 0,
                tx: +tx,
                ty: +ty,
                rx: +rx,
                ry: +ry,
                rz: +rz,
                custom: +custom,

                shutter: +f(s.k1),
                ei: +f(s.k2),
                nd: +f(s.k3),
                wb: +f(s.k4),
                tRate: +f(s.k5),
                masterRate: +f(s.k6),

                fcl: +f(s.sliderV3 * s.k6),
                iris: +f(s.sliderV2 * s.k6),
                fcs: +f(s.sliderV * s.k6),

                resetFcl: s.resetFcl ? 1 : 0,
                resetIris: s.resetIris ? 1 : 0,
                resetFcs: s.resetFcs ? 1 : 0,

                resetShutter: s.resetShutter ? 1 : 0,
                resetEi: s.resetEi ? 1 : 0,
                resetNd: s.resetNd ? 1 : 0,
                resetWb: s.resetWb ? 1 : 0,

                af: af,
                reset: resetToggle
            };
            ws.send(JSON.stringify(payload));
        }

        const msg = `${prefix}/6axis [${tx}, ${ty}, ${rx}, ${ry}, ${rz}, ${custom}] | ${prefix}/knobs [${f(s.k1)}, ${f(s.k2)}, ${f(s.k3)}, ${f(s.k4)}, ${f(s.k5)}, ${f(s.k6)}] | ${prefix}/sliders [${f(s.sliderV3 * s.k6)}, ${f(s.sliderV2 * s.k6)}, ${f(s.sliderV * s.k6)}] | ${prefix}/toggles [AF:${af} RESET:${resetToggle} POWER:${globalState.powerOn ? 1 : 0} FCL-R:${s.resetFcl ? 1 : 0} IRIS-R:${s.resetIris ? 1 : 0} FCS-R:${s.resetFcs ? 1 : 0} SHT-R:${s.resetShutter ? 1 : 0} EI-R:${s.resetEi ? 1 : 0} ND-R:${s.resetNd ? 1 : 0} WB-R:${s.resetWb ? 1 : 0}]`;
        logBuffer.push(msg);
        if (logBuffer.length > 4) logBuffer.shift();
        
        logContent.innerHTML = logBuffer.map(l => `> ${l}`).join('<br>');
        logContent.scrollTop = logContent.scrollHeight;
}
