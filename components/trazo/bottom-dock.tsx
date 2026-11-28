"use client";

import Link from "next/link";
import { memo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { STICKER_COUNT } from "trazo/meta";

import {
  CHROME_DARK_BUTTON,
  CHROME_LIGHT_BUTTON,
  CHROME_LIGHT_SURFACE,
  CHROME_POPOVER_SURFACE,
  CHROME_RECESSED_CHANNEL,
} from "@/components/trazo/chrome-surfaces";
import { LayoutGrid } from "@/components/trazo/icons";
import { TrazoMark } from "@/components/trazo/trazo-logo";
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
  useTrazoActions,
  useTrazoCanvasState,
} from "@/components/trazo/trazo-experience";
import { getMessages } from "@/config/i18n/messages";
import {
  findPaletteOption,
  paletteOptions,
  type PaletteId,
  type PaletteOption,
} from "@/config/palette";
import { useLocale } from "@/lib/use-locale";
import { useModKey } from "@/lib/use-mod-key";
import { cn } from "@/lib/utils";

const MIX_GRADIENT =
  "conic-gradient(from 210deg, #ef4444, #f97316, #eab308, #16a34a, #38bdf8, #2563eb, #ec4899, #ef4444)";

const selectSpring = { type: "spring", stiffness: 520, damping: 34, mass: 0.6 } as const;
const liftSpring = { type: "spring", stiffness: 600, damping: 24, mass: 0.4 } as const;
const enterSpring = { type: "spring", stiffness: 380, damping: 30 } as const;
const labelFadeEase = [0.22, 1, 0.36, 1] as const;

function SwatchDot({
  option,
  className,
}: {
  option: PaletteOption;
  className?: string;
}) {
  return (
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
        "block size-6 shrink-0 rounded-full shadow-[inset_0_2px_2px_rgba(255,255,255,0.44),inset_0_-2.5px_2px_rgba(0,0,0,0.22),0_2px_4px_rgba(0,0,0,0.16),0_1px_1px_rgba(0,0,0,0.1)] ring-1 ring-inset ring-black/12",
        option.kind === "ink" &&
          "bg-[linear-gradient(180deg,#3a3834_0%,var(--scribble-ink)_100%)] shadow-[inset_0_1.5px_1.5px_rgba(255,255,255,0.28),inset_0_-2px_2px_rgba(0,0,0,0.45),0_2px_4px_rgba(0,0,0,0.2),0_1px_1px_rgba(0,0,0,0.14)] ring-black/25",
        className,
      )}
    />
  );
}

