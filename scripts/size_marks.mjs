// The log-log plot of the accuracy figures and its marks, shared by size_accuracy.mjs (the
// home page's figures) and open_problems_figure.mjs (the figure on /open-problems/), so that
// the two figures draw a result, a merged group and a flag the same way.
import { rowId } from "./summary.mjs";
import { n, text, hline, dot, tri, slashed, logScale, log, pow10, rowHref, linked, onFill } from "./chart.mjs";

export const mark = (t, x, y, color, p) => (p.flagged ? slashed(t, x, y, color, rowHref(p.inst, p.r), p.below ? "tri" : "dot")
  : (p.below ? tri : dot)(t, x, y, color, p.eligible, rowHref(p.inst, p.r)));
export const FLAGGED = t => ({ kind: "flag", color: t.ink2, label: "Flagged, see the row" });

// Marks at one size that would cover each other are drawn once: at the best row, in that
// row's colour, with the count inside. Groups are taken best first (lowest on the page), each
// holding the rows within MERGE px above its best one, so no two drawn marks are closer than
// MERGE, which is a count mark's outer diameter. The mark links to the best row, and
// `data-rows` names every row in the group, best first, for the site's list. A group of one
// is an ordinary dot. Flagged rows group only with each other, so a slash is never mistaken
// for a count of sound rows and a count never hides a flag: a group of them is a slashed
// outline with the count inside, drawn on top of the others and hiding nothing, and set
// off to the right where a sound mark of the same size would sit under it.
export const MERGE = 16, COUNT_R = 6.5, ASIDE = 11;
export function marks(t, pts, X, Y, colorOf) {
  const out = [], soundY = new Map();
  const grouped = [...Map.groupBy(pts, p => `${p.inst.n_sites} ${p.flagged ? "flagged" : ""}`).values()].sort((a, b) => a[0].flagged - b[0].flagged);
  for (const ps of grouped) {
    const { flagged } = ps[0], N = ps[0].inst.n_sites;
    const order = (a, b) => (b.exact ?? false) - (a.exact ?? false) || a.shown - b.shown || b.eligible - a.eligible;
    const placed = [...ps].sort(order).map(p => ({ p, y: Y(p.shown) }));
    const groups = [];
    for (const q of placed) {
      const g = groups.find(g => g[0].y - q.y <= MERGE && q.y <= g[0].y);
      if (g) g.push(q); else groups.push([q]);
    }
    if (!flagged) soundY.set(N, groups.map(g => g[0].y));
    for (const g of groups) {
      const rows = g.map(q => q.p), y = g[0].y;
      const x = X(N) + (flagged && (soundY.get(N) ?? []).some(sy => Math.abs(sy - y) < MERGE) ? ASIDE : 0);
      out.push([rows[0], groupMark(t, rows, x, y, colorOf(rows[0]), flagged)]);
    }
  }
  return drawOrder(out);
}

// Hollow first, then filled, so a record-eligible mark is never covered by one that is not;
// flagged last, drawn as outlines that hide nothing.
const drawOrder = out => out.sort((a, b) => (a[0].flagged ?? false) - (b[0].flagged ?? false) || a[0].eligible - b[0].eligible).map(([, svg]) => svg);

// One group's mark at (x, y): a dot for one row, else a count mark linking to the first (best)
// row, with every row in `data-rows`; a flagged group is a slashed outline.
function groupMark(t, rows, x, y, color, flagged) {
  const [head] = rows, r = COUNT_R;
  if (rows.length === 1) return flagged ? mark(t, x, y, color, head) : dot(t, x, y, color, head.eligible, rowHref(head.inst, head.r));
  const count = ink => `<text x="${n(x)}" y="${n(y + 3)}" font-size="8.5" font-weight="600" fill="${ink}" text-anchor="middle" style="font-variant-numeric:tabular-nums">${rows.length}</text>`;
  let svg;
  if (flagged) {
    // The count is haloed so that it reads over the slash.
    const d = `M${n(x - 8)} ${n(y + 8)}L${n(x + 8)} ${n(y - 8)}`;
    svg = `<circle cx="${n(x)}" cy="${n(y)}" r="${r - 1}" fill="none" stroke="${color}" stroke-width="2"/>` +
      `<path d="${d}" stroke="${t.surface}" stroke-width="3.5" stroke-linecap="round"/><path d="${d}" stroke="${color}" stroke-width="2" stroke-linecap="round"/>` +
      count(color).replace("<text ", `<text paint-order="stroke" stroke="${t.surface}" stroke-width="2.5" stroke-linejoin="round" `);
  } else {
    const filled = rows.some(p => p.eligible);
    const ink = filled ? (onFill(color) === "#ffffff" ? t.surface : t.ink) : color;
    svg = `<circle cx="${n(x)}" cy="${n(y)}" r="${r + 1.5}" fill="${t.surface}"/>` + (filled
      ? `<circle cx="${n(x)}" cy="${n(y)}" r="${r}" fill="${color}"/>`
      : `<circle cx="${n(x)}" cy="${n(y)}" r="${r - 1}" fill="${t.surface}" stroke="${color}" stroke-width="2"/>`) + count(ink);
  }
  return linked(rowHref(head.inst, head.r), svg).replace('<a class="pt"', `<a class="pt" data-rows="${rows.map(p => rowId(p.inst, p.r)).join(" ")}"`);
}

