// Rows from passes/rows/sweep-rows-YYYY-MM-DD[-label].json (SWEEP.md, "Pass files"), applied
// in file-name order. Each row is a per-site reading; this script converts energy, error bar and
// variance into the instance's stored convention (units.mjs), creates an instance from a row's
// `create` header where needed, and appends. The date names the pass in each row's `source`
// (sweep-allresults-<date>) and in `verified.checked_on`. A value the instance already carries,
// from an earlier pass or build step, is skipped and counted.
import fs from "node:fs";
import { perSiteDivisor, expectedDof, expectedEinf, vScore } from "./units.mjs";

const DIR = "passes/rows";
const PASSES = fs.readdirSync(DIR).filter(f => /^sweep-rows-\d{4}-\d{2}-\d{2}(-[a-z0-9]+)?\.json$/.test(f)).sort()
  .map(f => ({ file: f, date: f.slice(11, 21), rows: JSON.parse(fs.readFileSync(`${DIR}/${f}`, "utf8")) }));
const REASON = {
  variational: "variational ansatz at a stated size; energy is an upper bound (assigned during source reading)",
  extrapolated: "zero-variance or bond-dimension extrapolation; not an upper bound (assigned during source reading)",
  projected: "projection (GFMC/fixed-node) on a trial state; not a strict variational bound (assigned during source reading)",
  exact: "numerically exact reference as stated by the source (assigned during source reading)",
};

let added = 0, created = 0;
const skipped = [];
for (const pass of PASSES) {
const CHECKED = pass.date;
const byInst = {};
for (const r of pass.rows) (byInst[r.instance_id] ||= []).push(r);
for (const [id, rows] of Object.entries(byInst)) {
  const p = `data/${id}.json`;
  // A row can name an instance QMBL does not have yet (a torus or strip a primary table covers
  // and VarBench never defined); it then carries the header to create, in VarBench's naming.
  const create = rows.find(r => r.create)?.create;
  if (!fs.existsSync(p) && !create) { console.log(`MISS instance ${id}`); continue; }
  const inst = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : { ...create, instance_id: id, rows: [] };
  if (!fs.existsSync(p)) { created++; fs.mkdirSync(`data/${id.split("/")[0]}`, { recursive: true }); }
  const div = perSiteDivisor(inst);
  const dof = expectedDof(inst) ?? inst.rows[0]?.dof ?? null;
  const einf = expectedEinf(inst) ?? inst.rows[0]?.einf ?? null;
  for (const r of rows) {
    // A source without an arXiv version is named by its DOI (doi:...), and a pass row may say how
    // it was read (read_method) where that was not the arXiv text (Tanatar & Ceperley 1989: the
    // publisher PDF's text layer, checked against the page image).
    const src = r.arxiv ? `arXiv:${r.arxiv}` : `doi:${r.doi}`, srcKey = r.arxiv ?? r.doi;
    if (!srcKey) throw new Error(`${id}: pass row without arxiv or doi`);
    // A quoted exact value rounded to its error bar is the exact row already carried; any other
    // quoted value repeats a stored row only to its printed digits (Kochkov et al.'s -0.5022(4)
    // is not the 2048-state DMRG row 3e-4 away). A row flagged same_value_distinct_method is a second
    // method of the same paper that printed the same value (Marino et al.'s stripe and uniform states
    // at t' = 0.25), so the same-paper test does not apply to it.
    const dup = inst.rows.find(x => Math.abs(x.energy / div - r.eps) <=
      (r.origin === "quoted" && r.bound_type === "exact" ? Math.max(r.tol, r.sigma_per_site ?? 0) : r.tol) &&
      ((r.origin === "quoted" && x.bound_type === r.bound_type) || x.method === r.method ||
       (!r.same_value_distinct_method && ((x.reference || "").includes(srcKey) || (x.verified?.note || "").includes(srcKey))) || (x.bound_type === "exact" && r.bound_type === "exact")));
    if (dup) { skipped.push(`${id} ${r.reported_as} [${srcKey}] = "${dup.method.slice(0, 40)}"`); continue; }
    const energy = +(r.eps * div).toPrecision(12);
    // sigma^2/N_site as printed; totals scale with the site count. A relative
    // variance (<E^2>-<E>^2)/<E>^2 is dimensionless, so it converts with the stored energy itself.
    const varTot = r.var_rel != null ? +(r.var_rel * energy * energy).toPrecision(8)
      : r.var_per_site == null ? null : +(r.var_per_site * inst.n_sites).toPrecision(8);
    const row = {
      energy, sigma: r.sigma_per_site == null ? null : +(r.sigma_per_site * Math.abs(div)).toPrecision(6),
      energy_variance: varTot, dof, einf,
      v_score: varTot == null ? null : vScore(varTot, dof, energy, einf),
      method: r.method, bound_type: r.bound_type, bound_type_reason: REASON[r.bound_type],
      reference: r.reference, peer_reviewed: r.peer_reviewed,
      source: `sweep-allresults-${CHECKED}`, provenance: r.origin === "own" ? "primary" : "secondary",
      verified: {
        checked_on: CHECKED,
        method: `${r.read_method ? `${src}: ${r.read_method}` : `source text of ${src} read locally (arXiv HTML or pypdf layout text); value copied from the harvested cell and the text, no LLM transcription of numbers`}; ${r.verified_by}`,
        reported_as: r.reported_as,
        note: [r.evidence, r.convention_check, r.variance_as_reported != null && r.var_per_site == null
          ? `variance reported as ${r.variance_as_reported}, not stored: convention not verified` : ""].filter(Boolean).join(" | "),
        secondary_of: r.origin === "quoted" ? src : null,
      },
    };
    if (r.compute) row.compute = r.compute;
    inst.rows.push(row);
    added++;
  }
  fs.writeFileSync(p, JSON.stringify(inst, null, 2) + "\n");
}
}
console.log(`added ${added} all-results rows, ${PASSES.length} pass${PASSES.length === 1 ? "" : "es"} (${PASSES.map(p => p.date).join(", ")}); ${created} new instances; ${skipped.length} already on their instance`);
if (process.env.QMBL_VERBOSE) skipped.forEach(s => console.log("  dup", s));
