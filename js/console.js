import { camBtns, camMetas, logToggle } from './dom.js';
import { logBuffer, state } from './state.js';
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
            
            state.activeLabel = 'CAMERA';
            state.activeValue = 'CAM ' + btn.dataset.cam;

            logBuffer.push(`ws.send: /cam/select [${btn.dataset.cam}]`);
            if (logBuffer.length > 4) logBuffer.shift();
            updateState();
        });
    });

    logToggle.addEventListener('click', () => {
        const panel = document.getElementById('osc-log');
        panel.classList.toggle('collapsed');
        if (!panel.classList.contains('collapsed')) {
            const content = document.getElementById('log-content');
            content.scrollTop = content.scrollHeight;
        }
    });
}
