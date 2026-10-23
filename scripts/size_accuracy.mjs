// Generate figures/size-vs-accuracy*.svg and figures/size/*.svg: published energies against
// system size, placed by their relative gap to a reference energy so that Hamiltonians of
// different energy scales share one axis.
//
// The two overview figures use only instances with an exact energy, on a plain log scale from
// 10^-8 to 10^0; the exact energy (gap zero) is a line below the plot, and sign-problem-free QMC
// counts as exact. A row closer than 10^-8 sits on that line. A row below the exact energy
// within twice the joint error bar is placed by the size of its gap; a row further below is not
// drawn, and the footnote counts it. No row is drawn closer than its own relative error bar.
// Marks that would cover each other at one size merge into one mark with a count; on the site
// it lists them (site.mjs, FIG_SCRIPT).
//
// The per-Hamiltonian figures (one per model, lattice and boundary, a panel per ladder of
// sizes, see ladders.mjs) turn the scale upside down, so a better energy is higher. A size with
// no exact energy uses the record as its reference and says so by colour; the record holder
// sits in a band above the plot, and a row below its reference is a triangle.
//
// No figure here shows a V-score, a variance or a gap for the record itself: QMBL does not rank
// records by how beatable they are.
import fs from "node:fs";
import { recordEligible, exactEligible } from "./units.mjs";
import { collect, lowestOf, exactRecordOf } from "./summary.mjs";
import { FAMILIES } from "./views.mjs";
import { ladderFigures } from "./ladders.mjs";
import { W, PAD, n, text, hline, dot, legend, header, footnote, doc, textWidth, writer, logScale, rowHref } from "./chart.mjs";
// The plot frame, the marks and their merging, shared with the figure on /open-problems/.
import { mark, FLAGGED, marks, EXACT_RISE, logPlot } from "./size_marks.mjs";

const OUT = "figures";
const instances = collect();
const { write, written } = writer(OUT);

const BOUNDS = { variational: 0, projected: 1, extrapolated: 2, approximate: 2 }; // approximate (RULES.md 4) shares the extrapolations' colour
const FLOOR = 1e-8; // relative gaps below this are drawn on the exact line, and counted

// The reference an instance's rows are measured against, and what kind it is.
function referenceOf(inst) {
  const exact = exactRecordOf(inst);
  if (exact) return { row: exact, kind: "exact" };
  const rec = lowestOf(inst);
  return rec ? { row: rec, kind: "record" } : null;
}

// Every non-exact row with a bound type, flagged rows included and marked, except a row
// flagged wrong-instance, whose energy belongs to another instance. `gap` is relative to the
// reference energy. Extrapolations and projections may land below an exact reference, and a
// sampled bound without an error bar may land below a record; the axis shows the absolute
// value, so such a row is `below`. It is `under` when it lies below by more than twice the
// joint error bar and further than the floor; the exact-referenced figures leave it undrawn
// unless it is flagged. `shown` is the height those figures draw: the gap, but never less
// than the row's own relative error bar.
function points(inst, ref) {
  return inst.rows
    .filter(r => r.bound_type in BOUNDS && r.defect?.flag !== "wrong-instance" && r !== ref.row)
    .map(r => {
      const gap = Math.abs(r.energy - ref.row.energy) / Math.abs(ref.row.energy);
      const under = gap >= FLOOR && ref.row.energy - r.energy > 2 * Math.hypot(r.sigma ?? 0, ref.row.sigma ?? 0);
      const shown = Math.max(gap, (r.sigma ?? 0) / Math.abs(ref.row.energy));
      return { r, inst, fam: r.family, eligible: recordEligible(r), flagged: !!r.defect, below: r.energy < ref.row.energy, under, gap, shown };
    });
}
// The exact rows of an instance, for the overview's exact line: distance zero by definition.
const exactPoints = inst => inst.rows.filter(exactEligible)
  .map(r => ({ r, inst, fam: r.family, eligible: true, exact: true, below: false, under: false, gap: 0, shown: 0 }));
const BELOW = t => ({ kind: "tri", color: t.ink2, label: "Below the energy it is measured against" });

// The best gap at each size among a set of points, joined from size to size. `key` is the
// height a figure draws: `gap`, or `shown` where the error bar floors it. A flagged row is
// drawn but is never the best (RULES.md 6.1), so the lines pass it by.
function best(pts, key = "gap") {
  return [...Map.groupBy(pts.filter(p => !p.flagged), p => p.inst.n_sites)].map(([N, ps]) => [N, Math.min(...ps.map(p => p[key]))]).sort((a, b) => a[0] - b[0]);
}
function frontier(pts, X, Y, color, key = "gap") {
  const steps = best(pts, key);
  if (steps.length < 2) return "";
  const d = steps.map(([N, g], k) => `${k ? "L" : "M"}${n(X(N))} ${n(Y(g))}`).join("");
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" opacity="0.85"/>`;
}

