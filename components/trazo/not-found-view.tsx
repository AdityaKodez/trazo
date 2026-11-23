"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { curlyArrowDef, spiralDef } from "trazo/catalog/arrows";
import { bowtieCatDef, daisyCatDef, heartCatDef } from "trazo/catalog/cats";
import { littleGreenAlienDef } from "trazo/catalog/characters";
import { sparkleFourDef } from "trazo/catalog/hearts";
import { flowerRedDef, puffyCloudDef, sunBurstDef } from "trazo/catalog/nature";
import {
  babySquidDef,
  dolphinDef,
  flapjackOctopusDef,
  pearlClamDef,
  seaBubbleDef,
  seahorseDef,
  starfishDef,
} from "trazo/catalog/ocean";
import { questionMarkDef } from "trazo/catalog/symbols";
import type { StickerDef } from "trazo/core";
import { STICKER_COUNT } from "trazo/meta";
import { Sticker } from "trazo/scribble";

import { GitHubLogo } from "@/components/trazo/icons";
import { ArrowLeft, RotateCw } from "@/components/trazo/overlay-icons";
import { TrazoMark } from "@/components/trazo/trazo-logo";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { findPaletteOption } from "@/config/palette";
import { siteConfig } from "@/config/site";
import { playLocateShakeSound } from "@/lib/sound";
import { cn } from "@/lib/utils";

const easeOutQuart = [0.23, 1, 0.32, 1] as const;
const enterSpring = { type: "spring", stiffness: 380, damping: 30 } as const;
const flipSpring = { type: "spring", stiffness: 420, damping: 24, mass: 0.55 } as const;
const stickerSpring = { type: "spring", stiffness: 520, damping: 20, mass: 0.48 } as const;

const PILL_CLASS =
  "pointer-events-auto flex items-center rounded-[18px] bg-popover/92 p-1 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_12px_30px_-10px_rgba(0,0,0,0.14)] ring-1 ring-foreground/[0.07] backdrop-blur-md sm:rounded-[20px]";

const MIX_PALETTE = findPaletteOption("mix");

const ZERO_STICKERS: readonly StickerDef[] = [
  flapjackOctopusDef,
  babySquidDef,
  daisyCatDef,
  littleGreenAlienDef,
  starfishDef,
  heartCatDef,
  pearlClamDef,
  puffyCloudDef,
] as const;

const SHAKE_KEYFRAMES = {
  rotate: [0, -14, 14, -10, 9, -5, 3, 0],
  y: [0, -5, -7, -5, -3, -1, 0, 0],
  scale: [1, 1.12, 1.11, 1.09, 1.05, 1.02, 1, 1],
};

const SHAKE_TRANSITION = {
  duration: 0.55,
  ease: "easeOut" as const,
};

interface OrbitItem {
  def: StickerDef;
  rotate: number;
  delay: number;
  sizeClass: string;
  positionClass: string;
  note?: string;
  notePositionClass?: string;
}

