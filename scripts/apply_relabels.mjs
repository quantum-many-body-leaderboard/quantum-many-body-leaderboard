// Apply scripts/relabels.mjs: move each listed instance to its corrected name, parameters and
// size, leaving behind, on an instance of their own, the rows computed at the old coupling.
// An entry with `paper_label` (ruled 2026-11-26) moves the rows whose source prints another U onto
// the instance at that label: the target already exists, written by the pass files; coverage stays on
// the instance its pass wrote it to; `to: null` moves nothing; `exact: null` adds no exact row.
//
// Runs after every script that attaches rows, compute or coverage by instance id (they use
// VarBench's names) and before the defects, removals and corrections, which use the names
// after this step. If a pass has already written to the new id, the rows are merged into it.
import fs from "node:fs";
import { RELABELS } from "./relabels.mjs";
import { expectedEinf, vScore, publishedMethod } from "./units.mjs";

const read = id => JSON.parse(fs.readFileSync(`data/${id}.json`, "utf8"));
const write = inst => fs.writeFileSync(`data/${inst.instance_id}.json`, JSON.stringify(inst, null, 2) + "\n");
let moved = 0, kept = 0, fail = 0;

for (const L of RELABELS) {
  if (!fs.existsSync(`data/${L.from}.json`)) { console.log(`MISS instance ${L.from}`); fail++; continue; }
  const inst = read(L.from);
  const isKept = r => L.keep.some(k => publishedMethod(r) === k.method && Math.abs(r.energy - k.energy) < 1e-9);
  const stay = inst.rows.filter(isKept), go = inst.rows.filter(r => !isKept(r));
  if (stay.length !== L.keep.length) { console.log(`MISS ${L.from}: ${stay.length} of ${L.keep.length} rows to keep matched`); fail++; continue; }

  const when = L.ruled ?? L.checked_on;
  if (go.length && L.to) {
    const target = fs.existsSync(`data/${L.to}.json`) ? read(L.to)
      : { ...inst, ...(L.n_sites != null ? { n_sites: L.n_sites } : {}), params: { ...inst.params, ...L.params }, instance_id: L.to, rows: [], coverage: undefined };
    const einf = expectedEinf(target);
    for (const r of go) {
      // einf follows the coupling (DATA.md); the V-score is derived from it, never supplied
      if (einf != null && r.einf != null) r.einf = einf;
      r.v_score = vScore(r.energy_variance, r.dof, r.energy, r.einf);
    }
    target.rows.push(...go);
    if (inst.coverage && !L.paper_label) target.coverage = [...(target.coverage || []), ...inst.coverage];
    target.relabelled = { from: L.from, checked_on: when, reason: L.reason, evidence: L.evidence, ...(L.paper_label ? { paper_label: true } : {}) };
    write(target);
    moved += go.length;
  } else if (go.length) { console.log(`MISS ${L.from}: ${go.length} rows to move and no target`); fail++; continue; }

  if (!stay.length) { fs.rmSync(`data/${L.from}.json`); continue; }
  const [first] = stay;
  if (L.exact) {
  const [E0, E0b] = L.exact;
  inst.rows = [...stay, {
    energy: E0, sigma: null, energy_variance: null, dof: first.dof, einf: first.einf, v_score: null,
    method: "Exact diagonalization", bound_type: "exact",
    bound_type_reason: "full-space Lanczos exact diagonalization at the instance's U, computed by QMBL",
    reference: "QMBL, checks/hubbard-u-labels/ (exact diagonalization at the coupling the rows here were run at)",
    peer_reviewed: false, source: `qmbl-verify-${L.checked_on}`, provenance: "primary", ...(L.computed_by ? { computed_by: L.computed_by } : {}),
    verified: { checked_on: L.checked_on, method: L.codes,
      reported_as: `${E0} (ed_check.py) | ${E0b} (ed_lib.mjs)`,
      note: `Two independent codes agree to ${Math.abs(E0 - E0b).toExponential(1)}. ${L.keep.map(k => `The ${k.method} row: ${k.why}`).join(" ")}`,
      secondary_of: null },
  }];
  } else inst.rows = stay;
  if (!L.paper_label) delete inst.coverage;
  if (L.to) inst.split = { to: L.to, checked_on: when,
    reason: L.paper_label ? L.reason : `Holds the rows run at U = ${inst.params.U}, the coupling in VarBench's name, after the instance moved to U = ${L.params.U}. ${L.reason}`,
    evidence: L.evidence, ...(L.paper_label ? { paper_label: true } : {}) };
  write(inst);
  kept += stay.length;
}
console.log(`relabelled ${RELABELS.length} instances: ${moved} rows moved, ${kept} rows kept at the old coupling${fail ? `, ${fail} FAILED` : ""}`);
if (fail) process.exit(1);
