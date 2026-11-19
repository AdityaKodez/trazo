import { useSyncExternalStore } from "react";

function subscribe() {
  return () => {};
}

function getSnapshot(): string {
  return /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl";
}

function getServerSnapshot(): string {
  return "⌘";
}

/** Platform modifier label for keyboard hints: "⌘" on Apple devices, "Ctrl" elsewhere. */
export function useModKey(): string {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