const ORBIT_STICKERS: readonly OrbitItem[] = [
  // Four corner anchors visible across all viewports (mobile -> desktop)
  {
    def: questionMarkDef,
    rotate: -12,
    delay: 0.08,
    sizeClass: "size-[58px] md:size-[78px] lg:size-[88px]",
    positionClass:
      "left-[6%] top-[13%] md:left-1/2 md:top-1/2 md:-translate-x-[310px] md:-translate-y-[215px] lg:-translate-x-[385px] lg:-translate-y-[215px]",
    note: "wrong turn?",
    notePositionClass: "-top-5 left-1/2 -translate-x-1/2",
  },
  {
    def: puffyCloudDef,
    rotate: 7,
    delay: 0.12,
    sizeClass: "size-[60px] md:size-[80px] lg:size-[90px]",
    positionClass:
      "right-[6%] top-[12%] md:left-1/2 md:right-auto md:top-1/2 md:translate-x-[230px] md:-translate-y-[215px] lg:translate-x-[295px] lg:-translate-y-[215px]",
  },
  {
    def: seaBubbleDef,
    rotate: -8,
    delay: 0.16,
    sizeClass: "size-[54px] md:size-[72px] lg:size-[82px]",
    positionClass:
      "bottom-[11%] left-[7%] md:bottom-auto md:left-1/2 md:top-1/2 md:-translate-x-[295px] md:translate-y-[145px] lg:-translate-x-[375px] lg:translate-y-[140px]",
  },
  {
    def: curlyArrowDef,
    rotate: -9,
    delay: 0.2,
    sizeClass: "size-[56px] md:size-[76px] lg:size-[86px]",
    positionClass:
      "bottom-[11%] right-[7%] md:bottom-auto md:left-1/2 md:right-auto md:top-1/2 md:translate-x-[220px] md:translate-y-[145px] lg:translate-x-[290px] lg:translate-y-[140px]",
    note: "canvas is that way",
    notePositionClass: "-bottom-5 left-1/2 -translate-x-1/2",
  },

  // Mid flanks (tablet + desktop)
  {
    def: babySquidDef,
    rotate: -7,
    delay: 0.14,
    sizeClass: "size-[82px] lg:size-[98px]",
    positionClass:
      "hidden md:block md:left-1/2 md:top-1/2 md:-translate-x-[355px] md:-translate-y-[42px] lg:-translate-x-[455px] lg:-translate-y-[52px]",
  },
  {
    def: bowtieCatDef,
    rotate: 6,
    delay: 0.18,
    sizeClass: "size-[82px] lg:size-[98px]",
    positionClass:
      "hidden md:block md:left-1/2 md:top-1/2 md:translate-x-[272px] md:-translate-y-[38px] lg:translate-x-[355px] lg:-translate-y-[48px]",
  },

  // Upper inner sparks (desktop with room)
  {
    def: spiralDef,
    rotate: -14,
    delay: 0.24,
    sizeClass: "size-[72px]",
    positionClass:
      "hidden lg:block lg:left-1/2 lg:top-1/2 lg:-translate-x-[255px] lg:-translate-y-[265px]",
  },
  {
    def: sparkleFourDef,
    rotate: 11,
    delay: 0.26,
    sizeClass: "size-[68px]",
    positionClass:
      "hidden lg:block lg:left-1/2 lg:top-1/2 lg:translate-x-[190px] lg:-translate-y-[260px]",
  },

  // Outer gallery ring (wide desktop)
  {
    def: seahorseDef,
    rotate: -6,
    delay: 0.28,
    sizeClass: "size-[96px]",
    positionClass:
      "hidden xl:block xl:left-1/2 xl:top-1/2 xl:-translate-x-[580px] xl:-translate-y-[165px]",
  },
  {
    def: sunBurstDef,
    rotate: 8,
    delay: 0.3,
    sizeClass: "size-[84px]",
    positionClass:
      "hidden xl:block xl:left-1/2 xl:top-1/2 xl:translate-x-[475px] xl:-translate-y-[170px]",
  },
  {
    def: flowerRedDef,
    rotate: -8,
    delay: 0.32,
    sizeClass: "size-[82px]",
    positionClass:
      "hidden xl:block xl:left-1/2 xl:top-1/2 xl:-translate-x-[555px] xl:translate-y-[95px]",
  },
  {
    def: dolphinDef,
    rotate: 7,
    delay: 0.34,
    sizeClass: "size-[104px]",
    positionClass:
      "hidden xl:block xl:left-1/2 xl:top-1/2 xl:translate-x-[470px] xl:translate-y-[90px]",
  },
] as const;

