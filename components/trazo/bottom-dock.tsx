"use client";

import { memo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { STICKER_COUNT } from "trazo/meta";

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

const PANEL_CLASS =
  "flex items-center rounded-[20px] bg-popover/95 p-1 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_14px_36px_-10px_rgba(0,0,0,0.18)] ring-1 ring-foreground/[0.07] backdrop-blur-sm sm:rounded-[22px] sm:p-1.5";

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
        "block size-6 shrink-0 rounded-full shadow-[inset_0_-2px_0_rgba(0,0,0,0.16),inset_0_1.5px_0_rgba(255,255,255,0.35),0_1px_2px_rgba(0,0,0,0.12)] ring-1 ring-inset ring-black/10",
        option.kind === "ink" && "bg-[color:var(--scribble-ink)]",
        className,
      )}
    />
  );
}

function DeckPanel({
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
      className={cn(PANEL_CLASS, className)}
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
      className="flex items-center gap-0.5"
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
                className="relative flex size-10 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {isSelected ? (
                  <m.span
                    aria-hidden
                    layoutId="dock-swatch-selection"
                    transition={reduceMotion ? { duration: 0 } : selectSpring}
                    className="absolute inset-[3px] rounded-full ring-2 ring-foreground"
                  />
                ) : null}
                <m.span
                  className="relative"
                  variants={{
                    lift: { y: -3, scale: 1.12 },
                    press: { y: 0, scale: 0.88 },
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
          className="flex h-10 items-center gap-1.5 rounded-2xl pl-1.5 pr-2.5 text-xs font-medium text-foreground micro-transition hover:bg-muted active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:h-11"
        >
          <SwatchDot option={activeOption} className="size-6 sm:size-7" />
          <span className="inline-grid w-[4.75rem] items-center overflow-hidden text-left">
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
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="center"
        sideOffset={12}
        className="w-[min(296px,calc(100vw-1.5rem))] rounded-2xl p-3"
      >
        <div className="mb-2.5 flex items-center justify-between px-0.5">
          <span className="text-xs font-medium text-foreground">
            {messages.dock.crayonPaletteTitle}
          </span>
          <span
            className={cn(
              "leading-none text-muted-foreground",
              locale === "en" ? "font-caveat text-lg" : "text-xs",
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
                  "flex min-h-[68px] flex-col items-center justify-center gap-1.5 rounded-xl px-1.5 py-2 text-[11px] font-medium micro-transition active:scale-[0.95]",
                  isSelected
                    ? "bg-muted text-foreground ring-2 ring-foreground"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
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

export const BottomDock = memo(function BottomDock() {
  const { paletteId } = useTrazoCanvasState();
  const { centerCanvas, openLibraryGrid } = useTrazoActions();
  const locale = useLocale();
  const reduceMotion = useReducedMotion();
  const t = getMessages(locale).dock;
  const modKey = useModKey();
  const activeOption = findPaletteOption(paletteId);

  return (
    <nav
      aria-label={t.navAriaLabel}
      data-no-pan=""
      className="pointer-events-none fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 flex items-center justify-center gap-1.5 sm:inset-x-4 sm:bottom-[max(1rem,env(safe-area-inset-bottom))] sm:gap-2 [&>*]:pointer-events-auto"
    >
      <DeckPanel index={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={centerCanvas}
              aria-label={t.centerCanvasAriaLabel}
              className="group flex h-10 items-center gap-0.5 rounded-2xl px-1 micro-transition hover:bg-muted active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:h-11 sm:pl-1 sm:pr-3"
            >
              <TrazoMark
                option={activeOption}
                className="size-8 transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:-rotate-6 group-hover:scale-105 sm:size-9"
              />
              <span className="hidden font-caveat text-[26px] font-bold leading-none tracking-tight text-foreground sm:inline">
                trazo
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t.backToCenterTooltip}</p>
          </TooltipContent>
        </Tooltip>
      </DeckPanel>

      <DeckPanel index={1} className="hidden px-1 md:flex">
        <SwatchRail />
      </DeckPanel>
      <DeckPanel index={1} className="md:hidden">
        <MobileColorPicker />
      </DeckPanel>

      <DeckPanel index={2} className="bg-foreground ring-foreground">
        <button
          type="button"
          onClick={openLibraryGrid}
          aria-label={t.libraryAriaLabel(STICKER_COUNT)}
          aria-keyshortcuts="Meta+K Control+K"
          className="flex h-10 items-center gap-1.5 rounded-2xl px-3 text-[13px] font-medium text-background micro-transition hover:bg-background/10 active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-background sm:h-11 sm:gap-2 sm:pl-3 sm:pr-2 sm:text-sm"
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
          <kbd aria-hidden className="hidden whitespace-nowrap rounded-lg bg-background/15 px-1.5 py-1 font-sans text-[10px] leading-none text-background/80 sm:inline">
            {modKey} K
          </kbd>
        </button>
      </DeckPanel>
    </nav>
  );
});
