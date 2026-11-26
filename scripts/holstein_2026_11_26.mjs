// Generator of passes/rows/sweep-rows-2026-11-26-hubbardholstein.json and
// passes/rows/sweep-rows-2026-11-26-holstein.json: values held on 2026-11-16 and 2026-11-24 for a fact
// the source implies but does not state, filed after a full reading of each source and the code or
// data it cites (RULES.md 8, implied facts, 2026-11-26).
//
// - arXiv:1602.04195 (Sandhoefer & Chan, PRB 94, 085115), Table I: DMET energies per site of the
//   32-site and 504-site Hubbard-Holstein chains (antiperiodic), and the DMRG energies of Fehske and
//   Jeckelmann on the open 32-site chain, provided to and printed in that paper. Implied: half filling
//   and the energy zero of Eq. (1).
// - arXiv:2405.08701 (Mahajan, Robinson, Lee & Reichman, PRB 112, 184310), Supplemental Material
//   fig_2_hol.dat: NQS energies of the one-electron Holstein polaron on the 30-site chain. Implied:
//   periodic boundaries, the hidden-neuron count of each column, total energies.
//
// Every number is copied from the committed file as printed; the script stops unless it finds the
// printed string on its cited line (grep -n numbering).
//
// usage: node scripts/holstein_2026_11_26.mjs   (writes both pass files; the build applies them)
import fs from "node:fs";

const fmt = x => String(+(+x).toPrecision(6));
const lines = f => fs.readFileSync(f, "utf8").split("\n");
const check = (L, f, line, s) => {
  if (!(L[line - 1] ?? "").includes(s)) throw new Error(`${f}: '${s}' not found at line ${line}`);
};
const dec = s => (s.split(".")[1] ?? "").length;

