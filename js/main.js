import { initInput } from './input.js';
import { initConsole } from './console.js';
import { updateState } from './ui.js';

// --- Generate Master Knob Ticks ---
(function initMasterTicks() {
    const container = document.getElementById('master-knob-center');
    if (!container) return;

    const numTicks = 60;
    const cx = 50, cy = 50;

    // Lengthened ticks per user request
    const r1 = 40;
    const r2 = 48;

    let svg = `<svg viewBox="0 0 100 100" width="100%" height="100%" style="position: absolute; top: 0; left: 0; pointer-events: none;">`;

    for (let i = 0; i < numTicks; i++) {
        const angle = (i / numTicks) * Math.PI * 2 - (Math.PI / 2);
        const x1 = cx + r1 * Math.cos(angle);
        const y1 = cy + r1 * Math.sin(angle);
        const x2 = cx + r2 * Math.cos(angle);
        const y2 = cy + r2 * Math.sin(angle);

        // highlight — bright edge of engraved cut
        svg += `<line x1="${x1}" y1="${y1 + 0.5}" x2="${x2}" y2="${y2 + 0.5}" stroke="rgba(255,255,255,0.05)" stroke-width="1.1" stroke-linecap="round"/>`;
        // shadow cut
        svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--color-bg-main)" stroke-width="1.1" stroke-linecap="round"/>`;
    }
    svg += `</svg>`;

    // Add HTML dot indicator for accurate styling mapping
    svg += `<div class="master-dot"></div>`;

    container.innerHTML = svg;
})();

// Initialize pointer events and UI interactions
initInput();
initConsole();

// Initial render
updateState();
