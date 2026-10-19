// Recompute data/_summary.json from the final data tree. It runs after every add_* and
// apply_* script in build.sh and is the file's only writer, so the counts describe what is
// on disk. Also exports collect(), recordOf() and rowId() to the other scripts.
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { recordEligible, approximateEligible, exactEligible, isSampled, noErrorMetrics, publishedMethod, methodLabel } from "./units.mjs";

export function collect() {
  const instances = [];
  for (const m of fs.readdirSync("data")) {
    const dir = path.join("data", m);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const f of fs.readdirSync(dir))
      instances.push(JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));
  }
  return instances.sort((a, b) => a.instance_id.localeCompare(b.instance_id));
}

// A row's anchor id: the instance id, sanitised, and a hash of what the row claims. The
// table page puts it on the row and the committed figures link their marks to it. A position
// in the file would shift every later link when a row is added or removed; a hash moves only
// with the row itself, and a figure older than its data then links an id no row has, which
// site.mjs refuses to build. Identical rows would share a hash, so a repeat is numbered in
// file order. The hash uses the published method string, so a change of short name keeps the id.
const rowKey = r => `${r.energy}|${publishedMethod(r)}|${r.reference}`;
export function rowId(inst, r) {
  const key = rowKey(r), repeat = inst.rows.filter(x => rowKey(x) === key).indexOf(r);
  const hash = createHash("sha1").update(key).digest("hex").slice(0, 8);
  return `r-${inst.instance_id.replace(/[^\w-]/g, "_")}-${hash}${repeat > 0 ? `-${repeat + 1}` : ""}`;
}

// The record for an instance (RULES.md 6). Eligibility is defined once, in units.mjs.
// Returns null where no row qualifies; summarize() counts why.
export function recordOf(inst) {
  return exactRecordOf(inst) ?? lowestEnergyOf(inst);
}

// The most precise eligible exact row: exact rows are estimates of one number, so precision
// orders them first. Exact diagonalization (no error bar) outranks sign-problem-free QMC, and
// a smaller error bar outranks a larger one; then the energy orders them. Two exact rows that
// disagree beyond their stated precision are a defect to raise on the row.
export function exactRecordOf(inst) {
  return inst.rows.filter(exactEligible)
    .sort((a, b) => (a.sigma ?? 0) - (b.sigma ?? 0) || a.energy - b.energy)[0] ?? null;
}

// Lowest unflagged energy that is not exact (variational, projected or extrapolated; an
// approximate row only where nothing else qualifies): the record where no exact row exists,
// and the closest challenger where one does. The family counts use only instances where this
// is the record (RULES.md 7).
export function lowestEnergyOf(inst) {
  const sorted = [...inst.rows].sort((a, b) => a.energy - b.energy);
  return sorted.find(recordEligible) ?? sorted.find(approximateEligible) ?? null;
}

export function summarize(instances) {
  const s = {
    instances: instances.length, rows: 0,
    // The sector minima in an instance's `spectrum` (DATA.md) are levels, not results:
    // `rows` and every count by row leave them out, and they are counted here alone.
    spectrum_entries: 0,
    by_bound: {}, by_source: {}, by_provenance: {},
    vscore_rows: 0, no_variance: 0, no_sigma: 0, no_error_metrics: 0, flagged: 0,
    // Rows VarBench computed itself (RULES.md 8.2), and the subset of those that hold the
    // record of an unsolved instance: no published energy there is lower. VarBench's own
    // exact diagonalizations are baseline rows too, but solved instances are not counted.
    baseline_rows: 0, baseline_records: 0,
    // held_by_exact: the instance is solved and the exact energy is the record.
    // held_by_variational / _projected / _extrapolated: no exact row, so the lowest
    // unflagged energy is, and this is its kind.
    // The none_* keys say why an instance has neither, in the order they are tested.
    records: { held: 0, held_by_exact: 0, held_by_variational: 0, held_by_projected: 0, held_by_extrapolated: 0, held_by_approximate: 0,
      none_flagged: 0, none_sector_only: 0, none_unclassified: 0, none_no_rows: 0 },
    // Unflagged sampled energies published without an error bar. They rank like any other
    // row (RULES.md 6); an error bar would let close results share a rank.
    sampled_no_sigma: { rows: 0, instances: 0 },
    needs_review: [],
  };
  for (const inst of instances) {
    s.spectrum_entries += inst.spectrum?.length ?? 0;
    for (const r of inst.rows) {
      s.rows++;
      const key = r.bound_type || "needs-review";
      s.by_bound[key] = (s.by_bound[key] || 0) + 1;
      s.by_source[r.source] = (s.by_source[r.source] || 0) + 1;
      s.by_provenance[r.provenance] = (s.by_provenance[r.provenance] || 0) + 1;
      if (r.v_score != null) s.vscore_rows++;
      if (r.energy_variance == null || Number.isNaN(r.energy_variance)) s.no_variance++;
      if (r.sigma == null || Number.isNaN(r.sigma)) s.no_sigma++;
      if (noErrorMetrics(r)) s.no_error_metrics++;
      if (r.baseline) s.baseline_rows++;
      if (r.defect) s.flagged++;
      if (!r.bound_type) s.needs_review.push(`${inst.instance_id}: "${methodLabel(r)}"`);
    }
    const rec = recordOf(inst);
    const noSigmaHere = inst.rows.filter(r => r.bound_type !== "exact" && !r.defect && isSampled(r) && r.sigma == null).length;
    s.sampled_no_sigma.rows += noSigmaHere;
    if (noSigmaHere) s.sampled_no_sigma.instances++;

    if (rec) {
      s.records.held++;
      s.records[`held_by_${rec.bound_type}`]++;
      if (rec.baseline && rec.bound_type !== "exact") s.baseline_records++;
      continue;
    }
    // Same order as noRecordReason() in readme_table.mjs.
    s.records[`none_${noRecordKey(inst)}`]++;
  }
  return s;
}

// Why an instance has no record, as a key into summary.records. Every unflagged row that is
// not a sector-resolved exact one can hold it, so only flags and missing rows leave an
// instance without. readme_table.mjs turns the key into the cell text.
export function noRecordKey(inst) {
  if (inst.rows.some(r => r.defect)) return "flagged";
  if (inst.rows.some(r => r.bound_type === "exact")) return "sector_only";
  if (inst.rows.some(r => !r.bound_type)) return "unclassified";
  return "no_rows";
}

// Side effect only when run directly: readme_table.mjs imports collect/recordOf/summarize
// from here, and an import must not rewrite data/_summary.json.
if (process.argv[1] && import.meta.url === `file://${path.resolve(process.argv[1])}`) {
  const summary = summarize(collect());
  fs.writeFileSync("data/_summary.json", JSON.stringify(summary, null, 2) + "\n");
  console.log(JSON.stringify(summary, null, 2));
}
