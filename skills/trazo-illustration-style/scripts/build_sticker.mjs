#!/usr/bin/env node
// Builds a Trazo-style sticker from a small JSON spec.
//
// Trazo art is painted, posterized into a few tone bands, then traced into flat paths.
// This script reproduces that pipeline: author shapes -> raster fields (distance, lighting,
// noise) -> quantized tone bands -> traced, simplified, integer-coordinate paths.
// No dependencies. The optional PNG preview uses `sharp` if it resolves.
//
//   node build_sticker.mjs spec.json [--out dir] [--png] [--no-fit]
//
// See ../references/spec-format.md for the spec schema.

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const CANVAS = 256;
const GRID = 2;
const SIZE = CANVAS * GRID;
const CELLS = SIZE * SIZE;
const FIT_MARGIN = 14;
const SIMPLIFY_EPSILON = 0.55;
const MIN_LOOP_AREA = 2.5;

const LIGHT_DIRECTION = normalize3([-0.55, -0.65, 0.6]);
const LIGHT_2D = normalize2([-0.6, -0.8]);
const LIGHT_SHARE = [0.02, 0.01, 0.004];
const SHADE_SHARE = [0.17, 0.09, 0.05];
const LIGHT_PATCH = [1.3, 2.0, 2.6];
const SHADE_PATCH = [1.3, 2.0, 2.6];
const DEFAULT_FRINGE = 2.4;
const ACCENT_SHARE = 0.1;
const ACCENT_MIN_RADIUS = 26;

function normalize2(vector) {
  const length = Math.hypot(vector[0], vector[1]) || 1;
  return [vector[0] / length, vector[1] / length];
}

function normalize3(vector) {
  const length = Math.hypot(vector[0], vector[1], vector[2]) || 1;
  return [vector[0] / length, vector[1] / length, vector[2] / length];
}

