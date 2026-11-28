import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function LibraryRoutePreview({
  view,
  title,
  children,
}: {
  view: "grid" | "skill";
  title: string;
  children: ReactNode;
}) {
  return (
    <div data-trazo-route-preview={view}>
      <div aria-hidden className="fixed inset-0 z-40 bg-black/20" />
      <section
        aria-labelledby="library-route-title"
        className={cn(
          "palette-scroll fixed inset-x-0 bottom-0 z-40 max-h-[84dvh] overflow-y-auto rounded-t-3xl bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-xl ring-1 ring-inset ring-foreground/10 sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-[12dvh] sm:max-h-[calc(88dvh-1.25rem)] sm:w-[calc(100%-2rem)] sm:-translate-x-1/2 sm:rounded-[22px] sm:p-5",
          view === "grid" ? "sm:max-w-[640px]" : "sm:max-w-[480px]",
        )}
      >
        <header className="flex items-center justify-between gap-3">
          <h1 id="library-route-title" className="text-lg font-semibold tracking-tight">
            {title}
          </h1>
          <Link
            href={view === "grid" ? "/" : "/library"}
            prefetch={false}
            className="shrink-0 rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-muted"
          >
            {view === "grid" ? "Canvas" : "Library"}
          </Link>
        </header>
        {children}
      </section>
    </div>
  );
}
