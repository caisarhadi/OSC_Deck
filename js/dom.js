// DOM Elements
export const innerPuck = document.getElementById('inner-puck');
export const outerRing = document.getElementById('outer-ring');
export const yawRing = document.getElementById('yaw-ring');
export const panBoundary = document.getElementById('pan-boundary');
export const oscLog = document.getElementById('osc-log');
export const spaceContainer = document.getElementById('space-container');
export const outerIndicator = document.getElementById('outer-indicator');
export const resetBtn = document.getElementById('reset-btn');

export const oledLabel = document.getElementById('oled-label');
export const oledValue = document.getElementById('oled-value');
export const logToggle = document.getElementById('log-toggle');
export const logContent = document.getElementById('log-content');

// Camera Selector Buttons
export const camBtns = document.querySelectorAll('.keycap');
export const camMetas = document.querySelectorAll('.key-meta');

// Knobs
export const knobs = [
    { wrap: document.getElementById('knob-1'), indicator: document.querySelector('#knob-1 .knob-indicator'), reset: document.querySelector('#knob-1 .knob-reset') },
    { wrap: document.getElementById('knob-2'), indicator: document.querySelector('#knob-2 .knob-indicator'), reset: document.querySelector('#knob-2 .knob-reset') },
    { wrap: document.getElementById('knob-3'), indicator: document.querySelector('#knob-3 .knob-indicator'), reset: document.querySelector('#knob-3 .knob-reset') }
];

// Sliders
export const slider = document.getElementById('neumorphic-slider');
export const sliderTrack = document.querySelector('#neumorphic-slider .ribbon-slider-track');
export const slidersV = [
    { wrap: document.getElementById('neumorphic-slider-vertical'), track: document.querySelector('#neumorphic-slider-vertical .ribbon-slider-track'), reset: document.querySelector('.vertical-slider-wrap.v1 .slider-v-reset') },
    { wrap: document.getElementById('neumorphic-slider-vertical-2'), track: document.querySelector('#neumorphic-slider-vertical-2 .ribbon-slider-track'), reset: document.querySelector('.vertical-slider-wrap.v2 .slider-v-reset') },
    { wrap: document.getElementById('neumorphic-slider-vertical-3'), track: document.querySelector('#neumorphic-slider-vertical-3 .ribbon-slider-track'), reset: document.querySelector('.vertical-slider-wrap.v3 .slider-v-reset') }
];
