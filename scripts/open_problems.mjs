// QMBL: Open Problems (2026-10-06 and 2026-10-08): the instances in QMBL with no exact
// ground-state energy, as open problems for scientists and AI systems, with the energy to beat on
// each, and the verified entries. Since 2026-10-09 it is two pages, as QMBL is ("like
// QMBL where we have leaderboard (with same figures) and table"), switched by a row of two tabs
// under the title: the Leaderboard, /open-problems/, with its own figure
// (open_problems_figure.mjs), the home page's figure sections for these instances (site.mjs) and
// the systems once there are entries; and the Table, /open-problems/table/, with the targets, one
// table per model, and the entries. How scoring works and how to enter are in the repository's
// README (2026-10-09).
//
// Two inputs from the Open Problems repository (quantum-many-body-leaderboard/open-problems),
// checked out beside this one or wherever OPEN_PROBLEMS_DIR points: scripts/targets.mjs, which
// says which of QMBL's instances are targets, and results/<model>/<instance>/<entry>.json, one
// file per verified entry (written there by maintainer/publish.mjs). Without the checkout
// loadOpenProblems() returns null and site.mjs builds neither the pages nor their menu button,
// so such a build is the site as before.
//
// The targets follow QMBL (2026-10-09: rolling problems): every instance in data/ with no
// exact energy, on every build. An instance that gets an exact energy is solved: it leaves the
// targets, and its entries stay listed, marked solved, outside the systems' scores. The energy to
// beat is read from data/ too: the lowest unflagged variational energy, never an extrapolation or
// a projection, even where one holds QMBL's record (that record is shown beside it, as an
// estimate). The scoring is the
// repository's (README; op_verify.py `combine` in quantum-many-body-leaderboard/verifier), recomputed here against the live
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
import { fileURLToPath, pathToFileURL } from "node:url";
import { perSiteDivisor, perSiteLabel, boundLabel } from "./units.mjs";
import { recordOf, exactRecordOf, rowId } from "./summary.mjs";
import { quote, MODELS, instanceLabel, byGeometry } from "./readme_table.mjs";
import { openProblemsFigure, FIGURE_NAME } from "./open_problems_figure.mjs";

