// Generator of passes/rows/sweep-rows-2026-11-26-kbgapnew.json: the energies the
// 2026-11-26 Ketboard/tachys gap pass found on instances QMBL did not have, the instances they
// create, and the rest of the J2 = 1/8 triangular table of Iqbal et al. 2016 (SWEEP.md, 2026-11-26).
//
// - arXiv:2506.08329 (Du, Chen & Chan, Phys. Rev. B 113, 085134), Supplemental Table 2: the open
//   24-site Hubbard chain at U = 8, N_up = N_dn = 10, Hubbard/chain_24_O_10_8.
// - arXiv:2403.07795 (Rende, Goldt, Becca & Viteritti, Phys. Rev. Research 6, 043280), Table I:
//   the periodic 100-site J1-J2 chain at J2 = 0.1, 0.2, 0.3, 0.4, 0.6, J1J2/chain_100_P_<J2>.
// - arXiv:2608.18065 (Attar, Aboussalah & Hibat-Allah), Table 2: the open 200-site transverse-field
//   Ising chain at J = h = 1, TFIsing/chain_200_O_1.
// - arXiv:2308.09664 (Wang, Wu, He & Lu, Phys. Rev. B 109, 245120), Table II: the periodic 8 x 8 and
//   16 x 16 transverse-field Ising model at lambda = 3.05, TFIsing/square_<N>_P_3.05.
// - The J1-J2 triangular lattice at J2 = 1/8 on L x L tori: Iqbal, Hu, Thomale, Poilblanc & Becca,
//   Phys. Rev. B 93, 144411 (arXiv:1601.06018), Tables III and IV (L = 6, 8, 10, 12, 14, 20);
//   Roth, Szabo & MacDonald, Phys. Rev. B 108, 054410 (arXiv:2211.07749), Table III (36 sites);
//   Kochkov et al., arXiv:2110.06390, Table IV (36 sites). J1J2/triangular_<N>_P_0.125 for
//   N = 36, 64, 100, 196, 400; the 144-site instance exists.
// - arXiv:2611.16430 (Shang & Yang), Table I: the periodic 32 x 32 torus at t'/t = -0.2, U = 8,
//   δ = 1/8, Hubbard/square_1024_P_448_8_t12_-0.2 (an existing instance; its create header is
//   here because this file is applied before the pass file that first fills it).
// The open 4 x 4 and 6 x 6 rows of arXiv:2506.08329 go on existing instances (see below).
//
// Every number below is copied from the committed source text as printed, and this script stops
// unless it finds the printed string on (or within five lines of) its cited line of the .txt text
// (line numbers as grep -n counts them), or, for the two papers whose tables only the arXiv HTML
// renders whole (2506.08329, 2608.18065), inside the cited table of the .html, compared with all
// whitespace removed. The script only fixes the per-site normalisation, the printed error bar and
// the instance. Quoted cells are not here: they wait for their primary (quoted-list.txt of the pass).
//
// usage: node scripts/instances_2026_11_26.mjs   (writes the pass file; the build applies it)
import fs from "node:fs";

const OUT = "passes/rows/sweep-rows-2026-11-26-kbgapnew.json";

