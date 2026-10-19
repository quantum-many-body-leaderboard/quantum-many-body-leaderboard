// Build the read-only site at qmbl.org into _site/.
//
// Generated from data/ by the same modules the README is generated from: units.mjs for
// every conversion, summary.mjs for what a record is, readme_table.mjs for how an
// instance is named and how a number is quoted, so the site and the README show the same numbers.
//
// The figures on the front page are the committed figures/*.svg, drawn by size_accuracy.mjs
// and pareto.mjs from the same data/; this script inlines them, so that a mark standing for
// a row can link to that row in the table and show a card for it on hover. A figure carries
// its own title and subtitle, so the page puts nothing above it; the title and caption
// listed here are its accessible label.
// RULES.md and DATA.md are read on GitHub; /rules/ and /data/ redirect there.
//
// No dependencies and no build step: plain strings, written once. `_site/` is generated
// output and is never committed.
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { perSiteDivisor, perSiteLabel, recordEligible, boundLabel, stochasticExact, publishedMethod, methodLabel } from "./units.mjs";
import { collect, recordOf, summarize, rowId } from "./summary.mjs";
import { THEMES, W } from "./chart.mjs";
import { citeRef, paperYear } from "./cite.mjs";
import { sources } from "./enrich_sources.mjs";
import { quote, shorten, MODELS, BOUNDARY, instanceLabel, byGeometry, noRecordReason, gapAbove } from "./readme_table.mjs";
import { logoSvg, faviconSvg, LOGO_CSS } from "./logo.mjs";
import { hoursOrEdOf, costFigureName, flopsFigureName, paramsFigureName } from "./cost.mjs";
import { FRONTIER } from "./views.mjs";
import { energyFigures } from "./ladders.mjs";
import { loadOpenProblems, openProblemsPages, openProblemsLlms, OPEN_PROBLEMS_URL, OPEN_PROBLEMS_TABLE_URL, OPEN_PROBLEMS_NAV_CSS, OPEN_PROBLEMS_PAGE_CSS } from "./open_problems.mjs";

const OUT = "_site";
const REPO = "https://github.com/quantum-many-body-leaderboard/quantum-many-body-leaderboard";
const RULES = `${REPO}/blob/main/RULES.md`;
const DATA = `${REPO}/blob/main/DATA.md`;
const DOI = "10.5281/zenodo.22753734";
const ARXIV = "2610.22387";
const BUILT = new Date().toISOString().slice(0, 10);

// The citation the Cite button copies and the front page prints is the paper; the data is
// cited by the concept DOI. The release year comes from CITATION.cff.
const CFF = fs.readFileSync("CITATION.cff", "utf8");
const cffField = k => CFF.match(new RegExp(`^${k}:\\s*"?([^"\\n]+)"?\\s*$`, "m"))?.[1];
const VERSION = cffField("version");
const RELEASED = cffField("date-released");
if (!VERSION || !RELEASED) throw new Error("CITATION.cff: version or date-released not found");
const CITE_HEAD = "T. Zerweck and J. Carrasquilla";
const CITE_TITLE = "QMBL: the Quantum Many-Body Leaderboard";
const CITATION = `${CITE_HEAD}, ${CITE_TITLE}, arXiv:${ARXIV} (2026). https://arxiv.org/abs/${ARXIV}`;

const cache = sources();
const instances = collect();
const summary = summarize(instances);

