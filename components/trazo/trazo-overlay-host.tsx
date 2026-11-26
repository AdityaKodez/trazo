"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import {
  useTrazoActions,
  useTrazoOverlayState,
} from "@/components/trazo/trazo-experience";

const LazyTrazoOverlay = dynamic(
  () => import("@/components/trazo/trazo-overlay").then((mod) => mod.TrazoOverlay),
  { ssr: false },
);

/**
 * Keeps the global Cmd+K / `/` shortcut active on initial load while deferring
 * the heavy library & detail dialog chunk until the overlay is actually opened.
 */
export function TrazoOverlayHost({ stars }: { stars: number | null }) {
  const { overlayOpen } = useTrazoOverlayState();
  const { setOverlayOpen, openLibraryGrid } = useTrazoActions();
  const [hasOpened, setHasOpened] = useState(overlayOpen);

  if (overlayOpen && !hasOpened) {
    setHasOpened(true);
  }

  useEffect(() => {
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      const isToggle =
        event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey);
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.isContentEditable ||
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA";
      const isSlash = event.key === "/" && !isTyping && !overlayOpen;

      if (!isToggle && !isSlash) return;
      event.preventDefault();
      if (overlayOpen) {
        setOverlayOpen(false);
      } else {
        openLibraryGrid();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openLibraryGrid, overlayOpen, setOverlayOpen]);

  if (!hasOpened && !overlayOpen) {
    return null;
  }

  return <LazyTrazoOverlay stars={stars} />;
}
