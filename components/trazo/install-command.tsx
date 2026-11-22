"use client";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
} from "motion/react";
import { type ComponentType, useId, useSyncExternalStore } from "react";

import { Check, Copy, X } from "@/components/trazo/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  installCommands,
  PACKAGE_MANAGERS,
  type PackageManager,
} from "@/config/site";
import { preloadCopySound } from "@/lib/sound";
import { useCopy, type CopyStatus } from "@/lib/use-copy";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "trazo:package-manager";
const DEFAULT_MANAGER: PackageManager = "npm";

type IconProps = { className?: string };

function NpmIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323l13.837.019-.009 13.836h-3.464l.01-10.382h-3.456L12.04 19.17H5.113z" />
    </svg>
  );
}

function PnpmIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M0 0v7.5h7.5V0zm8.25 0v7.5h7.5V0zm8.25 0v7.5H24V0zM8.25 8.25v7.5h7.5v-7.5zm8.25 0v7.5H24v-7.5zM0 16.5V24h7.5v-7.5zm8.25 0V24h7.5v-7.5zm8.25 0V24H24v-7.5z" />
    </svg>
  );
}

function YarnIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M12 0C5.375 0 0 5.375 0 12s5.375 12 12 12 12-5.375 12-12S18.625 0 12 0zm.768 4.105c.183 0 .363.053.525.157.125.083.287.185.755 1.154.31-.088.468-.042.551-.019.204.056.366.19.463.375.477.917.542 2.553.334 3.605-.241 1.232-.755 2.029-1.131 2.576.324.329.778.899 1.117 1.825.278.774.31 1.478.273 2.015a5.51 5.51 0 0 0 .602-.329c.593-.366 1.487-.917 2.553-.931.714-.009 1.269.445 1.353 1.103a1.23 1.23 0 0 1-.945 1.362c-.649.158-.95.278-1.821.843-1.232.797-2.539 1.242-3.012 1.39a1.686 1.686 0 0 1-.704.343c-.737.181-3.266.315-3.466.315h-.046c-.783 0-1.214-.241-1.45-.491-.658.329-1.51.19-2.122-.134a1.078 1.078 0 0 1-.58-1.153 1.243 1.243 0 0 1-.153-.195c-.162-.25-.528-.936-.454-1.946.056-.723.556-1.367.88-1.71a5.522 5.522 0 0 1 .408-2.256c.306-.727.885-1.348 1.32-1.737-.32-.537-.644-1.367-.329-2.21.227-.602.412-.936.82-1.08h-.005c.199-.074.389-.153.486-.259a3.418 3.418 0 0 1 2.298-1.103c.037-.093.079-.185.125-.283.31-.658.639-1.029 1.024-1.168a.94.94 0 0 1 .328-.06z" />
    </svg>
  );
}

function BunIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M12 22.596c6.628 0 12-4.338 12-9.688 0-3.318-2.057-6.248-5.219-7.986-1.286-.715-2.297-1.357-3.139-1.89C14.058 2.025 13.08 1.404 12 1.404c-1.097 0-2.334.785-3.966 1.821a49.92 49.92 0 0 1-2.816 1.697C2.057 6.66 0 9.59 0 12.908c0 5.35 5.372 9.687 12 9.687v.001ZM10.599 4.715c.334-.759.503-1.58.498-2.409 0-.145.202-.187.23-.029.658 2.783-.902 4.162-2.057 4.624-.124.048-.199-.121-.103-.209a5.763 5.763 0 0 0 1.432-1.977Zm2.058-.102a5.82 5.82 0 0 0-.782-2.306v-.016c-.069-.123.086-.263.185-.172 1.962 2.111 1.307 4.067.556 5.051-.082.103-.23-.003-.189-.126a5.85 5.85 0 0 0 .23-2.431Zm1.776-.561a5.727 5.727 0 0 0-1.612-1.806v-.014c-.112-.085-.024-.274.114-.218 2.595 1.087 2.774 3.18 2.459 4.407a.116.116 0 0 1-.049.071.11.11 0 0 1-.153-.026.122.122 0 0 1-.022-.083 5.891 5.891 0 0 0-.737-2.331Zm-5.087.561c-.617.546-1.282.76-2.063 1-.117 0-.195-.078-.156-.181 1.752-.909 2.376-1.649 2.999-2.778 0 0 .155-.118.188.085 0 .304-.349 1.329-.968 1.874Zm4.945 11.237a2.957 2.957 0 0 1-.937 1.553c-.346.346-.8.565-1.286.62a2.178 2.178 0 0 1-1.327-.62 2.955 2.955 0 0 1-.925-1.553.244.244 0 0 1 .064-.198.234.234 0 0 1 .193-.069h3.965a.226.226 0 0 1 .19.07c.05.053.073.125.063.197Z" />
    </svg>
  );
}

const PM_ICONS: Record<PackageManager, ComponentType<IconProps>> = {
  npm: NpmIcon,
  pnpm: PnpmIcon,
  yarn: YarnIcon,
  bun: BunIcon,
};

const managerListeners = new Set<() => void>();
let managerCache: PackageManager | null = null;

function readManager(): PackageManager {
  if (typeof window === "undefined") return DEFAULT_MANAGER;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored && (PACKAGE_MANAGERS as readonly string[]).includes(stored)
    ? (stored as PackageManager)
    : DEFAULT_MANAGER;
}

function getManagerSnapshot(): PackageManager {
  if (managerCache === null) managerCache = readManager();
  return managerCache;
}

function getServerManagerSnapshot(): PackageManager {
  return DEFAULT_MANAGER;
}

