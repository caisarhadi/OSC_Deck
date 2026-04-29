# OSC Deck — Feature Roadmap & Specifications

This document outlines the core high-level features, UX goals, and specifications for upcoming iterations of the OSC Deck, heavily inspired by professional broadcast CCUs and 1st AC FIZ (Focus, Iris, Zoom) systems.

## 1. Global Camera Profile Selector
*   **Concept:** A dedicated master button to swap the underlying physical camera characteristics in Unreal Engine (Sensor Size, Camera Model, Aspect Ratio).
*   **Core Features:**
    *   **Placement:** Positioned in the bottom-left quadrant (directly below the Master Rate knob).
    *   **Alignment:** Horizontally aligned with the existing Camera Selector row to maintain the unified bottom console strip.
    *   **Functionality:** Tapping the button cycles through or opens a quick-select menu of predefined cinematic camera profiles (e.g., Arri Alexa LF, RED Monstro, Super35).
*   **Desired Outcome:** Gives the operator direct control over the virtual sensor properties, ensuring that focal length and depth-of-field calculations perfectly match the intended real-world camera body without diving into Unreal Engine menus.

## 2. Snapshot Memory Banks (Presets)
*   **Concept:** Broadcast CCU-style memory presets for rapid, repeatable camera state recall.
*   **Core Features:**
    *   Four dedicated memory banks (Presets 1-4).
    *   Presets will specifically capture and restore the state of the four core exposure/color knobs: **Shutter**, **EI**, **ND**, and **WB**.
*   **Desired Outcome:** Operators can save an exact exposure state for a specific lighting scenario and instantly snap the camera back to those exact values with a single tap.

## 23. Focus & Zoom Limits (FIZ A/B Marks)
*   **Concept:** Emulating high-end 1st AC hand units (like Preston or Arri Hi-5) to allow for flawless, repeatable lens pulls.
*   **Core Features:**
    *   Ability to set "Mark A" (Min) and "Mark B" (Max) points on the **FCS** (Focus) and **FCL** (Zoom) sliders.
    *   A dedicated "Clear Mark" function to remove the constraints.
    *   When marks are set, the full physical travel of the on-screen slider is mathematically remapped to output only the values between Mark A and Mark B.
*   **Desired Outcome:** Allows the operator to execute perfectly smooth, "blind" focus pulls or zoom ramps on a flat piece of glass/ always on the mark.

## 4. Non-Linear Control Curves (Exponential Mapping)
*   **Concept:** Cinematic lens motor/ lens barrel throw emulation.
*   **Core Features:**
    *   Transition the **FCS** (Focus) and **FCL** (Zoom) inputs from linear data mapping to exponential/non-linear curves.
    *   The curve translates physical finger travel to provide extreme precision (micro-adjustments) in critical ranges, while ramping up speed at the outer limits.
*   **Desired Outcome:** Drastically increases the fidelity, organic feel, and human-control of the focus and zoom mechanics, solving the "clinical" feel of linear touchscreen inputs.

## 5. Haptic Feedback (Exploration)
*   **Concept:** Restoring the missing physical feedback of tactile broadcast hardware.
*   **Core Features:**
    *   Trigger micro-vibrations (haptic clicks) when users interact with the UI.
    *   *Target triggers:* Hitting A/B focus marks, crossing the `0` center detent on the joystick/puck, snapping to a preset, or locking a control.
    *   *Constraint Note:* Apple heavily restricts the `navigator.vibrate` API on iOS Safari. This feature requires R&D to see if saving the app as a PWA (Add to Home Screen) unlocks haptics, or if alternative workarounds exist.
*   **Desired Outcome:** Providing the operator with a physical sensation of mechanical "clicks" and "stops" so they can confidently operate the deck without taking their eyes off the Unreal Engine monitor.

## 6. Inertia, Smoothing & Curves (Backlog)
*   **Concept:** Drone & PTZ flight-controller kinematics and custom mapping profiles.
*   **Core Features:**
    *   Applying mathematical damping, momentum, and spring physics (e.g., exponential moving averages) to control inputs, particularly when letting go of a joystick.
    *   **Joystick Mapping Profiles:** Provide three selectable curve algorithms for the joystick/puck axes to tune sensitivity:
        1.  **Linear:** 1:1 direct mapping (current state).
        2.  **Cubic:** Smoother center, aggressive edges.
        3.  **Exponential (Expo) / S-Curve:** Highly tunable deadzone/center precision, standard in RC/drone controllers.
    *   *Current Status:* Deprioritized. The current model successfully mimics a rigid, immediate SpaceMouse input which fits the floating camera use-case.
*   **Desired Outcome:** Documented here solely for future reference. If the virtual camera ever requires a feeling of "heavy mass", cinematic deceleration, or highly specialized joystick curve profiling, these algorithms will be introduced.

## 7. Scalable Camera & Preset Selectors
*   **Concept:** Expanding the 4-camera and 4-preset limit to handle multi-cam broadcast environments (e.g., 16+ cameras) without ruining the clean, hardware-inspired UI.
*   **Core Features:**
    *   **Paging/Banking System:** Introduce "Banks" or "Pages" for the selector buttons rather than crowding the screen. (e.g., Bank 1: Cams 1-4, Bank 2: Cams 5-8).
    *   **Navigation:** Add a dedicated "Bank Swap" toggle or a sleek horizontal swipe/scroll gesture over the button row to reveal the next set of cameras/presets seamlessly.
    *   **Tally Awareness:** Ensure that if an off-bank camera goes "Live" (e.g., Camera 12 goes live while the user is looking at Bank 1), there is a global visual indicator to maintain situational awareness.
*   **Desired Outcome:** Ability to scale the application to a virtually unlimited number of cameras or presets while strictly maintaining the uncrowded, highly tactile 4-button layout that currently feels so intuitive.
