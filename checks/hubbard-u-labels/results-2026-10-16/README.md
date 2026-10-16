# 4x4 Hubbard at n = 1/2: which U the rounded labels of arXiv:2111.10420 Table II mean (2026-10-16)

`node ../run_fermions.mjs <instance>[@<U>]` (this folder's parent; plain Lanczos over the full
fixed-(N_up, N_dn) space, N_up = N_dn = 4, no symmetry, t = 1, 4x4 torus). The `script` field in the
JSON files is a fixed string of run_fermions.mjs and names no file for these instances.

| Table II label | run | E (this run) | printed ED |
|---|---|---|---|
| U = 0.1 | U = 0.1 | -19.907309597 | -19.9073095(9) |
| U = 0.6 | U = 0.6 | -19.474341791 | -19.4747633(2) |
| U = 0.6 | U = 0.59948425 (10^(-2/9)) | -19.474763329 | -19.4747633(2) |
| U = 1 | U = 1 | -19.161986316 | -19.161986(3) |
| U = 2.15 | U = 2.1544 | -18.405340776 | -18.4053208(8) |
| U = 2.15 | U = 2.15443469 (10^(1/3)) | -18.405320883 | -18.4053208(8) |

The printed values are the ground states at the grid U, 10^(k/9), as for the instances in `relabels.mjs`.
