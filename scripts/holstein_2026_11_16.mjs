// Generator of passes/rows/sweep-rows-2026-11-16-holstein.json: the first rows of the Holstein and
// Hubbard-Holstein families (RULES.md 2.1 and 5, 2026-11-11), and the instances they create.
//
// Every number below is copied from the committed source text (sources/<id>.txt) as printed, and this
// script stops unless it finds the printed string on (or within five lines of) its cited line (line
// numbers as grep -n counts them). It fixes only the normalisation, the printed error bar, the
// instance and the source's conventions. The readings, their checks and what was held are in
// SWEEP.md (2026-11-16).
//
// Conventions (RULES.md 2.1): H = -t sum (c+c + h.c.) + w sum b+b + g sum n_i (b+ + b) [+ U sum n_up n_dn],
// t = 1. Per source, CONV states the source's Hamiltonian and SRC its parameters in the source's
// own units:
// - t_src: the hopping in the source's energy unit; the loader divides the energy by it (`scale`).
// - the coupling: g printed, or a dimensionless coupling converted with the source's own definition
//   (LAMBDA below names each definition and the line that states it).
// - rho: the source couples to (n_i - rho). zp: its phonon term is w (b+b + 1/2).
// The constant E_instance - E_source (in units of t) = -2 g^2 rho N_e / w + g^2 rho^2 N / w - zp w N / 2
// goes on the row as `shift` (scripts/add_allresults_rows.mjs; DATA.md `converted`).
// checks/holstein-ed-2026-11/ diagonalizes both forms and reproduces the rule.
//
// usage: node scripts/holstein_2026_11_16.mjs   (writes the pass file; the build applies it)
import fs from "node:fs";

const OUT = "passes/rows/sweep-rows-2026-11-16-holstein.json";
const fmt = x => String(+(+x).toPrecision(6));

// --- references (titles from Crossref, or from the first page of the committed text) ---------
const REF = {
  "2405.08701": { pr: true, ref: "Mahajan, Robinson, Lee & Reichman, Structure and dynamics of electron-phonon coupled systems using neural quantum states, Phys. Rev. B 112, 184310 (2025), doi:10.1103/p8qz-p45d, arXiv:2405.08701", version: "version read: arXiv text (sources/2405.08701.txt); the journal version was not reached from this session, to be read on the verification pass (RULES.md 8)" },
  "cond-mat/9512046": { pr: true, ref: "McKenzie, Hamer & Murray, Quantum Monte Carlo study of the one-dimensional Holstein model of spinless fermions, Phys. Rev. B 53, 9676 (1996), doi:10.1103/PhysRevB.53.9676, arXiv:cond-mat/9512046", version: "version read: arXiv text (sources/cond-mat-9512046.txt); the journal version was not reached from this session, to be read on the verification pass (RULES.md 8)" },
  "1403.4150": { pr: true, ref: "Ohgoe & Imada, Variational Monte Carlo method for electron-phonon coupled systems, Phys. Rev. B 89, 195139 (2014), doi:10.1103/PhysRevB.89.195139, arXiv:1403.4150", version: "version read: arXiv text (sources/1403.4150.txt); the journal version was not reached from this session, to be read on the verification pass (RULES.md 8)" },
  "2011.07412": { pr: true, ref: "Stolpp, K\u00f6hler, Manmana, Jeckelmann, Heidrich-Meisner & Paeckel, Comparative study of state-of-the-art matrix-product-state methods for lattice models with large local Hilbert spaces without U(1) symmetry, Comput. Phys. Commun. 269, 108106 (2021), doi:10.1016/j.cpc.2021.108106, arXiv:2011.07412", version: "version read: arXiv text (sources/2011.07412.txt); the journal version was not reached from this session, to be read on the verification pass (RULES.md 8)" },
  "1306.4751": { pr: true, ref: "Chakraborty, Tezuka & Min, Interacting-Holstein and extended-Holstein bipolarons, Phys. Rev. B 89, 035146 (2014), doi:10.1103/PhysRevB.89.035146, arXiv:1306.4751", version: "version read: arXiv text (sources/1306.4751.txt); the journal version was not reached from this session, to be read on the verification pass (RULES.md 8)" },
  "2012.13473": { pr: true, ref: "Lee, Zhang & Reichman, Constrained-path auxiliary-field quantum Monte Carlo for coupled electrons and phonons, Phys. Rev. B 103, 115123 (2021), doi:10.1103/PhysRevB.103.115123, arXiv:2012.13473", version: "version read: arXiv text (sources/2012.13473.txt); the journal version was not reached from this session, to be read on the verification pass (RULES.md 8)" },
  "cond-mat/9710321": { pr: true, ref: "Romero, Brown & Lindenberg, Converging toward a practical solution of the Holstein molecular crystal model, J. Chem. Phys. 109, 6540 (1998), doi:10.1063/1.477305, arXiv:cond-mat/9710321", version: "version read: arXiv text (sources/cond-mat-9710321.txt); the journal version was not reached from this session, to be read on the verification pass (RULES.md 8)" },
  "cond-mat/9812252": { pr: true, ref: "Bon\u010da, Trugman & Batisti\u0107, Holstein polaron, Phys. Rev. B 60, 1633 (1999), doi:10.1103/PhysRevB.60.1633, arXiv:cond-mat/9812252 (arXiv title: The Holstein Polaron)", version: "version read: arXiv text (sources/cond-mat-9812252.txt); the journal version was not reached from this session, to be read on the verification pass (RULES.md 8)" },
};
// A number the source prints as another person's unpublished calculation is `quoted` and cites that
// person through the paper that printed it (RULES.md 8, private communication).
const PRIVATE = { "cond-mat/9812252": "H. Fehske, private communication: exact diagonalization of the 16-site chain, printed in Bonča, Trugman & Batistić, Holstein polaron, Phys. Rev. B 60, 1633 (1999), Table I and Ref. [26], doi:10.1103/PhysRevB.60.1633, arXiv:cond-mat/9812252" };

