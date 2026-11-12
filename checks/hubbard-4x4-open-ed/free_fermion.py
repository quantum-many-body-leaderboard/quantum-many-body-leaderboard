# U = 0 reference: 2 x (sum of the n lowest one-particle levels of -t on the open L x L grid)
import json, sys, numpy as np
L, n = int(sys.argv[1]), int(sys.argv[2])
H = np.zeros((L * L, L * L))
for x in range(L):
    for y in range(L):
        i = x * L + y
        if x + 1 < L: H[i, i + L] = H[i + L, i] = -1
        if y + 1 < L: H[i, i + 1] = H[i + 1, i] = -1
e = np.linalg.eigvalsh(H)
print(json.dumps(dict(L=L, n=n, E_free=float(2 * e[:n].sum()), levels=e.round(10).tolist())))
