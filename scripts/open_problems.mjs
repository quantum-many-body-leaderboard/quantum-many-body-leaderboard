// QMBL: Open Problems: the instances in QMBL with no exact ground-state energy, as open
// problems for scientists and AI systems, with the energy to beat on each, and the verified
// entries. Since 2026-11-11 it has no pages of its own: the menu's switch (site.mjs,
// OP_SWITCH_SCRIPT) marks these instances on QMBL's own pages, /open-problems/ forwards there,
// and this module gives the targets and scores to the switch, api/open-problems.json, llms.txt and
// the Open Problems repository's README (its scripts/readme.mjs imports loadOpenProblems, score,
// AI_LABELS and LINKS). How scoring works and how to enter are in that README.
//
// Two inputs from the Open Problems repository (quantum-many-body-leaderboard/open-problems),
// checked out beside this one or wherever OPEN_PROBLEMS_DIR points: scripts/targets.mjs, which
// says which of QMBL's instances are targets, and results/<model>/<instance>/<entry>.json, one
// file per verified entry (written there by maintainer/publish.mjs). Without the checkout
// loadOpenProblems() returns null and site.mjs builds no switch.
//
// The targets are every instance in data/ with no exact energy, on every build. An instance
// that gets an exact energy is solved: it leaves the targets, and its entries stay listed,
// marked solved, outside the systems' scores. The energy to beat is read from data/ too: the
// lowest unflagged variational energy, never an extrapolation or a projection. Each target is
// shown as QMBL shows an instance (RULES.md 6): its best variational value first, then the best
// projected, extrapolated and approximate values where they exist. The scoring is the
// repository's (README; op_verify.py `combine` in quantum-many-body-leaderboard/verifier),
// recomputed here against the live target: an entry's gap is (E - E_target) / |E_target|, a
// new record lies more than 2 sigma combined below the target (QMBL's tie rule, RULES.md 6),
// and a system's score is the median gap over the instances it entered. Where an instance has
// no variational energy, the first verified state sets the target, and is a record
// (op_verify.py: "the first variational energy on the instance").
//
// QMBL's own pages list no targets and rank nothing by how beatable it is; the marks appear only
// while the reader has the switch on.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { perSiteDivisor } from "./units.mjs";
import { exactRecordOf, classBest } from "./summary.mjs";

// The repository beside this one: ../open-problems from the repository root.
const DEFAULT_DIR = fileURLToPath(new URL("../../open-problems/", import.meta.url));
const RECORD_SIGMAS = 2;
// The best values shown under the best variational one, in QMBL's order (units.mjs BEST_CLASSES).
const OTHER_CLASSES = ["projected", "extrapolated", "approximate"];
// metadata.yaml's ai_involvement (schema/metadata.schema.json) and how the page prints it.
export const AI_LABELS = { ai: "AI", "human+ai": "human + AI", human: "human" };
export const LINKS = [["code", "code"], ["checkpoint", "checkpoint"], ["paper", "paper"], ["pr", "pull request"]];

// The targets and the entries, or null where the checkout is missing. A malformed entry stops
// the build: the pages would otherwise score it wrongly or not at all.
export async function loadOpenProblems(instances, dir = process.env.OPEN_PROBLEMS_DIR || DEFAULT_DIR) {
  const root = path.resolve(dir);
  if (!fs.existsSync(root)) {
    console.log(`open-problems: ${root} not found, so /open-problems/ and its menu button are not built`);
    return null;
  }
  const module = path.join(root, "scripts/targets.mjs");
  if (!fs.existsSync(module)) throw new Error(`${module} not found: the open-problems checkout is older than its rolling targets (1f516a1)`);
  const { openTargets } = await import(pathToFileURL(module).href);
  // Both tracks: the electron gas (RULES.md 12) has no exact method, so every one of its instances is a target.
  const targets = openTargets(instances, perSiteDivisor);
  const known = new Set(instances.map(i => i.instance_id));
  const results = path.join(root, "results");
  const files = fs.existsSync(results) ? fs.readdirSync(results, { recursive: true }).filter(f => f.endsWith(".json")).sort() : [];
  const entries = files.map(f => {
    const e = JSON.parse(fs.readFileSync(path.join(results, f), "utf8"));
    const wrong = !known.has(e.instance_id) ? `instance ${e.instance_id} is not in data/`
      : !Object.hasOwn(AI_LABELS, e.ai_involvement) ? `ai_involvement is ${e.ai_involvement}, not one of ${Object.keys(AI_LABELS).join(", ")}`
      : !Number.isFinite(e.energy_per_site) ? "energy_per_site is not a number"
      : !e.system || !e.team ? "system or team is missing" : null;
    if (wrong) throw new Error(`${path.join(results, f)}: ${wrong}`);
    return { ...e, file: f };
  });
  // Its own citation since its first Zenodo release (v0.1.0, 2026-10-17), read with the README's
  // parser; a checkout without CITATION.cff cites QMBL.
  const cff = path.join(root, "CITATION.cff");
  const citation = fs.existsSync(cff)
    ? (await import(pathToFileURL(path.join(root, "scripts/citation.mjs")).href)).citationOf(fs.readFileSync(cff, "utf8"))
    : null;
  return { targets, entries, citation };
}

