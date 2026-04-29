# OSC Deck

Browser-based camera control surface that streams real-time state to Unreal Engine via a Node.js WebSocket + OSC/UDP bridge.

## Architecture

```
Browser UI  ──ws://──▶  Node.js Bridge  ──OSC/UDP──▶  Unreal Engine (OSC Plugin)
 (index.html)           (osc-bridge.js)  ◀──OSC/UDP──
```

The browser pushes JSON state over WebSocket on every input change. The bridge converts diffs into individual OSC messages sent via UDP. Unreal sends telemetry back as OSC messages which the bridge broadcasts to all WebSocket clients for OLED display.

See [ARCHITECTURE.md](doc/ARCHITECTURE.md) for module dependency graphs, data flow diagrams, and coding conventions, and [STYLEGUIDE.md](doc/STYLEGUIDE.md) for CSS architecture and visual development standards.

## Project Structure

```
├── index.html              UI layout
├── style.css               CSS imports
├── css/                    Component stylesheets
├── js/
│   ├── main.js             Entry point, knob tick generation
│   ├── input.js            Pointer event handling for all controls
│   ├── ui.js               Visual state rendering
│   ├── osc.js              WebSocket client, payload construction
│   ├── console.js          Camera selector and log panel
│   ├── dom.js              DOM element references
│   ├── state.js            Shared state and tuning constants
│   └── utils.js            Math helpers (clamp, format)
├── server/
│   └── osc-bridge.js       WebSocket + OSC/UDP bridge server
└── package.json            ws dependency
```

## Quick Start

```bash
npm install
node server/osc-bridge.js       # starts bridge on port 9000
npx -y serve -l 8080            # serve UI
```

Open `http://localhost:8080`. For remote devices, use your LAN IP instead.

## Endpoints

| Protocol | Address | Direction |
|----------|---------|-----------|
| WebSocket | `ws://0.0.0.0:9000` | Browser ↔ Server |
| OSC/UDP | `127.0.0.1:9001` | Server → Unreal |
| OSC/UDP | `0.0.0.0:9002` | Unreal → Server |

## JSON Payload

Every WebSocket frame contains a single flat JSON object with the following keys:

### Selector

| Key | Type | Description |
|-----|------|-------------|
| `cam` | `string` | Active camera: `"A"`, `"B"`, `"C"`, or `"D"` |

### Axes (Joystick)

All axis values are sent raw over WebSocket. The bridge applies rate multipliers before OSC transmission to Unreal Engine.

| Key | Type | Range | Rate Multipliers | Control |
|-----|------|-------|-------------------|---------|
| `tx` | `float` | -1.0 – 1.0 | tRate × masterRate | Pan X |
| `ty` | `float` | -1.0 – 1.0 | tRate × masterRate | Pan Y |
| `rx` | `float` | -1.0 – 1.0 | masterRate | Pitch |
| `ry` | `float` | -1.0 – 1.0 | masterRate | Roll |
| `rz` | `float` | -1.0 – 1.0 | masterRate | Yaw |
| `custom` | `float` | -1.0 – 1.0 | tRate × masterRate | Custom Slider |

### Knobs

| Key | Type | Range | Control |
|-----|------|-------|---------|
| `shutter` | `float` | 0.0 – 1.0 | Shutter angle |
| `ei` | `float` | 0.0 – 1.0 | Exposure index |
| `nd` | `float` | 0.0 – 1.0 | ND filter |
| `wb` | `float` | 0.0 – 1.0 | White balance |
| `tRate` | `float` | 0.0 – 1.0 | Translation rate multiplier (default: 1) |
| `masterRate` | `float` | 0.0 – 1.0 | Master rate multiplier (default: 1) |

### Sliders

All slider values are sent raw over WebSocket. The bridge applies masterRate before OSC transmission to Unreal Engine.

| Key | Type | Range | Control |
|-----|------|-------|---------|
| `fcl` | `float` | 0.0 – 1.0 | Focal length |
| `iris` | `float` | 0.0 – 1.0 | Aperture |
| `fcs` | `float` | -1.0 – 1.0 | Focus distance |

### Toggles

| Key | Type | Values | Control |
|-----|------|--------|---------|
| `power` | `int` | `0` / `1` | System power on/off |
| `af` | `int` | `0` / `1` | Autofocus on/off |
| `reset` | `int` | `0` / `1` | Rotation reset (momentary) |
| `resetFcl` | `int` | `0` / `1` | Focal length reset (momentary) |
| `resetIris` | `int` | `0` / `1` | Aperture reset (momentary) |
| `resetFcs` | `int` | `0` / `1` | Focus distance reset (momentary) |
| `resetShutter` | `int` | `0` / `1` | Shutter reset (momentary) |
| `resetEi` | `int` | `0` / `1` | Exposure index reset (momentary) |
| `resetNd` | `int` | `0` / `1` | ND filter reset (momentary) |
| `resetWb` | `int` | `0` / `1` | White balance reset (momentary) |

### Example Payload

```json
{
  "cam": "A",
  "power": 1,
  "tx": 0.00, "ty": 0.45, "rx": 0.00, "ry": 0.00, "rz": -0.12, "custom": 0.00,
  "shutter": 0.50, "ei": 0.00, "nd": 0.00, "wb": 0.00, "tRate": 1.00, "masterRate": 0.75,
  "fcl": 0.50, "iris": 0.60, "fcs": 0.00,
  "resetFcl": 0, "resetIris": 0, "resetFcs": 0,
  "resetShutter": 0, "resetEi": 0, "resetNd": 0, "resetWb": 0,
  "af": 0, "reset": 0
}
```

## Unreal Engine Telemetry (OSC/UDP)

Unreal Engine sends telemetry back to the bridge via OSC messages on UDP port `9002`.

The OSC address format is:

```
/telemetry/{cam}/{key}
```

Where `{cam}` is `A`, `B`, `C`, or `D` and `{key}` is one of the following:

| Key | Type | Description |
|-----|------|-------------|
| `shutter` | `float` | Shutter value to display |
| `ei` | `float` | Exposure index to display |
| `nd` | `float` | ND filter value to display |
| `wb` | `float` | White balance to display |
| `fcl` | `float` | Focal length to display |
| `iris` | `float` | Aperture to display |
| `fcs` | `float` | Focus distance to display |

The bridge only forwards telemetry for the currently active camera. If a key is omitted, the UI falls back to displaying its internal state value.

### Example OSC Telemetry Messages

```
/telemetry/A/fcl    [24.0]
/telemetry/A/iris   [2.8]
/telemetry/A/wb     [5600.0]
```
