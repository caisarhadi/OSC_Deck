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
