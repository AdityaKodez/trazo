"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  findSticker,
  Sticker,
  toSvgString,
  trazoCatalog,
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
  JavaScriptLogo,
  Moon,
  Palette,
  ReactLogo,
  RotateCw,
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
import { RotationDial } from "@/components/trazo/rotation-dial";
import { findNearestStepIndex, SizeSlider } from "@/components/trazo/size-slider";
import {
  useTrazo,
  type CategoryFilter,
} from "@/components/trazo/trazo-experience";
import {
  paletteOptions,
  resolveStickerColor,
  type PaletteOption,
} from "@/config/palette";
import { useCopy } from "@/lib/use-copy";
import { useModKey } from "@/lib/use-mod-key";
import { usePreviewTheme, writePreviewTheme } from "@/lib/use-preview-theme";
import { cn } from "@/lib/utils";

const SIZE_STEPS = [16, 24, 32, 48, 64, 80, 96, 112, 128] as const;
type CodeTab = "react" | "js";

const CATEGORY_TABS: readonly {
  id: CategoryFilter;
  label: string;
  icon: StickerDef | undefined;
}[] = [
  { id: "all", label: "All", icon: findSticker("solid-star") },
  { id: "ocean", label: "Ocean", icon: findSticker("dolphin") },
  { id: "arrows", label: "Arrows", icon: findSticker("loop-arrow-orange") },
  { id: "nature", label: "Nature", icon: findSticker("flower-red") },
  { id: "hearts", label: "Hearts", icon: findSticker("heart-burst") },
  { id: "symbols", label: "Symbols", icon: findSticker("lightning-bolt") },
  { id: "cats", label: "Cats", icon: findSticker("hugging-cats") },
  { id: "characters", label: "Characters", icon: findSticker("little-green-alien") },
] as const;

const MIX_GRADIENT =
  "conic-gradient(from 0deg, #ef4444, #f97316, #eab308, #16a34a, #38bdf8, #2563eb, #ec4899, #ef4444)";
const highlightSpring = { type: "spring", stiffness: 700, damping: 45, mass: 0.5 } as const;
const LISTBOX_ID = "trazo-sticker-listbox";

type SlotComponent = ComponentType<{ className?: string; children: ReactNode }>;

function optionId(id: string) {
  return `trazo-sticker-${id}`;
}

