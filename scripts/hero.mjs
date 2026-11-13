// The front page's picker (2026-11-10): "Pick your quantum problem" with the Hamiltonians on a
// slowly drifting ring, each drawn as a small hairline sketch of its lattice; a click opens
// that Hamiltonian's chart (scripts/assets/hero.js) drawn from _site/picker/<model>.json.
// Hubbard, Heisenberg and the electron gas first open a second ring of their lattices. Formulas follow the
// Wikipedia pages of each model (Hubbard, J1-J2, transverse-field Ising, t-J, Anderson impurity,
// jellium, the molecular Hamiltonian in atomic units), with the couplings named as data/ stores
// them (h, Jd, K/J/Gamma). Names are MODELS' (readme_table.mjs), never the data codes.
import { MODELS } from "./readme_table.mjs";

// Hamiltonians whose lattice (or simulation cell) is asked on a second ring first; every other
// one opens on its lattice with most results, the others as tabs above the chart.
export const SUB_RING = new Set(["Hubbard", "Heisenberg", "HEG3D", "HEG2D"]);
export const pickerSlug = model => model.toLowerCase();
const OP_README = "https://github.com/quantum-many-body-leaderboard/open-problems/blob/main/README.md";

// ------------------------------------------------------------------------- formulas (MathML)
const I = s => `<mi>${s}</mi>`, IU = s => `<mi mathvariant="normal">${s}</mi>`, B = s => `<mi mathvariant="bold">${s}</mi>`;
const N = s => `<mn>${s}</mn>`, O = s => `<mo>${s}</mo>`, T = s => `<mtext>${s}</mtext>`;
const R = (...a) => `<mrow>${a.join("")}</mrow>`;
const sb = (b, s) => `<msub>${b}${s}</msub>`, sp = (b, s) => `<msup>${b}${s}</msup>`, ss = (b, s, p) => `<msubsup>${b}${s}${p}</msubsup>`;
const SUM = l => `<munder><mo movablelimits="false">∑</mo>${l}</munder>`;
const FR = (a, b) => `<mfrac>${a}${b}</mfrac>`;
const nn = R(O("⟨"), I("i"), O(","), I("j"), O("⟩")), nnn = R(O("⟨⟨"), I("i"), O(","), I("j"), O("⟩⟩"));
const ijs = R(nn, O(","), I("σ"));
const cd = (i, s) => ss(I("c"), R(I(i), I(s)), O("†")), c = (i, s) => sb(I("c"), R(I(i), I(s)));
const SdS = R(sb(B("S"), I("i")), O("·"), sb(B("S"), I("j")));
const hc = (...a) => R(O("("), ...a, O("+"), T("h.c."), O(")"));
// The bars of |r_i - r_j| as fences with no space of their own (as an operator a bar gets
// relation spacing, which opened a gap inside the denominator).
const BAR = '<mo fence="true" stretchy="false" lspace="0" rspace="0">|</mo>';
const absr = (a, b) => R(BAR, a, O("−"), b, BAR);
const r_ = i => sb(B("r"), I(i)), R_ = i => sb(B("R"), I(i));
const kin = R(O("−"), FR(N(1), N(2)), SUM(I("i")), ss(IU("∇"), I("i"), N(2)));
const ee = R(SUM(R(I("i"), O("<"), I("j"))), FR(N(1), absr(r_("i"), r_("j"))));
const molecular = [I("H"), O("="), kin, O("−"), SUM(R(I("i"), O(","), I("A"))), FR(N(1), absr(r_("i"), R_("A"))), O("+"), ee, O("+"), SUM(R(I("A"), O("<"), I("B"))), FR(N(1), absr(R_("A"), R_("B")))];
const jellium = [I("H"), O("="), kin, O("+"), ee, O("+"), sb(I("H"), T("background"))];
const FORMULA = {
  Hubbard: [I("H"), O("="), O("−"), I("t"), SUM(ijs), hc(cd("i", "σ"), c("j", "σ")), O("+"), I("U"), SUM(I("i")), sb(I("n"), R(I("i"), O("↑"))), sb(I("n"), R(I("i"), O("↓")))],
  Heisenberg: [I("H"), O("="), I("J"), SUM(nn), SdS],
  J1J2: [I("H"), O("="), sb(I("J"), N(1)), SUM(nn), SdS, O("+"), sb(I("J"), N(2)), SUM(nnn), SdS],
  ShastrySutherland: [I("H"), O("="), I("J"), SUM(nn), SdS, O("+"), sb(I("J"), I("d")), SUM(R(nn, O("∈"), T("dimers"))), SdS],
  // K-J-Γ: (α, β, γ) are the bond type γ and the two spin components orthogonal to it.
  Kitaev: [I("H"), O("="), SUM(R(nn, O("∈"), I("γ"))), R(O("["), I("K"), ss(I("S"), I("i"), I("γ")), ss(I("S"), I("j"), I("γ")), O("+"), I("J"), SdS, O("+"), I("Γ"),
    R(O("("), ss(I("S"), I("i"), I("α")), ss(I("S"), I("j"), I("β")), O("+"), ss(I("S"), I("i"), I("β")), ss(I("S"), I("j"), I("α")), O(")")), O("]"))],
  // Wikipedia writes the field as gJ; data/ stores h.
  TFIsing: [I("H"), O("="), O("−"), I("J"), SUM(nn), sb(I("Z"), I("i")), sb(I("Z"), I("j")), O("−"), I("h"), SUM(I("j")), sb(I("X"), I("j"))],
  tV: [I("H"), O("="), O("−"), I("t"), SUM(nn), hc(sp(sb(I("c"), I("i")), O("†")), sb(I("c"), I("j"))), O("+"), I("V"), SUM(nn), sb(I("n"), I("i")), sb(I("n"), I("j"))],
  tJ: [I("H"), O("="), O("−"), I("t"), SUM(ijs), hc(cd("i", "σ"), c("j", "σ")), O("+"), I("J"), SUM(nn), R(O("("), SdS, O("−"), FR(R(sb(I("n"), I("i")), sb(I("n"), I("j"))), N(4)), O(")"))],
  Impurity: [I("H"), O("="), SUM(R(I("k"), O(","), I("σ"))), sb(I("ε"), I("k")), cd("k", "σ"), c("k", "σ"), O("+"), SUM(I("σ")), sb(I("ε"), I("d")), ss(I("d"), I("σ"), O("†")), sb(I("d"), I("σ")),
    O("+"), I("U"), sb(I("n"), R(I("d"), O("↑"))), sb(I("n"), R(I("d"), O("↓"))), O("+"), SUM(R(I("k"), O(","), I("σ"))), sb(I("V"), I("k")), hc(ss(I("d"), I("σ"), O("†")), c("k", "σ"))],
  Hchain: molecular, Hsheet: molecular, Atom: molecular, Molecule: molecular, HEG2D: jellium, HEG3D: jellium,
};
export const formula = (model, block = false) => FORMULA[model] ? `<math${block ? ' display="block"' : ""}>${FORMULA[model].join("")}</math>` : "";

