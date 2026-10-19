// Moves each non-ground-state sector minimum from an instance's rows to its `spectrum`
// (see DATA.md, "The lowest energy of each symmetry sector: `spectrum`"). Reads and rewrites data/.
// Runs after the overlays and the method names (which assign `sector`), so corrections and
// verifications land on a sector row before it moves; each spectrum entry keeps the complete
// row. The ground-state sector comes from groundStateExact (units.mjs); an instance with no
// ground-state row keeps its sector rows as rows, printed here and reported by the validator.
import fs from "node:fs"; import path from "node:path";
import { groundStateExact } from "./units.mjs";

const files = [];
(function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f);
  if (fs.statSync(p).isDirectory()) walk(p); else if (f.endsWith(".json") && !f.startsWith("_")) files.push(p); } })("data");

let moved = 0, instances = 0;
const kept = [];
for (const p of files.sort()) {
  const inst = JSON.parse(fs.readFileSync(p, "utf8"));
  const minima = inst.rows.filter(r => r.sector && !groundStateExact(r));
  if (!minima.length) continue;
  if (!inst.rows.some(groundStateExact)) { kept.push(`${inst.instance_id}: ${minima.length} sector rows, no ground-state row`); continue; }
  inst.rows = inst.rows.filter(r => !minima.includes(r));
  // Lowest first, as a spectrum is read; the sector breaks a tie so the file never reorders.
  inst.spectrum = [...(inst.spectrum ?? []), ...minima]
    .sort((a, b) => a.energy - b.energy || a.sector.localeCompare(b.sector));
  fs.writeFileSync(p, JSON.stringify(inst, null, 2) + "\n");
  moved += minima.length; instances++;
}
console.log(`spectrum: ${moved} sector minima moved off the rows of ${instances} instance${instances === 1 ? "" : "s"}${kept.length ? `, ${kept.length} kept` : ""}`);
for (const k of kept) console.log(`  KEPT AS ROWS ${k}`);
