// Generator of passes/rows/sweep-rows-2026-11-12-frustrated.json: a targeted pass (2026-11-12) for
// published finite-size energies of the frustrated-lattice families on clusters QMBL lacked or
// rows it did not carry (SWEEP.md, 2026-11-12).
//
// - arXiv:1311.5038 (Iqbal, Poilblanc & Becca, PRB 89, 020407(R)), Table I, row 432: the U(1) Dirac
//   spin liquid with 0 and 1 Lanczos steps and the zero-variance estimate on the 432-site kagome
//   torus, which QMBL lacked: new instance Heisenberg/kagome-12x12_432_P. The S = 2 columns are an
//   excited state, not rows.
// - arXiv:1105.0341 (Iqbal, Becca & Poilblanc, PRB 84, 020407(R)): the Dirac and uniform RVB
//   energies on the same 432-site cluster.
// - arXiv:1011.3954 (Iqbal, Becca & Poilblanc, PRB 83, 100404(R)): four energies of the nearest-
//   neighbour model on the 576-site cluster (36 x 4 x 4): new instance Heisenberg/kagome-2r3x2r3-4x4_576_P.
// - arXiv:1712.04579 (Iqbal, Poilblanc, Thomale & Becca, PRB 97, 115127), Supplemental Material
//   Tables S1 and S2, row J▽/J∆ = 1.0 (the isotropic kagome Heisenberg model): the U(1) Dirac and the
//   gapped Z2[0,π]β* spin liquids on 3 x L x L tori of 48 to 2352 sites; three new instances,
//   Heisenberg/kagome-16x16_768_P, kagome-20x20_1200_P and kagome-28x28_2352_P. The column headed
//   1768 is held: 1768 is not 3 L^2 for any integer L, so the cluster is not defined (1728 = 3 x 24^2
//   would fit). The rows J▽/J∆ < 1 (breathing kagome) are out of scope.
// - arXiv:0807.2036 (Kim & Han, PRB 78, 180410(R)), Table I: VMC energies of four projected
//   fermion states on the L x L x L pyrochlore tori, L = 2 (32 sites) and L = 4 (256 sites).
// - arXiv:2110.08198 (Astrakhantsev et al., PRB 104, L220408), Table I, column 'Proj. energy':
//   Gutzwiller-projected states on the 4 x 4 x 6 = 96-site shuriken torus.
// - arXiv:1405.3259 (Lubasch, Cirac & Bañuls, PRB 90, 064425), Appendix C, Tables VI-VIII: finite
//   PEPS energies of the transverse-field Ising model on the open 11 x 11 and 21 x 21 squares, nine
//   fields B = 2.0 to 4.0, full update at D = 2, 3, 4 and simple update at D = 2 to 7 (B = 3.0, 21 x 21):
//   18 new instances TFIsing/square_121_O_<h> and TFIsing/square_441_O_<h>. In the pypdf text each
//   table's caption follows its block of numbers (Table VI after lines 914-926, Table VII after
//   933-944, Table VIII after 952-957).
// - arXiv:2510.20063 (Dektor, Chi, Van Beeumen & Yang), Table 2, column 'reference', α = 0: block-MPS
//   ground-state energies of the open 4 x 4 transverse-field Ising model at g = 1, 2, 3, 3.5: four
//   new instances TFIsing/square_16_O_<h>. The α = 1 rows are excited states; the PEPS columns print
//   relative errors, not energies.
//
// Every number is copied from the committed source text as printed, and this script stops unless
// it finds the printed string on (or within three lines of) its cited line of sources/<id>.txt
// (grep -n numbering), compared with all whitespace removed (the pypdf text splits some numbers,
// "−0.428 63(2)").
//
// usage: node scripts/frustrated_2026_11_12.mjs   (writes the pass file; the build applies it)
import fs from "node:fs";

const OUT = "passes/rows/sweep-rows-2026-11-12-frustrated.json";