const ABOUT = {
  Heisenberg: "Quantum spins with nearest-neighbour exchange.",
  J1J2: "Heisenberg spins with a competing next-nearest-neighbour exchange J₂.",
  Kitaev: "Spins on the honeycomb lattice with bond-dependent couplings K, plus Heisenberg J and off-diagonal Γ.",
  ShastrySutherland: "Spins on a square lattice with orthogonal dimer bonds J_d.",
  Hubbard: "Electrons hopping on a lattice with on-site repulsion U.",
  tV: "Spinless fermions with nearest-neighbour repulsion V.",
  tJ: "A doped Mott insulator: hopping without double occupancy, plus exchange J.",
  TFIsing: "Ising spins in a transverse field h.",
  Impurity: "Anderson impurity models from DMFT calculations.",
  HEG3D: "The homogeneous electron gas in three dimensions.",
  HEG2D: "The homogeneous electron gas in two dimensions.",
  Hchain: "Chains of hydrogen atoms, an ab initio benchmark (atomic units).",
  Hsheet: "A square sheet of hydrogen atoms, ab initio (atomic units).",
  Atom: "Single atoms and ions: all electrons or a pseudopotential core, basis-free or in a basis set (atomic units).",
  Molecule: "Molecules with fixed nuclei: total energies, basis-free or in a basis set (atomic units).",
};
export const about = model => ABOUT[model] ?? "";

