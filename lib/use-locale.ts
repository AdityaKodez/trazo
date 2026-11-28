"use client";

import { usePathname } from "next/navigation";
import { LazyMotion } from "motion/react";
import {
  createContext,
  createElement,
  startTransition,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { findStickerMeta } from "trazo/meta";

const loadMotionFeatures = () =>
  import("@/lib/motion-features").then((mod) => mod.default);

import {
  getMessages,
  hasLoadedMessages,
  loadMessages,
} from "@/config/i18n/messages";
import {
  getLocalizedStickerName,
  hasLoadedStickerLocale,
  loadStickerLocale,
} from "@/config/i18n/stickers";

export type Locale = "en" | "zh-CN" | "ja";

export interface LocaleOption {
  id: Locale;
  shortLabel: string;
  nativeLabel: string;
}

export const LOCALE_OPTIONS: readonly LocaleOption[] = [
  { id: "en", shortLabel: "EN", nativeLabel: "English" },
  { id: "zh-CN", shortLabel: "中文", nativeLabel: "简体中文" },
  { id: "ja", shortLabel: "日本語", nativeLabel: "日本語" },
] as const;

const STORAGE_KEY = "trazo:locale";
const DEFAULT_LOCALE: Locale = "en";

const urgentListeners = new Set<() => void>();
const committedListeners = new Set<(next: Locale) => void>();
const committedFallbackListeners = new Set<() => void>();

let urgentCache: Locale | null = null;
let committedCache: Locale = DEFAULT_LOCALE;
let requestSeq = 0;
let storageListenerCount = 0;

const LocaleContext = createContext<Locale | null>(null);

function isSupportedLocale(value: string | null): value is Locale {
  return value === "en" || value === "zh-CN" || value === "ja";
}

function detectBrowserLocale(): Locale {
  if (typeof navigator === "undefined") return DEFAULT_LOCALE;
  const candidates =
    Array.isArray(navigator.languages) && navigator.languages.length > 0
      ? navigator.languages
      : [navigator.language];

  for (const raw of candidates) {
    if (!raw) continue;
    const normalized = raw.toLowerCase();
    if (normalized === "zh" || normalized.startsWith("zh-")) {
      return "zh-CN";
    }
    if (normalized === "ja" || normalized.startsWith("ja-")) {
      return "ja";
    }
    if (normalized === "en" || normalized.startsWith("en-")) {
      return "en";
    }
  }
  return DEFAULT_LOCALE;
}

function readLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isSupportedLocale(stored)) {
      return stored;
    }
  } catch {
    // Ignore storage read errors in restricted browsing modes.
  }
  return detectBrowserLocale();
}

function isLocaleLoaded(locale: Locale): boolean {
  return (
    locale === DEFAULT_LOCALE ||
    (hasLoadedMessages(locale) && hasLoadedStickerLocale(locale))
  );
}

/** Dynamically preloads both message and sticker dictionaries for a locale (no-op for `"en"`). */
export function preloadLocale(locale: Locale): Promise<void> {
  if (locale === DEFAULT_LOCALE || isLocaleLoaded(locale)) {
    return Promise.resolve();
  }
  return Promise.all([loadMessages(locale), loadStickerLocale(locale)]).then(
    () => {},
  );
}

function getUrgentSnapshot(): Locale {
  if (urgentCache === null) {
    urgentCache = readLocale();
  }
  return urgentCache;
}

function getCommittedSnapshot(): Locale {
  return committedCache;
}

function getServerSnapshot(): Locale {
  return DEFAULT_LOCALE;
}

function emitUrgent() {
  urgentListeners.forEach((listener) => listener());
}

function emitCommitted(next: Locale) {
  committedListeners.forEach((listener) => listener(next));
  committedFallbackListeners.forEach((listener) => listener());
}

function commitLocaleWhenReady(next: Locale, seq: number) {
  const finalize = () => {
    if (seq !== requestSeq || urgentCache !== next) return;
    // Sync <html lang> synchronously before React commits/paints the new locale
    // so CJK font selection is already active on frame 1 (zero glyph double-snap).
    if (
      typeof document !== "undefined" &&
      document.documentElement.lang !== next
    ) {
      document.documentElement.lang = next;
    }
    if (committedCache !== next) {
      committedCache = next;
      emitCommitted(next);
    }
  };

  if (isLocaleLoaded(next)) {
    // Yield 1 animation frame so Frame 1 paints the urgent switcher pill cleanly
    // before Frame 2 runs the html[lang] update and startTransition text crossfade.
    if (
      typeof window !== "undefined" &&
      typeof window.requestAnimationFrame === "function"
    ) {
      window.requestAnimationFrame(finalize);
    } else {
      finalize();
    }
  } else {
    void preloadLocale(next)
      .then(finalize)
      .catch(() => {
        // Keep current committed locale if chunk load fails offline.
      });
  }
}

function onStorage(event: StorageEvent) {
  if (event.key !== null && event.key !== STORAGE_KEY) return;
  const next = readLocale();
  requestSeq += 1;
  const seq = requestSeq;
  if (urgentCache !== next) {
    urgentCache = next;
    emitUrgent();
  }
  commitLocaleWhenReady(next, seq);
}

function retainStorageListener() {
  if (typeof window === "undefined") return;
  if (storageListenerCount === 0) {
    window.addEventListener("storage", onStorage);
  }
  storageListenerCount += 1;
}

