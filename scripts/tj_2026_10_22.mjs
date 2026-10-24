// Generator of passes/rows/sweep-rows-2026-10-22-tj.json: the first rows of the t-J family
// (RULES.md 2.1 and 5, 2026-10-22), and the instances they create.
//
// Every number below is copied from the committed source text (sources/<id>.txt, or the committed text
// a reading names in `file`) as printed, and
// this script stops unless it finds the printed string on (or within five lines of) its cited
// line (line numbers as grep -n counts them; the evidence records the line where it was found). It only fixes the per-site normalisation, the printed error bar, the instance and the
// coupling normalisation. The readings, their checks and what was held are described in SWEEP.md
// (2026-10-22).
//
// A row whose number the source quotes as another's (D. Poilblanc's unpublished 26-site energies in
// arXiv:cond-mat/0009149) is `quoted` and cites that person through the paper that printed it
// (RULES.md 8, private communication).
const PRIVATE = { "cond-mat/0009149": "D. Poilblanc, unpublished exact diagonalization data on the 26-site t-J model, printed in Sorella, Generalized Lanczos algorithm for variational quantum Monte Carlo, Phys. Rev. B 64, 024512 (2001), Table I, doi:10.1103/PhysRevB.64.024512, arXiv:cond-mat/0009149 (acknowledgements)" };

// Conventions (RULES.md 2.1 and 5, 2026-10-22): H = -t sum P(c+c + h.c.)P [- t' ... - t'' ...]
// + J sum (S_i.S_j - n_i n_j / 4), t = 1. `eps` is the energy per site of the source's own
// Hamiltonian as printed; where that Hamiltonian is the instance's times a factor (a source in
// units of J with t/J = 3 has t = 3), the row carries the factor as `scale` and the source's
// couplings as `source_couplings`, and the loader (scripts/add_allresults_rows.mjs) divides by it.
//
// usage: node scripts/tj_2026_10_22.mjs   (writes the pass file; the build applies it)
import fs from "node:fs";

const OUT = "passes/rows/sweep-rows-2026-10-22-tj.json";

// --- references (titles from Crossref, or from the first page of the committed text) ---------
const REF = {
  "cond-mat/0606659": { pr: true, ref: "Lugas, Spanu, Becca & Sorella, Finite compressibility in the low-doping region of the two-dimensional t-J model, Phys. Rev. B 74, 165122 (2006), doi:10.1103/PhysRevB.74.165122, arXiv:cond-mat/0606659" },
  "cond-mat/0009149": { pr: true, ref: "Sorella, Generalized Lanczos algorithm for variational quantum Monte Carlo, Phys. Rev. B 64, 024512 (2001), doi:10.1103/PhysRevB.64.024512, arXiv:cond-mat/0009149" },
  // A chapter of workshop proceedings, whose front matter and preface state no refereeing: not
  // peer reviewed (RULES.md 8.1; ruled 2026-10-24).
  "cond-mat/0006353": { pr: false, ref: "Becca, Capriotti & Sorella, Stability of d-wave superconductivity in the t-J model, in Open Problems in Strongly Correlated Electron Systems, Proceedings of the NATO Advanced Research Workshop (Bled, 2000), NATO Science Series II vol. 15, pp. 173-185 (Springer, 2001), doi:10.1007/978-94-010-0771-9_18, arXiv:cond-mat/0006353" },
  "cond-mat/0110460": { pr: true, ref: "Sorella, Martins, Becca, Gazza, Capriotti, Parola & Dagotto, Superconductivity in the two-dimensional t-J model, Phys. Rev. Lett. 88, 117002 (2002), doi:10.1103/PhysRevLett.88.117002, arXiv:cond-mat/0110460" },
  "cond-mat/0104067": { pr: true, ref: "Shih, Chen & Lee, Revisit phase separation of the two-dimensional t-J model by the power-Lanczos method, J. Phys. Chem. Solids 62, 1797 (2001), doi:10.1016/S0022-3697(01)00112-3, arXiv:cond-mat/0104067" },
  "cond-mat/0010072": { pr: true, ref: "Chiappa, Capponi & Poilblanc, Truncated Lanczos method: Application to hole-doped spin ladders, Phys. Rev. B 63, 115120 (2001), doi:10.1103/PhysRevB.63.115120, arXiv:cond-mat/0010072" },
  "cond-mat/9706147": { pr: true, ref: "Rice, Haas, Sigrist & Zhang, Lightly doped t-J three-leg ladders: An analog for the underdoped cuprates, Phys. Rev. B 56, 14655 (1997), doi:10.1103/PhysRevB.56.14655, arXiv:cond-mat/9706147" },
  "1908.10000": { pr: true, ref: "Dong, Wang, Han, Yang & He, Stable diagonal stripes in the t-J model at n_h = 1/8 doping from fPEPS calculations, npj Quantum Mater. 5, 28 (2020), doi:10.1038/s41535-020-0226-4, arXiv:1908.10000" },
  "cond-mat/0103096": { pr: true, ref: "McCulloch, Bishop & Gulacsi, Density matrix renormalization group algorithm and the two-dimensional t-J model, Philos. Mag. B 81, 1603 (2001), doi:10.1080/13642810110051782, arXiv:cond-mat/0103096" },
  "2602.21206": { pr: true, ref: "Cui, Zhao & Weng, Minimal loop currents and cat states in doped Mott insulators, Phys. Rev. B 114, 185101 (2026), doi:10.1103/c75n-7j8f, arXiv:2602.21206 (arXiv title: Minimal loop currents in doped Mott insulators)" },
  "2406.16865": { pr: true, ref: "Cui, Zhao & Weng, Variational Monte Carlo study of the doped t-J model on the honeycomb lattice, Phys. Rev. B 110, 155111 (2024), doi:10.1103/PhysRevB.110.155111, arXiv:2406.16865" },
  "cond-mat/0508035": { pr: true, ref: "Leung, Charge carrier correlation in the electron-doped t-J model, Phys. Rev. B 73, 075104 (2006), doi:10.1103/PhysRevB.73.075104, arXiv:cond-mat/0508035" },
};
const VERSION = a => `version read: arXiv text (sources/${a.replace("/", "-")}.txt); the journal version was not reached from this session (the publisher returned 403), to be read on the verification pass (RULES.md 8)`;