// --- references (arXiv metadata, 2026-11-26; reference strings of rows QMBL already carries where
// the paper has some) -------------------------------------------------------------------------
const REF = {
  "2506.08329": { pr: true, ref: "Du, Chen & Chan, Neuralized Fermionic Tensor Networks for Quantum Many-Body Systems, Phys. Rev. B 113, 085134 (2026), doi:10.1103/x8vl-qf14, arXiv:2506.08329" },
  "2403.07795": { pr: true, ref: "Rende, Goldt, Becca & Viteritti, Fine-tuning Neural Network Quantum States, Phys. Rev. Research 6, 043280 (2024), doi:10.1103/PhysRevResearch.6.043280, arXiv:2403.07795" },
  "2608.18065": { pr: false, ref: "Attar, Aboussalah & Hibat-Allah, Quantum Geometric Tensor Preconditioning for Stable Training of Recurrent Neural Quantum States, arXiv:2608.18065" },
  "2308.09664": { pr: true, ref: "Wang, Wu, He & Lu, Variational optimization of the amplitude of neural-network quantum many-body ground states, Phys. Rev. B 109, 245120 (2024), arXiv:2308.09664" },
  "1601.06018": { pr: true, ref: "Iqbal, Hu, Thomale, Poilblanc & Becca, Spin liquid nature in the Heisenberg J1-J2 triangular antiferromagnet, Phys. Rev. B 93, 144411 (2016), arXiv:1601.06018" },
  "2211.07749": { pr: true, ref: "Roth, Szabo & MacDonald, High-accuracy variational Monte Carlo for frustrated magnets with deep neural networks, Phys. Rev. B 108, 054410 (2023), arXiv:2211.07749" },
  "2110.06390": { pr: false, ref: "Kochkov, Pfaff, Sanchez-Gonzalez, Battaglia & Clark, Learning ground states of quantum Hamiltonians with graph networks, arXiv:2110.06390" },
  "2611.16430": { pr: false, ref: "Shang & Yang, Multi-reference variational states resolve stripe selection and local d-wave pairing in the Hubbard model, arXiv:2611.16430" },
};
const VERSION = {
  "2506.08329": "version read: arXiv v3 (HTML, sources/2506.08329.html); journal version Phys. Rev. B 113, 085134 (2026) not read in this pass",
  "2403.07795": "version read: arXiv v3 text (sources/2403.07795.txt); journal version Phys. Rev. Research 6, 043280 (2024) not read in this pass",
  "2608.18065": "version read: arXiv v1 (HTML, sources/2608.18065.html); no journal version (arXiv metadata, 2026-11-26)",
  "2308.09664": "version read: arXiv v2 text (sources/2308.09664.txt); journal version Phys. Rev. B 109, 245120 (2024) not read in this pass",
  "1601.06018": "version read: arXiv v4 text (sources/1601.06018.txt); journal version Phys. Rev. B 93, 144411 (2016) not read in this pass",
  "2211.07749": "version read: arXiv v2 text (sources/2211.07749.txt); journal version Phys. Rev. B 108, 054410 (2023) not read in this pass",
  "2110.06390": "version read: arXiv v1 text (sources/2110.06390.txt); no journal version (arXiv metadata, 2026-11-26)",
  "2611.16430": "version read: arXiv v1 text (sources/2611.16430.txt); no journal version (arXiv metadata, 2026-11-26)",
};

// --- instances ---------------------------------------------------------------------------
const I = {};
I.hub24 = { id: "Hubbard/chain_24_O_10_8", model: "Hubbard", lattice: "chain", n_sites: 24, boundary: "O", params: { Nf: 10, U: 8 } };
for (const J2 of [0.1, 0.2, 0.3, 0.4, 0.6])
  I[`j1j2c_${J2}`] = { id: `J1J2/chain_100_P_${J2}`, model: "J1J2", lattice: "chain", n_sites: 100, boundary: "P", params: { J2 } };
I.tfi200 = { id: "TFIsing/chain_200_O_1", model: "TFIsing", lattice: "chain", n_sites: 200, boundary: "O", params: { h: 1 } };
for (const L of [8, 16])
  I[`tfi${L}`] = { id: `TFIsing/square_${L * L}_P_3.05`, model: "TFIsing", lattice: "square", n_sites: L * L, boundary: "P", params: { h: 3.05 } };
const TORUS = L => `${L} x ${L} torus of the triangular lattice, periodic along both primitive vectors (Iqbal et al., PRB 93, 144411, Table IV: 'on 6x6 and 8x8 tori'; Table III lists the L = 6 to 20 clusters of the same construction)`;
for (const L of [6, 8, 10, 14, 20])
  I[`tri${L}`] = { id: `J1J2/triangular_${L * L}_P_0.125`, model: "J1J2", lattice: "triangular", n_sites: L * L, boundary: "P", params: { J2: 0.125 }, cluster: TORUS(L) };
I.tri12 = { id: "J1J2/triangular_144_P_0.125", existing: true };
I.hub4h = { id: "Hubbard/square_16_O_8_8", existing: true };
I.hub4d = { id: "Hubbard/square_16_O_7_8", existing: true };
I.hub6 = { id: "Hubbard/square_36_O_16_8", existing: true };
I.hub32t = { id: "Hubbard/square_1024_P_448_8_t12_-0.2", model: "Hubbard", lattice: "square", n_sites: 1024, boundary: "P", params: { Nf: 448, U: 8, t1: 1, t2: -0.2 } };

