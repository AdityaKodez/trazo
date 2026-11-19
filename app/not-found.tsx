import type { Metadata } from "next";

import { NotFoundView } from "@/components/trazo/not-found-view";

export const metadata: Metadata = {
  title: "404 · Trazo",
  description: "This page drifted off the sticker sheet.",
};

export default function NotFound() {
  return <NotFoundView />;
}
