# find small tori (N <= 24) where the projection changes the ground state (for the ED check)
import itertools, json
from geom import honeycomb
from kitaev_majorana import run
seen = set()
for a, b, c, d in itertools.product(range(-4, 5), repeat=4):
    D = a * d - b * c
    if D <= 1 or D > 12: continue
    if (a, b) < (0, 0): continue
    try:
        N, bonds = honeycomb("torus", "V1", T1=(a, b), T2=(c, d))
        r = run(f"T1=({a},{b}) T2=({c},{d})", N, bonds, -1, True, 13)
    except AssertionError:
        continue
    if "E_unconstrained_min" not in r: continue
    key = (N, round(r["E_min"], 8), round(r["E_unconstrained_min"], 8))
    if key in seen: continue
    seen.add(key)
    print(r["name"], N, round(r["E_min"], 10), round(r["E_unconstrained_min"], 10), "PROJECTION MATTERS" if abs(r["E_min"] - r["E_unconstrained_min"]) > 1e-9 else "", flush=True)
