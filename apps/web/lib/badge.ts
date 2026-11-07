/**
 * Finease App Badging API Manager
 * Sets and clears the home screen app icon badge on supported devices (Android & iOS 16.4+).
 */

export const appBadge = {
  /**
   * Set the badge count on the home screen PWA icon.
   * If count <= 0, clears the badge.
   */
  set: (count: number) => {
    if (typeof navigator !== "undefined" && "setAppBadge" in navigator) {
      try {
        if (count > 0) {
          void navigator.setAppBadge(count).catch(() => {
            // ignore badging permission or platform errors
          });
        } else {
          void navigator.clearAppBadge().catch(() => {
            // ignore badging permission or platform errors
          });
        }
      } catch {
        // ignore device errors
      }
    }
  },

  /**
   * Explicitly remove the badge from the home screen icon.
   */
  clear: () => {
    if (typeof navigator !== "undefined" && "clearAppBadge" in navigator) {
      try {
        void navigator.clearAppBadge().catch(() => {
          // ignore device errors
        });
      } catch {
        // ignore device errors
      }
    }
  },
};
