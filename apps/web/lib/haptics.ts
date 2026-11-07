/**
 * Finease Tactile Haptic Engine
 * Provides subtle, native-feeling vibration patterns for mobile PWA interactions.
 * Safe fallback for environments where navigator.vibrate is not supported (e.g. desktop).
 */

export const haptics = {
  /** Light micro-tick for keypad digit taps, toggle switches, or filter chips (10ms) */
  tick: () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(10);
      } catch {
        // ignore device vibration restrictions
      }
    }
  },

  /** Standard tactile tap for primary navigation and button clicks (20ms) */
  tap: () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(20);
      } catch {
        // ignore device vibration restrictions
      }
    }
  },

  /** Medium impact tap for modal openings and major actions (35ms) */
  impact: () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(35);
      } catch {
        // ignore device vibration restrictions
      }
    }
  },

  /** Satisfying double-pulse when committing wealth pulse, checkpoint, or saving (25ms - 40ms - 25ms) */
  success: () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate([25, 40, 25]);
      } catch {
        // ignore device vibration restrictions
      }
    }
  },

  /** Multi-pulse warning buzz for incorrect PIN or validation failure */
  warning: () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate([40, 50, 40, 50, 40]);
      } catch {
        // ignore device vibration restrictions
      }
    }
  },
};
