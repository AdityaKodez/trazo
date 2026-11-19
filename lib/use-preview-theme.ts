"use client";

import { useSyncExternalStore } from "react";

export type PreviewTheme = "light" | "dark";

const STORAGE_KEY = "trazo:preview-theme";
const DEFAULT_THEME: PreviewTheme = "light";

const listeners = new Set<() => void>();
let cache: PreviewTheme | null = null;

function readTheme(): PreviewTheme {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "dark" || stored === "light" ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

function getSnapshot(): PreviewTheme {
  if (cache === null) cache = readTheme();
  return cache;
}

function getServerSnapshot(): PreviewTheme {
  return DEFAULT_THEME;
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== STORAGE_KEY) return;
    cache = null;
    listeners.forEach((listener) => listener());
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function writePreviewTheme(theme: PreviewTheme) {
  cache = theme;
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Storage can be unavailable (private mode, disabled storage); keep the in-memory value.
  }
  listeners.forEach((listener) => listener());
}

/** Preview background preference for the sticker detail dialog, persisted across visits. */
export function usePreviewTheme(): PreviewTheme {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
