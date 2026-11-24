"use client";

import { useSyncExternalStore } from "react";

const mobileQuery = "(max-width: 639px)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(mobileQuery);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getIsMobile() {
  return window.matchMedia(mobileQuery).matches;
}

function getServerIsMobile() {
  return false;
}

export function useIsMobile() {
  return useSyncExternalStore(subscribe, getIsMobile, getServerIsMobile);
}

export const overlayDialogClass =
  "top-[12dvh] flex max-h-[calc(88dvh-1.25rem)] translate-y-0 flex-col gap-0 overflow-hidden rounded-[22px] bg-[color-mix(in_oklab,var(--muted)_75%,var(--background))] p-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_20px_50px_-14px_rgba(0,0,0,0.22)] ring-1 ring-inset ring-foreground/[0.08] transition-[max-width,--scrollbar-alpha] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] sm:p-1.5";

export const overlayDrawerClass =
  "bg-[color-mix(in_oklab,var(--muted)_75%,var(--background))] px-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]";

export const overlayCardClass =
  "palette-scroll flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto rounded-[16px] bg-background p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-inset ring-foreground/[0.07] sm:gap-4 sm:p-4";
