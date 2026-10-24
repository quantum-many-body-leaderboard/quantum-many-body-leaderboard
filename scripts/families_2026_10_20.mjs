// Generator of passes/rows/sweep-rows-2026-10-20-families.json: the first rows of the honeycomb
// and Shastry-Sutherland families (RULES.md 2.1 and 5, 2026-10-20), and the instances they create.
//
// Every number below is copied from the committed source text (sources/<arxiv>.txt) as printed;
// this script only fixes per-site normalisation, the printed error bar and the instance. The
// readings, the second reading and the convention checks are described in SWEEP.md (2026-10-20).
//
// Conventions (RULES.md 2.1 and 5, 2026-10-21): Kitaev and ShastrySutherland are written with
// S = sigma/2 and normalised couplings, |K| = 1 (sign kept) and Jd = 1. `eps` is the energy per site
// of the source's own Hamiltonian as printed; where that Hamiltonian is the instance's times a
// factor (a Pauli-written source with coupling c is |K| = 4|c|), the row carries the factor as
// `scale` and the source's couplings as `source_couplings`, and the loader
// (scripts/add_allresults_rows.mjs) divides by it before storing the Pauli-form total (units.mjs).
//
// usage: node scripts/families_2026_10_20.mjs   (writes the pass file; the build applies it)
import fs from "node:fs";

const OUT = "passes/rows/sweep-rows-2026-10-20-families.json";

// --- references (titles from Crossref, or from the first page of the committed text) ---------
const REF = {
  "1411.5198": { pr: true, ref: "Kurita, Yamaji, Morita & Imada, Variational Monte Carlo method in the presence of spin-orbit interaction and its application to Kitaev and Kitaev-Heisenberg models, Phys. Rev. B 92, 035122 (2015), doi:10.1103/PhysRevB.92.035122, arXiv:1411.5198" },
  "2112.08394": { pr: true, ref: "Lin, Zaletel & Pollmann, Efficient simulation of dynamics in two-dimensional quantum spin systems with isometric tensor networks, Phys. Rev. B 106, 245102 (2022), doi:10.1103/PhysRevB.106.245102, arXiv:2112.08394" },
  "2009.04129": { pr: true, ref: "Jin, Tu & Zhou, Density matrix renormalization group boosted by Gutzwiller projected wave functions, Phys. Rev. B 104, L020409 (2021), doi:10.1103/PhysRevB.104.L020409, arXiv:2009.04129" },
  "2311.16889": { pr: true, ref: "Viteritti, Rende, Parola, Goldt & Becca, Transformer wave function for two dimensional frustrated magnets: Emergence of a spin-liquid phase in the Shastry-Sutherland model, Phys. Rev. B 111, 134411 (2025), doi:10.1103/PhysRevB.111.134411, arXiv:2311.16889" },
  "cond-mat/0605464": { pr: true, ref: "Sindermann, Löw & Zittartz, Ground state properties of two spin models with exactly known ground states on the square lattice, Int. J. Mod. Phys. C 17, 1085 (2006), doi:10.1142/S0129183106009709, arXiv:cond-mat/0605464" },
  "2505.03466": { pr: true, ref: "Nutakki, Shokry & Vicentini, Design principles of deep translationally symmetric neural quantum states for frustrated magnets, Phys. Rev. Research 7, 043099 (2025), doi:10.1103/ybgv-35jm, arXiv:2505.03466" },
  "2309.10955": { pr: true, ref: "Liu, Zhang, Wang, Gong, Chen & Gu, Quantum Criticality with Emergent Symmetry in the Extended Shastry-Sutherland Model, Phys. Rev. Lett. 133, 026502 (2024), doi:10.1103/PhysRevLett.133.026502, arXiv:2309.10955" },
  "2503.20122": { pr: true, ref: "Chen & Liu, Deconfined gapless phases and criticalities in the Shastry-Sutherland antiferromagnet, Phys. Rev. B 113, 224440 (2026), doi:10.1103/hvlq-d179, arXiv:2503.20122" },
  "cond-mat/0309368": { pr: true, ref: "Munehisa & Munehisa, The Stochastic State Selection Method for Energy Eigenvalues in the Shastry-Sutherland Model, J. Phys. Soc. Jpn. 73, 340 (2004), doi:10.1143/JPSJ.73.340, arXiv:cond-mat/0309368" },
  "2110.06390": { pr: false, ref: "Kochkov, Pfaff, Sanchez-Gonzalez, Battaglia & Clark, Learning ground states of quantum Hamiltonians with graph networks, arXiv:2110.06390" },
  "2206.07370": { pr: true, ref: "Fu, Zhang, Zhang, Ling, Xu & Ji, Lattice Convolutional Networks for Learning Ground States of Quantum Many-Body Systems, Proc. 2024 SIAM Int. Conf. on Data Mining (SDM), pp. 490-498 (2024), arXiv:2206.07370" },
};
const VERSION = a => REF[a].pr
  ? "version read: arXiv text (sources/" + a.replace("/", "-") + ".txt); the journal version was not reached from this session, to be read on the verification pass (RULES.md 8)"
  : "version read: arXiv text; no journal version found (arXiv metadata)";