function fail(message) {
  console.error(`error: ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const args = { spec: null, out: ".", png: false, fit: true };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--out") args.out = argv[++i];
    else if (arg === "--png") args.png = true;
    else if (arg === "--no-fit") args.fit = false;
    else if (!args.spec) args.spec = arg;
    else fail(`Unexpected argument: ${arg}`);
  }
  if (!args.spec) fail("Usage: node build_sticker.mjs spec.json [--out dir] [--png] [--no-fit]");
  return args;
}

function hashSeed(...parts) {
  let hash = 2166136261;
  for (const char of parts.join("|")) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeNoise(seed) {
  const rng = mulberry32(seed);
  const order = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const perm = new Uint8Array(512);
  for (let i = 0; i < 512; i++) perm[i] = order[i & 255];
  const gradX = new Float32Array(256);
  const gradY = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    const angle = rng() * Math.PI * 2;
    gradX[i] = Math.cos(angle);
    gradY[i] = Math.sin(angle);
  }
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  return (x, y) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const corner = (ix, iy, dx, dy) => {
      const hash = perm[perm[ix & 255] + (iy & 255)];
      return gradX[hash] * dx + gradY[hash] * dy;
    };
    const u = fade(xf);
    const v = fade(yf);
    const top = corner(xi, yi, xf, yf) * (1 - u) + corner(xi + 1, yi, xf - 1, yf) * u;
    const bottom = corner(xi, yi + 1, xf, yf - 1) * (1 - u) + corner(xi + 1, yi + 1, xf - 1, yf - 1) * u;
    return (top * (1 - v) + bottom * v) * 1.41;
  };
}

function noiseField(seed, octaves) {
  const field = new Float32Array(CELLS);
  octaves.forEach(([wavelength, amplitude], index) => {
    const noise = makeNoise(hashSeed(seed, index));
    const frequency = 1 / (wavelength * GRID);
    for (let y = 0; y < SIZE; y++) {
      const row = y * SIZE;
      for (let x = 0; x < SIZE; x++) {
        field[row + x] += amplitude * noise(x * frequency, y * frequency);
      }
    }
  });
  return field;
}

function hexToHsl(hex) {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!match) fail(`Colors must be 6-digit hex, got "${hex}"`);
  const value = parseInt(match[1], 16);
  const r = ((value >> 16) & 255) / 255;
  const g = ((value >> 8) & 255) / 255;
  const b = (value & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
}

function hslToHex(h, s, l) {
  const hue = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = [
    [c, x, 0],
    [x, c, 0],
    [0, c, x],
    [0, x, c],
    [x, 0, c],
    [c, 0, x],
  ][Math.floor(hue / 60)];
  const toHex = (v) =>
    Math.round(Math.min(1, Math.max(0, v + m)) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

const clamp01 = (v) => Math.min(1, Math.max(0, v));

// Tone ramp measured from shipped Trazo stickers (sun-burst, puffy-cloud, lightning-bolt, pink-jellyfish).
function toneRamp(base) {
  const [h, s, l] = hexToHsl(base);
  const warm = h <= 100 || h >= 330;
  const shadeShift = warm ? -4 : 3;
  const lightShift = warm ? 5 : -4;
  const lighten = (fraction, satScale) => hslToHex(h + lightShift, clamp01(s * satScale), l + (1 - l) * fraction);
  const darken = (amount, satScale) => hslToHex(h + shadeShift, clamp01(s * satScale), Math.max(0.1, l - amount));
  return {
    light1: lighten(0.38, 1),
    light2: lighten(0.6, 0.95),
    light3: lighten(0.82, 0.9),
    shadow1: darken(0.028, 1.03),
    shadow2: darken(0.075, 1),
    shadow3: darken(0.11, 0.95),
    outline1: darken(0.19, 0.8),
    outline2: darken(0.25, 0.74),
    halo: lighten(0.5, 0.9),
    accent: hslToHex(h + (warm ? -24 : 18), clamp01(s * 0.5), Math.min(0.96, l + 0.012)),
  };
}

function polylineLength(points, closed) {
  let total = 0;
  const count = closed ? points.length : points.length - 1;
  for (let i = 0; i < count; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    total += Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  return total;
}

function resample(points, closed, spacing = 3) {
  const total = polylineLength(points, closed);
  if (total === 0) return points.slice();
  const count = Math.max(closed ? 12 : 4, Math.round(total / spacing));
  const source = closed ? [...points, points[0]] : points;
  const cumulative = [0];
  for (let i = 1; i < source.length; i++) {
    cumulative.push(cumulative[i - 1] + Math.hypot(source[i][0] - source[i - 1][0], source[i][1] - source[i - 1][1]));
  }
  const steps = closed ? count : count - 1;
  const result = [];
  let segment = 0;
  for (let i = 0; i <= (closed ? count - 1 : steps); i++) {
    const target = (i / steps) * total;
    while (segment < cumulative.length - 2 && cumulative[segment + 1] < target) segment++;
    const span = cumulative[segment + 1] - cumulative[segment] || 1;
    const t = (target - cumulative[segment]) / span;
    const a = source[segment];
    const b = source[segment + 1];
    result.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
  }
  return result;
}

function catmullRom(points, closed, samples = 12) {
  const count = points.length;
  if (count < 3) return points.slice();
  const get = (index) => (closed ? points[((index % count) + count) % count] : points[Math.min(count - 1, Math.max(0, index))]);
  const result = [];
  const segments = closed ? count : count - 1;
  for (let i = 0; i < segments; i++) {
    const p0 = get(i - 1);
    const p1 = get(i);
    const p2 = get(i + 1);
    const p3 = get(i + 2);
    for (let step = 0; step < samples; step++) {
      const t = step / samples;
      const t2 = t * t;
      const t3 = t2 * t;
      result.push([
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  if (!closed) result.push(points[count - 1]);
  return result;
}

function ellipsePoints(cx, cy, rx, ry, rotation = 0) {
  const steps = Math.max(24, Math.round((Math.PI * 2 * Math.max(rx, ry)) / 3));
  const cos = Math.cos((rotation * Math.PI) / 180);
  const sin = Math.sin((rotation * Math.PI) / 180);
  const points = [];
  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    const x = Math.cos(angle) * rx;
    const y = Math.sin(angle) * ry;
    points.push([cx + x * cos - y * sin, cy + x * sin + y * cos]);
  }
  return points;
}

function strokeContour(points, widthSpec, smooth) {
  const [startWidth, endWidth] = Array.isArray(widthSpec) ? widthSpec : [widthSpec, widthSpec];
  const path = resample(smooth ? catmullRom(points, false) : points, false);
  const count = path.length;
  const left = [];
  const right = [];
  for (let i = 0; i < count; i++) {
    const prev = path[Math.max(0, i - 1)];
    const next = path[Math.min(count - 1, i + 1)];
    const tx = next[0] - prev[0];
    const ty = next[1] - prev[1];
    const length = Math.hypot(tx, ty) || 1;
    const half = (startWidth + (endWidth - startWidth) * (i / (count - 1))) / 2;
    left.push([path[i][0] - (ty / length) * half, path[i][1] + (tx / length) * half]);
    right.push([path[i][0] + (ty / length) * half, path[i][1] - (tx / length) * half]);
  }
  const cap = (center, from, outward, radius) => {
    const startAngle = Math.atan2(from[1] - center[1], from[0] - center[0]);
    const steps = Math.max(4, Math.round(radius));
    const sweep = (direction) => {
      const arc = [];
      for (let i = 1; i < steps; i++) {
        const angle = startAngle + direction * ((Math.PI * i) / steps);
        arc.push([center[0] + Math.cos(angle) * radius, center[1] + Math.sin(angle) * radius]);
      }
      return arc;
    };
    const target = [center[0] + outward[0] * radius, center[1] + outward[1] * radius];
    const distanceToTarget = (arc) => {
      const mid = arc[Math.floor(arc.length / 2)];
      return Math.hypot(mid[0] - target[0], mid[1] - target[1]);
    };
    const clockwise = sweep(1);
    const counter = sweep(-1);
    return distanceToTarget(clockwise) < distanceToTarget(counter) ? clockwise : counter;
  };
  const direction = (a, b) => {
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [(b[0] - a[0]) / length, (b[1] - a[1]) / length];
  };
  const endCap = cap(path[count - 1], left[count - 1], direction(path[count - 2], path[count - 1]), endWidth / 2);
  const startCap = cap(path[0], right[0], direction(path[1], path[0]), startWidth / 2);
  return [...left, ...endCap, ...right.reverse(), ...startCap];
}

function shapeToContours(shape, context) {
  const smooth = shape.smooth !== false;
  const contours = [];
  if (shape.ellipse) {
    const [cx, cy, rx, ry, rotation] = shape.ellipse;
    contours.push(ellipsePoints(cx, cy, rx, ry ?? rx, rotation ?? 0));
  } else if (shape.poly) {
    if (shape.poly.length < 3) fail(`${context}: poly needs at least 3 points`);
    contours.push(resample(smooth ? catmullRom(shape.poly, true) : shape.poly, true));
  } else if (shape.ring) {
    const [cx, cy, rx, ry, rotation, innerRx, innerRy] = shape.ring;
    contours.push(ellipsePoints(cx, cy, rx, ry, rotation ?? 0));
    contours.push(ellipsePoints(cx, cy, innerRx, innerRy ?? innerRx, rotation ?? 0));
  } else if (shape.arc) {
    const [cx, cy, rx, ry, rotation, startDeg, endDeg] = shape.arc;
    const cos = Math.cos(((rotation ?? 0) * Math.PI) / 180);
    const sin = Math.sin(((rotation ?? 0) * Math.PI) / 180);
    const sweep = endDeg - startDeg;
    const steps = Math.max(4, Math.ceil(Math.abs(sweep) / 15));
    const arcPoints = [];
    for (let i = 0; i <= steps; i++) {
      const angle = ((startDeg + (sweep * i) / steps) * Math.PI) / 180;
      const x = Math.cos(angle) * rx;
      const y = Math.sin(angle) * (ry ?? rx);
      arcPoints.push([cx + x * cos - y * sin, cy + x * sin + y * cos]);
    }
    contours.push(strokeContour(arcPoints, shape.width ?? 12, true));
  } else if (shape.stroke) {
    if (shape.stroke.length < 2) fail(`${context}: stroke needs at least 2 points`);
    contours.push(strokeContour(shape.stroke, shape.width ?? 12, smooth));
  } else {
    fail(`${context}: shape needs one of ellipse, poly, ring, arc, stroke`);
  }
  for (const hole of shape.holes ?? []) {
    contours.push(shapeToContours(hole, `${context}.holes`)[0]);
  }
  return contours.map((points) => resample(points, true));
}

function transformContours(contours, scale, offsetX, offsetY) {
  return contours.map((points) => points.map(([x, y]) => [x * scale + offsetX, y * scale + offsetY]));
}

function fillMask(contours) {
  const mask = new Uint8Array(CELLS);
  const edges = [];
  for (const points of contours) {
    for (let i = 0; i < points.length; i++) {
      const a = points[i];
      const b = points[(i + 1) % points.length];
      if (a[1] !== b[1]) edges.push([a[0], a[1], b[0], b[1]]);
    }
  }
  for (let row = 0; row < SIZE; row++) {
    const y = (row + 0.5) / GRID;
    const crossings = [];
    for (const [ax, ay, bx, by] of edges) {
      if ((ay <= y && by > y) || (by <= y && ay > y)) {
        crossings.push(ax + ((y - ay) * (bx - ax)) / (by - ay));
      }
    }
    crossings.sort((p, q) => p - q);
    for (let k = 0; k + 1 < crossings.length; k += 2) {
      const from = Math.max(0, Math.ceil(crossings[k] * GRID - 0.5));
      const to = Math.min(SIZE - 1, Math.ceil(crossings[k + 1] * GRID - 0.5) - 1);
      for (let x = from; x <= to; x++) mask[row * SIZE + x] = 1;
    }
  }
  return mask;
}

function edt1d(source, count, output, v, z) {
  let k = 0;
  v[0] = 0;
  z[0] = -1e20;
  z[1] = 1e20;
  for (let q = 1; q < count; q++) {
    let s = (source[q] + q * q - (source[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) {
      k--;
      s = (source[q] + q * q - (source[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    }
    k++;
    v[k] = q;
    z[k] = s;
    z[k + 1] = 1e20;
  }
  k = 0;
  for (let q = 0; q < count; q++) {
    while (z[k + 1] < q) k++;
    const dx = q - v[k];
    output[q] = dx * dx + source[v[k]];
  }
}

function squaredDistance(mask, featureValue) {
  const grid = new Float64Array(CELLS);
  for (let i = 0; i < CELLS; i++) grid[i] = mask[i] === featureValue ? 0 : 1e20;
  const line = new Float64Array(SIZE);
  const out = new Float64Array(SIZE);
  const v = new Int32Array(SIZE);
  const z = new Float64Array(SIZE + 1);
  for (let x = 0; x < SIZE; x++) {
    for (let y = 0; y < SIZE; y++) line[y] = grid[y * SIZE + x];
    edt1d(line, SIZE, out, v, z);
    for (let y = 0; y < SIZE; y++) grid[y * SIZE + x] = out[y];
  }
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) line[x] = grid[y * SIZE + x];
    edt1d(line, SIZE, out, v, z);
    for (let x = 0; x < SIZE; x++) grid[y * SIZE + x] = out[x];
  }
  return grid;
}

function boxBlur(field, radius, passes) {
  const size = SIZE;
  const temp = new Float32Array(CELLS);
  const window = radius * 2 + 1;
  for (let pass = 0; pass < passes; pass++) {
    for (let y = 0; y < size; y++) {
      const row = y * size;
      let sum = 0;
      for (let i = -radius; i <= radius; i++) sum += field[row + Math.min(size - 1, Math.max(0, i))];
      for (let x = 0; x < size; x++) {
        temp[row + x] = sum / window;
        sum += field[row + Math.min(size - 1, x + radius + 1)] - field[row + Math.max(0, x - radius)];
      }
    }
    for (let x = 0; x < size; x++) {
      let sum = 0;
      for (let i = -radius; i <= radius; i++) sum += temp[Math.min(size - 1, Math.max(0, i)) * size + x];
      for (let y = 0; y < size; y++) {
        field[y * size + x] = sum / window;
        sum += temp[Math.min(size - 1, y + radius + 1) * size + x] - temp[Math.max(0, y - radius) * size + x];
      }
    }
  }
  return field;
}

function signedDistance(groups) {
  const mask = new Uint8Array(CELLS);
  for (const group of groups) {
    const groupMask = fillMask(group);
    for (let i = 0; i < CELLS; i++) mask[i] |= groupMask[i];
  }
  const inside = squaredDistance(mask, 0);
  const outside = squaredDistance(mask, 1);
  const field = new Float32Array(CELLS);
  for (let i = 0; i < CELLS; i++) {
    field[i] = (mask[i] ? Math.sqrt(inside[i]) - 0.5 : -(Math.sqrt(outside[i]) - 0.5)) / GRID;
  }
  boxBlur(field, 1, 2);
  return field;
}

function traceField(field, minArea = MIN_LOOP_AREA) {
  for (let i = 0; i < SIZE; i++) {
    field[i] = Math.min(field[i], -0.01);
    field[(SIZE - 1) * SIZE + i] = Math.min(field[(SIZE - 1) * SIZE + i], -0.01);
    field[i * SIZE] = Math.min(field[i * SIZE], -0.01);
    field[i * SIZE + SIZE - 1] = Math.min(field[i * SIZE + SIZE - 1], -0.01);
  }
  const adjacency = new Map();
  const link = (a, b) => {
    if (!adjacency.has(a)) adjacency.set(a, []);
    if (!adjacency.has(b)) adjacency.set(b, []);
    adjacency.get(a).push(b);
    adjacency.get(b).push(a);
  };
  for (let y = 0; y < SIZE - 1; y++) {
    for (let x = 0; x < SIZE - 1; x++) {
      const index = y * SIZE + x;
      const tl = field[index];
      const tr = field[index + 1];
      const bl = field[index + SIZE];
      const br = field[index + SIZE + 1];
      const code = (tl > 0 ? 8 : 0) | (tr > 0 ? 4 : 0) | (br > 0 ? 2 : 0) | (bl > 0 ? 1 : 0);
      if (code === 0 || code === 15) continue;
      const top = index * 2;
      const bottom = (index + SIZE) * 2;
      const left = index * 2 + 1;
      const right = (index + 1) * 2 + 1;
      switch (code) {
        case 1: case 14: link(left, bottom); break;
        case 2: case 13: link(bottom, right); break;
        case 3: case 12: link(left, right); break;
        case 4: case 11: link(top, right); break;
        case 6: case 9: link(top, bottom); break;
        case 7: case 8: link(left, top); break;
        case 5:
          if ((tl + tr + bl + br) / 4 > 0) { link(left, top); link(bottom, right); }
          else { link(left, bottom); link(top, right); }
          break;
        case 10:
          if ((tl + tr + bl + br) / 4 > 0) { link(top, right); link(left, bottom); }
          else { link(left, top); link(bottom, right); }
          break;
        default: break;
      }
    }
  }
  const pointOf = (id) => {
    const cell = id >> 1;
    const x = cell % SIZE;
    const y = (cell - x) / SIZE;
    if ((id & 1) === 0) {
      const a = field[cell];
      const b = field[cell + 1];
      return [(x + a / (a - b) + 0.5) / GRID, (y + 0.5) / GRID];
    }
    const a = field[cell];
    const b = field[cell + SIZE];
    return [(x + 0.5) / GRID, (y + a / (a - b) + 0.5) / GRID];
  };
  const visited = new Set();
  const loops = [];
  for (const start of adjacency.keys()) {
    if (visited.has(start)) continue;
    const loop = [];
    let previous = -1;
    let current = start;
    let guard = 0;
    while (!visited.has(current) && guard++ < 200000) {
      visited.add(current);
      loop.push(pointOf(current));
      const neighbors = adjacency.get(current);
      const next = neighbors.find((n) => n !== previous && !visited.has(n)) ?? null;
      if (next === null) break;
      previous = current;
      current = next;
    }
    if (loop.length >= 4 && Math.abs(polygonArea(loop)) >= minArea) loops.push(simplifyClosed(loop, SIMPLIFY_EPSILON));
  }
  return loops.filter((loop) => loop.length >= 3);
}

function polygonArea(points) {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    area += a[0] * b[1] - b[0] * a[1];
  }
  return area / 2;
}

function simplifyChain(points, epsilon) {
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [first, last] = stack.pop();
    const [ax, ay] = points[first];
    const [bx, by] = points[last];
    const dx = bx - ax;
    const dy = by - ay;
    const length = Math.hypot(dx, dy) || 1;
    let worst = -1;
    let worstIndex = -1;
    for (let i = first + 1; i < last; i++) {
      const distance = Math.abs((points[i][0] - ax) * dy - (points[i][1] - ay) * dx) / length;
      if (distance > worst) {
        worst = distance;
        worstIndex = i;
      }
    }
    if (worst > epsilon) {
      keep[worstIndex] = 1;
      stack.push([first, worstIndex], [worstIndex, last]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

function simplifyClosed(points, epsilon) {
  if (points.length < 6) return points;
  let far = 0;
  let best = -1;
  for (let i = 1; i < points.length; i++) {
    const distance = (points[i][0] - points[0][0]) ** 2 + (points[i][1] - points[0][1]) ** 2;
    if (distance > best) {
      best = distance;
      far = i;
    }
  }
  const first = simplifyChain(points.slice(0, far + 1), epsilon);
  const second = simplifyChain([...points.slice(far), points[0]], epsilon);
  return [...first.slice(0, -1), ...second.slice(0, -1)];
}

function loopsToPath(loops) {
  const parts = [];
  for (const loop of loops) {
    const rounded = [];
    for (const [x, y] of loop) {
      const point = [Math.round(x), Math.round(y)];
      const last = rounded[rounded.length - 1];
      if (!last || last[0] !== point[0] || last[1] !== point[1]) rounded.push(point);
    }
    if (rounded.length < 3) continue;
    const deltas = [];
    for (let i = 1; i < rounded.length; i++) {
      deltas.push(`${rounded[i][0] - rounded[i - 1][0]} ${rounded[i][1] - rounded[i - 1][1]}`);
    }
    parts.push(`M${rounded[0][0]} ${rounded[0][1]}l${deltas.join(" ")}Z`);
  }
  return parts.join("");
}

function expandFace(face) {
  const size = face.size ?? 1;
  const gap = face.gap ?? 34;
  const eyeFill = face.eye ?? "#32201e";
  const blushFill = face.blush || "#e8b8c8";
  const details = [];
  if (face.blush !== false) {
    for (const side of [-1, 1]) {
      details.push({
        fill: blushFill,
        shape: { ellipse: [face.cx + side * (gap / 2 + 11 * size), face.cy + 9 * size, 8 * size, 5.5 * size, 0] },
      });
    }
  }
  for (const side of [-1, 1]) {
    details.push({
      fill: eyeFill,
      shape: { ellipse: [face.cx + side * (gap / 2), face.cy, 4.6 * size, 7.4 * size, side * -14] },
    });
  }
  if (face.nose) {
    details.push({ fill: eyeFill, shape: { ellipse: [face.cx, face.cy + 12 * size, 2 * size, 2.4 * size, 0] } });
  }
  return details;
}

function smoothstep(edge0, edge1, value) {
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function statsOf(values) {
  let sum = 0;
  for (const value of values) sum += value;
  const mean = sum / values.length;
  let variance = 0;
  for (const value of values) variance += (value - mean) ** 2;
  return { mean, std: Math.sqrt(variance / values.length) || 1 };
}

function quantile(sortedValues, fraction) {
  const index = Math.min(sortedValues.length - 1, Math.max(0, Math.floor(fraction * sortedValues.length)));
  return sortedValues[index];
}

function lightingField({ signed, maxDepth, centroid, radius, depth, patches, seed, rough, interiorFloor, cast }) {
  const puff = Math.min(Math.max(maxDepth * 0.95, 3), 70);
  const height = new Float32Array(CELLS);
  for (let i = 0; i < CELLS; i++) {
    const t = clamp01(signed[i] / puff);
    height[i] = Math.sqrt(1 - (1 - t) * (1 - t)) * puff * 0.6;
  }
  boxBlur(height, Math.max(3, Math.round(puff * 0.25 * GRID)), 3);

  const geometry = new Float32Array(CELLS);
  const interior = [];
  const unit = 1 / GRID;
  for (let y = 1; y < SIZE - 1; y++) {
    for (let x = 1; x < SIZE - 1; x++) {
      const index = y * SIZE + x;
      if (signed[index] <= 0) continue;
      const gradX = (height[index + 1] - height[index - 1]) / (2 * unit);
      const gradY = (height[index + SIZE] - height[index - SIZE]) / (2 * unit);
      const length = Math.hypot(gradX, gradY, 1);
      const shade =
        (-gradX * LIGHT_DIRECTION[0] - gradY * LIGHT_DIRECTION[1] + LIGHT_DIRECTION[2]) / length - LIGHT_DIRECTION[2];
      const worldX = (x + 0.5) / GRID;
      const worldY = (y + 0.5) / GRID;
      const broad = ((worldX - centroid[0]) / radius) * LIGHT_2D[0] + ((worldY - centroid[1]) / radius) * LIGHT_2D[1];
      geometry[index] = (shade > 0 ? shade * 1.6 : shade * 4.2) + broad * 0.9;
      if (signed[index] > interiorFloor) interior.push(geometry[index]);
    }
  }
  const geometryStats = statsOf(interior.length ? interior : [0, 1]);

  const warpX = noiseField(hashSeed(seed, "warpx"), [[Math.max(10, radius * 0.45), 1]]);
  const warpY = noiseField(hashSeed(seed, "warpy"), [[Math.max(10, radius * 0.45), 1]]);
  const warpSize = Math.max(3, radius * 0.22) * GRID;
  const blotch = new Float32Array(CELLS);
  const blotchOctaves = [
    [Math.max(11, radius * 0.42), 1],
    [Math.max(5.5, radius * 0.19), 0.75],
    [Math.max(2.8, radius * 0.09), 0.38],
  ].map(([wavelength, amplitude], index) => ({
    noise: makeNoise(hashSeed(seed, "blotch", index)),
    frequency: 1 / (wavelength * GRID),
    amplitude,
  }));
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const index = y * SIZE + x;
      if (signed[index] <= 0) continue;
      const sampleX = x + warpX[index] * warpSize;
      const sampleY = y + warpY[index] * warpSize;
      let total = 0;
      for (const octave of blotchOctaves) {
        total += octave.amplitude * octave.noise(sampleX * octave.frequency, sampleY * octave.frequency);
      }
      blotch[index] = total;
    }
  }
  const blotchValues = [];
  for (let i = 0; i < CELLS; i++) if (signed[i] > interiorFloor) blotchValues.push(blotch[i]);
  const blotchStats = statsOf(blotchValues.length ? blotchValues : [0, 1]);

  const texture = rough ** 0.5 * 1.0;
  const lighting = new Float32Array(CELLS);
  for (let i = 0; i < CELLS; i++) {
    if (signed[i] <= 0) continue;
    lighting[i] =
      ((geometry[i] - geometryStats.mean) / geometryStats.std) * depth * 0.62 +
      ((blotch[i] - blotchStats.mean) / blotchStats.std) * texture;
  }

  boxBlur(lighting, 1, 2);
  const values = [];
  for (let i = 0; i < CELLS; i++) if (signed[i] > interiorFloor) values.push(lighting[i]);
  const stats = statsOf(values.length ? values : [0, 1]);

  if (cast) {
    for (let i = 0; i < CELLS; i++) if (signed[i] > 0) lighting[i] -= cast[i] * 3.4 * stats.std;
  }

  for (const patch of patches) {
    const patchSigned = signedDistance([patch.contours]);
    for (let i = 0; i < CELLS; i++) {
      const soft = smoothstep(-2, 5, patchSigned[i]);
      if (soft > 0) lighting[i] += patch.strength * stats.std * soft;
    }
  }
  return lighting;
}

function bandThresholds(lighting, signed, interiorFloor) {
  const values = [];
  for (let i = 0; i < CELLS; i++) if (signed[i] > interiorFloor) values.push(lighting[i]);
  const sorted = Float32Array.from(values).sort();
  const lightShares = [LIGHT_SHARE[0] + LIGHT_SHARE[1] + LIGHT_SHARE[2], LIGHT_SHARE[1] + LIGHT_SHARE[2], LIGHT_SHARE[2]];
  return {
    light: lightShares.map((share) => quantile(sorted, 1 - share)),
    shadow1: quantile(sorted, SHADE_SHARE[0] + SHADE_SHARE[1] + SHADE_SHARE[2]),
    shadow2: quantile(sorted, SHADE_SHARE[1] + SHADE_SHARE[2]),
    shadow3: quantile(sorted, SHADE_SHARE[2]),
  };
}

function buildSticker(spec, args) {
  const seed = spec.seed ?? 1;
  const rough = spec.rough ?? 1;

  const partContours = spec.parts.map((part, index) => {
    if (!part.base) fail(`parts[${index}]: base color is required`);
    const shapes = Array.isArray(part.shape) ? part.shape : [part.shape];
    return shapes.map((shape, shapeIndex) => shapeToContours(shape, `parts[${index}].shape[${shapeIndex}]`));
  });
  const detailEntries = [...(spec.details ?? []), ...(spec.face ? expandFace(spec.face) : [])];
  detailEntries.forEach((detail, index) => {
    if (!detail.fill) fail(`details[${index}]: fill is required`);
  });
  const detailContours = detailEntries.map((detail, index) => [shapeToContours(detail.shape, `details[${index}]`)]);

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const contours of [...partContours, ...detailContours].flat()) {
    for (const points of contours) {
      for (const [x, y] of points) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  const width = maxX - minX;
  const height = maxY - minY;
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;
  if (args.fit) {
    scale = Math.min((CANVAS - FIT_MARGIN * 2) / width, (CANVAS - FIT_MARGIN * 2) / height);
    offsetX = CANVAS / 2 - ((minX + maxX) / 2) * scale;
    offsetY = CANVAS / 2 - ((minY + maxY) / 2) * scale;
    console.log(`fit: scale ${scale.toFixed(2)} (author coordinates ${Math.round(width)}x${Math.round(height)})`);
    if (scale < 0.75 || scale > 1.35) {
      console.warn("warn: scale is far from 1, so outline and detail sizes drift. Redraw the coordinates closer to a 256 canvas.");
    }
  } else if (minX < 4 || minY < 4 || maxX > CANVAS - 4 || maxY > CANVAS - 4) {
    console.warn("warn: artwork touches the 256x256 canvas edge; rerun without --no-fit");
  }

  const layers = [];
  const silhouette = new Float32Array(CELLS).fill(-1e3);

  spec.parts.forEach((part, partIndex) => {
    const groups = partContours[partIndex].map((group) => transformContours(group, scale, offsetX, offsetY));
    const palette = { ...toneRamp(part.base), ...(part.palette ?? {}) };
    const outline = (part.outline ?? 6) * scale;
    const depth = part.depth ?? 1;
    const partSeed = hashSeed(seed, partIndex);

    const signed = signedDistance(groups);
    const edgeJitter = noiseField(hashSeed(partSeed, "edge"), [
      [24, 1.0 * rough],
      [9, 0.7 * rough],
      [4, 0.55 * rough],
      [1.8, 0.38 * rough],
    ]);
    const edged = new Float32Array(CELLS);
    let maxDepth = 0;
    let area = 0;
    let sumX = 0;
    let sumY = 0;
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const index = y * SIZE + x;
        edged[index] = signed[index] + edgeJitter[index];
        if (signed[index] > 0) {
          maxDepth = Math.max(maxDepth, signed[index]);
          area++;
          sumX += x;
          sumY += y;
        }
      }
    }
    if (area === 0) fail(`parts[${partIndex}]: shape is empty or outside the canvas`);
    const centroid = [(sumX / area + 0.5) / GRID, (sumY / area + 0.5) / GRID];
    const radius = Math.max(8, Math.sqrt(area / (GRID * GRID) / Math.PI));

    for (let i = 0; i < CELLS; i++) silhouette[i] = Math.max(silhouette[i], edged[i]);

    const patches = [
      ...(part.light ?? []).map((patch) => ({
        contours: transformContours(shapeToContours(patch.shape, `parts[${partIndex}].light`), scale, offsetX, offsetY),
        strength: LIGHT_PATCH[Math.min(2, (patch.tone ?? 1) - 1)],
      })),
      ...(part.shade ?? []).map((patch) => ({
        contours: transformContours(shapeToContours(patch.shape, `parts[${partIndex}].shade`), scale, offsetX, offsetY),
        strength: -SHADE_PATCH[Math.min(2, (patch.tone ?? 1) - 1)],
      })),
    ];

    const fringeNoise = noiseField(hashSeed(partSeed, "fringe"), [
      [18, 0.5],
      [6, 0.34],
      [2.6, 0.18],
    ]);
    const fringe = part.fringe ?? (hexToHsl(part.base)[2] < 0.3 ? 0 : DEFAULT_FRINGE);
    const inner = new Float32Array(CELLS);
    for (let i = 0; i < CELLS; i++) inner[i] = edged[i] - fringe * scale * Math.max(0.1, 0.8 + fringeNoise[i]);
    if (fringe > 0) layers.push({ fill: palette.halo, field: edged, keepSmall: false });
    layers.push({ fill: part.base, field: fringe > 0 ? inner : edged, keepSmall: false });

    const interiorFloor = Math.max(1, outline * 1.1);
    const flat = depth <= 0 && patches.length === 0;
    if (!flat) {
      let cast = null;
      const laterGroups = partContours
        .slice(partIndex + 1)
        .flat()
        .map((group) => transformContours(group, scale, offsetX, offsetY));
      if (laterGroups.length && part.castShadow !== false) {
        const frontSigned = signedDistance(laterGroups);
        cast = new Float32Array(CELLS);
        const shiftX = Math.round(3 * GRID);
        const shiftY = Math.round(5 * GRID);
        const reach = 15 * scale;
        for (let y = shiftY; y < SIZE; y++) {
          for (let x = shiftX; x < SIZE; x++) {
            const outside = -frontSigned[(y - shiftY) * SIZE + (x - shiftX)];
            cast[y * SIZE + x] = outside <= 0 ? 1 : outside < reach ? (1 - outside / reach) ** 1.4 : 0;
          }
        }
      }
      const lighting = lightingField({ signed, maxDepth, centroid, radius, depth, patches, seed: partSeed, rough, interiorFloor, cast });
      const lightSmooth = Float32Array.from(lighting);
      boxBlur(lightSmooth, 5, 2);
      const cuts = bandThresholds(lighting, signed, interiorFloor);
      const lightCuts = bandThresholds(lightSmooth, signed, interiorFloor).light;
      const bands = [
        { fill: palette.shadow1, make: (i) => cuts.shadow1 - lighting[i] },
        { fill: palette.shadow2, make: (i) => cuts.shadow2 - lighting[i] },
        { fill: palette.shadow3, make: (i) => cuts.shadow3 - lighting[i] },
        { fill: palette.light1, minArea: 40, make: (i) => Math.min(lightSmooth[i] - lightCuts[0], (signed[i] - interiorFloor - 4) * 0.5) },
        { fill: palette.light2, minArea: 40, make: (i) => Math.min(lightSmooth[i] - lightCuts[1], (signed[i] - interiorFloor - 7) * 0.5) },
        { fill: palette.light3, minArea: 40, make: (i) => Math.min(lightSmooth[i] - lightCuts[2], (signed[i] - interiorFloor - 10) * 0.5) },
      ];
      for (const band of bands) {
        const field = new Float32Array(CELLS);
        for (let i = 0; i < CELLS; i++) field[i] = Math.min(inner[i], band.make(i) * 40);
        layers.push({ fill: band.fill, field, keepSmall: false, minArea: band.minArea ?? 6 });
      }

      const accentWanted = part.accent ?? (radius >= ACCENT_MIN_RADIUS);
      if (accentWanted) {
        const anchor = Array.isArray(part.accentAt)
          ? [part.accentAt[0] * scale + offsetX, part.accentAt[1] * scale + offsetY]
          : [centroid[0] + LIGHT_2D[0] * radius * 0.3, centroid[1] + LIGHT_2D[1] * radius * 0.28];
        const accentNoise = noiseField(hashSeed(partSeed, "accent"), [
          [radius * 0.9, 0.36],
          [radius * 0.34, 0.24],
          [radius * 0.14, 0.1],
        ]);
        const score = new Float32Array(CELLS);
        const scoreValues = [];
        for (let y = 0; y < SIZE; y++) {
          for (let x = 0; x < SIZE; x++) {
            const i = y * SIZE + x;
            if (signed[i] <= interiorFloor) {
              score[i] = -1e3;
              continue;
            }
            const distance = Math.hypot((x + 0.5) / GRID - anchor[0], (y + 0.5) / GRID - anchor[1]) / radius;
            score[i] = accentNoise[i] - distance * 1.5;
            scoreValues.push(score[i]);
          }
        }
        const cut = quantile(Float32Array.from(scoreValues).sort(), 1 - ACCENT_SHARE * (typeof part.accent === "number" ? part.accent : 1));
        const field = new Float32Array(CELLS);
        for (let i = 0; i < CELLS; i++) field[i] = Math.min(inner[i], (score[i] - cut) * 40);
        layers.push({ fill: palette.accent, field, keepSmall: false });
      }

      if (outline > 0) {
        const ringNoise = noiseField(hashSeed(partSeed, "ring"), [
          [24, 0.34],
          [9, 0.26],
          [3.4, 0.14],
        ]);
        const darkNoise = noiseField(hashSeed(partSeed, "dark"), [
          [20, 0.55],
          [8, 0.4],
          [3, 0.18],
        ]);
        const ring1 = new Float32Array(CELLS);
        const ring2 = new Float32Array(CELLS);
        for (let y = 0; y < SIZE; y++) {
          for (let x = 0; x < SIZE; x++) {
            const i = y * SIZE + x;
            const worldX = (x + 0.5) / GRID;
            const worldY = (y + 0.5) / GRID;
            const side = ((worldX - centroid[0]) / radius) * -LIGHT_2D[0] + ((worldY - centroid[1]) / radius) * -LIGHT_2D[1];
            const sideTerm = Math.max(-1, Math.min(1, side));
            const width1 = outline * 0.75 * Math.max(0, 0.55 + ringNoise[i] * 1.5 + 1.3 * sideTerm);
            const width2 = outline * 0.6 * Math.max(0, -0.1 + darkNoise[i] * 1.2 + 1.5 * sideTerm);
            ring1[i] = Math.min(inner[i], width1 - inner[i]);
            ring2[i] = Math.min(inner[i], width2 - inner[i]);
          }
        }
        layers.push({ fill: palette.outline1, field: ring1, keepSmall: false });
        layers.push({ fill: palette.outline2, field: ring2, keepSmall: false });
      }
    } else if (outline > 0) {
      const ring1 = new Float32Array(CELLS);
      for (let i = 0; i < CELLS; i++) ring1[i] = Math.min(inner[i], outline * 0.8 - inner[i]);
      layers.push({ fill: palette.outline1, field: ring1, keepSmall: false });
    }
  });

  detailEntries.forEach((detail, index) => {
    const groups = detailContours[index].map((group) => transformContours(group, scale, offsetX, offsetY));
    const signed = signedDistance(groups);
    const jitter = noiseField(hashSeed(seed, "detail", index), [
      [7, 0.5 * rough],
      [3, 0.34 * rough],
      [1.6, 0.18 * rough],
    ]);
    const field = new Float32Array(CELLS);
    for (let i = 0; i < CELLS; i++) field[i] = signed[i] + jitter[i];
    layers.push({ fill: detail.fill, field, keepSmall: true });
  });

  const finalLayers = [];
  for (const layer of layers) {
    const loops = traceField(layer.field, layer.keepSmall ? 0.6 : (layer.minArea ?? MIN_LOOP_AREA));
    const d = loopsToPath(loops);
    if (d.length > 0) finalLayers.push({ fill: layer.fill, d });
  }
  // Ink shares the painted fit and has its own contours.
  let inkField = silhouette;
  if (spec.ink) {
    const inkContours = spec.ink.map((shape, i) =>
      transformContours(shapeToContours(shape, `ink[${i}]`), scale, offsetX, offsetY),
    );
    inkField = signedDistance(inkContours);
    const inkJitter = noiseField(hashSeed(seed, "ink"), [
      [9, 0.65 * rough],
      [3, 0.4 * rough],
    ]);
    for (let i = 0; i < CELLS; i++) inkField[i] += inkJitter[i];
  }

  const inkD = loopsToPath(traceField(inkField));
  if (!inkD) fail("Ink drawing is empty or outside the canvas");
  return { finalLayers, inkD };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const spec = JSON.parse(fs.readFileSync(args.spec, "utf8"));
  if (!spec.id || !/^[a-z0-9-]+$/.test(spec.id)) fail("spec.id must be kebab-case, e.g. black-hole");
  if (!Array.isArray(spec.parts) || spec.parts.length === 0) fail("spec.parts must be a non-empty array");
  if (spec.ink !== undefined && (!Array.isArray(spec.ink) || spec.ink.length === 0)) {
    fail("spec.ink must be a non-empty array of shapes");
  }

  const { finalLayers, inkD } = buildSticker(spec, args);
  const paths = finalLayers.map((layer) => `<path d="${layer.d}" fill="${layer.fill}" fill-rule="evenodd"/>`).join("\n  ");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS} ${CANVAS}" width="${CANVAS}" height="${CANVAS}" fill="none">\n  ${paths}\n</svg>\n`;
  const sticker = {
    id: spec.id,
    name: spec.name ?? spec.id,
    category: spec.category ?? "symbols",
    mixColor: spec.parts[0].base,
    tags: spec.tags ?? [],
    viewBox: `0 0 ${CANVAS} ${CANVAS}`,
    d: inkD,
    layers: finalLayers,
  };

  fs.mkdirSync(args.out, { recursive: true });
  const svgPath = path.join(args.out, `${spec.id}.svg`);
  const jsonPath = path.join(args.out, `${spec.id}.sticker.json`);
  fs.writeFileSync(svgPath, svg);
  fs.writeFileSync(jsonPath, `${JSON.stringify(sticker, null, 2)}\n`);
  console.log(`wrote ${svgPath} (${(svg.length / 1024).toFixed(1)} KB, ${finalLayers.length} layers)`);
  console.log(`wrote ${jsonPath}`);

  if (args.png) {
    let sharp;
    try {
      sharp = createRequire(path.join(process.cwd(), "noop.js"))("sharp");
    } catch {
      console.warn("warn: `sharp` is not resolvable from the current directory, so no PNG preview was written. Open the SVG in a browser instead.");
      return;
    }
    const pngPath = path.join(args.out, `${spec.id}.png`);
    sharp(Buffer.from(svg), { density: 288 })
      .flatten({ background: "#ffffff" })
      .resize(768, 768)
      .png()
      .toFile(pngPath)
      .then(() => console.log(`wrote ${pngPath}`))
      .catch((error) => fail(`PNG render failed: ${error.message}`));
  }
}

main();
