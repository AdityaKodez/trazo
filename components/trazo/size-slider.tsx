"use client";

import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import {
  m,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";

import { cn } from "@/lib/utils";

const THUMB_SIZE = 22;
const PILL_GAP = 4;
const MAX_NUDGE = 3;

const SNAP_SPRING = { stiffness: 520, damping: 36, mass: 0.65 } as const;
const NUDGE_SPRING = { stiffness: 620, damping: 36, mass: 0.4 } as const;
const DOT_TRANSITION = { duration: 0.16, ease: [0.23, 1, 0.32, 1] } as const;

export interface SizeSliderProps {
  steps: readonly number[];
  value: number;
  onChange: (value: number) => void;
  ariaLabel?: string;
  formatValueText?: (value: number) => string;
  className?: string;
}

export function findNearestStepIndex(steps: readonly number[], value: number): number {
  let nearest = 0;
  let minDiff = Math.abs(steps[0] - value);
  for (let i = 1; i < steps.length; i += 1) {
    const diff = Math.abs(steps[i] - value);
    if (diff < minDiff) {
      minDiff = diff;
      nearest = i;
    }
  }
  return nearest;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export const SizeSlider = memo(function SizeSlider({
  steps,
  value,
  onChange,
  ariaLabel = "Size",
  formatValueText = (v) => `${v} pixels`,
  className,
}: SizeSliderProps) {
  const reduceMotion = useReducedMotion();
  const trackRef = useRef<HTMLDivElement | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const hasMeasuredRef = useRef(false);

  const [trackWidth, setTrackWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxIndex = Math.max(steps.length - 1, 1);
  const activeIndex = findNearestStepIndex(steps, value);
  const activeValue = steps[activeIndex] ?? value;
  const activeIndexRef = useRef(activeIndex);

  const trackWidthMV = useMotionValue(0);
  const snapSpring = useSpring(0, SNAP_SPRING);
  const nudgeSpring = useSpring(0, NUDGE_SPRING);

  const stepOffset = useCallback(
    (index: number, width: number) => {
      const travel = Math.max(0, width - THUMB_SIZE);
      return (index / maxIndex) * travel;
    },
    [maxIndex],
  );

  useLayoutEffect(() => {
    const node = trackRef.current;
    if (!node) return;

    const syncWidth = (nextWidth: number) => {
      if (nextWidth <= 0) return;
      trackWidthMV.set(nextWidth);
      setTrackWidth(nextWidth);
      const target = stepOffset(activeIndexRef.current, nextWidth);
      snapSpring.jump(target);
      nudgeSpring.jump(0);
      hasMeasuredRef.current = true;
    };

    syncWidth(node.clientWidth);

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? node.clientWidth;
      if (width > 0 && Math.abs(width - trackWidthMV.get()) > 0.5) {
        syncWidth(width);
      }
    });
    observer.observe(node);

    return () => observer.disconnect();
  }, [nudgeSpring, snapSpring, stepOffset, trackWidthMV]);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
    if (!hasMeasuredRef.current || trackWidth <= 0) return;
    const target = stepOffset(activeIndex, trackWidth);
    if (reduceMotion) {
      snapSpring.jump(target);
    } else {
      snapSpring.set(target);
    }
  }, [activeIndex, reduceMotion, snapSpring, stepOffset, trackWidth]);

  const thumbX = useTransform([snapSpring, nudgeSpring, trackWidthMV], ([s, n, w]) => {
    const maxTravel = Math.max(0, (w as number) - THUMB_SIZE);
    return clamp((s as number) + (n as number), 0, maxTravel);
  });

  const pillTranslateX = useTransform([thumbX, trackWidthMV], ([x, w]) => {
    const pillWidth = Math.max(0, (x as number) - PILL_GAP);
    return pillWidth - (w as number);
  });

  const pillOpacity = useTransform(thumbX, [0, PILL_GAP + 2, THUMB_SIZE], [0, 0.35, 1]);

  const resolvePointer = useCallback(
    (clientX: number) => {
      const node = trackRef.current;
      if (!node) return null;
      const rect = node.getBoundingClientRect();
      const travel = Math.max(1, rect.width - THUMB_SIZE);
      const rawX = clamp(clientX - rect.left - THUMB_SIZE / 2, 0, travel);
      const index = clamp(Math.round((rawX / travel) * maxIndex), 0, maxIndex);
      const snapX = (index / maxIndex) * travel;
      const scale = trackWidth > 0 && rect.width > 0 ? trackWidth / rect.width : 1;
      const nudge = clamp((rawX - snapX) * scale * 0.16, -MAX_NUDGE, MAX_NUDGE);
      return { index, nudge };
    },
    [maxIndex, trackWidth],
  );

  function commitIndex(nextIndex: number) {
    const clamped = clamp(nextIndex, 0, maxIndex);
    const nextValue = steps[clamped];
    if (nextValue !== undefined && nextValue !== activeValue) {
      onChange(nextValue);
    }
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    const resolved = resolvePointer(event.clientX);
    if (!resolved) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    activePointerIdRef.current = event.pointerId;
    setIsDragging(true);
    event.currentTarget.focus({ preventScroll: true });
    commitIndex(resolved.index);
    if (!reduceMotion) {
      nudgeSpring.set(resolved.nudge);
    }
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const resolved = resolvePointer(event.clientX);
    if (!resolved) return;

    if (activePointerIdRef.current === event.pointerId) {
      commitIndex(resolved.index);
      if (!reduceMotion) {
        nudgeSpring.set(resolved.nudge);
      }
      return;
    }

    if (event.pointerType === "mouse") {
      setHoveredIndex(resolved.index);
    }
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    if (activePointerIdRef.current !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    activePointerIdRef.current = null;
    setIsDragging(false);
    if (reduceMotion) {
      nudgeSpring.jump(0);
    } else {
      nudgeSpring.set(0);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    switch (event.key) {
      case "ArrowRight":
      case "ArrowUp":
        event.preventDefault();
        commitIndex(activeIndex + 1);
        break;
      case "ArrowLeft":
      case "ArrowDown":
        event.preventDefault();
        commitIndex(activeIndex - 1);
        break;
      case "PageUp":
        event.preventDefault();
        commitIndex(activeIndex + 2);
        break;
      case "PageDown":
        event.preventDefault();
        commitIndex(activeIndex - 2);
        break;
      case "Home":
        event.preventDefault();
        commitIndex(0);
        break;
      case "End":
        event.preventDefault();
        commitIndex(maxIndex);
        break;
    }
  }

  return (
    <div
      ref={trackRef}
      role="slider"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-valuemin={steps[0]}
      aria-valuemax={steps[maxIndex]}
      aria-valuenow={activeValue}
      aria-valuetext={formatValueText(activeValue)}
      data-vaul-no-drag=""
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={() => setHoveredIndex(null)}
      onKeyDown={handleKeyDown}
      className={cn(
        "group relative flex h-8 min-w-0 flex-1 select-none touch-none items-center rounded-full outline-none",
        isDragging ? "cursor-grabbing" : "cursor-pointer",
        className,
      )}
    >
      {/* Step dots along the track */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0"
        style={{ left: THUMB_SIZE / 2, right: THUMB_SIZE / 2 }}
      >
        {steps.map((step, index) => {
          const isCovered = index <= activeIndex;
          const isHovered = !isDragging && hoveredIndex === index && !isCovered;
          return (
            <m.span
              key={step}
              initial={false}
              animate={{
                opacity: isCovered ? 0 : 1,
                scale: isCovered ? 0.5 : isHovered ? 1.35 : 1,
              }}
              transition={reduceMotion ? { duration: 0 } : DOT_TRANSITION}
              style={{ left: `${(index / maxIndex) * 100}%` }}
              className={cn(
                "absolute top-1/2 -ml-[3px] -mt-[3px] size-1.5 rounded-full transition-colors duration-150",
                isHovered ? "bg-foreground/45" : "bg-foreground/18",
              )}
            />
          );
        })}
      </div>

      {/* Monochrome ink pill fill (compositor-only translateX + opacity) */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none relative w-full overflow-hidden rounded-full",
          trackWidth === 0 && "opacity-0",
        )}
        style={{ height: THUMB_SIZE }}
      >
        <m.div
          style={{
            x: pillTranslateX,
            opacity: pillOpacity,
            background:
              "linear-gradient(to right, color-mix(in oklab, var(--foreground) 16%, var(--popover)) 0%, color-mix(in oklab, var(--foreground) 50%, var(--popover)) 55%, var(--foreground) 100%)",
          }}
          className="h-full w-full rounded-full will-change-transform"
        />
      </div>

      {/* Floating circular thumb */}
      <m.div
        aria-hidden
        style={{
          x: thumbX,
          width: THUMB_SIZE,
          height: THUMB_SIZE,
        }}
        animate={{
          scale: isDragging ? 0.94 : 1,
        }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.14, ease: [0.23, 1, 0.32, 1] }}
        className={cn(
          "pointer-events-none absolute left-0 top-1/2 -mt-[11px] rounded-full bg-background shadow-[0_1px_2px_rgba(0,0,0,0.12),0_3px_10px_rgba(0,0,0,0.1)] ring-1 ring-foreground/12 transition-shadow duration-150 will-change-transform",
          "group-hover:shadow-[0_2px_4px_rgba(0,0,0,0.14),0_4px_12px_rgba(0,0,0,0.12)]",
          "group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-popover",
          trackWidth === 0 && "opacity-0",
        )}
      />
    </div>
  );
});
