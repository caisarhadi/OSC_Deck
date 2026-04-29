# OSC Deck — Architecture & Conventions

## Data Flow

```mermaid
graph LR
    A["Input Event"] --> B["Mutate State"]
    B --> C["updateState()"]
    C --> D["renderUI()"]
    C --> E["sendOSC()"]
    D --> F["DOM Update + OLED"]
    E --> G["WebSocket → Server"]
```

All rendering reads from state. No DOM reads during render. No state mutations during render.

## Module Dependency Graph

```mermaid
graph LR
    subgraph Browser
        HTML["index.html"]
        MAIN["main.js"]
        INPUT["input.js"]
        UI["ui.js"]
        OSC["osc.js"]
        STATE["state.js"]
        DOM["dom.js"]
        CONSOLE["console.js"]
        UTILS["utils.js"]
    end

    subgraph Server
        BRIDGE["osc-bridge.js"]
    end

    UE["Unreal Engine"]

    MAIN -->|imports| INPUT
    MAIN -->|imports| CONSOLE
    MAIN -->|imports| UI
    MAIN -->|imports| OSC
    INPUT -->|reads/writes| STATE
    INPUT -->|reads| DOM
    INPUT -->|reads| UTILS
    INPUT -->|calls| MAIN
    UI -->|reads| STATE
    UI -->|reads| DOM
    OSC -->|reads/writes| STATE
    OSC -->|reads| UTILS
    CONSOLE -->|reads| DOM
    CONSOLE -->|reads/writes| STATE
    CONSOLE -->|calls| MAIN

    OSC -->|"WebSocket"| BRIDGE
    UE -->|"OSC/UDP (9002)"| BRIDGE
    BRIDGE -->|"OSC/UDP (9001)"| UE
    BRIDGE -->|"WS broadcast"| OSC
```

No circular imports exist. `main.js` owns `updateState()` which calls `renderUI()` + `sendOSC()`. Modules that need to trigger state updates import the function reference from `main.js`. `osc.js` has no DOM or UI dependencies — it receives a render callback via `connectOSC(onRender)`.

## Module Responsibilities

| File | Responsibility |
|------|---------------|
| `state.js` | Shared state, `DEFAULT_CAM_STATE`, per-camera factory, `KNOB_CONFIGS` / `SLIDER_V_CONFIGS` |
| `dom.js` | DOM element references (queried once at load, never re-queried) |
| `input.js` | All pointer event wiring (knobs, sliders, joystick, yaw, toggles, resets) |
| `ui.js` | Pure rendering: state → DOM visual updates + log panel rendering |
| `osc.js` | WebSocket client, config-driven payload construction, telemetry ingestion (no DOM deps) |
| `console.js` | Camera selector buttons + log panel toggle |
| `utils.js` | Pure math helpers: `clamp`, `fmt`, `fmtUnsigned`, `applyDeadzone` |
| `main.js` | Entry point, `updateState()` orchestrator, knob tick SVG generation, iOS touch hardening |

## Conventions

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

### Single Source of Truth for Defaults

`DEFAULT_CAM_STATE` is a frozen template object that defines all per-camera defaults in one place. The `createCamState()` factory spreads from it, and all reset handlers reference it directly:

```js
const defaultVal = DEFAULT_CAM_STATE[config.key];
```

Never hardcode default values in event handlers. Always reference `DEFAULT_CAM_STATE`.

### Pointer Events + Multi-Touch

All controls use the Pointer Events API (`pointerdown`, `pointermove`, `pointerup`, `pointercancel`). Do not use `click` or `touchstart` — they introduce delay on mobile or break multi-touch.

An `activePointers` Map tags each pointer with a `zone` (inner, outer, yaw, knob, slider, sliderV) enabling simultaneous multi-touch interaction.

### Spring-Back vs Retained State

Movement axes (pan, tilt, pitch, roll, yaw, FCS, custom slider) snap to zero on release. Stateful controls (knobs, FCL, IRIS) retain their values. When adding new controls, decide which category they belong to and handle the release accordingly in `input.js`.

### Telemetry Callback Pattern

`connectOSC(onRender)` accepts a render callback, keeping the network layer free of UI/DOM imports. On UE telemetry updates, the callback triggers a re-render without any circular dependencies. Follow this pattern when adding new server-to-client communication.

### Config-Driven Payload

`sendOSC()` builds the WebSocket payload from `KNOB_CONFIGS` and `SLIDER_V_CONFIGS` using each config's `ueKey` (or `key` as fallback) for the OSC field name. Adding a new knob or slider only requires a config entry — zero changes to the payload builder. Rate multipliers are applied **server-side** by the bridge, not in the client.

### OLED Telemetry Fallback

When displaying values on the OLED, always prefer UE telemetry over the local state:

```js
globalState.activeValue = globalState.ueTelemetry[config.label] ?? localValue.toFixed(2);
```

This applies to all contexts: drag, pointerdown, and reset handlers.

### DOM Caching

All `getElementById` / `querySelector` calls execute once at module load via factory functions (`createKnob`, `createSliderV`) in `dom.js`. Never query the DOM at runtime. If a new element is added, register it in `dom.js` and import the reference.

### Error Handling

- **Server**: Use structured log prefixes — `[+]` for connections/success, `[-]` for disconnections, `[!]` for errors.
- **Client**: Use `console.warn` with a `[OSC]` prefix for WebSocket errors. Do not silently swallow errors with empty catch blocks.

## Server Architecture

A single-file Node.js server (`server/osc-bridge.js`) with two dependencies (`ws`, `osc`):

- **WebSocket**: Receives JSON state from browser, stores as per-camera state, diffs and sends OSC
- **OSC/UDP Send (9001)**: Sends individual OSC messages to Unreal Engine on state changes
- **OSC/UDP Listen (9002)**: Receives telemetry from Unreal Engine, broadcasts to all WS clients as `ue_update`