// qrec_verify/instance.py best_variational (quantum-many-body-leaderboard/verifier): the lowest unflagged variational row, with
// or without sigma.
const bestVariational = inst => [...inst.rows].sort((a, b) => a.energy - b.energy)
  .find(r => r.bound_type === "variational" && !r.defect) ?? null;

const median = xs => {
  const s = [...xs].sort((a, b) => a - b), m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

// Every target with its live energy to beat, every entry scored against it, every system scored.
// Exported for the README of the Open Problems repository (its scripts/readme.mjs), so that the
// README and these pages score alike.
export function score(op, instances) {
  const byId = new Map(instances.map(i => [i.instance_id, i]));
  const targets = op.targets.map(t => {
    const inst = byId.get(t.instance_id);
    const f = perSiteDivisor(inst) ?? 1, row = bestVariational(inst), best = classBest(inst);
    // QMBL's other best values (summary.mjs classBest), shown under the best variational one.
    const others = OTHER_CLASSES.map(c => [c, best[c]]).filter(([, r]) => r);
    return { t, inst, row, others, first: null,
      energy: row ? row.energy / f : null, sigma: row ? (row.sigma ?? 0) / f : null };
  });
  const of = new Map(targets.map(x => [x.t.instance_id, x]));
  // Oldest first, so that the first verified state on an instance without a variational energy
  // sets its target, and the newest entry of a system on an instance is its live one (a new
  // entry replaces the old; the repository's CI keeps only one, but a stale file must not count twice).
  const sorted = [...op.entries].sort((a, b) => String(a.measured).localeCompare(String(b.measured)) || a.file.localeCompare(b.file));
  const latest = new Map(sorted.map(e => [`${e.system}\n${e.instance_id}`, e]));
  const entries = sorted.map(e => {
    const x = of.get(e.instance_id), live = latest.get(`${e.system}\n${e.instance_id}`) === e;
    // On an instance solved since the entry: listed and marked, not scored.
    if (!x) {
      const inst = byId.get(e.instance_id);
      return { e, x: { inst, exact: exactRecordOf(inst) }, live, solved: true, gap: null, record: false };
    }
    // An entry whose re-measurement failed a check is listed with its flags; it sets no target,
    // takes no record mark and does not count in its system's score.
    const flagged = (e.flags ?? []).length > 0;
    const s = { e, x, live, flagged };
    if (x.energy == null && !x.first && !flagged) return { ...s, first: (x.first = e), gap: null, record: true };
    if (x.energy == null && !x.first) return { ...s, gap: null, record: false };
    const te = x.energy ?? x.first.energy_per_site, ts = x.energy != null ? x.sigma : x.first.sigma_per_site ?? 0;
    return { ...s, gap: (e.energy_per_site - te) / Math.abs(te),
      record: !flagged && te - e.energy_per_site > RECORD_SIGMAS * Math.hypot(e.sigma_per_site ?? 0, ts) };
  });
  const systems = [...Map.groupBy(entries.filter(s => s.live && !s.solved && !s.flagged), s => s.e.system)].map(([system, list]) => {
    const gaps = list.map(s => s.gap).filter(g => g != null);
    return { system, teams: [...new Set(list.map(s => s.e.team))], ai: [...new Set(list.map(s => s.e.ai_involvement))],
      median: gaps.length ? median(gaps) : null, instances: list.length, records: list.filter(s => s.record).length };
  }).sort((a, b) => (a.median ?? Infinity) - (b.median ?? Infinity) || b.records - a.records || a.system.localeCompare(b.system));
  return { targets, entries, systems };
}

// Two lines for llms.txt.
export const openProblemsLlms = op => [
  `- [Open Problems](https://qmbl.org/?open): QMBL's pages with the Open Problems switch on, marking the ${op.targets.length} instances with no exact ground-state energy; the same data, with the verified entries, is in https://qmbl.org/api/open-problems.json.`,
  `- [Open Problems table](https://qmbl.org/instances/?open): the table with the switch on (the marking needs JavaScript; agents read the JSON above).`,
];

// The menu button, last in the menu (site.mjs) on every page, so its rules go into the site's
// stylesheet: a filled pill in the navy accent that turns ink on hover and on its own page,
// so it reads as a button beside the
// plain links and the grey Cite pill; light text on navy and black, dark text on the light navy
// and white of dark mode. On a phone the menu tightens to stay on one line under the wordmark;
// where even that does not fit (below 390 px), the button, being last, wraps to a line of its own.
export const OPEN_PROBLEMS_NAV_CSS = `
header.site nav a.op {
  display: inline-flex; align-items: center; padding: 0.4rem 0.75rem; font-size: 0.85rem; line-height: 1;
  color: var(--bg); background: var(--accent); border: 1px solid var(--accent); border-radius: 999px;
  transition: background-color 0.15s, border-color 0.15s;
}
header.site nav a.op:hover { color: var(--bg); background: var(--ink); border-color: var(--ink); }
header.site nav a.op[aria-current] { color: var(--bg); background: var(--ink); border-color: var(--ink); box-shadow: none; }
@media (max-width: 480px) {
  header.site nav { gap: 0.4rem 0.75rem; font-size: 0.9rem; }
  header.site nav a.op, header.site nav button.cite-btn { padding: 0.4rem 0.6rem; font-size: 0.8rem; }
}
`;
