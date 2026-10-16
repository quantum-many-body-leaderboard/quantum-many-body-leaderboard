// Hartree-Fock energy of the homogeneous electron gas in a periodic cell (RULES.md 12.2): the
// convention check for track 2. A source's printed HF energy that matches this one fixes its
// units, normalisation and Ewald/Madelung convention at once.
//
// Plane-wave Slater determinant at the twist k_s (Gamma by default), each spin filling its N_s
// lowest |k + k_s|^2. Hartree atomic units, energy per electron:
//   E_HF/N = (1/N) [ sum_occ |k|^2/2 - (1/2 Omega) sum_s sum_{k != k' occ s} v(k - k') + N xi / 2 ]
// v(q) = 4 pi / q^2 (3D), 2 pi / q (2D); xi is the Madelung term of the cell (Ewald, with the
// uniform background), lim_{r->0} [v_E(r) - 1/r].
//
//   node checks/heg-hf/hf.mjs <dim> <cell> <N_up> <N_dn> <rs> [twist as fractions of the reciprocal vectors]
//   cells: sc bcc fcc (3D), square triangular (2D), rect:a:b[:c] (side ratios)
// Prints JSON; "open_shell": true when the last occupied shell of a spin is only partly filled
// (the determinant is then not unique and the HF energy depends on the choice).
import { pathToFileURL } from "node:url";

function cellVectors(dim, cell) {
  if (cell.startsWith("rect:")) {
    const r = cell.slice(5).split(":").map(Number);
    return r.map((a, i) => r.map((_, j) => (i === j ? a : 0)));
  }
  const C = {
    sc: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    bcc: [[-0.5, 0.5, 0.5], [0.5, -0.5, 0.5], [0.5, 0.5, -0.5]],
    fcc: [[0, 0.5, 0.5], [0.5, 0, 0.5], [0.5, 0.5, 0]],
    square: [[1, 0], [0, 1]],
    triangular: [[1, 0], [0.5, Math.sqrt(3) / 2]],
  }[cell];
  if (!C || C[0].length !== dim) throw new Error(`cell ${cell} for dimension ${dim}`);
  return C;
}
const det = A => A.length === 2 ? A[0][0] * A[1][1] - A[0][1] * A[1][0]
  : A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) - A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) + A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0]);
function reciprocal(A) { // rows of B with A_i . B_j = 2 pi delta_ij
  const d = det(A), n = A.length;
  if (n === 2) return [[A[1][1], -A[1][0]], [-A[0][1], A[0][0]]].map(r => r.map(x => (2 * Math.PI * x) / d));
  const cross = (u, v) => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  return [cross(A[1], A[2]), cross(A[2], A[0]), cross(A[0], A[1])].map(r => r.map(x => (2 * Math.PI * x) / d));
}
const norm2 = v => v.reduce((a, x) => a + x * x, 0);
function* grid(n, dim) {
  const r = [...Array(2 * n + 1)].map((_, i) => i - n);
  if (dim === 2) for (const a of r) for (const b of r) yield [a, b];
  else for (const a of r) for (const b of r) for (const c of r) yield [a, b, c];
}
const comb = (m, B) => B[0].map((_, j) => m.reduce((s, mi, i) => s + mi * B[i][j], 0));

export function madelung(A, dim) {
  const Omega = Math.abs(det(A)), B = reciprocal(A);
  const L = Math.pow(Omega, 1 / dim), kappa = 2.8 / L; // splitting; both sums converge to 1e-14 at n = 10
  let real = 0, recip = 0;
  for (const m of grid(10, dim)) {
    if (m.every(x => x === 0)) continue;
    const R = Math.sqrt(norm2(comb(m, A)));
    real += erfcAccurate(kappa * R) / R;
    const G = Math.sqrt(norm2(comb(m, B)));
    recip += dim === 3 ? (4 * Math.PI / Omega) * Math.exp(-(G * G) / (4 * kappa * kappa)) / (G * G)
      : (2 * Math.PI / Omega) * erfcAccurate(G / (2 * kappa)) / G;
  }
  return dim === 3 ? real + recip - (2 * kappa) / Math.sqrt(Math.PI) - Math.PI / (kappa * kappa * Omega)
    : real + recip - (2 * kappa) / Math.sqrt(Math.PI) - (2 * Math.sqrt(Math.PI)) / (kappa * Omega);
}
// erfc to ~1e-15: continued fraction for large x, series for small x
function erfcAccurate(x) {
  if (x < 2) { let s = 0, t = x, n = 0; while (Math.abs(t) > 1e-17 * Math.abs(s) || n < 3) { s += t / (2 * n + 1); n++; t *= -x * x / n; } return 1 - (2 / Math.sqrt(Math.PI)) * s; }
  let f = 0; for (let n = 60; n >= 1; n--) f = (n / 2) / (x + f);
  return Math.exp(-x * x) / Math.sqrt(Math.PI) / (x + f);
}

export function hf({ dim, cell, Nup, Ndn, rs, twist = null }) {
  const N = Nup + Ndn;
  const unit = cellVectors(dim, cell);
  const v0 = Math.abs(det(unit));
  const Omega = dim === 3 ? N * (4 * Math.PI / 3) * rs ** 3 : N * Math.PI * rs ** 2;
  const s = Math.pow(Omega / v0, 1 / dim);
  const A = unit.map(r => r.map(x => x * s));
  const B = reciprocal(A);
  const ks = twist ? comb(twist, B) : B[0].map(() => 0);
  const ks2 = [...grid(12, dim)].map(m => comb(m, B).map((x, j) => x + ks[j])).map(k => ({ k, e: norm2(k) })).sort((a, b) => a.e - b.e);
  const fill = n => {
    const occ = ks2.slice(0, n);
    const last = n ? occ[n - 1].e : 0, next = ks2[n].e;
    return { occ: occ.map(o => o.k), open: n > 0 && Math.abs(next - last) < 1e-9 * Math.max(1, last) };
  };
  let kin = 0, ex = 0, open = false;
  for (const n of [Nup, Ndn]) {
    const { occ, open: o } = fill(n);
    open ||= o;
    for (const k of occ) kin += norm2(k) / 2;
    for (let i = 0; i < occ.length; i++) for (let j = 0; j < occ.length; j++) {
      if (i === j) continue;
      const q = Math.sqrt(norm2(occ[i].map((x, t) => x - occ[j][t])));
      ex -= (dim === 3 ? 4 * Math.PI / (q * q) : 2 * Math.PI / q) / (2 * Omega);
    }
  }
  const xi = madelung(A, dim);
  const total = kin + ex + (N * xi) / 2;
  return { dim, cell, N_up: Nup, N_dn: Ndn, rs, twist: twist ?? "Gamma", open_shell: open,
    E_HF_per_electron: total / N, kinetic_per_electron: kin / N, exchange_per_electron: ex / N, madelung_per_electron: xi / 2, xi };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [dim, cell, Nup, Ndn, rs, ...tw] = process.argv.slice(2);
  console.log(JSON.stringify(hf({ dim: +dim, cell, Nup: +Nup, Ndn: +Ndn, rs: +rs, twist: tw.length ? tw.map(Number) : null })));
}
