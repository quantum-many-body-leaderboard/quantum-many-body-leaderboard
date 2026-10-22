// Generate figures/energy-vs-compute*.svg, energy-vs-flops*.svg and energy-vs-parameters*.svg,
// and one figure per instance with enough costed energies in figures/cost/, figures/flops/ and
// figures/params/. The y axis is the energy per site; each instance has its own panel, as
// energies of different Hamiltonians are not comparable.
//
// Costs come only from the `compute` blocks: hours and parameter counts through cost.mjs,
// estimated FLOPs through flops.mjs. GPU-hours and CPU core-hours share the hours axis with
// different marks; FLOPs have their own figures. No cost is converted into another (DATA.md).
//
// The frontier is the staircase of results nothing beats for less: sorted by cost, a row is on
// it when its energy is below every cheaper row that could be the best of its class: unflagged,
// and not passed over by the automatic flag below an exact energy (RULES.md 6, 6.2).
import fs from "node:fs";
import { classEligible, exactEligible, boundLabel, perSiteDivisor, perSiteLabel } from "./units.mjs";
import { collect, classBest, shownBest, rowId } from "./summary.mjs";
import { hoursOrEdOf, parametersOf, MIN_COSTED, costFigureName, flopsFigureName, paramsFigureName } from "./cost.mjs";
import { estimatedFlopsOf } from "./flops.mjs";
import { stairs, layoutLabels, meets, insetFrame } from "./labels.mjs";
import { MODELS, BOUNDARY } from "./readme_table.mjs";
import { W, PAD, n, text, hline, dot, legend, header, footnote, doc, textWidth, niceStep, writer, log, logScale, pow10, shortLabel, rowHref, linked } from "./chart.mjs";

const OUT = "figures";
const instances = collect();
const { write, written } = writer(OUT);
const BOUNDS = { variational: 0, projected: 1, extrapolated: 2, approximate: 2, exact: 3 };


// Panel titles use the README table's model and boundary names (readme_table.mjs).
const MODEL = Object.fromEntries(MODELS);
function instLabel(i) {
  const side = Math.sqrt(i.n_sites);
  const lat = i.lattice.replace(/^rectangular-/, "").replace(/x/g, "×").replace(/^square$/, Number.isInteger(side) ? `${side}×${side}` : "square");
  const extra = i.params.J2 != null ? `, J2 = ${i.params.J2}` : i.params.U != null ? `, U = ${i.params.U}, n = ${(2 * i.params.Nf / i.n_sites).toFixed(3).replace(/\.?0+$/, "")}` : "";
  const bc = i.boundary in BOUNDARY ? `, ${BOUNDARY[i.boundary]}` : i.boundary === "A" ? ", antiperiodic" : "";
  return `${MODEL[i.model] ?? i.model} ${lat}${/×|x/.test(lat) ? "" : ` ${i.n_sites}`}${extra}${bc}`;
}

// The costed rows of an instance under one cost accessor, which sees the compute block,
// the row and the instance (an estimate needs all three). A row on the frontier can be the
// best of its class; exact rows count only when they state the ground state.
function costed(inst, costOf) {
  const f = perSiteDivisor(inst);
  return inst.rows.filter(r => r.bound_type in BOUNDS && !r.defect).flatMap(r => {
    const cost = costOf(r.compute, r, inst);
    if (!cost || !(r.bound_type !== "exact" || exactEligible(r))) return [];
    return [{ r, inst, cost, e: r.energy / f, eligible: r.bound_type === "exact" ? exactEligible(r) : classEligible(r) && !classBest(inst).below.includes(r) }];
  });
}
function frontierOf(pts) {
  const out = [];
  let best = Infinity;
  for (const p of [...pts].sort((a, b) => a.cost.value - b.cost.value || a.e - b.e)) {
    if (!p.eligible) continue;
    if (p.e < best) { best = p.e; out.push(p); }
  }
  return out;
}

// Square marks for CPU core-hours, circles for everything else. A derived cost has no
// whisker; the footnote counts those rows. Same surface ring and filled/hollow convention
// as dot().
function mark(t, x, y, color, filled, unit, href) {
  const out = [];
  if (unit === "cpu") {
    out.push(`<rect x="${n(x - 6.5)}" y="${n(y - 6.5)}" width="13" height="13" rx="2" fill="${t.surface}"/>`);
    out.push(filled
      ? `<rect x="${n(x - 4.5)}" y="${n(y - 4.5)}" width="9" height="9" rx="1.5" fill="${color}"/>`
      : `<rect x="${n(x - 4)}" y="${n(y - 4)}" width="8" height="8" rx="1.5" fill="${t.surface}" stroke="${color}" stroke-width="2"/>`);
  } else out.push(dot(t, x, y, color, filled));
  return linked(href, out.join(""));
}

// One instance's energies against their cost, into the box given: the energy axis is
// linear and per site, the cost axis logarithmic, the frontier as a staircase with its
// points named. Every result with a cost is a dot, of any bound type; a shown value that states no
// cost is named in a line of text under the axis. A mark is named by its method alone, with
// the detail in the row's card on hover; QMBL's own runs keep "QMBL" in the name, so none
// reads as published. The colour is the bound type.
const markName = r => shortLabel({ ...r, method_detail: undefined, compute: undefined, bound_type: "variational", defect: undefined });

