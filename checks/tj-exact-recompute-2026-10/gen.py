"""Cluster and symmetry-sector inputs for tjk.c (qmbl-verify 2026-10-23, group tjE).

H = -sum t_ij P(c+c + h.c.)P + sum J_ij (S.S - n n/4); every bond listed once.
Usage: python gen.py <outdir> <set>   (sets at the bottom)
"""
import cmath
import itertools
import math
import os
import sys
from fractions import Fraction


# ---------------- clusters: (sites, hops [(i,j,t)], exch [(i,j,J)], group generator data) -------------
def tilted_square(a, b, J, tp=0.0, tpp=0.0):
    """Periodic square cluster with edge vectors (a,b), (-b,a); N = a^2 + b^2."""
    N = a * a + b * b

    def red(x, y):
        m = (a * x + b * y) // N
        n = (-b * x + a * y) // N
        return (x - m * a + n * b, y - m * b - n * a)

    pts = sorted({red(x, y) for x in range(-2 * N, 2 * N) for y in range(-2 * N, 2 * N)})
    assert len(pts) == N, (len(pts), N)
    idx = {p: i for i, p in enumerate(pts)}
    hops, exch = [], []
    for (x, y) in pts:
        i = idx[(x, y)]
        for (dx, dy) in [(1, 0), (0, 1)]:
            j = idx[red(x + dx, y + dy)]
            assert i != j
            hops.append((i, j, 1.0)); exch.append((i, j, J))
        if tp:
            for (dx, dy) in [(1, 1), (1, -1)]:
                hops.append((i, idx[red(x + dx, y + dy)], tp))
        if tpp:
            for (dx, dy) in [(2, 0), (0, 2)]:
                hops.append((i, idx[red(x + dx, y + dy)], tpp))

    def g_perm(R, m):  # r -> C4^m r + R
        out = []
        for (x, y) in pts:
            for _ in range(m):
                x, y = -y, x
            out.append(idx[red(x + R[0], y + R[1])])
        return out

    # momenta k = 2 pi (p, q) / N
    ks = [(p, q) for p in range(N) for q in range(N) if (p * a + q * b) % N == 0 and (-p * b + q * a) % N == 0]
    assert len(ks) == N
    return dict(N=N, pts=pts, hops=hops, exch=exch, g_perm=g_perm, ks=ks, kind="square", red=red)


PG8 = [((1, 0), (0, 1)), ((0, -1), (1, 0)), ((-1, 0), (0, -1)), ((0, 1), (-1, 0)),
       ((0, 1), (1, 0)), ((1, 0), (0, -1)), ((0, -1), (-1, 0)), ((-1, 0), (0, 1))]  # C4v as 2x2 matrices (rows)


def mat(P, v):
    return (P[0][0] * v[0] + P[0][1] * v[1], P[1][0] * v[0] + P[1][1] * v[1])


def pg_sectors(cl, a, b, k):
    """Little point group of k inside C4v (only elements that map the cluster lattice to itself) and its
    1D characters, found by enumerating maps into {1, -1, i, -i} that are homomorphisms."""
    N = cl["N"]
    inlat = lambda v: (a * v[0] + b * v[1]) % N == 0 and (-b * v[0] + a * v[1]) % N == 0
    pg = [P for P in PG8 if inlat(mat(P, (a, b))) and inlat(mat(P, (-b, a)))]
    kq = lambda v: (v[0] % N, v[1] % N)
    little = [P for P in pg if kq(mat(P, k)) == kq(k)]
    mul = lambda P, Q: tuple(tuple(sum(P[i][l] * Q[l][j] for l in range(2)) for j in range(2)) for i in range(2))
    pos = {P: i for i, P in enumerate(little)}
    vals = [1, -1, 1j, -1j]
    chis = []
    for combo in itertools.product(range(4), repeat=len(little) - 1):
        c = [1] + [vals[x] for x in combo]
        if all(abs(c[pos[mul(P, Q)]] - c[pos[P]] * c[pos[Q]]) < 1e-12 for P in little for Q in little):
            chis.append(c)
    return little, chis


def sector_square_pg(cl, k, little, c):
    N = cl["N"]; pts = cl["pts"]; idx = {p: i for i, p in enumerate(pts)}
    red = cl["red"]
    els = []
    for R in pts:
        for P, cp in zip(little, c):
            pm = [idx[red(*(lambda v: (v[0] + R[0], v[1] + R[1]))(mat(P, r)))] for r in pts]
            els.append((pm, cmath.exp(-2j * math.pi * (k[0] * R[0] + k[1] * R[1]) / N) * cp))
    return els


