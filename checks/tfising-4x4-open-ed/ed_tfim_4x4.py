"""Ground-state energy of the transverse-field Ising model on the OPEN 4 x 4 square lattice,
H = - sum_<ij> sz_i sz_j - h sum_i sx_i (Pauli matrices, 24 nearest-neighbour bonds), for
TFIsing/square_16_O_<h>. QMBL stores the total energy; E/N = E / 16 (RULES.md 5).

Two codes in one script, sharing no Hamiltonian code:
  A. scipy.sparse Hamiltonian on the full 2^16 = 65,536-state space (no symmetry), lowest
     eigenvalue by ARPACK Lanczos (eigsh, tol 1e-14), with the true residual |H v - E v|.
  B. Matrix-free plain Lanczos with full reorthogonalisation on the same space, with a bit-flip
     matvec written separately from A.
The full space holds every state, so its lowest eigenvalue is the ground state.

Usage: python -I ed_tfim_4x4.py [h ...]   (default h = 1 2 3 3.5)
"""
import sys

import numpy as np
import scipy
import scipy.sparse as sp
from scipy.sparse.linalg import eigsh

L = 4
N = L * L
D = 1 << N
site = lambda x, y: x + L * y
bonds = [(site(x, y), site(x + 1, y)) for y in range(L) for x in range(L - 1)] + \
        [(site(x, y), site(x, y + 1)) for y in range(L - 1) for x in range(L)]
assert len(bonds) == 24
hs = [float(a) for a in sys.argv[1:]] or [1.0, 2.0, 3.0, 3.5]

states = np.arange(D, dtype=np.int64)
# diagonal: - sum_<ij> sz_i sz_j, sz = +1 for bit 0 and -1 for bit 1
diag = np.zeros(D)
for i, j in bonds:
    same = (((states >> i) & 1) == ((states >> j) & 1))
    diag -= np.where(same, 1.0, -1.0)


def code_a(h):
    rows = [states]
    cols = [states]
    vals = [diag]
    for i in range(N):
        rows.append(states ^ (1 << i))
        cols.append(states)
        vals.append(np.full(D, -h))
    H = sp.csr_matrix((np.concatenate(vals), (np.concatenate(rows), np.concatenate(cols))), shape=(D, D))
    E, v = eigsh(H, k=1, which="SA", tol=1e-14)
    v = v[:, 0]
    return E[0], np.linalg.norm(H @ v - E[0] * v)


def matvec(h, v):
    w = diag * v
    for i in range(N):
        w -= h * v[states ^ (1 << i)]
    return w


def code_b(h, iters=200):
    rng = np.random.default_rng(1)
    q = rng.standard_normal(D)
    q /= np.linalg.norm(q)
    Q = [q]
    alpha, beta = [], []
    for k in range(iters):
        w = matvec(h, Q[-1])
        a = Q[-1] @ w
        alpha.append(a)
        for p in Q:                     # full reorthogonalisation
            w -= (p @ w) * p
        b = np.linalg.norm(w)
        if b < 1e-12:
            break
        beta.append(b)
        Q.append(w / b)
    m = len(alpha)
    T = np.diag(alpha) + np.diag(beta[:m - 1], 1) + np.diag(beta[:m - 1], -1)
    ev, ec = np.linalg.eigh(T)
    v = sum(ec[k, 0] * Q[k] for k in range(m))
    v /= np.linalg.norm(v)
    return ev[0], np.linalg.norm(matvec(h, v) - ev[0] * v), m


print(f"open {L}x{L} TFIM, {len(bonds)} bonds, full space dim={D} numpy={np.__version__} scipy={scipy.__version__}")
for h in hs:
    ea, ra = code_a(h)
    eb, rb, m = code_b(h)
    print(f"h={h}")
    print(f"A scipy eigsh: E={ea!r} residual={ra:.2e}")
    print(f"B Lanczos:     E={eb!r} residual={rb:.2e} iterations={m}")
    print(f"|A - B| = {abs(ea - eb):.2e}; E/N = {ea / N!r}")
