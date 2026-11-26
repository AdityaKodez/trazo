"use client";

import {
  memo,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type WheelEvent,
} from "react";
import {
  m,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";

import { RotateCcw, RotateCw } from "@/components/trazo/overlay-icons";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const MIN_ANGLE = -180;
const MAX_ANGLE = 180;
const TICK_STEP = 5;
const PX_PER_DEG = 1.6;
const ZERO_SNAP_DEG = 2.5;

const TICKS: readonly number[] = Array.from(
  { length: (MAX_ANGLE - MIN_ANGLE) / TICK_STEP + 1 },
  (_, index) => MIN_ANGLE + index * TICK_STEP,
);

const DIAL_SPRING = { stiffness: 460, damping: 36, mass: 0.55 } as const;

export interface RotationDialProps {
  value: number;
  onChange: (angle: number) => void;
  ariaLabel?: string;
  rotateCcwAriaLabel?: string;
  rotateCcwTooltip?: string;
  rotateCwAriaLabel?: string;
  rotateCwTooltip?: string;
  formatValueText?: (degrees: number) => string;
  className?: string;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function rubberBand(value: number, min: number, max: number, factor = 0.25): number {
  if (value < min) return min - (min - value) * factor;
  if (value > max) return max + (value - max) * factor;
  return value;
}

function normalizeZero(value: number): number {
  return Object.is(value, -0) ? 0 : value;
}

function wrapQuarterTurn(value: number, delta: number): number {
  let wrapped = ((((value + delta + 180) % 360) + 360) % 360) - 180;
  if (wrapped === -180) wrapped = 180;
  return normalizeZero(Math.round(wrapped));
}

export const RotationDial = memo(function RotationDial({
  value,
  onChange,
  ariaLabel = "Sticker rotation",
  rotateCcwAriaLabel = "Rotate 90 degrees counter-clockwise",
  rotateCcwTooltip = "Rotate -90°",
  rotateCwAriaLabel = "Rotate 90 degrees clockwise",
  rotateCwTooltip = "Rotate +90°",
  formatValueText = (deg) => `${deg} degrees`,
  className,
}: RotationDialProps) {
  const reduceMotion = useReducedMotion();
  const [isDragging, setIsDragging] = useState(false);

  const clampedValue = normalizeZero(clamp(Math.round(value), MIN_ANGLE, MAX_ANGLE));

  const targetX = useMotionValue(clampedValue * PX_PER_DEG);
  const springX = useSpring(targetX, DIAL_SPRING);
  const rulerX = reduceMotion ? targetX : springX;

  const dragRef = useRef<{
    pointerId: number;
    startClientX: number;
    startAngle: number;
  } | null>(null);

  const wheelAccumRef = useRef(0);

  useEffect(() => {
    if (dragRef.current) return;
    const nextX = clampedValue * PX_PER_DEG;
    if (reduceMotion) {
      targetX.jump(nextX);
      springX.jump(nextX);
    } else {
      targetX.set(nextX);
    }
  }, [clampedValue, reduceMotion, springX, targetX]);

  function commitAngle(next: number) {
    const rounded = normalizeZero(clamp(Math.round(next), MIN_ANGLE, MAX_ANGLE));
    if (rounded !== clampedValue) {
      onChange(rounded);
    }
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.focus({ preventScroll: true });
    dragRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startAngle: clampedValue,
    };
    setIsDragging(true);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const state = dragRef.current;
    if (!state || state.pointerId !== event.pointerId) return;

    const dx = event.clientX - state.startClientX;
    const rawAngle = state.startAngle + dx / PX_PER_DEG;
    const visualAngle = rubberBand(rawAngle, MIN_ANGLE, MAX_ANGLE);
    const snapped =
      Math.abs(rawAngle) <= ZERO_SNAP_DEG
        ? 0
        : normalizeZero(clamp(Math.round(rawAngle), MIN_ANGLE, MAX_ANGLE));

    const nextVisualX =
      snapped === 0 && Math.abs(rawAngle) <= ZERO_SNAP_DEG
        ? 0
        : visualAngle * PX_PER_DEG;

    targetX.set(nextVisualX);
    if (reduceMotion) {
      springX.jump(nextVisualX);
    }
    if (snapped !== clampedValue) {
      onChange(snapped);
    }
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    const state = dragRef.current;
    if (!state || state.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
    setIsDragging(false);

    const settledX = clampedValue * PX_PER_DEG;
    if (reduceMotion) {
      targetX.jump(settledX);
      springX.jump(settledX);
    } else {
      targetX.set(settledX);
    }
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    // Only capture horizontal trackpad swipes so vertical modal scrolling stays unaffected
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
    event.preventDefault();
    wheelAccumRef.current -= event.deltaX / PX_PER_DEG;
    const step = Math.trunc(wheelAccumRef.current);
    if (step !== 0) {
      wheelAccumRef.current -= step;
      commitAngle(clampedValue + step);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? 15 : 5;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowUp":
        event.preventDefault();
        commitAngle(clampedValue + step);
        break;
      case "ArrowLeft":
      case "ArrowDown":
        event.preventDefault();
        commitAngle(clampedValue - step);
        break;
      case "PageUp":
        event.preventDefault();
        commitAngle(clampedValue + 45);
        break;
      case "PageDown":
        event.preventDefault();
        commitAngle(clampedValue - 45);
        break;
      case "Home":
        event.preventDefault();
        commitAngle(MIN_ANGLE);
        break;
      case "End":
        event.preventDefault();
        commitAngle(MAX_ANGLE);
        break;
      case "0":
      case "Backspace":
      case "Delete":
        event.preventDefault();
        commitAngle(0);
        break;
    }
  }

  const isRotated = clampedValue !== 0;

  return (
    <div
      data-vaul-no-drag=""
      className={cn(
        "flex h-8 min-w-0 flex-1 items-center gap-0.5 rounded-full bg-muted/50 p-0.5 ring-1 ring-inset ring-foreground/[0.08]",
        className,
      )}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => onChange(wrapQuarterTurn(clampedValue, -90))}
            aria-label={rotateCcwAriaLabel}
            className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none micro-transition hover:bg-background/85 hover:text-foreground hover:shadow-[0_1px_2px_rgba(0,0,0,0.06)] active:scale-[0.9] focus-visible:ring-2 focus-visible:ring-ring"
          >
            <RotateCcw className="size-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{rotateCcwTooltip}</p>
        </TooltipContent>
      </Tooltip>

      {/* Straighten tick ruler */}
      <div
        role="slider"
        tabIndex={0}
        aria-label={ariaLabel}
        aria-valuemin={MIN_ANGLE}
        aria-valuemax={MAX_ANGLE}
        aria-valuenow={clampedValue}
        aria-valuetext={formatValueText(clampedValue)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onWheel={handleWheel}
        onDoubleClick={() => commitAngle(0)}
        onKeyDown={handleKeyDown}
        className={cn(
          "group relative h-full min-w-0 flex-1 select-none touch-none overflow-hidden rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isDragging ? "cursor-grabbing" : "cursor-grab",
        )}
      >
        {/* Soft curved-wheel edge fade mask */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_right,transparent,black_18%,black_82%,transparent)]"
        >
          <m.div
            style={{ x: rulerX }}
            className="absolute inset-y-0 left-1/2 will-change-transform"
          >
            {TICKS.map((deg) => {
              const isZero = deg === 0;
              const isMajor = deg % 45 === 0;
              const isMedium = deg % 15 === 0;

              return (
                <span
                  key={deg}
                  style={{ left: `${-deg * PX_PER_DEG}px` }}
                  className="absolute inset-y-0 flex -translate-x-1/2 items-center justify-center"
                >
                  {isZero ? (
                    <span
                      className={cn(
                        "absolute top-[3px] size-1 rounded-full transition-opacity duration-150",
                        isRotated ? "bg-foreground/70 opacity-100" : "opacity-0",
                      )}
                    />
                  ) : null}
                  <span
                    className={cn(
                      "rounded-full transition-colors duration-150",
                      isZero
                        ? "h-3.5 w-[1.5px] bg-foreground/70"
                        : isMajor
                          ? "h-3.5 w-[1.5px] bg-foreground/45"
                          : isMedium
                            ? "h-2.5 w-px bg-foreground/26"
                            : "h-1.5 w-px bg-foreground/15",
                    )}
                  />
                </span>
              );
            })}
          </m.div>
        </div>

        {/* Fixed center indicator needle */}
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-[height,background-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
            isDragging
              ? "h-5 w-[2px] bg-foreground"
              : isRotated
                ? "h-[18px] w-[2px] bg-foreground"
                : "h-4 w-[2px] bg-foreground/75 group-hover:bg-foreground",
          )}
        />
      </div>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => onChange(wrapQuarterTurn(clampedValue, 90))}
            aria-label={rotateCwAriaLabel}
            className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none micro-transition hover:bg-background/85 hover:text-foreground hover:shadow-[0_1px_2px_rgba(0,0,0,0.06)] active:scale-[0.9] focus-visible:ring-2 focus-visible:ring-ring"
          >
            <RotateCw className="size-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{rotateCwTooltip}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
});
