const createCamState = () => ({ tx: 0, ty: 0, tz: 0, ry: 0, rz: 0, k1: 0, k2: 0, k3: 0, k4: 1, k5: 1, k6: 1, slider: 0, sliderV: 0, sliderV2: 0, sliderV3: 0 });

export const cameras = {
    'A': createCamState(),
    'B': createCamState(),
    'C': createCamState(),
    'D': createCamState()
};

export const globalState = {
    activeCam: 'A',
    activeLabel: 'CAM.CTRL',
    activeValue: 'STANDBY'
};

export const getActiveCamState = () => cameras[globalState.activeCam];

// Active pointers map to allow true simultaneous multi-touch tracking
export const activePointers = new Map();

// Tuning: How many pixels of drag equal 1.0 (100% axis output)
export const PIXELS_TO_MAX = 100;

// Sliders need much more physical travel — roughly matching their element length
export const SLIDER_PIXELS_TO_MAX = 270;

// Simulated OSC Output buffer
export const logBuffer = [];
