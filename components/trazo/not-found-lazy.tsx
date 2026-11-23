"use client";

import dynamic from "next/dynamic";

const LazyNotFoundView = dynamic(
  () => import("@/components/trazo/not-found-view").then((mod) => mod.NotFoundView),
);

export function NotFoundLazy() {
  return <LazyNotFoundView />;
}