// --- arXiv:1602.04195, Table I ------------------------------------------------------------
const SC = "sources/1602.04195.txt", SCL = lines(SC);
const SC_REF = "Sandhoefer & Chan, Density matrix embedding theory for interacting electron-phonon systems, Phys. Rev. B 94, 085115 (2016), doi:10.1103/PhysRevB.94.085115, arXiv:1602.04195";
// The DMRG column: computed by Fehske and Jeckelmann and supplied to the authors (acknowledgements,
// line 342); their paper on this chain, Fehske, Hager & Jeckelmann, EPL 84, 57001 (2008), shows no
// ground-state energies (read in full, 2026-11-25), so the row cites them as unpublished, printed in
// the paper that printed the numbers (RULES.md 8; the D. Poilblanc rows of 2026-10-22 are the model).
const SC_FJ = "H. Fehske and E. Jeckelmann, unpublished DMRG energies of the open 32-site chain, printed in Sandhoefer & Chan, Density matrix embedding theory for interacting electron-phonon systems, Phys. Rev. B 94, 085115 (2016), Table I, arXiv:1602.04195 (acknowledgements)";
const SC_VERSION = "version read: the journal text (PRB 94, 085115, same Table I) and the arXiv text (sources/1602.04195.txt), 2026-11-25";
const SC_CONV = "Eq. (1), lines 44-50: H = sum_<ij>,s t c+_is c_js + U sum n_i,up n_i,dn + w0 sum a+_i a_i + g sum n_i (a+_i + a_i), coupling to n_i, no zero-point term; lambda = 2 g^2 / w0 and all units t = 1 (line 190), so g = sqrt(lambda w0 / 2). Table I (lines 247-266): energies per site, phmax = 8; DMRG with open, DMET with antiperiodic boundaries and a 2-site impurity cluster (lines 193-197), DMET also on 504 sites (lines 210-212). Implied, not stated (RULES.md 8): (1) half filling. The g = 0, U -> infinity limit is called a Mott insulator (lines 206-209), and the DMRG reference energies are Fehske and Jeckelmann's (lines 186-187, 342), whose study of this chain is 'Metallicity in the half-filled Holstein-Hubbard model' (Ref. 22, EPL 84, 57001, energies 'at half-filling with Ne=N'). (2) the energy zero of Eq. (1), not of the shifted Eq. (2), which drops a constant of lambda/2 per site at half filling (3.2 at lambda = 6.4): the DMET and DMRG columns differ by 0.3 to 5.6 %, so they share one zero, and Fehske and Jeckelmann's Hamiltonian (EPL Eq. (1)) couples to n_i with no shift. No conversion.";
// [line, w, lambda, U, DMRG (OBC 32), DMET (APBC 32), DMET (APBC 504)]
const TABLE = [
  [252, 0.5, 1.5, 0.025, "-2.108", "-2.136", "-2.136"],
  [253, 0.5, 1.1, 0.025, "-1.878", "-1.886", "-1.886"],
  [254, 0.5, 0.5, 0.025, "-1.539", "-1.546", "-1.545"],
  [255, 0.5, 1.5, 0.4, "-2.002", "-2.022", "-2.022"],
  [256, 0.5, 1.0, 0.4, "-1.722", "-1.732", "-1.730"],
  [257, 0.5, 1.4, 0.8, "-1.843", "-1.858", "-1.857"],
  [258, 0.5, 0.5, 1.6, "-1.182", "-1.188", "-1.188"],
  [259, 5.0, 6.4, 1.0, "-6.083", "-6.125", "-6.125"],
  [260, 5.0, 4.0, 1.0, "-3.933", "-3.945", "-3.945"],
  [261, 5.0, 2.0, 1.0, "-2.380", "-2.408", "-2.407"],
  [262, 5.0, 4.8, 2.0, "-4.211", "-4.229", "-4.229"],
  [263, 5.0, 4.0, 2.0, "-3.558", "-3.593", "-3.588"],
  [264, 5.0, 6.0, 4.0, "-4.435", "-4.473", "-4.470"],
  [265, 5.0, 2.0, 5.0, "-1.582", "-1.671", "-1.671"],
];
const hh = [];
for (const [line, w, lam, U, ...E] of TABLE) {
  for (const s of E) check(SCL, SC, line, s);
  const g = +Math.sqrt(lam * w / 2).toPrecision(12);
  const cols = [
    [32, "O", E[0], "DMRG (Fehske & Jeckelmann), 8 phonons", "variational", "DMRG Energy", true],
    [32, "A", E[1], "DMET (2-site cluster), 8 phonons", "approximate", "DMET Energy (32)", false],
    [504, "A", E[2], "DMET (2-site cluster), 8 phonons", "approximate", "DMET Energy (504)", false],
  ];
  for (const [n, b, s, method, bound, col, quoted] of cols) {
    hh.push({
      instance_id: `HubbardHolstein/chain_${n}_${b}_e${n}_U${fmt(U)}_w${fmt(w)}_g${fmt(g)}`,
      eps: +s, tol: 0.5 * 10 ** -dec(s), sigma_per_site: null, var_per_site: null,
      arxiv: "1602.04195", peer_reviewed: true, origin: quoted ? "quoted" : "own", bound_type: bound, method,
      reference: quoted ? SC_FJ : SC_REF,
      evidence: `Table I, ω = ${w}, λ = ${lam}, U = ${U}, column ${col} (line ${line})${quoted ? "; the DMRG energies of Fehske and Jeckelmann (lines 186-187), supplied to the authors (acknowledgements, line 342); Fehske, Hager & Jeckelmann, EPL 84, 57001 (2008), the DMRG study of this chain, read in full, shows no ground-state energies" : ""}; ${SC_VERSION}`,
      convention_check: SC_CONV, reported_as: s, confidence: "high",
      verified_by: "first reading (2026-11-16), full reading of the paper and of Ref. 22 (2026-11-25)",
      variance_as_reported: null, defect: null, sampled: false,
      create: { model: "HubbardHolstein", lattice: "chain", n_sites: n, boundary: b,
        params: { t: 1, U, w, g, spinless: false, N_up: n / 2, N_dn: n / 2 } },
    });
  }
}

