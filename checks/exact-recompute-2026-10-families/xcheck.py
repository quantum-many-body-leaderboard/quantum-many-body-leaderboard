# Second, independent implementation (scipy sparse) for the small clusters: checks ed.c.
import sys, numpy as np, scipy.sparse as sp, scipy.sparse.linalg as sla
from itertools import combinations
def load(p):
    L = open(p).read().split("\n"); N, nb = map(int, L[0].split())
    return N, [(int(a), int(b), float(x), float(y), float(z)) for a, b, x, y, z in (l.split() for l in L[1:1 + nb])]
def ham_full(N, bonds):
    s = np.arange(2 ** N, dtype=np.int64); diag = np.zeros(2 ** N); rows = []; cols = []; vals = []
    for i, j, Jx, Jy, Jz in bonds:
        bi = (s >> i) & 1; bj = (s >> j) & 1; par = bi == bj
        diag += np.where(par, Jz, -Jz)
        amp = np.where(par, Jx - Jy, Jx + Jy); t = s ^ ((1 << i) | (1 << j))
        m = amp != 0; rows.append(t[m]); cols.append(s[m]); vals.append(amp[m])
    H = sp.csr_matrix((np.concatenate(vals), (np.concatenate(rows), np.concatenate(cols))), shape=(2 ** N, 2 ** N))
    return H + sp.diags(diag)
def ham_sz(N, bonds):
    st = np.array([sum(1 << k for k in c) for c in combinations(range(N), N // 2)], dtype=np.int64)
    idx = {v: k for k, v in enumerate(st)}; D = len(st); diag = np.zeros(D); r = []; c = []; v = []
    for i, j, Jx, Jy, Jz in bonds:
        bi = (st >> i) & 1; bj = (st >> j) & 1; par = bi == bj
        diag += np.where(par, Jz, -Jz)
        for k in np.nonzero(~par)[0]:
            r.append(idx[st[k] ^ ((1 << i) | (1 << j))]); c.append(k); v.append(Jx + Jy)
    return sp.csr_matrix((v, (r, c)), shape=(D, D)) + sp.diags(diag)
for p in sys.argv[1:]:
    N, b = load(p)
    H = ham_sz(N, b) if p.split("/")[-1].startswith("ss") else ham_full(N, b)
    e = sla.eigsh(H, k=3, which="SA", tol=1e-13, maxiter=100000)[0]
    print(p, "dim", H.shape[0], "lowest", " ".join("%.12f" % x for x in sorted(e)), flush=True)
