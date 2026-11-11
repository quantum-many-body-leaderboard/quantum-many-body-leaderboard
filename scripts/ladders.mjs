// The size ladders: instances of one Hamiltonian that differ only in their size. The size
// figures (size_accuracy.mjs) draw one panel per ladder and the site switches between
// them. They are grouped from the instances rather than listed by hand, so a new size of
// a Hamiltonian joins its ladder and a Hamiltonian published at a second size gets one.
//
// A ladder is one model, lattice, boundary and set of couplings: J2, h, U, V, the filling
// per site (not Nf, which grows with the size) and any named variant in the instance id
// (t12, UV1V2). Clusters of one lattice share a ladder (kagome-36a and kagome-8x8 are both
// kagome); rectangles share one at the same first side, so a ladder of rectangles grows in
// length at fixed width, and at the same aspect ratio where no two widths match (the 1:2
// Heisenberg cylinders). An impurity "lattice" names the impurity problem (TB-DMFT-SOC) and
// is kept whole.
//
// Ladders sharing model and lattice are one figure (an impurity problem's lattice is its
// first two words), and the site shows one figure at a time behind two rows of badges, the
// model and then the lattice: one badge per figure rather than per ladder, as the ladders of
// a figure differ only in boundary and couplings.
//
// pickerFacets() splits the instances the same way for the front page's picker (hero.mjs).
import { MODELS, BOUNDARY } from "./readme_table.mjs";
import { groundStateExact } from "./units.mjs";

// A coupling as labels print it: R to six figures (params.R holds the unrounded bond length since 2026-11-11).
const shown = (k, v) => (k === "R" ? +(+v).toPrecision(6) : v);
const COUPLINGS = ["J2", "J3", "K", "J", "Gamma", "Jd", "h", "U", "V", "t2", "t3", "rs", "R", "basis"]; // t2: the t12 variants at more than one t2; J, t3: t-J; R, basis: track 3

// Particles per site: Hubbard files carry Nf = N_up = N_dn, t-V is spinless.
// The electron gas (track 2) has no filling; its spin polarization zeta = (N_up - N_dn) / N plays
// that part in a ladder, since N_up and N_dn grow with N.
const zetaOf = inst => /^HEG/.test(inst.model) ? Number(((inst.params.N_up - inst.params.N_dn) / inst.n_sites).toFixed(4)) : null;
// tJ carries N_up and N_dn: its filling is (N_up + N_dn) / N (RULES.md 2.1, 2026-10-22).
const tjFill = inst => inst.model === "tJ" && inst.params?.N_up != null ? (inst.params.N_up + inst.params.N_dn) / inst.n_sites : null;
const fillingOf = inst => zetaOf(inst) != null ? zetaOf(inst) : tjFill(inst) != null ? Number(tjFill(inst).toFixed(4)) : inst.params?.Nf == null ? null
  : Number(((inst.model === "Hubbard" ? 2 : 1) * inst.params.Nf / inst.n_sites).toFixed(4));
const fillingLabel = inst => {
  if (zetaOf(inst) != null) return `ζ = ${zetaOf(inst)}`;
  const f = fillingOf(inst), exact = tjFill(inst) ?? (inst.model === "Hubbard" ? 2 : 1) * inst.params.Nf / inst.n_sites;
  return `n ${f === exact ? "=" : "≈"} ${f}`;
};
const latticeOf = inst => (inst.model === "Impurity" ? inst.lattice.split("-").slice(0, 2).join("-") : inst.lattice.replace(/-.*$/, ""));
const sidesOf = inst => inst.lattice.match(/^rectangular-(\d+)x(\d+)$/)?.slice(1).map(Number) ?? null;
// A coupling written into the id (K-1, J0.5, G0.5, J3-0.1, Jd1), and a t-J coupling or hole count
// (J0.4, tp0.3, tpp-0.2, h2), is a coupling or the filling, labelled from params, not a variant.
const variantsOf = inst => inst.instance_id.split("/")[1].split("_").slice(2)
  .filter(s => /[A-Za-z]/.test(s) && !(s in BOUNDARY) && s !== "P" && !/^(K|J|G|J3|Jd)-?[\d.]+$/.test(s) &&
    !(inst.model === "tJ" && /^(J|tp|tpp|h)-?[\d.]+$/.test(s)) &&
    // Track 3: the bond length (R1.8) and the basis token (sto6g) are in params, labelled from there.
    !(/^H(chain|sheet)$/.test(inst.model) && (/^R[\d.]+$/.test(s) || s === inst.instance_id.split("_").pop())));
