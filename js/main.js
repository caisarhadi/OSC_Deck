import { initInput } from './input.js';
import { initConsole } from './console.js';
import { updateState } from './ui.js';

// --- Generate Engraved Knob Ticks ---
function generateEngravedKnob(containerId, dotClass, config) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const { numTicks, strokeWidth, r1, r2 } = config;
    const cx = 50, cy = 50;

    let svg = `<svg viewBox="0 0 100 100" width="100%" height="100%" style="position: absolute; top: 0; left: 0; pointer-events: none;">`;

    for (let i = 0; i < numTicks; i++) {
        const angle = (i / numTicks) * Math.PI * 2 - (Math.PI / 2);
        const x1 = cx + r1 * Math.cos(angle);
        const y1 = cy + r1 * Math.sin(angle);
        const x2 = cx + r2 * Math.cos(angle);
        const y2 = cy + r2 * Math.sin(angle);

        // highlight — bright edge of engraved cut
        svg += `<line x1="${x1}" y1="${y1 + 0.5}" x2="${x2}" y2="${y2 + 0.5}" stroke="rgba(255,255,255,0.05)" stroke-width="${strokeWidth}" stroke-linecap="round"/>`;
        // shadow cut
        svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--color-bg-main)" stroke-width="${strokeWidth}" stroke-linecap="round"/>`;
    }
    svg += `</svg>`;

    // Add HTML dot indicator for accurate styling mapping
    svg += `<div class="${dotClass}"></div>`;

    container.innerHTML = svg;
}

(function initKnobTicks() {
    generateEngravedKnob('master-knob-center', 'master-dot', {
        numTicks: 60,
        strokeWidth: 1.1,
        r1: 40, // Inner radius of tick (adjustable)
        r2: 48  // Outer radius of tick (adjustable)
    });
    
    generateEngravedKnob('t-rate-knob-center', 't-rate-dot', {
        numTicks: 30,
        strokeWidth: 2.2, // Compensate for 50px knob scaling 100x100 viewBox
        r1: 38, // Inner radius for T-Rate ticks
        r2: 46  // Outer radius for T-Rate ticks
    });
})();

// Initialize pointer events and UI interactions
initInput();
initConsole();

// Start OSC WebSocket connection
import { connectOSC } from './osc.js';
connectOSC();

// Initial render
updateState();