// --- instances ---------------------------------------------------------------------------
// `cluster` states the geometry in words, with where the source defines it; the id carries the
// normalised couplings (RULES.md 2.1).
const I = {};
const inst = (id, model, lattice, n, boundary, params, cluster) => (I[id] = { model, lattice, n_sites: n, boundary, params, cluster });
// Kitaev
inst("Kitaev/honeycomb-hex24_24_P_K-1", "Kitaev", "honeycomb-hex24", 24, "P", { K: -1, J: 0, Gamma: 0 },
  "24-site hexagonal supercell of the honeycomb lattice with periodic boundaries (arXiv:1411.5198, Fig. 1(a))");
inst("Kitaev/honeycomb-3x4_24_P_K-1", "Kitaev", "honeycomb-3x4", 24, "P", { K: -1, J: 0, Gamma: 0 },
  "3 x 4 two-site unit cells, periodic in both directions (arXiv:1411.5198, Fig. 1(b))");
inst("Kitaev/honeycomb-4x4_32_P_K-1", "Kitaev", "honeycomb-4x4", 32, "P", { K: -1, J: 0, Gamma: 0 },
  "4 x 4 two-site unit cells, periodic in both directions (arXiv:1411.5198, Fig. 1(b))");
for (const [L, n] of [[5, 50], [7, 98], [11, 242]])
  inst(`Kitaev/honeycomb-${L}x${L}_${n}_O_K-1`, "Kitaev", `honeycomb-${L}x${L}`, n, "O", { K: -1, J: 0, Gamma: 0 },
    `${L} x ${L} two-site unit cells (N = Lx x Ly x 2, arXiv:2112.08394 Table III footnote) on the 60-degree rhombus (A(m,n) bonded to B(m,n), B(m-1,n) and B(m,n-1), 0 <= m,n < ${L}), open boundaries: neither is printed in the source; the flux-free free-Majorana energy of this open patch reproduces the source's Exact column to all 8 printed digits, and the 120-degree rhombus does not (SWEEP.md, 2026-10-20; checks/exact-recompute-2026-10-families/, 2026-10-24)`);
inst("Kitaev/honeycomb-6x6_72_PO_K1", "Kitaev", "honeycomb-6x6", 72, "PO", { K: 1, J: 0, Gamma: 0 },
  "6 x 6 two-site unit cells on a cylinder, open along x and periodic along y (arXiv:2009.04129, Fig. 2(a))");
// Shastry-Sutherland: J on the square bonds, Jd on the orthogonal dimers; every source here sets Jd = 1.
const ss = (id, lattice, n, boundary, J, cluster) => inst(id, "ShastrySutherland", lattice, n, boundary, { J, Jd: 1 }, cluster);
for (const J of [0.5, 0.66697792, 0.67441, 0.675, 0.68, 0.7, 0.8, 0.85])
  ss(`ShastrySutherland/square_36_P_J${J}_Jd1`, "square", 36, "P", J, "6 x 6 square lattice with orthogonal dimers, periodic boundaries");
