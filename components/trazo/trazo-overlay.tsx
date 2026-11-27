"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { starfishDef } from "trazo/catalog/ocean";
import {
  toSvgString,
  type StickerDef,
  type StickerMeta,
} from "trazo/core";
import {
  STICKER_CATEGORY_COUNTS,
  STICKER_COUNT,
  trazoCatalogMeta,
} from "trazo/meta";
import { Sticker } from "trazo/scribble";

import {
  ArrowUpRight,
  Check,
  GitHubLogo,
  JavaScriptLogo,
  ReactLogo,
  SvelteLogo,
  VueLogo,
  X,
} from "@/components/trazo/icons";
import {
  ArrowLeft,
  ChevronDown,
  Code,
  Compass,
  Download,
  ImageDown,
  Moon,
  Palette,
  Pencil,
  RotateCw,
  Ruler,
  Search,
  Sparkles,
  Sun,
  Terminal,
} from "@/components/trazo/overlay-icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CopyCooldownFill,
  CopyStatusIcon,
} from "@/components/trazo/install-command";
import {
  overlayCardClass,
  overlayDialogClass,
  useIsMobile,
} from "@/components/trazo/overlay-layout";
import { RotationDial } from "@/components/trazo/rotation-dial";
import { findNearestStepIndex, SizeSlider } from "@/components/trazo/size-slider";
import {
  useTrazoActions,
  useTrazoCanvasState,
  useTrazoOverlayState,
  type CategoryFilter,
} from "@/components/trazo/trazo-experience";
import { getMessages } from "@/config/i18n/messages";
import { matchesStickerSearch } from "@/config/i18n/sticker-search";
import { getLocalizedStickerName } from "@/config/i18n/stickers";
import {
  findPaletteOption,
  paletteOptions,
  resolveStickerColor,
  type PaletteId,
  type PaletteOption,
} from "@/config/palette";
import { illustrationSkill, siteConfig } from "@/config/site";
import { preloadCopySound } from "@/lib/sound";
import type { StickerExportFormat } from "@/lib/sticker-export";
import {
  getLoadedSticker,
  loadAllCategories,
  loadCategories,
  useStickerLoaderVersion,
} from "@/lib/sticker-loader";
import { useCopy } from "@/lib/use-copy";
import { useLocale, type Locale } from "@/lib/use-locale";
import { useModKey } from "@/lib/use-mod-key";
import { usePreviewTheme, writePreviewTheme } from "@/lib/use-preview-theme";
import {
  dismissStarPrompt,
  markStarPromptStarred,
  useStarPromptStatus,
} from "@/lib/use-star-prompt";
import { cn } from "@/lib/utils";

const LazyOverlayMobileDrawer = dynamic(
  () =>
    import("@/components/trazo/overlay-mobile-drawer").then(
      (mod) => mod.OverlayMobileDrawer,
    ),
  { ssr: false },
);

const SIZE_STEPS = [16, 24, 32, 48, 64, 80, 96, 112, 128] as const;
type CodeTab = "react" | "vue" | "svelte" | "js";
type StarPromptVerbKey = "svg" | "png" | "copied" | "pack-svg" | "pack-png";

function resolveStarPromptVerb(
  key: StarPromptVerbKey | null,
  messages: ReturnType<typeof getMessages>,
): string | null {
  switch (key) {
    case "svg":
      return messages.detail.svgSavedVerb;
    case "png":
      return messages.detail.pngSavedVerb;
    case "copied":
      return messages.detail.copiedVerb;
    case "pack-svg":
      return messages.library.pack.packSavedVerb("svg");
    case "pack-png":
      return messages.library.pack.packSavedVerb("png");
    default:
      return null;
  }
}

const CATEGORY_TABS: readonly {
  id: CategoryFilter;
  iconId: string;
}[] = [
  { id: "all", iconId: "solid-star" },
  { id: "games", iconId: "game-coin" },
  { id: "ocean", iconId: "dolphin" },
  { id: "arrows", iconId: "loop-arrow-orange" },
  { id: "nature", iconId: "flower-red" },
  { id: "hearts", iconId: "heart-burst" },
  { id: "symbols", iconId: "lightning-bolt" },
  { id: "cats", iconId: "hugging-cats" },
  { id: "characters", iconId: "little-green-alien" },
  { id: "school", iconId: "yellow-pencil" },
  { id: "food", iconId: "pizza" },
] as const;

const CATEGORY_COUNTS: Readonly<Record<CategoryFilter, number>> = {
  all: STICKER_COUNT,
  ...STICKER_CATEGORY_COUNTS,
};

const MIX_GRADIENT =
  "conic-gradient(from 0deg, #ef4444, #f97316, #eab308, #16a34a, #38bdf8, #2563eb, #ec4899, #ef4444)";
const highlightSpring = { type: "spring", stiffness: 700, damping: 45, mass: 0.5 } as const;
const flipSpring = { type: "spring", stiffness: 420, damping: 24, mass: 0.55 } as const;
const LISTBOX_ID = "trazo-sticker-listbox";

const SKILL_EXAMPLES = [
  {
    id: "watering-can",
    name: "Watering can",
    className:
      "-rotate-12 group-hover/peek:-translate-y-1.5 group-hover/peek:-rotate-[15deg]",
  },
  {
    id: "snail",
    name: "Snail",
    className:
      "z-[1] -translate-y-0.5 rotate-3 group-hover/peek:-translate-y-2.5 group-hover/peek:rotate-0",
  },
  {
    id: "mushroom",
    name: "Mushroom",
    className:
      "-translate-y-1 -rotate-6 group-hover/peek:-translate-y-2 group-hover/peek:-rotate-12",
  },
  {
    id: "loop-arrow",
    name: "Loop arrow",
    className:
      "rotate-12 group-hover/peek:-translate-y-1.5 group-hover/peek:rotate-[15deg]",
  },
  {
    id: "butterfly",
    name: "Butterfly",
    className:
      "-translate-y-1.5 rotate-6 group-hover/peek:-translate-y-3 group-hover/peek:rotate-12",
  },
] as const;

type SlotComponent = ComponentType<{ className?: string; children: ReactNode }>;

function optionId(id: string) {
  return `trazo-sticker-${id}`;
}

