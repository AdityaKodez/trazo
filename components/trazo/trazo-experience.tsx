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
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { StickerCategory, StickerDef, StickerMeta } from "trazo/core";
import { findStickerMeta, trazoCatalogMeta } from "trazo/meta";
import { CANVAS_WORLD, findCanvasPlacement } from "@/config/canvas";
import { type PaletteId } from "@/config/palette";
import { playLocateShakeSound, playStickerResetSound } from "@/lib/sound";
import {
  loadAllCategories,
  loadStickerById,
  useStickerDef,
} from "@/lib/sticker-loader";

export const LOCATE_SHAKE_DELAY_MS = 180;
const STICKER_OFFSETS_STORAGE_KEY = "trazo:sticker-offsets:v1";

export interface StickerOffset {
  x: number;
  y: number;
  z: number;
}

export type StickerOffsetMap = Record<string, StickerOffset>;

function clampWorldCoord(value: number, limit: number): number {
  return Math.min(Math.max(value, -limit), limit);
}

function readStoredStickerOffsets(): StickerOffsetMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STICKER_OFFSETS_STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    const result: StickerOffsetMap = {};
    for (const [id, entry] of Object.entries(parsed)) {
      if (!entry || typeof entry !== "object") continue;
      const placement = findCanvasPlacement(id);
      if (!placement) continue;
      const candidate = entry as Partial<StickerOffset>;
      if (
        typeof candidate.x !== "number" ||
        !Number.isFinite(candidate.x) ||
        typeof candidate.y !== "number" ||
        !Number.isFinite(candidate.y)
      ) {
        continue;
      }
      const clampedX =
        clampWorldCoord(placement.x + candidate.x, CANVAS_WORLD.halfWidth) -
        placement.x;
      const clampedY =
        clampWorldCoord(placement.y + candidate.y, CANVAS_WORLD.halfHeight) -
        placement.y;
      if (Math.hypot(clampedX, clampedY) < 2) continue;
      const z =
        typeof candidate.z === "number" && Number.isFinite(candidate.z) && candidate.z > 0
          ? Math.round(candidate.z)
          : 1;
      result[id] = {
        x: Math.round(clampedX),
        y: Math.round(clampedY),
        z,
      };
    }
    return result;
  } catch {
    return {};
  }
}

function writeStoredStickerOffsets(offsets: StickerOffsetMap): void {
  if (typeof window === "undefined") return;
  try {
    if (Object.keys(offsets).length === 0) {
      window.localStorage.removeItem(STICKER_OFFSETS_STORAGE_KEY);
    } else {
      window.localStorage.setItem(
        STICKER_OFFSETS_STORAGE_KEY,
        JSON.stringify(offsets),
      );
    }
  } catch {
    // Ignore quota/private-mode storage errors
  }
}

const EMPTY_STICKER_OFFSETS: StickerOffsetMap = {};
const stickerOffsetListeners = new Set<() => void>();
let cachedStickerOffsets: StickerOffsetMap | null = null;
let nextStickerZ = 1;

function getStickerOffsetsSnapshot(): StickerOffsetMap {
  if (typeof window === "undefined") return EMPTY_STICKER_OFFSETS;
  if (cachedStickerOffsets === null) {
    const stored = readStoredStickerOffsets();
    let maxZ = 0;
    for (const entry of Object.values(stored)) {
      if (entry.z > maxZ) maxZ = entry.z;
    }
    nextStickerZ = maxZ + 1;
    cachedStickerOffsets =
      Object.keys(stored).length === 0 ? EMPTY_STICKER_OFFSETS : stored;
  }
  return cachedStickerOffsets;
}

function getServerStickerOffsetsSnapshot(): StickerOffsetMap {
  return EMPTY_STICKER_OFFSETS;
}

function subscribeStickerOffsets(listener: () => void): () => void {
  stickerOffsetListeners.add(listener);
  return () => {
    stickerOffsetListeners.delete(listener);
  };
}

