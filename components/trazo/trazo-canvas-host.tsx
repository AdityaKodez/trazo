"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { useTrazoOverlayState } from "@/components/trazo/trazo-experience";

const TrazoCanvasScene = dynamic(() =>
  import("@/components/trazo/trazo-canvas").then((mod) => mod.TrazoCanvasScene),
);

export function TrazoCanvasHost({
  npmDownloads,
  stars,
}: {
  npmDownloads: number | null;
  stars: number | null;
}) {
  const { overlayOpen, overlayView, selectedSticker } = useTrazoOverlayState();
  const showCanvas = !overlayOpen || overlayView !== "detail";
  const [hasShownCanvas, setHasShownCanvas] = useState(showCanvas);

  if (showCanvas && !hasShownCanvas) {
    setHasShownCanvas(true);
  }

  useEffect(() => {
    if (hasShownCanvas) return;

    let cancelled = false;
    let idleId: number | null = null;
    let timerId: number | null = null;
    let frameId: number | null = null;

    const reveal = () => {
      if (!cancelled) {
        setHasShownCanvas(true);
      }
    };

    if (selectedSticker) {
      frameId = window.requestAnimationFrame(() => {
        if (typeof window.requestIdleCallback === "function") {
          idleId = window.requestIdleCallback(reveal, { timeout: 600 });
        } else {
          timerId = window.setTimeout(reveal, 120);
        }
      });
    } else {
      timerId = window.setTimeout(reveal, 1500);
    }

    return () => {
      cancelled = true;
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      if (idleId !== null && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (timerId !== null) window.clearTimeout(timerId);
    };
  }, [hasShownCanvas, selectedSticker]);

  if (!hasShownCanvas) {
    return <div aria-hidden className="paper-dot-grid absolute inset-0" />;
  }

  return <TrazoCanvasScene npmDownloads={npmDownloads} stars={stars} />;
}