// --- conventions per source ---------------------------------------------------------------
const IMPLIED = "per site implied, not stated (RULES.md 8, 2026-11-26): the table prints no normalisation, and only the per-site reading fits the printed numbers";
const CONV = {
  "2506.08329": "Eq. (3): H = -t sum_<i,j>,σ (c†_iσ c_jσ + h.c.) + U sum_i n_i↑ n_i↓, 't = 1 and U = 8 throughout', open boundary conditions; Table 2 caption: 'Energy per site ... L = 24 one-dimensional chain at hole doping n_h = 1/6 (N_e = 20, N_↑ = N_↓ = 10)'.",
  "2403.07795": `Eq. (4): H = J1 sum_<i,j> S_i.S_j + J2 sum_<<i,j>> S_i.S_j, spin-1/2 operators; Table I caption: 'Variational ground-state energies for the J1-J2 Heisenberg chain with system size N = 100 ... periodic boundary conditions'. ${IMPLIED}: a total for N = 100 would be about -42 and a Pauli-form value about -1.7, so the printed -0.38 to -0.43 are S.S energies per site.`,
  "2608.18065": "Eq. (37): H = -J sum_{i=1}^{N-1} σ^z_i σ^z_{i+1} - h sum_i σ^x_i with Pauli matrices, open boundaries, J = 1 = h; N = 200 spins (Fig. 2 text); Table 2 columns E_Adam/N, E_minSR/N, E_ref/N.",
  "2308.09664": `Eq. (15): H = -sum_<i,j> σ^z_i σ^z_j - λ sum_i σ^x_i with Pauli matrices, λ = 3.05, periodic L x L lattices; Table II caption: 'Ground state energies of the two-dimensional transverse field Ising model with L = 8 and 16'. ${IMPLIED}: totals would be about -207 (L = 8) and -829 (L = 16), so the printed -3.24 are energies per site.`,
  "1601.06018": "H = J1 sum_<i,j> S_i.S_j + J2 sum_<<i,j>> S_i.S_j, spin-1/2; Table IV caption: 'the estimates of the ground-state energy per site (in units of J1) ... on 6x6 and 8x8 tori'. Table III gives the same energies per site for p = 0, 1 and 2 Lanczos steps, its 'Ground state' column the zero-variance estimate (caption).",
  "2211.07749": "Table III caption: 'Optimised ground-state energies (in units of J1/spin) ... for the J1-J2 triangular-lattice Heisenberg model'; the 36-site row at J2/J1 = 1/8 prints the exact energy -0.515564 next to it, the value of Iqbal et al.'s 6x6 torus.",
  "2611.16430": "Eq. (1): H = -t sum_<ij>,σ (c†c + H.c.) - t' sum_<<ij>>,σ (c†c + H.c.) + U sum n_i↑ n_i↓, t = 1, U/t = 8, periodic L x L tori, hole doping δ = 1/8 in the sector N_↑ = N_↓ (448 + 448 electrons on 1024 sites); Table I caption: 'ground-state energies per site', row 32x32, t'/t = -0.2.",
  "2110.06390": "Table IV caption: 'Numerical values of variational energies per spin for GNN, GNN-2 models and ResNet baseline'; periodic clusters, J2 = 0.125, N = 36; Table II prints the exact value -0.515564 for this cluster from Iqbal et al. [21].",
};

// --- readings ----------------------------------------------------------------------------
// [instance key, source, file (txt line number, or "html:<anchor>"), as printed, method, bound_type, sampled, where, extra]
const R = [];
const HUB = "html:Table 2: </span>Energy per site of pure fMPS";
for (const [method, cells] of [["fMPS-SU", ["-0.490(2)", "-0.531(7)", "-0.532(8)"]], ["fMPS-GO", ["-0.5037(8)", "-0.5348(0)", "-0.5470(4)"]],
  ["NN-fMPS-GO", ["-0.56143\\pm 6\\times 10^{-5}", "-0.56212\\pm 4\\times 10^{-5}", "-0.56244\\pm 3\\times 10^{-5}"]]])
  cells.forEach((c, k) => R.push(["hub24", "2506.08329", HUB, c, `${method}, D = ${[4, 6, 8][k]}`, "variational", true,
    `Supplemental Table 2 (S-5.1), row '${method}', column D = ${[4, 6, 8][k]}`,
    { note: c === "-0.5348(0)" ? "printed with the error bar '(0)': below the last printed digit; stored without sigma" : null }]));
