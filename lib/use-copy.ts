"use client";

import { useCallback, useEffect, useState } from "react";

import { playCopySound, unlockAudioContext } from "@/lib/sound";

export type CopyStatus = "idle" | "copied" | "error";

export interface UseCopyOptions {
  sound?: boolean;
}

export function useCopy(options?: UseCopyOptions) {
  const sound = options?.sound ?? false;
  const [status, setStatus] = useState<CopyStatus>("idle");
  const [copySeq, setCopySeq] = useState(0);

  const copy = useCallback(
    async (value: string): Promise<boolean> => {
      if (sound) {
        unlockAudioContext();
      }
      if (typeof navigator === "undefined" || !navigator.clipboard) {
        setStatus("error");
        setCopySeq((seq) => seq + 1);
        return false;
      }
      try {
        await navigator.clipboard.writeText(value);
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
      }
    },
    [sound],
  );

  useEffect(() => {
    if (status === "idle") return;
    const timer = window.setTimeout(() => setStatus("idle"), 2000);
    return () => window.clearTimeout(timer);
  }, [status, copySeq]);

  return { status, copy, copySeq };
}
