"""Free-Majorana ground-state energies of the pure Kitaev model (J = Gamma = 0), Pauli form
H = K sum_<ij>_gamma sigma^gamma_i sigma^gamma_j, |K| = 1 (QMBL stored total = this energy).

sigma^g_j = i b^g_j c_j, u_jk = i b^g_j b^g_k (j in A, k in B):
  sigma^g_j sigma^g_k = -i u_jk c_j c_k  ->  H = (i/4) sum A_jk c_j c_k, A_jk = -2 K u_jk.
E0(u) = -(1/2) sum of singular values of the A->B block; parity flip costs s_min.
Torus: physical states need prod_j D_j = 1, D_j = b^x b^y b^z c, which gives
  P_c = sign(perm) * prod u,  P_c = prod_m (i c_o(2m-1) c_o(2m)),  GS value (-1)^n sign Pf(A_o).
Open / cylinder clusters have dangling b Majoranas: no constraint, both parities are physical.
Independent code for the QMBL famE recompute, 2026-10-23.
"""
import sys, json, itertools, time
import numpy as np
from geom import honeycomb

GIDX = {"x": 0, "y": 1, "z": 2}


def block(N, bonds, K, u):
    n = N // 2
    M = np.zeros((n, n))
    for (i, j, g), ub in zip(bonds, u):
        M[i // 2, j // 2] += -2.0 * K * ub
    return M


def perm_sign(seq_from, seq_to):
    pos = {v: k for k, v in enumerate(seq_from)}
    p = [pos[v] for v in seq_to]
    seen = [False] * len(p); sgn = 1
    for s in range(len(p)):
        if not seen[s]:
            L = 0; t = s
            while not seen[t]:
                seen[t] = True; t = p[t]; L += 1
            if L % 2 == 0:
                sgn = -sgn
    return sgn


def torus_perm_sign(N, bonds):
    # each site must carry exactly one bond of each type
    cnt = {}
    for i, j, g in bonds:
        cnt[(i, g)] = cnt.get((i, g), 0) + 1; cnt[(j, g)] = cnt.get((j, g), 0) + 1
    assert all(v == 1 for v in cnt.values()) and len(cnt) == 3 * N
    S1 = [4 * s + t for s in range(N) for t in range(4)]
    order = [s for s in range(N) if s % 2 == 0] + [s for s in range(N) if s % 2 == 1]
    S2 = [x for (i, j, g) in bonds for x in (4 * i + GIDX[g], 4 * j + GIDX[g])] + [4 * s + 3 for s in order]
    return perm_sign(S1, S2)


def energies(N, bonds, K, U, torus):
    """U: (nconf, nbonds) array of +-1. Returns physical E per config, plus E0, Eodd."""
    n = N // 2
    ai = np.array([b[0] // 2 for b in bonds]); bj = np.array([b[1] // 2 for b in bonds])
    Ms = np.zeros((U.shape[0], n, n))
    for k in range(len(bonds)):
        Ms[:, ai[k], bj[k]] += -2.0 * K * U[:, k]
    s = np.linalg.svd(Ms, compute_uv=False)
    E0 = -0.5 * s.sum(axis=1)
    Eodd = E0 + s.min(axis=1)
    if not torus:
        return E0, E0, Eodd
    sp = torus_perm_sign(N, bonds)
    sign, _ = np.linalg.slogdet(Ms)
    pf_sign = (-1) ** (n * (n - 1) // 2) * sign
    gs_pc = (-1) ** n * pf_sign
    need = sp * np.prod(U, axis=1)
    phys = np.where(gs_pc == need, E0, Eodd)
    phys = np.where(np.abs(sign) < 0.5, E0, phys)  # zero mode: both parities degenerate
    return phys, E0, Eodd


def spanning_free(N, bonds):
    parent = list(range(N))
    def find(a):
        while parent[a] != a:
            parent[a] = parent[parent[a]]; a = parent[a]
        return a
    free = []
    for k, (i, j, g) in enumerate(bonds):
        ri, rj = find(i), find(j)
        if ri == rj: free.append(k)
        else: parent[ri] = rj
    return free


def hexagons(N, bonds):
    adj = {s: [] for s in range(N)}
    for k, (i, j, g) in enumerate(bonds):
        adj[i].append((j, k)); adj[j].append((i, k))
    found = set()
    for s0 in range(0, N, 2):
        stack = [(s0, [s0], [])]
        while stack:
            s, path, ed = stack.pop()
            if len(ed) == 6:
                continue
            for t, k in adj[s]:
                if ed and k == ed[-1]: continue
                if t == s0 and len(ed) == 5:
                    found.add(frozenset(ed + [k]))
                elif t not in path and len(ed) < 5:
                    stack.append((t, path + [t], ed + [k]))
    return [sorted(h) for h in found]


def gf2_solve(P, f):
    """Solve P x = f over GF(2); return one solution and a null-space basis."""
    P = P.copy() % 2; f = f.copy() % 2
    r, c = P.shape; piv = []; row = 0
    A = np.concatenate([P, f[:, None]], axis=1).astype(np.uint8)
    for col in range(c):
        pr = next((q for q in range(row, r) if A[q, col]), None)
        if pr is None: continue
        A[[row, pr]] = A[[pr, row]]
        for q in range(r):
            if q != row and A[q, col]: A[q] ^= A[row]
        piv.append(col); row += 1
        if row == r: break
    if any(A[q, -1] for q in range(row, r)): return None, None
    x = np.zeros(c, dtype=np.uint8)
    for q, col in enumerate(piv): x[col] = A[q, -1]
    free = [col for col in range(c) if col not in piv]
    null = []
    for fc in free:
        v = np.zeros(c, dtype=np.uint8); v[fc] = 1
        for q, col in enumerate(piv): v[col] = A[q, fc]
        null.append(v)
    return x, null


def flux_of(U, P):
    return (((1 - U) // 2) @ P.T) % 2


def run(name, N, bonds, K, torus, enum_limit=17):
    t0 = time.time()
    free = spanning_free(N, bonds)
    out = {"name": name, "N": N, "bonds": len(bonds), "free_bonds": len(free)}
    hexes = hexagons(N, bonds)
    P = np.zeros((len(hexes), len(bonds)), dtype=np.int64)
    for h, es in enumerate(hexes): P[h, es] = 1
    out["hexagons"] = len(hexes)
    u_all = np.ones((1, len(bonds)))
    phys, E0, Eo = energies(N, bonds, K, u_all, torus)
    out["E_uniform_u+1"] = float(phys[0])
    if len(free) <= enum_limit:
        best = (np.inf, None); res = []
        confs = np.array(list(itertools.product([1, -1], repeat=len(free))), dtype=float)
        for c0 in range(0, len(confs), 8192):
            U = np.ones((len(confs[c0:c0 + 8192]), len(bonds)))
            U[:, free] = confs[c0:c0 + 8192]
            ph, e0, eo = energies(N, bonds, K, U, torus)
            res.append((ph, e0, flux_of(U.astype(int), P).sum(axis=1)))
        ph = np.concatenate([r[0] for r in res]); e0 = np.concatenate([r[1] for r in res]); nf = np.concatenate([r[2] for r in res])
        k = int(np.argmin(ph))
        out["mode"] = f"full enumeration of 2^{len(free)} gauge classes"
        out["E_min"] = float(ph[k]); out["vortices_at_min"] = int(nf[k])
        out["E_unconstrained_min"] = float(e0.min())
        srt = np.unique(np.round(ph, 9))
        out["lowest_levels"] = [float(x) for x in srt[:6]]
        # flux-free classes and their energies
        ff = nf == 0
        out["flux_free_class_energies"] = sorted(set(float(round(x, 12)) for x in ph[ff]))
        out["flux_free_class_E0_Eodd"] = None
    else:
        # flux-free classes from the null space of P, then single and double vortex checks
        Pfr = P[:, free]
        def lift(xf):
            v = np.zeros(len(bonds), dtype=np.uint8); v[free] = xf; return v
        x0, null = gf2_solve(Pfr, np.zeros(len(hexes), dtype=np.int64))
        x0 = lift(x0); null = [lift(nv) for nv in null]
        classes = []
        for bits in itertools.product([0, 1], repeat=len(null)):
            v = x0.copy()
            for b, nv in zip(bits, null):
                if b: v ^= nv
            classes.append(v)
        Ucls = np.array([1 - 2 * v.astype(float) for v in classes])
        ph, e0, eo = energies(N, bonds, K, Ucls, torus)
        out["mode"] = f"flux-free classes ({len(classes)}) + vortex checks"
        out["flux_free_class_energies"] = [float(x) for x in ph]
        out["flux_free_class_E0_Eodd"] = [[float(a), float(b)] for a, b in zip(e0, eo)]
        kbest = int(np.argmin(ph)); base = Ucls[kbest]
        # single vortices and all-plaquette pairs (or a sample of pairs)
        rng = np.random.default_rng(1)
        pats = [[h] for h in range(len(hexes))]
        pairs = list(itertools.combinations(range(len(hexes)), 2))
        if len(pairs) > 3000:
            pairs = [pairs[q] for q in rng.choice(len(pairs), 3000, replace=False)]
        pats += [list(p) for p in pairs]
        pats += [list(rng.choice(len(hexes), rng.integers(3, max(4, len(hexes) // 2)), replace=False)) for _ in range(500)]
        pats.append(list(range(len(hexes))))
        Us = []
        for pt in pats:
            f = np.zeros(len(hexes), dtype=np.int64); f[pt] = 1
            x, _ = gf2_solve(Pfr, f)
            x = lift(x)
            Us.append(base * (1 - 2 * x.astype(float)))
        Us = np.array(Us)
        best_v = np.inf
        for c0 in range(0, len(Us), 2048):
            pv, _, _ = energies(N, bonds, K, Us[c0:c0 + 2048], torus)
            best_v = min(best_v, float(pv.min()))
        out["E_min"] = float(ph[kbest])
        out["vortex_configs_checked"] = len(Us)
        out["lowest_vortex_config_E"] = best_v
        out["vortex_gap_min"] = best_v - float(ph[kbest])
    out["seconds"] = round(time.time() - t0, 2)
    return out


if __name__ == "__main__":
    results = []
    jobs = []
    for L in (5, 7, 11):
        for var in ("V1", "V2"):
            jobs.append((f"open-{L}x{L}-{var}", honeycomb("open", var, L, L), -1, False, 17))
    for var in ("V1", "V2"):
        for od in (0, 1):
            jobs.append((f"cyl-6x6-{var}-open{'mn'[od]}", honeycomb("cyl", var, 6, 6, open_dir=od), 1, False, 17))
    tori = {
        "torus-3x4-V1": ("V1", (3, 0), (0, 4)), "torus-3x4-V2": ("V2", (3, 0), (0, 4)),
        "torus-4x3-V2": ("V2", (4, 0), (0, 3)),
        "torus-4x4-V1": ("V1", (4, 0), (0, 4)), "torus-4x4-V2": ("V2", (4, 0), (0, 4)),
        "torus-hex24-V1": ("V1", (2, 2), (-2, 4)), "torus-hex24-V2": ("V2", (4, 2), (2, 4)),
        # small tori for the ED cross-check of the projection rule
        "torus-2x2-V1": ("V1", (2, 0), (0, 2)), "torus-2x3-V1": ("V1", (2, 0), (0, 3)),
        "torus-3x3-V1": ("V1", (3, 0), (0, 3)), "torus-2x4-V1": ("V1", (2, 0), (0, 4)),
        "torus-3x3-V2": ("V2", (3, 0), (0, 3)), "torus-2x3-V2": ("V2", (2, 0), (0, 3)),
        "torus-2x4-V2": ("V2", (2, 0), (0, 4)), "torus-3x2-V2": ("V2", (3, 0), (0, 2)),
        "torus-hex18-V1": ("V1", (3, 0), (0, 3)),
    }
    for nm, (var, T1, T2) in tori.items():
        jobs.append((nm, honeycomb("torus", var, T1=T1, T2=T2), -1, True, 17))
    only = sys.argv[1:] or None
    for nm, (N, bonds), K, tor, lim in jobs:
        if only and not any(o in nm for o in only): continue
        try:
            r = run(nm, N, bonds, K, tor, lim)
        except AssertionError as e:
            r = {"name": nm, "error": "assert " + str(e)}
        print(json.dumps(r), flush=True)
        results.append(r)
