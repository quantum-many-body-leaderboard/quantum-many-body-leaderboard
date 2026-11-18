"""Exact diagonalization of the Holstein and Hubbard-Holstein models on small chains with a phonon
cutoff (QMBL convention check, 2026-11-16). With a cutoff the energy is an upper bound, so this
fixes conventions only; it makes no row (RULES.md 2.1).

Instance convention (RULES.md 2.1):
  H = -t sum_<ij>,s (c+_is c_js + h.c.) + w sum_i b+_i b_i + g sum_i n_i (b+_i + b_i) [+ U sum_i n_iu n_id]
A source convention adds rho (coupling to n_i - rho) and/or the zero-point energy w/2 per site.
The script diagonalizes both and checks E_inst = E_src - 2 g^2 rho N_e / w + g^2 rho^2 N / w - zp w N / 2.

Bonds carry a hopping sign (-1 across an antiperiodic boundary). Fermion ordering: all up
operators (site order) before all down operators; spinless runs use the up register only.
Phonons: total phonon number <= M (a cutoff on the sum, not per site)."""
import sys, json, itertools
import numpy as np
from scipy.sparse import coo_matrix
from scipy.sparse.linalg import eigsh


def fermion_basis(N, nup, ndn):
    ups = [sum(1 << i for i in c) for c in itertools.combinations(range(N), nup)]
    dns = [sum(1 << i for i in c) for c in itertools.combinations(range(N), ndn)]
    return [(u, d) for u in ups for d in dns]


def phonon_basis(N, M):
    out = []
    def rec(prefix, left):
        if len(prefix) == N:
            out.append(tuple(prefix)); return
        for k in range(left + 1):
            rec(prefix + [k], left - k)
    rec([], M)
    return out


def between(x, i, j):
    lo, hi = min(i, j), max(i, j)
    return bin(x & (((1 << hi) - 1) ^ ((1 << (lo + 1)) - 1))).count("1")


def hops(x, i, j):
    """c+_i c_j on occupation bitstring x: (new x, sign) or None."""
    if not (x >> j) & 1 or ((x >> i) & 1 and i != j):
        return None
    y = x ^ (1 << j) ^ (1 << i)
    return y, (-1) ** between(x, i, j)


def hamiltonian(N, nup, ndn, bonds, w, g, U, M, rho=0.0, zp=False, t=1.0):
    F = fermion_basis(N, nup, ndn)
    P = phonon_basis(N, M)
    fi = {s: k for k, s in enumerate(F)}
    pi = {s: k for k, s in enumerate(P)}
    nP = len(P)
    idx = lambda f, p: f * nP + p
    rows, cols, vals = [], [], []
    def add(a, b, v):
        rows.append(a); cols.append(b); vals.append(v)
    for f, (u, d) in enumerate(F):
        n = [((u >> i) & 1) + ((d >> i) & 1) for i in range(N)]
        diag_f = U * sum(((u >> i) & 1) * ((d >> i) & 1) for i in range(N))
        # hopping, both spins, both directions
        for (i, j, s) in bonds:
            for spin in (0, 1):
                x = (u, d)[spin]
                for a, b in ((i, j), (j, i)):
                    r = hops(x, a, b)
                    if r is None:
                        continue
                    y, sg = r
                    f2 = fi[(y, d) if spin == 0 else (u, y)]
                    for p in range(nP):
                        add(idx(f2, p), idx(f, p), -t * s * sg)
        for p, occ in enumerate(P):
            e = diag_f + w * sum(occ) + (0.5 * w * N if zp else 0.0)
            add(idx(f, p), idx(f, p), e)
            # g (n_i - rho)(b+_i + b_i): emit b+_i (the b_i term is its Hermitian conjugate)
            if sum(occ) < M:
                for i in range(N):
                    c = g * (n[i] - rho)
                    if c == 0:
                        continue
                    occ2 = list(occ); occ2[i] += 1
                    p2 = pi[tuple(occ2)]
                    amp = c * np.sqrt(occ2[i])
                    add(idx(f, p2), idx(f, p), amp)
                    add(idx(f, p), idx(f, p2), amp)
    dim = len(F) * nP
    H = coo_matrix((vals, (rows, cols)), shape=(dim, dim)).tocsr()
    return H, dim


def chain_bonds(N, boundary):
    b = [(i, i + 1, 1.0) for i in range(N - 1)]
    if boundary == "P":
        b.append((N - 1, 0, 1.0))
    elif boundary == "A":
        b.append((N - 1, 0, -1.0))
    return b


def run(case):
    N, b = case["N"], case["boundary"]
    nup, ndn = case["N_up"], case["N_dn"]
    w, g, U = case["w"], case["g"], case.get("U", 0.0)
    out = dict(case)
    for conv, rho, zp in (("instance", 0.0, False), ("source", case.get("rho", 0.0), case.get("zp", False))):
        Es = []
        for M in case["M"]:
            H, dim = hamiltonian(N, nup, ndn, chain_bonds(N, b), w, g, U, M, rho, zp)
            E = float(eigsh(H, k=1, which="SA", tol=1e-12)[0][0])
            Es.append({"M": M, "dim": dim, "E": round(E, 10), "E_per_site": round(E / N, 10)})
        out[conv] = Es
    Ne = nup + ndn
    rho = case.get("rho", 0.0)
    shift = -2 * g * g * rho * Ne / w + g * g * rho * rho * N / w - (0.5 * w * N if case.get("zp") else 0.0)
    out["shift_rule"] = round(shift, 10)
    out["shift_found"] = round(out["instance"][-1]["E"] - out["source"][-1]["E"], 10)
    return out


if __name__ == "__main__":
    cases = json.load(open(sys.argv[1]))
    with open(sys.argv[2], "w") as fh:
        for c in cases:
            r = run(c)
            print(json.dumps(r), flush=True)
            fh.write(json.dumps(r) + "\n")
