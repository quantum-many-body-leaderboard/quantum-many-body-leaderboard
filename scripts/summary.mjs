// Recompute data/_summary.json from the final data tree. It runs after every add_* and
// apply_* script in build.sh and is the file's only writer, so the counts describe what is
// on disk. Also exports collect(), classBest(), lowestOf() and rowId() to the other scripts.
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { recordEligible, approximateEligible, exactEligible, classEligible, belowExact, tiedAt2Sigma, BEST_CLASSES, isSampled, noErrorMetrics, publishedMethod, methodLabel } from "./units.mjs";

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

// What an instance shows (RULES.md 6, since 2026-10-22): its exact energy where it has one,
// then one best value per bound type. Eligibility is defined once, in units.mjs.
//   exact         the most precise eligible exact row (exactRecordOf), or null
//   variational, projected, extrapolated, approximate
//                 the lowest row of that class that is unflagged (6.1) and not caught by the
//                 automatic flag (6.2), or null
//   ties          row -> class, for every other eligible row that ties its class's best at 2 sigma
//   below         the rows the automatic flag catches, lowest first
// Memoised per instance object: every surface asks it many times per build.
const BEST = new WeakMap();
export function classBest(inst) {
  if (BEST.has(inst)) return BEST.get(inst);
  const exact = exactRecordOf(inst);
  const sorted = [...inst.rows].sort((a, b) => a.energy - b.energy);
  const below = sorted.filter(r => belowExact(r, exact));
  const out = { exact, ties: new Map(), below };
  for (const c of BEST_CLASSES) {
    const eligible = sorted.filter(r => r.bound_type === c && classEligible(r) && !below.includes(r));
    out[c] = eligible[0] ?? null;
    for (const r of eligible.slice(1)) if (tiedAt2Sigma(r, eligible[0])) out.ties.set(r, c);
  }
  BEST.set(inst, out);
  return out;
}

// The values an instance shows, in order: [label, row], the exact energy first. Empty where
// every row is flagged or none has a class; noBestKey says which.
export function shownBest(inst) {
  const b = classBest(inst);
  return [...(b.exact ? [["exact", b.exact]] : []), ...BEST_CLASSES.filter(c => b[c]).map(c => [`best ${c}`, b[c]])];
}

// The label of a row that is one of the values its instance shows ("exact", "best
// projected"), else null.
export function bestTagOf(inst, r) {
  return shownBest(inst).find(([, x]) => x === r)?.[0] ?? null;
}

// The exact energy, else the lowest unflagged non-exact energy (an approximate one only where
// nothing else qualifies): what was the record until 2026-10-22. RULES.md 7's aggregates, the
// estimate beside a QMBL: Open Problems target and the figure lines through the lowest energy
// at each size read it; no surface labels it a record.
export function lowestOf(inst) {
  return exactRecordOf(inst) ?? lowestEnergyOf(inst);
}
// The aggregate figures (figures.mjs) and QMBL: Open Problems import it under its old name.
export const recordOf = lowestOf;

// The most precise eligible exact row: exact rows are estimates of one number, so precision
// orders them first. Exact diagonalization (no error bar) outranks sign-problem-free QMC, and
// a smaller error bar outranks a larger one; then the energy orders them. Two exact rows that
// disagree beyond their stated precision are a defect to raise on the row.
export function exactRecordOf(inst) {
  return inst.rows.filter(exactEligible)
    .sort((a, b) => (a.sigma ?? 0) - (b.sigma ?? 0) || a.energy - b.energy)[0] ?? null;
}

// Lowest unflagged energy that is not exact (variational, projected or extrapolated; an
// approximate row only where nothing else qualifies). The family counts use only instances
// without an exact row (RULES.md 7).
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
    // The aggregates of RULES.md 7, read off lowestOf (the record before 2026-10-22).
    // held_by_exact: the instance is solved. held_by_variational / _projected / _extrapolated:
    // no exact row, so the lowest unflagged energy, and this is its kind.
    // The none_* keys say why an instance has neither, in the order they are tested.
    records: { held: 0, held_by_exact: 0, held_by_variational: 0, held_by_projected: 0, held_by_extrapolated: 0, held_by_approximate: 0,
      none_flagged: 0, none_sector_only: 0, none_unclassified: 0, none_no_rows: 0 },
    // Unflagged sampled energies published without an error bar. They rank like any other
    // row (RULES.md 6); an error bar would let close results share a rank.
    sampled_no_sigma: { rows: 0, instances: 0 },
    // What the instances show (RULES.md 6): how many have an exact energy and a best value of
    // each class, how many rows tie a best at 2 sigma, how many rows the automatic flag
    // catches (6.2), and how many instances show nothing (none_*, as for records).
    best: { exact: 0, variational: 0, projected: 0, extrapolated: 0, approximate: 0, ties: 0, below_exact: 0,
      none_flagged: 0, none_sector_only: 0, none_unclassified: 0, none_no_rows: 0 },
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
    const b = classBest(inst);
    if (b.exact) s.best.exact++;
    for (const c of BEST_CLASSES) if (b[c]) s.best[c]++;
    s.best.ties += b.ties.size;
    s.best.below_exact += b.below.length;
    if (!shownBest(inst).length) s.best[`none_${noRecordKey(inst)}`]++;
    const rec = lowestOf(inst);
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

// Why an instance shows nothing, as a key into summary.best (and summary.records). Every
// unflagged row that is not a sector-resolved exact one is shown or ranked, so only flags and
// missing rows leave an instance without. readme_table.mjs turns the key into the cell text.
export function noRecordKey(inst) {
  if (inst.rows.some(r => r.defect)) return "flagged";
  if (inst.rows.some(r => r.bound_type === "exact")) return "sector_only";
  if (inst.rows.some(r => !r.bound_type)) return "unclassified";
  return "no_rows";
}

// Side effect only when run directly: readme_table.mjs imports collect/classBest/summarize
// from here, and an import must not rewrite data/_summary.json.
if (process.argv[1] && import.meta.url === `file://${path.resolve(process.argv[1])}`) {
  const summary = summarize(collect());
  fs.writeFileSync("data/_summary.json", JSON.stringify(summary, null, 2) + "\n");
  console.log(JSON.stringify(summary, null, 2));
}
