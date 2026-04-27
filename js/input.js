import { getActiveCamState, globalState, activePointers, PIXELS_TO_MAX, SLIDER_PIXELS_TO_MAX, KNOB_CONFIGS, SLIDER_V_CONFIGS } from './state.js';
import { innerPuck, outerRing, yawRing, panBoundary, outerIndicator, spaceContainer, knobs, slider, slidersV, resetBtn, afToggle, powerToggle } from './dom.js';
import { clamp, fmt, fmtUnsigned, applyDeadzone } from './utils.js';
import { updateState } from './ui.js';

export function initInput() {
    resetBtn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const s = getActiveCamState();
        s.ty = 0;
        s.ry = 0;
        s.rz = 0;
        s.resetOn = true;
        resetBtn.classList.add('is-active');
        globalState.activeLabel = 'ROTATION';
        globalState.activeValue = '0.00';
        updateState();
    });

    const handleResetRelease = () => {
        const s = getActiveCamState();
        if (!s.resetOn) return;
        s.resetOn = false;
        resetBtn.classList.remove('is-active');
        updateState();
    };

    resetBtn.addEventListener('pointerup', handleResetRelease);
    resetBtn.addEventListener('pointercancel', handleResetRelease);
    resetBtn.addEventListener('pointerleave', handleResetRelease);

    afToggle.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const s = getActiveCamState();
        s.afOn = !s.afOn;
        if (s.afOn) {
            afToggle.classList.add('is-active');
        } else {
            afToggle.classList.remove('is-active');
        }
        globalState.activeLabel = 'AUTOFOCUS';
        globalState.activeValue = s.afOn ? 'ON' : 'OFF';
        updateState();
    });

    if (powerToggle) {
        powerToggle.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            globalState.powerOn = !globalState.powerOn;
            globalState.activeLabel = 'POWER';
            globalState.activeValue = globalState.powerOn ? 'ON' : 'OFF';
            updateState();
        });
    }

    knobs.forEach((k, idx) => {
        const config = KNOB_CONFIGS[idx];
        if (k.reset) {
            const handleKnobResetPress = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const s = getActiveCamState();
                const defaultVal = (idx === 0) ? 0.6 : (idx === 3 ? 0.4 : (idx >= 4 ? 1 : 0));
                s[config.key] = defaultVal;
                if (config.resetKey) s[config.resetKey] = true;
                k.reset.classList.add('is-active');

                globalState.activeLabel = config.label;
                globalState.activeValue = defaultVal.toFixed(2);
                updateState();
            };

            const handleKnobResetRelease = () => {
                const s = getActiveCamState();
                if (config.resetKey && !s[config.resetKey]) return;
                if (config.resetKey) s[config.resetKey] = false;
                k.reset.classList.remove('is-active');
                updateState();
            };

            k.reset.addEventListener('pointerdown', handleKnobResetPress);
            k.reset.addEventListener('pointerup', handleKnobResetRelease);
            k.reset.addEventListener('pointercancel', handleKnobResetRelease);
            k.reset.addEventListener('pointerleave', handleKnobResetRelease);
        }

        k.wrap.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            k.wrap.setPointerCapture(e.pointerId);
            k.wrap.classList.add('active');

            const dial = k.wrap.querySelector('.knob-dial') || k.wrap;
            const rect = dial.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const startAngle = Math.atan2(e.clientY - cy, e.clientX - cx);

            const startVal = getActiveCamState()[config.key];
            activePointers.set(e.pointerId, {
                zone: 'knob',
                index: idx,
                cx, cy,
                prevAngle: startAngle,
                currentValue: startVal
            });
            globalState.activeLabel = config.label;
            globalState.activeValue = globalState.ueTelemetry[config.label] ?? fmtUnsigned(startVal);
            updateState();
        });
    });

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
        globalState.activeLabel = 'CUSTOM';
        globalState.activeValue = fmtUnsigned(startVal * getActiveCamState().k6);
        updateState();
    });

    slidersV.forEach((sv, idx) => {
        const config = SLIDER_V_CONFIGS[idx];
        if (!sv.wrap) return;
        sv.wrap.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            sv.wrap.setPointerCapture(e.pointerId);
            sv.wrap.classList.add('active');

            const startVal = getActiveCamState()[config.key];

            activePointers.set(e.pointerId, {
                zone: 'sliderV',
                index: idx,
                startY: e.clientY,
                startValue: startVal
            });
            globalState.activeLabel = config.label;
            globalState.activeValue = globalState.ueTelemetry[config.label] ?? fmtUnsigned(startVal * getActiveCamState().k6);
            updateState();
        });

        if (sv.reset) {
            const handleSliderResetPress = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const s = getActiveCamState();
                const defaultVal = config.zeroToOne ? 0.5 : 0;
                s[config.key] = defaultVal;
                if (config.resetKey) s[config.resetKey] = true;
                sv.reset.classList.add('is-active');
                globalState.activeLabel = config.label;
                globalState.activeValue = globalState.ueTelemetry[config.label] ?? defaultVal.toFixed(2);
                updateState();
            };

            const handleSliderResetRelease = () => {
                const s = getActiveCamState();
                if (config.resetKey && !s[config.resetKey]) return;
                if (config.resetKey) s[config.resetKey] = false;
                sv.reset.classList.remove('is-active');
                updateState();
            };

            sv.reset.addEventListener('pointerdown', handleSliderResetPress);
            sv.reset.addEventListener('pointerup', handleSliderResetRelease);
            sv.reset.addEventListener('pointercancel', handleSliderResetRelease);
            sv.reset.addEventListener('pointerleave', handleSliderResetRelease);
        }
    });

    innerPuck.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        innerPuck.setPointerCapture(e.pointerId);
        innerPuck.classList.add('active');
        panBoundary.classList.add('active');
        activePointers.set(e.pointerId, { zone: 'inner', startX: e.clientX, startY: e.clientY });
        const s = getActiveCamState();
        globalState.activeLabel = 'PAN / TILT';
        globalState.activeValue = `X:${fmt(s.tx * s.k5 * s.k6)} Y:${fmt(s.ty * s.k5 * s.k6)}`;
        updateState();
    });

    outerRing.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        outerRing.setPointerCapture(e.pointerId);
        outerRing.classList.add('active');

        const rect = outerRing.getBoundingClientRect();
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        const touchX = e.clientX - rect.left;
        const touchY = e.clientY - rect.top;
        const angle = Math.atan2(touchY - cy, touchX - cx);

        if (Math.abs(angle) < Math.PI / 4) { outerIndicator.style.left = '100%'; outerIndicator.style.top = '50%'; }
        else if (angle >= Math.PI / 4 && angle < 3 * Math.PI / 4) { outerIndicator.style.left = '50%'; outerIndicator.style.top = '100%'; }
        else if (Math.abs(angle) >= 3 * Math.PI / 4) { outerIndicator.style.left = '0%'; outerIndicator.style.top = '50%'; }
        else { outerIndicator.style.left = '50%'; outerIndicator.style.top = '0%'; }

        activePointers.set(e.pointerId, { zone: 'outer', startX: e.clientX, startY: e.clientY, lockedAxis: null });
        const s = getActiveCamState();
        globalState.activeLabel = 'PITCH / ROLL';
        globalState.activeValue = `P:${fmt(s.rx * s.k5 * s.k6)} R:${fmt(s.ry * s.k5 * s.k6)}`;
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
        globalState.activeLabel = 'YAW';
        globalState.activeValue = `YAW:${fmt(s.rz * s.k5 * s.k6)}`;
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

            let cleanTx = applyDeadzone(rawTx, AXIS_DEADZONE);
            let cleanTy = applyDeadzone(rawTy, AXIS_DEADZONE);
            const mag = Math.sqrt(cleanTx ** 2 + cleanTy ** 2);
            s.tx = mag > 1 ? cleanTx / mag : cleanTx;
            s.ty = mag > 1 ? cleanTy / mag : cleanTy;
            globalState.activeLabel = 'PAN / TILT';
            globalState.activeValue = `X:${fmt(s.tx * s.k5 * s.k6)} Y:${fmt(s.ty * s.k5 * s.k6)}`;
        }
        else if (p.zone === 'outer') {
            const dX = e.clientX - p.startX;
            const dY = e.clientY - p.startY;
            if (!p.lockedAxis) {
                if (Math.abs(dX) > 10) p.lockedAxis = 'roll';
                else if (Math.abs(dY) > 10) p.lockedAxis = 'pitch';
            }
            if (p.lockedAxis === 'roll') { s.ry = clamp(dX / PIXELS_TO_MAX, -1, 1); s.rx = 0; }
            else if (p.lockedAxis === 'pitch') { s.rx = clamp(-dY / PIXELS_TO_MAX, -1, 1); s.ry = 0; }
            globalState.activeLabel = 'PITCH / ROLL';
            globalState.activeValue = `P:${fmt(s.rx * s.k5 * s.k6)} R:${fmt(s.ry * s.k5 * s.k6)}`;
        }
        else if (p.zone === 'yaw') {
            const currentAngle = Math.atan2(e.clientY - p.cy, e.clientX - p.cx);
            let deltaAngle = currentAngle - p.startAngle;
            if (deltaAngle > Math.PI) deltaAngle -= 2 * Math.PI;
            if (deltaAngle < -Math.PI) deltaAngle += 2 * Math.PI;
            s.rz = clamp(p.baseRz + (deltaAngle / Math.PI), -1, 1);
            globalState.activeLabel = 'YAW';
            globalState.activeValue = `YAW:${fmt(s.rz * s.k5 * s.k6)}`;
        }
        else if (p.zone === 'knob') {
            const currentAngle = Math.atan2(e.clientY - p.cy, e.clientX - p.cx);
            let frameDelta = currentAngle - p.prevAngle;
            if (frameDelta > Math.PI) frameDelta -= 2 * Math.PI;
            if (frameDelta < -Math.PI) frameDelta += 2 * Math.PI;
            p.prevAngle = currentAngle;
            const config = KNOB_CONFIGS[p.index];
            if (config.zeroToOne) {
                p.currentValue = clamp(p.currentValue + (frameDelta / (2 * Math.PI)), 0, 1);
            } else {
                p.currentValue = clamp(p.currentValue + (frameDelta / Math.PI), -1, 1);
            }
            
            let finalValue = p.currentValue;
            if (config.steps) {
                finalValue = Math.round(finalValue * config.steps) / config.steps;
            }
            
            s[config.key] = finalValue;
            globalState.activeLabel = config.label;
            globalState.activeValue = globalState.ueTelemetry[config.label] ?? fmtUnsigned(finalValue);
        }
        else if (p.zone === 'slider') {
            const dX = e.clientX - p.startX;
            const deltaValue = dX / SLIDER_PIXELS_TO_MAX;
            s.slider = clamp(p.startValue + deltaValue, -1, 1);
            globalState.activeLabel = 'CUSTOM';
            globalState.activeValue = fmtUnsigned(s.slider * s.k6);
        }
        else if (p.zone === 'sliderV') {
            const dY = e.clientY - p.startY;
            const deltaValue = -dY / SLIDER_PIXELS_TO_MAX;
            const config = SLIDER_V_CONFIGS[p.index];
            if (config.zeroToOne) {
                s[config.key] = clamp(p.startValue + deltaValue, 0, 1);
            } else {
                s[config.key] = clamp(p.startValue + deltaValue, -1, 1);
            }
            globalState.activeLabel = config.label;
            globalState.activeValue = globalState.ueTelemetry[config.label] ?? fmtUnsigned(s[config.key] * s.k6);
        }
        updateState();
    });

    const handleRelease = (e) => {
        if (!activePointers.has(e.pointerId)) return;
        const p = activePointers.get(e.pointerId);
        const s = getActiveCamState();
        if (p.zone === 'inner') { 
            s.tx = 0; s.ty = 0; 
            innerPuck.classList.remove('active'); panBoundary.classList.remove('active'); 
            globalState.activeLabel = 'PAN / TILT';
            globalState.activeValue = 'X:0.00 Y:0.00';
        }
        else if (p.zone === 'outer') { 
            s.rx = 0; s.ry = 0; 
            outerRing.classList.remove('active'); 
            globalState.activeLabel = 'PITCH / ROLL';
            globalState.activeValue = 'P:0.00 R:0.00';
        }
        else if (p.zone === 'yaw') { 
            s.rz = 0; 
            yawRing.classList.remove('active'); 
            globalState.activeLabel = 'YAW';
            globalState.activeValue = 'YAW:0.00';
        }
        else if (p.zone === 'knob') { 
            knobs[p.index].wrap.classList.remove('active'); 
        }
        else if (p.zone === 'slider') { 
            s.slider = 0;
            slider.classList.remove('active'); 
            globalState.activeLabel = 'CUSTOM';
            globalState.activeValue = '0.00';
        }
        else if (p.zone === 'sliderV') { 
            if (p.index === 0) {
                s.sliderV = 0;
                globalState.activeLabel = 'FCS';
                globalState.activeValue = '0.00';
            }
            slidersV[p.index].wrap.classList.remove('active'); 
        }
        activePointers.delete(e.pointerId);
        updateState();
    };

    window.addEventListener('pointerup', handleRelease);
    window.addEventListener('pointercancel', handleRelease);
}