function GitHubPillLink() {
  const reduceMotion = useReducedMotion();
  const [flipped, setFlipped] = useState(false);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          href={siteConfig.github}
          target="_blank"
          rel="noopener noreferrer"
          onPointerEnter={() => setFlipped(true)}
          onPointerLeave={() => setFlipped(false)}
          onFocus={() => setFlipped(true)}
          onBlur={() => setFlipped(false)}
          aria-label="Trazo on GitHub (opens in a new tab)"
          className="group flex h-8 items-center gap-1.5 rounded-[14px] px-2.5 text-xs font-medium text-foreground outline-none micro-transition hover:bg-muted active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-ring sm:h-9 sm:gap-2 sm:px-3"
        >
          <span
            aria-hidden
            className="relative flex size-[22px] shrink-0 items-center justify-center [perspective:260px]"
          >
            {reduceMotion ? (
              flipped ? (
                <Sticker def={starfishDef} size={22} />
              ) : (
                <GitHubLogo className="size-[17px] text-foreground" />
              )
            ) : (
              <motion.span
                animate={{
                  rotateY: flipped ? 180 : 0,
                  scale: flipped ? 1.12 : 1,
                }}
                transition={flipSpring}
                className="relative flex size-full items-center justify-center [transform-style:preserve-3d]"
              >
                <span className="absolute inset-0 flex items-center justify-center [backface-visibility:hidden]">
                  <GitHubLogo className="size-[17px] text-foreground" />
                </span>
                <span className="absolute inset-0 flex items-center justify-center [backface-visibility:hidden] [transform:rotateY(180deg)]">
                  <Sticker def={starfishDef} size={22} className="-rotate-6" />
                </span>
              </motion.span>
            )}
          </span>
          <span className="text-muted-foreground transition-colors group-hover:text-foreground">
            GitHub
          </span>
        </a>
      </TooltipTrigger>
      <TooltipContent side="bottom" align="end">
        <p>View Trazo on GitHub</p>
      </TooltipContent>
    </Tooltip>
  );
}

