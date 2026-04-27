# OSC Deck — Codebase Analysis

## Architecture

```
Browser UI  ──ws://──▶  Node.js Bridge  ◀──GET /state──  Unreal Engine (VaRest)
 (index.html)           (osc-bridge.js)  ◀──POST /state──
```

The browser pushes JSON state over WebSocket on every input change. Unreal polls `GET /state` to read the latest values and can POST telemetry back for OLED display.

## Module Dependency Graph

```
main.js (entry point, orchestrator)
├── ui.js       → state.js, dom.js
├── osc.js      → state.js, utils.js
├── input.js    → state.js, dom.js, utils.js, main.js (updateState)
└── console.js  → dom.js, state.js, main.js (updateState)

Leaf modules (no project imports):
  state.js    — data model, constants, configs
  dom.js      — cached DOM references
  utils.js    — pure math helpers
```

No circular imports exist. `main.js` acts as the single orchestrator, owning `updateState()` which calls `renderUI()` + `sendOSC()`.

## Data Flow

```
Input Event → mutate state → updateState() → renderUI() + sendOSC()
```

All rendering reads from state. No DOM reads during render. No state mutations during render.

## Module Responsibilities

| File | Responsibility |
|------|---------------|
| `state.js` | Shared state, `DEFAULT_CAM_STATE`, per-camera factory, `KNOB_CONFIGS` / `SLIDER_V_CONFIGS` |
| `dom.js` | DOM element references (queried once at load, never re-queried) |
| `input.js` | All pointer event wiring (knobs, sliders, joystick, yaw, toggles, resets) |
| `ui.js` | Pure rendering: state → DOM visual updates + log panel rendering |
| `osc.js` | WebSocket client, payload construction, telemetry ingestion (no DOM deps) |
| `console.js` | Camera selector buttons + log panel toggle |
| `utils.js` | Pure math helpers: `clamp`, `fmt`, `fmtUnsigned`, `applyDeadzone` |
| `main.js` | Entry point, `updateState()` orchestrator, knob tick SVG generation, iOS touch hardening |

## Key Patterns

### Config-Driven Controls

All knobs and sliders are defined as config arrays in `state.js`:

```js
KNOB_CONFIGS = [
    { key: 'k1', label: 'SHUTTER', ueKey: 'shutter', zeroToOne: true, resetKey: 'resetShutter', steps: 5 },
    // ...
];
SLIDER_V_CONFIGS = [
    { key: 'sliderV', label: 'FCS', ueKey: 'fcs', zeroToOne: false, resetKey: 'resetFcs' },
    // ...
];
```

Adding a new control requires only a new config entry — zero logic changes.

### DEFAULT_CAM_STATE

A frozen template object defines all per-camera defaults in one place. The `createCamState()` factory spreads from it, and all reset handlers reference it directly:

```js
const defaultVal = DEFAULT_CAM_STATE[config.key];
```

This eliminates the risk of defaults diverging between initialization and reset.

### Pointer Events + Multi-Touch

All controls use the Pointer Events API (`pointerdown`, `pointermove`, `pointerup`, `pointercancel`). An `activePointers` Map tags each pointer with a `zone` (inner, outer, yaw, knob, slider, sliderV) enabling simultaneous multi-touch interaction.

### Spring-Back Behavior

Movement axes (pan, tilt, pitch, roll, yaw, FCS, custom slider) snap to zero on release. Stateful controls (knobs, FCL, IRIS) retain their values.

### Telemetry Callback

`connectOSC(onRender)` accepts a render callback, keeping the network layer free of UI/DOM imports. On UE telemetry updates, the callback triggers a re-render without any circular dependencies.

### DOM Caching

All `getElementById` / `querySelector` calls execute once at module load via factory functions (`createKnob`, `createSliderV`). No repeated DOM queries at runtime.

## Server Architecture (osc-bridge.js)

A 96-line Node.js server with a single dependency (`ws`):

- **WebSocket**: Receives JSON state from browser, stores as `latestState`
- **GET /state**: Returns `latestState` as JSON (Unreal polling)
- **POST /state**: Receives UE telemetry, broadcasts to all WS clients as `ue_update`
- **CORS**: Enabled for cross-origin access
- **Error handling**: Structured logging with `[+]`, `[-]`, `[!]` prefixes

## CSS Architecture

```
style.css (imports only)
├── tokens.css        Design tokens / variables
├── base.css          Reset + body styles
├── layout.css        Grid / spatial positioning
└── components/
    ├── joystick.css
    ├── console.css
    ├── knobs.css
    ├── slider.css
    ├── oled.css
    └── log.css
```

## Summary Scorecard

| Practice | Rating | Notes |
|----------|--------|-------|
| Module separation | ⭐⭐⭐⭐⭐ | Single responsibility per file |
| State management | ⭐⭐⭐⭐⭐ | Config-driven with frozen defaults |
| DOM handling | ⭐⭐⭐⭐⭐ | Cached once, never re-queried |
| Input handling | ⭐⭐⭐⭐⭐ | Pointer API, multi-touch, spring-back |
| Data flow | ⭐⭐⭐⭐⭐ | Unidirectional, no circular imports |
| Server architecture | ⭐⭐⭐⭐⭐ | Minimal, correct, zero bloat |
| CSS organization | ⭐⭐⭐⭐⭐ | Tokenized, component-split |
| Error handling | ⭐⭐⭐⭐ | Client warns on WS errors, server logs structured |
| Event consistency | ⭐⭐⭐⭐⭐ | All controls use pointerdown |
| DRY (defaults) | ⭐⭐⭐⭐⭐ | Single source via DEFAULT_CAM_STATE |
| Documentation | ⭐⭐⭐⭐⭐ | README + this analysis |
