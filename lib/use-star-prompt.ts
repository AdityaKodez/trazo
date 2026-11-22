"use client";

import { useSyncExternalStore } from "react";

export type StarPromptStatus = "pending" | "dismissed" | "starred";

const STORAGE_KEY = "trazo:star-prompt";
const DEFAULT_STATUS: StarPromptStatus = "pending";

const listeners = new Set<() => void>();
let cache: StarPromptStatus | null = null;

function readStatus(): StarPromptStatus {
  if (typeof window === "undefined") return DEFAULT_STATUS;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "dismissed" || stored === "starred" ? stored : DEFAULT_STATUS;
  } catch {
    return DEFAULT_STATUS;
  }
}

function getSnapshot(): StarPromptStatus {
  if (cache === null) cache = readStatus();
  return cache;
}

function getServerSnapshot(): StarPromptStatus {
  return DEFAULT_STATUS;
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

function writeStatus(status: StarPromptStatus) {
  cache = status;
  try {
    window.localStorage.setItem(STORAGE_KEY, status);
  } catch {
    // Storage can be unavailable (private mode, disabled storage); keep the in-memory value.
  }
  listeners.forEach((listener) => listener());
}

export function dismissStarPrompt() {
  writeStatus("dismissed");
}

export function markStarPromptStarred() {
  writeStatus("starred");
}

/** Tracks whether the user has already starred or dismissed the dialog star prompt. */
export function useStarPromptStatus(): StarPromptStatus {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