// ------------------------------------------------------------------- lattice sketches (60×60)
const L = (a, b, c, d, k = "g-l") => `<line class="${k}" x1="${a}" y1="${b}" x2="${c}" y2="${d}"/>`;
const D = (x, y, r = 2.6, k = "g-d") => `<circle class="${k}" cx="${x}" cy="${y}" r="${r}"/>`;
const A = (x, y, deg = 0, len = 6) => `<path class="g-a" transform="translate(${x} ${y}) rotate(${deg})" d="M0 ${len} V${-len} M-2.2 ${-len + 2.8} L0 ${-len} L2.2 ${-len + 2.8}"/>`;
const P3 = [12, 30, 48];
const sqLines = () => P3.map(p => L(12, p, 48, p) + L(p, 12, p, 48)).join("");
const sqDots = () => P3.flatMap(y => P3.map(x => D(x, y))).join("");
const neel = (hole = () => false) => P3.flatMap((y, j) => P3.map((x, i) => hole(x, y) ? D(x, y, 3.2, "g-h") : A(x, y, (i + j) % 2 ? 180 : 0))).join("");
const diag = k => [[12, 12, 30, 30], [30, 12, 12, 30], [30, 12, 48, 30], [48, 12, 30, 30], [12, 30, 30, 48], [30, 30, 12, 48], [30, 30, 48, 48], [48, 30, 30, 48]].map(([a, b, c, d]) => L(a, b, c, d, k)).join("");
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function near(pts, max) { let s = ""; pts.forEach((a, i) => pts.slice(i + 1).forEach(b => { if (Math.hypot(a[0] - b[0], a[1] - b[1]) < max) s += L(a[0], a[1], b[0], b[1]); })); return s + pts.map(([x, y]) => D(x, y, 2.4)).join(""); }
const hexRing = (cx, cy, r) => [...Array(6).keys()].map(k => { const a = (30 + 60 * k) * Math.PI / 180; return [+(cx + r * Math.cos(a)).toFixed(2), +(cy + r * Math.sin(a)).toFixed(2)]; });
const cube = extra => `<path class="g-l" d="M10 20 H40 V50 H10 Z M10 20 L20 10 H50 V40 L40 50 M40 20 L50 10"/>` + [[10, 20], [40, 20], [10, 50], [40, 50], [20, 10], [50, 10], [50, 40]].map(([x, y]) => D(x, y, 2.2)).join("") + extra;
const G = {
  Hubbard: () => sqLines() + sqDots().replace(D(30, 30), "") + A(26, 30, 0, 5) + A(34, 30, 180, 5) + A(12, 12) + A(48, 48, 180),
  Heisenberg: () => sqLines() + neel(),
  J1J2: () => sqLines() + diag("g-dash") + sqDots(),
  ShastrySutherland: () => sqLines() + `<line class="g-thick" x1="12" y1="12" x2="30" y2="30"/><line class="g-thick" x1="48" y1="30" x2="30" y2="48"/>` + sqDots(),
  Kitaev: () => {
    const v = hexRing(30, 30, 11), cls = ang => { const m = ((Math.round(ang) % 180) + 180) % 180; return m === 30 ? "g-x" : m === 90 ? "g-y" : "g-z"; };
    let s = "";
    v.forEach(([x1, y1], k) => { const [x2, y2] = v[(k + 1) % 6], a = 30 + 60 * k, r = a * Math.PI / 180; s += L(x1, y1, x2, y2, cls(a + 120)) + L(x1, y1, +(x1 + 11 * Math.cos(r)).toFixed(2), +(y1 + 11 * Math.sin(r)).toFixed(2), cls(a)); });
    return s + v.map(([x, y]) => D(x, y, 2.4)).join("");
  },
  TFIsing: () => L(8, 30, 52, 30) + [10, 20, 30, 40, 50].map((x, i) => A(x, 30, i % 2 ? 160 : -20, 7) + D(x, 30, 1.8)).join("") + `<path class="g-dash" d="M10 12 H50 M44 9 L50 12 L44 15"/><text class="g-t" x="27" y="9">h</text>`,
  tV: () => sqLines() + P3.flatMap((y, j) => P3.map((x, i) => (i + j) % 2 ? D(x, y, 3, "g-h") : D(x, y, 3))).join(""),
  tJ: () => sqLines() + neel((x, y) => x === 30 && y === 30),
  Impurity: () => [...Array(8).keys()].map(k => { const a = k * Math.PI / 4, x = +(30 + 20 * Math.cos(a)).toFixed(2), y = +(30 + 20 * Math.sin(a)).toFixed(2); return L(30, 30, x, y, "g-dash") + D(x, y, 2.2); }).join("") + `<circle class="g-h" cx="30" cy="30" r="5.5"/>` + A(30, 30, 0, 3.5),
  Hchain: () => L(6, 30, 54, 30, "g-dash") + [10, 22, 34, 46].map(x => `<circle class="g-h" cx="${x}" cy="30" r="4"/>` + D(x, 30, 1.2)).join("") + `<path class="g-l" d="M10 42 V46 M22 42 V46 M10 44 H22"/><text class="g-t" x="13" y="54">R</text>`,
  // An atom: the nucleus inside three orbits. A molecule: three nuclei and their bonds.
  Atom: () => [30, 90, 150].map(a => `<ellipse class="g-l" cx="30" cy="30" rx="22" ry="8" fill="none" transform="rotate(${a} 30 30)"/>`).join("") + `<circle class="g-h" cx="30" cy="30" r="4.5"/>` + D(30, 30, 1.4) + D(41, 49, 2) + D(8, 30, 2) + D(41, 11, 2),
  Molecule: () => L(30, 24, 14, 42) + L(30, 24, 46, 42) + `<circle class="g-h" cx="30" cy="24" r="7"/><circle class="g-h" cx="14" cy="42" r="4.5"/><circle class="g-h" cx="46" cy="42" r="4.5"/>` + D(30, 24, 1.6) + D(14, 42, 1.2) + D(46, 42, 1.2),
  Hsheet: () => [14, 25, 36, 47].flatMap(y => [14, 25, 36, 47].map(x => `<circle class="g-h" cx="${x}" cy="${y}" r="3.6"/>` + D(x, y, 1))).join(""),
  HEG2D: () => { const r = rng(7); let s = `<rect class="g-l" x="9" y="9" width="42" height="42"/>`; for (let i = 0; i < 16; i++) s += D(+(12 + r() * 36).toFixed(1), +(12 + r() * 36).toFixed(1), 1.8); return s; },
  HEG3D: () => { const r = rng(11); let s = `<path class="g-l" d="M10 20 H40 V50 H10 Z M10 20 L20 10 H50 V40 L40 50 M40 20 L50 10"/>`; for (let i = 0; i < 16; i++) { const z = r(); s += D(+(12 + r() * 26 + z * 10).toFixed(1), +(22 - z * 10 + r() * 26).toFixed(1), +(1.3 + z * 0.8).toFixed(2)); } return s; },
};
// One sketch per lattice tab; the model's own sketch where a lattice has none.
const LATTICE = {
  // The electron gas's "lattices" are simulation cells: the cell's outline with electrons in it.
  square: m => m === "HEG2D" ? G.HEG2D() : m === "Hubbard" ? sqLines() + neel() : m === "J1J2" ? G.J1J2() : m === "ShastrySutherland" ? G.ShastrySutherland() : m === "tJ" ? G.tJ() : sqLines() + neel(),
  triangular: m => m === "HEG2D" ? (() => { const r = rng(5); let s = `<path class="g-l" d="M6 48 H34 L54 12 H26 Z"/>`; for (let i = 0; i < 12; i++) { const u = r(), v = r(); s += D(+(10 + u * 24 + v * 18).toFixed(1), +(46 - v * 32).toFixed(1), 1.8); } return s; })() : near([[14, [10, 26, 42]], [30, [18, 34, 50]], [46, [10, 26, 42]]].flatMap(([y, xs]) => xs.map(x => [x, y])), 19),
  honeycomb: m => m === "Kitaev" ? G.Kitaev() : near([...hexRing(20, 20, 10), ...hexRing(40, 20, 10), ...hexRing(30, 37.3, 10)].filter((p, i, a) => a.findIndex(q => Math.hypot(q[0] - p[0], q[1] - p[1]) < 1) === i), 10.5),
  kagome: () => near([[10, 14], [30, 14], [50, 14], [20, 30], [40, 30], [10, 46], [30, 46], [50, 46], [0, 30], [60, 30]].filter(([x]) => x > 0 && x < 60), 21),
  chain: () => L(6, 30, 54, 30) + [10, 20, 30, 40, 50].map((x, i) => A(x, 30, i % 2 ? 180 : 0, 6)).join(""),
  ladder: () => L(6, 22, 54, 22) + L(6, 38, 54, 38) + [10, 22, 34, 46].map(x => L(x, 22, x, 38) + D(x, 22) + D(x, 38)).join(""),
  rectangular: () => { const xs = [8, 22, 36, 52], ys = [20, 40]; let s = ys.map(y => L(8, y, 52, y)).join("") + xs.map(x => L(x, 20, x, 40)).join(""); xs.forEach(x => s += `<path class="g-dashA" d="M${x} 40 C${x + 8} 52, ${x + 8} 8, ${x} 20"/>`); return s + xs.flatMap(x => ys.map(y => D(x, y, 2.4))).join(""); },
  shuriken: () => { const dm = [[30, 21], [39, 30], [30, 39], [21, 30]], out = [[13, 13], [47, 13], [47, 47], [13, 47]]; let s = dm.map((a, k) => L(a[0], a[1], dm[(k + 1) % 4][0], dm[(k + 1) % 4][1])).join(""); out.forEach((o, k) => { const a = dm[(k + 3) % 4], b = dm[k]; s += L(o[0], o[1], a[0], a[1]) + L(o[0], o[1], b[0], b[1]); }); return s + [...dm, ...out].map(([x, y]) => D(x, y)).join(""); },
  pyrochlore: () => { const p = [[30, 9], [11, 46], [49, 46], [37, 34]]; return L(11, 46, 49, 46, "g-dash") + [[0, 1], [0, 2], [0, 3], [1, 3], [2, 3]].map(([a, b]) => L(p[a][0], p[a][1], p[b][0], p[b][1])).join("") + p.map(([x, y]) => D(x, y)).join(""); },
  sc: () => cube(""), bcc: () => cube(D(30, 30, 3)), fcc: () => cube(D(25, 35, 2.2) + D(35, 15, 2.2) + D(45, 25, 2.2)),
};
const svg = (inner, cls = "pk-glyph") => `<svg class="${cls}" viewBox="0 0 60 60" aria-hidden="true">${inner}</svg>`;
export const modelGlyph = (model, cls) => svg((G[model] ?? G.Heisenberg)(), cls);
export function latticeGlyph(model, tab, cls) {
  const [base, ...rest] = tab.split(", ");
  const draw = LATTICE[base] ? LATTICE[base](model) : (G[model] ?? G.Heisenberg)();
  // A t12 tab: the lattice with its next-nearest hoppings dashed.
  return svg(draw + (rest.includes("t12") ? diag("g-dashA") + `<text class="g-t" x="35" y="25">t′</text>` : ""), cls);
}