function stickerColor(paletteId: ReturnType<typeof useTrazo>["paletteId"]) {
  return paletteId === "ink" ? "var(--scribble-ink)" : resolveStickerColor(paletteId);
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
      data-vaul-no-drag=""
      className="inline-flex w-full items-center justify-between gap-0.5 rounded-full bg-muted/50 p-1 ring-1 ring-inset ring-foreground/[0.08] sm:w-fit sm:justify-start"
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
            className="relative flex size-7 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring sm:size-6"
          >
            {isSelected ? (
              <motion.span
                aria-hidden
                layoutId="detail-swatch-selection"
                transition={reduceMotion ? { duration: 0 } : highlightSpring}
                className="absolute inset-0 rounded-full bg-background shadow-[0_1px_2px_rgba(0,0,0,0.08)] ring-[1.5px] ring-foreground/80"
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
                "relative block size-4 rounded-full ring-1 ring-inset ring-black/15 transition-transform duration-150 hover:scale-110 sm:size-3.5",
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
  concreteColor: string | undefined,
  rotate: number,
) {
  const scale = 2;
  const exportSize = size * scale;
  const svgMarkup = toSvgString(def, {
    size: exportSize,
    color: concreteColor,
    rotate,
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
      const suffix = rotate !== 0 ? `-${size}px-${rotate}deg` : `-${size}px`;
      downloadBlob(pngBlob, `${def.id}${suffix}.png`);
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
  const tabsRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tabFade, setTabFade] = useState({ left: false, right: false });

  useEffect(() => {
    const node = tabsRef.current;
    if (!node) return;

    const update = () => {
      const left = node.scrollLeft > 2;
      const right = node.scrollLeft + node.clientWidth < node.scrollWidth - 2;
      setTabFade((prev) => (prev.left === left && prev.right === right ? prev : { left, right }));
    };

    update();
    node.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(node);

    return () => {
      node.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, []);

  const tabMaskImage =
    tabFade.left && tabFade.right
      ? "linear-gradient(to right, transparent, black 24px, black calc(100% - 28px), transparent)"
      : tabFade.left
        ? "linear-gradient(to right, transparent, black 24px)"
        : tabFade.right
          ? "linear-gradient(to right, black calc(100% - 28px), transparent)"
          : undefined;

  const counts = useMemo(() => {
    const map: Record<CategoryFilter, number> = {
      all: trazoCatalog.length,
      ocean: 0,
      arrows: 0,
      nature: 0,
      hearts: 0,
      symbols: 0,
      cats: 0,
      characters: 0,
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
    <div className={cn("flex min-h-0 flex-1 flex-col", isMobile && "h-full")}>
      <Title className="sr-only">Sticker library</Title>
      <Description className="sr-only">
        Search {trazoCatalog.length} hand-drawn crayon stickers. Use arrow keys to move, Enter to
        open a sticker, and {modKey} Enter to locate it on the canvas.
      </Description>

      {/* Search row in outer tray */}
      <div className="flex shrink-0 items-center gap-2.5 px-3 pb-1.5 pt-0.5 sm:px-3.5">
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
          className="h-10 min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground/80 sm:h-11 sm:text-[15px]"
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
              className="flex size-8 items-center justify-center rounded-full text-muted-foreground micro-transition hover:bg-background/85 hover:text-foreground sm:size-7"
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

      {/* Inset white card for categories + sticker grid */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[16px] bg-background shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-inset ring-foreground/[0.07]">
        {/* Category chips */}
        <div
          ref={tabsRef}
          aria-label="Sticker categories"
          role="group"
          data-vaul-no-drag=""
          onWheel={(event) => {
            const node = event.currentTarget;
            if (node.scrollWidth <= node.clientWidth) return;
            if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
              node.scrollLeft += event.deltaY;
            }
          }}
          style={tabMaskImage ? { maskImage: tabMaskImage, WebkitMaskImage: tabMaskImage } : undefined}
          className="flex shrink-0 items-center gap-1 overflow-x-auto px-2.5 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-3.5"
        >
          {CATEGORY_TABS.map((tab) => {
            const isActive = activeCategory === tab.id;
            const tabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                aria-pressed={isActive}
                onClick={(event) => {
                  setActiveCategory(tab.id);
                  setHoveredId(null);
                  gridRef.current?.scrollTo({ top: 0 });
                  event.currentTarget.scrollIntoView({
                    inline: "nearest",
                    block: "nearest",
                    behavior: reduceMotion ? "auto" : "smooth",
                  });
                }}
                className={cn(
                  "group/tab relative inline-flex shrink-0 items-center gap-1.5 rounded-full py-1.5 pl-2 pr-2.5 text-xs font-medium outline-none micro-transition active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-ring",
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
                {tabIcon ? (
                  <span className="relative flex size-[18px] shrink-0 items-center justify-center">
                    <Sticker
                      def={tabIcon}
                      size={18}
                      color="mix"
                      className={cn(
                        "transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]",
                        !reduceMotion &&
                          (isActive
                            ? "-rotate-6 scale-110"
                            : "group-hover/tab:-rotate-6 group-hover/tab:scale-110"),
                      )}
                    />
                  </span>
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
            className={cn(
              "palette-scroll grid grid-cols-3 content-start gap-1.5 overflow-y-auto overscroll-contain px-2.5 pb-4 min-[420px]:grid-cols-4 sm:grid-cols-5 sm:gap-1 sm:px-3.5 sm:pb-3",
              isMobile ? "min-h-0 flex-1" : "min-h-0 max-h-[min(50dvh,400px)] flex-1",
            )}
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
                      color={stickerColor(paletteId)}
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
      </div>

      {/* Keyboard hint footer in outer tray */}
      {isMobile ? null : (
        <div className="flex shrink-0 items-center justify-between gap-3 px-3 pb-1 pt-2 text-[11px] text-muted-foreground">
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
  meta,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  meta?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 py-1 sm:min-h-9 sm:flex-row sm:items-center sm:gap-3 sm:py-0">
      <div className="flex items-center justify-between sm:w-20 sm:shrink-0">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Icon className="size-3.5" />
          {label}
        </span>
        {meta ? <div className="sm:hidden">{meta}</div> : null}
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {children}
        {meta ? <div className="hidden shrink-0 sm:flex">{meta}</div> : null}
      </div>
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
          className="flex size-8 items-center justify-center rounded-full text-muted-foreground outline-none micro-transition hover:bg-background/85 hover:text-foreground hover:shadow-[0_1px_2px_rgba(0,0,0,0.06)] active:scale-[0.92] focus-visible:ring-2 focus-visible:ring-ring"
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
    selectedRotation,
    setSelectedRotation,
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
  const nameCopy = useCopy();

  const concreteColor = resolveStickerColor(paletteId);
  const displayColor = stickerColor(paletteId);
  const size = SIZE_STEPS[findNearestStepIndex(SIZE_STEPS, selectedSize)];
  const rotation = Math.max(-180, Math.min(180, Math.round(selectedRotation)));

  const svgMarkup = useMemo(
    () =>
      toSvgString(selectedSticker, {
        size,
        color: concreteColor,
        rotate: rotation,
        title: selectedSticker.name,
      }),
    [concreteColor, rotation, size, selectedSticker],
  );

  const codeSnippet = useMemo(() => {
    if (codeTab === "react") {
      const props = [`size={${size}}`];
      if (concreteColor) {
        props.push(`color="${concreteColor}"`);
      }
      if (rotation !== 0) {
        props.push(`rotate={${rotation}}`);
      }

      const jsx =
        props.length === 1
          ? `<${selectedSticker.componentName} ${props[0]} />`
          : [
              `<${selectedSticker.componentName}`,
              ...props.map((prop) => `  ${prop}`),
              `/>`,
            ].join("\n");

      return [
        `import { ${selectedSticker.componentName} } from "trazo";`,
        ``,
        jsx,
      ].join("\n");
    }

    const optionLines = [`  size: ${size},`];
    if (concreteColor) {
      optionLines.push(`  color: "${concreteColor}",`);
    }
    if (rotation !== 0) {
      optionLines.push(`  rotate: ${rotation},`);
    }

    return [
      `import { findSticker, toSvgString } from "trazo/svg";`,
      ``,
      `const sticker = findSticker("${selectedSticker.id}")!;`,
      `const svg = toSvgString(sticker, {`,
      ...optionLines,
      `});`,
    ].join("\n");
  }, [codeTab, concreteColor, rotation, size, selectedSticker]);

  function handleDownloadSvg() {
    const blob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
    const suffix = rotation !== 0 ? `-${size}px-${rotation}deg` : `-${size}px`;
    downloadBlob(blob, `${selectedSticker.id}${suffix}.svg`);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Header in outer tray: back, name, locate, close */}
      <div className="flex shrink-0 items-center gap-1 px-1.5 pb-1.5 pt-0.5 sm:px-2">
        <IconAction label="Back to library" onClick={backToGrid}>
          <ArrowLeft className="size-4" />
        </IconAction>
        <div className="min-w-0 flex-1 px-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => void nameCopy.copy(selectedSticker.name)}
                aria-label={`Copy ${selectedSticker.name}`}
                className="group -ml-1.5 inline-flex max-w-full items-center gap-1.5 rounded-lg px-1.5 py-0.5 text-left outline-none micro-transition hover:bg-background/85 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Title className="truncate text-base font-semibold tracking-tight text-foreground">
                  {selectedSticker.name}
                </Title>
                {nameCopy.status === "copied" ? (
                  <Check className="size-3.5 shrink-0 text-success" />
                ) : null}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{nameCopy.status === "copied" ? "Copied" : "Copy"}</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <IconAction label="Locate on canvas" onClick={() => locateOnCanvas(selectedSticker.id)}>
          <Compass className="size-4" />
        </IconAction>
        <IconAction label="Close" onClick={() => setOverlayOpen(false)}>
          <X className="size-3.5" />
        </IconAction>
      </div>
      <Description className="sr-only">
        Resize, rotate, and recolor {selectedSticker.name}, then copy code or download SVG and PNG.
      </Description>

      {/* Inset white card for preview, controls & usage */}
      <div className="palette-scroll flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto rounded-[16px] bg-background p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-inset ring-foreground/[0.07] sm:gap-4 sm:p-4">
        {/* Live preview at the true selected size */}
        <div
          className={cn(
            "paper-dot-grid relative flex h-40 shrink-0 items-center justify-center rounded-xl bg-[color:var(--scribble-paper)] ring-1 ring-inset ring-foreground/8 transition-[background-color] duration-200 sm:h-48",
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
                rotate={rotation}
                className="drop-shadow-[0_6px_10px_rgba(0,0,0,0.08)] transition-[color] duration-200"
              />
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-2 px-0.5 sm:gap-1">
          <DetailRow
            icon={Ruler}
            label="Size"
            meta={
              <span className="w-11 shrink-0 text-right font-mono text-[11px] tabular-nums text-muted-foreground">
                {size}px
              </span>
            }
          >
            <SizeSlider
              steps={SIZE_STEPS}
              value={size}
              onChange={setSelectedSize}
              ariaLabel="Sticker size"
            />
          </DetailRow>
          <DetailRow
            icon={RotateCw}
            label="Rotate"
            meta={
              rotation !== 0 ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setSelectedRotation(0)}
                      aria-label="Reset rotation to 0 degrees"
                      className="w-11 shrink-0 rounded-md px-1.5 py-0.5 text-right font-mono text-[11px] tabular-nums text-foreground outline-none micro-transition hover:bg-muted/80 active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {rotation}°
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Reset to 0°</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <span className="w-11 shrink-0 text-right font-mono text-[11px] tabular-nums text-muted-foreground">
                  0°
                </span>
              )
            }
          >
            <RotationDial
              value={rotation}
              onChange={setSelectedRotation}
              ariaLabel="Sticker rotation"
            />
          </DetailRow>
          <DetailRow
            icon={Palette}
            label="Color"
            meta={
              concreteColor ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => void hexCopy.copy(concreteColor)}
                      aria-label={`Copy color hex ${concreteColor}`}
                      className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[11px] tabular-nums text-muted-foreground outline-none micro-transition hover:bg-muted/80 hover:text-foreground active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {hexCopy.status === "copied" ? <Check className="size-3 text-success" /> : null}
                      {concreteColor}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{hexCopy.status === "copied" ? "Copied" : "Copy hex"}</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                  Multi
                </span>
              )
            }
          >
            <div className="flex min-w-0 flex-1 items-center">
              <MiniPaletteBar />
            </div>
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
                onClick={() => void downloadStickerPng(selectedSticker, size, concreteColor, rotation)}
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-muted px-3 text-xs font-medium text-foreground micro-transition hover:bg-foreground/[0.08] active:scale-[0.96]"
              >
                <ImageDown className="size-3.5" />
                PNG
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-muted/65 p-1 ring-1 ring-inset ring-foreground/[0.08]">
            <div className="flex items-center justify-between gap-2 px-1 pb-1 pt-0.5">
              <div role="tablist" aria-label="Code format" className="flex items-center gap-0.5">
                {(
                  [
                    { id: "react", icon: ReactLogo, label: "React" },
                    { id: "js", icon: JavaScriptLogo, label: "JavaScript" },
                  ] as const
                ).map((tab) => {
                  const isActive = codeTab === tab.id;
                  const Logo = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setCodeTab(tab.id)}
                      className={cn(
                        "relative inline-flex h-7 items-center gap-1.5 rounded-[9px] px-2 text-xs font-medium outline-none micro-transition focus-visible:ring-2 focus-visible:ring-ring",
                        isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {isActive ? (
                        <motion.span
                          aria-hidden
                          layoutId="detail-code-tab"
                          transition={reduceMotion ? { duration: 0 } : highlightSpring}
                          className="absolute inset-0 rounded-[9px] bg-background shadow-[0_1px_2px_rgba(0,0,0,0.06)] ring-1 ring-inset ring-foreground/[0.08]"
                        />
                      ) : null}
                      <Logo
                        className={cn(
                          "relative size-3.5 shrink-0 transition-colors duration-150",
                          tab.id === "js" && "rounded-[2.5px]",
                          isActive ? "text-foreground/80" : "text-muted-foreground/75",
                        )}
                      />
                      <span className="relative">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => void codeCopy.copy(codeSnippet)}
                    aria-label={codeCopy.status === "copied" ? "Copied code snippet" : "Copy code snippet"}
                    className="inline-flex size-7 items-center justify-center rounded-[9px] text-muted-foreground outline-none micro-transition hover:bg-background/80 hover:text-foreground active:scale-[0.94] focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {codeCopy.status === "copied" ? (
                      <Check className="size-3.5 text-success" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{codeCopy.status === "copied" ? "Copied" : "Copy"}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div
              role="tabpanel"
              className="overflow-hidden rounded-[12px] bg-background shadow-[0_1px_2px_rgba(0,0,0,0.03)] ring-1 ring-inset ring-foreground/[0.07]"
            >
              <pre
                data-vaul-no-drag=""
                className="palette-scroll overflow-x-auto px-3.5 py-3 font-mono text-[12px] leading-[1.65] text-foreground/90 sm:px-4 sm:py-3.5 sm:text-[12.5px]"
              >
                <code>{codeSnippet}</code>
              </pre>
            </div>
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
        className="flex min-h-0 min-w-0 flex-1 flex-col"
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

  useEffect(() => {
    const timers = new Map<HTMLElement, number>();

    function handleScroll(event: Event) {
      const target = event.target;
      if (!(target instanceof HTMLElement) || !target.classList.contains("palette-scroll")) {
        return;
      }

      target.setAttribute("data-scrolling", "true");
      const existing = timers.get(target);
      if (existing !== undefined) {
        window.clearTimeout(existing);
      }

      const timer = window.setTimeout(() => {
        target.removeAttribute("data-scrolling");
        timers.delete(target);
      }, 700);
      timers.set(target, timer);
    }

    document.addEventListener("scroll", handleScroll, { capture: true, passive: true });
    return () => {
      document.removeEventListener("scroll", handleScroll, { capture: true });
      for (const [el, timer] of timers) {
        window.clearTimeout(timer);
        el.removeAttribute("data-scrolling");
      }
      timers.clear();
    };
  }, []);

  if (isMobile) {
    return (
      <Drawer open={overlayOpen} onOpenChange={setOverlayOpen}>
        <DrawerContent
          onOpenAutoFocus={(event) => event.preventDefault()}
          className={cn(
            "bg-[color-mix(in_oklab,var(--muted)_75%,var(--background))] px-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]",
            overlayView === "grid" ? "h-[84dvh]" : "max-h-[90dvh]",
          )}
        >
          <div className="flex min-h-0 flex-1 flex-col pt-1">
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
          "top-[12dvh] flex max-h-[calc(88dvh-1.25rem)] translate-y-0 flex-col gap-0 overflow-hidden rounded-[22px] bg-[color-mix(in_oklab,var(--muted)_75%,var(--background))] p-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_20px_50px_-14px_rgba(0,0,0,0.22)] ring-1 ring-inset ring-foreground/[0.08] transition-[max-width,--scrollbar-alpha] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] sm:p-1.5",
          overlayView === "grid" ? "max-w-[640px]" : "max-w-[480px]",
        )}
      >
        <OverlayBody Title={DialogTitle} Description={DialogDescription} isMobile={false} />
      </DialogContent>
    </Dialog>
  );
}
