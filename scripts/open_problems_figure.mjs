// The figure at the top of /open-problems/: the home page's "The best published energies, by system size"
// (size_accuracy.mjs) for the open problems, with its frame, marks, merged marks, colours and
// legend (size_marks.mjs, chart.mjs) and its hover cards (site.mjs), every mark linking to its
// row in the Table. The reference is each instance's energy to beat, its best variational
// energy, read from data/ as the page reads it. Where the home figure has its "exact" line,
// this one has "energy to beat", a mark per instance for the row that sets it, and under it
// "estimates below it", for the extrapolated and projected energies below that, which a
// distance on a log scale cannot place. An instance without an energy to beat is not drawn,
// and a line under the axis counts them. A verified entry (results/) is a diamond linking to
// its row in the page's Entries table. Every result is a mark, never a line.
//
// Drawn with the page from the live data, in the light theme, which the stylesheet recolours in
// dark mode as it does the home figures; never written to figures/.
import { W, PAD, text, legend, header, footnote, doc, diamond, THEMES } from "./chart.mjs";
import { marksAcross, freeX, logPlot, FLAGGED } from "./size_marks.mjs";
import { perSiteDivisor, recordEligible } from "./units.mjs";

export const FIGURE_NAME = "open-problems-by-size";
const TITLE = "The best published energies on the open problems, by system size";
const SUBTITLE = "Results are placed by their relative gap to the instance's energy to beat, QMBL's best variational energy, " +
  "so that different Hamiltonians share one axis. A better energy is lower.";
const CAPTION = "The energies on the open problems, placed by their relative gap to each instance's energy to beat so that " +
  "different Hamiltonians share one axis; a better energy is lower. Colour shows the bound type, a diamond is a verified entry, " +
  "and a slashed mark is a flagged row.";
const BOUNDS = { variational: 0, projected: 1, extrapolated: 2, approximate: 2 }; // approximate (RULES.md 4) shares the extrapolations' colour
const Y0 = 1e-8, Y1 = 1;
const DIAMOND = 5.8; // the half-size of an entry's mark (chart.mjs diamond)

// `targets` and `entries` as open_problems.mjs scores them; `entryHref(e)` is an entry's link.
// Returns the light SVG, with the title and caption that label it on the page.
export function openProblemsFigure(targets, entries, entryHref) {
  const t = THEMES.light;
  // An instance's energy to beat per site: its best variational energy, or where it has none
  // the first verified state, which sets it.
  const placed = targets.map(x => ({ x, beat: x.energy ?? x.first?.energy_per_site })).filter(({ beat }) => beat != null);
  // Every row that is a result, as size_accuracy.mjs takes them. `shown` is the height: 0 for
  // the row that sets the energy to beat, which Y puts on the first line; negative for one below
  // it, the further below the more negative, which Y puts on the second line, the furthest first
  // in a merged mark's list; otherwise the gap, never less than the row's own error bar allows.
  const pts = placed.flatMap(({ x, beat }) => {
    const f = perSiteDivisor(x.inst) ?? 1, scale = Math.abs(beat);
    return x.inst.rows.filter(r => r.bound_type in BOUNDS && r.defect?.flag !== "wrong-instance").map(r => {
      const e = r.energy / f;
      const shown = r === x.row ? 0 : e < beat ? -1 - (beat - e) / scale : Math.max((e - beat) / scale, (r.sigma ?? 0) / f / scale);
      return { r, inst: x.inst, eligible: recordEligible(r), flagged: !!r.defect, below: false, shown };
    });
  });
  // A system's live entries, and a first verified state even where it is no longer live.
  const ents = entries.filter(s => s.live || s.first).map(s => {
    const beat = s.x.energy ?? s.x.first.energy_per_site, scale = Math.abs(beat), e = s.e.energy_per_site;
    return { s, N: s.x.inst.n_sites, shown: s.first ? 0 : e < beat ? -1 : Math.max((e - beat) / scale, (s.e.sigma_per_site ?? 0) / scale) };
  });

  const NS = placed.map(({ x }) => x.inst.n_sites);
  const X0 = Math.min(8, Math.min(...NS) / 1.2), X1 = Math.max(...NS) * 1.4;
  const h = header(t, TITLE, SUBTITLE);
  const lg = legend(t, [
    { kind: "dot", color: t.series[0], label: "Variational bound" },
    { kind: "dot", color: t.series[1], label: "Projected" },
    { kind: "dot", color: t.series[2], label: "Extrapolated" },
    ...(ents.length ? [{ kind: "diamond", color: t.ink, label: "Verified entry" }] : []),
    FLAGGED(t),
  ], h.bottom + 34);
  // The left margin is wider than the home figure's, for the second line's name.
  const top = lg.bottom + 28, bottom = top + 380, left = PAD + 96, right = W - PAD - 8;
  const parts = [h.svg, lg.svg];
  const { X, Y: gapY, lane } = logPlot(t, parts, { left, right, top, bottom, x0: X0, x1: X1, y0: Y0, y1: Y1,
    xTicks: [10, 30, 100, 300, 1000].filter(v => v >= X0 && v <= X1), xLabel: "sites",
    yLabel: "relative gap to the energy to beat (lower is better)", lanes: ["energy to beat", "estimates below it"] });
  const Y = g => (g < 0 ? lane(1) : gapY(g));
  // Sizes lie closer together here than on the home figure, so marks merge across sizes as well,
  // and no two marks overlap.
  const drawn = marksAcross(t, pts, X, Y, p => t.series[BOUNDS[p.r.bound_type]]);
  parts.push(...drawn.svgs);
  // An entry is drawn at the nearest place clear of every other mark, as a flagged group is.
  for (const en of ents) {
    const y = Y(en.shown), x = freeX(drawn.placed, X(en.N), y, DIAMOND);
    drawn.placed.push([x, y, DIAMOND]);
    parts.push(diamond(t, x, y, t.ink, entryHref(en.s.e)));
  }

  let y = lane(1) + 58;
  const missing = targets.length - placed.length;
  if (missing) {
    parts.push(text(PAD, y, `${missing} ${missing === 1 ? "instance has" : "instances have"} no variational energy yet and ${missing === 1 ? "is" : "are"} not drawn.`, { size: 11.5, fill: t.ink2 }));
    y += 20;
  }
  const fn = footnote(t, "Height is (E − E_target) / |E_target| on a log scale, so that a better energy is lower. " +
    "Hovering over a dot lists the result and clicking leads to the table entry and source.", y);
  parts.push(fn.svg);
  const svg = doc(t, fn.bottom + 24, TITLE, `Number of sites (x) against relative gap to the energy to beat (y, log scale, lower is better) for ` +
    `${pts.length} published energies on ${placed.length} of the ${targets.length} open problems${ents.length ? ` and ${ents.length} verified entries` : ""}.`, parts);
  return { svg, title: TITLE, caption: CAPTION };
}
