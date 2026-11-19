import type { ReactNode } from "react";

import { BottomDock } from "@/components/trazo/bottom-dock";
import { TopBar } from "@/components/trazo/top-bar";
import { TrazoCanvas } from "@/components/trazo/trazo-canvas";
import { TrazoProvider } from "@/components/trazo/trazo-experience";
import { TrazoOverlay } from "@/components/trazo/trazo-overlay";
import { siteConfig } from "@/config/site";
import { fetchGitHubStars } from "@/lib/github";

export const revalidate = 300;

export default async function CanvasLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const stars = await fetchGitHubStars(siteConfig.repo);

  return (
    <TrazoProvider>
      <main className="relative h-dvh w-screen overflow-hidden">
        <TrazoCanvas />
        <TopBar stars={stars} />
        <BottomDock />
        <TrazoOverlay />
        {children}
      </main>
    </TrazoProvider>
  );
}
