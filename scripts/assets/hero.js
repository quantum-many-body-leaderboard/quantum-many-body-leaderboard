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
  // The Open Problems switch (OP_SWITCH_SCRIPT, site.mjs) marks the open problems in place: it
  // sets html.op-on without a reload. What it shows is drawn always and revealed by that class in
  // CSS, so the count badges pop in, fully solved Hamiltonians fade and solved instances grey out.
  const root = document.documentElement, isOn = () => root.classList.contains("op-on");
  root.setAttribute("data-op-live", "");
  const badge = (n, k = 0) => `<span class="pk-badge" style="--i:${k}" title="${n} open problem${n === 1 ? "" : "s"}">${n}</span>`;
  stage.querySelectorAll(".pk-node").forEach((n, k) => {
    const m = bySlug[n.dataset.slug];
    if (m.open) n.insertAdjacentHTML("beforeend", badge(m.open, k)); else n.classList.add("pk-done");
  });
  const RING = stage.innerHTML, SAY = say.innerHTML;
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const tabSlug = s => s.replace(/[^\w]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
  const nE = n => `${n.toLocaleString("en")} energ${n === 1 ? "y" : "ies"}`;
  let mode = "ring";

  // ---------------------------------------------------------------------------- ring motion
  let phase = 0, speed = 1, last = 0, paused = false, geo = null;
  const still = matchMedia("(prefers-reduced-motion: reduce)"), narrow = matchMedia("(max-width: 720px)");
  const measure = () => { geo = { W: stage.clientWidth, H: stage.clientHeight }; };
  // The nodes sit at equal steps along the ellipse, not at equal angles: on a wide ellipse equal
  // angles crowd the nodes at its left and right ends, where a label then runs into the next node.
  // arc holds the length along the ellipse from angle 0 at 720 angles, rebuilt when the size changes.
  let arc = null;
  function arcAngle(rx, ry, f) {
    if (!arc || arc.rx !== rx || arc.ry !== ry) {
      const len = [0];
      for (let i = 1; i <= 720; i++) { const a = Math.PI * i / 360, b = Math.PI * (i - 1) / 360; len.push(len[i - 1] + Math.hypot(rx * (Math.cos(a) - Math.cos(b)), ry * (Math.sin(a) - Math.sin(b)))); }
      arc = { rx, ry, len };
    }
    const { len } = arc, s = (f - Math.floor(f)) * len[720];
    let lo = 0, hi = 720;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (len[m] <= s) lo = m; else hi = m; }
    return Math.PI * (lo + (s - len[lo]) / (len[hi] - len[lo])) / 360;
  }
  function place() {
    if (narrow.matches || hero.hidden) return;
    if (!geo || !geo.W) measure();
    const nodes = stage.querySelectorAll(".pk-node"), rx = geo.W * 0.39, ry = geo.H * 0.38;
    nodes.forEach((n, k) => {
      // The top of the ellipse is three quarters of the way round from angle 0.
      const a = arcAngle(rx, ry, 0.75 + phase / (2 * Math.PI) + k / nodes.length);
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

  // A formula wider than its box shrinks until it fits; one that fits keeps its size. The picker's own
  // formula shrinks no further than 15px and then scrolls sideways in its box, faded at the cut edge.
  function fit(root = document) {
    for (const box of root.querySelectorAll(".pk-f, .pk-math")) {
      const m = box.querySelector("math"); if (!m) continue;
      m.style.fontSize = "";
      const scroll = box.classList.contains("pk-math"), w = box.clientWidth, s = scroll ? box.scrollWidth : m.getBoundingClientRect().width;
      if (w && s > w) m.style.fontSize = `${Math.max(scroll ? 15 : 0, parseFloat(getComputedStyle(m).fontSize) * (w / s) * 0.98).toFixed(2)}px`;
      if (scroll) fade(box);
    }
  }
  const fade = box => box.classList.toggle("pk-ovf", box.scrollLeft + box.clientWidth < box.scrollWidth - 2);
  addEventListener("resize", () => fit());
  // The chart is drawn at its box's width, so its labels keep their size on a phone; redrawn when the width changes.
  let drawnW = 0;
  addEventListener("resize", () => { const c = $("pk-chart"); if (state && c && Math.abs(c.clientWidth - drawnW) > 16) render(); });
  function hover(node) {
    stage.classList.toggle("hovering", !!node);
    stage.querySelectorAll(".pk-node").forEach(n => n.classList.toggle("on", n === node));
    if (mode !== "ring") return;
    const m = node && bySlug[node.dataset.slug];
    const s = $("pk-say");
    if (s) { s.innerHTML = m ? `<b>${esc(m.name)}</b> · <span class="pk-k">${isOn() ? `${m.open} open problem${m.open === 1 ? "" : "s"}` : nE(m.energies)}</span><br>${esc(m.about)}<span class="pk-f">${m.formula}</span>` : SAY; fit(s); }
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
      m.tabs.map((t, k) => `<a class="pk-node${t.open ? "" : " pk-done"}" href="#h-${m.slug}@${tabSlug(t.label)}">${t.glyph}<span class="pk-nm pk-serif">${esc(t.label)}</span><span class="pk-ct">${nE(t.count)}</span>${t.open ? badge(t.openInst, k) : ""}</a>`).join("");
    measure(); place(); fit(stage);
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
    state = { m, data, tab: Math.max(0, k), sel: {} };
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
      const counts = new Map(), order = new Map(), open = new Map();
      for (const i of pool) { const [l, o] = val(i); counts.set(l, (counts.get(l) || 0) + i.r.length); order.set(l, o); open.set(l, (open.get(l) || 0) + (i.o ? i.r.length : 0)); }
      if (!counts.size) continue;
      // Marking the open problems, a setting starts where most of them are.
      if (!counts.has(sel[dim])) sel[dim] = [...counts].sort((a, b) => (isOn() ? open.get(b[0]) - open.get(a[0]) : 0) || b[1] - a[1])[0][0];
      const vals = [...counts.keys()].sort((a, b) => { const x = order.get(a), y = order.get(b); return typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "en", { numeric: true }); });
      // Couplings print to four digits (7.74263683 -> 7.743), in full where two would then read alike;
      // a badge whose order is a number but whose label is a word (boundary, shape) keeps its label.
      const short = new Map(vals.map(v => { const o = order.get(v); return [v, typeof o === "number" && String(o) === v ? String(Number(o.toPrecision(4))) : v]; }));
      const seen = [...short.values()];
      for (const [v, s] of short) if (seen.filter(x => x === s).length > 1) short.set(v, v);
      rows.push([dim, vals, counts, short]);
      pool = pool.filter(i => val(i)[0] === sel[dim]);
    }
    return { pool, rows };
  }

  // A chip row longer than 12 (the atom and molecule species) shows the 8 values with most energies and the chosen
  // one; "+N more" opens the whole row, with a field that narrows it by name or formula.
  const MANY = 12;
  const chip = (dim, v, c, short) => `<button class="pk-chip" type="button" data-dim="${esc(dim)}" data-v="${esc(v)}" aria-pressed="${v === state.sel[dim]}"${short.get(v) !== v ? ` title="${esc(v)}"` : ""}>${esc(short.get(v))}<i>${c.get(v)}</i></button>`;
  function chipRow([dim, vals, c, short]) {
    const lab = `<span class="pk-lab">${esc(dim)}</span>`, sel = state.sel[dim];
    if (vals.length <= MANY) return `<div class="pk-fg">${lab}${vals.map(v => chip(dim, v, c, short)).join("")}</div>`;
    const open = state.open?.[dim];
    let shown = [...vals].sort((a, b) => c.get(b) - c.get(a)).slice(0, 8);
    if (!shown.includes(sel)) shown = [...shown.slice(0, 7), sel];
    const list = open ? vals : vals.filter(v => shown.includes(v));
    return `<div class="pk-fg">${lab}${list.map(v => chip(dim, v, c, short)).join("")}<button class="pk-chipmore" type="button" data-more="${esc(dim)}" aria-expanded="${!!open}">${open ? "Show fewer" : `+${vals.length - list.length} more`}</button>${open ? `<input class="pk-find" data-find="${esc(dim)}" placeholder="Find by name or formula" aria-label="Find a ${esc(dim)}">` : ""}</div>`;
  }

  function render() {
    const { m, data, sel } = state, { pool, rows } = resolve();
    const choosing = rows.filter(([, v]) => v.length > 1), fixed = rows.filter(([, v]) => v.length === 1 && v[0] !== "—");
    const sub = M.sub.includes(m.model);
    view.innerHTML = `
<div class="pk-crumb"><a href="#pick">← Pick another problem</a>${sub ? `<span>·</span><a href="#h-${m.slug}">Other ${esc(m.name)} lattices</a>` : ""}</div>
<div class="pk-title">${m.glyph}<div><h2>${esc(m.name)}</h2><div class="pk-math">${m.formulaBlock}</div></div></div>
<p class="pk-desc">${esc(m.about)} Each dot is one published result for the setting chosen below.</p>
${data.tabs.length > 1 ? `<div class="pk-tabs" role="tablist">${data.tabs.map((t, k) => `<button class="pk-tab${t.open ? "" : " pk-done"}" role="tab" type="button" data-k="${k}" aria-selected="${k === state.tab}">${t.glyph}<span>${esc(t.label)}</span><i>${t.count}</i>${t.open ? badge(t.openInst, k) : ""}</button>`).join("")}</div>` : ""}
${choosing.length || fixed.length ? `<div class="pk-filters">${choosing.map(chipRow).join("")}${fixed.length ? `<div class="pk-fg"><span class="pk-lab">setting</span><span class="pk-fixed">${fixed.map(([dim, v, , short]) => esc(dim === "boundary" || dim === "shape" || dim === "problem" || dim === "variant" ? v[0] : `${dim} = ${short.get(v[0])}`)).join(", ")}</span></div>` : ""}</div>` : ""}
<div class="pk-chart" id="pk-chart"></div>
<div class="pk-lgd" id="pk-lgd"></div>
<p class="pk-cap">${pool.length} instance${pool.length === 1 ? "" : "s"}, ${nE(pool.reduce((a, i) => a + i.r.length, 0))}. Horizontal: ${pool.length && pool.every(i => i.x != null) ? "bond length R in bohr" : data.xLabel ? `${data.xLabel}` : "number of sites N, log scale"}. Vertical: ${esc(data.unit)}. Point at a dot to preview it; click it to open its table entry. <a href="/instances/${isOn() ? "?open" : ""}#${m.slug}">All ${esc(m.name)} rows in the table</a>.</p>`;
    view.querySelectorAll(".pk-tab").forEach(b => b.addEventListener("click", () => {
      state.tab = +b.dataset.k; state.sel = {};
      history.replaceState(null, "", `#h-${m.slug}@${tabSlug(data.tabs[state.tab].label)}`);
      render();
    }));
    view.querySelectorAll(".pk-chip").forEach(b => b.addEventListener("click", () => { sel[b.dataset.dim] = b.dataset.v; render(); }));
    view.querySelectorAll(".pk-chipmore").forEach(b => b.addEventListener("click", () => { (state.open ||= {})[b.dataset.more] = !state.open[b.dataset.more]; render(); }));
    view.querySelectorAll(".pk-find").forEach(inp => inp.addEventListener("input", () => {
      const q = inp.value.trim().toLowerCase();
      inp.closest(".pk-fg").querySelectorAll(".pk-chip").forEach(b => { b.hidden = !!q && !b.textContent.toLowerCase().includes(q); });
    }));
    draw(pool);
    fit(view);
    view.querySelectorAll(".pk-math").forEach(b => b.addEventListener("scroll", () => fade(b), { passive: true }));
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
    const box = $("pk-chart"), W = Math.max(300, Math.min(920, Math.round(box.clientWidth || 920))), narrow = W < 600;
    const H = narrow ? Math.round(W * 0.78) : 420, mg = narrow ? { l: 60, r: 12, t: 12, b: 42 } : { l: 72, r: 20, t: 16, b: 46 }, nt = narrow ? 4 : 5;
    drawnW = W;
    // A diatomic's bond length where every instance in view has one (linear axis), else the size N (log axis).
    const byR = pool.length && pool.every(i => i.x != null);
    // Atoms and molecules at one setting are one column; its dots are spread out in energy order, highest first.
    const strip = !byR && !!state.data.xLabel;
    const pts = pool.flatMap(i => i.r.map(r => ({ N: byR ? +i.x : i.N, e: r[0], kind: r[2], filled: r[3], flagged: r[4], id: r[5], solved: !i.o })));
    const chart = $("pk-chart");
    if (!pts.length) { chart.innerHTML = `<p class="pk-cap">No results for this setting.</p>`; return; }
    if (strip) [...pts].sort((a, b) => b.e - a.e).forEach((p, k) => { p.N = k + 1; });
    let x0 = Math.min(...pts.map(p => p.N)), x1 = Math.max(...pts.map(p => p.N));
    if (byR || strip) { const px = (x1 - x0 || 0.5) * 0.08 + (strip ? 0.5 : 0); x0 -= px; x1 += px; }
    else if (x0 === x1) { x0 /= 1.6; x1 *= 1.6; } else { x0 /= 1.2; x1 *= 1.2; }
    let y0 = Math.min(...pts.map(p => p.e)), y1 = Math.max(...pts.map(p => p.e));
    const py = (y1 - y0 || Math.abs(y0) * 0.02 || 0.01) * 0.08; y0 -= py; y1 += py;
    const X = byR || strip ? v => mg.l + (v - x0) / (x1 - x0) * (W - mg.l - mg.r) : v => mg.l + (Math.log(v) - Math.log(x0)) / (Math.log(x1) - Math.log(x0)) * (W - mg.l - mg.r);
    const Y = v => H - mg.b - (v - y0) / (y1 - y0) * (H - mg.t - mg.b);
    const xt = [];
    for (let k = Math.floor(Math.log10(x0)); k <= Math.ceil(Math.log10(x1)); k++) for (const s of [1, 2, 5]) { const v = s * 10 ** k; if (v >= x0 && v <= x1) xt.push(v); }
    const sizes = [...new Set(pts.map(p => p.N))].sort((a, b) => a - b);
    const xticks = byR ? niceTicks(x0, x1, nt) : xt.length >= 2 ? (narrow ? xt.filter(v => /^[15]/.test(String(v))) : xt) : sizes;
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Energy against the number of sites">`;
    for (const v of niceTicks(y0, y1, nt)) s += `<line class="pk-ax" x1="${mg.l}" x2="${W - mg.r}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}"/><text class="pk-tk" x="${mg.l - 8}" y="${(Y(v) + 4).toFixed(1)}" text-anchor="end">${+v.toPrecision(6)}</text>`;
    if (byR || !state.data.xLabel) for (const v of xticks) s += `<text class="pk-tk" x="${X(v).toFixed(1)}" y="${H - mg.b + 18}" text-anchor="middle">${v}</text>`;
    s += `<text class="pk-axl" x="${(W + mg.l) / 2}" y="${H - 8}" text-anchor="middle">${byR ? "bond length R (bohr)" : state.data.xLabel || "sites N"}</text>`;
    // flagged outlines last, over what they coincide with; exact dots over the bounds
    pts.sort((a, b) => b.solved - a.solved || a.flagged - b.flagged || a.filled - b.filled || (a.kind === 3) - (b.kind === 3));
    pts.forEach((p, k) => {
      // Colour through --pk-c, so that a solved instance can grey out in a transition (hero.mjs).
      const x = X(p.N), y = Y(p.e), c = "var(--pk-c)", f = n => n.toFixed(1);
      const d = `M${f(x - 5.5)} ${f(y + 5.5)}L${f(x + 5.5)} ${f(y - 5.5)}`;
      const mark = `<circle cx="${f(x)}" cy="${f(y)}" r="6.5" fill="var(--surface)"/>` + (p.flagged
        ? `<circle cx="${f(x)}" cy="${f(y)}" r="4" fill="none" stroke="${c}" stroke-width="2"/><path d="${d}" stroke="var(--surface)" stroke-width="3.5" stroke-linecap="round"/><path d="${d}" stroke="${c}" stroke-width="2" stroke-linecap="round"/>`
        : p.filled ? `<circle cx="${f(x)}" cy="${f(y)}" r="4.5" fill="${c}"/>` : `<circle cx="${f(x)}" cy="${f(y)}" r="4" fill="var(--surface)" stroke="${c}" stroke-width="2"/>`);
      s += `<a class="pk-pt${p.solved ? " pk-solved" : ""}" style="--pk-k:${KIND[p.kind]}" href="/instances/${isOn() ? "?open" : ""}#${p.id}" data-k="${k}">${mark}</a>`;
    });
    chart.innerHTML = s + "</svg>";
    const kinds = new Set(pts.filter(p => !p.flagged).map(p => p.kind)), openKinds = new Set(pts.filter(p => !p.flagged && !p.solved).map(p => p.kind));
    $("pk-lgd").innerHTML = LEGEND.map((t, k) => kinds.has(k) ? `<span${openKinds.has(k) ? "" : ` class="pk-lg-only-solved"`} style="--c:${KIND[k]}">${t}</span>` : "").join("") + (pts.some(p => p.flagged) ? `<span class="pk-fl">Flagged, see the row</span>` : "") + (pts.some(p => p.solved) ? `<span class="pk-lg-solved" style="--c:var(--grid)">Solved: the instance has an exact energy</span>` : "");
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
  // "What is": QMBL's box, or QMBL: Open Problems' while the switch is on.
  const whatis = $("pk-whatis"), boxes = [$("pk-about"), $("pk-about-op")];
  const toggle = open => { const box = boxes[+isOn()]; boxes.forEach(b => { b.hidden = b !== box || !open; }); whatis.setAttribute("aria-controls", box.id); whatis.setAttribute("aria-expanded", open); };
  whatis.addEventListener("click", () => toggle(boxes.every(b => b.hidden)));
  boxes.forEach(b => b.querySelector(".pk-x").addEventListener("click", () => toggle(false)));
  addEventListener("qmbl:open", () => toggle(false));
  addEventListener("keydown", e => { if (e.key === "Escape") toggle(false); });
  // The badges pop in clockwise from whichever Hamiltonian is at the top of the ring right now.
  function stagger() {
    const box = stage.getBoundingClientRect(), cx = box.left + box.width / 2, cy = box.top + box.height / 2;
    [...stage.querySelectorAll(".pk-node")].map(n => {
      const r = n.getBoundingClientRect(), a = Math.atan2(r.left + r.width / 2 - cx, cy - (r.top + r.height / 2));
      return [n, (a + 2 * Math.PI) % (2 * Math.PI)];
    }).sort((x, y) => x[1] - y[1]).forEach(([n], k) => n.querySelector(".pk-badge")?.style.setProperty("--i", k));
  }
  addEventListener("qmbl:open", stagger);
  const links = [...document.querySelectorAll(".pk-more-l")];
  links.forEach(b => b.addEventListener("click", () => {
    const open = b.getAttribute("aria-expanded") !== "true";
    links.forEach(o => { o.setAttribute("aria-expanded", "false"); $(o.getAttribute("aria-controls")).hidden = true; });
    b.setAttribute("aria-expanded", String(open)); $(b.getAttribute("aria-controls")).hidden = !open;
  }));

  route();
  requestAnimationFrame(tick);
})();