function releaseStorageListener() {
  if (typeof window === "undefined") return;
  storageListenerCount = Math.max(0, storageListenerCount - 1);
  if (storageListenerCount === 0) {
    window.removeEventListener("storage", onStorage);
  }
}

function subscribeUrgent(onStoreChange: () => void) {
  retainStorageListener();
  urgentListeners.add(onStoreChange);
  return () => {
    urgentListeners.delete(onStoreChange);
    releaseStorageListener();
  };
}

function subscribeCommittedFallback(onStoreChange: () => void) {
  retainStorageListener();
  committedFallbackListeners.add(onStoreChange);
  return () => {
    committedFallbackListeners.delete(onStoreChange);
    releaseStorageListener();
  };
}

const noopSubscribe = () => () => {};

// Kick off chunk preload as early as possible on the client for returning CJK visitors.
if (typeof window !== "undefined") {
  const initial = readLocale();
  urgentCache = initial;
  if (initial !== DEFAULT_LOCALE) {
    void preloadLocale(initial);
  }
}

export function writeLocale(next: Locale) {
  requestSeq += 1;
  const seq = requestSeq;

  if (urgentCache !== next) {
    urgentCache = next;
    emitUrgent();
  }

  queueMicrotask(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Keep the in-memory locale if localStorage is unavailable.
    }
  });

  commitLocaleWhenReady(next, seq);
}

/**
 * Provides the committed UI locale via React Context using `startTransition`,
 * so heavy trees yield to urgent switcher animations while keeping zero English fallback flash.
 */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [committedLocale, setCommittedLocale] =
    useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    retainStorageListener();
    const onCommit = (next: Locale) => {
      startTransition(() => {
        setCommittedLocale(next);
      });
    };
    committedListeners.add(onCommit);

    const target = getUrgentSnapshot();
    if (target !== DEFAULT_LOCALE) {
      if (isLocaleLoaded(target)) {
        committedCache = target;
        if (document.documentElement.lang !== target) {
          document.documentElement.lang = target;
        }
        startTransition(() => {
          setCommittedLocale(target);
        });
      } else {
        const seq = requestSeq;
        commitLocaleWhenReady(target, seq);
      }
    } else if (committedCache !== DEFAULT_LOCALE) {
      startTransition(() => {
        setCommittedLocale(committedCache);
      });
    }

    return () => {
      committedListeners.delete(onCommit);
      releaseStorageListener();
    };
  }, []);

  return createElement(
    LazyMotion,
    { features: loadMotionFeatures },
    createElement(LocaleContext.Provider, { value: committedLocale }, children),
  );
}

/**
 * Urgent UI locale — updates synchronously when `writeLocale(next)` is called so
 * `LocaleSwitcher`'s spring pill responds on frame 1 at 60/120fps.
 */
export function useUrgentLocale(): Locale {
  return useSyncExternalStore(
    subscribeUrgent,
    getUrgentSnapshot,
    getServerSnapshot,
  );
}

/**
 * Committed UI locale — updates inside `startTransition` once locale chunks are loaded.
 * Works both inside `LocaleProvider` and standalone as a fallback.
 */
export function useLocale(): Locale {
  const ctx = useContext(LocaleContext);
  const fallback = useSyncExternalStore(
    ctx !== null ? noopSubscribe : subscribeCommittedFallback,
    ctx !== null ? getServerSnapshot : getCommittedSnapshot,
    getServerSnapshot,
  );
  return ctx ?? fallback;
}

function resolveDocumentTitle(pathname: string, locale: Locale): string {
  const messages = getMessages(locale);
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return messages.titles.home;
  }

  if (segments[0] === "library") {
    if (segments.length === 1) {
      return messages.titles.library;
    }

    if (segments.length === 2) {
      if (segments[1] === "skill") {
        return messages.titles.skill;
      }

      let rawId = segments[1];
      try {
        rawId = decodeURIComponent(rawId);
      } catch {
        return messages.titles.notFound;
      }

      const sticker = findStickerMeta(rawId);
      if (sticker) {
        const displayName = getLocalizedStickerName(sticker, locale);
        return messages.titles.stickerDetail(displayName);
      }
    }
  }

  return messages.titles.notFound;
}

/**
 * Tiny client leaf component mounted once in `app/layout.tsx` that keeps
 * `<html lang>` and `document.title` synced across locale switches and route changes.
 */
export function DocumentLocaleSync(): null {
  const locale = useLocale();
  const pathname = usePathname();

  useEffect(() => {
    if (document.documentElement.lang !== locale) {
      document.documentElement.lang = locale;
    }

    const nextTitle = resolveDocumentTitle(pathname, locale);
    if (document.title !== nextTitle) {
      document.title = nextTitle;
    }
  }, [locale, pathname]);

  return null;
}

/** Keeps `<html lang>` synced with the active client locale for proper CJK glyph shaping and a11y. */
export function useSyncDocumentLang() {
  const locale = useLocale();
  useEffect(() => {
    if (document.documentElement.lang !== locale) {
      document.documentElement.lang = locale;
    }
  }, [locale]);
}

export function findLocaleOption(locale: Locale): LocaleOption {
  return (
    LOCALE_OPTIONS.find((option) => option.id === locale) ?? LOCALE_OPTIONS[0]
  );
}
