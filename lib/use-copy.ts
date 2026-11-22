"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { playCopySound, unlockAudioContext } from "@/lib/sound";

export const COPY_COOLDOWN_MS = 1150;

export type CopyStatus = "idle" | "copied" | "error";

export interface UseCopyOptions {
  sound?: boolean;
  cooldownMs?: number;
}

export function useCopy(options?: UseCopyOptions) {
  const sound = options?.sound ?? false;
  const cooldownMs = options?.cooldownMs ?? COPY_COOLDOWN_MS;
  const [status, setStatus] = useState<CopyStatus>("idle");
  const [copySeq, setCopySeq] = useState(0);
  const lockedRef = useRef(false);
  const inFlightRef = useRef(false);

  const copy = useCallback(
    async (value: string): Promise<boolean> => {
      if (lockedRef.current || inFlightRef.current) {
        return false;
      }

      if (sound) {
        unlockAudioContext();
      }
      if (typeof navigator === "undefined" || !navigator.clipboard) {
        setStatus("error");
        setCopySeq((seq) => seq + 1);
        return false;
      }

      inFlightRef.current = true;
      try {
        await navigator.clipboard.writeText(value);
        lockedRef.current = true;
        setStatus("copied");
        setCopySeq((seq) => seq + 1);
        if (sound) {
          playCopySound();
        }
        return true;
      } catch {
        setStatus("error");
        setCopySeq((seq) => seq + 1);
        return false;
      } finally {
        inFlightRef.current = false;
      }
    },
    [sound],
  );

  useEffect(() => {
    if (status === "idle") return;
    const timer = window.setTimeout(() => {
      lockedRef.current = false;
      setStatus("idle");
    }, cooldownMs);
    return () => {
      window.clearTimeout(timer);
    };
  }, [status, copySeq, cooldownMs]);

  useEffect(() => {
    return () => {
      lockedRef.current = false;
      inFlightRef.current = false;
    };
  }, []);

  return { status, copy, copySeq, cooldownMs, isCoolingDown: status === "copied" };
}