// ------------------------------------------------------------------------------ html
const esc = s => String(s)
  // Entities written in the source markdown (&#9675;, &dagger;) must survive escaping;
  // a bare ampersand must not.
  .replace(/&(?![#A-Za-z0-9]+;)/g, "&amp;")
  .replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// QMBL: Open Problems (open_problems.mjs), built only where its repository is checked out
// beside this one or at OPEN_PROBLEMS_DIR; without it those pages are left out. Its targets
// are this build's instances with no exact energy (the checkout's scripts/targets.mjs).
const OPEN_PROBLEMS = await loadOpenProblems(instances);

// The front page is the leaderboard (the figures), /instances/ the table.
const NAV = [
  ["/", "Leaderboard"],
  ["/instances/", "Table"],
];
// Open Problems is a button at the very right of the menu, after Cite.
const opButton = url => (OPEN_PROBLEMS
  ? `<a href="${OPEN_PROBLEMS_URL}" class="op"${url.startsWith(OPEN_PROBLEMS_URL) ? ' aria-current="page"' : ""}>Open Problems</a>` : "");

// GitHub's mark (octicon mark-github, MIT), inline so it takes the nav's colour.
const GITHUB_MARK = `<svg viewBox="0 0 16 16" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>`;
// ETH Zurich logo (short form, black/white per the colour scheme), from ETH's eth_logo_kurz_pos.svg, cropped to the glyphs; the clear zone is the CSS margin.
const ETH_LOGO = `<svg class="eth-logo" viewBox="22.68 22.67 140.71 22.69" role="img" aria-label="ETH Zurich"><g fill="currentColor"><path d="M109.18,39.305c-0.81,4.017-3.913,4.221-4.528,4.221c-1.752,0-2.797-1.012-2.797-2.705c0-0.386,0.057-0.912,0.155-1.439 l1.919-9.562l0.008-0.037h-2.267l-1.956,9.805l-0.026,0.14c-0.084,0.443-0.163,0.863-0.163,1.408c0,2.634,1.73,4.402,4.309,4.402 c1.886,0,3.401-0.619,4.507-1.841l-0.294,1.615l-0.007,0.038h2.235l3.088-15.53l0.006-0.037h-2.299L109.18,39.305z"/><path d="M124.635,29.595c-1.752,0-3.304,0.716-4.281,1.974l0.351-1.748l0.007-0.037h-2.235l-3.089,15.529l-0.007,0.038h2.269 l1.891-9.524c0.483-2.445,2.36-4.218,4.465-4.218c0.904,0,1.616,0.356,2.176,1.087l0.021,0.028l1.841-1.649l-0.019-0.023 C127.174,30.07,126.064,29.595,124.635,29.595z"/><polygon points="87.149,31.759 87.143,31.797 94.878,31.797 84.579,43.442 84.574,43.448 84.186,45.351 95.164,45.351 95.554,43.337 87.348,43.337 97.679,31.692 97.684,31.685 98.071,29.784 87.534,29.784"/><polygon points="128.332,45.313 128.324,45.351 130.591,45.351 133.684,29.784 131.455,29.784"/><path d="M159.072,29.596c-1.865,0-3.321,0.571-4.44,1.75l1.759-8.668h-2.268l-4.555,22.676h2.268l1.891-9.525 c0.811-4.015,3.941-4.218,4.56-4.218c1.733,0,2.769,1.011,2.769,2.704c0,0.384-0.059,0.908-0.158,1.44l-1.924,9.6h2.266 l1.988-9.809c0.096-0.521,0.159-0.962,0.159-1.547C163.385,31.365,161.649,29.596,159.072,29.596z"/><path d="M144.041,29.595c-4.113,0-7,2.897-7.923,7.949c-0.166,0.846-0.224,1.792-0.224,2.397c0,3.452,2.096,5.597,5.472,5.597 c1.963,0,3.755-0.752,5.181-2.177l0.021-0.021l-1.308-1.595l-0.023-0.028l-0.024,0.027c-1.203,1.266-2.281,1.783-3.721,1.783 c-1.609,0-3.33-0.958-3.33-3.648c0-0.842,0.1-1.538,0.249-2.322c0.243-1.32,0.79-3.164,2.005-4.447 c0.966-0.996,2.111-1.5,3.406-1.5c1.352,0,2.197,0.481,3.021,1.715l0.02,0.031l1.664-1.406l0.023-0.02l-0.018-0.025 C147.396,30.306,146.01,29.595,144.041,29.595z"/><polygon points="132.296,25.512 134.568,25.512 135.133,22.677 132.869,22.677"/><polygon points="110.249,25.512 112.522,25.512 113.084,22.677 110.823,22.677"/><polygon points="104.203,25.512 106.475,25.512 107.039,22.677 104.777,22.677"/><polygon points="73.91,31.464 68.809,31.464 70.6,22.677 27.235,22.677 22.681,45.353 39.971,45.353 41.104,39.685 30.895,39.685 31.514,36.567 41.719,36.567 42.747,31.464 32.539,31.464 33.157,28.345 49.337,28.345 45.921,45.353 53.008,45.353 56.424,28.345 62.374,28.345 58.958,45.353 66.046,45.353 67.795,36.567 72.896,36.567 71.146,45.353 78.233,45.353 82.789,22.677 75.702,22.677"/></g></svg>`;

// The Cite button copies CITATION; where the clipboard is unavailable (no HTTPS, an old
// browser, a denied permission) it goes to the citing section on the front page instead,
// so the button never does nothing.
const CITE_SCRIPT = `<script>
for (const b of document.querySelectorAll("button.cite-btn")) b.addEventListener("click", () => {
  const done = () => { b.classList.add("copied"); b.querySelector("span").textContent = "Copied";
    setTimeout(() => { b.classList.remove("copied"); b.querySelector("span").textContent = "Cite"; }, 2000); };
  const fallback = () => { location.href = "/#cite"; };
  if (navigator.clipboard && navigator.clipboard.writeText)
    navigator.clipboard.writeText(b.dataset.cite).then(done, fallback);
  else fallback();
});
</script>`;

// schema.org Dataset for Google Dataset Search, on the front page only (one dataset, not one per instance).
function datasetLd() {
  return {
    "@context": "https://schema.org", "@type": "Dataset",
    name: "QMBL: the Quantum Many-Body Leaderboard",
    description: `Published ground-state energies: ${summary.rows} energies on ${summary.instances} Hamiltonian instances. Each row gives method, bound type, error bar where published, and its primary paper.`,
    url: "https://qmbl.org/", sameAs: [`https://doi.org/${DOI}`, `https://arxiv.org/abs/${ARXIV}`, REPO], identifier: `https://doi.org/${DOI}`,
    license: "https://www.apache.org/licenses/LICENSE-2.0",
    isAccessibleForFree: true, dateModified: BUILT,
    keywords: ["ground-state energy", "quantum many-body", "variational Monte Carlo", "neural quantum states", "DMRG", "quantum Monte Carlo", "Hubbard model", "J1-J2 model", "Heisenberg model", "benchmark"],
    creator: [
      { "@type": "Person", givenName: "Tristan", familyName: "Zerweck", name: "Tristan Zerweck" },
      { "@type": "Person", givenName: "Juan", familyName: "Carrasquilla", name: "Juan Carrasquilla" },
    ],
    distribution: [
      { "@type": "DataDownload", encodingFormat: "application/json", contentUrl: "https://qmbl.org/api/qmbl.json" },
    ],
  };
}

// `css` is a page's own stylesheet, after the site's (open-problems.css). `ogTitle` is the
// link-preview title; by default a subpage's title followed by " · QMBL".
function page({ url, title, description, body, wide = false, jsonld = null, css = null, ogTitle = null }) {
  const head = title === null ? "QMBL: the Quantum Many-Body Leaderboard" : `${title} &middot; QMBL`;
  return `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${head}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="https://qmbl.org${url}">
<link rel="stylesheet" href="/style.css?v=${CSS_VERSION}">${css ? `\n<link rel="stylesheet" href="${css}">` : ""}
<link rel="icon" href="/favicon.svg" type="image/svg+xml" sizes="any">
<link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:title" content="${esc(ogTitle ?? (title === null ? "QMBL: the Quantum Many-Body Leaderboard" : `${title} · QMBL`))}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="website">
<meta property="og:url" content="https://qmbl.org${url}">
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, "\\u003c")}</script>\n` : ""}<header class="site">
  <a class="wordmark" href="/">${logoSvg()}<b>QMBL<span class="tagline">the quantum many-body leaderboard</span></b><span class="badge beta" title="QMBL is in beta: data and site are still being checked.">beta</span></a>
  <nav>${NAV.map(([href, label]) =>
    `<a href="${href}"${href === url ? ' aria-current="page"' : ""}>${label}</a>`).join("")}
    <a class="ext" href="${REPO}" aria-label="QMBL on GitHub" title="Source and data on GitHub">${GITHUB_MARK}</a>
    <button class="cite-btn" type="button" data-cite="${esc(CITATION)}" title="Copy the citation">&#10077;<span>Cite</span></button>${opButton(url)}</nav>
</header>
<main class="${wide ? "wide" : ""}">
${body}
</main>
<footer class="site">
  <p><a href="/contribute/">Contribute</a> &middot; <a href="${REPO}">Source and data</a> &middot;
     Apache-2.0</p>
  <p class="developed-at">Developed at <a href="https://ethz.ch" title="ETH Zurich">${ETH_LOGO}</a></p>
</footer>
${CITE_SCRIPT}
</html>
`;
}

// ---------------------------------------------------------------------- redirects
// /rules/ and /data/ forward to RULES.md and DATA.md on GitHub, fragment included, so a link
// to a section lands on that section.
function redirectPage(target, title) {
  return `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="robots" content="noindex">
<meta http-equiv="refresh" content="0; url=${target}">
<link rel="canonical" href="${target}">
<title>${title} &middot; QMBL</title>
<script>location.replace("${target}" + location.hash);</script>
<p>${title} is on GitHub: <a href="${target}">${target}</a></p>
</html>
`;
}

// ------------------------------------------------------------------------------- data
const instUrl = inst => `/i/${inst.instance_id}/`;
const jsonUrl = inst => `/api/i/${inst.instance_id}.json`;
const yearOf = r => paperYear(r, cache);
// The year column: a paper's year, or for QMBL's own runs the year the run finished.
const yearCell = r => (r.computed_by === "qmbl" ? +(r.verified?.checked_on || "").slice(0, 4) || null : yearOf(r));

const BOUND_ORDER = ["variational", "projected", "extrapolated", "approximate", "exact", null];
const BOUND_LABEL = {
  variational: "Strict variational upper bounds",
  projected: "Projected or fixed-node estimates",
  extrapolated: "Extrapolations",
  approximate: "Approximate methods (no bound)",
  exact: "Numerically exact",
  null: "Not yet classified",
};
const BOUND_NOTE = {
  variational: "Energies that a variational state reached (VMC, DMRG and MPS at finite bond dimension, PEPS, NQS, VQE). Each is an upper bound on the ground-state energy.",
  projected: "Variational only within a constraint: fixed-node, constrained-path, GFMC on a trial state. Each depends on its node or constraint, so two of them are not cleanly comparable to each other or to strict bounds.",
  extrapolated: "Zero-variance or bond-dimension extrapolations. These are not bounds: no ansatz reached the number.",
  approximate: "Methods that converge to a fixed approximation and not to the exact energy: RPA, finite-order perturbation theory, coupled cluster restricted to some of its terms. Their error has no known sign, so one holds the record only where no other unflagged energy is published (rules &sect;4).",
  exact: "Exact diagonalization, an exact solution, or sign-problem-free QMC where that is established. An exact energy is the record. QMC is exact only within its error bar, which it must state, and reads exact (stochastic); an exact diagonalization outranks it. For a diagonalization resolved by symmetry sector only the ground state's sector is listed; the lowest energies of the other sectors are the instance's spectrum, in its JSON, and hold no record.",
  null: "The method string does not say whether the energy is sign-problem-free or constrained, so no bound_type could be assigned without guessing.",
};

// The energy as the papers quote it, in the instance's own convention.
function perSite(row, inst) {
  const f = perSiteDivisor(inst) ?? 1;
  return { energy: row.energy / f, sigma: row.sigma == null ? null : row.sigma / f };
}

// One significant digit of uncertainty, the energy truncated to match. readme_table.mjs
// owns that convention; this only feeds it the converted numbers.
const quoteRow = (row, inst) => quote(perSite(row, inst).energy, perSite(row, inst).sigma);

// `decimals` forces a challenger to be quoted at the record's precision, so the two are
// readable against each other.
function energyCell(row, inst, decimals) {
  const { energy, sigma } = perSite(row, inst);
  const q = decimals == null ? quote(energy, sigma) : { text: energy.toFixed(decimals) };
  return `<span class="num">${q.text}</span>`;
}

// A table with a sigma column prints the energy without the bracketed digit, at the
// precision its own sigma sets, so the error bar is written once.
const bareEnergyCell = (row, inst) => energyCell(row, inst, quoteRow(row, inst).decimals);

// The site prints none of the README's markers for a missing error bar (the circle, the
// dagger): the sigma column says n/a. Methods print as methodLabel (units.mjs); the published
// string, searched but not shown, loses the source's own "(this work)" or "(Ours)", since the
// source column names the paper.
const methodText = method => method.replace(/\s*\((?:this work|ours)\)/gi, "");

// A flagged row's badge names its flag, and hovering it says what that kind of flag means in
// one sentence; the row's own finding is under Flagged rows on the instance page.
const FLAGS = {
  "below-exact": ["below exact energy", "The energy lies below the exact ground-state energy, which no variational result can."],
  "below-exact-suspected": ["likely below exact", "The energy appears to lie below the exact ground-state energy, but the evidence is not conclusive."],
  "energy-variance-inconsistent": ["energy and variance disagree", "The energy is lower than its own reported variance or error bar supports."],
  "dof-mismatch": ["wrong site count (dof)", "The stored degrees of freedom do not match the instance's site count, so a V-score computed from them would be wrong."],
  "wrong-instance": ["wrong instance", "The numbers were uploaded to the wrong instance and belong to another one."],
  "sampling-nonergodic": ["non-ergodic sampling", "The Monte Carlo chains did not sample ergodically, so the low energy is a sampling artifact."],
  "trace-readout": ["read off a training trace", "The energy is read off an optimisation trace, with no separate converged measurement or variance. Its error bar covers sampling only."],
  "sigma-understated": ["error bar understated", "The printed error bar is the standard error of a resampling mean, not the uncertainty of the energy."],
  "exact-above-variational-bound": ["above a variational bound", "This exact (stochastic) energy sits above a variational upper bound by more than its error bar explains, so the bar is understated; the bound keeps the record."],
};
const flagLabel = r => FLAGS[r.defect.flag]?.[0] ?? r.defect.flag;
const flagBadge = r => {
  const why = FLAGS[r.defect.flag]?.[1];
  return `<span class="badge flag"${why ? ` title="${esc(why)}"` : ""}>${esc(flagLabel(r))}</span>`;
};

function citeHtml(row) {
  const r = citeRef(row, cache);
  const link = (r.url ? `<a href="${esc(r.url)}">${esc(r.text)}</a>` : esc(r.text)) + (r.also ? `, <a href="${esc(r.also.url)}">${esc(r.also.text)}</a>` : "");
  return r.note ? `${link}<span class="muted">, ${esc(r.note)}</span>` : link;
}

// What the instance page says about its own currency: when the newest number here was
// published and, where the instance has a `coverage` entry (DATA.md), when its literature
// was last checked, how, and what that check found.
function coverage(inst) {
  const years = inst.rows.map(yearOf).filter(Boolean);
  const newest = years.length ? Math.max(...years) : null;
  const rows = newest ? `Newest published number here: <strong>${newest}</strong>.` :
    "No row here carries a publication year.";
  const last = (inst.coverage ?? []).at(-1);
  if (!last) return rows;
  const n = last.screened?.length ?? last.screened_count;
  return `${rows} Literature last checked <strong>${last.checked_on}</strong> (${last.method}): ${n} paper${n === 1 ? "" : "s"} read, ${last.found} of them with an energy on this page.`;
}

// The Hamiltonian, written out. Couplings come from the instance's own params; J1 = 1 and
// t = 1 set the energy scale.
function hamiltonian(inst) {
  const p = inst.params ?? {};
  const sum = sub => `&sum;<sub>${sub}</sub>`;
  const nn = "&#10216;ij&#10217;";
  const nnn = "&#10216;&#10216;ij&#10217;&#10217;";
  const dot = "&sigma;<sub>i</sub>&middot;&sigma;<sub>j</sub>";
  switch (inst.model) {
    case "Heisenberg":
      return { formula: `H = ${sum(nn)} ${dot}`,
        note: "Nearest-neighbour Heisenberg antiferromagnet, J = 1, written with Pauli matrices." };
    case "J1J2":
      return { formula: `H = ${sum(nn)} ${dot} + J<sub>2</sub> ${sum(nnn)} ${dot}`,
        note: `J<sub>1</sub> = 1, J<sub>2</sub> = ${p.J2}, nearest and next-nearest neighbours, written with Pauli matrices.` };
    case "TFIsing":
      return { formula: `H = &minus;${sum(nn)} &sigma;<sup>z</sup><sub>i</sub>&sigma;<sup>z</sup><sub>j</sub> &minus; h ${sum("i")} &sigma;<sup>x</sup><sub>i</sub>`,
        note: `Transverse field h = ${p.h}. Already in Pauli operators, with no S&middot;S term to rescale, so the per-site energy is E/N.` };
    case "Hubbard": {
      // The t12 and UV1V2 variants state their further couplings in params (DATA.md).
      const hop = (t, bonds) => `&minus;${t} ${sum(`${bonds},&sigma;`)} (c<sup>&dagger;</sup><sub>i&sigma;</sub>c<sub>j&sigma;</sub> + h.c.)`;
      const dd = (v, bonds) => ` + ${v} ${sum(bonds)} n<sub>i</sub>n<sub>j</sub>`;
      return { formula: `H = ${p.t2 == null ? hop("t", nn) : `${hop("t<sub>1</sub>", nn)} ${hop("t<sub>2</sub>", nnn)}`} + U ${sum("i")} n<sub>i&uarr;</sub>n<sub>i&darr;</sub>${p.V1 == null ? "" : dd("V<sub>1</sub>", nn) + dd("V<sub>2</sub>", nnn)}`,
        note: `${p.t2 == null ? "t = 1" : `t<sub>1</sub> = ${p.t1}, t<sub>2</sub> = ${p.t2}`}, U = ${p.U}${p.V1 == null ? "" : `, V<sub>1</sub> = ${p.V1}, V<sub>2</sub> = ${p.V2}`}, N<sub>&uarr;</sub> = N<sub>&darr;</sub> = ${p.Nf} on ${inst.n_sites} sites.` };
    }
    case "HEG2D": case "HEG3D": {
      // Track 2 (RULES.md 12.2): Ewald-summed Coulomb interaction with a uniform background and the Madelung term.
      const d = inst.model === "HEG3D" ? 3 : 2;
      return { formula: `H = &minus;&frac12; ${sum("i")} &nabla;<sub>i</sub><sup>2</sup> + ${sum("i&lt;j")} v<sub>E</sub>(r<sub>i</sub> &minus; r<sub>j</sub>) + N&xi;/2`,
        note: `Homogeneous electron gas in ${d}D: N<sub>&uarr;</sub> = ${p.N_up}, N<sub>&darr;</sub> = ${p.N_dn} in a periodic ${esc(inst.lattice)} cell at r<sub>s</sub> = ${p.rs} bohr, ${p.twist && p.twist !== "Gamma" ? `twist ${esc(String(p.twist))}` : "&Gamma; point"}. v<sub>E</sub> is the Ewald-summed Coulomb interaction with a uniform neutralizing background, &xi; the Madelung term. Hartree atomic units; the energy per electron is E/N.` };
    }
    case "tV":
      return { formula: `H = &minus;t ${sum(nn)} (c<sup>&dagger;</sup><sub>i</sub>c<sub>j</sub> + h.c.) + V ${sum(nn)} n<sub>i</sub>n<sub>j</sub>`,
        note: `Spinless fermions, t = 1, V = ${p.V}, ${p.Nf} particles on ${inst.n_sites} sites.` };
    default:
      return { formula: null,
        note: `An impurity model from VarBench (<code>${esc(inst.lattice)}</code>). VarBench defines its Hamiltonian, so it is not restated here. It has no meaningful per-site energy.` };
  }
}

// The Hubbard variants VarBench names by suffix. Their couplings, from VarBench's notes on these
// runs and Eq. (S6) of its supplement, are in params (corrections.mjs) and the formula above
// writes them out; this says where they come from and what the density terms couple.
function variantNote(inst) {
  const notes = `<a href="https://github.com/varbench/varbench/blob/main/Hubbard/supplements/Imada_group_overview.md">VarBench's notes on these runs</a> and Eq. (S6) of its supplement`;
  // t12 instances named with their t2 come from papers, not VarBench: H = -t sum - t' sum<<ij>> + U sum, t2 = t'.
  if (/_t12_-?[\d.]+$/.test(inst.instance_id))
    return `This instance is a <code>t12</code> variant with a next-nearest-neighbour hopping t<sub>2</sub>, written as in VarBench's Eq. (S6). t<sub>2</sub> is the t&prime; of the sources' H = &minus;t &sum;&#10216;ij&#10217; &minus; t&prime; &sum;&#10216;&#10216;ij&#10217;&#10217; + U &sum; n<sub>i&uarr;</sub>n<sub>i&darr;</sub>. The couplings are those each source prints (see the rows).`;
  if (/_UV1V2(?=_|$)/.test(inst.instance_id))
    return `This instance is the <code>t12</code> variant with the <code>UV1V2</code> interactions: a next-nearest-neighbour hopping t<sub>2</sub>, and density-density terms on nearest (V<sub>1</sub>) and next-nearest neighbours (V<sub>2</sub>), each bond once. The densities are the total densities n<sub>i</sub> = n<sub>i&uarr;</sub> + n<sub>i&darr;</sub>, as mVMC, the program behind its row, defines them; Eq. (S6) prints them between equal spins. Couplings from ${notes}.`;
  if (/_t12(?=_|$)/.test(inst.instance_id))
    return `This instance is the <code>t12</code> variant: a next-nearest-neighbour hopping t<sub>2</sub>, written as in Eq. (S6). Couplings from ${notes}.`;
  return null;
}

// An instance renamed because VarBench's name carries a different coupling or size from the one
// its rows were computed at, and the instance left holding the rows run at the named one
// (scripts/relabels.mjs).
function relabelNote(inst) {
  const link = id => `<a href="/i/${id}/"><code>${esc(id)}</code></a>`;
  // a directory or a file in the repository
  const evidence = path => { const p = path.replace(/\/$/, ""); return `<a href="${REPO}/${p === path ? "blob" : "tree"}/main/${p}">${esc(p)}</a>`; };
  if (inst.relabelled) {
    const from = instances.some(i => i.instance_id === inst.relabelled.from) ? link(inst.relabelled.from) : `<code>${esc(inst.relabelled.from)}</code>`;
    return `Upstream this instance is ${from}. ${esc(inst.relabelled.reason)} Evidence: ${evidence(inst.relabelled.evidence)}.`;
  }
  if (inst.split) return `${esc(inst.split.reason)} The published results for this Hamiltonian are on ${link(inst.split.to)}. Evidence: ${evidence(inst.split.evidence)}.`;
  return null;
}

// -------------------------------------------------------------------------- home page
// The front page is the figures. Each is drawn into figures/ by the build (size_accuracy.mjs,
// pareto.mjs) and committed, in a light and a dark variant for GitHub; the page inlines the
// light one and the stylesheet recolours it in dark mode (FIG_DARK). One entry per figure.
const FIGURES = [
  ["size-vs-accuracy", "The best published energies, by system size",
    "The energies on instances with an exact ground-state energy, placed by its relative gap to it so that different Hamiltonians share one axis; a better energy is lower. Colour is the kind of number, and a slashed mark is a flagged row."],
  ["size-vs-accuracy-by-family", "The best energies by system size, one panel per method family",
    "Each panel shows one family's energies in colour and all others in grey, and joins the family's best energy at each size."],
];

// A row of badges switching between panels, CSS-only: a radio input per badge, the checked
// one showing its panel, so the switch works without the script and the inputs stay in the
// keyboard order. The first badge is checked. The stylesheet is written before any page, so
// the rules for each switch come from tabRules() at module level, into TAB_CSS.
function tabs(id, items, lead = "") {
  return `${items.map((_, k) => `<input type="radio" name="${id}" id="${id}-${k}"${k ? "" : " checked"}>`).join("")}
  <div class="tab-labels">${lead}${items.map(([label], k) => `<label for="${id}-${k}">${label}</label>`).join("")}</div>
  <div class="tab-panels">${items.map(([, html]) => html).join("\n")}</div>`;
}
const tabRules = (id, count) => [...Array(count).keys()].map(k =>
  `#${id}-${k}:checked ~ .tab-panels > :nth-child(${k + 1}) { display: block; }
#${id}-${k}:checked ~ .tab-labels > label[for="${id}-${k}"] { color: var(--bg); background: var(--accent); border-color: var(--accent); }
#${id}-${k}:focus-visible ~ .tab-labels > label[for="${id}-${k}"] { outline: 2px solid var(--accent); outline-offset: 2px; }`).join("\n");

// The cost figures: one per instance with enough energies costed in hours, drawn by
// pareto.mjs into figures/cost/. Which instances have one is read off the directory, which
// pareto.mjs empties before writing, so the site never shows a figure for an instance that
// has lost its costs. Frontier instances first, in their order, then the rest by id.
const byFrontier = (a, b) => {
  const rank = i => { const k = FRONTIER.findIndex(([id]) => id === i.instance_id); return k < 0 ? FRONTIER.length : k; };
  return rank(a) - rank(b) || a.instance_id.localeCompare(b.instance_id);
};
const COST_FIGS = instances.filter(inst => fs.existsSync(`figures/${costFigureName(inst)}.svg`)).sort(byFrontier);
const costEntry = inst => [costFigureName(inst), `${modelName(inst.model)} ${instanceLabel(inst)}: the best energies at each cost`,
  "Every energy on this instance whose paper, or QMBL's own run, states its compute cost in hours, against that cost."];

// The estimated-FLOPs figures (flops.mjs): the same construction on an estimate from the
// parameter, sample and iteration counts a paper states, for the instances where two or
// more rows state all three. The estimate has its own axis, never the hours axis (DATA.md).
// Ordered like the cost figures.
const FLOPS_FIGS = instances.filter(inst => fs.existsSync(`figures/${flopsFigureName(inst)}.svg`)).sort(byFrontier);
const PARAMS_FIGS = instances.filter(inst => fs.existsSync(`figures/${paramsFigureName(inst)}.svg`)).sort(byFrontier);
const paramsEntry = inst => [paramsFigureName(inst), `${modelName(inst.model)} ${instanceLabel(inst)}: the best energies at each parameter count`,
  "Every energy on this instance whose paper states the ansatz's parameter count, against that count."];
const flopsEntry = inst => [flopsFigureName(inst), `${modelName(inst.model)} ${instanceLabel(inst)}: the best energies at each estimated cost in FLOPs`,
  "Every energy on this instance whose paper states its parameter, sample and iteration counts, against the floating-point operations those imply."];

// Front page: one section for all cost axes, in three rows of badges: the axis, then the
// model, then the instance, each row holding only what has a figure on the axis above it.
// Each axis keeps its own figures. An instance badge says only what tells it from its
// neighbours; what they all share stands once in front of the row.
const COMPUTE_AXES = [["stated hours", COST_FIGS, costEntry], ["estimated FLOPs", FLOPS_FIGS, flopsEntry], ["parameters", PARAMS_FIGS, paramsEntry]].filter(([, figs]) => figs.length);
const computeModels = figs => MODELS.map(([m]) => figs.filter(inst => inst.model === m).sort(byGeometry)).filter(g => g.length);
// An instance's label as parts, the lattice split off its size: "square 8x8, J2 = 0.5"
// is ["square", "8x8", "J2 = 0.5"].
const labelParts = inst => instanceLabel(inst).split(", ").flatMap((p, k) => (k ? [p] : p.match(/^([a-z-]+) (\d.*)$/)?.slice(1) ?? [p]));
function computeInstances(id, group, entry) {
  const parts = group.map(labelParts);
  const shared = group.length > 1 ? parts[0].filter(p => parts.every(q => q.includes(p))) : [];
  const lead = shared.length ? `<span class="shared">${esc(shared.join(", "))}</span>` : "";
  // The lattice and the size read as one part again when both are left: "square 6x6".
  const label = ps => ps.map((p, k) => (k === 1 && !shared.includes(ps[0]) && !shared.includes(p) && /^\d+x\d/.test(p) ? " " : k ? ", " : "") + p)
    .filter((p, k) => !shared.includes(ps[k])).join("").replace(/^, /, "");
  return tabs(id, group.map((inst, k) => [esc(label(parts[k])), figure(entry(inst))]), lead);
}
// `axes`, `prefix` and `hours` let /open-problems/ show the same section for its instances.
const computeTabs = (axes, prefix = "") => axes.flatMap(([, figs], a) => [[`${prefix}cost-${a}`, computeModels(figs).length],
  ...computeModels(figs).map((g, m) => [`${prefix}cost-${a}-${m}`, g.length])]);
const COMPUTE_TABS = computeTabs(COMPUTE_AXES);
// The section's lead names the axes it has, so it stays true where /open-problems/ has fewer.
const COST_AXIS_TEXT = { "stated hours": hours => `stated GPU or CPU hours (${hours} instances)`,
  "estimated FLOPs": () => "estimated FLOPs", parameters: () => "parameter count" };
const COUNT_WORDS = ["no", "one", "two", "three"];
function computeSwitcher(axes = COMPUTE_AXES, prefix = "", hours = COST_FIGS.length) {
  if (!axes.length) return "";
  const named = axes.map(([label]) => COST_AXIS_TEXT[label](hours));
  const list = named.length > 1 ? `${named.slice(0, -1).join(", ")}${named.length > 2 ? "," : ""} and ${named.at(-1)}` : named[0];
  const flops = axes.some(([label]) => label === "estimated FLOPs")
    ? ` FLOPs are estimated from the stated parameter, sample and step counts, or from the sweep schedules of public DMRG run scripts (<a href="${DATA}#how-a-flop-count-is-estimated">how</a>).` : "";
  return `<section class="tabs" id="energy-vs-compute">
  <h2>The best published energies, by cost</h2>
  <p class="muted">Cost on ${COUNT_WORDS[axes.length]} ${axes.length === 1 ? "axis" : "axes"}: ${list}.${flops}</p>
  ${tabs(`${prefix}cost-axis`, axes.map(([label, figs, entry], a) => [label, `<div class="tabs">${tabs(`${prefix}cost-${a}`, computeModels(figs).map((g, m) =>
    [esc(modelName(g[0].model)), `<div class="tabs">${computeInstances(`${prefix}cost-${a}-${m}`, g, entry)}</div>`]))}</div>`]))}
</section>`;
}
// The published energies of every Hamiltonian, drawn by size_energy.mjs into figures/energy/
// in the shape ladders.mjs gives them: per model and lattice a figure with one strip and its
// stops, per model an "other" figure for Hamiltonians published at one size. Badges pick the
// model and lattice; the figure is a slider of radio inputs (keyboard and no-script work),
// a badge under each stop at the strip's x position in per cent of its width, the stop with
// most energies shown first. A figure without an axis has no strip: its panels are stacked.
const ENERGY_FIGS = [...Map.groupBy(energyFigures(instances)
  .filter(f => fs.existsSync(`figures/${f.group === "other" ? f.name : f.stops[0].name}.svg`)), f => f.group)];
const otherEntry = f => [f.name, f.title, "Energies on Hamiltonians published at one size, with the coupling or filling that differs between them along x."];
const stopEntry = (f, facet, s) => [s.name, [f.title, facet.label, f.axis && `${f.axis} = ${s.label}`].filter(Boolean).join(", "),
  "Energy against the number of sites. Colour shows the bound type; the line joins the record at each size."];
const stripEntry = f => [f.strip, `${f.title}: the record at each ${f.axis} and size`,
  "One line per size, darker for larger sizes. The number over each stop is its count of energies; the marked stop is shown below."];

// Every slider on the page with its id, so that the HTML and the stylesheet agree.
const SLIDERS = ENERGY_FIGS.flatMap(([group, figs], j) => (group === "other" ? [] : figs.map((f, k) => ({ id: `slide-${j}-${k}`, f }))));

function slider({ id, f }) {
  if (!f.strip) return `<div class="stack">${f.facets.flatMap(x => x.stops.map(s =>
    (f.facets.length > 1 && x.label ? `<p class="facet">${esc(x.label)}</p>` : "") + figure(stopEntry(f, x, s)))).join("\n")}</div>`;
  // The pitch between stops as a share of the strip's width caps the badges, so that none
  // touches its neighbour at any column width; a dense row staggers over two rows on a phone.
  const pct = x => (100 * x / W).toFixed(2);
  return `<div class="slider${f.stops.length > 10 ? " dense" : ""}" style="--pitch:${pct(f.pitch)}%">${f.stops.map((s, k) => `<input type="radio" name="${id}" id="${id}-${k}"${k === f.start ? " checked" : ""}>`).join("")}
<div class="track">${figure(stripEntry(f), "strip")}
${f.facets.map(x => `<span class="axis" style="left:${pct(x.stops[0].x - f.pitch / 2)}%">${esc(f.axis)} =</span>`).join("")}${f.stops.map((s, k) => `<label for="${id}-${k}" style="left:${pct(s.x)}%">${esc(s.label)}</label>`).join("")}</div>
<div class="panels">${f.facets.flatMap(x => x.stops.map(s => figure(stopEntry(f, x, s)))).join("\n")}</div>
</div>`;
}
const sliderRules = ({ id, f }) => (f.strip ? f.stops.map((s, k) =>
  `#${id}-${k}:checked ~ .panels > :nth-child(${k + 1}) { display: block; }
#${id}-${k}:checked ~ .track .cur-${k} { display: inline; }
#${id}-${k}:checked ~ .track label[for="${id}-${k}"] { color: var(--bg); background: var(--accent); border-color: var(--accent); }
#${id}-${k}:focus-visible ~ .track label[for="${id}-${k}"] { outline: 2px solid var(--accent); outline-offset: 2px; }`).join("\n") : "");

function energySwitcher(groups = ENERGY_FIGS, sliders = SLIDERS, prefix = "") {
  if (!groups.length) return "";
  return `<section class="tabs" id="energy-by-hamiltonian">
  <h2>The published energies, by Hamiltonian</h2>
  ${tabs(`${prefix}energy-group`, groups.map(([group, figs], j) =>
    [group === "other" ? "Other" : esc(modelName(group)), `<div class="tabs">${tabs(`${prefix}energy-${j}`, figs.map(f =>
      [esc(f.label), group === "other" ? figure(otherEntry(f)) : slider(sliders.find(s => s.f === f))]))}</div>`]))}
</section>`;
}

const tabCss = (axes, groups, sliders, prefix = "") => [tabRules(`${prefix}cost-axis`, axes.length), ...computeTabs(axes, prefix).map(([id, n]) => tabRules(id, n)),
  tabRules(`${prefix}energy-group`, groups.length),
  ...groups.map(([, figs], j) => tabRules(`${prefix}energy-${j}`, figs.length)), ...sliders.map(sliderRules)].join("\n");
const TAB_CSS = tabCss(COMPUTE_AXES, ENERGY_FIGS, SLIDERS);

// The same two sections on /open-problems/, for its instances: every energy figure in which
// one of them is drawn, shown whole, solved sizes included, and the cost figures of those
// instances. Their switches have
// ids of their own, op-, whose rules go into that page's own stylesheet (open-problems.css).
const OPEN = new Set(OPEN_PROBLEMS?.targets.map(t => t.instance_id) ?? []);
const isOpen = inst => OPEN.has(inst.instance_id);
const figInstances = f => (f.group === "other" ? f.scans.flatMap(s => s.slots.flatMap(x => x.members)) : f.stops.flatMap(s => s.ladder.members));
const OP_ENERGY_FIGS = ENERGY_FIGS.map(([group, figs]) => [group, figs.filter(f => figInstances(f).some(isOpen))]).filter(([, figs]) => figs.length);
const OP_SLIDERS = OP_ENERGY_FIGS.flatMap(([group, figs], j) => (group === "other" ? [] : figs.map((f, k) => ({ id: `op-slide-${j}-${k}`, f }))));
const OP_COMPUTE_AXES = COMPUTE_AXES.map(([label, figs, entry]) => [label, figs.filter(isOpen), entry]).filter(([, figs]) => figs.length);
const OP_TAB_CSS = OPEN_PROBLEMS ? tabCss(OP_COMPUTE_AXES, OP_ENERGY_FIGS, OP_SLIDERS, "op-") : "";
const opFigureSections = () => [energySwitcher(OP_ENERGY_FIGS, OP_SLIDERS, "op-"),
  computeSwitcher(OP_COMPUTE_AXES, "op-", COST_FIGS.filter(isOpen).length)].join("\n");

// Dark mode for an inlined figure: an attribute selector per light colour, which beats the
// presentation attribute in the cascade. The two themes list their colours in the same
// slots, so slot k in light becomes slot k in dark; a light colour sitting in two slots
// must darken the same way in both, and a figure using a colour outside the light theme
// fails the build.
const FIG_COLOURS = new Map();
{
  const light = Object.values(THEMES.light).flat(), dark = Object.values(THEMES.dark).flat();
  light.forEach((hex, k) => {
    if (FIG_COLOURS.has(hex) && FIG_COLOURS.get(hex) !== dark[k]) throw new Error(`chart.mjs: ${hex} darkens to two colours`);
    FIG_COLOURS.set(hex, dark[k]);
  });
}
const FIG_DARK = [...FIG_COLOURS].filter(([l, d]) => l !== d)
  .map(([l, d]) => `  figure.chart [fill="${l}"] { fill: ${d}; }\n  figure.chart [stroke="${l}"] { stroke: ${d}; }`).join("\n");

// The figure's own <title> and <desc> are dropped (a tooltip over the whole chart, and an id
// repeated per inlined figure); the entry's title and caption label it instead. Marks are
// links but not tab stops; the table is the accessible form of the same rows. `source` is a
// figure drawn with the page instead of read from figures/ (open_problems_figure.mjs).
function figure([name, title, caption], cls = "", source = null) {
  const file = source == null ? `figures/${name}.svg` : `${name} (drawn with the page)`;
  if (source == null) for (const v of [name, `${name}-dark`])
    if (!fs.existsSync(`figures/${v}.svg`)) throw new Error(`figures/${v}.svg is missing; run the build first`);
  const svg = (source ?? fs.readFileSync(file, "utf8")).trim()
    .replace(/<title id="title">[^<]*<\/title>\n<desc id="desc">[^<]*<\/desc>\n/, "")
    .replace(' aria-labelledby="title desc"', () => ` aria-label="${esc(title)}. ${esc(caption)}"`)
    .replaceAll('<a class="pt" href=', () => '<a class="pt" tabindex="-1" href=');
  if (/<title|<desc|aria-labelledby/.test(svg)) throw new Error(`${file}: header not in the shape figure() expects`);
  for (const [, hex] of svg.matchAll(/(?:fill|stroke)="(#[0-9a-fA-F]{6})"/g))
    if (!FIG_COLOURS.has(hex)) throw new Error(`${file}: ${hex} is not a chart.mjs theme colour, so dark mode cannot recolour it`);
  const id = name.replace(/[^\w-]/g, "-");
  return `<figure id="${id}" class="chart${cls ? ` ${cls}` : ""}">
${svg}
</figure>`;
}

// The card a figure's mark shows on hover: the instance, the method, the energy as the
// table quotes it, the flag where the row is flagged (the mark is slashed; the row says
// why), and the paper. The figure file carries only the link; the words are written here,
// from the same helpers as the table the link lands on.
function rowCard(r, inst) {
  return `<b>${esc(modelName(inst.model))} ${esc(instanceLabel(inst))}</b>
<span>${esc(shorten(methodLabel(r), 90))}</span>
<span class="e">${energyCell(r, inst)} <span class="muted">${perSiteLabel(inst)} &middot; ${boundLabel(r)}</span>${r.defect ? ` ${flagBadge(r)}` : ""}${recordOf(inst) === r ? '<span class="tag">record</span>' : ""}</span>
<span class="muted">${cardSource(r)}</span>`;
}
const cardSource = r => { const c = citeRef(r, cache); return esc([c.text, c.also?.text, c.note].filter(Boolean).join(", ")); };

// One card per row a figure links to, in a <template>; the script below shows a card in a
// floating box while its mark is hovered. A mark for several rows (`data-rows`, best first)
// shows a list that stays beside the mark, closes 200 ms after the pointer leaves both, and
// stays open after a click until a click elsewhere or Escape. Scrolling closes the box.
// Clicking a stop's column in a strip checks its radio, as its badge does.
const FIG_SCRIPT = `<script>
(() => {
  document.addEventListener("click", e => {
    const c = e.target.closest && e.target.closest("figure.strip .col");
    const r = c && c.closest(".slider").querySelectorAll(":scope > input")[+c.querySelector(".hit").dataset.stop];
    if (r) r.checked = true;
  });
  const cards = new Map([...document.getElementById("fig-cards").content.children].map(c => [c.dataset.row, c.innerHTML]));
  const tip = document.createElement("div");
  tip.id = "fig-tip"; tip.hidden = true; tip.setAttribute("role", "tooltip");
  document.body.append(tip);
  let on = null, list = false, pinned = false, leaving = 0, next = null, resting = 0;
  const follow = e => {
    const gap = 14, w = tip.offsetWidth, h = tip.offsetHeight;
    const x = e.clientX + gap + w > innerWidth - 8 ? e.clientX - gap - w : e.clientX + gap;
    const y = e.clientY + gap + h > innerHeight - 8 ? e.clientY - gap - h : e.clientY + gap;
    tip.style.left = Math.max(8, x) + "px"; tip.style.top = Math.max(8, y) + "px";
  };
  // Right of the mark, its top a little above the mark, so the pointer crosses a few pixels
  // onto the list's head; left of it near the right edge, and pushed up to fit the viewport.
  const beside = a => {
    const r = a.getBoundingClientRect(), gap = 4, w = tip.offsetWidth, h = tip.offsetHeight;
    const x = r.right + gap + w > innerWidth - 8 ? r.left - gap - w : r.right + gap;
    const y = Math.min(r.top - 6, innerHeight - 8 - h);
    tip.style.left = Math.max(8, x) + "px"; tip.style.top = Math.max(8, y) + "px";
  };
  // An SVG <a> has no .hash, unlike an HTML one: read the attribute.
  const rowsOf = a => (a.dataset.rows ? a.dataset.rows.split(" ") : [a.getAttribute("href").split("#")[1]]).filter(r => cards.has(r));
  const stay = () => { clearTimeout(leaving); leaving = 0; };
  const unrest = () => { clearTimeout(resting); next = null; };
  const hide = () => { stay(); unrest(); on = null; list = false; pinned = false; tip.hidden = true; tip.classList.remove("list"); };
  // Called when the pointer leaves the mark or the list: the moment runs from the first
  // leaving, is not restarted by later moves, and is cancelled by a return to either.
  const leave = () => { if (list && !pinned && !leaving) leaving = setTimeout(hide, 200); };
  const show = (a, e, pin) => {
    const rows = rowsOf(a);
    if (!rows.length) return;
    stay();
    list = rows.length > 1;
    tip.innerHTML = !list
      ? cards.get(rows[0]) + '<span class="go">Click to open this row in the table</span>'
      : '<b class="count">' + (a.dataset.head || rows.length + ' energies at this point, best first') + '</b><div class="list">' +
        rows.map(r => '<a class="card" href="/instances/#' + r + '">' + cards.get(r) + "</a>").join("") +
        '</div><span class="go">' + (pin ? "Click a row to open it in the table; Escape closes the list" : "Click a row to open it in the table, or the mark to keep the list open") + "</span>";
    tip.classList.toggle("list", list);
    tip.hidden = false;
    if (list) beside(a); else follow(e);
  };
  for (const fig of document.querySelectorAll("figure.chart")) {
    fig.addEventListener("pointerover", e => {
      const a = e.target.closest("a.pt");
      if (pinned || !a) return;
      if (a === on) { stay(); return; }
      if (!list) { on = a; show(a, e, false); return; }
      // With a list open, a mark on the pointer's way to it must not take over: only a
      // mark the pointer rests on does.
      unrest(); next = a;
      resting = setTimeout(() => { next = null; on = a; show(a, e, false); }, 150);
    });
    fig.addEventListener("pointermove", e => { if (on && !list) follow(e); });
    fig.addEventListener("pointerout", e => {
      if (next && next === e.target.closest("a.pt") && !next.contains(e.relatedTarget)) unrest();
      if (!on || pinned || on.contains(e.relatedTarget) || tip.contains(e.relatedTarget)) return;
      if (list) leave(); else hide();
    });
    fig.addEventListener("click", e => {
      const a = e.target.closest("a.pt[data-rows]");
      if (!a) return;
      e.preventDefault();
      if (fig.classList.contains("strip")) return;
      stay(); unrest(); on = a; pinned = true;
      show(a, e, true);
    });
  }
  tip.addEventListener("pointerenter", stay);
  tip.addEventListener("pointerleave", e => { if (!(on && on.contains(e.relatedTarget))) leave(); });
  document.addEventListener("click", e => { if (list && !tip.contains(e.target) && !e.target.closest("a.pt[data-rows]")) hide(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && list) hide(); });
  addEventListener("scroll", () => { if (on) hide(); }, { passive: true });
})();
</script>`;

// The per-family panels sit folded under the overview figure, behind a link-styled summary.
function homePage() {
  const [overview, byFamily] = FIGURES;
  const figures = [figure(overview), `<details class="fig-more">
  <summary>Best published energies by method family</summary>
${figure(byFamily)}
</details>`, energySwitcher(), computeSwitcher()].join("\n");
  const linked = new Set([...[...figures.matchAll(/href="\/instances\/#(r-[\w-]+)"/g)].map(m => m[1]),
    ...[...figures.matchAll(/data-rows="([\w -]+)"/g)].flatMap(m => m[1].split(" "))]);
  const cards = instances.flatMap(inst => inst.rows.filter(r => linked.has(rowId(inst, r)))
    .map(r => `<div data-row="${rowId(inst, r)}">${rowCard(r, inst)}</div>`));
  if (cards.length !== linked.size) throw new Error(`figures link ${linked.size} rows, ${cards.length} found in data/: a figure is older than the data`);
  const body = `
<h1>Best published ground-state energies</h1>
<p class="lead">QMBL is a live record book of the state of the art in quantum many-body simulation. Browse
through the leaderboard figures below interactively or look at the pure data in the
<a href="/instances/">table</a>. Scientists and AI systems should use the shared results to build on
each other's work more efficiently and advance frontier science.</p>

${figures}
<template id="fig-cards">${cards.join("\n")}</template>
${FIG_SCRIPT}

<section class="cite" id="cite">
  <h2>Citing QMBL</h2>
  <blockquote class="citation">${esc(CITE_HEAD)}, <em>${esc(CITE_TITLE)}</em>,
  <a href="https://arxiv.org/abs/${ARXIV}">arXiv:${ARXIV}</a> (2026).</blockquote>
  <p>To cite the data itself, use the concept DOI, which always resolves to the latest release:
  <a href="https://doi.org/${DOI}">${DOI}</a>.</p>
  <p>Individual energies should be cited to the primary paper named on the row, not to this site.</p>
</section>`;
  return page({
    url: "/", title: null, body, wide: true, jsonld: datasetLd(),
    description: `Published ground-state energies for ${summary.instances} Hamiltonian instances, with the record on each, every row citing its primary paper.`,
  });
}

// ------------------------------------------------------------------------ browse page
// A row is the instance and its record; clicking it opens every energy published for it
// below, in rank order. The instance page keeps its stable URL for search engines, llms.txt
// and the API and is not linked from here; the JSON is.

// The badge families: the lattice name without its cell spec (kagome-36a -> kagome), and
// four size bands. Both are per model, and a band or lattice that no instance of the model
// falls in is not offered.
const latticeOf = inst => inst.lattice.replace(/-.*$/, "");
const SIZE_BANDS = [
  ["s1", n => n <= 36, "&le; 36 sites"],
  ["s2", n => n > 36 && n <= 100, "37&ndash;100"],
  ["s3", n => n > 100 && n <= 400, "101&ndash;400"],
  ["s4", n => n > 400, "&gt; 400"],
];
const sizeBand = inst => SIZE_BANDS.find(([, test]) => test(inst.n_sites))[0];

// The Table's text box matches words, in any order, against what an instance is and against
// the methods of one of its rows: "hubbard 16x16 U=8 afqmc". A word with a digit matches
// whole (0.5 does not find J2 = 0.55); any other word matches as a prefix ("heis"). The
// aliases are other names a reader types for the same thing (vendor/varbench for impurity codes).
//
// searchWords is the one tokeniser for both sides (the page embeds its source), so a query is
// cut into words as the index was: "U = 8", "U=8" and "u=8.0" are all the word u=8.
function searchWords(text) {
  const s = String(text).toLowerCase().normalize("NFKD").replace(/\p{M}/gu, "")
    .replace(/&asymp;|≈|~/g, "=").replace(/[×*]/g, "x")
    .replace(/(\d)\s*x\s*(?=\d)/g, "$1x").replace(/(\d)\s+by\s+(?=\d)/g, "$1x")
    .replace(/\s*([=\/])\s*/g, "$1")
    .replace(/(\d\.\d*?)0+(?!\d)/g, "$1").replace(/(\d)\.(?!\d)/g, "$1")
    .replace(/(?<![=\d.])(\d+)[\s-]+sites?\b/g, "n=$1")
    .replace(/neural[\s-]+quantum[\s-]+states?/g, "nqs").replace(/quantum[\s-]+monte[\s-]+carlo/g, "qmc")
    .replace(/tensor[\s-]+networks?/g, "tensornetwork");
  const out = [];
  for (const raw of s.split(/[\s,;:()[\]{}"'`+&!?]+/)) {
    const word = raw.replace(/^[^\p{L}\p{N}-]+|[^\p{L}\p{N}]+$/gu, "").replace(/^-(?!\d)/, "");
    if (!word) continue;
    const parts = word.split(/[_\/=]+|(?<=\p{L})-|-(?!\d)|(?<=\d)x(?=\d)/u).filter(p => p && p !== word);
    out.push([word, parts]);
  }
  return out;
}

// Whether an instance matches a query: every query word is among the instance's own words plus
// one row's method words, the same row for all of them. A word that is not in the index whole
// may still match by its parts ("open-boundary", "half-filled"), unless it is a coupling or a
// size, where the parts alone would find the wrong instance ("u=8" is not an 8x8 at U = 4), or
// a part is one letter, which as a prefix matches nearly anything.
function searchMatch(sets, query) {
  const has = (words, w) => /\d/.test(w) && !w.includes("_") ? words.includes(w) : words.some(t => t.startsWith(w));
  const found = (words, [w, parts]) => has(words, w)
    || (!/[=\/]|\dx\d/.test(w) && parts.length > 1 && parts.every(p => p.length > 1 && has(words, p)));
  return sets.some(words => query.every(q => found(words, q)));
}

// Words a query may carry that name nothing: "square lattice", "at half filling".
const SEARCH_STOP = ["a", "an", "and", "at", "by", "for", "in", "of", "on", "the", "with", "model", "models", "lattice",
  "lattices", "hamiltonian", "hamiltonians", "boundary", "boundaries", "condition", "conditions", "system", "size",
  "instance", "instances"];

const MODEL_WORDS = {
  Heisenberg: "heisenberg",
  J1J2: "j1j2 heisenberg",
  Hubbard: "fermi-hubbard",
  tV: "spinless-fermions tv",
  TFIsing: "tfim tfi",
  Impurity: "anderson dmft bath",
  HEG3D: "jellium electron-gas heg continuum 3d",
  HEG2D: "jellium electron-gas heg continuum 2d",
};
const SHAPE_WORDS = { chain: "1d one-dimensional", square: "2d", rectangular: "2d rectangle", triangular: "2d triangle",
  kagome: "2d", shuriken: "2d", pyrochlore: "3d" };
const BOUNDARY_WORDS = { O: "open obc", P: "periodic pbc", PO: "periodic/open cylinder",
  PA: "periodic/antiperiodic antiperiodic apbc" };
// vendor/varbench/Impurity/README.md: SB single-band, TB the three-band Kanamori model of
// Sr2RuO4, SOC with spin-orbit coupling, MT a metal and MI a Mott insulator on the Bethe
// lattice, HF at half filling and AHF doped.
const IMPURITY_WORDS = [
  [/^SB-/, "single-band"], [/^SB-DMFT/, "bethe"], [/^TB-/, "three-band kanamori sr2ruo4 hund t2g"],
  [/SOC/, "spin-orbit-coupling"], [/-MT-/, "metal metallic"], [/-MI-/, "mott-insulator insulating"],
  [/-HF$/, "half-filling half-filled"], [/-AHF$/, "doped doping"],
];
// Method families by what the method string says; a row gets every alias whose pattern it matches.
const NEURAL = /RBM|CNN|ViT|TQS|HQT|CTWF|RNN|GRU|LSTM|\bLRU\b|NQS|\bNN\b|NNB|FNN|FFN|\bMLP\b|GNN|ResNet|ConvNext|\bACE\b|\bSCALE\b|HFDS|HFPS|NAQS|[Tt]ransformer|[Aa]ttention|[Nn]eural|[Cc]onvolution|\bconv\b|[Hh]idden.[Ff]ermion|[Aa]utoregressive/;
const METHOD_WORDS = [
  [/[Ee]xact [Dd]iagonali[sz]ation|\bED\b/, "ed exact-diagonalization exact-diagonalisation"],
  [/QMC|stochastic series|GFMC/i, "qmc monte-carlo"],
  [/AFQMC/i, "afqmc auxiliary-field"],
  [/\bSSE\b|stochastic series/, "sse stochastic-series-expansion"],
  [/VMC|variational monte carlo/i, "vmc variational-monte-carlo"],
  [/RBM/, "rbm restricted-boltzmann-machine"],
  [/CNN|[Cc]onvolution|\bconv\b|ConvNext/, "cnn convolutional"],
  [/ViT/, "vit vision-transformer"],
  [/ViT|[Tt]ransformer|[Aa]ttention|TQS|HQT|CTWF/, "transformer"],
  [/RNN|GRU|LSTM|[Rr]ecurrent|\bLRU\b/, "rnn recurrent"],
  [/GNN|[Gg]raph neural/, "gnn graph-neural-network"],
  [/DMRG/, "dmrg mps tensor-network"],
  [/PEPS/, "peps tensor-network"],
  [/tensor product states|\bT-MPS\b/, "tensor-network"],
  [/VQE/, "vqe"],
  [/Hartree|\bHF\b/, "hf hartree-fock"],
  [NEURAL, "nqs neural-network"],
];

// The index of one instance: its own words, and one word list per distinct row method, each
// holding only words that start with a letter so a method's "bond dimension = 100" is not a
// size of 100. "16 sites" is the word n=16, so it does not find a 16x32 cylinder.
function searchIndex(inst, name) {
  const own = new Set();
  const add = text => { for (const [w, parts] of searchWords(text)) for (const x of [w, ...parts]) own.add(x); };
  const whole = word => own.add(word.toLowerCase());
  add(`${name} ${MODEL_WORDS[inst.model] ?? ""} ${instanceLabel(inst)} ${inst.lattice} ${latticeOf(inst)} ${SHAPE_WORDS[latticeOf(inst)] ?? ""}`);
  whole(inst.instance_id);
  if (inst.boundary) add(BOUNDARY_WORDS[inst.boundary] ?? "");
  if (inst.boundary === "P" && /2d/.test(SHAPE_WORDS[latticeOf(inst)] ?? "")) add("torus");
  const n = inst.n_sites, side = Math.sqrt(n);
  add(`${n} n=${n} sites`);
  const dims = inst.lattice.match(/^[a-z]+-(\d+(?:x\d+)+)$/)?.[1].split("x")
    ?? (/^(square|triangular)$/.test(inst.lattice) && Number.isInteger(side) ? [side, side] : null);
  if (dims) add(`${dims.join("x")} ${[...dims].reverse().join("x")}`);
  if (/^(square|triangular)$/.test(inst.lattice) && Number.isInteger(side)) add(`l=${side}`);
  if (inst.lattice === "chain") add(`l=${n}`);
  const p = inst.params ?? {};
  if (p.J2 != null) add(`j2=${p.J2} j2/j1=${p.J2}`);
  if (p.h != null) add(`h=${p.h} h/j=${p.h} γ=${p.h} gamma=${p.h}`);
  if (p.U != null) add(`u=${p.U} u/t=${p.U} ${p.U < 0 ? "attractive" : p.U > 0 ? "repulsive" : ""}`);
  if (p.V != null) add(`v=${p.V} v/t=${p.V}`);
  if (p.Nf != null) {
    const fill = Number(((inst.model === "Hubbard" ? 2 * p.Nf : p.Nf) / n).toFixed(4));
    add(`n=${fill}`);
    if (fill === (inst.model === "Hubbard" ? 1 : 0.5)) add("half-filling half-filled");
    else if (inst.model === "Hubbard") {
      const doping = Number((1 - fill).toFixed(4)), k = Math.round(1 / Math.abs(doping));
      add(`doped doping=${doping}`);
      if (Math.abs(1 / Math.abs(doping) - k) < 1e-9) whole(`1/${k}`);
    }
  }
  if (inst.model === "Impurity") for (const [re, words] of IMPURITY_WORDS) if (re.test(inst.lattice)) add(words);
  if (!recordOf(inst)) add("no record");
  const methods = new Set(inst.rows.map(r => {
    // The short name and detail, and the string as published, so a search for a paper's own
    // spelling ("HB K=1", "Exact Diagonalization") still finds the row.
    const text = `${methodLabel(r)} ${methodText(publishedMethod(r))}`;
    const aliases = METHOD_WORDS.filter(([re]) => re.test(text)).map(([, words]) => words);
    if (r.bound_type === "exact" || r.bound_type === "extrapolated") aliases.push(r.bound_type);
    const words = new Set();
    for (const [w, parts] of searchWords(`${text} ${aliases.join(" ")}`))
      for (const x of [w, ...parts]) if (/^\p{L}/u.test(x)) words.add(x);
    return [...words].join(" ");
  }));
  return { own: [...own].join(" "), methods: [...methods].join("|") };
}


// Distance to the record, per site: 0 on the record, the gap to it for an unflagged row of
// any kind but exact, n/a elsewhere. A row below the record (an extrapolation that overshoots
// an exact energy) shows a negative distance. The Table's opened row and the instance page use it.
function distanceCell(r, inst) {
  const rec = recordOf(inst);
  if (r === rec) return "0";
  if (!rec || !recordEligible(r)) return '<span class="muted">n/a</span>';
  const f = perSiteDivisor(inst) ?? 1, decimals = quoteRow(rec, inst).decimals;
  if (r.energy < rec.energy) return esc(`−${gapAbove(r, rec, f, decimals).replace(/^\+/, "")}`);
  return esc(gapAbove(rec, r, f, decimals).replace(/^\+/, ""));
}

// Every row of the instance, the record marked, with sigma and the distance to the record.
// Var(E), the V-score and the method detail are on the instance page.
function allRows(inst) {
  const rec = recordOf(inst);
  const sorted = [...inst.rows].sort((a, b) => a.energy - b.energy);
  const decimals = rec ? quoteRow(rec, inst).decimals : null;
  const rows = sorted.map(r => {
    const isRec = r === rec;
    const { sigma } = perSite(r, inst);
    return `<tr id="${rowId(inst, r)}" class="${isRec ? "is-record" : ""}${r.defect ? " is-flagged" : ""}">
      <td class="record">${isRec || decimals == null ? bareEnergyCell(r, inst) : energyCell(r, inst, decimals)}${isRec ? '<span class="tag">record</span>' : ""}</td>
      <td class="num">${distanceCell(r, inst)}</td>
      <td class="num">${sigma == null ? '<span class="muted">n/a</span>' : sigma.toExponential(1)}</td>
      <td><span class="badge">${boundLabel(r)}</span>${r.defect ? ` ${flagBadge(r)}` : ""}</td>
      <td>${esc(r.method)}</td>
      <td>${citeHtml(r)}</td>
      <td class="num">${yearCell(r) ?? '<span class="muted">n/a</span>'}</td>
    </tr>`;
  }).join("");
  return `${rec ? "" : `
    <p class="muted">No record: ${esc(noRecordReason(inst))}.</p>`}
    <table class="next"><thead><tr><th>${perSiteLabel(inst)}</th><th>distance to record</th><th>&sigma;</th><th>bound type</th><th>method</th><th>source</th><th>year</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="links"><a href="${jsonUrl(inst)}">JSON</a></p>`;
}

// The Table's energy column: the record, or on an instance without one the lowest unflagged
// row, else the lowest row. Whether it is a record, and why not, shows when the row opens.
function bestRow(inst) {
  const sorted = [...inst.rows].sort((a, b) => a.energy - b.energy);
  return sorted.find(r => !r.defect) ?? sorted[0];
}

function instancesPage() {
  const sections = MODELS.map(([model, name]) => {
    const group = instances.filter(i => i.model === model).sort(byGeometry);
    if (!group.length) return "";
    const rows = group.map(inst => {
      const rec = recordOf(inst);
      const label = instanceLabel(inst);
      const search = searchIndex(inst, name);
      const shown = rec ?? bestRow(inst);
      const cells = `<td class="record">${energyCell(shown, inst)}</td><td>${esc(shown.method)}</td><td>${citeHtml(shown)}</td>`;
      const id = `x-${inst.instance_id.replace(/[^\w-]/g, "_")}`;
      return `<tr class="inst" data-search="${esc(search.own)}" data-methods="${esc(search.methods)}" data-lattice="${esc(latticeOf(inst))}" data-size="${sizeBand(inst)}">
        <th scope="row"><button type="button" aria-expanded="false" aria-controls="${id}">${esc(label)}</button></th>
        ${cells}<td class="num">${inst.rows.length}</td></tr>
      <tr class="more" id="${id}" hidden><td colspan="5">${allRows(inst)}</td></tr>`;
    });
    const lattices = [...new Set(group.map(latticeOf))].sort();
    const bands = SIZE_BANDS.filter(([key]) => group.some(i => sizeBand(i) === key));
    const badges = `<div class="quick">
      <span class="muted">lattice</span>${lattices.map(l => `<button type="button" data-lattice="${esc(l)}">${esc(l)}</button>`).join("")}
      ${bands.length > 1 ? `<span class="muted">size</span>${bands.map(([key, , label]) => `<button type="button" data-size="${key}">${label}</button>`).join("")}` : ""}
    </div>`;
    return `<section data-model="${model}">
      <h2 id="${model.toLowerCase()}">${esc(name)}<a class="anchor" href="#${model.toLowerCase()}" aria-label="Link to this section">#</a></h2>
      <p class="muted"><span class="count">${group.length} instances</span>, energies as <code>${perSiteLabel(group[0])}</code></p>
      ${badges}
      <div class="scroll"><table class="leaderboard">
        <thead><tr><th>instance</th><th>energy</th><th>method</th><th>source</th><th>energies</th></tr></thead>
        <tbody>${rows.join("")}</tbody></table></div>
    </section>`;
  }).join("\n");

  const body = `
<h1>Table</h1>
<p class="search"><input id="filter" type="search" placeholder="Filter by Hamiltonian, lattice, size, coupling or method…" autocomplete="off" spellcheck="false">
<span id="filter-count" class="muted"></span></p>
<div class="quick models"><span class="muted">Hamiltonian</span>${MODELS.filter(([m]) => instances.some(i => i.model === m))
    .map(([m, n]) => `<button type="button" data-model="${m}">${esc(n)}</button>`).join("")}</div>
${sections}
<script>
const box = document.getElementById("filter");
const count = document.getElementById("filter-count");
const sections = [...document.querySelectorAll("section[data-model]")];
const total = document.querySelectorAll("tr.inst").length;

// The words of the text box against each instance's index; see searchIndex in scripts/site.mjs.
const searchWords = ${searchWords};
const searchMatch = ${searchMatch};
const STOP = new Set(${JSON.stringify(SEARCH_STOP)});
const index = new Map([...document.querySelectorAll("tr.inst")].map(row => {
  const own = row.dataset.search.split(" ");
  return [row, row.dataset.methods ? row.dataset.methods.split("|").map(m => own.concat(m.split(" "))) : [own]];
}));

// One selection per badge row (the Hamiltonian row on top, lattice and size per section); a badge
// toggles, and the text box applies on top.
function apply() {
  const q = box.value.trim();
  const words = searchWords(q).filter(([w]) => !STOP.has(w));
  const model = document.querySelector(".models button.on")?.dataset.model;
  let shown = 0;
  for (const section of sections) {
    const outside = model && section.dataset.model !== model;
    const lattice = section.querySelector(".quick button[data-lattice].on")?.dataset.lattice;
    const size = section.querySelector(".quick button[data-size].on")?.dataset.size;
    const rows = [...section.querySelectorAll("tr.inst")];
    let n = 0;
    for (const row of rows) {
      const hit = !outside && (!words.length || searchMatch(index.get(row), words))
        && (!lattice || row.dataset.lattice === lattice)
        && (!size || row.dataset.size === size);
      row.hidden = !hit;
      const more = row.nextElementSibling;
      if (!hit) { more.hidden = true; row.querySelector("button").setAttribute("aria-expanded", "false"); }
      if (hit) n++;
    }
    shown += n;
    section.hidden = outside || (!n && !lattice && !size);
    section.querySelector(".count").textContent = (n === rows.length ? "" : n + " of ") + rows.length + " instances";
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
for (const row of document.querySelectorAll("tr.inst")) row.addEventListener("click", e => {
  if (e.target.closest("a")) return;
  const more = row.nextElementSibling;
  more.hidden = !more.hidden;
  row.querySelector("button").setAttribute("aria-expanded", String(!more.hidden));
  row.classList.toggle("open", !more.hidden);
});

// A figure's mark links here as #r-<instance>-<row>: open the instance holding that row,
// clear any filter hiding it, and bring the row into view, marked.
function reveal() {
  const row = location.hash.startsWith("#r-") && document.getElementById(location.hash.slice(1));
  if (!row) return;
  const more = row.closest("tr.more"), inst = more.previousElementSibling;
  if (inst.hidden) {
    box.value = "";
    for (const on of document.querySelectorAll(".quick button.on")) on.classList.remove("on");
    apply();
  }
  for (const old of document.querySelectorAll("tr.target")) old.classList.remove("target");
  more.hidden = false;
  inst.classList.add("open");
  inst.querySelector("button").setAttribute("aria-expanded", "true");
  row.classList.add("target");
  row.scrollIntoView({ block: "center" });
}
// Once now so the row is open at first paint, and again on load, because the browser's own
// scroll to the fragment comes after this script and would pin the row to the top edge.
addEventListener("hashchange", reveal);
addEventListener("load", reveal);
reveal();
</script>`;
  return page({ url: "/instances/", title: "Table", body, wide: true,
    description: `Every Hamiltonian instance in QMBL: ${summary.instances} instances across ${MODELS.filter(([m]) => instances.some(i => i.model === m)).length} models, with the record energy and method for each.` });
}

// ---------------------------------------------------------------------- instance page
function rowTable(rows, inst) {
  const head = `<thead><tr><th>${perSiteLabel(inst)}</th><th>distance to record</th><th>&sigma;</th><th>Var(E)</th><th>V-score</th>
    <th>method</th><th>source</th><th>year</th></tr></thead>`;
  const body = rows.map(r => {
    const rec = recordOf(inst) === r;
    const badges = [
      r.defect ? flagBadge(r) : "",
      r.baseline ? '<span class="badge">VarBench reference run</span>' : "",
      r.computed_by === "qmbl" ? '<span class="badge">QMBL run</span>' : "",
      r.provenance === "secondary" ? '<span class="badge">quoted from another paper</span>' : "",
      r.peer_reviewed === true ? '<span class="badge">peer reviewed</span>' : "",
      r.peer_reviewed === false ? '<span class="badge">preprint</span>' : "",
    ].filter(Boolean).join(" ");
    const { sigma } = perSite(r, inst);
    return `<tr id="${rowId(inst, r)}" class="${rec ? "is-record" : ""}${r.defect ? " is-flagged" : ""}">
      <td class="record">${bareEnergyCell(r, inst)}${rec ? '<span class="tag">record</span>' : ""}</td>
      <td class="num">${distanceCell(r, inst)}</td>
      <td class="num">${sigma == null ? '<span class="muted">n/a</span>' : sigma.toExponential(1)}</td>
      <td class="num">${r.energy_variance == null ? '<span class="muted">n/a</span>' : r.energy_variance.toExponential(2)}</td>
      <td class="num">${r.v_score == null ? '<span class="muted">n/a</span>' : r.v_score.toExponential(1)}</td>
      <td>${esc(methodLabel(r))}${badges ? `<div class="badges">${badges}</div>` : ""}</td>
      <td>${citeHtml(r)}</td>
      <td class="num">${yearCell(r) ?? '<span class="muted">n/a</span>'}</td>
    </tr>`;
  }).join("");
  return `<div class="scroll"><table class="rows">${head}<tbody>${body}</tbody></table></div>`;
}

const modelName = model => MODELS.find(([m]) => m === model)?.[1] ?? model;

function instancePage(inst) {
  const label = `${modelName(inst.model)} ${instanceLabel(inst)}`;
  const rec = recordOf(inst);
  const ham = hamiltonian(inst);
  const variant = variantNote(inst), relabel = relabelNote(inst);
  const sorted = [...inst.rows].sort((a, b) => a.energy - b.energy);

  const groups = BOUND_ORDER.map(bound => {
    const rows = sorted.filter(r => (r.bound_type ?? null) === bound);
    if (!rows.length) return "";
    return `<section class="bound bound-${bound ?? "unclassified"}">
      <h3>${BOUND_LABEL[String(bound)]} <span class="muted">(${rows.length})</span></h3>
      <p class="muted">${BOUND_NOTE[String(bound)]}</p>
      ${rowTable(rows, inst)}
    </section>`;
  }).join("");

  const flagged = sorted.filter(r => r.defect).map(r => `
    <details class="defect">
      <summary><b>${esc(flagLabel(r))}</b>, ${esc(shorten(methodLabel(r), 60))}, ${energyCell(r, inst)}</summary>
      <p><b>Finding.</b> ${esc(r.defect.finding)}</p>
      ${r.defect.diagnosis ? `<p><b>Diagnosis.</b> ${esc(r.defect.diagnosis)}</p>` : ""}
      ${r.defect.ruled_out ? `<p><b>Ruled out.</b> ${esc(r.defect.ruled_out)}</p>` : ""}
      ${r.defect.evidence ? `<p><b>Evidence.</b> ${esc(r.defect.evidence)}</p>` : ""}
    </details>`).join("");

  const verified = sorted.filter(r => r.verified).map(r => `
    <details class="verified">
      <summary>${energyCell(r, inst)}, ${esc(shorten(methodLabel(r), 60))}</summary>
      <p class="muted">Checked ${esc(r.verified.checked_on)} &middot; ${esc(r.verified.method)}</p>
      ${r.verified.reported_as ? `<p><b>Reported as.</b> ${esc(r.verified.reported_as)}</p>` : ""}
      ${r.verified.note ? `<p>${esc(r.verified.note)}</p>` : ""}
    </details>`).join("");

  const recordBox = rec
    ? `<div class="record-box">
        <p class="eyebrow">Record</p>
        <p class="big"><span class="num">${quoteRow(rec, inst).text}</span>
          <span class="unit">${perSiteLabel(inst)}</span></p>
        <p>${esc(methodLabel(rec))}</p>
        <p class="muted">${citeHtml(rec)} &middot; ${rec.bound_type === "exact"
          ? stochasticExact(rec)
            ? "exact (stochastic) energy: sign-problem-free QMC, exact within its error bar"
            : "exact energy: the instance is solved"
          : `lowest unflagged energy published, ${{ variational: "a strict variational bound", projected: "a projected estimate", extrapolated: "an extrapolation, not a bound", approximate: "an approximate method, the only kind published here" }[rec.bound_type]}`}
          (<a href="${RULES}#6-records-and-ties">rules &sect;6</a>)</p>
      </div>`
    : `<div class="record-box none">
        <p class="eyebrow">No record</p>
        <p class="big">&mdash;</p>
        <p>${esc(noRecordReason(inst))} (<a href="${RULES}#6-records-and-ties">rules &sect;6</a>).
        Every row is still listed below.</p>
      </div>`;

  const params = Object.entries(inst.params ?? {})
    .map(([k, v]) => `<div><dt>${esc(k)}</dt><dd class="num">${esc(v)}</dd></div>`).join("");

  const body = `
<p class="crumbs"><a href="/instances/">All instances</a> / <a href="/instances/#${inst.model.toLowerCase()}">${esc(modelName(inst.model))}</a></p>
<h1>${esc(label)}</h1>

${recordBox}

<section class="hamiltonian">
  <h2>The Hamiltonian</h2>
  ${ham.formula ? `<p class="formula">${ham.formula}</p>` : ""}
  <p>${ham.note}</p>
  ${variant ? `<p>${variant}</p>` : ""}
  ${relabel ? `<p>${relabel}</p>` : ""}
  <dl class="facts">
    <div><dt>${/^HEG/.test(inst.model) ? "cell" : "lattice"}</dt><dd>${esc(inst.lattice)}</dd></div>
    <div><dt>${/^HEG/.test(inst.model) ? "electrons" : "sites"}</dt><dd class="num">${inst.n_sites}</dd></div>
    <div><dt>boundary</dt><dd>${inst.boundary ? esc(BOUNDARY[inst.boundary] ?? "periodic") : "&mdash;"}</dd></div>
    ${params}
    <div><dt>energies</dt><dd class="num">${inst.rows.length}</dd></div>
  </dl>
  <p class="muted">${/^HEG/.test(inst.model)
    ? `Stored as a total energy in Hartree (<a href="${RULES}#12-track-2-the-homogeneous-electron-gas">rules &sect;12</a>); quoted here as
    <code>${perSiteLabel(inst)}</code>, the energy per electron`
    : `Stored as a total energy; quoted here as
    <code>${perSiteLabel(inst)}</code>, which is what the papers report`}
    (<a href="${DATA}#units-and-conventions">how the conversion works</a>).</p>
</section>

<section>
  <h2>Every published energy</h2>
  <p>Grouped by what the number is. On a solved instance the exact energy is the record; otherwise the lowest unflagged energy of any group holds it (<a href="${RULES}#6-records-and-ties">rules &sect;6</a>).</p>
  ${groups}
</section>

${flagged ? `<section><h2>Flagged rows</h2>
  <p>A flagged row stays listed in rank order but cannot hold the record.
  <a href="${RULES}#10-pending-confirmed-objections">Rules &sect;10</a> says how a flag is lifted or upheld.</p>
  ${flagged}</section>` : ""}

${verified ? `<section><h2>How these numbers were read</h2>
  <p>Where each number below was read, and how it was checked.</p>
  ${verified}</section>` : ""}

<section>
  <h2>Coverage</h2>
  <p>${coverage(inst)}</p>
</section>

<section class="machine">
  <h2>This instance as data</h2>
  <p><a href="${jsonUrl(inst)}">JSON</a> &middot;
     <a href="${REPO}/blob/main/data/${inst.instance_id}.json">source file on GitHub</a> &middot;
     <a href="${REPO}/issues/new?template=new-result.yml&amp;instance=${encodeURIComponent(inst.instance_id)}">add a result</a> &middot;
     <a href="${REPO}/issues/new?title=${encodeURIComponent(`[${inst.instance_id}] `)}">open an issue about this instance</a></p>
</section>`;

  const recText = rec ? `Record ${quoteRow(rec, inst).text} ${perSiteLabel(inst)} by ${shorten(methodLabel(rec), 40)}.` : "No row currently holds the record.";
  return page({ url: instUrl(inst), title: `Ground-state energy, ${label}`, body, wide: true,
    description: `${label}: ${inst.rows.length} published ground-state energies. ${recText}` });
}

// --------------------------------------------------------------------- contribute page
function contributePage() {
  const b = summary.sampled_no_sigma;
  const costed = instances.flatMap(i => i.rows).filter(r => r.compute?.gpu_hours != null || r.compute?.cpu_core_hours != null || r.compute?.parameters != null).length;
  const body = `
<h1>Contribute</h1>
<p>Everything goes through <a href="${REPO}/issues">GitHub issues</a>.</p>
<ul>
  <li>To add a missing result, use the <a href="${REPO}/issues/new?template=new-result.yml">new result form</a>.
  Give the instance, the energy as printed, its error bar, the method, and where in the paper it is.
  A missing field shows as <code>n/a</code> and does not block the row
  (<a href="${RULES}#3-required-fields">rules &sect;3</a>).</li>
  <li>To add a missing instance, use the <a href="${REPO}/issues/new?template=new-instance.yml">new instance form</a>.
  Give the Hamiltonian, cluster, boundaries, couplings and sector, and the paper that defines it.</li>
  <li>If a number is wrong or attributed to the wrong paper, name the instance and what it
  should be. Rows are corrected in place; git keeps the history.</li>
  <li>If you know an error bar we could not find, tell us. ${b.rows} sampled energies on ${b.instances}
  instances are listed without one, because the source we read gives none. They rank like
  any other row; with an error bar, results that agree within it share a rank
  (<a href="${RULES}#6-records-and-ties">rules &sect;6</a>).</li>
  <li>To object to a row, open an issue on a technical ground, for example a wrong symmetry sector,
  a misdeclared <code>bound_type</code> or an error bar with no autocorrelation correction.
  <a href="${RULES}#10-pending-confirmed-objections">Rules &sect;10</a> lists the grounds and gives the process.</li>
  <li>To add what a number cost, give the GPU or CPU hours with the device, the parameter count, or the wall-clock time.
  ${costed} energies state GPU or CPU hours or a parameter count; the
  <a href="/#energy-vs-compute">energy-versus-cost figures</a> use them
  (<a href="${DATA}#what-a-number-cost-the-compute-block">format</a>). Parameter,
  sample and iteration counts together, or a DMRG run's sweep schedule, let the site
  <a href="/#energy-vs-compute">estimate a FLOP count</a> where no hours are stated.</li>
</ul>`;
  return page({ url: "/contribute/", title: "Contribute", body,
    description: "How to correct a row, add a published result, supply a missing error bar, or object to a record in QMBL." });
}

function notFoundPage() {
  // QMBL in the Ticks Slant figlet font, generated by scripts/ascii.mjs. The stripes the letters sit on
  // run out EXT columns each side (keeping the slant) so the banner fills the column at the largest font size.
  const EXT = 16;
  const ticks = esc(fs.readFileSync("figures/qmbl-ticks-slant.txt", "utf8").replace(/\s+$/, "").split("\n").map(l => {
    const sp = l.match(/^ */)[0].length;
    return l.slice(0, sp) + "_".repeat(EXT) + l.slice(sp) + "_".repeat(EXT);
  }).join("\n"));
  return page({ url: "/404.html", title: "Not found", description: "Page not found.", body: `
<pre class="ticks" aria-hidden="true">${ticks}</pre>
<h1>Not found</h1>
<p class="lead">That page does not exist.</p>` });
}

// ------------------------------------------------------------------------ machine api
function apiInstance(inst) {
  const rec = recordOf(inst);
  const f = perSiteDivisor(inst);
  return {
    ...inst,
    url: `https://qmbl.org${instUrl(inst)}`,
    per_site_divisor: f,
    per_site_label: perSiteLabel(inst),
    record: rec ? {
      energy: rec.energy, sigma: rec.sigma, method: rec.method, method_detail: rec.method_detail, reference: rec.reference,
      bound_type: rec.bound_type, energy_per_site: f == null ? null : rec.energy / f,
    } : null,
    no_record_reason: rec ? null : noRecordReason(inst),
  };
}

function llmsTxt() {
  const lines = [
    "# QMBL: the Quantum Many-Body Leaderboard",
    "",
    `> The best published ground-state energies for ${summary.instances} Hamiltonian instances (${summary.rows} energies, ${summary.records.held} with a record, ${summary.records.held_by_exact} of them solved exactly). Read-only, generated from the repository's data/ directory, Apache-2.0.`,
    "",
    "Every row is one published claim about one Hamiltonian instance and carries the energy, its",
    "error bar, the method, the primary reference, and a `bound_type`: strict variational bound,",
    "projected/fixed-node estimate, zero-variance or bond-dimension extrapolation, approximate",
    "method, or numerically exact. Sign-problem-free QMC is labelled exact (stochastic): it is exact",
    "within its stated error bar. An exact energy is the record wherever one exists; otherwise the",
    "lowest unflagged energy holds it, of any kind and with or without an error bar, and an",
    "approximate energy holds it only where no other unflagged energy exists (RULES.md section 6).",
    "Energies are stored as totals and quoted per site; the conversion is in DATA.md. Individual",
    "energies should be cited to the primary paper named on the row, not to this site.",
    "",
    "## Pages",
    ...(OPEN_PROBLEMS ? openProblemsLlms(OPEN_PROBLEMS) : []),
    "- [Leaderboard](https://qmbl.org/): the accuracy, energy and cost figures, and how to cite.",
    `- [Table](https://qmbl.org/instances/): every one of the ${summary.instances} instances, with its record and every energy.`,
    `- [Rules](${RULES}): what counts as a record, ties, provenance, objections.`,
    `- [Data](${DATA}): row format, units and conventions, error metrics, defects.`,
    "- [Contribute](https://qmbl.org/contribute/): corrections, missing results, missing error bars.",
    "",
    "## Data",
    "- [Full dump](https://qmbl.org/api/qmbl.json): every instance and row in one JSON file.",
    "- [Instance index](https://qmbl.org/api/instances.json): id, label, URL and record per instance.",
    "- [Summary](https://qmbl.org/api/summary.json): the counts behind the headline numbers.",
    `- [Repository](${REPO}): source data, build scripts, rules.`,
    `- Citation: https://arxiv.org/abs/${ARXIV} (the paper).`,
    `- Data citation: https://doi.org/${DOI} (concept DOI, always the latest release).`,
    "",
    "## Instances",
    ...instances.map(i => `- [${instanceLabel(i)}](https://qmbl.org${instUrl(i)}): ${i.instance_id}, ${i.rows.length} energies, JSON at https://qmbl.org${jsonUrl(i)}.`),
    "",
  ];
  return lines.join("\n");
}

// ------------------------------------------------------------------------------- css
const CSS = `:root {
  --bg: #fcfcfb; --surface: #ffffff; --ink: #0b0b0b; --ink2: #52514e; --muted: #898781;
  --grid: #e1e0d9; --accent: #104281; --flag: #eb6834; --exact: #1baf7a; --record: #104281;
  --sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif;
  --serif: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif;
  --mono: ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #1a1a19; --surface: #211f1e; --ink: #ffffff; --ink2: #c3c2b7; --muted: #898781;
    --grid: #2c2c2a; --accent: #9ec5f4; --flag: #d95926; --exact: #199e70; --record: #9ec5f4;
  }
}
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0; background: var(--bg); color: var(--ink); font-family: var(--sans);
  font-size: 16px; line-height: 1.6; text-rendering: optimizeLegibility;
}
a { color: var(--accent); text-decoration-thickness: 1px; text-underline-offset: 2px; }
a:hover { text-decoration-thickness: 2px; }
code { font-family: var(--mono); font-size: 0.9em; }
h1, h2, h3 { font-family: var(--serif); font-weight: 600; line-height: 1.2; letter-spacing: -0.01em; }
h1 { font-size: 2.1rem; margin: 0 0 0.6rem; }
h2 { font-size: 1.45rem; margin: 2.6rem 0 0.6rem; }
h3 { font-size: 1.1rem; margin: 2rem 0 0.4rem; }
p { margin: 0.8rem 0; max-width: 46em; }
.muted { color: var(--muted); }
.lead { font-size: 1.15rem; color: var(--ink2); max-width: 42em; }
.num { font-family: var(--mono); font-variant-numeric: tabular-nums; }

header.site {
  display: flex; flex-wrap: wrap; gap: 1rem 2rem; align-items: baseline;
  justify-content: space-between; padding: 1.4rem clamp(1rem, 4vw, 3rem);
  border-bottom: 1px solid var(--grid);
}
.wordmark {
  display: flex; align-items: center; gap: 0.7rem;
  font-family: var(--serif); font-size: 1.3rem; font-weight: 600; color: var(--ink);
  text-decoration: none; letter-spacing: 0.02em;
}
.wordmark b { font-weight: inherit; }
.wordmark .logo { width: 34px; height: 34px; flex: none; }
.wordmark .tagline {
  display: block; font-family: var(--sans); font-size: 0.72rem; font-weight: 400;
  letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted);
}
header.site nav { display: flex; flex-wrap: wrap; gap: 1.2rem; align-items: center; font-size: 0.95rem; }
header.site nav a { color: var(--ink2); text-decoration: none; }
header.site nav a:hover { color: var(--accent); }
header.site nav a[aria-current] { color: var(--ink); box-shadow: inset 0 -2px 0 var(--accent); }
header.site nav a.ext { color: var(--muted); display: inline-flex; }
header.site nav a.ext:hover { color: var(--ink); }
header.site nav a.ext svg { display: block; }
button.cite-btn {
  font: inherit; font-size: 0.85rem; line-height: 1; cursor: pointer;
  display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.4rem 0.7rem;
  color: var(--ink2); background: var(--surface); border: 1px solid var(--grid); border-radius: 999px;
}
button.cite-btn:hover { color: var(--accent); border-color: var(--accent); }
button.cite-btn.copied { color: var(--exact); border-color: var(--exact); }

main { padding: 2.4rem clamp(1rem, 4vw, 3rem) 4rem; max-width: 52rem; margin: 0 auto; }
main.wide { max-width: 78rem; }

footer.site {
  border-top: 1px solid var(--grid); padding: 1.6rem clamp(1rem, 4vw, 3rem) 3rem;
  font-size: 0.9rem; color: var(--ink2); text-align: center;
}
footer.site p { margin: 0.3rem auto; }
footer.site p.developed-at { margin-top: 1.2rem; display: flex; align-items: center; justify-content: center; gap: 0.6rem; }
footer.site p.developed-at a { color: var(--ink); line-height: 0; padding: 0.5rem; }
footer.site svg.eth-logo { height: 1.1rem; width: auto; display: block; }

figure { margin: 2.2rem 0 0; }
figure.chart svg { display: block; width: 100%; max-width: 920px; height: auto; border: 1px solid var(--grid); border-radius: 3px; background: var(--surface); }
figure.chart a.pt { cursor: pointer; }
figure.chart a.pt > :nth-child(2) { transform-box: fill-box; transform-origin: center; transition: transform 80ms; }
figure.chart a.pt:hover > :nth-child(2) { transform: scale(1.45); }
#fig-tip {
  position: fixed; z-index: 10; pointer-events: none; max-width: 24rem; padding: 0.55rem 0.75rem;
  font-size: 0.82rem; line-height: 1.45; color: var(--ink); background: var(--surface);
  border: 1px solid var(--grid); border-radius: 3px; box-shadow: 0 6px 20px rgb(0 0 0 / 0.14);
}
#fig-tip > b, #fig-tip > span { display: block; }
#fig-tip > b { font-weight: 600; }
#fig-tip .e { margin: 0.2rem 0; }
#fig-tip .e .num { font-weight: 600; color: var(--record); }
#fig-tip .go { margin-top: 0.3rem; font-size: 0.75rem; color: var(--accent); }
#fig-tip.list { pointer-events: auto; }
#fig-tip .list { max-height: 22rem; overflow-y: auto; margin-top: 0.3rem; }
#fig-tip .card { display: block; padding: 0.35rem 0; border-top: 1px solid var(--grid); color: inherit; text-decoration: none; }
#fig-tip .card > b, #fig-tip .card > span { display: block; }
#fig-tip a.card:hover { background: var(--grid); }

.scroll { overflow-x: auto; margin: 1.2rem 0; }
table { border-collapse: collapse; width: 100%; font-size: 0.9rem; }
th, td { text-align: left; vertical-align: top; padding: 0.55rem 0.8rem 0.55rem 0; border-bottom: 1px solid var(--grid); }
thead th {
  font-size: 0.78rem; letter-spacing: 0.04em; color: var(--muted);
  font-weight: 500; border-bottom: 1px solid var(--ink2); white-space: nowrap;
}
tbody tr:hover { background: var(--surface); }
tbody th { font-weight: 500; }
td.num, td .num { font-family: var(--mono); font-variant-numeric: tabular-nums; white-space: nowrap; }
td.record .num { font-weight: 600; color: var(--record); }
.leaderboard th[scope="row"] { min-width: 14rem; }
.rows tr.is-record td { background: color-mix(in srgb, var(--accent) 7%, transparent); }
.rows tr.is-flagged td:first-child { box-shadow: inset 3px 0 0 var(--flag); }
.tag {
  margin-left: 0.5rem; font-family: var(--sans); font-size: 0.65rem; text-transform: uppercase;
  letter-spacing: 0.08em; color: var(--accent);
}
.badges { margin-top: 0.3rem; display: flex; flex-wrap: wrap; gap: 0.3rem; }
.badge {
  font-size: 0.7rem; color: var(--ink2); border: 1px solid var(--grid);
  border-radius: 999px; padding: 0.05rem 0.5rem; white-space: nowrap;
}
.badge.flag { color: var(--flag); border-color: var(--flag); }
.badge.flag[title] { cursor: help; }
.wordmark .badge.beta { margin-left: 0.3rem; font-family: var(--sans); font-weight: 400; font-size: 0.75rem; padding: 0.15rem 0.6rem; color: var(--flag); border-color: var(--flag); letter-spacing: 0.06em; text-transform: uppercase; }
.citation { max-width: none; }

section[data-model] h2 { font-size: 2.1rem; margin-top: 3rem; }
main > p.lead:first-child { margin-top: 0; }

.quick { display: flex; flex-wrap: wrap; align-items: center; gap: 0.4rem; margin: 0.6rem 0 0; font-size: 0.85rem; }
.quick .muted { margin-right: 0.2rem; }
.quick .muted:not(:first-child) { margin-left: 0.8rem; }
.quick button {
  font: inherit; font-size: 0.8rem; line-height: 1.2; cursor: pointer; padding: 0.2rem 0.65rem;
  color: var(--ink2); background: var(--surface); border: 1px solid var(--grid); border-radius: 999px;
}
.quick button:hover { border-color: var(--accent); color: var(--accent); }
.quick button.on { color: var(--bg); background: var(--accent); border-color: var(--accent); }

tr.inst { cursor: pointer; }
tr.inst th button {
  font: inherit; color: var(--accent); background: none; border: 0; padding: 0; cursor: pointer;
  text-align: left; text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 2px;
}
tr.inst th button::before {
  content: ""; display: inline-block; width: 0.4em; height: 0.4em; margin-right: 0.5em;
  border-right: 1.5px solid var(--muted); border-bottom: 1.5px solid var(--muted);
  transform: rotate(-45deg) translateY(-0.1em); transition: transform 0.1s;
}
tr.inst.open th button::before { transform: rotate(45deg) translateY(-0.2em); }
tr.inst.open td, tr.inst.open th { background: var(--surface); border-bottom-color: transparent; }
tr.more > td { padding: 0.6rem 0 1.2rem 1.4rem; background: var(--surface); }
tr.more:hover { background: none; }
tr.more p { margin: 0.4rem 0; font-size: 0.88rem; }
tr.more p.links a { margin-right: 1rem; }
table.next { width: auto; min-width: 60%; font-size: 0.85rem; margin: 0.4rem 0 0.6rem; }
table.next th, table.next td { padding: 0.35rem 1.2rem 0.35rem 0; }
table.next tr.is-flagged td:first-child { box-shadow: inset 3px 0 0 var(--flag); }
table.next tr.is-record td { background: color-mix(in srgb, var(--accent) 7%, transparent); }
table.next tr.target > td, .rows tr:target > td {
  background: color-mix(in srgb, var(--accent) 18%, transparent); animation: row-in 1.6s ease-out;
}
table.next tr.target > td:first-child, .rows tr:target > td:first-child { box-shadow: inset 3px 0 0 var(--accent); }
@keyframes row-in { from { background: color-mix(in srgb, var(--accent) 45%, transparent); } }

.record-box {
  background: var(--surface); border: 1px solid var(--grid); border-left: 3px solid var(--accent);
  border-radius: 3px; padding: 1rem 1.2rem; margin: 1.6rem 0;
}
.record-box.none { border-left-color: var(--muted); }
.record-box p { margin: 0.25rem 0; }
.eyebrow { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); }
.big { font-family: var(--mono); font-size: 1.8rem; font-weight: 600; }
.big .unit { font-family: var(--sans); font-size: 0.8rem; font-weight: 400; color: var(--muted); margin-left: 0.5rem; }

.crumbs { font-size: 0.85rem; color: var(--muted); margin: 0 0 0.6rem; }
.crumbs a { color: var(--muted); }
.formula {
  font-family: var(--mono); font-size: 1.05rem; background: var(--surface);
  border: 1px solid var(--grid); border-radius: 3px; padding: 0.9rem 1rem; overflow-x: auto;
}
dl.facts { display: flex; flex-wrap: wrap; gap: 0.4rem 2rem; margin: 1rem 0; }
dl.facts dt { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); }
dl.facts dd { margin: 0; }

section.bound { margin: 1.8rem 0; }
section.bound h3 { margin-bottom: 0.2rem; }
section.bound p.muted { font-size: 0.88rem; max-width: 46em; margin: 0.2rem 0 0.6rem; }

details { border-top: 1px solid var(--grid); padding: 0.6rem 0; }
details summary { cursor: pointer; }
details[open] summary { margin-bottom: 0.4rem; }
details p { max-width: 46em; font-size: 0.92rem; }
details.defect summary b { color: var(--flag); }
details.fig-more { border-top: 0; padding: 0; margin-top: 0.6rem; }
details.fig-more summary { display: inline; list-style: none; color: var(--accent); text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 2px; }
details.fig-more summary::-webkit-details-marker { display: none; }
details.fig-more summary:hover { text-decoration-thickness: 2px; }
details.fig-more summary:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
details.fig-more figure { margin-top: 1rem; }

.cite { background: var(--surface); border: 1px solid var(--grid); border-radius: 3px; padding: 0.4rem 1.2rem 1.2rem; margin-top: 2.4rem; }
.cite h2 { margin-top: 1.2rem; }
blockquote.citation { margin: 1rem 0; padding: 0 1em; border-left: 0.25em solid var(--muted); color: var(--ink2); max-width: 46em; }

p.search { display: flex; flex-wrap: wrap; align-items: center; gap: 0.6rem 1rem; max-width: none; }
#filter {
  font: inherit; font-size: 1.25rem; padding: 0.85rem 1.1rem; flex: 1 1 20rem; min-width: 0;
  background: var(--surface); color: var(--ink); border: 1px solid var(--grid); border-radius: 3px;
}
#filter-count { font-size: 0.95rem; min-width: 11em; }
.quick.models { margin-top: 1rem; }

.anchor {
  margin-left: 0.4rem; color: var(--grid); text-decoration: none; font-size: 0.8em;
  opacity: 0; transition: opacity 0.1s;
}
h1:hover .anchor, h2:hover .anchor, h3:hover .anchor, h4:hover .anchor { opacity: 1; color: var(--muted); }
pre.ticks { font-family: var(--mono); font-size: clamp(7px, 1.6vw, 13px); line-height: 1.2; color: var(--muted);
  margin: 0 0 2rem; overflow: hidden; white-space: pre; }
.tabs > input { position: absolute; opacity: 0; width: 1px; height: 1px; }
.tab-labels { display: flex; flex-wrap: wrap; gap: 0.4rem; margin: 0.6rem 0 0.8rem; font-size: 0.8rem; }
.tab-labels label {
  line-height: 1.2; cursor: pointer; padding: 0.2rem 0.65rem;
  color: var(--ink2); background: var(--surface); border: 1px solid var(--grid); border-radius: 999px;
}
.tab-labels label:hover { border-color: var(--accent); color: var(--accent); }
.tab-panels > * { display: none; }
.tab-panels > .tabs > .tab-labels { margin-top: 0; }
.tab-labels .shared { align-self: center; color: var(--muted); margin-right: 0.2rem; }
.stack > figure { margin-top: 0.6rem; }
p.facet { margin: 1.4rem 0 0.2rem; font-size: 0.85rem; font-weight: 600; color: var(--ink2); }
.slider { position: relative; max-width: 920px; }
.slider > input { position: absolute; opacity: 0; width: 1px; height: 1px; }
.slider .track { position: relative; padding-bottom: 2.5rem; }
.slider .track figure { margin: 0.6rem 0 0; }
.slider .panels { margin-top: 1.4rem; }
.slider .panels figure { margin: 0; }
.slider .track .cur { display: none; }
.slider .track label, .slider .track .axis {
  position: absolute; bottom: 0; box-sizing: border-box; padding: 0.15rem 0.5rem; white-space: nowrap;
  line-height: 1.2; font-size: 0.8rem; font-weight: 600; border: 1px solid transparent;
}
.slider .track label {
  transform: translateX(-50%); max-width: calc(var(--pitch) - 0.3rem); overflow: hidden; text-overflow: ellipsis; text-align: center; cursor: pointer;
  color: var(--ink2); background: var(--surface); border-color: var(--grid); border-radius: 999px;
}
.slider .track label:hover { border-color: var(--accent); color: var(--accent); }
.slider .track .axis { transform: translateX(-100%); padding-right: 0.35rem; font-weight: 400; color: var(--muted); }
.slider .panels > * { display: none; }
/* The strip's hover state (size_energy.mjs): over a group its size lines move apart; a
   stop's column is a hit area. */
figure.strip .ex { transition: transform 0.3s ease; }
figure.strip .exl { opacity: 0; transition: opacity 0.3s ease; }
figure.strip .grp:hover .ex { transform: translateY(var(--ex)); }
figure.strip .grp:hover .exl { opacity: var(--o); }
figure.strip .hit { cursor: pointer; }
.slider.dense .track label { width: calc(var(--pitch) - 0.3rem); padding-left: 0; padding-right: 0; }
@media (max-width: 900px) { .slider.dense .track label { font-size: 0.72rem; } }
@media (max-width: 640px) {
  .slider .track label { font-size: 0.7rem; }
  .slider .track .axis { display: none; }
  .slider.dense .track { padding-bottom: 4rem; }
  .slider.dense .track label { width: calc(2 * var(--pitch) - 0.3rem); max-width: none; }
  .slider.dense .track label:nth-child(odd of label) { bottom: 1.6rem; }
}
${TAB_CSS}
tr.more figure.chart { margin: 0.4rem 0 0.8rem; }
@media (prefers-color-scheme: dark) {
${FIG_DARK}
}
` + LOGO_CSS + (OPEN_PROBLEMS ? OPEN_PROBLEMS_NAV_CSS : "");
// /open-problems/'s own rules and those of its figure switches, in open-problems.css, which only
// that page links: every page carries the menu button, but not that page's figures.
const OP_CSS = OPEN_PROBLEMS ? OPEN_PROBLEMS_PAGE_CSS + OP_TAB_CSS + "\n" : "";

// The stylesheet's URL carries a hash of its contents, so a new page never loads an old
// stylesheet from the cache.
const CSS_VERSION = createHash("sha1").update(CSS).digest("hex").slice(0, 10);
const OP_CSS_VERSION = createHash("sha1").update(OP_CSS).digest("hex").slice(0, 10);

// ----------------------------------------------------------------------------- output
function write(rel, content) {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

fs.rmSync(OUT, { recursive: true, force: true });

write("index.html", homePage());
write("instances/index.html", instancesPage());
write("rules/index.html", redirectPage(RULES, "Rules"));
write("data/index.html", redirectPage(DATA, "Data"));
write("contribute/index.html", contributePage());
if (OPEN_PROBLEMS) {
  const op = openProblemsPages(OPEN_PROBLEMS, instances, { esc, citeHtml, energyCell, modelName, figure, rowCard, FIG_SCRIPT, GITHUB_MARK, CITE_HEAD,
    CITE_TITLE, DOI, CITE_YEAR: RELEASED.slice(0, 4), figureSections: opFigureSections(),
    searchIndex, searchWords, searchMatch, SEARCH_STOP, latticeOf, sizeBand, SIZE_BANDS });
  const opCss = `/open-problems.css?v=${OP_CSS_VERSION}`;
  write("open-problems/index.html", page({ url: OPEN_PROBLEMS_URL, title: "Open Problems", ogTitle: "QMBL: Open Problems", wide: true, css: opCss, ...op.leaderboard }));
  write("open-problems/table/index.html", page({ url: OPEN_PROBLEMS_TABLE_URL, title: "Open Problems: Table", wide: true, css: opCss, ...op.table }));
  write("open-problems.css", OP_CSS);
}
write("404.html", notFoundPage());
write("style.css", CSS);
write("favicon.svg", faviconSvg());
// Rendered once from favicon.svg (scripts/assets/); Safari and share sheets do not take SVG icons.
for (const png of ["apple-touch-icon.png", "favicon-32.png"])
  fs.copyFileSync(path.join("scripts/assets", png), path.join(OUT, png));
fs.mkdirSync(path.join(OUT, "figures"), { recursive: true });
for (const [name] of FIGURES) for (const v of [name, `${name}-dark`])
  fs.copyFileSync(`figures/${v}.svg`, path.join(OUT, "figures", `${v}.svg`));
write("llms.txt", llmsTxt());
write(".nojekyll", "");
write("robots.txt", "User-agent: *\nAllow: /\nSitemap: https://qmbl.org/sitemap.xml\n");

for (const inst of instances) {
  write(`i/${inst.instance_id}/index.html`, instancePage(inst));
  write(`api/i/${inst.instance_id}.json`, JSON.stringify(apiInstance(inst), null, 2) + "\n");
}

write("api/summary.json", JSON.stringify(summary, null, 2) + "\n");
write("api/instances.json", JSON.stringify(instances.map(i => {
  const rec = recordOf(i);
  const f = perSiteDivisor(i);
  return {
    instance_id: i.instance_id, label: instanceLabel(i), model: i.model, lattice: i.lattice,
    n_sites: i.n_sites, boundary: i.boundary ?? null, params: i.params ?? {}, rows: i.rows.length,
    url: `https://qmbl.org${instUrl(i)}`, json: `https://qmbl.org${jsonUrl(i)}`,
    record_energy_per_site: rec && f != null ? rec.energy / f : null,
    record_method: rec?.method ?? null, record_method_detail: rec?.method_detail ?? null,
    record_bound_type: rec?.bound_type ?? null,
  };
}), null, 2) + "\n");
write("api/qmbl.json", JSON.stringify({
  name: "QMBL: the Quantum Many-Body Leaderboard",
  url: "https://qmbl.org/", repository: REPO, license: "Apache-2.0", doi: DOI,
  built: BUILT, note: "Individual energies should be cited to the primary paper named on the row.",
  summary, instances: instances.map(apiInstance),
}, null, 2) + "\n");

const urls = ["/", "/instances/", "/contribute/", ...(OPEN_PROBLEMS ? [OPEN_PROBLEMS_URL, OPEN_PROBLEMS_TABLE_URL] : []), ...instances.map(instUrl)];
write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>https://qmbl.org${u}</loc><lastmod>${BUILT}</lastmod></url>`).join("\n")}
</urlset>
`);

console.log(`${OUT}/: ${urls.length} pages (${instances.length} instances), ${summary.rows} energies, ${summary.records.held} records`);
