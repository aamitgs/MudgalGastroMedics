"use client";

import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getSnapshot() {
  return navigator.onLine;
}

function getServerSnapshot() {
  return true;
}

/**
 * Tracks browser connectivity (Track 4.2) via the canonical
 * useSyncExternalStore pattern for browser APIs — SSR-safe (assumes online
 * until the client subscribes) and avoids the effect-based
 * subscribe-on-mount pattern entirely.
 */
export function useOnlineStatus() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
