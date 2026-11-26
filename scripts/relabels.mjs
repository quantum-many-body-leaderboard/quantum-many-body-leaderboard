// Instances whose name carries a different coupling or size from the one their rows were computed
// at (see RULES.md 11), and Hubbard rows that go on the U their own source prints. Read by
// apply_relabels.mjs.
//
// VarBench's Hubbard couplings between 1 and 10 are the grid 10^(k/9). Five 4x4 instance names
// carry a rounded or mistyped one (2.1544, 3.5981, 7.74264) and the run scripts behind them set
// that U, and the Robledo Moreno et al. paper (arXiv:2111.10420) prints its tables at the rounded
// labels 0.6, 2.15, 3.6 and 7.75. Ruled 2026-11-26 (RULES.md 5, 11): no fact rests on a computation
// of QMBL's own, so every row goes on the U its own source prints and the labels are taken as
// printed. A row VarBench's run script ran (its exact diagonalization and its DMRG) stays on the U
// the script sets; a row whose source is the paper (every paper table cell, and the VMC rows
// VarBench takes from the paper) goes on the instance at the paper's label. The paper rows are
// loaded onto those instances by their pass files; the entries below move the VarBench rows that
// link the paper, and leave the QMBL exact row where it was (its fate is a separate decision).
// The Nf = 4 DMRG row of square_16_P_4_7.74264 is the one VarBench row whose script and name
// disagree: programs/dmrg_itensors_hubbard/square_16_P_4_7.74264.jl sets U = 10 (a copy of the
// U = 10 file), but its energy -16.5091541 lies 0.37 below the printed exact energy at U = 10
// (-16.1432081, arXiv:2111.10420 Table I) and 7e-7 above the printed one at 7.75 (-16.5091548),
// so it goes on the 7.75 instance (ruled 2026-11-26).
// VarBench's impurity names end in the number of bath sites per spin-orbital (its Impurity/README.md,
// "Naming"), which QMBL reads as n_sites. SB-DMFT-MI-HF_9 has ten: at U = 8 and half filling its run
// script discretises the bath with Nbath + 1 sites, the Hamiltonian file holds ten per spin, and QMBL's
// exact diagonalization reproduces both rows on eleven orbitals per spin (impurity and bath).
//
// from, to:  instance ids; `to` takes every row not listed in `keep`; `to: null` moves nothing
// params:    the instance parameters that change
// n_sites:   the size, where that is what the name has wrong
// keep:      rows that stay on `from`: published method string and energy, and why
// exact:     the ground state at `from`'s U, from the two codes (the first is stored), or null for none
// ruled:    the date a ruling set the entry's current form (the instance pages show it)
// paper_label: the rows move to the instance at the paper's rounded label (the pass files create
//            it); coverage stays where its pass put it
// reason:    what was wrong with the name, or why the rows moved, for the instance page
// evidence:  where the reader checks it (default checks/hubbard-u-labels/); checked_on, codes:
//            the date and the codes of the check (default the U relabels' own)

const CHECKED = "2026-09-16";
const CODES = "Lanczos ED over the full fixed-(N_up, N_dn) space, no symmetry, t = 1: numpy/scipy (checks/hubbard-u-labels/ed_check.py) and node (ed_lib.mjs, run_fermions.mjs)";
const EVIDENCE = "checks/hubbard-u-labels/";
const RULED = "2026-11-26";
const PAPER = "sources/2111.10420.txt";
const why = (U, extra = "") => `its run script sets U = ${U}; it stays on the U its script sets (ruled 2026-11-26).${extra}`;
const reason = (label, U) => `The paper (arXiv:2111.10420) prints its tables at U = ${label}, and VarBench's run scripts for the same tables set U = ${U}. Ruled 2026-11-26: each row goes on the U its own source prints, and the paper's label is taken as printed; this instance holds the rows printed at U = ${label}, the VMC rows VarBench takes from the paper among them, and the instance at U = ${U} holds the rows VarBench's scripts ran.`;

