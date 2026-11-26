"use client";

import { memo, useEffect, useState } from "react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { starfishDef } from "trazo/catalog/ocean";
import { Sticker } from "trazo/scribble";

import { AkoderMark, GitHubLogo } from "@/components/trazo/icons";
import { LocaleSwitcher } from "@/components/trazo/locale-switcher";
import { useTrazoCanvasState } from "@/components/trazo/trazo-experience";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getMessages } from "@/config/i18n/messages";
import { resolveStickerColor } from "@/config/palette";
import { siteConfig } from "@/config/site";
import { useLocale, type Locale } from "@/lib/use-locale";
import { cn } from "@/lib/utils";

const STAR_MILESTONE = 100;
const PUFF_START_DELAY_MS = 480;
const PUFF_DURATION_MS = 1280;

const enterSpring = { type: "spring", stiffness: 380, damping: 30 } as const;
const flipSpring = { type: "spring", stiffness: 420, damping: 24, mass: 0.55 } as const;
const sparklePopSpring = { type: "spring", stiffness: 460, damping: 22, mass: 0.5 } as const;
const puffEase = [0.22, 1, 0.36, 1] as const;
const enterFrom = { opacity: 0, y: -12, scale: 0.96 } as const;
const enterTo = { opacity: 1, y: 0, scale: 1 } as const;
const reduceEntrance = "motion-reduce:opacity-100! motion-reduce:transform-none!";

const PILL_CLASS =
  "pointer-events-auto flex items-center rounded-[18px] bg-popover/95 p-1 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_12px_30px_-10px_rgba(0,0,0,0.14)] ring-1 ring-foreground/[0.07] backdrop-blur-sm sm:rounded-[20px]";

type BadgeSparkleKind =
  | "sparkle-four"
  | "star-outline"
  | "solid-star"
  | "sparkle-cross";

const SPARKLE_DEFAULT_COLORS: Record<BadgeSparkleKind, string> = {
  "sparkle-four": "#f594bb",
  "star-outline": "#f38376",
  "solid-star": "#9be3a3",
  "sparkle-cross": "#8da6dc",
};

function BadgeSparkle({
  kind,
  size,
  color,
}: {
  kind: BadgeSparkleKind;
  size: number;
  color: string | undefined;
}) {
  const tint = color ?? SPARKLE_DEFAULT_COLORS[kind];

  switch (kind) {
    case "sparkle-four":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M12.2 2.4c.7 4.4 2.1 7.1 8.8 9.2-6.5 1.8-8.1 4.4-9 9.8-.9-5.3-2.5-7.9-9-9.5 6.4-1.9 8.2-4.6 9.2-9.5Z"
            fill={tint}
            stroke={tint}
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "star-outline":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M12.1 3.3c.6 1.9 1.6 4.1 2.4 5.5 1.7.2 4.1.5 5.9.9-1.3 1.4-2.9 2.9-4.2 4.1.4 1.8.8 4.1 1 5.9-1.8-.9-3.6-1.9-5.1-2.8-1.6.9-3.5 1.9-5.3 2.7.3-1.8.8-4.1 1.2-5.9-1.4-1.3-3-2.7-4.3-4.1 1.8-.4 4.1-.7 5.8-.9.9-1.5 1.8-3.6 2.6-5.4Z"
            stroke={tint}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "solid-star":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M12.2 2.9c.7 1.9 1.7 4.1 2.6 5.6 1.7.2 4.1.5 6 1-1.3 1.4-3 3-4.3 4.2.4 1.8.8 4.2 1 6-1.8-.9-3.7-1.9-5.3-2.8-1.6.9-3.5 1.9-5.4 2.7.3-1.8.8-4.1 1.2-6-1.4-1.3-3.1-2.8-4.4-4.2 1.9-.4 4.2-.7 5.9-.9.9-1.5 1.9-3.7 2.7-5.6Z"
            fill={tint}
            stroke={tint}
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "sparkle-cross":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M12.4 3.4c-.3 5.4-.4 11.4-.1 17.2M3.6 11.9c5.6-.4 11.3-.3 16.9.2"
            stroke={tint}
            strokeWidth="3.2"
            strokeLinecap="round"
          />
        </svg>
      );
  }
}

