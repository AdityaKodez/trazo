import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const externalCatalogPath =
  "C:/Users/akcll/.gemini/antigravity/brain/2250f604-e2ce-4c6a-8ab8-772af412d451/scratch/trazo-phase0/catalog-v4.json";
const seaCatalogPath =
  "C:/Users/akcll/.gemini/antigravity/brain/45b32d17-929a-487a-8d07-2112bf37ba8e/scratch/sea-svgs/catalog-v4.json";
const localCatalogPath = path.join(rootDir, "packages/trazo/catalog.json");

function toPascalCase(id) {
  return id
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function toCamelCase(id) {
  const pascal = toPascalCase(id);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1) + "Def";
}

function main() {
  const sourcePath = fs.existsSync(localCatalogPath)
    ? localCatalogPath
    : externalCatalogPath;

  const existingRaw = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
  let raw = existingRaw;

  if (fs.existsSync(seaCatalogPath)) {
    const seaRaw = JSON.parse(fs.readFileSync(seaCatalogPath, "utf8")).map(
      (item) => ({
        ...item,
        category: "ocean",
      }),
    );
    const seaIds = new Set(seaRaw.map((item) => item.id));
    const filteredExisting = existingRaw.filter(
      (item) => !seaIds.has(item.id) && item.category !== "ocean",
    );
    raw = [...seaRaw, ...filteredExisting];
  }

  fs.mkdirSync(path.dirname(localCatalogPath), { recursive: true });
  fs.writeFileSync(
    localCatalogPath,
    JSON.stringify(raw, null, 2) + "\n",
    "utf8",
  );

  const categories = [
    "ocean",
    "arrows",
    "nature",
    "hearts",
    "symbols",
    "cats",
    "characters",
  ];
  const catalogDir = path.join(rootDir, "packages/trazo/src/catalog");
  fs.mkdirSync(catalogDir, { recursive: true });

  const allItems = raw.map((item) => {
    if (/<filter|style=|id=/i.test(item.d)) {
      throw new Error(`Invalid SVG attributes found in ${item.id}`);
    }
    return {
      id: item.id,
      componentName: toPascalCase(item.id),
      defVarName: toCamelCase(item.id),
      name: item.name,
      category: item.category,
      mixColor: item.mixColor.toLowerCase(),
      tags: item.tags,
      viewBox: item.viewBox || "0 0 256 256",
      d: item.d.trim(),
      layers: Array.isArray(item.layers)
        ? item.layers.map((ly) => ({
            d: ly.d.trim(),
            fill: ly.fill.toLowerCase(),
          }))
        : undefined,
    };
  });

  for (const category of categories) {
    const items = allItems.filter((item) => item.category === category);
    const lines = [
      `import type { StickerDef } from "../scribble";`,
      ``,
    ];

    for (const item of items) {
      lines.push(`export const ${item.defVarName}: StickerDef = {`);
      lines.push(`  id: ${JSON.stringify(item.id)},`);
      lines.push(`  componentName: ${JSON.stringify(item.componentName)},`);
      lines.push(`  name: ${JSON.stringify(item.name)},`);
      lines.push(`  category: ${JSON.stringify(item.category)},`);
      lines.push(`  mixColor: ${JSON.stringify(item.mixColor)},`);
      lines.push(`  tags: ${JSON.stringify(item.tags)},`);
      lines.push(`  viewBox: ${JSON.stringify(item.viewBox)},`);
      lines.push(`  d: ${JSON.stringify(item.d)},`);
      if (item.layers && item.layers.length > 0) {
        lines.push(`  layers: ${JSON.stringify(item.layers)},`);
      }
      lines.push(`};`);
      lines.push(``);
    }

    lines.push(
      `export const ${category}Stickers: readonly StickerDef[] = [${items
        .map((i) => i.defVarName)
        .join(", ")}];`,
    );
    lines.push(``);

    fs.writeFileSync(
      path.join(catalogDir, `${category}.ts`),
      lines.join("\n"),
      "utf8",
    );
  }

  const indexLines = [
    `export {`,
    `  Sticker,`,
    `  createStickerComponent,`,
    `  resolveConcreteColor,`,
    `  toSvgString,`,
    `  type NamedStickerProps,`,
    `  type StickerCategory,`,
    `  type StickerDef,`,
    `  type StickerLayer,`,
    `  type StickerProps,`,
    `  type ToSvgStringOptions,`,
    `} from "./scribble";`,
    ``,
    `import { createStickerComponent, type StickerDef } from "./scribble";`,
    `import { oceanStickers, ${allItems
      .filter((i) => i.category === "ocean")
      .map((i) => i.defVarName)
      .join(", ")} } from "./catalog/ocean";`,
    `import { arrowsStickers, ${allItems
      .filter((i) => i.category === "arrows")
      .map((i) => i.defVarName)
      .join(", ")} } from "./catalog/arrows";`,
    `import { natureStickers, ${allItems
      .filter((i) => i.category === "nature")
      .map((i) => i.defVarName)
      .join(", ")} } from "./catalog/nature";`,
    `import { heartsStickers, ${allItems
      .filter((i) => i.category === "hearts")
      .map((i) => i.defVarName)
      .join(", ")} } from "./catalog/hearts";`,
    `import { symbolsStickers, ${allItems
      .filter((i) => i.category === "symbols")
      .map((i) => i.defVarName)
      .join(", ")} } from "./catalog/symbols";`,
    `import { catsStickers, ${allItems
      .filter((i) => i.category === "cats")
      .map((i) => i.defVarName)
      .join(", ")} } from "./catalog/cats";`,
    `import { charactersStickers, ${allItems
      .filter((i) => i.category === "characters")
      .map((i) => i.defVarName)
      .join(", ")} } from "./catalog/characters";`,
    ``,
    `export { oceanStickers, arrowsStickers, natureStickers, heartsStickers, symbolsStickers, catsStickers, charactersStickers };`,
    `export {`,
    `  ${allItems.map((i) => i.defVarName).join(",\n  ")},`,
    `};`,
    ``,
  ];

  for (const item of allItems) {
    indexLines.push(
      `export const ${item.componentName} = createStickerComponent(${item.defVarName});`,
    );
  }

  indexLines.push(``);
  indexLines.push(`export const trazoCatalog: readonly StickerDef[] = [`);
  for (const item of allItems) {
    indexLines.push(`  ${item.defVarName},`);
  }
  indexLines.push(`];`);
  indexLines.push(``);
  indexLines.push(
    `export function findSticker(id: string): StickerDef | undefined {`,
  );
  indexLines.push(`  return trazoCatalog.find((item) => item.id === id);`);
  indexLines.push(`}`);
  indexLines.push(``);

  fs.writeFileSync(
    path.join(rootDir, "packages/trazo/src/index.ts"),
    indexLines.join("\n"),
    "utf8",
  );

  console.log(
    `Normalized ${allItems.length} crayon stickers across ${categories.length} categories.`,
  );
}

main();