// --------------------------------------------------------------------------------- markup
export function heroHtml({ models, energies, open, instances }) {
  const nodes = models.map(m => `<a class="pk-node" href="#h-${pickerSlug(m.model)}" data-slug="${pickerSlug(m.model)}">${modelGlyph(m.model)}<span class="pk-nm">${m.name}</span></a>`).join("\n");
  return `<section class="pk-hero" id="pick">
  <button class="pk-whatis" type="button" id="pk-whatis" aria-expanded="false" aria-controls="pk-about"><span>?</span><b class="pk-wi-all">What is QMBL?</b><b class="pk-wi-op">What is QMBL: Open Problems?</b></button>
  <div class="pk-about" id="pk-about" hidden>
    <button class="pk-x" type="button" id="pk-about-x" aria-label="Close">&times;</button>
    <h2>What is QMBL?</h2>
    <p>QMBL is a live record book of the state of the art in quantum many-body simulation. Browse through the leaderboard figures interactively or look at the pure data in the <a href="/instances/">table</a>.</p>
    <p>Scientists and AI systems should use the shared results to build on each other's work more efficiently and advance frontier science.</p>
    <p>Simulation code is linked if available.</p>
    <p>Anyone can add a result.</p>
    <p><a href="/rules/">Read the rules</a> &middot; <a href="/contribute/">Add a result</a></p>
  </div>
  <div class="pk-about" id="pk-about-op" hidden>
    <button class="pk-x" type="button" aria-label="Close">&times;</button>
    <h2>What is QMBL: Open Problems?</h2>
    <p>QMBL: Open Problems is a live record book of the state of the art in quantum many-body simulation for problems with no exact ground-state energy. Browse through the figures interactively or look at the pure data in the <a href="/instances/?open">table</a>.</p>
    <p>Scientists and AI systems should use the shared results to build on each other's work more efficiently and advance frontier science.</p>
    <p>The record value is the bar to beat. Submit a trained state, and QMBL re-measures it with its own verifier before it is listed.</p>
    <p>Simulation code is linked if available.</p>
    <p>Anyone can enter.</p>
    <p><a href="${OP_README}#how-to-enter">How to enter</a> &middot; <a href="${OP_README}#scoring">Scoring</a> &middot; <a href="${OP_README}#use-qmbl-open-problems-with-your-agent">For agents</a></p>
  </div>
  <div class="pk-stage" id="pk-stage">
    <div class="pk-center"><h1>Pick your quantum problem</h1>
      <p class="pk-say" id="pk-say" aria-live="polite"><span class="pk-heads"><span class="pk-h-all">${models.length} Hamiltonians, ${energies.toLocaleString("en")} energies.</span><span class="pk-h-op">${models.length} Hamiltonians, ${(open ?? 0).toLocaleString("en")} of ${(instances ?? 0).toLocaleString("en")} instances still open.</span></span><br><span class="pk-k">Point at one to read it, click to see its results.</span></p></div>
${nodes}
  </div>
  <noscript><p class="pk-noscript">The picker needs JavaScript. Every energy is in the <a href="/instances/">table</a>.</p></noscript>
</section>
<section class="pk-view" id="pk-view" hidden></section>`;
}

