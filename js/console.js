import { camBtns, camMetas } from './dom.js';
import { logBuffer } from './state.js';
import { updateState } from './ui.js';

export function initConsole() {
    camBtns.forEach((btn, idx) => {
        btn.addEventListener('click', () => {
            camBtns.forEach((b, j) => { 
                b.classList.remove('lit-green'); 
                camMetas[j].classList.remove('active'); 
            });
            btn.classList.add('lit-green');
            camMetas[idx].classList.add('active');
            
            logBuffer.push(`ws.send: /cam/select [${btn.dataset.cam}]`);
            if (logBuffer.length > 4) logBuffer.shift();
            updateState();
        });
    });
}