R.push(["hub24", "2506.08329", HUB, "-0.56309964", "DMRG, fMPS bond dimension 1000", "variational", false,
  "Supplemental Table 2 caption: 'The DMRG reference energy per site is -0.56309964, obtained using pyBlock2 with fMPS bond dimension 1000 and truncated weight dw = 1.6e-10'", {}]);
// The open 4 x 4 and 6 x 6 lattices of Supplemental Tables 3-5 (existing instances). Only the
// paper's own rows: the fPEPS-SU, fPEPS-GO and DMRG cells are quoted from its Ref. [19]. The
// error bars are printed as '± a × 10^-b', which the workflow's row converter does not parse,
// so these rows are read here (2026-11-26).
for (const [key, T, Ds, cells, nn] of [
  ["hub4h", "Table 3: </span>Energy per site of pure fPEPS", [4, 6, 8], ["-0.42535\\pm 4\\times 10^{-5}", "-0.42541\\pm 3\\times 10^{-5}", "-0.42551\\pm 2\\times 10^{-5}"],
    [["-0.3290", "NN"], ["-0.4157", "NN-SD (MLP)"], ["-0.4247", "NN-SD (ViT)"]]],
  ["hub4d", "Table 4: </span>Energy per site of pure fPEPS", [4, 6, 8, 10], ["-0.6247\\pm 2\\times 10^{-4}", "-0.6301\\pm 2\\times 10^{-4}", "-0.63215\\pm 7\\times 10^{-5}", "-0.63231\\pm 5\\times 10^{-5}"],
    [["-0.5391", "NN"], ["-0.6125", "NN-SD (MLP)"], ["-0.6288", "NN-SD (CNN)"]]],
  ["hub6", "Table 5: </span>Energy per site of pure fPEPS", [4, 6, 8], ["-0.6370\\pm 2\\times 10^{-4}", "-0.6503\\pm 1\\times 10^{-4}", "-0.6535\\pm 1\\times 10^{-4}"], []]]) {
  const tab = T.slice(0, 7);
  cells.forEach((c, k) => R.push([key, "2506.08329", `html:${T}`, c, `NN-fPEPS-GO, D = ${Ds[k]}`, "variational", true, `Supplemental ${tab}, row 'NN-fPEPS-GO', column D = ${Ds[k]}`, {}]));
  for (const [c, m] of nn) R.push([key, "2506.08329", `html:${T}`, c, m, "variational", true, `Supplemental ${tab} caption, the ${m === "NN" ? "pure NN model" : `${m} baseline`}`, {}]);
}

const RENDE = [[299, 0.1, "-0.425417395", "-0.4254174", "-0.425218"], [300, 0.2, "-0.408572967", "-0.4085728", "-0.408453"],
  [301, 0.3, "-0.393126745", "-0.3931204", "-0.393059"], [302, 0.4, "-0.380387370", "-0.3803726", "-0.380370"], [303, 0.6, "-0.380804138", "-0.3807913", "-0.379902"]];
for (const [line, J2, dmrg, vit, ft] of RENDE) {
  R.push([`j1j2c_${J2}`, "2403.07795", line, dmrg, "DMRG (bond dimension up to 10^3)", "variational", false, `Table I, row J2/J1 = ${J2}, column DMRG`, {}]);
  R.push([`j1j2c_${J2}`, "2403.07795", line, vit, "ViT, trained from scratch", "variational", true, `Table I, row J2/J1 = ${J2}, column ViT`, { note: "the caption says the Monte Carlo error affects the last printed digit; no error bar printed" }]);
  R.push([`j1j2c_${J2}`, "2403.07795", line, ft, "ViT, pretrained at J2/J1 = 0.4 and fine-tuned", "variational", true, `Table I, row J2/J1 = ${J2}, column Fine-tuning`, { note: "the caption says the Monte Carlo error affects the last printed digit; no error bar printed" }]);
}

