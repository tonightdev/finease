"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const registerSW = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((registration) => {
          console.log("[PWA] Service Worker registered:", registration.scope);
        })
        .catch((error) => {
          console.error("[PWA] Service Worker registration failed:", error);
        });
    };

    if (document.readyState === "complete") {
      registerSW();
      return;
    }

    window.addEventListener("load", registerSW);
    return () => {
      window.removeEventListener("load", registerSW);
    };
  }, []);

  return null;
}
