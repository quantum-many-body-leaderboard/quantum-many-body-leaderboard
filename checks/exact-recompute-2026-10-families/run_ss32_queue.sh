#!/bin/bash
# Run several SS 32-site J values one after another (each skips if its log has FINAL).
# usage: run_ss32_queue.sh J1 J2 ...   (an argument "J:nodefl" runs without deflation)
cd /scratch/tzerweck/qmbl-verify-fam-ed
export OMP_NUM_THREADS=32
for a in "$@"; do ./run_ss32.sh ${a%%:*} $( [[ $a == *:nodefl ]] && echo nodefl ); done