// --- references (arXiv metadata and Crossref, 2026-11-12) -----------------------------------
const REF = {
  "1311.5038": { pr: true, ref: "Iqbal, Poilblanc & Becca, Vanishing spin gap in a competing spin-liquid phase in the kagome Heisenberg antiferromagnet, Phys. Rev. B 89, 020407(R) (2014), doi:10.1103/PhysRevB.89.020407, arXiv:1311.5038" },
  "1105.0341": { pr: true, ref: "Iqbal, Becca & Poilblanc, Projected wave function study of Z2 spin liquids on the kagome lattice for the spin-1/2 quantum Heisenberg antiferromagnet, Phys. Rev. B 84, 020407(R) (2011), doi:10.1103/PhysRevB.84.020407, arXiv:1105.0341" },
  "1011.3954": { pr: true, ref: "Iqbal, Becca & Poilblanc, Valence-bond crystal in the extended kagome spin-1/2 quantum Heisenberg antiferromagnet: A variational Monte Carlo approach, Phys. Rev. B 83, 100404(R) (2011), doi:10.1103/PhysRevB.83.100404, arXiv:1011.3954" },
  "1712.04579": { pr: true, ref: "Iqbal, Poilblanc, Thomale & Becca, Persistence of the gapless spin liquid in the breathing kagome Heisenberg antiferromagnet, Phys. Rev. B 97, 115127 (2018), doi:10.1103/PhysRevB.97.115127, arXiv:1712.04579" },
  "1405.3259": { pr: true, ref: "Lubasch, Cirac & Bañuls, Algorithms for finite projected entangled pair states, Phys. Rev. B 90, 064425 (2014), doi:10.1103/PhysRevB.90.064425, arXiv:1405.3259" },
  "2510.20063": { pr: false, ref: "Dektor, Chi, Van Beeumen & Yang, Computing excited states with isometric tensor networks in two-dimensions, arXiv:2510.20063" },
  "0807.2036": { pr: true, ref: "Kim & Han, Chiral spin states in the pyrochlore Heisenberg magnet: Fermionic mean-field theory and variational Monte Carlo calculations, Phys. Rev. B 78, 180410(R) (2008), doi:10.1103/PhysRevB.78.180410, arXiv:0807.2036" },
  "2110.08198": { pr: true, ref: "Astrakhantsev, Ferrari, Niggemann, Müller, Chauhan, Kshetrimayum, Ghosh, Regnault, Thomale, Reuther, Neupert & Iqbal, Pinwheel valence bond crystal ground state of the spin-1/2 Heisenberg antiferromagnet on the shuriken lattice, Phys. Rev. B 104, L220408 (2021), doi:10.1103/PhysRevB.104.L220408, arXiv:2110.08198" },
};
const VERSION = id => id === "2510.20063" ? "version read: arXiv 2510.20063v1 text (sources/2510.20063.txt); no journal version (arXiv metadata, 2026-11-12)" : `version read: arXiv text (sources/${id}.txt, pypdf layout mode); journal version not yet read (second reading)`;

