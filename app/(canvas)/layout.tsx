import type { ReactNode } from "react";

import { TrazoCanvasHost } from "@/components/trazo/trazo-canvas-host";
import { TrazoProvider } from "@/components/trazo/trazo-experience";
import { TrazoOverlayHost } from "@/components/trazo/trazo-overlay-host";
import { siteConfig } from "@/config/site";
import { fetchGitHubStars } from "@/lib/github";
import { fetchNpmDownloads } from "@/lib/npm";

export const revalidate = 300;

export default async function CanvasLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const [stars, npmDownloads] = await Promise.all([
    fetchGitHubStars(siteConfig.repo),
    fetchNpmDownloads(siteConfig.npmPackage),
  ]);

  return (
    <TrazoProvider>
      <main className="relative h-dvh w-screen overflow-hidden">
        <TrazoCanvasHost stars={stars} npmDownloads={npmDownloads} />
        <TrazoOverlayHost stars={stars} />
        {children}
      </main>
    </TrazoProvider>
  );
}
