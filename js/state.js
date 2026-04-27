const createCamState = () => ({ tx: 0, ty: 0, rx: 0, ry: 0, rz: 0, k1: 0.6, k2: 0, k3: 0, k4: 0.4, k5: 1, k6: 1, slider: 0, sliderV: 0, sliderV2: 0.5, sliderV3: 0.5, afOn: false, resetOn: false, resetFcs: false, resetIris: false, resetFcl: false, resetShutter: false, resetEi: false, resetNd: false, resetWb: false });

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
    powerOn: true,
    ueTelemetry: {}
};

export const getActiveCamState = () => cameras[globalState.activeCam];

export const activePointers = new Map();

// Tuning: How many pixels of drag equal 1.0 (100% axis output)
export const PIXELS_TO_MAX = 100;

// Sliders need much more physical travel — roughly matching their element length
export const SLIDER_PIXELS_TO_MAX = 270;

export const logBuffer = [];

export const KNOB_CONFIGS = [
    { key: 'k1', label: 'SHUTTER', ueKey: 'shutter', zeroToOne: true, resetKey: 'resetShutter', steps: 5 },
    { key: 'k2', label: 'EI', ueKey: 'ei', zeroToOne: true, resetKey: 'resetEi' },
    { key: 'k3', label: 'ND', ueKey: 'nd', zeroToOne: true, resetKey: 'resetNd' },
    { key: 'k4', label: 'WB', ueKey: 'wb', zeroToOne: true, resetKey: 'resetWb' },
    { key: 'k5', label: 'T-RATE', zeroToOne: true },
    { key: 'k6', label: 'MASTER RATE', zeroToOne: true }
];

export const SLIDER_V_CONFIGS = [
    { key: 'sliderV', label: 'FCS', ueKey: 'fcs', zeroToOne: false, resetKey: 'resetFcs' },
    { key: 'sliderV2', label: 'IRIS', ueKey: 'iris', zeroToOne: true, resetKey: 'resetIris' },
    { key: 'sliderV3', label: 'FCL', ueKey: 'fcl', zeroToOne: true, resetKey: 'resetFcl' }
];
