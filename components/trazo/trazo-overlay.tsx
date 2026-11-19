"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Sticker,
  toSvgString,
  trazoCatalog,
  type StickerCategory,
  type StickerDef,
} from "trazo";

import {
  ArrowLeft,
  Check,
  Code,
  Compass,
  Copy,
  Download,
  ImageDown,
  Moon,
  Palette,
  Ruler,
  Search,
  Sun,
  X,
} from "@/components/trazo/icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useTrazo,
  type CategoryFilter,
} from "@/components/trazo/trazo-experience";
import {
  paletteOptions,
  resolveStickerHex,
  type PaletteOption,
} from "@/config/palette";
import { useCopy } from "@/lib/use-copy";
import { useModKey } from "@/lib/use-mod-key";
import { usePreviewTheme, writePreviewTheme } from "@/lib/use-preview-theme";
import { cn } from "@/lib/utils";

const SIZE_RANGE = { min: 16, max: 128, step: 4 } as const;
type CodeTab = "react" | "js";

const CATEGORY_TABS: readonly { id: CategoryFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "ocean", label: "Ocean" },
  { id: "arrows", label: "Arrows" },
  { id: "nature", label: "Nature" },
  { id: "hearts", label: "Hearts" },
  { id: "symbols", label: "Symbols" },
  { id: "cats", label: "Cats" },
] as const;

const MIX_GRADIENT =
  "conic-gradient(from 0deg, #ef4444, #f97316, #eab308, #16a34a, #38bdf8, #2563eb, #ec4899, #ef4444)";
const highlightSpring = { type: "spring", stiffness: 700, damping: 45, mass: 0.5 } as const;
const LISTBOX_ID = "trazo-sticker-listbox";

type SlotComponent = ComponentType<{ className?: string; children: ReactNode }>;

function optionId(id: string) {
  return `trazo-sticker-${id}`;
}

function stickerColor(def: StickerDef, paletteId: ReturnType<typeof useTrazo>["paletteId"]) {
  return paletteId === "ink" ? "var(--scribble-ink)" : resolveStickerHex(def, paletteId);
}

function formatCategoryLabel(category: StickerCategory): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return isMobile;
}

function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-background px-1.5 font-sans text-[10px] font-medium text-muted-foreground shadow-[0_1px_0_rgba(0,0,0,0.06)] ring-1 ring-inset ring-foreground/10",
        className,
      )}
    >
      {children}
    </kbd>
  );
}

