import { getActiveCamState, globalState, activePointers, PIXELS_TO_MAX } from './state.js';
import { innerPuck, outerRing, yawRing, panBoundary, outerIndicator, spaceContainer, knobs, slider, slidersV, resetBtn } from './dom.js';
import { clamp } from './utils.js';
import { updateState } from './ui.js';

export function initInput() {
    // --- Reset Button ---
    resetBtn.addEventListener('click', () => {
        const s = getActiveCamState();
        s.ty = 0;
        s.rz = 0;
        globalState.activeLabel = 'PITCH / YAW';
        globalState.activeValue = '0.00 / 0.00';
        updateState();
    });

    // --- Knob Event Listeners ---
    knobs.forEach((k, idx) => {
        k.wrap.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            k.wrap.setPointerCapture(e.pointerId);
            k.wrap.classList.add('active');
            
            const startVal = getActiveCamState()[`k${idx+1}`];
            activePointers.set(e.pointerId, { 
                zone: 'knob', 
                index: idx,
                startY: e.clientY,
                startValue: startVal
            });
            const labels = ['ISO', 'SHUTTER', 'WHITE BALANCE'];
            globalState.activeLabel = labels[idx];
            globalState.activeValue = startVal.toFixed(2);
            updateState();
        });
    });

    // --- Slider Event Listener ---
    slider.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        slider.setPointerCapture(e.pointerId);
        slider.classList.add('active');
            const startVal = getActiveCamState().slider;
            activePointers.set(e.pointerId, { 
                zone: 'slider', 
                startX: e.clientX, 
                startValue: startVal
            });
            globalState.activeLabel = 'SLIDER H';
            globalState.activeValue = startVal.toFixed(2);
            updateState();
    });

    slidersV.forEach((sv, idx) => {
        if (!sv.wrap) return;
        sv.wrap.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            sv.wrap.setPointerCapture(e.pointerId);
            sv.wrap.classList.add('active');
            
            const stateKeys = ['sliderV', 'sliderV2', 'sliderV3'];
            const labels = ['FOCUS', 'IRIS', 'ZOOM'];
            const startVal = getActiveCamState()[stateKeys[idx]];
            
            activePointers.set(e.pointerId, { 
                zone: 'sliderV', 
                index: idx,
                startY: e.clientY, 
                startValue: startVal
            });
            globalState.activeLabel = labels[idx];
            globalState.activeValue = startVal.toFixed(2);
            updateState();
        });
    });

    // --- Pointer Event Listeners ---
    innerPuck.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        innerPuck.setPointerCapture(e.pointerId);
        innerPuck.classList.add('active');
        panBoundary.classList.add('active');
        activePointers.set(e.pointerId, { zone: 'inner', startX: e.clientX, startY: e.clientY });
        const s = getActiveCamState();
        globalState.activeLabel = 'INNER PUCK';
        globalState.activeValue = `X:${(s.tx >= 0 ? '+' : '')}${s.tx.toFixed(2)} Y:${(s.ty >= 0 ? '+' : '')}${s.ty.toFixed(2)}`;
        updateState();
    });

    outerRing.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        outerRing.setPointerCapture(e.pointerId);
        outerRing.classList.add('active');
        
        // Calculate snap indicator position
        const rect = outerRing.getBoundingClientRect();
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        const touchX = e.clientX - rect.left;
        const touchY = e.clientY - rect.top;
        const angle = Math.atan2(touchY - cy, touchX - cx);
        
        if (Math.abs(angle) < Math.PI/4) { outerIndicator.style.left = '100%'; outerIndicator.style.top = '50%'; }
        else if (angle >= Math.PI/4 && angle < 3*Math.PI/4) { outerIndicator.style.left = '50%'; outerIndicator.style.top = '100%'; }
        else if (Math.abs(angle) >= 3*Math.PI/4) { outerIndicator.style.left = '0%'; outerIndicator.style.top = '50%'; }
        else { outerIndicator.style.left = '50%'; outerIndicator.style.top = '0%'; }

        activePointers.set(e.pointerId, { zone: 'outer', startX: e.clientX, startY: e.clientY, lockedAxis: null });
        const s = getActiveCamState();
        globalState.activeLabel = 'OUTER RING';
        globalState.activeValue = `Z:${(s.tz >= 0 ? '+' : '')}${s.tz.toFixed(2)} R:${(s.ry >= 0 ? '+' : '')}${s.ry.toFixed(2)}`;
        updateState();
    });

    yawRing.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        yawRing.setPointerCapture(e.pointerId);
        yawRing.classList.add('active');
        
        const rect = spaceContainer.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const startAngle = Math.atan2(e.clientY - cy, e.clientX - cx);
        const s = getActiveCamState();
        activePointers.set(e.pointerId, { zone: 'yaw', cx, cy, startAngle, baseRz: s.rz });
        globalState.activeLabel = 'YAW RING';
        globalState.activeValue = `YAW:${(s.rz >= 0 ? '+' : '')}${s.rz.toFixed(2)}`;
        updateState();
    });

    window.addEventListener('pointermove', (e) => {
        if (!activePointers.has(e.pointerId)) return;
        const p = activePointers.get(e.pointerId);
        
        const s = getActiveCamState();
        if (p.zone === 'inner') {
            const deltaX = e.clientX - p.startX;
            const deltaY = e.clientY - p.startY;
            const rawTx = deltaX / PIXELS_TO_MAX;
            const rawTy = -deltaY / PIXELS_TO_MAX;
            const AXIS_DEADZONE = 0.12;
            
            const applyFluidDeadzone = (val) => {
                const absVal = Math.abs(val);
                if (absVal < AXIS_DEADZONE) return 0;
                return Math.sign(val) * ((absVal - AXIS_DEADZONE) / (1 - AXIS_DEADZONE));
            };

            let cleanTx = applyFluidDeadzone(rawTx);
            let cleanTy = applyFluidDeadzone(rawTy);
            const mag = Math.sqrt(cleanTx**2 + cleanTy**2);
            s.tx = mag > 1 ? cleanTx / mag : cleanTx;
            s.ty = mag > 1 ? cleanTy / mag : cleanTy;
            globalState.activeLabel = 'INNER PUCK';
            globalState.activeValue = `X:${(s.tx >= 0 ? '+' : '')}${s.tx.toFixed(2)} Y:${(s.ty >= 0 ? '+' : '')}${s.ty.toFixed(2)}`;
        } 
        else if (p.zone === 'outer') {
            const dX = e.clientX - p.startX;
            const dY = e.clientY - p.startY;
            if (!p.lockedAxis) {
                if (Math.abs(dX) > 10) p.lockedAxis = 'roll';
                else if (Math.abs(dY) > 10) p.lockedAxis = 'heave';
            }
            if (p.lockedAxis === 'roll') { s.ry = clamp(dX / PIXELS_TO_MAX, -1, 1); s.tz = 0; }
            else if (p.lockedAxis === 'heave') { s.tz = clamp(-dY / PIXELS_TO_MAX, -1, 1); s.ry = 0; }
            globalState.activeLabel = 'OUTER RING';
            globalState.activeValue = `Z:${(s.tz >= 0 ? '+' : '')}${s.tz.toFixed(2)} R:${(s.ry >= 0 ? '+' : '')}${s.ry.toFixed(2)}`;
        }
        else if (p.zone === 'yaw') {
            const currentAngle = Math.atan2(e.clientY - p.cy, e.clientX - p.cx);
            let deltaAngle = currentAngle - p.startAngle;
            if (deltaAngle > Math.PI) deltaAngle -= 2 * Math.PI;
            if (deltaAngle < -Math.PI) deltaAngle += 2 * Math.PI;
            s.rz = clamp(p.baseRz + (deltaAngle / Math.PI), -1, 1);
            globalState.activeLabel = 'YAW RING';
            globalState.activeValue = `YAW:${(s.rz >= 0 ? '+' : '')}${s.rz.toFixed(2)}`;
        }
        else if (p.zone === 'knob') {
            const dY = e.clientY - p.startY;
            const deltaValue = -dY / PIXELS_TO_MAX;
            const newValue = clamp(p.startValue + deltaValue, -1, 1);
            s[`k${p.index+1}`] = newValue;
            const labels = ['ISO', 'SHUTTER', 'WHITE BALANCE'];
            globalState.activeLabel = labels[p.index];
            globalState.activeValue = newValue.toFixed(2);
        }
        else if (p.zone === 'slider') {
            const dX = e.clientX - p.startX;
            const deltaValue = dX / PIXELS_TO_MAX;
            s.slider = clamp(p.startValue + deltaValue, -1, 1);
            globalState.activeLabel = 'SLIDER H';
            globalState.activeValue = s.slider.toFixed(2);
        }
        else if (p.zone === 'sliderV') {
            const dY = e.clientY - p.startY;
            const deltaValue = -dY / PIXELS_TO_MAX;
            const stateKeys = ['sliderV', 'sliderV2', 'sliderV3'];
            const labels = ['FOCUS', 'IRIS', 'ZOOM'];
            const key = stateKeys[p.index];
            s[key] = clamp(p.startValue + deltaValue, -1, 1);
            globalState.activeLabel = labels[p.index];
            globalState.activeValue = s[key].toFixed(2);
        }
        updateState();
    });

    const handleRelease = (e) => {
        if (!activePointers.has(e.pointerId)) return;
        const p = activePointers.get(e.pointerId);
        const s = getActiveCamState();
        if (p.zone === 'inner') { s.tx = 0; s.ty = 0; innerPuck.classList.remove('active'); panBoundary.classList.remove('active'); }
        else if (p.zone === 'outer') { s.tz = 0; s.ry = 0; outerRing.classList.remove('active'); }
        else if (p.zone === 'yaw') { s.rz = 0; yawRing.classList.remove('active'); }
        else if (p.zone === 'knob') { knobs[p.index].wrap.classList.remove('active'); }
        else if (p.zone === 'slider') { slider.classList.remove('active'); }
        else if (p.zone === 'sliderV') { slidersV[p.index].wrap.classList.remove('active'); }
        activePointers.delete(e.pointerId);
        updateState();
    };

    window.addEventListener('pointerup', handleRelease);
    window.addEventListener('pointercancel', handleRelease);
}
