#!/bin/bash
# One SS 32-site tilted run (Sz = 0 full basis, 601080390 states), dimer state deflated.
# usage: run_ss32.sh <J> [nodefl]
cd /scratch/tzerweck/qmbl-verify-fam-ed
J=$1; tag=ss32t_J$J
if [ "$2" = nodefl ]; then tag=$tag.nodefl; D=-; else D=bonds/ss32t_J$J.dimers; fi
grep -q FINAL logs/$tag.log 2>/dev/null && exit 0
./ed bonds/ss32t_J$J sz 1500 1e-11 $D > logs/$tag.log 2> logs/$tag.err
