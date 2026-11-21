import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { formatCatalogFile, optimizeSticker } from "./optimize-catalog.mjs";

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
    "school",
  ];
  const catalogDir = path.join(rootDir, "packages/trazo/src/catalog");
  fs.mkdirSync(catalogDir, { recursive: true });

  const allItems = raw.map((item) => {
    if (/<filter|style=|id=/i.test(item.d)) {
      throw new Error(`Invalid SVG attributes found in ${item.id}`);
    }
    return optimizeSticker({
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
    });
  });

  for (const category of categories) {
    const items = allItems.filter((item) => item.category === category);
    fs.writeFileSync(
      path.join(catalogDir, `${category}.ts`),
      formatCatalogFile(category, items),
      "utf8",
    );
  }

  const categoryImports = categories.map((category) => {
    const vars = allItems
      .filter((i) => i.category === category)
      .map((i) => i.defVarName)
      .join(", ");
    return `import { ${category}Stickers, ${vars} } from "./catalog/${category}";`;
  });

  const svgLines = [
    `export {`,
    `  resolveConcreteColor,`,
    `  toSvgString,`,
    `  type StickerCategory,`,
    `  type StickerDef,`,
    `  type StickerLayer,`,
    `  type ToSvgStringOptions,`,
    `} from "./core";`,
    ``,
    `import type { StickerDef } from "./core";`,
    ...categoryImports,
    ``,
    `export { ${categories.map((c) => `${c}Stickers`).join(", ")} };`,
    `export {`,
    `  ${allItems.map((i) => i.defVarName).join(",\n  ")},`,
    `};`,
    ``,
    `export const trazoCatalog: readonly StickerDef[] = [`,
    ...allItems.map((i) => `  ${i.defVarName},`),
    `];`,
    ``,
    `export function findSticker(id: string): StickerDef | undefined {`,
    `  return trazoCatalog.find((item) => item.id === id);`,
    `}`,
    ``,
  ];

  fs.writeFileSync(
    path.join(rootDir, "packages/trazo/src/svg.ts"),
    svgLines.join("\n"),
    "utf8",
  );

  const indexCategoryImports = categories.map((category) => {
    const vars = allItems
      .filter((i) => i.category === category)
      .map((i) => i.defVarName)
      .join(", ");
    return `import { ${vars} } from "./catalog/${category}";`;
  });

  const indexLines = [
    `export {`,
    `  Sticker,`,
    `  createStickerComponent,`,
    `  type NamedStickerProps,`,
    `  type StickerProps,`,
    `} from "./scribble";`,
    ``,
    `export * from "./svg";`,
    ``,
    `import { createStickerComponent } from "./scribble";`,
    ...indexCategoryImports,
    ``,
    ...allItems.map(
      (item) =>
        `export const ${item.componentName} = /*#__PURE__*/ createStickerComponent(${item.defVarName});`,
    ),
    ``,
  ];

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
