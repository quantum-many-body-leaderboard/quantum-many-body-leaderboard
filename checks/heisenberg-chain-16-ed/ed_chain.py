"""Ground-state energy of the periodic spin-1/2 Heisenberg chain H = sum_i S_i . S_{i+1}
(S = sigma/2) by exact diagonalization, for Heisenberg/chain_<N>_P.

Two codes in one script:
  A. scipy.sparse Hamiltonian in the S^z = 0 sector (binom(N, N/2) basis states, no spatial
     symmetry), lowest eigenvalue by ARPACK Lanczos (eigsh, tol 1e-14), with the true
     residual |H v - E v| of the returned vector.
  B. The same sector, matrix-free: plain Lanczos with full reorthogonalisation on a bit-flip
     matvec, written separately from A (no shared Hamiltonian code).
The S^z = 0 sector holds the S^z = 0 member of every spin multiplet, so its lowest level is the
ground state. The energy is printed in the S.S form and in the Pauli form QMBL stores
(4 x S.S, RULES.md 5).

Usage: uv run --with numpy --with scipy python -I ed_chain.py [N]   (default N = 16)
"""
import sys
from itertools import combinations
from math import comb

import numpy as np
import scipy
import scipy.sparse as sp
from scipy.sparse.linalg import eigsh

N = int(sys.argv[1]) if len(sys.argv) > 1 else 16
assert N % 2 == 0
bonds = [(i, (i + 1) % N) for i in range(N)]

# S^z = 0 basis: every N-bit word with N/2 up spins, sorted, and its index.
states = np.array(sorted(sum(1 << k for k in c) for c in combinations(range(N), N // 2)), dtype=np.int64)
dim = len(states)
assert dim == comb(N, N // 2)
index = {int(s): k for k, s in enumerate(states)}


def code_a():
    rows, cols, vals = [], [], []
    for k, s in enumerate(states):
        s = int(s)
        diag = 0.0
        for i, j in bonds:
            si, sj = (s >> i) & 1, (s >> j) & 1
            if si == sj:
                diag += 0.25
            else:
                diag -= 0.25
                t = s ^ ((1 << i) | (1 << j))       # S+_i S-_j + h.c. = 1/2 (flip both)
                rows.append(index[t]); cols.append(k); vals.append(0.5)
        rows.append(k); cols.append(k); vals.append(diag)
    H = sp.csr_matrix((vals, (rows, cols)), shape=(dim, dim))
    assert abs(H - H.T).max() == 0
    w, v = eigsh(H, k=1, which="SA", tol=1e-14)
    e, v = float(w[0]), v[:, 0]
    return e, float(np.linalg.norm(H @ v - e * v)), H.nnz


def code_b(iters=200):
    # matvec: for every bond, the zz part on the diagonal and the flip on antiparallel pairs
    up = [((states >> i) & 1) for i in range(N)]
    diag = np.zeros(dim)
    flips = []
    for i, j in bonds:
        par = up[i] == up[j]
        diag += np.where(par, 0.25, -0.25)
        src = np.nonzero(~par)[0]
        dst = np.searchsorted(states, states[src] ^ ((1 << i) | (1 << j)))
        flips.append((src, dst))

    def Hx(x):
        y = diag * x
        for src, dst in flips:
            np.add.at(y, dst, 0.5 * x[src])
        return y

    rng = np.random.default_rng(1)
    q = rng.standard_normal(dim); q /= np.linalg.norm(q)
    Q, a, b = [q], [], []
    for _ in range(iters):
        w = Hx(Q[-1])
        a.append(Q[-1] @ w)
        for p in Q:                                  # full reorthogonalisation
            w -= (p @ w) * p
        nb = np.linalg.norm(w)
        if nb < 1e-13:
            break
        b.append(nb); Q.append(w / nb)
    m = len(a)
    T = np.diag(a) + np.diag(b[:m - 1], 1) + np.diag(b[:m - 1], -1)
    th, y = np.linalg.eigh(T)
    v = sum(y[k, 0] * Q[k] for k in range(m))
    e = float(th[0])
    return e, float(np.linalg.norm(Hx(v) - e * v) / np.linalg.norm(v)), m


ea, ra, nnz = code_a()
eb, rb, m = code_b()
print(f"N={N} P sector Sz=0 dim={dim} numpy={np.__version__} scipy={scipy.__version__}")
print(f"A scipy eigsh: E(S.S)={ea!r} E(Pauli)={4 * ea!r} residual={ra:.2e} nnz={nnz}")
print(f"B Lanczos:     E(S.S)={eb!r} E(Pauli)={4 * eb!r} residual={rb:.2e} iterations={m}")
print(f"|A - B| = {abs(ea - eb):.2e}; E/N = {ea / N!r}")
