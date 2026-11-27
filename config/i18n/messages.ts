import type { StickerCategory } from "trazo/core";
import { STICKER_COUNT } from "trazo/meta";

import type { PaletteId } from "@/config/palette";
import type { Locale } from "@/lib/use-locale";

export type CategoryFilterId = "all" | StickerCategory;

export interface Messages {
  titles: {
    home: string;
    library: string;
    skill: string;
    stickerDetail: (name: string) => string;
    notFound: string;
  };
  hero: {
    sectionAriaLabel: string;
    headline: string;
    description: string;
    npmDownloads: (count: number) => string;
    opensInNewTab: string;
    sponsorCta: string;
    sponsorAriaLabel: string;
  };
  topBar: {
    byLabel: string;
    authorAriaLabel: (name: string) => string;
    starLabel: string;
    starAriaLabel: (stars: number | null) => string;
    starMilestoneTooltip: string;
    starTooltip: (stars: number | null) => string;
    languageTooltip: string;
    languageMenuAriaLabel: string;
  };
  dock: {
    navAriaLabel: string;
    centerCanvasAriaLabel: string;
    backToCenterTooltip: string;
    paletteGroupAriaLabel: string;
    colorButtonAriaLabel: (label: string) => string;
    crayonPaletteTitle: string;
    libraryLabel: string;
    libraryAriaLabel: (count: number) => string;
  };
  palettes: Record<PaletteId, string>;
  categories: Record<CategoryFilterId, string>;
  canvas: {
    regionAriaLabel: string;
    roleDescription: string;
    inspectStickerAriaLabel: (name: string) => string;
    resetStickersLabel: string;
    resetStickersAriaLabel: (count: number) => string;
    resetStickersTooltip: string;
    zoneLabels: Record<StickerCategory, string>;
    marginNotes: Record<string, string>;
  };
  testimonials: {
    ariaLabel: (author: string, quote: string) => string;
  };
  install: {
    copyCommand: string;
    copyInstallAriaLabel: string;
    copiedInstallAriaLabel: string;
    copied: string;
    copyFailed: string;
  };
  library: {
    srTitle: string;
    srDescription: (count: number, modKey: string) => string;
    searchAriaLabel: string;
    searchPlaceholder: string;
    clearSearchAriaLabel: string;
    closeLibraryAriaLabel: string;
    categoriesAriaLabel: string;
    stickersListboxAriaLabel: string;
    locateStickerAriaLabel: (name: string) => string;
    locateOnCanvasTooltip: string;
    emptyTitle: string;
    emptyPrefix: string;
    resetFilters: string;
    emptyOr: string;
    drawWithSkill: string;
    emptySuffix: string;
    hintMove: string;
    hintOpen: string;
    hintLocate: string;
    agentSkillButton: string;
    pack: {
      groupAriaLabel: string;
      chooseFormatAriaLabel: string;
      menuAriaLabel: string;
      noMatchesTooltip: string;
      downloadTooltip: (scopeLabel: string, format: "svg" | "png") => string;
      svgZipButton: string;
      pngZipButton: string;
      zipping: string;
      saved: string;
      failed: string;
      svgPackLabel: string;
      svgPackDescription: string;
      pngPackLabel: string;
      pngPackDescription: string;
      allStickersScope: (count: number) => string;
      matchesScope: (count: number) => string;
      categoryScope: (categoryLabel: string, count: number) => string;
      originalColorLabel: string;
      packSavedVerb: (format: "svg" | "png") => string;
    };
    starPrompt: {
      thanks: string;
      enjoying: string;
      starButton: string;
      dismissAriaLabel: string;
    };
  };
  detail: {
    backToLibrary: string;
    copyNameAriaLabel: (name: string) => string;
    locateOnCanvas: string;
    close: string;
    srDescription: (name: string) => string;
    previewLightAriaLabel: string;
    previewDarkAriaLabel: string;
    lightBackgroundTooltip: string;
    darkBackgroundTooltip: string;
    sizeLabel: string;
    sizeAriaLabel: string;
    rotateLabel: string;
    rotateAriaLabel: string;
    rotateCcwAriaLabel: string;
    rotateCcwTooltip: string;
    rotateCwAriaLabel: string;
    rotateCwTooltip: string;
    degreesValueText: (deg: number) => string;
    pixelsValueText: (px: number) => string;
    resetRotationAriaLabel: string;
    resetRotationTooltip: string;
    colorLabel: string;
    previewPaletteAriaLabel: string;
    copyHexAriaLabel: (hex: string) => string;
    copyHexTooltip: string;
    originalLabel: string;
    usageLabel: string;
    codeFormatAriaLabel: string;
    copyCodeAriaLabel: string;
    copiedCodeAriaLabel: string;
    copyTooltip: string;
    copiedTooltip: string;
    copyFailedTooltip: string;
    downloadSvgAriaLabel: string;
    downloadPngAriaLabel: string;
    svgSavedVerb: string;
    pngSavedVerb: string;
    copiedVerb: string;
  };
  skill: {
    title: string;
    description: string;
    exampleStickersAriaLabel: string;
    copyInstallIdle: string;
    copyInstallCopied: string;
    examplePromptLabel: string;
    examplePromptText: string;
    exampleNames: Record<string, string>;
    copyPromptIdle: string;
    copyPromptCopied: string;
    viewOnGithub: string;
  };
  notFound: {
    backToCanvasAriaLabel: string;
    backToCanvasTooltip: string;
    githubAriaLabel: string;
    githubTooltip: string;
    decorativeStickersAriaLabel: string;
    wiggleStickerAriaLabel: (name: string) => string;
    swapZeroAriaLabel: (name: string) => string;
    swapZeroTooltip: (name: string) => string;
    errorSrLabel: string;
    headline: string;
    subcopy: string;
    backToCanvasButton: string;
    swapStickerButton: string;
    footnote: (count: number) => string;
    orbitNotes: Record<string, string>;
  };
}