interface SparkleParticleSpec {
  id: BadgeSparkleKind;
  size: number;
  left: string;
  top: string;
  tx: number;
  ty: number;
  rotateFrom: number;
  rotateTo: number;
  delay: number;
  duration: number;
}

// Trajectories bias left & downward so particles stay well inside the top-right viewport margins.
const MILESTONE_PUFF_PARTICLES: readonly SparkleParticleSpec[] = [
  {
    id: "sparkle-four",
    size: 13,
    left: "12%",
    top: "14%",
    tx: -24,
    ty: -10,
    rotateFrom: -18,
    rotateTo: 10,
    delay: 0,
    duration: 1.12,
  },
  {
    id: "star-outline",
    size: 12,
    left: "4%",
    top: "68%",
    tx: -28,
    ty: 14,
    rotateFrom: -10,
    rotateTo: 18,
    delay: 0.08,
    duration: 1.18,
  },
  {
    id: "solid-star",
    size: 12,
    left: "44%",
    top: "86%",
    tx: -8,
    ty: 22,
    rotateFrom: 14,
    rotateTo: -14,
    delay: 0.14,
    duration: 1.22,
  },
  {
    id: "sparkle-cross",
    size: 11,
    left: "84%",
    top: "82%",
    tx: 8,
    ty: 18,
    rotateFrom: 12,
    rotateTo: -16,
    delay: 0.18,
    duration: 1.16,
  },
];

function formatStarCount(count: number, locale: Locale): string {
  if (count >= 1000) {
    const compact = (count / 1000).toFixed(count >= 10000 ? 0 : 1);
    return `${compact.replace(/\.0$/, "")}k`;
  }
  return count.toLocaleString(locale);
}

function CornerSparkle({
  kind,
  size,
  color,
  baseRotate,
  reduceMotion,
  className,
}: {
  kind: BadgeSparkleKind;
  size: number;
  color: string | undefined;
  baseRotate: number;
  reduceMotion: boolean | null;
  className: string;
}) {
  return (
    <m.span
      aria-hidden="true"
      initial={reduceMotion ? { opacity: 0.9, scale: 1 } : { opacity: 0, scale: 0.35, rotate: baseRotate - 12 }}
      animate={reduceMotion ? { opacity: 0.9, scale: 1 } : { opacity: 1, scale: 1, rotate: baseRotate }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.35, rotate: baseRotate + 10 }}
      transition={reduceMotion ? { duration: 0 } : sparklePopSpring}
      className={cn("pointer-events-none absolute z-20", className)}
    >
      <m.span
        className="block"
        animate={
          reduceMotion
            ? undefined
            : {
                scale: [0.88, 1.14, 0.88],
                rotate: [0, 12, 0],
                opacity: [0.74, 1, 0.74],
              }
        }
        transition={
          reduceMotion
            ? undefined
            : {
                duration: 1.75,
                delay: 0.22,
                repeat: Infinity,
                ease: "easeInOut",
              }
        }
      >
        <BadgeSparkle kind={kind} size={size} color={color} />
      </m.span>
    </m.span>
  );
}

