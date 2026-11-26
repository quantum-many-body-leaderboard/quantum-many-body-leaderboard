// Apply corrections.mjs and verifications.mjs to the built rows. Runs after apply_relabels.mjs,
// apply_defects.mjs and apply_removals.mjs, whose matches are written against the uncorrected
// values, and before apply_method_names.mjs and validate.mjs, which must see the corrected ones.
//
// Every entry is matched against the rows as they stand before this script changes anything,
// so two corrections on one row (say energy and sigma) both match the original energy.
import fs from "node:fs";
import { CORRECTIONS } from "./corrections.mjs";
import { VERIFICATIONS } from "./verifications.mjs";
import { vScore, publishedMethod, isSampled } from "./units.mjs";

const FIELDS = new Set(["energy", "sigma", "energy_variance", "dof", "einf", "method", "bound_type", "reference", "peer_reviewed", "provenance", "baseline", "sampled", "defect", "quote_shown"]);
// Fields inside a block another script writes: a compute pass's statement (add_compute.mjs) and a
// verification's note. A pass that is read again rewrites its block, so an entry here states what it
// replaces, `from`, or for text the one passage it rewrites, `edit: [old, new]`. The build stops
// when the block no longer holds that value, so a newer reading is never overwritten unseen. A
// correction never creates a block: only a compute pass adds a statement.
const NESTED = {
  compute: new Set(["parameters", "gpu_hours", "device", "n_devices", "samples", "wall_clock", "cpu_core_hours",
    "bond_dimension", "iterations", "reported_as", "source", "scope", "confidence", "note"]),
  // secondary_of names the paper a quoted number was read in; a new reading may find that paper
  // produced it (it is then the row's reference, and the reading was of the primary source)
  verified: new Set(["note", "secondary_of", "method", "location", "reported_as", "conversion"]),
};
// Text deeper in the record, edited with `edit: [old, new]` only (a passage of a sentence, never a
// whole value): the second and journal readings of a verification (written by verifications.mjs
// in this script), the earlier entries of a row's `corrections` (written by this script, so
// addressed as corrections.<index>.<field>, the index counting the row's list before any late entry
// adds to it), and the instance's own relabelled and cluster text. These are LATE: applied after
// every other entry of the instance, when the verifications and the earlier corrections have
// written the text they rewrite. The edit leaves its own record, with the old and the new text,
// on the row (the instance, for instance text); the earlier record is not rewritten in place.
const READINGS = new Set(["second_read", "journal_read"]);
const READING_TEXT = new Set(["note", "reported_as", "location", "conversion", "version_read", "reason", "evidence"]);
const CORRECTION_TEXT = new Set(["reason", "location", "reported_as", "conversion", "version_read", "to"]);
const INSTANCE_TEXT = { relabelled: new Set(["reason", "evidence"]) };
const isLate = path => path.length > 2 || (path[0] === "verified" && !["note", "secondary_of"].includes(path[1]));
const validPath = path => {
  const [a, b, c] = path;
  if (path.length === 1) return FIELDS.has(a) || INSTANCE_FIELDS.has(a);
  if (path.length === 2) return NESTED[a]?.has(b) || INSTANCE_TEXT[a]?.has(b);
  if (path.length === 3) return (a === "verified" && READINGS.has(b) && READING_TEXT.has(c)) || (a === "corrections" && /^\d+$/.test(b) && CORRECTION_TEXT.has(c));
  return false;
};
// The instance's own definition (RULES.md 2): the entry's match names the instance alone, states the
// value it replaces, and that value stays on the instance, in its `corrections`.
// `cluster` and `relabelled.*` are instance text, edited as a passage only.
const INSTANCE_FIELDS = new Set(["params", "cluster", "relabelled"]);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const entries = [
  ...CORRECTIONS.map(e => ({ kind: "correction", ...e })),
  ...VERIFICATIONS.map(e => ({ kind: "verified", ...e })),
];

