import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgDir = path.resolve(__dirname, "..");
const distDir = path.join(pkgDir, "dist");
const tscBin = path.resolve(
  pkgDir,
  "../../node_modules/typescript/bin/tsc",
);

fs.rmSync(distDir, { recursive: true, force: true });

execFileSync(process.execPath, [tscBin, "-p", path.join(pkgDir, "tsconfig.json")], {
  stdio: "inherit",
});

function addJsExtension(specifier) {
  if (!specifier.startsWith("./") && !specifier.startsWith("../")) {
    return specifier;
  }
  if (/\.(?:[cm]?js|json)$/i.test(specifier)) {
    return specifier;
  }
  return `${specifier}.js`;
}

function rewriteRelativeImports(content) {
  return content
    .replace(
      /(\bfrom\s+["'])(\.\.?\/[^"']+)(["'])/g,
      (_, prefix, spec, suffix) => `${prefix}${addJsExtension(spec)}${suffix}`,
    )
    .replace(
      /(\bimport\(\s*["'])(\.\.?\/[^"']+)(["']\s*\))/g,
      (_, prefix, spec, suffix) => `${prefix}${addJsExtension(spec)}${suffix}`,
    );
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.name.endsWith(".js") || entry.name.endsWith(".d.ts")) {
      const source = fs.readFileSync(fullPath, "utf8");
      const updated = rewriteRelativeImports(source);
      if (updated !== source) {
        fs.writeFileSync(fullPath, updated, "utf8");
      }
    }
  }
}

walk(distDir);
