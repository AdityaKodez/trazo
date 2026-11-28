/**
 * Generators for `/llms.txt` (concise index) and `/llms-full.txt` (complete catalog dump).
 *
 * Derived directly from `trazo/meta` and `config/` so component names, counts,
 * props, and URLs never drift out of sync with the published package.
 */

import type { StickerCategory, StickerMeta } from "trazo/core";
import {
  STICKER_CATEGORY_COUNTS,
  STICKER_COUNT,
  trazoCatalogMeta,
} from "trazo/meta";

import { paletteOptions } from "@/config/palette";
import {
  illustrationSkill,
  installCommands,
  PACKAGE_MANAGERS,
  siteConfig,
} from "@/config/site";

const CATEGORY_ORDER: readonly StickerCategory[] = [
  "music",
  "games",
  "ocean",
  "arrows",
  "nature",
  "hearts",
  "symbols",
  "cats",
  "characters",
  "school",
  "food",
] as const;

const CATEGORY_LABELS: Readonly<Record<StickerCategory, string>> = {
  music: "Music",
  games: "Games",
  ocean: "Ocean & sea life",
  arrows: "Arrows & flow",
  nature: "Nature & weather",
  hearts: "Hearts & sparks",
  symbols: "Symbols & marks",
  cats: "Cats & kitties",
  characters: "Characters",
  school: "School & desk",
  food: "Food & snacks",
};

function groupByCategory(
  catalog: readonly StickerMeta[],
): Map<StickerCategory, StickerMeta[]> {
  const groups = new Map<StickerCategory, StickerMeta[]>();
  for (const category of CATEGORY_ORDER) {
    groups.set(category, []);
  }
  for (const sticker of catalog) {
    const list = groups.get(sticker.category);
    if (list) {
      list.push(sticker);
    } else {
      groups.set(sticker.category, [sticker]);
    }
  }
  return groups;
}

function categorySummaryLines(): string[] {
  const grouped = groupByCategory(trazoCatalogMeta);
  return CATEGORY_ORDER.map((category) => {
    const items = grouped.get(category) ?? [];
    const count = STICKER_CATEGORY_COUNTS[category] ?? items.length;
    const samples = items
      .slice(0, 5)
      .map((s) => `\`${s.componentName}\``)
      .join(", ");
    return `- **${CATEGORY_LABELS[category]}** (\`${category}\`, ${count}): ${samples}${items.length > 5 ? ", ..." : ""}`;
  });
}

/**
 * `/llms.txt`: concise, link-dense index (~3.5-4.5 KB) following the llmstxt.org format.
 * Emphasizes Trazo's React, Vue, Svelte, standalone SVG, bulk ZIP export, and agent skill.
 */
