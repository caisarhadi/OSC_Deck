/**
 * Responsive scaling for mobile / short viewports.
 *
 * Computes the vertical centroid of the main UI column
 * (OLED → console buttons) and uses that as transform-origin
 * so the scaled result sits visually centered in the viewport.
 *
 * Edit SCALE_MOBILE to tune the zoom level.
 */

const SCALE_MOBILE = 0.7;  // ← tune this
const BREAKPOINT_H = 900;   // px — below this height → apply scale

const container = document.getElementById('space-container');

/* Elements that define the vertical extent of the main UI column */
const topEl    = document.querySelector('.oled-display');
const bottomEl = document.querySelector('.console-unit .button-row');

function applyScale() {
    const isMobile = window.innerHeight < BREAKPOINT_H;

    if (isMobile) {
        // Temporarily remove transform so measurements are unscaled
        container.style.transform = '';
        container.style.transformOrigin = '';

        const cRect = container.getBoundingClientRect();
        const tRect = topEl.getBoundingClientRect();
        const bRect = bottomEl.getBoundingClientRect();

        // Vertical midpoint of the content span (OLED top → button-row bottom)
        const contentTop    = tRect.top - cRect.top;
        const contentBottom = bRect.bottom - cRect.top;
        const originY       = (contentTop + contentBottom) / 2;

        // Horizontal center stays at the joystick / container center
        const originX = cRect.width / 2;

        container.style.transformOrigin = `${originX}px ${originY}px`;
        container.style.transform = `scale(${SCALE_MOBILE})`;
    } else {
        container.style.transform = '';
        container.style.transformOrigin = '';
    }
}

// First run: wait one frame so layout is painted and getBoundingClientRect is accurate
requestAnimationFrame(applyScale);

let t;
window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(applyScale, 60); });
window.addEventListener('orientationchange', () => setTimeout(applyScale, 200));

export { applyScale };