const exactRef = instances.map(i => [i, referenceOf(i)]).filter(([, ref]) => ref?.kind === "exact");
// A flagged row is drawn however far under it lies: that it sits below the exact energy is
// the very thing its flag says, and the slashed triangle shows it.
const all = exactRef.flatMap(([i, ref]) => points(i, ref)).filter(p => !p.under || p.flagged);
const under = exactRef.flatMap(([i, ref]) => points(i, ref)).filter(p => p.under && !p.flagged).length;
// Only the instances something is drawn for: an exact energy nobody has published against compares nothing.
const exacts = exactRef.filter(([i]) => all.some(p => p.inst === i)).flatMap(([i]) => exactPoints(i));
const NS = [...all, ...exacts].map(p => p.inst.n_sites);
const X0 = 8, X1 = Math.max(...NS) * 1.4;
const Y0 = FLOOR, Y1 = 1;
const XT = [10, 30, 100, 300, 1000].filter(v => v <= X1);
const floored = all.filter(p => p.shown < FLOOR).length;
const lifted = all.filter(p => p.shown > p.gap).length;
const UNDER = `${under} ${under === 1 ? "row lies" : "rows lie"} below the exact energy by more than twice the error bar and ${under === 1 ? "is" : "are"} not drawn.`;
const Y_LABEL = "relative gap to the instance's exact energy (lower is better)";
// The largest size at which the overview draws a model other than Heisenberg or Hubbard; the
// subtitle states it.
const LAST_OTHER = Math.max(...all.filter(p => !["Heisenberg", "Hubbard"].includes(p.inst.model)).map(p => p.inst.n_sites));

// ------------------------------------------------------ 1. every row against an exact energy
write("size-vs-accuracy", t => {
  const h = header(t, "The best published energies, by system size",
    "Results are placed by their relative gap to the exact ground-state energy so that different Hamiltonians share one axis. A better energy is lower. " +
    `Above size ${LAST_OTHER} there are only Heisenberg and Hubbard model results, because they have an exact ground-state energy as reference. For other Hamiltonians at larger system sizes, see below.`);
  const lg = legend(t, [
    { kind: "dot", color: t.series[0], label: "Variational bound" },
    { kind: "dot", color: t.series[1], label: "Projected" },
    { kind: "dot", color: t.series[2], label: "Extrapolated" },
    { kind: "dot", color: t.series[3], label: "Exact and exact (stochastic)" },
    FLAGGED(t),
  ], h.bottom + 34);
  const top = lg.bottom + 28, bottom = top + 380, left = PAD + 62, right = W - PAD - 8;
  const parts = [h.svg, lg.svg];
  const { X, Y } = logPlot(t, parts, { left, right, top, bottom, x0: X0, x1: X1, y0: Y0, y1: Y1, xTicks: XT, xLabel: "sites", yLabel: Y_LABEL, exact: true });
  parts.push(...marks(t, [...all, ...exacts], X, Y, p => t.series[p.exact ? 3 : BOUNDS[p.r.bound_type]]));
  const fn = footnote(t, "Height is |E − E_exact| / |E_exact| on a log scale, so that a better energy is lower. " +
    "On the site, hovering over a dot lists the result, and clicking it opens the table entry and source.", bottom + EXACT_RISE + 58);
  parts.push(fn.svg);
  return doc(t, fn.bottom + 24, "The best published energies, by system size",
    `Number of sites (x) against relative gap to the exact ground-state energy (y, log scale, lower is better) for ${all.length} published energies and ${exacts.length} exact energies on ${exactRef.length} exactly solved instances.`, parts);
});

