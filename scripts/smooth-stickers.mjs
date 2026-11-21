// Smooths the jagged polyline outlines of the crayon stickers into soft,
// die-cut-sticker curves while keeping every layer (depth, texture, details).
//
// Per closed subpath:
//   1. Taubin (λ/μ) smoothing removes the integer "staircase" wobble without
//      shrinking the shape, so stacked layers keep overlapping (no gaps).
//   2. Sharp corners (star tips, bolt points, arrow heads) are detected and pinned.
//   3. Points are thinned (Douglas–Peucker) and re-emitted as Catmull-Rom cubics.
//
// Usage: node scripts/smooth-stickers.mjs
// Rewrites packages/trazo/catalog.json and patches the matching path strings in
// packages/trazo/src/catalog/*.ts in place (formatting untouched).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = path.join(rootDir, "packages/trazo/catalog.json");
const catalogDir = path.join(rootDir, "packages/trazo/src/catalog");

// Ocean and school stickers are already curve-based; these ids are left exactly as-is.
const SKIP_CATEGORIES = new Set(["ocean", "school"]);
const SKIP_IDS = new Set(["spider-man", "stitch", "woody-wink", "little-green-alien"]);

const CORNER_DEG = 62; // turning angle above which a point is pinned as a corner
const CORNER_WINDOW = 5; // arc length (viewBox units) used to measure turning
const SIL_CORNER_DEG = 80;
const SIL_CORNER_WINDOW = 9;

function parsePolyPath(d) {
  const tokens = d.match(/[MmLlZz]|-?\d*\.?\d+(?:e-?\d+)?/g);
  const subpaths = [];
  let cur = null;
  let cmd = null;
  let x = 0;
  let y = 0;
  for (let i = 0; i < tokens.length; ) {
    const t = tokens[i];
    if (/[A-Za-z]/.test(t)) {
      cmd = t;
      i++;
      if (cmd === "Z" || cmd === "z") {
        if (cur) subpaths.push(cur);
        cur = null;
      }
      continue;
    }
    const nx = parseFloat(tokens[i]);
    const ny = parseFloat(tokens[i + 1]);
    i += 2;
    if (cmd === "M" || cmd === "m") {
      if (cur) subpaths.push(cur);
      x = cmd === "m" ? x + nx : nx;
      y = cmd === "m" ? y + ny : ny;
      cur = [[x, y]];
      cmd = cmd === "m" ? "l" : "L";
    } else if (cmd === "l") {
      x += nx;
      y += ny;
      cur.push([x, y]);
    } else if (cmd === "L") {
      x = nx;
      y = ny;
      cur.push([x, y]);
    } else {
      throw new Error(`Unsupported command ${cmd}`);
    }
  }
  if (cur) subpaths.push(cur);
  return subpaths;
}

function dedupe(pts) {
  const out = [];
  for (const p of pts) {
    const q = out[out.length - 1];
    if (!q || Math.hypot(p[0] - q[0], p[1] - q[1]) > 1e-6) out.push(p);
  }
  while (out.length > 1) {
    const a = out[0];
    const b = out[out.length - 1];
    if (Math.hypot(a[0] - b[0], a[1] - b[1]) > 1e-6) break;
    out.pop();
  }
  return out;
}

function perimeter(pts) {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    s += Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  return s;
}

function area(pts) {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    s += a[0] * b[1] - b[0] * a[1];
  }
  return Math.abs(s) / 2;
}

// Resample to roughly even spacing so smoothing acts uniformly along the edge.
function resample(pts, step) {
  const n = pts.length;
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const k = Math.max(1, Math.round(len / step));
    for (let j = 0; j < k; j++) {
      out.push([a[0] + ((b[0] - a[0]) * j) / k, a[1] + ((b[1] - a[1]) * j) / k, i === 0 && j === 0]);
    }
  }
  return out;
}

function pointAtArc(pts, cum, total, s) {
  s = ((s % total) + total) % total;
  let lo = 0;
  let hi = cum.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (cum[mid] <= s) lo = mid;
    else hi = mid - 1;
  }
  const a = pts[lo];
  const b = pts[(lo + 1) % pts.length];
  const seg = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const t = (s - cum[lo]) / seg;
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

