[English](README.md) | [简体中文](README.zh-CN.md) | 日本語

# Trazo

Webのための手描きクレヨンステッカー集。海の生き物、かわいい猫、文具、フード、ハート、矢印、星、雲、お祝い・強調マークなど、100種のクレヨン風SVGステッカーをクリーンなベクターパスとして収録しています。サイト上でリアルタイム配色、SVG/PNG一括ZIPダウンロード、SVGコピー、またはnpmからのインストールが可能です。

**サイト:** [trazo.akoder.xyz](https://trazo.akoder.xyz) · **npm:** [`trazo-stickers`](https://www.npmjs.com/package/trazo-stickers) · **LLMs:** [`llms.txt`](https://trazo.akoder.xyz/llms.txt) / [`llms-full.txt`](https://trazo.akoder.xyz/llms-full.txt)

## インストール

```bash
npm i trazo-stickers
```

```tsx
import { Dolphin, HeartCat } from "trazo-stickers";

<Dolphin size={64} />
<HeartCat size={56} color="#ef4444" rotate={-8} />
```

各フレームワーク向けのツリーシェイク対応エントリーポイントを提供しています：

- React：`trazo-stickers`
- Vue 3 / Nuxt：`trazo-stickers/vue`
- Svelte 5 / SvelteKit：`trazo-stickers/svelte`
- スタンドアロン SVG 文字列（Astro / Node / 素の HTML）：`trazo-stickers/svg`

全 Props や詳しい使い方は [`packages/trazo/README.md`](packages/trazo/README.md) をご覧ください。

## AI エージェントでオリジナルステッカーを描く

[Trazo イラストレーションスキル](skills/trazo-illustration-style/SKILL.md)をプロジェクトに追加すると、AI コーディングエージェントに Trazo テイストのオリジナル SVG ステッカーを描かせ、小さなサイズでの視認性までレビューさせることができます（Skills CLI は Node.js 22.20 以上が必要です）。

```bash
npx skills add AdityaKodez/trazo --skill trazo-illustration-style
```

エージェントに `$trazo-illustration-style` を使うよう指示してみてください。たとえば「眠そうなキツネを描いて 16 px での見え方を確認して」のように頼めます。

## リポジトリ構成

| パス | 内容 |
| --- | --- |
| `app/`, `components/`, `config/`, `lib/` | Trazo サイト：ドラッグ操作できるステッカーキャンバスと多言語検索対応のライブラリ UI（Next.js） |
| `packages/trazo/` | `trazo-stickers` npm パッケージ：ステッカーカタログ、React / Vue / Svelte コンポーネント、SVG ヘルパー、ビルドスクリプト |

## ローカルで起動する

Node.js 20.9 以上と npm が必要です。

```bash
git clone https://github.com/AdityaKodez/trazo.git
cd trazo
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) を開きます。

| スクリプト | 内容 |
| --- | --- |
| `npm run dev` | 開発サーバーを起動 |
| `npm run build` | パッケージをビルドしてからサイトをビルド |
| `npm start` | 本番ビルドを起動 |
| `npm run lint` | ESLint を実行 |
| `npm run pkg:build` | `packages/trazo` のみを `packages/trazo/dist` にビルド |
| `npm run pkg:check:svelte` | 全 Svelte エクスポートのクライアントコンパイル・SSR・アートワーク一致・SVG Props を検証 |

## パッケージの開発

ステッカー定義はカテゴリごとに `packages/trazo/src/catalog/` に配置されています。サイト側は `tsconfig.json` のパスエイリアスを通じて `packages/trazo/src` を直接読み込みます。公開用の `packages/trazo/dist`（Git 管理外）を生成するには `npm run pkg:build` を実行してください。公開手順：

```bash
cd packages/trazo
npm publish
```

`prepublishOnly` により公開前に自動で `dist` が再ビルドされます。

## 技術スタック

Next.js 16、React 19、Tailwind CSS 4、Motion、Radix UI、Vaul。

## ライセンス

MIT © [Aditya Ojha](https://www.akoder.xyz)。詳細は [`LICENSE`](LICENSE) をご覧ください。

Made by [@AdiKodez](https://x.com/AdiKodez).
