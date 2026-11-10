// The front page's picker (hero.mjs builds the markup; site.mjs inlines this script). The ring
// drifts slowly and eases to a stop under the pointer; a Hamiltonian opens at #h-<model>
// (Hubbard and Heisenberg first ask their lattice on a second ring), with its chart drawn
// from /picker/<model>.json: lattice tabs, one chip row per badge that varies, every row a
// dot coloured by bound type, hollow where it cannot be the best of its class, slashed where
// flagged. Hovering a dot shows the row's card; clicking it opens the row in the table.
(() => {
  const M = JSON.parse(document.getElementById("pk-data").textContent);
  const bySlug = Object.fromEntries(M.models.map(m => [m.slug, m]));
  const $ = id => document.getElementById(id);
  const stage = $("pk-stage"), hero = $("pick"), view = $("pk-view"), more = $("pk-more-wrap"), say = $("pk-say");
  const RING = stage.innerHTML, SAY = say.innerHTML;
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const tabSlug = s => s.replace(/[^\w]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
  const nE = n => `${n.toLocaleString("en")} energ${n === 1 ? "y" : "ies"}`;
  let mode = "ring";

  // ---------------------------------------------------------------------------- ring motion
  let phase = 0, speed = 1, last = 0, paused = false, geo = null;
  const still = matchMedia("(prefers-reduced-motion: reduce)"), narrow = matchMedia("(max-width: 720px)");
  const measure = () => { geo = { W: stage.clientWidth, H: stage.clientHeight }; };
  function place() {
    if (narrow.matches || hero.hidden) return;
    if (!geo || !geo.W) measure();
    const nodes = stage.querySelectorAll(".pk-node"), rx = geo.W * 0.39, ry = geo.H * 0.38;
    nodes.forEach((n, k) => {
      const a = -Math.PI / 2 + phase + 2 * Math.PI * k / nodes.length;
      n.style.transform = `translate3d(${(geo.W / 2 + rx * Math.cos(a) - n.offsetWidth / 2).toFixed(2)}px, ${(geo.H / 2 + ry * Math.sin(a) - n.offsetHeight / 2).toFixed(2)}px, 0)`;
    });
  }
  function tick(t) {
    const dt = last ? Math.min(t - last, 50) : 16; last = t;
    speed += ((paused || still.matches ? 0 : 1) - speed) * (1 - Math.exp(-dt / 450));
    if (speed > 0.001 && !narrow.matches && !hero.hidden) { phase += speed * dt * 2 * Math.PI / 200000; place(); }
    requestAnimationFrame(tick);
  }
  stage.addEventListener("pointerenter", () => { paused = true; });
  stage.addEventListener("pointerleave", () => { paused = false; hover(null); });
  stage.addEventListener("focusin", () => { paused = true; });
  stage.addEventListener("focusout", () => { paused = false; });
  stage.addEventListener("pointerover", e => hover(e.target.closest(".pk-node")));
  stage.addEventListener("focusin", e => hover(e.target.closest(".pk-node")));
  addEventListener("resize", () => { measure(); place(); });
  narrow.addEventListener("change", () => { stage.querySelectorAll(".pk-node").forEach(n => { n.style.transform = ""; }); measure(); place(); });

  function hover(node) {
    stage.classList.toggle("hovering", !!node);
    stage.querySelectorAll(".pk-node").forEach(n => n.classList.toggle("on", n === node));
    if (mode !== "ring") return;
    const m = node && bySlug[node.dataset.slug];
    const s = $("pk-say");
    if (s) s.innerHTML = m ? `<b>${esc(m.name)}</b> · <span class="pk-k">${nE(m.energies)}</span><br>${esc(m.about)}<span class="pk-f">${m.formula}</span>` : SAY;
  }

  // ---------------------------------------------------------------------------------- views
  function showRing() {
    mode = "ring"; hero.hidden = false; more.hidden = false; view.hidden = true;
    stage.innerHTML = RING; measure(); place();
  }
  function showSub(m) {
    mode = "sub"; hero.hidden = false; more.hidden = false; view.hidden = true;
    stage.innerHTML = `<div class="pk-center">${m.glyphBig}<h1>${esc(m.name)}: which lattice?</h1>
      <p class="pk-say" style="min-height:0">${esc(m.about)}<span class="pk-f">${m.formula}</span></p>
      <div class="pk-row"><a class="pk-pill" href="#h-${m.slug}@all">All ${esc(m.name)} results</a><a class="pk-link" href="#pick">← All Hamiltonians</a></div></div>` +
      m.tabs.map(t => `<a class="pk-node" href="#h-${m.slug}@${tabSlug(t.label)}">${t.glyph}<span class="pk-nm pk-serif">${esc(t.label)}</span><span class="pk-ct">${nE(t.count)}</span></a>`).join("");
    measure(); place();
  }

  const cache = new Map();
  const load = slug => cache.get(slug) || cache.set(slug, fetch(`/picker/${slug}.json`).then(r => r.json())).get(slug);
  let state = null;
  async function showChart(m, tab) {
    mode = "chart"; hero.hidden = true; more.hidden = true; view.hidden = false;
    if (!state || state.m !== m) view.innerHTML = `<p class="pk-cap">Loading ${esc(m.name)}…</p>`;
    scrollTo({ top: 0 });
    const data = await load(m.slug);
    const tabs = data.tabs.map(t => t.label);
    const k = tabs.findIndex(t => tabSlug(t) === tab);
    state = { m, data, tab: k >= 0 ? k : 0, sel: {} };
    render();
    scrollTo({ top: 0 });
  }

  // The chip rows narrow each other in order: each offers what the rows above leave, and keeps
  // its choice where it can, else takes the value with most energies.
  function resolve() {
    const { data, sel } = state;
    let pool = data.inst.filter(i => i.t === state.tab);
    const rows = [];
    for (const dim of data.dims) {
      const val = i => i.d[dim] || ["—", ""];
      const counts = new Map(), order = new Map();
      for (const i of pool) { const [l, o] = val(i); counts.set(l, (counts.get(l) || 0) + i.r.length); order.set(l, o); }
      if (!counts.size) continue;
      if (!counts.has(sel[dim])) sel[dim] = [...counts].sort((a, b) => b[1] - a[1])[0][0];
      const vals = [...counts.keys()].sort((a, b) => { const x = order.get(a), y = order.get(b); return typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "en", { numeric: true }); });
      // Couplings print to four digits (7.74263683 -> 7.743), in full where two would then read alike.
      const short = new Map(vals.map(v => { const o = order.get(v); return [v, typeof o === "number" ? String(Number(o.toPrecision(4))) : v]; }));
      const seen = [...short.values()];
      for (const [v, s] of short) if (seen.filter(x => x === s).length > 1) short.set(v, v);
      rows.push([dim, vals, counts, short]);
      pool = pool.filter(i => val(i)[0] === sel[dim]);
    }
    return { pool, rows };
  }

  function render() {
    const { m, data, sel } = state, { pool, rows } = resolve();
    const choosing = rows.filter(([, v]) => v.length > 1), fixed = rows.filter(([, v]) => v.length === 1 && v[0] !== "—");
    const sub = M.sub.includes(m.model);
    view.innerHTML = `
<div class="pk-crumb"><a href="#pick">← Pick another problem</a>${sub ? `<span>·</span><a href="#h-${m.slug}">Other ${esc(m.name)} lattices</a>` : ""}</div>
<div class="pk-title">${m.glyph}<div><h2>${esc(m.name)}</h2>${m.formulaBlock}</div></div>
<p class="pk-desc">${esc(m.about)} Each dot is one published result for the setting chosen below. Lower is better for variational results.</p>
${data.tabs.length > 1 ? `<div class="pk-tabs" role="tablist">${data.tabs.map((t, k) => `<button class="pk-tab" role="tab" type="button" data-k="${k}" aria-selected="${k === state.tab}">${t.glyph}<span>${esc(t.label)}</span><i>${t.count}</i></button>`).join("")}</div>` : ""}
${choosing.length || fixed.length ? `<div class="pk-filters">${choosing.map(([dim, vals, c, short]) => `<div class="pk-fg"><span class="pk-lab">${esc(dim)}</span>${vals.map(v => `<button class="pk-chip" type="button" data-dim="${esc(dim)}" data-v="${esc(v)}" aria-pressed="${v === sel[dim]}"${short.get(v) !== v ? ` title="${esc(v)}"` : ""}>${esc(short.get(v))}<i>${c.get(v)}</i></button>`).join("")}</div>`).join("")}${fixed.length ? `<div class="pk-fg"><span class="pk-lab">setting</span><span class="pk-fixed">${fixed.map(([dim, v, , short]) => esc(dim === "boundary" || dim === "shape" || dim === "problem" || dim === "variant" ? v[0] : `${dim} = ${short.get(v[0])}`)).join(", ")}</span></div>` : ""}</div>` : ""}
<div class="pk-chart" id="pk-chart"></div>
<div class="pk-lgd" id="pk-lgd"></div>
<p class="pk-cap">${pool.length} instance${pool.length === 1 ? "" : "s"}, ${nE(pool.reduce((a, i) => a + i.r.length, 0))}. Horizontal: number of sites N, log scale. Vertical: ${esc(data.unit)}. Point at a dot to preview it; click it to open its table entry. <a href="/instances/#${m.slug}">All ${esc(m.name)} rows in the table</a>.</p>`;
    view.querySelectorAll(".pk-tab").forEach(b => b.addEventListener("click", () => {
      state.tab = +b.dataset.k; state.sel = {};
      history.replaceState(null, "", `#h-${m.slug}@${tabSlug(data.tabs[state.tab].label)}`);
      render();
    }));
    view.querySelectorAll(".pk-chip").forEach(b => b.addEventListener("click", () => { sel[b.dataset.dim] = b.dataset.v; render(); }));
    draw(pool);
  }

  // ---------------------------------------------------------------------------------- chart
  const KIND = ["var(--pk-v)", "var(--pk-p)", "var(--pk-e)", "var(--pk-x)"];
  const LEGEND = ["Variational bound", "Projected", "Extrapolated", "Exact and exact (stochastic)"];
  function niceTicks(lo, hi, n = 5) {
    const step0 = (hi - lo) / n, mag = 10 ** Math.floor(Math.log10(step0)), r = step0 / mag;
    const step = (r < 1.5 ? 1 : r < 3 ? 2 : r < 7 ? 5 : 10) * mag, out = [];
    for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-12; v += step) out.push(+v.toFixed(10));
    return out;
  }
  function draw(pool) {
    const W = 920, H = 420, mg = { l: 72, r: 20, t: 16, b: 46 };
    const pts = pool.flatMap(i => i.r.map(r => ({ N: i.N, e: r[0], kind: r[2], filled: r[3], flagged: r[4], id: r[5] })));
    const chart = $("pk-chart");
    if (!pts.length) { chart.innerHTML = `<p class="pk-cap">No results for this setting.</p>`; return; }
    let x0 = Math.min(...pts.map(p => p.N)), x1 = Math.max(...pts.map(p => p.N));
    if (x0 === x1) { x0 /= 1.6; x1 *= 1.6; } else { x0 /= 1.2; x1 *= 1.2; }
    let y0 = Math.min(...pts.map(p => p.e)), y1 = Math.max(...pts.map(p => p.e));
    const py = (y1 - y0 || Math.abs(y0) * 0.02 || 0.01) * 0.08; y0 -= py; y1 += py;
    const X = v => mg.l + (Math.log(v) - Math.log(x0)) / (Math.log(x1) - Math.log(x0)) * (W - mg.l - mg.r);
    const Y = v => H - mg.b - (v - y0) / (y1 - y0) * (H - mg.t - mg.b);
    const xt = [];
    for (let k = Math.floor(Math.log10(x0)); k <= Math.ceil(Math.log10(x1)); k++) for (const s of [1, 2, 5]) { const v = s * 10 ** k; if (v >= x0 && v <= x1) xt.push(v); }
    const sizes = [...new Set(pts.map(p => p.N))].sort((a, b) => a - b);
    const xticks = xt.length >= 2 ? xt : sizes;
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Energy against the number of sites">`;
    for (const v of niceTicks(y0, y1)) s += `<line class="pk-ax" x1="${mg.l}" x2="${W - mg.r}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}"/><text class="pk-tk" x="${mg.l - 8}" y="${(Y(v) + 4).toFixed(1)}" text-anchor="end">${+v.toPrecision(6)}</text>`;
    for (const v of xticks) s += `<text class="pk-tk" x="${X(v).toFixed(1)}" y="${H - mg.b + 18}" text-anchor="middle">${v}</text>`;
    s += `<text class="pk-axl" x="${(W + mg.l) / 2}" y="${H - 8}" text-anchor="middle">sites N</text>`;
    // flagged outlines last, over what they coincide with; exact dots over the bounds
    pts.sort((a, b) => a.flagged - b.flagged || a.filled - b.filled || (a.kind === 3) - (b.kind === 3));
    pts.forEach((p, k) => {
      const x = X(p.N), y = Y(p.e), c = KIND[p.kind], f = n => n.toFixed(1);
      const d = `M${f(x - 5.5)} ${f(y + 5.5)}L${f(x + 5.5)} ${f(y - 5.5)}`;
      const mark = `<circle cx="${f(x)}" cy="${f(y)}" r="6.5" fill="var(--surface)"/>` + (p.flagged
        ? `<circle cx="${f(x)}" cy="${f(y)}" r="4" fill="none" stroke="${c}" stroke-width="2"/><path d="${d}" stroke="var(--surface)" stroke-width="3.5" stroke-linecap="round"/><path d="${d}" stroke="${c}" stroke-width="2" stroke-linecap="round"/>`
        : p.filled ? `<circle cx="${f(x)}" cy="${f(y)}" r="4.5" fill="${c}"/>` : `<circle cx="${f(x)}" cy="${f(y)}" r="4" fill="var(--surface)" stroke="${c}" stroke-width="2"/>`);
      s += `<a class="pk-pt" href="/instances/#${p.id}" data-k="${k}">${mark}</a>`;
    });
    chart.innerHTML = s + "</svg>";
    const kinds = new Set(pts.filter(p => !p.flagged).map(p => p.kind));
    $("pk-lgd").innerHTML = LEGEND.map((t, k) => kinds.has(k) ? `<span style="--c:${KIND[k]}">${t}</span>` : "").join("") + (pts.some(p => p.flagged) ? `<span class="pk-fl">Flagged, see the row</span>` : "");
    const tip = $("pk-tip"), cards = state.data.cards;
    const follow = e => { const w = tip.offsetWidth, h = tip.offsetHeight; let x = e.clientX + 14, y = e.clientY + 14; if (x + w > innerWidth - 8) x = e.clientX - w - 14; if (y + h > innerHeight - 8) y = e.clientY - h - 14; tip.style.left = `${x}px`; tip.style.top = `${y}px`; };
    chart.querySelectorAll(".pk-pt").forEach(a => {
      a.addEventListener("pointerenter", e => { tip.innerHTML = (cards[pts[+a.dataset.k].id] || "") + `<span class="go">Click to open the table entry</span>`; tip.hidden = false; follow(e); });
      a.addEventListener("pointermove", follow);
      a.addEventListener("pointerleave", () => { tip.hidden = true; });
    });
  }

  // -------------------------------------------------------------------------------- routing
  function route() {
    const r = location.hash.match(/^#h-([a-z0-9]+)(?:@([\w-]+))?$/);
    const m = r && bySlug[r[1]];
    $("pk-tip").hidden = true;
    if (!m) { if (mode !== "ring") showRing(); if (location.hash === "#pick") scrollTo({ top: 0 }); return; }
    if (M.sub.includes(m.model) && !r[2]) return showSub(m);
    showChart(m, r[2] === "all" ? null : r[2]);
  }
  addEventListener("hashchange", route);

  // ------------------------------------------------------------------------ the rest of the hero
  const about = $("pk-about"), whatis = $("pk-whatis");
  const toggle = open => { about.hidden = !open; whatis.setAttribute("aria-expanded", open); };
  whatis.addEventListener("click", () => toggle(about.hidden));
  $("pk-about-x").addEventListener("click", () => toggle(false));
  addEventListener("keydown", e => { if (e.key === "Escape") toggle(false); });
  const links = [...document.querySelectorAll(".pk-more-l")];
  links.forEach(b => b.addEventListener("click", () => {
    const open = b.getAttribute("aria-expanded") !== "true";
    links.forEach(o => { o.setAttribute("aria-expanded", "false"); $(o.getAttribute("aria-controls")).hidden = true; });
    b.setAttribute("aria-expanded", String(open)); $(b.getAttribute("aria-controls")).hidden = !open;
  }));

  route();
  requestAnimationFrame(tick);
})();