function findCorners(pts, window, threshold = CORNER_DEG) {
  const n = pts.length;
  const cum = [0];
  for (let i = 1; i < n; i++) {
    cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  }
  const total = cum[n - 1] + Math.hypot(pts[0][0] - pts[n - 1][0], pts[0][1] - pts[n - 1][1]);
  const turn = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const a = pointAtArc(pts, cum, total, cum[i] - window);
    const b = pointAtArc(pts, cum, total, cum[i] + window);
    const v1 = [p[0] - a[0], p[1] - a[1]];
    const v2 = [b[0] - p[0], b[1] - p[1]];
    const l1 = Math.hypot(...v1);
    const l2 = Math.hypot(...v2);
    if (l1 < 1e-6 || l2 < 1e-6) continue;
    const cos = (v1[0] * v2[0] + v1[1] * v2[1]) / (l1 * l2);
    turn[i] = (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
  }
  // keep local maxima above threshold, at least `window` apart
  const pinned = new Array(n).fill(false);
  const order = [...turn.keys()].filter((i) => turn[i] >= threshold).sort((i, j) => turn[j] - turn[i]);
  const chosen = [];
  for (const i of order) {
    if (chosen.some((j) => {
      const d = Math.abs(cum[i] - cum[j]);
      return Math.min(d, total - d) < window * 1.5;
    })) continue;
    chosen.push(i);
    pinned[i] = true;
  }
  return pinned;
}

function taubin(pts, pinned, iterations) {
  const n = pts.length;
  let cur = pts.map((p) => [p[0], p[1]]);
  const pass = (f) => {
    const next = cur.map((p, i) => {
      if (pinned[i]) return p;
      const a = cur[(i - 1 + n) % n];
      const b = cur[(i + 1) % n];
      return [p[0] + f * ((a[0] + b[0]) / 2 - p[0]), p[1] + f * ((a[1] + b[1]) / 2 - p[1])];
    });
    cur = next;
  };
  for (let k = 0; k < iterations; k++) {
    pass(0.6);
    pass(-0.62);
  }
  return cur;
}

function dpOpen(pts, tol, keep) {
  if (pts.length < 3) return pts;
  const [a, b] = [pts[0], pts[pts.length - 1]];
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy);
  let maxD = -1;
  let idx = -1;
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i];
    const d = len < 1e-9
      ? Math.hypot(p[0] - a[0], p[1] - a[1])
      : Math.abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / len;
    const forced = keep[i];
    if (forced) {
      idx = i;
      maxD = Infinity;
      break;
    }
    if (d > maxD) {
      maxD = d;
      idx = i;
    }
  }
  if (maxD > tol) {
    const left = dpOpen(pts.slice(0, idx + 1), tol, keep.slice(0, idx + 1));
    const right = dpOpen(pts.slice(idx), tol, keep.slice(idx));
    return [...left.slice(0, -1), ...right];
  }
  return [a, b];
}

function simplifyClosed(pts, pinned, tol) {
  // rotate so we start at a pinned point (or the farthest point from index 0)
  let start = pinned.indexOf(true);
  if (start < 0) {
    let best = 0;
    pts.forEach((p, i) => {
      const d = Math.hypot(p[0] - pts[0][0], p[1] - pts[0][1]);
      if (d > best) {
        best = d;
        start = i;
      }
    });
    start = Math.max(start, 0);
  }
  const rot = [...pts.slice(start), ...pts.slice(0, start), pts[start]];
  const keep = [...pinned.slice(start), ...pinned.slice(0, start), true];
  const tagged = rot.map((p, i) => [p[0], p[1], keep[i]]);
  const simp = dpOpen(tagged, tol, keep);
  simp.pop();
  return simp;
}

const fmt = (v) => {
  const s = (Math.round(v * 10) / 10).toFixed(1);
  return (s.endsWith(".0") ? s.slice(0, -2) : s).replace(/^-0$/, "0");
};

