"""Every sector's lowest eigenvalue must be an eigenvalue of the full brute-force spectrum."""
import json, re, sys
spec = {}
for l in open(sys.argv[2]):
    if l.startswith("SPEC"):
        f = l.split(); spec[f[1][:-5]] = [float(x) for x in f[2:]]
bad = n = 0
for l in open(sys.argv[1]):
    r = json.loads(l)
    for base, ev in spec.items():
        if r["label"].startswith(base + "_") and not r["label"].endswith("_full") and r["dim"] > 0:
            n += 1
            d = min(abs(r["E"] - x) for x in ev)
            if d > 1e-8: bad += 1; print("MISMATCH", r["label"], r["E"], d)
print(f"sector eigenvalues checked {n}, mismatches {bad}")
