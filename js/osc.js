import { globalState, getActiveCamState, logBuffer, KNOB_CONFIGS, SLIDER_V_CONFIGS } from './state.js';
import { fmtUnsigned } from './utils.js';

let ws = null;
let wsReady = false;

const WS_URL = `ws://${window.location.hostname}:9000`;

export function connectOSC(onRender) {
    if (ws && ws.readyState <= 1) return;
    
    ws = new WebSocket(WS_URL);
    
    ws.onopen = () => {
        wsReady = true;
        console.log('[OSC] Connected to bridge at ' + WS_URL);
    };
    ws.onclose = () => {
        wsReady = false;
        console.log('[OSC] Disconnected — retrying in 3s…');
        setTimeout(() => connectOSC(onRender), 3000);
    };
    ws.onerror = (err) => { console.warn('[OSC] WebSocket error:', err.message); };
    ws.onmessage = (e) => {
        try {
            const msg = JSON.parse(e.data);
            if (msg.type !== 'ue_update' || !msg.data) return;

            const ALL_CONFIGS = [...KNOB_CONFIGS, ...SLIDER_V_CONFIGS];
            for (const config of ALL_CONFIGS) {
                if (!config.ueKey || msg.data[config.ueKey] === undefined) continue;
                globalState.ueTelemetry[config.label] = Number(msg.data[config.ueKey]).toFixed(2);
            }

            if (globalState.ueTelemetry[globalState.activeLabel] !== undefined) {
                globalState.activeValue = globalState.ueTelemetry[globalState.activeLabel];
                if (onRender) onRender();
            }
        } catch (err) { console.warn('[OSC] Bad message:', err.message); }
    };
}

export function sendOSC() {
    if (!wsReady) return;

    const s = getActiveCamState();
    const prefix = `/cam/${globalState.activeCam}`;
    const f = fmtUnsigned;

    // Raw values — server applies rate multipliers before OSC send
    const payload = {
        cam: globalState.activeCam,
        power: globalState.powerOn ? 1 : 0,
        // Fixed axes
        tx: +f(s.tx),
        ty: +f(s.ty),
        rx: +f(s.rx),
        ry: +f(s.ry),
        rz: +f(s.rz),
        custom: +f(s.sliderh1),
        // Fixed toggles
        af: s.afOn ? 1 : 0,
        reset: s.resetOn ? 1 : 0,
    };

    // Config-driven knobs
    for (const config of KNOB_CONFIGS) {
        const oscKey = config.ueKey || config.key;
        payload[oscKey] = +f(s[config.key]);
        if (config.resetKey) {
            payload[config.resetKey] = s[config.resetKey] ? 1 : 0;
        }
    }

    // Config-driven vertical sliders
    for (const config of SLIDER_V_CONFIGS) {
        const oscKey = config.ueKey || config.key;
        payload[oscKey] = +f(s[config.key]);
        if (config.resetKey) {
            payload[config.resetKey] = s[config.resetKey] ? 1 : 0;
        }
    }

    ws.send(JSON.stringify(payload));

    // Display-rate values for log (rate-multiplied for human readability)
    const txDisp = f(s.tx * s.k5 * s.k6);
    const tyDisp = f(s.ty * s.k5 * s.k6);
    const rxDisp = f(s.rx * s.k6);
    const ryDisp = f(s.ry * s.k6);
    const rzDisp = f(s.rz * s.k6);
    const customDisp = f(s.sliderh1 * s.k5 * s.k6);

    const msg = `${prefix}/6axis [${txDisp}, ${tyDisp}, ${rxDisp}, ${ryDisp}, ${rzDisp}, ${customDisp}] | ${prefix}/knobs [${f(s.k1)}, ${f(s.k2)}, ${f(s.k3)}, ${f(s.k4)}, ${f(s.k5)}, ${f(s.k6)}] | ${prefix}/sliders [${f(s.sliderv3 * s.k6)}, ${f(s.sliderv2 * s.k6)}, ${f(s.sliderv1 * s.k6)}] | ${prefix}/toggles [AF:${payload.af} RST:${payload.reset} PWR:${payload.power} FCL-R:${s.resetFcl ? 1 : 0} IRIS-R:${s.resetIris ? 1 : 0} FCS-R:${s.resetFcs ? 1 : 0} SHT-R:${s.resetShutter ? 1 : 0} EI-R:${s.resetEi ? 1 : 0} ND-R:${s.resetNd ? 1 : 0} WB-R:${s.resetWb ? 1 : 0}]`;
    logBuffer.push(msg);
    if (logBuffer.length > 4) logBuffer.shift();
}