// --- instances ----------------------------------------------------------------------------
const I = {
  kag12: { id: "Heisenberg/kagome-12x12_432_P", model: "Heisenberg", lattice: "kagome-12x12", n_sites: 432, boundary: "P", params: {},
    cluster: "rhombic torus of 12 x 12 three-site unit cells, edge vectors 12 a1 and 12 a2 (a1, a2 the triangular Bravais vectors, 60 degrees apart), the pattern of kagome-8x8_192_P and kagome-10x10_300_P. Defined by arXiv:1311.5038: 'square (i.e., 3×L×L) clusters with periodic boundaries' (Model section; Table I sizes 48, 108, 192, 432), and by arXiv:1203.3421 (same authors): 'clusters with 432 (i.e. 3× 12× 12)'. The spin Hamiltonian is periodic; the 'mixed periodic-antiperiodic boundary conditions' these papers state are those of the fermionic mean-field state before projection" },
  kag576: { id: "Heisenberg/kagome-2r3x2r3-4x4_576_P", model: "Heisenberg", lattice: "kagome-2r3x2r3-4x4", n_sites: 576, boundary: "P", params: {},
    cluster: "torus of 4 x 4 copies of the 36-site 2√3 x 2√3 supercell of the kagome lattice (12 three-site unit cells, edge vectors of length 2√3 times the Bravais spacing, rotated by 30 degrees from a1, a2). Defined by arXiv:1011.3954: 'a 576-site (i.e., 36× 4× 4) cluster', which 'accommodates all possible VBC supercells proposed in the literature', with the 36-site supercell of its Fig. 4(c); arXiv:1203.3421 (same authors) Sec. 2.2: 'a 2√3×2√3 expansion of the elementary 3-site unit cell, thus giving rise to a tilted 36-site unit cell' and 'clusters with ... 576 (i.e. 36× 4× 4) sites'. The spin Hamiltonian is periodic; the 'mixed periodic-antiperiodic boundary conditions' are those of the fermionic mean-field state" },
  kag4: { id: "Heisenberg/kagome-4x4_48_P" },
  kag8: { id: "Heisenberg/kagome-8x8_192_P" },
  ...Object.fromEntries([16, 20, 28].map(L => [`kag${L}`, { id: `Heisenberg/kagome-${L}x${L}_${3 * L * L}_P`, model: "Heisenberg", lattice: `kagome-${L}x${L}`, n_sites: 3 * L * L, boundary: "P", params: {},
    cluster: `rhombic torus of ${L} x ${L} three-site unit cells, edge vectors ${L} a1 and ${L} a2 (a1 = (2, 0), a2 = (1, √3)), the pattern of kagome-8x8_192_P and kagome-12x12_432_P. Defined by arXiv:1712.04579: 'we consider toric clusters that are defined by T1 = La1 and T2 = La2, and thus consist of N = 3L2 sites' (Sec. I), 'All the clusters are of the type 3×L×L' (Tables S1, S2). The spin Hamiltonian is periodic; the 'mixed boundary conditions, i.e., anti-periodic along a1 and periodic along a2' of the table captions are those of the fermionic state before projection` }])),
  ...Object.fromEntries([[11, [2, 2.5, 2.8, 2.9, 3, 3.1, 3.2, 3.5, 4]], [21, [2, 2.5, 2.8, 2.9, 3, 3.1, 3.2, 3.5, 4]], [4, [1, 2, 3, 3.5]]].flatMap(([L, hs]) => hs.map(h => [`tfi${L}_${h}`,
    { id: `TFIsing/square_${L * L}_O_${h}`, model: "TFIsing", lattice: "square", n_sites: L * L, boundary: "O", params: { h },
      cluster: `${L} x ${L} square lattice, open boundaries in both directions (${L === 4 ? "arXiv:2510.20063: 'a two-dimensional square lattice of side length Lx = Ly (L = Lx^2 total sites) with open boundary conditions', Table 2: 'the 4×4 TFI model'" : "arXiv:1405.3259: 'the two-dimensional square lattice geometry with open boundary conditions and size N = L × L considered throughout this work', Ising runs 'only for the two system sizes 11 × 11 and 21 × 21'"})` }]))),
  pyr32: { id: "Heisenberg/pyrochlore-2x2x2_32_P" },
  pyr256: { id: "Heisenberg/pyrochlore-4x4x4_256_P" },
  shu96: { id: "Heisenberg/shuriken_96_P" },
};

const CONV = {
  tfi1405: "Appendix C: H = − sum_<l,m> σZ_l σZ_m − B sum_l σX_l (Pauli matrices), the instance's Hamiltonian with h = B; Tables VI-VIII print the energy per site, the stored per-site convention (E/N, Pauli; RULES.md 5). Plausibility: at fixed B the 21 x 21 energies lie below the 11 x 11 ones, as the smaller boundary fraction requires, and the D = 3 and 4 cells agree to the last printed digits.",
  tfi2510: "Eq. (34): H_TFI = − sum_<i,j> σz_i σz_j − g sum_i σx_i (Pauli matrices), the instance's Hamiltonian with h = g; Table 2 prints total energies of the 4 x 4 cluster, converted here to per site (/16).",
  kagome: "H = J sum_<ij> S_i.S_j with spin-1/2 operators, nearest neighbours only; energies printed as E/J per site, the S.S convention per site (RULES.md 5). Plausibility: every value lies above the 192-site variational records (about -0.4359) and, for the Dirac state, within 1e-4 of its 192-site value (-0.4286749), as a gapless state's energy should.",
  pyro: "Eq. (1): H = sum_<ij> S_i.S_j on the pyrochlore lattice, spin-1/2 operators; Table I prints the energy per site, the S.S convention per site. Plausibility: on L = 2 every value lies above QMBL's exact 32-site energy (-0.516859 per site), as variational energies must.",
  shuriken: "Eq. (1): H = J sum_<ij> S_i.S_j with J = J_Δ = J_□ (isotropic shuriken lattice), spin-1/2 operators; Table I prints the ground-state energy per site in units of J, the S.S convention per site. Plausibility: every value lies above the 96-site record (-0.43826 per site).",
};

