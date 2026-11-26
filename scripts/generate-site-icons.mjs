import { mkdir, readFile, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const packageDist = new URL("./", import.meta.resolve("scribbles-icons"));
const output = new URL("public/ui-icons/", root);
const weights = JSON.parse(await readFile(new URL("config/site-icon-weights.json", root), "utf8"));

const CORE_HOME_ICONS = new Set([
  "ArrowUpRight",
  "Check",
  "Copy",
  "Languages",
  "LayoutGrid",
  "X",
]);

// Tolerance in 256x256 viewBox units (~0.09px at 18px rendered icon size).
// Preserves the hand-drawn crayon wobble & rounded caps while eliminating
// redundant ~1.5-unit Bezier oversampling.
const SIMPLIFY_EPSILON = 1.25;

function parsePathSubpaths(d) {
  const tokens = d.match(/[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?/g);
  if (!tokens) return [];

  const subpaths = [];
  let current = [];
  let i = 0;
  let cmd = "";
  let cx = 0;
  let cy = 0;
  let sx = 0;
  let sy = 0;

  const nextNum = () => Number(tokens[i++]);
  const isCmd = (tok) => /^[a-zA-Z]$/.test(tok);

  while (i < tokens.length) {
    if (isCmd(tokens[i])) {
      cmd = tokens[i++];
    }

    if (cmd === "M" || cmd === "m") {
      if (current.length > 0) {
        subpaths.push({ points: current, closed: false });
        current = [];
      }
      const x = nextNum() + (cmd === "m" ? cx : 0);
      const y = nextNum() + (cmd === "m" ? cy : 0);
      cx = sx = x;
      cy = sy = y;
      current.push([cx, cy]);
      cmd = cmd === "m" ? "l" : "L";
    } else if (cmd === "L" || cmd === "l") {
      const x = nextNum() + (cmd === "l" ? cx : 0);
      const y = nextNum() + (cmd === "l" ? cy : 0);
      cx = x;
      cy = y;
      current.push([cx, cy]);
    } else if (cmd === "H" || cmd === "h") {
      cx = nextNum() + (cmd === "h" ? cx : 0);
      current.push([cx, cy]);
    } else if (cmd === "V" || cmd === "v") {
      cy = nextNum() + (cmd === "v" ? cy : 0);
      current.push([cx, cy]);
    } else if (cmd === "C" || cmd === "c") {
      const rel = cmd === "c";
      const x1 = nextNum() + (rel ? cx : 0);
      const y1 = nextNum() + (rel ? cy : 0);
      const x2 = nextNum() + (rel ? cx : 0);
      const y2 = nextNum() + (rel ? cy : 0);
      const x = nextNum() + (rel ? cx : 0);
      const y = nextNum() + (rel ? cy : 0);
      // Sample midpoint for longer/curved segments so arcs remain faithful.
      const chord = Math.hypot(x - cx, y - cy);
      if (chord > 6) {
        const mx = 0.125 * cx + 0.375 * x1 + 0.375 * x2 + 0.125 * x;
        const my = 0.125 * cy + 0.375 * y1 + 0.375 * y2 + 0.125 * y;
        current.push([mx, my]);
      }
      cx = x;
      cy = y;
      current.push([cx, cy]);
    } else if (cmd === "Q" || cmd === "q") {
      const rel = cmd === "q";
      const x1 = nextNum() + (rel ? cx : 0);
      const y1 = nextNum() + (rel ? cy : 0);
      const x = nextNum() + (rel ? cx : 0);
      const y = nextNum() + (rel ? cy : 0);
      const chord = Math.hypot(x - cx, y - cy);
      if (chord > 6) {
        current.push([0.25 * cx + 0.5 * x1 + 0.25 * x, 0.25 * cy + 0.5 * y1 + 0.25 * y]);
      }
      cx = x;
      cy = y;
      current.push([cx, cy]);
    } else if (cmd === "Z" || cmd === "z") {
      if (current.length > 0) {
        subpaths.push({ points: current, closed: true });
        current = [];
      }
      cx = sx;
      cy = sy;
      cmd = "";
    } else {
      throw new Error(`Unsupported SVG command "${cmd}"`);
    }
  }

  if (current.length > 0) {
    subpaths.push({ points: current, closed: false });
  }
  return subpaths;
}

function perpDistanceSq(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    const px = p[0] - a[0];
    const py = p[1] - a[1];
    return px * px + py * py;
  }
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / lenSq));
  const projX = a[0] + t * dx;
  const projY = a[1] + t * dy;
  const ex = p[0] - projX;
  const ey = p[1] - projY;
  return ex * ex + ey * ey;
}

