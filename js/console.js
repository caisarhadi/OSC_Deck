import { camBtns, camMetas, logToggle, logContent, oscLogPanel } from './dom.js';
import { logBuffer, globalState } from './state.js';
import { updateState } from './main.js';

export function initConsole() {
    camBtns.forEach((btn, idx) => {
        btn.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            camBtns.forEach((b, j) => { 
                b.classList.remove('lit-green'); 
                camMetas[j].classList.remove('active'); 
            });
            btn.classList.add('lit-green');
            camMetas[idx].classList.add('active');
            
            globalState.activeCam = btn.dataset.cam;
            globalState.ueTelemetry = {};  // Clear stale telemetry from previous camera
            globalState.activeLabel = 'SELECTED';
            globalState.activeValue = 'CAM ' + btn.dataset.cam;

            logBuffer.push(`ws.send: /cam/select [${btn.dataset.cam}]`);
            if (logBuffer.length > 4) logBuffer.shift();
            updateState();
        });
    });

    logToggle.addEventListener('click', () => {
        oscLogPanel.classList.toggle('collapsed');
        if (!oscLogPanel.classList.contains('collapsed')) {
            logContent.scrollTop = logContent.scrollHeight;
        }
    });
}
