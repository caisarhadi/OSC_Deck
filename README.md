# OSC Deck

Browser-based camera control surface that streams real-time state to Unreal Engine via a Node.js WebSocket-to-REST bridge.

## Architecture

```
Browser UI  ──ws://──▶  Node.js Bridge  ◀──GET /state──  Unreal Engine (VaRest)
 (index.html)           (osc-bridge.js)
```

The browser pushes JSON state over WebSocket on every input change. Unreal polls `GET /state` to read the latest values.

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
│   └── osc-bridge.js       WebSocket + REST bridge server
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
| WebSocket | `ws://0.0.0.0:9000` | Browser → Server |
| HTTP | `http://0.0.0.0:9000/state` | Server → Unreal |

## JSON Payload

Every WebSocket frame contains a single flat JSON object with the following keys:

### Selector

| Key | Type | Description |
|-----|------|-------------|
| `cam` | `string` | Active camera: `"A"`, `"B"`, `"C"`, or `"D"` |

### Axes (Joystick)

All axis values are multiplied by their applicable rate knobs before transmission.

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
| `shutter` | `float` | -1.0 – 1.0 | Shutter angle |
| `ei` | `float` | 0.0 – 1.0 | Exposure index |
| `nd` | `float` | 0.0 – 1.0 | ND filter |
| `wb` | `float` | -1.0 – 1.0 | White balance |
| `tRate` | `float` | 0.0 – 1.0 | Translation rate multiplier (default: 1) |
| `masterRate` | `float` | 0.0 – 1.0 | Master rate multiplier (default: 1) |

### Sliders

All slider values are multiplied by masterRate before transmission.

| Key | Type | Range | Control |
|-----|------|-------|---------|
| `fcl` | `float` | -1.0 – 1.0 | Focal length |
| `iris` | `float` | -1.0 – 1.0 | Aperture |
| `fcs` | `float` | -1.0 – 1.0 | Focus distance |

### Toggles

| Key | Type | Values | Control |
|-----|------|--------|---------|
| `af` | `int` | `0` / `1` | Autofocus on/off |
| `reset` | `int` | `0` / `1` | Rotation reset (momentary) |

### Example Payload

```json
{
  "cam": "A",
  "power": 1,
  "tx": 0.00, "ty": 0.45, "rx": 0.00, "ry": 0.00, "rz": -0.12, "custom": 0.00,
  "shutter": 0.30, "ei": 0.50, "nd": 0.00, "wb": 0.00, "tRate": 1.00, "masterRate": 0.75,
  "fcl": 0.00, "iris": 0.60, "fcs": 0.00,
  "af": 0, "reset": 0
}
```