const BR = "the bracket is printed after each energy; the paper does not say what it estimates (stored as the error bar as printed)";
// [instance key, source, line, printed, method, method_as_published, bound, sampled, where, extra]
const R = [];
// arXiv:1311.5038 Table I, row '432' (line 70). Columns 2-4 the Dirac state with p = 0, 1, 2 Lanczos
// steps (the 432 row prints no 2-LS cell), columns 5-7 the S = 2 excited state (not rows),
// column 8 'Ground state', the zero-variance extrapolation (two points on 432, Fig. 3 caption).
R.push(
  ["kag12", "1311.5038", 70, "−0.428656(1)", "VMC", "U(1) Dirac spin liquid, 0-LS (VMC)", "variational", true, "Table I, row 432, column 0-LS (Gutzwiller-projected U(1) Dirac spin liquid)", {}],
  ["kag12", "1311.5038", 70, "−0.432519(1)", "VMC", "U(1) Dirac spin liquid, 1-LS (VMC)", "variational", true, "Table I, row 432, column 1-LS (one Lanczos step on the Dirac state)", {}],
  ["kag12", "1311.5038", 70, "−0.43652(4)", "VMC (zero-variance extrapolation)", "Zero-variance extrapolation of VMC (0,1 Lanczos steps)", "extrapolated", true, "Table I, row 432, column 'Ground state': zero-variance extrapolation, 'only two points have been used for the 432-site cluster' (Fig. 3 caption)", {}],
);
// arXiv:1105.0341 page 3: 'Its energy per site is E/J = −0.42863(2)' (the NN U(1) Dirac SL on the
// 432-site cluster of line 125-126); 'the NN uniform RVB state ... its energy per site is
// E/J = −0.41216(1).18,19' (the superscript cites the state's earlier studies; arXiv:1203.3421
// quotes both numbers for the 432-site cluster as this paper's, its Ref. [32]).
R.push(
  ["kag12", "1105.0341", 136, "−0.42863(2)", "VMC", "U(1) Dirac SL (NN)", "variational", true, "page 3, 'Its energy per site is E/J = −0.42863(2)' for the nearest-neighbour U(1) Dirac spin liquid on the 432-site cluster ('on a 432-site cluster with mixed periodic-antiperiodic boundary conditions', lines 125-126)", {}],
  ["kag12", "1105.0341", 144, "−0.41216(1)", "VMC", "uniform RVB SL [0, 0] (NN)", "variational", true, "page 3, 'its energy per site is E/J = −0.41216(1)' for the nearest-neighbour uniform RVB state [0, 0] on the same 432-site cluster; arXiv:1203.3421 (New J. Phys. 14, 115031) quotes this value and the Dirac one for 432 sites as this paper's (its Ref. [32])", { conf: "medium" }],
);
// arXiv:1011.3954: 576-site cluster (line 99).
R.push(
  ["kag576", "1011.3954", 111, "−0.42866(1)", "VMC", "U(1) Dirac state [0, π] (n.n.)", "variational", true, "page 2, 'Its energy per site is E/J1 = −0.42866(1)' (n.n. U(1) Dirac state on the 576-site cluster, line 99)", {}],
  ["kag576", "1011.3954", 113, "−0.41197(1)", "VMC", "uniform PFS [0, 0] (n.n.)", "variational", true, "page 2, 'its energy per site is E/J1 = −0.41197(1).17,18' (n.n. uniform projected Fermi sea; the superscripts cite the state's earlier studies; arXiv:1203.3421 quotes the value for 576 sites as this paper's, its Ref. [35])", { conf: "medium" }],
  ["kag576", "1011.3954", 182, "−0.42872(1)", "VMC", "extended Dirac [0, π; 0, π] (n.n.n. hopping)", "variational", true, "page 3, 'these extended wave functions with n.n.n. hoppings lead to slightly lower energies, namely E/J1 = −0.42872(1) for the [0,π; 0,π] state' (J2 = 0)", {}],
  ["kag576", "1011.3954", 183, "−0.41209(1)", "VMC", "extended uniform PFS [0, 0; π, π] (n.n.n. hopping)", "variational", true, "page 3, 'and E/J1 = −0.41209(1) for the [0, 0;π,π] state' (J2 = 0)", {}],
);
// arXiv:1712.04579 Tables S1 (line 509) and S2 (line 530), row J▽/J∆ = 1.0; columns 48, 192, 432, 768,
// 1200, 1768 (held, see above), 2352 sites.
{
  const KEY = { 48: "kag4", 192: "kag8", 432: "kag12", 768: "kag16", 1200: "kag20", 2352: "kag28" };
  const SIZES = [48, 192, 432, 768, 1200, 1768, 2352];
  for (const [table, line, label, cells] of [
    ["S1", 509, "U(1) Dirac spin liquid with n.n.n. hopping (VMC)", ["−0.4293926(15)", "−0.4287314(23)", "−0.4287114(3)", "−0.4287160(6)", "−0.4287168(27)", "−0.428717(7)", "−0.428708(9)"]],
    ["S2", 530, "gapped Z2[0,π]β* spin liquid (VMC)", ["−0.4295356(12)", "−0.4287638(23)", "−0.4287266(4)", "−0.4287204(7)", "−0.4287177(37)", "−0.428725(10)", "−0.428711(12)"]]])
    cells.forEach((p, k) => { const N = SIZES[k]; if (!KEY[N]) return;
      R.push([KEY[N], "1712.04579", line, p, "VMC", label, "variational", true,
        `Supplemental Material Table ${table}, row J▽/J∆ = 1.0 (isotropic kagome), column ${N}`, {}]); });
}
// arXiv:1405.3259 Tables VI (11 x 11) and VII (21 x 21), full update; [line, D, cells] per block of three fields.
{
  const blocks = [[2, 2.5, 2.8], [2.9, 3, 3.1], [3.2, 3.5, 4]];
  const T = { 11: ["VI", [[914, 915, 916], [919, 920, 921], [924, 925, 926]], [
    [["-2.40075(1)", "-2.74230(2)", "-2.98947(5)"], ["-2.40076(1)", "-2.74243(1)", "-2.99094(2)"], ["-2.40076(1)", "-2.74243(1)", "-2.99099(1)"]],
    [["-3.07945(5)", "-3.17128(4)", "-3.26400(4)"], ["-3.08071(1)", "-3.17210(1)", "-3.26457(1)"], ["-3.08073(1)", "-3.17210(1)", "-3.26457(1)"]],
    [["-3.35744(4)", "-3.64097(3)", "-4.12064(2)"], ["-3.35785(1)", "-3.64116(1)", "-4.12071(1)"], ["-3.35785(1)", "-3.64116(1)", "-4.12071(1)"]]]],
    21: ["VII", [[933, 934, 935], [937, 938, 939], [942, 943, 944]], [
    [["-2.45219(1)", "-2.77340(2)", "-3.00705(4)"], ["-2.45219(1)", "-2.77346(1)", "-3.00737(1)"], ["-2.45219(1)", "-2.77346(1)", "-3.00737(1)"]],
    [["-3.09228(5)", "-3.18128(6)", "-3.27326(4)"], ["-3.09287(1)", "-3.18242(1)", "-3.27406(1)"], ["-3.09287(1)", "-3.18243(1)", "-3.27406(1)"]],
    [["-3.36617(4)", "-3.64849(3)", "-4.12685(2)"], ["-3.36672(1)", "-3.64873(1)", "-4.12694(1)"], ["-3.36672(1)", "-3.64873(1)", "-4.12694(1)"]]]] };
  for (const [L, [tab, lines, vals]] of Object.entries(T))
    blocks.forEach((hs, b) => [2, 3, 4].forEach((D, d) => hs.forEach((h, k) =>
      R.push([`tfi${L}_${h}`, "1405.3259", lines[b][d], vals[b][d][k], "PEPS", `finite PEPS, full update, D = ${D}`, "variational", false,
        `Appendix C, Table ${tab} (${L} × ${L}, full update), row D = ${D}, column B = ${h}`, { note: BR }]))));
  // Table VIII: 21 x 21, simple update, B = 3.0
  [[952, 2, "-3.1792(4)"], [953, 3, "-3.1806(4)"], [954, 4, "-3.1807(4)"], [955, 5, "-3.1812(5)"], [956, 6, "-3.1812(4)"], [957, 7, "-3.1814(5)"]].forEach(([line, D, p]) =>
    R.push(["tfi21_3", "1405.3259", line, p, "PEPS", `finite PEPS, simple update, D = ${D}`, "variational", false,
      `Appendix C, Table VIII (21 × 21, simple update, B = 3.0), row D = ${D}`, { note: BR }]));
}
// arXiv:2510.20063 Table 2, column 'reference', rows α = 0 (lines 818, 820, 822, 824): total energies.
for (const [line, h, p] of [[818, 3.5, "−57.82436977"], [820, 3, "−50.18662388"], [822, 2, "−35.90725762"], [824, 1, "−26.86050464"]])
  R.push([`tfi4_${h}`, "2510.20063", line, p, "DMRG", "block MPS alternating optimization (reference, bond dimension up to 5000)", "variational", false,
    `Table 2, row g = ${h}, α = 0 (ground state), column 'reference'; 'With a maximum bond dimension of 5000, reference energies for the TFI model were obtained with relative accuracy of order 10−6 for Lx ≤ 8' (Sec. 5)`, { total: 16 }]);

