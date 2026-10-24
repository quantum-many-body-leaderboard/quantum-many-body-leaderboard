# Generate bond files for ed.c (run on the host in the job directory)
import json, os
from geom import honeycomb, shastry_sutherland, write_heis, write_kitaev
os.makedirs("bonds", exist_ok=True)
manifest = []
J32 = ["0.677", "0.6772", "0.67724", "0.677244", "0.677246", "0.677248", "0.6773", "0.6775", "0.6778", "0.68", "0.7"]
J36 = ["0.5", "0.66697792", "0.67441", "0.675", "0.68", "0.7", "0.8", "0.85"]
for J in J32:
    N, b, d = shastry_sutherland((4, 4), (4, -4), float(J), 1.0)
    write_heis(f"bonds/ss32t_J{J}", N, b, d); manifest.append(("ss32t", J, N, len(b)))
for J in J36:
    N, b, d = shastry_sutherland((6, 0), (0, 6), float(J), 1.0)
    write_heis(f"bonds/ss36_J{J}", N, b, d); manifest.append(("ss36", J, N, len(b)))
for J in ["0.7"]:
    N, b, d = shastry_sutherland((4, 0), (0, 4), float(J), 1.0)
    write_heis(f"bonds/ss16_J{J}", N, b, d); manifest.append(("ss16", J, N, len(b)))
    N, b, d = shastry_sutherland((4, 2), (-2, 4), float(J), 1.0)   # 20-site SS cluster, code cross-check only
    write_heis(f"bonds/ss20_J{J}", N, b, d); manifest.append(("ss20", J, N, len(b)))
tori = {
    "k3x4": ((3, 0), (0, 4)), "khex24": ((2, 2), (-2, 4)), "k2x2": ((2, 0), (0, 2)),
    "kP24a": ((0, 4), (-3, -3)), "kP16": ((0, 4), (-2, -1)), "kP14a": ((1, -3), (1, 4)),
    "kP14b": ((1, -1), (3, 4)), "kP6": ((0, 1), (-3, -4)), "kP22": ((1, -4), (2, 3)),
    "k2x4": ((2, 0), (0, 4)), "k3x3": ((3, 0), (0, 3)),
}
for nm, (T1, T2) in tori.items():
    N, b = honeycomb("torus", "V1", T1=T1, T2=T2)
    write_kitaev(f"bonds/{nm}", N, b, -1.0); manifest.append((nm, "K-1", N, len(b)))
json.dump(manifest, open("bonds/manifest.json", "w"), indent=0)
print(len(manifest), "bond files")
