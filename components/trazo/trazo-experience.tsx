"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { findSticker, trazoCatalog, type StickerCategory, type StickerDef } from "trazo";
import { findCanvasPlacement } from "@/config/canvas";
import { type PaletteId } from "@/config/palette";
import { playLocateShakeSound } from "@/lib/sound";

export const LOCATE_SHAKE_DELAY_MS = 180;

export type OverlayView = "grid" | "detail";
export type CategoryFilter = "all" | StickerCategory;

interface OverlayState {
  open: boolean;
  view: OverlayView;
  stickerId: string;
}

const DEFAULT_STICKER_ID = "seahorse";

function parseOverlayRoute(pathname: string): OverlayState {
  const closed: OverlayState = { open: false, view: "grid", stickerId: DEFAULT_STICKER_ID };
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] !== "library") {
    return closed;
  }

  if (segments.length === 1) {
    return { open: true, view: "grid", stickerId: DEFAULT_STICKER_ID };
  }

  if (segments.length === 2) {
    let rawId = segments[1];
    try {
      rawId = decodeURIComponent(rawId);
    } catch {
      return closed;
    }

    const sticker = findSticker(rawId);
    if (sticker) {
      return { open: true, view: "detail", stickerId: sticker.id };
    }
  }

  return closed;
}

export interface CameraGlideTarget {
  x: number;
  y: number;
  seq: number;
}

export interface LocateTarget {
  id: string;
  seq: number;
}

interface TrazoContextValue {
  paletteId: PaletteId;
  setPaletteId: (id: PaletteId) => void;
  overlayOpen: boolean;
  setOverlayOpen: (open: boolean) => void;
  overlayView: OverlayView;
  selectedSticker: StickerDef;
  activeCategory: CategoryFilter;
  setActiveCategory: (category: CategoryFilter) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedSize: number;
  setSelectedSize: (size: number) => void;
  selectedRotation: number;
  setSelectedRotation: (rotation: number) => void;
  locatedSticker: LocateTarget | null;
  cameraTarget: CameraGlideTarget;
  openLibraryGrid: () => void;
  openStickerDetail: (id: string) => void;
  backToGrid: () => void;
  locateOnCanvas: (id: string) => void;
  centerCanvas: () => void;
}

const TrazoContext = createContext<TrazoContextValue | null>(null);

export function TrazoProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const [paletteId, setPaletteId] = useState<PaletteId>("mix");
  const [overlay, setOverlay] = useState<OverlayState>(() => parseOverlayRoute(pathname));
  const overlayRef = useRef(overlay);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSize, setSelectedSize] = useState<number>(48);
  const [selectedRotation, setSelectedRotation] = useState<number>(0);
  const [locatedSticker, setLocatedSticker] = useState<LocateTarget | null>(null);
  const seqRef = useRef(0);
  const [cameraTarget, setCameraTarget] = useState<CameraGlideTarget>({
    x: 0,
    y: 0,
    seq: 0,
  });

  const overlayOpen = overlay.open;
  const overlayView = overlay.view;

  const selectedSticker = useMemo(
    () => findSticker(overlay.stickerId) ?? trazoCatalog[0],
    [overlay.stickerId],
  );

  const applyOverlay = useCallback((next: OverlayState, path: string) => {
    overlayRef.current = next;
    setOverlay(next);
    if (window.location.pathname !== path) {
      window.history.pushState(null, "", path);
    }
  }, []);

  useEffect(() => {
    function handlePopState() {
      const next = parseOverlayRoute(window.location.pathname);
      const current = overlayRef.current;
      const merged: OverlayState = next.open ? next : { ...current, open: false };
      overlayRef.current = merged;
      setOverlay(merged);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const closeOverlay = useCallback(() => {
    applyOverlay({ ...overlayRef.current, open: false }, "/");
  }, [applyOverlay]);

  const openLibraryGrid = useCallback(() => {
    applyOverlay({ ...overlayRef.current, open: true, view: "grid" }, "/library");
  }, [applyOverlay]);

  const setOverlayOpen = useCallback(
    (open: boolean) => {
      if (open) {
        if (!overlayRef.current.open) openLibraryGrid();
      } else {
        closeOverlay();
      }
    },
    [closeOverlay, openLibraryGrid],
  );

  const openStickerDetail = useCallback(
    (id: string) => {
      applyOverlay(
        { open: true, view: "detail", stickerId: id },
        `/library/${encodeURIComponent(id)}`,
      );
    },
    [applyOverlay],
  );

  const backToGrid = openLibraryGrid;

  const locateOnCanvas = useCallback(
    (id: string) => {
      const placement = findCanvasPlacement(id);
      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      closeOverlay();
      seqRef.current += 1;
      setLocatedSticker({ id, seq: seqRef.current });
      setCameraTarget({
        x: placement ? -placement.x : 0,
        y: placement ? -placement.y : 0,
        seq: seqRef.current,
      });
      playLocateShakeSound(prefersReducedMotion ? 0 : LOCATE_SHAKE_DELAY_MS);
    },
    [closeOverlay],
  );

  const centerCanvas = useCallback(() => {
    closeOverlay();
    setLocatedSticker(null);
    seqRef.current += 1;
    setCameraTarget({
      x: 0,
      y: 0,
      seq: seqRef.current,
    });
  }, [closeOverlay]);

  const value = useMemo<TrazoContextValue>(
    () => ({
      paletteId,
      setPaletteId,
      overlayOpen,
      setOverlayOpen,
      overlayView,
      selectedSticker,
      activeCategory,
      setActiveCategory,
      searchQuery,
      setSearchQuery,
      selectedSize,
      setSelectedSize,
      selectedRotation,
      setSelectedRotation,
      locatedSticker,
      cameraTarget,
      openLibraryGrid,
      openStickerDetail,
      backToGrid,
      locateOnCanvas,
      centerCanvas,
    }),
    [
      paletteId,
      overlayOpen,
      setOverlayOpen,
      overlayView,
      selectedSticker,
      activeCategory,
      searchQuery,
      selectedSize,
      selectedRotation,
      locatedSticker,
      cameraTarget,
      openLibraryGrid,
      openStickerDetail,
      backToGrid,
      locateOnCanvas,
      centerCanvas,
    ],
  );

  return <TrazoContext.Provider value={value}>{children}</TrazoContext.Provider>;
}

export function useTrazo() {
  const ctx = useContext(TrazoContext);
  if (!ctx) {
    throw new Error("useTrazo must be used inside TrazoProvider");
  }
  return ctx;
}
