// Print an instance's rows, lowest first, with what it shows: its exact energy and the best of
// each bound type (RULES.md 6): node scripts/records.mjs <model>/<stem> ...
import fs from "node:fs";
import { perSiteDivisor, perSiteLabel, noErrorMetrics, boundLabel, methodLabel, BEST_CLASSES } from "./units.mjs";
import { classBest } from "./summary.mjs";

for (const id of process.argv.slice(2)) {
  const d = JSON.parse(fs.readFileSync(`data/${id}.json`, "utf8"));
  const f = perSiteDivisor(d) ?? 1;
  console.log(`\n=== ${id}  (${d.n_sites} sites, BC ${d.boundary}, ${JSON.stringify(d.params)}) [${perSiteLabel(d)}]`);
  const sorted = [...d.rows].sort((a, b) => a.energy - b.energy);
  const best = classBest(d);
  for (const r of sorted) {
    const mark = r.defect ? "!" : best.below.includes(r) ? "<" : r.bound_type === "variational" ? " "
      : r.bound_type === "projected" ? "P" : r.bound_type === "extrapolated" ? "X" : r.bound_type === "approximate" ? "A" : "?";
    const v = r.v_score ? r.v_score.toExponential(1) : "  n/a ";
    // "o" = no error metric found for this row, neither a sigma nor a variance.
    const err = noErrorMetrics(r) ? "o" : " ";
    // "baseline": the number is VarBench's own reference run (RULES.md 8.2).
    const prov = r.baseline ? "baseline" : (r.provenance || "");
    console.log(`  ${mark}${err} ${(r.energy / f).toFixed(7)}  V=${v}  ${prov.padEnd(9)} ${methodLabel(r).slice(0, 50)}`);
  }
  // A spectrum's sector minima are not rows (DATA.md) and hold no record: one line says
  // they are there and where the lowest of them sits.
  if (d.spectrum?.length) {
    const low = d.spectrum.reduce((a, b) => (b.energy < a.energy ? b : a));
    console.log(`  +  spectrum: ${d.spectrum.length} sector minima, not rows; the lowest ${(low.energy / f).toFixed(7)} (sector ${low.sector})`);
  }
  console.log("  legend: ! flagged  < more than 2 sigma below exact (not a best, RULES.md 6.2)"
    + "\n          P projected  X extrapolated  A approximate  ? unclassified"
    + "\n          o no error metric found in the source read");
  // A flagged row is listed in place but cannot be the best of its class (RULES.md 6.1),
  // nor can a row the automatic flag catches (6.2).
  for (const c of BEST_CLASSES) {
    const b = best[c];
    for (const x of sorted) {
      if (x.bound_type !== c || !(x.defect || best.below.includes(x)) || (b && x.energy > b.energy)) continue;
      console.log(`  !! not best ${c}: ${(x.energy / f).toFixed(7)} [${x.defect?.flag ?? "below exact by > 2 sigma"}] ${methodLabel(x).slice(0, 42)}`);
    }
  }
  if (best.exact) console.log(`  --> EXACT (${boundLabel(best.exact)}): ${(best.exact.energy / f).toFixed(7)}  ${methodLabel(best.exact).slice(0, 52)}`);
  for (const c of BEST_CLASSES) if (best[c]) {
    const ties = [...best.ties].filter(([, k]) => k === c).length;
    console.log(`  --> BEST ${c.toUpperCase()}: ${(best[c].energy / f).toFixed(7)}  ${methodLabel(best[c]).slice(0, 52)}${ties ? `  (${ties} tied at 2 sigma)` : ""}`);
  }
  if (!best.exact && !BEST_CLASSES.some(c => best[c])) console.log("  --> NOTHING SHOWN: every row is flagged or has no bound_type");
}