export const en: Messages = {
  titles: {
    home: "Trazo · Hand-drawn crayon SVG stickers for React, Vue, Svelte & web",
    library: `${STICKER_COUNT} Free Hand-Drawn Crayon SVG Stickers | Trazo`,
    skill: "Trazo illustration style agent skill | Trazo",
    stickerDetail: (name) => `${name} — Free Crayon SVG Sticker | Trazo`,
    notFound: "404 · Trazo",
  },
  hero: {
    sectionAriaLabel: "Trazo introduction",
    headline: "Hand-drawn crayon stickers for the web.",
    description:
      "100 chunky wax-crayon sea creatures, cute cats, arrows, stars, clouds, and emphasis marks. Recolor live, download SVG/PNG packs, or install from npm.",
    npmDownloads: (count) =>
      `${count.toLocaleString("en-US")} npm ${count === 1 ? "download" : "downloads"} in the last 7 days`,
    opensInNewTab: " (opens in a new tab)",
    sponsorCta: "Want to sponsor? Contact me on X",
    sponsorAriaLabel: "Want to sponsor? Contact me on X (opens in a new tab)",
  },
  topBar: {
    byLabel: "by",
    authorAriaLabel: (name) => `Built by ${name} (opens in a new tab)`,
    starLabel: "Star",
    starAriaLabel: (stars) =>
      stars !== null
        ? `Star Trazo on GitHub (${stars.toLocaleString("en-US")} stars, opens in a new tab)`
        : "Star Trazo on GitHub (opens in a new tab)",
    starMilestoneTooltip: "100+ stars — thank you!",
    starTooltip: (stars) =>
      stars !== null
        ? `${stars.toLocaleString("en-US")} stars on GitHub`
        : "Star on GitHub",
    languageTooltip: "Language",
    languageMenuAriaLabel: "Select language",
  },
  dock: {
    navAriaLabel: "Canvas controls",
    centerCanvasAriaLabel: "Center canvas",
    backToCenterTooltip: "Back to center",
    paletteGroupAriaLabel: "Sticker color palette",
    colorButtonAriaLabel: (label) => `Color: ${label}`,
    crayonPaletteTitle: "Crayon palette",
    libraryLabel: "Library",
    libraryAriaLabel: (count) => `Open sticker library (${count} stickers)`,
  },
  palettes: {
    mix: "Original colors",
    ink: "Default ink",
    coral: "Coral",
    tangerine: "Tangerine",
    sunny: "Sunny",
    grass: "Grass",
    sky: "Sky",
    cobalt: "Cobalt",
    pink: "Pink",
  },
  categories: {
    all: "All",
    ocean: "Ocean",
    arrows: "Arrows",
    nature: "Nature",
    hearts: "Hearts",
    symbols: "Symbols",
    games: "Games",
    cats: "Cats",
    characters: "Characters",
    school: "School",
    food: "Food",
  },
  canvas: {
    regionAriaLabel:
      "Sticker canvas. Use arrow keys to pan, Home to recenter, Tab to move between stickers.",
    roleDescription: "canvas",
    inspectStickerAriaLabel: (name) => `Inspect ${name} sticker`,
    resetStickersLabel: "Tidy up",
    resetStickersAriaLabel: (count) =>
      `Return ${count} moved ${count === 1 ? "sticker" : "stickers"} to original positions`,
    resetStickersTooltip: "Put moved stickers back",
    zoneLabels: {
      ocean: "Ocean & sea life",
      arrows: "Arrows & flow",
      nature: "Nature & weather",
      hearts: "Hearts & sparks",
      symbols: "Symbols & marks",
      games: "Games",
      cats: "Cats & kitties",
      characters: "Characters",
      school: "School & desk",
      food: "Food & snacks",
    },
    marginNotes: {
      "baby-squid": "Click a sticker to customize",
      seahorse: "Recolor from the dock below",
      dolphin: "Drag paper to explore",
      "heart-cat": "Cute hand-drawn cats",
      "spiral-notebook": "School & desk kit",
      burger: "Fresh food & snacks",
    },
  },
  testimonials: {
    ariaLabel: (author, quote) =>
      `${author} on X: "${quote}" (opens in a new tab)`,
  },
  install: {
    copyCommand: "Copy command",
    copyInstallAriaLabel: "Copy install command",
    copiedInstallAriaLabel: "Copied install command",
    copied: "Copied",
    copyFailed: "Copy failed",
  },
  library: {
    srTitle: "Sticker library",
    srDescription: (count, modKey) =>
      `Search ${count} hand-drawn crayon stickers. Use arrow keys to move, Enter to open a sticker, and ${modKey} Enter to locate it on the canvas.`,
    searchAriaLabel: "Search stickers",
    searchPlaceholder: "Search stickers, tags, moods...",
    clearSearchAriaLabel: "Clear search",
    closeLibraryAriaLabel: "Close library",
    categoriesAriaLabel: "Sticker categories",
    stickersListboxAriaLabel: "Stickers",
    locateStickerAriaLabel: (name) => `Locate ${name} on canvas`,
    locateOnCanvasTooltip: "Locate on canvas",
    emptyTitle: "nothing scribbled here yet",
    emptyPrefix: "Try another word, ",
    resetFilters: "reset filters",
    emptyOr: ", or ",
    drawWithSkill: "draw it with the agent skill",
    emptySuffix: ".",
    hintMove: "move",
    hintOpen: "open",
    hintLocate: "locate",
    agentSkillButton: "Agent skill",
    pack: {
      groupAriaLabel: "Download sticker pack",
      chooseFormatAriaLabel: "Choose zip download format",
      menuAriaLabel: "Pack download format",
      noMatchesTooltip: "No stickers match current filter",
      downloadTooltip: (scopeLabel, format) =>
        `Download ${scopeLabel.toLowerCase()} as ${format.toUpperCase()} (.zip)`,
      svgZipButton: "SVG zip",
      pngZipButton: "PNG zip",
      zipping: "Zipping…",
      saved: "Saved",
      failed: "Failed",
      svgPackLabel: "SVG pack (.zip)",
      svgPackDescription: "Scalable vectors · MIT license",
      pngPackLabel: "PNG pack (.zip)",
      pngPackDescription: "512px transparent · MIT license",
      allStickersScope: (count) => `All ${count} stickers`,
      matchesScope: (count) => `${count} ${count === 1 ? "match" : "matches"}`,
      categoryScope: (categoryLabel, count) => `${categoryLabel} · ${count}`,
      originalColorLabel: "Original",
      packSavedVerb: (format) => `${format.toUpperCase()} pack saved!`,
    },
    starPrompt: {
      thanks: "Thanks for starring Trazo!",
      enjoying: "Enjoying Trazo?",
      starButton: "Star",
      dismissAriaLabel: "Dismiss star prompt",
    },
  },
  detail: {
    backToLibrary: "Back to library",
    copyNameAriaLabel: (name) => `Copy ${name}`,
    locateOnCanvas: "Locate on canvas",
    close: "Close",
    srDescription: (name) =>
      `Resize, rotate, and recolor ${name}, then copy code or download SVG and PNG.`,
    previewLightAriaLabel: "Preview on light background",
    previewDarkAriaLabel: "Preview on dark background",
    lightBackgroundTooltip: "Light background",
    darkBackgroundTooltip: "Dark background",
    sizeLabel: "Size",
    sizeAriaLabel: "Sticker size",
    rotateLabel: "Rotate",
    rotateAriaLabel: "Sticker rotation",
    rotateCcwAriaLabel: "Rotate 90 degrees counter-clockwise",
    rotateCcwTooltip: "Rotate -90°",
    rotateCwAriaLabel: "Rotate 90 degrees clockwise",
    rotateCwTooltip: "Rotate +90°",
    degreesValueText: (deg) => `${deg} degrees`,
    pixelsValueText: (px) => `${px} pixels`,
    resetRotationAriaLabel: "Reset rotation to 0 degrees",
    resetRotationTooltip: "Reset to 0°",
    colorLabel: "Color",
    previewPaletteAriaLabel: "Preview palette",
    copyHexAriaLabel: (hex) => `Copy color hex ${hex}`,
    copyHexTooltip: "Copy hex",
    originalLabel: "Original",
    usageLabel: "Usage",
    codeFormatAriaLabel: "Code format",
    copyCodeAriaLabel: "Copy code snippet",
    copiedCodeAriaLabel: "Copied code snippet",
    copyTooltip: "Copy",
    copiedTooltip: "Copied",
    copyFailedTooltip: "Copy failed",
    downloadSvgAriaLabel: "Download SVG",
    downloadPngAriaLabel: "Download PNG",
    svgSavedVerb: "SVG saved!",
    pngSavedVerb: "PNG saved!",
    copiedVerb: "Copied!",
  },
  skill: {
    title: "Trazo illustration style",
    description:
      "Can't find the sticker you need? Have your agent draw an original Trazo-style SVG and check how it reads at small sizes.",
    exampleStickersAriaLabel: "Example stickers drawn with the skill",
    copyInstallIdle: "Copy install command",
    copyInstallCopied: "Copied install command",
    examplePromptLabel: "Example prompt",
    examplePromptText:
      "Use $trazo-illustration-style to draw a sleepy fox and check it at 16 px.",
    exampleNames: {
      "watering-can": "Watering can",
      snail: "Snail",
      mushroom: "Mushroom",
      "loop-arrow": "Loop arrow",
      butterfly: "Butterfly",
    },
    copyPromptIdle: "Copy example prompt",
    copyPromptCopied: "Copied example prompt",
    viewOnGithub: "View on GitHub",
  },
  notFound: {
    backToCanvasAriaLabel: "Back to Trazo canvas",
    backToCanvasTooltip: "Back to sticker canvas",
    githubAriaLabel: "Trazo on GitHub (opens in a new tab)",
    githubTooltip: "View Trazo on GitHub",
    decorativeStickersAriaLabel: "Decorative Trazo stickers",
    wiggleStickerAriaLabel: (name) => `Wiggle ${name} sticker`,
    swapZeroAriaLabel: (name) =>
      `Zero illustrated as ${name} sticker — click to swap sticker`,
    swapZeroTooltip: (name) => `${name} · click to swap`,
    errorSrLabel: "Error 404",
    headline: "This page drifted off the sheet.",
    subcopy:
      "We checked every corner of the canvas, but there's no sticker pinned here.",
    backToCanvasButton: "Back to canvas",
    swapStickerButton: "Swap sticker",
    footnote: (count) =>
      `All ${count} hand-drawn stickers are waiting back home.`,
    orbitNotes: {
      "question-mark": "wrong turn?",
      "curly-arrow": "canvas is that way",
    },
  },
};

const loadedMessages = new Map<Locale, Messages>([["en", en]]);
const pendingMessageLoads = new Map<Locale, Promise<Messages>>();

export function hasLoadedMessages(locale: Locale): boolean {
  return loadedMessages.has(locale);
}

export function loadMessages(locale: Locale): Promise<Messages> {
  const cached = loadedMessages.get(locale);
  if (cached) return Promise.resolve(cached);

  const pending = pendingMessageLoads.get(locale);
  if (pending) return pending;

  const loader =
    locale === "zh-CN"
      ? import("./messages/zh-CN").then((mod) => mod.default)
      : import("./messages/ja").then((mod) => mod.default);

  const promise = loader
    .then((messages) => {
      loadedMessages.set(locale, messages);
      pendingMessageLoads.delete(locale);
      return messages;
    })
    .catch((error) => {
      pendingMessageLoads.delete(locale);
      throw error;
    });

  pendingMessageLoads.set(locale, promise);
  return promise;
}

export function getMessages(locale: Locale): Messages {
  return loadedMessages.get(locale) ?? en;
}
