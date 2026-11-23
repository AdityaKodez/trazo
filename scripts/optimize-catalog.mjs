import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const PATH_TOKEN_RE =
  /([AaCcHhLlMmQqSsTtVvZz])|(-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)/g;

const ARG_COUNTS = {
  M: 2,
  L: 2,
  H: 1,
  V: 1,
  C: 6,
  S: 4,
  Q: 4,
  T: 2,
  A: 7,
  Z: 0,
};

/**
 * Parses standard SVG path data into absolute M/L/C/Q/Z commands.
 * Returns null if an unsupported command (e.g. arc A/a) is encountered so
 * callers can preserve the original path untouched.
 */
function parseSvgPath(d) {
  const tokens = [];
  let match;
  PATH_TOKEN_RE.lastIndex = 0;
  while ((match = PATH_TOKEN_RE.exec(d)) !== null) {
    if (match[1]) {
      tokens.push({ type: "cmd", v: match[1] });
    } else {
      tokens.push({ type: "num", v: parseFloat(match[2]) });
    }
  }

  const cmds = [];
  let i = 0;
  let curCmd = null;
  let cx = 0;
  let cy = 0;
  let sx = 0;
  let sy = 0;
  let lastC2x = 0;
  let lastC2y = 0;
  let lastQx = 0;
  let lastQy = 0;
  let lastCmd = "";

  while (i < tokens.length) {
    if (tokens[i].type === "cmd") {
      curCmd = tokens[i++].v;
      if (curCmd === "Z" || curCmd === "z") {
        cmds.push({ cmd: "Z" });
        cx = sx;
        cy = sy;
        lastCmd = "Z";
        continue;
      }
    }
    if (!curCmd) return null;
    const upper = curCmd.toUpperCase();
    const isRel = curCmd !== upper;
    const n = ARG_COUNTS[upper];
    if (n === undefined || upper === "A") return null;
    if (i + n > tokens.length) return null;

    const raw = [];
    for (let k = 0; k < n; k++) {
      if (tokens[i].type !== "num") return null;
      raw.push(tokens[i++].v);
    }

    if (upper === "M") {
      cx = sx = isRel ? cx + raw[0] : raw[0];
      cy = sy = isRel ? cy + raw[1] : raw[1];
      cmds.push({ cmd: "M", x: cx, y: cy });
      lastCmd = "M";
      curCmd = isRel ? "l" : "L";
    } else if (upper === "L") {
      cx = isRel ? cx + raw[0] : raw[0];
      cy = isRel ? cy + raw[1] : raw[1];
      cmds.push({ cmd: "L", x: cx, y: cy });
      lastCmd = "L";
    } else if (upper === "H") {
      cx = isRel ? cx + raw[0] : raw[0];
      cmds.push({ cmd: "L", x: cx, y: cy });
      lastCmd = "L";
    } else if (upper === "V") {
      cy = isRel ? cy + raw[0] : raw[0];
      cmds.push({ cmd: "L", x: cx, y: cy });
      lastCmd = "L";
    } else if (upper === "C") {
      const x1 = isRel ? cx + raw[0] : raw[0];
      const y1 = isRel ? cy + raw[1] : raw[1];
      const x2 = isRel ? cx + raw[2] : raw[2];
      const y2 = isRel ? cy + raw[3] : raw[3];
      cx = isRel ? cx + raw[4] : raw[4];
      cy = isRel ? cy + raw[5] : raw[5];
      cmds.push({ cmd: "C", x1, y1, x2, y2, x: cx, y: cy });
      lastC2x = x2;
      lastC2y = y2;
      lastCmd = "C";
    } else if (upper === "S") {
      const x1 = lastCmd === "C" || lastCmd === "S" ? 2 * cx - lastC2x : cx;
      const y1 = lastCmd === "C" || lastCmd === "S" ? 2 * cy - lastC2y : cy;
      const x2 = isRel ? cx + raw[0] : raw[0];
      const y2 = isRel ? cy + raw[1] : raw[1];
      cx = isRel ? cx + raw[2] : raw[2];
      cy = isRel ? cy + raw[3] : raw[3];
      cmds.push({ cmd: "C", x1, y1, x2, y2, x: cx, y: cy });
      lastC2x = x2;
      lastC2y = y2;
      lastCmd = "S";
    } else if (upper === "Q") {
      const x1 = isRel ? cx + raw[0] : raw[0];
      const y1 = isRel ? cy + raw[1] : raw[1];
      cx = isRel ? cx + raw[2] : raw[2];
      cy = isRel ? cy + raw[3] : raw[3];
      cmds.push({ cmd: "Q", x1, y1, x: cx, y: cy });
      lastQx = x1;
      lastQy = y1;
      lastCmd = "Q";
    } else if (upper === "T") {
      const x1 = lastCmd === "Q" || lastCmd === "T" ? 2 * cx - lastQx : cx;
      const y1 = lastCmd === "Q" || lastCmd === "T" ? 2 * cy - lastQy : cy;
      cx = isRel ? cx + raw[0] : raw[0];
      cy = isRel ? cy + raw[1] : raw[1];
      cmds.push({ cmd: "Q", x1, y1, x: cx, y: cy });
      lastQx = x1;
      lastQy = y1;
      lastCmd = "T";
    }
  }

  return cmds;
}

function ptToSegmentDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function fmtScaled(val, scale) {
  if (val === 0) return "0";
  if (scale === 1) return String(val);
  const sign = val < 0 ? "-" : "";
  const abs = Math.abs(val);
  const whole = Math.floor(abs / scale);
  const frac = abs % scale;
  if (frac === 0) return `${sign}${whole}`;
  if (whole === 0) return `${sign}.${frac}`;
  return `${sign}${whole}.${frac}`;
}

function needsSeparator(prev, cur) {
  if (cur.startsWith("-")) return false;
  if (cur.startsWith(".") && prev.includes(".")) return false;
  return true;
}

function joinArgs(args) {
  let out = "";
  for (let i = 0; i < args.length; i++) {
    if (i > 0 && needsSeparator(args[i - 1], args[i])) {
      out += " ";
    }
    out += args[i];
  }
  return out;
}

function encodeOnce(d, { scale = 1, flatTol = 0.55, sTol = 1 } = {}) {
  const cmds = parseSvgPath(d);
  if (!cmds) return d;

  const toGrid = (v) => Math.round(v * scale);
  const scaledFlatTol = flatTol * scale;

  // First pass: resolve grid-snapped commands, flat-curve-to-line reduction,
  // smooth-handle snaps, and degenerate segment pruning.
  const subpaths = [];
  let curSub = null;
  let cx = 0;
  let cy = 0;
  let sx = 0;
  let sy = 0;
  let lastC2x = 0;
  let lastC2y = 0;
  let lastQx = 0;
  let lastQy = 0;
  let lastType = "";

  const pushLine = (rx, ry) => {
    if (!curSub || (rx === cx && ry === cy)) return;
    // Merge collinear consecutive lines (same horizontal/vertical or near-collinear)
    const prev = curSub[curSub.length - 1];
    if (prev && prev.cmd === "L" && curSub.length >= 2) {
      const anchor = curSub[curSub.length - 2];
      const ax = anchor.x;
      const ay = anchor.y;
      if (ax !== undefined && ay !== undefined) {
        const dot = (prev.x - ax) * (rx - prev.x) + (prev.y - ay) * (ry - prev.y);
        if (dot >= 0 && ptToSegmentDist(prev.x, prev.y, ax, ay, rx, ry) <= 0.2 * scale) {
          prev.x = rx;
          prev.y = ry;
          cx = rx;
          cy = ry;
          lastType = "L";
          return;
        }
      }
    }
    curSub.push({ cmd: "L", x: rx, y: ry });
    cx = rx;
    cy = ry;
    lastType = "L";
  };

  for (const c of cmds) {
    if (c.cmd === "M") {
      const rx = toGrid(c.x);
      const ry = toGrid(c.y);
      curSub = [{ cmd: "M", x: rx, y: ry }];
      subpaths.push(curSub);
      cx = sx = rx;
      cy = sy = ry;
      lastType = "M";
    } else if (!curSub) {
      continue;
    } else if (c.cmd === "Z") {
      // Drop redundant straight closing segment immediately preceding Z
      while (
        curSub.length > 1 &&
        curSub[curSub.length - 1].cmd === "L" &&
        curSub[curSub.length - 1].x === sx &&
        curSub[curSub.length - 1].y === sy
      ) {
        curSub.pop();
      }
      curSub.push({ cmd: "Z" });
      cx = sx;
      cy = sy;
      lastType = "Z";
    } else if (c.cmd === "L") {
      pushLine(toGrid(c.x), toGrid(c.y));
    } else if (c.cmd === "C") {
      let x1 = toGrid(c.x1);
      let y1 = toGrid(c.y1);
      const x2 = toGrid(c.x2);
      const y2 = toGrid(c.y2);
      const x = toGrid(c.x);
      const y = toGrid(c.y);

      const d1 = ptToSegmentDist(x1, y1, cx, cy, x, y);
      const d2 = ptToSegmentDist(x2, y2, cx, cy, x, y);
      if (d1 <= scaledFlatTol && d2 <= scaledFlatTol) {
        pushLine(x, y);
        continue;
      }

      const refX = lastType === "C" || lastType === "S" ? 2 * cx - lastC2x : cx;
      const refY = lastType === "C" || lastType === "S" ? 2 * cy - lastC2y : cy;
      const isSmooth =
        Math.abs(x1 - refX) <= sTol && Math.abs(y1 - refY) <= sTol;

      if (isSmooth) {
        x1 = refX;
        y1 = refY;
      }

      if (x1 === cx && y1 === cy && x2 === x && y2 === y) {
        pushLine(x, y);
        continue;
      }

      if (isSmooth) {
        curSub.push({ cmd: "S", x2, y2, x, y });
        lastC2x = x2;
        lastC2y = y2;
        cx = x;
        cy = y;
        lastType = "S";
      } else {
        curSub.push({ cmd: "C", x1, y1, x2, y2, x, y });
        lastC2x = x2;
        lastC2y = y2;
        cx = x;
        cy = y;
        lastType = "C";
      }
    } else if (c.cmd === "Q") {
      const x1 = toGrid(c.x1);
      const y1 = toGrid(c.y1);
      const x = toGrid(c.x);
      const y = toGrid(c.y);

      if (ptToSegmentDist(x1, y1, cx, cy, x, y) <= scaledFlatTol) {
        pushLine(x, y);
        continue;
      }

      const refX = lastType === "Q" || lastType === "T" ? 2 * cx - lastQx : cx;
      const refY = lastType === "Q" || lastType === "T" ? 2 * cy - lastQy : cy;
      if (Math.abs(x1 - refX) <= sTol && Math.abs(y1 - refY) <= sTol) {
        curSub.push({ cmd: "T", x, y });
        lastQx = refX;
        lastQy = refY;
        cx = x;
        cy = y;
        lastType = "T";
      } else {
        curSub.push({ cmd: "Q", x1, y1, x, y });
        lastQx = x1;
        lastQy = y1;
        cx = x;
        cy = y;
        lastType = "Q";
      }
    }
  }

  // Drop empty / zero-area subpaths that collapsed after grid snapping
  const normalized = [];
  for (const sub of subpaths) {
    let hasCurve = false;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    let segs = 0;
    for (const c of sub) {
      if (c.cmd === "C" || c.cmd === "S" || c.cmd === "Q" || c.cmd === "T") {
        hasCurve = true;
      }
      if (c.cmd !== "Z") {
        if (c.cmd !== "M") segs++;
        if (c.x < minX) minX = c.x;
        if (c.x > maxX) maxX = c.x;
        if (c.y < minY) minY = c.y;
        if (c.y > maxY) maxY = c.y;
      }
    }
    if (segs === 0) continue;
    if (!hasCurve && (maxX === minX || maxY === minY)) continue;
    for (const c of sub) normalized.push(c);
  }

  if (normalized.length === 0) return d;

  // Second pass: serialize with shortest relative commands & implicit chaining.
  let out = "";
  cx = 0;
  cy = 0;
  sx = 0;
  sy = 0;
  let prevEmittedCmd = "";
  let prevLastArg = "";

  const fmt = (v) => fmtScaled(v, scale);

  function emit(cmd, argsT) {
    if (cmd === "z") {
      out += "z";
      prevEmittedCmd = "z";
      prevLastArg = "";
      return;
    }
    const strArgs = argsT.map(fmt);
    const canOmitCmd = prevEmittedCmd === cmd && cmd !== "M" && cmd !== "m";
    if (canOmitCmd) {
      out +=
        (needsSeparator(prevLastArg, strArgs[0]) ? " " : "") +
        joinArgs(strArgs);
    } else {
      out += cmd + joinArgs(strArgs);
    }
    prevEmittedCmd = cmd;
    prevLastArg = strArgs[strArgs.length - 1];
  }

  for (let idx = 0; idx < normalized.length; idx++) {
    const c = normalized[idx];
    if (c.cmd === "M") {
      if (idx === 0) {
        emit("M", [c.x, c.y]);
      } else {
        const dx = c.x - cx;
        const dy = c.y - cy;
        const absStr = "M" + joinArgs([fmt(c.x), fmt(c.y)]);
        const relStr = "m" + joinArgs([fmt(dx), fmt(dy)]);
        if (relStr.length < absStr.length) emit("m", [dx, dy]);
        else emit("M", [c.x, c.y]);
      }
      cx = sx = c.x;
      cy = sy = c.y;
    } else if (c.cmd === "Z") {
      emit("z", []);
      cx = sx;
      cy = sy;
    } else if (c.cmd === "L") {
      const dx = c.x - cx;
      const dy = c.y - cy;
      if (dy === 0) emit("h", [dx]);
      else if (dx === 0) emit("v", [dy]);
      else emit("l", [dx, dy]);
      cx = c.x;
      cy = c.y;
    } else if (c.cmd === "S") {
      emit("s", [c.x2 - cx, c.y2 - cy, c.x - cx, c.y - cy]);
      cx = c.x;
      cy = c.y;
    } else if (c.cmd === "C") {
      emit("c", [
        c.x1 - cx,
        c.y1 - cy,
        c.x2 - cx,
        c.y2 - cy,
        c.x - cx,
        c.y - cy,
      ]);
      cx = c.x;
      cy = c.y;
    } else if (c.cmd === "Q") {
      emit("q", [c.x1 - cx, c.y1 - cy, c.x - cx, c.y - cy]);
      cx = c.x;
      cy = c.y;
    } else if (c.cmd === "T") {
      emit("t", [c.x - cx, c.y - cy]);
      cx = c.x;
      cy = c.y;
    }
  }

  return out;
}

