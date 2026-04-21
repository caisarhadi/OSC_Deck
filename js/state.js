// 5-Axis State + 3 Knobs
export const state = { tx: 0, ty: 0, tz: 0, ry: 0, rz: 0, k1: 0, k2: 0, k3: 0 };

// Active pointers map to allow true simultaneous multi-touch tracking
export const activePointers = new Map();

// Tuning: How many pixels of drag equal 1.0 (100% axis output)
export const PIXELS_TO_MAX = 100;

// Simulated OSC Output buffer
export const logBuffer = [];
