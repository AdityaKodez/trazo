"use client";

import { useCallback, useEffect, useState } from "react";

export type CopyStatus = "idle" | "copied" | "error";

export function useCopy() {
  const [status, setStatus] = useState<CopyStatus>("idle");

  const copy = useCallback(async (value: string): Promise<boolean> => {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      setStatus("error");
      return false;
    }
    try {
      await navigator.clipboard.writeText(value);
      setStatus("copied");
      return true;
    } catch {
      setStatus("error");
      return false;
    }
  }, []);

  useEffect(() => {
    if (status === "idle") return;
    const timer = window.setTimeout(() => setStatus("idle"), 2000);
    return () => window.clearTimeout(timer);
  }, [status]);

  return { status, copy };
}