/**
 * Minifies an SVG path string using integer coordinates on 256px viewBoxes
 * (0.19px max delta at 100px render), flat-curve-to-line conversion, collinear
 * line merging, Catmull-Rom smooth cubic `s`, relative commands, and compact
 * SVG grammar separators. Runs to fixed point for strict idempotency.
 */
export function optimizeSvgPath(d, viewBox = "0 0 256 256") {
  const vbParts = String(viewBox).trim().split(/[\s,]+/).map(Number);
  const vbSize = vbParts.length === 4 ? Math.max(vbParts[2], vbParts[3]) : 256;
  const opts =
    vbSize >= 128
      ? { scale: 1, flatTol: 0.55, sTol: 1 }
      : { scale: 10, flatTol: 0.15, sTol: 1 };

  let prev = d.trim();
  for (let pass = 0; pass < 3; pass++) {
    const next = encodeOnce(prev, opts);
    if (next === prev) return next;
    prev = next;
  }
  return prev;
}

// --- Safe consecutive same-fill layer merging (fill-rule="evenodd" safe) ---

function analyzeLayerGeometry(d) {
  const cmds = parseSvgPath(d);
  if (!cmds) return null;

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  const expandBbox = (x, y) => {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  };

  const polys = [];
  let curPoly = null;
  let cx = 0;
  let cy = 0;
  let sx = 0;
  let sy = 0;

  for (const c of cmds) {
    if (c.cmd === "M") {
      if (curPoly && curPoly.length > 0) polys.push(curPoly);
      curPoly = [[c.x, c.y]];
      expandBbox(c.x, c.y);
      cx = sx = c.x;
      cy = sy = c.y;
    } else if (c.cmd === "Z") {
      if (curPoly && curPoly.length > 0) polys.push(curPoly);
      curPoly = null;
      cx = sx;
      cy = sy;
    } else if (c.cmd === "L") {
      expandBbox(c.x, c.y);
      curPoly?.push([c.x, c.y]);
      cx = c.x;
      cy = c.y;
    } else if (c.cmd === "C") {
      // Convex hull property: curve lies inside bbox of all 4 control points.
      expandBbox(c.x1, c.y1);
      expandBbox(c.x2, c.y2);
      expandBbox(c.x, c.y);
      const steps = 8;
      for (let k = 1; k <= steps; k++) {
        const t = k / steps;
        const mt = 1 - t;
        const px =
          mt * mt * mt * cx +
          3 * mt * mt * t * c.x1 +
          3 * mt * t * t * c.x2 +
          t * t * t * c.x;
        const py =
          mt * mt * mt * cy +
          3 * mt * mt * t * c.y1 +
          3 * mt * t * t * c.y2 +
          t * t * t * c.y;
        curPoly?.push([px, py]);
      }
      cx = c.x;
      cy = c.y;
    } else if (c.cmd === "Q") {
      expandBbox(c.x1, c.y1);
      expandBbox(c.x, c.y);
      const steps = 6;
      for (let k = 1; k <= steps; k++) {
        const t = k / steps;
        const mt = 1 - t;
        const px = mt * mt * cx + 2 * mt * t * c.x1 + t * t * c.x;
        const py = mt * mt * cy + 2 * mt * t * c.y1 + t * t * c.y;
        curPoly?.push([px, py]);
      }
      cx = c.x;
      cy = c.y;
    }
  }
  if (curPoly && curPoly.length > 0) polys.push(curPoly);

  return { bbox: [minX, minY, maxX, maxY], polys };
}