// --- instances ---------------------------------------------------------------------------
// The id carries the hole count, J and t', t'' in units of t (RULES.md 2.1); N_up - N_dn is 0 or 1.
const I = {};
const fmt = x => String(+x.toPrecision(6));
function inst(key, lattice, n, boundary, holes, J, cluster, extra = {}) {
  const ne = n - holes, params = { t: 1, J, ...(extra.t2 != null ? { t2: extra.t2 } : {}), ...(extra.t3 != null ? { t3: extra.t3 } : {}),
    N_up: Math.ceil(ne / 2), N_dn: Math.floor(ne / 2), nn_term: true };
  const id = `tJ/${lattice}_${n}_${boundary}_h${holes}_J${fmt(J)}${extra.t2 != null ? `_tp${fmt(extra.t2)}` : ""}${extra.t3 != null ? `_tpp${fmt(extra.t3)}` : ""}`;
  I[key] = { id, model: "tJ", lattice, n_sites: n, boundary, params, cluster };
}
const SQ26 = "square-shaped periodic cluster of 26 sites, edge vectors (5, 1) and (-1, 5), the only square-shaped cluster with N = 26 (RULES.md 2.1). Inferred, not printed: arXiv:cond-mat/0606659 describes its clusters as 'a square lattice with L sites and periodic boundary conditions rotated by 45 degrees such that L = 2l^2, l being an odd integer', which does not include L = 26, and states no other shape; arXiv:cond-mat/0009149 lists 13 shells for its 26-site cluster, as the (5, 1) cluster has (SWEEP.md, 2026-10-22). Confirmed by QMBL's diagonalization of the (5, 1) cluster (checks/tj-exact-recompute-2026-10/, 2026-10-23), which reproduces every printed 26-site exact energy to its printed digits: with 2 holes in all 14 momentum and C4 sectors, with 4 holes in the zero-momentum, C4-even sector, the lowest of the 1 to 6 of 14 sectors computed";
for (const h of [2, 4]) for (const J of [0.3, 0.4, 0.5, 0.6, 0.8, 1]) inst(`sq26_h${h}_J${J}`, "square", 26, "P", h, J, SQ26);
inst("sq18_h2_J0.4", "square", 18, "P", 2, 0.4, "square-shaped periodic cluster of 18 sites, edge vectors (3, 3) and (3, -3) (RULES.md 2.1); the periodic boundaries are fixed by QMBL's diagonalization, which reproduces the source's exact energy (checks/tj-ed-2026-10/)");
inst("sq64_h8_J0.4", "square", 64, "P", 8, 0.4, "8 x 8 torus (arXiv:cond-mat/0110460: '8 holes on the 8 x 8 lattice', PBC clusters)");
inst("sq64_h14_J0.2", "square", 64, "P", 14, 0.2, "8 x 8 torus (arXiv:cond-mat/0104067 Table I and 'periodic boundary condition', line 577)");
for (const L of [11, 13]) inst(`lad2x${L}_h2_J0.5`, `ladder-2x${L}`, 2 * L, "P", 2, 0.5, `two-leg ladder of ${L} rungs, periodic along the legs (arXiv:cond-mat/0010072: '2 x L ladder geometry with periodic boundary conditions')`);
for (const h of [1, 2]) inst(`lad3x6_h${h}_J0.5`, "ladder-3x6", 18, "A", h, 0.5, "three-leg ladder of 6 rungs, isotropic (t' = t, J' = J on the rungs), antiperiodic along the legs and open across them (arXiv:cond-mat/9706147 Table I); QMBL's diagonalization reproduces both energies (checks/tj-ed-2026-10/)");
inst("sq16O_h2_J0.4", "square", 16, "O", 2, 0.4, "4 x 4 square lattice, open boundaries (arXiv:1908.10000, lines 79-80); QMBL's diagonalization gives -0.564366793 per site (checks/tj-ed-2026-10/)");
inst("cyl6x16_h8_J0.35", "rectangular-6x16", 96, "PO", 8, 0.35, "16 x 6 cylinder, periodic along the 6-site direction, open along the 16-site direction (arXiv:cond-mat/0103096, lines 344-346 and Table I)");
inst("sq64O_h1_J1/3", "square", 64, "O", 1, 1 / 3, "8 x 8 square lattice, open boundaries (arXiv:2602.21206: 'N_x x N_y under the OBC')");
for (const h of [1, 2]) inst(`flake24_h${h}_J1/3`, "honeycomb-flake24", 24, "O", h, 1 / 3, "24-site open honeycomb flake of seven hexagons, a central hexagon and its six neighbours, C6 symmetric (arXiv:2406.16865, Fig. 2: 'A 24-site honeycomb lattice', open boundary condition and C6 rotation symmetry)");
for (const h of [1, 2, 4]) inst(`sq32_h${h}_J0.3_tp0.3_tpp-0.2`, "square", 32, "P", h, 0.3, "square-shaped periodic cluster of 32 sites, edge vectors (4, 4) and (4, -4) (RULES.md 2.1); the source states 'a square lattice with 32 sites and periodic boundary conditions'", { t2: 0.3, t3: -0.2 });

// --- conventions per source ---------------------------------------------------------------
const CONV = {
  "cond-mat/0606659": "Eq. (1): H = -t sum (c+c + h.c.) + J sum (S_i.S_j - n_i n_j / 4), t = 1; Tables I and II print E/L, L = 26, for 2 and 4 holes. The Lanczos column agrees with the exact column of Sorella, Phys. Rev. B 64, 024512, Table I at J/t = 0.3, 0.5, 1.0 (4 holes), which fixes one convention for both papers (that paper is Sorella, Phys. Rev. B 64, 024512).",
  "cond-mat/0009149": "Table I: 'Energy per site in the t-J model', N electrons on L sites, t = 1. The Hamiltonian is not printed; its exact column on L = 26 (-0.64262, -0.78812, -1.17493) is the Lanczos column of Lugas, Spanu, Becca & Sorella, Phys. Rev. B 74, 165122, Table II, whose Eq. (1) includes -n_i n_j / 4 and periodic boundaries, so the 26-site rows share that instance.",
  "cond-mat/0006353": "Eq. (1.1): H = J sum (S_i.S_j - n_i n_j / 4) - t sum c~+c~, t = 1; Tables 1.1 and 1.2 print E0/L, L = 18, N = 16, J = 0.4. QMBL's diagonalization of the periodic 18-site cluster gives -0.6590431107 per site, the printed exact -0.65904.",
  "cond-mat/0110460": "Eq. (1): H = J sum (S_i.S_j - n_i n_j / 4) - t sum c~+c~ + h.c.; energies per site in units of t ('best variational energy per site', 'E = ... t'), 8 holes on the 8 x 8 PBC cluster, J/t = 0.4.",
  "cond-mat/0104067": "Eq. (1): H = -t sum (c~+c~ + h.c.) + J sum (S_i.S_j - n_i n_j / 4); Table I is not labelled: read as energy per site in units of t, as the paper's e_h(x) and its comparison of -0.6855 with the per-site value -0.6825(23) of Hellberg & Manousakis, Phys. Rev. B 61, 11787, Table V (50 electrons on 64 sites, J/t = 0.2) show.",
  "cond-mat/0010072": "Eq. (3): H = J sum (S.S - n n / 4) on legs and rungs + t sum (c+c + h.c.) with t = -1, i.e. -|t| sum (c+c + h.c.), J/t = 0.5 'throughout'; footnote 7 prints total energies (E_GS, the ground state of the sector S = 0, K = (0, 0)). QMBL's diagonalization of the 2 x 11 ladder, unrestricted in momentum and spin, gives -12.9997844296 (checks/tj-ed-2026-10/).",
  "cond-mat/9706147": "Eq. (1): H = -t sum P(c+c + h.c.)P - t' sum (rungs) + J sum (S.S - n n / 4) + J' sum (rungs), isotropic t' = t, J' = J, J/t = 0.5; Table I prints total energies per symmetry sector; the lowest of each column is the ground state, and QMBL's diagonalization of the 3 x 6 ladder with antiperiodic legs gives -10.4075745288 (1 hole) and -11.8068024851 (2 holes).",
  "1908.10000": "Eq. (1): H = -t sum (c+c + H.c.) + J sum (S_i.S_j - n_i n_j / 4), t = 1, J/t = 0.4, open boundaries (lines 79-80); energies per site: QMBL's diagonalization of the open 4 x 4 lattice with 2 holes gives -0.564366793 per site, the printed E_ED -0.56436.",
  "cond-mat/0103096": "Eq. (1): H = -t sum (c+c + H.c.) + J (sum S_i.S_j - n_i n_j / 4), t = 1, J = 0.35; Table I prints the total energy E of the 16 x 6 system with 8 holes and cylindrical boundary conditions.",
  "2602.21206": "Eqs. (4)-(5): H = P(H_t + H_J)P, H_t = -t sum (c+c + H.c.), H_J = J sum (S_i.S_j - n_i n_j / 4), J = 1 the energy unit and t = 3 (lines 185-186): the instance's J/t = 1/3 and a factor 3 (scale). Total energies E_tot of the 8 x 8 OBC lattice with one hole.",
  "2406.16865": "Eqs. (1)-(2): H = P(H_t + H_J)P, H_t = -t sum (c+c + H.c.), H_J = J sum (S_i.S_j - n_i n_j / 4), J = 1 and t/J = 3 (lines 104-105): the instance's J/t = 1/3 and a factor 3 (scale). Tables I and III print E_tot of the 24-site cluster. QMBL's diagonalization of the 7-hexagon flake with one hole gives -8.2605976752 in units of t, -24.78179 in units of J, the printed ED -24.782 (checks/tj-ed-2026-10/).",
  "cond-mat/0508035": "Eq. (1): H = -sum t_ij (c~+c~ + h.c.) + J sum_nn (S_i.S_j - n_i n_j / 4); the electron-doped model is Eq. (1) with t = -1, t' = 0.3, t'' = -0.2, J = 0.3 in the hole operators of the electron-hole transformation (lines 98-114), Nc charge carriers on 32 sites: a t-J model with 32 - Nc particles and no double occupancy. The cluster is bipartite, so the gauge c_i -> (-1)^i c_i takes t = -1 to t = 1 and leaves t' and t'' (same-sublattice hops): t' = 0.3, t'' = -0.2 in the form -t' sum - t'' sum. Total energies (Table I). Convention check: at half filling the source prints E00 = -11.329720 (Table I caption, sources/cond-mat-0508035.txt line 65); with J = 0.3 and -n_i n_j / 4 on the 64 bonds this is 0.3 (E_S.S - 16), so E_S.S / 32 = -0.6801792, the 32-site Heisenberg energy per site -0.680179 printed by Schulz, Ziman & Poilblanc (arXiv:cond-mat/9402061 Table II, J2 = 0.00, column 32; sources/cond-mat-9402061.txt line 1642). Without the -n_i n_j / 4 term E00 would be -6.53.",
};
const SCALE = {
  "2602.21206": [3, "J = 1, t = 3 (units of J; lines 185-186)"],
  "2406.16865": [3, "J = 1, t/J = 3 (units of J; lines 104-105)"],
};

