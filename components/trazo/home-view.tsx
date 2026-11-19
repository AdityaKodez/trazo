"use client";

import { motion, useReducedMotion } from "motion/react";

import { ArrowUpRight } from "@/components/trazo/icons";
import { InstallCommand } from "@/components/trazo/install-command";
import { siteConfig } from "@/config/site";

const easeOutQuart = [0.23, 1, 0.32, 1] as const;

function SponsorContact() {
  return (
    <a
      href={siteConfig.author.x}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Want to sponsor? Contact me on X (opens in a new tab)"
      className="inline-flex items-center gap-1 -rotate-1 font-caveat text-[20px] leading-none text-muted-foreground outline-none transition-colors duration-200 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring sm:text-[22px]"
    >
      Want to sponsor? Contact me on X
      <ArrowUpRight className="size-3.5" />
    </a>
  );
}

export function HomeView() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      aria-label="Trazo introduction"
      className="relative z-10 flex w-[min(336px,calc(100vw-2rem))] flex-col items-center text-center sm:w-[460px]"
    >
      {/* Cute handwritten headline */}
      <motion.h1
        initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.28, ease: easeOutQuart }}
        className="font-caveat text-balance text-[38px] font-bold leading-[1.04] text-foreground sm:text-[56px] sm:leading-[1.03]"
      >
        {siteConfig.hero.headline}
      </motion.h1>

      {/* Cute handwritten description */}
      <motion.p
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.05, ease: easeOutQuart }}
        className="mt-2 max-w-[310px] font-caveat text-pretty text-[19px] leading-[1.28] text-muted-foreground sm:mt-2.5 sm:max-w-[420px] sm:text-[24px] sm:leading-[1.25]"
      >
        {siteConfig.hero.description}
      </motion.p>

      {/* Install command block */}
      <motion.div
        data-no-pan=""
        initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.28, delay: 0.1, ease: easeOutQuart }}
        className="mt-4 w-full sm:mt-5"
      >
        <InstallCommand />
      </motion.div>

      <motion.div
        data-no-pan=""
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.15, ease: easeOutQuart }}
        className="mt-3.5 sm:mt-4"
      >
        <SponsorContact />
      </motion.div>
    </section>
  );
}
