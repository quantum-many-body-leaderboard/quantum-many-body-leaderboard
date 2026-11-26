// The arena (2026-11-26): the front page with the Open Problems switch on. The menu's "Arena" switch
// spins the ring up, the page turns dark, and under the ring come the standings of the published
// papers on the open problems, the recent record changes, the prompt to bring an agent, and the
// latest entries. This module gives the data and the panels; scripts/assets/arena.js draws them and
// the animation, and site.mjs puts them on the front page.
//
// Only instances with a variational energy are read: an open instance without one stays private
// (its first verified state sets the target), so it never shows here, not even by its name.
//
// Standings: a paper holds a clear lead on an open problem where its variational energy is the
// lowest and more than 2 sigma below the next paper's (QMBL's tie rule, RULES.md 6; a missing sigma
// counts as 0, as in open_problems.mjs). A record change: the lowest variational energy on an open
// problem comes from a paper whose arXiv month is later than that of the paper it beat by more
// than 2 sigma. Hot: a Hamiltonian with a record change this or last calendar month (arXiv gives
// the month only); its node gets the amber rim and lets go sparks.
//
// Latest entries: the verified entries (results/ in the Open Problems checkout) and the open pull
// requests that add a submission, read from GitHub at build time. A pull request shows its number,
// its author's GitHub name, the day it was opened and its step, from the maintainers' labels
// ("in review", "measuring"); never its title or text, which nobody has checked yet. Without
// network the build goes on with the verified entries alone.
import fs from "node:fs";
import { citeRef, paperYear } from "./cite.mjs";
import { paperOf } from "./enrich_sources.mjs";
import { rowId } from "./summary.mjs";

export const OP_REPO = "https://github.com/quantum-many-body-leaderboard/open-problems";
const API = "https://api.github.com/repos/quantum-many-body-leaderboard/open-problems";
const SIGMAS = 2;

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const key = r => { const c = citeRef(r); return c.url ?? c.text; };
const month = r => { const a = paperOf(r)?.arxiv; return a && /^\d{4}\./.test(a) ? `20${a.slice(0, 2)}-${a.slice(2, 4)}` : null; };
const ahead = (o, row) => o && o.energy - row.energy > SIGMAS * Math.hypot(o.sigma ?? 0, row.sigma ?? 0);

// `targets` from open_problems.mjs score(); `models` the picker's (hero.mjs), for names and slugs.
export function arenaData(targets, models, now = new Date()) {
  const names = Object.fromEntries(models.map(m => [m.model, { name: m.name, slug: m.slug }]));
  const papers = new Map(), events = new Map();
  for (const { row, inst } of targets) {
    if (!row) continue;
    const k = key(row), c = citeRef(row);
    const others = inst.rows.filter(r => r.bound_type === "variational" && !r.defect && key(r) !== k).sort((a, b) => a.energy - b.energy);
    const p = papers.get(k) ?? { text: c.text, lead: {}, row: {} };
    if (ahead(others[0], row)) { p.lead[inst.model] = (p.lead[inst.model] ?? 0) + 1; p.row[inst.model] ??= rowId(inst, row); }
    papers.set(k, p);
    const m = month(row); if (!m) continue;
    const before = others.filter(o => { const om = month(o); return om ? om < m : paperYear(o) && paperYear(o) < +m.slice(0, 4); })[0];
    if (!ahead(before, row)) continue;
    const ek = `${m} ${k} ${inst.model}`;
    const e = events.get(ek) ?? { month: m, text: c.text, model: inst.model, n: 0, prev: new Set(), row: rowId(inst, row) };
    e.n++; e.prev.add(citeRef(before).text); events.set(ek, e);
  }
  const since = new Date(now.getFullYear(), now.getMonth() - 1, 15).toISOString().slice(0, 7);
  return {
    names,
    papers: [...papers.values()].filter(p => Object.keys(p.lead).length),
    events: [...events.values()].sort((a, b) => b.month.localeCompare(a.month) || b.n - a.n).slice(0, 20).map(e => ({ ...e, prev: [...e.prev] })),
    hot: [...new Set([...events.values()].filter(e => e.month >= since).map(e => e.model))],
  };
}