function DockSlot({
  index,
  className,
  children,
}: {
  index: number;
  className?: string;
  children: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <m.div
      initial={reduceMotion ? false : { opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={reduceMotion ? { duration: 0 } : { ...enterSpring, delay: 0.2 + index * 0.06 }}
      className={cn("flex items-center", className)}
    >
      {children}
    </m.div>
  );
}

function SwatchRail() {
  const { paletteId } = useTrazoCanvasState();
  const { setPaletteId } = useTrazoActions();
  const locale = useLocale();
  const messages = getMessages(locale);
  const reduceMotion = useReducedMotion();
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function select(index: number) {
    const next = paletteOptions[(index + paletteOptions.length) % paletteOptions.length];
    setPaletteId(next.id);
    buttonRefs.current[paletteOptions.indexOf(next)]?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const current = paletteOptions.findIndex((item) => item.id === paletteId);
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      select(current + 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      select(current - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      select(0);
    } else if (event.key === "End") {
      event.preventDefault();
      select(paletteOptions.length - 1);
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label={messages.dock.paletteGroupAriaLabel}
      onKeyDown={handleKeyDown}
      className={cn(CHROME_RECESSED_CHANNEL, "flex h-full items-center gap-0.5 px-[3px]")}
    >
      {paletteOptions.map((option, index) => {
        const isSelected = paletteId === option.id;
        const label = messages.palettes[option.id];
        return (
          <Tooltip key={option.id}>
            <TooltipTrigger asChild>
              <m.button
                ref={(node) => {
                  buttonRefs.current[index] = node;
                }}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={label}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => setPaletteId(option.id)}
                whileHover={reduceMotion ? undefined : "lift"}
                whileTap={reduceMotion ? undefined : "press"}
                className="relative flex size-9 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {isSelected ? (
                  <m.span
                    aria-hidden
                    layoutId="dock-swatch-selection"
                    transition={reduceMotion ? { duration: 0 } : selectSpring}
                    className="absolute inset-[2px] rounded-full bg-white shadow-[0_1.5px_3px_rgba(24,23,21,0.16),0_1px_1px_rgba(24,23,21,0.08)] ring-[1.75px] ring-foreground/85"
                  />
                ) : null}
                <m.span
                  className="relative"
                  variants={{
                    lift: { y: -2.5, scale: 1.12 },
                    press: { y: 0.5, scale: 0.88 },
                  }}
                  transition={liftSpring}
                >
                  <SwatchDot
                    option={option}
                    className={cn(
                      "transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]",
                      isSelected && "scale-[0.84]",
                    )}
                  />
                </m.span>
              </m.button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{label}</p>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

function MobileColorPicker() {
  const { paletteId } = useTrazoCanvasState();
  const { setPaletteId } = useTrazoActions();
  const locale = useLocale();
  const reduceMotion = useReducedMotion();
  const messages = getMessages(locale);
  const [open, setOpen] = useState(false);
  const activeOption = findPaletteOption(paletteId);
  const activeLabel = messages.palettes[activeOption.id];

  function pick(id: PaletteId) {
    setPaletteId(id);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={messages.dock.colorButtonAriaLabel(activeLabel)}
          className={cn(
            CHROME_LIGHT_BUTTON,
            "flex h-12 items-center gap-2 pl-3 pr-3 text-[13px] font-medium text-foreground data-[state=open]:translate-y-[0.5px] sm:h-[52px] sm:gap-2.5 sm:pl-3.5 sm:pr-3.5 sm:text-sm",
          )}
        >
          <SwatchDot option={activeOption} className="size-6 sm:size-[26px]" />
          <span className="inline-grid max-w-[6.25rem] items-center overflow-hidden text-left">
            <AnimatePresence initial={false}>
              <m.span
                key={`${locale}-${activeOption.id}`}
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { duration: 0.16, ease: labelFadeEase }
                }
                className="col-start-1 row-start-1 truncate whitespace-nowrap"
              >
                {activeLabel}
              </m.span>
            </AnimatePresence>
          </span>
          <svg
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden
            className={cn(
              "size-3 shrink-0 text-muted-foreground/75 transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
              open && "rotate-180 text-foreground",
            )}
          >
            <path
              d="M3 7.5 6 4.5l3 3"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="center"
        sideOffset={12}
        className={cn(
          CHROME_POPOVER_SURFACE,
          "w-[min(296px,calc(100vw-1.5rem))] rounded-[22px] p-3",
        )}
      >
        <div className="mb-2.5 flex items-center justify-between px-1">
          <span className="text-xs font-medium text-foreground">
            {messages.dock.crayonPaletteTitle}
          </span>
          <span
            className={cn(
              "leading-none text-muted-foreground",
              locale === "en" ? "font-hand text-[13.5px] font-medium" : "text-xs",
            )}
          >
            {activeLabel}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {paletteOptions.map((option) => {
            const isSelected = paletteId === option.id;
            const optionLabel = messages.palettes[option.id];
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => pick(option.id)}
                className={cn(
                  "flex min-h-[68px] flex-col items-center justify-center gap-1.5 rounded-2xl px-1.5 py-2 text-[11px] font-medium micro-transition active:scale-[0.95]",
                  isSelected
                    ? "bg-linear-to-b from-white to-[#f6f5f2] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_2px_5px_rgba(24,23,21,0.09)] ring-2 ring-foreground/85"
                    : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground",
                )}
              >
                <SwatchDot option={option} className="size-7" />
                <span className="truncate">{optionLabel}</span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ResetStickersPill() {
  const { movedStickerCount } = useTrazoCanvasState();
  const { resetStickerOffsets } = useTrazoActions();
  const locale = useLocale();
  const reduceMotion = useReducedMotion();
  const t = getMessages(locale).canvas;

  return (
    <AnimatePresence>
      {movedStickerCount > 0 ? (
        <m.div
          key="reset-stickers-pill"
          data-no-pan=""
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.95 }}
          transition={
            reduceMotion
              ? { duration: 0.1 }
              : { type: "spring", stiffness: 460, damping: 30, mass: 0.65 }
          }
          className="pointer-events-auto fixed bottom-[calc(max(0.875rem,env(safe-area-inset-bottom))+3.65rem)] left-1/2 z-30 -translate-x-1/2 sm:bottom-[calc(max(1.125rem,env(safe-area-inset-bottom))+4.15rem)]"
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={resetStickerOffsets}
                aria-label={t.resetStickersAriaLabel(movedStickerCount)}
                className={cn(
                  CHROME_LIGHT_BUTTON,
                  "group flex h-8 items-center gap-1.5 px-3 text-xs font-medium text-muted-foreground hover:text-foreground",
                )}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="size-3.5 shrink-0 transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:-rotate-45"
                >
                  <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
                <span>{t.resetStickersLabel}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t.resetStickersTooltip}</p>
            </TooltipContent>
          </Tooltip>
        </m.div>
      ) : null}
    </AnimatePresence>
  );
}

export const BottomDock = memo(function BottomDock() {
  const { paletteId } = useTrazoCanvasState();
  const { centerCanvas } = useTrazoActions();
  const locale = useLocale();
  const reduceMotion = useReducedMotion();
  const t = getMessages(locale).dock;
  const modKey = useModKey();
  const activeOption = findPaletteOption(paletteId);

  return (
    <>
      <ResetStickersPill />
      <nav
        aria-label={t.navAriaLabel}
        data-no-pan=""
        className="pointer-events-none fixed inset-x-3 bottom-[max(0.875rem,env(safe-area-inset-bottom))] z-30 flex items-center justify-center gap-2 sm:inset-x-4 sm:bottom-[max(1.125rem,env(safe-area-inset-bottom))] sm:gap-2.5 [&>*]:pointer-events-auto"
      >
      <DockSlot index={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={centerCanvas}
              aria-label={t.centerCanvasAriaLabel}
              className={cn(
                CHROME_LIGHT_BUTTON,
                "group flex size-12 items-center justify-center sm:h-[52px] sm:w-auto sm:gap-1 sm:pl-3 sm:pr-4",
              )}
            >
              <TrazoMark
                option={activeOption}
                className="size-[30px] transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:-rotate-6 group-hover:scale-105 sm:size-8"
              />
              <span className="hidden -translate-y-[0.5px] font-hand text-[20px] font-bold leading-none tracking-[-0.02em] text-foreground sm:inline">
                trazo
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t.backToCenterTooltip}</p>
          </TooltipContent>
        </Tooltip>
      </DockSlot>

      <DockSlot
        index={1}
        className={cn(CHROME_LIGHT_SURFACE, "hidden h-[52px] p-[5px] md:flex")}
      >
        <SwatchRail />
      </DockSlot>
      <DockSlot index={1} className="md:hidden">
        <MobileColorPicker />
      </DockSlot>

      <DockSlot index={2}>
        <Link
          href="/library"
          scroll={false}
          aria-label={t.libraryAriaLabel(STICKER_COUNT)}
          aria-keyshortcuts="Meta+K Control+K"
          className={cn(
            CHROME_DARK_BUTTON,
            "flex h-12 items-center gap-2 pl-4 pr-[18px] text-[13.5px] font-medium sm:h-[52px] sm:gap-2 sm:pl-4 sm:pr-3 sm:text-sm",
          )}
        >
          <LayoutGrid className="size-[17px] shrink-0 sm:size-[18px]" />
          <span className="inline-grid place-items-center">
            <AnimatePresence initial={false} mode="popLayout">
              <m.span
                key={locale}
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { duration: 0.16, ease: labelFadeEase }
                }
                className="col-start-1 row-start-1 whitespace-nowrap"
              >
                {t.libraryLabel}
              </m.span>
            </AnimatePresence>
          </span>
          <kbd
            aria-hidden
            className="ml-0.5 hidden h-7 items-center rounded-full bg-linear-to-b from-white/[0.16] to-white/[0.08] px-2.5 font-sans text-[11px] font-medium leading-none tracking-[0.01em] text-background/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.22),inset_0_-1.5px_0_rgba(0,0,0,0.42),0_1px_2px_rgba(0,0,0,0.3)] ring-1 ring-inset ring-white/[0.12] sm:inline-flex"
          >
            {modKey} K
          </kbd>
        </Link>
      </DockSlot>
      </nav>
    </>
  );
});
