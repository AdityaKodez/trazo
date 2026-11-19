const fs = require("fs");
const src = fs.readFileSync("config/canvas.ts", "utf8");
const re = /\{\s*id: "([^"]+)",\s*x: (-?[\d.]+),\s*y: (-?[\d.]+),\s*size: (\d+)/g;
let m, items = [];
while ((m = re.exec(src))) items.push({ id: m[1], x: +m[2] * 1.2, y: +m[3] * 1.2, size: +m[4] });
const pairs = [];
for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
  const a = items[i], b = items[j];
  const d = Math.hypot(a.x - b.x, a.y - b.y);
  pairs.push({ a: a.id, b: b.id, gap: Math.round(d - (a.size + b.size) / 2) });
}
pairs.sort((p, q) => p.gap - q.gap);
console.log("closest pairs after 1.2x spread:");
pairs.slice(0, 8).forEach(p => console.log(`${p.gap}\t${p.a} <-> ${p.b}`));
console.log("extents x:", Math.round(Math.min(...items.map(i=>i.x-i.size/2))), Math.round(Math.max(...items.map(i=>i.x+i.size/2))), "y:", Math.round(Math.min(...items.map(i=>i.y-i.size/2))), Math.round(Math.max(...items.map(i=>i.y+i.size/2))));
