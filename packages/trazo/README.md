# trazo-stickers

Hand-drawn, wax-textured crayon sticker SVGs baked into clean vector paths. Tree-shakeable React, Vue, and Svelte components plus standalone SVG strings.

Browse, recolor, and copy every sticker live at **[trazo.akoder.xyz](https://trazo.akoder.xyz)**.

## Install

```bash
npm install trazo-stickers
```

```bash
pnpm add trazo-stickers
yarn add trazo-stickers
bun add trazo-stickers
```

## React usage

Import individual stickers for automatic tree-shaking:

```tsx
import { Dolphin, HeartCat, CurlyArrow } from "trazo-stickers";

export function Example() {
  return (
    <>
      {/* Multi-color pastel crayon artwork by default */}
      <Dolphin size={64} />

      {/* Single-color stamp override + rotation */}
      <HeartCat size={56} color="#ef4444" rotate={-8} />

      {/* Accessible standalone sticker */}
      <CurlyArrow size={48} color="currentColor" title="Curly arrow" />
    </>
  );
}
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `size` | `number \| string` | `48` | Width and height of the `<svg>` element |
| `color` | `string` | `"mix"` | Pass a hex/CSS color for a single-color stamp, or omit / `"mix"` for multi-color crayon layers |
| `rotate` | `number` | `0` | Rotation angle in degrees around the sticker center |
| `title` | `string` | `undefined` | Adds `<title>` and `role="img"` for accessibility (decorative `aria-hidden` when omitted) |
| `...props` | `SVGProps<SVGSVGElement>` | — | Standard SVG attributes (`className`, `style`, etc.) |

## Vue 3 and Nuxt (`trazo-stickers/vue`)

Import each sticker you use in your Vue or Nuxt app:

```vue
<script setup>
import { HeartCat } from "trazo-stickers/vue";
</script>

<template>
  <HeartCat :size="56" color="#ef4444" :rotate="-8" title="Heart cat" />
</template>
```

Vue stickers share the React `size`, `color`, `rotate`, and `title` props. Vue attributes such as `class` and `style` pass through to the SVG.

## Svelte 5 and SvelteKit (`trazo-stickers/svelte`)

Import each sticker you use in your Svelte 5 or SvelteKit app:

```svelte
<script lang="ts">
  import { Dolphin, HeartCat } from "trazo-stickers/svelte";
</script>

<Dolphin size={64} />
<HeartCat size={56} color="#ef4444" rotate={-8} title="Heart cat" />
```

Svelte stickers share the React `size`, `color`, `rotate`, and `title` props. Standard SVG attributes and event handlers, such as `class`, `style`, and `onclick`, pass through to the SVG. Props update reactively. Import the `SvelteStickerProps` type from the same entry point when needed.

This entry supports server rendering and hydration, shares the existing artwork, and does not import React or Vue. Only Svelte 5 is required; Svelte 4 apps can use the standalone SVG entry instead.

## Standalone SVG (`trazo-stickers/svg`)

Use the `trazo-stickers/svg` entry point for plain SVG strings. It works in Node, Astro, Svelte, and plain HTML without framework dependencies:

```ts
import { dolphinDef, findSticker, toSvgString } from "trazo-stickers/svg";

// Tree-shakeable single sticker import
const svg = toSvgString(dolphinDef, {
  size: 64,
  rotate: -6,
  title: "Dolphin",
});

// Or look up by id from the catalog
const sticker = findSticker("heart-cat");
if (sticker) {
  const stampedSvg = toSvgString(sticker, { size: 48, color: "#1f1e1b" });
}
```

## License

MIT © Aditya Ojha
