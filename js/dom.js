export const innerPuck = document.getElementById('inner-puck');
export const outerRing = document.getElementById('outer-ring');
export const yawRing = document.getElementById('yaw-ring');
export const panBoundary = document.getElementById('pan-boundary');
export const spaceContainer = document.getElementById('space-container');
export const outerIndicator = document.getElementById('outer-indicator');
export const resetBtn = document.getElementById('reset-btn');
export const afToggle = document.getElementById('af-toggle');
export const powerToggle = document.getElementById('power-toggle');

export const oledLabel = document.getElementById('oled-label');
export const oledValue = document.getElementById('oled-value');
export const logToggle = document.getElementById('log-toggle');
export const logContent = document.getElementById('log-content');
export const oscLogPanel = document.getElementById('osc-log');

export const camBtns = document.querySelectorAll('.keycap');
export const camMetas = document.querySelectorAll('.key-meta');

const createKnob = (id, hasCustomIndicator = null, hasCustomReset = null) => ({
    wrap: document.getElementById(id),
    indicator: hasCustomIndicator ? document.getElementById(hasCustomIndicator) : document.querySelector(`#${id} .knob-indicator`),
    reset: hasCustomReset ? document.getElementById(hasCustomReset) : document.querySelector(`#${id} .knob-reset`)
});

export const knobs = [
    createKnob('knob-1'),
    createKnob('knob-2'),
    createKnob('knob-3'),
    createKnob('knob-4'),
    createKnob('knob-5', 't-rate-knob-center'),
    createKnob('knob-6', 'master-knob-center', 'master-rate-reset')
];

export const slider = document.getElementById('slider-horizontal');
export const sliderTrack = document.querySelector('#slider-horizontal .ribbon-slider-track');

const createSliderV = (id, wrapperClass) => ({
    wrap: document.getElementById(id),
    track: document.querySelector(`#${id} .ribbon-slider-track`),
    reset: document.querySelector(`.vertical-slider-wrap.${wrapperClass} .slider-v-reset`)
});

export const slidersV = [
    createSliderV('slider-v1', 'v3'),
    createSliderV('slider-v2', 'v2'),
    createSliderV('slider-v3', 'v1')
];
