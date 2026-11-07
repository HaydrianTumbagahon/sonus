"use client";

import { useSyncExternalStore } from "react";

let pageReady = false;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return pageReady;
}

function getServerSnapshot() {
  return false;
}

export function usePageReady(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function setPageReady(ready: boolean): void {
  if (typeof document !== "undefined") {
    document.documentElement.dataset.pageReady = String(ready);
  }
  if (pageReady === ready) return;
  pageReady = ready;
  for (const listener of listeners) listener();
}