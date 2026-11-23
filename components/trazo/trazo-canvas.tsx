"use client";

import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type AnimationPlaybackControls,
} from "motion/react";
import {
  useCallback,
  memo,
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type WheelEvent,
} from "react";
import { findSticker, Sticker } from "trazo";

import { CanvasTestimonialScribble } from "@/components/trazo/canvas-testimonials";
import { HomeView } from "@/components/trazo/home-view";
import {
  LOCATE_SHAKE_DELAY_MS,
  useTrazo,
} from "@/components/trazo/trazo-experience";
import {
  CANVAS_WORLD,
  canvasPlacements,
  canvasZones,
  type CanvasStickerPlacement,
} from "@/config/canvas";
import { resolveStickerColor } from "@/config/palette";
import {
  canvasTestimonials,
  type CanvasTestimonial,
} from "@/config/testimonials";
import { cn } from "@/lib/utils";

const DRAG_THRESHOLD_PX = 5;
const KEYBOARD_PAN_STEP_PX = 120;

// Silky weighted paper follow spring: responsive during drag, plush on settle
const PAPER_FOLLOW_SPRING = {
  stiffness: 340,
  damping: 32,
  mass: 0.48,
} as const;

// Subtle velocity tilt & press spring for tactile physical paper feel
const PAPER_TILT_SPRING = {
  stiffness: 280,
  damping: 26,
  mass: 0.5,
} as const;

const LOCATE_REST_ANIMATE = {
  rotate: 0,
  x: 0,
  y: 0,
  scale: 1,
};

const LOCATE_REST_TRANSITION = {
  duration: 0.16,
  ease: "easeOut" as const,
};

// Tactile paper-sticker wiggle & gentle lift when located on canvas
const LOCATE_SHAKE_ANIMATE = {
  rotate: [0, -14, 14, -11, 10, -6, 4, -2, 0],
  x: [0, -6, 6, -5, 4, -2, 1, 0, 0],
  y: [0, -6, -8, -6, -4, -2, -1, 0, 0],
  scale: [1, 1.16, 1.15, 1.13, 1.09, 1.05, 1.02, 1, 1],
};

const LOCATE_SHAKE_TRANSITION = {
  duration: 0.6,
  ease: "easeOut" as const,
  times: [0, 0.12, 0.25, 0.38, 0.52, 0.66, 0.78, 0.9, 1],
};

const LOCATE_PULSE_ANIMATE = {
  rotate: 0,
  x: 0,
  y: 0,
  scale: [1, 1.08, 1],
};

