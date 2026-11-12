set -e
cd /scratch/tzerweck/qmbl-hub4x4-open
PY=/scratch/tzerweck/qmbl-cost/.venv/bin/python
export NUMBA_NUM_THREADS=16
mkdir -p validation results logs
$PY free_fermion.py 4 3 > validation/free_fermion_n3.json
$PY ed_full2.py --model hubbard --lattice square --L 4 --nup 3 --ndn 3 --U 0 --obc --instance val --out validation/obc_n3_U0_B.json --tol 1e-11 > logs/val_obc_n3_U0_B.log 2>&1
$PY hub_fact.py --lattice square --L 4 --n 3 --U 0 --obc --threads 8 --k 1 --ncv 12 --instance val --out validation/obc_n3_U0_A.json > logs/val_obc_n3_U0_A.log 2>&1
$PY ed_full2.py --model hubbard --lattice square --L 4 --nup 4 --ndn 4 --U 8 --obc --instance val --out validation/obc_n4_U8_B.json --tol 1e-11 > logs/val_obc_n4_U8_B.log 2>&1
$PY hub_fact.py --lattice square --L 4 --n 4 --U 8 --obc --threads 8 --k 1 --ncv 12 --instance val --out validation/obc_n4_U8_A.json > logs/val_obc_n4_U8_A.log 2>&1
$PY ed_full2.py --model hubbard --lattice square --L 4 --nup 4 --ndn 4 --U 8 --instance Hubbard/square_16_P_4_8 --out validation/pbc_n4_U8_B.json --tol 1e-11 > logs/val_pbc_n4_U8_B.log 2>&1
$PY - <<'P'
import json
r = lambda f: json.load(open("validation/" + f))
ff = r("free_fermion_n3.json")["E_free"]
print("U=0 n=3 free", ff, "B", r("obc_n3_U0_B.json")["E"], "A", r("obc_n3_U0_A.json")["E0"])
print("U=8 n=4 open B", r("obc_n4_U8_B.json")["E"], "A", r("obc_n4_U8_A.json")["E0"])
print("U=8 n=4 periodic B", r("pbc_n4_U8_B.json")["E"], "stored 2026-09-29: -16.460626753681822")
for f in ("obc_n3_U0_B.json", "obc_n4_U8_A.json"): print(f, r(f)["geometry"])
P