// --- dimensionless couplings -> g, each with the definition its source states ----------------
// [definition as printed, g from the coupling given w and t = 1 (and the lattice's coordination z)]
const LAMBDA = {
  "g2/(2tw)": (l, w) => Math.sqrt(2 * l * w),     // λ = g²/(2tω), the 1D convention (t = 1)
  "g2/(2dtw)": (l, w, d) => Math.sqrt(2 * d * l * w), // λ = g²/(2dtω) = g²/(ωW), W = 4dt
  "g2/w": (l, w) => Math.sqrt(l * w),             // E_p = g²/ω in units of t
  "2g2/w": (l, w) => Math.sqrt(l * w / 2),
  "g2/(2w)": (l, w) => Math.sqrt(2 * l * w),
};

// --- conventions per source ---------------------------------------------------------------
const CONV = {
  "2405.08701": "Eq. (23), line 679: H_eph = g sum_i (c+_i c_i - 1/2)(b+_i + b_i), spinless fermions; H_nu = \u03c90 sum b+b without zero-point energy (lines 151-159); t = 1 (line 164). Table 2 (lines 665-672): energy per site at half filling, \u03c90 = 1, g = 1.5, antiperiodic boundaries for an even and periodic for an odd fermion number (lines 681-682). Coupling to n_i - 1/2: E_instance = E_source - g^2 N / (4\u03c9) at half filling (RULES.md 2.1).",
  "cond-mat/9512046": "Eq. (4), line 72: H = -t sum (c+_i c_i+1 + h.c.) - g sum (c+_i c_i - 1/2)(a_i + a+_i) + \u03c9 sum a+_i a_i, spinless fermions, Eq. (1) with the zero-point energy -N\u03c9/2 removed (line 52); Table I (lines 866-877): E0(N)/N in units of \u03c9 at t = \u03c9, g = 1.5\u03c9, half filling; antiperiodic (periodic) boundaries for an even (odd) fermion number (lines 153-154). The sign of g is a gauge choice (b -> -b). Coupling to n_i - 1/2: E_instance = E_source - g^2 N / (4\u03c9). GFMC with a guiding function chosen positive everywhere (line 379), time steps extrapolated linearly to \u0394\u03c4 = 0 (lines 548-553).",
  // Ohgoe & Imada: one note per table, chosen by the reading's location ("Table I" or "Table II").
  "1403.4150": {
    "Table I": "Eq. (34), lines 331-334, H = -t sum (c+c + h.c.) + U sum n n - g sum (b+_i + b_i) n_i + \u03c9 sum b+b at U = 0, one electron on a 4-site periodic chain (line 341), \u03c9/t = 0.5, \u03bb = g^2/(2t\u03c9) = 1 (line 356), so g = 1; total energies.",
    "Table II": "Eq. (37), lines 489-494, spinless, -g sum (b+_i + b_i)(n_i - 1/2), t = \u03c9, g = 1.5\u03c9 (lines 507-508), energy per site at half filling, antiperiodic (periodic) boundaries for an even (odd) fermion number (lines 432-433): E_instance = E_source - g^2 N / (4\u03c9). The sign of g is a gauge choice (b -> -b).",
  },
  "2011.07412": "Eqs. (1)-(4), lines 125-132: H = -t0 sum (c+_j c_j+1 + h.c.) + \u03c90 sum b+b + \u03b3 sum n_j (b+_j + b_j), spinless fermions; open boundaries (line 142); t0 = 1 (line 147), \u03c90/t0 = 1 and \u03b3/t0 = 0.5, 1.5, 2.0 (lines 149-153); L = 51 sites with N = 25 fermions (lines 795-797); total energies Emin/t0. \u03b3 is the instance's g.",
  "1306.4751": "Eq. (1), lines 46-56: H = -sum (t c+_i,s c_i+1,s + h.c.) + \u03c9 sum a+a + g\u03c9 sum f_j(i) n_i,s (a+_j + a_j) + U sum n n; Holstein for f_j(i) = \u03b4_ij and U = 0; \u03bb = \u03c9 g^2 / (2t) for the Holstein case (Eq. 3, lines 71-75), so the coefficient of n_i(a+ + a) is G = g\u03c9 with \u03bb = G^2/(2t\u03c9); \u03c9 = 1, \u03bb = 0.5 gives G = 1. Table I (lines 110-121): E4 in units of t, four electrons (2 up, 2 down, line 129); SC-VAED in periodic and DMRG in open boundaries (lines 130-132).",
  "2012.13473": "Eqs. (1)-(8), lines 77-92: H = -t sum a+a + U sum n n + \u03c9 sum b+b - g sum n_i (b_i + b+_i), coupling to n_i, no zero-point energy; \u03bb = g^2/(2dt\u03c9) (line 119). Lines 664-672: 1D 4-site chain, periodic boundaries, half filling (4 electrons), \u03bb = 0.5, \u03c9 = 4t, g = 2t, U = 0; total energies in units of t. The sign of g is a gauge choice.",
  "cond-mat/9710321": "Eqs. (1)-(4), lines 88-94: H = -J sum a+_n (a_n+1 + a_n-1) + \u0127\u03c9 sum b+b - g\u0127\u03c9 sum a+_n a_n (b+_n + b_n), one electron, periodic boundaries on N sites (lines 96-97); energies in units of \u0127\u03c9 (Table 1, line 234) at J/\u0127\u03c9 = 1, so t = \u03c9 = 1 and the instance's g is the printed g (1 and \u221a2). Global-Local energies computed on 32-site lattices (line 148).",
  "cond-mat/9812252": "Eq. (1), line 154: H = -t sum (c+_j c_j+1 + H.c.) - \u03bb sum c+_j c_j (a_j + a+_j) + \u03c9 sum a+a, one electron; \u03bb has units of energy (lines 157-163), so the instance's g is \u03bb; t = 1 (lines 1050-1051); Table I at \u03bb = \u03c9 = 1 and \u03bb = \u221a2, \u03c9 = 1. The ED column is H. Fehske's 16-site chain (Ref. [26], lines 1261-1264) with periodic boundaries (line 283: finite chains of N sites with periodic boundary conditions).",
};
// SRC[a] = { t_src, rho, zp, lambda: key of LAMBDA or null (g printed) }
const SRC = {
  "2405.08701": { rho: 0.5 }, "cond-mat/9512046": { rho: 0.5 }, "1403.4150": { rho: 0 }, "2011.07412": {},
  "1306.4751": { lambda: "g2/(2tw)" }, "2012.13473": {}, "cond-mat/9710321": {}, "cond-mat/9812252": {},
};

