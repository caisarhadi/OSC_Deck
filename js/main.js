import { initInput } from './input.js';
import { initConsole } from './console.js';
import { updateState } from './ui.js';

// Initialize pointer events and UI interactions
initInput();
initConsole();

// Initial render
updateState();
