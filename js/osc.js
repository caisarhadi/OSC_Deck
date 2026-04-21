import { globalState, getActiveCamState, logBuffer } from './state.js';
import { logContent } from './dom.js';

let lastSendTime = 0;

export function throttleOSC() {
    const now = Date.now();
    if (now - lastSendTime > 33) { // ~30fps 
        const s = getActiveCamState();
        const prefix = `/cam/${globalState.activeCam}`;
        const msg = `ws.send: ${prefix}/5axis [${s.tx.toFixed(2)}, ${s.ty.toFixed(2)}, ${s.tz.toFixed(2)}, ${s.ry.toFixed(2)}, ${s.rz.toFixed(2)}] | ${prefix}/knobs [${s.k1.toFixed(2)}, ${s.k2.toFixed(2)}, ${s.k3.toFixed(2)}] | ${prefix}/sliders [${s.slider.toFixed(2)}, ${s.sliderV.toFixed(2)}, ${s.sliderV2.toFixed(2)}, ${s.sliderV3.toFixed(2)}]`;
        logBuffer.push(msg);
        if (logBuffer.length > 4) logBuffer.shift();
        
        logContent.innerHTML = logBuffer.map(l => `> ${l}`).join('<br>');
        logContent.scrollTop = logContent.scrollHeight;
        lastSendTime = now;
    }
}
