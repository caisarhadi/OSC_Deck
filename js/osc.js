import { globalState, getActiveCamState, logBuffer } from './state.js';
import { logContent } from './dom.js';
import { fmtUnsigned } from './utils.js';

let lastSendTime = 0;

export function throttleOSC() {
    const now = Date.now();
    if (now - lastSendTime > 33) { // ~30fps 
        const s = getActiveCamState();
        const prefix = `/cam/${globalState.activeCam}`;
        
        const f = fmtUnsigned;
        // Multiply outputs by rates
        const tx = f(s.tx * s.k4 * s.k6);
        const ty = f(s.ty * s.k4 * s.k6);
        const tz = f(s.tz * s.k5 * s.k6);
        const ry = f(s.ry * s.k5 * s.k6);
        const rz = f(s.rz * s.k5 * s.k6);

        const msg = `ws.send: ${prefix}/5axis [${tx}, ${ty}, ${tz}, ${ry}, ${rz}] | ${prefix}/knobs [${f(s.k1)}, ${f(s.k2)}, ${f(s.k3)}, ${f(s.k4)}, ${f(s.k5)}, ${f(s.k6)}] | ${prefix}/sliders [${f(s.slider * s.k6)}, ${f(s.sliderV * s.k6)}, ${f(s.sliderV2 * s.k6)}, ${f(s.sliderV3 * s.k6)}]`;
        logBuffer.push(msg);
        if (logBuffer.length > 4) logBuffer.shift();
        
        logContent.innerHTML = logBuffer.map(l => `> ${l}`).join('<br>');
        logContent.scrollTop = logContent.scrollHeight;
        lastSendTime = now;
    }
}