// ------------------------------------------------------------- 2. the same, by method family
// Small multiples on shared axes: the family's rows in colour over every row in grey,
// with the family's best gap at each size as a line, which joins different Hamiltonians.
// The grey backdrop is the same in every panel, so it is drawn once and placed with <use>:
// every row, the panel's own family included, since a coloured mark's surface ring covers
// its grey twin. One copy keeps the file small enough for the front page to inline.
write("size-vs-accuracy-by-family", t => {
  const names = [...FAMILIES.map(f => f[0]), "other"].filter(f => all.some(p => p.fam === f));
  const cols = 2, rows = Math.ceil(names.length / cols);
  const h = header(t, "The best energies by system size, one panel per method family",
    "Each panel colours one family's energies over all the others in grey and joins the family's best energy at each size. " +
    "A method that only ever ran at one size is a lone mark.");
  const panelW = (W - 2 * PAD - 40) / cols, plotH = 160, pitch = plotH + 78 + EXACT_RISE;
  const top0 = h.bottom + 40, left0 = PAD + 58, cloudId = "size-vs-accuracy-by-family-grey";
  const CX = logScale(X0, X1, left0, PAD + panelW - 4), CYlog = logScale(Y0, Y1, top0 + plotH, top0);
  const CY = g => (g < Y0 ? top0 + plotH + EXACT_RISE : CYlog(g));
  const parts = [h.svg, `<defs><g id="${cloudId}" fill="${t.recessive[0]}">` +
    all.map(p => `<circle cx="${n(CX(p.inst.n_sites))}" cy="${n(CY(p.shown))}" r="2.5"/>`).join("") + "</g></defs>"];
  names.forEach((name, k) => {
    const col = k % cols, row = Math.floor(k / cols);
    const px = PAD + col * (panelW + 40), left = px + 58, right = px + panelW - 4;
    const top = top0 + row * pitch, bottom = top + plotH;
    const mine = all.filter(p => p.fam === name);
    parts.push(text(left, top - 12, `${name} (${mine.length})`, { size: 13, fill: t.ink, weight: 600 }));
    const { X, Y } = logPlot(t, parts, { left, right, top, bottom, x0: X0, x1: X1, y0: Y0, y1: Y1, xTicks: XT,
      xLabel: row === rows - 1 ? "sites" : null, yLabel: null, exact: true });
    parts.push(`<use href="#${cloudId}" x="${n(left - left0)}" y="${n(top - top0)}"/>`);
    parts.push(frontier(mine, X, Y, t.series[0], "shown"));
    parts.push(...marks(t, mine, X, Y, () => t.series[0]));
  });
  const y = top0 + (rows - 1) * pitch + plotH + EXACT_RISE + 62;
  const fn = footnote(t, "Each ansatz belongs to one family, and a row without one goes by its method (scripts/method_names.mjs); 'other' holds exact methods and names no family covers. " +
    "A slashed mark is a flagged row, and a number counts the rows a mark holds. Axes and the exact line as in the figure above: " +
    `a better energy is lower. No dot sits closer to exact than its own error bar. ${UNDER}`, y);
  parts.push(fn.svg);
  return doc(t, fn.bottom + 24, "The best published energies by system size, one panel per method family",
    names.map(f => `${f}: ${all.filter(p => p.fam === f).length} energies`).join("; "), parts);
});

// ----------------------------------------------------------- 3. one figure per Hamiltonian
// The same Hamiltonian at growing sizes: one panel per ladder (ladders.mjs), one figure per
// model, lattice and boundary, which the site switches between. Where a size has no exact
// energy the reference is the record, and the size's label says so by colour; the record
// holder itself sits in the band above the plot. One line per method family through its
// best row at each size.
//
// A ladder is drawn where rows other than its references sit at two sizes or more, and only
// those sizes are: one size is the instance's own table, and a size holding nothing but its
// reference has no result to place. The directory is emptied first, as figures/cost/ is,
// so the site never inlines a figure for a ladder that no longer qualifies.
const SIZE_DIR = `${OUT}/size`;
fs.rmSync(SIZE_DIR, { recursive: true, force: true });
fs.mkdirSync(SIZE_DIR, { recursive: true });

function ladderOf({ label, members }) {
  const withRef = members.map(i => [i, referenceOf(i)]).filter(([, ref]) => ref);
  const pts = withRef.flatMap(([i, ref]) => points(i, ref).map(p => ({ ...p, ref: ref.kind })));
  const sizes = [...new Set(pts.map(p => p.inst.n_sites))].sort((a, b) => a - b);
  const holders = withRef.filter(([i, ref]) => ref.kind === "record" && pts.some(p => p.inst === i)).map(([i, ref]) => ({ inst: i, r: ref.row }));
  const kind = N => (pts.some(p => p.inst.n_sites === N && p.ref === "record") ? "record" : "exact");
  const title = [label, `${pts.length + holders.length} energies at ${sizes.length} sizes`].filter(Boolean).join(": ");
  return { label, title, members, pts, sizes, holders, kind };
}

// One tick per size, the label coloured as the caller says and dropped where it would run
// into the previous one (the Heisenberg square has 29 sizes).
function sizeTicks(t, parts, X, sizes, bottom, fill) {
  let lastEnd = -Infinity;
  for (const N of sizes) {
    const x = X(N), w = textWidth(String(N), 11);
    parts.push(`<path d="M${n(x)} ${n(bottom)}v4" stroke="${t.grid}" stroke-width="1"/>`);
    if (x - w / 2 < lastEnd + 6) continue;
    parts.push(text(x, bottom + 18, String(N), { size: 11, fill: fill(N), anchor: "middle", nums: true }));
    lastEnd = x + w / 2;
  }
}

