#!/bin/bash
# Small runs: Kitaev tori (full 2^N), SS 16 and 20 (Sz = 0), and the scipy cross-check.
cd /scratch/tzerweck/qmbl-verify-fam-ed
export OMP_NUM_THREADS=16
mkdir -p logs
for f in k2x2 kP6 kP14a kP14b k2x4 kP16 k3x3 kP22 k3x4 khex24 kP24a; do
  [ -f logs/$f.log ] && grep -q FINAL logs/$f.log && continue
  ./ed bonds/$f full 600 1e-12 > logs/$f.log 2> logs/$f.err
done
for f in ss16_J0.7 ss20_J0.7; do
  [ -f logs/$f.log ] && grep -q FINAL logs/$f.log || ./ed bonds/$f sz 600 1e-12 > logs/$f.log 2> logs/$f.err
  [ -f logs/$f.defl.log ] && grep -q FINAL logs/$f.defl.log || ./ed bonds/$f sz 600 1e-12 bonds/$f.dimers > logs/$f.defl.log 2> logs/$f.defl.err
done
./ed bonds/ss16_J0.7 full 600 1e-12 > logs/ss16_J0.7.full.log 2> logs/ss16_J0.7.full.err
uv run --quiet --with numpy --with scipy python xcheck.py bonds/ss16_J0.7 bonds/ss20_J0.7 bonds/kP6 bonds/kP14a bonds/kP14b bonds/kP16 bonds/k2x4 bonds/k2x2 > logs/xcheck.log 2>&1
echo done > logs/small.done