for (const J of [0.677, 0.6772, 0.67724, 0.677244, 0.677246, 0.677248, 0.6773, 0.6775, 0.6778, 0.68, 0.7])
  ss(`ShastrySutherland/square-tilted_32_P_J${J}_Jd1`, "square-tilted", 32, "P", J,
    "32-site square cluster tilted by 45 degrees (periodic vectors (4,4) and (4,-4)), periodic boundaries; drawn in arXiv:cond-mat/0605464 Fig. 6 (second N = 32 cluster), distinct from its 4 x 8 stripe");
for (const L of [8, 10, 12, 14, 16, 18])
  ss(`ShastrySutherland/square_${L * L}_P_J0.8_Jd1`, "square", L * L, "P", 0.8, `${L} x ${L} square lattice with orthogonal dimers, periodic boundaries`);
ss("ShastrySutherland/square_400_O_J0.8_Jd1", "square", 400, "O", 0.8,
  "20 x 20 square lattice with orthogonal dimers, open boundaries, setup B of arXiv:2309.10955 App. S-2 (the corner sites carry no dimer bond)");
for (const L of [12, 16])
  ss(`ShastrySutherland/square_${L * L}_P_J0.7_Jd1`, "square", L * L, "P", 0.7, `${L} x ${L} square lattice with orthogonal dimers, periodic boundaries (torus)`);
ss("ShastrySutherland/square_16_P_J0.7_Jd1", "square", 16, "P", 0.7,
  "4 x 4 square lattice with orthogonal dimers, periodic boundaries: not printed in the source (arXiv:cond-mat/0309368); QMBL's Lanczos ground state of the 4 x 4 torus, -6.3502520 in the source's units, is the printed -6.3502 truncated (checks/exact-recompute-2026-10-families/, 2026-10-24)");
// Honeycomb J1-J2 (J2 = 0 is the Heisenberg model)
inst("J1J2/honeycomb-7x7_98_P_0.2", "J1J2", "honeycomb-7x7", 98, "P", { J2: 0.2 },
  "7 x 7 rhombic two-site unit cells, periodic (arXiv:2110.06390 App. A.5.a Table I: b1 = 7 a1, b2 = 7 a2)");
inst("Heisenberg/honeycomb-7x7_98_P", "Heisenberg", "honeycomb-7x7", 98, "P", {},
  "7 x 7 rhombic two-site unit cells, periodic (arXiv:2110.06390 App. A.5.a Table I: b1 = 7 a1, b2 = 7 a2)");