// --- readings ----------------------------------------------------------------------------
// [source, line, as printed, normalisation ("site" | "total"), model, lattice, n_sites, boundary,
//  particles ("f<N>" | "e<N>"), U (null for Holstein), w, coupling as the source prints it (g or λ),
//  method as published, bound_type, sampled, where, extra]
// extra: quoted (primary in `ref`), cluster (geometry text), note, version, verified_by.
const READINGS = [
  ["2405.08701", 669, "-0.89394(7)", "site", "Holstein", "chain", 4, "A", "f2", null, 1, 1.5, "MLP (this work)", "variational", true, "Table 2, Nsites = 4, column MLP (this work)"],
  ["2405.08701", 670, "-0.8674(2)", "site", "Holstein", "chain", 6, "P", "f3", null, 1, 1.5, "MLP (this work)", "variational", true, "Table 2, Nsites = 6, column MLP (this work)"],
  ["2405.08701", 671, "-0.8606(1)", "site", "Holstein", "chain", 8, "A", "f4", null, 1, 1.5, "MLP (this work)", "variational", true, "Table 2, Nsites = 8, column MLP (this work)"],
  ["2405.08701", 672, "-0.8535(2)", "site", "Holstein", "chain", 16, "A", "f8", null, 1, 1.5, "MLP (this work)", "variational", true, "Table 2, Nsites = 16, column MLP (this work)"],
  ["cond-mat/9512046", 874, "-0.895  ±  0.001", "site", "Holstein", "chain", 4, "A", "f2", null, 1, 1.5, "GFMC (Δτ → 0)", "exact_stochastic", true, "Table I, N = 4, column E0(N)/N"],
  ["cond-mat/9512046", 875, "-0.868  ±  0.001", "site", "Holstein", "chain", 6, "P", "f3", null, 1, 1.5, "GFMC (Δτ → 0)", "exact_stochastic", true, "Table I, N = 6, column E0(N)/N"],
  ["cond-mat/9512046", 876, "-0.861  ±  0.002", "site", "Holstein", "chain", 8, "A", "f4", null, 1, 1.5, "GFMC (Δτ → 0)", "exact_stochastic", true, "Table I, N = 8, column E0(N)/N"],
  ["cond-mat/9512046", 877, "-0.854  ±  0.001", "site", "Holstein", "chain", 16, "A", "f8", null, 1, 1.5, "GFMC (Δτ → 0)", "exact_stochastic", true, "Table I, N = 16, column E0(N)/N"],
  ["1403.4150", 412, "-2.501(1)", "total", "Holstein", "chain", 4, "P", "f1", null, 0.5, 1, "VMC, no e-ph correlation factor", "variational", true, "Table I, column no e-ph correlation factor", {"src": {"rho": 0, "lambda": "g2/(2tw)"}}],
  ["1403.4150", 412, "-2.775(2)", "total", "Holstein", "chain", 4, "P", "f1", null, 0.5, 1, "VMC, P_e-ph, rc = 0", "variational", true, "Table I, column P_e-ph, rc = 0", {"src": {"rho": 0, "lambda": "g2/(2tw)"}}],
  ["1403.4150", 412, "-2.795(1)", "total", "Holstein", "chain", 4, "P", "f1", null, 0.5, 1, "VMC, P_e-ph, rc = 1", "variational", true, "Table I, column P_e-ph, rc = 1", {"src": {"rho": 0, "lambda": "g2/(2tw)"}}],
  ["1403.4150", 412, "-2.796(1)", "total", "Holstein", "chain", 4, "P", "f1", null, 0.5, 1, "VMC, P_e-ph, rc = 2", "variational", true, "Table I, column P_e-ph, rc = 2", {"src": {"rho": 0, "lambda": "g2/(2tw)"}}],
  ["1403.4150", 500, "-0.7832(7)", "site", "Holstein", "chain", 4, "A", "f2", null, 1, 1.5, "VMC1 (no P_e-ph)", "variational", true, "Table II, N = 4, row VMC1", {"src": {"rho": 0.5}}],
  ["1403.4150", 501, "-0.8904(5)", "site", "Holstein", "chain", 4, "A", "f2", null, 1, 1.5, "VMC2 (with P_e-ph)", "variational", true, "Table II, N = 4, row VMC2", {"src": {"rho": 0.5}}],
  ["1403.4150", 500, "-0.7749(2)", "site", "Holstein", "chain", 6, "P", "f3", null, 1, 1.5, "VMC1 (no P_e-ph)", "variational", true, "Table II, N = 6, row VMC1", {"src": {"rho": 0.5}}],
  ["1403.4150", 501, "-0.8583(3)", "site", "Holstein", "chain", 6, "P", "f3", null, 1, 1.5, "VMC2 (with P_e-ph)", "variational", true, "Table II, N = 6, row VMC2", {"src": {"rho": 0.5}}],
  ["1403.4150", 500, "-0.7739(2)", "site", "Holstein", "chain", 8, "A", "f4", null, 1, 1.5, "VMC1 (no P_e-ph)", "variational", true, "Table II, N = 8, row VMC1", {"src": {"rho": 0.5}}],
  ["1403.4150", 501, "-0.8484(3)", "site", "Holstein", "chain", 8, "A", "f4", null, 1, 1.5, "VMC2 (with P_e-ph)", "variational", true, "Table II, N = 8, row VMC2", {"src": {"rho": 0.5}}],
  ["1403.4150", 500, "-0.7732(4)", "site", "Holstein", "chain", 16, "A", "f8", null, 1, 1.5, "VMC1 (no P_e-ph)", "variational", true, "Table II, N = 16, row VMC1", {"src": {"rho": 0.5}}],
  ["1403.4150", 501, "-0.8388(5)", "site", "Holstein", "chain", 16, "A", "f8", null, 1, 1.5, "VMC2 (with P_e-ph)", "variational", true, "Table II, N = 16, row VMC2", {"src": {"rho": 0.5}}],
  ["2011.07412", 851, "−36.15999956298296", "total", "Holstein", "chain", 51, "O", "f25", null, 1, 0.5, "PP-2DMRG, n_ph = 63", "variational", false, "text: Emin/t0 for γ/t0 = 0.5, L = 51, N = 25"],
  ["2011.07412", 864, "−70.862628874727", "total", "Holstein", "chain", 51, "O", "f25", null, 1, 1.5, "DMRG3S+LBO, n_ph = 63", "variational", false, "text: Emin/t0 for γ/t0 = 1.5, L = 51, N = 25"],
  ["2011.07412", 870, "−107.32209423031215", "total", "Holstein", "chain", 51, "O", "f25", null, 1, 2.0, "PP-2DMRG, n_ph = 63", "variational", false, "text: Emin/t0 for γ/t0 = 2.0, L = 51, N = 25"],
  ["1306.4751", 118, "−10.77", "total", "Holstein", "chain", 12, "P", "e4", null, 1, 0.5, "SC-VAED", "variational", false, "Table I, 12 sites, column E4 (SC-VAED)"],
  ["1306.4751", 119, "−10.81", "total", "Holstein", "chain", 16, "P", "e4", null, 1, 0.5, "SC-VAED", "variational", false, "Table I, 16 sites, column E4 (SC-VAED)"],
  ["1306.4751", 120, "−10.83", "total", "Holstein", "chain", 24, "P", "e4", null, 1, 0.5, "SC-VAED", "variational", false, "Table I, 24 sites, column E4 (SC-VAED)"],
  ["1306.4751", 118, "−10.782", "total", "Holstein", "chain", 12, "O", "e4", null, 1, 0.5, "DMRG, m = 400", "variational", false, "Table I, 12 sites, column E4 (DMRG)"],
  ["1306.4751", 119, "−10.797", "total", "Holstein", "chain", 16, "O", "e4", null, 1, 0.5, "DMRG, m = 400", "variational", false, "Table I, 16 sites, column E4 (DMRG)"],
  ["1306.4751", 120, "−10.828", "total", "Holstein", "chain", 24, "O", "e4", null, 1, 0.5, "DMRG, m = 400", "variational", false, "Table I, 24 sites, column E4 (DMRG)"],
  ["1306.4751", 121, "−10.846", "total", "Holstein", "chain", 60, "O", "e4", null, 1, 0.5, "DMRG, m = 400", "variational", false, "Table I, 60 sites, column E4 (DMRG)"],
  ["2012.13473", 671, "−10.293(2)", "total", "Holstein", "chain", 4, "P", "e4", null, 4, 2, "CP-AFQMC/TP-LLF(2)", "projected", true, "text: AFQMC with the TP-LLF(2) trial wave function, 4-site chain, PBC, half filling, λ = 0.5, ω = 4t, g = 2t"],
  ["2012.13473", 672, "−10.292", "total", "Holstein", "chain", 4, "P", "e4", null, 4, 2, "DMRG (iTensor)", "variational", false, "text: 'the exact result of −10.292 (obtained from DMRG using iTensor)', same system"],
  ["cond-mat/9710321", 245, "- 2.46931", "total", "Holstein", "chain", 32, "P", "f1", null, 1, 1, "Global-Local variation", "variational", false, "Table 1, row Global-Local variation (this paper), (J/ħω, g) = (1, 1)", {"confidence": "medium"}],
  ["cond-mat/9710321", 290, "- 2.99802", "total", "Holstein", "chain", 32, "P", "f1", null, 1, 1.4142135623730951, "Global-Local variation", "variational", false, "Table 2, row Global-Local variation (this paper), (J/ħω, g) = (1, √2)", {"confidence": "medium"}],
  ["cond-mat/9812252", 1146, "-2.46968477", "total", "Holstein", "chain", 16, "P", "f1", null, 1, 1, "ED, 10 phonons", "variational", false, "Table I, λ/ω = 1, column ED N=16 (H. Fehske, private communication, Ref. [26])", {"quoted": true, "confidence": "medium"}],
  ["cond-mat/9812252", 1147, "-2.99882816", "total", "Holstein", "chain", 16, "P", "f1", null, 1, 1.4142135623730951, "ED, 12 phonons", "variational", false, "Table I, λ/ω = √2, column ED N=16 (H. Fehske, private communication, Ref. [26])", {"quoted": true, "confidence": "medium"}],
];

