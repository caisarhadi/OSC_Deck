import { state } from './state.js';
import { innerPuck, outerRing, yawRing, oledLabel, oledValue, knobs, sliderTrack, sliderVTrack } from './dom.js';
import { throttleOSC } from './osc.js';

// --- Visual & Data Update ---
export function updateState() {
    oledLabel.textContent = state.activeLabel;
    oledValue.textContent = state.activeValue;

    const visTx = state.tx * 50; 
    const visTy = -state.ty * 50; 
    const visYaw = state.rz * 180; 

    innerPuck.style.transform = `translate3d(${visTx}px, ${visTy}px, 0)`;
    
    if (outerRing.classList.contains('active')) {
        const shadowX = state.ry * 20;
        const shadowY = -state.tz * 20;
        outerRing.style.boxShadow = `
            ${shadowX}px ${shadowY}px 30px rgba(255, 255, 255, 0.08), 
            inset ${-shadowX}px ${-shadowY}px 20px rgba(255, 255, 255, 0.05),
            0 0 0 8px rgba(0,0,0,0.6)
        `;
    } else {
        outerRing.style.boxShadow = `0 0 0 8px rgba(0,0,0,0.6), inset 0 0 20px #000`;
    }
    
    yawRing.style.transform = `rotateZ(${visYaw}deg)`;
    
    // Infinite rotation mapping: 1.0 = 360 degrees
    // We rotate the indicator instead of the dial so the dial's asymmetric shadow stays static!
    knobs[0].indicator.style.transform = `rotateZ(${state.k1 * 360}deg)`;
    knobs[1].indicator.style.transform = `rotateZ(${state.k2 * 360}deg)`;
    knobs[2].indicator.style.transform = `rotateZ(${state.k3 * 360}deg)`;

    // Update slider ribbon background position based on state
    if (sliderTrack) {
        const offset = `${state.slider * 500}px`;
        sliderTrack.style.backgroundPositionX = offset;
        sliderTrack.style.WebkitMaskPositionX = offset;
        sliderTrack.style.maskPositionX = offset;
    }
    if (sliderVTrack) {
        const offsetV = `${state.sliderV * 500}px`;
        sliderVTrack.style.backgroundPositionY = offsetV;
        sliderVTrack.style.WebkitMaskPositionY = offsetV;
        sliderVTrack.style.maskPositionY = offsetV;
    }

    throttleOSC();
}