// --- readings ----------------------------------------------------------------------------
// [instance, arxiv, as printed, normalisation, method as published, bound_type, where, extra]
// normalisation: "site" (energy per site) or "total"; Kitaev conventions per source in CONV.
const CONV = {
  "1411.5198": "Eq. (28) H_KH = 2 alpha H_K + (1 - alpha) J_H sum S.S at alpha = 1 (the text before Table I: 'the Kitaev model, where alpha = 1'), with H_K = -J sum S^g S^g (Eq. 27), S^g = c^dag sigma^g c / 2, J = 1: H = -2 sum S^g S^g, K = -2 in the S = sigma/2 form, twice the instance's K = -1 (scale 2). Total energies of the cluster: the per-site values -0.3970, -0.3977, -0.3926 the text compares with the thermodynamic -0.39365 are these totals over N. QMBL's flux-free free-Majorana energies of the 3 x 4 and 4 x 4 tori reproduce -9.54589 and -12.56409 (SWEEP.md, 2026-10-20).",
  "2112.08394": "Eq. (25) H = -Jx sum sigma^x sigma^x - Jy sum sigma^y sigma^y - Jz sum sigma^z sigma^z, Pauli matrices, Jx = Jy = Jz = 1: K = -4 in the S = sigma/2 form, 4 times the instance's K = -1 (scale 4). Table III caption 'energy per site E0/N'; footnote 'N = Lx x Ly x 2'. QMBL's flux-free free-Majorana energies of the open 5 x 5, 7 x 7 and 11 x 11 patches give -0.71402401, -0.73416737 and -0.75303346 per site, the Exact column to all printed digits, which fixes the open boundaries the text does not print.",
  "2009.04129": "Eq. (1) H3 = sum J_a sigma^a sigma^a + J3 sum sigma^x sigma^y sigma^z, Pauli matrices, J_a = 1, J3 = 0: K = +4 in the S = sigma/2 form, 4 times the instance's K = +1 (scale 4). Total energy of the 72-site cylinder (Supplemental Material, numerical data for Fig. 3); the boundary term of Eq. (S8) has deltaK -> 0+ and commutes with H3. QMBL's flux-free free-Majorana energy of the 6 x 6 cylinder gives -54.4698475.",
  "2311.16889": "Eq. (1) H = J sum S.S (square bonds) + J' sum S.S (dimer bonds), spin-1/2, J/J' = 0.8, energies per site in units of J' (Table I caption).",
  "cond-mat/0605464": "Eq. (1) H = J2 sum S.S (square bonds) + J1 sum S.S (diagonal dimer bonds), x = J2/J1, E0/N per site in units of J1 (the Fig. 1 caption swaps the labels; the tables fix them: E0/N = -0.375, the dimer-product energy, for all x below xc, and x = 0.8 equals the 6 x 6 ED of arXiv:2311.16889).",
  "2505.03466": "Eq. (1) H = J1 sum S.S + J2 sum S.S with S = sigma/2, Table I '(J1 = 0.8, J2 = 1)', J2 on the dimer bonds (the text's 'J1 = 1, J2 = 0.8' is swapped: Table I's quoted ED -0.4517531 and fViT -0.449329 are arXiv:2311.16889's at J/J' = 0.8); E/N per site, L x L with periodic boundaries (Sec. II).",
  "2309.10955": "Eq. (1) H = J1 sum S.S (square bonds) + J2 sum S.S (dimer bonds), Table III caption '20 x 20 SSM system at J1/J2 = 0.8 (set J2 = 1)'; per site: the section compares 'energy per site' of finite PEPS and iPEPS, and E_DVBS = -0.375. Table III does not say whether the average runs over the whole lattice or a central cluster; read as the whole lattice.",
  "2503.20122": "Eq. (1) H = J1 sum S.S (square bonds) + J2 sum S.S (diagonal dimer bonds) - Jr sum Q_r, Table VI caption 'J1/J2 = 0.7, Jr = 0', 12 x 12 sites by default; per site in units of J2, read from Table I's 'Energy per site' for the same method and the dimer energy -3/8 beside them (Table VI does not print the unit).",
  "cond-mat/0309368": "Sec. 3: H = (1/4) J sum h (dimer bonds) + (1/4) J' sum h (square bonds), h = sigma.sigma, so S.S sums; J = 1, J'/J = 0.7; total energy of the 16-site cluster. QMBL's Lanczos diagonalization of the 4 x 4 torus gives -6.35025196 (SWEEP.md, 2026-10-20).",
  "2110.06390": "Eq. (4) H = sum S_i.S_j + J2 sum S_i.S_j, spin-1/2, J1 = 1; Table IV '<E>/N', 'variational energies per spin'.",
  "2206.07370": "Same Hamiltonian, lattices and references as arXiv:2110.06390 (Sec. 'Lattice': 'Following Kochkov et al. [27]'); Table 1 'energy per site'.",
};
// The source's Hamiltonian over the instance's (RULES.md 2.1, 2026-10-21), with the source's own couplings.
const SCALE = {
  "1411.5198": [2, "H = 2 H_K = -2 sum S^g S^g (Eq. 28 at alpha = 1, J = 1): K = -2 in the S = sigma/2 form"],
  "2112.08394": [4, "H = -sum sigma^g sigma^g (Eq. 25, Jx = Jy = Jz = 1, Pauli): K = -4 in the S = sigma/2 form"],
  "2009.04129": [4, "H3 = +sum sigma^a sigma^a (Eq. 1, J_a = 1, J3 = 0, Pauli): K = +4 in the S = sigma/2 form"],
};
// The code that produced a source's energies, where the source names it (rule of 2026-10-22): the
// URL appears verbatim in the committed text; no commit or release is stated. The other sources
// name none (SWEEP.md, 2026-10-22). Written in the shape add_code_links.mjs gives a row (DATA.md,
// "The code behind a row"): the quoted statement and where it was read in `read_from`.
const ARTIFACTS = {
  "2505.03466": { code: "https://github.com/NeuralQXLab/convnextnnqs",
    read_from: { quote: "Code for the implementation and optimization of the ConvNext is available at [71] and all data supporting the findings of this article at [72]. [...] [71] Convnext neural quantum states and lattice symmetries, https://github.com/NeuralQXLab/convnextnnqs (2025).",
      location: "Data and Code Availability, and Ref. [71] (sources/2505.03466.html and .txt)", checked_on: "2026-10-22", pass: OUT } },
};
const R = [];
const row = (id, arxiv, printed, norm, method, bound, where, extra = {}) => R.push({ id, arxiv, printed, norm, method, bound, where, ...extra });