// arXiv:0807.2036 Table I (lines 134-135): rows L = 2 and 4, columns [0,0,0] (aPBC), [π/2,π/2,0]
// (aPBC), [π/2,−π/2,0] (PBC), [0,0,π] (PBC). 'Statistical uncertainties lie below the digits shown.'
const PY = [["[0, 0, 0]", "aPBC"], ["[π/2, π/2, 0]", "aPBC"], ["[π/2, −π/2, 0]", "PBC"], ["[0, 0, π]", "PBC"]];
for (const [key, L, line, cells] of [["pyr32", 2, 134, ["-0.372", "-0.478", "-0.466", "-0.374"]], ["pyr256", 4, 135, ["-0.374", "-0.459", "-0.456", "-0.375"]]])
  cells.forEach((p, k) => R.push([key, "0807.2036", line, p, `VMC ${PY[k][0]}`, `VMC, ${PY[k][0]} flux state`, "variational", true,
    `Table I, row L = ${L}, column ${PY[k][0]} (${PY[k][1]} on the fermionic mean-field state); 'Statistical uncertainties lie below the digits shown'`,
    { prec: 1e-3, note: "no error bar printed; the caption states the statistical uncertainty lies below the last printed digit (1e-3 per site)" }]));
// arXiv:2110.08198 Table I, column 'Proj. energy' (4 x 4 x 6 cluster); the MF energy column is the
// unprojected mean-field energy, not a spin-model energy, and two cells print '−'.
for (const [line, ansatz, p] of [
  [151, "FS (0, 0, 0)", "−0.42714(2)"], [152, "FS (0, 0, π)", "−0.41720(3)"], [154, "FS (π, 0, π)", "−0.41362(3)"],
  [157, "Chiral (π/2, π/2, π)", "−0.40489(3)"], [158, "Chiral (π/2, −π/2, 0)", "−0.38702(4)"], [159, "Chiral (π/2, −π/2, π)", "−0.40205(3)"],
  [161, "L6-VBC", "−0.43009(1)"], [161, "PW-VBC", "−0.43333(1)"]])
  R.push(["shu96", "2110.08198", line, p, `VMC ${ansatz}`, `Gutzwiller projected ${ansatz}`, "variational", true,
    `Table I, row '${ansatz}', column 'Proj. energy' ('ground-state energy per site (in units of J) on the 4×4×6 cluster')`, {}]);