// The open pull requests that add a submission, or null without network. GITHUB_TOKEN, where set
// (the Pages workflow), raises GitHub's rate limit; the repository is public either way.
export async function openPullRequests() {
  const headers = { accept: "application/vnd.github+json", "user-agent": "qmbl-site" };
  if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const get = async url => {
    const r = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
    if (!r.ok) throw new Error(`${url}: ${r.status}`);
    return r.json();
  };
  try {
    const pulls = await get(`${API}/pulls?state=open&per_page=100`);
    const out = [];
    for (const p of pulls) {
      const files = await get(`${API}/pulls/${p.number}/files?per_page=100`);
      // submissions/<model>/<instance>/<entry>/...: the instance id as the entrant wrote it, checked below.
      const sub = files.map(f => f.filename.match(/^submissions\/([^/]+)\/([^/]+)\//)).find(Boolean);
      if (!sub) continue;
      const labels = p.labels.map(l => l.name);
      out.push({ number: p.number, url: p.html_url, login: p.user.login, opened: p.created_at.slice(0, 10), instance: `${sub[1]}/${sub[2]}`,
        step: labels.includes("measuring") ? "measuring" : labels.includes("in review") ? "in review" : "submitted" });
    }
    return out;
  } catch (e) {
    console.log(`arena: open pull requests not read (${e.message}); the latest entries show the verified ones only`);
    return null;
  }
}

const STEPS = [["submitted", "pull request opened"], ["in review", "code read before it runs"], ["measuring", "measured twice by QMBL"], ["verified", "listed, a record if more than 2σ below"]];

// The panels under the ring. `entries` from score(), `pulls` from openPullRequests(); `shown` the
// instance ids that may be named (open with a variational energy, or solved); `label` an instance's name.
export function arenaHtml({ prompt, entries, pulls, shown, label, modelName, citation }) {
  const day = s => new Date(`${s}T12:00:00Z`).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  const where = id => shown.has(id) ? esc(label(id)) : "";
  const rows = [
    ...(pulls ?? []).map(p => ({ step: p.step, date: p.opened,
      html: `<a href="${esc(p.url)}">pull request #${p.number}</a> by ${esc(p.login)}${where(p.instance) ? ` <span>${where(p.instance)}</span>` : ""}` })),
    ...entries.filter(s => s.live).map(s => ({ step: "verified", date: s.e.measured ?? s.e.date ?? "",
      html: `${esc(s.e.system)} by ${esc(s.e.team)}${where(s.e.instance_id) ? ` <span>${where(s.e.instance_id)}</span>` : ""}${s.record ? ` <b class="ar-rec">record</b>` : ""}` })),
  ].sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 8);
  const steps = STEPS.filter(([k]) => rows.some(r => r.step === k));
  const latest = !rows.length ? "" : `
<div class="ar-card ar-entries"><h2>Latest entries</h2>
<table><tbody>${rows.map(r => `<tr><td class="ar-step">${r.step}</td><td>${r.html}<small>${r.date ? day(String(r.date).slice(0, 10)) : ""}</small></td></tr>`).join("")}</tbody></table>
<ol class="ar-steps">${steps.map(([k, v]) => `<li><b>${k}</b>${v}</li>`).join("")}</ol></div>`;
  return `<section id="arena">
<div class="ar-card ar-stand"><h2>Standings</h2><div class="ar-seg"><select id="ar-model" aria-label="Hamiltonian"><option value="">All Hamiltonians</option></select></div><div id="ar-rows"></div></div>
<div class="ar-card ar-feed"><h2>Recent record changes</h2><div id="ar-events"></div></div>
<div class="ar-card ar-agent"><h2>Bring your agent</h2><p>Paste this into any coding agent. It points the agent to the open problems, the values to beat and how to enter.</p><div class="ar-prompt" id="ar-prompt">${esc(prompt)}</div><button class="ar-cta" id="ar-copy" type="button">Copy prompt for your agent</button><a href="${OP_REPO}/blob/main/README.md#how-to-enter">How to enter</a></div>${latest}
</section>`;
}

// The arena's citation block, worded as the Open Problems README prints it (its scripts/readme.mjs).
export const arenaCiteHtml = c => `<section class="cite" id="ar-cite">
  <h2>Citing ${esc(c.title)}</h2>
  <p>Cite ${esc(c.title)} by its concept DOI, which always resolves to the latest release:</p>
  <blockquote class="citation">${esc(c.head)}, <em>${esc(c.title)}</em>, Zenodo (${c.year}).
  <a href="https://doi.org/${c.doi}">${c.doi}</a></blockquote>
  <p>Individual energies should be cited to the primary paper named on the row, not to this site.</p>
</section>`;
export const arenaCitation = c => `${c.head}, ${c.title}, Zenodo (${c.year}). https://doi.org/${c.doi}`;

// The prompt from the Open Problems README's first text block, as an agent reads it.
export function agentPrompt(dir) {
  const readme = fs.readFileSync(`${dir}/README.md`, "utf8");
  return readme.match(/```text\n([\s\S]*?)```/)?.[1].trim().replace(/^ +/gm, "") ?? null;
}