// arXiv:1411.5198, Table I (VMC wave functions and exact diagonalization) and Table II (Wilson-loop sectors)
const K24 = "Kitaev/honeycomb-hex24_24_P_K-1", K34 = "Kitaev/honeycomb-3x4_24_P_K-1", K44 = "Kitaev/honeycomb-4x4_32_P_K-1";
const T1 = { "|ψpair⟩": ["−9.47 ± 0.01", "−9.02 ± 0.02", "−11.95 ± 0.03"], "|ψMP⟩": ["−9.527 ± 0.003", "−9.543 ± 0.004", "−12.43 ± 0.02"],
  "|ψKL⟩": ["−9.5285 ± 0.0003", "−9.544 ± 0.004", "−12.555 ± 0.005"], "Exact": ["−9.52860", "−9.54589", "−12.56409"] };
for (const [m, vals] of Object.entries(T1)) [K24, K34, K44].forEach((id, k) =>
  row(id, "1411.5198", vals[k], "total", m === "Exact" ? "Exact (Table I)" : `${m} (Table I)`, m === "Exact" ? "exact" : "variational",
    `Table I, row ${m}, column ${["hexagonal 24 sites", "3×4 unit cells", "4×4 unit cells"][k]}`, { sampled: m === "Exact" ? false : true }));
for (const [id, cl, sectors, v] of [[K24, "hexagonal 24 sites", ["(+,+)", "(+,−)", "(−,+)"], "−9.528±0.002"], [K34, "3×4 unit cells", ["(+,−)"], "−9.546±0.001"],
  [K44, "4×4 unit cells", ["(+,+)", "(+,−)", "(−,+)"], "−12.55±0.01"]])
  for (const s of sectors) row(id, "1411.5198", v, "total", `VMC, |ψKL⟩ with Wilson-loop projection, (Wx,Wy) = ${s} (Table II)`, "variational",
    `Table II, ${cl}, (Wx,Wy) = ${s}, column VMC`, { sampled: true,
      note: id === K44 ? "The text names the three degenerate 4 x 4 sectors (1,-1), (-1,1), (-1,-1); Table II lists (+,+), (+,-), (-,+). The sector label is copied from the table." : "",
      // The 3 x 4 VMC -9.546(1) lies within its printed digits of the same paper's Exact -9.54589 and
      // is a second number, not a repeat (qmbl-verify 2026-10-23, ruled 2026-10-24).
      ...(id === K34 ? { same_value_distinct_method: true } : {}) });

// arXiv:2112.08394, Table III
const T3 = { 5: ["-0.71402401", "-0.71362916", "-0.71401082", "-0.70689939", null], 7: ["-0.73416737", "-0.72593548", "-0.73039993", "-0.72696637", "-0.72987357"],
  11: ["-0.75303346", "-0.72405548", "-0.72808531", "-0.74448479", "-0.74682331"] };