// --- arXiv:2405.08701, fig_2_hol.dat --------------------------------------------------------
const MR = "sources/2405.08701-fig_2_hol.dat", MRL = lines(MR);
const MR_REF = "Mahajan, Robinson, Lee & Reichman, Structure and dynamics of electron-phonon coupled systems using neural quantum states, Phys. Rev. B 112, 184310 (2025), doi:10.1103/p8qz-p45d, arXiv:2405.08701";
const MR_CONV = "Table I of the journal version: Holstein coupling g sum_i c+_i c_i (b+_i + b_i), lambda = g^2 / (2 w t), so g = sqrt(2 lambda w0) = sqrt(lambda) at w0 = 0.5 (Fig. 2 caption); phonon term w0 sum b+b, no zero-point term; t = 1. One electron on the 30-site chain (Fig. 2 caption). Implied, not stated (RULES.md 8): (1) periodic boundaries. At lambda = 0 the NQS energies reach -1.999925 to -2.000000, below the lowest one-electron energy of the open chain, -2 cos(π/31) = -1.98974, and of the antiperiodic chain, -2 cos(π/30) = -1.98904, which no variational energy can do; the authors' code (github.com/ankit76/nn_eph, at commit 33a242f of 2024-04-12, before arXiv v1) builds the polaron hopping on a ring only. (2) the columns hol_nh_0 to hol_nh_3 are nH = 1, 5, 10, 20 in the legend order of Fig. 2: their relative errors against hol_ref are the plotted ones. (3) total energies in units of t: -2 at lambda = 0 is the k = 0 band bottom. Direct VMC energies of one optimised state; no error bars printed. No conversion.";
const NH = [1, 5, 10, 20];
const hol = [];
MRL.forEach((l, i) => {
  if (l.startsWith("#") || !l.trim()) return;
  const [lam, ...v] = l.trim().split(/\s+/).map(Number);
  if (lam === 0) return; // g = 0: no electron-phonon problem
  const g = +Math.sqrt(2 * lam * 0.5).toPrecision(12);
  v.slice(0, 4).forEach((E, k) => {
    const s = String(E); // shortest form of the stored double, the value as computed
    hol.push({
      instance_id: `Holstein/chain_30_P_f1_w0.5_g${fmt(g)}`,
      eps: +(E / 30).toPrecision(15), tol: Math.max(+(0.5 * 10 ** -dec(s) / 30).toPrecision(3), 1e-13), // floor: double precision
      sigma_per_site: null, var_per_site: null,
      arxiv: "2405.08701", peer_reviewed: true, origin: "own", bound_type: "variational", method: `MLP (nH = ${NH[k]})`,
      reference: MR_REF,
      evidence: `Supplemental Material, fig_2_hol.dat (Fig. 2, left), λ = ${lam}, column hol_nh_${k} (line ${i + 1} of sources/2405.08701-fig_2_hol.dat); version read: the journal text and Supplemental Material (PRB 112, 184310), 2026-11-25`,
      convention_check: MR_CONV, reported_as: s, confidence: "medium",
      verified_by: "first reading and a second reading (2026-11-24), full reading of the paper and the authors' code (2026-11-25)",
      variance_as_reported: null, defect: null, sampled: true,
      create: { model: "Holstein", lattice: "chain", n_sites: 30, boundary: "P",
        params: { t: 1, w: 0.5, g, spinless: true, N: 1 } },
    });
  });
});

const out = [["passes/rows/sweep-rows-2026-11-26-hubbardholstein.json", hh], ["passes/rows/sweep-rows-2026-11-26-holstein.json", hol]];
for (const [f, rows] of out) {
  fs.writeFileSync(f, JSON.stringify(rows, null, 1) + "\n");
  console.log(`${rows.length} rows on ${new Set(rows.map(r => r.instance_id)).size} instances -> ${f}`);
}