const ATT = "html:E_{\\textrm{minSR}}/N";
R.push(["tfi200", "2608.18065", ATT, "-1.271208(7)", "pRNN (GRU), Adam", "variational", true, "Table 2, row '1D TFIM', column E_Adam/N", {}]);
R.push(["tfi200", "2608.18065", ATT, "-1.2714254(3)", "pRNN (GRU), minSR", "variational", true, "Table 2, row '1D TFIM', column E_minSR/N", {}]);
R.push(["tfi200", "2608.18065", ATT, "-1.27142590795", "free-fermion solution", "exact", false,
  "Table 2, row '1D TFIM', column E_ref/N, printed with the citation [61] (Pfeuty, Ann. Phys. 57, 79 (1970), the free-fermion solution of the chain); the N = 200 value is first printed here", {}]);

R.push(["tfi8", "2308.09664", 283, "-3.241642(2)", "aCNN (C4v)", "variational", true, "Table II, row 'aCNN(C4v)', column L = 8", {}]);
R.push(["tfi16", "2308.09664", 283, "-3.239568(2)", "aCNN (C4v)", "variational", true, "Table II, row 'aCNN(C4v)', column L = 16", {}]);

// Iqbal et al. Table III (line, L, 0-LS, 1-LS, 2-LS, ground-state estimate) and Table IV.
const IQ = [[589, 6, "−0.501788(1)", "−0.510344(2)", "−0.512503(3)", "−0.51548(8)"], [590, 8, "−0.502410(1)", "−0.510070(1)", "−0.511950(4)", "−0.51314(4)"],
  [591, 10, "−0.501655(1)", "−0.508724(2)", "−0.510721(5)", "−0.51195(8)"], [592, 12, "−0.501828(1)", "−0.508438(3)", null, "−0.51213(10)"],
  [593, 14, "−0.501866(1)", "−0.508049(3)", "−0.510245(7)", "−0.51203(14)"], [594, 20, "−0.501915(1)", "−0.507056(3)", null, "−0.51214(15)"]];
for (const [line, L, p0, p1, p2, gs] of IQ) {
  [[p0, 0], [p1, 1], [p2, 2]].forEach(([c, p]) => c && R.push([`tri${L}`, "1601.06018", line, c, `DSL, ${p} Lanczos step${p === 1 ? "" : "s"}`, "variational", true, `Table III, row ${L}, column ${p}-LS of the ground state`, {}]));
  R.push([`tri${L}`, "1601.06018", line, gs, "DSL, zero-variance extrapolation", "extrapolated", true, `Table III, row ${L}, column 'Ground state' (zero-variance estimate from the 0, 1 and 2 Lanczos-step energies${L === 20 ? "; two points only, Fig. 8 caption" : ""})`, {}]);
}
// Table IV repeats the VMC estimates of Table III; it adds DMRG (truncation-error extrapolated) and ED.
R.push(["tri6", "1601.06018", 638, "−0.51557(5)", "DMRG, truncation-error extrapolation", "extrapolated", false, "Table IV, row DMRG*, column 6x6 torus (extrapolation in truncation error, at most 8000 SU(2) states)", {}]);
R.push(["tri8", "1601.06018", 638, "−0.5133(5)", "DMRG, truncation-error extrapolation", "extrapolated", false, "Table IV, row DMRG*, column 8x8 torus (extrapolation in truncation error, at most 8000 SU(2) states)", {}]);
R.push(["tri6", "1601.06018", 639, "−0.515564", "ED", "exact", false, "Table IV, row ED*, column 6x6 torus", {}]);

R.push(["tri6", "2211.07749", 374, "−0.515386(9)", "GCNN", "variational", true, "Table III, row J2/J1 = 1/8, N = 36, column GCNN (4 layers of 6 feature maps, 4096 Monte Carlo samples, text)", {}]);
R.push(["tri6", "2110.06390", 1187, "-0.512(2)", "GNN", "variational", true, "Table IV, row Triangular, J2 = 0.125, N = 36, column GNN", {}]);
R.push(["tri6", "2110.06390", 1187, "-0.5131(8)", "GNN-2", "variational", true, "Table IV, row Triangular, J2 = 0.125, N = 36, column GNN-2", {}]);
R.push(["tri6", "2110.06390", 1187, "-0.5007(5)", "ResNet", "variational", true, "Table IV, row Triangular, J2 = 0.125, N = 36, column ResNet", {}]);

