#!/usr/bin/env node
import { mkdir, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const args = process.argv.slice(2);
const showSubjects = args[0] !== "--unlabeled";
const [output, sizeList, ...files] = showSubjects ? args : args.slice(1);
const sizes = sizeList?.split(",").map(Number) ?? [];
const usage = "Usage: node render_review_sheet.mjs [--unlabeled] <out.png> <sizes-in-px> <sticker.svg> [...]";
const themes = [
  { name: "Light", background: "#ffffff", text: "#3e4046" },
  { name: "Dark", background: "#1a1b20", text: "#e0e0e5" },
];

function checkArgs() {
  if (path.extname(output ?? "").toLowerCase() !== ".png" || !files.length ||
      files.some((file) => path.extname(file).toLowerCase() !== ".svg") ||
      !sizes.length || sizes.some((size) => !Number.isInteger(size) || size < 1 || size > 512) ||
      new Set(sizes).size !== sizes.length) {
    throw new Error(usage);
  }
}

function loadSharp() {
  const require = createRequire(path.resolve("trazo-preview.cjs"));
  try {
    return require("sharp");
  } catch (error) {
    throw new Error("Could not load sharp from the current directory. Use a working directory with sharp or capture the same grid in a browser.", { cause: error });
  }
}

function escapeXml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

async function render() {
  checkArgs();
  const sharp = loadSharp();
  const padding = 16;
  const columnWidths = sizes.map((size) => Math.max(size + 24, 56));
  const themeWidth = columnWidths.reduce((sum, width) => sum + width, 0);
  const header = 38;
  const closeUp = Math.max(...sizes);
  const rowHeight = closeUp + 43;
  const width = themeWidth * themes.length + padding * (themes.length + 1);
  const height = header + rowHeight * files.length + padding;
  const label = (value, x, y, options = "") =>
    `<text x="${x}" y="${y}" ${options}>${escapeXml(value)}</text>`;
  const layout = [`<rect width="${width}" height="${height}" fill="#eeeef0"/>`];
  const overlays = [];

  for (const [themeIndex, theme] of themes.entries()) {
    const left = padding + themeIndex * (themeWidth + padding);
    layout.push(label(theme.name, left, 25, 'font-size="14" font-weight="bold"'));
    layout.push(`<rect x="${left}" y="${header}" width="${themeWidth}" height="${height - header - padding}" rx="8" fill="${theme.background}"/>`);
  }

  for (const [row, file] of files.entries()) {
    const svg = await readFile(file);
    const filename = path.parse(file).name.replaceAll("-", " ").replaceAll("_", " ");
    const subject = filename.charAt(0).toUpperCase() + filename.slice(1);
    const top = header + row * rowHeight;
    const rasters = await Promise.all(sizes.map((size) => sharp(svg)
      .resize(size, size, { fit: "contain", background: "#00000000" })
      .png()
      .toBuffer()));

    for (const [themeIndex, theme] of themes.entries()) {
      let left = padding + themeIndex * (themeWidth + padding);
      if (showSubjects) {
        layout.push(label(subject, left + 12, top + 19, `font-weight="bold" fill="${theme.text}"`));
      }
      for (const [column, size] of sizes.entries()) {
        const columnWidth = columnWidths[column];
        const x = left + Math.floor((columnWidth - size) / 2);
        const y = top + 25 + Math.floor((closeUp - size) / 2);
        overlays.push({ input: rasters[column], left: x, top: y });
        layout.push(label(`${size} px`, left + columnWidth / 2, top + rowHeight - 6,
          `text-anchor="middle" font-size="10" fill="${theme.text}"`));
        left += columnWidth;
      }
    }
  }

  const frame = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" font-family="Arial, sans-serif" font-size="12" fill="#22232a">${layout.join("")}</svg>`);
  await mkdir(path.dirname(output), { recursive: true });
  await sharp(frame).composite(overlays).png().toFile(output);
  console.log(`Wrote ${output} (${width}×${height})`);
}

render().catch((error) => {
  console.error(error.message);
  if (error.cause) console.error(error.cause.message);
  process.exitCode = 1;
});