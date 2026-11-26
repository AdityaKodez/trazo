"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { m, useReducedMotion } from "motion/react";

import { Check, Languages } from "@/components/trazo/icons";
import { useIsMobile } from "@/components/trazo/overlay-layout";
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
import { getMessages } from "@/config/i18n/messages";
import {
  findLocaleOption,
  LOCALE_OPTIONS,
  preloadLocale,
  useLocale,
  useUrgentLocale,
  writeLocale,
  type Locale,
} from "@/lib/use-locale";
import { cn } from "@/lib/utils";

const PILL_CLASS =
  "pointer-events-auto flex items-center rounded-[18px] bg-popover/95 p-1 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_12px_30px_-10px_rgba(0,0,0,0.14)] ring-1 ring-foreground/[0.07] backdrop-blur-sm sm:rounded-[20px]";

const segmentSpring = {
  type: "spring",
  stiffness: 520,
  damping: 36,
  mass: 0.65,
} as const;

function preloadOtherLocales(activeLocale: Locale) {
  for (const option of LOCALE_OPTIONS) {
    if (option.id !== activeLocale) {
      void preloadLocale(option.id);
    }
  }
}

function MobileLocaleSwitcher({ className }: { className?: string }) {
  const locale = useUrgentLocale();
  const committedLocale = useLocale();
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(() =>
    Math.max(0, LOCALE_OPTIONS.findIndex((item) => item.id === locale)),
  );
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const pendingFrameRef = useRef<number | null>(null);
  const t = getMessages(committedLocale).topBar;
  const activeOption = findLocaleOption(locale);

  useEffect(() => {
    return () => {
      if (pendingFrameRef.current !== null) {
        window.cancelAnimationFrame(pendingFrameRef.current);
      }
    };
  }, []);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      preloadOtherLocales(locale);
      const selectedIdx = LOCALE_OPTIONS.findIndex((item) => item.id === locale);
      setFocusedIndex(selectedIdx >= 0 ? selectedIdx : 0);
    }
    setOpen(nextOpen);
  }

  function pick(next: Locale) {
    setOpen(false);
    if (next === locale) return;
    void preloadLocale(next);
    if (pendingFrameRef.current !== null) {
      window.cancelAnimationFrame(pendingFrameRef.current);
    }
    pendingFrameRef.current = window.requestAnimationFrame(() => {
      pendingFrameRef.current = null;
      writeLocale(next);
    });
  }

  function handleListKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const activeEl = document.activeElement;
    const focusedDomIndex = optionRefs.current.findIndex((el) => el === activeEl);
    const current =
      focusedDomIndex >= 0
        ? focusedDomIndex
        : Math.max(0, LOCALE_OPTIONS.findIndex((item) => item.id === locale));
    let nextIndex: number;

    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      nextIndex = (current + 1) % LOCALE_OPTIONS.length;
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      nextIndex = (current - 1 + LOCALE_OPTIONS.length) % LOCALE_OPTIONS.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = LOCALE_OPTIONS.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    setFocusedIndex(nextIndex);
    void preloadLocale(LOCALE_OPTIONS[nextIndex].id);
    optionRefs.current[nextIndex]?.focus();
  }

  return (
    <div className={cn(PILL_CLASS, "sm:hidden", className)} data-no-pan="">
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <button
            type="button"
            onPointerEnter={() => preloadOtherLocales(locale)}
            onFocus={() => preloadOtherLocales(locale)}
            aria-label={`${t.languageMenuAriaLabel} (${activeOption.nativeLabel})`}
            className="flex h-8 min-w-[4.75rem] items-center justify-center gap-1.5 rounded-[14px] px-2.5 text-xs font-medium text-foreground outline-none micro-transition hover:bg-muted active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Languages className="size-3.5 shrink-0 text-muted-foreground" />
            <span
              lang={activeOption.id}
              className="inline-block min-w-[3em] whitespace-nowrap text-center leading-none"
            >
              {activeOption.shortLabel}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          side="bottom"
          align="end"
          sideOffset={10}
          collisionPadding={12}
          data-no-pan=""
          className="w-[172px] max-w-[calc(100vw-1.5rem)] gap-1 rounded-2xl p-1.5"
        >
          <div
            role="radiogroup"
            aria-label={t.languageMenuAriaLabel}
            onKeyDown={handleListKeyDown}
            className="flex flex-col gap-0.5"
          >
            {LOCALE_OPTIONS.map((option, index) => {
              const isSelected = option.id === locale;
              return (
                <button
                  key={option.id}
                  ref={(node) => {
                    optionRefs.current[index] = node;
                  }}
                  type="button"
                  role="radio"
                  lang={option.id}
                  aria-checked={isSelected}
                  tabIndex={index === focusedIndex ? 0 : -1}
                  onPointerEnter={() => void preloadLocale(option.id)}
                  onFocus={() => {
                    setFocusedIndex(index);
                    void preloadLocale(option.id);
                  }}
                  onClick={() => pick(option.id)}
                  className={cn(
                    "flex min-h-[38px] w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left text-[13px] font-medium outline-none micro-transition active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring",
                    isSelected
                      ? "bg-foreground text-background"
                      : "text-foreground hover:bg-muted/80",
                  )}
                >
                  <span className="truncate leading-none">{option.nativeLabel}</span>
                  {isSelected ? (
                    <Check className="size-3.5 shrink-0 text-background" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function DesktopLocaleSwitcher({ className }: { className?: string }) {
  const locale = useUrgentLocale();
  const committedLocale = useLocale();
  const reduceMotion = useReducedMotion();
  const groupId = useId();
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [openTooltipId, setOpenTooltipId] = useState<Locale | null>(null);
  const t = getMessages(committedLocale).topBar;

  const activePillId = `locale-switcher-active-${groupId}`;

  function select(next: Locale, focusIndex?: number) {
    setOpenTooltipId(null);
    writeLocale(next);
    if (focusIndex !== undefined) {
      buttonRefs.current[focusIndex]?.focus();
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const current = LOCALE_OPTIONS.findIndex((item) => item.id === locale);
    let nextIndex: number;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (current + 1) % LOCALE_OPTIONS.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (current - 1 + LOCALE_OPTIONS.length) % LOCALE_OPTIONS.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = LOCALE_OPTIONS.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    select(LOCALE_OPTIONS[nextIndex].id, nextIndex);
  }

  return (
    <div
      role="radiogroup"
      aria-label={t.languageMenuAriaLabel}
      onKeyDown={handleKeyDown}
      data-no-pan=""
      className={cn(PILL_CLASS, "hidden gap-0.5 sm:flex", className)}
    >
      {LOCALE_OPTIONS.map((option, index) => {
        const isSelected = option.id === locale;
        return (
          <Tooltip
            key={option.id}
            delayDuration={300}
            open={!isSelected && openTooltipId === option.id}
            onOpenChange={(nextOpen) => {
              setOpenTooltipId((prev) => {
                if (nextOpen && !isSelected) return option.id;
                return prev === option.id ? null : prev;
              });
            }}
          >
            <TooltipTrigger asChild>
              <button
                ref={(node) => {
                  buttonRefs.current[index] = node;
                }}
                type="button"
                role="radio"
                lang={option.id}
                aria-checked={isSelected}
                aria-label={option.nativeLabel}
                tabIndex={isSelected ? 0 : -1}
                onPointerEnter={() => void preloadLocale(option.id)}
                onFocus={() => void preloadLocale(option.id)}
                onClick={() => select(option.id)}
                className={cn(
                  "relative flex h-8 min-w-[48px] items-center justify-center rounded-[14px] px-2 text-[11px] font-medium outline-none transition-colors duration-200 active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-ring sm:h-9 sm:min-w-[54px] sm:px-2 sm:text-xs",
                  isSelected
                    ? "text-background"
                    : "text-muted-foreground hover:bg-muted/75 hover:text-foreground",
                )}
              >
                {isSelected ? (
                  <m.span
                    aria-hidden="true"
                    layoutId={activePillId}
                    initial={false}
                    transition={reduceMotion ? { duration: 0 } : segmentSpring}
                    className="absolute inset-0 rounded-[14px] bg-foreground shadow-[0_1px_2px_rgba(0,0,0,0.14)]"
                  />
                ) : null}
                <span className="relative z-10 whitespace-nowrap leading-none">
                  {option.shortLabel}
                </span>
              </button>
            </TooltipTrigger>
            {!isSelected ? (
              <TooltipContent side="bottom" align="center">
                <p>{option.nativeLabel}</p>
              </TooltipContent>
            ) : null}
          </Tooltip>
        );
      })}
    </div>
  );
}

export function LocaleSwitcher({ className }: { className?: string }) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileLocaleSwitcher className={className} />;
  }

  return <DesktopLocaleSwitcher className={className} />;
}
