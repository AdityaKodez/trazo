/* eslint-disable @next/next/no-html-link-for-pages */
import type { Metadata } from "next";

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
    <article aria-label={`${illustrationSkill.title} agent skill`} className="sr-only">
      <h2>{illustrationSkill.title}</h2>
      <p>{description}</p>
      <pre>{illustrationSkill.command}</pre>
      <p>Example prompt: {illustrationSkill.prompt}</p>
      <p>
        <a href={illustrationSkill.source}>View the skill on GitHub</a>
      </p>
      <p>
        <a href="/library">Browse the Trazo sticker library</a>
      </p>
    </article>
  );
}