// marks() for a figure whose sizes lie close together (open_problems_figure.mjs, where the home
// figure's per-size merging left marks of neighbouring sizes covering each other): rows merge
// whatever their size, each group holding the rows within MERGE of its best one in both
// directions, and is drawn there, so no two marks overlap. A flagged group, which never merges
// with sound rows, goes to the nearest place clear of the marks already drawn. Returns the marks
// and where they sit, [x, y, half-size], so the caller can place more marks clear of them.
const halfSize = (rows, flagged) => (flagged ? (rows > 1 ? 9 : 6.5) : rows > 1 ? COUNT_R : 5);
export function marksAcross(t, pts, X, Y, colorOf) {
  const order = (a, b) => (b.exact ?? false) - (a.exact ?? false) || a.shown - b.shown || b.eligible - a.eligible;
  const groupsOf = ps => {
    const groups = [];
    for (const q of [...ps].sort(order).map(p => ({ p, x: X(p.inst.n_sites), y: Y(p.shown) }))) {
      const g = groups.find(g => Math.max(Math.abs(g[0].x - q.x), Math.abs(g[0].y - q.y)) <= MERGE);
      if (g) g.push(q); else groups.push([q]);
    }
    return groups;
  };
  const out = [], placed = [];
  for (const [flagged, ps] of [[false, pts.filter(p => !p.flagged)], [true, pts.filter(p => p.flagged)]])
    for (const g of groupsOf(ps)) {
      const rows = g.map(q => q.p), h = halfSize(rows.length, flagged), y = g[0].y;
      const x = flagged ? freeX(placed, g[0].x, y, h) : g[0].x;
      placed.push([x, y, h]);
      out.push([rows[0], groupMark(t, rows, x, y, colorOf(rows[0]), flagged)]);
    }
  return { svgs: drawOrder(out), placed };
}

// The nearest x to x0 on the line y where a mark of half-size h clears every mark in `placed`
// by a pixel, looked for a pixel at a time, to the right first.
export function freeX(placed, x0, y, h) {
  const clear = x => placed.every(([px, py, ph]) => Math.max(Math.abs(px - x), Math.abs(py - y)) >= ph + h + 1);
  for (let d = 0; d <= 200; d++) for (const x of d ? [x0 + d, x0 - d] : [x0]) if (clear(x)) return x;
  return x0;
}

// A log-log plot area: size along x with the ticks given, distance up y on a decade scale.
// Without `exact` the scale is inverted (y0 at the top, y1 at the bottom). With `exact` it
// is not (y0 at the bottom, y1 at the top), a gap below y0 is placed on an "exact" line
// EXACT_RISE below the bottom gridline, and the Y returned does so; the size labels move
// down under that line. `lanes` names such lines, one under the other, in place of the one
// "exact" line (open_problems_figure.mjs: "energy to beat", "estimates below it"); `lane(k)`
// is the height of the k-th, and Y places a gap below y0 on the first.
export const EXACT_RISE = 24;
export function logPlot(t, parts, { left, right, top, bottom, x0, x1, y0, y1, xTicks, xLabel, yLabel, exact, lanes = exact ? ["exact"] : [] }) {
  const X = logScale(x0, x1, left, right), scale = lanes.length ? logScale(y0, y1, bottom, top) : logScale(y0, y1, top, bottom);
  const lane = k => bottom + EXACT_RISE * (k + 1);
  const Y = lanes.length ? g => (g < y0 ? lane(0) : scale(g)) : scale;
  const below = lanes.length ? lane(lanes.length - 1) : bottom;
  lanes.forEach((label, k) => {
    parts.push(hline(left, right, lane(k), t.muted));
    parts.push(text(left - 8, lane(k) + 4, label, { size: 11, fill: t.ink2, anchor: "end" }));
  });
  for (let k = Math.ceil(log(y0)); k <= Math.floor(log(y1)); k++) {
    const v = 10 ** k;
    parts.push(hline(left, right, Y(v), t.grid));
    parts.push(text(left - 8, Y(v) + 4, pow10(k), { size: 11, fill: t.muted, anchor: "end", nums: true }));
  }
  for (const v of xTicks) parts.push(text(X(v), below + 18, String(v), { size: 11, fill: t.muted, anchor: "middle", nums: true }));
  if (xLabel) parts.push(text((left + right) / 2, below + 38, xLabel, { size: 12, fill: t.ink2, anchor: "middle" }));
  if (yLabel) parts.push(`<text transform="translate(${n(left - 46)} ${n((top + bottom) / 2)}) rotate(-90)" font-size="12" fill="${t.ink2}" text-anchor="middle">${yLabel}</text>`);
  return { X, Y, lane };
}