function rdp(points, epsilonSq) {
  if (points.length <= 2) return points;
  let maxDistSq = -1;
  let splitIdx = 0;
  const start = points[0];
  const end = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const dSq = perpDistanceSq(points[i], start, end);
    if (dSq > maxDistSq) {
      maxDistSq = dSq;
      splitIdx = i;
    }
  }

  if (maxDistSq > epsilonSq) {
    const left = rdp(points.slice(0, splitIdx + 1), epsilonSq);
    const right = rdp(points.slice(splitIdx), epsilonSq);
    return left.slice(0, -1).concat(right);
  }
  return [start, end];
}

function simplifyClosedPolygon(points, epsilon) {
  const epsSq = epsilon * epsilon;
  if (points.length <= 4) return points;

  // Drop duplicate closing point if present
  const clean = points.slice();
  const first = clean[0];
  const last = clean[clean.length - 1];
  if (Math.hypot(first[0] - last[0], first[1] - last[1]) < 0.01) {
    clean.pop();
  }
  if (clean.length <= 3) return clean;

  // Split closed ring into two halves between index 0 and the farthest point
  let farIdx = 1;
  let maxDistSq = -1;
  for (let i = 1; i < clean.length; i++) {
    const dx = clean[i][0] - clean[0][0];
    const dy = clean[i][1] - clean[0][1];
    const dSq = dx * dx + dy * dy;
    if (dSq > maxDistSq) {
      maxDistSq = dSq;
      farIdx = i;
    }
  }

  const half1 = rdp(clean.slice(0, farIdx + 1), epsSq);
  const half2 = rdp([...clean.slice(farIdx), clean[0]], epsSq);
  return half1.slice(0, -1).concat(half2.slice(0, -1));
}

function dedupeAndSnap(points, closed) {
  const snapped = [];
  for (const [x, y] of points) {
    const rx = Math.round(x);
    const ry = Math.round(y);
    const prev = snapped[snapped.length - 1];
    if (!prev || prev[0] !== rx || prev[1] !== ry) {
      snapped.push([rx, ry]);
    }
  }
  if (closed && snapped.length > 1) {
    const first = snapped[0];
    const last = snapped[snapped.length - 1];
    if (first[0] === last[0] && first[1] === last[1]) {
      snapped.pop();
    }
  }
  // Remove strictly collinear intermediate vertices
  if (snapped.length >= 3) {
    const out = [];
    for (let i = 0; i < snapped.length; i++) {
      const prev = snapped[(i - 1 + snapped.length) % snapped.length];
      const curr = snapped[i];
      const next = snapped[(i + 1) % snapped.length];
      if (!closed && (i === 0 || i === snapped.length - 1)) {
        out.push(curr);
        continue;
      }
      const cross =
        (curr[0] - prev[0]) * (next[1] - curr[1]) -
        (curr[1] - prev[1]) * (next[0] - curr[0]);
      if (cross !== 0) {
        out.push(curr);
      }
    }
    if (out.length >= 3) return out;
  }
  return snapped;
}

function formatPair(dx, dy) {
  return dy < 0 ? `${dx}${dy}` : `${dx} ${dy}`;
}

