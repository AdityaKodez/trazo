"use client";

import { usePathname } from "next/navigation";
import { memo } from "react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";

import { ArrowUpRight } from "@/components/trazo/icons";
import { InstallCommand } from "@/components/trazo/install-command";
import { getMessages } from "@/config/i18n/messages";
import { siteConfig } from "@/config/site";
import { useLocale } from "@/lib/use-locale";
import { cn } from "@/lib/utils";

const copyEase = [0.22, 1, 0.36, 1] as const;

function SponsorContact({ reduceMotion }: { reduceMotion: boolean | null }) {
  const locale = useLocale();
  const t = getMessages(locale).hero;
  const isCjk = locale !== "en";

  return (
    <AnimatePresence initial={false}>
      <m.a
        key={locale}
        href={siteConfig.author.x}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t.sponsorAriaLabel}
        initial={
          reduceMotion ? false : { opacity: 0, filter: "blur(3px)", y: 2 }
        }
        animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
        exit={
          reduceMotion
            ? { opacity: 0 }
            : { opacity: 0, filter: "blur(3px)", y: -2 }
        }
        transition={
          reduceMotion ? { duration: 0 } : { duration: 0.18, ease: copyEase }
        }
        className={cn(
          "col-start-1 row-start-1 inline-flex items-center justify-center gap-1 -rotate-1 leading-none text-muted-foreground outline-none transition-colors duration-200 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring",
          isCjk
            ? "text-[13px] font-medium sm:text-[14px]"
            : "font-hand text-[14.5px] font-medium sm:text-[15.5px]",
        )}
      >
        {t.sponsorCta}
        <ArrowUpRight className="size-3.5 shrink-0" />
      </m.a>
    </AnimatePresence>
  );
}

export const HomeView = memo(function HomeView({
  npmDownloads,
}: {
  npmDownloads: number | null;
}) {
  const reduceMotion = useReducedMotion();
  const locale = useLocale();
  const t = getMessages(locale).hero;
  const isCjk = locale !== "en";
  const Heading = usePathname() === "/" ? "h1" : "p";

  const crossfadeInitial = reduceMotion
    ? false
    : { opacity: 0, filter: "blur(3px)", y: 2 };
  const crossfadeAnimate = { opacity: 1, filter: "blur(0px)", y: 0 };
  const crossfadeExit = reduceMotion
    ? { opacity: 0 }
    : { opacity: 0, filter: "blur(3px)", y: -2 };
  const crossfadeTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.18, ease: copyEase };

  return (
    <section
      aria-label={t.sectionAriaLabel}
      className="relative z-10 flex w-[min(336px,calc(100vw-2rem))] flex-col items-center text-center sm:w-[460px]"
    >
      <div className="grid min-h-[200px] w-full items-center sm:min-h-[224px]">
        <AnimatePresence initial={false}>
          <m.div
            key={locale}
            initial={crossfadeInitial}
            animate={crossfadeAnimate}
            exit={crossfadeExit}
            transition={crossfadeTransition}
            className="col-start-1 row-start-1 flex w-full flex-col items-center"
          >
            <Heading
              className={cn(
                "flex min-h-[84px] items-end justify-center text-balance font-bold text-foreground sm:min-h-[118px]",
                isCjk
                  ? "font-sans text-[26px] leading-[1.28] tracking-[-0.02em] sm:text-[34px] sm:leading-[1.24]"
                  : "font-hand text-[28px] leading-[1.16] tracking-[-0.02em] sm:text-[38px] sm:leading-[1.14]",
              )}
            >
              {t.headline}
            </Heading>
            <p
              className={cn(
                "mt-2 min-h-[100px] text-pretty text-muted-foreground sm:mt-2.5 sm:min-h-[94px]",
                isCjk
                  ? "max-w-[320px] font-sans text-[13.5px] leading-[1.65] sm:max-w-[430px] sm:text-[15px] sm:leading-[1.65]"
                  : "max-w-[320px] font-hand text-[14px] leading-[1.52] sm:max-w-[430px] sm:text-[16px] sm:leading-[1.5]",
              )}
            >
              {t.description}
            </p>
          </m.div>
        </AnimatePresence>
      </div>

      {/* Install command block */}
      <div
        data-no-pan=""
        className="mt-4 w-full sm:mt-5"
      >
        <InstallCommand />
      </div>

      {npmDownloads !== null && (
        <div
          data-no-pan=""
          className="mt-2.5 grid min-h-[20px] w-full place-items-center"
        >
          <AnimatePresence initial={false}>
            <m.a
              key={locale}
              href={siteConfig.npm}
              target="_blank"
              rel="noopener noreferrer"
              initial={crossfadeInitial}
              animate={crossfadeAnimate}
              exit={crossfadeExit}
              transition={crossfadeTransition}
              className="col-start-1 row-start-1 inline-flex items-center gap-1 text-xs tabular-nums text-muted-foreground outline-none transition-colors duration-200 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              {t.npmDownloads(npmDownloads)}
              <ArrowUpRight className="size-3 shrink-0" />
              <span className="sr-only">{t.opensInNewTab}</span>
            </m.a>
          </AnimatePresence>
        </div>
      )}

      <div
        data-no-pan=""
        className="mt-3.5 grid h-[32px] w-full place-items-center sm:mt-4 sm:h-[34px]"
      >
        <SponsorContact reduceMotion={reduceMotion} />
      </div>
    </section>
  );
});
