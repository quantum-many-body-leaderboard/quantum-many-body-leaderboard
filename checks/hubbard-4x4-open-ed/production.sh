# code B both fillings in sequence (32 threads), code A both fillings in parallel (8 threads each)
cd /scratch/tzerweck/qmbl-hub4x4-open
PY=/scratch/tzerweck/qmbl-cost/.venv/bin/python
for n in 7 8; do
  ( NUMBA_NUM_THREADS=8 $PY hub_fact.py --lattice square --L 4 --n $n --U 8 --obc --threads 8 --k 1 --ncv 12 --instance Hubbard/square_16_O_${n}_8 --out results/Hubbard__square_16_O_${n}_8__A.json > logs/codeA_n${n}_U8.log 2>&1 ) &
done
for n in 7 8; do
  NUMBA_NUM_THREADS=32 $PY ed_full2.py --model hubbard --lattice square --L 4 --nup $n --ndn $n --U 8 --obc --instance Hubbard/square_16_O_${n}_8 --out results/Hubbard__square_16_O_${n}_8__B.json --tol 1e-10 > logs/codeB_n${n}_U8.log 2>&1
done
wait
touch DONE