// The figures whose energy axis is broken in two, the few high energies above and the crowd
// below. The list is chosen by hand: on these a break names the marks better or spreads a
// crowd; on the others one scale reads as well. Names as costFigureName, flopsFigureName and
// paramsFigureName give them.
const BROKEN = new Set([
  "cost/Heisenberg--triangular_36_P", "cost/J1J2--square_36_P_0.5", "flops/J1J2--square_36_P_0.5",
  "params/Heisenberg--square_36_P", "params/Hubbard--rectangular-4x16_64_P_28_8", "params/J1J2--square_100_P_0.4",
  "params/J1J2--square_100_P_0.5", "params/J1J2--square_256_P_0.5", "params/J1J2--square_36_P_0.5",
]);
const brokenAxes = new Map();

// An instance's own figure: every mark named in place where it can be. Where two or more
// marks still find no room, their region is boxed and drawn again, enlarged, in an inset in
// the plot's top right corner, a second crowd's in the top left. A figure in BROKEN takes,
// instead, the broken axis that names its marks best (fewest numbered, then fewest names on
// lines, then the shortest lines, then the most spread up the plot) and no inset. Returns the
// y the footnote starts at.
function drawInstance(t, parts, inst, pts, g) {
  if (BROKEN.has(g.name)) {
    if (!brokenAxes.has(g.name)) {
      const clashes = labelClashes.length;
      const runs = brokenCandidates(pts.map(p => p.e), g.top, g.bottom).map(axis => {
        const stats = {};
        drawPanel(t, [], inst, pts, { ...g, nameAll: true, axis, stats });
        return { axis, ...stats };
      });
      labelClashes.length = clashes;   // the trial layouts' clashes are not the figure's
      runs.sort((a, b) => a.keyed - b.keyed || a.leaders - b.leaders || a.length - b.length || b.axis.spread - a.axis.spread);
      brokenAxes.set(g.name, runs[0]?.axis ?? null);
    }
    const axis = brokenAxes.get(g.name);
    if (axis) { drawPanel(t, parts, inst, pts, { ...g, nameAll: true, axis }); return g.bottom + 70; }
  }
  const trial = [], crowd = [];
  drawPanel(t, trial, inst, pts, { ...g, nameAll: true, keyOut: crowd });
  if (crowd.length >= 2) {
    const zoomed = [];
    if (drawPanel(t, zoomed, inst, pts, { ...g, nameAll: true, zoom: crowd })) { parts.push(...zoomed); return g.bottom + 70; }
  }
  parts.push(...trial);
  return g.bottom + 70;
}

// An instance's own figure names every mark, so it grows with the marks it holds: 300 px for
// up to twelve, 16 px more for each beyond (the 26 rows on J1-J2 10x10's parameter axis).
const plotHeight = pts => 300 + 16 * Math.max(0, pts.length - 12);

// Labels the placement could not keep off the frontier line; the build prints them.
const labelClashes = [];

// Lines to marks, names and numbers, as layoutLabels placed them. A name for several rows
// carries them all, best first, as a merged mark does (size_accuracy.mjs), for the site's list.
const toRows = (rows, svg) => (rows.length > 1
  ? `<a class="pt" href="${rowHref(rows[0].inst, rows[0].r)}" data-rows="${rows.map(p => rowId(p.inst, p.r)).join(" ")}">${svg}</a>`
  : linked(rowHref(rows[0].inst, rows[0].r), svg));

// The marks, each linked to its row; marks drawn as one, within 6 px (as layoutLabels groups
// their names), all carry the whole pile, best first, so hovering whichever lies on top lists
// every row under it, as its name does.
function drawMarks(t, parts, pts, X, Y) {
  const piles = [];
  for (const p of pts) {
    const x = X(p.cost.value), y = Y(p.e);
    const near = piles.filter(g => g.some(q => Math.abs(X(q.cost.value) - x) <= 6 && Math.abs(Y(q.e) - y) <= 6));
    piles.splice(0, piles.length, ...piles.filter(g => !near.includes(g)), [p, ...near.flat()]);
  }
  const pileOf = new Map(piles.flatMap(g => g.map(p => [p, [...g].sort((a, b) => a.e - b.e)])));
  for (const p of [...pts].sort((a, b) => a.eligible - b.eligible))
    parts.push(toRows(pileOf.get(p), mark(t, X(p.cost.value), Y(p.e), t.series[BOUNDS[p.r.bound_type]], p.eligible, p.cost.unit, null)));
}
function drawLabels(t, parts, inst, L) {
  const extent = l => (l.anchor === "start" ? [l.x, l.x + l.w] : [l.x - l.w, l.x]);
  for (const l of L.leaders) parts.push(`<path d="M${n(l.x)} ${n(l.y0)}V${n(l.y1)}" stroke="${t.muted}" stroke-width="1"/>`);
  for (const l of L.lines) {
    const [l0, l1] = extent(l);
    if (L.crosses(l0, l1, l.y - 4)) labelClashes.push(`${instLabel(inst)}: "${l.s}"`);
    parts.push(toRows(l.rows, text(l.x, l.y, l.s, { size: 10.5, fill: t.ink2, anchor: l.anchor })));
  }
  // A 9 px digit is a small target: an invisible box a little larger than it takes the pointer.
  // The digit comes second, so the site's hover scale (a.pt > :nth-child(2)) grows it as it grows a mark.
  for (const k of L.keyed) parts.push(linked(rowHref(k.p.inst, k.p.r),
    `<rect x="${n(k.box.x0 - 2)}" y="${n(k.box.ty - 6)}" width="${n(k.box.x1 - k.box.x0 + 4)}" height="11" fill="${t.surface}" fill-opacity="0"/>` +
    text(k.x, k.y, k.num, { size: 9, fill: t.ink2, anchor: k.anchor, weight: 600 })));
}

