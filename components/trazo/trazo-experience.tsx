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
import type { StickerCategory, StickerDef, StickerMeta } from "trazo/core";
import { findStickerMeta, trazoCatalogMeta } from "trazo/meta";
import { findCanvasPlacement } from "@/config/canvas";
import { type PaletteId } from "@/config/palette";
import { playLocateShakeSound } from "@/lib/sound";
import {
  loadAllCategories,
  loadStickerById,
  useStickerDef,
} from "@/lib/sticker-loader";

export const LOCATE_SHAKE_DELAY_MS = 180;

export type OverlayView = "grid" | "detail" | "skill";
export type CategoryFilter = "all" | StickerCategory;

export const AGENT_SKILL_PATH = "/library/skill";

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
    if (segments[1] === "skill") {
      return { open: true, view: "skill", stickerId: DEFAULT_STICKER_ID };
    }

    let rawId = segments[1];
    try {
      rawId = decodeURIComponent(rawId);
    } catch {
      return closed;
    }

    const sticker = findStickerMeta(rawId);
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

export interface TrazoActionsValue {
  setPaletteId: (id: PaletteId) => void;
  setOverlayOpen: (open: boolean) => void;
  setActiveCategory: (category: CategoryFilter) => void;
  setSearchQuery: (query: string) => void;
  setSelectedSize: (size: number) => void;
  setSelectedRotation: (rotation: number) => void;
  openLibraryGrid: () => void;
  openStickerDetail: (id: string) => void;
  openAgentSkill: () => void;
  backToGrid: () => void;
  locateOnCanvas: (id: string) => void;
  centerCanvas: () => void;
}

export interface TrazoCanvasStateValue {
  paletteId: PaletteId;
  cameraTarget: CameraGlideTarget;
  locatedSticker: LocateTarget | null;
}

export interface TrazoOverlayStateValue {
  overlayOpen: boolean;
  overlayView: OverlayView;
  selectedStickerMeta: StickerMeta;
  selectedSticker: StickerDef | undefined;
  activeCategory: CategoryFilter;
  searchQuery: string;
  selectedSize: number;
  selectedRotation: number;
}

export type TrazoContextValue = TrazoActionsValue &
  TrazoCanvasStateValue &
  TrazoOverlayStateValue;

const TrazoActionsContext = createContext<TrazoActionsValue | null>(null);
const TrazoCanvasStateContext = createContext<TrazoCanvasStateValue | null>(null);
const TrazoOverlayStateContext = createContext<TrazoOverlayStateValue | null>(null);

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

  const selectedStickerMeta = useMemo(
    () => findStickerMeta(overlay.stickerId) ?? trazoCatalogMeta[0],
    [overlay.stickerId],
  );
  const selectedSticker = useStickerDef(selectedStickerMeta.id);

  const applyOverlay = useCallback((next: OverlayState, path: string) => {
    overlayRef.current = next;
    setOverlay(next);
    if (window.location.pathname !== path) {
      window.history.pushState(null, "", path);
      window.dispatchEvent(new Event("trazo:routechange"));
    }
  }, []);

  useEffect(() => {
    if (overlay.open && overlay.view === "grid") {
      void loadAllCategories();
    }
  }, [overlay.open, overlay.view]);

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
    void loadAllCategories();
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
      void loadStickerById(id);
      applyOverlay(
        { open: true, view: "detail", stickerId: id },
        `/library/${encodeURIComponent(id)}`,
      );
    },
    [applyOverlay],
  );

  const backToGrid = openLibraryGrid;

  const openAgentSkill = useCallback(() => {
    applyOverlay({ ...overlayRef.current, open: true, view: "skill" }, AGENT_SKILL_PATH);
  }, [applyOverlay]);

  const locateOnCanvas = useCallback(
    (id: string) => {
      void loadStickerById(id);
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

  const actionsValue = useMemo<TrazoActionsValue>(
    () => ({
      setPaletteId,
      setOverlayOpen,
      setActiveCategory,
      setSearchQuery,
      setSelectedSize,
      setSelectedRotation,
      openLibraryGrid,
      openStickerDetail,
      openAgentSkill,
      backToGrid,
      locateOnCanvas,
      centerCanvas,
    }),
    [
      setOverlayOpen,
      openLibraryGrid,
      openStickerDetail,
      openAgentSkill,
      backToGrid,
      locateOnCanvas,
      centerCanvas,
    ],
  );

  const canvasStateValue = useMemo<TrazoCanvasStateValue>(
    () => ({
      paletteId,
      cameraTarget,
      locatedSticker,
    }),
    [paletteId, cameraTarget, locatedSticker],
  );

  const overlayStateValue = useMemo<TrazoOverlayStateValue>(
    () => ({
      overlayOpen,
      overlayView,
      selectedStickerMeta,
      selectedSticker,
      activeCategory,
      searchQuery,
      selectedSize,
      selectedRotation,
    }),
    [
      overlayOpen,
      overlayView,
      selectedStickerMeta,
      selectedSticker,
      activeCategory,
      searchQuery,
      selectedSize,
      selectedRotation,
    ],
  );

  return (
    <TrazoActionsContext.Provider value={actionsValue}>
      <TrazoCanvasStateContext.Provider value={canvasStateValue}>
        <TrazoOverlayStateContext.Provider value={overlayStateValue}>
          {children}
        </TrazoOverlayStateContext.Provider>
      </TrazoCanvasStateContext.Provider>
    </TrazoActionsContext.Provider>
  );
}

export function useTrazoActions(): TrazoActionsValue {
  const ctx = useContext(TrazoActionsContext);
  if (!ctx) {
    throw new Error("useTrazoActions must be used inside TrazoProvider");
  }
  return ctx;
}

export function useTrazoCanvasState(): TrazoCanvasStateValue {
  const ctx = useContext(TrazoCanvasStateContext);
  if (!ctx) {
    throw new Error("useTrazoCanvasState must be used inside TrazoProvider");
  }
  return ctx;
}

export function useTrazoOverlayState(): TrazoOverlayStateValue {
  const ctx = useContext(TrazoOverlayStateContext);
  if (!ctx) {
    throw new Error("useTrazoOverlayState must be used inside TrazoProvider");
  }
  return ctx;
}

export function useTrazo(): TrazoContextValue {
  const actions = useTrazoActions();
  const canvasState = useTrazoCanvasState();
  const overlayState = useTrazoOverlayState();
  return useMemo(
    () => ({
      ...actions,
      ...canvasState,
      ...overlayState,
    }),
    [actions, canvasState, overlayState],
  );
}
