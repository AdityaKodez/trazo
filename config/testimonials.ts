export type TestimonialAlign = "left" | "right" | "center";
export type UnderlineVariant = "arc" | "wave" | "swoosh";

export interface CanvasTestimonial {
  id: string;
  author: string;
  handle: string;
  avatar: string;
  url: string;
  date: string;
  /** Short handwritten scribble rendered directly on the canvas. */
  quote: string;
  /** Full verbatim X post text; when longer than `quote`, shown in a hover/focus preview card. */
  fullQuote: string;
  /** Default crayon underline color in multi-color ("mix") mode. */
  accent: string;
  /** World X coordinate relative to (0, 0) center (matches CANVAS_SPREAD-scaled world space). */
  x: number;
  /** World Y coordinate relative to (0, 0) center (matches CANVAS_SPREAD-scaled world space). */
  y: number;
  /** Subtle hand-placed tilt in degrees. */
  rotate: number;
  /** Mirrors avatar + text alignment cleanly across left/right canvas corners. */
  align: TestimonialAlign;
  /** Slight organic variation in the hand-drawn crayon underline. */
  underline: UnderlineVariant;
  /** Optional mobile Y override so the top crest stays safely clear of the hero headline. */
  mobileY?: number;
}

/**
 * Real X testimonials placed in the 4 symmetric perimeter corners + top crest
 * around the inner Ocean ring (verified clear of all 83 stickers and zone labels).
 */
export const canvasTestimonials: readonly CanvasTestimonial[] = [
  {
    id: "jesseddy",
    author: "Jess - UI Goodies ♡",
    handle: "@jesseddy",
    avatar: "/testimonials/jesseddy.jpg",
    url: "https://x.com/jesseddy/status/2123893200289218982",
    date: "Nov 20, 2026",
    quote: "Featured on UI Goodies ♡",
    fullQuote:
      "Added Trazo to UI Goodies today: 70+ hand-drawn crayon stickers you can recolor, copy as SVG, or install from npm.",
    accent: "#ec4899",
    x: 0,
    y: -242,
    mobileY: -316,
    rotate: -1,
    align: "center",
    underline: "swoosh",
  },
  {
    id: "tilljanek",
    author: "Till Janek",
    handle: "@tilljanek",
    avatar: "/testimonials/tilljanek.jpg",
    url: "https://x.com/tilljanek/status/2124139355728228612",
    date: "Nov 21, 2026",
    quote: "“Cool project. Instant bookmark :)”",
    fullQuote: "Cool project. Instant bookmark :)",
    accent: "#2563eb",
    x: -555,
    y: -202,
    rotate: -2.5,
    align: "left",
    underline: "arc",
  },
  {
    id: "dingyi",
    author: "Ding",
    handle: "@dingyi",
    avatar: "/testimonials/dingyi.jpg",
    url: "https://x.com/dingyi/status/2123985496749818113",
    date: "Nov 21, 2026",
    quote: "“好看!”",
    fullQuote: "好看！",
    accent: "#f97316",
    x: 555,
    y: -202,
    rotate: 2.5,
    align: "right",
    underline: "wave",
  },
  {
    id: "surajmaurya_m",
    author: "Suraj",
    handle: "@surajmaurya_m",
    avatar: "/testimonials/surajmaurya_m.jpg",
    url: "https://x.com/surajmaurya_m/status/2124521615920963711",
    date: "Nov 22, 2026",
    quote: "“Look good”",
    fullQuote: "Look good",
    accent: "#16a34a",
    x: -555,
    y: 330,
    rotate: 2,
    align: "left",
    underline: "arc",
  },
  {
    id: "kawaidgaf",
    author: "Kawai",
    handle: "@kawaidgaf",
    avatar: "/testimonials/kawaidgaf.jpg",
    url: "https://x.com/kawaidgaf/status/2124264906874835076",
    date: "Nov 21, 2026",
    quote: "“good work”",
    fullQuote: "good work",
    accent: "#38bdf8",
    x: 555,
    y: 330,
    rotate: -2,
    align: "right",
    underline: "wave",
  },
] as const;
