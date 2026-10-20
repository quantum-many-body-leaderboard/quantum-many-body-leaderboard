// Rows removed from the table, each with its `ruled` and `reason` fields (see RULES.md 11).
// The scripts that add these rows still read them from their sources; apply_removals.mjs takes
// them out after every row is in, so each removal is one entry here and the import scripts
// stay unchanged.
export const REMOVALS = [
  // Duplicates: the same number carried twice. The row read from the original paper stays.
  {
    match: { instance: "Hubbard/square_256_PA_128_8", method: "AFQMC", energy: -134.25 },
    ruled: "2026-09-17: duplicate, the original paper's row stays",
    reason: "VarBench's copy of -134.25(3) from Qin, Shi & Zhang, PRB 94, 085103 (2016), Table IV, which add_exact_rows.mjs reads from the paper itself. The copy carried no bound_type.",
  },
  {
    match: { instance: "Heisenberg/square_100_O", method: "PEPS (bond dimension = 10)", energy: -251.4404 },
    ruled: "2026-09-17: duplicate, the original paper's row stays",
    reason: "VarBench's copy of the finite-PEPS energy of Liu, Dong, Han, Guo & He, PRB 95, 195154 (2017), which add_sweep2_rows.mjs carries with its error bar and that paper as the reference.",
  },
  {
    match: { instance: "Heisenberg/square_256_O", method: "PixelCNN (deep autoregressive)", energy: -658.890752 },
    ruled: "2026-09-17: duplicate, the original paper's row stays",
    reason: "The energy of Sharir, Levine, Wies, Carleo & Shashua, PRL 124, 020503 (2020) as quoted in a later paper's table; the row read from that paper itself (NAQS) stays.",
  },
  {
    match: { instance: "J1J2/square_100_P_0.5", method: "VMC (p = 2)", energy: -199.0196 },
    ruled: "2026-09-17: duplicate, the original paper's row stays",
    reason: "The two-Lanczos-step energy of Hu, Becca, Parola & Sorella, PRB 88, 060402 (2013), as Table I of arXiv:2310.05715 quotes it (-0.4975490(2) per site); the row read from Table III of arXiv:1304.2630 itself (-0.49755(1) per site) stays.",
  },
  {
    match: { instance: "Hubbard/square_64_PA_32_6", method: "VMC Hidden Fermion Determinant State Ansatz (N_hidden = 16. Single hidden layer fully connected net with alpha = 1). Soft mean-field constraint for Neel order.", energy: -42.676 },
    ruled: "2026-10-02: duplicate, the original paper's row stays (apply step of the 2026-09-29 verification pass, the duplicates rule of 2026-09-17)",
    reason: "The first author's VarBench upload (c810bdc, 2022-07-16) of the 8 x 8, U = 6 HFDS state of Robledo Moreno et al., PNAS 119, e2122059119, with a digit slip (-42.076 -> -42.676): the paper prints -0.6574(2) per site (SI Table 5, row L = 8, column U = 6), which add_worklist_rows.mjs carries from the paper itself as -42.0736, sigma 0.0128. A corrected copy would duplicate that row (qmbl-verify 2026-09-29, VA3-10-1073-pnas-2122059119#34, skeptic upheld). Its below-exact flag goes with it; the upload-only sigma 0.007 and variance 0.82(1) have no printed counterpart.",
  },
  {
    match: { instance: "Hubbard/square_36_PA_18_2", method: "VMC Hidden Fermion Determinant State Ansatz (N_hidden = 16. Single hidden layer fully connected net with alpha = 1). Soft mean-field constraint for Neel order.", energy: -76.162 },
    ruled: "2026-10-20: not an energy of its instance; duplicate of Hubbard/square_64_PA_32_2 (qmbl-verify 2026-10-20, BOUND rows)",
    reason: "VarBench's 6x6 U = 2 file repeats the 8x8 U = 2 line of the same first upload (-76.162 | 0.006 | 0.14(2); VarBench c810bdc, 21f00e5). -76.162 / 64 = -1.1900, PNAS 119, e2122059119, SI Table 5, row L = 8, column U = 2; that energy stays on Hubbard/square_64_PA_32_2. On 36 sites it lies 16.45 below the U = 0 ground state -59.712813, a lower bound for every U >= 0. The paper's 6x6 U = 2 value, -1.2079(1) per site = -43.4844, stays on this instance.",
  },
  {
    match: { instance: "Heisenberg/pyrochlore-2x2x2_128_P", method: "mVMC (PP + RBM + 1st step Lanczos, spin-parity projection, Number of RBM neurons: 128)", energy: -252.007 },
    ruled: "2026-10-02: duplicate, the original paper's row stays (apply step of the 2026-09-29 verification pass, the duplicates rule of 2026-09-17)",
    reason: "First author R. Pohle's VarBench upload of 2022-02-26 (380a1fe), 21 months before arXiv:2311.11561 v1, energy never updated; the paper prints the same spin-parity mVMC-RBM/Lanczos state as -0.49229(7) per site (SM Table SI, column psi+ (random), and App. B), which the table carries from the paper itself (-252.05248). The stored -252.007 is printed nowhere. The 2026-09-16 ruling to supersede the VarBench row was not applied until now (qmbl-verify 2026-09-29, VA5-hubbard-heisenberg-tfising-j1j2#21, skeptic upheld).",
  },
  {
    match: { instance: "Heisenberg/pyrochlore-3x3x3_432_P", method: "mVMC (PP + 1st step Lanczos, spin-parity projection, C3 point-group projection)", energy: -844.084 },
    ruled: "2026-10-02: duplicate, the original paper's row stays (apply step of the 2026-09-29 verification pass, the duplicates rule of 2026-09-17)",
    reason: "First author R. Pohle's VarBench upload of 2022-02-26 (7afd2cc), 21 months before arXiv:2311.11561 v1, never updated; the paper prints the same spin-parity mVMC/Lanczos state as -0.48851(3) per site (SM Table SII), which the table carries from the paper itself (-844.14528). The stored -844.084 is printed nowhere, and the linked VarBench input (RBM with 432 neurons, no C3 projection, no Lanczos step) cannot have produced it. The 2026-09-16 ruling to supersede the VarBench row was not applied until now (qmbl-verify 2026-09-29, VA5-hubbard-heisenberg-tfising-j1j2#22, skeptic upheld).",
  },
  // Declared exact, but above the exact energy (RULES.md 11).
  {
    match: { instance: "J1J2/square_36_P_0.4", method: "ED (this work)", energy: -76.283136 },
    ruled: "2026-09-18: not the exact energy, removed; the exact result stays",
    reason: "Table I of arXiv:2606.04558 prints -0.529744 per site. The ground state -76.283280827996 carried on this instance is -0.529745006 per site, which prints as -0.529745 whether rounded or truncated, so the printed number is not the exact energy at its own precision: it sits 1.006e-6 per site above it, from the same run as the four rows below (every value in that column lies above the exact energy, as a Lanczos stopped short does). The ground state is reproduced independently by our symmetric-basis Lanczos on an AMD EPYC 9654 server to 1e-13 (qmbl-runs/qmbl-verify-2026-09-17-j1j2-36) and printed as -0.529745 by Schulz, Ziman & Poilblanc, J. Phys. I 6, 675 (1996), Table II, 36(A1).",
  },
  {
    match: { instance: "J1J2/square_36_P_0.7", method: "ED (this work)", energy: -76.318416 },
    ruled: "2026-09-18: not the exact energy, removed; the exact result stays",
    reason: "Table I of arXiv:2606.04558 prints -0.529989 per site, which is 1.223e-5 per site (24.5x the half-width of its 6 printed decimals) above the ground state -76.320176597454 carried on this instance. Transcribed correctly; the calculation, not the reading, is off. The ground state is reproduced independently by our symmetric-basis Lanczos on an AMD EPYC 9654 server to 1e-13 (qmbl-runs/qmbl-verify-2026-09-17-j1j2-36) and printed as -0.530001 by Schulz, Ziman & Poilblanc, J. Phys. I 6, 675 (1996), Table II, 36(B1) - the paper's own reference for its ED. A scan of every spin-inversion-even sector of the 6x6 torus finds nothing lower.",
  },
  {
    match: { instance: "J1J2/square_36_P_0.8", method: "ED (this work)", energy: -84.45384 },
    ruled: "2026-09-18: not the exact energy, removed; the exact result stays",
    reason: "Table I of arXiv:2606.04558 prints -0.586485 per site, which is 1.600e-6 per site (3.2x the half-width of its 6 printed decimals) above the ground state -84.45407039473 carried on this instance. Transcribed correctly; the calculation, not the reading, is off. The ground state is reproduced independently by our symmetric-basis Lanczos on an AMD EPYC 9654 server to 1e-13 (qmbl-runs/qmbl-verify-2026-09-17-j1j2-36) and printed as -0.586487 by Schulz, Ziman & Poilblanc, J. Phys. I 6, 675 (1996), Table II, 36(B1) - the paper's own reference for its ED. A scan of every spin-inversion-even sector of the 6x6 torus finds nothing lower.",
  },
  {
    match: { instance: "J1J2/square_36_P_0.9", method: "ED (this work)", energy: -93.462912 },
    ruled: "2026-09-18: not the exact energy, removed; the exact result stays",
    reason: "Table I of arXiv:2606.04558 prints -0.649048 per site, which is 4.011e-6 per site (8.0x the half-width of its 6 printed decimals) above the ground state -93.463489624054 carried on this instance. Transcribed correctly; the calculation, not the reading, is off. The ground state is reproduced independently by our symmetric-basis Lanczos on an AMD EPYC 9654 server to 1e-13 (qmbl-runs/qmbl-verify-2026-09-17-j1j2-36) and printed as -0.649052 by Schulz, Ziman & Poilblanc, J. Phys. I 6, 675 (1996), Table II, 36(B1) - the paper's own reference for its ED. A scan of every spin-inversion-even sector of the 6x6 torus finds nothing lower.",
  },
  {
    match: { instance: "J1J2/square_36_P_1", method: "ED (this work)", energy: -102.867264 },
    ruled: "2026-09-18: not the exact energy, removed; the exact result stays",
    reason: "Table I of arXiv:2606.04558 prints -0.714356 per site, which is 4.433e-6 per site (8.9x the half-width of its 6 printed decimals) above the ground state -102.867902314985 carried on this instance. Transcribed correctly; the calculation, not the reading, is off. The ground state is reproduced independently by our symmetric-basis Lanczos on an AMD EPYC 9654 server to 1e-13 (qmbl-runs/qmbl-verify-2026-09-17-j1j2-36) and printed as -0.714360 by Schulz, Ziman & Poilblanc, J. Phys. I 6, 675 (1996), Table II, 36(B1) - the paper's own reference for its ED. A scan of every spin-inversion-even sector of the 6x6 torus finds nothing lower.",
  },
  {
    match: { instance: "Heisenberg/pyrochlore-2x2x2_32_P", method: "Exact diagonalization", energy: -66.1514 },
    ruled: "2026-09-29: not the exact energy, removed; the exact result stays",
    reason: "The paper's own ED, stored by VarBench as -0.5168078 per site (first-author upload ef22cb4): PRX 11, 041021 plots it at j2/j1 = 0 in Fig. 2(a) and truncates it to -0.5168 in Table II (qmbl-verify 2026-09-29, VJ2-journal-other#9). Two diagonalizations of the same 32-site cluster (VarBench's StdFace geometry) on an AMD EPYC 9654 server give the ground state -66.15792523719963, over the whole S^z = 0 space and in the fully symmetric sector of the space group, agreeing to 1.2e-11 (checks/pyrochlore-32-ed/). The stored value sits 6.5e-3 above it, 65x the 1e-4 it is printed to, so it is not the ground-state energy at its own precision. The recomputed energy is carried on this instance (add_exact_rows.mjs, batch B2).",
  },
  // Declared exact, but a per-site rounding times N that lies below the ground state: QMBL's
  // recomputed row replaces it. Its U = 4 sibling, -13.62192 = -0.85137 x 16 on
  // Hubbard/square_16_P_8_4, needs no entry here: that per-site quote is QMBL's -13.6218548212
  // rounded to its printed digits, so add_allresults_rows.mjs skips it as the exact row already
  // carried.
  {
    match: { instance: "Hubbard/square_16_P_8_8", method: "ED", energy: -8.46896 },
    ruled: "2026-09-30: QMBL's recomputed row stands, the quoted row is removed",
    reason: "The ED energy of Anderson et al., Comput. Theor. Chem. 1003, 22 (2013), which prints -8.46888 (arXiv:1207.4847 Table IV, U/t = 8), stored as the per-site -0.52931 that arXiv:2602.03031 quotes (ref. [35]) times 16 = -8.46896. Two diagonalizations of the 4x4 torus at half filling on an AMD EPYC 9654 server give -8.4688750142 (checks/hubbard-4x4-half-filling-ed/): the stored value sits 8.5e-5 below the ground state (the per-site quote is one unit off in its last digit), while the producer's -8.46888 is the ground state correctly rounded. The recomputed energy is carried on this instance (add_exact_rows.mjs, batch B2).",
  },
  // Declared the ground state, but the lowest level of the one symmetry sector the paper diagonalised:
  // QMBL's diagonalisation of the cluster's other q = 0 sectors finds a lower level, and its row replaces
  // this one.
  {
    match: { instance: "J1J2/square_40_P_0.6", method: "Exact diagonalization (Lanczos)", energy: -76.73472152 },
    ruled: "2026-10-03 (ruling R3 of 2026-10-02): QMBL's recomputed row stands, the A+ sector minimum is removed",
    reason: "Richter & Schulenburg, Eur. Phys. J. B 73, 117 (2010), Table 1: E_GS(S = 0) = -19.18368038 (S.S total), the lowest level of the one sector they diagonalised, \"the GS symmetry sector\" with n_h = 430,909,650 basis states (q = 0, C4 character A, spin-flip even), reproduced by QMBL as -19.1836803841. The C4 sign sector B+ of the same cluster (430,909,268 states) holds -19.1849299507, 1.25e-3 lower (6.5e-5 relative), found again in a second basis (the C2 subgroup's even sector, A+ + B+, 861,818,918 states) to 2.2e-15; C4's E pair lies higher (-18.1248351936). Lanczos on an AMD EPYC 9654 server (checks/j1j2-40-sector-ed/). The stored value is not the ground-state energy at its own precision; the recomputed energy is carried on this instance (add_exact_rows.mjs, batch B2).",
  },
  // Not an energy of the instance.
  ...["J1J2/triangular_108_P_0.125", "J1J2/triangular_144_P_0.125"].map(instance => ({
    match: { instance, method: "Thermodynamic-limit estimate interpolated to this size (1/L^3)" },
    ruled: "2026-09-17: not a finite-size result",
    reason: "Table III of Roth, Szabo & MacDonald, PRB 108, 054410 (2023) fills this size from the thermodynamic-limit estimate of Iqbal et al., PRB 93, 144411 (2016) and the exact 36-site energy, assuming 1/L^3 finite-size scaling. Nobody computed this cluster.",
  })),
  {
    match: { instance: "J1J2/square_100_P_0.5", method: "NQS Lanczos SLL (p = 0)", energy: -198.2508 },
    ruled: "2026-10-07: duplicate, the original paper's row stays (qmbl-verify 2026-10-07 (record-attempts pass), ruling 2)",
    reason: "arXiv:2502.01264 Table IV 'SLL (p=0)' at L = 10 is the energy of its initial state, Ref. [35]'s aCNN(C4v) (-0.495627(6), arXiv:2308.09664 Table III row aCNN(C4v), column J2/J1 = 0.5), which QMBL carries from arXiv:2308.09664 itself.",
  },
  {
    match: { instance: "J1J2/square_100_P_0.55", method: "NQS Lanczos SLL (p = 0)", energy: -193.396 },
    ruled: "2026-10-07: duplicate, the original paper's row stays (qmbl-verify 2026-10-07 (record-attempts pass), ruling 2)",
    reason: "arXiv:2502.01264 Table IV 'SLL (p=0)' at L = 10 is the energy of its initial state, Ref. [35]'s aCNN(C4v) (-0.483490(5), arXiv:2308.09664 Table III row aCNN(C4v), column J2/J1 = 0.55), which QMBL carries from arXiv:2308.09664 itself.",
  },
  // Withdrawn in review: printed in the arXiv version only; the published version dropped or
  // replaced the number.
  {
    "match": {
      "instance": "J1J2/square_36_P_0.5",
      "method": "CNN1 (VMC, 100 SR steps)",
      "energy": -72.0288
    },
    "ruled": "2026-10-15: withdrawn by the authors in review (Mach. Learn.: Sci. Technol. 4, 015035 (2023), arXiv:2204.07816)",
    "reason": "arXiv:2204.07816v1 Sec. 7.3.1 prints -0.5002 per site for CNN1 at L = 6 after 100 SR steps, an intermediate stage of a transfer-learning run. The published version describes the 6x6 -> 10x10 -> 36x36 transfer without this energy."
  },
  {
    "match": {
      "instance": "J1J2/square_64_P_0.4",
      "method": "previous work [23] (Nomura & Imada neural-network solver)",
      "energy": -134.525952
    },
    "ruled": "2026-10-15: withdrawn by the authors in review (Phys. Rev. X 11, 031034 (2021), arXiv:2005.14142)",
    "reason": "arXiv:2005.14142v1-v3 Table I prints -0.525492(4) per site for 8x8 at J2 = 0.4 (4x4 sublattice structure). The published Table I replaces it with -0.525653(1) (no sublattice structure), which QMBL carries as its own row; the arXiv value is printed nowhere in the journal version."
  },
  {
    "match": {
      "instance": "J1J2/square_64_P_0.45",
      "method": "previous work [23] (Nomura & Imada neural-network solver)",
      "energy": -130.845952
    },
    "ruled": "2026-10-15: withdrawn by the authors in review (Phys. Rev. X 11, 031034 (2021), arXiv:2005.14142)",
    "reason": "arXiv:2005.14142v1-v3 Table I prints -0.511117(4) per site for 8x8 at J2 = 0.45 (4x4 sublattice structure). The published Table I replaces it with -0.511331(1) (no sublattice structure), which QMBL carries as its own row; the arXiv value is printed nowhere in the journal version."
  },
  // qmbl-verify 2026-10-19, rulings of 2026-10-20 (passes 2026-10-16 to 10-19).
  {
   "match": {
    "instance": "Hubbard/square_16_P_4_10",
    "method": "Exact diagonalization",
    "energy": -16.1432081
   },
   "ruled": "2026-10-20: duplicate, the earlier row stays",
   "reason": "second exact row: the instance already carries ED -16.143208170202413 (varbench@2024-10-22); the printed value is that energy to 7 decimals (|diff| 7.0e-8), so this row repeats it (RULES.md 11, duplicates: remove, keep the earlier row)",
   "source_entry": "SE-exact-recompute#3 (qmbl-verify 2026-10-19)"
  },
  {
   "match": {
    "instance": "Hubbard/square_16_P_4_7.74263683",
    "method": "Exact diagonalization",
    "energy": -16.509154
   },
   "ruled": "2026-10-20: duplicate, the earlier row stays",
   "reason": "second exact row: the instance already carries ED -16.509154825265142 (varbench@2024-10-22); the printed value is that energy to 7 decimals (|diff| 8.3e-7), so this row repeats it (RULES.md 11, duplicates: remove, keep the earlier row)",
   "source_entry": "SE-exact-recompute#5 (qmbl-verify 2026-10-19)"
  },
  {
   "match": {
    "instance": "Hubbard/square_16_P_5_10",
    "method": "Exact diagonalization",
    "energy": -16.9035599
   },
   "ruled": "2026-10-20: duplicate, the earlier row stays",
   "reason": "second exact row: the instance already carries ED -16.903559984243547 (varbench@2024-10-22); the printed value is that energy to 7 decimals (|diff| 8.4e-8), so this row repeats it (RULES.md 11, duplicates: remove, keep the earlier row)",
   "source_entry": "SE-exact-recompute#6 (qmbl-verify 2026-10-19)"
  },
  {
   "match": {
    "instance": "Hubbard/square_16_P_5_2.15443469",
    "method": "Exact diagonalization",
    "energy": -21.2122357
   },
   "ruled": "2026-10-20: duplicate, the earlier row stays",
   "reason": "second exact row: the instance already carries ED -21.21223577699911 (varbench@2024-10-22); the printed value is that energy to 7 decimals (|diff| 7.7e-8), so this row repeats it (RULES.md 11, duplicates: remove, keep the earlier row)",
   "source_entry": "SE-exact-recompute#7 (qmbl-verify 2026-10-19)"
  },
  {
   "match": {
    "instance": "Hubbard/square_16_P_5_3.59381366",
    "method": "Exact diagonalization",
    "energy": -19.8916371
   },
   "ruled": "2026-10-20: duplicate, the earlier row stays",
   "reason": "second exact row: the instance already carries ED -19.891637199948672 (varbench@2024-10-22); the printed value is that energy to 7 decimals (|diff| 1.0e-7), so this row repeats it (RULES.md 11, duplicates: remove, keep the earlier row)",
   "source_entry": "SE-exact-recompute#8 (qmbl-verify 2026-10-19)"
  },
  {
   "match": {
    "instance": "Hubbard/square_16_P_5_7.74263683",
    "method": "Exact diagonalization",
    "energy": -17.6037315
   },
   "ruled": "2026-10-20: duplicate, the earlier row stays",
   "reason": "second exact row: the instance already carries ED -17.60373155517909 (varbench@2024-10-22); the printed value is that energy to 7 decimals (|diff| 5.5e-8), so this row repeats it (RULES.md 11, duplicates: remove, keep the earlier row)",
   "source_entry": "SE-exact-recompute#9 (qmbl-verify 2026-10-19)"
  },
  {
   "match": {
    "instance": "Hubbard/rectangular-4x16_64_PO_28_8",
    "method": "HFDS (fully parametrized hidden sub-matrix)",
    "energy": -47.7824
   },
   "ruled": "2026-10-20: duplicate, the earlier row stays",
   "reason": "Same number from the same paper already on the instance: row 2 (HFDS, 16 hidden fermions, 1-layer FFN with alpha = 6, stripe lambda = 8 mean-field constraint (varbench@2024-10-22, first-author upload of this paper)), energy -47.782. The paper's cell -0.7466(8) gives -47.7824; the VarBench row is the authors' own upload of the same calculation (or the same ED reference). Keep one row: the older VarBench row carries the provenance; this 2026-10-16 row adds no new number. Located at SI Table 4 / arXiv Table IV, row L = 16, column \"Energy per site HFDS (PBC-OBC)\".",
   "source_entry": "SP2-arxiv-2111-10420#0 (qmbl-verify 2026-10-19)"
  },
  {
   "match": {
    "instance": "Hubbard/rectangular-4x16_64_P_28_8",
    "method": "HFDS (fully parametrized hidden sub-matrix)",
    "energy": -48.192
   },
   "ruled": "2026-10-20: duplicate, the earlier row stays",
   "reason": "Same number from the same paper already on the instance: row 0 (HFDS, 16 hidden fermions, alpha = 6, stripe lambda = 8 (varbench@2024-10-22)), energy -48.192. The paper's cell -0.753(2) gives -48.192; the VarBench row is the authors' own upload of the same calculation (or the same ED reference). Keep one row: the older VarBench row carries the provenance; this 2026-10-16 row adds no new number. Located at SI Table 4 / arXiv Table IV, row L = 16, column \"Energy per site HFDS (PBC-PBC)\".",
   "source_entry": "SP2-arxiv-2111-10420#1 (qmbl-verify 2026-10-19)"
  },
  {
   "match": {
    "instance": "Hubbard/rectangular-4x8_32_PO_14_8",
    "method": "HFDS (fully parametrized hidden sub-matrix)",
    "energy": -23.3888
   },
   "ruled": "2026-10-20: duplicate, the earlier row stays",
   "reason": "The published SI prints -0.7350(6) (energy per site, units of t), the value of the authors' own VarBench upload already on the instance; this row carried arXiv v2's -23.3888. The journal SI prints -0.7350(6); arXiv v2 prints -0.7309(6), which the row stores (-23.3888). The journal value wins (brief rule 5). The first-author VarBench upload on this instance (-23.52) agrees with the journal cell, not the arXiv one.",
   "source_entry": "SP2-arxiv-2111-10420#2 (qmbl-verify 2026-10-19)"
  },
  {
   "match": {
    "instance": "Hubbard/rectangular-4x8_32_P_14_8",
    "method": "HFDS (fully parametrized hidden sub-matrix)",
    "energy": -24.4256
   },
   "ruled": "2026-10-20: duplicate, the earlier row stays",
   "reason": "Same number from the same paper already on the instance: row 0 (HFDS, 16 hidden fermions, alpha = 14, stripe lambda = 8 (varbench@2024-10-22)), energy -24.426. The paper's cell -0.7633(7) gives -24.4256; the VarBench row is the authors' own upload of the same calculation (or the same ED reference). Keep one row: the older VarBench row carries the provenance; this 2026-10-16 row adds no new number. Located at SI Table 4 / arXiv Table IV, row L = 8, column \"Energy per site HFDS (PBC-PBC)\".",
   "source_entry": "SP2-arxiv-2111-10420#4 (qmbl-verify 2026-10-19)"
  },
  {
   "match": {
    "instance": "Hubbard/square_16_P_4_10",
    "method": "HFDS (8 hidden fermions, single hidden layer, α = 32)",
    "energy": -16.1383
   },
   "ruled": "2026-10-20: duplicate, the earlier row stays",
   "reason": "Same number from the same paper already on the instance: row 1 (HFDS, 8 hidden fermions, 1-layer FFN alpha = 32 (varbench@2024-10-22)), energy -16.1383. The paper's cell -16.1383(9) gives -16.1383; the VarBench row is the authors' own upload of the same calculation (or the same ED reference). Keep one row: the older VarBench row carries the provenance; this 2026-10-16 row adds no new number. Located at SI Table 1 / arXiv Table I, row U = 10, column \"HFDS (α = 32)\".",
   "source_entry": "SP2-arxiv-2111-10420#43 (qmbl-verify 2026-10-19)"
  },
  {
   "match": {
    "instance": "Hubbard/square_16_P_4_3.59381366",
    "method": "HFDS (8 hidden fermions, single hidden layer, α = 32)",
    "energy": -17.69357
   },
   "ruled": "2026-10-20: duplicate, the earlier row stays",
   "reason": "Same number from the same paper already on the instance: row 1 (HFDS, 8 hidden fermions, 1-layer FFN alpha = 32 (varbench@2024-10-22)), energy -17.69357. The paper's cell -17.69357(4) gives -17.69357; the VarBench row is the authors' own upload of the same calculation (or the same ED reference). Keep one row: the older VarBench row carries the provenance; this 2026-10-16 row adds no new number. Located at SI Table 1 / arXiv Table I, row U = 3.6, column \"HFDS (α = 32)\".",
   "source_entry": "SP2-arxiv-2111-10420#67 (qmbl-verify 2026-10-19)"
  },
  {
   "match": {
    "instance": "Hubbard/square_16_P_4_7.74263683",
    "method": "HFDS (8 hidden fermions, single hidden layer, α = 32)",
    "energy": -16.505
   },
   "ruled": "2026-10-20: duplicate, the earlier row stays",
   "reason": "Same number from the same paper already on the instance: row 1 (HFDS, 8 hidden fermions, 1-layer FFN alpha = 32 (varbench@2024-10-22)), energy -16.505. The paper's cell -16.505(1) gives -16.505; the VarBench row is the authors' own upload of the same calculation (or the same ED reference). Keep one row: the older VarBench row carries the provenance; this 2026-10-16 row adds no new number. Located at SI Table 1 / arXiv Table I, row U = 7.75, column \"HFDS (α = 32)\".",
   "source_entry": "SP2-arxiv-2111-10420#82 (qmbl-verify 2026-10-19)"
  },
  {
   "match": {
    "instance": "Hubbard/square_16_P_5_10",
    "method": "HFDS (10 hidden fermions, α = 64) + (C4 ∩ K = 0)",
    "energy": -16.90183
   },
   "ruled": "2026-10-20: duplicate, the earlier row stays",
   "reason": "Same number from the same paper already on the instance: row 1 (HFDS, 10 hidden fermions, alpha = 64, projected K = 0, C4 (varbench@2024-10-22)), energy -16.90183. The paper's cell -16.90183(2) gives -16.90183; the VarBench row is the authors' own upload of the same calculation (or the same ED reference). Keep one row: the older VarBench row carries the provenance; this 2026-10-16 row adds no new number. Located at SI Table 3 / arXiv Table III, row \"HFSD (α = 64) + (C4∩K = 0)\", column U = 10 (N~ = 10 hidden fermions: main text Fig. 3 caption).",
   "source_entry": "SP2-arxiv-2111-10420#95 (qmbl-verify 2026-10-19)"
  },
  {
   "match": {
    "instance": "Hubbard/square_16_P_5_2.15443469",
    "method": "HFDS (10 hidden fermions, α = 64) + (C4 ∩ K = 0)",
    "energy": -21.211896
   },
   "ruled": "2026-10-20: duplicate, the earlier row stays",
   "reason": "Same number from the same paper already on the instance: row 1 (HFDS, 10 hidden fermions, alpha = 64, projected K = 0, C4 (varbench@2024-10-22)), energy -21.211896. The paper's cell -21.211896(2) gives -21.211896; the VarBench row is the authors' own upload of the same calculation (or the same ED reference). Keep one row: the older VarBench row carries the provenance; this 2026-10-16 row adds no new number. Located at SI Table 3 / arXiv Table III, row \"HFSD (α = 64) + (C4∩K = 0)\", column U = 2.15 (N~ = 10 hidden fermions: main text Fig. 3 caption).",
   "source_entry": "SP2-arxiv-2111-10420#100 (qmbl-verify 2026-10-19)"
  },
  {
   "match": {
    "instance": "Hubbard/square_16_P_5_3.59381366",
    "method": "HFDS (10 hidden fermions, α = 64) + (C4 ∩ K = 0)",
    "energy": -19.890443
   },
   "ruled": "2026-10-20: duplicate, the earlier row stays",
   "reason": "Same number from the same paper already on the instance: row 1 (HFDS, 10 hidden fermions, alpha = 64, projected K = 0, C4 (varbench@2024-10-22)), energy -19.890443. The paper's cell -19.890443(6) gives -19.890443; the VarBench row is the authors' own upload of the same calculation (or the same ED reference). Keep one row: the older VarBench row carries the provenance; this 2026-10-16 row adds no new number. Located at SI Table 3 / arXiv Table III, row \"HFSD (α = 64) + (C4∩K = 0)\", column U = 3.6 (N~ = 10 hidden fermions: main text Fig. 3 caption).",
   "source_entry": "SP2-arxiv-2111-10420#105 (qmbl-verify 2026-10-19)"
  },
  {
   "match": {
    "instance": "Hubbard/square_16_P_5_7.74263683",
    "method": "HFDS (10 hidden fermions, α = 64) + (C4 ∩ K = 0)",
    "energy": -17.602
   },
   "ruled": "2026-10-20: duplicate, the earlier row stays",
   "reason": "Same number from the same paper already on the instance: row 1 (HFDS, 10 hidden fermions, alpha = 64, projected K = 0, C4 (varbench@2024-10-22)), energy -17.602. The paper's cell -17.60200(1) gives -17.602; the VarBench row is the authors' own upload of the same calculation (or the same ED reference). Keep one row: the older VarBench row carries the provenance; this 2026-10-16 row adds no new number. Located at SI Table 3 / arXiv Table III, row \"HFSD (α = 64) + (C4∩K = 0)\", column U = 7.75 (N~ = 10 hidden fermions: main text Fig. 3 caption).",
   "source_entry": "SP2-arxiv-2111-10420#110 (qmbl-verify 2026-10-19)"
  },
  {
   "match": {
    "instance": "Hubbard/square_36_PA_18_4",
    "method": "HFDS (fully parametrized hidden sub-matrix)",
    "energy": -31.3812
   },
   "ruled": "2026-10-20: duplicate, the earlier row stays",
   "reason": "Same number from the same paper already on the instance: row 0 (HFDS, 8 hidden fermions, full hidden sub-matrix, alpha = 78 (varbench@2024-10-22)), energy -31.3822. The paper's cell -0.8717(2) gives -31.3812; the VarBench row is the authors' own upload of the same calculation (or the same ED reference). Keep one row: the older VarBench row carries the provenance; this 2026-10-16 row adds no new number. Located at SI Table 5 / arXiv Table V, row L = 6, column U = 4.",
   "source_entry": "SP2-arxiv-2111-10420#111 (qmbl-verify 2026-10-19)"
  },
  {
   "match": {
    "instance": "Hubbard/square_36_PA_18_6",
    "method": "HFDS (fully parametrized hidden sub-matrix)",
    "energy": -23.7924
   },
   "ruled": "2026-10-20: duplicate, the earlier row stays",
   "reason": "Same number from the same paper already on the instance: row 0 (HFDS, 8 hidden fermions, full hidden sub-matrix, alpha = 78 (varbench@2024-10-22)), energy -23.794. The paper's cell -0.6609(4) gives -23.7924; the VarBench row is the authors' own upload of the same calculation (or the same ED reference). Keep one row: the older VarBench row carries the provenance; this 2026-10-16 row adds no new number. Located at SI Table 5 / arXiv Table V, row L = 6, column U = 6.",
   "source_entry": "SP2-arxiv-2111-10420#112 (qmbl-verify 2026-10-19)"
  },
  {
   "match": {
    "instance": "Hubbard/square_36_PA_18_8",
    "method": "HFDS (fully parametrized hidden sub-matrix)",
    "energy": -19.0404
   },
   "ruled": "2026-10-20: duplicate, the earlier row stays",
   "reason": "The published SI prints -0.5270(3) (energy per site, units of t), the value of the authors' own VarBench upload already on the instance; this row carried arXiv v2's -19.0404. The journal SI prints -0.5270(3); arXiv v2 prints -0.5289(3), which the row stores (-19.0404). The journal value wins (brief rule 5). The first-author VarBench upload on this instance (-18.9738) agrees with the journal cell, not the arXiv one. The stored -19.0404 also sits 3.0 sigma below the instan",
   "source_entry": "SP2-arxiv-2111-10420#113 (qmbl-verify 2026-10-19)"
  },
  {
   "match": {
    "instance": "Hubbard/square_64_PA_32_2",
    "method": "HFDS (fully parametrized hidden sub-matrix)",
    "energy": -76.16
   },
   "ruled": "2026-10-20: duplicate, the earlier row stays",
   "reason": "Same number from the same paper already on the instance: row 0 (HFDS, 16 hidden fermions, alpha = 1, Neel mean-field constraint (varbench@2024-10-22)), energy -76.162. The paper's cell -1.1900(2) gives -76.16; the VarBench row is the authors' own upload of the same calculation (or the same ED reference). Keep one row: the older VarBench row carries the provenance; this 2026-10-16 row adds no new number. Located at SI Table 5 / arXiv Table V, row L = 8, column U = 2.",
   "source_entry": "SP2-arxiv-2111-10420#115 (qmbl-verify 2026-10-19)"
  },
  {
   "match": {
    "instance": "Hubbard/square_64_PA_32_4",
    "method": "HFDS (fully parametrized hidden sub-matrix)",
    "energy": -55.1744
   },
   "ruled": "2026-10-20: duplicate, the earlier row stays",
   "reason": "Same number from the same paper already on the instance: row 0 (HFDS, 16 hidden fermions, alpha = 1, Neel mean-field constraint (varbench@2024-10-22)), energy -55.18. The paper's cell -0.8621(4) gives -55.1744; the VarBench row is the authors' own upload of the same calculation (or the same ED reference). Keep one row: the older VarBench row carries the provenance; this 2026-10-16 row adds no new number. Located at SI Table 5 / arXiv Table V, row L = 8, column U = 4.",
   "source_entry": "SP2-arxiv-2111-10420#116 (qmbl-verify 2026-10-19)"
  },
  {
   "match": {
    "instance": "Hubbard/square_64_PA_32_8",
    "method": "HFDS (fully parametrized hidden sub-matrix)",
    "energy": -33.5616
   },
   "ruled": "2026-10-20: duplicate, the earlier row stays",
   "reason": "Same number from the same paper already on the instance: row 0 (HFDS, 16 hidden fermions, alpha = 1, Neel mean-field constraint (varbench@2024-10-22; energy corrected to -33.5616 by corrections.mjs VA3 #35)), energy -33.5616. The paper's cell -0.5244(6) gives -33.5616; the VarBench row is the authors' own upload of the same calculation (or the same ED reference). Keep one row: the older VarBench row carries the provenance; this 2026-10-16 row adds no new number. Located at SI Table 5 / arXiv Table V, row L = 8, column U = 8.",
   "source_entry": "SP2-arxiv-2111-10420#117 (qmbl-verify 2026-10-19)"
  },
  {
   "match": {
    "instance": "HEG3D/sc_14_P_7_7_0.5",
    "method": "CCSD [CCMC non-initiator, linear fit in 1/M, three points excluded (rejected by the paper: disagrees with quadratic fit within 2 sigma); extrapolated: 1/M → 0 (complete basis)] (arXiv:1706.09923)",
    "energy": 47.7798615042
   },
   "ruled": "2026-10-20: a fit the source prints only to reject it is not a claim of the ground-state energy",
   "reason": "Keep as a row an alternative CBS extrapolation that the source prints but rejects? The linear fit is the one the paper discards because it disagrees with the quadratic fit within 2 sigma; its CBS value is the quadratic -0.58850(6), already a row. Fig. 1 caption (txt line 199-205): 'best fit linear line (blue, dashed, excluding three data points) giving b0 = -0.58866(5) ha'; transcription correct: E = N E_HF + E_c = 14 x 3.45489439316 + (-0.58866) = 47.7798615042 Ha total (stored 47.7798615042); E_HF recomputed with checks/heg-hf/hf.mjs 3 sc 7 7 0.5 (closed shell); sigma 0.00005 printed, stored",
   "source_entry": "SP8-heg3d-hubbard-heg2d-heisenberg#4 (qmbl-verify 2026-10-19)"
  },
  {
   "match": {
    "instance": "HEG3D/sc_14_P_7_7_0.5",
    "method": "iFCIQMC [direct linear 1/M fit including spin orbitals up to M = 4218; shown by the paper to be too negative; extrapolated: 1/M → 0 (complete basis)] (arXiv:1706.09923)",
    "energy": 47.7735515041
   },
   "ruled": "2026-10-20: a fit the source prints only to reject it is not a claim of the ground-state energy",
   "reason": "Keep as a row an alternative CBS extrapolation that the source prints but rejects? The paper prints the direct linear 1/M FCIQMC extrapolation only to show it is too negative ('This shows that it is crucial to include large numbers of virtual orbitals'); its own FCIQMC value is -0.59467(9), already a row. Sec. VI (txt line 293-294): 'Had we instead extrapolated FCIQMC directly, the results would have been -0.59497(4) ha (instead of -0.59467(9) ha) with a linear fit for rs = 0.5'; transcription correct: E = N E_HF + E_c = 14 x 3.45489439316 + (-0.59497) = 47.7735515042 Ha total (stored 47.77355",
   "source_entry": "SP8-heg3d-hubbard-heg2d-heisenberg#6 (qmbl-verify 2026-10-19)"
  },
  {
   "match": {
    "instance": "Hubbard/square_256_P_112_8",
    "method": "HFPS (filled stripe, Table V)",
    "energy": -192.384
   },
   "ruled": "2026-10-20: duplicate, the earlier row stays",
   "reason": "Same number from the same paper is already on Hubbard/square_256_P_112_8: 'HFPS + symmetry projection' (source literature-2025-26, -192.384, sigma 0.0256, energy_variance 16.33024, reference 'Roth, Chen, Sengupta & Georges ... arXiv:2511.07566 (Table 5)'). Table V (txt lines 1193-1200; 'Energy per site of competing phases on a 256 site'), row t′ = 0.0, column Filled Stripe prints -0.7515(1); -0.7515 x 256 = -192.384 (stored -192.384); sigma 0.0001 x 256 = 0.0256 (stored 0.0256). Remove this sweep row (the older row already carries the Table VI variance).",
   "source_entry": "SP8-heg3d-hubbard-heg2d-heisenberg#73 (qmbl-verify 2026-10-19)"
  },
  {
   "match": {
    "instance": "Heisenberg/pyrochlore-2x2x2_32_P",
    "method": "mVMC (Table II)",
    "energy": -66.0736
   },
   "ruled": "2026-10-20: duplicate, the earlier row stays",
   "reason": "Same number from the same paper is already on Heisenberg/pyrochlore-2x2x2_32_P: mVMC with SU(2) and symmetry projections (varbench@2024-10-22, -66.0736), reference https://journals.aps.org/prx/abstract/10.1103/PhysRevX.11.041021 (= arXiv:2101.08787). Appendix H Table II (txt lines 1122-1152), geometry 4×2^3, column mVMC, first line of the cell (energy per site) prints -0.5162(1); -0.5162 x 128 (4N, S.S to Pauli) = -66.0736 (stored -66.0736); sigma 0.0001 x 128 = 0.0128 (stored 0.0128). Remove this sweep row; if the method name or the Table II location is wanted, move it onto the VarBench row.",
   "source_entry": "SP8-heg3d-hubbard-heg2d-heisenberg#135 (qmbl-verify 2026-10-19)"
  },
  {
   "match": {
    "instance": "Heisenberg/pyrochlore-3x3x3_108_P",
    "method": "mVMC (Table II)",
    "energy": -210.4272
   },
   "ruled": "2026-10-20: duplicate, the earlier row stays",
   "reason": "Same number from the same paper is already on Heisenberg/pyrochlore-3x3x3_108_P: mVMC with SU(2) and symmetry projections (varbench@2024-10-22, -210.4272), reference https://journals.aps.org/prx/abstract/10.1103/PhysRevX.11.041021 (= arXiv:2101.08787). Appendix H Table II (txt lines 1122-1152), geometry 4×3^3, column mVMC, first line of the cell (energy per site) prints -0.4871(1); -0.4871 x 432 (4N, S.S to Pauli) = -210.4272 (stored -210.4272); sigma 0.0001 x 432 = 0.0432 (stored 0.0432). Remove this sweep row; if the method name or the Table II location is wanted, move it onto the VarBench r",
   "source_entry": "SP8-heg3d-hubbard-heg2d-heisenberg#137 (qmbl-verify 2026-10-19)"
  },
  {
   "match": {
    "instance": "Heisenberg/pyrochlore-3x3x3_108_P",
    "method": "NQS CNN (Table II)",
    "energy": -208.4832
   },
   "ruled": "2026-10-20: duplicate, the earlier row stays",
   "reason": "Same number from the same paper is already on Heisenberg/pyrochlore-3x3x3_108_P: CNN NQS with symmetry projections (varbench@2024-10-22, -208.4832), reference https://journals.aps.org/prx/abstract/10.1103/PhysRevX.11.041021 (= arXiv:2101.08787). Appendix H Table II (txt lines 1122-1152), geometry 4×3^3, column NQS CNN, first line of the cell (energy per site) prints -0.4826(2); -0.4826 x 432 (4N, S.S to Pauli) = -208.4832 (stored -208.4832); sigma 0.0002 x 432 = 0.0864 (stored 0.0864). Remove this sweep row; if the method name or the Table II location is wanted, move it onto the VarBench row.",
   "source_entry": "SP8-heg3d-hubbard-heg2d-heisenberg#138 (qmbl-verify 2026-10-19)"
  },
  {
   "match": {
    "instance": "Heisenberg/pyrochlore-4x4x4_256_P",
    "method": "mVMC (Table II)",
    "energy": -494.6944
   },
   "ruled": "2026-10-20: duplicate, the earlier row stays",
   "reason": "Same number from the same paper is already on Heisenberg/pyrochlore-4x4x4_256_P: mVMC with SU(2) and symmetry projections (varbench@2024-10-22, -494.6944), reference https://journals.aps.org/prx/abstract/10.1103/PhysRevX.11.041021 (= arXiv:2101.08787). Appendix H Table II (txt lines 1122-1152), geometry 4×4^3, column mVMC, first line of the cell (energy per site) prints -0.4831(1); -0.4831 x 1024 (4N, S.S to Pauli) = -494.6944 (stored -494.6944); sigma 0.0001 x 1024 = 0.1024 (stored 0.1024). Remove this sweep row; if the method name or the Table II location is wanted, move it onto the VarBench",
   "source_entry": "SP8-heg3d-hubbard-heg2d-heisenberg#139 (qmbl-verify 2026-10-19)"
  },
  // Basis-size series (RULES.md 12.3, 2026-10-20).
  {
   "match": {
    "instance": "HEG3D/sc_14_P_7_7_0.5",
    "method": "i-FCIQMC (M = 114 spin orbitals)",
    "energy": 47.8516215043
   },
   "ruled": "2026-10-20: of a basis-size series only the basis limit, or else the largest basis, is a row",
   "reason": "A finite-basis step of a basis-size series in arXiv:1201.4691: every basis size approximates the same ground state at a lower resolution, and the paper's result is its complete-basis-limit value, which stays."
  },
  {
   "match": {
    "instance": "HEG3D/sc_14_P_7_7_0.5",
    "method": "i-FCIQMC (M = 186 spin orbitals)",
    "energy": 47.8096215043
   },
   "ruled": "2026-10-20: of a basis-size series only the basis limit, or else the largest basis, is a row",
   "reason": "A finite-basis step of a basis-size series in arXiv:1201.4691: every basis size approximates the same ground state at a lower resolution, and the paper's result is its complete-basis-limit value, which stays."
  },
  {
   "match": {
    "instance": "HEG3D/sc_14_P_7_7_0.5",
    "method": "i-FCIQMC (M = 358 spin orbitals)",
    "energy": 47.7888215042
   },
   "ruled": "2026-10-20: of a basis-size series only the basis limit, or else the largest basis, is a row",
   "reason": "A finite-basis step of a basis-size series in arXiv:1201.4691: every basis size approximates the same ground state at a lower resolution, and the paper's result is its complete-basis-limit value, which stays."
  },
  {
   "match": {
    "instance": "HEG3D/sc_14_P_7_7_0.5",
    "method": "i-FCIQMC (M = 778 spin orbitals)",
    "energy": 47.7792215043
   },
   "ruled": "2026-10-20: of a basis-size series only the basis limit, or else the largest basis, is a row",
   "reason": "A finite-basis step of a basis-size series in arXiv:1201.4691: every basis size approximates the same ground state at a lower resolution, and the paper's result is its complete-basis-limit value, which stays."
  },
  {
   "match": {
    "instance": "HEG3D/sc_14_P_7_7_0.5",
    "method": "i-FCIQMC (M = 1850 spin orbitals)",
    "energy": 47.7749215042
   },
   "ruled": "2026-10-20: of a basis-size series only the basis limit, or else the largest basis, is a row",
   "reason": "A finite-basis step of a basis-size series in arXiv:1201.4691: every basis size approximates the same ground state at a lower resolution, and the paper's result is its complete-basis-limit value, which stays."
  },
  {
   "match": {
    "instance": "HEG3D/sc_14_P_7_7_0.5",
    "method": "i-FCIQMC (M = 2368 spin orbitals)",
    "energy": 47.7746215043
   },
   "ruled": "2026-10-20: of a basis-size series only the basis limit, or else the largest basis, is a row",
   "reason": "A finite-basis step of a basis-size series in arXiv:1201.4691: every basis size approximates the same ground state at a lower resolution, and the paper's result is its complete-basis-limit value, which stays."
  },
  {
   "match": {
    "instance": "HEG3D/sc_14_P_7_7_0.5",
    "method": "RHF+ph-AFQMC [single-determinant RHF trial, basis M = 57 plane waves (114 spin orbitals), time step 0.005 a.u., 2880 walkers; PAUXY] (arXiv:1905.04361)",
    "energy": 47.8512215042
   },
   "ruled": "2026-10-20: of a basis-size series only the basis limit, or else the largest basis, is a row",
   "reason": "A smaller basis (114 of 4218 spin orbitals) of a basis-size series in arXiv:1905.04361 (Lee, Malone & Morales): every basis size approximates the same ground state at a lower resolution, and the paper's result is AFQMC at its largest basis for this trial state, which stays."
  },
  {
   "match": {
    "instance": "HEG3D/sc_14_P_7_7_0.5",
    "method": "RHF+ph-AFQMC [single-determinant RHF trial, basis M = 93 plane waves (186 spin orbitals), time step 0.005 a.u., 2880 walkers; PAUXY] (arXiv:1905.04361)",
    "energy": 47.8093215041
   },
   "ruled": "2026-10-20: of a basis-size series only the basis limit, or else the largest basis, is a row",
   "reason": "A smaller basis (186 of 4218 spin orbitals) of a basis-size series in arXiv:1905.04361 (Lee, Malone & Morales): every basis size approximates the same ground state at a lower resolution, and the paper's result is AFQMC at its largest basis for this trial state, which stays."
  },
  {
   "match": {
    "instance": "HEG3D/sc_14_P_7_7_0.5",
    "method": "RHF+ph-AFQMC [single-determinant RHF trial, basis M = 179 plane waves (358 spin orbitals), time step 0.005 a.u., 2880 walkers; PAUXY] (arXiv:1905.04361)",
    "energy": 47.7891215042
   },
   "ruled": "2026-10-20: of a basis-size series only the basis limit, or else the largest basis, is a row",
   "reason": "A smaller basis (358 of 4218 spin orbitals) of a basis-size series in arXiv:1905.04361 (Lee, Malone & Morales): every basis size approximates the same ground state at a lower resolution, and the paper's result is AFQMC at its largest basis for this trial state, which stays."
  },
  {
   "match": {
    "instance": "HEG3D/sc_14_P_7_7_0.5",
    "method": "RHF+ph-AFQMC [single-determinant RHF trial, basis M = 389 plane waves (778 spin orbitals), time step 0.005 a.u., 2880 walkers; PAUXY] (arXiv:1905.04361)",
    "energy": 47.7804215042
   },
   "ruled": "2026-10-20: of a basis-size series only the basis limit, or else the largest basis, is a row",
   "reason": "A smaller basis (778 of 4218 spin orbitals) of a basis-size series in arXiv:1905.04361 (Lee, Malone & Morales): every basis size approximates the same ground state at a lower resolution, and the paper's result is AFQMC at its largest basis for this trial state, which stays."
  },
  {
   "match": {
    "instance": "HEG3D/sc_14_P_7_7_0.5",
    "method": "RHF+ph-AFQMC [single-determinant RHF trial, basis M = 925 plane waves (1850 spin orbitals), time step 0.005 a.u., 2880 walkers; PAUXY] (arXiv:1905.04361)",
    "energy": 47.7765215042
   },
   "ruled": "2026-10-20: of a basis-size series only the basis limit, or else the largest basis, is a row",
   "reason": "A smaller basis (1850 of 4218 spin orbitals) of a basis-size series in arXiv:1905.04361 (Lee, Malone & Morales): every basis size approximates the same ground state at a lower resolution, and the paper's result is AFQMC at its largest basis for this trial state, which stays."
  },
  {
   "match": {
    "instance": "HEG3D/sc_14_P_7_7_0.5",
    "method": "RHF+ph-AFQMC [single-determinant RHF trial, basis M = 1189 plane waves (2378 spin orbitals), time step 0.005 a.u., 2880 walkers; PAUXY] (arXiv:1905.04361)",
    "energy": 47.7764215041
   },
   "ruled": "2026-10-20: of a basis-size series only the basis limit, or else the largest basis, is a row",
   "reason": "A smaller basis (2378 of 4218 spin orbitals) of a basis-size series in arXiv:1905.04361 (Lee, Malone & Morales): every basis size approximates the same ground state at a lower resolution, and the paper's result is AFQMC at its largest basis for this trial state, which stays."
  },
  {
   "match": {
    "instance": "HEG3D/sc_14_P_7_7_0.5",
    "method": "RHF+ph-AFQMC [single-determinant RHF trial, basis M = 1213 plane waves (2426 spin orbitals), time step 0.005 a.u., 2880 walkers; PAUXY] (arXiv:1905.04361)",
    "energy": 47.7759215042
   },
   "ruled": "2026-10-20: of a basis-size series only the basis limit, or else the largest basis, is a row",
   "reason": "A smaller basis (2426 of 4218 spin orbitals) of a basis-size series in arXiv:1905.04361 (Lee, Malone & Morales): every basis size approximates the same ground state at a lower resolution, and the paper's result is AFQMC at its largest basis for this trial state, which stays."
  },
  {
   "match": {
    "instance": "HEG3D/sc_14_P_7_7_0.5",
    "method": "RHF+ph-AFQMC [single-determinant RHF trial, basis M = 1419 plane waves (2838 spin orbitals), time step 0.005 a.u., 2880 walkers; PAUXY] (arXiv:1905.04361)",
    "energy": 47.7760215043
   },
   "ruled": "2026-10-20: of a basis-size series only the basis limit, or else the largest basis, is a row",
   "reason": "A smaller basis (2838 of 4218 spin orbitals) of a basis-size series in arXiv:1905.04361 (Lee, Malone & Morales): every basis size approximates the same ground state at a lower resolution, and the paper's result is AFQMC at its largest basis for this trial state, which stays."
  },
  {
   "match": {
    "instance": "HEG3D/sc_14_P_7_7_1",
    "method": "i-FCIQMC (M = 114 spin orbitals)",
    "energy": 8.03037060354
   },
   "ruled": "2026-10-20: of a basis-size series only the basis limit, or else the largest basis, is a row",
   "reason": "A finite-basis step of a basis-size series in arXiv:1201.4691: every basis size approximates the same ground state at a lower resolution, and the paper's result is its complete-basis-limit value, which stays."
  },
  {
   "match": {
    "instance": "HEG3D/sc_14_P_7_7_1",
    "method": "i-FCIQMC (M = 186 spin orbitals)",
    "energy": 7.99055060353
   },
   "ruled": "2026-10-20: of a basis-size series only the basis limit, or else the largest basis, is a row",
   "reason": "A finite-basis step of a basis-size series in arXiv:1201.4691: every basis size approximates the same ground state at a lower resolution, and the paper's result is its complete-basis-limit value, which stays."
  },
  {
   "match": {
    "instance": "HEG3D/sc_14_P_7_7_1",
    "method": "i-FCIQMC (M = 358 spin orbitals)",
    "energy": 7.97258060354
   },
   "ruled": "2026-10-20: of a basis-size series only the basis limit, or else the largest basis, is a row",
   "reason": "A finite-basis step of a basis-size series in arXiv:1201.4691: every basis size approximates the same ground state at a lower resolution, and the paper's result is its complete-basis-limit value, which stays."
  },
  {
   "match": {
    "instance": "HEG3D/sc_14_P_7_7_1",
    "method": "i-FCIQMC (M = 778 spin orbitals)",
    "energy": 7.96498060354
   },
   "ruled": "2026-10-20: of a basis-size series only the basis limit, or else the largest basis, is a row",
   "reason": "A finite-basis step of a basis-size series in arXiv:1201.4691: every basis size approximates the same ground state at a lower resolution, and the paper's result is its complete-basis-limit value, which stays."
  },
  {
   "match": {
    "instance": "HEG3D/sc_14_P_7_7_1",
    "method": "i-FCIQMC (M = 1850 spin orbitals)",
    "energy": 7.96208060354
   },
   "ruled": "2026-10-20: of a basis-size series only the basis limit, or else the largest basis, is a row",
   "reason": "A finite-basis step of a basis-size series in arXiv:1201.4691: every basis size approximates the same ground state at a lower resolution, and the paper's result is its complete-basis-limit value, which stays."
  },
  {
   "match": {
    "instance": "HEG3D/sc_14_P_7_7_1",
    "method": "i-FCIQMC (M = 2368 spin orbitals)",
    "energy": 7.96098060353
   },
   "ruled": "2026-10-20: of a basis-size series only the basis limit, or else the largest basis, is a row",
   "reason": "A finite-basis step of a basis-size series in arXiv:1201.4691: every basis size approximates the same ground state at a lower resolution, and the paper's result is its complete-basis-limit value, which stays."
  },
  {
   "match": {
    "instance": "HEG3D/sc_14_P_7_7_1",
    "method": "RHF+ph-AFQMC [single-determinant RHF trial, basis M = 179 plane waves (358 spin orbitals), time step 0.005 a.u., 2880 walkers; QMCPACK] (arXiv:1905.04361)",
    "energy": 7.97278060354
   },
   "ruled": "2026-10-20: of a basis-size series only the basis limit, or else the largest basis, is a row",
   "reason": "A smaller basis (358 of 4218 spin orbitals) of a basis-size series in arXiv:1905.04361 (Lee, Malone & Morales): every basis size approximates the same ground state at a lower resolution, and the paper's result is AFQMC at its largest basis for this trial state, which stays."
  },
  {
   "match": {
    "instance": "HEG3D/sc_14_P_7_7_1",
    "method": "RHF+ph-AFQMC [single-determinant RHF trial, basis M = 1189 plane waves (2378 spin orbitals), time step 0.005 a.u., 2880 walkers; QMCPACK] (arXiv:1905.04361)",
    "energy": 7.96128060354
   },
   "ruled": "2026-10-20: of a basis-size series only the basis limit, or else the largest basis, is a row",
   "reason": "A smaller basis (2378 of 4218 spin orbitals) of a basis-size series in arXiv:1905.04361 (Lee, Malone & Morales): every basis size approximates the same ground state at a lower resolution, and the paper's result is AFQMC at its largest basis for this trial state, which stays."
  },
  {
   "match": {
    "instance": "HEG3D/sc_14_P_7_7_2",
    "method": "i-FCIQMC (M = 114 spin orbitals)",
    "energy": -0.0616547353716
   },
   "ruled": "2026-10-20: of a basis-size series only the basis limit, or else the largest basis, is a row",
   "reason": "A finite-basis step of a basis-size series in arXiv:1201.4691: every basis size approximates the same ground state at a lower resolution, and the paper's result is its complete-basis-limit value, which stays."
  },
  {
   "match": {
    "instance": "HEG3D/sc_14_P_7_7_2",
    "method": "i-FCIQMC (M = 186 spin orbitals)",
    "energy": -0.098154735371
   },
   "ruled": "2026-10-20: of a basis-size series only the basis limit, or else the largest basis, is a row",
   "reason": "A finite-basis step of a basis-size series in arXiv:1201.4691: every basis size approximates the same ground state at a lower resolution, and the paper's result is its complete-basis-limit value, which stays."
  },
  {
   "match": {
    "instance": "HEG3D/sc_14_P_7_7_2",
    "method": "i-FCIQMC (M = 358 spin orbitals)",
    "energy": -0.11295473537
   },
   "ruled": "2026-10-20: of a basis-size series only the basis limit, or else the largest basis, is a row",
   "reason": "A finite-basis step of a basis-size series in arXiv:1201.4691: every basis size approximates the same ground state at a lower resolution, and the paper's result is its complete-basis-limit value, which stays."
  },
  {
   "match": {
    "instance": "HEG3D/sc_14_P_7_7_2",
    "method": "i-FCIQMC (M = 778 spin orbitals)",
    "energy": -0.118454735371
   },
   "ruled": "2026-10-20: of a basis-size series only the basis limit, or else the largest basis, is a row",
   "reason": "A finite-basis step of a basis-size series in arXiv:1201.4691: every basis size approximates the same ground state at a lower resolution, and the paper's result is its complete-basis-limit value, which stays."
  },
  {
   "match": {
    "instance": "HEG3D/sc_14_P_7_7_2",
    "method": "i-FCIQMC (M = 1850 spin orbitals)",
    "energy": -0.120554735371
   },
   "ruled": "2026-10-20: of a basis-size series only the basis limit, or else the largest basis, is a row",
   "reason": "A finite-basis step of a basis-size series in arXiv:1201.4691: every basis size approximates the same ground state at a lower resolution, and the paper's result is its complete-basis-limit value, which stays."
  },
  {
   "match": {
    "instance": "HEG3D/sc_14_P_7_7_2",
    "method": "i-FCIQMC (M = 2368 spin orbitals)",
    "energy": -0.120454735372
   },
   "ruled": "2026-10-20: of a basis-size series only the basis limit, or else the largest basis, is a row",
   "reason": "A finite-basis step of a basis-size series in arXiv:1201.4691: every basis size approximates the same ground state at a lower resolution, and the paper's result is its complete-basis-limit value, which stays."
  },
  {
   "match": {
    "instance": "HEG3D/sc_14_P_7_7_2",
    "method": "RHF+ph-AFQMC [single-determinant RHF trial, basis M = 81 plane waves (162 spin orbitals), time step 0.005 a.u., 2880 walkers; QMCPACK] (arXiv:1905.04361)",
    "energy": -0.0955547353716
   },
   "ruled": "2026-10-20: of a basis-size series only the basis limit, or else the largest basis, is a row",
   "reason": "A smaller basis (162 of 4218 spin orbitals) of a basis-size series in arXiv:1905.04361 (Lee, Malone & Morales): every basis size approximates the same ground state at a lower resolution, and the paper's result is AFQMC at its largest basis for this trial state, which stays."
  },
  {
   "match": {
    "instance": "HEG3D/sc_14_P_7_7_2",
    "method": "RHF+ph-AFQMC [single-determinant RHF trial, basis M = 925 plane waves (1850 spin orbitals), time step 0.005 a.u., 2880 walkers; QMCPACK] (arXiv:1905.04361)",
    "energy": -0.121254735371
   },
   "ruled": "2026-10-20: of a basis-size series only the basis limit, or else the largest basis, is a row",
   "reason": "A smaller basis (1850 of 4218 spin orbitals) of a basis-size series in arXiv:1905.04361 (Lee, Malone & Morales): every basis size approximates the same ground state at a lower resolution, and the paper's result is AFQMC at its largest basis for this trial state, which stays."
  },
  {
   "match": {
    "instance": "HEG3D/sc_14_P_7_7_3",
    "method": "RHF+ph-AFQMC [single-determinant RHF trial, basis M = 81 plane waves (162 spin orbitals), time step 0.005 a.u., 2880 walkers; QMCPACK] (arXiv:1905.04361)",
    "energy": -1.01579094295
   },
   "ruled": "2026-10-20: of a basis-size series only the basis limit, or else the largest basis, is a row",
   "reason": "A smaller basis (162 of 1850 spin orbitals) of a basis-size series in arXiv:1905.04361 (Lee, Malone & Morales): every basis size approximates the same ground state at a lower resolution, and the paper's result is AFQMC at its largest basis for this trial state, which stays."
  },
  {
   "match": {
    "instance": "HEG3D/sc_14_P_7_7_3",
    "method": "RHF+ph-AFQMC [single-determinant RHF trial, basis M = 179 plane waves (358 spin orbitals), time step 0.005 a.u., 2880 walkers; QMCPACK] (arXiv:1905.04361)",
    "energy": -1.02909094295
   },
   "ruled": "2026-10-20: of a basis-size series only the basis limit, or else the largest basis, is a row",
   "reason": "A smaller basis (358 of 1850 spin orbitals) of a basis-size series in arXiv:1905.04361 (Lee, Malone & Morales): every basis size approximates the same ground state at a lower resolution, and the paper's result is AFQMC at its largest basis for this trial state, which stays."
  },
  {
   "match": {
    "instance": "HEG3D/sc_14_P_7_7_5",
    "method": "i-FCIQMC (M = 114 spin orbitals)",
    "energy": -1.07704870306
   },
   "ruled": "2026-10-20: of a basis-size series only the basis limit, or else the largest basis, is a row",
   "reason": "A finite-basis step of a basis-size series in arXiv:1201.4691: every basis size approximates the same ground state at a lower resolution, and the paper's result is its complete-basis-limit value, which stays."
  },
  {
   "match": {
    "instance": "HEG3D/sc_14_P_7_7_5",
    "method": "i-FCIQMC (M = 186 spin orbitals)",
    "energy": -1.10534870306
   },
   "ruled": "2026-10-20: of a basis-size series only the basis limit, or else the largest basis, is a row",
   "reason": "A finite-basis step of a basis-size series in arXiv:1201.4691: every basis size approximates the same ground state at a lower resolution, and the paper's result is its complete-basis-limit value, which stays."
  },
  {
   "match": {
    "instance": "HEG3D/sc_14_P_7_7_5",
    "method": "i-FCIQMC (M = 358 spin orbitals)",
    "energy": -1.11424870306
   },
   "ruled": "2026-10-20: of a basis-size series only the basis limit, or else the largest basis, is a row",
   "reason": "A finite-basis step of a basis-size series in arXiv:1201.4691: every basis size approximates the same ground state at a lower resolution, and the paper's result is its complete-basis-limit value, which stays."
  },
  {
   "match": {
    "instance": "HEG3D/sc_14_P_7_7_5",
    "method": "i-FCIQMC (M = 778 spin orbitals)",
    "energy": -1.11654870306
   },
   "ruled": "2026-10-20: of a basis-size series only the basis limit, or else the largest basis, is a row",
   "reason": "A finite-basis step of a basis-size series in arXiv:1201.4691: every basis size approximates the same ground state at a lower resolution, and the paper's result is its complete-basis-limit value, which stays."
  },
  {
   "match": {
    "instance": "HEG3D/sc_14_P_7_7_5",
    "method": "RHF+ph-AFQMC [single-determinant RHF trial, basis M = 179 plane waves (358 spin orbitals), time step 0.005 a.u., 2880 walkers; QMCPACK] (arXiv:1905.04361)",
    "energy": -1.08264870306
   },
   "ruled": "2026-10-20: of a basis-size series only the basis limit, or else the largest basis, is a row",
   "reason": "A smaller basis (358 of 778 spin orbitals) of a basis-size series in arXiv:1905.04361 (Lee, Malone & Morales): every basis size approximates the same ground state at a lower resolution, and the paper's result is AFQMC at its largest basis for this trial state, which stays."
  },
  {
   "match": {
    "instance": "HEG3D/sc_14_P_7_7_5",
    "method": "RHF+ph-AFQMC [single-determinant RHF trial, basis M = 57 plane waves (114 spin orbitals), time step 0.005 a.u., 2880 walkers; QMCPACK] (arXiv:1905.04361)",
    "energy": -1.05474870306
   },
   "ruled": "2026-10-20: of a basis-size series only the basis limit, or else the largest basis, is a row",
   "reason": "A smaller basis (114 of 778 spin orbitals) of a basis-size series in arXiv:1905.04361 (Lee, Malone & Morales): every basis size approximates the same ground state at a lower resolution, and the paper's result is AFQMC at its largest basis for this trial state, which stays."
  },
  {
   "match": {
    "instance": "HEG3D/sc_14_P_7_7_5",
    "method": "RHF+ph-AFQMC [single-determinant RHF trial, basis M = 93 plane waves (186 spin orbitals), time step 0.005 a.u., 2880 walkers; QMCPACK] (arXiv:1905.04361)",
    "energy": -1.08024870306
   },
   "ruled": "2026-10-20: of a basis-size series only the basis limit, or else the largest basis, is a row",
   "reason": "A smaller basis (186 of 778 spin orbitals) of a basis-size series in arXiv:1905.04361 (Lee, Malone & Morales): every basis size approximates the same ground state at a lower resolution, and the paper's result is AFQMC at its largest basis for this trial state, which stays."
  },
  {
   "match": {
    "instance": "HEG3D/sc_14_P_7_7_5",
    "method": "UHF+ph-AFQMC [UHF trial with RHF initial wavefunction (spin projection), basis M = 57 plane waves (114 spin orbitals), time step 0.005 a.u., 2880 walkers; QMCPACK] (arXiv:1905.04361)",
    "energy": -1.05625870306
   },
   "ruled": "2026-10-20: of a basis-size series only the basis limit, or else the largest basis, is a row",
   "reason": "A smaller basis (114 of 778 spin orbitals) of a basis-size series in arXiv:1905.04361 (Lee, Malone & Morales): every basis size approximates the same ground state at a lower resolution, and the paper's result is AFQMC at its largest basis for this trial state, which stays."
  },
  {
   "match": {
    "instance": "HEG3D/sc_14_P_7_7_5",
    "method": "UHF+ph-AFQMC [UHF trial with RHF initial wavefunction (spin projection), basis M = 93 plane waves (186 spin orbitals), time step 0.005 a.u., 2880 walkers; QMCPACK] (arXiv:1905.04361)",
    "energy": -1.08091870306
   },
   "ruled": "2026-10-20: of a basis-size series only the basis limit, or else the largest basis, is a row",
   "reason": "A smaller basis (186 of 778 spin orbitals) of a basis-size series in arXiv:1905.04361 (Lee, Malone & Morales): every basis size approximates the same ground state at a lower resolution, and the paper's result is AFQMC at its largest basis for this trial state, which stays."
  },
  {
   "match": {
    "instance": "HEG3D/sc_14_P_7_7_5",
    "method": "NOMSD+ph-AFQMC [ten-determinant NOMSD trial from projected Hartree-Fock, basis M = 57 plane waves (114 spin orbitals), time step 0.005 a.u., 2880 walkers; QMCPACK] (arXiv:1905.04361)",
    "energy": -1.06364870306
   },
   "ruled": "2026-10-20: of a basis-size series only the basis limit, or else the largest basis, is a row",
   "reason": "A smaller basis (114 of 778 spin orbitals) of a basis-size series in arXiv:1905.04361 (Lee, Malone & Morales): every basis size approximates the same ground state at a lower resolution, and the paper's result is AFQMC at its largest basis for this trial state, which stays."
  },
  {
   "match": {
    "instance": "HEG3D/sc_14_P_7_7_5",
    "method": "NOMSD+ph-AFQMC [ten-determinant NOMSD trial from projected Hartree-Fock, basis M = 93 plane waves (186 spin orbitals), time step 0.005 a.u., 2880 walkers; QMCPACK] (arXiv:1905.04361)",
    "energy": -1.09114870306
   },
   "ruled": "2026-10-20: of a basis-size series only the basis limit, or else the largest basis, is a row",
   "reason": "A smaller basis (186 of 778 spin orbitals) of a basis-size series in arXiv:1905.04361 (Lee, Malone & Morales): every basis size approximates the same ground state at a lower resolution, and the paper's result is AFQMC at its largest basis for this trial state, which stays."
  },
  {
   "match": {
    "instance": "HEG3D/sc_54_P_27_27_0.5",
    "method": "i-FCIQMC (2M = 2838 spin orbitals)",
    "energy": 173.92644
   },
   "ruled": "2026-10-20: of a basis-size series only the basis limit, or else the largest basis, is a row",
   "reason": "A finite-basis step of a basis-size series in arXiv:1201.4691: every basis size approximates the same ground state at a lower resolution, and the paper's result is its complete-basis-limit value, which stays."
  },
  {
   "match": {
    "instance": "HEG3D/sc_54_P_27_27_1",
    "method": "i-FCIQMC (2M = 2838 spin orbitals)",
    "energy": 28.65942
   },
   "ruled": "2026-10-20: of a basis-size series only the basis limit, or else the largest basis, is a row",
   "reason": "A finite-basis step of a basis-size series in arXiv:1201.4691: every basis size approximates the same ground state at a lower resolution, and the paper's result is its complete-basis-limit value, which stays."
  },
];