function pointInPolysEvenOdd(x, y, polys) {
  let inside = false;
  for (const poly of polys) {
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0];
      const yi = poly[i][1];
      const xj = poly[j][0];
      const yj = poly[j][1];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
        inside = !inside;
      }
    }
  }
  return inside;
}

function segmentsIntersect(a, b, c, d) {
  const cross = (p, q, r) =>
    (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  const onSeg = (p, q, r) =>
    Math.min(p[0], q[0]) - 1e-6 <= r[0] &&
    r[0] <= Math.max(p[0], q[0]) + 1e-6 &&
    Math.min(p[1], q[1]) - 1e-6 <= r[1] &&
    r[1] <= Math.max(p[1], q[1]) + 1e-6;

  const d1 = cross(c, d, a);
  const d2 = cross(c, d, b);
  const d3 = cross(a, b, c);
  const d4 = cross(a, b, d);

  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }
  if (Math.abs(d1) < 1e-6 && onSeg(c, d, a)) return true;
  if (Math.abs(d2) < 1e-6 && onSeg(c, d, b)) return true;
  if (Math.abs(d3) < 1e-6 && onSeg(a, b, c)) return true;
  if (Math.abs(d4) < 1e-6 && onSeg(a, b, d)) return true;
  return false;
}

function geometriesMayOverlap(gA, gB, pad = 0.5) {
  if (!gA || !gB) return true;
  const ix0 = Math.max(gA.bbox[0] - pad, gB.bbox[0] - pad);
  const iy0 = Math.max(gA.bbox[1] - pad, gB.bbox[1] - pad);
  const ix1 = Math.min(gA.bbox[2] + pad, gB.bbox[2] + pad);
  const iy1 = Math.min(gA.bbox[3] + pad, gB.bbox[3] + pad);
  if (ix1 < ix0 || iy1 < iy0) return false;

  // Check vertex containment both ways
  for (const poly of gA.polys) {
    for (const [x, y] of poly) {
      if (x >= gB.bbox[0] - pad && x <= gB.bbox[2] + pad && y >= gB.bbox[1] - pad && y <= gB.bbox[3] + pad) {
        if (pointInPolysEvenOdd(x, y, gB.polys)) return true;
      }
    }
  }
  for (const poly of gB.polys) {
    for (const [x, y] of poly) {
      if (x >= gA.bbox[0] - pad && x <= gA.bbox[2] + pad && y >= gA.bbox[1] - pad && y <= gA.bbox[3] + pad) {
        if (pointInPolysEvenOdd(x, y, gA.polys)) return true;
      }
    }
  }

  // Check edge-edge intersections inside overlapping region
  for (const pA of gA.polys) {
    for (let i = 0; i < pA.length; i++) {
      const a1 = pA[i];
      const a2 = pA[(i + 1) % pA.length];
      if (
        Math.max(a1[0], a2[0]) < ix0 ||
        Math.min(a1[0], a2[0]) > ix1 ||
        Math.max(a1[1], a2[1]) < iy0 ||
        Math.min(a1[1], a2[1]) > iy1
      ) {
        continue;
      }
      for (const pB of gB.polys) {
        for (let j = 0; j < pB.length; j++) {
          const b1 = pB[j];
          const b2 = pB[(j + 1) % pB.length];
          if (
            Math.max(b1[0], b2[0]) < Math.min(a1[0], a2[0]) - pad ||
            Math.min(b1[0], b2[0]) > Math.max(a1[0], a2[0]) + pad ||
            Math.max(b1[1], b2[1]) < Math.min(a1[1], a2[1]) - pad ||
            Math.min(b1[1], b2[1]) > Math.max(a1[1], a2[1]) + pad
          ) {
            continue;
          }
          if (segmentsIntersect(a1, a2, b1, b2)) return true;
        }
      }
    }
  }

  // Dense grid check across intersection bbox
  const step = Math.max(0.25, Math.min(0.5, (ix1 - ix0) / 10, (iy1 - iy0) / 10));
  for (let x = ix0; x <= ix1; x += step) {
    for (let y = iy0; y <= iy1; y += step) {
      if (pointInPolysEvenOdd(x, y, gA.polys) && pointInPolysEvenOdd(x, y, gB.polys)) {
        return true;
      }
    }
  }

  return false;
}

