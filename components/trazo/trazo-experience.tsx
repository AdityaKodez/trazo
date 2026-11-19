"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { findSticker, trazoCatalog, type StickerCategory, type StickerDef } from "trazo";
import { findCanvasPlacement } from "@/config/canvas";
import { type PaletteId } from "@/config/palette";

export type OverlayView = "grid" | "detail";
export type CategoryFilter = "all" | StickerCategory;

export interface CameraGlideTarget {
  x: number;
  y: number;
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
  highlightedStickerId: string | null;
  cameraTarget: CameraGlideTarget;
  openLibraryGrid: () => void;
  openStickerDetail: (id: string) => void;
  backToGrid: () => void;
  locateOnCanvas: (id: string) => void;
  centerCanvas: () => void;
}

const TrazoContext = createContext<TrazoContextValue | null>(null);

export function TrazoProvider({ children }: { children: ReactNode }) {
  const [paletteId, setPaletteId] = useState<PaletteId>("mix");
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [overlayView, setOverlayView] = useState<OverlayView>("grid");
  const [selectedStickerId, setSelectedStickerId] = useState<string>("seahorse");
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSize, setSelectedSize] = useState<number>(48);
  const [highlightedStickerId, setHighlightedStickerId] = useState<string | null>(null);
  const seqRef = useRef(0);
  const [cameraTarget, setCameraTarget] = useState<CameraGlideTarget>({
    x: 0,
    y: 0,
    seq: 0,
  });

  const selectedSticker = useMemo(
    () => findSticker(selectedStickerId) ?? trazoCatalog[0],
    [selectedStickerId],
  );

  const openLibraryGrid = useCallback(() => {
    setOverlayView("grid");
    setOverlayOpen(true);
  }, []);

  const openStickerDetail = useCallback((id: string) => {
    setSelectedStickerId(id);
    setOverlayView("detail");
    setOverlayOpen(true);
  }, []);

  const backToGrid = useCallback(() => {
    setOverlayView("grid");
  }, []);

  const locateOnCanvas = useCallback((id: string) => {
    const placement = findCanvasPlacement(id);
    setOverlayOpen(false);
    setHighlightedStickerId(id);
    seqRef.current += 1;
    setCameraTarget({
      x: placement ? -placement.x : 0,
      y: placement ? -placement.y : 0,
      seq: seqRef.current,
    });
  }, []);

  const centerCanvas = useCallback(() => {
    setOverlayOpen(false);
    setHighlightedStickerId(null);
    seqRef.current += 1;
    setCameraTarget({
      x: 0,
      y: 0,
      seq: seqRef.current,
    });
  }, []);

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
      highlightedStickerId,
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
      overlayView,
      selectedSticker,
      activeCategory,
      searchQuery,
      selectedSize,
      highlightedStickerId,
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
