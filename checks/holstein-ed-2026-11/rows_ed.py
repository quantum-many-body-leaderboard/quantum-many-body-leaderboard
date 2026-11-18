"""QMBL's variational rows on the four smallest Holstein instances (2026-11-18): exact diagonalization
with a cutoff M on the total phonon number. The kept states span a subspace of the instance's Hilbert
space and H contains only b+b and b + b+, so the matrix is the projection P H P: its lowest eigenvalue
is an upper bound on the ground-state energy and does not increase with M (RULES.md 2.1, variational).
At half filling the phonons are counted in the basis displaced by g rho / w per site (rho = 1/2), the
source convention of the GFMC and MLP rows, where the cutoff converges faster; the displacement maps
the kept states onto states of the instance, so the bound holds, and E = E_rho - 2 g^2 rho N_e / w +
g^2 rho^2 N / w (RULES.md 2.1; results-1.jsonl checks the rule). Prints one line per M
with the true residual |H v - E v|, so the convergence in M is visible.

usage: python rows_ed.py > results-2.jsonl"""
import json, sys, os
import numpy as np
from scipy.sparse.linalg import eigsh
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from holstein_ed import hamiltonian, chain_bonds

# instance, N, boundary, N_up, N_dn, w, g, rho of the phonon basis, cutoffs
CASES = [
    ("Holstein/chain_4_A_f2_w1_g1.5", 4, "A", 2, 0, 1.0, 1.5, 0.5, (8, 16, 24, 32)),
    ("Holstein/chain_6_P_f3_w1_g1.5", 6, "P", 3, 0, 1.0, 1.5, 0.5, (8, 10, 12, 14, 16)),
    ("Holstein/chain_4_P_f1_w0.5_g1", 4, "P", 1, 0, 0.5, 1.0, 0.0, (16, 24, 32, 40)),
    ("Holstein/chain_4_P_e4_w4_g2", 4, "P", 2, 2, 4.0, 2.0, 0.0, (8, 12, 16, 20)),
]
for inst, N, b, nup, ndn, w, g, rho, Ms in CASES:
    shift = -2 * g * g * rho * (nup + ndn) / w + g * g * rho * rho * N / w
    for M in Ms:
        H, dim = hamiltonian(N, nup, ndn, chain_bonds(N, b), w, g, 0.0, M, rho=rho)
        vals, vecs = eigsh(H, k=1, which="SA", tol=1e-12)
        E, v = float(vals[0]), vecs[:, 0]
        res = float(np.linalg.norm(H @ v - E * v))
        print(json.dumps({"instance": inst, "rho": rho, "M": M, "dim": dim, "E_rho": repr(E), "shift": shift,
                          "E": repr(E + shift), "residual": f"{res:.1e}"}), flush=True)
