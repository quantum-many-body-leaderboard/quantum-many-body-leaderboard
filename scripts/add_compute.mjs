// Attach `compute` blocks (DATA.md, "What a number cost: the `compute` block") from
// passes/compute/compute-rows-YYYY-MM-DD.json: one object per (instance, energy, reference) row,
// with the fields DATA.md specifies plus `scope`, `confidence` and `note`. Passes apply in date
// order; a later pass's block for the same row replaces the earlier one whole. A row whose paper
// states nothing gets no block.
import fs from "node:fs";
import path from "node:path";

const DIR = "passes/compute";
const PASSES = fs.readdirSync(DIR).filter(f => /^compute-rows-\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
const BLOCK = ["parameters", "gpu_hours", "device", "n_devices", "samples", "wall_clock",
  "cpu_core_hours", "bond_dimension", "iterations", "sweep_schedule", "evaluation", "vmc_schedule", "circuit_schedule",
  "reported_as", "source", "scope", "confidence", "note"];
// Statements about how the run evaluated its state, carried only where a pass read them (DATA.md).
const STATEMENTS = ["sweep_schedule", "evaluation", "vmc_schedule", "circuit_schedule"];

// A row's reference is `[paper](url)`, `[code](url)` or a citation string; the passes key
// on the url or the string, as the worklist that was read from did.
const refKey = ref => (ref || "").match(/\((https?:[^)]+)\)/)?.[1] ?? (ref || "");
// Where several rows share the energy (two sources printing one exact energy, RULES.md 6) and
// a row's citation has been completed since the pass (a journal reference added), the arXiv id
// both strings carry still names the same paper.
const arxivId = ref => (ref || "").match(/arXiv:\s*([\w.\/-]+?\d)(?:v\d+)?(?=[\s,;)]|$)/i)?.[1] ?? null;
const sameRef = (rowRef, passRef) => refKey(rowRef) === passRef ||
  (arxivId(passRef) != null && arxivId(rowRef) === arxivId(passRef));

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

let attached = 0, replaced = 0, skipped = 0;
const unmatched = [];
for (const file of PASSES) {
  const date = file.slice(13, 23);
  for (const c of JSON.parse(fs.readFileSync(path.join(DIR, file), "utf8"))) {
    // A block with no quote cannot be checked against the paper and the validator rejects
    // it; the readers left reported_as empty only where nothing applies (a Hartree-Fock
    // baseline has no run to cost).
    if (!c.reported_as) { skipped++; continue; }
    const entry = instances.get(c.instance_id);
    const rows = entry?.inst.rows.filter(r => r.energy === c.energy) ?? [];
    const row = rows.length > 1 ? rows.find(r => sameRef(r.reference, c.reference)) ?? null : rows[0] ?? null;
    if (!row) { unmatched.push(`${c.instance_id} ${c.energy} ${c.reference.slice(0, 50)}`); continue; }
    if (row.compute) replaced++; else attached++;
    const block = {};
    for (const k of BLOCK) block[k] = c[k] ?? null;
    for (const k of STATEMENTS) if (block[k] == null) delete block[k];
    if (c.arxiv) block.source = `${block.source ?? "text"}, arXiv:${c.arxiv}`;
    block.source += ` (compute pass ${date})`;
    row.compute = block;
    entry.dirty = true;
  }
}
for (const { path: p, inst, dirty } of instances.values())
  if (dirty) fs.writeFileSync(p, JSON.stringify(inst, null, 2) + "\n");

console.log(`compute blocks: ${attached} attached, ${replaced} replaced, ${skipped} rows without a statement, ${unmatched.length} unmatched`);
for (const u of unmatched) console.log(`  unmatched: ${u}`);