const T3M = [["Exact", "exact", false], ["DMRG χ=512", "variational", false], ["DMRG χ=1024", "variational", false], ["isoTNS D=4, η=8", "projected", false], ["isoTNS D=6, η=12", "projected", false]];
// DMRG2 on isoTNS is not a strict upper bound (RULES.md 4, ruled 2026-10-24): the source says so itself.
const ISO_REASON = "DMRG2 on an isometric tensor network, otherwise biased, not a strict upper bound: 'We would like to point out that the DMRG2 proposed here is not a standard variational algorithm, which optimize over the parameters of a single variational wavefunction. Instead, we optimize over a set of quantum states approximately connected by MM. [...] As a result, the variational energy does not monotonically decrease as in the standard DMRG algorithm [...]. The approximation of the ground state energy found by DMRG2 is thus, similar to TEBD2, bound by the MM error.' (arXiv:2112.08394, Sec. III B; ruled 2026-10-24)";
for (const [L, vals] of Object.entries(T3)) vals.forEach((v, k) => v && row(`Kitaev/honeycomb-${L}x${L}_${2 * L * L}_O_K-1`, "2112.08394", v, "site",
  T3M[k][0], T3M[k][1], `Table III, row (${L},${L}), column ${T3M[k][0]}${L == 5 && k === 3 ? " (the row prints four numbers; the D = 6 cell is empty)" : ""}`,
  { sampled: T3M[k][2], ...(T3M[k][1] === "projected" ? { bound_reason: ISO_REASON } : {}) }));

// arXiv:2009.04129, Supplemental Material
row("Kitaev/honeycomb-6x6_72_PO_K1", "2009.04129", "-54.469847490329", "total", "exact ground-state energy Eg(Φy = 1)", "exact",
  "Supplemental Material, numerical data for Fig. 3: Eg(Phi_y = 1) of the 6 x 6 cylinder; the Phi_y = -1 sector is higher (-54.385529432483, 'about 0.084' above, main text)", { sampled: false });

// arXiv:cond-mat/0605464, Table I (N = 32) and Table II (6 x 6)
const T1SS = [["0.677", "-0.374999999998987"], ["0.6772", "-0.374999999999945"], ["0.67724", "-0.374999999997117"], ["0.677244", "-0.374999999997006"],
  ["0.677246", "-0.374999999997179"], ["0.677248", "-0.375000015810957"], ["0.6773", "-0.375023759933420"], ["0.6775", "-0.375115180019318"],
  ["0.6778", "-0.375252606784488"], ["0.68", "-0.376271688712272"], ["0.7", "-0.386720856118170"]];
for (const [x, v] of T1SS) row(`ShastrySutherland/square-tilted_32_P_J${x}_Jd1`, "cond-mat/0605464", v, "site", "exact diagonalisation (Lanczos)", "exact", `Table I (square N = 32), x = ${x}`, { sampled: false });
const T2SS = [["0.5", "-0.374999999999425"], ["0.66697792", "-0.374999999995975"], ["0.67441", "-0.375003966117052"], ["0.675", "-0.375286177720292"],
  ["0.68", "-0.377704740424690"], ["0.7", "-0.388578449404367"], ["0.8", "-0.451753105004501"], ["0.85", "-0.484334145942023"]];
for (const [x, v] of T2SS) row(`ShastrySutherland/square_36_P_J${x}_Jd1`, "cond-mat/0605464", v, "site", "exact diagonalisation (Lanczos)", "exact", `Table II (6 x 6), x = ${x}`, { sampled: false });

// arXiv:2311.16889, Table I (Transformer with n_l = 2, 4, 8 layers; Extrap. = zero-variance extrapolation in the layers) and the 6 x 6 ED of its caption
const TT = { 6: ["-0.4516642", "-0.4516991", "-0.4517072", "-0.451750"], 8: ["-0.449641", "-0.449802", "-0.449829", "-0.44995"], 10: ["-0.449062", "-0.449221", "-0.449329", "-0.44947"],
  12: ["-0.448861", "-0.449013", "-0.449078", "-0.44931"], 14: ["-0.448551", "-0.448812", "-0.448929", "-0.44920"], 16: [null, null, "-0.448881", null], 18: [null, null, "-0.448859", null] };
for (const [L, vals] of Object.entries(TT)) vals.forEach((v, k) => v && row(`ShastrySutherland/square_${L * L}_P_J0.8_Jd1`, "2311.16889", v, "site",
  k < 3 ? `Transformer, n_l = ${[2, 4, 8][k]}` : "Transformer, Extrap. (n_l → ∞, variance extrapolation)", k < 3 ? "variational" : "extrapolated",
  `Table I, L = ${L}, column ${k < 3 ? `n_l = ${[2, 4, 8][k]}` : "Extrap."}; the caption says the Monte Carlo error is on the last digit`, { sampled: k < 3 ? true : null }));