def pg_stars(cl, a, b):
    N = cl["N"]
    inlat = lambda v: (a * v[0] + b * v[1]) % N == 0 and (-b * v[0] + a * v[1]) % N == 0
    pg = [P for P in PG8 if inlat(mat(P, (a, b))) and inlat(mat(P, (-b, a)))]
    seen, out = set(), []
    for k in cl["ks"]:
        if k in seen:
            continue
        star = {(mat(P, k)[0] % N, mat(P, k)[1] % N) for P in pg}
        seen |= star
        out.append((k, len(star)))
    return out


def sector_square(cl, k, l, use_rot=True):
    """Translations with momentum k = 2 pi k/N, times the rotations C4^m that leave k invariant (irrep l)."""
    N = cl["N"]
    p, q = k
    rot = lambda kk: ((-kk[1]) % N, kk[0] % N)
    little = [0]
    kk = (p, q)
    for m in range(1, 4):
        kk = rot(kk)
        if kk == (p % N, q % N):
            little.append(m)
    if not use_rot:
        little = [0]
    o = len(little)
    step = 4 // o
    els = []
    for R in cl["pts"]:
        for m in little:
            ph = -2 * math.pi * (p * R[0] + q * R[1]) / N - 2 * math.pi * l * (m // step) / o
            els.append((cl["g_perm"](R, m), cmath.exp(1j * ph)))
    return els, o


def ladder(L, W, J, px=True, antix=False):
    """W legs of L sites; legs along x (periodic if px, antiperiodic hop across if antix), open across."""
    idx = lambda x, y: x * W + y
    hops, exch = [], []
    for x in range(L):
        for y in range(W):
            if x + 1 < L:
                hops.append((idx(x, y), idx(x + 1, y), 1.0)); exch.append((idx(x, y), idx(x + 1, y), J))
            elif px:
                t = -1.0 if antix else 1.0
                hops.append((idx(x, y), idx(0, y), t)); exch.append((idx(x, y), idx(0, y), J))
            if y + 1 < W:
                hops.append((idx(x, y), idx(x, y + 1), 1.0)); exch.append((idx(x, y), idx(x, y + 1), J))
    return dict(N=L * W, L=L, W=W, hops=hops, exch=exch, kind="ladder", idx=idx)


def sector_ladder(cl, n, par):
    """Translations along the legs (momentum 2 pi n/L) times the reflection y -> W-1-y (parity par)."""
    L, W, idx = cl["L"], cl["W"], cl["idx"]
    els = []
    for a in range(L):
        for s in (0, 1):
            pm = [0] * (L * W)
            for x in range(L):
                for y in range(W):
                    pm[idx(x, y)] = idx((x + a) % L, (W - 1 - y) if s else y)
            els.append((pm, cmath.exp(-2j * math.pi * n * a / L) * (par if s else 1)))
    return els


def coronene(J):
    """Seven-hexagon honeycomb flake (central hexagon and its six neighbours), bond length 1."""
    centers = [(0.0, 0.0)] + [(math.sqrt(3) * math.cos(math.pi / 6 + j * math.pi / 3),
                                math.sqrt(3) * math.sin(math.pi / 6 + j * math.pi / 3)) for j in range(6)]
    pts = []
    for (cx, cy) in centers:
        for j in range(6):
            p = (cx + math.cos(j * math.pi / 3), cy + math.sin(j * math.pi / 3))
            if all(math.dist(p, q) > 1e-6 for q in pts):
                pts.append(p)
    assert len(pts) == 24, len(pts)
    pts.sort(key=lambda p: (round(math.hypot(*p), 6), round(math.atan2(p[1], p[0]) % (2 * math.pi), 6)))
    hops, exch = [], []
    for i in range(24):
        for j in range(i + 1, 24):
            if abs(math.dist(pts[i], pts[j]) - 1) < 1e-6:
                hops.append((i, j, 1.0)); exch.append((i, j, J))
    assert len(hops) == 30, len(hops)

    def find(p):
        m = [i for i, q in enumerate(pts) if math.dist(p, q) < 1e-6]
        assert len(m) == 1
        return m[0]

    def rotp(m):
        c, s = math.cos(m * math.pi / 3), math.sin(m * math.pi / 3)
        return [find((c * x - s * y, s * x + c * y)) for (x, y) in pts]

    return dict(N=24, pts=pts, hops=hops, exch=exch, rotp=rotp, kind="coronene")


def sector_c6(cl, l):
    return [(cl["rotp"](m), cmath.exp(-2j * math.pi * l * m / 6)) for m in range(6)]


def trivial(N):
    return [(list(range(N)), 1.0 + 0j)]


# ---------------- checks ----------------
def check(cl, els):
    N = cl["N"]
    key = lambda bonds, pm: sorted((min(pm[i], pm[j]), max(pm[i], pm[j]), round(t, 12)) for (i, j, t) in bonds)
    h0 = key(cl["hops"], list(range(N))); e0 = key(cl["exch"], list(range(N)))
    perms = [tuple(pm) for pm, _ in els]
    pos = {pm: i for i, pm in enumerate(perms)}
    assert len(pos) == len(perms), "duplicate group elements"
    for pm, c in els:
        assert sorted(pm) == list(range(N))
        assert key(cl["hops"], pm) == h0, "hops not invariant"
        assert key(cl["exch"], pm) == e0, "exchange not invariant"
        assert abs(abs(c) - 1) < 1e-12
    for (p1, c1), (p2, c2) in itertools.product(els, els):
        comp = tuple(p1[p2[i]] for i in range(N))  # (g1 o g2)(i) = g1(g2(i))
        assert comp in pos, "not closed"
        assert abs(els[pos[comp]][1] - c1 * c2) < 1e-9, "character not a homomorphism"


def write(path, cl, nup, ndn, els):
    with open(path, "w") as f:
        f.write(f"{cl['N']} {nup} {ndn}\n{len(cl['hops'])}\n")
        for i, j, t in cl["hops"]:
            f.write(f"{i} {j} {t:.17g}\n")
        f.write(f"{len(cl['exch'])}\n")
        for i, j, J in cl["exch"]:
            f.write(f"{i} {j} {J:.17g}\n")
        f.write(f"{len(els)}\n")
        for pm, c in els:
            f.write(" ".join(map(str, pm)) + f" {c.real:.17g} {c.imag:.17g}\n")


def square_stars(cl, use_rot=True):
    """One momentum per C4 star (C4 commutes with H on every square cluster here) and its rotation irreps."""
    N = cl["N"]
    seen, out = set(), []
    for k in cl["ks"]:
        if k in seen:
            continue
        star = set()
        kk = k
        for _ in range(4):
            star.add(kk); kk = ((-kk[1]) % N, kk[0] % N)
        seen |= star
        out.append((k, len(star)))
    return out


def electrons(N, holes):
    ne = N - holes
    return (ne + 1) // 2, ne // 2


def emit(outdir, label, cl, holes, els, do_check=True):
    if do_check:
        check(cl, els)
    nup, ndn = electrons(cl["N"], holes)
    write(os.path.join(outdir, label + ".in"), cl, nup, ndn, els)
    print(label, len(els))


def main():
    outdir, which = sys.argv[1], sys.argv[2]
    os.makedirs(outdir, exist_ok=True)
    J3 = 1.0 / 3.0
    if which == "test":
        # small clusters for the brute-force cross-check
        for (a, b, J, tp, tpp, h) in [(3, 1, 0.4, 0.3, -0.2, 2), (2, 2, 0.5, 0.0, 0.0, 2), (3, 1, 0.3, 0.0, 0.0, 1), (4, 0, 0.4, 0.0, 0.0, 2), (3, 0, 0.5, 0.3, 0.0, 3)]:
            cl = tilted_square(a, b, J, tp, tpp)
            base = f"sq{a}{b}_h{h}"
            emit(outdir, base + "_full", cl, h, trivial(cl["N"]))
            for k, ns in square_stars(cl):
                _, o = sector_square(cl, k, 0)
                for l in range(o):
                    els, _ = sector_square(cl, k, l)
                    emit(outdir, f"{base}_k{k[0]}-{k[1]}_l{l}_star{ns}", cl, h, els)
        for (L, W, h, anti) in [(4, 2, 2, False), (5, 2, 1, False), (4, 3, 2, True), (3, 3, 1, True)]:
            cl = ladder(L, W, 0.5, True, anti)
            base = f"lad{W}x{L}{'A' if anti else 'P'}_h{h}"
            emit(outdir, base + "_full", cl, h, trivial(cl["N"]))
            if not anti:
                for n in range(L):
                    for par in (1, -1):
                        emit(outdir, f"{base}_n{n}_p{'+' if par > 0 else '-'}", cl, h, sector_ladder(cl, n, par))
        cl = coronene(J3)
        for l in range(6):
            emit(outdir, f"cor_h1_l{l}", cl, 1, sector_c6(cl, l))
        emit(outdir, "cor_h1_full", cl, 1, trivial(24))
    elif which == "small":  # rows that need no symmetry
        emit(outdir, "sq16O_h2_J0.4_full", ladder(4, 4, 0.4, px=False), 2, trivial(16))
        for h in (1, 2):
            emit(outdir, f"lad3x6A_h{h}_J0.5_full", ladder(6, 3, 0.5, True, True), h, trivial(18))
        cl = tilted_square(3, 3, 0.4)
        emit(outdir, "sq18P_h2_J0.4_full", cl, 2, trivial(18))
        for k, ns in square_stars(cl):
            _, o = sector_square(cl, k, 0)
            for l in range(o):
                els, _ = sector_square(cl, k, l)
                emit(outdir, f"sq18P_h2_J0.4_k{k[0]}-{k[1]}_l{l}_star{ns}", cl, 2, els)
        cl = coronene(J3)
        for l in range(4):
            emit(outdir, f"cor_h1_J1o3_l{l}", cl, 1, sector_c6(cl, l))
    elif which == "honey2":
        cl = coronene(J3)
        for l in range(4):
            emit(outdir, f"cor_h2_J1o3_l{l}", cl, 2, sector_c6(cl, l))
    elif which == "ladders":
        for L, h in [(11, 2), (13, 2)]:
            cl = ladder(L, 2, 0.5)
            for n in range(L // 2 + 1):
                for par in (1, -1):
                    emit(outdir, f"lad2x{L}P_h{h}_J0.5_n{n}_p{'+' if par > 0 else '-'}", cl, h, sector_ladder(cl, n, par))
    elif which.startswith("sq26"):  # sq26_h2 / sq26_h4
        h = int(which.split("_h")[1])
        for J in (0.3, 0.4, 0.5, 0.6, 0.8, 1.0):
            cl = tilted_square(5, 1, J)
            for k, ns in square_stars(cl):
                _, o = sector_square(cl, k, 0)
                for l in range(o):
                    els, _ = sector_square(cl, k, l)
                    emit(outdir, f"sq26P_h{h}_J{J:g}_k{k[0]}-{k[1]}_l{l}_star{ns}", cl, h, els, do_check=(J == 0.3))
    elif which.startswith("sq32"):  # C4v little groups, all stars and all 1D characters
        h = int(which.split("_h")[1])
        cl = tilted_square(4, 4, 0.3, 0.3, -0.2)
        for k, ns in pg_stars(cl, 4, 4):
            little, chis = pg_sectors(cl, 4, 4, k)
            for ci, c in enumerate(chis):
                els = sector_square_pg(cl, k, little, c)
                tag = "".join({1: "+", -1: "-", 1j: "i", -1j: "j"}[x] for x in c)
                emit(outdir, f"sq32P_h{h}_J0.3_tp0.3_tpp-0.2_k{k[0]}-{k[1]}_pg{len(little)}{tag}_star{ns}", cl, h, els)
    elif which == "testpg":  # C4v sectors on small clusters for the brute-force check
        for (a, b, J, tp, tpp, h) in [(2, 2, 0.4, 0.3, -0.2, 2), (4, 0, 0.3, 0.3, -0.2, 1), (3, 3, 0.4, 0.3, -0.2, 1)]:
            cl = tilted_square(a, b, J, tp, tpp)
            base = f"pg{a}{b}_h{h}"
            if cl["N"] <= 16:
                emit(outdir, base + "_full", cl, h, trivial(cl["N"]))
            for k, ns in pg_stars(cl, a, b):
                little, chis = pg_sectors(cl, a, b, k)
                for ci, c in enumerate(chis):
                    tag = "".join({1: "+", -1: "-", 1j: "i", -1j: "j"}[x] for x in c)
                    emit(outdir, f"{base}_k{k[0]}-{k[1]}_pg{len(little)}{tag}_star{ns}", cl, h, sector_square_pg(cl, k, little, c))

if __name__ == "__main__":
    main()
