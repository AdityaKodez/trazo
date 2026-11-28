import type { Metadata } from "next";

import { LibraryRoutePreview } from "@/components/trazo/library-route-preview";
import { illustrationSkill, siteConfig } from "@/config/site";

const title = `${illustrationSkill.title} agent skill | ${siteConfig.name}`;
const description =
  "Install the Trazo agent skill to draw original crayon-style SVG stickers and check how they read at small sizes.";
const url = `${siteConfig.url}/library/skill`;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: url,
  },
  openGraph: {
    type: "website",
    url,
    title,
    description,
    siteName: siteConfig.name,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    site: "@AdiKodez",
    creator: "@AdiKodez",
  },
};

export default function AgentSkillPage() {
  return (
    <LibraryRoutePreview view="skill" title={illustrationSkill.title}>
      <div className="mt-3 space-y-3 text-sm">
        <p>{description}</p>
        <pre className="overflow-x-auto rounded-lg bg-muted p-3"><code>{illustrationSkill.command}</code></pre>
        <p>{illustrationSkill.prompt}</p>
        <a href={illustrationSkill.source} className="underline underline-offset-4">View the skill on GitHub</a>
      </div>
    </LibraryRoutePreview>
  );
}
