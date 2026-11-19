"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Starfish } from "trazo";

import { AkoderMark, GitHubLogo, XLogo } from "@/components/trazo/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { siteConfig } from "@/config/site";

const enterSpring = { type: "spring", stiffness: 380, damping: 30 } as const;
const flipSpring = { type: "spring", stiffness: 420, damping: 24, mass: 0.55 } as const;

const PILL_CLASS =
  "pointer-events-auto flex items-center rounded-[18px] bg-popover/92 p-1 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_12px_30px_-10px_rgba(0,0,0,0.14)] ring-1 ring-foreground/[0.07] backdrop-blur-md sm:rounded-[20px]";

function formatStarCount(count: number): string {
  if (count >= 1000) {
    const compact = (count / 1000).toFixed(count >= 10000 ? 0 : 1);
    return `${compact.replace(/\.0$/, "")}k`;
  }
  return count.toLocaleString("en-US");
}

function GitHubStarBadge({ stars }: { stars: number | null }) {
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
          aria-label={
            stars !== null
              ? `Star Trazo on GitHub (${stars.toLocaleString("en-US")} stars, opens in a new tab)`
              : "Star Trazo on GitHub (opens in a new tab)"
          }
          className="group flex h-8 items-center gap-1.5 rounded-[14px] px-2.5 text-xs font-medium text-foreground outline-none micro-transition hover:bg-muted active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-ring sm:h-9 sm:gap-2 sm:px-3"
        >
          <span
            aria-hidden
            className="relative flex size-[22px] shrink-0 items-center justify-center [perspective:260px]"
          >
            {reduceMotion ? (
              flipped ? (
                <Starfish size={22} />
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
                  <Starfish size={22} className="-rotate-6" />
                </span>
              </motion.span>
            )}
          </span>

          {stars !== null ? (
            <span className="font-mono text-[12px] font-medium tabular-nums text-foreground">
              {formatStarCount(stars)}
            </span>
          ) : (
            <span className="text-muted-foreground transition-colors group-hover:text-foreground">
              Star
            </span>
          )}
        </a>
      </TooltipTrigger>
      <TooltipContent side="bottom" align="end">
        <p>
          {stars !== null
            ? `${stars.toLocaleString("en-US")} stars on GitHub`
            : "Star on GitHub"}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

export function TopBar({ stars }: { stars: number | null }) {
  const reduceMotion = useReducedMotion();

  return (
    <header className="pointer-events-none fixed inset-x-3 top-[max(0.75rem,env(safe-area-inset-top))] z-30 flex items-center justify-between gap-2 sm:inset-x-4 sm:top-[max(1rem,env(safe-area-inset-top))]">
      {/* Author attribution + X link */}
      <motion.div
        data-no-pan=""
        initial={reduceMotion ? false : { opacity: 0, y: -12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ ...enterSpring, delay: 0.16 }}
        className={PILL_CLASS}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <a
              href={siteConfig.author.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Built by ${siteConfig.author.name} (opens in a new tab)`}
              className="group flex h-8 items-center gap-1 rounded-[14px] px-2.5 text-xs text-muted-foreground outline-none micro-transition hover:bg-muted hover:text-foreground active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-ring sm:h-9 sm:px-3"
            >
              <span className="font-caveat text-[18px] leading-none text-muted-foreground/85 transition-colors group-hover:text-foreground">
                by
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

        <span aria-hidden className="mx-0.5 h-4 w-px bg-foreground/10" />

        <Tooltip>
          <TooltipTrigger asChild>
            <a
              href={siteConfig.author.x}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow @AdiKodez on X (opens in a new tab)"
              className="flex size-8 items-center justify-center rounded-[14px] text-muted-foreground outline-none micro-transition hover:bg-muted hover:text-foreground active:scale-[0.94] focus-visible:ring-2 focus-visible:ring-ring sm:size-9"
            >
              <XLogo className="size-3.5" />
            </a>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>@AdiKodez on X</p>
          </TooltipContent>
        </Tooltip>
      </motion.div>

      {/* Live GitHub star pill */}
      <motion.div
        data-no-pan=""
        initial={reduceMotion ? false : { opacity: 0, y: -12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ ...enterSpring, delay: 0.22 }}
        className={PILL_CLASS}
      >
        <GitHubStarBadge stars={stars} />
      </motion.div>
    </header>
  );
}
