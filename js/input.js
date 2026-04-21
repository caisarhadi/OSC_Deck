import { state, activePointers, PIXELS_TO_MAX } from './state.js';
import { innerPuck, outerRing, yawRing, panBoundary, outerIndicator, spaceContainer, knobs, slider } from './dom.js';
import { clamp } from './utils.js';
import { updateState } from './ui.js';

export function initInput() {
    // --- Knob Event Listeners ---
    knobs.forEach((k, idx) => {
        k.wrap.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            k.wrap.setPointerCapture(e.pointerId);
            k.wrap.classList.add('active');
            
            activePointers.set(e.pointerId, { 
                zone: 'knob', 
                index: idx,
                startY: e.clientY,
                startValue: state[`k${idx+1}`]
            });
        });
    });

    // --- Slider Event Listener ---
    slider.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        slider.setPointerCapture(e.pointerId);
        slider.classList.add('active');
        activePointers.set(e.pointerId, { 
            zone: 'slider', 
            startX: e.clientX, 
            startValue: state.slider
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
        activePointers.set(e.pointerId, { zone: 'yaw', cx, cy, startAngle, baseRz: state.rz });
    });

    window.addEventListener('pointermove', (e) => {
        if (!activePointers.has(e.pointerId)) return;
        const p = activePointers.get(e.pointerId);
        
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
            state.tx = mag > 1 ? cleanTx / mag : cleanTx;
            state.ty = mag > 1 ? cleanTy / mag : cleanTy;
        } 
        else if (p.zone === 'outer') {
            const dX = e.clientX - p.startX;
            const dY = e.clientY - p.startY;
            if (!p.lockedAxis) {
                if (Math.abs(dX) > 10) p.lockedAxis = 'roll';
                else if (Math.abs(dY) > 10) p.lockedAxis = 'heave';
            }
            if (p.lockedAxis === 'roll') { state.ry = clamp(dX / PIXELS_TO_MAX, -1, 1); state.tz = 0; }
            else if (p.lockedAxis === 'heave') { state.tz = clamp(-dY / PIXELS_TO_MAX, -1, 1); state.ry = 0; }
        }
        else if (p.zone === 'yaw') {
            const currentAngle = Math.atan2(e.clientY - p.cy, e.clientX - p.cx);
            let deltaAngle = currentAngle - p.startAngle;
            if (deltaAngle > Math.PI) deltaAngle -= 2 * Math.PI;
            if (deltaAngle < -Math.PI) deltaAngle += 2 * Math.PI;
            state.rz = clamp(p.baseRz + (deltaAngle / Math.PI), -1, 1);
        }
        else if (p.zone === 'knob') {
            const dY = e.clientY - p.startY;
            const deltaValue = -dY / 360;
            const newValue = p.startValue + deltaValue;
            state[`k${p.index+1}`] = newValue;
        }
        else if (p.zone === 'slider') {
            const dX = e.clientX - p.startX;
            const deltaValue = dX / PIXELS_TO_MAX;
            state.slider = p.startValue + deltaValue; // Infinite like knobs
        }
        updateState();
    });

    const handleRelease = (e) => {
        if (!activePointers.has(e.pointerId)) return;
        const p = activePointers.get(e.pointerId);
        if (p.zone === 'inner') { state.tx = 0; state.ty = 0; innerPuck.classList.remove('active'); panBoundary.classList.remove('active'); }
        else if (p.zone === 'outer') { state.tz = 0; state.ry = 0; outerRing.classList.remove('active'); }
        else if (p.zone === 'yaw') { state.rz = 0; yawRing.classList.remove('active'); }
        else if (p.zone === 'knob') { knobs[p.index].wrap.classList.remove('active'); }
        else if (p.zone === 'slider') { slider.classList.remove('active'); }
        activePointers.delete(e.pointerId);
        updateState();
    };

    window.addEventListener('pointerup', handleRelease);
    window.addEventListener('pointercancel', handleRelease);
}