export const OPEN_PROBLEMS_URL = "/open-problems/";
export const OPEN_PROBLEMS_TABLE_URL = "/open-problems/table/";
const SUBMISSIONS = "https://github.com/quantum-many-body-leaderboard/open-problems";
// The repository beside this one: ../open-problems from the repository root.
const DEFAULT_DIR = fileURLToPath(new URL("../../open-problems/", import.meta.url));
const RECORD_SIGMAS = 2;
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
  return { targets, entries };
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
    const f = perSiteDivisor(inst) ?? 1, row = bestVariational(inst), rec = recordOf(inst);
    return { t, inst, row, estimate: rec && rec !== row ? rec : null, first: null,
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
    // On an instance solved since the entry: listed and marked, not scored (2026-10-09).
    if (!x) {
      const inst = byId.get(e.instance_id);
      return { e, x: { inst, exact: exactRecordOf(inst) }, live, solved: true, gap: null, record: false };
    }
    // An entry whose re-measurement failed a check is listed with its flags; it sets no target,
    // takes no record mark and does not count in its system's score (2026-10-12).
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

const targetId = inst => `t-${inst.instance_id.replace(/[^\w-]/g, "_")}`;
const entryId = e => `e-${e.file.replace(/\.json$/, "").replace(/[^\w-]/g, "_")}`;
// Relative, with its sign: below the target is what the page is about.
const gapText = g => (g == null ? '<span class="muted">n/a</span>' : g === 0 ? "0" : `${g < 0 ? "−" : "+"}${Math.abs(g).toExponential(1)}`);
const NA = '<span class="muted">n/a</span>';

// The bodies and meta descriptions of the Leaderboard, /open-problems/, and the Table,
// /open-problems/table/; site.mjs wraps each in its page(). Its own helpers come in as `site`, so
// the energies, citations and labels are written as on QMBL's Table.
export function openProblemsPages(op, instances, site) {
  const { esc, citeHtml, energyCell, modelName, figure, rowCard, FIG_SCRIPT, GITHUB_MARK, CITE_HEAD, CITE_TITLE, DOI, CITE_YEAR, figureSections = "",
    searchIndex, searchWords, searchMatch, SEARCH_STOP, latticeOf, sizeBand, SIZE_BANDS } = site;
  const { targets, entries, systems } = score(op, instances);
  const n = targets.length;
  const aiBadge = a => `<span class="badge">${AI_LABELS[a]}</span>`;
  // What the Cite button copies and the citation section prints (2026-10-09). QMBL: Open Problems
  // has no DOI of its own yet, so it cites QMBL under QMBL's own title and concept DOI (2026-10-16).
  const citation = `${CITE_HEAD}, ${CITE_TITLE}, Zenodo (${CITE_YEAR}). https://doi.org/${DOI}`;

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
  // follow that order, and on one instance their energy, lowest first; entries on instances
  // solved since come last.
  const groups = MODELS.map(([model, name]) => [model, name,
    targets.filter(x => x.inst.model === model).sort((a, b) => byGeometry(a.inst, b.inst))]).filter(([, , g]) => g.length);
  const order = new Map(groups.flatMap(([, , g]) => g).map((x, k) => [x, k]));
  const rank = s => order.get(s.x) ?? order.size;
  // A solved instance has no target row here; it links to its exact row in QMBL's Table.
  const instanceHref = s => (s.solved ? `/instances/${s.x.exact ? `#${rowId(s.x.inst, s.x.exact)}` : ""}` : `#${targetId(s.x.inst)}`);
  const entriesTable = `<div class="scroll"><table class="op-wide">
    <thead><tr><th>instance</th><th>system</th><th>team</th><th>AI</th><th>energy, re-measured</th><th>gap</th><th>compute</th><th>links</th></tr></thead>
    <tbody>${[...entries].sort((a, b) => rank(a) - rank(b) || a.e.energy_per_site - b.e.energy_per_site).map(s => `<tr id="${entryId(s.e)}">
      <th scope="row"><a href="${instanceHref(s)}">${esc(modelName(s.x.inst.model))} ${esc(instanceLabel(s.x.inst))}</a></th>
      <td>${esc(s.e.system)}${s.live ? "" : ' <span class="badge" title="A newer entry of this system on this instance replaces it">replaced</span>'}${s.flagged ? ` <span class="badge flag" title="${esc(s.e.flags.join("; "))}">did not verify</span>` : ""}</td>
      <td>${esc(s.e.team)}</td><td>${aiBadge(s.e.ai_involvement)}</td>
      <td class="record nowrap"><span class="num">${quote(s.e.energy_per_site, s.e.sigma_per_site).text}</span> <span class="muted">${perSiteLabel(s.x.inst)}</span></td>
      <td class="num">${s.solved ? '<span class="badge" title="QMBL has an exact energy for this instance now">solved</span>' : s.first ? '<span class="muted">first state</span>' : gapText(s.gap)}${s.record ? '<span class="tag">new record</span>' : ""}</td>
      <td>${compute(s.e.compute)}</td><td>${links(s.e.links)}</td></tr>`).join("")}</tbody></table></div>`;

  // Only once there are entries (2026-10-09): the systems on the Leaderboard, the
  // entries on the Table, after the targets.
  const systemsSection = systems.length ? `
<h2 id="systems">Systems</h2>
<p class="muted">Lowest median gap first; only a system's live, verified entries on open instances count.</p>
${systemsTable}` : "";
  const entriesSection = entries.length ? `
<h2 id="entries">Entries</h2>
${entriesTable}` : "";

  // The figures: the Leaderboard's own, then the home page's sections for these instances
  // (site.mjs, `figureSections`), with a hover card for each Table row they link to, as on the
  // home page, and one for each entry drawn; an entry links to its row on the Table.
  const fig = openProblemsFigure(targets, entries.filter(s => !s.solved && !s.flagged), e => `${OPEN_PROBLEMS_TABLE_URL}#${entryId(e)}`);
  const figHtml = figure([FIGURE_NAME, fig.title, fig.caption], "", fig.svg) + "\n" + figureSections;
  const figRows = new Set([...[...figHtml.matchAll(/href="\/instances\/#(r-[\w-]+)"/g)].map(m => m[1]),
    ...[...figHtml.matchAll(/data-rows="([\w -]+)"/g)].flatMap(m => m[1].split(" "))]);
  const cards = instances.flatMap(inst => inst.rows.filter(r => figRows.has(rowId(inst, r)))
    .map(r => `<div data-row="${rowId(inst, r)}">${rowCard(r, inst)}</div>`));
  if (cards.length !== figRows.size) throw new Error(`the Open Problems figures link ${figRows.size} rows, ${cards.length} found in data/`);
  const drawn = new Set([...figHtml.matchAll(/href="\/open-problems\/table\/#(e-[\w-]+)"/g)].map(m => m[1]));
  const entryCards = entries.filter(s => drawn.has(entryId(s.e))).map(s => `<div data-row="${entryId(s.e)}"><b>${esc(modelName(s.x.inst.model))} ${esc(instanceLabel(s.x.inst))}</b>
<span>${esc(s.e.system)}, ${esc(s.e.team)} &middot; ${AI_LABELS[s.e.ai_involvement]}</span>
<span class="e"><span class="num">${quote(s.e.energy_per_site, s.e.sigma_per_site).text}</span> <span class="muted">${perSiteLabel(s.x.inst)} &middot; verified entry</span>${s.record ? '<span class="tag">new record</span>' : ""}</span>
<span class="muted">${s.first ? "the first verified state on this instance" : `gap ${gapText(s.gap)}`}</span></div>`);

  // One table per model, with the Table's names and labels. An instance links to its target row
  // in the Table, which opens the instance there; without a variational energy, to its record row
  // (or its lowest row). Each row carries QMBL's search index and each section its lattice and
  // size badges, so the search bar on top filters as QMBL's Table does (2026-10-09).
  const sections = groups.map(([model, name, group]) => {
    const lattices = [...new Set(group.map(x => latticeOf(x.inst)))].sort();
    const bands = SIZE_BANDS.filter(([key]) => group.some(x => sizeBand(x.inst) === key));
    const badges = `<div class="quick">
    <span class="muted">lattice</span>${lattices.map(l => `<button type="button" data-lattice="${esc(l)}">${esc(l)}</button>`).join("")}
    ${bands.length > 1 ? `<span class="muted">size</span>${bands.map(([key, , label]) => `<button type="button" data-size="${key}">${label}</button>`).join("")}` : ""}
  </div>`;
    const rows = group.map(x => {
      const { t, inst, row, estimate, first } = x;
      const linked = row ?? recordOf(inst) ?? [...inst.rows].sort((a, b) => a.energy - b.energy)[0];
      const beat = row ? `<td class="record">${energyCell(row, inst)}</td><td>${esc(row.method)}</td><td>${citeHtml(row)}</td>`
        : first ? `<td class="record"><span class="num">${quote(first.energy_per_site, first.sigma_per_site).text}</span></td><td>${esc(first.system)}</td><td><a href="#${entryId(first)}">first verified state</a></td>`
        : '<td colspan="3" class="muted">no variational energy yet; the first verified state sets it</td>';
      const search = searchIndex(inst, name);
      return `<tr id="${targetId(inst)}" class="op-row" data-search="${esc(search.own)}" data-methods="${esc(search.methods)}" data-lattice="${esc(latticeOf(inst))}" data-size="${sizeBand(inst)}">
        <th scope="row"><a href="/instances/#${rowId(inst, linked)}">${esc(instanceLabel(inst))}</a></th>
        ${beat}<td>${estimate ? `${energyCell(estimate, inst)} <span class="badge">${boundLabel(estimate)}</span>` : ""}</td>
        <td class="num">${inst.rows.length}</td>
        <td>${t.verifier.supported ? '<span class="muted">yes</span>' : `not yet <span class="muted">(${esc(t.verifier.reason)})</span>`}</td></tr>`;
    }).join("");
    return `<section class="targets" data-model="${model}">
  <h3 id="targets-${model.toLowerCase()}">${esc(name)}<a class="anchor" href="#targets-${model.toLowerCase()}" aria-label="Link to this section">#</a></h3>
  <p class="muted"><span class="count">${group.length} instance${group.length === 1 ? "" : "s"}</span>, energies as <code>${perSiteLabel(group[0].inst)}</code></p>
  ${badges}
  <div class="scroll"><table class="leaderboard op-wide">
    <thead><tr><th>instance</th><th>energy to beat</th><th>method</th><th>source</th><th>record (estimate)</th><th>results</th><th>verifier</th></tr></thead>
    <tbody>${rows}</tbody></table></div>
</section>`;
  }).join("\n");

  // Both pages open with the title, GitHub and Cite on its line, to its right (
  // 2026-10-09; the Zenodo link was removed the same day), and under it the two tabs, written as
  // the header's menu links. A figure carries its own title, so on the Leaderboard nothing but the
  // lead stands above the first. Both end with the citation, as QMBL's home page does.
  const head = url => `
<div class="op-title"><h1>The best published ground-state energies of open problems</h1>
<p class="op-links"><a class="ext" href="${SUBMISSIONS}" aria-label="QMBL: Open Problems on GitHub" title="Targets and entries on GitHub">${GITHUB_MARK}</a>
<button class="cite-btn" type="button" data-cite="${esc(citation)}" title="Copy the citation">&#10077;<span>Cite</span></button></p></div>
<nav class="op-tabs" aria-label="QMBL: Open Problems">${[[OPEN_PROBLEMS_URL, "Leaderboard"], [OPEN_PROBLEMS_TABLE_URL, "Table"]].map(([href, label]) =>
    `<a href="${href}"${href === url ? ' aria-current="page"' : ""}>${label}</a>`).join("")}</nav>`;
  const cite = `
<section class="cite" id="cite">
  <h2>Citing QMBL: Open Problems</h2>
  <p>QMBL: Open Problems has no DOI of its own yet. Its targets are QMBL's open instances, so cite QMBL by its concept DOI, which always resolves to the latest release:</p>
  <blockquote class="citation">${esc(CITE_HEAD)}, <em>${esc(CITE_TITLE)}</em>, Zenodo (${esc(CITE_YEAR)}).
  <a href="https://doi.org/${esc(DOI)}">${esc(DOI)}</a></blockquote>
  <p>Individual energies should cite the primary paper named on the row, not this site.</p>
</section>`;

  const leaderboard = `${head(OPEN_PROBLEMS_URL)}
<p class="lead">QMBL: Open Problems is a record book of the state of the art in quantum many-body simulation for problems with no exact ground-state energy. Scientists and AI systems should use the shared results to build on each other's work more efficiently and advance frontier science.</p>

${figHtml}
<template id="fig-cards">${[...cards, ...entryCards].join("\n")}</template>
${FIG_SCRIPT}
${systemsSection}
${cite}`;

  // The search bar and the Hamiltonian badges of QMBL's Table, with its matching (searchWords,
  // searchMatch, SEARCH_STOP from site.mjs); these rows open nothing, so there is no row to expand.
  const search = `
<p class="search"><input id="filter" type="search" placeholder="Filter by Hamiltonian, lattice, size, coupling or method…" autocomplete="off" spellcheck="false">
<span id="filter-count" class="muted"></span></p>
<div class="quick models"><span class="muted">Hamiltonian</span>${groups.map(([m, name]) => `<button type="button" data-model="${m}">${esc(name)}</button>`).join("")}</div>`;
  const searchScript = `<script>
const box = document.getElementById("filter");
const count = document.getElementById("filter-count");
const sections = [...document.querySelectorAll("section[data-model]")];
const total = document.querySelectorAll("tr.op-row").length;
const searchWords = ${searchWords};
const searchMatch = ${searchMatch};
const STOP = new Set(${JSON.stringify(SEARCH_STOP)});
const index = new Map([...document.querySelectorAll("tr.op-row")].map(row => {
  const own = row.dataset.search.split(" ");
  return [row, row.dataset.methods ? row.dataset.methods.split("|").map(m => own.concat(m.split(" "))) : [own]];
}));
function apply() {
  const q = box.value.trim();
  const words = searchWords(q).filter(([w]) => !STOP.has(w));
  const model = document.querySelector(".models button.on")?.dataset.model;
  let shown = 0;
  for (const section of sections) {
    const outside = model && section.dataset.model !== model;
    const lattice = section.querySelector(".quick button[data-lattice].on")?.dataset.lattice;
    const size = section.querySelector(".quick button[data-size].on")?.dataset.size;
    const rows = [...section.querySelectorAll("tr.op-row")];
    let n = 0;
    for (const row of rows) {
      const hit = !outside && (!words.length || searchMatch(index.get(row), words))
        && (!lattice || row.dataset.lattice === lattice)
        && (!size || row.dataset.size === size);
      row.hidden = !hit;
      if (hit) n++;
    }
    shown += n;
    section.hidden = outside || (!n && !lattice && !size);
    section.querySelector(".count").textContent = (n === rows.length ? "" : n + " of ") + rows.length + (rows.length === 1 ? " instance" : " instances");
  }
  count.textContent = q || model ? shown + " of " + total + " instances" : "";
}
box.addEventListener("input", apply);
for (const b of document.querySelectorAll(".quick button")) b.addEventListener("click", () => {
  const on = b.classList.contains("on");
  const key = ["model", "lattice", "size"].find(k => k in b.dataset);
  for (const o of b.parentElement.querySelectorAll("button[data-" + key + "]")) o.classList.remove("on");
  if (!on) b.classList.add("on");
  apply();
});
</script>`;

  const table = `${head(OPEN_PROBLEMS_TABLE_URL)}
${search}
${sections}
${searchScript}
${entriesSection}
${cite}`;

  const what = `The ${n} lattice Hamiltonians in QMBL with no exact ground-state energy, as open problems for scientists and AI systems`;
  return {
    leaderboard: { body: leaderboard, description: `${what}: the best published energies on them, by system size, Hamiltonian and cost.` },
    table: { body: table, description: `${what}: the energy to beat on each, and the verified entries.` },
  };
}

// Two lines for llms.txt.
export const openProblemsLlms = op => [
  `- [Open Problems](https://qmbl.org${OPEN_PROBLEMS_URL}): the best published energies on the ${op.targets.length} instances with no exact ground-state energy, open problems for scientists and AI systems, in the home page's figures.`,
  `- [Open Problems table](https://qmbl.org${OPEN_PROBLEMS_TABLE_URL}): the energy to beat on each of them, and the verified entries.`,
];

// The menu button, last in the menu (site.mjs) on every page, so its rules go into the site's
// stylesheet: a filled pill in the navy accent that turns ink on hover and on its own page
// (2026-10-09: ink, with colour, also on hover), so it reads as a button beside the
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

// The rest of what /open-problems/ needs, in a stylesheet of its own that only that page links
// (site.mjs, open-problems.css), with the rules of its figure switches.
export const OPEN_PROBLEMS_PAGE_CSS = `/* GitHub and Cite on the title's line, centred on it, as the header's mark and Cite
   pill; on a narrow screen they wrap under it. */
div.op-title { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem 1.6rem; margin: 0 0 1.3rem; }
div.op-title h1 { margin: 0; }
p.op-links { display: flex; flex-wrap: wrap; align-items: center; gap: 1.2rem; margin: 0; }
p.op-links a.ext { color: var(--muted); display: inline-flex; }
p.op-links a.ext:hover { color: var(--ink); }
p.op-links a.ext svg { display: block; }
/* The Leaderboard and Table tabs under the title, written as the header's menu links. */
nav.op-tabs { display: flex; gap: 1.2rem; font-size: 0.95rem; margin: 0 0 1.2rem; }
nav.op-tabs a { color: var(--ink2); text-decoration: none; }
nav.op-tabs a:hover { color: var(--accent); }
nav.op-tabs a[aria-current] { color: var(--ink); box-shadow: inset 0 -2px 0 var(--accent); }
section.targets h3 { margin-top: 2.2rem; }
section.targets h3 + p.muted { margin: 0.2rem 0 0; }
.nowrap { white-space: nowrap; }
/* On a phone the targets and entries tables keep their desktop layout, one line a row, and
   scroll sideways in their .scroll box instead of folding every cell into a tall column. */
@media (max-width: 760px) { table.op-wide { min-width: 72rem; } }
`;