// --- conversion --------------------------------------------------------------------------
const clean = s => s.replace(/[−–]/g, "-").replace(/\s+/g, "");
function parse(p) {
  const s = clean(p);
  let m = s.match(/^(-?\d*\.(\d+))\((\d+)\)$/);
  if (m) return { v: +m[1], sigma: +m[3] * 10 ** -m[2].length, dec: m[2].length };
  m = s.match(/^(-?\d*\.(\d+))$/);
  if (m) return { v: +m[1], sigma: null, dec: m[2].length };
  return null;
}
const text = {};
const linesOf = f => (text[f] ??= fs.readFileSync(`sources/${f}.txt`, "utf8").split("\n"));
const conv = a => a === "1405.3259" ? CONV.tfi1405 : a === "2510.20063" ? CONV.tfi2510 : a === "1712.04579" ? CONV.kagome.replace("H = J sum_<ij> S_i.S_j with spin-1/2 operators, nearest neighbours only", "Eq. (1): H = J∆ sum_∆ S_i.S_j + J▽ sum_▽ S_i.S_j with spin-1/2 operators; at J▽/J∆ = 1.0 the nearest-neighbour kagome Heisenberg model") : a === "0807.2036" ? CONV.pyro : a === "2110.08198" ? CONV.shuriken : CONV.kagome;
const out = [];
for (const [key, a, line, printed, method, asPub, bound, sampled, where, x] of R) {
  const def = I[key]; if (!def) throw new Error(`no instance ${key}`);
  const L = linesOf(a), want = clean(printed);
  const at = [0, -1, 1, -2, 2, -3, 3].map(d => line + d).find(k => clean(L[k - 1] ?? "").includes(want));
  if (at == null) throw new Error(`${a}: '${printed}' not found at line ${line}`);
  const p0 = parse(printed); if (!p0) throw new Error(`cannot parse ${printed}`);
  const p = x.total ? { v: p0.v / x.total, sigma: p0.sigma == null ? null : p0.sigma / x.total, dec: p0.dec + Math.log10(x.total) } : p0;
  if (!def.model && !fs.existsSync(`data/${def.id}.json`)) throw new Error(`instance ${def.id} missing`);
  const row = {
    instance_id: def.id, eps: +p.v.toPrecision(15), tol: +(0.5 * 10 ** -p.dec).toPrecision(3),
    sigma_per_site: p.sigma == null ? null : +p.sigma.toPrecision(6), var_per_site: null,
    arxiv: a, peer_reviewed: REF[a].pr, origin: "own", bound_type: bound, method: asPub,
    reference: REF[a].ref,
    evidence: [`${where}; sources/${a}.txt line ${at}`, x.note, VERSION(a)].filter(Boolean).join("; "),
    convention_check: conv(a), reported_as: printed, confidence: x.conf ?? "high",
    verified_by: "single reading (2026-11-12)", variance_as_reported: null, defect: null, sampled,
  };
  if (x.prec) row.precision_per_site = x.prec;
  // A second method of the same paper that printed the same value on the same instance (D = 3 and
  // D = 4 often agree to the printed digits) is its own row (SWEEP.md, same_value_distinct_method).
  if (out.some(o => o.instance_id === row.instance_id && o.arxiv === a && o.eps === row.eps)) row.same_value_distinct_method = true;
  if (def.model) {
    const { model, lattice, n_sites, boundary, params, cluster } = def;
    row.create = { model, lattice, n_sites, boundary, params, cluster };
  }
  out.push(row);
}
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + "\n");
console.log(`${out.length} rows on ${new Set(out.map(r => r.instance_id)).size} instances -> ${OUT}`);
