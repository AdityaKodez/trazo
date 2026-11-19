"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";

import { ArrowUpRight, Plus } from "@/components/trazo/icons";
import { InstallCommand } from "@/components/trazo/install-command";
import { siteConfig } from "@/config/site";
import { getEnabledSponsors, sponsorsSectionConfig } from "@/config/sponsors";

const easeOutQuart = [0.23, 1, 0.32, 1] as const;
const fanSpring = { type: "spring", stiffness: 420, damping: 28, mass: 0.6 } as const;
const liftSpring = { type: "spring", stiffness: 600, damping: 22, mass: 0.4 } as const;
const FAN_STEP_PX = 11;

type SponsorCaption = { id: string; label: string; note?: string; external: boolean };

function SponsorStrip() {
  const sponsors = getEnabledSponsors();
  const reduceMotion = useReducedMotion();
  const [caption, setCaption] = useState<SponsorCaption | null>(null);
  const itemCount = sponsors.length + 1;
  const center = (itemCount - 1) / 2;
  const spread = caption !== null && !reduceMotion;

  const supportCaption: SponsorCaption = {
    id: "support",
    label: sponsorsSectionConfig.supportLabel,
    note: sponsorsSectionConfig.supportNote,
    external: true,
  };

  function itemProps(index: number, next: SponsorCaption) {
    return {
      animate: { x: spread ? (index - center) * FAN_STEP_PX : 0 },
      transition: fanSpring,
      onPointerEnter: () => setCaption(next),
      onFocus: () => setCaption(next),
      onBlur: () => setCaption(null),
      style: { zIndex: caption?.id === next.id ? itemCount + 1 : index },
      className: "relative -ml-2 first:ml-0",
    };
  }

  const avatarGestures = reduceMotion
    ? {}
    : {
        whileHover: { y: -4, scale: 1.12, rotate: -6 },
        whileFocus: { y: -4, scale: 1.12, rotate: -6 },
        whileTap: { scale: 0.92 },
        transition: liftSpring,
      };

  return (
    <div className="relative flex items-center gap-2.5">
      <span className="-rotate-3 font-caveat text-[21px] leading-none text-muted-foreground">
        {sponsorsSectionConfig.heading}
      </span>
      <ul
        aria-label="Trazo supporters"
        className="flex items-center py-1"
        onPointerLeave={() => setCaption(null)}
      >
        {sponsors.map((sponsor, index) => (
          <motion.li
            key={sponsor.id}
            {...itemProps(index, { id: sponsor.id, label: sponsor.name, external: true })}
          >
            <motion.a
              href={sponsor.url ?? "https://akoder.xyz"}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${sponsor.name} (opens in a new tab)`}
              className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-muted shadow-[0_1px_3px_rgba(0,0,0,0.14)] ring-2 ring-background outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              {...avatarGestures}
            >
              {sponsor.logo ? (
                <Image
                  src={sponsor.logo}
                  alt=""
                  width={32}
                  height={32}
                  unoptimized
                  draggable={false}
                  className="size-full object-cover"
                />
              ) : (
                <span className="text-xs font-semibold text-foreground">
                  {sponsor.name.charAt(0)}
                </span>
              )}
            </motion.a>
          </motion.li>
        ))}
        <motion.li {...itemProps(sponsors.length, supportCaption)}>
          <motion.a
            href={sponsorsSectionConfig.supportHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${sponsorsSectionConfig.supportLabel} (opens in a new tab)`}
            className="flex size-8 items-center justify-center rounded-full border-[1.5px] border-dashed border-foreground/30 bg-background text-muted-foreground outline-none transition-colors duration-200 hover:border-foreground/70 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            {...avatarGestures}
          >
            <Plus className="size-3.5" />
          </motion.a>
        </motion.li>
      </ul>

      {/* Handwritten caption names whichever supporter is hovered or focused */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-full mt-1.5 h-8 w-max -translate-x-1/2 text-center"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {caption ? (
            <motion.span
              key={caption.id}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4, filter: "blur(2px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 3, filter: "blur(2px)" }}
              transition={{ duration: 0.18, ease: easeOutQuart }}
              className="flex items-center gap-1 whitespace-nowrap font-caveat text-[20px] leading-none text-foreground"
            >
              {caption.label}
              {caption.note ? (
                <span className="text-muted-foreground">· {caption.note}</span>
              ) : null}
              {caption.external ? <ArrowUpRight className="size-3.5" /> : null}
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function HomeView() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      aria-label="Trazo introduction"
      className="relative z-10 flex w-[335px] max-w-[92vw] flex-col items-center text-center sm:w-[460px]"
    >
      {/* Cute handwritten headline */}
      <motion.h1
        initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.28, ease: easeOutQuart }}
        className="font-caveat text-balance text-[44px] font-bold leading-[1.03] text-foreground sm:text-[56px]"
      >
        {siteConfig.hero.headline}
      </motion.h1>

      {/* Cute handwritten description */}
      <motion.p
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.05, ease: easeOutQuart }}
        className="mt-2.5 max-w-[420px] font-caveat text-pretty text-[21px] leading-[1.25] text-muted-foreground sm:text-[24px]"
      >
        {siteConfig.hero.description}
      </motion.p>

      {/* Install command block */}
      <motion.div
        data-no-pan=""
        initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.28, delay: 0.1, ease: easeOutQuart }}
        className="mt-5 w-full"
      >
        <InstallCommand />
      </motion.div>

      <motion.div
        data-no-pan=""
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.15, ease: easeOutQuart }}
        className="mt-4"
      >
        <SponsorStrip />
      </motion.div>
    </section>
  );
}
