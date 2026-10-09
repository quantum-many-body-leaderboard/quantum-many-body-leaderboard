// QMBL: Open Problems, the page at /open-problems/ (Tristan, 2026-10-06 and 2026-10-08): the
// instances of a QMBL release with no exact ground-state energy, as open problems for scientists
// and AI systems, with the energy to beat on each, and the verified entries. Since 2026-10-09 it
// is laid out as QMBL's Leaderboard and Table are: a figure (open_problems_figure.mjs), then the
// targets, one table per model, then the entries once there are any, then how scoring works.
//
// Two inputs from the Open Problems repository (quantum-many-body-leaderboard/open-problems),
// checked out beside this one or wherever OPEN_PROBLEMS_DIR points: targets/v1.json, the frozen
// instance list, and results/<model>/<instance>/<entry>.json, one file per verified entry (written
// there by maintainer/publish.mjs). Without the checkout loadOpenProblems() returns null and
// site.mjs builds neither the page nor its menu button, so such a build is the site as before.
//
// The instance list is frozen; the energy to beat is not. It is read from data/ on every build:
// the lowest unflagged variational energy, never an extrapolation or a projection, even where
// one holds QMBL's record (that record is shown beside it, as an estimate). The scoring is the
// repository's (README, verifier/op_verify.py `combine`), recomputed here against the live
// target: an entry's gap is (E - E_target) / |E_target|, a new record lies more than 2 sigma
// combined below the target (QMBL's tie rule, RULES.md 6), and a system's score is the median
// gap over the instances it entered. Where an instance has no variational energy, the first
// verified state sets the target, and is a record (op_verify.py: "the first variational energy
// on the instance").
//
// QMBL's own pages list no targets and rank nothing by how beatable it is; this page is reached
// only by its menu button.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { perSiteDivisor, perSiteLabel, boundLabel } from "./units.mjs";
import { recordOf, exactRecordOf, rowId } from "./summary.mjs";
import { quote, MODELS, instanceLabel, byGeometry } from "./readme_table.mjs";
import { openProblemsFigure, FIGURE_NAME } from "./open_problems_figure.mjs";

export const OPEN_PROBLEMS_URL = "/open-problems/";
const SUBMISSIONS = "https://github.com/quantum-many-body-leaderboard/open-problems";
const TARGETS = "targets/v1.json";
// The repository beside this one: ../open-problems from the repository root.
const DEFAULT_DIR = fileURLToPath(new URL("../../open-problems/", import.meta.url));
const RECORD_SIGMAS = 2;
// QMBL re-measures an entry's state twice, with independent seeds, each measurement capped at
// this many GPU-hours (Tristan, 2026-10-09).
const GPU_HOURS_PER_MEASUREMENT = 4;
// metadata.yaml's ai_involvement (schema/metadata.schema.json) and how the page prints it.
const AI_LABELS = { ai: "AI", "human+ai": "human + AI", human: "human" };
const LINKS = [["code", "code"], ["checkpoint", "checkpoint"], ["paper", "paper"], ["pr", "pull request"]];
// Zenodo's mark for the link beside GitHub's: a Z cut out of a disc, drawn here so that the page
// makes no request elsewhere; the same size and colour as the GitHub mark, which it sits beside.
const ZENODO_MARK = `<svg viewBox="0 0 16 16" width="20" height="20" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M8 0a8 8 0 1 0 0 16A8 8 0 1 0 8 0zM4.75 4.25h6.5v1.6l-4.3 4.3h4.3v1.6h-6.5v-1.6l4.3-4.3h-4.3z"/></svg>`;

// The target list and the entries, or null where the checkout is missing. A malformed entry
// stops the build: the page would otherwise score it wrongly or not at all.
export function loadOpenProblems(dir = process.env.OPEN_PROBLEMS_DIR || DEFAULT_DIR) {
  const root = path.resolve(dir), file = path.join(root, TARGETS);
  if (!fs.existsSync(file)) {
    console.log(`open-problems: ${file} not found, so /open-problems/ and its menu button are not built`);
    return null;
  }
  const targets = JSON.parse(fs.readFileSync(file, "utf8"));
  const ids = new Set(targets.instances.map(t => t.instance_id));
  const results = path.join(root, "results");
  const files = fs.existsSync(results) ? fs.readdirSync(results, { recursive: true }).filter(f => f.endsWith(".json")).sort() : [];
  const entries = files.map(f => {
    const e = JSON.parse(fs.readFileSync(path.join(results, f), "utf8"));
    const wrong = !ids.has(e.instance_id) ? `instance ${e.instance_id} is not in ${TARGETS}`
      : !Object.hasOwn(AI_LABELS, e.ai_involvement) ? `ai_involvement is ${e.ai_involvement}, not one of ${Object.keys(AI_LABELS).join(", ")}`
      : !Number.isFinite(e.energy_per_site) ? "energy_per_site is not a number"
      : !e.system || !e.team ? "system or team is missing" : null;
    if (wrong) throw new Error(`${path.join(results, f)}: ${wrong}`);
    return { ...e, file: f };
  });
  return { targets, entries };
}

