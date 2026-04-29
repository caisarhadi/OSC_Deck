# OSC Deck — Style Guide & CSS Architecture

This guide outlines the conventions and architectural patterns for all visual development and CSS styling in the OSC Deck project. The core philosophy is **zero visual debt**: all styling must be derived from a strict, two-tier token system with no hardcoded "magic numbers".

## File Structure & Import Chain

```text
style.css               ← Single entry point (imports only)
css/
├── tokens.css          ← Design tokens (Tier 1 & Tier 2)
├── base.css            ← Reset, typography, global element styles
├── layout.css          ← Structural positioning (#space-container)
└── components/         ← Component-scoped styles
    ├── joystick.css
    ├── console.css
    ├── knobs.css
    ├── slider.css
    ├── oled.css
    └── log.css
```

**Import Rules:**
- `style.css` is the only file linked in `index.html`.
- Import sequence must remain `tokens → base → layout → components/*` to preserve the cascade.
- Component files must be completely self-contained. No `@import` statements inside component files.
- Each UI component owns exactly one file. Do not mix component styles across files.

## Token System Architecture

All reusable values live in `tokens.css` as CSS custom properties on `:root`. We use a strict two-tier architecture:

### Tier 1: Base Tokens (Foundation)
Raw, context-agnostic values. Never used directly in component files.
```css
--color-bg-main: #050505;
--font-size-base: 14px;
```

### Tier 2: Semantic Tokens (Meaning)
Context-specific tokens that map base values to UI roles. These are consumed by components.
*Format:* `--{category}-{component}-{element}-{state}`

| Prefix | Usage | Example |
|--------|-------|---------|
| `--color-` | Backgrounds, borders, text | `--color-yaw-bg`, `--color-console-label` |
| `--size-` | Width, height, dimensions | `--size-yaw`, `--size-knob-dial` |
| `--shadow-` | Neumorphic depth layers | `--shadow-puck-active`, `--shadow-outer` |
| `--grad-` | Complex lighting gradients | `--grad-puck-center`, `--grad-yaw-ring` |
| `--radius-` | Border radii | `--radius-round`, `--radius-small` |
| `--font-` / `--weight-` | Typography | `--font-main`, `--font-weight-label` |

**Rule:** No hardcoded colours, sizes, shadows, gradients, or typography values in component files. Every property must trace back to a token.

## Naming Conventions & Selectors

We use a flat, component-scoped naming convention (BEM-influenced):

```css
.{component}-{element}
```

### Selector Discipline
- **Use Classes:** `.knob-dial`, `.slider-label`.
- **IDs for Hooks:** IDs like `#yaw-ring` or `#slider-v1` are reserved for JavaScript caching (`dom.js`) or top-level unique singletons. Avoid styling children via IDs.
- **State Modifiers:** Use standard state classes applied to the component root (e.g., `.active`, `.is-active`, `.lit-green`).
- **No `!important`:** Manage specificity through the cascade instead.

Example:
```css
/* ✅ Correct */
.knob-wrap.active .knob-indicator { background: var(--color-active); }

/* ❌ Avoid */
div > #my-knob > span { ... }
```

## Layout & Spatial Organization

The application uses a single-page, fixed-viewport layout optimized for specific device contexts.

- **Spatial Anchor:** The Yaw Ring (`--size-yaw`) acts as the central anchor. All peripheral controls are positioned relative to its center using `calc()`.
- **Absolute Positioning:** Components are absolutely positioned inside `#space-container`.
- **Responsive Design:** No media queries are used. Scaling is handled via viewport adaptations if necessary.

## Z-Index Registry

To prevent stacking conflicts, all page-level `z-index` values are centrally managed in `tokens.css`:

| Token | Value | Layer |
|-------|-------|-------|
| `--z-yaw` | 1 | Bottom-most interactive (Yaw ring) |
| `--z-outer` | 5 | Pitch/roll boundary |
| `--z-puck` | 10 | Joystick puck |
| `--z-knob` | 15 | Knob rack |
| `--z-console` | 20 | Camera selectors, top-level UI |

*Note: Component-internal stacking (relative to a `position: relative` component root) may use raw numbers (e.g., `z-index: 2`).*

## Animation & Performance Guidelines

Performance is critical to ensure latency-free input streaming to Unreal Engine.

### GPU-Accelerated Properties
Animate **only** the following properties during interactions:
- `transform` (Translate, scale, rotate)
- `opacity`
- `box-shadow` (Sparingly)
- `background-color` (For state changes)

**Never animate** layout-triggering properties: `width`, `height`, `top/left/right/bottom`, `margin`, or `padding`.

### Transition Management
- **State Changes:** Use `--transition-spring` for snap-backs, or `--transition-fast` for color/shadow toggles.
- **Active Dragging:** When a control is actively dragged (`.active`), CSS transitions must be disabled to prevent input lag:
```css
#yaw-ring.active { transition: none; }
```
- **`will-change`:** Apply only to elements continuously transformed by JS (e.g., `#yaw-ring`, `#inner-puck`).

## Neumorphic Visual Identity

The OSC Deck relies on neumorphic depth and complex lighting:
- Use compound, multi-layered shadows to simulate depth.
- Do not simplify gradients or shadows.
- Ensure all interactive elements declare `touch-action: none` and `cursor: pointer` to optimize input.
- Decorative UI elements (e.g., center dots, crosshairs) should use pseudo-elements (`::before`, `::after`) with `pointer-events: none` to keep the DOM clean.
