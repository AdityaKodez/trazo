import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { compile } from "svelte/compiler";
import { render } from "svelte/server";

const pkgDir = fileURLToPath(new URL("../", import.meta.url));
const distDir = path.join(pkgDir, "dist");
const tempDir = await fs.mkdtemp(path.join(pkgDir, ".tmp-svelte-check-"));

function paths(markup) {
  return [...markup.matchAll(/<path d="([^"]*)" fill="([^"]*)"/g)].map(
    ([, d, fill]) => ({ d, fill }),
  );
}

try {
  await fs.cp(distDir, tempDir, { recursive: true });
  const sourceDir = path.join(tempDir, "svelte");
  for (const name of await fs.readdir(sourceDir)) {
    const filename = path.join(sourceDir, name);
    const source = await fs.readFile(filename, "utf8");
    for (const generate of ["client", "server"]) {
      const result = compile(source, { filename, generate });
      assert.deepEqual(result.warnings, [], `${name} (${generate}) compiler warnings`);
      if (generate === "server") {
        await fs.writeFile(
          `${filename}.js`,
          result.js.code.replaceAll('.svelte"', '.svelte.js"'),
        );
      }
    }
  }

  const entryPath = path.join(tempDir, "svelte.js");
  await fs.writeFile(
    entryPath,
    (await fs.readFile(entryPath, "utf8")).replaceAll('.svelte"', '.svelte.js"'),
  );
  const components = await import(pathToFileURL(entryPath).href);
  const { trazoCatalog, toSvgString } = await import(
    pathToFileURL(path.join(tempDir, "svg.js")).href
  );
  assert.equal(Object.keys(components).length, trazoCatalog.length);

  for (const def of trazoCatalog) {
    const component = components[def.componentName];
    assert.equal(typeof component, "function", def.componentName);
    for (const color of [undefined, "mix", "  MiX  ", "#ef4444", "currentColor", "  "]) {
      const props = { size: 64, color, rotate: -368, title: def.name };
      const { body } = render(component, { props });
      assert.deepEqual(paths(body), paths(toSvgString(def, props)), `${def.id}: ${color}`);
      assert.ok(body.includes('width="64" height="64"'));
      assert.ok(body.includes('transform="rotate(-8 '));
      assert.ok(body.includes('overflow="visible"'));
      assert.ok(body.includes('role="img"'));
      assert.ok(!body.includes('aria-hidden="true"'));
    }

    const { body } = render(component);
    assert.ok(body.includes('width="48" height="48"'));
    assert.ok(body.includes('aria-hidden="true"'));
    assert.ok(!body.includes("<title>"));
    assert.ok(!body.includes("<g "));
  }

  const { body } = render(components.HeartCat, {
    props: {
      size: "2rem",
      color: "currentColor",
      rotate: Number.NaN,
      title: '<cat> & "friends"',
      class: "sticker",
      style: "color: rebeccapurple",
      overflow: "hidden",
      "aria-label": "Custom accessible name",
    },
  });
  assert.ok(body.includes('width="2rem" height="2rem"'));
  assert.ok(body.includes('class="sticker"'));
  assert.ok(body.includes('style="color: rebeccapurple"'));
  assert.ok(body.includes('overflow="hidden"'));
  assert.ok(body.includes('aria-label="Custom accessible name"'));
  assert.ok(body.includes('<title>&lt;cat> &amp; "friends"</title>'));
  assert.ok(!body.includes("<g "));

  console.log(`Svelte: ${trazoCatalog.length} exports compile for client/SSR; artwork, props, accessibility, and escaping checks passed.`);
} finally {
  await fs.rm(tempDir, { recursive: true, force: true });
}
