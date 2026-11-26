"use client";

import Image from "next/image";
import { m } from "motion/react";
import { memo, type FocusEvent, type MouseEvent } from "react";

import { ArrowUpRight, XLogo } from "@/components/trazo/icons";
import { getMessages } from "@/config/i18n/messages";
import {
  type CanvasTestimonial,
  type UnderlineVariant,
} from "@/config/testimonials";
import { useLocale } from "@/lib/use-locale";
import { cn } from "@/lib/utils";

const CJK_CHAR_RE = /[\u3000-\u9fff]/;

const UNDERLINE_PATHS: Record<UnderlineVariant, string> = {
  arc: "M3 5.2C26 1.8 66 1.5 97 4.4",
  wave: "M3 4.6C24 1.6 46 6.2 68 3.2C80 1.8 90 2.6 97 4.1",
  swoosh: "M3 5.5C32 1.4 68 1.2 97 3.8",
};

function CrayonUnderline({
  variant,
  color,
  align,
}: {
  variant: UnderlineVariant;
  color: string;
  align: CanvasTestimonial["align"];
}) {
  return (
    <svg
      viewBox="0 0 100 8"
      fill="none"
      aria-hidden="true"
      className={cn(
        "mt-0.5 h-[6px] w-[72px] opacity-75 transition-opacity duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:opacity-100",
        align === "right" && "ml-auto",
        align === "center" && "mx-auto w-[96px]",
      )}
    >
      <path
        d={UNDERLINE_PATHS[variant]}
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        style={{ transition: "stroke 200ms cubic-bezier(0.23, 1, 0.32, 1)" }}
      />
    </svg>
  );
}

interface CanvasTestimonialScribbleProps {
  item: CanvasTestimonial;
  index: number;
  activeColor: string | undefined;
  posScaleX: number;
  posScaleY: number;
  isMobileViewport: boolean;
  reduceMotion: boolean | null;
  onFocusItem: (
    item: CanvasTestimonial,
    event: FocusEvent<HTMLAnchorElement>,
  ) => void;
  onClickItem: (event: MouseEvent<HTMLAnchorElement>) => void;
}

export const CanvasTestimonialScribble = memo(
  function CanvasTestimonialScribble({
    item,
    index,
    activeColor,
    posScaleX,
    posScaleY,
    isMobileViewport,
    reduceMotion,
    onFocusItem,
    onClickItem,
  }: CanvasTestimonialScribbleProps) {
    const locale = useLocale();
    const ariaLabel = getMessages(locale).testimonials.ariaLabel(
      item.author,
      item.fullQuote,
    );
    const isCjkQuote = CJK_CHAR_RE.test(item.quote);
    const px = Math.round(item.x * posScaleX);
    const py =
      isMobileViewport && item.mobileY !== undefined
        ? item.mobileY
        : Math.round(item.y * posScaleY);
    const strokeColor = activeColor ?? item.accent;
    const isRight = item.align === "right";
    const isCenter = item.align === "center";

    return (
      <div
        style={{
          transform: `translate3d(${px}px, ${py}px, 0) translate(-50%, -50%)`,
        }}
        className="absolute left-0 top-0 z-10 w-max"
      >
        <m.div
          initial={reduceMotion ? false : { opacity: 0, scale: 0.84, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            type: "spring",
            duration: 0.44,
            bounce: 0.28,
            delay: 0.22 + index * 0.055,
          }}
        >
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            draggable={false}
            aria-label={ariaLabel}
            onFocus={(event) => onFocusItem(item, event)}
            onClick={onClickItem}
            style={{ transform: `rotate(${item.rotate}deg)` }}
            className={cn(
              "group relative flex items-center gap-2.5 rounded-2xl px-2 py-1.5 outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isRight && "flex-row-reverse text-right",
              !isRight && "flex-row text-left",
            )}
          >
            {/* Die-cut circular X PFP pin */}
            <span className="relative shrink-0">
              <span className="block overflow-hidden rounded-full bg-background p-[2px] shadow-[0_2px_8px_rgba(0,0,0,0.11),0_0_0_1px_rgba(24,23,21,0.08)]">
                <Image
                  src={item.avatar}
                  alt=""
                  width={40}
                  height={40}
                  sizes="40px"
                  draggable={false}
                  className="size-8 rounded-full object-cover sm:size-9"
                />
              </span>
              <span
                aria-hidden="true"
                className="absolute -bottom-0.5 -right-0.5 flex size-[15px] items-center justify-center rounded-full bg-foreground text-background ring-[1.5px] ring-background sm:size-4"
              >
                <XLogo className="size-[8px] sm:size-[9px]" />
              </span>
            </span>

            {/* Handwritten Caveat ink quote + handle + crayon underline */}
            <span
              className={cn(
                "flex min-w-0 flex-col",
                isRight && "items-end",
                !isRight && "items-start",
              )}
            >
              <span
                className={cn(
                  "font-bold text-foreground/85 transition-colors duration-150 group-hover:text-foreground",
                  isCjkQuote
                    ? "text-[15px] leading-[1.3] sm:text-[17px]"
                    : "font-caveat text-[20px] leading-[1.06] sm:text-[23px]",
                  isCenter
                    ? "whitespace-nowrap"
                    : "max-w-[162px] text-balance sm:max-w-[186px]",
                )}
              >
                {item.quote}
              </span>
              <span className="mt-0.5 inline-flex items-center gap-0.5 text-[11px] font-medium leading-none text-muted-foreground transition-colors duration-150 group-hover:text-foreground">
                <span className="testimonial-handle">{item.handle}</span>
                <ArrowUpRight className="size-3 opacity-70 transition-opacity duration-150 group-hover:opacity-100" />
              </span>
              <CrayonUnderline
                variant={item.underline}
                color={strokeColor}
                align={isRight ? "right" : "left"}
              />
            </span>
          </a>
        </m.div>
      </div>
    );
  },
);
