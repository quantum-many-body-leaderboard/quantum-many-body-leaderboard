// The arena (arena.mjs): the switch's animation on the front page, the sparks, and the panels under
// the ring. The switch itself (site.mjs OP_SWITCH_SCRIPT) sets html.op-on; this script runs before it
// in the click and lets it through at the peak of the spin.
(() => {
  const root = document.documentElement, $ = id => document.getElementById(id), stage = $("pk-stage"), hero = $("pick");
  const still = matchMedia("(prefers-reduced-motion: reduce)"), narrow = matchMedia("(max-width: 720px)");
  const A = window.__arena = { spin: 0, hot: [] };
  const b = document.querySelector("header.site a.op");

  // ---------------------------------------------------------------------------------- sparks
  const cv = document.createElement("canvas"); cv.id = "arena-fx"; hero.append(cv);
  const flash = document.createElement("div"); flash.id = "arena-flash"; document.body.append(flash);
  const cx = cv.getContext("2d"), sparks = [];
  const at = n => { const h = cv.getBoundingClientRect(), r = (n.querySelector(".pk-glyph") ?? n).getBoundingClientRect(); return [r.left + r.width / 2 - h.left, r.top + r.height / 2 - h.top, r.width / 2]; };
  const emit = (x, y, ang, v, life, size) => { if (sparks.length < 900) sparks.push({ x, y, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v, t: 0, life, size }); };
  function throwSparks(force) {
    const r = cv.getBoundingClientRect(), mx = r.width / 2, my = stage.offsetTop + stage.clientHeight / 2;
    for (const n of stage.querySelectorAll(".pk-node")) {
      const [x, y, rad] = at(n), out = Math.atan2(y - my, x - mx);
      for (let i = 0; i < Math.ceil(force * 4); i++) {
        // Off the rim, forward along the ring's motion and a little outwards, like a grinding wheel.
        const a = out + Math.PI / 2 - Math.random() * 0.9;
        emit(x + Math.cos(out) * rad * .8, y + Math.sin(out) * rad * .8, a, 140 + Math.random() * 460 * force, .35 + Math.random() * .6, .8 + Math.random() * 1.6);
      }
    }
  }
  function burst() { for (const n of stage.querySelectorAll(".pk-node")) { const [x, y] = at(n); for (let i = 0; i < 26; i++) emit(x, y, Math.random() * 6.283, 60 + Math.random() * 420, .4 + Math.random() * .8, 1 + Math.random() * 1.8); } }
  let last = 0, drawn = false, ember = 0;
  function frame(t) {
    const dt = Math.min((t - last) / 1000 || 0, .05); last = t;
    const w = hero.clientWidth, h = hero.clientHeight, d = Math.min(devicePixelRatio || 1, 2);
    if (w && h && (cv.width !== Math.round(w * d) || cv.height !== Math.round(h * d))) { cv.width = Math.round(w * d); cv.height = Math.round(h * d); }
    // In the arena, Hamiltonians with a recent record let go a spark now and then.
    if (root.classList.contains("op-on") && !still.matches && !hero.hidden && !A.running && (ember += dt) > .16) {
      ember = 0; const hot = stage.querySelectorAll(".pk-hot"), n = hot[Math.random() * hot.length | 0];
      if (n) { const [x, y, r] = at(n), a = -Math.PI / 2 + (Math.random() - .5) * 1.6; emit(x + Math.cos(a) * r, y + Math.sin(a) * r, a, 25 + Math.random() * 60, .8 + Math.random() * .7, 1 + Math.random()); }
    }
    if (sparks.length || drawn) {
      cx.setTransform(d, 0, 0, d, 0, 0); cx.clearRect(0, 0, w, h); cx.globalCompositeOperation = root.classList.contains("op-on") ? "lighter" : "source-over"; cx.lineCap = "round"; drawn = sparks.length > 0;
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i]; s.t += dt; if (s.t > s.life) { sparks.splice(i, 1); continue; }
        s.vx *= 1 - 1.6 * dt; s.vy = s.vy * (1 - 1.6 * dt) + 170 * dt; s.x += s.vx * dt; s.y += s.vy * dt;
        const k = 1 - s.t / s.life, dark = root.classList.contains("op-on");
        cx.strokeStyle = !dark ? (k > .6 ? `rgba(240,120,20,${k})` : `rgba(205,62,12,${k * 1.5})`) : k > .7 ? `rgba(255,240,205,${k})` : k > .35 ? `rgba(255,176,76,${k})` : `rgba(255,98,44,${k * 1.3})`;
        cx.lineWidth = s.size * (.5 + k); cx.beginPath(); cx.moveTo(s.x, s.y); cx.lineTo(s.x - s.vx * .05, s.y - s.vy * .05); cx.stroke();
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // On the plain front page the Arena button lets go a small spark now and then, off its rim.
  // The canvas goes in on the first frame: the switch (site.mjs OP_SWITCH_SCRIPT) fills the button after this script runs.
  const bc = document.createElement("canvas"); bc.id = "ar-btn-fx";
  const bx = bc.getContext("2d"), bs = []; let bl = 0, bt = 0;
  function btnFrame(t) {
    const dt = Math.min((t - bl) / 1000 || 0, .05); bl = t;
    if (!bc.isConnected) b.append(bc);
    const idle = root.classList.contains("op-on") || still.matches || document.hidden || hero.hidden;
    const w = bc.clientWidth, h = bc.clientHeight, d = Math.min(devicePixelRatio || 1, 2);
    if (w && (bc.width !== Math.round(w * d) || bc.height !== Math.round(h * d))) { bc.width = Math.round(w * d); bc.height = Math.round(h * d); }
    if (!idle && (bt += dt) > .22) {
      // A point on the pill's outline and the outward direction there.
      bt = 0; const pw = w - 36, ph = h - 36, r = ph / 2, L = pw - ph, u = Math.random() * (2 * L + 2 * Math.PI * r);
      let x, y, a;
      if (u < L) { x = 18 + r + u; y = 18; a = -Math.PI / 2; } else if (u < 2 * L) { x = 18 + r + (u - L); y = 18 + ph; a = Math.PI / 2; }
      else { const v = (u - 2 * L) / r, right = v < Math.PI; a = right ? -Math.PI / 2 + v : Math.PI / 2 + (v - Math.PI); x = (right ? 18 + pw - r : 18 + r) + Math.cos(a) * r; y = 18 + r + Math.sin(a) * r; }
      a += (Math.random() - .5) * .8; const v = 18 + Math.random() * 30;
      bs.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, life: .45 + Math.random() * .4 });
    }
    bx.setTransform(d, 0, 0, d, 0, 0); bx.clearRect(0, 0, w, h);
    const dark = matchMedia("(prefers-color-scheme: dark)").matches;
    for (let i = bs.length - 1; i >= 0; i--) {
      const s = bs[i]; s.t += dt; if (s.t > s.life || idle) { bs.splice(i, 1); continue; }
      s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 40 * dt; const k = 1 - s.t / s.life;
      bx.fillStyle = dark ? `rgba(255,${150 + 90 * k | 0},70,${k})` : `rgba(${200 + 40 * k | 0},${70 + 50 * k | 0},16,${k})`;
      bx.beginPath(); bx.arc(s.x, s.y, .7 + 1.1 * k, 0, 6.283); bx.fill();
    }
    requestAnimationFrame(btnFrame);
  }
  requestAnimationFrame(btnFrame);

  // ------------------------------------------------------------------------------- the click
  // Speed up, flash and change colours at the top, slow down. Full once per visit, then short.
  let pass = false;
  function enter() {
    let seen = false; try { seen = !!sessionStorage.getItem("arena-seen"); sessionStorage.setItem("arena-seen", "1"); } catch {}
    const [up, down, peak] = seen ? [350, 700, 150] : [1000, 1500, 260];
    A.running = true; root.classList.add("arena-run");
    const t0 = performance.now(); let peaked = false;
    const safety = setTimeout(() => { if (!peaked) { peaked = true; flip(); } done(); }, up + down + 800);
    function flip() { pass = true; b.click(); pass = false; flash.classList.remove("go"); void flash.offsetWidth; flash.classList.add("go"); burst(); }
    function done() { clearTimeout(safety); A.spin = 0; A.running = false; root.classList.remove("arena-run"); }
    (function step() {
      if (!A.running) return;
      const t = performance.now() - t0;
      if (t < up) A.spin = peak * (t / up) ** 3;
      else { if (!peaked) { peaked = true; flip(); } A.spin = peak * Math.max(0, 1 - (t - up) / down) ** 3; }
      if (A.spin > peak * .06) throwSparks(A.spin / peak);
      if (t < up + down) requestAnimationFrame(step); else done();
    })();
  }
  document.addEventListener("click", e => {
    if (pass || !e.target.closest || e.target.closest("header.site a.op") !== b) return;
    if (A.running) { e.preventDefault(); e.stopImmediatePropagation(); return; }
    if (root.classList.contains("op-on") || still.matches || hero.hidden) return;
    e.preventDefault(); e.stopImmediatePropagation(); scrollTo({ top: 0, behavior: "instant" }); enter();
  }, true);

  // --------------------------------------------------------------------------------- panels
  const D = JSON.parse($("arena-data").textContent), esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const link = (p, row) => row ? `<a href="/instances/?open#${esc(row)}">${esc(p.text)}</a>` : `<span>${esc(p.text)}</span>`;
  const hotSlugs = new Set(D.hot.map(m => D.names[m].slug));
  // Glow 0..1 from the open problems (the badge's number): the more, the stronger.
  const counts = () => [...stage.querySelectorAll(".pk-node .pk-badge")].map(x => +x.textContent.replace(/\D/g, "")).filter(Boolean);
  const markHot = () => { const most = Math.max(2, ...counts()); stage.querySelectorAll(".pk-node[data-slug]").forEach(n => {
    n.classList.toggle("pk-hot", hotSlugs.has(n.dataset.slug));
    const k = +(n.querySelector(".pk-badge")?.textContent.replace(/\D/g, "") || 0); if (k) n.style.setProperty("--g", Math.max(.12, Math.log(k) / Math.log(most)).toFixed(2));
  }); };
  markHot(); new MutationObserver(markHot).observe(stage, { childList: true });
  $("ar-model").insertAdjacentHTML("beforeend", Object.entries(D.names).filter(([m]) => D.papers.some(p => p.lead[m])).map(([m, n]) => `<option value="${esc(m)}">${esc(n.name)}</option>`).join(""));
  // Top five, the rest behind a toggle that stays as set while the Hamiltonian changes.
  const TOP = 5, shown = { rows: false, events: false };
  const table = (id, head, rows) => {
    const more = rows.length > TOP ? `<button class="ar-more" type="button" data-for="${id}">${shown[id] ? "Show the top 5" : `Show all ${rows.length}`}</button>` : "";
    return `<table><thead><tr>${head}</tr></thead><tbody>${rows.slice(0, shown[id] ? rows.length : TOP).join("")}</tbody></table>${more}`;
  };
  function standings() {
    const m = $("ar-model").value, val = p => m ? p.lead[m] ?? 0 : Object.values(p.lead).reduce((a, x) => a + x, 0);
    const rows = D.papers.map(p => [p, val(p)]).filter(x => x[1]).sort((a, c) => c[1] - a[1] || a[0].text.localeCompare(c[0].text)), max = rows[0]?.[1] ?? 1;
    $("ar-rows").innerHTML = rows.length ? table("rows", `<th class="rk">#</th><th>Paper</th><th class="bar"></th><th class="n">Leads</th>`,
      rows.map(([p, v]) => `<tr><td class="ar-rank">${rows.filter(r => r[1] > v).length + 1}</td><td>${link(p, m ? p.row[m] : Object.values(p.row)[0])}</td><td><div class="ar-bar" style="width:${(100 * v / max).toFixed(1)}%"></div></td><td class="num">${v}</td></tr>`)) : `<p>None yet.</p>`;
  }
  const mon = s => new Date(`${s}-15`).toLocaleString("en", { month: "short", year: "numeric" });
  const events = () => { $("ar-events").innerHTML = table("events", `<th class="mo">Month</th><th>Paper</th>`, D.events.map(e => `<tr><td><time>${mon(e.month)}</time></td><td>${link(e, e.row)} <span>${esc(D.names[e.model].name)}, ${e.n} problem${e.n === 1 ? "" : "s"}</span><small>before: ${esc(e.prev.slice(0, 2).join(", "))}${e.prev.length > 2 ? ` and ${e.prev.length - 2} more` : ""}</small></td></tr>`)); };
  $("ar-model").addEventListener("change", standings);
  $("arena").addEventListener("click", e => { const t = e.target.closest(".ar-more"); if (!t) return; shown[t.dataset.for] = !shown[t.dataset.for]; (t.dataset.for === "rows" ? standings : events)(); });
  standings(); events();
  $("ar-copy").addEventListener("click", async () => { let ok = true; try { await navigator.clipboard.writeText($("ar-prompt").textContent); } catch { ok = false; const r = document.createRange(); r.selectNodeContents($("ar-prompt")); getSelection().removeAllRanges(); getSelection().addRange(r); } $("ar-copy").textContent = ok ? "Copied" : "Selected, press ⌘C"; setTimeout(() => { $("ar-copy").textContent = "Copy prompt for your agent"; }, 1800); });
})();