// verifier/qrec_verify/instance.py best_variational: the lowest unflagged variational row, with
// or without sigma.
const bestVariational = inst => [...inst.rows].sort((a, b) => a.energy - b.energy)
  .find(r => r.bound_type === "variational" && !r.defect) ?? null;

const median = xs => {
  const s = [...xs].sort((a, b) => a - b), m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

// Every target with its live energy to beat, every entry scored against it, every system scored.
function score(op, instances) {
  const byId = new Map(instances.map(i => [i.instance_id, i]));
  const targets = op.targets.instances.map(t => {
    const inst = byId.get(t.instance_id);
    if (!inst) throw new Error(`${TARGETS}: ${t.instance_id} is not in data/`);
    const f = perSiteDivisor(inst) ?? 1, row = bestVariational(inst), rec = recordOf(inst);
    return { t, inst, row, estimate: rec && rec !== row ? rec : null, first: null,
      energy: row ? row.energy / f : null, sigma: row ? (row.sigma ?? 0) / f : null };
  });
  const of = new Map(targets.map(x => [x.t.instance_id, x]));
  // Oldest first, so that the first verified state on an instance without a variational energy
  // sets its target, and the newest entry of a system on an instance is its live one (a new
  // entry replaces the old; the repository's CI keeps only one, but a stale file must not count twice).
  const sorted = [...op.entries].sort((a, b) => String(a.measured).localeCompare(String(b.measured)) || a.file.localeCompare(b.file));
  const live = new Map(sorted.map(e => [`${e.system}\n${e.instance_id}`, e]));
  const entries = sorted.map(e => {
    const x = of.get(e.instance_id), s = { e, x, live: live.get(`${e.system}\n${e.instance_id}`) === e };
    if (x.energy == null && !x.first) return { ...s, first: (x.first = e), gap: null, record: true };
    const te = x.energy ?? x.first.energy_per_site, ts = x.energy != null ? x.sigma : x.first.sigma_per_site ?? 0;
    return { ...s, gap: (e.energy_per_site - te) / Math.abs(te),
      record: te - e.energy_per_site > RECORD_SIGMAS * Math.hypot(e.sigma_per_site ?? 0, ts) };
  });
  const systems = [...Map.groupBy(entries.filter(s => s.live), s => s.e.system)].map(([system, list]) => {
    const gaps = list.map(s => s.gap).filter(g => g != null);
    return { system, teams: [...new Set(list.map(s => s.e.team))], ai: [...new Set(list.map(s => s.e.ai_involvement))],
      median: gaps.length ? median(gaps) : null, instances: list.length, records: list.filter(s => s.record).length };
  }).sort((a, b) => (a.median ?? Infinity) - (b.median ?? Infinity) || b.records - a.records || a.system.localeCompare(b.system));
  return { targets, entries, systems };
}

const targetId = inst => `t-${inst.instance_id.replace(/[^\w-]/g, "_")}`;
const entryId = e => `e-${e.file.replace(/\.json$/, "").replace(/[^\w-]/g, "_")}`;
// Relative, with its sign: below the target is what the page is about.
const gapText = g => (g == null ? '<span class="muted">n/a</span>' : g === 0 ? "0" : `${g < 0 ? "−" : "+"}${Math.abs(g).toExponential(1)}`);
const NA = '<span class="muted">n/a</span>';

// The body and meta description of /open-problems/; site.mjs wraps them in its page(). Its own
// helpers come in as `site`, so the energies, citations and labels are written as on the Table.
export function openProblemsPage(op, instances, site) {
  const { esc, citeHtml, energyCell, modelName, RULES, figure, rowCard, FIG_SCRIPT, GITHUB_MARK, CITE_HEAD } = site;
  const { targets, entries, systems } = score(op, instances);
  const { version, qmbl_release: release, qmbl_doi: doi, frozen } = op.targets;
  const n = targets.length, solved = instances.filter(i => exactRecordOf(i)).length;
  const aiBadge = a => `<span class="badge">${AI_LABELS[a]}</span>`;
  // What the page's Cite button copies (Tristan, 2026-10-09).
  const citation = `${CITE_HEAD}, QMBL: Open Problems, targets ${version} from QMBL ${release}, Zenodo (${frozen.slice(0, 4)}). https://doi.org/${doi}`;

  const compute = c => {
    const h = x => Number(x).toLocaleString("en-US", { maximumFractionDigits: 1 });
    const parts = [c?.hardware, c?.gpu_hours != null && `${h(c.gpu_hours)} GPU-hours`, c?.cpu_core_hours != null && `${h(c.cpu_core_hours)} CPU core-hours`].filter(Boolean);
    return parts.length ? esc(parts.join(", ")) : NA;
  };
  const links = l => LINKS.filter(([k]) => /^https:\/\//.test(l?.[k] ?? "")).map(([k, label]) => `<a href="${esc(l[k])}">${label}</a>`).join(" &middot; ") || NA;

  const systemsTable = `<div class="scroll"><table>
    <thead><tr><th>system</th><th>team</th><th>AI</th><th>median gap</th><th>instances</th><th>records</th></tr></thead>
    <tbody>${systems.map(s => `<tr><th scope="row">${esc(s.system)}</th><td>${esc(s.teams.join(", "))}</td><td>${s.ai.map(aiBadge).join(" ")}</td>
      <td class="num">${gapText(s.median)}</td><td class="num">${s.instances}</td><td class="num">${s.records}</td></tr>`).join("")}</tbody></table></div>`;

  // The targets as the Table orders them: by model (its names), then by geometry. The entries
  // follow that order, and on one instance their energy, lowest first.
  const groups = MODELS.map(([model, name]) => [model, name,
    targets.filter(x => x.inst.model === model).sort((a, b) => byGeometry(a.inst, b.inst))]).filter(([, , g]) => g.length);
  const order = new Map(groups.flatMap(([, , g]) => g).map((x, k) => [x, k]));
  const entriesTable = `<div class="scroll"><table class="op-wide">
    <thead><tr><th>instance</th><th>system</th><th>team</th><th>AI</th><th>energy, re-measured</th><th>gap</th><th>compute</th><th>links</th></tr></thead>
    <tbody>${[...entries].sort((a, b) => order.get(a.x) - order.get(b.x) || a.e.energy_per_site - b.e.energy_per_site).map(s => `<tr id="${entryId(s.e)}">
      <th scope="row"><a href="#${targetId(s.x.inst)}">${esc(modelName(s.x.inst.model))} ${esc(instanceLabel(s.x.inst))}</a></th>
      <td>${esc(s.e.system)}${s.live ? "" : ' <span class="badge" title="A newer entry of this system on this instance replaces it">replaced</span>'}</td>
      <td>${esc(s.e.team)}</td><td>${aiBadge(s.e.ai_involvement)}</td>
      <td class="record nowrap"><span class="num">${quote(s.e.energy_per_site, s.e.sigma_per_site).text}</span> <span class="muted">${perSiteLabel(s.x.inst)}</span></td>
      <td class="num">${s.first ? '<span class="muted">first state</span>' : gapText(s.gap)}${s.record ? '<span class="tag">new record</span>' : ""}</td>
      <td>${compute(s.e.compute)}</td><td>${links(s.e.links)}</td></tr>`).join("")}</tbody></table></div>`;

  // After the targets, and only once there are entries (Tristan, 2026-10-09).
  const results = entries.length ? `
<h2 id="systems">Systems</h2>
<p class="muted">Lowest median gap first; only a system's live entries count.</p>
${systemsTable}
<h2 id="entries">Entries</h2>
${entriesTable}` : "";

  // The figure, with a hover card for each Table row it links to, as on the home page, and one
  // for each entry it draws.
  const fig = openProblemsFigure(targets, entries, e => `#${entryId(e)}`);
  const figHtml = figure([FIGURE_NAME, fig.title, fig.caption], "", fig.svg);
  const figRows = new Set([...[...figHtml.matchAll(/href="\/instances\/#(r-[\w-]+)"/g)].map(m => m[1]),
    ...[...figHtml.matchAll(/data-rows="([\w -]+)"/g)].flatMap(m => m[1].split(" "))]);
  const cards = instances.flatMap(inst => inst.rows.filter(r => figRows.has(rowId(inst, r)))
    .map(r => `<div data-row="${rowId(inst, r)}">${rowCard(r, inst)}</div>`));
  if (cards.length !== figRows.size) throw new Error(`the Open Problems figure links ${figRows.size} rows, ${cards.length} found in data/`);
  const drawn = new Set([...figHtml.matchAll(/href="#(e-[\w-]+)"/g)].map(m => m[1]));
  const entryCards = entries.filter(s => drawn.has(entryId(s.e))).map(s => `<div data-row="${entryId(s.e)}"><b>${esc(modelName(s.x.inst.model))} ${esc(instanceLabel(s.x.inst))}</b>
<span>${esc(s.e.system)}, ${esc(s.e.team)} &middot; ${AI_LABELS[s.e.ai_involvement]}</span>
<span class="e"><span class="num">${quote(s.e.energy_per_site, s.e.sigma_per_site).text}</span> <span class="muted">${perSiteLabel(s.x.inst)} &middot; verified entry</span>${s.record ? '<span class="tag">new record</span>' : ""}</span>
<span class="muted">${s.first ? "the first verified state on this instance" : `gap ${gapText(s.gap)}`}</span></div>`);

  // One table per model, with the Table's names and labels. An instance links to its target row
  // in the Table, which opens the instance there; without a variational energy, to its record row
  // (or its lowest row).
  const sections = groups.map(([model, name, group]) => {
    const rows = group.map(x => {
      const { t, inst, row, estimate, first } = x;
      const linked = row ?? recordOf(inst) ?? [...inst.rows].sort((a, b) => a.energy - b.energy)[0];
      const beat = row ? `<td class="record">${energyCell(row, inst)}</td><td>${esc(row.method)}</td><td>${citeHtml(row)}</td>`
        : first ? `<td class="record"><span class="num">${quote(first.energy_per_site, first.sigma_per_site).text}</span></td><td>${esc(first.system)}</td><td><a href="#${entryId(first)}">first verified state</a></td>`
        : '<td colspan="3" class="muted">no variational energy yet; the first verified state sets it</td>';
      return `<tr id="${targetId(inst)}">
        <th scope="row"><a href="/instances/#${rowId(inst, linked)}">${esc(instanceLabel(inst))}</a></th>
        ${beat}<td>${estimate ? `${energyCell(estimate, inst)} <span class="badge">${boundLabel(estimate)}</span>` : ""}</td>
        <td class="num">${inst.rows.length}</td>
        <td>${t.verifier.supported ? '<span class="muted">yes</span>' : `not yet <span class="muted">(${esc(t.verifier.reason)})</span>`}</td></tr>`;
    }).join("");
    return `<section class="targets">
  <h3 id="targets-${model.toLowerCase()}">${esc(name)}<a class="anchor" href="#targets-${model.toLowerCase()}" aria-label="Link to this section">#</a></h3>
  <p class="muted">${group.length} instance${group.length === 1 ? "" : "s"}, energies as <code>${perSiteLabel(group[0].inst)}</code></p>
  <div class="scroll"><table class="leaderboard op-wide">
    <thead><tr><th>instance</th><th>energy to beat</th><th>method</th><th>source</th><th>record (estimate)</th><th>results</th><th>verifier</th></tr></thead>
    <tbody>${rows}</tbody></table></div>
</section>`;
  }).join("\n");

  // The page is a figure and the table under it, as QMBL's Leaderboard and Table are
  // (Tristan, 2026-10-09); the figure carries its own title, so nothing stands above it.
  const body = `
<h1>QMBL: Open Problems</h1>
<p class="op-links"><a class="ext" href="${SUBMISSIONS}" aria-label="QMBL: Open Problems on GitHub" title="Targets, entries and verifier on GitHub">${GITHUB_MARK}</a>
<a class="ext" href="https://doi.org/${esc(doi)}" aria-label="QMBL ${esc(release)} on Zenodo" title="QMBL ${esc(release)} on Zenodo, the release the targets are taken from">${ZENODO_MARK}</a>
<button class="cite-btn" type="button" data-cite="${esc(citation)}" title="Copy the citation">&#10077;<span>Cite</span></button></p>
<p class="lead">QMBL: Open Problems is a record book of the state of the art in quantum many-body simulation for problems with no exact ground-state energy.</p>

${figHtml}
<template id="fig-cards">${[...cards, ...entryCards].join("\n")}</template>
${FIG_SCRIPT}
${sections}
${results}

<h2 id="scoring">Scoring</h2>
<p>The energy to beat on an instance is QMBL's best variational energy, the lowest unflagged
variational energy published for it. It is read from QMBL's data whenever this page is built, so
a result published after the list was frozen (${esc(frozen)}) counts. An entry's score is its
relative gap to that energy, <span class="nowrap">(E &minus; E<sub>target</sub>) / |E<sub>target</sub>|</span>, negative below the
target; every verified entry is listed, wherever its energy lands. An entry more than 2&sigma;
below the target, with the error bars of the entry and the target combined, is marked as a new
record (<a href="${RULES}#6-records-and-ties">QMBL's rule for ties</a>). A system's score is the
median gap over the instances it entered, shown with how many it entered and how many records it
set; a system has one live entry per instance, and a new entry replaces the old one. The
re-measurement of an entry's state is capped at ${GPU_HOURS_PER_MEASUREMENT} GPU-hours per measurement,
two measurements per entry.</p>

<h2 id="submit">How to submit</h2>
<p>To enter, open a pull request in the submissions repository,
<a href="${SUBMISSIONS}">quantum-many-body-leaderboard/open-problems</a>; its
<a href="${SUBMISSIONS}/blob/main/README.md">README</a> gives the format and the steps. An entry
links the code at a fixed commit and a checkpoint of the state, and states its compute and how much
AI was involved. QMBL measures the state twice with independent seeds, and the entry is listed
here once both measurements pass and agree.</p>
<p>The ${solved} instances with an exact energy, in the <a href="/instances/">Table</a>, are for
testing a pipeline before entering.</p>`;

  const description = `The ${n} lattice Hamiltonians in QMBL ${release} with no exact ground-state energy, as open problems for scientists and AI systems: the energy to beat on each, and the verified entries.`;
  return { body, description };
}

// One line for llms.txt.
export const openProblemsLlms = op =>
  `- [Open Problems](https://qmbl.org${OPEN_PROBLEMS_URL}): the ${op.targets.instances.length} instances with no exact ground-state energy as open problems for scientists and AI systems, with the energy to beat on each, the scoring and the verified entries.`;

// The menu button: an outlined pill in the accent colour, filled on its own page as a chosen
// badge is, so it reads as a button beside the plain links and the grey Cite pill. On a phone
// the menu tightens to stay on one line under the wordmark; where even that does not fit
// (below 390 px), the button takes a line of its own above the links rather than leaving the
// Cite button alone on a second line.
export const OPEN_PROBLEMS_CSS = `
header.site nav a.op {
  display: inline-flex; align-items: center; padding: 0.4rem 0.75rem; font-size: 0.85rem; line-height: 1;
  color: var(--accent); background: var(--surface); border: 1px solid var(--accent); border-radius: 999px;
}
header.site nav a.op:hover { color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, var(--surface)); }
header.site nav a.op[aria-current] { color: #fff; background: var(--accent); box-shadow: none; }
@media (max-width: 480px) {
  header.site nav { gap: 0.4rem 0.75rem; font-size: 0.9rem; }
  header.site nav a.op, header.site nav button.cite-btn { padding: 0.4rem 0.6rem; font-size: 0.8rem; }
}
@media (max-width: 389px) {
  header.site nav::before { content: ""; flex-basis: 100%; order: 1; }
  header.site nav > :not(.op) { order: 2; }
}
/* GitHub, Zenodo and Cite under the page's title, as the header's mark and Cite pill. */
p.op-links { display: flex; flex-wrap: wrap; align-items: center; gap: 1.2rem; margin: 0.4rem 0 0.6rem; }
p.op-links a.ext { color: var(--muted); display: inline-flex; }
p.op-links a.ext:hover { color: var(--ink); }
p.op-links a.ext svg { display: block; }
section.targets h3 { margin-top: 2.2rem; }
section.targets h3 + p.muted { margin: 0.2rem 0 0; }
.nowrap { white-space: nowrap; }
/* On a phone the targets and entries tables keep their desktop layout, one line a row, and
   scroll sideways in their .scroll box instead of folding every cell into a tall column. */
@media (max-width: 760px) { table.op-wide { min-width: 72rem; } }
`;
