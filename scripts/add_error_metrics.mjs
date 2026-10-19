// Attach an error bar or an energy variance to a row imported without one, from
// passes/error-metrics/error-metrics-YYYY-MM-DD.json (DATA.md, the `error_metrics` block).
// `measured_by` is "authors" (the authors' data release, or files they sent, committed under
// sources/) or "qmbl" (measured on the checkpoint the authors published, with their network and
// sampler). `reported_as` must be found verbatim in `source_file` (parts separated by " | ").
// A number is attached only where the source's energy agrees with the row's within 2 combined
// sigma. A field the row already carries is never overwritten; a later pass replaces an earlier
// pass's block whole. The row's `energy` stays what the paper prints.
//
// variance_convention values, converted here (spin models store Pauli totals, so an S.S
// variance of the total energy is x16):
//   var_total_pauli   Var(H) of the stored total energy (spin models)
//   var_as_stored     Var(H) of the total energy in the instance's stored convention, any
//                     model (Hubbard stores totals as printed, so no factor applies)
//   var_total_SS      Var(H) in S.S units
//   var_over_n_SS     Var(H)/N in S.S units, the "rescaled energy variance sigma^2/N"
//   var_over_n2_SS    Var(H)/N^2 in S.S units, the variance of the local energy per site
//   v_score           N Var(H) / E^2 (einf = 0), converted with the source's own energy
import fs from "node:fs";
import path from "node:path";
import { SPIN_MODELS, perSiteDivisor, vScore } from "./units.mjs";

const DIR = "passes/error-metrics";
const PASSES = fs.readdirSync(DIR).filter(f => /^error-metrics-\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
const MEASURED_BY = new Set(["authors", "qmbl"]);

function varianceTotal(e, inst) {
  if (e.variance == null) return null;
  const n = inst.n_sites;
  const toPauli = SPIN_MODELS.has(inst.model) && inst.model !== "TFIsing" ? 16 : null;
  switch (e.variance_convention) {
    case "var_total_pauli": return SPIN_MODELS.has(inst.model) ? e.variance : null;
    case "var_as_stored": return e.variance;
    case "var_total_SS": return toPauli && e.variance * toPauli;
    case "var_over_n_SS": return toPauli && e.variance * n * toPauli;
    case "var_over_n2_SS": return toPauli && e.variance * n * n * toPauli;
    case "v_score": return inst.model !== "TFIsing" && SPIN_MODELS.has(inst.model)
      ? e.variance * (e.source_energy_per_site * perSiteDivisor(inst)) ** 2 / n : null;
    default: return undefined;
  }
}

const instances = new Map();
for (const m of fs.readdirSync("data")) {
  const dir = path.join("data", m);
  if (!fs.statSync(dir).isDirectory()) continue;
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const inst = JSON.parse(fs.readFileSync(p, "utf8"));
    instances.set(inst.instance_id, { path: p, inst, dirty: false });
  }
}

let attached = 0;
const problems = [];
for (const file of PASSES) {
  const date = file.slice(14, 24);
  for (const e of JSON.parse(fs.readFileSync(path.join(DIR, file), "utf8"))) {
    const at = `${e.instance_id} ${e.reference_includes}`;
    if (!MEASURED_BY.has(e.measured_by)) { problems.push(`${at}: measured_by ${e.measured_by}`); continue; }
    const text = e.source_file && fs.existsSync(e.source_file) ? fs.readFileSync(e.source_file, "utf8") : null;
    if (text == null) { problems.push(`${at}: source_file ${e.source_file} missing`); continue; }
    const absent = (e.reported_as || "").split(" | ").filter(s => !s || !text.includes(s));
    if (!e.reported_as || absent.length) { problems.push(`${at}: reported_as not verbatim in ${e.source_file}: ${absent.join(" / ")}`); continue; }
    const entry = instances.get(e.instance_id);
    if (!entry) { problems.push(`${at}: no such instance`); continue; }
    const { inst } = entry;
    const div = perSiteDivisor(inst);
    const src = e.source_energy_per_site, srcSig = e.source_sigma_per_site ?? 0;
    const rows = inst.rows.filter(r => (r.reference || "").includes(e.reference_includes) && r.bound_type === "variational"
      && Math.abs(r.energy / div - src) <= 2 * Math.hypot((r.sigma ?? 0) / div, srcSig) + 1e-9);
    if (rows.length !== 1) { problems.push(`${at}: ${rows.length} rows match E/site ${src}`); continue; }
    const row = rows[0];
    const prev = row.error_metrics;
    const set = [];
    const v = varianceTotal(e, inst);
    if (v === undefined) { problems.push(`${at}: unknown variance_convention ${e.variance_convention}`); continue; }
    if (e.variance != null && v == null) { problems.push(`${at}: ${e.variance_convention} undefined for ${inst.model}`); continue; }
    if (v != null && (row.energy_variance == null || prev?.fields?.includes("energy_variance"))) {
      row.energy_variance = +v.toPrecision(8);
      row.v_score = vScore(row.energy_variance, row.dof, row.energy, row.einf);
      set.push("energy_variance");
    }
    if (e.sigma_per_site != null && (row.sigma == null || prev?.fields?.includes("sigma"))) {
      row.sigma = +(e.sigma_per_site * div).toPrecision(6);
      set.push("sigma");
    }
    if (!set.length) { problems.push(`${at}: row already carries every field this entry offers`); continue; }
    row.error_metrics = {
      fields: set, measured_by: e.measured_by, checked_on: date, source: e.source, source_file: e.source_file,
      reported_as: e.reported_as, conversion: e.variance_convention ?? null, note: e.note ?? null,
    };
    entry.dirty = true;
    attached++;
  }
}
for (const { path: p, inst, dirty } of instances.values())
  if (dirty) fs.writeFileSync(p, JSON.stringify(inst, null, 2) + "\n");
console.log(`error metrics attached to ${attached} rows from ${PASSES.length} pass(es)`);
if (problems.length) { problems.forEach(s => console.log("  !! " + s)); process.exitCode = 1; }
