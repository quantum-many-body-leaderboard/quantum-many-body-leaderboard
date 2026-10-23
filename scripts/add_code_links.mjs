// Attach the code behind a row (DATA.md, "The code behind a row") from
// passes/code/code-links-YYYY-MM-DD.json: one entry per row, keyed by instance, energy and the
// reference's url or string, with a status:
//   linked     the source names the code that produced the number; attached as artifacts.code
//   not_found  no statement was found in what was read; nothing attached
//   ambiguous  a statement exists but does not settle that this code produced this number
//   dead_link  the stated url did not resolve when checked; nothing attached
// Only `linked` entries touch the data. Each carries the quoted statement and where it was
// read, kept on the row as artifacts.read_from. Passes apply in date order; a later pass's
// entry for a row replaces the earlier one. Runs after the overlays, on the final instance ids.
import fs from "node:fs";
import path from "node:path";

const DIR = "passes/code";
const PASSES = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter(f => /^code-links-\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort() : [];
const STATUS = new Set(["linked", "not_found", "ambiguous", "dead_link"]);
const refKey = ref => (ref || "").match(/\((https?:[^)]+)\)/)?.[1] ?? (ref || "");

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

const latest = new Map();
const problems = [];
for (const file of PASSES) {
  const date = file.slice(11, 21);
  for (const e of JSON.parse(fs.readFileSync(path.join(DIR, file), "utf8"))) {
    if (!STATUS.has(e.status)) { problems.push(`${e.instance_id} ${e.energy}: status ${e.status}`); continue; }
    latest.set(`${e.instance_id}|${e.energy}|${e.reference_key}`, { ...e, file: `${DIR}/${file}`, date });
  }
}

const counts = { linked: 0, not_found: 0, ambiguous: 0, dead_link: 0 };
const unmatched = [];
for (const e of latest.values()) {
  counts[e.status]++;
  if (e.status !== "linked") continue;
  const entry = instances.get(e.instance_id);
  const row = entry?.inst.rows.find(r => r.energy === e.energy && refKey(r.reference) === e.reference_key);
  if (!row) { unmatched.push(`${e.instance_id} ${e.energy} ${String(e.reference_key).slice(0, 50)}`); continue; }
  if (!e.url || !e.quote || !e.location) { problems.push(`${e.instance_id} ${e.energy}: linked without url, quote or location`); continue; }
  // An unpublished row's artifacts came with its submission (RULES.md 8.3) and are not replaced.
  if (row.provenance === "unpublished") continue;
  const a = { ...(row.artifacts || {}), code: e.url };
  if (e.commit) a.commit = e.commit;
  if (e.script) a.script = e.script;
  // A release that holds only the network, no training or run script (label "model code").
  if (e.scope) a.scope = e.scope;
  a.read_from = { quote: e.quote, location: e.location, checked_on: e.url_check?.checked_on ?? e.date, pass: e.file };
  row.artifacts = a;
  entry.dirty = true;
}
for (const { path: p, inst, dirty } of instances.values())
  if (dirty) fs.writeFileSync(p, JSON.stringify(inst, null, 2) + "\n");

console.log(`code links: ${counts.linked} linked, ${counts.ambiguous} ambiguous, ${counts.dead_link} dead links, ${counts.not_found} not found; ${unmatched.length} unmatched`);
for (const u of unmatched) console.log(`  unmatched: ${u}`);
if (problems.length) { problems.forEach(s => console.log("  !! " + s)); process.exitCode = 1; }