function subscribeToManager(onStoreChange: () => void) {
  managerListeners.add(onStoreChange);
  const onStorage = () => {
    managerCache = null;
    managerListeners.forEach((listener) => listener());
  };
  window.addEventListener("storage", onStorage);
  return () => {
    managerListeners.delete(onStoreChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function writeManager(next: PackageManager) {
  window.localStorage.setItem(STORAGE_KEY, next);
  managerCache = next;
  managerListeners.forEach((listener) => listener());
}

export function usePackageManager(): PackageManager {
  return useSyncExternalStore(
    subscribeToManager,
    getManagerSnapshot,
    getServerManagerSnapshot,
  );
}

export function CopyStatusIcon({
  status,
  triggerKey,
  className,
}: {
  status: CopyStatus;
  triggerKey?: number;
  className?: string;
}) {
  const reducedMotion = useReducedMotion();
  const Icon = status === "copied" ? Check : status === "error" ? X : Copy;
  const iconKey =
    status === "copied" && triggerKey !== undefined
      ? `copied-${triggerKey}`
      : status;

  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative inline-flex size-3.5 shrink-0 items-center justify-center",
        className,
      )}
    >
      <AnimatePresence initial={false}>
        {status === "copied" && !reducedMotion ? (
          <motion.span
            key={`pulse-${triggerKey ?? 0}`}
            initial={{ scale: 0.7, opacity: 0.75 }}
            animate={{ scale: 1.9, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.36, ease: [0.23, 1, 0.32, 1] }}
            className="pointer-events-none absolute inset-0 rounded-full ring-[1.5px] ring-success/55"
          />
        ) : null}
      </AnimatePresence>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={iconKey}
          initial={
            reducedMotion
              ? { opacity: 0 }
              : status === "copied"
                ? { opacity: 0, scale: 0.55, filter: "blur(2px)" }
                : { opacity: 0, scale: 0.5, filter: "blur(3px)" }
          }
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={
            reducedMotion
              ? { opacity: 0 }
              : { opacity: 0, scale: 0.5, filter: "blur(3px)" }
          }
          transition={
            status === "copied"
              ? { type: "spring", duration: 0.32, bounce: 0.3 }
              : { type: "spring", duration: 0.28, bounce: 0.18 }
          }
          className="absolute inset-0"
        >
          <Icon
            className={cn(
              "size-full",
              status === "copied" && "text-success",
              status === "error" && "text-destructive",
            )}
          />
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export function InstallCommand({
  commands = installCommands,
  className,
}: {
  commands?: Record<PackageManager, string>;
  className?: string;
}) {
  const manager = usePackageManager();
  const { status, copy, copySeq } = useCopy({ sound: true });
  const reducedMotion = useReducedMotion();
  const pillId = useId();
  const pillTransition: Transition = reducedMotion
    ? { duration: 0 }
    : { type: "spring", stiffness: 460, damping: 32, mass: 0.6 };

  const command = commands[manager] ?? commands.npm;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-card/95 text-left shadow-xs backdrop-blur-xs ring-1 ring-inset ring-foreground/10",
        className,
      )}
    >
      {/* Unified full-width top header bar with package manager tabs and copy action */}
      <div className="flex items-center justify-between gap-1 border-b bg-muted/45 px-2 py-1.5 sm:px-2.5">
        <div className="flex items-center gap-0.5 sm:gap-1">
          {PACKAGE_MANAGERS.map((pm) => {
            const Icon = PM_ICONS[pm];
            const isActive = manager === pm;
            return (
              <button
                key={pm}
                type="button"
                onClick={() => writeManager(pm)}
                aria-pressed={isActive}
                className={cn(
                  "relative flex items-center gap-1 rounded-lg px-2 py-1.5 font-mono text-[11px] micro-transition active:scale-[0.97] sm:gap-1.5 sm:px-2.5 sm:py-1",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {isActive ? (
                  <motion.span
                    layoutId={`pm-tab-pill-${pillId}`}
                    initial={false}
                    transition={pillTransition}
                    className="absolute inset-0 rounded-lg bg-background shadow-2xs ring-1 ring-inset ring-foreground/10"
                    aria-hidden="true"
                  />
                ) : null}
                <Icon className="relative z-10 size-3 shrink-0" />
                <span className="relative z-10">{pm}</span>
              </button>
            );
          })}
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onPointerEnter={preloadCopySound}
              onFocus={preloadCopySound}
              onClick={() => void copy(command)}
              aria-label="Copy install command"
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground micro-transition hover:bg-background hover:text-foreground active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:size-7"
            >
              <CopyStatusIcon status={status} triggerKey={copySeq} />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {status === "copied"
                ? "Copied"
                : status === "error"
                  ? "Copy failed"
                  : "Copy command"}
            </p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Command line body */}
      <div className="relative flex items-center px-3.5 py-2.5 sm:px-4 sm:py-3">
        <div className="blueprint-bg pointer-events-none absolute inset-0 opacity-35" />
        <code className="palette-scroll relative min-w-0 flex-1 overflow-x-auto whitespace-pre font-mono text-[12.5px] leading-relaxed text-foreground sm:text-[13px]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={manager}
              initial={reducedMotion ? false : { opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -3 }}
              transition={{ duration: 0.14, ease: [0.23, 1, 0.32, 1] }}
              className="block"
            >
              <span className="select-none pr-2 text-muted-foreground">$</span>
              {command}
            </motion.span>
          </AnimatePresence>
        </code>
      </div>
    </div>
  );
}
