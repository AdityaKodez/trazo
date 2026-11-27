import { cn } from "@/lib/utils";

/**
 * Shared tactile hardware surfaces for floating Trazo chrome (TopBar, LocaleSwitcher, BottomDock).
 * Uses layered top specular highlights, subtle physical bottom bevels, crisp hairline rims,
 * and multi-stop ambient + contact shadows so controls feel dimensional over the paper canvas.
 */
export const CHROME_LIGHT_SURFACE =
  "rounded-full bg-linear-to-b from-white via-[#fcfcfb] to-[#f1f0ed] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.98),inset_0_-2.5px_0_rgba(24,23,21,0.065),0_0_0_1px_rgba(24,23,21,0.095),0_2px_3px_-1px_rgba(24,23,21,0.09),0_10px_20px_-8px_rgba(24,23,21,0.14),0_20px_38px_-14px_rgba(24,23,21,0.14)] backdrop-blur-md";

export const CHROME_LIGHT_BUTTON = cn(
  CHROME_LIGHT_SURFACE,
  "micro-transition hover:-translate-y-[1px] hover:from-white hover:via-white hover:to-[#f5f4f1] hover:shadow-[inset_0_1px_0.5px_rgba(255,255,255,1),inset_0_-2.5px_0_rgba(24,23,21,0.075),0_0_0_1px_rgba(24,23,21,0.12),0_3px_5px_-1px_rgba(24,23,21,0.10),0_12px_24px_-8px_rgba(24,23,21,0.17),0_22px_40px_-14px_rgba(24,23,21,0.16)] active:translate-y-[1px] active:scale-[0.985] active:shadow-[inset_0_1.5px_3px_rgba(24,23,21,0.09),inset_0_-1px_0_rgba(24,23,21,0.04),0_0_0_1px_rgba(24,23,21,0.11),0_1px_2px_rgba(24,23,21,0.10),0_4px_10px_-4px_rgba(24,23,21,0.12)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:hover:translate-y-0 motion-reduce:active:translate-y-0 motion-reduce:active:scale-100",
);

export const CHROME_DARK_BUTTON =
  "rounded-full bg-linear-to-b from-[#33312d] via-[#1f1e1b] to-[#131210] text-background shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.26),inset_0_2px_5px_rgba(255,255,255,0.05),inset_0_-3px_0_rgba(0,0,0,0.62),0_0_0_1px_rgba(12,11,10,0.92),0_2px_4px_rgba(0,0,0,0.22),0_10px_22px_-6px_rgba(0,0,0,0.34),0_20px_38px_-12px_rgba(0,0,0,0.22)] micro-transition hover:-translate-y-[1px] hover:from-[#3d3a35] hover:via-[#262522] hover:to-[#171614] hover:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.32),inset_0_2px_6px_rgba(255,255,255,0.07),inset_0_-3px_0_rgba(0,0,0,0.65),0_0_0_1px_rgba(12,11,10,0.95),0_4px_6px_rgba(0,0,0,0.24),0_14px_26px_-6px_rgba(0,0,0,0.38),0_22px_42px_-12px_rgba(0,0,0,0.24)] active:translate-y-[1.5px] active:scale-[0.985] active:shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.48),inset_0_-1px_0_rgba(0,0,0,0.5),0_0_0_1px_rgba(12,11,10,0.95),0_1px_2px_rgba(0,0,0,0.24),0_4px_10px_-4px_rgba(0,0,0,0.28)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:hover:translate-y-0 motion-reduce:active:translate-y-0 motion-reduce:active:scale-100";

export const CHROME_RECESSED_CHANNEL =
  "rounded-full bg-foreground/[0.038] shadow-[inset_0_1.5px_3px_rgba(24,23,21,0.08),inset_0_0_0_1px_rgba(24,23,21,0.045),0_1px_0_rgba(255,255,255,0.9)]";

export const CHROME_DARK_PILL_ACTIVE =
  "bg-foreground bg-linear-to-b from-[#33312d] via-[#1f1e1b] to-[#131210] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.24),inset_0_-2px_0_rgba(0,0,0,0.55),0_1.5px_3px_rgba(0,0,0,0.22),0_0_0_1px_rgba(12,11,10,0.88)]";

export const CHROME_POPOVER_SURFACE =
  "bg-linear-to-b from-white via-[#fcfcfb] to-[#f5f4f1] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.98),inset_0_-2px_0_rgba(24,23,21,0.05),0_0_0_1px_rgba(24,23,21,0.09),0_14px_34px_-8px_rgba(24,23,21,0.20),0_4px_10px_-2px_rgba(24,23,21,0.08)] ring-0";
