export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

export const PACKAGE_MANAGERS: readonly PackageManager[] = [
  "npm",
  "pnpm",
  "yarn",
  "bun",
] as const;

const npmPackage = "trazo-stickers";

export const installCommands: Record<PackageManager, string> = {
  npm: `npm i ${npmPackage}`,
  pnpm: `pnpm add ${npmPackage}`,
  yarn: `yarn add ${npmPackage}`,
  bun: `bun add ${npmPackage}`,
};

export const siteConfig = {
  name: "Trazo",
  markStroke:
    "M7 22.5C10.6 22.2 14.8 17.6 15.4 12.6C15.8 9 13.4 7.6 12.2 10.2C10.6 13.8 13.2 21.8 18.4 22.6C21.6 23 24.2 20.6 25.2 17.4",
  url: "https://trazo.akoder.xyz",
  repo: "AdityaKodez/trazo",
  github: "https://github.com/AdityaKodez/trazo",
  npmPackage,
  npm: `https://www.npmjs.com/package/${npmPackage}`,
  title: "Trazo · Hand-drawn crayon sticker SVGs for React and web",
  description:
    "Bold, wax-textured crayon sticker SVGs baked into clean vector paths. Tree-shakeable React components and standalone SVG strings.",
  hero: {
    headline: "Hand-drawn crayon stickers for the web.",
    description:
      "Chunky wax-crayon sea creatures, cute cats, arrows, stars, clouds, and emphasis marks. Recolor live, copy clean SVG, or install from npm.",
  },
  author: {
    name: "Aditya Ojha",
    url: "https://www.akoder.xyz/?utm_source=experiment&utm_medium=redirect&utm_campaign=trazo",
    github: "https://github.com/AdityaKodez",
    x: "https://x.com/AdiKodez",
  },
} as const;