const byInstance = new Map();
for (const e of entries) {
  if (e.kind === "correction") {
    const path = e.field.split(".");
    if (!validPath(path))
      throw new Error(`correction on unknown field "${e.field}" (${e.match.instance})`);
    if (e.edit !== undefined && !(Array.isArray(e.edit) && e.edit.length === 2 && e.edit.every(s => typeof s === "string" && s) && !("to" in e)))
      throw new Error(`edit is [old passage, new passage] and replaces to (${e.match.instance} ${e.field})`);
    if ((path.length > 1 || INSTANCE_FIELDS.has(e.field)) && !("from" in e) && e.edit === undefined)
      throw new Error(`${e.field} states what it replaces: from, or edit for a passage of text (${e.match.instance})`);
    if ((path.length > 2 || ["relabelled", "cluster"].includes(path[0])) && e.edit === undefined)
      throw new Error(`${e.field} is text edited by a passage: edit [old, new] (${e.match.instance})`);
    if (INSTANCE_FIELDS.has(path[0]) !== (e.match.method === undefined))
      throw new Error(`${e.field}: ${INSTANCE_FIELDS.has(path[0]) ? "an instance field is matched by the instance alone" : "a row is matched by its method string"} (${e.match.instance})`);
  }
  // A flag is lifted by correcting `defect` to null, so the lift is recorded on the row
  // (RULES.md 10). Anything else about a defect belongs in defects.mjs.
  if (e.kind === "correction" && e.field === "defect" && e.to !== null)
    throw new Error(`defect may only be corrected to null (${e.match.instance})`);
  // `sampled` states whether the energy is a Monte Carlo estimate (RULES.md 6): yes or no.
  if (e.kind === "correction" && e.field === "sampled" && typeof e.to !== "boolean")
    throw new Error(`sampled may only be corrected to true or false (${e.match.instance})`);
  // `quote_shown` keeps a quoted row's note in the source cell (DATA.md): its one value is "cell".
  if (e.kind === "correction" && e.field === "quote_shown" && e.to !== "cell")
    throw new Error(`quote_shown may only be set to "cell" (${e.match.instance})`);
  if (!byInstance.has(e.match.instance)) byInstance.set(e.match.instance, []);
  byInstance.get(e.match.instance).push(e);
}

let corrected = 0, verified = 0, miss = 0;
for (const [id, list] of byInstance) {
  const p = `data/${id}.json`;
  if (!fs.existsSync(p)) { console.log(`MISS instance ${id}`); miss += list.length; continue; }
  const inst = JSON.parse(fs.readFileSync(p, "utf8"));
  // resolve every match first, on the unmodified rows; an instance field resolves to the instance
  const resolved = list.map(e => [e, INSTANCE_FIELDS.has(e.field?.split(".")[0]) ? [inst] : inst.rows.filter(r =>
    publishedMethod(r) === e.match.method && (e.match.energy == null || Math.abs(r.energy - e.match.energy) < 1e-9))]);
  // A row has no `sampled` until an entry states it; what the entry replaces is the verdict
  // the row had, i.e. its method string's, read before a `method` entry can change the string.
  const sampledBefore = new Map(inst.rows.map(r => [r, isSampled(r)]));
  // late entries (isLate) go after every other entry of the instance, the verifications included
  const late = e => e.kind === "correction" && isLate(e.field.split("."));
  for (const [e, rows] of [...resolved.filter(([e]) => !late(e)), ...resolved.filter(([e]) => late(e))]) {
    if (rows.length !== 1) { console.log(`MISS ${rows.length} rows match ${id} "${e.match.method}" ${e.match.energy ?? ""}`); miss++; continue; }
    const [r] = rows;
    const { match, kind, ...rec } = e;
    if (kind === "correction") {
      const path = e.field.split("."), name = path.pop();
      const holder = path.reduce((h, k) => h?.[k], r);
      const block = path.join(".");
      const from = e.field === "sampled" ? sampledBefore.get(r) : holder?.[name];
      const parts = e.edit && typeof from === "string" ? from.split(e.edit[0]) : null;
      const stale = !holder ? `no ${block} block`
        : e.edit ? (parts?.length !== 2 ? `the passage to rewrite is not in it exactly once: "${e.edit[0].slice(0, 60)}"` : null)
        : "from" in e && !same(from, e.from) ? `holds ${JSON.stringify(from)?.slice(0, 80)}, the entry replaces ${JSON.stringify(e.from)?.slice(0, 80)}` : null;
      if (stale) { console.log(`MISS ${id} "${e.match.method ?? ""}" ${e.match.energy ?? ""} ${e.field}: ${stale}`); miss++; continue; }
      const to = parts ? parts.join(e.edit[1]) : e.to;
      r.corrections = [...(r.corrections || []), { ...rec, from, ...(parts ? { to } : {}) }];
      holder[name] = to;
      if (e.field === "bound_type") r.bound_type_reason = `corrected: ${e.reason}`;
      corrected++;
      if (r === inst) continue;
    } else {
      // a reading of the published version (RULES.md 8) sits beside the earlier readings, never over them
      const { journal, ...read } = rec;
      if (journal && r.verified) r.verified.journal_read = read;
      else if (journal) r.verified = { ...read, secondary_of: null };
      else if (r.verified && r.provenance !== "imported") r.verified.second_read = rec;
      else r.verified = { ...rec, secondary_of: null };
      verified++;
    }
    // v_score is derived, never supplied (DATA.md): recompute from the row's final inputs
    r.v_score = vScore(r.energy_variance, r.dof, r.energy, r.einf);
  }
  fs.writeFileSync(p, JSON.stringify(inst, null, 2) + "\n");
}
console.log(`corrected ${corrected} fields, verified ${verified} rows, ${miss} unmatched`);
if (miss) process.exit(1);
