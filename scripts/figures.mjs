// Generate the summary figures in figures/: rows per instance and error metrics by source. The
// drawing kit is chart.mjs. The record figures (record over time, record status by model,
// records by family, records by year) were removed with the aggregates of RULES.md 7 on
// 2026-10-23: an instance has no single record since then (RULES.md 6).
import { collect } from "./summary.mjs";
import { variationalRows } from "./views.mjs";
import { W, PAD, text, hline, hbar, vbar, onFill, legend, header, footnote, doc, textWidth, pct, writer } from "./chart.mjs";

const OUT = "figures";
const instances = collect();
const { write, written } = writer(OUT);

// ------------------------------------------------------ 1. published rows per instance
write("rows-per-instance", t => {
  const counts = instances.map(i => variationalRows(i).length);
  const maxK = Math.max(...counts);
  const hist = Array.from({ length: maxK + 1 }, (_, k) => counts.filter(c => c === k).length);
  const five = counts.filter(c => c >= 5).length;
  const h = header(t, "How many published variational energies each instance has",
    `${hist[0]} of ${instances.length} instances have none, ${hist[1]} have exactly one, and ${five} have five or more.`);
  const top = h.bottom + 44, plotH = 190, base = top + plotH;
  const left = PAD + 8, right = W - PAD - 8, band = (right - left) / (maxK + 1), bw = Math.min(24, band * 0.6);
  const ymax = Math.max(...hist); // every bar is labelled, so no axis to round for
  const parts = [h.svg, hline(left, right, base, t.grid)];
  hist.forEach((c, k) => {
    const cx = left + band * (k + 0.5), yTop = base - (c / ymax) * plotH;
    parts.push(vbar(cx - bw / 2, bw, base, yTop, t.series[0]));
    if (c) parts.push(text(cx, yTop - 7, String(c), { size: 12, fill: t.ink2, anchor: "middle", nums: true }));
    parts.push(text(cx, base + 18, String(k), { size: 11, fill: t.muted, anchor: "middle", nums: true }));
  });
  parts.push(text((left + right) / 2, base + 40, "variational rows on the instance", { size: 12, fill: t.ink2, anchor: "middle" }));
  const fn = footnote(t, "Each bar counts instances by their number of variational rows. Exact, projected and extrapolated rows are not counted.", base + 70);
  parts.push(fn.svg);
  return doc(t, fn.bottom + 24, "How many published variational energies each instance has",
    `Histogram of variational rows per instance: ${hist.map((c, k) => `${k}: ${c}`).join(", ")}.`, parts);
});

// ------------------------------------------------------------- 2. error metrics by source
write("error-metrics", t => {
  const METRICS = [
    ["both", "Error bar and variance", t.series[0]],
    ["sigma", "Error bar only", t.series[1]],
    ["variance", "Variance only", t.series[2]],
    ["none", "Neither found (○ in the leaderboard)", t.muted],
  ];
  const kind = r => r.sigma != null && r.energy_variance != null ? "both"
    : r.sigma != null ? "sigma" : r.energy_variance != null ? "variance" : "none";
  // An exact energy has no error to report, so exact rows would only dilute the bars.
  const rows = instances.flatMap(i => i.rows).filter(r => r.bound_type !== "exact");
  const groups = [
    ["Imported from VarBench", rows.filter(r => r.source.startsWith("varbench@"))],
    ["Added since from the literature", rows.filter(r => !r.source.startsWith("varbench@") && r.computed_by !== "qmbl")],
  ].map(([label, rs]) => ({ label, total: rs.length, by: Object.fromEntries(METRICS.map(([k]) => [k, rs.filter(r => kind(r) === k).length])) }));
  const [vb, lit] = groups;
  const h = header(t, "Which error metrics the rows carry, by where they came from",
    `${pct(vb.by.both + vb.by.variance, vb.total)} of the rows imported from VarBench carry an energy variance; ` +
    `${pct(lit.by.both + lit.by.variance, lit.total)} of the rows added since from papers do. Exact rows are left out: they have no error to report.`);
  const lg = legend(t, METRICS.map(([, label, color]) => ({ kind: "square", color, label })), h.bottom + 34);
  const top = lg.bottom + 26, pitch = 58, bh = 24, left = PAD + 240, right = W - PAD;
  const parts = [h.svg, lg.svg];
  groups.forEach((g, r) => {
    const y = top + r * pitch;
    parts.push(text(PAD, y + 11, g.label, { size: 13, fill: t.ink }));
    parts.push(text(PAD, y + 28, `${g.total} rows`, { size: 12, fill: t.muted, nums: true }));
    let x = left;
    const segs = METRICS.filter(([k]) => g.by[k]);
    segs.forEach(([k, , color], s) => {
      const w = (g.by[k] / g.total) * (right - left), last = s === segs.length - 1;
      parts.push(hbar(x, x + w - (last ? 0 : 2), y, bh, color, last));
      const label = pct(g.by[k], g.total);
      if (textWidth(label, 11.5) + 12 < w - 2) parts.push(text(x + (w - (last ? 0 : 2)) / 2, y + 16, label, { size: 11.5, fill: onFill(color), anchor: "middle", nums: true }));
      x += w;
    });
  });
  const fn = footnote(t, "Bars are shares of each source's rows. No energy needs an error bar to be the best of its class, " +
    "but a sampled one should state it. QMBL's own runs are not counted.", top + groups.length * pitch + 4);
  parts.push(fn.svg);
  return doc(t, fn.bottom + 24, "Which error metrics the rows carry, by where they came from",
    groups.map(g => `${g.label} (${g.total} rows): ${METRICS.map(([k, label]) => `${label} ${g.by[k]}`).join(", ")}`).join("; "), parts);
});

console.log(`${OUT}/: ${written.length} files`);