const gcd = (a, b) => (b ? gcd(b, a % b) : a);

// The rows a figure draws: a bound, a projection, an extrapolation or a ground-state exact
// energy. A flagged row is drawn too, with a slashed mark, so the reader sees the number and
// that it is contested; RULES.md 6.1 keeps it off the record line. A row flagged
// wrong-instance is not drawn, as its energy belongs to another instance. Rows without a bound type are not, nor the minimum of a sector other than
// the ground state's, which the build moves to the instance's `spectrum` (DATA.md).
const BOUNDS = new Set(["variational", "projected", "extrapolated", "approximate"]);
export const drawnRows = inst => inst.rows.filter(r => r.defect?.flag !== "wrong-instance" && (r.bound_type === "exact" ? groundStateExact(r) : BOUNDS.has(r.bound_type)));

export const modelName = model => MODELS.find(([m]) => m === model)?.[1] ?? model;

// The words for a ladder's couplings, empty for a Heisenberg model: "J2 = 0.5",
// "U = 8, n = 0.875", "4 × L, U = 8, n = 0.875", "L × 2L". The boundary leads where the
// figure has more than one, and an impurity problem's full name where its figure holds several.
// With `omit`, that coupling (or the filling, "n") is left out: a facet's label names what its
// stops share, not the axis they differ in.
function couplingLabel(inst, { boundary, lattice, shape, omit, t12 }) {
  const parts = [];
  if (lattice) parts.push(inst.lattice);
  if (boundary) parts.push(BOUNDARY[inst.boundary] ?? "periodic");
  if (shape) parts.push(shape.label);
  for (const k of COUPLINGS) if (k !== omit && inst.params?.[k] != null) parts.push(k === "basis" && inst.params[k] === "none" ? "basis-free" : `${k} = ${shown(k, inst.params[k])}`);
  if (omit !== "n" && fillingOf(inst) != null) parts.push(fillingLabel(inst));
  return [...parts, ...variantsOf(inst).filter(v => !(t12 && v === "t12"))].join(", ");
}

// A rectangle's ladder: its width, or its aspect ratio where no other size shares the width.
function rectangleShapes(instances) {
  const shapes = new Map();
  const base = i => [i.model, i.boundary, ...COUPLINGS.map(k => i.params?.[k]), fillingOf(i), ...variantsOf(i)].join("|");
  const rects = instances.filter(sidesOf);
  for (const ms of Map.groupBy(rects, i => `${base(i)}|${sidesOf(i)[0]}`).values()) {
    const oneSize = new Set(ms.map(i => i.n_sites)).size < 2;
    for (const i of ms) {
      const [a, b] = sidesOf(i), g = gcd(a, b), m = s => (s / g === 1 ? "L" : `${s / g}L`);
      shapes.set(i, oneSize ? { key: `${a / g}:${b / g}`, label: `${m(a)} × ${m(b)}` } : { key: `W${a}`, label: `${a} × L` });
    }
  }
  return shapes;
}

// The figure's lattice badge, "square", "kagome", "TB-DMFT", with the boundary where all
// of its ladders share a non-periodic one.
// A t12 variant (next-nearest hopping, DATA.md) is a figure of its own beside its lattice's,
// so a t2 series gets its own slider and leaves the lattice's figure as it was.
const t12Of = inst => variantsOf(inst).includes("t12");
const latticeLabel = (inst, oneBoundary) => [latticeOf(inst) + (t12Of(inst) ? ", t12" : ""), oneBoundary && BOUNDARY[inst.boundary]].filter(Boolean).join(", ");

// A model name that already ends in the lattice ("Hydrogen chain", lattice "chain") does not repeat it.
const figureTitle = (inst, oneBoundary) => {
  const name = modelName(inst.model), lat = latticeLabel(inst, oneBoundary), head = lat.split(",")[0];
  return name.endsWith(` ${head}`) ? `${name}${lat.slice(head.length)}` : `${name} ${lat}`;
};

