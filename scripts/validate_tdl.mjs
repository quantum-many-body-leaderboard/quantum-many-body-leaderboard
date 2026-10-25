// Checks of track 4 (RULES.md 14): every row complete, every exact row of a closed form equal to
// QMBL's own evaluation of it, and no variational energy below the exact one. Stops the build on
// an issue, like validate.mjs.
import { collectTDL } from "./tdl.mjs";
import { perSiteDivisor } from "./units.mjs";

// Closed forms, per site in the stored convention (tdl.mjs).
// Heisenberg chain, H = J sum S_i.S_{i+1}: e = 1/4 - ln 2 (Hulthen 1938), stored as 4 e.
// Transverse-field Ising chain, H = -sum sz sz - h sum sx (Pauli): e(h) = -(1/pi) int_0^pi
// sqrt(1 + h^2 + 2h cos k) dk (Pfeuty 1970); -4/pi at h = 1. Midpoint rule, 2e5 points.
function tfisingChain(h) {
  const n = 200000; let s = 0;
  for (let i = 0; i < n; i++) { const k = Math.PI * (i + 0.5) / n; s += Math.sqrt(1 + h * h + 2 * h * Math.cos(k)); }
  return -s / n;
}
const CLOSED = {
  "Heisenberg/chain_inf": () => 4 * (0.25 - Math.log(2)),
};
const closedForm = inst => CLOSED[inst.instance_id]?.() ??
  (inst.model === "TFIsing" && inst.lattice === "chain" ? tfisingChain(inst.params.h) : null);

const issues = [];
let rows = 0, checked = 0;
for (const inst of collectTDL()) {
  if (perSiteDivisor(inst) == null) issues.push(`${inst.instance_id}: no per-site convention`);
  const want = closedForm(inst);
  const exact = inst.rows.filter(r => r.bound_type === "exact");
  for (const r of inst.rows) {
    rows++;
    const at = `${inst.instance_id} ${r.verified?.reported_as} "${(r.method || "").slice(0, 30)}"`;
    for (const k of ["energy", "method", "bound_type", "how_tdl", "reference", "verified"])
      if (r[k] == null || r[k] === "") issues.push(`FIELD ${at}: ${k} missing`);
    if (r.sigma != null && !(r.sigma > 0)) issues.push(`SIGMA ${at}: ${r.sigma}`);
    if (r.bound_type === "exact") {
      if (want == null) issues.push(`EXACT ${at}: no closed form QMBL evaluates for this instance (RULES.md 14.4)`);
      else {
        checked++;
        // To the printed digits: half a unit of the last printed digit (`precision`, DATA.md), or
        // 1e-12 where the row states none.
        if (Math.abs(r.energy - want) > (r.precision != null ? r.precision / 2 : 1e-12) * (1 + 1e-9)) issues.push(`EXACT ${at}: ${r.energy}, closed form ${want}`);
      }
    }
    if (r.bound_type === "variational" && !r.defect) for (const x of exact)
      if (r.energy < x.energy - 2 * (r.sigma ?? 0) - 1e-12) issues.push(`BOUND ${at}: ${r.energy} below exact ${x.energy}`);
  }
}
console.log(`thermodynamic limit: ${rows} rows checked, ${checked} exact rows against their closed form`);
if (issues.length) { for (const i of issues) console.log("  " + i); process.exit(1); }
