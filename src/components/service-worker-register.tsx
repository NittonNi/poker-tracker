"use client";

import { useEffect } from "react";

/** Registra el service worker para habilitar la instalación como PWA. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // silencioso: si falla, la app sigue funcionando sin offline
      });
    }
  }, []);

  return null;
}