function encodeSubpaths(subpaths) {
  let out = "";
  let curX = 0;
  let curY = 0;

  for (const { points, closed } of subpaths) {
    const simplified = closed
      ? simplifyClosedPolygon(points, SIMPLIFY_EPSILON)
      : rdp(points, SIMPLIFY_EPSILON * SIMPLIFY_EPSILON);
    const pts = dedupeAndSnap(simplified, closed);
    if (pts.length < 2) continue;

    const [x0, y0] = pts[0];
    if (out.length === 0) {
      out += `M${formatPair(x0, y0)}`;
    } else {
      out += `m${formatPair(x0 - curX, y0 - curY)}`;
    }
    curX = x0;
    curY = y0;

    let lastCmd = "";
    for (let i = 1; i < pts.length; i++) {
      const dx = pts[i][0] - curX;
      const dy = pts[i][1] - curY;
      if (dx === 0 && dy === 0) continue;
      curX = pts[i][0];
      curY = pts[i][1];

      if (dy === 0) {
        out += lastCmd === "h" ? (dx < 0 ? `${dx}` : ` ${dx}`) : `h${dx}`;
        lastCmd = "h";
      } else if (dx === 0) {
        out += lastCmd === "v" ? (dy < 0 ? `${dy}` : ` ${dy}`) : `v${dy}`;
        lastCmd = "v";
      } else {
        const pair = formatPair(dx, dy);
        out += lastCmd === "l" ? (dx < 0 ? pair : ` ${pair}`) : `l${pair}`;
        lastCmd = "l";
      }
    }

    if (closed) {
      out += "z";
      curX = x0;
      curY = y0;
    }
  }
  return out;
}

function optimizePath(rawPath) {
  return encodeSubpaths(parsePathSubpaths(rawPath));
}

await mkdir(output, { recursive: true });

const coreSpritePaths = [];
const overlaySpritePaths = [];
let rawTotal = 0;
let optTotal = 0;

for (const [name, weight] of Object.entries(weights)) {
  // scribbles-icons 1.0.1 ships all three paths in each component module.
  const source = await readFile(new URL(`icons/${name}.js`, packageDist), "utf8");
  const rawPath = source.match(new RegExp(`^\\s*"${weight}": "([Mm][a-zA-Z0-9., +\\-]+)",?$`, "m"))?.[1];
  if (!rawPath) throw new Error(`Missing ${name} (${weight}) in scribbles-icons`);

  const optimizedPath = optimizePath(rawPath);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path id="glyph" d="${optimizedPath}"/></svg>\n`;
  rawTotal += rawPath.length;
  optTotal += svg.length;

  await writeFile(new URL(`${name}.svg`, output), svg);

  const spriteEntry = `<path id="${name}" d="${optimizedPath}"/>`;
  if (CORE_HOME_ICONS.has(name)) {
    coreSpritePaths.push(spriteEntry);
  } else {
    overlaySpritePaths.push(spriteEntry);
  }
}

const coreSprite = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><defs>${coreSpritePaths.join("")}</defs></svg>\n`;
const overlaySprite = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><defs>${overlaySpritePaths.join("")}</defs></svg>\n`;

await writeFile(new URL("sprite.svg", output), coreSprite);
await writeFile(new URL("overlay-sprite.svg", output), overlaySprite);

const notices = await Promise.all(["LICENSE", "NOTICE"].map((file) =>
  readFile(new URL(`../${file}`, packageDist), "utf8"),
));
await writeFile(new URL("LICENSE.txt", output), notices.join("\n"));

console.log(
  `Optimized ${Object.keys(weights).length} icons: ${(rawTotal / 1024).toFixed(1)} KB -> ${(optTotal / 1024).toFixed(1)} KB ` +
    `(sprite.svg: ${(coreSprite.length / 1024).toFixed(1)} KB, overlay-sprite.svg: ${(overlaySprite.length / 1024).toFixed(1)} KB)`,
);
