// Generator of passes/rows/sweep-rows-2026-11-27-bosehubbard.json: the first Bose-Hubbard instances
// (RULES.md 2.1, 2026-11-11) and the own energies of their source (SWEEP.md, 2026-11-27).
//
// - Denis & Carleo, Accurate neural quantum states for interacting lattice bosons, Quantum 9, 1772
//   (2025), arXiv:2404.07869. Table 1: 8 x 8 at U/J = 8.5 and 17.0, 10 x 10 at U/J = 16.0 and 20.0
//   (NBFJ, depth D = 6). Appendix D, Table 2: 8 x 8, 12 x 12, 16 x 16 and 20 x 20 at U/J = 16.8 for
//   several depths D. Unit filling, N_b = L^2, on L x L square lattices.
//
// Boundary: the text states "a periodic 2D lattice" for 16 x 16 and 20 x 20 only. The code the paper
// cites for all its simulations (Ref. [106], cqsl/lattice-bosons v1.0.0, doi:10.5281/zenodo.15632176)
// builds every lattice as nk.graph.Hypercube(N, n_dim=n_dim) without passing its pbc parameter,
// so NetKet's default pbc=True applies at every size; its example.json is "a 8x8 periodic lattice".
// Periodic is the only reading the code allows (implied fact, RULES.md 8, 2026-11-26).
//
// Not here: the GFMC cells of Table 1 (Ref. [100], a private communication; at U/J = 17.0 the GFMC
// value -0.5375(4) lies above the NBFJ variational value, so its bound type needs a ruling) and the
// NQS-OH and NQS-B cells (quoted from Pei & Clark, J. Phys. B 57, 215301 (2024); they wait for
// their primary).
//
// Every number is copied from the committed text as printed (sources/2404.07869.txt, the version
// accepted in Quantum), and this script stops unless it finds the printed string within five lines
// of its cited line. The script fixes only the instance, the printed error bar and the method string.
//
// usage: node scripts/bosehubbard_2026_11_27.mjs   (writes the pass file; the build applies it)
import fs from "node:fs";

const OUT = "passes/rows/sweep-rows-2026-11-27-bosehubbard.json";
const A = "2404.07869";
const REF = "Denis & Carleo, Accurate neural quantum states for interacting lattice bosons, Quantum 9, 1772 (2025), doi:10.22331/q-2025-06-17-1772, arXiv:2404.07869";
const VERSION = "version read: the version accepted in Quantum (sources/2404.07869.txt, 'Accepted in Quantum 2025-06-04'), which Quantum publishes as Quantum 9, 1772 (2025)";
const CONV = "Eq. (1): H = -J sum_<i,j> (a†_i a_j + a†_j a_i) + (U/2) sum_i a†_i a†_i a_i a_i, which is the instance's Hamiltonian with t = J (a†a†aa = n(n-1)); 'L x L two-dimensional square lattices at fixed number of particles N and unit density n = N/L^2 = 1'; tables print E_θ/JL^2, the energy per site in units of J, so no conversion.";
const PBC = "boundary periodic: stated for 16 x 16 and 20 x 20 (text, Sec. 4.1); for every size implied by the cited code, cqsl/lattice-bosons v1.0.0 vmc.py 'g = nk.graph.Hypercube(N, n_dim=n_dim)' (NetKet default pbc=True; RULES.md 8, 2026-11-26)";

const inst = (L, U) => ({ id: `BoseHubbard/square_${L * L}_P_b${L * L}_U${U}`, model: "BoseHubbard", lattice: "square", n_sites: L * L, boundary: "P", params: { t: 1, U, N_b: L * L } });

// [L, U, txt line, as printed, depth D, where]
const R = [
  [8, 8.5, 356, "−1.544668(3)", 6, "Table 1, 8x8, U/J = 8.5, NBFJ (6681 parameters)"],
  [8, 17, 358, "−0.53804(2)", 6, "Table 1, 8x8, U/J = 17.0, NBFJ (6681 parameters)"],
  [10, 16, 360, "−0.58972(3)", 6, "Table 1, 10x10, U/J = 16.0, NBFJ (6683 parameters)"],
  [10, 20, 362, "−0.43329(3)", 6, "Table 1, 10x10, U/J = 20.0, NBFJ (6683 parameters)"],
  [8, 16.8, 1014, "−0.452(2)", 0, "Table 2, 8x8, depth 0"],
  [8, 16.8, 1014, "−0.54783(6)", 6, "Table 2, 8x8, depth 6"],
  [12, 16.8, 1016, "−0.444(1)", 0, "Table 2, 12x12, depth 0"],
  [12, 16.8, 1016, "−0.54320(7)", 6, "Table 2, 12x12, depth 6"],
  [16, 16.8, 1017, "−0.446(1)", 0, "Table 2, 16x16, depth 0"],
  [16, 16.8, 1018, "−0.5375(2)", 2, "Table 2, 16x16, depth 2"],
  [16, 16.8, 1019, "−0.5411(1)", 4, "Table 2, 16x16, depth 4"],
  [16, 16.8, 1020, "−0.54191(7)", 6, "Table 2, 16x16, depth 6"],
  [20, 16.8, 1021, "−0.4414(9)", 0, "Table 2, 20x20, depth 0"],
  [20, 16.8, 1022, "−0.5373(1)", 2, "Table 2, 20x20, depth 2"],
  [20, 16.8, 1023, "−0.54119(5)", 4, "Table 2, 20x20, depth 4"],
  [20, 16.8, 1024, "−0.54162(5)", 6, "Table 2, 20x20, depth 6"],
  [20, 16.8, 1025, "−0.54182(4)", 8, "Table 2, 20x20, depth 8"],
];

const clean = s => s.replace(/[−–]/g, "-").replace(/\s+/g, "");
const L = fs.readFileSync(`sources/${A}.txt`, "utf8").split("\n");
const out = [];
for (const [side, U, at0, printed, D, where] of R) {
  const want = clean(printed);
  const at = [0, -1, 1, -2, 2, -3, 3, -4, 4, -5, 5].map(d => at0 + d).find(k => clean(L[k - 1] ?? "").includes(want));
  if (at == null) throw new Error(`${A}: '${printed}' not found at line ${at0}`);
  const m = want.match(/^(-?\d*\.(\d+))\((\d+)\)$/);
  if (!m) throw new Error(`cannot parse ${printed}`);
  const def = inst(side, U);
  out.push({
    instance_id: def.id, eps: +m[1], tol: +(0.5 * 10 ** -m[2].length).toPrecision(3),
    sigma_per_site: +(+m[3] * 10 ** -m[2].length).toPrecision(6), var_per_site: null,
    arxiv: A, peer_reviewed: true, origin: "own", bound_type: "variational", method: `NBFJ, D = ${D}`,
    reference: REF,
    evidence: [`${where}; sources/${A}.txt line ${at}`, PBC, VERSION].join("; "),
    convention_check: CONV, reported_as: printed.replace(/−/g, "-"), confidence: "high",
    verified_by: "single reading (2026-11-27)", variance_as_reported: null, defect: null, sampled: true,
    create: { model: def.model, lattice: def.lattice, n_sites: def.n_sites, boundary: def.boundary, params: def.params },
  });
}
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + "\n");
console.log(`${out.length} rows on ${new Set(out.map(r => r.instance_id)).size} instances -> ${OUT}`);
