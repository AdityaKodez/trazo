[English](README.md) | 简体中文 | [日本語](README.ja.md)

# Trazo

专为 Web 打造的手绘蜡笔贴纸库。包含 100 款蜡笔质感矢量 SVG 贴纸（海洋生物、可爱猫咪、校园文具、美食、爱心、箭头、星星、云朵、庆祝与强调符号），全部烘焙为干净的矢量路径。支持在线实时换色、批量下载 SVG/PNG 压缩包、一键复制 SVG 或通过 npm 按需安装。

**在线体验：** [trazo.akoder.xyz](https://trazo.akoder.xyz) · **npm：** [`trazo-stickers`](https://www.npmjs.com/package/trazo-stickers) · **LLMs：** [`llms.txt`](https://trazo.akoder.xyz/llms.txt) / [`llms-full.txt`](https://trazo.akoder.xyz/llms-full.txt)

## 安装

```bash
npm i trazo-stickers
```

```tsx
import { Dolphin, HeartCat } from "trazo-stickers";

<Dolphin size={64} />
<HeartCat size={56} color="#ef4444" rotate={-8} />
```

支持多框架原生导出与自动 Tree-shaking：

- React：`trazo-stickers`
- Vue 3 / Nuxt：`trazo-stickers/vue`
- Svelte 5 / SvelteKit：`trazo-stickers/svelte`
- 纯 SVG 字符串（Astro / Node / 原生 HTML）：`trazo-stickers/svg`

完整的 Props 说明和各框架示例请查看 [`packages/trazo/README.md`](packages/trazo/README.md)。

## 用 AI Agent 绘制新贴纸

安装 [Trazo 插画风格技能](skills/trazo-illustration-style/SKILL.md)，让你的 AI 编程助手直接绘制风格一致的原创蜡笔风 SVG 贴纸，并自动检查小尺寸下的可读性（Skills CLI 需要 Node.js 22.20 及以上版本）。

```bash
npx skills add AdityaKodez/trazo --skill trazo-illustration-style
```

随后只需在对话中调用 `$trazo-illustration-style`，例如让它画一只打瞌睡的小狐狸并检查 16 px 尺寸下的清晰度。

## 仓库结构

| 路径 | 说明 |
| --- | --- |
| `app/`、`components/`、`config/`、`lib/` | Trazo 官网：基于 Next.js 的可拖拽贴纸画布与贴纸库（支持中/日/英搜索与实时定制弹窗） |
| `packages/trazo/` | `trazo-stickers` npm 包：贴纸目录、React / Vue / Svelte 组件、SVG 工具函数与构建脚本 |

## 本地运行网站

需要 Node.js 20.9 及以上版本和 npm。

```bash
git clone https://github.com/AdityaKodez/trazo.git
cd trazo
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 即可访问。

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动本地开发服务器 |
| `npm run build` | 先构建 npm 包，再构建网站 |
| `npm start` | 启动生产环境服务 |
| `npm run lint` | 运行 ESLint 检查 |
| `npm run pkg:build` | 仅将 `packages/trazo` 构建到 `packages/trazo/dist` |
| `npm run pkg:check:svelte` | 构建并校验全部 Svelte 导出的客户端编译、SSR、图形一致性与 SVG Props |

## 参与包开发

贴纸按分类存放在 `packages/trazo/src/catalog/` 中。网站通过 `tsconfig.json` 路径别名直接引用 `packages/trazo/src`。如需生成可发布的 `packages/trazo/dist`（不提交至 Git），请运行 `npm run pkg:build`。发布命令：

```bash
cd packages/trazo
npm publish
```

`prepublishOnly` 钩子会在发布前自动重新构建 `dist`。

## 技术栈

Next.js 16、React 19、Tailwind CSS 4、Motion、Radix UI、Vaul。

## 开源协议

MIT © [Aditya Ojha](https://www.akoder.xyz)。详见 [`LICENSE`](LICENSE)。

由 [@AdiKodez](https://x.com/AdiKodez) 制作。
