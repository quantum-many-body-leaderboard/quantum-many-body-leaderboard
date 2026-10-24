// Rows from passes/rows/sweep-rows-YYYY-MM-DD[-label].json (SWEEP.md, "Pass files"), applied
// in file-name order. Each row is a per-site reading; this script converts energy, error bar and
// variance into the instance's stored convention (units.mjs), creates an instance from a row's
// `create` header where needed, and appends. The date names the pass in each row's `source`
// (sweep-allresults-<date>) and in `verified.checked_on`. A value the instance already carries,
// from an earlier pass or build step, is skipped and counted.
import fs from "node:fs";
import { perSiteDivisor, expectedDof, expectedEinf, vScore } from "./units.mjs";
import { family } from "./views.mjs";

const DIR = "passes/rows";
const PASSES = fs.readdirSync(DIR).filter(f => /^sweep-rows-\d{4}-\d{2}-\d{2}(-[a-z0-9]+)?\.json$/.test(f)).sort()
  .map(f => ({ file: f, date: f.slice(11, 21), rows: JSON.parse(fs.readFileSync(`${DIR}/${f}`, "utf8")) }));
const REASON = {
  variational: "variational ansatz at a stated size; energy is an upper bound (assigned during source reading)",
  extrapolated: "zero-variance or bond-dimension extrapolation; not an upper bound (assigned during source reading)",
  projected: "projection (GFMC/fixed-node) on a trial state; not a strict variational bound (assigned during source reading)",
  exact: "numerically exact reference as stated by the source (assigned during source reading)",
  approximate: "built on a fixed approximation (RPA, MP2, channel-truncated CC, or a transcorrelated Hamiltonian with its three-body term dropped); error of unknown sign (RULES.md 4; assigned during source reading)",
};
// Track 2 (the electron gas, RULES.md 12.4): every extrapolation there is one to the complete
// basis, and a projected basis-set method is coupled cluster, not a projection on a trial state.
const TRACK2_REASON = {
  extrapolated: "complete-basis-set extrapolation (1/M → 0); not an upper bound (RULES.md 12.4; assigned during source reading)",
  projectedCC: "coupled cluster in a finite basis: not variational, projected (RULES.md 12.4; assigned during source reading)",
};
const reasonFor = (r, inst) => {
  if (!/^HEG/.test(inst.model)) return REASON[r.bound_type];
  if (r.bound_type === "extrapolated") return TRACK2_REASON.extrapolated;
  // The name before any bracket: a caption quoted there can mention coupled cluster.
  if (r.bound_type === "projected" && family(r.method.split(/ [[(]/)[0]) === "FCIQMC / CC") return TRACK2_REASON.projectedCC;
  return REASON[r.bound_type];
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
  for (const r0 of rows) {
    // A source whose Hamiltonian is the instance's times a factor (couplings normalised to |K| = 1,
    // Jd = 1 or t = 1, RULES.md 2.1, 2026-10-21) prints energies times that factor: `scale` is the
    // factor, and the row keeps it with the source's own couplings in `normalised`.
    const k = r0.scale ?? 1;
    const r = k === 1 ? r0 : { ...r0, eps: r0.eps / k, tol: r0.tol / Math.abs(k), sigma_per_site: r0.sigma_per_site == null ? null : r0.sigma_per_site / Math.abs(k),
      var_per_site: r0.var_per_site == null ? null : r0.var_per_site / (k * k),
      precision_per_site: r0.precision_per_site == null ? null : r0.precision_per_site / Math.abs(k) };
    // A source without an arXiv version is named by its DOI (doi:...), and a pass row may say how
    // it was read (read_method) where that was not the arXiv text (Tanatar & Ceperley 1989: the
    // publisher PDF's text layer, checked against the page image).
    const src = r.arxiv ? `arXiv:${r.arxiv}` : `doi:${r.doi}`, srcKey = r.arxiv ?? r.doi;
    if (!srcKey) throw new Error(`${id}: pass row without arxiv or doi`);
    // A quoted exact value rounded to its error bar is the exact row already carried; any other
    // quoted value repeats a stored row only to its printed digits (Kochkov et al.'s -0.5022(4)
    // is not the 2048-state DMRG row 3e-4 away). A row flagged same_value_distinct_method is a second
    // method of the same paper that printed the same value (Marino et al.'s stripe and uniform states
    // at t' = 0.25), so the same-paper test does not apply to it. A row flagged independent_exact
    // is a source's own calculation of an exact energy the instance already carries (RULES.md 6:
    // every published calculation of the exact energy is a row), so neither the same-method nor the
    // exact-against-exact test applies to it; a copy of another source's value stays out.
    const indep = r.independent_exact && r.origin === "own" && r.bound_type === "exact";
    const dup = inst.rows.find(x => Math.abs(x.energy / div - r.eps) <=
      (r.origin === "quoted" && r.bound_type === "exact" ? Math.max(r.tol, r.sigma_per_site ?? 0) : r.tol) &&
      ((r.origin === "quoted" && x.bound_type === r.bound_type) || (!indep && x.method === r.method) ||
       (!r.same_value_distinct_method && ((x.reference || "").includes(srcKey) || (x.verified?.note || "").includes(srcKey))) || (!indep && x.bound_type === "exact" && r.bound_type === "exact")));
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
      // A reading may state why its class holds where the generic reason does not fit (the isoTNS
      // rows of arXiv:2112.08394; the Eq. 15 estimate of arXiv:cond-mat/0606659, ruled 2026-10-24).
      method: r.method, bound_type: r.bound_type, bound_type_reason: r.bound_type_reason ?? reasonFor(r, inst),
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
    if (k !== 1) row.normalised = { factor: k, source_couplings: r.source_couplings,
      note: `the source's Hamiltonian is ${k} times the instance's; its printed energy (reported_as) is divided by ${k}` };
    if (r.compute) row.compute = r.compute;
    // The row's own code, as its source prints it, with where it was read (DATA.md, "The code
    // behind a row"); add_code_links.mjs adds to it.
    if (r.artifacts) row.artifacts = r.artifacts;
    // One unit in the last printed digit, read per site and stored in the instance's units
    // (DATA.md): it orders exact rows that print no error bar (RULES.md 6).
    if (r.precision_per_site != null) row.precision = +(r.precision_per_site * Math.abs(div)).toPrecision(6);
    inst.rows.push(row);
    added++;
  }
  fs.writeFileSync(p, JSON.stringify(inst, null, 2) + "\n");
}
}
console.log(`added ${added} all-results rows, ${PASSES.length} pass${PASSES.length === 1 ? "" : "es"} (${PASSES.map(p => p.date).join(", ")}); ${created} new instances; ${skipped.length} already on their instance`);
if (process.env.QMBL_VERBOSE) skipped.forEach(s => console.log("  dup", s));