// ------------------------------------------------------------------------------------ css
export const HERO_CSS = `
:root { --pk-v: #2a78d6; --pk-p: #eb6834; --pk-e: #1baf7a; --pk-x: #eda100; --pk-math: "STIX Two Math", "Latin Modern Math", "Cambria Math", math, serif; }
@media (prefers-color-scheme: dark) { :root { --pk-v: #3987e5; --pk-p: #d95926; --pk-e: #199e70; --pk-x: #c98500; } }
.pk-hero, .pk-view { position: relative; }
.pk-hero math, .pk-view math { font-family: var(--pk-math); font-size: 1.08em; }
.pk-whatis { position: absolute; top: 0.4rem; right: 0; z-index: 5; display: flex; align-items: center; gap: 0.45rem; border: 1px solid var(--grid); background: var(--surface); border-radius: 999px; padding: 0.25rem 0.8rem 0.25rem 0.3rem; cursor: pointer; font: inherit; font-size: 0.85rem; color: var(--ink2); }
.pk-whatis span { width: 22px; height: 22px; border-radius: 50%; border: 1px solid var(--ink2); display: grid; place-items: center; font-family: var(--serif); font-weight: 600; font-size: 0.85rem; }
.pk-whatis:hover { border-color: var(--accent); color: var(--accent); }
.pk-about { position: absolute; top: 2.9rem; right: 0; z-index: 6; width: min(400px, 100%); background: var(--surface); border: 1px solid var(--grid); border-radius: 10px; padding: 1rem 1.2rem; box-shadow: 0 10px 30px rgb(0 0 0 / 0.12); font-size: 0.92rem; color: var(--ink2); }
.pk-about h2 { font-size: 1.15rem; margin: 0 0 0.4rem; color: var(--ink); }
.pk-about p { margin: 0.55rem 0; }
.pk-x { position: absolute; top: 0.4rem; right: 0.6rem; border: 0; background: none; cursor: pointer; font-size: 1.3rem; color: var(--muted); }
.pk-stage { position: relative; height: 660px; }
.pk-stage::before { content: ""; position: absolute; left: 11%; right: 11%; top: 12%; bottom: 12%; border: 1px dashed var(--grid); border-radius: 50%; pointer-events: none; }
.pk-center { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: min(440px, 48%); text-align: center; z-index: 2; }
.pk-center h1 { font-size: clamp(1.8rem, 3.4vw, 2.6rem); line-height: 1.12; margin: 0; text-wrap: balance; }
.pk-center .pk-big { width: 84px; height: 84px; margin: 0 auto 0.5rem; display: block; }
.pk-say { margin: 0.9rem auto 0; min-height: 7.2em; color: var(--ink2); font-size: 0.95rem; max-width: none; }
.pk-say .pk-f { display: block; color: var(--ink); margin-top: 0.5rem; overflow-x: auto; }
.pk-k { font-family: var(--mono); font-size: 0.78rem; color: var(--muted); }
.pk-row { display: flex; gap: 0.8rem; justify-content: center; flex-wrap: wrap; margin-top: 0.8rem; }
.pk-pill { border: 1px solid var(--ink); background: var(--ink); color: var(--bg); border-radius: 999px; padding: 0.35rem 1rem; cursor: pointer; font: inherit; font-size: 0.9rem; }
.pk-link { border: 0; background: none; color: var(--accent); cursor: pointer; text-decoration: underline; text-underline-offset: 2px; font: inherit; font-size: 0.9rem; padding: 0.35rem 0; }
.pk-node { position: absolute; left: 0; top: 0; transform: translate3d(-300px, -300px, 0); will-change: transform; display: flex; flex-direction: column; align-items: center; gap: 0.3rem; padding: 0.3rem; color: var(--ink); text-decoration: none; z-index: 3; background: none; border: 0; cursor: pointer; font: inherit; }
.pk-glyph { width: 64px; height: 64px; display: block; }
.pk-glyph * { vector-effect: non-scaling-stroke; }
.pk-node .pk-glyph { background: var(--surface); border: 1px solid var(--grid); border-radius: 50%; padding: 7px; width: 78px; height: 78px; transition: border-color .3s, transform .3s cubic-bezier(.2,.7,.2,1), opacity .3s; }
.pk-node.on .pk-glyph { border-color: var(--accent); transform: scale(1.08); }
.pk-stage.hovering .pk-node:not(.on) .pk-glyph, .pk-stage.hovering .pk-node:not(.on) .pk-nm { opacity: 0.45; }
.pk-nm { font-family: var(--mono); font-size: 0.78rem; letter-spacing: 0.02em; max-width: 10em; text-align: center; line-height: 1.25; transition: opacity .3s, color .3s; }
.pk-nm.pk-serif { font-family: var(--serif); font-size: 0.98rem; letter-spacing: 0; }
.pk-node .pk-ct { font-family: var(--mono); font-size: 0.68rem; color: var(--muted); }
.pk-node.on .pk-nm { color: var(--accent); }
/* The Open Problems switch (html.op-on, set in place by OP_SWITCH_SCRIPT): the count badges pop in
   one after another, what has no open problem fades, solved instances grey out in the chart. */
@property --pk-c { syntax: "<color>"; inherits: true; initial-value: #898781; }
.pk-badge { position: absolute; top: 0; right: calc(50% - 46px); min-width: 1.5rem; padding: 0 0.35rem; border-radius: 999px; background: var(--flag); color: #fff; font-family: var(--mono); font-size: 0.66rem; line-height: 1.25rem; text-align: center; box-shadow: 0 0 0 2px var(--bg); pointer-events: none;
  transform: scale(0); opacity: 0; transition: transform .5s cubic-bezier(.34,1.56,.64,1) calc(var(--i, 0) * 30ms), opacity .25s ease calc(var(--i, 0) * 30ms); }
.op-on .pk-badge { transform: scale(1); opacity: 1; }
.pk-done .pk-glyph, .pk-done .pk-nm, .pk-done .pk-ct, .pk-tab { transition: opacity .5s ease, border-color .3s, transform .3s cubic-bezier(.2,.7,.2,1); }
.op-on .pk-done .pk-glyph, .op-on .pk-done .pk-nm, .op-on .pk-done .pk-ct, .op-on .pk-tab.pk-done { opacity: 0.3; }
.pk-tab { position: relative; }
.pk-tab .pk-badge { top: -0.55rem; right: -0.4rem; }
.pk-heads { display: inline-grid; }
.pk-heads > span { grid-area: 1 / 1; transition: opacity .45s ease; }
.pk-h-op, .op-on .pk-h-all { opacity: 0; }
.op-on .pk-h-op { opacity: 1; }
.pk-whatis b { font-weight: inherit; }
.pk-wi-op, .op-on .pk-wi-all { display: none; }
.op-on .pk-wi-op { display: inline; }
.pk-pt { --pk-c: var(--pk-k); transition: --pk-c .5s ease; }
.op-on .pk-pt.pk-solved { --pk-c: var(--grid); }
.pk-lgd .pk-lg-solved { opacity: 0; transition: opacity .45s ease; }
.op-on .pk-lgd .pk-lg-solved { opacity: 1; }
.op-on .pk-lgd .pk-lg-only-solved { display: none; }
/* the size figure draws only exactly solved instances: not offered while marking open problems */
.op-on .pk-more-l[aria-controls="pk-p-size"], .op-on #pk-p-size { display: none; }
.pk-noscript { text-align: center; color: var(--ink2); }
.g-l { stroke: var(--ink2); stroke-width: 1; fill: none; }
.g-d { fill: var(--ink); }
.g-h { fill: var(--surface); stroke: var(--ink); stroke-width: 1.1; }
.g-a { stroke: var(--accent); stroke-width: 1.3; fill: none; stroke-linecap: round; stroke-linejoin: round; }
.g-dash { stroke: var(--muted); stroke-width: 1; stroke-dasharray: 2 2; fill: none; }
.g-dashA { stroke: var(--accent); stroke-width: 1; stroke-dasharray: 2 2; fill: none; }
.g-thick { stroke: var(--accent); stroke-width: 2.6; stroke-linecap: round; }
.g-x { stroke: var(--pk-v); stroke-width: 1.6; } .g-y { stroke: var(--pk-x); stroke-width: 1.6; } .g-z { stroke: var(--pk-e); stroke-width: 1.6; }
.g-t { fill: var(--muted); font-family: var(--serif); font-style: italic; font-size: 8px; }

.pk-crumb { display: flex; flex-wrap: wrap; align-items: center; gap: 0.4rem 0.9rem; padding-block: 0.4rem; font-size: 0.9rem; color: var(--muted); }
.pk-title { display: flex; gap: 1.2rem; align-items: center; margin-top: 0.6rem; flex-wrap: wrap; }
.pk-title .pk-glyph { width: 76px; height: 76px; border: 1px solid var(--grid); border-radius: 50%; padding: 8px; background: var(--surface); flex: none; }
.pk-title h2 { font-size: 2rem; margin: 0 0 0.3rem; }
.pk-title > div { min-width: 0; flex: 1 1 16rem; }
.pk-math { overflow-x: auto; max-width: 100%; scrollbar-width: none; }
/* A flex box sizes the block formula to its content, so it starts at the left edge instead of centring. */
.pk-math { display: flex; }
.pk-math math { flex: none; margin: 0; }
@media (max-width: 560px) { .pk-title > div { flex-basis: 100%; } }
.pk-math::-webkit-scrollbar { display: none; }
.pk-math.pk-ovf { -webkit-mask-image: linear-gradient(to right, #000 calc(100% - 2.5rem), transparent); mask-image: linear-gradient(to right, #000 calc(100% - 2.5rem), transparent); }
.pk-title math { font-size: 1.2em; }
.pk-desc { color: var(--ink2); margin: 0.9rem 0 0; }
.pk-tabs { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1.3rem; }
.pk-tab { display: flex; align-items: center; gap: 0.5rem; border: 1px solid var(--grid); background: var(--surface); border-radius: 999px; padding: 0.25rem 0.9rem 0.25rem 0.3rem; cursor: pointer; font: inherit; font-size: 0.92rem; color: var(--ink2); }
.pk-tab .pk-glyph { width: 30px; height: 30px; }
.pk-tab i { font-style: normal; font-size: 0.72rem; color: var(--muted); font-family: var(--mono); }
.pk-tab[aria-selected="true"] { border-color: var(--accent); color: var(--ink); box-shadow: inset 0 0 0 1px var(--accent); }
.pk-filters { display: grid; gap: 0.55rem; margin-top: 1rem; padding: 0.9rem 1rem; border: 1px solid var(--grid); border-radius: 10px; background: var(--surface); }
.pk-fg { display: flex; flex-wrap: wrap; gap: 0.35rem 0.4rem; align-items: center; }
.pk-lab { font-family: var(--mono); font-size: 0.78rem; color: var(--muted); width: 7.5rem; flex: none; }
.pk-fixed { font-size: 0.85rem; color: var(--ink2); }
.pk-chip { border: 1px solid var(--grid); background: var(--bg); border-radius: 999px; padding: 0.12rem 0.65rem; cursor: pointer; font: inherit; font-size: 0.85rem; font-variant-numeric: tabular-nums; color: var(--ink2); }
.pk-chip:hover { border-color: var(--accent); }
.pk-chip[aria-pressed="true"] { background: var(--accent); border-color: var(--accent); color: var(--bg); }
.pk-chip i { font-style: normal; opacity: 0.6; font-size: 0.75em; margin-left: 0.25em; }
.pk-chipmore { border: 0; background: none; color: var(--accent); font: inherit; font-size: 0.85rem; cursor: pointer; padding: 0.12rem 0.4rem; }
.pk-find { font: inherit; font-size: 0.85rem; padding: 0.15rem 0.6rem; border: 1px solid var(--grid); border-radius: 999px; background: var(--surface); color: var(--ink); min-width: 17rem; }
.pk-chart { margin-top: 1rem; overflow-x: auto; }
.pk-chart svg { width: 100%; height: auto; display: block; border: 1px solid var(--grid); border-radius: 3px; background: var(--surface); }
.pk-ax { stroke: var(--grid); }
.pk-tk { fill: var(--muted); font-family: var(--mono); font-size: 11px; }
.pk-axl { fill: var(--ink2); font-size: 12px; }
.pk-pt { cursor: pointer; }
.pk-pt:hover circle:last-of-type { stroke: var(--ink); }
.pk-lgd { display: flex; flex-wrap: wrap; gap: 0.3rem 1.1rem; font-size: 0.82rem; color: var(--ink2); margin-top: 0.8rem; }
.pk-lgd span::before { content: ""; display: inline-block; width: 9px; height: 9px; border-radius: 50%; background: var(--c); margin-right: 0.4rem; }
.pk-lgd .pk-fl::before { background: none; border: 2px solid var(--ink2); width: 7px; height: 7px; }
.pk-cap { color: var(--muted); font-size: 0.85rem; margin-top: 0.6rem; }
#pk-tip { position: fixed; z-index: 10; pointer-events: none; max-width: 24rem; padding: 0.55rem 0.75rem; font-size: 0.82rem; line-height: 1.45; color: var(--ink); background: var(--surface); border: 1px solid var(--grid); border-radius: 3px; box-shadow: 0 6px 20px rgb(0 0 0 / 0.14); }
#pk-tip > b, #pk-tip > span { display: block; }
#pk-tip .e { margin: 0.2rem 0; }
#pk-tip .e .num { font-weight: 600; color: var(--record); }
#pk-tip .go { margin-top: 0.3rem; font-size: 0.75rem; color: var(--accent); }

.pk-more-wrap { border-top: 1px solid var(--grid); margin-top: 6rem; padding-top: 2.2rem; }
.pk-more { display: flex; flex-wrap: wrap; gap: 0.6rem 2rem; justify-content: center; }
.pk-more-l { border: 0; background: none; padding: 0.2rem 0; cursor: pointer; color: var(--muted); font: inherit; font-size: 0.98rem; text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 3px; display: inline-flex; align-items: center; gap: 0.35em; }
.pk-more-l:hover, .pk-more-l[aria-expanded="true"] { color: var(--ink2); }
/* a small up-right arrow that turns to point down while its panel is open */
.pk-more-l::after { content: ""; width: 0.55em; height: 0.55em; flex: none; background: currentColor; transition: transform .25s cubic-bezier(.2,.7,.2,1);
  -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'%3E%3Cpath d='M2 8L8 2M3.5 2H8V6.5' fill='none' stroke='black' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center / contain no-repeat;
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'%3E%3Cpath d='M2 8L8 2M3.5 2H8V6.5' fill='none' stroke='black' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center / contain no-repeat; }
.pk-more-l[aria-expanded="true"]::after { transform: rotate(135deg); }
.pk-panel { margin-top: 1.4rem; }
.pk-panel > .tabs > h2:first-child { display: none; }

@media (max-width: 720px) {
  .pk-stage { height: auto; display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; padding-top: 3rem; }
  .pk-stage::before { display: none; }
  .pk-center { position: static; transform: none; width: auto; grid-column: 1 / -1; margin-bottom: 0.6rem; }
  .pk-say { min-height: 0; }
  .pk-node { position: relative; transform: none !important; border: 1px solid var(--grid); border-radius: 10px; background: var(--surface); padding: 0.6rem 0.4rem; }
  .pk-node .pk-glyph { width: 56px; height: 56px; padding: 4px; border: 0; }
  .pk-stage.hovering .pk-node:not(.on) .pk-glyph, .pk-stage.hovering .pk-node:not(.on) .pk-nm { opacity: 1; }
  .pk-lab { width: 100%; }
  .pk-stage > .pk-node:last-child:nth-child(even) { grid-column: 1 / -1; }
  .pk-more-wrap { margin-top: 3rem; }
}
@media (prefers-reduced-motion: reduce) { .pk-node .pk-glyph, .pk-nm, .pk-more-l::after, .pk-badge, .pk-tab, .pk-ct, .pk-heads > span, .pk-pt, .pk-lg-solved { transition: none !important; } }
`;
