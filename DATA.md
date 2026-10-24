# QMBL data

What the files in `data/` contain and how to read them. The leaderboard is in
[README.md](README.md); the rules that decide which values an instance shows are in [RULES.md](RULES.md).

## What is in the data

`data/<Model>/<instance>.json`, one file per instance, plus `data/_summary.json`.

An example row (J1-J2, square 10×10, J2 = 0.5), long text fields cut:

```json
{
  "model": "J1J2", "lattice": "square", "n_sites": 100, "boundary": "P",
  "params": { "J2": 0.5 },
  "instance_id": "J1J2/square_100_P_0.5",
  "rows": [
    {
      "energy": -199.07756, "sigma": 0.00008, "energy_variance": null,
      "dof": 100, "einf": 0, "v_score": null,
      "method": "VMC",
      "ansatz": "CNN-MPS",
      "method_detail": "h = 32, l = 20, Marshall sign",
      "method_as_published": "CNN-MPS (h,D,l)=(32,20,20), Marshall sign transformation",
      "family": "tensor network",
      "bound_type": "variational",
      "bound_type_reason": "variational ansatz; energy is a strict upper bound (assigned during source verification)",
      "reference": "arXiv:2603.14425, Disentangling Tensor Network States with Deep Neural Networks",
      "peer_reviewed": false,
      "source": "sweep-2026-09-13",
      "provenance": "primary",
      "verified": {
        "checked_on": "2026-09-13",
        "method": "arXiv HTML parsed locally, no LLM transcription",
        "reported_as": "-0.4976939 (+/- 2e-7) per site in S.S units",
        "note": "Read from Table 1 of arXiv:2603.14425 ...",
        "secondary_of": null
      },
      "compute": {
        "parameters": 200000, "samples": 4096, "bond_dimension": 20, "iterations": 15000,
        "reported_as": "...", "source": "Supplementary Material Sec. S3.A and Table S1, arXiv:2603.14425 (compute pass 2026-09-16)",
        "scope": "ansatz", "confidence": "medium", "note": "..."
      }
    }
  ]
}
```

A method is stored four ways (since 2026-10-23):
- `method` is the algorithm: `VMC`, `FN-DMC`, `FN-GFMC`, `FP-DMC`, `CP-AFQMC`, `ph-AFQMC`,
  `DMRG`, `ED`, `SSE QMC`, `CCSD`, `HF` and so on.
- `ansatz` is the wave function the algorithm evaluates or projects from, by a short name:
  `ViT`, `RBM + PP`, `SJ` (Slater-Jastrow), `SJB` (Slater-Jastrow-backflow), `Gutzwiller`.
  A projector's trial state is its ansatz (`FN-GFMC` with `PEPS`). It is `null` where the
  method has none: exact methods, coupled cluster, perturbation theory, RPA, FCIQMC, a
  projector whose source names no trial state, and the tensor networks, whose name is their
  ansatz (`DMRG`, `PEPS`, `TPS`). Every `VMC` row has one.
- `method_detail` holds what tells the row apart from other rows of that method and ansatz:
  architecture size, projection, Lanczos steps, what an extrapolation sends to zero, what a
  trial state is beyond its name. It never repeats the kind, the instance or the source.
- `method_as_published` is the string exactly as the source printed it.

A bond dimension, parameter count or sample count lives in `compute`, not in the detail. The
site prints "method (ansatz)", "VMC (CNN-MPS)", or the method alone, "ED", and shows the detail
(with a bond dimension and a sector) on hover; rows that differ only in their detail read the
same. `family` groups methods for the figures: on a `VMC` row it follows the ansatz, and one
ansatz is in one family (the validator checks this); on any other row it follows the method.
`sector` marks an exact diagonalization restricted to one symmetry sector. On a row, `sector`
is the ground state's sector. Other sectors are in `spectrum` (below).

Before 2026-10-23, `method` held one short name that was the ansatz on a VMC row
("CNN-MPS", "ViT") and the algorithm elsewhere ("DMRG", "Fixed-node DMC"), with the trial
state in the detail. A script that reads `method` now reads the algorithm; the old name is
`ansatz ?? method` for VMC rows, and the full published string is unchanged.

Symmetry and extrapolation are written in fixed slots after the free text, separated by
"; ". The order is `symmetric:`, `projected:`, `extrapolated:`.
- `symmetric:` a symmetry built into the ansatz or the tensors, or named without saying how.
- `projected:` a projection, as the source states it.
- `extrapolated:` what goes to zero or infinity, with the method in brackets.

Examples: "72 hidden units; projected: K = 0, spin parity (even), A1" and "snake path;
symmetric: SU(2); extrapolated: χ → ∞ (linear in two-site variance)". Group names come from a
fixed list in [`scripts/method_names.mjs`](scripts/method_names.mjs). A source that names no
group reads `unspecified`. After a named group, `unspecified` means further groups the source
does not name. The validator rejects symmetry or extrapolation wording outside a slot.

