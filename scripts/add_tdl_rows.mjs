// Track 4 (RULES.md 14): builds tdl/ from passes/tdl-rows/tdl-rows-YYYY-MM-DD[-label].json, in
// file-name order. tdl/ is wiped first, so the folder is a function of the pass files and the
// build stays byte-idempotent. Each pass row is a per-site reading in the instance's per-site
// convention (units.mjs perSiteLabel: S.S for spin models, Pauli for TFIsing, t for fermions);
// it is stored per site in track 1's stored convention for one site (tdl.mjs). A row names its
// instance by model, lattice and couplings; the instance is created by its first row.
import fs from "node:fs";
import path from "node:path";
import { perSiteDivisor } from "./units.mjs";
import { TDL_DIR, tdlId } from "./tdl.mjs";

const DIR = "passes/tdl-rows";
const PASSES = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter(f => /^tdl-rows-\d{4}-\d{2}-\d{2}(-[a-z0-9]+)?\.json$/.test(f)).sort() : [];
const BOUNDS = new Set(["exact", "variational", "projected", "extrapolated", "approximate"]);
// How the thermodynamic limit was reached (RULES.md 14.3); it decides nothing by itself, the
// bound_type does, but every row states it.
const HOW = new Set(["closed form", "infinite system", "extrapolation in the ansatz", "finite-size extrapolation", "series or approximate theory"]);
const REASON = {
  exact: "closed-form solution of the infinite system (RULES.md 14.4)",
  variational: "variational state of the infinite system at a fixed ansatz size; energy per site is an upper bound up to the stated contraction (RULES.md 14.4)",
  projected: "projection on a trial state; not a strict variational bound (RULES.md 14.4)",
  extrapolated: "extrapolation to an infinite ansatz or to infinite size; not an upper bound (RULES.md 14.4)",
  approximate: "series expansion, spin-wave theory or another fixed approximation; error of unknown sign (RULES.md 14.4)",
};

fs.rmSync(TDL_DIR, { recursive: true, force: true });
const byId = new Map();
let rows = 0;
for (const f of PASSES) {
  const date = f.slice(9, 19);
  for (const r of JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8"))) {
    const id = tdlId(r.model, r.lattice, r.params);
    const where = `${f}: ${id} ${r.reported_as}`;
    if (!BOUNDS.has(r.bound_type)) throw new Error(`${where}: bound_type ${r.bound_type}`);
    if (!HOW.has(r.how_tdl)) throw new Error(`${where}: how_tdl ${r.how_tdl}`);
    if (!r.arxiv && !r.doi) throw new Error(`${where}: no arxiv or doi`);
    if (!byId.has(id)) byId.set(id, { model: r.model, lattice: r.lattice, n_sites: "inf", boundary: "TDL", params: r.params ?? {}, instance_id: id, rows: [] });
    const inst = byId.get(id);
    const div = perSiteDivisor({ ...inst, n_sites: 1 });
    if (div == null) throw new Error(`${where}: model ${r.model} has no per-site convention`);
    const src = r.arxiv ? `arXiv:${r.arxiv}` : `doi:${r.doi}`;
    inst.rows.push({
      energy: +(r.eps * div).toPrecision(12),
      sigma: r.sigma_per_site == null ? null : +(r.sigma_per_site * div).toPrecision(6),
      ...(r.precision_per_site != null ? { precision: +(r.precision_per_site * div).toPrecision(6) } : {}),
      method: r.method, ...(r.method_detail ? { method_detail: r.method_detail } : {}),
      method_as_published: r.method_as_published ?? r.method,
      bound_type: r.bound_type, bound_type_reason: REASON[r.bound_type], how_tdl: r.how_tdl,
      reference: r.reference, peer_reviewed: r.peer_reviewed,
      source: `tdl-${date}`, provenance: r.origin === "own" ? "primary" : "secondary",
      verified: {
        checked_on: date,
        method: `${src}: ${r.read_method}; ${r.verified_by}`,
        reported_as: r.reported_as,
        note: [r.evidence, r.convention_check].filter(Boolean).join(" | "),
        secondary_of: r.origin === "quoted" ? r.quoted_from ?? src : null,
      },
    });
    rows++;
  }
}
for (const inst of byId.values()) {
  const [model, name] = inst.instance_id.split("/");
  fs.mkdirSync(path.join(TDL_DIR, model), { recursive: true });
  fs.writeFileSync(path.join(TDL_DIR, model, `${name}.json`), JSON.stringify(inst, null, 2) + "\n");
}
console.log(`thermodynamic limit: ${rows} rows on ${byId.size} instances from ${PASSES.length} pass(es)`);
