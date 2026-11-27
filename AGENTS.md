<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Working Agreement & Verification Rules

- **You own the code end-to-end**: Take full ownership from design and asset generation through package exports, app wiring, builds (`npm run build`), linting (`npm run lint`), and visual polish. Fix edge cases and regressions you discover rather than handing back partial work.
- **Gather requirements upfront, then execute continuously**: If anything important is ambiguous before starting, ask every needed question in one concise upfront batch. Do not stop repeatedly mid-task to ask for step-by-step confirmation once the direction is clear.
- **Verify UI and sticker work with screenshots**: Any visual, sticker, layout, or UI change must be verified in the running application and presented with screenshots of the wired result (covering light mode, dark preview, single-color ink recoloring, and canvas placement for sticker additions).

## npm Package Release Gate (`packages/trazo`)

The site resolves `trazo/*` directly from `./packages/trazo/src/*`, so the website can drift ahead of npm unless every package change is published. Enforce this gate strictly:

- **Trigger**: Any modification under `packages/trazo/` (stickers, catalog, React/Vue/Svelte/SVG entrypoints, `skills/trazo-stickers/`, `README.md`, or `package.json`).
- **Hold all commits until npm is live**: Do **not** run `git commit` or `git push` (and never pass `--no-verify`) for any change touching `packages/trazo/` until a new version is bumped in `packages/trazo/package.json`, verified (`npm run pkg:check:svelte` and `npm pack --dry-run` inside `packages/trazo`), published to npm, and confirmed live as `dist-tags.latest` on `https://registry.npmjs.org/trazo-stickers`.
- **Verify live `dist-tags.latest`, not just `npm publish`**: Because npm Staged Publishing can queue a release without updating `latest`, always confirm with `npm run pkg:check:published` that `dist-tags.latest` on npm equals `packages/trazo/package.json`.
- **If you cannot publish yourself (auth, 2FA/OTP, or Staged Publishing approval)**:
  1. **Hold the commit** — leave the changes uncommitted until the release is live on npm.
  2. **Force-remind the user immediately** with the exact commands to build/publish (`cd packages/trazo` -> `npm publish --access public`) and remind them to approve the staged release on `https://www.npmjs.com/package/trazo-stickers` if Staged Publishing queues it.
  3. **Keep reminding the user on every follow-up turn** while `packages/trazo/` has unpublished changes or `packages/trazo/package.json` is ahead of npm `dist-tags.latest`, until `npm run pkg:check:published` passes.
- **After npm confirms `dist-tags.latest` matches**: Commit the changes, tag `v<version>`, and push.
- **Local git hook enforcement**: `.githooks/pre-commit` runs `node scripts/check-pkg-published.mjs --staged` and blocks commits touching `packages/trazo/` until the version is bumped and live on npm. On a fresh clone, enable it with `git config core.hooksPath .githooks`.