const GitHubStarBadge = memo(function GitHubStarBadge({ stars }: { stars: number | null }) {
  const { paletteId } = useTrazoCanvasState();
  const locale = useLocale();
  const t = getMessages(locale).topBar;
  const activeColor = resolveStickerColor(paletteId);
  const reduceMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const [introCelebrating, setIntroCelebrating] = useState(false);

  const isMilestone = stars !== null && stars >= STAR_MILESTONE;
  const activeIntro = isMilestone && !reduceMotion && introCelebrating;
  const flipped = hovered || activeIntro;

  useEffect(() => {
    if (!isMilestone || reduceMotion) {
      return;
    }

    const startTimer = window.setTimeout(() => {
      setIntroCelebrating(true);
    }, PUFF_START_DELAY_MS);

    const endTimer = window.setTimeout(() => {
      setIntroCelebrating(false);
    }, PUFF_START_DELAY_MS + PUFF_DURATION_MS);

    return () => {
      window.clearTimeout(startTimer);
      window.clearTimeout(endTimer);
    };
  }, [isMilestone, reduceMotion]);

  return (
    <div className="relative" data-milestone={isMilestone ? "true" : undefined}>
      {/* One-time subtle crayon sparkle puff on first load when stars >= 100 */}
      <AnimatePresence>
        {activeIntro ? (
          <div
            key="milestone-puff"
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-20 overflow-visible"
          >
            {MILESTONE_PUFF_PARTICLES.map((particle) => (
              <m.span
                key={particle.id}
                style={{ left: particle.left, top: particle.top }}
                initial={{
                  opacity: 0,
                  x: 0,
                  y: 0,
                  scale: 0.28,
                  rotate: particle.rotateFrom,
                }}
                animate={{
                  opacity: [0, 1, 0.92, 0],
                  x: [0, particle.tx * 0.48, particle.tx * 0.92, particle.tx],
                  y: [0, particle.ty * 0.48, particle.ty * 0.92, particle.ty - 4],
                  scale: [0.28, 1.12, 0.96, 0.64],
                  rotate: [
                    particle.rotateFrom,
                    (particle.rotateFrom + particle.rotateTo) / 2,
                    particle.rotateTo,
                    particle.rotateTo,
                  ],
                }}
                transition={{
                  duration: particle.duration,
                  delay: particle.delay,
                  times: [0, 0.2, 0.65, 1],
                  ease: puffEase,
                }}
                className="absolute"
              >
                <BadgeSparkle kind={particle.id} size={particle.size} color={activeColor} />
              </m.span>
            ))}
          </div>
        ) : null}
      </AnimatePresence>

      {/* Subtle corner sparkles while hovering/focusing the pill at 100+ stars */}
      <AnimatePresence>
        {isMilestone && hovered ? (
          <>
            <CornerSparkle
              key="corner-tl"
              kind="sparkle-four"
              size={13}
              color={activeColor}
              baseRotate={-14}
              reduceMotion={reduceMotion}
              className="-left-2 -top-1.5"
            />
            <CornerSparkle
              key="corner-br"
              kind="star-outline"
              size={12}
              color={activeColor}
              baseRotate={16}
              reduceMotion={reduceMotion}
              className="-bottom-1.5 -right-1.5"
            />
          </>
        ) : null}
      </AnimatePresence>

      <div className={cn(PILL_CLASS, "relative z-10")}>
        <Tooltip>
          <TooltipTrigger asChild>
            <a
              href={siteConfig.github}
              target="_blank"
              rel="noopener noreferrer"
              onPointerEnter={() => setHovered(true)}
              onPointerLeave={() => setHovered(false)}
              onFocus={() => setHovered(true)}
              onBlur={() => setHovered(false)}
              aria-label={t.starAriaLabel(stars)}
              className="group flex h-8 items-center gap-1.5 rounded-[14px] px-2.5 text-xs font-medium text-foreground outline-none micro-transition hover:bg-muted active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-ring sm:h-9 sm:gap-2 sm:px-3"
            >
              <span
                aria-hidden
                className="relative flex size-[22px] shrink-0 items-center justify-center [perspective:260px]"
              >
                <m.span
                  animate={{
                    rotateY: flipped ? 180 : 0,
                    scale: flipped && !reduceMotion ? 1.12 : 1,
                  }}
                  transition={reduceMotion ? { duration: 0 } : flipSpring}
                  className="relative flex size-full items-center justify-center [transform-style:preserve-3d]"
                >
                  <span className="absolute inset-0 flex items-center justify-center [backface-visibility:hidden]">
                    <GitHubLogo className="size-[17px] text-foreground" />
                  </span>
                  <span className="absolute inset-0 flex items-center justify-center [backface-visibility:hidden] [transform:rotateY(180deg)]">
                    <m.span
                      className="flex items-center justify-center"
                      animate={
                        activeIntro
                          ? {
                              rotate: [-6, -18, 10, -10, -6],
                              scale: [1, 1.14, 1.1, 1.05, 1],
                            }
                          : { rotate: -6, scale: 1 }
                      }
                      transition={
                        activeIntro
                          ? { duration: 0.62, ease: puffEase }
                          : { duration: 0.2 }
                      }
                    >
                      <Sticker def={starfishDef} size={22} />
                    </m.span>
                  </span>
                </m.span>
              </span>

              {stars !== null ? (
                <span className="font-mono text-[12px] font-medium tabular-nums text-foreground">
                  {formatStarCount(stars, locale)}
                </span>
              ) : (
                <span className="text-muted-foreground transition-colors group-hover:text-foreground">
                  {t.starLabel}
                </span>
              )}
            </a>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="end">
            {isMilestone ? (
              <p
                className={cn(
                  "text-[#f9a8d4]",
                  locale === "en"
                    ? "font-caveat text-[16px] leading-none"
                    : "text-xs font-medium",
                )}
              >
                {t.starMilestoneTooltip}
              </p>
            ) : (
              <p>{t.starTooltip(stars)}</p>
            )}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
});

export const TopBar = memo(function TopBar({ stars }: { stars: number | null }) {
  const reduceMotion = useReducedMotion();
  const locale = useLocale();
  const t = getMessages(locale).topBar;

  return (
    <header className="pointer-events-none fixed inset-x-3 top-[max(0.75rem,env(safe-area-inset-top))] z-30 flex items-center justify-between gap-2 sm:inset-x-4 sm:top-[max(1rem,env(safe-area-inset-top))]">
      {/* Author attribution */}
      <m.div
        data-no-pan=""
        initial={enterFrom}
        animate={enterTo}
        transition={reduceMotion ? { duration: 0 } : { ...enterSpring, delay: 0.16 }}
        className={cn(PILL_CLASS, reduceEntrance)}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <a
              href={siteConfig.author.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t.authorAriaLabel(siteConfig.author.name)}
              className="group flex h-8 items-center gap-1 whitespace-nowrap rounded-[14px] px-2.5 text-xs text-muted-foreground outline-none micro-transition hover:bg-muted hover:text-foreground active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-ring sm:h-9 sm:px-3"
            >
              <span className="inline-grid h-5 w-[1.65rem] shrink-0 place-items-center">
                <AnimatePresence initial={false}>
                  <m.span
                    key={locale}
                    initial={reduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : { duration: 0.16, ease: puffEase }
                    }
                    className={cn(
                      "col-start-1 row-start-1 whitespace-nowrap leading-none text-muted-foreground/85 transition-colors group-hover:text-foreground",
                      locale === "en" ? "font-caveat text-[18px]" : "text-[11px]",
                    )}
                  >
                    {t.byLabel}
                  </m.span>
                </AnimatePresence>
              </span>
              <span className="inline-flex items-baseline font-medium text-foreground">
                <AkoderMark className="mr-[0.5px] inline-block size-[13px] shrink-0 translate-y-[1.5px] transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:-rotate-6 group-hover:scale-110" />
                <span className="sr-only">A</span>
                <span>ditya</span>
              </span>
            </a>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="start">
            <p>{siteConfig.author.name} · akoder.xyz</p>
          </TooltipContent>
        </Tooltip>
      </m.div>

      <m.div
        data-no-pan=""
        initial={enterFrom}
        animate={enterTo}
        transition={reduceMotion ? { duration: 0 } : { ...enterSpring, delay: 0.22 }}
        className={cn("flex items-center gap-1.5 sm:gap-2", reduceEntrance)}
      >
        <LocaleSwitcher />
        <GitHubStarBadge stars={stars} />
      </m.div>
    </header>
  );
});
