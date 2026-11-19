"use client";

import { usePathname, useRouter } from "next/navigation";
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
import { playLocateShakeSound } from "@/lib/sound";

export const LOCATE_SHAKE_DELAY_MS = 180;

export type OverlayView = "grid" | "detail";
export type CategoryFilter = "all" | StickerCategory;

function parseOverlayRoute(pathname: string): {
  overlayOpen: boolean;
  overlayView: OverlayView;
  stickerId: string | null;
} {
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] !== "library") {
    return { overlayOpen: false, overlayView: "grid", stickerId: null };
  }

  if (segments.length === 1) {
    return { overlayOpen: true, overlayView: "grid", stickerId: null };
  }

  if (segments.length === 2) {
    let rawId = segments[1];
    try {
      rawId = decodeURIComponent(rawId);
    } catch {
      return { overlayOpen: false, overlayView: "grid", stickerId: null };
    }

    const sticker = findSticker(rawId);
    if (sticker) {
      return {
        overlayOpen: true,
        overlayView: "detail",
        stickerId: sticker.id,
      };
    }
  }

  return { overlayOpen: false, overlayView: "grid", stickerId: null };
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
  const router = useRouter();
  const pathname = usePathname();
  const routeState = useMemo(() => parseOverlayRoute(pathname), [pathname]);

  const [paletteId, setPaletteId] = useState<PaletteId>("mix");
  const [lastView, setLastView] = useState<OverlayView>(routeState.overlayView);
  const [lastStickerId, setLastStickerId] = useState<string>(
    routeState.stickerId ?? "seahorse",
  );
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

  // Keep the closing view and sticker stable during the Dialog/Drawer exit animation
  if (routeState.overlayOpen) {
    if (routeState.overlayView !== lastView) {
      setLastView(routeState.overlayView);
    }
    if (routeState.stickerId && routeState.stickerId !== lastStickerId) {
      setLastStickerId(routeState.stickerId);
    }
  }

  const overlayOpen = routeState.overlayOpen;
  const overlayView = routeState.overlayOpen ? routeState.overlayView : lastView;
  const activeStickerId = routeState.stickerId ?? lastStickerId;

  const selectedSticker = useMemo(
    () => findSticker(activeStickerId) ?? trazoCatalog[0],
    [activeStickerId],
  );

  const setOverlayOpen = useCallback(
    (open: boolean) => {
      if (open) {
        if (!routeState.overlayOpen) {
          router.push("/library", { scroll: false });
        }
      } else if (pathname !== "/") {
        router.push("/", { scroll: false });
      }
    },
    [pathname, routeState.overlayOpen, router],
  );

  const openLibraryGrid = useCallback(() => {
    if (pathname !== "/library") {
      router.push("/library", { scroll: false });
    }
  }, [pathname, router]);

  const openStickerDetail = useCallback(
    (id: string) => {
      const target = `/library/${encodeURIComponent(id)}`;
      if (pathname !== target) {
        router.push(target, { scroll: false });
      }
    },
    [pathname, router],
  );

  const backToGrid = useCallback(() => {
    if (pathname !== "/library") {
      router.push("/library", { scroll: false });
    }
  }, [pathname, router]);

  const locateOnCanvas = useCallback(
    (id: string) => {
      const placement = findCanvasPlacement(id);
      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (pathname !== "/") {
        router.push("/", { scroll: false });
      }
      seqRef.current += 1;
      setLocatedSticker({ id, seq: seqRef.current });
      setCameraTarget({
        x: placement ? -placement.x : 0,
        y: placement ? -placement.y : 0,
        seq: seqRef.current,
      });
      playLocateShakeSound(prefersReducedMotion ? 0 : LOCATE_SHAKE_DELAY_MS);
    },
    [pathname, router],
  );

  const centerCanvas = useCallback(() => {
    if (pathname !== "/") {
      router.push("/", { scroll: false });
    }
    setLocatedSticker(null);
    seqRef.current += 1;
    setCameraTarget({
      x: 0,
      y: 0,
      seq: seqRef.current,
    });
  }, [pathname, router]);

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