// The source's own diagonalization (its Fig. 5 shows exact-diagonalization spin-spin correlations and
// its Fig. 8 exact triplet energies of the same cluster, which cond-mat/0605464 does not print), so a
// row of its own beside cond-mat/0605464's under RULES.md 6 (every published diagonalization of an
// exact energy is a row, 2026-10-24); the loader had held it as an exact value already carried.
row("ShastrySutherland/square_36_P_J0.8_Jd1", "2311.16889", "-0.4517531", "site", "exact diagonalizations (6 x 6)", "exact", "Table I caption, 6 x 6 cluster", { sampled: false, independent_exact: true,
  note: "the source's own diagonalization (Fig. 5b: exact-diagonalization spin-spin correlations; Fig. 8: exact triplet energies of the 6 x 6 cluster), a row beside cond-mat/0605464's under RULES.md 6 (2026-10-24)" });

// arXiv:2505.03466
row("ShastrySutherland/square_100_P_J0.8_Jd1", "2505.03466", "-0.449342(4)", "site", "ConvNext (6,3,3)[2,2]", "variational", "Table I, Shastry-Sutherland column, ConvNext; L = 10 per Sec. IV.G", { sampled: true });
row("ShastrySutherland/square_36_P_J0.8_Jd1", "2505.03466", "-0.451717(6)", "site", "ConvNext (4,3,2)[1,1], with patching", "variational", "Fig. 5 caption, first of 'the respective final energies' (with patching; the text's relative errors 8.0e-5 and 2.7e-4 fix the order)", { sampled: true });
row("ShastrySutherland/square_36_P_J0.8_Jd1", "2505.03466", "-0.451633(6)", "site", "ConvNext (4,3,2)[1,1], without patching", "variational", "Fig. 5 caption, second of 'the respective final energies' (without patching)", { sampled: true });

// arXiv:2309.10955, Table III (finite PEPS)
for (const [D, v] of [[4, "-0.442104(8)"], [6, "-0.442861(9)"], [8, "-0.442920(2)"], [10, "-0.442928(3)"]])
  row("ShastrySutherland/square_400_O_J0.8_Jd1", "2309.10955", v, "site", `finite PEPS, D = ${D}`, "variational", `Table III, D = ${D}`, { sampled: true });

// arXiv:2503.20122, Table VI (Gutzwiller-projected parton states, VMC)
const T6 = [["(i)", "EP state", "-0.37627"], ["(ii)", "switch plaquette", "-0.36134"], ["(iii)", "switch plaquette, -Δ2", "-0.37621"], ["(iv)", "No plaquette order", "-0.370381"],
  ["(v)", "other EP state", "-0.37622"], ["(vi)", "EP phase in 16x16 sites", "-0.37642"], ["(vii)", "no potential, t2 dominate", "-0.37539"], ["(viii)", "no potential, Δ2 dominate", "-0.37527"],
  ["(ix)", "small potential", "-0.37537"], ["(x)", "no Δ2", "-0.37308"], ["(xi)", "splitting Néel phase", "-0.37512"], ["(xii)", "splitting Néel, no large t2", "-0.37398"],
  ["(xiii)", "splitting Néel, no Néel order", "-0.37392"]];
for (const [c, label, v] of T6) row(`ShastrySutherland/square_${c === "(vi)" ? 256 : 144}_P_J0.7_Jd1`, "2503.20122", v, "site", `Gutzwiller-projected parton state, case ${c} ${label}`, "variational",
  `Table VI, case ${c}`, { sampled: true, note: "Some Table VI cases reuse the parameters of case (i) with one parameter changed and are not optimised; the fermion boundary sector of each case is not stated." });

// arXiv:cond-mat/0309368, Sec. 3 (exact value the stochastic estimates are compared with)
row("ShastrySutherland/square_16_P_J0.7_Jd1", "cond-mat/0309368", "-0.63502 ×10^1", "total", "exact values", "exact",
  "Sec. 3, the exact ground-state energy of the 4 x 4 cluster at J'/J = 0.7, printed '-0.63502 ×10^1' (layout text); the two stochastic estimates of the same state are not rows", { sampled: false, value: -6.3502 });

