"""Exact diagonalization of the t-J model on small clusters (QMBL convention check, 2026-10-22).
H = -t sum_<ij>,s P(c+_is c_js + h.c.)P + J sum_<ij> (S_i.S_j - n_i n_j/4)   [nn=True]
Bonds are given explicitly with a hopping sign factor (-1 across an antiperiodic boundary).
Fermion ordering: all up operators (site order) before all down operators."""
import sys, json, itertools
import numpy as np
from scipy.sparse import coo_matrix
from scipy.sparse.linalg import eigsh

def popcount(a):
    a = a.copy(); c = np.zeros_like(a)
    while np.any(a):
        c += a & 1; a >>= 1
    return c

def basis(N, nup, ndn):
    ups = [sum(1 << i for i in c) for c in itertools.combinations(range(N), nup)]
    out = []
    for u in ups:
        free = [i for i in range(N) if not (u >> i) & 1]
        for c in itertools.combinations(free, ndn):
            out.append((u << N) | sum(1 << i for i in c))
    return np.array(sorted(out), dtype=np.int64)

def between_mask(i, j):
    lo, hi = min(i, j), max(i, j)
    return ((1 << hi) - 1) ^ ((1 << (lo + 1)) - 1)

def hamiltonian(N, nup, ndn, bonds, t=1.0, J=0.4, nn=True):
    """bonds: list of (i, j, hop_sign)."""
    S = basis(N, nup, ndn); D = len(S)
    full = (1 << N) - 1
    up = S >> N; dn = S & full
    rows, cols, vals = [], [], []
    diag = np.zeros(D)
    idx = np.arange(D)
    for (i, j, sg) in bonds:
        bi, bj = 1 << i, 1 << j
        m = between_mask(i, j)
        ui, uj = (up & bi) > 0, (up & bj) > 0
        di, dj = (dn & bi) > 0, (dn & bj) > 0
        occi, occj = ui | di, uj | dj
        # diagonal: J (Sz Sz - n n /4) (nn) or J Sz Sz
        par = (ui & uj) | (di & dj); anti = (ui & dj) | (di & uj)
        if nn:
            diag += np.where(anti, -0.5 * J, 0.0)
        else:
            diag += np.where(par, 0.25 * J, 0.0) + np.where(anti, -0.25 * J, 0.0)
        # hopping, both directions, each spin
        for spin in ("u", "d"):
            occ = up if spin == "u" else dn
            for (a, b, ba, bb) in ((i, j, bi, bj), (j, i, bj, bi)):  # c+_a c_b : move from b to a
                sel = ((occ & bb) > 0) & ~(((up | dn) & ba) > 0)
                if not np.any(sel): continue
                src = idx[sel]
                o = occ[sel]
                sign = 1 - 2 * (popcount(o & m) & 1)
                no = o ^ (ba | bb)
                new = ((no << N) | dn[sel]) if spin == "u" else ((up[sel] << N) | no)
                k = np.searchsorted(S, new)
                rows.append(k); cols.append(src); vals.append(-t * sg * sign)
        # spin flip: J/2 (S+_i S-_j + S-_i S+_j) = -(J/2) (c+_iu c_ju)(c+_jd c_id) + (i<->j)
        for (a, b, ba, bb) in ((i, j, bi, bj), (j, i, bj, bi)):
            sel = ((up & bb) > 0) & ((dn & ba) > 0)   # up at b, down at a -> up at a, down at b
            if not np.any(sel): continue
            src = idx[sel]
            u, d = up[sel], dn[sel]
            s1 = 1 - 2 * (popcount(u & m) & 1)
            s2 = 1 - 2 * (popcount(d & m) & 1)
            nu = u ^ (ba | bb); nd = d ^ (ba | bb)
            k = np.searchsorted(S, (nu << N) | nd)
            rows.append(k); cols.append(src); vals.append(-(J / 2) * s1 * s2)
    rows.append(idx); cols.append(idx); vals.append(diag)
    H = coo_matrix((np.concatenate(vals), (np.concatenate(rows), np.concatenate(cols))), shape=(D, D)).tocsr()
    return H, D