function commitStickerOffsets(next: StickerOffsetMap): void {
  cachedStickerOffsets =
    Object.keys(next).length === 0 ? EMPTY_STICKER_OFFSETS : next;
  writeStoredStickerOffsets(cachedStickerOffsets);
  for (const listener of stickerOffsetListeners) {
    listener();
  }
}

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
  setStickerOffset: (id: string, x: number, y: number) => void;
  resetStickerOffsets: () => void;
}

export interface TrazoCanvasStateValue {
  paletteId: PaletteId;
  cameraTarget: CameraGlideTarget;
  locatedSticker: LocateTarget | null;
  stickerOffsets: StickerOffsetMap;
  movedStickerCount: number;
  isResettingStickers: boolean;
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
  const stickerOffsets = useSyncExternalStore(
    subscribeStickerOffsets,
    getStickerOffsetsSnapshot,
    getServerStickerOffsetsSnapshot,
  );
  const [isResettingStickers, setIsResettingStickers] = useState(false);
  const resetTimerRef = useRef<number | null>(null);
  const seqRef = useRef(0);
  const [cameraTarget, setCameraTarget] = useState<CameraGlideTarget>({
    x: 0,
    y: 0,
    seq: 0,
  });

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

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
      const offset = getStickerOffsetsSnapshot()[id];
      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      closeOverlay();
      seqRef.current += 1;
      setLocatedSticker({ id, seq: seqRef.current });
      setCameraTarget({
        x: placement ? -(placement.x + (offset?.x ?? 0)) : 0,
        y: placement ? -(placement.y + (offset?.y ?? 0)) : 0,
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

  const setStickerOffset = useCallback((id: string, x: number, y: number) => {
    const placement = findCanvasPlacement(id);
    if (!placement) return;
    const clampedX = Math.round(
      clampWorldCoord(placement.x + x, CANVAS_WORLD.halfWidth) - placement.x,
    );
    const clampedY = Math.round(
      clampWorldCoord(placement.y + y, CANVAS_WORLD.halfHeight) - placement.y,
    );

    const prev = getStickerOffsetsSnapshot();
    if (Math.hypot(clampedX, clampedY) < 2) {
      if (!(id in prev)) return;
      const next = { ...prev };
      delete next[id];
      commitStickerOffsets(next);
      return;
    }

    const z = nextStickerZ++;
    commitStickerOffsets({
      ...prev,
      [id]: { x: clampedX, y: clampedY, z },
    });
  }, []);

  const resetStickerOffsets = useCallback(() => {
    const prev = getStickerOffsetsSnapshot();
    if (Object.keys(prev).length === 0) return;
    nextStickerZ = 1;
    setIsResettingStickers(true);
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
    }
    resetTimerRef.current = window.setTimeout(() => {
      resetTimerRef.current = null;
      setIsResettingStickers(false);
    }, 520);
    commitStickerOffsets(EMPTY_STICKER_OFFSETS);
    playStickerResetSound();
  }, []);

  const movedStickerCount = useMemo(
    () => Object.keys(stickerOffsets).length,
    [stickerOffsets],
  );

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
      setStickerOffset,
      resetStickerOffsets,
    }),
    [
      setOverlayOpen,
      openLibraryGrid,
      openStickerDetail,
      openAgentSkill,
      backToGrid,
      locateOnCanvas,
      centerCanvas,
      setStickerOffset,
      resetStickerOffsets,
    ],
  );

  const canvasStateValue = useMemo<TrazoCanvasStateValue>(
    () => ({
      paletteId,
      cameraTarget,
      locatedSticker,
      stickerOffsets,
      movedStickerCount,
      isResettingStickers,
    }),
    [
      paletteId,
      cameraTarget,
      locatedSticker,
      stickerOffsets,
      movedStickerCount,
      isResettingStickers,
    ],
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