function parseHexRgb(hex) {
  const clean = hex.trim().toLowerCase();
  const m = /^#([0-9a-f]{6})$/.exec(clean);
  if (!m) return null;
  const v = parseInt(m[1], 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

function fillsAreEquivalent(a, b, maxRgbDist = 10) {
  if (a === b) return true;
  const rgbA = parseHexRgb(a);
  const rgbB = parseHexRgb(b);
  if (!rgbA || !rgbB) return false;
  return (
    Math.hypot(rgbA[0] - rgbB[0], rgbA[1] - rgbB[1], rgbA[2] - rgbB[2]) <=
    maxRgbDist
  );
}

/**
 * Merges consecutive layers that share an equivalent fill color AND are provably
 * disjoint (so `fill-rule="evenodd"` can never punch an accidental hole).
 * Layers matching `outlineD` are kept unmerged so `def.d` can be deduplicated.
 */
export function mergeSafeConsecutiveLayers(layers, outlineD, viewBox = "0 0 256 256") {
  if (!Array.isArray(layers) || layers.length === 0) return layers;

  const groups = [];
  for (const layer of layers) {
    const fill = layer.fill.toLowerCase();
    const d = layer.d.trim();
    const geom = analyzeLayerGeometry(d);
    const isOutlineMatch = d === outlineD;

    const prev = groups[groups.length - 1];
    if (
      prev &&
      fillsAreEquivalent(prev.fill, fill) &&
      !prev.isOutlineMatch &&
      !isOutlineMatch &&
      prev.geoms.every((g) => !geometriesMayOverlap(g, geom))
    ) {
      prev.parts.push(d);
      prev.geoms.push(geom);
    } else {
      groups.push({
        fill,
        parts: [d],
        geoms: [geom],
        isOutlineMatch,
      });
    }
  }

  return groups.map((group) => ({
    d: optimizeSvgPath(group.parts.join(""), viewBox),
    fill: group.fill,
  }));
}

export function optimizeSticker(item) {
  const viewBox = item.viewBox || "0 0 256 256";
  const optimizedD = optimizeSvgPath(item.d, viewBox);
  const rawLayers = Array.isArray(item.layers)
    ? item.layers.map((layer) => ({
        d: optimizeSvgPath(layer.d, viewBox),
        fill: layer.fill.toLowerCase(),
      }))
    : undefined;

  const mergedLayers =
    rawLayers && rawLayers.length > 0
      ? mergeSafeConsecutiveLayers(rawLayers, optimizedD, viewBox)
      : undefined;

  return {
    ...item,
    mixColor: item.mixColor.toLowerCase(),
    viewBox,
    d: optimizedD,
    layers: mergedLayers,
  };
}

function toPascalCase(id) {
  return id
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function toDefVarName(id) {
  const pascal = toPascalCase(id);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1) + "Def";
}

function toBaseVarName(id) {
  const pascal = toPascalCase(id);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/**
 * Formats a category TypeScript catalog file, deduplicating any repeated path
 * string within a sticker (such as `def.d === layer.d`) via a local `const`.
 */
export function formatCatalogFile(category, items) {
  const lines = [`import type { StickerDef } from "../core";`, ``];

  for (const item of items) {
    const defVarName = item.defVarName || toDefVarName(item.id);
    const componentName = item.componentName || toPascalCase(item.id);

    // Count occurrences of every path string within this sticker
    const counts = new Map();
    const bump = (p) => counts.set(p, (counts.get(p) || 0) + 1);
    bump(item.d);
    for (const layer of item.layers || []) bump(layer.d);

    const sharedVars = new Map();
    let sharedIdx = 0;
    const baseName = toBaseVarName(item.id);
    for (const [pathStr, count] of counts) {
      if (count >= 2) {
        sharedIdx++;
        const varName =
          sharedIdx === 1 ? `${baseName}Path` : `${baseName}Path${sharedIdx}`;
        sharedVars.set(pathStr, varName);
        lines.push(`const ${varName} = ${JSON.stringify(pathStr)};`);
      }
    }

    const pathExpr = (p) => sharedVars.get(p) ?? JSON.stringify(p);

    lines.push(`export const ${defVarName}: StickerDef = {`);
    lines.push(`  id: ${JSON.stringify(item.id)},`);
    lines.push(`  componentName: ${JSON.stringify(componentName)},`);
    lines.push(`  name: ${JSON.stringify(item.name)},`);
    lines.push(`  category: ${JSON.stringify(item.category)},`);
    lines.push(`  mixColor: ${JSON.stringify(item.mixColor)},`);
    lines.push(`  tags: ${JSON.stringify(item.tags)},`);
    lines.push(`  viewBox: ${JSON.stringify(item.viewBox)},`);
    lines.push(`  d: ${pathExpr(item.d)},`);
    if (item.layers && item.layers.length > 0) {
      const layerEntries = item.layers.map(
        (layer) =>
          `{d:${pathExpr(layer.d)},fill:${JSON.stringify(layer.fill)}}`,
      );
      lines.push(`  layers: [${layerEntries.join(",")}],`);
    }
    lines.push(`};`);
    lines.push(``);
  }

  lines.push(
    `export const ${category}Stickers: readonly StickerDef[] = [${items
      .map((item) => item.defVarName || toDefVarName(item.id))
      .join(", ")}];`,
  );
  lines.push(``);

  return lines.join("\n");
}

async function main() {
  const pkgBuildScript = path.join(rootDir, "packages/trazo/scripts/build.mjs");
  const distSvgPath = path.join(rootDir, "packages/trazo/dist/svg.js");
  const catalogDir = path.join(rootDir, "packages/trazo/src/catalog");
  const catalogJsonPath = path.join(rootDir, "packages/trazo/catalog.json");

  // Ensure dist reflects current src before reading
  execFileSync(process.execPath, [pkgBuildScript], { stdio: "inherit" });

  const { trazoCatalog } = await import(
    `${pathToFileURL(distSvgPath).href}?t=${Date.now()}`
  );

  let layersBefore = 0;
  let layersAfter = 0;
  let dedupedPaths = 0;
  let charsBefore = 0;
  let charsAfter = 0;

  const optimized = trazoCatalog.map((item) => {
    layersBefore += item.layers?.length || 0;
    charsBefore +=
      item.d.length +
      (item.layers || []).reduce((sum, l) => sum + l.d.length, 0);

    const opt = optimizeSticker(item);

    layersAfter += opt.layers?.length || 0;
    const uniquePaths = new Set([opt.d]);
    let dedupThis = 0;
    for (const l of opt.layers || []) {
      if (uniquePaths.has(l.d)) dedupThis++;
      else uniquePaths.add(l.d);
    }
    dedupedPaths += dedupThis;
    charsAfter += [...uniquePaths].reduce((sum, p) => sum + p.length, 0);

    return opt;
  });

  const categories = [
    "ocean",
    "arrows",
    "nature",
    "hearts",
    "symbols",
    "cats",
    "characters",
    "school",
    "food",
  ];

  for (const category of categories) {
    const items = optimized.filter((item) => item.category === category);
    const outPath = path.join(catalogDir, `${category}.ts`);
    fs.writeFileSync(outPath, formatCatalogFile(category, items), "utf8");
  }

  // Keep packages/trazo/catalog.json in sync
  const jsonRecords = optimized.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    mixColor: item.mixColor,
    tags: item.tags,
    viewBox: item.viewBox,
    d: item.d,
    ...(item.layers && item.layers.length > 0 ? { layers: item.layers } : {}),
  }));
  fs.writeFileSync(
    catalogJsonPath,
    JSON.stringify(jsonRecords, null, 2) + "\n",
    "utf8",
  );

  // Rebuild dist from optimized src
  execFileSync(process.execPath, [pkgBuildScript], { stdio: "inherit" });

  console.log(
    `Optimized ${optimized.length} stickers: ` +
      `layers ${layersBefore} -> ${layersAfter} (${layersBefore - layersAfter} merged), ` +
      `${dedupedPaths} exact duplicate paths shared via const, ` +
      `unique path chars ${(charsBefore / 1024).toFixed(1)} KB -> ${(charsAfter / 1024).toFixed(1)} KB ` +
      `(-${(((charsBefore - charsAfter) / charsBefore) * 100).toFixed(1)}%).`,
  );
}

const isEntrypoint =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isEntrypoint) {
  await main();
}