// arXiv:2110.06390, Table IV (honeycomb, J2 = 0.2, N = 98)
for (const [m, v] of [["GNN", "-0.4528(2)"], ["GNN-2", "-0.4536(5)"], ["ResNet", "-0.4496(4)"]])
  row("J1J2/honeycomb-7x7_98_P_0.2", "2110.06390", v, "site", `${m} (Table IV)`, "variational", `Table IV, Honeycomb, J2 = 0.2, N = 98, column ${m}`, { sampled: true });
// arXiv:2206.07370, Table 1 (LCN, N = 98)
row("J1J2/honeycomb-7x7_98_P_0.2", "2206.07370", "-0.4538(4)", "site", "LCN", "variational", "Table 1, Honeycomb N = 98, J2 = 0.2, column LCN", { sampled: true });
row("Heisenberg/honeycomb-7x7_98_P", "2206.07370", "-0.5421(4)", "site", "LCN", "variational", "Table 1, Honeycomb N = 98, J2 = 0, column LCN", { sampled: true });

// --- conversion --------------------------------------------------------------------------
const clean = s => s.replace(/[−–]/g, "-").replace(/\s+/g, "");
function parse(p) {
  const s = clean(p);
  let m = s.match(/^(-?\d*\.(\d+))\((\d+)\)$/);
  if (m) return { v: +m[1], sigma: +m[3] * 10 ** -m[2].length, dec: m[2].length };
  m = s.match(/^\(?(-?\d*\.(\d+))\)?±(\d*\.?\d+)$/);
  if (m) return { v: +m[1], sigma: +m[3], dec: m[2].length };
  m = s.match(/^(-?\d*\.(\d+))$/);
  if (m) return { v: +m[1], sigma: null, dec: m[2].length };
  return null;
}
const out = [];
for (const r of R) {
  const def = I[r.id]; if (!def) throw new Error(`no instance ${r.id}`);
  const p = r.value != null ? { v: r.value, sigma: null, dec: 4 } : parse(r.printed);
  if (!p) throw new Error(`cannot parse ${r.printed}`);
  const div = r.norm === "total" ? def.n_sites : 1;
  const { model, lattice, n_sites, boundary, params, cluster } = def;
  out.push({
    instance_id: r.id, eps: +(p.v / div).toPrecision(15), tol: +(0.5 * 10 ** -p.dec / div).toPrecision(3),
    sigma_per_site: p.sigma == null ? null : +(p.sigma / div).toPrecision(12), var_per_site: null,
    arxiv: r.arxiv, peer_reviewed: REF[r.arxiv].pr, origin: "own", bound_type: r.bound, method: r.method,
    ...(r.bound_reason ? { bound_type_reason: r.bound_reason } : {}),
    ...(r.same_value_distinct_method ? { same_value_distinct_method: true } : {}),
    // An own diagonalization of an exact energy the instance already carries (RULES.md 6, 2026-10-24),
    // with one unit in its last printed digit, per site (SWEEP.md, `precision_per_site`).
    ...(r.independent_exact ? { independent_exact: true, precision_per_site: +(10 ** -p.dec / div).toPrecision(3) } : {}),
    reference: REF[r.arxiv].ref,
    evidence: [r.where, VERSION(r.arxiv), r.note].filter(Boolean).join("; "),
    convention_check: CONV[r.arxiv], reported_as: r.printed, confidence: r.arxiv === "2503.20122" ? "medium" : "high",
    verified_by: "first reading and an adversarial second reading (2026-10-20)", variance_as_reported: null, defect: null,
    ...(SCALE[r.arxiv] ? { scale: SCALE[r.arxiv][0], source_couplings: SCALE[r.arxiv][1] } : {}),
    ...(ARTIFACTS[r.arxiv] ? { artifacts: ARTIFACTS[r.arxiv] } : {}),
    create: { model, lattice, n_sites, boundary, params, cluster },
  });
}
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + "\n");
console.log(`${out.length} rows on ${new Set(out.map(r => r.instance_id)).size} instances -> ${OUT}`);