export const RELABELS = [
  {
    from: "Hubbard/square_16_P_4_3.5981", to: "Hubbard/square_16_P_4_3.6", params: { U: 3.6 }, paper_label: true,
    reason: reason("3.6", "3.5981"),
    keep: [{ method: "Exact diagonalization", energy: -17.698030018702067, why: why("3.5981") },
      { method: "DMRG (MaxBondDim ~3200)", energy: -17.69623, why: why("3.5981", " It sits 5.05e-6 above the ground state at that U (variance per unit energy error 0.41).") }],
    exact: [-17.69623505010233, -17.696235050104434],
    computed_by: "qmbl",
    ruled: RULED, evidence: PAPER,
  },
  {
    from: "Hubbard/square_16_P_5_3.5981", to: "Hubbard/square_16_P_5_3.6", params: { U: 3.6 }, paper_label: true,
    reason: reason("3.6", "3.5981"),
    keep: [{ method: "Exact diagonalization", energy: -19.891637199948672, why: why("3.5981") },
      { method: "DMRG (MaxBondDim = 7000)", energy: -19.88822918, why: why("3.5981", " It sits 1.45e-8 above the ground state at that U (variance per unit energy error 20).") }],
    exact: [-19.88822919448899, -19.88822919445522],
    computed_by: "qmbl",
    ruled: RULED, evidence: PAPER,
  },
  {
    from: "Hubbard/square_16_P_5_2.1544", to: "Hubbard/square_16_P_5_2.15", params: { U: 2.15 }, paper_label: true,
    reason: reason("2.15", "2.1544"),
    keep: [{ method: "Exact diagonalization", energy: -21.21223577699911, why: why("2.1544") },
      { method: "DMRG (MaxBondDim 7000)", energy: -21.2122722, why: why("2.1544", " It sits 3.21e-8 above the ground state at that U (variance per unit energy error 0.81).") }],
    exact: [-21.212272232092317, -21.212272232074348],
    computed_by: "qmbl",
    ruled: RULED, evidence: PAPER,
  },
  {
    from: "Hubbard/square_16_P_5_7.74264", to: "Hubbard/square_16_P_5_7.75", params: { U: 7.75 }, paper_label: true,
    reason: reason("7.75", "7.74264"),
    keep: [{ method: "Exact diagonalization", energy: -17.60373155517909, why: why("7.74264") },
      { method: "DMRG (MaxBondDim = 7000)", energy: -17.6037303, why: why("7.74264") }],
    exact: null,
    ruled: RULED, evidence: PAPER,
  },
  {
    // The DMRG row (-16.5091541) leaves for 7.75: see the header.
    from: "Hubbard/square_16_P_4_7.74264", to: "Hubbard/square_16_P_4_7.75", params: { U: 7.75 }, paper_label: true,
    reason: reason("7.75", "7.74264") + " The DMRG row of the 4 + 4 sector is here too: its script sets U = 10 (a copy of the U = 10 file), and its energy fits the printed exact energy at 7.75 to 7e-7 (ruled 2026-11-26).",
    keep: [{ method: "Exact diagonalization", energy: -16.509154825265142, why: why("7.74264") }],
    exact: null,
    ruled: RULED, evidence: PAPER,
  },
  {
    // VarBench's run scripts set U = 4.64158882 for both rows; nothing moves. The exact row QMBL
    // computed stays on the instance.
    from: "Hubbard/chain_14_P_4_4.64158882", to: null, params: {}, paper_label: true,
    reason: "VarBench's run scripts for both rows set U = 4.64158882. Ruled 2026-11-26: each row goes on the U its own source prints.",
    keep: [{ method: "Exact diagonalization", energy: -10.896957984833337, why: why("4.64158882") },
      { method: "DMRG (MaxBondDim ~1500)", energy: -10.896957987, why: why("4.64158882", " Its variance, 8.2e-12, places the state within 7e-11 of the ground state at that U.") }],
    exact: [-10.896957987861226, -10.896957987860604],
    computed_by: "qmbl",
    ruled: RULED,
  },
  {
    // Nothing was computed at nine bath sites, so both rows move and nothing stays behind.
    from: "Impurity/SB-DMFT-MI-HF_9", to: "Impurity/SB-DMFT-MI-HF_10", params: {}, n_sites: 10,
    reason: "The name's 9 is the run script's Nbath (varbench/methods scripts/Impurity/SB-DMFT-MI-HF_9.py, line 17); at U = 8 and half filling the script discretises the bath with Nb = Nbath + 1 = 10 sites per spin-orbital (lines 41-44), and the Hamiltonian file it was run on (HamParams/SB-DMFT-MI_9.h5) holds ten. Both rows were computed there: QMBL's exact diagonalization on eleven orbitals per spin (the impurity and ten bath sites; N_up = 6, N_dn = 5, dimension 213444) reproduces both to 1e-13, and the stored E_inf follows only from the ten-site bath.",
    keep: [], exact: null,
    checked_on: "2026-09-29", evidence: "checks/cost/ed/results/Impurity--SB-DMFT-MI-HF_9.json",
  },
].map(r => ({ checked_on: CHECKED, codes: CODES, evidence: EVIDENCE, ...r }));
