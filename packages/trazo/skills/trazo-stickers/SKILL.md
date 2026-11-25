---
name: trazo-stickers
description: Guide for the trazo-stickers npm package, which provides 100 hand-drawn crayon sticker SVGs as React, Vue, and Svelte components and standalone SVG strings. Use when adding, importing, recoloring, rotating, looking up, or exporting Trazo stickers in code, or when the user mentions trazo-stickers or Trazo stickers.
---

# trazo-stickers

`trazo-stickers` ships 100 hand-drawn, wax-textured crayon stickers as vector paths. Each sticker is available as a React, Vue, or Svelte component and as an SVG string.

Stickers are decorative. They have no click or form behavior, so wrap one in a link or button when it needs an action. The package only renders its bundled stickers. It has no API for creating new artwork.

## Install and imports

- Install with `npm install trazo-stickers`. pnpm, yarn, and bun also work.
- The package ships ES modules only (`"type": "module"`). Use `import`, not `require`.
- The root entry `trazo-stickers` exports the React components and everything from the `svg` entry. It imports React at runtime, so `react` 18 or newer must be installed.
- Use `trazo-stickers/vue` for Vue 3 and Nuxt components. Only Vue is required by this entry.
- Use `trazo-stickers/svelte` for Svelte 5 and SvelteKit components. Only Svelte is required by this entry; Svelte 4 apps should use SVG strings.
- The `trazo-stickers/svg` entry has no React dependency. Use it in Node, Astro, Svelte, Vue, or plain HTML.

## React components

```tsx
import { Dolphin, HeartCat, CurlyArrow } from "trazo-stickers";

<Dolphin size={64} />
<HeartCat size={56} color="#ef4444" rotate={-8} />
<CurlyArrow size={48} title="Curly arrow" />
```

Each component name is the sticker id in PascalCase, so `heart-cat` becomes `HeartCat`. Props:

- `size`: number or CSS length string. Default `48`. Sets the SVG `width` and `height`.
- `color`: default `"mix"`, which keeps the multi-color crayon artwork. Any other color, such as `"#ef4444"` or `"currentColor"`, renders a single-color stamp. Use `"currentColor"` to follow the surrounding text color.
- `rotate`: degrees around the sticker center. Default `0`.
- `title`: adds `<title>` and `role="img"`. Without a title, the SVG is `aria-hidden="true"`.
- Other SVG props, such as `className` and `style`, pass through to the `<svg>` element.

For a custom `StickerDef`, use `<Sticker def={def} />` or `createStickerComponent(def)`.

## Svelte components

```svelte
<script lang="ts">
  import { Dolphin, HeartCat } from "trazo-stickers/svelte";
</script>

<Dolphin size={64} />
<HeartCat size={56} color="#ef4444" rotate={-8} title="Heart cat" />
```

Svelte components use the same `size`, `color`, `rotate`, and `title` props as React. Standard SVG attributes and event handlers pass through; use `class` rather than `className`. Props update reactively, and the entry supports SSR and hydration. `SvelteStickerProps` is exported as a type.

## Standalone SVG strings

```ts
import { findSticker, toSvgString } from "trazo-stickers/svg";

const heart = findSticker("heart-cat");
if (!heart) throw new Error("Unknown sticker id: heart-cat");
const svg = toSvgString(heart, { size: 48, color: "#1f1e1b", title: "Heart cat" });
```

- `toSvgString(def, options)` returns a complete `<svg>` string. Options: `size` (a number of pixels, default `64`), `color`, `rotate`, and `title`.
- `findSticker(id)` returns the `StickerDef` or `undefined`. Check for `undefined` before use.
- Import a sticker directly when its name is known, for example `toSvgString(dolphinDef, { size: 64, rotate: -6 })`.
- In standalone strings, a `color` starting with `var(` falls back to `#1f1e1b`. The output is meant to render the same in canvas and in downloaded files.
- The default `size` is `64` here but `48` for React components.

## Catalog

- `trazoCatalog` is a readonly array of all 100 `StickerDef` objects. The root and `svg` entries export it; use the `svg` entry for catalog lookups outside React.
- A `StickerDef` has `id`, `componentName`, `name`, `category`, `mixColor`, `tags`, `viewBox`, `d`, and optional `layers`.
- Search by `tags` or `name`, for example `trazoCatalog.filter((sticker) => sticker.tags.includes("cat"))`.
- Ids by category:
  - `ocean` (16): `baby-squid`, `conch-shell`, `flapjack-octopus`, `seahorse`, `shrimp`, `starfish`, `sea-turtle`, `red-octopus`, `blue-minnow`, `red-crab`, `pearl-clam`, `pink-jellyfish`, `dolphin`, `scallop-shell`, `striped-fish`, `sea-bubble`
  - `arrows` (12): `curly-arrow`, `spiral`, `square-spiral`, `loop-ribbon`, `zigzag-scribble`, `loop-arrow-orange`, `vertical-zigzag`, `down-arrow`, `peach-coil`, `sky-coil`, `wavy-underline`, `paper-plane`
  - `symbols` (14): `diamond`, `anger-mark`, `triangle`, `circle-ring`, `asterisk`, `lightning-bolt`, `question-mark`, `exclamation-mark`, `diagonal-hatch`, `hashtag`, `trophy`, `rocket`, `speech-bubble`, `checkmark`
  - `hearts` (14): `crown-rays`, `heart-burst`, `six-star`, `heart-chevron`, `solid-star`, `sparkle-four`, `sparkle-cross`, `bowtie-loop`, `triple-heart-swirl`, `double-hearts`, `star-outline`, `crosshair-burst`, `party-popper`, `crown`
  - `nature` (12): `flower-red`, `puffy-cloud`, `flower-yellow`, `ocean-waves`, `sun-burst`, `splash-drops`, `triple-zigzag`, `spiky-grass`, `scalloped-wave`, `earth`, `mushroom`, `sleepy-fox`
  - `cats` (8): `heart-cat`, `daisy-cat`, `hugging-cats`, `flower-cat`, `bowtie-cat`, `stacked-cats`, `cheering-cat`, `heart-hug`
  - `characters` (5): `pink-dino`, `spider-man`, `stitch`, `little-green-alien`, `woody-wink`
  - `school` (12): `yellow-pencil`, `blue-crayon`, `crayon-box`, `highlighter`, `spiral-notebook`, `book-stack`, `open-book`, `school-backpack`, `school-eraser`, `wooden-ruler`, `craft-scissors`, `pencil-sharpener`
  - `food` (7): `pizza`, `burger`, `french-fries`, `sandwich`, `pastry`, `iced-coffee`, `glazed-donut`

## Licensing note

The package is MIT licensed. The `characters` category depicts third-party franchise characters such as Spider-Man, Stitch, and Woody. Confirm usage rights before shipping those stickers in a commercial product.
