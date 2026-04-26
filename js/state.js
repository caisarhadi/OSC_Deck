const createCamState = () => ({ tx: 0, ty: 0, rx: 0, ry: 0, rz: 0, k1: 0, k2: 0, k3: 0, k4: 0, k5: 1, k6: 1, slider: 0, sliderV: 0, sliderV2: 0, sliderV3: 0, afOn: false, resetOn: false });

export const cameras = {
    'A': createCamState(),
    'B': createCamState(),
    'C': createCamState(),
    'D': createCamState()
};

export const globalState = {
    activeCam: 'A',
    activeLabel: 'CAM.CTRL',
    activeValue: 'STANDBY',
    powerOn: true
};

export const getActiveCamState = () => cameras[globalState.activeCam];

export const activePointers = new Map();

// Tuning: How many pixels of drag equal 1.0 (100% axis output)
export const PIXELS_TO_MAX = 100;

// Sliders need much more physical travel — roughly matching their element length
export const SLIDER_PIXELS_TO_MAX = 270;

export const logBuffer = [];

export const KNOB_CONFIGS = [
    { key: 'k1', label: 'SHUTTER', zeroToOne: false },
    { key: 'k2', label: 'EI', zeroToOne: true },
    { key: 'k3', label: 'ND', zeroToOne: true },
    { key: 'k4', label: 'WB', zeroToOne: false },
    { key: 'k5', label: 'T-RATE', zeroToOne: true },
    { key: 'k6', label: 'MASTER RATE', zeroToOne: true }
];

export const SLIDER_V_CONFIGS = [
    { key: 'sliderV', label: 'FCS' },
    { key: 'sliderV2', label: 'IRIS' },
    { key: 'sliderV3', label: 'FCL' }
];
