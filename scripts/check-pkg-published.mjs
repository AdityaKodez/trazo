#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const pkgRelPath = "packages/trazo/package.json";
const pkgAbsPath = path.join(repoRoot, pkgRelPath);
const stagedMode = process.argv.includes("--staged");

function git(args) {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function readGitJson(spec) {
  try {
    return JSON.parse(git(["show", spec]));
  } catch {
    return null;
  }
}

async function fetchNpmLatest(packageName) {
  const url = `https://registry.npmjs.org/${encodeURIComponent(packageName)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/vnd.npm.install-v1+json",
        "Cache-Control": "no-cache",
      },
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    return data["dist-tags"]?.latest ?? null;
  } finally {
    clearTimeout(timer);
  }
}

function printReleaseReminder(packageName, nextHint) {
  console.error("");
  console.error("Action required before committing changes to packages/trazo/:");
  console.error(`  1. Bump "version" in ${pkgRelPath}${nextHint ? ` (e.g. ${nextHint})` : ""}`);
  console.error("  2. Verify: npm run pkg:check:svelte");
  console.error("  3. Publish: cd packages/trazo && npm publish --access public");
  console.error(
    `  4. If Staged Publishing queues it, approve on https://www.npmjs.com/package/${packageName}`,
  );
  console.error("  5. Re-run: npm run pkg:check:published  (then commit & tag)");
  console.error("");
}

function suggestNextPatch(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(version ?? "");
  if (!match) return null;
  return `${match[1]}.${match[2]}.${Number(match[3]) + 1}`;
}

async function main() {
  if (stagedMode) {
    const stagedPkgFiles = git([
      "diff",
      "--cached",
      "--name-only",
      "--",
      "packages/trazo",
    ]);

    if (!stagedPkgFiles) {
      process.exit(0);
    }

    const stagedPkg = readGitJson(`:${pkgRelPath}`);
    if (!stagedPkg?.name || !stagedPkg?.version) {
      console.error(`[pkg-release-gate] Could not read staged ${pkgRelPath}.`);
      process.exit(1);
    }

    const headPkg = readGitJson(`HEAD:${pkgRelPath}`);
    if (headPkg && stagedPkg.version === headPkg.version) {
      console.error(
        `[pkg-release-gate] BLOCKED: Staged changes under packages/trazo/, but ${pkgRelPath} is still at ${stagedPkg.version}.`,
      );
      printReleaseReminder(stagedPkg.name, suggestNextPatch(stagedPkg.version));
      process.exit(1);
    }

    let npmLatest;
    try {
      npmLatest = await fetchNpmLatest(stagedPkg.name);
    } catch (err) {
      console.error(
        `[pkg-release-gate] BLOCKED: Could not verify ${stagedPkg.name} on npm (${err instanceof Error ? err.message : String(err)}).`,
      );
      printReleaseReminder(stagedPkg.name, null);
      process.exit(1);
    }

    if (npmLatest !== stagedPkg.version) {
      console.error(
        `[pkg-release-gate] BLOCKED: ${stagedPkg.name}@${stagedPkg.version} is NOT live on npm yet (dist-tags.latest is ${npmLatest ?? "none"}).`,
      );
      printReleaseReminder(stagedPkg.name, null);
      process.exit(1);
    }

    console.log(
      `[pkg-release-gate] OK: ${stagedPkg.name}@${stagedPkg.version} is live on npm.`,
    );
    process.exit(0);
  }

  // Standalone check: verify working tree has no unpublished package changes and matches npm latest.
  const localPkg = JSON.parse(fs.readFileSync(pkgAbsPath, "utf8"));
  const headPkg = readGitJson(`HEAD:${pkgRelPath}`);
  const dirtyPkgFiles = git(["status", "--porcelain", "--", "packages/trazo"]);

  let npmLatest;
  try {
    npmLatest = await fetchNpmLatest(localPkg.name);
  } catch (err) {
    console.error(
      `[pkg-release-gate] FAIL: Could not query npm for ${localPkg.name} (${err instanceof Error ? err.message : String(err)}).`,
    );
    process.exit(1);
  }

  if (npmLatest !== localPkg.version) {
    console.error(
      `[pkg-release-gate] UNPUBLISHED: ${pkgRelPath} is ${localPkg.version}, but npm latest is ${npmLatest ?? "none"}.`,
    );
    printReleaseReminder(localPkg.name, null);
    process.exit(1);
  }

  if (dirtyPkgFiles && (!headPkg || localPkg.version === headPkg.version)) {
    console.error(
      `[pkg-release-gate] UNPUBLISHED: Local changes exist under packages/trazo/ without a new published version (still at ${localPkg.version}).`,
    );
    printReleaseReminder(localPkg.name, suggestNextPatch(localPkg.version));
    process.exit(1);
  }

  console.log(
    `[pkg-release-gate] OK: ${localPkg.name}@${localPkg.version} is live on npm${dirtyPkgFiles ? " (ready to commit)" : " and packages/trazo/ is clean"}.`,
  );
}

main();