// Every figure, in model order and then by energies, most first; each with its ladders
// ordered by their couplings. Ladders are not filtered here: which of them have enough to
// draw is the figure script's call, and the site reads which figures exist off figures/size/.
export function ladderFigures(instances) {
  const shapes = rectangleShapes(instances);
  const baseKey = i => `${i.model}--${latticeOf(i)}`;
  const figKey = i => `${baseKey(i)}${t12Of(i) ? "--t12" : ""}`;
  const ladderKey = i => [i.model === "Impurity" ? i.lattice : "", i.boundary, shapes.get(i)?.key, ...COUPLINGS.map(k => i.params?.[k]), fillingOf(i), ...variantsOf(i)].join("|");
  const order = i => [Object.keys(BOUNDARY).indexOf(i.boundary), -(fillingOf(i) ?? 0), +(sidesOf(i)?.[0] ?? 0), ...COUPLINGS.map(k => i.params?.[k] ?? 0)];
  const cmp = (a, b) => { const x = order(a), y = order(b); for (let k = 0; k < x.length; k++) if (x[k] !== y[k]) return x[k] - y[k]; return 0; };
  const energies = is => is.reduce((a, i) => a + i.rows.length, 0);
  // A t12 figure sorts right after its lattice's figure, which sorts by its own energies.
  const baseEnergies = new Map([...Map.groupBy(instances.filter(i => !t12Of(i)), baseKey)].map(([k, ms]) => [k, energies(ms)]));
  return [...Map.groupBy(instances, figKey)].map(([key, members]) => {
    const oneBoundary = new Set(members.map(i => i.boundary)).size === 1;
    const oneLattice = new Set(members.map(i => i.lattice)).size === 1 || members[0].model !== "Impurity";
    return {
      name: `size/${key.replace(/[^\w.-]/g, "_")}`,
      model: members[0].model,
      label: latticeLabel(members[0], oneBoundary),
      title: figureTitle(members[0], oneBoundary),
      energies: energies(members),
      base: baseEnergies.get(baseKey(members[0])) ?? energies(members), t12: t12Of(members[0]),
      flags: { boundary: !oneBoundary, lattice: !oneLattice, t12: t12Of(members[0]) },
      ladders: [...Map.groupBy(members, ladderKey).values()]
        .map(ms => ({ label: couplingLabel(ms[0], { boundary: !oneBoundary, lattice: !oneLattice, shape: shapes.get(ms[0]), t12: t12Of(ms[0]) }),
          shape: shapes.get(ms[0]), members: [...ms].sort((a, b) => a.n_sites - b.n_sites) }))
        .sort((a, b) => cmp(a.members[0], b.members[0])),
    };
  }).sort((a, b) => MODELS.findIndex(([m]) => m === a.model) - MODELS.findIndex(([m]) => m === b.model) ||
    b.base - a.base || a.t12 - b.t12 || a.name.localeCompare(b.name));
}

// The front page's picker (hero.mjs): every instance with a drawn row, with the badges a reader
// picks it by, split as ladderFigures splits it: the lattice tab first (a t12 variant its own
// tab), then boundary, rectangle shape, the impurity problem, each coupling, the filling and any
// other variant. Each badge is [name, label, order]. One source with the figures, so the picker
// names a Hamiltonian as the figures and the table do.
export function pickerFacets(instances) {
  const shapes = rectangleShapes(instances);
  return instances.filter(i => drawnRows(i).length).map(i => {
    const dims = [["boundary", BOUNDARY[i.boundary] ?? "periodic", Math.max(0, Object.keys(BOUNDARY).indexOf(i.boundary) + 1)]];
    const shape = shapes.get(i);
    if (shape) dims.push(["shape", shape.label, sidesOf(i)?.[0] ?? 0]);
    if (i.model === "Impurity") dims.push(["problem", i.lattice, i.lattice]);
    for (const k of COUPLINGS) {
      const v = i.params?.[k];
      if (v != null) dims.push([k === "R" ? "R (bohr)" : k, k === "basis" && v === "none" ? "basis-free" : String(shown(k, v)), v]);
    }
    const f = fillingOf(i);
    if (f != null) dims.push([zetaOf(i) != null ? "ζ" : "filling n", String(f), f]);
    const v = variantsOf(i).filter(x => x !== "t12");
    if (v.length) dims.push(["variant", v.join(", "), v.join(", ")]);
    return { inst: i, tab: latticeLabel(i, false), dims };
  });
}
