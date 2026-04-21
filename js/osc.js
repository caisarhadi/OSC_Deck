import { state, logBuffer } from './state.js';
import { oscLog } from './dom.js';

let lastSendTime = 0;

export function throttleOSC() {
    const now = Date.now();
    if (now - lastSendTime > 33) { // ~30fps 
        const msg = `ws.send: /5axis [${state.tx.toFixed(2)}, ${state.ty.toFixed(2)}, ${state.tz.toFixed(2)}, ${state.ry.toFixed(2)}, ${state.rz.toFixed(2)}] | /knobs [${state.k1.toFixed(2)}, ${state.k2.toFixed(2)}, ${state.k3.toFixed(2)}] | /slider ${state.slider.toFixed(2)}`;
        logBuffer.push(msg);
        if (logBuffer.length > 4) logBuffer.shift();
        
        oscLog.innerHTML = `<span class="log-title"># WEBSOCKET OSC BRIDGE PAYLOAD</span><br>` + 
                           logBuffer.map(l => `> ${l}`).join('<br>');
        oscLog.scrollTop = oscLog.scrollHeight;
        lastSendTime = now;
    }
}
