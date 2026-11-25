# Trazo

Hand-drawn crayon stickers for the web. 100 wax-textured SVG stickers (sea creatures, cats, school accessories, food, hearts, arrows, stars, clouds, celebration & emphasis marks) baked into clean vector paths. Recolor them live, copy the SVG, or install them from npm.

**Site:** [trazo.akoder.xyz](https://trazo.akoder.xyz) · **npm:** [`trazo-stickers`](https://www.npmjs.com/package/trazo-stickers)

## Install

```bash
npm i trazo-stickers
```

```tsx
import { Dolphin, HeartCat } from "trazo-stickers";

<Dolphin size={64} />
<HeartCat size={56} color="#ef4444" rotate={-8} />
```

Use `trazo-stickers/vue` for native Vue 3 and Nuxt components, `trazo-stickers/svelte` for Svelte 5 and SvelteKit components, or `trazo-stickers/svg` for plain SVG strings. Full props and examples are in [`packages/trazo/README.md`](packages/trazo/README.md).

## Draw with an agent

Install the [Trazo illustration skill](skills/trazo-illustration-style/SKILL.md) in your project to draw original SVG stickers and review them at small sizes. The Skills CLI requires Node.js 22.20 or newer.

```bash
npx skills add AdityaKodez/trazo --skill trazo-illustration-style
```

Ask your agent to use `$trazo-illustration-style`. For example, ask it to draw a sleepy fox and check how it reads at 16 px.

## What's in this repo

| Path | What it is |
| --- | --- |
| `app/`, `components/`, `config/`, `lib/` | The Trazo site: a Next.js app with a pannable sticker canvas and a library with a detail dialog for each sticker |
| `packages/trazo/` | The `trazo-stickers` npm package: sticker catalog, React, Vue, and Svelte components, SVG helpers, build script |

## Run the site locally

Requires Node.js 20.9 or newer and npm.

```bash
git clone https://github.com/AdityaKodez/trazo.git
cd trazo
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Build the package, then the site |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run pkg:build` | Build only `packages/trazo` into `packages/trazo/dist` |
| `npm run pkg:check:svelte` | Build and verify every Svelte export for client compilation, SSR, artwork parity, and SVG props |

## Working on the package

Stickers live in `packages/trazo/src/catalog/`, one file per category. The site imports them straight from `packages/trazo/src` through a path alias in `tsconfig.json`. To produce the publishable `packages/trazo/dist` (not committed), run `npm run pkg:build`. To publish:

```bash
cd packages/trazo
npm publish
```

`prepublishOnly` rebuilds `dist` first.

## Stack

Next.js 16, React 19, Tailwind CSS 4, Motion, Radix UI, Vaul.

## License

MIT © [Aditya Ojha](https://www.akoder.xyz). See [`LICENSE`](LICENSE).

Made by [@AdiKodez](https://x.com/AdiKodez).
