import type { Metadata } from "next";

import { NotFoundLazy } from "@/components/trazo/not-found-lazy";

export const metadata: Metadata = {
  title: "404 · Trazo",
  description: "This page drifted off the sticker sheet.",
};

export default function NotFound() {
  return <NotFoundLazy />;
}