export function buildLlmsTxt(): string {
  const pkg = siteConfig.npmPackage;
  const sections: string[] = [
    `# ${siteConfig.name}`,
    "",
    `> ${STICKER_COUNT} hand-drawn, wax-textured crayon SVG stickers baked into clean vector paths. MIT licensed, tree-shakeable components for React, Vue 3/Nuxt, Svelte 5/SvelteKit, and standalone SVG strings via \`${pkg}\` on npm, plus live recoloring, bulk SVG/PNG ZIP export, and an agent illustration skill.`,
    "",
    `- Site: ${siteConfig.url}`,
    `- Library: ${siteConfig.url}/library`,
    `- npm: ${siteConfig.npm}`,
    `- GitHub: ${siteConfig.github}`,
    `- License: MIT (${siteConfig.author.name})`,
    "",
    "## Install",
    "",
    "```bash",
    ...PACKAGE_MANAGERS.map((pm) => installCommands[pm]),
    "```",
    "",
    "## Quick Start",
    "",
    "All framework components accept `size` (number | string, default `48`), `color` (`\"mix\"` for native multi-color crayon layers or any CSS/hex color for a single-color stamp), `rotate` (degrees, default `0`), `title` (accessible `<title>` + `role=\"img\"`), and standard SVG attributes.",
    "",
    "### React (`trazo-stickers`)",
    "",
    "```tsx",
    `import { Dolphin, HeartCat } from "${pkg}";`,
    "",
    `<Dolphin size={64} />`,
    `<HeartCat size={56} color="#ef4444" rotate={-8} />`,
    "```",
    "",
    "### Vue 3 & Nuxt (`trazo-stickers/vue`)",
    "",
    "```vue",
    "<script setup>",
    `import { HeartCat } from "${pkg}/vue";`,
    "</script>",
    "<template>",
    `  <HeartCat :size="56" color="#ef4444" :rotate="-8" />`,
    "</template>",
    "```",
    "",
    "### Svelte 5 & SvelteKit (`trazo-stickers/svelte`)",
    "",
    "```svelte",
    `<script lang="ts">`,
    `  import { Dolphin, HeartCat } from "${pkg}/svelte";`,
    "</script>",
    `<Dolphin size={64} />`,
    `<HeartCat size={56} color="#ef4444" rotate={-8} />`,
    "```",
    "",
    "### Standalone SVG (`trazo-stickers/svg`)",
    "",
    "Works in Astro, Node, plain HTML, or Svelte 4 with zero framework dependencies:",
    "",
    "```ts",
    `import { dolphinDef, findSticker, toSvgString } from "${pkg}/svg";`,
    "",
    `const svg = toSvgString(dolphinDef, { size: 64, rotate: -6, title: "Dolphin" });`,
    `const stamped = toSvgString(findSticker("heart-cat")!, { size: 48, color: "#1f1e1b" });`,
    "```",
    "",
    "## Agent Skill",
    "",
    "Need a sticker that is not in the 100-sticker catalog? Install the Trazo illustration skill so your AI coding agent can draw original wax-crayon SVGs and review them at small sizes (16 px+):",
    "",
    "```bash",
    illustrationSkill.command,
    "```",
    "",
    `- Example prompt: ${illustrationSkill.prompt}`,
    `- Skill docs: ${siteConfig.url}/library/skill`,
    `- Skill source: ${illustrationSkill.source}`,
    "",
    `## Categories (${STICKER_COUNT} stickers across ${CATEGORY_ORDER.length} categories)`,
    "",
    ...categorySummaryLines(),
    "",
    "## Optional",
    "",
    `- [Complete ${STICKER_COUNT}-sticker catalog and API reference](${siteConfig.url}/llms-full.txt): every exact component name, sticker ID, category, default color, tags, and URL in one plain-text file`,
    `- [Interactive sticker library](${siteConfig.url}/library): live recoloring, search, React/Vue/Svelte/JS snippet generator, and bulk SVG/PNG ZIP downloads`,
    `- [Trazo illustration agent skill](${siteConfig.url}/library/skill): install instructions and example prompt`,
    `- [Sitemap](${siteConfig.url}/sitemap.xml): all sticker detail pages`,
  ];

  return `${sections.join("\n")}\n`;
}

/**
 * `/llms-full.txt`: complete single-file catalog reference derived from `trazoCatalogMeta`
 * so AI coding agents can look up exact component names, IDs, props, and tags without hallucinating.
 */