function stickerColor(paletteId: PaletteId) {
  return paletteId === "ink" ? "var(--scribble-ink)" : resolveStickerColor(paletteId);
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

function MiniPaletteBar({
  paletteId,
  onSelect,
}: {
  paletteId: PaletteId;
  onSelect: (id: PaletteId) => void;
}) {
  const locale = useLocale();
  const messages = getMessages(locale);
  const reduceMotion = useReducedMotion();
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const current = paletteOptions.findIndex((item) => item.id === paletteId);
    let next: number;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = current + 1;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = current - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = paletteOptions.length - 1;
    else return;
    event.preventDefault();
    const index = (next + paletteOptions.length) % paletteOptions.length;
    onSelect(paletteOptions[index].id);
    buttonRefs.current[index]?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label={messages.detail.previewPaletteAriaLabel}
      onKeyDown={handleKeyDown}
      data-vaul-no-drag=""
      className="inline-flex w-full items-center justify-between gap-0.5 rounded-full bg-muted/50 p-1 ring-1 ring-inset ring-foreground/[0.08] sm:w-fit sm:justify-start"
    >
      {paletteOptions.map((option: PaletteOption, index) => {
        const isSelected = paletteId === option.id;
        const label = messages.palettes[option.id];
        return (
          <button
            key={option.id}
            ref={(node) => {
              buttonRefs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={isSelected}
            tabIndex={isSelected ? 0 : -1}
            aria-label={label}
            title={label}
            onClick={() => onSelect(option.id)}
            className="relative flex size-7 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring sm:size-6"
          >
            {isSelected ? (
              <m.span
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

function formatStarCount(count: number, locale: Locale): string {
  if (count >= 1000) {
    const compact = (count / 1000).toFixed(count >= 10000 ? 0 : 1);
    return `${compact.replace(/\.0$/, "")}k`;
  }
  const numberLocale = locale === "ja" ? "ja-JP" : locale === "zh-CN" ? "zh-CN" : "en-US";
  return count.toLocaleString(numberLocale);
}

async function downloadStickerPng(
  def: StickerDef,
  size: number,
  concreteColor: string | undefined,
  rotate: number,
): Promise<boolean> {
  const { downloadBlob, rasterizeStickerPng } = await import("@/lib/sticker-export");
  const pngBlob = await rasterizeStickerPng(def, {
    exportSize: size * 2,
    color: concreteColor,
    rotate,
  });
  if (pngBlob) {
    const suffix = rotate !== 0 ? `-${size}px-${rotate}deg` : `-${size}px`;
    downloadBlob(pngBlob, `${def.id}${suffix}.png`);
    return true;
  }
  return false;
}

function LibraryTileLabel({
  id,
  fallbackName,
  isActive,
}: {
  id: string;
  fallbackName: string;
  isActive: boolean;
}) {
  const locale = useLocale();
  const displayName = getLocalizedStickerName({ id, name: fallbackName }, locale);
  return (
    <span
      className={cn(
        "relative w-full truncate text-center text-[11px] font-medium transition-colors duration-150",
        isActive ? "text-foreground" : "text-muted-foreground",
      )}
    >
      {displayName}
    </span>
  );
}

function LibraryTileLocateButton({
  id,
  fallbackName,
  onLocate,
}: {
  id: string;
  fallbackName: string;
  onLocate: (id: string) => void;
}) {
  const locale = useLocale();
  const t = getMessages(locale).library;
  const displayName = getLocalizedStickerName({ id, name: fallbackName }, locale);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          tabIndex={-1}
          onClick={(event) => {
            event.stopPropagation();
            onLocate(id);
          }}
          aria-label={t.locateStickerAriaLabel(displayName)}
          className="absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-full text-foreground/60 micro-transition hover:bg-background hover:text-foreground hover:shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
        >
          <Compass className="size-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{t.locateOnCanvasTooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}

interface LibraryTileProps {
  item: StickerMeta;
  def: StickerDef | undefined;
  isActive: boolean;
  color: string | undefined;
  reduceMotion: boolean | null;
  onHover: (id: string) => void;
  onOpen: (id: string) => void;
  onLocate: (id: string) => void;
}

const LibraryTile = memo(function LibraryTile({
  item,
  def,
  isActive,
  color,
  reduceMotion,
  onHover,
  onOpen,
  onLocate,
}: LibraryTileProps) {
  return (
    <div
      id={optionId(item.id)}
      role="option"
      aria-selected={isActive}
      onPointerMove={() => onHover(item.id)}
      onClick={() => onOpen(item.id)}
      className="library-tile group relative flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl px-2 pb-2.5 pt-3.5 [content-visibility:auto] [contain-intrinsic-size:auto_108px]"
    >
      {isActive ? (
        <m.span
          aria-hidden
          layoutId="library-active-tile"
          transition={reduceMotion ? { duration: 0 } : highlightSpring}
          className="absolute inset-0 rounded-2xl bg-muted/80 ring-1 ring-inset ring-foreground/[0.06]"
        />
      ) : null}
      <span className="relative flex size-14 items-center justify-center">
        {def ? (
          <Sticker
            def={def}
            size={48}
            color={color}
            className={cn(
              "transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]",
              isActive && !reduceMotion && "-rotate-6 scale-110",
            )}
          />
        ) : (
          <span
            aria-hidden
            className="size-10 rounded-xl bg-muted/70"
          />
        )}
      </span>
      <LibraryTileLabel
        id={item.id}
        fallbackName={item.name}
        isActive={isActive}
      />
      {isActive ? (
        <LibraryTileLocateButton
          id={item.id}
          fallbackName={item.name}
          onLocate={onLocate}
        />
      ) : null}
    </div>
  );
});

function PackDownloadButton({
  stickers,
  activeCategory,
  searchQuery,
  paletteId,
  isMobile,
  onDownloaded,
}: {
  stickers: readonly StickerMeta[];
  activeCategory: CategoryFilter;
  searchQuery: string;
  paletteId: PaletteId;
  isMobile: boolean;
  onDownloaded: (format: StickerExportFormat) => void;
}) {
  const locale = useLocale();
  const messages = getMessages(locale);
  const t = messages.library.pack;
  const [format, setFormat] = useState<StickerExportFormat>("svg");
  const [menuOpen, setMenuOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "zipping" | "saved" | "error">("idle");
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const resetTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const count = stickers.length;
  const isZipping = status === "zipping";
  const isDisabled = count === 0 || isZipping;
  const hasSearch = searchQuery.trim().length > 0;
  const activeTabLabel = messages.categories[activeCategory];
  const scopeSlug = hasSearch ? "selection" : activeCategory;
  const scopeLabel = hasSearch
    ? t.matchesScope(count)
    : activeCategory === "all"
      ? t.allStickersScope(count)
      : t.categoryScope(activeTabLabel, count);
  const activePalette = findPaletteOption(paletteId);
  const PrimaryIcon = format === "svg" ? Download : ImageDown;

  const formatOptions: readonly {
    id: StickerExportFormat;
    label: string;
    description: string;
    icon: ComponentType<{ className?: string }>;
  }[] = [
    {
      id: "svg",
      label: t.svgPackLabel,
      description: t.svgPackDescription,
      icon: Download,
    },
    {
      id: "png",
      label: t.pngPackLabel,
      description: t.pngPackDescription,
      icon: ImageDown,
    },
  ];

  async function runDownload(selectedFormat: StickerExportFormat) {
    if (count === 0 || isZipping) return;
    setMenuOpen(false);
    setStatus("zipping");
    setProgress({ completed: 0, total: count });

    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }

    try {
      const neededCategories = new Set(stickers.map((item) => item.category));
      const [, { downloadStickerPackZip }] = await Promise.all([
        loadCategories(neededCategories),
        import("@/lib/sticker-export"),
      ]);

      const defs: StickerDef[] = [];
      for (const item of stickers) {
        const def = getLoadedSticker(item.id);
        if (def) defs.push(def);
      }

      if (defs.length === 0) {
        throw new Error("Stickers failed to load");
      }

      await downloadStickerPackZip({
        stickers: defs,
        format: selectedFormat,
        color: resolveStickerColor(paletteId),
        paletteId,
        scope: scopeSlug,
        onProgress: (completed, total) => {
          setProgress({ completed, total });
        },
      });

      setStatus("saved");
      onDownloaded(selectedFormat);
      resetTimerRef.current = window.setTimeout(() => {
        setStatus("idle");
        resetTimerRef.current = null;
      }, 1800);
    } catch {
      setStatus("error");
      resetTimerRef.current = window.setTimeout(() => {
        setStatus("idle");
        resetTimerRef.current = null;
      }, 2400);
    }
  }

  function handleSelectFormat(nextFormat: StickerExportFormat) {
    setFormat(nextFormat);
    void runDownload(nextFormat);
  }

  const tooltipLabel =
    count === 0 ? t.noMatchesTooltip : t.downloadTooltip(scopeLabel, format);

  return (
    <Popover open={menuOpen} onOpenChange={setMenuOpen}>
      <div
        role="group"
        aria-label={t.groupAriaLabel}
        data-vaul-no-drag=""
        className={cn(
          "inline-flex shrink-0 items-center overflow-hidden rounded-full bg-background text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.06)] ring-1 ring-inset ring-foreground/[0.09]",
          isMobile ? "h-8 text-xs" : "-my-1 h-7 text-[11px]",
        )}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              disabled={isDisabled}
              onClick={() => void runDownload(format)}
              aria-label={tooltipLabel}
              className="inline-flex h-full items-center gap-1.5 pl-2.5 pr-2 font-medium text-foreground outline-none micro-transition hover:bg-muted/80 active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            >
              {status === "zipping" ? (
                <>
                  <span
                    aria-hidden="true"
                    className="size-3 shrink-0 animate-spin rounded-full border-[1.75px] border-foreground/25 border-t-foreground"
                  />
                  <span className="tabular-nums">
                    {format === "png" && progress.total > 0
                      ? `${progress.completed}/${progress.total}`
                      : t.zipping}
                  </span>
                </>
              ) : status === "saved" ? (
                <>
                  <Check className="size-3.5 shrink-0 text-success" />
                  <span>{t.saved}</span>
                </>
              ) : status === "error" ? (
                <>
                  <X className="size-3 shrink-0 text-destructive" />
                  <span>{t.failed}</span>
                </>
              ) : (
                <>
                  <PrimaryIcon className="size-3.5 shrink-0" />
                  <span>{format === "svg" ? t.svgZipButton : t.pngZipButton}</span>
                  <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                    {count}
                  </span>
                </>
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{tooltipLabel}</p>
          </TooltipContent>
        </Tooltip>

        <span aria-hidden="true" className="h-3.5 w-px shrink-0 bg-foreground/12" />

        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={isDisabled}
            aria-label={t.chooseFormatAriaLabel}
            aria-expanded={menuOpen}
            className="flex h-full items-center justify-center px-1.5 text-muted-foreground outline-none micro-transition hover:bg-muted/80 hover:text-foreground active:scale-[0.94] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            <ChevronDown
              className={cn(
                "size-3.5 transition-transform duration-150",
                menuOpen && "rotate-180",
              )}
            />
          </button>
        </PopoverTrigger>
      </div>

      <PopoverContent
        side="top"
        align="end"
        sideOffset={8}
        data-vaul-no-drag=""
        className="z-[60] w-60 gap-1 rounded-2xl p-1.5"
      >
        <div className="flex items-center justify-between gap-2 px-2 pb-1 pt-0.5 text-[11px] text-muted-foreground">
          <span className="truncate font-medium text-foreground/85">{scopeLabel}</span>
          <span className="inline-flex shrink-0 items-center gap-1.5">
            <span
              aria-hidden="true"
              style={
                activePalette.kind === "mix"
                  ? { background: MIX_GRADIENT }
                  : activePalette.kind === "swatch"
                    ? { backgroundColor: activePalette.hex }
                    : undefined
              }
              className={cn(
                "block size-2.5 rounded-full ring-1 ring-inset ring-black/15",
                activePalette.kind === "ink" && "bg-[color:var(--scribble-ink)]",
              )}
            />
            <span className="truncate">
              {activePalette.kind === "mix"
                ? t.originalColorLabel
                : messages.palettes[activePalette.id]}
            </span>
          </span>
        </div>

        <div role="menu" aria-label={t.menuAriaLabel} className="flex flex-col gap-0.5">
          {formatOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = format === option.id;
            return (
              <button
                key={option.id}
                type="button"
                role="menuitemradio"
                aria-checked={isSelected}
                onClick={() => handleSelectFormat(option.id)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-xl px-2 py-2 text-left outline-none micro-transition hover:bg-muted/85 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring",
                  isSelected && "bg-muted/60",
                )}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-background text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.05)] ring-1 ring-inset ring-foreground/[0.08]">
                    <Icon className="size-3.5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-medium text-foreground">
                      {option.label}
                    </span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {option.description}
                    </span>
                  </span>
                </span>
                {isSelected ? <Check className="size-3.5 shrink-0 text-foreground" /> : null}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function LibraryPalette({
  Title,
  Description,
  isMobile,
  stars,
}: {
  Title: SlotComponent;
  Description: SlotComponent;
  isMobile: boolean;
  stars: number | null;
}) {
  const { paletteId } = useTrazoCanvasState();
  const { activeCategory, searchQuery } = useTrazoOverlayState();
  const {
    setActiveCategory,
    setSearchQuery,
    openStickerDetail,
    openAgentSkill,
    locateOnCanvas,
    setOverlayOpen,
  } = useTrazoActions();
  const locale = useLocale();
  const messages = getMessages(locale);
  const t = messages.library;
  const reduceMotion = useReducedMotion();
  const loaderVersion = useStickerLoaderVersion();
  const tileColor = stickerColor(paletteId);
  const modKey = useModKey();
  const gridRef = useRef<HTMLDivElement | null>(null);
  const tabsRef = useRef<HTMLDivElement | null>(null);
  const tabsInnerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tabFade, setTabFade] = useState({ left: false, right: false });
  const starPromptStatus = useStarPromptStatus();
  const [promptVerbKey, setPromptVerbKey] = useState<StarPromptVerbKey | null>(null);
  const [starPromptSeq, setStarPromptSeq] = useState(0);
  const [justStarred, setJustStarred] = useState(false);
  const starThankYouTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (starThankYouTimerRef.current !== null) {
        window.clearTimeout(starThankYouTimerRef.current);
      }
    };
  }, []);

  function revealStarPrompt(key: StarPromptVerbKey) {
    if (starPromptStatus !== "pending") return;
    setPromptVerbKey(key);
    setStarPromptSeq((seq) => seq + 1);
  }

  function handleStarClick() {
    markStarPromptStarred();
    setJustStarred(true);
    if (starThankYouTimerRef.current !== null) {
      window.clearTimeout(starThankYouTimerRef.current);
    }
    starThankYouTimerRef.current = window.setTimeout(() => {
      setJustStarred(false);
      setPromptVerbKey(null);
      starThankYouTimerRef.current = null;
    }, 1500);
  }

  function handleDismissStarPrompt() {
    dismissStarPrompt();
    setPromptVerbKey(null);
  }

  const promptVerb = resolveStarPromptVerb(promptVerbKey, messages);
  const showStarTray =
    (starPromptStatus === "pending" && promptVerbKey !== null) || justStarred;

  useEffect(() => {
    void loadAllCategories();
  }, []);

  useEffect(() => {
    const node = tabsRef.current;
    if (!node) return;
    const inner = tabsInnerRef.current;

    const update = () => {
      const left = node.scrollLeft > 2;
      const right = node.scrollLeft + node.clientWidth < node.scrollWidth - 2;
      setTabFade((prev) => (prev.left === left && prev.right === right ? prev : { left, right }));
    };

    update();
    const rafId = window.requestAnimationFrame(update);
    node.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(node);
    if (inner) {
      observer.observe(inner);
    }

    return () => {
      window.cancelAnimationFrame(rafId);
      node.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [locale]);

  const tabMaskImage =
    tabFade.left && tabFade.right
      ? "linear-gradient(to right, transparent, black 24px, black calc(100% - 28px), transparent)"
      : tabFade.left
        ? "linear-gradient(to right, transparent, black 24px)"
        : tabFade.right
          ? "linear-gradient(to right, black calc(100% - 28px), transparent)"
          : undefined;

  const filteredStickers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return trazoCatalogMeta.filter((item) => {
      if (activeCategory !== "all" && item.category !== activeCategory) {
        return false;
      }
      if (!q) return true;
      return matchesStickerSearch(item, q);
    });
  }, [activeCategory, searchQuery]);

  // Keep every option in the listbox for search and keyboard navigation.
  // Only mount heavy preview art within two rows of the scrollport.
  const [nearbyTiles, setNearbyTiles] = useState<ReadonlySet<string>>(() => new Set());
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      setNearbyTiles(previous => {
        const next = new Set(previous);
        for (const entry of entries) {
          if (entry.isIntersecting) next.add(entry.target.id);
          else next.delete(entry.target.id);
        }
        return next;
      });
    }, { root: grid, rootMargin: "200px 0px" });
    for (const tile of grid.children) observer.observe(tile);
    return () => observer.disconnect();
  }, [filteredStickers]);

  // Reference loaderVersion so newly loaded category chunks immediately paint
  void loaderVersion;

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
      <Title className="sr-only">{t.srTitle}</Title>
      <Description className="sr-only">
        {t.srDescription(STICKER_COUNT, modKey)}
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
          aria-label={t.searchAriaLabel}
          autoComplete="off"
          spellCheck={false}
          value={searchQuery}
          onChange={(event) => {
            setSearchQuery(event.target.value);
            setHoveredId(null);
          }}
          onKeyDown={handleInputKeyDown}
          placeholder={t.searchPlaceholder}
          className="h-10 min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground/80 sm:h-11 sm:text-[15px]"
        />
        <AnimatePresence initial={false}>
          {searchQuery ? (
            <m.button
              type="button"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.14 }}
              onClick={() => {
                setSearchQuery("");
                inputRef.current?.focus();
              }}
              aria-label={t.clearSearchAriaLabel}
              className="flex size-8 items-center justify-center rounded-full text-muted-foreground micro-transition hover:bg-background/85 hover:text-foreground sm:size-7"
            >
              <X className="size-3.5" />
            </m.button>
          ) : null}
        </AnimatePresence>
        <button
          type="button"
          onClick={() => setOverlayOpen(false)}
          aria-label={t.closeLibraryAriaLabel}
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
          aria-label={t.categoriesAriaLabel}
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
          className="shrink-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div
            ref={tabsInnerRef}
            className="flex w-max items-center gap-1 px-2.5 py-2.5 sm:px-3.5"
          >
            {CATEGORY_TABS.map((tab) => {
              const isActive = activeCategory === tab.id;
              const tabIcon = getLoadedSticker(tab.iconId);
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
                    <m.span
                      aria-hidden
                      layoutId="library-category-pill"
                      transition={reduceMotion ? { duration: 0 } : highlightSpring}
                      className="absolute inset-0 rounded-full bg-foreground"
                    />
                  ) : null}
                  <span className="relative flex size-[18px] shrink-0 items-center justify-center">
                    {tabIcon ? (
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
                    ) : null}
                  </span>
                  <span className="relative">{messages.categories[tab.id]}</span>
                  <span
                    className={cn(
                      "relative font-mono text-[10px] leading-none",
                      isActive ? "text-background/70" : "text-muted-foreground/70",
                    )}
                  >
                    {CATEGORY_COUNTS[tab.id]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sticker grid */}
        {filteredStickers.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 pb-12 pt-8 text-center">
            <p
              className={cn(
                "text-foreground",
                locale === "en"
                  ? "font-hand text-[19px] font-semibold leading-tight tracking-[-0.015em]"
                  : "text-base font-semibold",
              )}
            >
              {t.emptyTitle}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {t.emptyPrefix}
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("all");
                  inputRef.current?.focus();
                }}
                className="font-medium text-foreground underline decoration-foreground/30 underline-offset-2 hover:decoration-foreground"
              >
                {t.resetFilters}
              </button>
              {t.emptyOr}
              <button
                type="button"
                onClick={openAgentSkill}
                className="font-medium text-foreground underline decoration-foreground/30 underline-offset-2 hover:decoration-foreground"
              >
                {t.drawWithSkill}
              </button>
              {t.emptySuffix}
            </p>
          </div>
        ) : (
          <div
            ref={gridRef}
            id={LISTBOX_ID}
            role="listbox"
            aria-label={t.stickersListboxAriaLabel}
            className={cn(
              "palette-scroll grid grid-cols-3 content-start gap-1.5 overflow-y-auto overscroll-contain px-2.5 pb-4 min-[420px]:grid-cols-4 sm:grid-cols-5 sm:gap-1 sm:px-3.5 sm:pb-3",
              isMobile ? "min-h-0 flex-1" : "min-h-0 max-h-[min(50dvh,400px)] flex-1",
            )}
          >
            {filteredStickers.map((item, index) => {
              const renderPreview = index < 15 || item.id === activeId ||
                nearbyTiles.has(optionId(item.id)) || typeof IntersectionObserver === "undefined";
              return (
                <LibraryTile
                  key={item.id}
                  item={item}
                  def={renderPreview ? getLoadedSticker(item.id) : undefined}
                  isActive={item.id === activeId}
                  color={tileColor}
                  reduceMotion={reduceMotion}
                  onHover={setHoveredId}
                  onOpen={openStickerDetail}
                  onLocate={locateOnCanvas}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Footer in outer tray: keyboard hints, agent skill, pack zip download */}
      <div
        className={cn(
          "flex shrink-0 items-center justify-between gap-3 text-muted-foreground",
          isMobile ? "px-1 pt-1.5 text-xs" : "px-3 pb-1 pt-2 text-[11px]",
        )}
      >
        {isMobile ? null : (
          <div className="flex items-center gap-3.5">
            <span className="flex items-center gap-1.5">
              <span className="flex gap-0.5">
                <Kbd>←</Kbd>
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd>
                <Kbd>→</Kbd>
              </span>
              {t.hintMove}
            </span>
            <span className="flex items-center gap-1.5">
              <Kbd>↵</Kbd> {t.hintOpen}
            </span>
            <span className="flex items-center gap-1.5">
              <Kbd>{modKey} ↵</Kbd> {t.hintLocate}
            </span>
          </div>
        )}
        <div
          className={cn(
            "flex items-center gap-2",
            isMobile && "flex-1 justify-between",
          )}
        >
          <button
            type="button"
            onClick={openAgentSkill}
            className={cn(
              "group/skill inline-flex items-center gap-1.5 rounded-lg font-medium text-foreground/80 outline-none micro-transition hover:bg-background/85 hover:text-foreground active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-ring",
              isMobile ? "h-8 px-2" : "-my-1 h-7 px-2",
            )}
          >
            <Pencil
              aria-hidden="true"
              className="size-3.5 shrink-0 transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover/skill:-rotate-12"
            />
            {t.agentSkillButton}
          </button>
          <PackDownloadButton
            stickers={filteredStickers}
            activeCategory={activeCategory}
            searchQuery={searchQuery}
            paletteId={paletteId}
            isMobile={isMobile}
            onDownloaded={(fmt) => revealStarPrompt(fmt === "svg" ? "pack-svg" : "pack-png")}
          />
        </div>
      </div>

      {/* Expanding outer-tray GitHub star prompt after pack download */}
      <AnimatePresence initial={false}>
        {showStarTray ? (
          <m.div
            key="library-star-tray"
            initial={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduceMotion ? { opacity: 1 } : { height: "auto", opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
            className="shrink-0 overflow-hidden"
          >
            <div
              role="status"
              aria-live="polite"
              className="mt-1 flex items-center justify-between gap-2 border-t border-foreground/[0.07] px-2 pb-0.5 pt-2 sm:px-3"
            >
              <div className="flex min-w-0 items-center gap-2">
                <m.span
                  key={starPromptSeq}
                  aria-hidden
                  initial={reduceMotion ? false : { rotate: -6, scale: 0.88 }}
                  animate={
                    reduceMotion
                      ? { rotate: -6, scale: 1 }
                      : {
                          rotate: [-6, -18, 10, -10, -6],
                          scale: [0.9, 1.12, 1.08, 1.02, 1],
                        }
                  }
                  transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                  className="flex size-5 shrink-0 items-center justify-center"
                >
                  <Sticker def={starfishDef} size={20} />
                </m.span>
                <span className="truncate text-xs text-muted-foreground">
                  {justStarred ? (
                    <span className="font-medium text-foreground">{t.starPrompt.thanks}</span>
                  ) : (
                    <>
                      <span className="font-medium text-foreground">{promptVerb}</span>{" "}
                      <span>{t.starPrompt.enjoying}</span>
                    </>
                  )}
                </span>
              </div>

              {!justStarred ? (
                <div className="flex shrink-0 items-center gap-1">
                  <StarTrayButton stars={stars} onClick={handleStarClick} />
                  <button
                    type="button"
                    onClick={handleDismissStarPrompt}
                    aria-label={t.starPrompt.dismissAriaLabel}
                    className="flex size-7 items-center justify-center rounded-full text-muted-foreground outline-none micro-transition hover:bg-background/85 hover:text-foreground active:scale-[0.92] focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ) : null}
            </div>
          </m.div>
        ) : null}
      </AnimatePresence>
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

function StarTrayButton({
  stars,
  onClick,
}: {
  stars: number | null;
  onClick: () => void;
}) {
  const locale = useLocale();
  const messages = getMessages(locale);
  const reduceMotion = useReducedMotion();
  const [flipped, setFlipped] = useState(false);

  return (
    <a
      href={siteConfig.github}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      onPointerEnter={() => setFlipped(true)}
      onPointerLeave={() => setFlipped(false)}
      onFocus={() => setFlipped(true)}
      onBlur={() => setFlipped(false)}
      aria-label={messages.topBar.starAriaLabel(stars)}
      className={cn(
        "group inline-flex h-7 items-center gap-1.5 rounded-full bg-background pl-2 text-xs font-medium text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.06)] ring-1 ring-inset ring-foreground/[0.09] outline-none micro-transition hover:ring-foreground/20 active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-ring",
        stars !== null ? "pr-1" : "pr-2.5",
      )}
    >
      <span
        aria-hidden
        className="relative flex size-[18px] shrink-0 items-center justify-center [perspective:260px]"
      >
        {reduceMotion ? (
          flipped ? (
            <Sticker def={starfishDef} size={18} className="-rotate-6" />
          ) : (
            <GitHubLogo className="size-3.5 text-foreground" />
          )
        ) : (
          <m.span
            animate={{
              rotateY: flipped ? 180 : 0,
              scale: flipped ? 1.1 : 1,
            }}
            transition={flipSpring}
            className="relative flex size-full items-center justify-center [transform-style:preserve-3d]"
          >
            <span className="absolute inset-0 flex items-center justify-center [backface-visibility:hidden]">
              <GitHubLogo className="size-3.5 text-foreground" />
            </span>
            <span className="absolute inset-0 flex items-center justify-center [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <Sticker def={starfishDef} size={18} className="-rotate-6" />
            </span>
          </m.span>
        )}
      </span>
      <span>{messages.library.starPrompt.starButton}</span>
      {stars !== null ? (
        <span className="inline-flex h-5 items-center rounded-full bg-muted px-1.5 font-mono text-[11px] tabular-nums text-muted-foreground transition-colors duration-150 group-hover:text-foreground">
          {formatStarCount(stars, locale)}
        </span>
      ) : null}
    </a>
  );
}

function StickerDetailView({
  Title,
  Description,
  stars,
}: {
  Title: SlotComponent;
  Description: SlotComponent;
  stars: number | null;
}) {
  const { paletteId: canvasPaletteId } = useTrazoCanvasState();
  const {
    selectedStickerMeta,
    selectedSticker,
    selectedSize,
    selectedRotation,
  } = useTrazoOverlayState();
  const [paletteOverrides, setPaletteOverrides] = useState<
    Partial<Record<string, PaletteId>>
  >({});
  const paletteId = paletteOverrides[selectedStickerMeta.id] ?? canvasPaletteId;
  const {
    setSelectedSize,
    setSelectedRotation,
    backToGrid,
    locateOnCanvas,
    setOverlayOpen,
  } = useTrazoActions();
  const locale = useLocale();
  const messages = getMessages(locale);
  const t = messages.detail;
  const starPromptCopy = messages.library.starPrompt;
  const displayName = getLocalizedStickerName(selectedStickerMeta, locale);
  const reduceMotion = useReducedMotion();
  const [codeTab, setCodeTab] = useState<CodeTab>("react");
  const previewTheme = usePreviewTheme();
  const darkPreview = previewTheme === "dark";
  const codeCopy = useCopy({ sound: true });
  const hexCopy = useCopy();
  const nameCopy = useCopy();
  const starPromptStatus = useStarPromptStatus();
  const [promptVerbKey, setPromptVerbKey] = useState<StarPromptVerbKey | null>(null);
  const [starPromptSeq, setStarPromptSeq] = useState(0);
  const [justStarred, setJustStarred] = useState(false);
  const starThankYouTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (starThankYouTimerRef.current !== null) {
        window.clearTimeout(starThankYouTimerRef.current);
      }
    };
  }, []);

  function revealStarPrompt(key: StarPromptVerbKey) {
    if (starPromptStatus !== "pending") return;
    setPromptVerbKey(key);
    setStarPromptSeq((seq) => seq + 1);
  }

  function handleStarClick() {
    markStarPromptStarred();
    setJustStarred(true);
    if (starThankYouTimerRef.current !== null) {
      window.clearTimeout(starThankYouTimerRef.current);
    }
    starThankYouTimerRef.current = window.setTimeout(() => {
      setJustStarred(false);
      setPromptVerbKey(null);
      starThankYouTimerRef.current = null;
    }, 1500);
  }

  function handleDismissStarPrompt() {
    dismissStarPrompt();
    setPromptVerbKey(null);
  }

  const promptVerb = resolveStarPromptVerb(promptVerbKey, messages);
  const showStarTray =
    (starPromptStatus === "pending" && promptVerbKey !== null) || justStarred;

  const concreteColor = resolveStickerColor(paletteId);
  const displayColor = stickerColor(paletteId);
  const size = SIZE_STEPS[findNearestStepIndex(SIZE_STEPS, selectedSize)];
  const rotation = Math.max(-180, Math.min(180, Math.round(selectedRotation)));

  const svgMarkup = useMemo(
    () =>
      selectedSticker
        ? toSvgString(selectedSticker, {
            size,
            color: concreteColor,
            rotate: rotation,
            title: selectedSticker.name,
          })
        : "",
    [concreteColor, rotation, size, selectedSticker],
  );

  const codeSnippet = useMemo(() => {
    if (codeTab !== "js") {
      const isVue = codeTab === "vue";
      const { componentName } = selectedStickerMeta;
      const props = [isVue ? `:size="${size}"` : `size={${size}}`];
      if (concreteColor) {
        props.push(`color="${concreteColor}"`);
      }
      if (rotation !== 0) {
        props.push(isVue ? `:rotate="${rotation}"` : `rotate={${rotation}}`);
      }

      const component =
        props.length === 1
          ? `<${componentName} ${props[0]} />`
          : [
              `<${componentName}`,
              ...props.map((prop) => `  ${prop}`),
              `/>`,
            ].join("\n");

      const entry = codeTab === "react" ? "" : `/${codeTab}`;
      const importLine = `import { ${componentName} } from "trazo-stickers${entry}";`;
      if (codeTab === "svelte") {
        return ["<script>", `  ${importLine}`, "</script>", "", component].join("\n");
      }
      return isVue
        ? [
            "<script setup>",
            importLine,
            "</script>",
            "",
            "<template>",
            ...component.split("\n").map((line) => `  ${line}`),
            "</template>",
          ].join("\n")
        : [importLine, "", component].join("\n");
    }

    const optionLines = [`  size: ${size},`];
    if (concreteColor) {
      optionLines.push(`  color: "${concreteColor}",`);
    }
    if (rotation !== 0) {
      optionLines.push(`  rotate: ${rotation},`);
    }

    return [
      `import { findSticker, toSvgString } from "trazo-stickers/svg";`,
      ``,
      `const sticker = findSticker("${selectedStickerMeta.id}")!;`,
      `const svg = toSvgString(sticker, {`,
      ...optionLines,
      `});`,
    ].join("\n");
  }, [codeTab, concreteColor, rotation, size, selectedStickerMeta]);

  async function handleDownloadSvg() {
    if (!selectedSticker || !svgMarkup) return;
    const { downloadBlob } = await import("@/lib/sticker-export");
    const blob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
    const suffix = rotation !== 0 ? `-${size}px-${rotation}deg` : `-${size}px`;
    downloadBlob(blob, `${selectedSticker.id}${suffix}.svg`);
    revealStarPrompt("svg");
  }

  async function handleDownloadPng() {
    if (!selectedSticker) return;
    try {
      const saved = await downloadStickerPng(selectedSticker, size, concreteColor, rotation);
      if (saved) {
        revealStarPrompt("png");
      }
    } catch {
      // Ignore rasterization errors so we do not falsely announce a saved PNG.
    }
  }

  async function handleCopyCode() {
    const copied = await codeCopy.copy(codeSnippet);
    if (copied) {
      revealStarPrompt("copied");
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Header in outer tray: back, name, locate, close */}
      <div className="flex shrink-0 items-center gap-1 px-1.5 pb-1.5 pt-0.5 sm:px-2">
        <IconAction label={t.backToLibrary} onClick={backToGrid}>
          <ArrowLeft className="size-4" />
        </IconAction>
        <div className="min-w-0 flex-1 px-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => void nameCopy.copy(displayName)}
                aria-label={t.copyNameAriaLabel(displayName)}
                className="group -ml-1.5 inline-flex max-w-full items-center gap-1.5 rounded-lg px-1.5 py-0.5 text-left outline-none micro-transition hover:bg-background/85 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Title className="truncate text-base font-semibold tracking-tight text-foreground">
                  {displayName}
                </Title>
                {nameCopy.status === "copied" ? (
                  <Check className="size-3.5 shrink-0 text-success" />
                ) : null}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{nameCopy.status === "copied" ? t.copiedTooltip : t.copyTooltip}</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <IconAction label={t.locateOnCanvas} onClick={() => locateOnCanvas(selectedStickerMeta.id)}>
          <Compass className="size-4" />
        </IconAction>
        <IconAction label={t.close} onClick={() => setOverlayOpen(false)}>
          <X className="size-3.5" />
        </IconAction>
      </div>
      <Description className="sr-only">
        {t.srDescription(displayName)}
      </Description>

      {/* Inset white card for preview, controls & usage */}
      <div className={overlayCardClass}>
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
                aria-label={darkPreview ? t.previewLightAriaLabel : t.previewDarkAriaLabel}
                className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-[color:var(--scribble-paper)] text-[color:var(--scribble-ink)] opacity-70 outline-none ring-1 ring-inset ring-foreground/10 micro-transition hover:opacity-100 active:scale-[0.92] focus-visible:ring-2 focus-visible:ring-ring"
              >
                {darkPreview ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{darkPreview ? t.lightBackgroundTooltip : t.darkBackgroundTooltip}</p>
            </TooltipContent>
          </Tooltip>
          <AnimatePresence mode="popLayout" initial={false}>
            <m.span
              key={selectedStickerMeta.id}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.85, rotate: -8 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
              transition={{ type: "spring", duration: 0.35, bounce: 0.3 }}
            >
              {selectedSticker ? (
                <Sticker
                  def={selectedSticker}
                  size={size}
                  color={displayColor}
                  rotate={rotation}
                  className="drop-shadow-[0_6px_10px_rgba(0,0,0,0.08)] transition-[color] duration-200"
                />
              ) : (
                <span
                  aria-hidden
                  style={{ width: size, height: size }}
                  className="block animate-pulse rounded-2xl bg-muted/70"
                />
              )}
            </m.span>
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-2 px-0.5 sm:gap-1">
          <DetailRow
            icon={Ruler}
            label={t.sizeLabel}
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
              ariaLabel={t.sizeAriaLabel}
              formatValueText={t.pixelsValueText}
            />
          </DetailRow>
          <DetailRow
            icon={RotateCw}
            label={t.rotateLabel}
            meta={
              rotation !== 0 ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setSelectedRotation(0)}
                      aria-label={t.resetRotationAriaLabel}
                      className="w-11 shrink-0 rounded-md px-1.5 py-0.5 text-right font-mono text-[11px] tabular-nums text-foreground outline-none micro-transition hover:bg-muted/80 active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {rotation}°
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t.resetRotationTooltip}</p>
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
              ariaLabel={t.rotateAriaLabel}
              rotateCcwAriaLabel={t.rotateCcwAriaLabel}
              rotateCcwTooltip={t.rotateCcwTooltip}
              rotateCwAriaLabel={t.rotateCwAriaLabel}
              rotateCwTooltip={t.rotateCwTooltip}
              formatValueText={t.degreesValueText}
            />
          </DetailRow>
          <DetailRow
            icon={Palette}
            label={t.colorLabel}
            meta={
              concreteColor ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => void hexCopy.copy(concreteColor)}
                      aria-label={t.copyHexAriaLabel(concreteColor)}
                      className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[11px] tabular-nums text-muted-foreground outline-none micro-transition hover:bg-muted/80 hover:text-foreground active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {hexCopy.status === "copied" ? <Check className="size-3 text-success" /> : null}
                      {concreteColor}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{hexCopy.status === "copied" ? t.copiedTooltip : t.copyHexTooltip}</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                  {t.originalLabel}
                </span>
              )
            }
          >
            <div className="flex min-w-0 flex-1 items-center">
              <MiniPaletteBar
                paletteId={paletteId}
                onSelect={(nextId) =>
                  setPaletteOverrides((prev) => ({
                    ...prev,
                    [selectedStickerMeta.id]: nextId,
                  }))
                }
              />
            </div>
          </DetailRow>
        </div>

        {/* Usage */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-0.5">
            <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <Code className="size-4" />
              {t.usageLabel}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={!selectedSticker}
                onClick={() => void handleDownloadSvg()}
                aria-label={t.downloadSvgAriaLabel}
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-muted px-3 text-xs font-medium text-foreground micro-transition hover:bg-foreground/[0.08] active:scale-[0.96] disabled:opacity-50"
              >
                <Download className="size-3.5" />
                SVG
              </button>
              <button
                type="button"
                disabled={!selectedSticker}
                onClick={() => void handleDownloadPng()}
                aria-label={t.downloadPngAriaLabel}
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-muted px-3 text-xs font-medium text-foreground micro-transition hover:bg-foreground/[0.08] active:scale-[0.96] disabled:opacity-50"
              >
                <ImageDown className="size-3.5" />
                PNG
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-muted/65 p-1 ring-1 ring-inset ring-foreground/[0.08]">
            <div className="flex items-center justify-between gap-2 px-1 pb-1 pt-0.5">
              <div role="tablist" aria-label={t.codeFormatAriaLabel} className="flex items-center gap-0.5">
                {(
                  [
                    { id: "react", icon: ReactLogo, label: "React" },
                    { id: "vue", icon: VueLogo, label: "Vue" },
                    { id: "svelte", icon: SvelteLogo, label: "Svelte" },
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
                      aria-label={tab.label}
                      aria-selected={isActive}
                      onClick={() => setCodeTab(tab.id)}
                      className={cn(
                        "relative inline-flex h-7 items-center gap-1.5 rounded-[9px] px-2 text-xs font-medium outline-none micro-transition focus-visible:ring-2 focus-visible:ring-ring",
                        isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {isActive ? (
                        <m.span
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
                      {isActive ? <span className="relative">{tab.label}</span> : null}
                    </button>
                  );
                })}
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onPointerEnter={preloadCopySound}
                    onFocus={preloadCopySound}
                    onClick={() => {
                      if (codeCopy.isCoolingDown) return;
                      void handleCopyCode();
                    }}
                    aria-disabled={codeCopy.isCoolingDown || undefined}
                    aria-label={codeCopy.status === "copied" ? t.copiedCodeAriaLabel : t.copyCodeAriaLabel}
                    className={cn(
                      "relative inline-flex size-7 items-center justify-center overflow-hidden rounded-[9px] text-muted-foreground outline-none micro-transition focus-visible:ring-2 focus-visible:ring-ring",
                      codeCopy.isCoolingDown
                        ? "cursor-default bg-background/80 text-foreground"
                        : "hover:bg-background/80 hover:text-foreground active:scale-[0.94]",
                    )}
                  >
                    <CopyCooldownFill
                      active={codeCopy.isCoolingDown}
                      triggerKey={codeCopy.copySeq}
                    />
                    <CopyStatusIcon
                      status={codeCopy.status}
                      triggerKey={codeCopy.copySeq}
                      copiedClassName="text-background"
                      className="z-10"
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {codeCopy.status === "copied"
                      ? t.copiedTooltip
                      : codeCopy.status === "error"
                        ? t.copyFailedTooltip
                        : t.copyTooltip}
                  </p>
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

      {/* Expanding outer-tray GitHub star prompt after export/copy */}
      <AnimatePresence initial={false}>
        {showStarTray ? (
          <m.div
            key="detail-star-tray"
            initial={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduceMotion ? { opacity: 1 } : { height: "auto", opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
            className="shrink-0 overflow-hidden"
          >
            <div
              role="status"
              aria-live="polite"
              className="flex items-center justify-between gap-2 px-2 pb-0.5 pt-2 sm:px-2.5"
            >
              <div className="flex min-w-0 items-center gap-2">
                <m.span
                  key={starPromptSeq}
                  aria-hidden
                  initial={reduceMotion ? false : { rotate: -6, scale: 0.88 }}
                  animate={
                    reduceMotion
                      ? { rotate: -6, scale: 1 }
                      : {
                          rotate: [-6, -18, 10, -10, -6],
                          scale: [0.9, 1.12, 1.08, 1.02, 1],
                        }
                  }
                  transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                  className="flex size-5 shrink-0 items-center justify-center"
                >
                  <Sticker def={starfishDef} size={20} />
                </m.span>
                <span className="truncate text-xs text-muted-foreground">
                  {justStarred ? (
                    <span className="font-medium text-foreground">{starPromptCopy.thanks}</span>
                  ) : (
                    <>
                      <span className="font-medium text-foreground">{promptVerb}</span>{" "}
                      <span>{starPromptCopy.enjoying}</span>
                    </>
                  )}
                </span>
              </div>

              {!justStarred ? (
                <div className="flex shrink-0 items-center gap-1">
                  <StarTrayButton stars={stars} onClick={handleStarClick} />
                  <button
                    type="button"
                    onClick={handleDismissStarPrompt}
                    aria-label={starPromptCopy.dismissAriaLabel}
                    className="flex size-7 items-center justify-center rounded-full text-muted-foreground outline-none micro-transition hover:bg-background/85 hover:text-foreground active:scale-[0.92] focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ) : null}
            </div>
          </m.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function SkillCopyButton({
  value,
  copyState,
  idleLabel,
  copiedLabel,
  copyTooltip,
  copiedTooltip,
  copyFailedTooltip,
}: {
  value: string;
  copyState: ReturnType<typeof useCopy>;
  idleLabel: string;
  copiedLabel: string;
  copyTooltip: string;
  copiedTooltip: string;
  copyFailedTooltip: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onPointerEnter={preloadCopySound}
          onFocus={preloadCopySound}
          onClick={() => {
            if (copyState.isCoolingDown) return;
            void copyState.copy(value);
          }}
          aria-disabled={copyState.isCoolingDown || undefined}
          aria-label={copyState.status === "copied" ? copiedLabel : idleLabel}
          className={cn(
            "relative inline-flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-[9px] text-muted-foreground outline-none micro-transition focus-visible:ring-2 focus-visible:ring-ring",
            copyState.isCoolingDown
              ? "cursor-default bg-background/80 text-foreground"
              : "hover:bg-background/80 hover:text-foreground active:scale-[0.94]",
          )}
        >
          <CopyCooldownFill
            active={copyState.isCoolingDown}
            triggerKey={copyState.copySeq}
          />
          <CopyStatusIcon
            status={copyState.status}
            triggerKey={copyState.copySeq}
            copiedClassName="text-background"
            className="z-10"
          />
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p>
          {copyState.status === "copied"
            ? copiedTooltip
            : copyState.status === "error"
              ? copyFailedTooltip
              : copyTooltip}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

function AgentSkillView({
  Title,
  Description,
  isMobile,
}: {
  Title: SlotComponent;
  Description: SlotComponent;
  isMobile: boolean;
}) {
  const { backToGrid, setOverlayOpen } = useTrazoActions();
  const locale = useLocale();
  const messages = getMessages(locale);
  const t = messages.skill;
  const detailCopy = messages.detail;
  const installCopy = useCopy({ sound: true });
  const promptCopy = useCopy({ sound: true });

  const [commandPrefix, skillFlag] = illustrationSkill.command.split(" --skill ");
  const examplePromptText = t.examplePromptText || illustrationSkill.prompt;
  const skillMention = `$${illustrationSkill.name}`;
  const mentionIndex = examplePromptText.indexOf(skillMention);
  const hasMention = mentionIndex !== -1;
  const promptPrefix = hasMention ? examplePromptText.slice(0, mentionIndex) : "";
  const promptSuffix = hasMention
    ? examplePromptText.slice(mentionIndex + skillMention.length)
    : "";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Header in outer tray: back, title + peeking stickers, close */}
      <div className="relative z-0 flex shrink-0 items-center gap-1 px-1.5 pb-1.5 pt-0.5 max-[400px]:items-start sm:px-2">
        <IconAction label={detailCopy.backToLibrary} onClick={backToGrid}>
          <ArrowLeft className="size-4" />
        </IconAction>
        <div className="flex min-w-0 flex-1 items-center gap-2 px-1 max-[400px]:flex-wrap max-[400px]:gap-y-0">
          <Title className="min-w-0 truncate text-base font-semibold tracking-tight text-foreground max-[400px]:w-full">
            {t.title}
          </Title>
          <div
            aria-label={t.exampleStickersAriaLabel}
            role="group"
            className="group/peek relative -my-2.5 ml-auto flex shrink-0 translate-y-[12px] items-end -space-x-3.5 pr-0.5 max-[400px]:my-0 max-[400px]:translate-y-2 sm:translate-y-[14px] sm:-space-x-3"
          >
            {SKILL_EXAMPLES.map(({ id, name, className }) => (
              <Image
                key={id}
                src={`/agent-skills/${id}.svg`}
                alt={t.exampleNames[id] ?? name}
                width={42}
                height={42}
                loading="eager"
                className={cn(
                  "size-[34px] shrink-0 select-none drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.08)] transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none sm:size-[42px]",
                  className,
                )}
              />
            ))}
          </div>
        </div>
        <IconAction label={detailCopy.close} onClick={() => setOverlayOpen(false)}>
          <X className="size-3.5" />
        </IconAction>
      </div>

      {/* Inset white card sitting in front of the peeking sticker edges */}
      <div className={cn(overlayCardClass, "relative z-10")} data-vaul-no-drag="">
        <Description className="text-sm leading-relaxed text-muted-foreground">
          {t.description}
        </Description>

        {/* Install command in the app's code viewer style */}
        <div className="rounded-2xl bg-muted/65 p-1 ring-1 ring-inset ring-foreground/[0.08]">
          <div className="flex items-center justify-between gap-2 px-1 pb-1 pt-0.5">
            <span className="inline-flex h-7 items-center gap-1.5 rounded-[9px] bg-background px-2 text-xs font-medium text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.06)] ring-1 ring-inset ring-foreground/[0.08]">
              <Terminal className="size-3.5 shrink-0 text-foreground/80" />
              <span>Skills.sh</span>
            </span>
            <SkillCopyButton
              value={illustrationSkill.command}
              copyState={installCopy}
              idleLabel={t.copyInstallIdle}
              copiedLabel={t.copyInstallCopied}
              copyTooltip={detailCopy.copyTooltip}
              copiedTooltip={detailCopy.copiedTooltip}
              copyFailedTooltip={detailCopy.copyFailedTooltip}
            />
          </div>
          <div className="overflow-hidden rounded-[12px] bg-background shadow-[0_1px_2px_rgba(0,0,0,0.03)] ring-1 ring-inset ring-foreground/[0.07]">
            <pre
              data-vaul-no-drag=""
              className="palette-scroll overflow-x-auto whitespace-pre-wrap px-3.5 py-3 font-mono text-[12px] leading-[1.65] text-foreground/90 sm:px-4 sm:py-3.5 sm:text-[12.5px]"
            >
              <code>
                <span aria-hidden="true" className="select-none pr-2 text-muted-foreground">
                  $
                </span>
                {skillFlag ? (
                  <>
                    {commandPrefix}{" "}
                    <span className="whitespace-nowrap">--skill {skillFlag}</span>
                  </>
                ) : (
                  illustrationSkill.command
                )}
              </code>
            </pre>
          </div>
        </div>

        {/* Example prompt with matching tray & copy button */}
        <div className="rounded-2xl bg-muted/65 p-1 ring-1 ring-inset ring-foreground/[0.08]">
          <div className="flex items-center justify-between gap-2 px-1 pb-1 pt-0.5">
            <span className="inline-flex h-7 items-center gap-1.5 px-2 text-xs font-medium text-muted-foreground">
              <Sparkles className="size-3.5 shrink-0 text-muted-foreground/85" />
              <span>{t.examplePromptLabel}</span>
            </span>
            <SkillCopyButton
              value={examplePromptText}
              copyState={promptCopy}
              idleLabel={t.copyPromptIdle}
              copiedLabel={t.copyPromptCopied}
              copyTooltip={detailCopy.copyTooltip}
              copiedTooltip={detailCopy.copiedTooltip}
              copyFailedTooltip={detailCopy.copyFailedTooltip}
            />
          </div>
          <div className="overflow-hidden rounded-[12px] bg-background shadow-[0_1px_2px_rgba(0,0,0,0.03)] ring-1 ring-inset ring-foreground/[0.07]">
            <p
              data-vaul-no-drag=""
              className="px-3.5 py-3 text-[13px] leading-[1.6] text-foreground/90 sm:px-4 sm:py-3.5"
            >
              {hasMention ? (
                <>
                  {promptPrefix}
                  <code className="rounded-md bg-muted/80 px-1.5 py-0.5 font-mono text-[12px] text-foreground">
                    {skillMention}
                  </code>
                  {promptSuffix}
                </>
              ) : (
                examplePromptText
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Outer tray footer with skill path & View on GitHub action */}
      <div
        className={cn(
          "flex shrink-0 items-center justify-between gap-3 text-muted-foreground",
          isMobile ? "px-1 pt-1 text-xs" : "px-3 pb-1 pt-2 text-[11px]",
        )}
      >
        <span className="truncate font-mono">skills/{illustrationSkill.name}</span>
        <a
          href={illustrationSkill.source}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "group/gh inline-flex shrink-0 items-center gap-1.5 rounded-lg font-medium text-foreground/80 outline-none micro-transition hover:bg-background/85 hover:text-foreground active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-ring",
            isMobile ? "h-9 px-2" : "-my-1 h-7 px-2",
          )}
        >
          <GitHubLogo className="size-3.5 shrink-0" />
          <span>{t.viewOnGithub}</span>
          <ArrowUpRight className="size-3 shrink-0 transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover/gh:-translate-y-0.5 group-hover/gh:translate-x-0.5 motion-reduce:transition-none" />
          <span className="sr-only">{messages.hero.opensInNewTab}</span>
        </a>
      </div>
    </div>
  );
}

function OverlayBody({
  Title,
  Description,
  isMobile,
  stars,
}: {
  Title: SlotComponent;
  Description: SlotComponent;
  isMobile: boolean;
  stars: number | null;
}) {
  const { overlayView } = useTrazoOverlayState();
  const reduceMotion = useReducedMotion();
  const offset = overlayView === "grid" ? -12 : 12;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.div
        key={overlayView}
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: offset }}
        animate={{ opacity: 1, x: 0 }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -offset }}
        transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
        className="flex min-h-0 min-w-0 flex-1 flex-col"
      >
        {overlayView === "grid" ? (
          <LibraryPalette
            Title={Title}
            Description={Description}
            isMobile={isMobile}
            stars={stars}
          />
        ) : overlayView === "detail" ? (
          <StickerDetailView Title={Title} Description={Description} stars={stars} />
        ) : (
          <AgentSkillView Title={Title} Description={Description} isMobile={isMobile} />
        )}
      </m.div>
    </AnimatePresence>
  );
}

export const TrazoOverlay = memo(function TrazoOverlay({
  stars,
}: {
  stars: number | null;
}) {
  const { overlayOpen, overlayView } = useTrazoOverlayState();
  const { setOverlayOpen } = useTrazoActions();
  const isMobile = useIsMobile();

  const renderMobileBody = useCallback(
    ({ Title, Description }: { Title: SlotComponent; Description: SlotComponent }) => (
      <OverlayBody Title={Title} Description={Description} isMobile stars={stars} />
    ),
    [stars],
  );

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
      <LazyOverlayMobileDrawer
        open={overlayOpen}
        onOpenChange={setOverlayOpen}
        overlayView={overlayView}
        renderBody={renderMobileBody}
      />
    );
  }

  return (
    <Dialog open={overlayOpen} onOpenChange={setOverlayOpen}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          overlayDialogClass,
          overlayView === "grid" ? "max-w-[640px]" : "max-w-[480px]",
        )}
      >
        <OverlayBody Title={DialogTitle} Description={DialogDescription} isMobile={false} stars={stars} />
      </DialogContent>
    </Dialog>
  );
});
