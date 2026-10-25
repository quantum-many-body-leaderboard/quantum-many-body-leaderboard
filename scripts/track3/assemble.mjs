// Merge generator outputs into the held track-3 pass file and print counts and sanity checks.
import fs from "node:fs";
import { OUT_DIR, T3 } from "./common.mjs";
const args = process.argv.slice(2);
const verifyArg = args.find(a => a.startsWith("--verify="));
const pos = args.filter(a => !a.startsWith("--"));
// no positional arguments: the committed track-3 pass, from the generator outputs in OUT_DIR, with the committed verify file
const [out, heldOut, ...ins] = pos.length ? pos : [`${T3}/sweep-rows-2026-10-20-hydrogen.json`, `${T3}/held-2026-10-20-hydrogen.json`,
  ...["motta2017", "motta2020si", "hachmann", "1904", "readers"].map(n => `${OUT_DIR}/out-${n}.json`)];
const verifyPath = verifyArg ? verifyArg.slice(9) : pos.length ? null : `${T3}/verify-2026-10-24-hydrogen.json`;
let rows = [], held = [];
for (const f of ins) { const o = JSON.parse(fs.readFileSync(f, "utf8")); rows.push(...o.rows); held.push(...o.held); }
// duplicate check within the pass: same instance, same method + detail, same value
const seen = new Map(); const dups = [];
rows = rows.filter(r => { const k = `${r.instance_id}|${r.method}|${r.method_detail}|${r.eps.toFixed(7)}|${r.arxiv}`; if (seen.has(k)) { dups.push(k); return false; } seen.set(k, 1); return true; });
// verify pass (passes/track3/verify-<date>-hydrogen.json): removals, corrections (old value kept in row.corrections),
// notes and verifications, each keyed by instance_id + method + method_detail + reported_as as the generators write them
let applied = null;
if (verifyPath) {
  const V = JSON.parse(fs.readFileSync(verifyPath, "utf8"));
  const kstr = k => JSON.stringify([k.instance_id, k.method, k.method_detail, k.reported_as]);
  const byKey = new Map();
  for (const r of rows) { const k = kstr(r); byKey.set(k, byKey.has(k) ? "COLLISION" : r); }
  const find = k => { const r = byKey.get(kstr(k)); if (!r) throw new Error(`verify: no row for ${kstr(k)}`); if (r === "COLLISION") throw new Error(`verify: key matches several rows: ${kstr(k)}`); return r; };
  const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
  const gone = new Set();
  for (const x of V.removals) {
    const r = find(x.key); find(x.kept); if (gone.has(r)) throw new Error(`verify: removed twice ${kstr(x.key)}`); gone.add(r);
    held.push({ source: r.arxiv, item: `${r.instance_id} ${r.method}${r.method_detail ? ` (${r.method_detail})` : ""}`, value: r.reported_as, reason: `removed: ${x.reason}`,
      removal: { kept: x.kept, ruled: V.ruled, source_entry: x.source_entry } });
  }
  rows = rows.filter(r => !gone.has(r));
  for (const c of V.corrections) {
    const r = find(c.key);
    if (gone.has(r)) throw new Error(`verify: correction on a removed row ${kstr(c.key)}`);
    if (same(r[c.field], c.from)) r[c.field] = c.to;
    else if (!same(r[c.field], c.to)) throw new Error(`verify: ${c.field} on ${kstr(c.key)} is ${JSON.stringify(r[c.field])}, expected ${JSON.stringify(c.from)} or ${JSON.stringify(c.to)}`);
    (r.corrections ||= []).push({ field: c.field, from: c.from, to: c.to, ...c.record });
  }
  for (const n of V.notes) {
    const r = find(n.key);
    if (r.note) { const old = r.note; r.note = `${old} | ${n.text}`; (r.corrections ||= []).push({ field: "note", from: old, to: r.note, checked_on: V.ruled, reason: "note added by the verify pass; the earlier note is kept in front", source_entry: n.source_entry }); }
    else r.note = n.text;
  }
  for (const v of V.verifications) { const r = find(v.key); if (r.verified) throw new Error(`verify: two verifications on ${kstr(v.key)}`); r.verified = v.verified; }
  applied = { removals: V.removals.length, corrections: V.corrections.length, notes: V.notes.length, verifications: V.verifications.length };
}
// variational principle against FCI (exact) on the same instance: tolerance 1e-6 per atom plus 3 sigma
const exact = {}; for (const r of rows) if (r.bound_type === "exact") exact[r.instance_id] = r.eps;
const viol = rows.filter(r => r.bound_type === "variational" && exact[r.instance_id] != null && r.eps < exact[r.instance_id] - 1e-6 - 3 * (r.sigma_per_site || 0));
const byB = {}; for (const r of rows) byB[r.bound_type] = (byB[r.bound_type] || 0) + 1;
const inst = new Set(rows.map(r => r.instance_id));
const papers = new Set(rows.map(r => r.arxiv));
fs.writeFileSync(out, JSON.stringify(rows, null, 1) + "\n");
fs.writeFileSync(heldOut, JSON.stringify(held, null, 1) + "\n");
console.log(JSON.stringify({ rows: rows.length, instances: inst.size, papers: [...papers], byBound: byB, held: held.length, dupsDropped: dups.length, verifyApplied: applied,
  instByModelBasis: [...inst].reduce((a, id) => { const k = id.split("/")[0] + " " + id.split("_").pop(); a[k] = (a[k] || 0) + 1; return a; }, {}) }, null, 1));
for (const v of viol) console.log("VARIATIONAL BELOW FCI", v.instance_id, v.method, v.method_detail, v.eps, exact[v.instance_id]);