// --- conversion --------------------------------------------------------------------------
const clean = s => s.replace(/[−–]/g, "-").replace(/\s+/g, "");
function parse(p) {
  const s = clean(p);
  let m = s.match(/^(-?\d*\.(\d+))\((\d+)\)$/);
  if (m) return { v: +m[1], sigma: +m[3] * 10 ** -m[2].length, dec: m[2].length };
  m = s.match(/^(-?\d*\.(\d+))±(\d*\.?\d+)$/);
  if (m) return { v: +m[1], sigma: +m[3], dec: m[2].length };
  m = s.match(/^(-?\d*\.(\d+))$/);
  if (m) return { v: +m[1], sigma: null, dec: m[2].length };
  return null;
}
const BOUND = { exact_stochastic: "exact" };

const text = {};
const linesOf = a => (text[a] ??= fs.readFileSync(`sources/${a.replace("/", "-")}.txt`, "utf8").split("\n"));
const out = [];
for (const [a, line, printed, norm, model, lattice, n, boundary, particles, U, wSrc, coupling, method, bound, sampled, where, extra = {}] of READINGS) {
  const src = { ...SRC[a], ...(extra.src ?? {}) }; if (!SRC[a] || !CONV[a] || !REF[a]) throw new Error(`${a}: no SRC, CONV or REF`);
  const file = extra.file ?? a, L = linesOf(file), want = printed.replace(/\s+/g, " ");
  const at = [0, -1, 1, -2, 2, -3, 3, -4, 4, -5, 5].map(d => line + d).find(k => (L[k - 1] ?? "").replace(/\s+/g, " ").includes(want));
  if (at == null) throw new Error(`${file}: '${printed}' not found at line ${line}`);
  const p = parse(printed); if (!p) throw new Error(`cannot parse ${printed}`);
  // instance couplings in units of t
  const k = src.t_src ?? 1, w = wSrc / k, d = extra.dim ?? 1;
  const gSrc = src.lambda ? LAMBDA[src.lambda](coupling, wSrc / k, d) * k : coupling;
  const g = +(gSrc / k).toPrecision(12), Uk = U == null ? null : U / k;
  const spinless = particles[0] === "f", ne = +particles.slice(1);
  if (!spinless && ne === 1) throw new Error(`${a}: one electron is f1 (RULES.md 2.1)`);
  const params = { t: 1, ...(Uk != null ? { U: +Uk.toPrecision(12) } : {}), w: +w.toPrecision(12), g,
    spinless, ...(spinless ? { N: ne } : { N_up: Math.ceil(ne / 2), N_dn: Math.floor(ne / 2) }) };
  const id = model === "Holstein" ? `Holstein/${lattice}_${n}_${boundary}_${particles}_w${fmt(w)}_g${fmt(g)}`
    : `HubbardHolstein/${lattice}_${n}_${boundary}_${particles}_U${fmt(Uk)}_w${fmt(w)}_g${fmt(g)}`;
  const div = norm === "total" ? n : 1;
  const rho = src.rho ?? 0, zp = !!src.zp;
  const shift = -2 * g * g * rho * ne / w + g * g * rho * rho * n / w - (zp ? w * n / 2 : 0);
  out.push({
    instance_id: id, eps: +(p.v / div).toPrecision(15), tol: +(0.5 * 10 ** -p.dec / div).toPrecision(3),
    sigma_per_site: p.sigma == null ? null : +(p.sigma / div).toPrecision(6), var_per_site: null,
    arxiv: a, peer_reviewed: REF[a].pr, origin: extra.quoted ? "quoted" : "own", bound_type: BOUND[bound] ?? bound, method,
    reference: extra.ref ?? (extra.quoted ? PRIVATE[a] : REF[a].ref),
    evidence: [`${where} (line ${at})`, extra.note, extra.version ?? REF[a].version].filter(Boolean).join("; "),
    convention_check: typeof CONV[a] === "string" ? CONV[a] : CONV[a][where.match(/^Table I+\b/)[0]], reported_as: printed, confidence: extra.confidence ?? "high",
    verified_by: extra.verified_by ?? "first reading and an adversarial second reading (2026-11-16)",
    variance_as_reported: null, defect: null, sampled,
    ...(k !== 1 ? { scale: k, source_couplings: src.couplings } : {}),
    ...(shift !== 0 ? { shift: { total: +shift.toPrecision(12), from: `${rho ? `coupling to n_i - ${rho}` : ""}${rho && zp ? " and " : ""}${zp ? "phonon zero-point energy w/2 per site" : ""}`,
      note: `E_instance = E_source${rho ? ` - 2 g^2 rho N_e / w + g^2 rho^2 N / w (rho = ${rho}, N_e = ${ne}, N = ${n})` : ""}${zp ? ` - w N / 2` : ""}, in units of t (RULES.md 2.1)` } } : {}),
    create: { model, lattice, n_sites: n, boundary, params, ...(extra.cluster ? { cluster: extra.cluster } : {}) },
  });
}
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + "\n");
console.log(`${out.length} rows on ${new Set(out.map(r => r.instance_id)).size} instances -> ${OUT}`);