// The boxed region again, enlarged, in its frame inside the plot: its own gridlines and tick
// labels, the frontier's steps between the marks inside the box, and every mark named as in
// the plot.
function drawInset(t, parts, inst, pts, front, r, box, nameOf, heading) {
  parts.push(`<rect x="${n(r.x0)}" y="${n(r.y0)}" width="${n(r.x1 - r.x0)}" height="${n(r.y1 - r.y0)}" fill="${t.surface}" stroke="${t.muted}" stroke-width="1" stroke-dasharray="3 3" rx="3"/>`);
  parts.push(text(r.x0 + 8, r.y0 + 15, heading, { size: 9.5, fill: t.muted }));
  const left = r.x0 + 52, right = r.x1 - 10, top = r.y0 + 30, bottom = r.y1 - 22;
  const X = logScale(box.c0, box.c1, left, right);
  const Y = e => bottom - ((e - box.e0) / (box.e1 - box.e0)) * (bottom - top);
  // Names may use the whole frame, clear of its heading and tick labels.
  const tickBoxes = [{ x0: r.x0, x1: r.x0 + 8 + textWidth(heading, 9.5), y0: r.y0, y1: r.y0 + 20 }];
  const step = niceStep((box.e1 - box.e0) / 3), decimals = Math.max(0, -Math.floor(Math.log10(step)));
  for (let i = Math.ceil(box.e0 / step); i * step <= box.e1; i++) {
    const s = (i * step).toFixed(decimals).replace("-", "−"), y = Y(i * step);
    parts.push(hline(left, right, y, t.grid));
    parts.push(text(left - 5, y + 3.5, s, { size: 9, fill: t.muted, anchor: "end", nums: true }));
    tickBoxes.push({ x0: left - 7 - textWidth(s, 9), x1: left - 3, y0: y - 5, y1: y + 5 });
  }
  // 1, 2 and 5 of each decade, or every digit where the box holds fewer than two of those.
  const ticks = ms => { const out = []; for (let k = Math.floor(log(box.c0)); k <= Math.ceil(log(box.c1)); k++) for (const m of ms) { const v = m * 10 ** k; if (v >= box.c0 && v <= box.c1) out.push([m, k, v]); } return out; };
  const xt = ticks([1, 2, 5]).length >= 2 ? ticks([1, 2, 5]) : ticks([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  for (const [m, k, v] of xt) {
    const s = m === 1 ? pow10(k) : `${m}×${pow10(k)}`, w = textWidth(s, 9);
    parts.push(text(X(v), bottom + 14, s, { size: 9, fill: t.muted, anchor: "middle", nums: true }));
    tickBoxes.push({ x0: X(v) - w / 2 - 2, x1: X(v) + w / 2 + 2, y0: bottom + 5, y1: bottom + 17 });
  }
  if (front.length > 1) {
    let d = `M${n(X(front[0].cost.value))} ${n(Y(front[0].e))}`;
    for (const p of front.slice(1)) d += `H${n(X(p.cost.value))}V${n(Y(p.e))}`;
    parts.push(`<path d="${d}" fill="none" stroke="${t.series[0]}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" opacity="0.7"/>`);
  }
  drawMarks(t, parts, pts, X, Y);
  drawLabels(t, parts, inst, layoutLabels({ pts, named: pts, X, Y, front, left: r.x0 + 6, right: r.x1 - 6, top: r.y0 + 14, bottom: r.y1 - 4, nameOf, nameAll: true, avoid: tickBoxes }));
}

// An energy axis: one scale, or two parts with a gap between them, the high energies above and
// the low ones below, each on its own scale and ticks. A part's outer edge is a tick, its inner
// edge 10 px past its nearest mark; the two parts never share an energy.
const GAP = 18, INNER = 10;
const yOf = (g, e) => g.bottom - ((e - g.e0) / (g.e1 - g.e0)) * (g.bottom - g.top);
const axisY = segs => e => yOf(segs.find(g => e >= g.lo) ?? segs.at(-1), e);
function oneScale(es, top, bottom) {
  const span = Math.max(Math.max(...es) - Math.min(...es), 1e-6);
  const step = niceStep(span / 4);
  const e0 = Math.floor((Math.min(...es) - span * 0.08) / step) * step;
  const e1 = Math.ceil((Math.max(...es) + span * 0.08) / step) * step;
  return { segs: [{ e0, e1, step, top, bottom, lo: -Infinity, ticked: true }], gap: null };
}
// A part: its marks lo..hi in the band y0..y1, at least minPerPx energy to the pixel (so a part
// is never enlarged past what its marks need, nor past the cap given), its outer edge on a tick,
// its inner edge 10 px past its nearest mark (marks the cap holds together are centred), and
// two ticks or more.
function part(lo, hi, y0, y1, outerTop, minPerPx) {
  const h = y1 - y0, perPx = Math.max(((hi - lo) * 1.08) / (h - INNER), minPerPx);
  const pad = Math.max(INNER, (h - (hi - lo) / perPx) / 2);
  let step = niceStep((h * perPx) / Math.max(1, Math.round(h / 60)));
  for (let k = 0; k < 12; k++, step = niceStep(step * 0.4)) {
    const g = outerTop
      ? (e1 => ({ e1, e0: (h * lo - pad * e1) / (h - pad) }))(Math.ceil((lo - pad * perPx + h * perPx) / step) * step)
      : (e0 => ({ e0, e1: (h * hi - pad * e0) / (h - pad) }))(Math.floor((hi + pad * perPx - h * perPx) / step) * step);
    if (Math.floor(g.e1 / step + 1e-9) - Math.ceil(g.e0 / step - 1e-9) >= 1) return { ...g, step, top: y0, bottom: y1 };
  }
  return null;
}
// How far apart the marks lie up the plot: each mark's distance to its nearest, up to 24 px.
const spreadOf = (es, Y) => { const ys = es.map(Y); return ys.reduce((a, y, i) => a + Math.min(24, ...ys.map((z, j) => (j === i ? 24 : Math.abs(y - z)))), 0); };
// The broken axes worth laying out: at each split with three marks or more below it, the upper
// part a quarter to 45% of the height and never enlarged more than the lower one (a lone mark
// up there would take any scale); the eight that spread the marks most.
function brokenCandidates(es, top, bottom) {
  const plotH = bottom - top, span = Math.max(...es) - Math.min(...es), out = [];
  const levels = [...new Set(es)].sort((a, b) => a - b);
  for (let k = 1; k < levels.length; k++) {
    const low = es.filter(e => e <= levels[k - 1]), high = es.filter(e => e >= levels[k]);
    if (low.length < 3) continue;
    for (const fT of [0.25, 0.32, 0.38, 0.45]) {
      const hT = Math.round(fT * (plotH - GAP)), hB = plotH - GAP - hT;
      const bt = part(Math.min(...low), Math.max(...low), top + hT + GAP, bottom, false, (0.02 * span) / hB);
      const tp = bt && part(Math.min(...high), Math.max(...high), top, top + hT, true, (bt.e1 - bt.e0) / hB);
      if (!tp || !(tp.e0 > bt.e1)) continue;
      const segs = [{ ...tp, lo: tp.e0 }, { ...bt, lo: -Infinity }];
      out.push({ segs, gap: { y0: top + hT, y1: top + hT + GAP }, spread: spreadOf(es, axisY(segs)) });
    }
  }
  return out.sort((a, b) => b.spread - a.spread).slice(0, 8);
}
// The break: two short slashes across each end of the gap between the parts.
function breakMarks(t, left, right, gap) {
  const yc = (gap.y0 + gap.y1) / 2;
  return [left, right].map(x => [-2.5, 2.5].map(dy =>
    `<path d="M${n(x - 6)} ${n(yc + dy + 3)}L${n(x + 6)} ${n(yc + dy - 3)}" stroke="${t.muted}" stroke-width="1.2" stroke-linecap="round"/>`).join("")).join("");
}

// A panel: axes, frontier, marks and names. With `zoom`, the marks that found no room, their
// region is boxed and its marks are named in an inset instead; returns false when the plot
// has no room for one, so the caller keeps the panel without it. With `axis`, the energy axis
// given (one scale otherwise); with `stats`, how its names came out.
function drawPanel(t, parts, inst, pts, { px, left, right, top, bottom, xLabel, title, nameAll = false, zoom = null, keyOut = null, axis = null, stats = null }) {
  // What the panel names in a line under the axis when it has no cost: the exact energy on a
  // solved instance, else the best of each class (RULES.md 6).
  const undrawn = (shownBest(inst)[0]?.[0] === "exact" ? shownBest(inst).slice(0, 1) : shownBest(inst)).filter(([, r]) => !pts.some(p => p.r === r));
  const front = frontierOf(pts);
  const nameOf = p => markName(p.r) + (p.cost.measuredByQmbl ? " (cost measured by QMBL)" : "");
  // Cost axis: a decade either side of the data. Energy axis: linear, as in the
  // record-over-time figure, so the best values and an exact energy sit where they are.
  const cs = pts.map(p => p.cost.value);
  const x0 = 10 ** Math.floor(log(Math.min(...cs)) - 0.5), x1 = 10 ** Math.ceil(log(Math.max(...cs)) + 0.5);
  const X = logScale(x0, x1, left, right);
  const es = pts.map(p => p.e);
  axis ??= oneScale(es, top, bottom);
  const Y = axisY(axis.segs);
  const { e0, e1 } = axis.segs.at(-1);   // the zoom below runs on one scale only
  const gapBox = axis.gap ? [{ x0: left - 1, x1: right + 1, y0: axis.gap.y0, y1: axis.gap.y1 }] : [];
  // The boxes: the marks to zoom on, in clusters of marks less than 80 px apart (a lone one
  // stays in the plot), each with a margin and grown until every mark it touches is one of its
  // own; boxes that meet merge. The rightmost gets an inset in the top right corner, the next
  // one in the top left. A box is at least clear of the marks it frames; the inset's own
  // heading says what it is.
  const zooms = [];
  if (zoom) {
    const pos = p => [X(p.cost.value), Y(p.e)];
    let clusters = [];
    for (const p of zoom) {
      const near = clusters.filter(c => c.some(q => Math.hypot(pos(q)[0] - pos(p)[0], pos(q)[1] - pos(p)[1]) < 80));
      clusters = [...clusters.filter(c => !near.includes(c)), [p, ...near.flat()]];
    }
    const boxOf = members => {
      for (let i = 0; ; i++) {
        const cs = members.map(p => log(p.cost.value)), es = members.map(p => p.e);
        const espan = Math.max(Math.max(...es) - Math.min(...es), 0.02 * (e1 - e0));
        const box = { c0: 10 ** (Math.min(...cs) - 0.06), c1: 10 ** (Math.max(...cs) + 0.06), e0: Math.min(...es) - 0.2 * espan, e1: Math.max(...es) + 0.2 * espan };
        const rect = { x0: X(box.c0) - 8, x1: X(box.c1) + 8, y0: Y(box.e1) - 8, y1: Y(box.e0) + 8 };
        const inBox = pts.filter(p => X(p.cost.value) > rect.x0 - 7 && X(p.cost.value) < rect.x1 + 7 && Y(p.e) > rect.y0 - 7 && Y(p.e) < rect.y1 + 7);
        if (i === 7 || inBox.every(p => members.includes(p))) return { box, rect, inBox };
        members = [...new Set([...members, ...inBox])];
      }
    };
    let boxes = clusters.filter(c => c.length >= 2).map(boxOf);
    for (let a = 0; a < boxes.length; a++)
      for (let b = a + 1; b < boxes.length; b++)
        if (meets(boxes[a].rect, boxes[b].rect)) { boxes = [...boxes.filter((_, i) => i !== a && i !== b), boxOf([...boxes[a].inBox, ...boxes[b].inBox])]; a = -1; break; }
    const midX = z => z.inBox.reduce((sum, p) => sum + pos(p)[0], 0) / z.inBox.length;
    for (const z of boxes.sort((a, b) => midX(b) - midX(a))) {
      // What the inset's marks need: their widest name beside a spread of marks, and a row each.
      const nameW = Math.max(...z.inBox.map(p => textWidth(nameOf(p), 10.5)));
      z.frame = insetFrame(pts.map(pos), stairs(front, X, Y), [...boxes.map(b => b.rect), ...zooms.map(q => q.frame)], { left, right, top, bottom },
        Math.min(560, 110 + nameW + 14 * z.inBox.length), Math.min(440, 80 + 26 * z.inBox.length));
      if (z.frame) zooms.push(z);
    }
    if (!zooms.length) return false;
  }
  if (title) parts.push(text(px, top - 14, title, { size: 12.5, fill: t.ink, weight: 600 }));
  parts.push(text(right, top - 14, perSiteLabel(inst), { size: 9.5, fill: t.muted, anchor: "end" }));
  // Ticks part by part; one scale's run from edge to edge, a broken part's at its step's multiples.
  for (const g of axis.segs) {
    const { step } = g, decimals = Math.max(0, -Math.floor(Math.log10(step)));
    const first = g.ticked ? 0 : Math.ceil(g.e0 / step - 1e-9), last = g.ticked ? Math.round((g.e1 - g.e0) / step) : Math.floor(g.e1 / step + 1e-9);
    for (let i = first; i <= last; i++) {
      const v = g.ticked ? g.e0 + i * step : i * step, y = yOf(g, v);
      parts.push(hline(left, right, y, t.grid));
      parts.push(text(left - 6, y + 4, v.toFixed(decimals).replace("-", "−"), { size: 10, fill: t.muted, anchor: "end", nums: true }));
    }
  }
  if (axis.gap) parts.push(breakMarks(t, left, right, axis.gap));
  for (let k2 = Math.ceil(log(x0)); k2 <= Math.floor(log(x1)); k2++)
    parts.push(text(X(10 ** k2), bottom + 16, pow10(k2), { size: 10, fill: t.muted, anchor: "middle", nums: true }));
  // The frontier, interrupted where it crosses the gap of a broken axis.
  if (front.length > 1) {
    let d = `M${n(X(front[0].cost.value))} ${n(Y(front[0].e))}`;
    front.slice(1).forEach((p, i) => {
      d += `H${n(X(p.cost.value))}`;
      if (axis.gap && Y(front[i].e) < axis.gap.y0 && Y(p.e) > axis.gap.y1) d += `V${n(axis.gap.y0)}M${n(X(p.cost.value))} ${n(axis.gap.y1)}`;
      d += `V${n(Y(p.e))}`;
    });
    parts.push(`<path d="${d}" fill="none" stroke="${t.series[0]}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" opacity="0.7"/>`);
  }
  drawMarks(t, parts, pts, X, Y);
  // Two boxes are lettered from the left, "a" over the box and "Box a, enlarged" on its inset.
  zooms.sort((a, b) => a.rect.x0 - b.rect.x0).forEach((z, i) => {
    const { rect: r, box, inBox, frame } = z, tag = zooms.length > 1 ? "ab"[i] : null;
    parts.push(`<rect x="${n(r.x0)}" y="${n(r.y0)}" width="${n(r.x1 - r.x0)}" height="${n(r.y1 - r.y0)}" fill="none" stroke="${t.muted}" stroke-width="1" stroke-dasharray="3 3" rx="3"/>`);
    if (tag) { parts.push(text(r.x0 + 1, r.y0 - 4, tag, { size: 10, fill: t.muted, weight: 600 })); z.tagRect = { x0: r.x0, x1: r.x0 + 9, y0: r.y0 - 14, y1: r.y0 }; }
    drawInset(t, parts, inst, inBox, front.filter(p => inBox.includes(p)), frame, box, nameOf, tag ? `Box ${tag}, enlarged` : "The boxed region, enlarged");
  });
  // An instance's own figure names every mark, as a dot without a name cannot be read; the
  // small overview panels name the frontier only, where naming them all piles the labels up.
  const hide = new Set(zooms.flatMap(z => z.inBox));
  const named = [...new Set([...front, ...(nameAll ? pts : [])])].filter(p => !hide.has(p));
  const L = layoutLabels({ pts, named, X, Y, front, left, right, top, bottom, nameOf, nameAll, avoid: [...zooms.flatMap(z => [z.rect, z.frame, ...(z.tagRect ? [z.tagRect] : [])]), ...gapBox] });
  keyOut?.push(...L.keyed.map(k => k.p));
  if (stats) Object.assign(stats, { keyed: L.keyed.length, leaders: L.leaders.length, length: L.leaders.reduce((a, l) => a + l.y1 - l.y0, 0) });
  // An overview label with no free spot is nudged down only past labels it actually overlaps,
  // horizontally as well as vertically.
  const labels = L.lines.sort((a, b) => a.y - b.y);
  const extent = l => (l.anchor === "start" ? [l.x, l.x + l.w] : [l.x - l.w, l.x]);
  for (let a = 1; a < labels.length; a++) {
    if (!labels[a].forced) continue;
    const [a0, a1] = extent(labels[a]);
    for (let b = 0; b < a; b++) {
      const [b0, b1] = extent(labels[b]);
      if (a0 < b1 && b0 < a1 && Math.abs(labels[a].y - labels[b].y) < 12) {
        labels[a].y = labels[b].y + 12;
        // pushed onto the frontier line: step on past it
        for (let k = 0; k < 3 && L.crosses(a0, a1, labels[a].y - 4); k++) labels[a].y += 12;
      }
    }
  }
  drawLabels(t, parts, inst, L);
  parts.push(text((left + right) / 2, bottom + 32, xLabel, { size: 10.5, fill: t.ink2, anchor: "middle" }));
  // One value is named as before; several are named in full where the line fits the panel,
  // else by class, else counted, so a narrow panel of the overview keeps one short line.
  if (undrawn.length) {
    const tagOf = ([tag, r]) => tag === "exact" ? boundLabel(r) : tag;
    const full = `${undrawn.map(x => `${tagOf(x)}: ${(x[1].energy / perSiteDivisor(inst)).toFixed(6).replace("-", "−")} (${markName(x[1])})`).join("; ")}, no cost stated, not drawn`;
    const short = `no cost stated, not drawn: ${undrawn.map(tagOf).join(", ")}`;
    const line = undrawn.length === 1 || textWidth(full, 9.5) <= right - left ? full
      : textWidth(short, 9.5) <= right - left ? short : `${undrawn.length} best values state no cost and are not drawn`;
    parts.push(text(left, bottom + 48, line, { size: 9.5, fill: t.muted }));
  }
  return true;
}

function costFigure({ name, title, subtitle, costOf, minRows, xLabel, legendItems, footer, describe }) {
  const panels = instances.map(inst => ({ inst, pts: costed(inst, costOf) })).filter(p => p.pts.length >= minRows)
    .sort((a, b) => b.pts.length - a.pts.length || a.inst.instance_id.localeCompare(b.inst.instance_id));
  write(name, t => {
    const cols = 3, plotH = 170, pitch = plotH + 92, panelW = (W - 2 * PAD - 2 * 30) / cols;
    const h = header(t, title, subtitle(panels));
    const lg = legend(t, legendItems(t), h.bottom + 34);
    const top0 = lg.bottom + 46;
    const parts = [h.svg, lg.svg];
    panels.forEach(({ inst, pts }, k) => {
      const col = k % cols, row = Math.floor(k / cols);
      const px = PAD + col * (panelW + 30), left = px + 54, right = px + panelW - 4;
      const top = top0 + row * pitch, bottom = top + plotH;
      drawPanel(t, parts, inst, pts, { px, left, right, top, bottom, xLabel, title: instLabel(inst) });
    });
    const y = top0 + (Math.ceil(panels.length / cols) - 1) * pitch + plotH + 70;
    const fn = footnote(t, footer(panels), y);
    parts.push(fn.svg);
    return doc(t, fn.bottom + 24, title, describe(panels), parts);
  });
  return panels;
}

const HOURS_LEGEND = t => [
  { kind: "dot", color: t.series[0], label: "Variational bound" },
  { kind: "dot", color: t.series[1], label: "Projected" },
  { kind: "dot", color: t.series[2], label: "Extrapolated" },
  { kind: "dot", color: t.series[3], label: "Exact" },
  { kind: "line", color: t.series[0], label: "Frontier" },
];
// The marks, the derived hours and QMBL's own runs. The no-conversion rule and the bound
// types are stated in the page text and the legend.
function HOURS_FOOTER(all, overview = false) {
  const cpu = all.filter(p => p.cost.unit === "cpu").length, der = all.filter(p => p.cost.derived).length;
  const own = all.filter(p => p.r.computed_by === "qmbl").length;
  const ed = all.filter(p => p.cost.measuredByQmbl);
  const rows = k => `${k} row${k === 1 ? "" : "s"}`;
  return (cpu ? `Circles are GPU-hours, squares CPU core-hours (${rows(cpu)}).` : "Every mark is GPU-hours.") +
    (der ? ` For ${rows(der)} the hours are devices × wall-clock, multiplied here.` : "") +
    (own ? ` Labels marked QMBL are QMBL's own reference runs${overview ? "; each instance's own figure names all of them" : ""}.` : "") +
    (ed.length ? ` An exact energy marked "cost measured by QMBL" is placed at what diagonalizing the instance cost QMBL. QMBL ran it on ${[...new Set(ed.map(p => `${p.inst.qmbl_ed_cost.cores} core${p.inst.qmbl_ed_cost.cores === 1 ? "" : "s"} of an ${p.inst.qmbl_ed_cost.cpu}`))].join(" or ")}, conserving only particle number or Sz.` : "");
}
const describeHours = panels => panels.map(({ inst, pts }) => `${instLabel(inst)}: ${pts.map(p => `${shortLabel(p.r)} ${Math.round(p.cost.value)} ${p.cost.unit === "cpu" ? "CPU-h" : "GPU-h"}${p.cost.derived ? " (derived)" : ""} ${p.e.toFixed(6)}`).join(", ")}`).join("; ");

const hoursPanels = costFigure({
  name: "energy-vs-compute",
  title: "The best energies at each cost, instance by instance",
  subtitle: panels => `Every energy whose paper, or QMBL's own run, states what it cost in hours, on the ${panels.length} instances with at least two such rows. ` +
    "Colour shows the bound type.",
  costOf: hoursOrEdOf, minRows: MIN_COSTED,
  xLabel: "hours, as reported",
  legendItems: HOURS_LEGEND,
  footer: panels => HOURS_FOOTER(panels.flatMap(p => p.pts), true),
  describe: describeHours,
});

// One figure per instance with at least MIN_COSTED energies costed in hours. The directory
// is emptied first, so an instance that loses a cost also loses its figure, which the site
// would otherwise still inline.
const COST_DIR = "figures/cost";
fs.rmSync(COST_DIR, { recursive: true, force: true });
fs.mkdirSync(COST_DIR, { recursive: true });
const own = writer("figures");
for (const { inst, pts } of hoursPanels) {
  const name = costFigureName(inst);
  const title = `${instLabel(inst)}: the best energies at each cost`;
  own.write(name, t => {
    const h = header(t, title, "Every energy on this instance whose paper, or QMBL's own run, states what it cost in hours.");
    const lg = legend(t, HOURS_LEGEND(t), h.bottom + 34);
    const top = lg.bottom + 36, bottom = top + plotHeight(pts), left = PAD + 66, right = W - PAD - 8;
    const parts = [h.svg, lg.svg];
    const fn = footnote(t, HOURS_FOOTER(pts), drawInstance(t, parts, inst, pts, { px: PAD, left, right, top, bottom, xLabel: "hours, as reported", title: null, name }));
    parts.push(fn.svg);
    return doc(t, fn.bottom + 24, title, describeHours([{ inst, pts }]), parts);
  });
}

// Estimated FLOPs: the same frontier construction on the model's estimate (flops.mjs). The
// footnote counts the estimates that needed an architectural assumption.
const FLOPS_LEGEND = t => [
  { kind: "dot", color: t.series[0], label: "Variational bound" },
  { kind: "dot", color: t.series[1], label: "Projected" },
  { kind: "dot", color: t.series[2], label: "Extrapolated" },
  { kind: "line", color: t.series[0], label: "Frontier" },
];
// One sentence per model drawn (flops.mjs): what it counts and what it leaves out.
const FLOPS_MODEL = {
  "nqs-v2": "Network estimates count iterations × samples × (connected configurations + sampler proposals + 3) × forward-pass FLOPs × evaluations per amplitude, " +
    "stage by stage, from the counts the paper or run script states. They include the optimizer's solve where the code is known, and leave out pre-training.",
  "mvmc-v2": "mVMC estimates count Pfaffian updates, ratios and recomputations over every projection term, plus the SR solve, from the run's def files. " +
    "They take the acceptance at its bound of 1, about twice the measured sampling.",
  "vqe-v1": "VQE estimates count the state-vector gate, metric-tensor and energy-derivative work of the run script's natural-gradient schedule.",
  "dmrg-v1": "DMRG estimates count the dense tensor contractions of every sweep in the run script's schedule, plus its variance evaluations. " +
    "They leave out the saving from conserved quantum numbers, so a symmetric code does less arithmetic than this.",
};
function FLOPS_FOOTER(all) {
  const models = [...new Set(all.map(p => p.cost.estimate.model))].sort((a, b) => b.localeCompare(a));
  const low = all.filter(p => p.cost.derived).length;
  const own = all.filter(p => p.r.computed_by === "qmbl").length;
  return "Every mark is an estimate, good to an order of magnitude. " + models.map(m => FLOPS_MODEL[m]).join(" ") +
    (low ? ` ${low} of these estimates needed an assumption (an architecture detail, or a Lanczos count taken from the calibration run).` : "") +
    (own ? ` Labels marked QMBL are QMBL's own reference runs (${own} row${own === 1 ? "" : "s"}).` : "");
}
const describeFlops = panels => panels.map(({ inst, pts }) => `${instLabel(inst)}: ${pts.map(p => `${shortLabel(p.r)} ${p.cost.value.toExponential(1)} FLOPs (estimated${p.cost.derived ? ", low confidence" : ""}) ${p.e.toFixed(6)}`).join(", ")}`).join("; ");

const flopsPanels = costFigure({
  name: "energy-vs-flops",
  title: "The best energies at each estimated cost in FLOPs, instance by instance",
  subtitle: panels => `Every published energy whose paper or run script states enough to estimate its cost in floating-point operations, on the ${panels.length} instances with at least two such rows. ` +
    "Colour shows the bound type.",
  costOf: estimatedFlopsOf, minRows: MIN_COSTED,
  xLabel: "FLOPs, estimated",
  legendItems: FLOPS_LEGEND,
  footer: panels => FLOPS_FOOTER(panels.flatMap(p => p.pts)),
  describe: describeFlops,
});

const FLOPS_DIR = "figures/flops";
fs.rmSync(FLOPS_DIR, { recursive: true, force: true });
fs.mkdirSync(FLOPS_DIR, { recursive: true });
for (const { inst, pts } of flopsPanels) {
  const name = flopsFigureName(inst);
  const title = `${instLabel(inst)}: the best energies at each estimated cost in FLOPs`;
  own.write(name, t => {
    const h = header(t, title, "Every energy on this instance whose paper or run script states enough to estimate its cost in floating-point operations.");
    const lg = legend(t, FLOPS_LEGEND(t), h.bottom + 34);
    const top = lg.bottom + 36, bottom = top + plotHeight(pts), left = PAD + 66, right = W - PAD - 8;
    const parts = [h.svg, lg.svg];
    const fn = footnote(t, FLOPS_FOOTER(pts), drawInstance(t, parts, inst, pts, { px: PAD, left, right, top, bottom, xLabel: "FLOPs, estimated", title: null, name }));
    parts.push(fn.svg);
    return doc(t, fn.bottom + 24, title, describeFlops([{ inst, pts }]), parts);
  });
}

// Parameter count: the same construction on the ansatz size the paper prints, for the
// instances with at least three such rows, overview and one figure per instance.
const PARAMS_LEGEND = t => [
  { kind: "dot", color: t.series[0], label: "Variational bound" },
  { kind: "dot", color: t.series[1], label: "Projected" },
  { kind: "dot", color: t.series[2], label: "Extrapolated" },
  { kind: "line", color: t.series[0], label: "Frontier" },
];
const PARAMS_FOOTER = "Parameter counts as the papers print them; a count evaluated from a printed formula is marked medium confidence in the row. " +
  "Tensor-network bond dimensions and Monte Carlo sample counts are other costs and are not on this axis.";
const describeParams = panels => panels.map(({ inst, pts }) => `${instLabel(inst)}: ${pts.map(p => `${shortLabel(p.r)} ${p.cost.value} parameters ${p.e.toFixed(6)}`).join(", ")}`).join("; ");

const paramPanels = costFigure({
  name: "energy-vs-parameters",
  title: "The best energies at each parameter count, instance by instance",
  subtitle: panels => `Every published energy whose paper states the ansatz's parameter count, on the ${panels.length} instances with at least three such rows. ` +
    "Colour shows the bound type.",
  costOf: parametersOf, minRows: 3,
  xLabel: "variational parameters",
  legendItems: PARAMS_LEGEND,
  footer: () => PARAMS_FOOTER,
  describe: describeParams,
});

const PARAMS_DIR = "figures/params";
fs.rmSync(PARAMS_DIR, { recursive: true, force: true });
fs.mkdirSync(PARAMS_DIR, { recursive: true });
for (const { inst, pts } of paramPanels) {
  const name = paramsFigureName(inst);
  const title = `${instLabel(inst)}: the best energies at each parameter count`;
  own.write(name, t => {
    const h = header(t, title, "Every energy on this instance whose paper states the ansatz's parameter count.");
    const lg = legend(t, PARAMS_LEGEND(t), h.bottom + 34);
    const top = lg.bottom + 36, bottom = top + plotHeight(pts), left = PAD + 66, right = W - PAD - 8;
    const parts = [h.svg, lg.svg];
    const fn = footnote(t, PARAMS_FOOTER, drawInstance(t, parts, inst, pts, { px: PAD, left, right, top, bottom, xLabel: "variational parameters", title: null, name }));
    parts.push(fn.svg);
    return doc(t, fn.bottom + 24, title, describeParams([{ inst, pts }]), parts);
  });
}

console.log(`${OUT}/: ${written.length + own.written.length} files (${hoursPanels.length} per-instance cost figures, ${flopsPanels.length} per-instance FLOPs figures, ${paramPanels.length} per-instance parameter figures; energy vs compute: ${hoursPanels.length} instances, ${hoursPanels.reduce((a, p) => a + p.pts.length, 0)} rows; ` +
  `energy vs estimated FLOPs: ${flopsPanels.length} instances, ${flopsPanels.reduce((a, p) => a + p.pts.length, 0)} rows; ` +
  `energy vs parameters: ${paramPanels.length} instances, ${paramPanels.reduce((a, p) => a + p.pts.length, 0)} rows)`);
if (labelClashes.length) console.log(`LABEL CLASHES with the frontier line (${labelClashes.length}): ${labelClashes.join("; ")}`);
const unbroken = [...BROKEN].filter(f => !brokenAxes.get(f));
console.log(`broken energy axis on ${BROKEN.size - unbroken.length} figures` + (unbroken.length ? `; NOT BROKEN (no such figure, or no break fits): ${unbroken.join(", ")}` : ""));