function OrbitSticker({
  item,
  shuffleSeq,
  onPoke,
}: {
  item: OrbitItem;
  shuffleSeq: number;
  onPoke: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const [wiggleSeq, setWiggleSeq] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  const timerRef = useRef<number | null>(null);
  const hoverTilt = item.rotate + (item.rotate >= 0 ? -8 : 8);

  useEffect(() => {
    if (shuffleSeq === 0 && wiggleSeq === 0) return;

    const startDelay = shuffleSeq > 0 && wiggleSeq === 0 ? Math.round(item.delay * 240) : 0;
    const startTimer = window.setTimeout(() => {
      setIsShaking(true);
      timerRef.current = window.setTimeout(() => {
        setIsShaking(false);
      }, 560);
    }, startDelay);

    return () => {
      window.clearTimeout(startTimer);
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [item.delay, shuffleSeq, wiggleSeq]);

  function handleClick() {
    onPoke();
    setWiggleSeq((seq) => seq + 1);
  }

  return (
    <div className={cn("pointer-events-auto absolute", item.positionClass)}>
      <motion.div
        initial={
          reduceMotion
            ? false
            : { opacity: 0, scale: 0.72, y: 12, rotate: -8 }
        }
        animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
        transition={{
          type: "spring",
          duration: 0.44,
          bounce: 0.34,
          delay: item.delay,
        }}
      >
        <motion.div
          animate={
            isShaking && !reduceMotion
              ? SHAKE_KEYFRAMES
              : { rotate: 0, y: 0, scale: 1 }
          }
          transition={
            isShaking && !reduceMotion
              ? SHAKE_TRANSITION
              : { duration: 0.16, ease: "easeOut" }
          }
        >
          <motion.button
            type="button"
            onClick={handleClick}
            aria-label={`Wiggle ${item.def.name} sticker`}
            initial={false}
            animate={{ rotate: item.rotate, scale: 1, y: 0 }}
            whileHover={
              reduceMotion
                ? undefined
                : { scale: 1.16, rotate: hoverTilt, y: -7 }
            }
            whileTap={
              reduceMotion
                ? undefined
                : { scale: 0.92, rotate: item.rotate, y: -1 }
            }
            transition={stickerSpring}
            className="group relative flex items-center justify-center rounded-3xl p-1.5 outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-2"
          >
            <Sticker
              def={item.def}
              className={cn(
                "pointer-events-none relative z-10 drop-shadow-[0_2px_3px_rgba(0,0,0,0.04)] transition-[filter] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] sm:group-hover:drop-shadow-[0_10px_14px_rgba(0,0,0,0.14)]",
                item.sizeClass,
              )}
            />

            <span className="pointer-events-none absolute -bottom-6 left-1/2 z-20 hidden -translate-x-1/2 translate-y-1.5 scale-95 whitespace-nowrap rounded-full bg-foreground px-2.5 py-0.5 text-[11px] font-medium text-background opacity-0 shadow-sm transition-all duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:scale-100 group-focus-visible:opacity-100 sm:block">
              {item.def.name}
            </span>

            {item.note ? (
              <span
                aria-hidden
                className={cn(
                  "pointer-events-none absolute hidden whitespace-nowrap font-caveat text-[19px] leading-none text-muted-foreground/80 transition-colors duration-150 lg:block lg:group-hover:text-foreground",
                  item.notePositionClass,
                )}
              >
                {item.note}
              </span>
            ) : null}
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
}

export function NotFoundView() {
  const reduceMotion = useReducedMotion();
  const [zeroIndex, setZeroIndex] = useState(0);
  const [shuffleSeq, setShuffleSeq] = useState(0);

  const activeZero = ZERO_STICKERS[zeroIndex];

  function cycleZeroSticker() {
    playLocateShakeSound(0);
    setZeroIndex((current) => (current + 1) % ZERO_STICKERS.length);
  }

  function shuffleScene() {
    playLocateShakeSound(0);
    setZeroIndex((current) => (current + 1) % ZERO_STICKERS.length);
    setShuffleSeq((seq) => seq + 1);
  }

  return (
    <main className="paper-dot-grid relative flex min-h-dvh w-full flex-col items-center justify-center overflow-hidden bg-background px-4 py-20 select-none">
      {/* Floating top chrome matching TopBar */}
      <header className="pointer-events-none fixed inset-x-3 top-[max(0.75rem,env(safe-area-inset-top))] z-30 flex items-center justify-between gap-2 sm:inset-x-4 sm:top-[max(1rem,env(safe-area-inset-top))]">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: -12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ ...enterSpring, delay: 0.08 }}
          className={PILL_CLASS}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/"
                aria-label="Back to Trazo canvas"
                className="group flex h-8 items-center gap-2 rounded-[14px] pl-1 pr-2.5 outline-none micro-transition hover:bg-muted active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-ring sm:h-9 sm:pl-1 sm:pr-3"
              >
                <TrazoMark
                  option={MIX_PALETTE}
                  className="size-7 transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:-rotate-6 group-hover:scale-105 sm:size-8"
                />
                <span className="font-caveat text-[24px] font-bold leading-none tracking-tight text-foreground sm:text-[26px]">
                  trazo
                </span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="start">
              <p>Back to sticker canvas</p>
            </TooltipContent>
          </Tooltip>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: -12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ ...enterSpring, delay: 0.14 }}
          className={PILL_CLASS}
        >
          <GitHubPillLink />
        </motion.div>
      </header>

      {/* Hand-placed Trazo stickers framing the 404 stage */}
      <div
        aria-label="Decorative Trazo stickers"
        className="pointer-events-none fixed inset-0 z-10 overflow-hidden"
      >
        {ORBIT_STICKERS.map((item) => (
          <OrbitSticker
            key={item.def.id}
            item={item}
            shuffleSeq={shuffleSeq}
            onPoke={() => playLocateShakeSound(0)}
          />
        ))}
      </div>

      {/* Centered 404 Hero Composition */}
      <section
        aria-labelledby="not-found-heading"
        className="relative z-20 flex w-[min(352px,calc(100vw-2rem))] flex-col items-center text-center sm:w-[460px]"
      >
        {/* Illustrated 4 [Sticker] 4 lockup */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3, ease: easeOutQuart }}
          className="relative flex items-center justify-center gap-0.5 sm:gap-1.5"
        >
          <span
            aria-hidden
            className="-rotate-6 font-caveat text-[112px] font-bold leading-[0.82] tracking-tight text-foreground sm:text-[152px]"
          >
            4
          </span>

          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                type="button"
                onClick={cycleZeroSticker}
                aria-label={`Zero illustrated as ${activeZero.name} sticker — click to swap sticker`}
                whileHover={
                  reduceMotion ? undefined : { scale: 1.1, rotate: -5, y: -5 }
                }
                whileTap={reduceMotion ? undefined : { scale: 0.9, rotate: 4 }}
                transition={stickerSpring}
                className="group relative flex size-[112px] items-center justify-center rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-ring sm:size-[144px]"
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={activeZero.id}
                    initial={
                      reduceMotion
                        ? { opacity: 0 }
                        : { opacity: 0, scale: 0.65, rotate: -14, y: 8 }
                    }
                    animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
                    exit={
                      reduceMotion
                        ? { opacity: 0 }
                        : { opacity: 0, scale: 0.65, rotate: 14, y: -8 }
                    }
                    transition={{
                      type: "spring",
                      stiffness: 460,
                      damping: 22,
                      mass: 0.55,
                    }}
                    className="flex items-center justify-center"
                  >
                    <Sticker
                      def={activeZero}
                      className="size-[104px] drop-shadow-[0_3px_5px_rgba(0,0,0,0.06)] transition-[filter] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:drop-shadow-[0_12px_16px_rgba(0,0,0,0.14)] sm:size-[136px]"
                    />
                  </motion.span>
                </AnimatePresence>
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>{activeZero.name} · click to swap</p>
            </TooltipContent>
          </Tooltip>

          <span
            aria-hidden
            className="rotate-6 font-caveat text-[112px] font-bold leading-[0.82] tracking-tight text-foreground sm:text-[152px]"
          >
            4
          </span>
          <span className="sr-only">Error 404</span>
        </motion.div>

        {/* Handwritten headline */}
        <motion.h1
          id="not-found-heading"
          initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.28, delay: 0.05, ease: easeOutQuart }}
          className="mt-2 font-caveat text-balance text-[38px] font-bold leading-[1.04] text-foreground sm:mt-3 sm:text-[52px] sm:leading-[1.03]"
        >
          This page drifted off the sheet.
        </motion.h1>

        {/* Handwritten subcopy */}
        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: 0.1, ease: easeOutQuart }}
          className="mt-2 max-w-[310px] font-caveat text-pretty text-[20px] leading-[1.26] text-muted-foreground sm:mt-2.5 sm:max-w-[400px] sm:text-[24px] sm:leading-[1.24]"
        >
          We checked every corner of the canvas, but there&apos;s no sticker
          pinned here.
        </motion.p>

        {/* Action pills matching BottomDock chrome */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ ...enterSpring, delay: 0.14 }}
          className="mt-5 flex flex-wrap items-center justify-center gap-2 sm:mt-6"
        >
          <div className="flex items-center rounded-[20px] bg-foreground p-1 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_14px_36px_-10px_rgba(0,0,0,0.18)] ring-1 ring-foreground sm:rounded-[22px] sm:p-1.5">
            <Link
              href="/"
              className="flex h-10 items-center gap-2 rounded-2xl px-4 text-[13px] font-medium text-background outline-none micro-transition hover:bg-background/10 active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-background sm:h-11 sm:px-5 sm:text-sm"
            >
              <ArrowLeft className="size-[16px] shrink-0 sm:size-[17px]" />
              <span>Back to canvas</span>
            </Link>
          </div>

          <div className="flex items-center rounded-[20px] bg-popover/92 p-1 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_14px_36px_-10px_rgba(0,0,0,0.14)] ring-1 ring-foreground/[0.07] backdrop-blur-md sm:rounded-[22px] sm:p-1.5">
            <button
              type="button"
              onClick={shuffleScene}
              className="group flex h-10 items-center gap-1.5 rounded-2xl px-3.5 text-[13px] font-medium text-muted-foreground outline-none micro-transition hover:bg-muted hover:text-foreground active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-ring sm:h-11 sm:px-4 sm:text-sm"
            >
              <RotateCw className="size-[15px] shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:rotate-45 sm:size-[16px]" />
              <span>Swap sticker</span>
            </button>
          </div>
        </motion.div>

        {/* Quiet sketchbook margin footnote matching TrazoCanvas fun facts */}
        <motion.div
          aria-hidden
          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: 0.24, ease: easeOutQuart }}
          className="mt-6 flex flex-col items-center gap-1.5 sm:mt-7"
        >
          <p className="font-caveat text-[18px] leading-none text-muted-foreground/80 sm:text-[20px]">
            All {STICKER_COUNT} hand-drawn stickers are waiting back home.
          </p>
          <svg
            viewBox="0 0 44 6"
            width="40"
            height="5"
            fill="none"
            className="opacity-75"
          >
            <path
              d="M2 3.8C10 1.4 18 5.2 26 2.8C32 1.2 38 3.6 42 2.4"
              stroke="#f97316"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        </motion.div>
      </section>
    </main>
  );
}