R.push(["hub32t", "2611.16430", 422, "−0.7476(37)", "MR-nVAFQMC (K = 4, τ = 1.26, |G| = 8)", "variational", true, "Table I, row 32x32, t'/t = -0.2, MR-nVAFQMC (this work), the strictly variational state", {}]);
R.push(["hub32t", "2611.16430", 421, "−0.7494(35)", "MR-nVAFQMC, τ^-3 → 0 extrapolation (K = 4, |G| = 8)", "extrapolated", true, "Table I, row 32x32, t'/t = -0.2, MR-nVAFQMC (this work), 'τ → ∞ extrap., not variational'", {}]);

// --- conversion --------------------------------------------------------------------------
const clean = s => s.replace(/[−–]/g, "-").replace(/\s+/g, "");
function parse(p) {
  const s = clean(p);
  let m = s.match(/^(-?\d*\.(\d+))\((\d+)\)$/);
  if (m) return { v: +m[1], sigma: +m[3] === 0 ? null : +m[3] * 10 ** -m[2].length, dec: m[2].length };
  m = s.match(/^(-?\d*\.(\d+))\\pm(\d+)\\times10\^\{(-\d+)\}$/);
  if (m) return { v: +m[1], sigma: +m[3] * 10 ** +m[4], dec: m[2].length };
  m = s.match(/^(-?\d*\.(\d+))$/);
  if (m) return { v: +m[1], sigma: null, dec: m[2].length };
  return null;
}
const lines = {}, htmls = {};
const linesOf = f => (lines[f] ??= fs.readFileSync(`sources/${f}.txt`, "utf8").split("\n"));
const htmlOf = f => (htmls[f] ??= fs.readFileSync(`sources/${f}.html`, "utf8").replace(/<annotation[^>]*>.*?<\/annotation>/gs, "").replace(/\s+/g, ""));
const out = [];
for (const [key, a, at0, printed, method, bound, sampled, where, extra] of R) {
  const def = I[key]; if (!def) throw new Error(`no instance ${key}`);
  const want = clean(printed);
  let loc;
  if (typeof at0 === "string") {
    const h = htmlOf(a), anchor = h.indexOf(clean(at0.slice(5)));
    if (anchor < 0) throw new Error(`sources/${a}.html: table anchor not found`);
    const win = h.slice(anchor - 30000, anchor + 30000);
    if (!win.includes(`alttext="${want}"`) && !win.includes(`>${want}<`) && !win.includes(want)) throw new Error(`sources/${a}.html: '${printed}' not in the cited table`);
    loc = `sources/${a}.html`;
  } else {
    const L = linesOf(a);
    const at = [0, -1, 1, -2, 2, -3, 3, -4, 4, -5, 5].map(d => at0 + d).find(k => clean(L[k - 1] ?? "").includes(want));
    if (at == null) throw new Error(`${a}: '${printed}' not found at line ${at0}`);
    loc = `sources/${a}.txt line ${at}`;
  }
  const p = parse(printed); if (!p) throw new Error(`cannot parse ${printed}`);
  const reported = printed.replace(/\\pm/, " ± ").replace(/\\times/, " × ").replace(/\s+/g, " ").replace(/10\^\{(-\d+)\}/, "10^$1");
  out.push({
    instance_id: def.id, eps: p.v, tol: +(0.5 * 10 ** -p.dec).toPrecision(3),
    sigma_per_site: p.sigma == null ? null : +p.sigma.toPrecision(6), var_per_site: null,
    arxiv: a, peer_reviewed: REF[a].pr, origin: "own", bound_type: bound, method,
    reference: REF[a].ref,
    evidence: [`${where}; ${loc}`, extra.note, VERSION[a]].filter(Boolean).join("; "),
    convention_check: CONV[a], reported_as: reported, confidence: "high",
    verified_by: "single reading (2026-11-26)", variance_as_reported: null, defect: null, sampled,
    ...(def.existing ? {} : { create: { model: def.model, lattice: def.lattice, n_sites: def.n_sites, boundary: def.boundary, params: def.params, ...(def.cluster ? { cluster: def.cluster } : {}) } }),
  });
}
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + "\n");
console.log(`${out.length} rows on ${new Set(out.map(r => r.instance_id)).size} instances -> ${OUT}`);
