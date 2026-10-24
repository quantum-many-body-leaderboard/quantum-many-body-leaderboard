"""Cluster geometry for the famE exact recompute (independent of the mining tools).

Honeycomb: Bravais vectors a1 = (1, 0), a2 = (1/2, sqrt3/2) in cell coordinates (m, n).
A(m, n) sits at the cell origin, B(m, n) at (a1 + a2)/3.  A(m, n) has its three
neighbours B(m, n) [bond x], B(m-1, n) [bond y], B(m, n-1) [bond z]  ("V1").
Variant "V2" uses the 120-degree basis (a1, a2 - a1): offsets (0,0), (-1,0), (-1,-1).

Square / Shastry-Sutherland: sites (x, y); J on nearest-neighbour bonds; dimers on the
diagonal (x, y)-(x+1, y+1) of plaquettes with x, y even and on (x+1, y)-(x, y+1) of
plaquettes with x, y odd (the orthogonal-dimer pattern, Bravais cell 2 x 2).
"""
from itertools import product

HONEY_OFFSETS = {
    "V1": [((0, 0), "x"), ((-1, 0), "y"), ((0, -1), "z")],
    "V2": [((0, 0), "x"), ((-1, 0), "y"), ((-1, -1), "z")],
}


class Torus:
    """Z^2 modulo the lattice spanned by integer vectors T1, T2."""

    def __init__(self, T1, T2):
        self.T1, self.T2 = T1, T2
        self.D = T1[0] * T2[1] - T1[1] * T2[0]
        assert self.D != 0

    def key(self, v):
        # coefficients times D: adj(T) v, reduced mod D
        a = (T2y := self.T2[1]) * v[0] - self.T2[0] * v[1]
        b = -self.T1[1] * v[0] + self.T1[0] * v[1]
        return (a % abs(self.D), b % abs(self.D))

    def cells(self):
        seen = {}
        R = abs(self.T1[0]) + abs(self.T1[1]) + abs(self.T2[0]) + abs(self.T2[1]) + 2
        for m in range(-R, R + 1):
            for n in range(-R, R + 1):
                k = self.key((m, n))
                if k not in seen:
                    seen[k] = (m, n)
        assert len(seen) == abs(self.D), (len(seen), self.D)
        return seen


def honeycomb(kind, variant="V1", L1=None, L2=None, T1=None, T2=None, open_dir=None):
    """Return (n_sites, bonds) with bonds = [(i, j, gamma)] and i in A, j in B.

    kind 'open'  : L1 x L2 cells, open in both directions.
    kind 'torus' : periodic with torus vectors T1, T2 (cell coordinates).
    kind 'cyl'   : L1 x L2 cells, open along direction open_dir (0 = m, 1 = n), periodic along the other.
    Site index: A of cell c -> 2c, B of cell c -> 2c + 1.
    """
    offs = HONEY_OFFSETS[variant]
    bonds = []
    if kind == "torus":
        tor = Torus(T1, T2)
        cells = tor.cells()
        keys = sorted(cells)
        idx = {k: i for i, k in enumerate(keys)}
        for k in keys:
            m, n = cells[k]
            for (dm, dn), g in offs:
                j = idx[tor.key((m + dm, n + dn))]
                bonds.append((2 * idx[k], 2 * j + 1, g))
        return 2 * len(keys), bonds
    cells = [(m, n) for m in range(L1) for n in range(L2)]
    idx = {c: i for i, c in enumerate(cells)}
    for (m, n) in cells:
        for (dm, dn), g in offs:
            mm, nn = m + dm, n + dn
            if kind == "cyl":
                if open_dir == 0:
                    nn %= L2
                else:
                    mm %= L1
            if (mm, nn) in idx:
                bonds.append((2 * idx[(m, n)], 2 * idx[(mm, nn)] + 1, g))
    return 2 * len(cells), bonds


def shastry_sutherland(T1, T2, J, Jd):
    """Periodic SS cluster on Z^2 / <T1, T2>. Returns (N, bonds [(i, j, coupling)], dimers [(i, j)])."""
    tor = Torus(T1, T2)
    cells = tor.cells()
    keys = sorted(cells)
    idx = {k: i for i, k in enumerate(keys)}
    bset = {}
    dimers = []
    for k in keys:
        x, y = cells[k]
        i = idx[k]
        for dx, dy in ((1, 0), (0, 1)):
            j = idx[tor.key((x + dx, y + dy))]
            e = (min(i, j), max(i, j))
            assert e not in bset and i != j, "double bond"
            bset[e] = J
        # dimer: plaquette with lower-left corner (x, y)
        if x % 2 == 0 and y % 2 == 0:
            a, b = (x, y), (x + 1, y + 1)
        elif x % 2 != 0 and y % 2 != 0:
            a, b = (x + 1, y), (x, y + 1)
        else:
            continue
        ia, ib = idx[tor.key(a)], idx[tor.key(b)]
        e = (min(ia, ib), max(ia, ib))
        assert e not in bset, "dimer on a J bond"
        bset[e] = Jd
        dimers.append(e)
    N = len(keys)
    assert len(dimers) * 2 == N and len({s for d in dimers for s in d}) == N
    bonds = [(i, j, c) for (i, j), c in sorted(bset.items())]
    return N, bonds, dimers


# Pauli-form bond files for ed.c: "i j Jx Jy Jz"
def write_heis(path, N, bonds, dimers=None):
    with open(path, "w") as f:
        f.write(f"{N} {len(bonds)}\n")
        for i, j, c in bonds:
            f.write(f"{i} {j} {c!r} {c!r} {c!r}\n")
    if dimers is not None:
        with open(path + ".dimers", "w") as f:
            f.write(f"{len(dimers)}\n")
            for i, j in dimers:
                f.write(f"{i} {j}\n")


def write_kitaev(path, N, bonds, K):
    with open(path, "w") as f:
        f.write(f"{N} {len(bonds)}\n")
        for i, j, g in bonds:
            c = {"x": (K, 0.0, 0.0), "y": (0.0, K, 0.0), "z": (0.0, 0.0, K)}[g]
            f.write(f"{i} {j} {c[0]!r} {c[1]!r} {c[2]!r}\n")