const LOCATE_PULSE_TRANSITION = {
  duration: 0.3,
  ease: "easeOut" as const,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Emil Kowalski `interact-damping`: soft rubber-band resistance past boundaries
 * while dragging so the paper never hits a harsh dead wall.
 */
function rubberBandClamp(value: number, min: number, max: number, factor = 0.28): number {
  if (value < min) {
    return min - (min - value) * factor;
  }
  if (value > max) {
    return max + (value - max) * factor;
  }
  return value;
}

interface CanvasStickerProps {
  placement: CanvasStickerPlacement;
  index: number;
  color: string | undefined;
  posScaleX: number;
  posScaleY: number;
  stickerScale: number;
  isMobileViewport: boolean;
  isShaking: boolean;
  reduceMotion: boolean | null;
  onFocusSticker: (
    placement: CanvasStickerPlacement,
    event: FocusEvent<HTMLButtonElement>,
  ) => void;
  onClickSticker: (id: string) => void;
}

const CanvasSticker = memo(function CanvasSticker({
  placement,
  index,
  color: stickerColor,
  posScaleX,
  posScaleY,
  stickerScale,
  isMobileViewport,
  isShaking,
  reduceMotion,
  onFocusSticker,
  onClickSticker,
}: CanvasStickerProps) {
  const def = findSticker(placement.id);
  if (!def) return null;

  const px = Math.round(placement.x * posScaleX);
  const py = Math.round(placement.y * posScaleY);
  const renderedSize = Math.round(placement.size * stickerScale);
  const radialDist = Math.hypot(placement.x, placement.y);
  const staggerDelay = Math.min(
    0.42,
    (radialDist / 1150) * 0.34 + (index % 5) * 0.016,
  );
  const hoverTilt = placement.rotate + (placement.rotate >= 0 ? -8 : 8);

  return (
    <div
      style={{
        transform: `translate3d(${px}px, ${py}px, 0) translate(-50%, -50%)`,
      }}
      className="absolute left-0 top-0 w-max"
    >
      {/* Outer wrapper owns the one-time staggered pop entrance on page load */}
      <motion.div
        initial={
          reduceMotion
            ? false
            : { opacity: 0, scale: 0.72, y: 14, rotate: -10 }
        }
        animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
        transition={{
          type: "spring",
          duration: 0.44,
          bounce: 0.34,
          delay: staggerDelay,
        }}
      >
        {/* Middle wrapper owns transient locate-on-canvas shake without clashing with hover/tap */}
        <motion.div
          animate={
            isShaking
              ? reduceMotion
                ? LOCATE_PULSE_ANIMATE
                : LOCATE_SHAKE_ANIMATE
              : LOCATE_REST_ANIMATE
          }
          transition={
            isShaking
              ? reduceMotion
                ? LOCATE_PULSE_TRANSITION
                : LOCATE_SHAKE_TRANSITION
              : LOCATE_REST_TRANSITION
          }
        >
          {/* Inner button owns zero-latency hover & press physics */}
          <motion.button
            type="button"
            aria-label={`Inspect ${def.name} sticker`}
            onFocus={(event) => onFocusSticker(placement, event)}
            onClick={() => onClickSticker(def.id)}
            initial={false}
            animate={{
              rotate: placement.rotate,
              scale: 1,
              y: 0,
            }}
            whileHover={
              reduceMotion || isMobileViewport
                ? undefined
                : {
                    scale: 1.18,
                    rotate: hoverTilt,
                    y: -8,
                  }
            }
            whileTap={
              reduceMotion
                ? undefined
                : {
                    scale: 0.92,
                    rotate: placement.rotate,
                    y: -1,
                  }
            }
            transition={{
              type: "spring",
              stiffness: 520,
              damping: 20,
              mass: 0.48,
            }}
            className="group relative flex items-center justify-center rounded-3xl p-2 outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-3"
          >
            <Sticker
              def={def}
              size={renderedSize}
              color={stickerColor}
              className="pointer-events-none relative z-10 drop-shadow-[0_2px_3px_rgba(0,0,0,0.04)] transition-[filter,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] sm:group-hover:drop-shadow-[0_10px_14px_rgba(0,0,0,0.14)]"
            />

            {/* Origin-aware springy hover / focus name pill */}
            {" "}
            <span aria-hidden className="pointer-events-none absolute -bottom-6 left-1/2 z-20 hidden -translate-x-1/2 translate-y-1.5 scale-95 whitespace-nowrap rounded-full bg-foreground px-2.5 py-0.5 text-[11px] font-medium text-background opacity-0 shadow-sm transition-all duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:scale-100 group-focus-visible:opacity-100 sm:block">
              {def.name}
            </span>

            {/* Handwritten Caveat margin note on key stickers (desktop/tablet where perimeter has room) */}
            {placement.marginNote ? " " : null}
            {placement.marginNote ? (
              <span
                aria-hidden
                className={cn(
                  "pointer-events-none absolute hidden whitespace-nowrap font-caveat text-[19px] leading-none text-muted-foreground/80 transition-colors duration-150 sm:block sm:group-hover:text-foreground",
                  placement.noteSide === "top" &&
                    "-top-5 left-1/2 -translate-x-1/2",
                  placement.noteSide === "bottom" &&
                    "-bottom-5 left-1/2 -translate-x-1/2 sm:group-hover:opacity-0",
                  placement.noteSide === "left" &&
                    "right-full mr-2 top-1/2 -translate-y-1/2",
                  placement.noteSide === "right" &&
                    "left-full ml-2 top-1/2 -translate-y-1/2",
                )}
              >
                {placement.marginNote}
              </span>
            ) : null}
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
});

export function TrazoCanvas({ npmDownloads }: { npmDownloads: number | null }) {
  const {
    paletteId,
    openStickerDetail,
    cameraTarget,
    locatedSticker,
  } = useTrazo();
  const reduceMotion = useReducedMotion();

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [viewportSize, setViewportSize] = useState({ width: 1440, height: 900 });
  const [isDragging, setIsDragging] = useState(false);
  const [shakingSticker, setShakingSticker] = useState<{
    id: string;
    seq: number;
  } | null>(null);

  // Target camera coordinates updated by drag, wheel, or programmatic glides
  const targetX = useMotionValue(0);
  const targetY = useMotionValue(0);

  // Spring-coupled rendered camera coordinates for a weighted, physical paper feel
  const springX = useSpring(targetX, PAPER_FOLLOW_SPRING);
  const springY = useSpring(targetY, PAPER_FOLLOW_SPRING);
  const cameraX = reduceMotion ? targetX : springX;
  const cameraY = reduceMotion ? targetY : springY;

  // Subtle physical paper tilt & press scale while dragging
  const rawTilt = useMotionValue(0);
  const rawScale = useMotionValue(1);
  const paperTilt = useSpring(rawTilt, PAPER_TILT_SPRING);
  const paperScale = useSpring(rawScale, PAPER_TILT_SPRING);

  const activeAnimX = useRef<AnimationPlaybackControls | null>(null);
  const activeAnimY = useRef<AnimationPlaybackControls | null>(null);

  const dragStateRef = useRef<{
    active: boolean;
    moved: boolean;
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startCamX: number;
    startCamY: number;
    lastClientX: number;
    lastClientY: number;
    lastTime: number;
    vx: number;
    vy: number;
  } | null>(null);

  const suppressNextClickRef = useRef(false);

  useEffect(() => {
    function updateSize() {
      if (!viewportRef.current) return;
      setViewportSize({
        width: viewportRef.current.clientWidth || window.innerWidth,
        height: viewportRef.current.clientHeight || window.innerHeight,
      });
    }
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const stickerColor =
    paletteId === "ink" ? "var(--scribble-ink)" : resolveStickerColor(paletteId);

  const isMobileViewport = viewportSize.width < 640;
  const isTabletViewport = viewportSize.width >= 640 && viewportSize.width < 768;
  const posScaleX = isMobileViewport ? 0.62 : isTabletViewport ? 0.82 : 1;
  const posScaleY = isMobileViewport ? 0.68 : isTabletViewport ? 0.86 : 1;
  const stickerScale = isMobileViewport ? 0.76 : isTabletViewport ? 0.9 : 1;
  const heroOffsetY = isMobileViewport ? -22 : isTabletViewport ? -10 : 0;

  const getPanBounds = useCallback(() => {
    const scaledWorldW = CANVAS_WORLD.width * posScaleX;
    const scaledWorldH = CANVAS_WORLD.height * posScaleY;
    const maxX = Math.max(
      isMobileViewport ? 280 : 420,
      (scaledWorldW - viewportSize.width) / 2 + (isMobileViewport ? 90 : 120),
    );
    const maxY = Math.max(
      isMobileViewport ? 260 : 360,
      (scaledWorldH - viewportSize.height) / 2 + (isMobileViewport ? 110 : 120),
    );
    return { maxX, maxY };
  }, [isMobileViewport, posScaleX, posScaleY, viewportSize.height, viewportSize.width]);

  const stopCameraAnimations = useCallback(() => {
    activeAnimX.current?.stop();
    activeAnimY.current?.stop();
    activeAnimX.current = null;
    activeAnimY.current = null;
  }, []);

  const glideCameraTo = useCallback(
    (nextX: number, nextY: number) => {
      stopCameraAnimations();
      const { maxX, maxY } = getPanBounds();
      const clampedX = clamp(nextX, -maxX, maxX);
      const clampedY = clamp(nextY, -maxY, maxY);

      if (reduceMotion) {
        targetX.set(clampedX);
        targetY.set(clampedY);
        return;
      }

      activeAnimX.current = animate(targetX, clampedX, {
        type: "spring",
        stiffness: 200,
        damping: 28,
        mass: 0.75,
      });
      activeAnimY.current = animate(targetY, clampedY, {
        type: "spring",
        stiffness: 200,
        damping: 28,
        mass: 0.75,
      });
    },
    [getPanBounds, reduceMotion, stopCameraAnimations, targetX, targetY],
  );

  useEffect(() => {
    if (cameraTarget.seq === 0) return;
    glideCameraTo(cameraTarget.x * posScaleX, cameraTarget.y * posScaleY);
  }, [cameraTarget, glideCameraTo, posScaleX, posScaleY]);

  useEffect(() => {
    if (!locatedSticker) return;

    const delay = reduceMotion ? 0 : LOCATE_SHAKE_DELAY_MS;
    const duration = reduceMotion ? 320 : 620;

    let clearTimer: number | undefined;
    const startTimer = window.setTimeout(() => {
      setShakingSticker(locatedSticker);
      clearTimer = window.setTimeout(() => {
        setShakingSticker((current) =>
          current?.seq === locatedSticker.seq ? null : current,
        );
      }, duration);
    }, delay);

    return () => {
      window.clearTimeout(startTimer);
      if (clearTimer !== undefined) {
        window.clearTimeout(clearTimer);
      }
    };
  }, [locatedSticker, reduceMotion]);

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest("[data-no-pan]")) return;

    stopCameraAnimations();
    dragStateRef.current = {
      active: true,
      moved: false,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startCamX: targetX.get(),
      startCamY: targetY.get(),
      lastClientX: event.clientX,
      lastClientY: event.clientY,
      lastTime: event.timeStamp,
      vx: 0,
      vy: 0,
    };
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const state = dragStateRef.current;
    if (!state || !state.active || state.pointerId !== event.pointerId) return;

    const dx = event.clientX - state.startClientX;
    const dy = event.clientY - state.startClientY;

    if (!state.moved) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
      state.moved = true;
      setIsDragging(true);
      if (!reduceMotion) {
        rawScale.set(0.986);
      }
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    const now = event.timeStamp;
    const dt = Math.max(1, now - state.lastTime);
    const instVx = ((event.clientX - state.lastClientX) / dt) * 1000;
    const instVy = ((event.clientY - state.lastClientY) / dt) * 1000;
    state.vx = state.vx * 0.62 + instVx * 0.38;
    state.vy = state.vy * 0.62 + instVy * 0.38;
    state.lastClientX = event.clientX;
    state.lastClientY = event.clientY;
    state.lastTime = now;

    const { maxX, maxY } = getPanBounds();
    // Soft rubber-band resistance at boundaries while dragging
    targetX.set(rubberBandClamp(state.startCamX + dx, -maxX, maxX));
    targetY.set(rubberBandClamp(state.startCamY + dy, -maxY, maxY));

    if (!reduceMotion) {
      // Subtle organic paper lean proportional to horizontal sweep velocity
      rawTilt.set(clamp(state.vx * 0.00085, -1.15, 1.15));
    }
  }

  function handlePointerEnd(event: PointerEvent<HTMLDivElement>) {
    const state = dragStateRef.current;
    if (!state || state.pointerId !== event.pointerId) return;
    dragStateRef.current = null;

    rawTilt.set(0);
    rawScale.set(1);

    if (state.moved) {
      setIsDragging(false);
      suppressNextClickRef.current = true;
      window.setTimeout(() => {
        suppressNextClickRef.current = false;
      }, 150);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      const { maxX, maxY } = getPanBounds();
      const hasMomentum = !reduceMotion && Math.hypot(state.vx, state.vy) > 45;
      const projectedX = clamp(
        targetX.get() + (hasMomentum ? state.vx * 0.28 : 0),
        -maxX,
        maxX,
      );
      const projectedY = clamp(
        targetY.get() + (hasMomentum ? state.vy * 0.28 : 0),
        -maxY,
        maxY,
      );

      activeAnimX.current = animate(targetX, projectedX, {
        type: "spring",
        stiffness: 170,
        damping: 26,
        velocity: hasMomentum ? state.vx : 0,
      });
      activeAnimY.current = animate(targetY, projectedY, {
        type: "spring",
        stiffness: 170,
        damping: 26,
        velocity: hasMomentum ? state.vy : 0,
      });
    }
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    stopCameraAnimations();
    const { maxX, maxY } = getPanBounds();
    const deltaX = event.shiftKey ? event.deltaY : event.deltaX;
    const deltaY = event.shiftKey ? 0 : event.deltaY;

    targetX.set(clamp(targetX.get() - deltaX, -maxX, maxX));
    targetY.set(clamp(targetY.get() - deltaY, -maxY, maxY));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    // Only pan when the canvas surface itself has focus, not a sticker button.
    if (event.target !== event.currentTarget) return;
    if (event.altKey || event.ctrlKey || event.metaKey) return;

    const step = event.shiftKey ? KEYBOARD_PAN_STEP_PX * 3 : KEYBOARD_PAN_STEP_PX;
    let dx = 0;
    let dy = 0;
    switch (event.key) {
      case "ArrowLeft":
        dx = step;
        break;
      case "ArrowRight":
        dx = -step;
        break;
      case "ArrowUp":
        dy = step;
        break;
      case "ArrowDown":
        dy = -step;
        break;
      case "Home":
        event.preventDefault();
        glideCameraTo(0, 0);
        return;
      default:
        return;
    }
    event.preventDefault();
    stopCameraAnimations();
    const { maxX, maxY } = getPanBounds();
    targetX.set(clamp(targetX.get() + dx, -maxX, maxX));
    targetY.set(clamp(targetY.get() + dy, -maxY, maxY));
  }

  const handleStickerFocus = useCallback(
    (placement: CanvasStickerPlacement, event: FocusEvent<HTMLButtonElement>) => {
      if (viewportRef.current) {
        viewportRef.current.scrollLeft = 0;
        viewportRef.current.scrollTop = 0;
      }
      if (!event.currentTarget.matches(":focus-visible")) return;

      const scaledX = placement.x * posScaleX;
      const scaledY = placement.y * posScaleY;
      const screenOffsetX = scaledX + targetX.get();
      const screenOffsetY = scaledY + targetY.get();
      const safeHalfW = viewportSize.width * 0.36;
      const safeHalfH = viewportSize.height * 0.34;

      if (
        Math.abs(screenOffsetX) > safeHalfW ||
        Math.abs(screenOffsetY) > safeHalfH
      ) {
        glideCameraTo(-scaledX, -scaledY);
      }
    },
    [glideCameraTo, posScaleX, posScaleY, targetX, targetY, viewportSize.height, viewportSize.width],
  );

  const handleStickerClick = useCallback(
    (id: string) => {
      if (suppressNextClickRef.current) return;
      openStickerDetail(id);
    },
    [openStickerDetail],
  );

  const handleTestimonialFocus = useCallback(
    (item: CanvasTestimonial, event: FocusEvent<HTMLAnchorElement>) => {
      if (viewportRef.current) {
        viewportRef.current.scrollLeft = 0;
        viewportRef.current.scrollTop = 0;
      }
      if (!event.currentTarget.matches(":focus-visible")) return;

      const scaledX = item.x * posScaleX;
      const scaledY =
        isMobileViewport && item.mobileY !== undefined
          ? item.mobileY
          : item.y * posScaleY;
      const screenOffsetX = scaledX + targetX.get();
      const screenOffsetY = scaledY + targetY.get();
      const safeHalfW = viewportSize.width * 0.36;
      const safeHalfH = viewportSize.height * 0.34;

      if (
        Math.abs(screenOffsetX) > safeHalfW ||
        Math.abs(screenOffsetY) > safeHalfH
      ) {
        glideCameraTo(-scaledX, -scaledY);
      }
    },
    [
      glideCameraTo,
      isMobileViewport,
      posScaleX,
      posScaleY,
      targetX,
      targetY,
      viewportSize.height,
      viewportSize.width,
    ],
  );

  const handleTestimonialClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      if (suppressNextClickRef.current) {
        event.preventDefault();
      }
    },
    [],
  );

  return (
    <div
      ref={viewportRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onWheel={handleWheel}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-roledescription="canvas"
      aria-label="Sticker canvas. Use arrow keys to pan, Home to recenter, Tab to move between stickers."
      onScroll={(event) => {
        event.currentTarget.scrollLeft = 0;
        event.currentTarget.scrollTop = 0;
      }}
      className={cn(
        "relative h-dvh w-screen overflow-hidden select-none bg-background touch-none outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
        isDragging ? "cursor-grabbing" : "cursor-grab",
      )}
    >
      {/* World plane centered at viewport midpoint with spring follow + subtle tactile drag scale & tilt */}
      <motion.div
        style={{
          x: cameraX,
          y: cameraY,
          scale: reduceMotion ? 1 : paperScale,
          rotate: reduceMotion ? 0 : paperTilt,
        }}
        className="absolute left-1/2 top-1/2 size-0 will-change-transform"
      >
        {/* Seamless borderless dot-grid surface extending well beyond pan limits */}
        <div
          aria-hidden
          style={{
            width: 5600,
            height: 4000,
            left: -2800,
            top: -2000,
          }}
          className="paper-dot-grid pointer-events-none absolute"
        />

        {/* Centered Home View at (0, heroOffsetY) */}
        <div
          style={{
            transform: `translate3d(0px, ${heroOffsetY}px, 0) translate(-50%, -50%)`,
          }}
          className="absolute left-0 top-0 w-max"
        >
          <HomeView npmDownloads={npmDownloads} />
        </div>

        {/* Single-line handwritten zone labels (never wrap, zero wireframe subtitles) */}
        {canvasZones.map((zone) => {
          const zx = Math.round(zone.x * posScaleX);
          const zy = Math.round(zone.y * posScaleY);
          return (
            <div
              key={zone.id}
              aria-hidden
              style={{
                transform: `translate3d(${zx}px, ${zy}px, 0) translate(-50%, -50%)`,
              }}
              className="pointer-events-none absolute left-0 top-0 w-max whitespace-nowrap text-center"
            >
              <span className="font-caveat text-[20px] leading-none text-muted-foreground/65 sm:text-[24px]">
                {zone.label}
              </span>
            </div>
          );
        })}

        {/* Handwritten Pin + Ink X testimonials aligned around the perimeter */}
        {canvasTestimonials.map((item, index) => (
          <CanvasTestimonialScribble
            key={item.id}
            item={item}
            index={index}
            activeColor={stickerColor}
            posScaleX={posScaleX}
            posScaleY={posScaleY}
            isMobileViewport={isMobileViewport}
            reduceMotion={reduceMotion}
            onFocusItem={handleTestimonialFocus}
            onClickItem={handleTestimonialClick}
          />
        ))}

        {/* All crayon stickers with radial staggered pop-in on load + Emil Kowalski hover/tap physics */}
        {canvasPlacements.map((placement, index) => {
          const isShaking =
            shakingSticker !== null &&
            locatedSticker !== null &&
            shakingSticker.seq === locatedSticker.seq &&
            shakingSticker.id === placement.id;

          return (
            <CanvasSticker
              key={placement.id}
              placement={placement}
              index={index}
              color={stickerColor}
              posScaleX={posScaleX}
              posScaleY={posScaleY}
              stickerScale={stickerScale}
              isMobileViewport={isMobileViewport}
              isShaking={isShaking}
              reduceMotion={reduceMotion}
              onFocusSticker={handleStickerFocus}
              onClickSticker={handleStickerClick}
            />
          );
        })}
      </motion.div>
    </div>
  );
}
