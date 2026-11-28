"use client";

import type { ReactNode } from "react";

import { useTrazoOverlayState } from "@/components/trazo/trazo-experience";

export function DetailFirstPaint({ id, children }: { id: string; children: ReactNode }) {
  const { overlayOpen, overlayView, selectedStickerMeta } = useTrazoOverlayState();

  if (!overlayOpen || overlayView !== "detail" || selectedStickerMeta.id !== id) {
    return null;
  }

  return <div className="trazo-detail-first-paint">{children}</div>;
}
