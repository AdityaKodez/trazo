const fs = require("fs");
const src = fs.readFileSync("config/canvas.ts", "utf8");
const re = /\{\s*id: "([^"]+)",\s*x: (-?[\d.]+),\s*y: (-?[\d.]+),\s*size: (\d+)/g;
let m, items = [];
while ((m = re.exec(src))) items.push({ id: m[1], x: +m[2], y: +m[3], size: +m[4] });
const pairs = [];
for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
  const a = items[i], b = items[j];
  const d = Math.hypot(a.x - b.x, a.y - b.y);
  const gap = d - (a.size + b.size) / 2;
  pairs.push({ a: a.id, b: b.id, gap: Math.round(gap), d: Math.round(d) });
}
pairs.sort((p, q) => p.gap - q.gap);
console.log("closest pairs (gap = edge-to-edge px):");
pairs.slice(0, 20).forEach(p => console.log(`${p.gap}\t${p.d}\t${p.a} <-> ${p.b}`));
console.log("\ncount gap<0:", pairs.filter(p=>p.gap<0).length, " gap<20:", pairs.filter(p=>p.gap<20).length, " gap<40:", pairs.filter(p=>p.gap<40).length);
console.log("extents x:", Math.min(...items.map(i=>i.x-i.size/2)), Math.max(...items.map(i=>i.x+i.size/2)), "y:", Math.min(...items.map(i=>i.y-i.size/2)), Math.max(...items.map(i=>i.y+i.size/2)));