`precision` (optional) is one unit in the last printed digit of an exact energy that carries
no error bar, in the stored units: 4 × 1e-7 for an S.S total printed to seven decimals. It
decides which diagonalizations of the same instance state the most precise exact energy to
their own printed digits; the earliest of those is the exact energy shown
([RULES.md §6](RULES.md#6-best-values-and-ties)). A row without it counts as printed to full
precision.

`baseline: true` marks a row that VarBench computed as a reference run for the V-score. No
paper published it. [RULES.md §8.2](RULES.md#82-baseline-collected-versus-computed) defines
the field and how such a row ranks. The count is generated: `baseline_rows` in
`data/_summary.json`.

### Rows QMBL computed: `computed_by`

`computed_by: "qmbl"` marks a row QMBL ran itself, under the protocol in
[`checks/cost/README.md`](checks/cost/README.md): the common ansätze on one machine, so that
cost figures are comparable across methods. It is read like VarBench's `baseline`
([RULES.md §8.2](RULES.md#82-baseline-collected-versus-computed)).

- The run uses QMBL's implementation, hyperparameters and budget, not the authors'. Its
  method string says so ("ViT (...), QMBL cost-to-reproduce run").
- A state QMBL trained is never attached to another's row. It is a row of its own.
- `reference` names the run and the commit.
- `verified.reported_as` and `compute.reported_as` quote the committed results file under
  `checks/cost/results/`.
- Every `compute` field is measured in the run's own process, with `scope: row` and
  `confidence: high`.

The validator requires all of these.

### Rows no paper prints: `provenance: "unpublished"`

A row admitted under [RULES.md §8.3](RULES.md#83-unpublished-results) has
`provenance: "unpublished"` and `peer_reviewed: false`. The site marks it "unpublished".

```json
"reference": "https://github.com/<owner>/<repo> @ 3f2c9e1, checkpoint release v1.0",
"artifacts": {
  "code": "https://github.com/<owner>/<repo>", "commit": "3f2c9e1",
  "checkpoint": "https://github.com/<owner>/<repo>/releases/download/v1.0/state.msgpack",
  "checkpoint_sha256": "<64 hex digits>",
  "evaluation": "python evaluate.py --state state.msgpack --samples 1048576",
  "log": "https://github.com/<owner>/<repo>/releases/download/v1.0/sampling.log"
},
"verified": {
  "checked_on": "2026-11-02", "method": "re-evaluation (RULES §8.3)",
  "reported_as": "the energy and error bar as submitted",
  "reevaluated": { "energy": -199.0771, "sigma": 0.0002, "seed": 20261102,
                   "command": "the evaluation command as run", "gpu_hours": 0.4, "device": "NVIDIA H100" }
}
```

- `reference` names the repository and the commit.
- `artifacts` holds what §8.3 asks for. `checkpoint_sha256` is the hash of the file QMBL
  downloaded and keeps.
- `verified.reevaluated` is QMBL's run, in the instance's convention like `energy`. Where
  either error bar is missing, `reevaluated.agreement` says how the two values were compared.
- The `compute` block states hours and device.

The validator requires all of these, and checks the three-error-bar agreement where both
error bars exist.

### Who submitted a row: `submitted_by`

A row that came through an issue or a pull request names it:

```json
"submitted_by": {
  "account": "<GitHub login>",
  "issue": "https://github.com/quantum-many-body-leaderboard/quantum-many-body-leaderboard/issues/12",
  "system": "<model name and version>", "human_checked": false
}
```

`system` is null for a submission a person made. For an AI system it names the system, and
`human_checked` says whether a person checked the submission. The site shows the system on
the row. Rows QMBL read from the literature itself do not carry the field: `verified.method`
says how they were read.

### The code behind a row: `artifacts`

A published row carries `artifacts.code` when its source names the code that produced the
number. An unpublished row keeps its code in the same block (above).

```json
"artifacts": {
  "code": "https://github.com/mschuylermoss/HeisenbergRNN",
  "read_from": {
    "quote": "Our implementation of the presented methods, all scripts needed to reproduce our results, ... are openly available on GitHub https://github.com/mschuylermoss/HeisenbergRNN [101].",
    "location": "arXiv:2502.17144 (sources/2502.17144.txt and .html), V. Code Availability",
    "checked_on": "2026-10-22",
    "pass": "passes/code/code-links-2026-10-22.json"
  }
}
```

- The source names the code in one of these ways: a code-availability statement or footnote
  in the paper, the README of a results repository the paper points to, VarBench's Reference
  column (its README: "the code repository to reproduce the result"), or, for a row QMBL
  computed, the row's own reference.
- A library the authors used (NetKet, jax, flax, ITensor, TeNPy, QuSpin, mVMC as a package)
  is not the row's code; it goes in `libraries` (below). A data-only release is not code.
  "Available upon request" names no code.
- `commit` is set where the source names one. `script` is the file or folder the link points
  to inside a repository, as for VarBench's run scripts.
- `read_from` quotes the statement verbatim and says where it was read. The validator
  requires all four fields.
- The url resolved on `checked_on`. A url that did not resolve is not attached.
- A QMBL run links `checks/cost/` at the commit on `main` whose tree is the one its reference
  names. The commits named in those references were replaced in the history of `main` on
  2026-10-20.

[`scripts/add_code_links.mjs`](scripts/add_code_links.mjs) attaches the blocks from
`passes/code/code-links-YYYY-MM-DD.json`. The pass has one entry per row with a status:
- `linked`: the source names the code. Only these entries are attached.
- `not_found`: nothing in what was read names the code. `location` says what was read.
- `ambiguous`: a statement exists, but it does not settle that this code produced this
  number. Examples are a package of the authors named as the software they used, or a run
  script written for another method. `reason` says why.
- `dead_link`: the stated url did not resolve.

The site and the README show the link in a `code` column next to `source`. The label is "run
script" for a file in a repository, owner/repo for a repository, "Zenodo" and the record
number for a Zenodo record, "model code" for a release that holds only the network and no
training or run script (`scope: "model"`), "QMBL code" for QMBL's checks, and "rerun (QMBL code)" for a
row QMBL computed, linking how to rerun it ([checks/cost/README.md](checks/cost/README.md#rerun-a-row)).
Where the code column carries a VarBench run script, the source cell names the paper only.

A row with no code of its own can carry `artifacts.libraries`: the libraries its source says
the authors used for this result.

```json
"artifacts": {
  "libraries": [{ "name": "QuSpin", "version": null, "url": "https://quspin.github.io/QuSpin/" }],
  "libraries_read_from": {
    "quote": "The Lanczos exact diagonalization was carried out using the Quspin package [80, 81], restricting to the momentum sectors which contain the ground state.",
    "location": "arXiv:2210.05871 (sources/2210.05871.txt), Sec. 3 Benchmark results and the table row 'Lancos ED (QuSpin)' for L = 6, Np = 13",
    "checked_on": "2026-10-22",
    "pass": "passes/code/libraries-2026-10-22.json"
  }
}
```

- A library counts only where the source says it was used for this result: in the methods,
  an appendix, a code or software statement, or the acknowledgements of the software used
  for these calculations. A citation in the introduction or in related work does not count.
  Only computational-science codes are shown (NetKet, mVMC, CASINO, NECI, QuSpin and the like).
  General machine-learning and array frameworks (JAX, PyTorch, TensorFlow, Flax and the like),
  low-level tools (tensor-contraction engines, optimiser and linear-algebra packages, MPI, BLAS),
  and programming languages are not; the pass keeps them as read.
- `version` is set only where the source states it, else `null`. `url` is the library's
  repository or homepage, one per library, from the table in
  [`scripts/add_libraries.mjs`](scripts/add_libraries.mjs).
- `libraries_read_from` quotes the statement verbatim and says where it was read. The
  validator requires all four fields.
- A row with `code` gets no `libraries`. The validator rejects a row that has both.

[`scripts/add_libraries.mjs`](scripts/add_libraries.mjs) attaches them from
`passes/code/libraries-YYYY-MM-DD.json`, one entry per row without code, with a status:
`library` (attached), `none` (the source names no library used for this result) or `unclear`
(a library is named, but the source does not settle that it was used for this row; `reason`
says why). The code column then shows, in muted text, "uses NetKet 3.13", each name linked;
with more than two libraries, the first two and "+N".

`energy` and `sigma` are stored in the instance's own convention. `v_score` is derived,
never supplied. `verified` records where the number was read and how. `defect` appears on a
flagged row and carries the reason.

A missing field does not exclude a row. [RULES.md §6](RULES.md#6-best-values-and-ties),
[§6.1](RULES.md#61-a-flagged-row-cannot-be-a-best-value) and [§6.2](RULES.md#62-below-the-exact-energy)
decide which rows can be the best of their class.

## What a number cost: the `compute` block

Optional, per row. It records the cost a source states for a result.

```json
"compute": {
  "parameters": 267720,
  "gpu_hours": null,
  "device": "NVIDIA A100",
  "n_devices": 20,
  "samples": 6000,
  "wall_clock": "four days",
  "cpu_core_hours": null,
  "bond_dimension": null,
  "iterations": null,
  "reported_as": "the sentence(s) the numbers were read from, verbatim",
  "source": "Sec. II, Table I, arXiv:2310.05715 (compute pass 2026-09-16)",
  "scope": "row | ansatz | paper",
  "confidence": "high | medium | low",
  "note": "what a reader needs: what the paper gives instead of a missing field, which run the statement is about"
}
```

The four fields after `wall_clock` are the cost metrics of methods that are not neural
networks: CPU core-hours and bond dimension for tensor networks and exact diagonalization,
sample and iteration counts for Monte Carlo. They are stored in their own units and never
converted to GPU-hours.

- `scope` is `row` (this row), `ansatz` (this ansatz across sizes) or `paper` (the paper as
  a whole).
- `confidence` is `high` by default. It is `medium` when a count was evaluated from a formula
  the paper prints, or from an architecture the paper, its code or its run script states in
  full; the formula and its inputs are in `note`. It is `low` when the only statement is
  second-hand or an acknowledgement naming a supercomputer.

A DMRG row whose run script is public also carries `sweep_schedule`, the run's settings as
its script states them:

```json
"sweep_schedule": {
  "code": "ITensors.jl 0.6.16",
  "maxdim": [1024, 1024, "... one maximum bond dimension per sweep"],
  "eigensolver_applications": 3,
  "eigensolver_source": "ITensors.jl 0.6.16 dmrg(): eigsolve_krylovdim = 3, eigsolve_maxiter = 1 (defaults, not overridden)",
  "variance_after": [50],
  "start": "random MPS at bond dimension 1024",
  "cutoff": 1e-12,
  "lattice": { "order": "snake", "rows": 10, "cols": 10, "wrap_row": true, "wrap_col": true,
               "diagonals": ["\\", "/"], "site_dimension": 2, "operators_per_bond": 3 }
}
```

`maxdim` has one entry per sweep (`iterations` is its length, or for a QMBL rung the sweeps
of that rung alone). `variance_after` lists the sweeps after which the script evaluates
⟨ψ|H H|ψ⟩. `eigensolver_applications` is the most effective-Hamiltonian applications per
two-site update the code's eigensolver makes, with the source it was read from. `lattice` is
the site order and couplings the script builds its MPO from, so the MPO's size can be
recomputed. None of this is a cost. These settings are the input to the DMRG FLOP estimate
(next section).

[`scripts/add_compute.mjs`](scripts/add_compute.mjs) attaches the blocks from
`compute-rows-<date>.json`, one file per reading pass, applied in date order. A block is read
from the source paper with its appendices and supplement, its code or its run script. The
VarBench rows are read from their run scripts in
[github.com/varbench/methods](https://github.com/varbench/methods) at `ed31bb0`; no VarBench
run script records a time.

- `samples` is the per-step sample count. A final-evaluation count goes in `note`. A VQE shot
  count per estimated quantity is not a per-step sample count and also goes in `note`.
- Three objects hold what a run states about how it evaluated its state. Like
  `sweep_schedule`, they are statements, never costs. The next section says how each enters
  the estimate.
  - `evaluation`: the training stages, the network evaluations per amplitude (a symmetry sum,
    several determinants), the sampler proposals per kept sample, whether the local energy
    skips vanishing terms, complex parameters, a dense read-out head and the optimiser's solve.
  - `vmc_schedule` (kind `mvmc`): the def-file settings of an mVMC run.
  - `circuit_schedule`: a VQE script's gates and runs.

A wrong statement is corrected like any stored value ([Corrections](#corrections)).

The block follows three rules:

- GPU-hours are stored raw, next to the device model. There is no H100-equivalent column. A
  conversion factor between GPU generations is not measured. The validator rejects any field
  that looks normalised.
- Nothing in the block is checked against a run. `reported_as` carries the authors' own words
  and is required.
- A field the source does not state is `null`, not a guess from the ansatz size. Counting the
  parameters of an architecture stated in full is not a guess. A count that needs a choice the
  source leaves open (a bias, a width, which symmetry) stays `null`. A count the source fixes
  only indirectly (a spin-parity doubling that its own sample-count rule implies) is `low`.

Example: "20 A100 GPUs for four days" fills `n_devices`, `device` and `wall_clock` and leaves
`gpu_hours` null. A value the source gives in GPU-days is stored in hours, and `note` says
so. A view that multiplies devices by wall-clock marks the point as derived. The FLOP
estimate is computed at build time and never stored
([How a FLOP count is estimated](#how-a-flop-count-is-estimated)).

### What an exact diagonalization costs: `qmbl_ed_cost`

An exact energy is the same whoever computes it, so its cost belongs to the instance, not to
a row. QMBL diagonalizes the instance itself and stores the cost once per instance, in
`qmbl_ed_cost`. Duplicate rows would make one Hamiltonian look like several results.
- [`checks/cost/ed/run_ed.py`](checks/cost/ed/run_ed.py) builds the Hamiltonian in NetKet in
  VarBench's conventions. It conserves only particle number or total Sz, with no lattice
  symmetry. The cost is that of plain sparse Lanczos in NetKet and SciPy. A symmetry-adapted
  code would spend less.
- It stores the matrix and finds the lowest eigenvalue with SciPy's `eigsh`, counting the
  matrix-vector products (the Lanczos steps).
- The clock runs from process start to the eigenvalue. The matrix-vector product is
  single-threaded, so one core is used.
- The hardware record defined in [`checks/cost/README.md`](checks/cost/README.md) sits beside
  the wall-clock.

```json
"qmbl_ed_cost": {
  "core_hours": 0.00411, "wall_clock": "00:00:15", "cores": 1, "cpu": "AMD EPYC 7H12 64-Core Processor",
  "energy": -44.9139328337154, "reproduces": { "energy": -44.9139328, "method": "Exact diagonalization", "relative_difference": 7.51e-10 },
  "sector": { "conserved": "total Sz = 0", "dimension": 12870, "nonzeros": 228162, "lattice_symmetries": "none" },
  "lanczos_steps": 61, "peak_memory_gb": 0.89, "code": "NetKet 3.22.4 (sparse matrix) and SciPy 1.18.1 eigsh (ARPACK Lanczos)",
  "note": "Measured by QMBL, not reported: wall-clock from process start to the eigenvalue on 1 core (imports 9 s, ...)",
  "script": "checks/cost/ed/run_ed.py", "results_file": "checks/cost/ed/results/Heisenberg--square_16_P.json", "commit": "fd80732", "measured_on": "2026-09-24"
}
```

Rules:
- A run's energy must agree with the stored exact energy to 1e-8, relative. If it does not,
  nothing is attached and the build prints the mismatch. A number in the table is never
  changed from here.
- `cpu` names the CPU model only. The validator rejects the cluster's name anywhere in the
  field.
- In figures, the exact row the run reproduced is drawn on the hours axis at `core_hours`, as
  a CPU core-hours square named "(cost measured by QMBL)". It is on the frontier like any
  exact energy. It is never on the FLOPs axis, which holds estimates only.

Scope ([`checks/cost/ed/worklist.json`](checks/cost/ed/worklist.json)):
- 67 instances with an exact diagonalization and at most 30 sites.
- Six are not run:
  - Kagome 12, 24 and 30 and shuriken 24: their clusters are defined only in their source
    papers.
  - The 4×4 Hubbard model at half filling: building and storing the matrix needs about 600 GB.
- The 44 exactly solved instances above 30 sites need a symmetry-adapted code, which is not
  used here.

### How a FLOP count is estimated

211 published and VarBench rows state how many parameters the ansatz had, how many samples
each optimisation step drew and how many steps were taken (the VarBench rows in their run
scripts). Those three numbers, with the instance and what the paper or code says about how
the network was evaluated, fix the arithmetic an optimisation took, and
[`scripts/flops.mjs`](scripts/flops.mjs) turns them into floating-point operations at build
time. The model for neural and other variational Monte Carlo states is `nqs-v2`. DMRG, mVMC
and the VarBench VQE have their own models at the end of this section.

An estimate is correct to about one order of magnitude where the run's evaluation is stated.
FLOPs have their own axis and their own figures (`figures/flops/`,
`figures/energy-vs-flops.svg`) and never share the hours axis: converting FLOPs to hours would
need the hardware conversion factor that the `compute` block excludes. On the front page an
instance with both shows two figures, a badge each.

Per training stage:

    FLOPs = iterations × samples × [ (n_conn + 3) × m + proposals × m_s ] × FLOPs_forward
          + iterations × SR
    FLOPs_forward = c_x × 2 × ((parameters − head) × reuse + head)  (+ c_x × 2/3 N_e³ for a determinant or Pfaffian)

- `n_conn`: the off-diagonal Hamiltonian terms one local energy evaluates. By default every
  term (NetKet pads the local energy to all of them): the bonds of a Heisenberg instance, bonds
  plus next-nearest bonds for J1-J2, the sites for the transverse-field Ising model, four per
  bond for Hubbard. A code that evaluates only non-vanishing terms (`local_energy: "nonzero"`)
  counts two thirds of the spin bonds (antiparallel, 0.63-0.73 measured) and, for fermions,
  N_e × z × (1 − n_σ) hops, a quarter of the four-per-bond count at doping 1/8.
- `m`: network evaluations per amplitude (`evaluations_per_amplitude`), 1 unless the run sums
  over a symmetry group, several determinants each with its own network pass, or several
  states per sample. `proposals` is what the sampler spends per kept sample: one sweep of N
  single-site proposals by default, or what the code states (NetKet's discarded samples count;
  QMBL's own runs spend 5N). An autoregressive draw is one pass of the unsymmetrised network
  (m_s = 1); a Markov chain's proposal needs a whole amplitude (m_s = m). The 3 is the forward
  and backward pass of the gradient.
- `reuse`: how many times a weight is applied in one forward pass, declared per architecture
  in `ARCH`:
  - a dense network: once (VarBench's and QMBL's `α = 1` RBMs and Nomura's projected RBM are
    dense);
  - a Jastrow factor's N × N matrix: twice;
  - a convolution or a recurrent cell: once per site;
  - a vision transformer or a patch-embedded RNN: once per patch;
  - a group convolution: once per element of the space group.

  A row whose network differs from its family (an HFPS with a group-convolutional hidden
  network, a backflow tensor of which a configuration reads a fraction) states its own. `head`
  parameters (a dense read-out) run once.
- `c_x` = 2 for complex parameters on real inputs: 4 real FLOPs per multiply-add instead of 2.
  In JAX codes (NetKet, jVMC and the like) `c_x` = 4: JAX promotes the real input to complex,
  so every multiply-add is complex by complex, 8 FLOPs. The count on QMBL's own networks
  (below) confirms this. No published row states complex parameters yet. The SR term is sized
  on its own (next bullet).
- `SR`: the optimiser's linear solve where the code is known: the dense S (2 × samples ×
  P² + P³/3), NetKet's on-the-fly S made dense (P matrix-vector products), conjugate gradients
  at their stated iteration count, or MinSR (2 × samples² × P + samples³/3). Not counted where
  the code is unknown. The matrix is the one the code builds (`evaluation.jacobian`, read from
  the code):
  - `real`: real parameters and a real output, samples × P.
  - `complex`: NetKet's complex mode, which every network with a complex output gets unless it
    is declared holomorphic. The real and imaginary parts of the output are stacked into
    2 × samples rows and complex parameters are split into real pairs, all in real arithmetic
    (an on-the-fly S does not stack the samples).
  - `holomorphic`: a complex samples × P matrix, 4 real FLOPs per complex one.
  Counted on QMBL's eight runs ([checks/cost/README.md](checks/cost/README.md#the-sr-step-counted-2026-09-29)),
  the complex mode's cost matched the model exactly: 4 times the unsized term for a dense S
  with complex parameters, 2 times per conjugate-gradient iteration. Without the statement the
  term keeps samples × P with `c_x` = 2 for complex parameters. QMBL's own rows use their
  counted SR step instead (`evaluation.sr_counted`): the Jacobian (3.5-10 forward passes per
  sample, which the model does not count) plus the dense solve, or the set-up of conjugate
  gradients, whose iterations the runs do not log.

  Of the published rows in JAX codes with an SR term, 86 are `real` (VarBench's NetKet RBMs
  and Jastrows, the MinSR paper's CNN) and 11 are `complex` (the ViTs of arXiv:2405.18874,
  TQS and PITQS, ConvNeXt). The HFPS rows state nothing, because their run scripts are not
  public. The GVMC rows state nothing, because their SR is the code's own. Quantax, which ran
  the HFPS and the MinSR paper's CNN, solves MinSR by an eigendecomposition, which the S³/3 of
  the model does not cover.
- `forward_flops`: where a row carries `evaluation.forward_flops`, it replaces the modelled
  forward pass. QMBL's own runs carry it, counted from the program JAX traces for their
  networks ([checks/cost/README.md](checks/cost/README.md#the-forward-pass-counted-2026-09-29)).
  On the eight runs the count is 0.99-1.01 times the model for QMBL's ViT, 1.2-1.3 times for
  its GCNN and 2.0-2.1 times for its complex RBMs at `c_x` = 2. That factor of 2 is the
  complex-by-complex arithmetic that `c_x` = 4 counts in JAX codes (above).

These are statements about the run, stored in the compute block's `evaluation` object (the
stages as a list, each with its own iterations, samples, parameters and m), never costs. Each
is quoted in `reported_as` like the counts. A row without an `evaluation` object gets every
default. Not counted, and stated under every figure: attention scores (up to ~20 %),
pre-training on smaller lattices, and an extra energy estimate some codes make per step.
SCALE (local updates of at most 18 sites per move) and the transformer backflow (attention
over several determinants) have no estimate: against their paper's measured time per step the
model is ten times off in each direction.

Against the rows that also state GPU-hours, the model implies these achieved rates.
`node scripts/flops.mjs` prints them all.

| instance | method | estimated FLOPs | stated | achieved |
|---|---|---|---|---|
| Heisenberg 10×10 open | minGRU, 6 layers, 2×2 patches, C4v | 1.6e19 | 108 h, L40S | 40 TFLOP/s |
| Heisenberg 16×16 open | minGRU, 6 layers, 2×2 patches, C4v | 1.1e20 | 696 h, L40S | 42 TFLOP/s |
| Hubbard 4×16 | NNBF, n_h = 8192 | 1.2e20 | 400 h, H100 (GH200) | 82 TFLOP/s |
| Hubbard 4×16 | NNBF, 4 determinants, symmetry stage | 3.4e19 | 200 h, H100 (GH200) | 48 TFLOP/s |
| Hubbard 4×16 | NNBF, 32 determinants, symmetry stage | 1.0e20 | 800 h, H100 (GH200) | 35 TFLOP/s |
| J1-J2 10×10, J2 = 0.5 | ViT, factored attention | 3.4e17 | 12.5 h, A100 | 7.5 TFLOP/s |
| J1-J2 10×10, J2 = 0.5 | ViT, T5 / decoupled attention | 4.0e17 | 28 h, A100 | 4.0 TFLOP/s |
| J1-J2 6×6, J2 = 0.5 | ViT, factored attention | 2.4e17 | 6 h, A100 | 11 TFLOP/s |
| J1-J2 6×6, J2 = 0.5 | ViT, T5 / decoupled attention | 2.9e17 | 10 h, A100 | 7.9 TFLOP/s |
| triangular 108 | GCNN | 1.1e18 | 96 h, A100 | 3.1 TFLOP/s |
| J1-J2 16×16, J2 = 0.5 | GCNN | 1.8e18 | 300 h, A100 | 1.7 TFLOP/s |
| triangular 36 | GCNN, symmetry-projected | 3.9e16 | 12 h, A100 | 0.9 TFLOP/s |
| J1-J2 20×20, J2 = 0.5 | ViT, b = 4, symmetry stages | 2.0e19 | 25000 h, GH200 (whole paper) | ≥ 0.2 TFLOP/s |
| J1-J2 10×10, J2 = 0.5 | GCNN, translations, QMBL run | 3.5e16 | 2.7 h, A100 80 GB (measured) | 3.7 TFLOP/s |
| J1-J2 10×10, J2 = 0.5 | ViT, QMBL implementation | 5.9e16 | 6.4 h, A100 80 GB (measured) | 2.5 TFLOP/s |
| triangular 36 | ViT, QMBL implementation | 6.7e15 | 2.7 h, A100 80 GB (measured) | 0.7 TFLOP/s |
| J1-J2 10×10, J2 = 0.5 | symmetric RBM α = 4, QMBL run | 2.5e15 | 0.51 h, A100 80 GB (measured) | 1.3 TFLOP/s |
| J1-J2 10×10, J2 = 0.5 | RBM α = 1, QMBL run | 6.2e14 | 0.45 h, A100 80 GB (measured) | 0.4 TFLOP/s |
| triangular 36 | RBM α = 1, QMBL run | 2.9e14 | 0.10 h, A100 80 GB (measured) | 0.8 TFLOP/s |

The A100 rows run at 0.9-11 TFLOP/s in double precision, 5-57 % of the FP64 tensor-core peak
(19.5 TFLOP/s, which cuBLAS reaches on large matrix products). The fastest are the ViTs, whose
step is dominated by MinSR's sample-space matrix over 2 × 6000 stacked samples, one large
matrix product. The minGRU in single precision on an L40S and the NNBF in TF32 on an H100 run
at 7-45 % of their peaks. QMBL's own small RBMs (1368 and 10200 parameters) are lowest, at
0.4-0.8 TFLOP/s: their steps are too small to fill a card. QMBL's rows use their counted
forward pass and SR step (above).

The estimate follows these rules:

- An input the source does not state is never guessed. Parameters, samples and iterations
  must all be on the row, the architecture must be in `ARCH`, and the instance must be on a
  lattice whose bond count the script writes. The `evaluation` statements are quoted or take
  their defaults. For DMRG the sweep schedule, eigensolver setting and site order must be in
  the run script. Otherwise there is no estimate.
- The estimate is `medium` confidence when those conditions hold. It is `low` when an
  architectural assumption was needed (a transformer whose patch size the paper does not
  state) or when the block itself is `low`.
- Nothing is stored. The estimate is a function of the row and its instance, recomputed on
  every build. A change to the model changes every figure at once and no data file.
- Only rows with a `sweep_schedule` get a DMRG estimate (below): the VarBench rows, from their
  run scripts, and QMBL's own. A bond dimension alone does not fix a DMRG cost. No DMRG paper
  in the table states its sweep schedule, a PEPS needs its contraction dimension, and the four
  exact diagonalizations that state seconds per matrix-vector product do not state the
  Lanczos iteration count.

#### DMRG: `dmrg-v1`

For a row with a `sweep_schedule`, `flops.mjs` counts the dense tensor
contractions of two-site DMRG:

    FLOPs = Σ over sweeps  2 × Σ over the N − 1 two-site updates
              [ n_apply × apply + svd + environment ]
          + one ⟨ψ|H H|ψ⟩ contraction after each sweep in variance_after
    apply       = 2 d² D χ_l χ_r (χ_l + χ_r) + 4 d³ D² χ_l χ_r
    svd         = 4 m n min(m, n),  m = d χ_l,  n = d χ_r
    environment = 2 d D χ_l χ_r (χ_l + χ_r) + 2 d² D² χ_l χ_r
    ⟨H²⟩        = Σ over sites  2 d D² χ_l χ_r (χ_l + χ_r) + 4 d² D³ χ_l χ_r

`d` is the site dimension (2 for spins and spinless fermions, 4 for Hubbard). The bond
dimension at a bond in a sweep is the least of three numbers:
- the sweep's maximum;
- the reached bond dimension the row states (a 16-site tV run capped at 4096 reached 74);
- the exact limit d^min(b, N − b).

`n_apply` is the code's own eigensolver setting:
- at most 3 for ITensors.jl 0.6.16's defaults (Krylov dimension 3, one pass);
- at most 3 for ITensor C++ at `niter = 2` (one application, then one per Davidson
  iteration);
- for TeNPy, whose Lanczos stops adaptively, the count measured on the calibration run
  (`checks/cost/calibration/`).

`D`, the MPO bond dimension, is 2 + k × the largest number of sites on the smaller side of
any cut in the script's site order with a coupling across that cut. `k` is the number of
operators per bond: 3 for S⁺S⁻ + S⁻S⁺ + SᶻSᶻ and for tV, 1 for the Ising ZZ, 4 for the two spin
species' hops. For QMBL's runs this bound reproduces the MPO bond dimension TeNPy logs,
68 on the J1-J2 10×10 torus and 41 on triangular 36.

Not counted, and stated under every figure that shows a DMRG estimate:
- conserved quantum numbers: the model is dense, and block-sparse tensors skip most of the
  contraction, more so as χ grows;
- the noise or mixer term, the eigensolver's orthogonalisation, and memory traffic.

Calibration: QMBL's six DMRG rungs (TeNPy 1.1.1, Sz conserved, wall-clock measured on 8
cores, [`checks/cost/`](checks/cost/README.md)) measure 2.6-3.8 effective-Hamiltonian
applications per update: 3.76, 2.72 and 2.64 on the triangular ladder, 3.83, 3.06 and 3.00
on J1-J2. A repeat of the triangular-36 χ = 500 rung
(`checks/cost/calibration/dmrg-cal-tri-36.json`) gave the same energy to all printed digits.
Each rung's schedule covers every sweep up to the end of that rung, because the wall-clock
does too.

| instance | rung | estimated FLOPs | measured | achieved per core |
|---|---|---|---|---|
| triangular 36 | χ = 500 | 2.4e14 | 3.7 core-h, EPYC 7742 | 18 GFLOP/s |
| triangular 36 | χ = 1000 | 1.4e15 | 9.4 core-h, EPYC 7742 | 41 GFLOP/s |
| triangular 36 | χ = 2000 | 9.3e15 | 24.4 core-h, EPYC 7742 | 105 GFLOP/s |
| J1-J2 10×10, J2 = 0.5 | χ = 500 | 2.0e15 | 15.3 core-h, EPYC 7742 | 36 GFLOP/s |
| J1-J2 10×10, J2 = 0.5 | χ = 1000 | 1.3e16 | 44.6 core-h, EPYC 7742 | 80 GFLOP/s |
| J1-J2 10×10, J2 = 0.5 | χ = 2000 | 9.4e16 | 181.5 core-h, EPYC 7742 | 145 GFLOP/s |

The implied rate grows four- to sixfold from χ = 500 to 2000. One of these cores peaks at about 40-55 GFLOP/s in double precision. From χ ≈ 1000 upward
the model therefore counts more arithmetic than the run did: blocks with different Sz are
never multiplied, and that saving grows with χ. Below it, the run spends time on things the
model does not count.

The clock is itself uncertain:
- the calibration repeat took 3.4 core-h on one node and 8.7 core-h on another of the same
  partition, for the same sweeps and the same energy;
- the J1-J2 ladder reached χ = 2000 in 221 core-h on an EPYC 7763 node and in 182 core-h on
  an EPYC 7742 node, with the same three energies.

A DMRG estimate has the same order-of-magnitude accuracy as a network's (above). It
overstates the work of a large-χ run by up to a factor of three against peak.

#### mVMC: `mvmc-v2`

For a row whose compute block carries its mVMC def-file settings (`vmc_schedule`, kind
`mvmc`: the VarBench mVMC + RBM rows, read from their inputs and `mVMC.sh`),
`flops.mjs` counts the Pfaffian arithmetic over every projection term:

    FLOPs = c_x [ P_tot N_QP (r + a u) + N_it S N_QP (n_conn r + n²) + (a P_tot / N + N_it S) N_QP (7/3) n³ ] + SR

with
- P_tot: the proposals of all processes over the run;
- N_QP: the projection terms (NMPTrans × NSPGaussLeg);
- S: the samples per step (NVMCSample × processes);
- n = Nsize;
- r and u: the ratio and update of a hop (2n, 6n²) or an exchange (2n², 34n²);
- c_x = 4 for complex inputs;
- SR: the complex O O† product and Cholesky on every process (NSRCG 0), or 100
  conjugate-gradient iterations per step (NSRCG 1).

The acceptance a is bounded by 1, which overstates sampling about twice. Calibrated on QMBL's
short runs of VarBench's inputs (EPYC 9654): 4.6-17 GFLOP/s per core over Hubbard 8×8 and
pyrochlore 128 and 432. Every estimate is `low`: the scripts are simplified templates of the
published runs.

#### VQE: `vqe-v1`

For the VarBench SU(2) VQE rows (`circuit_schedule`: gates, runs with their symmetry-projector
terms |G| and iterations, the state-vector dimension C(N, N/2)), per step

    32 P² D + 32 P D + 8 |G| P² D + n_H P D (32 + 8 |G|) + 8 |G| P D + n_H D (32 + 8 |G|) + 8 |G| D

for the derivative states, the metric tensor (a bound: the code pairs inverse group elements),
the energy derivatives, and energy and norm. Shots are binomial draws on exact probabilities
and add no state-vector work. Calibrated at 3.7-37 GFLOP/s per core on the same CPU, with the
same rate at D = 12870 and 2.7 million. Every estimate is `low`: the script postdates the
energies and, as published, stops after its first run.

## When the literature was last checked: `coverage`

Per instance, not per row, and appended to rather than overwritten:

```json
"coverage": [
  { "checked_on": "2026-09-15", "method": "table harvest of 44 cached sources",
    "screened": ["arXiv:2507.01856", "arXiv:2606.00924"], "found": 2, "note": "" },
  { "checked_on": "2026-09-15", "method": "citation screen of the originating paper",
    "screened_count": 61, "found": 0,
    "note": "Nobody has published a second energy for this Hamiltonian since Sorella (2023)." }
]
```

A check that found nothing is recorded with `found: 0`. The instance pages quote this field.
`screened` names the papers when there are few. `screened_count` replaces it when there are
many. `found` is how many of the screened papers the instance carries an energy from, read
off its rows at build time, so it cannot disagree with the page.

## The lowest energy of each symmetry sector: `spectrum`

Per instance, not per row. A diagonalization resolved by symmetry sector states the lowest
energy in each sector, and only the ground state's sector is a ground-state energy: that row
stays a row and is the instance's exact energy, and the minima of the other sectors are the instance's
`spectrum`. One instance has one:
`J1J2/triangular_48_P_0.125`, whose 48 sectors of the S<sup>z</sup> = 0 space come from
Wietek et al. (PRX 14, 021010), App. B naming Γ.A1 (spin flip +1) the ground state. One of
its 47 entries, the compute block cut:

```json
"spectrum": [
  { "energy": -98.7034711151, "sigma": 0.00000556, "energy_variance": null, "dof": 48, "einf": 0, "v_score": null,
    "method": "ED", "ansatz": null, "method_detail": "", "method_as_published": "Exact Diagonalization Gamma.D6.E2 1",
    "family": "other", "sector": "Gamma.D6.E2, spin flip +1", "bound_type": "exact",
    "bound_type_reason": "exact diagonalization|ex",
    "reference": "[paper](https://journals.aps.org/prx/abstract/10.1103/PhysRevX.14.021010)",
    "source": "varbench@2024-10-22", "provenance": "imported", "compute": { "...": "..." } }
]
```

Spectrum entries are not results. Each entry is the full row, lowest energy first. Entries
are never a shown value, are not drawn and are not counted in `rows`. `data/_summary.json` counts them
as `spectrum_entries`. The validator requires each entry to be exact and to name its sector,
and no entry to lie below the ground state. An instance with no ground-state row keeps its
sector rows as rows, and the validator reports them.

## Units and conventions

Stored conventions follow VarBench and are asserted per instance, not per row. The
conversions live in [`scripts/units.mjs`](scripts/units.mjs) and are applied by the
loader, never by hand.

| | stored as | papers usually quote |
|---|---|---|
| Heisenberg, J1-J2 | total energy, **Pauli** (σ·σ) convention | `E/N` in `S·S`: divide by `4 * n_sites` |
| Kitaev (K-J-Γ), Shastry-Sutherland | total energy, **Pauli** form of the S = σ/2 Hamiltonian with normalised couplings, \|K\| = 1 or Jd = 1 ([RULES.md §2.1](RULES.md#21-instance-names)) | `E/N` with S = σ/2: divide by `4 * n_sites` |
| TFIsing | total energy, **Pauli** | `E/N`: divide by `n_sites`; no `S·S` term to rescale |
| Hubbard, t-V | total energy | per site: divide by `n_sites` |
| t-J | total energy in units of t, exchange J (S·S − n n/4), couplings normalised to t = 1 ([RULES.md §2.1](RULES.md#21-instance-names)) | per site: divide by `n_sites` |
| Impurity | total energy | no meaningful per-site energy |
| HEG2D, HEG3D (track 2) | total energy, Hartree, Ewald sum with the Madelung term (RULES.md 12.2) | per electron: divide by N (`n_sites` holds N) |

An instance on a cluster that its source defines (the honeycomb, Shastry-Sutherland and t-J
families) carries a `cluster` field: the shape in words and where the source defines it. A t-J
instance carries `params` { t: 1, J, t2 (t′) and t3 (t″) where present, N_up, N_dn, nn_term: true }.
A row read from a source whose Hamiltonian is the instance's times a factor (normalised couplings,
or a t-J source in units of J) carries `normalised`: `{ factor, source_couplings, note }`. The
loader has divided the printed energy by `factor`.

`dof` is the spin count for spin models, `N_up + N_dn` for Hubbard and t-J, and the particle
count for **spinless** t-V. `einf` is `0` for traceless spin Hamiltonians and
`U * N_up * N_dn / n_sites` for the plain Hubbard model.

Two Hubbard instances carry further couplings. VarBench names them by suffix, and `params`
states them in the form of VarBench's Eq. (S6).
- `_t12` adds a next-nearest-neighbour hopping, `-t2 Σ⟨⟨ij⟩⟩σ (c†iσ cjσ + h.c.)`, beside
  `-t1 Σ⟨ij⟩σ (...)`, with t1 = 1 and t2 = -0.25.
- `_t12_UV1V2` also adds `V1 Σ⟨ij⟩ ni nj + V2 Σ⟨⟨ij⟩⟩ ni nj`, with V1 = 1 and V2 = 0.5. Each
  bond is counted once. The densities are total densities, ni = ni↑ + ni↓, as mVMC, the
  program behind its row, defines them. Eq. (S6) prints these terms between equal spins. The
  density terms are not traceless, so the `einf` of this instance is not checked.

A t12 instance from a paper carries its t2 in the name, `_t12_<t2>` (for example
`Hubbard/square_64_P_28_8_t12_-0.2`), because several t2 values share a size. `params` holds
t1 = 1 and t2. The papers write `-t Σ⟨ij⟩ - t' Σ⟨⟨ij⟩⟩ + U Σ ni↑ni↓`, the form of Eq. (S6), so
t2 is their t'. The README label states t2, and t2 is a coupling of the size ladders.

## Error metrics

Some rows have no error bar and no energy variance. The README leaderboard marks them
&#9675; (`o` in `scripts/records.mjs`). The marker means QMBL found no error metric in the
source it read. The number may still exist in a supplement, a companion paper or the
authors' own records. The row stays in the table and in rank order, and it is not a `defect`.
`exact` rows are not marked: an exact diagonalization has no error to report. An exact
(stochastic) row must state its `sigma` (the validator checks this).

A sampled energy with an energy variance but no error bar is marked &dagger; in the README.

If one of these rows is yours, see [Contributing](README.md#contributing). Sending the error
bar, the variance or the checkpoint removes the marker.

### Sampled or deterministic: `sampled`

Whether a row's energy is a Monte Carlo estimate decides whether a missing `sigma` is a
missing error bar (the &dagger; marker above; the Contribute page counts these rows).
[RULES.md §6](RULES.md#6-best-values-and-ties) says how such a row ranks.

- Where a reader established it from the source, the row carries `sampled: true` or `false`,
  set in [`scripts/corrections.mjs`](scripts/corrections.mjs) with the evidence. The verdict
  the method string gave stays in `corrections[].from`.
- Where the field is absent, the method string decides: explicit deterministic markers (DMRG,
  PEPS, MPS, statevector, exact diagonalization, mean field, ...) in
  [`scripts/units.mjs`](scripts/units.mjs), everything else sampled.

The method string misleads both ways. VarBench's "2^14 samples/grad" VQE rows print the exact
statevector energy. A finite PEPS evaluated by Monte Carlo, an MPS-RNN or a projected
mean-field state is sampled.

### Where an added error bar or variance came from: the `error_metrics` block

A row may carry a `sigma` or an `energy_variance` its paper does not print. The row's
`energy` is still the printed one; the `error_metrics` block says where the added numbers
came from:

```json
"error_metrics": {
  "fields": ["energy_variance"],
  "measured_by": "authors",
  "checked_on": "2026-09-16",
  "source": "authors' repository github.com/NeuralQXLab/convnextnnqs@c78787343c, data/optimizations.ipynb, ...",
  "source_file": "sources/2505.03466-repo-optimizations-j1j2.json",
  "reported_as": "(-0.4975827288198424, 5.751903088141703e-06) | (0.002727916908247034, 0)",
  "conversion": "v_score",
  "note": "..."
}
```

- `fields` names what the block set; nothing a row already carried is overwritten.
- `measured_by` is `authors` when the number is in the authors' own data release: a
  repository, a Zenodo record, a notebook's stored output, or output files the authors sent
  for the entry, committed under `sources/` as received.
- `measured_by` is `qmbl` when QMBL measured it on the checkpoint the authors published, with
  their network. A state QMBL trained is a row of its own
  ([`computed_by`](#rows-qmbl-computed-computed_by)).
- `source_file` is committed under `sources/`, and every ` | `-separated part of
  `reported_as` appears in it verbatim, so each value can be checked from a clone.
- `conversion` is the convention the source states its variance in (`var_total_pauli`,
  `var_as_stored`, `var_total_SS`, `var_over_n_SS`, `var_over_n2_SS`, `v_score`), converted to the stored
  convention once, in [`scripts/add_error_metrics.mjs`](scripts/add_error_metrics.mjs).

A source's number is attached only if its energy agrees with the row's within two combined
error bars, which is the check that it describes the state behind the printed energy.
Passes are `passes/error-metrics/error-metrics-YYYY-MM-DD.json`.

## Provenance and defects

Each row cites the primary paper that produced the number. A number quoted from another paper
is marked `secondary`, and the row names both papers. `peer_reviewed` follows the venue that
printed the number. [RULES.md §8](RULES.md#8-provenance) says which paper is primary and how
datasets and private communications are cited; [§8.1](RULES.md#81-venue-type) gives the venue
types.

[`scripts/validate.mjs`](scripts/validate.mjs) runs in every build. It checks:
- `dof` and `einf` against the instance definition;
- the V-score against the row's own inputs;
- the row's energy against its own reported variance;
- the variational principle against any exact row on the same instance, combining the two
  error bars where the exact row is exact (stochastic);
- that every exact (stochastic) row states its `sigma`.

[RULES.md §9](RULES.md#9-validation) has the full list.

Rows that fail a check are flagged in place. A duplicate, or a number that is not an energy of
its instance, is removed ([RULES.md §11](RULES.md#11-corrections)). The flag withholds the
record and nothing else. [RULES.md §10](RULES.md#10-review-and-objections) is the
process for lifting or upholding it.

### Corrections

Each correction is listed in `corrections` on the row, with the old value (`from`), where the
new one was read, and why. This holds for imported rows and for rows QMBL added
([`scripts/corrections.mjs`](scripts/corrections.mjs)). The same shape covers:
- a field of the row's `compute` block (`compute.parameters`, `compute.note`);
- a field of its verification (`verified.note`, and `verified.secondary_of` where the paper a
  number was quoted from turns out to have produced it);
- an instance's `params`, whose old value stays in the instance's own `corrections`.

An exact row whose printed value is QMBL's recomputed energy rounded or truncated carries
QMBL's digits, with the printed value in `corrections`.

### Verifications

`verified` records a check that found nothing wrong. An independent re-read of a row QMBL
added itself is `verified.second_read`. A reading of the published version of a paper
([RULES.md §8](RULES.md#8-provenance)) is `verified.journal_read` where the row already
carries a reading, and the row's `verified` where it carries none. It names the journal file
read and the arXiv version compared.

### Relabels

An instance renamed because its upstream name carries the wrong coupling or size has
`relabelled`: the old id, the reason and the evidence. Where rows were computed at the old
coupling, the old id stays, with `split` and an exact row QMBL computed
([`checks/hubbard-u-labels/`](checks/hubbard-u-labels/)). The cases are listed in
[`scripts/relabels.mjs`](scripts/relabels.mjs).

### Defects

A `defect` carries:
- `flag`: the kind of problem;
- `finding`: the evidence, with the source of every claim;
- optionally `diagnosis`, `ruled_out` and `evidence`, from a shared block written for that row
  or group of rows, never attached by flag name alone;
- `source_entry`: the verification proposal it was written from.

```json
"defect": {
  "flag": "sampling-nonergodic",
  "finding": "what the source states, with the file and lines of every claim",
  "diagnosis": "...",
  "ruled_out": "...",
  "evidence": "...",
  "source_entry": "..."
}
```
