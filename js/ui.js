import { getActiveCamState, globalState, SLIDER_PIXELS_TO_MAX, KNOB_CONFIGS, SLIDER_V_CONFIGS } from './state.js';
import { innerPuck, outerRing, yawRing, oledLabel, oledValue, knobs, sliderTrack, slidersV, afToggle } from './dom.js';
import { sendOSC } from './osc.js';

export function updateState() {
    oledLabel.textContent = globalState.activeLabel;
    oledValue.textContent = globalState.activeValue;

    const s = getActiveCamState();

    const visTx = s.tx * 50; 
    const visTy = -s.ty * 50; 
    const visYaw = s.rz * 180; 

    innerPuck.style.transform = `translate3d(${visTx}px, ${visTy}px, 0)`;
    
    if (outerRing.classList.contains('active')) {
        const shadowX = s.ry * 20;
        const shadowY = -s.rx * 20;
        outerRing.style.boxShadow = `
            ${shadowX}px ${shadowY}px 30px rgba(255, 255, 255, 0.08), 
            inset ${-shadowX}px ${-shadowY}px 20px rgba(255, 255, 255, 0.05),
            0 0 0 8px rgba(0,0,0,0.6)
        `;
    } else {
        outerRing.style.boxShadow = `0 0 0 8px rgba(0,0,0,0.6), inset 0 0 20px #000`;
    }
    
    yawRing.style.transform = `rotateZ(${visYaw}deg)`;
    
    // Knob rotation mapping: -1.0 to 1.0 maps to -135 to 135 degrees
    // Rate knobs go from 0 to 1, mapped to -135deg to +135deg
    // We rotate the indicator instead of the dial so the dial's asymmetric shadow stays static!
    const KNOB_MAX_DEG = 135;
    KNOB_CONFIGS.forEach((config, idx) => {
        if (knobs[idx] && knobs[idx].indicator) {
            if (config.zeroToOne) {
                knobs[idx].indicator.style.transform = `rotateZ(${(s[config.key] * 270) - 135}deg)`;
            } else {
                knobs[idx].indicator.style.transform = `rotateZ(${s[config.key] * KNOB_MAX_DEG}deg)`;
            }
        }
    });

    // Visual offset = value * SLIDER_PIXELS_TO_MAX — matches the physical drag range 1:1
    if (sliderTrack) {
        const offset = `${s.slider * SLIDER_PIXELS_TO_MAX}px`;
        sliderTrack.style.backgroundPositionX = offset;
        sliderTrack.style.WebkitMaskPositionX = offset;
        sliderTrack.style.maskPositionX = offset;
    }
    SLIDER_V_CONFIGS.forEach((config, idx) => {
        const sv = slidersV[idx];
        if (sv && sv.track) {
            const offsetV = `${s[config.key] * SLIDER_PIXELS_TO_MAX}px`;
            sv.track.style.backgroundPositionY = offsetV;
            sv.track.style.WebkitMaskPositionY = offsetV;
            sv.track.style.maskPositionY = offsetV;
        }
    });

    if (afToggle) {
        if (s.afOn) {
            afToggle.classList.add('is-active');
        } else {
            afToggle.classList.remove('is-active');
        }
    }

    sendOSC();
}