function toCubicPath(pts) {
  const n = pts.length;
  if (n < 3) return `M${fmt(pts[0][0])} ${fmt(pts[0][1])}` + pts.slice(1).map((p) => `L${fmt(p[0])} ${fmt(p[1])}`).join("") + "Z";
  let d = `M${fmt(pts[0][0])} ${fmt(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const t = 1 / 6;
    const c1 = p1[2] ? [p1[0], p1[1]] : [p1[0] + (p2[0] - p0[0]) * t, p1[1] + (p2[1] - p0[1]) * t];
    const c2 = p2[2] ? [p2[0], p2[1]] : [p2[0] - (p3[0] - p1[0]) * t, p2[1] - (p3[1] - p1[1]) * t];
    d += `C${fmt(c1[0])} ${fmt(c1[1])} ${fmt(c2[0])} ${fmt(c2[1])} ${fmt(p2[0])} ${fmt(p2[1])}`;
  }
  return d + "Z";
}

function iterationsFor(size, strong) {
  if (strong) return size < 3 ? 3 : size < 8 ? 12 : size < 20 ? 40 : 140;
  return size < 3 ? 2 : size < 8 ? 6 : size < 20 ? 14 : 30;
}

function emit(points, corners, size) {
  const tagged = points.map((p, i) => [p[0], p[1], corners[i]]);
  const tol = size < 6 ? 0.12 : 0.22;
  const simp = simplifyClosed(tagged, corners, tol);
  if (simp.length < 3) return null;
  return toCubicPath(simp);
}

function prepRing(raw, strong = false) {
  const pts = dedupe(raw);
  if (pts.length < 3) return null;
  const per = perimeter(pts);
  const size = Math.sqrt(area(pts));
  // Coarser sampling on large outer edges widens the filter, ironing out the
  // low-frequency crayon wobble so the die-cut reads as one smooth curve.
  const step = per < 30 ? 0.5 : strong && size >= 20 ? 1.7 : 1;
  const sampled = resample(pts, step).map((p) => [p[0], p[1]]);
  // The outer die-cut edge only keeps genuinely sharp tips (star points, arrow heads).
  const corners = strong
    ? findCorners(sampled, Math.min(SIL_CORNER_WINDOW, per / 8), SIL_CORNER_DEG)
    : findCorners(sampled, Math.min(CORNER_WINDOW, per / 8));
  return { sampled, corners, size };
}

// Grid index of silhouette samples -> displacement onto the smoothed silhouette.
const SNAP_FULL = 1.6; // within this distance a vertex lands exactly on the new edge
const SNAP_FADE = 3.2; // displacement fades out to zero by this distance
function buildSilhouette(d) {
  const rings = [];
  const grid = new Map();
  const cell = SNAP_FADE;
  const key = (x, y) => `${Math.floor(x / cell)},${Math.floor(y / cell)}`;
  for (const raw of parsePolyPath(d)) {
    const r = prepRing(raw, true);
    if (!r) continue;
    const smooth = taubin(r.sampled, r.corners, iterationsFor(r.size, true));
    rings.push({ smooth, corners: r.corners, size: r.size });
    r.sampled.forEach((p, i) => {
      const k = key(p[0], p[1]);
      if (!grid.has(k)) grid.set(k, []);
      grid.get(k).push([p[0], p[1], smooth[i][0] - p[0], smooth[i][1] - p[1]]);
    });
  }
  const nearest = (x, y) => {
    const cx = Math.floor(x / cell);
    const cy = Math.floor(y / cell);
    let best = null;
    let bd = Infinity;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        for (const s of grid.get(`${cx + i},${cy + j}`) || []) {
          const dd = Math.hypot(s[0] - x, s[1] - y);
          if (dd < bd) {
            bd = dd;
            best = s;
          }
        }
      }
    }
    return best ? { s: best, dist: bd } : null;
  };
  return { rings, nearest };
}

function smoothLayerRing(raw, sil) {
  const r = prepRing(raw);
  if (!r) return null;
  const pinned = r.corners.slice();
  const moved = r.sampled.map((p, i) => {
    const hit = sil && sil.nearest(p[0], p[1]);
    if (!hit || hit.dist >= SNAP_FADE) return p;
    const [, , dx, dy] = hit.s;
    if (hit.dist <= SNAP_FULL) {
      pinned[i] = true; // shared die-cut edge: keep it exactly on the silhouette
      return [hit.s[0] + dx, hit.s[1] + dy];
    }
    const w = (SNAP_FADE - hit.dist) / (SNAP_FADE - SNAP_FULL);
    return [p[0] + dx * w, p[1] + dy * w];
  });
  const smooth = taubin(moved, pinned, iterationsFor(r.size, false));
  return emit(smooth, r.corners, r.size);
}

function smoothSticker(item) {
  const sil = buildSilhouette(item.d);
  item.d = sil.rings
    .map((r) => emit(r.smooth, r.corners, r.size))
    .filter(Boolean)
    .join("");
  for (const layer of item.layers || []) {
    layer.d = parsePolyPath(layer.d)
      .map((raw) => smoothLayerRing(raw, sil))
      .filter(Boolean)
      .join("");
  }
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
const replacements = new Map();
let touched = 0;
for (const item of catalog) {
  if (SKIP_CATEGORIES.has(item.category) || SKIP_IDS.has(item.id)) continue;
  const oldD = item.d.trim();
  const oldLayers = (item.layers || []).map((l) => l.d.trim());
  smoothSticker(item);
  replacements.set(oldD, item.d);
  (item.layers || []).forEach((l, i) => replacements.set(oldLayers[i], l.d));
  touched++;
}
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + "\n", "utf8");

let patched = 0;
for (const file of fs.readdirSync(catalogDir)) {
  const p = path.join(catalogDir, file);
  let src = fs.readFileSync(p, "utf8");
  const before = src;
  for (const [from, to] of replacements) {
    const needle = JSON.stringify(from);
    if (src.includes(needle)) {
      src = src.split(needle).join(JSON.stringify(to));
      patched++;
    }
  }
  if (src !== before) fs.writeFileSync(p, src, "utf8");
}
console.log(`Smoothed ${touched} stickers; patched ${patched}/${replacements.size} path strings in src.`);
