"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

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
  const { overlayOpen, overlayView } = useTrazoOverlayState();
  const showCanvas = !overlayOpen || overlayView !== "detail";
  const [hasShownCanvas, setHasShownCanvas] = useState(showCanvas);

  if (showCanvas && !hasShownCanvas) {
    setHasShownCanvas(true);
  }

  if (!hasShownCanvas) {
    return <div aria-hidden className="paper-dot-grid absolute inset-0" />;
  }

  return <TrazoCanvasScene npmDownloads={npmDownloads} stars={stars} />;
}
