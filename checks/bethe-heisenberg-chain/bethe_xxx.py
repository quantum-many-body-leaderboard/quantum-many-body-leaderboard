"""Ground-state energy of the spin-1/2 Heisenberg chain H = sum_i S_i . S_{i+1} from the
Bethe ansatz, to any number of digits.

Periodic chain (N even, M = N/2 real roots, I_j = -(M-1)/2 ... (M-1)/2):
    N theta1(l_j) = 2 pi I_j + sum_k theta2(l_j - l_k)
Open chain (N - 1 bonds, M = N/2 positive roots, I_j = 1 ... M; Alcaraz et al.,
J. Phys. A 20, 6397 (1987)):
    2N theta1(l_j) = 2 pi I_j + sum_{k != j} [theta2(l_j - l_k) + theta2(l_j + l_k)]
with theta_n(x) = 2 atan(2x/n). The energy is E = N_bonds/4 - sum_j 1/(2 (l_j^2 + 1/4)).

The roots are found by Newton's method in double precision and then refined in mpmath at
the requested precision. Usage: python3 bethe_xxx.py N {P,O} [digits]
"""
import math
import sys

import mpmath as mp
import numpy as np


def residual(lam, n, bc, I, lib):
    atan = lib.atan
    out = []
    for j, lj in enumerate(lam):
        if bc == "P":
            s = sum(2 * atan(lj - lk) for lk in lam)
            out.append(n * 2 * atan(2 * lj) - 2 * lib.pi * I[j] - s)
        else:
            s = sum(2 * atan(lj - lk) + 2 * atan(lj + lk) for k, lk in enumerate(lam) if k != j)
            out.append(2 * n * 2 * atan(2 * lj) - 2 * lib.pi * I[j] - s)
    return out


def jacobian(lam, n, bc):
    m = len(lam)
    d1 = lambda x: 4 / (1 + 4 * x * x)  # theta1'
    d2 = lambda x: 2 / (1 + x * x)      # theta2'
    J = [[0] * m for _ in range(m)]
    for j in range(m):
        for k in range(m):
            if k == j:
                continue
            J[j][k] = d2(lam[j] - lam[k]) - (d2(lam[j] + lam[k]) if bc == "O" else 0)
        if bc == "P":
            J[j][j] = n * d1(lam[j]) - sum(d2(lam[j] - lam[k]) for k in range(m) if k != j)
        else:
            J[j][j] = 2 * n * d1(lam[j]) - sum(d2(lam[j] - lam[k]) + d2(lam[j] + lam[k])
                                               for k in range(m) if k != j)
    return J


def solve(n, bc, digits):
    m = n // 2
    if bc == "P":
        I = [i - (m - 1) / 2 for i in range(m)]
        lam = np.array([0.5 * np.tan(np.pi * x / n) for x in I])
    else:
        I = list(range(1, m + 1))
        lam = np.array([0.5 * np.tan(np.pi * x / (2 * n + 2)) for x in I])
    # double precision Newton, damped until the residual is small
    for _ in range(200):
        F = np.array(residual(lam, n, bc, I, math))
        if np.max(np.abs(F)) < 1e-13:
            break
        step = np.linalg.solve(np.array(jacobian(lam, n, bc)), F)
        t = 1.0
        while t > 1e-4:
            trial = lam - t * step
            if np.max(np.abs(residual(trial, n, bc, I, math))) < np.max(np.abs(F)):
                break
            t /= 2
        lam = trial
    # mpmath refinement
    mp.mp.dps = digits + 20
    lam = [mp.mpf(float(x)) for x in lam]
    I = [mp.mpf(2 * x) / 2 for x in I] if bc == "P" else [mp.mpf(x) for x in I]
    for it in range(50):
        F = mp.matrix(residual(lam, n, bc, I, mp))
        err = max(abs(x) for x in F)
        if err < mp.mpf(10) ** (-(digits + 10)):
            break
        step = mp.lu_solve(mp.matrix(jacobian(lam, n, bc)), F)
        lam = [lam[j] - step[j] for j in range(len(lam))]
    bonds = n if bc == "P" else n - 1
    energy = mp.mpf(bonds) / 4 - sum(1 / (2 * (x * x + mp.mpf(1) / 4)) for x in lam)
    return energy, err, it


if __name__ == "__main__":
    n, bc = int(sys.argv[1]), sys.argv[2]
    digits = int(sys.argv[3]) if len(sys.argv) > 3 else 50
    energy, err, it = solve(n, bc, digits)
    print(f"N={n} {bc} E(S.S)={mp.nstr(energy, digits)} E(Pauli)={mp.nstr(4 * energy, digits)} "
          f"residual={mp.nstr(err, 3)} newton_mp={it}")