// --- what the verification pass of 2026-10-23 found (rulings of 2026-10-24) ----------------------
// Eq. (15) of arXiv:cond-mat/0606659 is a finite difference of two fixed-node runs, an upper bound
// within fixed node, not an extrapolation.
const EQ15 = { bound_type_reason: "finite-difference estimate (Eq. 15) from fixed-node runs at γ = 0 and γ̃ = 1 of the expectation value of H over the γ = 0 fixed-node ground state, an upper bound within fixed node: 'Ẽ^{γ=0}_{Ψ0} certainly improves the standard FN upper bound of the energy and still Ẽ^{γ=0}_{Ψ0} ≥ E^{γ=0}_{Ψ0}' and 'we have computed Ẽ^{γ=0}_{Ψ0} using γ̃ = 1' (text after Fig. 9); not an extrapolation (ruled 2026-10-24)" };
// The Lanczos column of arXiv:cond-mat/0606659 names no source; the rows stay the paper's own.
const LUGAS_EX = { note: "the paper names no source for its Lanczos column, and its acknowledgements name only funding; the 4-hole values at J/t = 0.3, 0.5 and 1 equal digit for digit the Exact column of Sorella, Phys. Rev. B 64, 024512, Table I, whose acknowledgements credit D. Poilblanc's unpublished 26-site data (arXiv:cond-mat/0009149, lines 829-831); the row stays primary to this paper (ruled 2026-10-24)" };
// The journal version of arXiv:1908.10000 (npj Quantum Mater. 5, 28) prints the error bar in its
// Supplementary Information, Table S2, and states Dc = 56 where arXiv v1 states Dc = 48.
const FPEPS_SI = { file: "1908.10000-si", note: "the arXiv text prints E_fPEPS = -0.56428 without an error bar (sources/1908.10000.txt, line 93)", version: "version read: the journal's Supplementary Information (npj Quantum Mater. 5, 28 (2020), ESM of doi:10.1038/s41535-020-0226-4, text in sources/1908.10000-si.txt) and the arXiv text (sources/1908.10000.txt); the journal value is stored where the two differ (RULES.md 8): the error bar (2) is printed only in the SI, and the contraction dimension is Dc = 56 in the journal (Methods; SI Sec. A, line 18) against Dc = 48 in arXiv v1" };
// The accepted manuscript of Phys. Rev. B 110, 155111 (CHORUS) adds a row to Table III that arXiv:2406.16865v1
// does not print (ruled 2026-10-24); the publisher's version of record was not reachable.
const AM_2H = { file: "2406.16865-am", verified_by: "found in the accepted manuscript by the adversarial reading of qmbl-verify 2026-10-23 (group tjP5) and checked against the committed text by this script's line test (2026-10-24)",
  ref: "Cui, Zhao & Weng, Variational Monte Carlo study of the doped t-J model on the honeycomb lattice, Phys. Rev. B 110, 155111 (2024), doi:10.1103/PhysRevB.110.155111, accepted manuscript (CHORUS, dated 23 September 2024; the row is not in arXiv:2406.16865v1)",
  note: "arXiv:2406.16865v1 Table III has no such row; the accepted manuscript constructs it 'as in the single-hole case' (line 359)",
  version: "version read: the accepted manuscript of Phys. Rev. B 110, 155111 made available via CHORUS (dated 23 September 2024; text in sources/2406.16865-am.txt); the publisher's version of record is closed access" };
// The variance column of Table 1.2, ΔE_p x L^2, is the variance of the total Hamiltonian:
// ΔE_p = (⟨H^2⟩ - ⟨H⟩^2)/L^2 (arXiv:cond-mat/0006353, line 222).
const VAR_NOTE = v => `variance: column ΔE_p x L^2 = ${v} of the same row, the variance of the total H in units of t^2 (ΔE_p = (⟨H^2⟩ - ⟨H⟩^2)/L^2, line 222)`;