export function buildLlmsFullTxt(): string {
  const pkg = siteConfig.npmPackage;
  const grouped = groupByCategory(trazoCatalogMeta);

  const sections: string[] = [
    `# ${siteConfig.name} - Full Catalog & API Reference`,
    "",
    `> ${siteConfig.description}`,
    "",
    `- Site: ${siteConfig.url}`,
    `- Library: ${siteConfig.url}/library`,
    `- Agent Skill: ${siteConfig.url}/library/skill`,
    `- Concise index: ${siteConfig.url}/llms.txt`,
    `- npm package: ${pkg} (${siteConfig.npm})`,
    `- Repository: ${siteConfig.github}`,
    `- License: MIT (${siteConfig.author.name})`,
    `- Total stickers: ${STICKER_COUNT}`,
    "",
    "## Installation",
    "",
    "```bash",
    ...PACKAGE_MANAGERS.map((pm) => installCommands[pm]),
    "```",
    "",
    "## Package Entry Points",
    "",
    `- \`${pkg}\`: Tree-shakeable React 18/19 components (PascalCase exports, e.g. \`Dolphin\`, \`HeartCat\`)`,
    `- \`${pkg}/vue\`: Native Vue 3 and Nuxt components (same PascalCase exports)`,
    `- \`${pkg}/svelte\`: Native Svelte 5 and SvelteKit components with SSR & hydration support (same PascalCase exports + \`SvelteStickerProps\` type)`,
    `- \`${pkg}/svg\`: Framework-free SVG string helpers (\`toSvgString\`, \`findSticker\`, \`trazoCatalog\`, and per-sticker \`*Def\` exports like \`dolphinDef\`)`,
    `- \`${pkg}/meta\`: Lightweight metadata-only catalog (\`trazoCatalogMeta\`, \`STICKER_COUNT\`, \`STICKER_CATEGORY_COUNTS\`, \`findStickerMeta\`) without SVG path payloads`,
    "",
    "## Component Props (React, Vue, Svelte)",
    "",
    "| Prop | Type | Default | Description |",
    "| --- | --- | --- | --- |",
    '| `size` | `number | string` | `48` | Width and height of the `<svg>` element |',
    '| `color` | `string` | `"mix"` | Omit or pass `"mix"` for multi-color crayon layers; pass any hex/CSS color (e.g. `"#ef4444"` or `"currentColor"`) for a single-color stamp |',
    "| `rotate` | `number` | `0` | Rotation angle in degrees around the sticker center |",
    '| `title` | `string` | `undefined` | Renders `<title>` and `role="img"` for accessibility (decorative `aria-hidden="true"` when omitted) |',
    "| `...props` | SVG attributes | - | Standard SVG attributes (`className` / `class`, `style`, event handlers, etc.) |",
    "",
    "## Usage Examples",
    "",
    "### React",
    "",
    "```tsx",
    `import { Dolphin, HeartCat, CurlyArrow } from "${pkg}";`,
    "",
    "export function Example() {",
    "  return (",
    "    <>",
    "      <Dolphin size={64} />",
    '      <HeartCat size={56} color="#ef4444" rotate={-8} />',
    '      <CurlyArrow size={48} color="currentColor" title="Curly arrow" />',
    "    </>",
    "  );",
    "}",
    "```",
    "",
    "### Vue 3 & Nuxt",
    "",
    "```vue",
    "<script setup>",
    `import { HeartCat } from "${pkg}/vue";`,
    "</script>",
    "",
    "<template>",
    '  <HeartCat :size="56" color="#ef4444" :rotate="-8" title="Heart cat" />',
    "</template>",
    "```",
    "",
    "### Svelte 5 & SvelteKit",
    "",
    "```svelte",
    '<script lang="ts">',
    `  import { Dolphin, HeartCat } from "${pkg}/svelte";`,
    "</script>",
    "",
    "<Dolphin size={64} />",
    '<HeartCat size={56} color="#ef4444" rotate={-8} title="Heart cat" />',
    "```",
    "",
    "### Standalone SVG (Astro, Node, plain HTML)",
    "",
    "```ts",
    `import { dolphinDef, findSticker, toSvgString } from "${pkg}/svg";`,
    "",
    'const svg = toSvgString(dolphinDef, { size: 64, rotate: -6, title: "Dolphin" });',
    'const sticker = findSticker("heart-cat");',
    "if (sticker) {",
    '  const stamped = toSvgString(sticker, { size: 48, color: "#1f1e1b" });',
    "}",
    "```",
    "",
    "## Built-in Recoloring Swatches",
    "",
    "The Trazo web app supports live recoloring across the full canvas, individual SVG/PNG downloads, and bulk ZIP packs (all stickers, per category, or current search selection):",
    "",
    ...paletteOptions.map((option) =>
      option.kind === "mix"
        ? `- **${option.label}** (\`color="mix"\` / omit prop): Native multi-color wax-crayon artwork`
        : `- **${option.label}** (\`${option.hex}\`): Single-color stamp override`,
    ),
    "",
    "## Agent Illustration Skill",
    "",
    "Install the Trazo illustration skill to generate new crayon-and-gouache SVG stickers matching the catalog style and visually review them at 16 px and larger sizes:",
    "",
    "```bash",
    illustrationSkill.command,
    "```",
    "",
    `- Skill name: \`${illustrationSkill.name}\``,
    `- Example prompt: ${illustrationSkill.prompt}`,
    `- Docs: ${siteConfig.url}/library/skill`,
    `- Source: ${illustrationSkill.source}`,
    "",
    `## Complete Sticker Catalog (${STICKER_COUNT} stickers)`,
    "",
    "Every export below is valid in `trazo-stickers`, `trazo-stickers/vue`, and `trazo-stickers/svelte`. For `trazo-stickers/svg`, use `findSticker(\"<id>\")` or import `<camelCaseComponentName>Def` (for example `HeartCat` -> `heartCatDef`).",
    "",
  ];

  for (const category of CATEGORY_ORDER) {
    const items = grouped.get(category) ?? [];
    sections.push(
      `### ${CATEGORY_LABELS[category]} (\`${category}\` - ${items.length})`,
      "",
      "| Component | ID | Name | Default Color | Tags | URL |",
      "| --- | --- | --- | --- | --- | --- |",
      ...items.map(
        (sticker) =>
          `| \`${sticker.componentName}\` | \`${sticker.id}\` | ${sticker.name} | \`${sticker.mixColor}\` | ${sticker.tags.join(", ")} | ${siteConfig.url}/library/${sticker.id} |`,
      ),
      "",
    );
  }

  return `${sections.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd()}\n`;
}