def tilted(L1, L2):
    """Sites of the square lattice modulo the lattice vectors L1, L2; nearest-neighbour bonds (periodic)."""
    det = L1[0] * L2[1] - L1[1] * L2[0]; N = abs(det)
    def red(x, y):
        # fractional coordinates
        a = (x * L2[1] - y * L2[0]) / det; b = (-x * L1[1] + y * L1[0]) / det
        a -= np.floor(a + 1e-9); b -= np.floor(b + 1e-9)
        return (round(a * N) % N, round(b * N) % N)
    sites = {}
    R = max(map(abs, L1 + L2)) * 2 + 2
    for x in range(-R, R):
        for y in range(-R, R):
            k = red(x, y)
            if k not in sites: sites[k] = (x, y)
    assert len(sites) == N, (len(sites), N)
    keys = list(sites); ix = {k: n for n, k in enumerate(keys)}
    bonds = set()
    for k, (x, y) in sites.items():
        for dx, dy in ((1, 0), (0, 1)):
            a, b = ix[k], ix[red(x + dx, y + dy)]
            bonds.add((min(a, b), max(a, b), 1))
    return N, sorted(bonds)

def rect(Lx, Ly, px, py, antix=False):
    """Lx x Ly rectangle; px/py periodic flags; antix: antiperiodic hopping across the x boundary."""
    s = lambda x, y: x * Ly + y
    bonds = []
    for x in range(Lx):
        for y in range(Ly):
            if x + 1 < Lx: bonds.append((s(x, y), s(x + 1, y), 1))
            elif px and Lx > 2: bonds.append((s(0, y), s(x, y), -1 if antix else 1))
            if y + 1 < Ly: bonds.append((s(x, y), s(x, y + 1), 1))
            elif py and Ly > 2: bonds.append((s(x, 0), s(x, y), 1))
    return Lx * Ly, bonds

def coronene():
    """24-site open honeycomb flake: one hexagon and its six neighbours (arXiv:2406.16865 Fig. 2)."""
    import math
    cs = [(0.0, 0.0)] + [(math.sqrt(3) * math.cos(math.radians(60 * k)), math.sqrt(3) * math.sin(math.radians(60 * k))) for k in range(6)]
    pts = []
    for cx, cy in cs:
        for k in range(6):
            x, y = cx + math.cos(math.radians(60 * k + 30)), cy + math.sin(math.radians(60 * k + 30))
            if not any(abs(x - a) < 1e-6 and abs(y - b) < 1e-6 for a, b in pts): pts.append((x, y))
    bonds = [(i, j, 1) for i in range(len(pts)) for j in range(i + 1, len(pts))
             if abs(math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]) - 1) < 1e-6]
    return len(pts), bonds

if __name__ == "__main__":
    jobs = json.loads(sys.argv[1])
    for jb in jobs:
        if jb["cluster"] == "tilted": N, bonds = tilted(jb["L1"], jb["L2"])
        elif jb["cluster"] == "coronene": N, bonds = coronene()
        else: N, bonds = rect(jb["Lx"], jb["Ly"], jb["px"], jb["py"], jb.get("antix", False))
        ne = N - jb["holes"]; nup = (ne + 1) // 2; ndn = ne // 2
        H, D = hamiltonian(N, nup, ndn, bonds, t=jb.get("t", 1.0), J=jb["J"], nn=jb.get("nn", True))
        e = eigsh(H, k=1, which="SA", tol=1e-12)[0][0]
        print(json.dumps({**jb, "N": N, "bonds": len(bonds), "dim": D, "E": round(float(e), 10), "E_per_site": round(float(e) / N, 10)}), flush=True)