// --- readings ----------------------------------------------------------------------------
// [instance key, source, line, as printed, normalisation ("site" or "total"), method as published,
//  bound_type, sampled, where, extra]. `extra`: quoted, same (same_value_distinct_method), var (a
// printed total variance on the same line), file (a committed text other than the arXiv one),
// version (what was read, where not the arXiv text alone), ref (the reference, where a version other
// than the arXiv one printed the number), verified_by, note, bound_type_reason.
const READINGS = [
  ["sq26_h4_J0.3","cond-mat/0009149",1050,"-0.64262","site","Exact (D. Poilblanc, unpublished)","exact",false,"Table I, N = 22, L = 26, J/t = 0.3, column Exact; the acknowledgements (lines 829-831) credit D. Poilblanc's unpublished 26-site data",{"quoted":true}],
  ["sq26_h4_J0.5","cond-mat/0009149",1051,"-0.78812","site","Exact (D. Poilblanc, unpublished)","exact",false,"Table I, N = 22, L = 26, J/t = 0.5, column Exact; the acknowledgements (lines 829-831) credit D. Poilblanc's unpublished 26-site data",{"quoted":true}],
  ["sq26_h4_J1","cond-mat/0009149",1052,"-1.17493","site","Exact (D. Poilblanc, unpublished)","exact",false,"Table I, N = 22, L = 26, J/t = 1, column Exact; the acknowledgements (lines 829-831) credit D. Poilblanc's unpublished 26-site data",{"quoted":true}],
  ["sq26_h2_J0.3","cond-mat/0606659",383,"-0.48334(1)","site","E_VMC^RVB","variational",true,"Table I, J/t = 0.3, column E_VMC^RVB"],
  ["sq26_h2_J0.3","cond-mat/0606659",383,"-0.49256(1)","site","E_FN^RVB","projected",true,"Table I, J/t = 0.3, column E_FN^RVB"],
  ["sq26_h2_J0.3","cond-mat/0606659",383,"-0.48476(1)","site","E_VMC^Pfaff","variational",true,"Table I, J/t = 0.3, column E_VMC^Pfaff"],
  ["sq26_h2_J0.3","cond-mat/0606659",383,"-0.49325(1)","site","E_FN^Pfaff","projected",true,"Table I, J/t = 0.3, column E_FN^Pfaff"],
  ["sq26_h2_J0.3","cond-mat/0606659",383,"-0.49445(2)","site","Ẽ_Ψ0^γ=0 (Eq. 15, Pfaff)","projected",true,"Table I, J/t = 0.3, column Ẽ_Ψ0^γ=0 (Eq. 15, Pfaff)",EQ15],
  ["sq26_h2_J0.3","cond-mat/0606659",383,"-0.50097","site","E_ex (Lanczos)","exact",false,"Table I, J/t = 0.3, column E_ex (Lanczos)",LUGAS_EX],
  ["sq26_h2_J0.4","cond-mat/0606659",384,"-0.57664(1)","site","E_VMC^RVB","variational",true,"Table I, J/t = 0.4, column E_VMC^RVB"],
  ["sq26_h2_J0.4","cond-mat/0606659",384,"-0.58625(1)","site","E_FN^RVB","projected",true,"Table I, J/t = 0.4, column E_FN^RVB"],
  ["sq26_h2_J0.4","cond-mat/0606659",384,"-0.57978(1)","site","E_VMC^Pfaff","variational",true,"Table I, J/t = 0.4, column E_VMC^Pfaff"],
  ["sq26_h2_J0.4","cond-mat/0606659",384,"-0.58770(1)","site","E_FN^Pfaff","projected",true,"Table I, J/t = 0.4, column E_FN^Pfaff"],
  ["sq26_h2_J0.4","cond-mat/0606659",384,"-0.58881(2)","site","Ẽ_Ψ0^γ=0 (Eq. 15, Pfaff)","projected",true,"Table I, J/t = 0.4, column Ẽ_Ψ0^γ=0 (Eq. 15, Pfaff)",EQ15],
  ["sq26_h2_J0.4","cond-mat/0606659",384,"-0.59452","site","E_ex (Lanczos)","exact",false,"Table I, J/t = 0.4, column E_ex (Lanczos)",LUGAS_EX],
  ["sq26_h2_J0.5","cond-mat/0606659",385,"-0.67045(1)","site","E_VMC^RVB","variational",true,"Table I, J/t = 0.5, column E_VMC^RVB"],
  ["sq26_h2_J0.5","cond-mat/0606659",385,"-0.68091(1)","site","E_FN^RVB","projected",true,"Table I, J/t = 0.5, column E_FN^RVB"],
  ["sq26_h2_J0.5","cond-mat/0606659",385,"-0.67568(1)","site","E_VMC^Pfaff","variational",true,"Table I, J/t = 0.5, column E_VMC^Pfaff"],
  ["sq26_h2_J0.5","cond-mat/0606659",385,"-0.68327(1)","site","E_FN^Pfaff","projected",true,"Table I, J/t = 0.5, column E_FN^Pfaff"],
  ["sq26_h2_J0.5","cond-mat/0606659",385,"-0.68434(3)","site","Ẽ_Ψ0^γ=0 (Eq. 15, Pfaff)","projected",true,"Table I, J/t = 0.5, column Ẽ_Ψ0^γ=0 (Eq. 15, Pfaff)",EQ15],
  ["sq26_h2_J0.5","cond-mat/0606659",385,"-0.68945","site","E_ex (Lanczos)","exact",false,"Table I, J/t = 0.5, column E_ex (Lanczos)",LUGAS_EX],
  ["sq26_h2_J0.6","cond-mat/0606659",386,"-0.76463(1)","site","E_VMC^RVB","variational",true,"Table I, J/t = 0.6, column E_VMC^RVB"],
  ["sq26_h2_J0.6","cond-mat/0606659",386,"-0.77645(1)","site","E_FN^RVB","projected",true,"Table I, J/t = 0.6, column E_FN^RVB"],
  ["sq26_h2_J0.6","cond-mat/0606659",386,"-0.77228(1)","site","E_VMC^Pfaff","variational",true,"Table I, J/t = 0.6, column E_VMC^Pfaff"],
  ["sq26_h2_J0.6","cond-mat/0606659",386,"-0.77960(1)","site","E_FN^Pfaff","projected",true,"Table I, J/t = 0.6, column E_FN^Pfaff"],
  ["sq26_h2_J0.6","cond-mat/0606659",386,"-0.78062(3)","site","Ẽ_Ψ0^γ=0 (Eq. 15, Pfaff)","projected",true,"Table I, J/t = 0.6, column Ẽ_Ψ0^γ=0 (Eq. 15, Pfaff)",EQ15],
  ["sq26_h2_J0.6","cond-mat/0606659",386,"-0.78537","site","E_ex (Lanczos)","exact",false,"Table I, J/t = 0.6, column E_ex (Lanczos)",LUGAS_EX],
  ["sq26_h2_J0.8","cond-mat/0606659",387,"-0.95410(1)","site","E_VMC^RVB","variational",true,"Table I, J/t = 0.8, column E_VMC^RVB"],
  ["sq26_h2_J0.8","cond-mat/0606659",387,"-0.96920(1)","site","E_FN^RVB","projected",true,"Table I, J/t = 0.8, column E_FN^RVB"],
  ["sq26_h2_J0.8","cond-mat/0606659",387,"-0.96706(1)","site","E_VMC^Pfaff","variational",true,"Table I, J/t = 0.8, column E_VMC^Pfaff"],
  ["sq26_h2_J0.8","cond-mat/0606659",387,"-0.97414(1)","site","E_FN^Pfaff","projected",true,"Table I, J/t = 0.8, column E_FN^Pfaff"],
  ["sq26_h2_J0.8","cond-mat/0606659",387,"-0.97505(3)","site","Ẽ_Ψ0^γ=0 (Eq. 15, Pfaff)","projected",true,"Table I, J/t = 0.8, column Ẽ_Ψ0^γ=0 (Eq. 15, Pfaff)",EQ15],
  ["sq26_h2_J0.8","cond-mat/0606659",387,"-0.97935","site","E_ex (Lanczos)","exact",false,"Table I, J/t = 0.8, column E_ex (Lanczos)",LUGAS_EX],
  ["sq26_h2_J1","cond-mat/0606659",388,"-1.14483(1)","site","E_VMC^RVB","variational",true,"Table I, J/t = 1, column E_VMC^RVB"],
  ["sq26_h2_J1","cond-mat/0606659",388,"-1.16385(1)","site","E_FN^RVB","projected",true,"Table I, J/t = 1, column E_FN^RVB"],
  ["sq26_h2_J1","cond-mat/0606659",388,"-1.16352(1)","site","E_VMC^Pfaff","variational",true,"Table I, J/t = 1, column E_VMC^Pfaff"],
  ["sq26_h2_J1","cond-mat/0606659",388,"-1.17052(1)","site","E_FN^Pfaff","projected",true,"Table I, J/t = 1, column E_FN^Pfaff"],
  ["sq26_h2_J1","cond-mat/0606659",388,"-1.17136(2)","site","Ẽ_Ψ0^γ=0 (Eq. 15, Pfaff)","projected",true,"Table I, J/t = 1, column Ẽ_Ψ0^γ=0 (Eq. 15, Pfaff)",EQ15],
  ["sq26_h2_J1","cond-mat/0606659",388,"-1.17538","site","E_ex (Lanczos)","exact",false,"Table I, J/t = 1, column E_ex (Lanczos)",LUGAS_EX],
  ["sq26_h4_J0.3","cond-mat/0606659",393,"-0.61372(1)","site","E_VMC^RVB","variational",true,"Table II, J/t = 0.3, column E_VMC^RVB"],
  ["sq26_h4_J0.3","cond-mat/0606659",393,"-0.62752(1)","site","E_FN^RVB","projected",true,"Table II, J/t = 0.3, column E_FN^RVB"],
  ["sq26_h4_J0.3","cond-mat/0606659",393,"-0.61478(1)","site","E_VMC^Pfaff","variational",true,"Table II, J/t = 0.3, column E_VMC^Pfaff"],
  ["sq26_h4_J0.3","cond-mat/0606659",393,"-0.62754(1)","site","E_FN^Pfaff","projected",true,"Table II, J/t = 0.3, column E_FN^Pfaff"],
  ["sq26_h4_J0.3","cond-mat/0606659",393,"-0.62958(3)","site","Ẽ_Ψ0^γ=0 (Eq. 15, Pfaff)","projected",true,"Table II, J/t = 0.3, column Ẽ_Ψ0^γ=0 (Eq. 15, Pfaff)",EQ15],
  ["sq26_h4_J0.4","cond-mat/0606659",394,"-0.68894(1)","site","E_VMC^RVB","variational",true,"Table II, J/t = 0.4, column E_VMC^RVB"],
  ["sq26_h4_J0.4","cond-mat/0606659",394,"-0.70101(1)","site","E_FN^RVB","projected",true,"Table II, J/t = 0.4, column E_FN^RVB"],
  ["sq26_h4_J0.4","cond-mat/0606659",394,"-0.68946(1)","site","E_VMC^Pfaff","variational",true,"Table II, J/t = 0.4, column E_VMC^Pfaff"],
  ["sq26_h4_J0.4","cond-mat/0606659",394,"-0.70106(1)","site","E_FN^Pfaff","projected",true,"Table II, J/t = 0.4, column E_FN^Pfaff"],
  ["sq26_h4_J0.4","cond-mat/0606659",394,"-0.70292(2)","site","Ẽ_Ψ0^γ=0 (Eq. 15, Pfaff)","projected",true,"Table II, J/t = 0.4, column Ẽ_Ψ0^γ=0 (Eq. 15, Pfaff)",EQ15],
  ["sq26_h4_J0.4","cond-mat/0606659",394,"-0.71437","site","E_ex (Lanczos)","exact",false,"Table II, J/t = 0.4, column E_ex (Lanczos)",LUGAS_EX],
  ["sq26_h4_J0.5","cond-mat/0606659",395,"-0.76461(1)","site","E_VMC^RVB","variational",true,"Table II, J/t = 0.5, column E_VMC^RVB"],
  ["sq26_h4_J0.5","cond-mat/0606659",395,"-0.77571(1)","site","E_FN^RVB","projected",true,"Table II, J/t = 0.5, column E_FN^RVB"],
  ["sq26_h4_J0.5","cond-mat/0606659",395,"-0.76512(1)","site","E_VMC^Pfaff","variational",true,"Table II, J/t = 0.5, column E_VMC^Pfaff"],
  ["sq26_h4_J0.5","cond-mat/0606659",395,"-0.77595(1)","site","E_FN^Pfaff","projected",true,"Table II, J/t = 0.5, column E_FN^Pfaff"],
  ["sq26_h4_J0.5","cond-mat/0606659",395,"-0.77770(4)","site","Ẽ_Ψ0^γ=0 (Eq. 15, Pfaff)","projected",true,"Table II, J/t = 0.5, column Ẽ_Ψ0^γ=0 (Eq. 15, Pfaff)",EQ15],
  ["sq26_h4_J0.6","cond-mat/0606659",396,"-0.84065(1)","site","E_VMC^RVB","variational",true,"Table II, J/t = 0.6, column E_VMC^RVB"],
  ["sq26_h4_J0.6","cond-mat/0606659",396,"-0.85132(1)","site","E_FN^RVB","projected",true,"Table II, J/t = 0.6, column E_FN^RVB"],
  ["sq26_h4_J0.6","cond-mat/0606659",396,"-0.84170(1)","site","E_VMC^Pfaff","variational",true,"Table II, J/t = 0.6, column E_VMC^Pfaff"],
  ["sq26_h4_J0.6","cond-mat/0606659",396,"-0.85189(1)","site","E_FN^Pfaff","projected",true,"Table II, J/t = 0.6, column E_FN^Pfaff"],
  ["sq26_h4_J0.6","cond-mat/0606659",396,"-0.85348(3)","site","Ẽ_Ψ0^γ=0 (Eq. 15, Pfaff)","projected",true,"Table II, J/t = 0.6, column Ẽ_Ψ0^γ=0 (Eq. 15, Pfaff)",EQ15],
  ["sq26_h4_J0.6","cond-mat/0606659",396,"-0.86337","site","E_ex (Lanczos)","exact",false,"Table II, J/t = 0.6, column E_ex (Lanczos)",LUGAS_EX],
  ["sq26_h4_J0.8","cond-mat/0606659",397,"-0.99361(1)","site","E_VMC^RVB","variational",true,"Table II, J/t = 0.8, column E_VMC^RVB"],
  ["sq26_h4_J0.8","cond-mat/0606659",397,"-1.00476(1)","site","E_FN^RVB","projected",true,"Table II, J/t = 0.8, column E_FN^RVB"],
  ["sq26_h4_J0.8","cond-mat/0606659",397,"-0.99709(1)","site","E_VMC^Pfaff","variational",true,"Table II, J/t = 0.8, column E_VMC^Pfaff"],
  ["sq26_h4_J0.8","cond-mat/0606659",397,"-1.00659(1)","site","E_FN^Pfaff","projected",true,"Table II, J/t = 0.8, column E_FN^Pfaff"],
  ["sq26_h4_J0.8","cond-mat/0606659",397,"-1.00806(2)","site","Ẽ_Ψ0^γ=0 (Eq. 15, Pfaff)","projected",true,"Table II, J/t = 0.8, column Ẽ_Ψ0^γ=0 (Eq. 15, Pfaff)",EQ15],
  ["sq26_h4_J0.8","cond-mat/0606659",397,"-1.01733","site","E_ex (Lanczos)","exact",false,"Table II, J/t = 0.8, column E_ex (Lanczos)",LUGAS_EX],
  ["sq26_h4_J1","cond-mat/0606659",398,"-1.14760(1)","site","E_VMC^RVB","variational",true,"Table II, J/t = 1, column E_VMC^RVB"],
  ["sq26_h4_J1","cond-mat/0606659",398,"-1.16072(1)","site","E_FN^RVB","projected",true,"Table II, J/t = 1, column E_FN^RVB"],
  ["sq26_h4_J1","cond-mat/0606659",398,"-1.15479(1)","site","E_VMC^Pfaff","variational",true,"Table II, J/t = 1, column E_VMC^Pfaff"],
  ["sq26_h4_J1","cond-mat/0606659",398,"-1.16422(1)","site","E_FN^Pfaff","projected",true,"Table II, J/t = 1, column E_FN^Pfaff"],
  ["sq26_h4_J1","cond-mat/0606659",398,"-1.16566(3)","site","Ẽ_Ψ0^γ=0 (Eq. 15, Pfaff)","projected",true,"Table II, J/t = 1, column Ẽ_Ψ0^γ=0 (Eq. 15, Pfaff)",EQ15],
  ["sq26_h4_J0.3","cond-mat/0009149",1050,"-0.6138(1)","site","VMC","variational",true,"Table I, N = 22, L = 26, J/t = 0.3, column VMC"],
  ["sq26_h4_J0.3","cond-mat/0009149",1050,"-0.6332(1)","site","VMC+LS","variational",true,"Table I, N = 22, L = 26, J/t = 0.3, column VMC+LS"],
  ["sq26_h4_J0.3","cond-mat/0009149",1050,"-0.6277(1)","site","VMC+FN","projected",true,"Table I, N = 22, L = 26, J/t = 0.3, column VMC+FN"],
  ["sq26_h4_J0.3","cond-mat/0009149",1050,"-0.6381(1)","site","VMC+2LS","variational",true,"Table I, N = 22, L = 26, J/t = 0.3, column VMC+2LS"],
  ["sq26_h4_J0.3","cond-mat/0009149",1050,"-0.6371(1)","site","VMC+LS+FN","projected",true,"Table I, N = 22, L = 26, J/t = 0.3, column VMC+LS+FN"],
  ["sq26_h4_J0.3","cond-mat/0009149",1050,"-0.6387(1)","site","Best SR","variational",true,"Table I, N = 22, L = 26, J/t = 0.3, column Best SR"],
  ["sq26_h4_J0.5","cond-mat/0009149",1051,"-0.7647(1)","site","VMC","variational",true,"Table I, N = 22, L = 26, J/t = 0.5, column VMC"],
  ["sq26_h4_J0.5","cond-mat/0009149",1051,"-0.7812(1)","site","VMC+LS","variational",true,"Table I, N = 22, L = 26, J/t = 0.5, column VMC+LS"],
  ["sq26_h4_J0.5","cond-mat/0009149",1051,"-0.7759(1)","site","VMC+FN","projected",true,"Table I, N = 22, L = 26, J/t = 0.5, column VMC+FN"],
  ["sq26_h4_J0.5","cond-mat/0009149",1051,"-0.7852(1)","site","VMC+2LS","variational",true,"Table I, N = 22, L = 26, J/t = 0.5, column VMC+2LS"],
  ["sq26_h4_J0.5","cond-mat/0009149",1051,"-0.7841(1)","site","VMC+LS+FN","projected",true,"Table I, N = 22, L = 26, J/t = 0.5, column VMC+LS+FN"],
  ["sq26_h4_J0.5","cond-mat/0009149",1051,"-0.7855(1)","site","Best SR","variational",true,"Table I, N = 22, L = 26, J/t = 0.5, column Best SR"],
  ["sq26_h4_J1","cond-mat/0009149",1052,"-1.1476(1)","site","VMC","variational",true,"Table I, N = 22, L = 26, J/t = 1, column VMC"],
  ["sq26_h4_J1","cond-mat/0009149",1052,"-1.1672(1)","site","VMC+LS","variational",true,"Table I, N = 22, L = 26, J/t = 1, column VMC+LS"],
  ["sq26_h4_J1","cond-mat/0009149",1052,"-1.1608(1)","site","VMC+FN","projected",true,"Table I, N = 22, L = 26, J/t = 1, column VMC+FN"],
  ["sq26_h4_J1","cond-mat/0009149",1052,"-1.1719(1)","site","VMC+2LS","variational",true,"Table I, N = 22, L = 26, J/t = 1, column VMC+2LS"],
  ["sq26_h4_J1","cond-mat/0009149",1052,"-1.1706(1)","site","VMC+LS+FN","projected",true,"Table I, N = 22, L = 26, J/t = 1, column VMC+LS+FN"],
  ["sq26_h4_J1","cond-mat/0009149",1052,"-1.1724(1)","site","Best SR","variational",true,"Table I, N = 22, L = 26, J/t = 1, column Best SR"],
  ["sq18_h2_J0.4","cond-mat/0006353",236,"-0.6541(1)","site","FLST, p = 1, Δ_BCS = 0.20","variational",true,"Table 1.1, L = 18, N = 16, J = 0.4, p = 1, column FLST"],
  ["sq18_h2_J0.4","cond-mat/0006353",236,"-0.65420","site","exact p-LS, p = 1, Δ_BCS = 0.20","variational",false,"Table 1.1, L = 18, N = 16, J = 0.4, p = 1, column Exact"],
  ["sq18_h2_J0.4","cond-mat/0006353",237,"-0.6583(1)","site","FLST, p = 2, Δ_BCS = 0.55","variational",true,"Table 1.1, L = 18, N = 16, J = 0.4, p = 2, column FLST"],
  ["sq18_h2_J0.4","cond-mat/0006353",290,"-0.63847","site","p-LS, p = 0, Δ_BCS = 0.00","variational",false,"Table 1.2, L = 18, N = 16, J = 0.4, Δ_BCS = 0.00, p = 0",{"var":"1.174"}],
  ["sq18_h2_J0.4","cond-mat/0006353",297,"-0.64559","site","p-LS, p = 0, Δ_BCS = 0.55","variational",false,"Table 1.2, L = 18, N = 16, J = 0.4, Δ_BCS = 0.55, p = 0",{"var":"0.940"}],
  ["sq18_h2_J0.4","cond-mat/0006353",298,"-0.65638","site","p-LS, p = 1, Δ_BCS = 0.55","variational",false,"Table 1.2, L = 18, N = 16, J = 0.4, Δ_BCS = 0.55, p = 1",{"var":"0.191"}],
  ["sq18_h2_J0.4","cond-mat/0006353",299,"-0.65826","site","p-LS, p = 2, Δ_BCS = 0.55","variational",false,"Table 1.2, L = 18, N = 16, J = 0.4, Δ_BCS = 0.55, p = 2",{"var":"0.060"}],
  ["sq18_h2_J0.4","cond-mat/0006353",300,"-0.65882","site","p-LS, p = 3, Δ_BCS = 0.55","variational",false,"Table 1.2, L = 18, N = 16, J = 0.4, Δ_BCS = 0.55, p = 3",{"var":"0.018"}],
  ["sq18_h2_J0.4","cond-mat/0006353",301,"-0.65898","site","p-LS, p = 4, Δ_BCS = 0.55","variational",false,"Table 1.2, L = 18, N = 16, J = 0.4, Δ_BCS = 0.55, p = 4",{"var":"0.005"}],
  ["sq18_h2_J0.4","cond-mat/0006353",302,"-0.65902","site","p-LS, p = 5, Δ_BCS = 0.55","variational",false,"Table 1.2, L = 18, N = 16, J = 0.4, Δ_BCS = 0.55, p = 5",{"var":"0.002"}],
  ["sq18_h2_J0.4","cond-mat/0006353",303,"-0.65904","site","p-LS, p = 6, Δ_BCS = 0.55","variational",false,"Table 1.2, L = 18, N = 16, J = 0.4, Δ_BCS = 0.55, p = 6",{"same":true,"var":"0.0005"}],
  ["sq18_h2_J0.4","cond-mat/0006353",304,"-0.65904","site","p-LS, p = 7, Δ_BCS = 0.55","variational",false,"Table 1.2, L = 18, N = 16, J = 0.4, Δ_BCS = 0.55, p = 7",{"same":true,"var":"0.0001"}],
  ["sq18_h2_J0.4","cond-mat/0006353",305,"-0.65904","site","exact (p = ∞)","exact",false,"Table 1.2, L = 18, N = 16, J = 0.4, p = ∞ (the exact ground state)",{"same":true}],
  ["sq64_h8_J0.4","cond-mat/0110460",154,"−0.66672(6)","site","FN+2LS","projected",true,"text: 8 holes on the 8 x 8 lattice, J/t = 0.4, energy per site (best variational energy per site (FN+2LS))"],
  ["sq64_h8_J0.4","cond-mat/0110460",156,"−0.671(1)","site","zero variance extrapolation","extrapolated",true,"text: 8 holes on the 8 x 8 lattice, J/t = 0.4, energy per site (the zero variance extrapolation)"],
  ["sq64_h8_J0.4","cond-mat/0110460",157,"−0.64266(8)","site","VMC","variational",true,"text: 8 holes on the 8 x 8 lattice, J/t = 0.4, energy per site (the pure variational calculation)"],
  ["sq64_h14_J0.2","cond-mat/0104067",410,"-0.6443(1)","site","PL0, power = 0","variational",true,"Table I, 50 electrons on 8 x 8, J/t = 0.2, PL0, power 0"],
  ["sq64_h14_J0.2","cond-mat/0104067",410,"-0.6709(1)","site","PL1, power = 0","variational",true,"Table I, 50 electrons on 8 x 8, J/t = 0.2, PL1, power 0"],
  ["sq64_h14_J0.2","cond-mat/0104067",410,"-0.6819(11)","site","PL2, power = 0","variational",true,"Table I, 50 electrons on 8 x 8, J/t = 0.2, PL2, power 0"],
  ["sq64_h14_J0.2","cond-mat/0104067",411,"-0.6573(4)","site","PL0, power = 2","variational",true,"Table I, 50 electrons on 8 x 8, J/t = 0.2, PL0, power 2"],
  ["sq64_h14_J0.2","cond-mat/0104067",411,"-0.6768(2)","site","PL1, power = 2","variational",true,"Table I, 50 electrons on 8 x 8, J/t = 0.2, PL1, power 2"],
  ["sq64_h14_J0.2","cond-mat/0104067",411,"-0.6833(11)","site","PL2, power = 2","variational",true,"Table I, 50 electrons on 8 x 8, J/t = 0.2, PL2, power 2"],
  ["sq64_h14_J0.2","cond-mat/0104067",412,"-0.6657(6)","site","PL0, power = 4","variational",true,"Table I, 50 electrons on 8 x 8, J/t = 0.2, PL0, power 4"],
  ["sq64_h14_J0.2","cond-mat/0104067",412,"-0.6803(6)","site","PL1, power = 4","variational",true,"Table I, 50 electrons on 8 x 8, J/t = 0.2, PL1, power 4"],
  ["sq64_h14_J0.2","cond-mat/0104067",412,"-0.6851(29)","site","PL2, power = 4","variational",true,"Table I, 50 electrons on 8 x 8, J/t = 0.2, PL2, power 4"],
  ["sq64_h14_J0.2","cond-mat/0104067",413,"-0.6735(9)","site","PL0, power = 6","variational",true,"Table I, 50 electrons on 8 x 8, J/t = 0.2, PL0, power 6"],
  ["sq64_h14_J0.2","cond-mat/0104067",413,"-0.6820(8)","site","PL1, power = 6","variational",true,"Table I, 50 electrons on 8 x 8, J/t = 0.2, PL1, power 6"],
  ["sq64_h14_J0.2","cond-mat/0104067",414,"-0.6769(12)","site","PL0, power = 8","variational",true,"Table I, 50 electrons on 8 x 8, J/t = 0.2, PL0, power 8"],
  ["sq64_h14_J0.2","cond-mat/0104067",414,"-0.6855(13)","site","PL1, power = 8","variational",true,"Table I, 50 electrons on 8 x 8, J/t = 0.2, PL1, power 8"],
  ["sq64_h14_J0.2","cond-mat/0104067",458,"−0.6881(35)","site","PL0, power → ∞ (exponential fit)","extrapolated",true,"text below Fig. 6: E0 of the fit of the PL0 energies to infinite power, 50 electrons on 8 x 8, J/t = 0.2"],
  ["sq64_h14_J0.2","cond-mat/0104067",459,"−0.6904(48)","site","PL1, power → ∞ (exponential fit)","extrapolated",true,"text below Fig. 6: E0 of the fit of the PL1 energies to infinite power, 50 electrons on 8 x 8, J/t = 0.2"],
  ["lad2x11_h2_J0.5","cond-mat/0010072",288,"−  12.99978","total","ED (sector S = 0, K = (0,0))","exact",false,"footnote 7: E_GS of the 2 x 11 ladder with two holes, sector (S = 0, K = (0, 0)), J/t = 0.5"],
  ["lad2x13_h2_J0.5","cond-mat/0010072",289,"− 14.90765","total","ED (sector S = 0, K = (0,0))","exact",false,"footnote 7: E_GS of the 2 x 13 ladder with two holes, sector (S = 0, K = (0, 0)), J/t = 0.5"],
  ["lad3x6_h1_J0.5","cond-mat/9706147",609,"-10.40757","total","Lanczos","exact",false,"Table I, 3 x 6 isotropic ladder, 1 hole, lowest entry of the column (k = π/2, R = -1)"],
  ["lad3x6_h2_J0.5","cond-mat/9706147",599,"-11.80680","total","Lanczos","exact",false,"Table I, 3 x 6 isotropic ladder, 2 holes, lowest entry of the column (k = 0, R = +1)"],
  ["sq16O_h2_J0.4","1908.10000",64,"-0.56428(2)","site","E_fPEPS (D = 12, Dc = 56)","variational",true,"journal Supplementary Information, Table S2, row 4×4",FPEPS_SI],
  ["sq16O_h2_J0.4","1908.10000",94,"-0.56436","site","E_ED","exact",false,"text: E_ED of the 4 x 4 lattice with 2 holes, J/t = 0.4, open boundaries"],
  ["cyl6x16_h8_J0.35","cond-mat/0103096",784,"−52.284","total","SU(2) DMRG, m = 500","variational",false,"Table I, 16 x 6, J = 0.35, 8 holes, cylindrical boundaries, SU(2) basis, m = 500"],
  ["cyl6x16_h8_J0.35","cond-mat/0103096",786,"−52.463","total","SU(2) DMRG, m = 800","variational",false,"Table I, 16 x 6, J = 0.35, 8 holes, cylindrical boundaries, SU(2) basis, m = 800"],
  ["cyl6x16_h8_J0.35","cond-mat/0103096",788,"−52.520","total","SU(2) DMRG, m = 1200","variational",false,"Table I, 16 x 6, J = 0.35, 8 holes, cylindrical boundaries, SU(2) basis, m = 1200"],
  ["cyl6x16_h8_J0.35","cond-mat/0103096",789,"−52.65 ± 0.05","total","SU(2) DMRG, m → ∞ (zero truncation error)","extrapolated",false,"Table I, 16 x 6, J = 0.35, 8 holes, cylindrical boundaries, estimate extrapolated to zero truncation error"],
  ["sq64O_h1_J1/3","2602.21206",200,"−71.467","total","VMC (single-hole ansatz with antimeron, Eq. 6)","variational",true,"text: E_tot(VMC) of the 8 x 8 lattice, OBC, one hole, t = 3, J = 1"],
  ["sq64O_h1_J1/3","2602.21206",201,"−72.979","total","DMRG","variational",false,"text: E_tot(DMRG) of the 8 x 8 lattice, OBC, one hole, t = 3, J = 1"],
  ["sq64O_h1_J1/3","2602.21206",1148,"-67.98","total","|Ψ_Bloch⟩_1h","variational",true,"Table III, E_tot, row |Ψ_Bloch⟩_1h"],
  ["sq64O_h1_J1/3","2602.21206",1149,"-71.42","total","|Ψ_Lanczos⟩_1h","variational",true,"Table III, E_tot, row |Ψ_Lanczos⟩_1h"],
  ["flake24_h1_J1/3","2406.16865",156,"-20.189","total","|Ψ_0⟩_1h","variational",true,"Table I, E_tot, row |Ψ_0⟩_1h, 24-site cluster, t/J = 3"],
  ["flake24_h1_J1/3","2406.16865",157,"-22.934","total","|Ψ_±1⟩_1h","variational",true,"Table I, E_tot, row |Ψ_±1⟩_1h, 24-site cluster, t/J = 3"],
  ["flake24_h1_J1/3","2406.16865",158,"-24.241","total","|Ψ̃_±1⟩_1h","variational",true,"Table I, E_tot, row |Ψ̃_±1⟩_1h, 24-site cluster, t/J = 3"],
  ["flake24_h1_J1/3","2406.16865",159,"-24.782","total","ED","exact",false,"Table I, E_tot, row ED, 24-site cluster, t/J = 3"],
  ["flake24_h2_J1/3","2406.16865",360,"-21.498","total","|Ψ_0⟩_2h","variational",true,"Table III, E_tot, row |Ψ_0⟩_2h, 24-site cluster, t/J = 3"],
  ["flake24_h2_J1/3","2406.16865",361,"-26.676","total","|Ψ_±1⟩_2h","variational",true,"Table III, E_tot, row |Ψ_±1⟩_2h, 24-site cluster, t/J = 3"],
  ["flake24_h2_J1/3","2406.16865",370,"-28.656","total","|Ψ̃_±1⟩_2h","variational",true,"accepted manuscript, Table III, E_tot, row |Ψ̃_±1⟩_2h, 24-site cluster, t/J = 3",AM_2H],
  ["flake24_h2_J1/3","2406.16865",362,"-29.834","total","ED","exact",false,"Table III, E_tot, row ED, 24-site cluster, t/J = 3"],
  ["sq32_h1_J0.3_tp0.3_tpp-0.2","cond-mat/0508035",68,"−13.913616","total","exact diagonalization","exact",false,"Table I, E_Nc for Nc = 1 charge carriers of the electron-doped model (t = -1, t' = 0.3, t'' = -0.2, J = 0.3)"],
  ["sq32_h2_J0.3_tp0.3_tpp-0.2","cond-mat/0508035",69,"−16.601689","total","exact diagonalization","exact",false,"Table I, E_Nc for Nc = 2 charge carriers of the electron-doped model (t = -1, t' = 0.3, t'' = -0.2, J = 0.3)"],
  ["sq32_h4_J0.3_tp0.3_tpp-0.2","cond-mat/0508035",70,"−20.461647","total","exact diagonalization","exact",false,"Table I, E_Nc for Nc = 4 charge carriers of the electron-doped model (t = -1, t' = 0.3, t'' = -0.2, J = 0.3)"],
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
const text = {};
const linesOf = a => (text[a] ??= fs.readFileSync(`sources/${a.replace("/", "-")}.txt`, "utf8").split("\n"));
const out = [];
for (const [key, a, line, printed, norm, method, bound, sampled, where, extra = {}] of READINGS) {
  const def = I[key]; if (!def) throw new Error(`no instance ${key}`);
  const file = extra.file ?? a, L = linesOf(file), want = printed.replace(/\s+/g, " ");
  const at = [0, -1, 1, -2, 2, -3, 3, -4, 4, -5, 5].map(d => line + d).find(k => (L[k - 1] ?? "").replace(/\s+/g, " ").includes(want));
  if (at == null) throw new Error(`${file}: '${printed}' not found at line ${line}`);
  // a printed variance is a whole token of the line the energy was found on
  if (extra.var != null && !L[at - 1].split(/\s+/).includes(extra.var)) throw new Error(`${file}: variance '${extra.var}' not on line ${at}`);
  const p = parse(printed); if (!p) throw new Error(`cannot parse ${printed}`);
  const div = norm === "total" ? def.n_sites : 1;
  const { id, model, lattice, n_sites, boundary, params, cluster } = def;
  out.push({
    instance_id: id, eps: +(p.v / div).toPrecision(15), tol: +(0.5 * 10 ** -p.dec / div).toPrecision(3),
    sigma_per_site: p.sigma == null ? null : +(p.sigma / div).toPrecision(6),
    var_per_site: extra.var == null ? null : +(+extra.var / n_sites).toPrecision(12),
    arxiv: a, peer_reviewed: REF[a].pr, origin: extra.quoted ? "quoted" : "own", bound_type: bound, method,
    ...(extra.bound_type_reason ? { bound_type_reason: extra.bound_type_reason } : {}),
    reference: extra.ref ?? (extra.quoted ? PRIVATE[a] : REF[a].ref),
    evidence: [`${where} (line ${at})`, extra.var != null && VAR_NOTE(extra.var), extra.note, extra.version ?? VERSION(a)].filter(Boolean).join("; "),
    convention_check: CONV[a], reported_as: printed, confidence: "high",
    verified_by: extra.verified_by ?? "first reading and an adversarial second reading (2026-10-22)",
    variance_as_reported: extra.var == null ? null : `ΔE_p x L^2 = ${extra.var}`, defect: null,
    sampled,
    ...(extra.same ? { same_value_distinct_method: true } : {}),
    ...(SCALE[a] ? { scale: SCALE[a][0], source_couplings: SCALE[a][1] } : {}),
    create: { model, lattice, n_sites, boundary, params, cluster },
  });
}
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + "\n");
console.log(`${out.length} rows on ${new Set(out.map(r => r.instance_id)).size} instances -> ${OUT}`);
