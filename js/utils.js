export function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

export function fmt(val) {
    if (Math.abs(val) < 0.005) return "0.00";
    return (val > 0 ? "+" : "") + val.toFixed(2);
}

export function fmtUnsigned(val) {
    if (Math.abs(val) < 0.005) return "0.00";
    return val.toFixed(2);
}

export function applyDeadzone(val, threshold) {
    const absVal = Math.abs(val);
    if (absVal < threshold) return 0;
    return Math.sign(val) * ((absVal - threshold) / (1 - threshold));
}
