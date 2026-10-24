"""Brute-force full-space t-J ED for small test clusters (reads the bonds of a tjk .in file, ignores
its group). Different construction from tjk.c: states as sorted tuples of occupied modes
(mode = (spin, site) ordered spin-major), Hamiltonian built term by term from c+/c strings.
Usage: python bf.py file.in [file.in ...]  -> prints label, dim, E0
"""
import itertools
import sys

import numpy as np
import scipy.sparse as sp
import scipy.sparse.linalg as sla


def read(path):
    tok = open(path).read().split()
    p = 0
    def nxt():
        nonlocal p
        p += 1
        return tok[p - 1]
    N, nup, ndn = int(nxt()), int(nxt()), int(nxt())
    hops = [(int(nxt()), int(nxt()), float(nxt())) for _ in range(int(nxt()))]
    exch = [(int(nxt()), int(nxt()), float(nxt())) for _ in range(int(nxt()))]
    return N, nup, ndn, hops, exch


def apply(ops, state):
    """ops: list of (mode, dagger) applied right to left; state: sorted tuple of modes."""
    s = list(state)
    sign = 1
    for mode, dag in reversed(ops):
        if dag:
            if mode in s:
                return None, 0
            k = sum(1 for m in s if m < mode)
            sign *= (-1) ** k
            s.insert(k, mode)
        else:
            if mode not in s:
                return None, 0
            k = s.index(mode)
            sign *= (-1) ** k
            s.pop(k)
    return tuple(s), sign


def main():
    for path in sys.argv[1:]:
        N, nup, ndn, hops, exch = read(path)
        up = lambda i: (0, i)
        dn = lambda i: (1, i)
        states = []
        for U in itertools.combinations(range(N), nup):
            rest = [i for i in range(N) if i not in U]
            for D in itertools.combinations(rest, ndn):
                states.append(tuple(sorted([up(i) for i in U] + [dn(i) for i in D])))
        index = {s: k for k, s in enumerate(states)}
        terms = []  # (coef, ops)
        for i, j, t in hops:
            for s in (0, 1):
                terms.append((-t, [((s, i), 1), ((s, j), 0)]))
                terms.append((-t, [((s, j), 1), ((s, i), 0)]))
        for i, j, J in exch:
            # S.S - n n /4 = Sz Sz - n n/4 + (S+_i S-_j + S-_i S+_j)/2
            for si in (0, 1):
                for sj in (0, 1):
                    szz = 0.25 * (1 if si == sj else -1) - 0.25
                    if szz:
                        terms.append((J * szz, [((si, i), 1), ((si, i), 0), ((sj, j), 1), ((sj, j), 0)]))
            terms.append((J / 2, [(up(i), 1), (dn(i), 0), (dn(j), 1), (up(j), 0)]))
            terms.append((J / 2, [(dn(i), 1), (up(i), 0), (up(j), 1), (dn(j), 0)]))
        rows, cols, vals = [], [], []
        for k, st in enumerate(states):
            for coef, ops in terms:
                new, sg = apply(ops, st)
                if new is None:
                    continue
                sites = [m[1] for m in new]
                if len(set(sites)) != len(sites):  # projection: no double occupancy
                    continue
                rows.append(index[new]); cols.append(k); vals.append(coef * sg)
        H = sp.csr_matrix((vals, (rows, cols)), shape=(len(states), len(states)))
        assert abs(H - H.T).max() < 1e-12
        if len(states) < 1500:
            ev = np.linalg.eigvalsh(H.toarray()); e0 = ev[0]
            print("SPEC", path.split('/')[-1][:-3], " ".join(f"{x:.10f}" for x in ev))
        else:
            e0 = sla.eigsh(H, k=1, which="SA", tol=1e-13)[0][0]
        print(f"{path.split('/')[-1][:-3]} dim {len(states)} E0 {e0:.12f}")


if __name__ == "__main__":
    main()