function ladderPanel(t, parts, L, { left, right, top, bottom }) {
  const band = top - 22;
  parts.push(text(left, band - 24, L.title, { size: 13, fill: t.ink, weight: 600 }));
  const { X, Y } = logPlot(t, parts, { left, right, top, bottom, x0: L.sizes[0] / 1.5, x1: L.sizes.at(-1) * 1.5, y0: Y0, y1: Y1, xTicks: [], xLabel: null, yLabel: null });
  sizeTicks(t, parts, X, L.sizes, bottom, N => (L.kind(N) === "exact" ? t.muted : t.series[1]));
  // The record holders' band, above the plot: gap zero by construction.
  if (L.holders.length) {
    parts.push(hline(left, right, band, t.grid));
    parts.push(text(left - 8, band + 4, "holds the record", { size: 9.5, fill: t.muted, anchor: "end" }));
    for (const hd of L.holders) parts.push(dot(t, X(hd.inst.n_sites), band, t.ink2, true, rowHref(hd.inst, hd.r)));
  }
  // One line per family through its best row at each size; the overall best on top.
  const ends = [];
  for (const [fam, ps] of Map.groupBy(L.pts, p => p.fam)) {
    const line = frontier(ps, X, Y, t.recessive[1]);
    if (line) {
      parts.push(line);
      const [N, g] = best(ps).at(-1);
      ends.push({ fam, x: X(N) + 9, y: Y(g) + 4 });
    }
  }
  parts.push(frontier(L.pts, X, Y, t.series[0]));
  for (const p of [...L.pts].sort((a, b) => a.flagged - b.flagged || a.eligible - b.eligible)) parts.push(mark(t, X(p.inst.n_sites), Y(p.gap), t.ink2, p));
  // Family names at the right end of each line, nudged apart where two would collide.
  ends.sort((a, b) => a.y - b.y);
  for (let a = 1; a < ends.length; a++) if (ends[a].y - ends[a - 1].y < 13) ends[a].y = ends[a - 1].y + 13;
  for (const e of ends) {
    const w = textWidth(e.fam, 10.5);
    const x = e.x + w > right + 30 ? e.x - 18 - w : e.x;
    parts.push(text(x, e.y, e.fam, { size: 10.5, fill: t.ink2 }));
  }
}

// Panels in two columns, or one full-width panel; `draw` fills a box, and the grid returns
// the y below its last row.
function grid(count, top0, { plotH, gap, draw }) {
  const cols = count === 1 ? 1 : 2, panelW = (W - 2 * PAD - 40 * (cols - 1)) / cols;
  for (let k = 0; k < count; k++) {
    const col = k % cols, row = Math.floor(k / cols);
    const px = PAD + col * (panelW + 40), top = top0 + row * (plotH + gap);
    draw(k, { px, left: px + 58, right: px + panelW - 4, top, bottom: top + plotH });
  }
  return top0 + (Math.ceil(count / cols) - 1) * (plotH + gap) + plotH;
}

const FIGS = ladderFigures(instances)
  .map(f => ({ ...f, panels: f.ladders.map(ladderOf).filter(L => L.sizes.length >= 2) }))
  .filter(f => f.panels.length);

for (const f of FIGS) write(f.name, t => {
  const title = `${f.title}: the best energies at each size`;
  const h = header(t, title,
    `${f.panels.length === 1 ? "One Hamiltonian" : `${f.panels.length} Hamiltonians, one panel per set of couplings`}, at every size with a published result. ` +
    "Each size is placed against its exact energy where it has one (sizes in grey), otherwise against the standing record (sizes in orange), " +
    "whose holder then sits in the band above the plot. One line per method family through its best energy at each size. Here the axis is inverted: a better energy is higher.");
  const lg = legend(t, [
    { kind: "line", color: t.series[0], label: "Best at each size" },
    { kind: "line", color: t.recessive[1], label: "One method family" },
    { kind: "dot", color: t.ink2, label: "Published energy" },
    FLAGGED(t),
    BELOW(t),
  ], h.bottom + 34);
  const parts = [h.svg, lg.svg];
  const end = grid(f.panels.length, lg.bottom + 90, { plotH: f.panels.length === 1 ? 240 : 200, gap: 120,
    draw: (k, box) => ladderPanel(t, parts, f.panels[k], box) });
  const fn = footnote(t, "Sizes are numbers of sites. A family's line joins its best energy at each size, whichever paper set it, so one line can join " +
    "several calculations. Where the reference is the record, the heights show how far the other rows are from it, and nothing about the record itself.", end + 44);
  parts.push(fn.svg);
  return doc(t, fn.bottom + 24, title, f.panels.map(L => `${L.title}, sizes ${L.sizes.join(", ")}`).join("; "), parts);
});

console.log(`${OUT}/: ${written.length} files (size vs accuracy: ${all.length} exact-referenced energies on ${exactRef.length} instances, ${floored} at the floor; ` +
  `${FIGS.length} per-Hamiltonian figures, ${FIGS.reduce((a, f) => a + f.panels.length, 0)} ladders)`);