function MiniPaletteBar() {
  const { paletteId, setPaletteId } = useTrazo();
  const reduceMotion = useReducedMotion();

  return (
    <div
      role="radiogroup"
      aria-label="Preview palette"
      className="flex items-center rounded-full bg-background/80 p-0.5 ring-1 ring-inset ring-foreground/8"
    >
      {paletteOptions.map((option: PaletteOption) => {
        const isSelected = paletteId === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={option.label}
            title={option.label}
            onClick={() => setPaletteId(option.id)}
            className="relative flex size-6 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {isSelected ? (
              <motion.span
                aria-hidden
                layoutId="detail-swatch-selection"
                transition={reduceMotion ? { duration: 0 } : highlightSpring}
                className="absolute inset-0 rounded-full bg-background ring-[1.5px] ring-foreground/80"
              />
            ) : null}
            <span
              aria-hidden
              style={
                option.kind === "mix"
                  ? { background: MIX_GRADIENT }
                  : option.kind === "swatch"
                    ? { backgroundColor: option.hex }
                    : undefined
              }
              className={cn(
                "relative block size-3.5 rounded-full ring-1 ring-inset ring-black/15 transition-transform duration-150 hover:scale-115",
                option.kind === "ink" && "bg-[color:var(--scribble-ink)]",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function downloadStickerPng(
  def: StickerDef,
  size: number,
  concreteHex: string,
) {
  const scale = 2;
  const exportSize = size * scale;
  const svgMarkup = toSvgString(def, {
    size: exportSize,
    color: concreteHex,
    title: def.name,
  });

  const svgBlob = new Blob([svgMarkup], {
    type: "image/svg+xml;charset=utf-8",
  });
  const url = URL.createObjectURL(svgBlob);

  try {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Failed to rasterize SVG"));
      img.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = exportSize;
    canvas.height = exportSize;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(img, 0, 0, exportSize, exportSize);
    const pngBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((blob) => resolve(blob), "image/png"),
    );
    if (pngBlob) {
      downloadBlob(pngBlob, `${def.id}-${size}px.png`);
    }
  } finally {
    URL.revokeObjectURL(url);
  }
}

function LibraryPalette({
  Title,
  Description,
  isMobile,
}: {
  Title: SlotComponent;
  Description: SlotComponent;
  isMobile: boolean;
}) {
  const {
    paletteId,
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    openStickerDetail,
    locateOnCanvas,
    setOverlayOpen,
  } = useTrazo();
  const reduceMotion = useReducedMotion();
  const modKey = useModKey();
  const gridRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const map: Record<CategoryFilter, number> = {
      all: trazoCatalog.length,
      ocean: 0,
      arrows: 0,
      nature: 0,
      hearts: 0,
      symbols: 0,
      cats: 0,
    };
    for (const item of trazoCatalog) {
      map[item.category] += 1;
    }
    return map;
  }, []);

  const filteredStickers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return trazoCatalog.filter((item) => {
      if (activeCategory !== "all" && item.category !== activeCategory) {
        return false;
      }
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    });
  }, [activeCategory, searchQuery]);

  const activeId =
    hoveredId && filteredStickers.some((item) => item.id === hoveredId)
      ? hoveredId
      : (filteredStickers[0]?.id ?? null);

  function columnCount() {
    const grid = gridRef.current;
    if (!grid) return 1;
    return getComputedStyle(grid).gridTemplateColumns.split(" ").length;
  }

  function moveActive(delta: number) {
    if (filteredStickers.length === 0) return;
    const current = filteredStickers.findIndex((item) => item.id === activeId);
    const next = Math.min(
      Math.max((current === -1 ? 0 : current) + delta, 0),
      filteredStickers.length - 1,
    );
    const nextId = filteredStickers[next].id;
    setHoveredId(nextId);
    document.getElementById(optionId(nextId))?.scrollIntoView({ block: "nearest" });
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        moveActive(1);
        break;
      case "ArrowLeft":
        event.preventDefault();
        moveActive(-1);
        break;
      case "ArrowDown":
        event.preventDefault();
        moveActive(columnCount());
        break;
      case "ArrowUp":
        event.preventDefault();
        moveActive(-columnCount());
        break;
      case "Enter":
        if (!activeId) return;
        event.preventDefault();
        if (event.metaKey || event.ctrlKey) {
          locateOnCanvas(activeId);
        } else {
          openStickerDetail(activeId);
        }
        break;
    }
  }

  return (
    <div className="flex min-h-0 flex-col">
      <Title className="sr-only">Sticker library</Title>
      <Description className="sr-only">
        Search {trazoCatalog.length} hand-drawn crayon stickers. Use arrow keys to move, Enter to
        open a sticker, and {modKey} Enter to locate it on the canvas.
      </Description>

      {/* Search row */}
      <div className="flex items-center gap-2.5 border-b border-foreground/[0.07] px-4 sm:px-5">
        <Search className="size-[18px] shrink-0 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded="true"
          aria-controls={LISTBOX_ID}
          aria-activedescendant={activeId ? optionId(activeId) : undefined}
          aria-autocomplete="list"
          aria-label="Search stickers"
          autoComplete="off"
          spellCheck={false}
          value={searchQuery}
          onChange={(event) => {
            setSearchQuery(event.target.value);
            setHoveredId(null);
          }}
          onKeyDown={handleInputKeyDown}
          placeholder="Search stickers, tags, moods..."
          className="h-14 min-w-0 flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground/80"
        />
        <AnimatePresence initial={false}>
          {searchQuery ? (
            <motion.button
              type="button"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.14 }}
              onClick={() => {
                setSearchQuery("");
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="flex size-7 items-center justify-center rounded-full text-muted-foreground micro-transition hover:bg-muted hover:text-foreground"
            >
              <X className="size-3.5" />
            </motion.button>
          ) : null}
        </AnimatePresence>
        <button
          type="button"
          onClick={() => setOverlayOpen(false)}
          aria-label="Close library"
          className="group hidden rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring sm:block"
        >
          <Kbd className="micro-transition group-hover:text-foreground">esc</Kbd>
        </button>
      </div>

      {/* Category chips */}
      <div
        aria-label="Sticker categories"
        role="group"
        className="flex items-center gap-1 overflow-x-auto px-3 py-2.5 [scrollbar-width:none] sm:px-4"
      >
        {CATEGORY_TABS.map((tab) => {
          const isActive = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => {
                setActiveCategory(tab.id);
                setHoveredId(null);
                gridRef.current?.scrollTo({ top: 0 });
              }}
              className={cn(
                "relative inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium outline-none micro-transition active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-ring",
                isActive ? "text-background" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {isActive ? (
                <motion.span
                  aria-hidden
                  layoutId="library-category-pill"
                  transition={reduceMotion ? { duration: 0 } : highlightSpring}
                  className="absolute inset-0 rounded-full bg-foreground"
                />
              ) : null}
              <span className="relative">{tab.label}</span>
              <span
                className={cn(
                  "relative font-mono text-[10px] leading-none",
                  isActive ? "text-background/70" : "text-muted-foreground/70",
                )}
              >
                {counts[tab.id]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Sticker grid */}
      {filteredStickers.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 pb-12 pt-8 text-center">
          <p className="font-caveat text-[26px] leading-none text-foreground">
            nothing scribbled here yet
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Try another word, or{" "}
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setActiveCategory("all");
                inputRef.current?.focus();
              }}
              className="font-medium text-foreground underline decoration-foreground/30 underline-offset-2 hover:decoration-foreground"
            >
              reset filters
            </button>
            .
          </p>
        </div>
      ) : (
        <div
          ref={gridRef}
          id={LISTBOX_ID}
          role="listbox"
          aria-label="Stickers"
          className="palette-scroll grid max-h-[min(52dvh,420px)] grid-cols-3 content-start gap-1 overflow-y-auto overscroll-contain px-3 pb-3 sm:grid-cols-5 sm:px-4"
        >
          {filteredStickers.map((item) => {
            const isActive = item.id === activeId;
            return (
              <div
                key={item.id}
                id={optionId(item.id)}
                role="option"
                aria-selected={isActive}
                onPointerMove={() => {
                  if (hoveredId !== item.id) setHoveredId(item.id);
                }}
                onClick={() => openStickerDetail(item.id)}
                className="group relative flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl px-2 pb-2.5 pt-3.5"
              >
                {isActive ? (
                  <motion.span
                    aria-hidden
                    layoutId="library-active-tile"
                    transition={reduceMotion ? { duration: 0 } : highlightSpring}
                    className="absolute inset-0 rounded-2xl bg-muted/80 ring-1 ring-inset ring-foreground/[0.06]"
                  />
                ) : null}
                <span className="relative flex size-14 items-center justify-center">
                  <Sticker
                    def={item}
                    size={48}
                    color={stickerColor(item, paletteId)}
                    className={cn(
                      "transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]",
                      isActive && !reduceMotion && "-rotate-6 scale-110",
                    )}
                  />
                </span>
                <span
                  className={cn(
                    "relative w-full truncate text-center text-[11px] font-medium transition-colors duration-150",
                    isActive ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {item.name}
                </span>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={(event) => {
                        event.stopPropagation();
                        locateOnCanvas(item.id);
                      }}
                      aria-label={`Locate ${item.name} on canvas`}
                      className={cn(
                        "absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-full text-foreground/60 micro-transition hover:bg-background hover:text-foreground hover:shadow-[0_1px_2px_rgba(0,0,0,0.08)]",
                        isActive ? "scale-100 opacity-100" : "pointer-events-none scale-75 opacity-0",
                      )}
                    >
                      <Compass className="size-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Locate on canvas</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            );
          })}
        </div>
      )}

      {/* Keyboard hint footer */}
      {isMobile ? null : (
        <div className="flex items-center justify-between gap-3 border-t border-foreground/[0.07] bg-muted/40 px-5 py-2.5 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3.5">
            <span className="flex items-center gap-1.5">
              <span className="flex gap-0.5">
                <Kbd>←</Kbd>
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd>
                <Kbd>→</Kbd>
              </span>
              move
            </span>
            <span className="flex items-center gap-1.5">
              <Kbd>↵</Kbd> open
            </span>
            <span className="flex items-center gap-1.5">
              <Kbd>{modKey} ↵</Kbd> locate
            </span>
          </div>
          <span className="font-mono">
            {filteredStickers.length} / {trazoCatalog.length}
          </span>
        </div>
      )}
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-9 items-center gap-3">
      <span className="flex w-20 shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </span>
      <div className="flex min-w-0 flex-1 items-center gap-3">{children}</div>
    </div>
  );
}

function IconAction({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          aria-label={label}
          className="flex size-8 items-center justify-center rounded-full text-muted-foreground outline-none micro-transition hover:bg-muted hover:text-foreground active:scale-[0.92] focus-visible:ring-2 focus-visible:ring-ring"
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function StickerDetailView({
  Title,
  Description,
}: {
  Title: SlotComponent;
  Description: SlotComponent;
}) {
  const {
    selectedSticker,
    paletteId,
    selectedSize,
    setSelectedSize,
    backToGrid,
    locateOnCanvas,
    setOverlayOpen,
  } = useTrazo();
  const reduceMotion = useReducedMotion();
  const [codeTab, setCodeTab] = useState<CodeTab>("react");
  const previewTheme = usePreviewTheme();
  const darkPreview = previewTheme === "dark";
  const codeCopy = useCopy();
  const hexCopy = useCopy();

  const concreteHex = resolveStickerHex(selectedSticker, paletteId);
  const displayColor = stickerColor(selectedSticker, paletteId);
  const size = Math.min(Math.max(selectedSize, SIZE_RANGE.min), SIZE_RANGE.max);
  const sizeProgress = ((size - SIZE_RANGE.min) / (SIZE_RANGE.max - SIZE_RANGE.min)) * 100;

  const svgMarkup = useMemo(
    () =>
      toSvgString(selectedSticker, {
        size,
        color: concreteHex,
        title: selectedSticker.name,
      }),
    [concreteHex, size, selectedSticker],
  );

  const codeSnippet = useMemo(() => {
    if (codeTab === "react") {
      return [
        `import { ${selectedSticker.componentName} } from "trazo";`,
        ``,
        `<${selectedSticker.componentName}`,
        `  size={${size}}`,
        `  color="${concreteHex}"`,
        `/>`,
      ].join("\n");
    }
    return [
      `import { findSticker, toSvgString } from "trazo";`,
      ``,
      `const sticker = findSticker("${selectedSticker.id}")!;`,
      `const svg = toSvgString(sticker, {`,
      `  size: ${size},`,
      `  color: "${concreteHex}",`,
      `});`,
    ].join("\n");
  }, [codeTab, concreteHex, size, selectedSticker]);

  function handleDownloadSvg() {
    const blob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
    downloadBlob(blob, `${selectedSticker.id}-${size}px.svg`);
  }

  return (
    <div className="flex flex-col">
      {/* Header: back, name, locate, close */}
      <div className="flex items-center gap-1 px-3 pb-1 pt-3 sm:px-4">
        <IconAction label="Back to library" onClick={backToGrid}>
          <ArrowLeft className="size-4" />
        </IconAction>
        <div className="min-w-0 flex-1 px-1">
          <Title className="truncate font-mono text-base font-semibold tracking-tight text-foreground">
            {selectedSticker.id}
          </Title>
          <p className="truncate text-[11px] text-muted-foreground">
            {selectedSticker.name} · {formatCategoryLabel(selectedSticker.category)}
          </p>
        </div>
        <IconAction label="Locate on canvas" onClick={() => locateOnCanvas(selectedSticker.id)}>
          <Compass className="size-4" />
        </IconAction>
        <IconAction label="Close" onClick={() => setOverlayOpen(false)}>
          <X className="size-3.5" />
        </IconAction>
      </div>
      <Description className="sr-only">
        Resize and recolor {selectedSticker.name}, then copy code or download SVG and PNG.
      </Description>

      <div className="flex flex-col gap-4 p-3 sm:p-4">
        {/* Live preview at the true selected size */}
        <div
          className={cn(
            "paper-dot-grid relative flex h-48 items-center justify-center rounded-2xl bg-[color:var(--scribble-paper)] ring-1 ring-inset ring-foreground/8 transition-[background-color] duration-200",
            darkPreview && "preview-dark",
          )}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => writePreviewTheme(darkPreview ? "light" : "dark")}
                aria-pressed={darkPreview}
                aria-label={darkPreview ? "Preview on light background" : "Preview on dark background"}
                className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-[color:var(--scribble-paper)] text-[color:var(--scribble-ink)] opacity-70 outline-none ring-1 ring-inset ring-foreground/10 micro-transition hover:opacity-100 active:scale-[0.92] focus-visible:ring-2 focus-visible:ring-ring"
              >
                {darkPreview ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{darkPreview ? "Light background" : "Dark background"}</p>
            </TooltipContent>
          </Tooltip>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={selectedSticker.id}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.85, rotate: -8 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
              transition={{ type: "spring", duration: 0.35, bounce: 0.3 }}
            >
              <Sticker
                def={selectedSticker}
                size={size}
                color={displayColor}
                className="drop-shadow-[0_6px_10px_rgba(0,0,0,0.08)] transition-[color] duration-200"
              />
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-1 px-0.5">
          <DetailRow icon={Ruler} label="Size">
            <input
              type="range"
              min={SIZE_RANGE.min}
              max={SIZE_RANGE.max}
              step={SIZE_RANGE.step}
              value={size}
              onChange={(event) => setSelectedSize(Number(event.target.value))}
              aria-label="Sticker size"
              aria-valuetext={`${size} pixels`}
              style={{ "--range-progress": `${sizeProgress}%` } as CSSProperties}
              className="trazo-range min-w-0 flex-1"
            />
            <span className="w-11 shrink-0 text-right font-mono text-[11px] tabular-nums text-muted-foreground">
              {size}px
            </span>
          </DetailRow>
          <DetailRow icon={Palette} label="Color">
            <div className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none]">
              <MiniPaletteBar />
            </div>
            <button
              type="button"
              onClick={() => void hexCopy.copy(concreteHex)}
              aria-label={`Copy color hex ${concreteHex}`}
              className="inline-flex shrink-0 items-center gap-1 rounded-md px-1 py-0.5 font-mono text-[11px] text-muted-foreground micro-transition hover:text-foreground"
            >
              {hexCopy.status === "copied" ? <Check className="size-3 text-success" /> : null}
              {concreteHex}
            </button>
          </DetailRow>
        </div>

        {/* Usage */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-0.5">
            <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <Code className="size-4" />
              Usage
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleDownloadSvg}
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-muted px-3 text-xs font-medium text-foreground micro-transition hover:bg-foreground/[0.08] active:scale-[0.96]"
              >
                <Download className="size-3.5" />
                SVG
              </button>
              <button
                type="button"
                onClick={() => void downloadStickerPng(selectedSticker, size, concreteHex)}
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-muted px-3 text-xs font-medium text-foreground micro-transition hover:bg-foreground/[0.08] active:scale-[0.96]"
              >
                <ImageDown className="size-3.5" />
                PNG
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl bg-muted/40 ring-1 ring-inset ring-foreground/8">
            <div className="flex items-center justify-between gap-2 border-b border-foreground/[0.07] px-1.5 py-1.5">
              <div role="tablist" aria-label="Code format" className="flex items-center gap-0.5">
                {(
                  [
                    { id: "react", label: "React" },
                    { id: "js", label: "JS" },
                  ] as const
                ).map((tab) => {
                  const isActive = codeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setCodeTab(tab.id)}
                      className={cn(
                        "relative rounded-full px-3 py-1 text-xs font-medium outline-none micro-transition focus-visible:ring-2 focus-visible:ring-ring",
                        isActive ? "text-background" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {isActive ? (
                        <motion.span
                          aria-hidden
                          layoutId="detail-code-tab"
                          transition={reduceMotion ? { duration: 0 } : highlightSpring}
                          className="absolute inset-0 rounded-full bg-foreground"
                        />
                      ) : null}
                      <span className="relative">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => void codeCopy.copy(codeSnippet)}
                aria-label="Copy code snippet"
                className="inline-flex h-7 items-center gap-1.5 rounded-full bg-background px-2.5 text-xs font-medium text-foreground ring-1 ring-inset ring-foreground/10 micro-transition hover:bg-muted active:scale-[0.96]"
              >
                {codeCopy.status === "copied" ? (
                  <Check className="size-3.5 text-success" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                {codeCopy.status === "copied" ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="palette-scroll overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed text-foreground">
              <code>{codeSnippet}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

function OverlayBody({
  Title,
  Description,
  isMobile,
}: {
  Title: SlotComponent;
  Description: SlotComponent;
  isMobile: boolean;
}) {
  const { overlayView } = useTrazo();
  const reduceMotion = useReducedMotion();
  const offset = overlayView === "grid" ? -12 : 12;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={overlayView}
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: offset }}
        animate={{ opacity: 1, x: 0 }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -offset }}
        transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
        className="min-h-0 min-w-0"
      >
        {overlayView === "grid" ? (
          <LibraryPalette Title={Title} Description={Description} isMobile={isMobile} />
        ) : (
          <StickerDetailView Title={Title} Description={Description} />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export function TrazoOverlay() {
  const { overlayOpen, setOverlayOpen, openLibraryGrid, overlayView } = useTrazo();
  const isMobile = useIsMobile();

  useEffect(() => {
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      const isToggle = event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey);
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

  if (isMobile) {
    return (
      <Drawer open={overlayOpen} onOpenChange={setOverlayOpen}>
        <DrawerContent
          onOpenAutoFocus={(event) => event.preventDefault()}
          className="pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        >
          <div className="min-h-0 overflow-y-auto pt-1">
            <OverlayBody Title={DrawerTitle} Description={DrawerDescription} isMobile />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={overlayOpen} onOpenChange={setOverlayOpen}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "top-[12dvh] max-h-[calc(88dvh-1.25rem)] translate-y-0 grid-cols-1 gap-0 overflow-x-hidden p-0 transition-[max-width] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] sm:p-0",
          overlayView === "grid" ? "max-w-[640px]" : "max-w-[480px]",
        )}
      >
        <OverlayBody Title={DialogTitle} Description={DialogDescription} isMobile={false} />
      </DialogContent>
    </Dialog>
  );
}
