// DOM Elements
export const innerPuck = document.getElementById('inner-puck');
export const outerRing = document.getElementById('outer-ring');
export const yawRing = document.getElementById('yaw-ring');
export const panBoundary = document.getElementById('pan-boundary');
export const oscLog = document.getElementById('osc-log');
export const spaceContainer = document.getElementById('space-container');
export const outerIndicator = document.getElementById('outer-indicator');

export const displays = {
    tx: document.getElementById('val-tx'), 
    ty: document.getElementById('val-ty'), 
    tz: document.getElementById('val-tz'),
    ry: document.getElementById('val-ry'),
    rz: document.getElementById('val-rz')
};

// Camera Selector Buttons
export const camBtns = document.querySelectorAll('.keycap');
export const camMetas = document.querySelectorAll('.key-meta');

// Knobs
export const knobs = [
    { wrap: document.getElementById('knob-1'), indicator: document.querySelector('#knob-1 .knob-indicator') },
    { wrap: document.getElementById('knob-2'), indicator: document.querySelector('#knob-2 .knob-indicator') },
    { wrap: document.getElementById('knob-3'), indicator: document.querySelector('#knob-3 .knob-indicator') }
];
