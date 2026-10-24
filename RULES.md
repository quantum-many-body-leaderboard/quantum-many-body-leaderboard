# QMBL rules

Release 0.4.0 (2026-10-08). This file on `main` can contain changes made after that
release. Each accept or reject of a row cites a clause of this file.

## 1. Scope

Track 1 covers ground-state energies of lattice Hamiltonians computed by any method.
Track 2 covers ground-state energies of the homogeneous electron gas in a periodic cell, in
two and three dimensions (§12). A row is a claim about one (Hamiltonian instance, method)
pair.

Out of scope for now: real-time dynamics, finite temperature, molecules, atoms, quantum dots
and other continuum systems with an external potential. Each needs its own instance
definition (§12 is the pattern). None opens before track 2 has had its first verification
pass. Track 2 ranks by energy like track 1 and computes no V-score (§12.2).

## 2. Instances

An instance is a fully specified Hamiltonian: model, lattice, site count, boundary
conditions, and every coupling. Rows are comparable only within an instance.

Instance identity is part of the claim. A submitter asserting a record must state the
symmetry sector and particle number. If a paper's number is from a different sector, the
row moves to the instance of that sector and does not compete here.

## 3. Required fields

| field | required | notes |
|---|---|---|
| `energy` | yes | in the instance's stored convention (§5) |
| `sigma` | no, asked for | the error bar on the mean, and how it was estimated (§6); required for an `exact (stochastic)` row (§4) |
| `bound_type` | yes | one of §4; never guessed |
| `method` | yes | the method's name alone: `DMRG`, `HFPS`, `AFQMC` |
| `method_detail` | yes, may be empty | what tells this row apart from other rows of that method (see below) |
| `method_as_published` | yes | the method string exactly as the source printed it (see below) |
| `reference` | yes | §8 |
| `dof`, `einf` | yes | checked against the instance (§9) |
| `energy_variance` | no | renders `n/a`; enables the V-score |
| `sampled` | no | whether the energy is a Monte Carlo estimate, stated where the source settles it; decides whether §6 asks for `sigma` |
| compute | no, requested | GPU-hours x device, parameter count, samples, iterations, wall-clock; parameters, samples and iterations together let the site estimate a FLOP count ([DATA.md](DATA.md#how-a-flop-count-is-estimated)) |

`method_detail` holds, for example, the architecture size, the projection, the Lanczos
steps, the trial state, or what an extrapolation sends to zero. It never holds the kind of
number, the instance or the source. A corrected `method_as_published` quotes a label the
source prints, word for word; what explains the label goes to `method_detail`.

A missing field never excludes a row. Only §6 governs what is shown as a best value.

## 4. `bound_type`

Every row declares exactly one. Energies of different classes are different claims. Each
class has its own best value (§6), so its class tells the reader what was claimed.

- `variational`: a strict variational upper bound on the ground-state energy in the
  stated sector. VMC, DMRG and MPS at finite bond dimension, PEPS, NQS, VQE and other
  parameterised circuits, and p-step Lanczos applied to a variational state.
- `projected`: variational only within a constraint, or otherwise biased. Fixed-node
  and constrained-path methods, GFMC on a trial state, constraint-release schemes.
  It is an upper bound in most cases, but it depends on the node or the constraint. Two
  projected energies from different trial states are therefore not cleanly comparable to
  each other or to variational ones.
- `extrapolated`: the reported number is an extrapolation: zero-variance or bond-dimension
  extrapolation. It is not a bound: no state reached this energy.
- `exact`: numerically exact for this instance: exact diagonalization, exact solution,
  sign-problem-free QMC where that is established. Sign-problem-free QMC taken to its own
  limits (Δτ → 0, β → ∞) stays `exact`, and its detail says so. QMC is exact only within its
  statistical error bar, not to the printed digits. It stays `exact` because it is unbiased.
  Its label reads `exact (stochastic)` everywhere, and the row must state `sigma` (§9.4).
- `approximate`: the energy of a method built on a fixed approximation. The method converges
  to that approximation and not to the exact energy, so its error has no known sign. The class
  is a fixed list of method families: the random-phase approximation and its corrections
  (SOSEX), finite-order perturbation theory (MP2, MP3), coupled cluster restricted to some of
  its terms (ring-, ladder- or mosaic-only CCD), methods on a transcorrelated Hamiltonian
  whose three-body term is dropped or approximated (since 2026-10-20), and density-functional
  energies. Full coupled
  cluster at any truncation (CCSD, CCSDT, ...) stays `projected`: each is a rung of a hierarchy
  that reaches the exact energy. An `approximate` row is listed with the others and is compared
  only with other `approximate` rows (§6).
  Case: on the 14-electron gas at rs = 1, ring-, crossed-ring- and mosaic-only CCD gives
  0.5465 Ha per electron. That is 22 mHa below FCIQMC, CCSDTQ5 and transcorrelated FCIQMC,
  which agree to 0.1 mHa. The CCD row is the lowest energy on the instance; it is the best
  approximate value, and the other classes have their own best values.

Cases:

- "exact grad" is not an exact energy. 21 rows read `VQE + symm. circuit (64 pars.,
  exact grad, statevector)`. That describes how the gradient was computed. They are
  `variational`. For this reason the rule order in `scripts/bound_type.mjs` matters.
- p-step Lanczos stays variational. A Lanczos step applied to a variational state gives
  a variational state.
- Zero-variance extrapolation is its own class. Chen & Heyl report both a variational
  −0.4976921(4) and an extrapolated −0.497715(9) on 10x10 J1-J2: an energy a wave function
  reached, and an estimate of the ground-state energy. Each is the best of its own class (§6),
  and the class says which kind it is.
- A method name is not a guarantee, so the row is read. The string
  `QMC (continuous-time expansion)` on the six t-V instances does not say projector or
  finite temperature. VarBench's run files show ground-state projector LCT-INT runs with
  sign exactly 1; the gap to ED is 0.6-0.7 of their error bar. They are `exact (stochastic)`.
  The one that sits 2.76 sigma above a DMRG bound (square, V = 4) is flagged and is not shown
  as the exact energy. The classifier returns `null` for the string; the class is set per row in
  `scripts/corrections.mjs`.
- When in doubt, `null`. Bare `QMC` and `AFQMC` strings are unresolved: sign-problem-free
  (exact) and constrained-path (projected) are different classes and the string does not say.
  The one bare `QMC` row (Heisenberg, open 10x10) was read for this reason: the ALPS loop
  algorithm at T = 1e-4, converged in T by the authors' statement, exact (stochastic).

## 5. Units and conventions

Stored conventions follow VarBench and are asserted per instance, not per row:

- Spin models are written with Pauli matrices and stored as totals. Papers quote
  `E/N` in the `S.S` convention: `E/N = energy / (4 * n_sites)`.
- Hubbard and t-V are stored as totals; papers quote per site.
- `dof` is the spin count for spin models, `N_up + N_dn` for Hubbard, and the particle
  count for spinless t-V.
- `einf` is `0` for traceless spin Hamiltonians, `U * N_up * N_dn / n_sites` for the plain
  Hubbard model. Hopping terms are traceless, so a `t'` variant keeps the same `einf`;
  extra density-density terms do not.

Any submitted number is converted by the loader, never by hand. The conventions of every
model are listed in [DATA.md](DATA.md#units-and-conventions).

## 6. Best values and ties

An instance has no single record. It shows its `exact` energy where it has one, then one best
value per bound type: best variational, best projected, best extrapolated and best
approximate (§4). The best value of a class is the lowest energy of that class, with or
without an error bar, that is not flagged (§6.1, §6.2). Every published result counts.
Energies of different classes are different claims (§4), so they are not ranked against each
other, and each value is shown with its class. A best extrapolated value is an estimate of the
ground-state energy; no state reached it. From 2026-10-08 an instance had one record, its exact
energy or else the lowest unflagged energy of any class; since 2026-10-22 each class has its
own best value.

- On a solved instance the exact energy is the answer and is shown first. The best value of
  each other class is shown beside it, with its distance to it.
- Among several exact rows the most precise is the exact energy shown. Exact rows are estimates of
  one number, so the lowest of them is not the best: exact diagonalization (no error bar)
  comes before sign-problem-free QMC, and a smaller error bar comes before a larger one.
  Between diagonalizations, the one printed to more digits comes first. Two exact rows that
  disagree beyond their stated precision are a `defect` to raise on the row (§11).
- Every published calculation of the exact energy is a row (2026-10-24). A source that
  diagonalized the cluster itself and printed the same energy as an earlier or later source
  adds a row of its own; a source that quotes another source's value does not (§8). The rows
  that state the exact energy shown to their own printed digits are listed beside it, and
  where there are several the earliest listed is marked "first". Case:
  `Heisenberg/square_40_P`, diagonalized in Richter, Schulenburg & Honecker, Lect. Notes
  Phys. 645 (2004), Table 2.1, to seven decimals, and in Richter & Schulenburg, EPJB 73
  (2010), Table 1, to eight; the 2010 row is the exact energy shown and the 2004 row is first.
- Sector-resolved exact diagonalization is the exact energy only in the ground-state sector. A
  row such as `Exact Diagonalization 0.C1.A -1` states the lowest energy in one symmetry
  sector. That is the ground-state energy only if the sector is the ground state's. Case:
  `J1J2/triangular_48_P_0.125` carries all 48 sectors of Wietek et al. (PRX 14, 021010).
  Their App. B names Γ.A1 (spin flip +1) as the ground state. That row is the exact energy. The
  other 47 are not rows: they are the instance's `spectrum`
  ([DATA.md](DATA.md#the-lowest-energy-of-each-symmetry-sector-spectrum)) and hold nothing.
  `groundStateExact` in `scripts/units.mjs` draws the line.
- Within a class, rows whose error bars overlap at 2 sigma share the rank: a row tied with its
  class's best is marked as tied. A row without `sigma` is compared by its energy alone.
- An error bar is asked for and is not required. A sampled row without `sigma` ranks and can
  be the best of its class like any other row. Where `sigma` is given, the row must state how it was
  estimated. An error bar that ignores autocorrelation can understate the error by about 10x,
  which changes ties. Report the blocking or binning analysis, or the raw chain.
- A deterministic energy has no `sigma`. DMRG at a stated bond dimension, exact
  diagonalization, statevector circuits and tensor-network contractions carry no statistical
  error. Their convergence control is the bond dimension (`compute.bond_dimension`) or the
  truncation error (`method_detail`).
- Whether an energy is sampled is read from the source, per row. The method's name does not
  settle it. A finite PEPS whose energy is a Monte Carlo average over spin configurations, an
  MPS-RNN, a PEPS + CNN state and a Gutzwiller-projected mean-field state are sampled,
  although their strings read like a tensor network or a mean field. A circuit whose shots
  estimate only the gradient reports an exact energy. Where a reader established it, the row
  carries `sampled` (true or false) with the evidence, and that decides
  ([DATA.md](DATA.md#sampled-or-deterministic-sampled)). Where the field is absent,
  `scripts/units.mjs` reads the method string: explicit deterministic markers, and anything
  not so marked counts as sampled.
  Case: the 4x4 J1-J2 VQE rows. `exact grad, statevector` and `2^14 samples/grad` are
  separate rows on the same instance. The program behind both (VarBench's `observables.py`)
  prints the exact statevector energy of the circuit state. The 2^14 shots estimate only the
  gradient and the metric, as the VarBench supplement says. Both rows are deterministic, and
  the shot rows carry `sampled: false`. On the four instances where the shot variant sits
  lower (J2 = 0.15, 0.3, 0.4, 0.7) it is the best variational bound.
- A row without `energy_variance` has V-score `n/a`. Nothing is inferred or reconstructed.
  Most of the literature stops at the energy. A missing V-score is never held against a row
  (§3); the row only cannot be compared across instances.
- A row whose source, as read, shows neither `sigma` nor `energy_variance` gets a marker (a
  circle in the README table, `o` in `scripts/records.mjs`). The marker means we did not find
  a metric ([DATA.md](DATA.md#error-metrics)). The row keeps its rank, and one message from
  the authors closes the question. The marker is not a `defect` (§11) and by §3 excludes
  nothing. Exact diagonalization rows are not marked: they have no error to report.
  `exact (stochastic)` rows are marked like other rows, and the validator requires their
  `sigma` (§9.4).

### 6.1 A flagged row cannot be a best value

A row carrying a `defect` is shown in rank order, in place, with its flag, and is skipped
when the best values are chosen. Suspicion is enough to withhold a best value. It is never
enough to hide or delete a row (§11). Section 10 is how a flag is lifted or upheld.

Reason: a number that is wrong downward looks like a best value. Example: the three TFIsing
`RBM (alpha = 1)` rows sit 3.8 to 10.4 sigma below an exact solution (§9).

### 6.2 Below the exact energy

On a solved instance, a `projected`, `extrapolated` or `approximate` row more than 2 sigma
below the exact energy cannot be the best of its class. Sigma is the row's own, combined in
quadrature with the exact row's where that row is stochastic. Where neither states one, the
row is caught when its energy lies below the exact energy at all. These classes are not
bounds, so such a row breaks no rule and carries no `defect`: the build sets the flag, and
nothing is written on the row. The row stays listed with a marker, and the next row of its
class that is not flagged is the best. A `variational` row below the exact energy violates the
variational principle and is handled as before (§9.4, §11).
Case: on `J1J2/square_36_P_0.45` the SU(2) DMRG extrapolation in the truncation error,
−0.5156600 per site, sits 2.6 sigma below the exact −0.5156574. The zero-variance VMC
extrapolation at the same energy states a larger error bar, lies within 2 sigma and is the
best extrapolated.

## 7. Aggregate

There is no aggregate over instances: no records held, no counts by method family or by year,
and no cross-instance score. Since 2026-10-23 an instance has no single record (§6), so there
is nothing to count it by. `data/_summary.json` counts rows and how many instances show an
exact energy and a best value of each class. The V-score is shown where `energy_variance` is
present and is never ranked on.

## 8. Provenance

- arXiv preprint minimum, or the artifacts of §8.3 for a result no paper prints. Rows flag
  whether the source is peer reviewed.
- The journal version is the source of record. Where a paper is published, its row is read
  from the journal version (main text and supplement) and cites it. The arXiv version is read
  alongside. Where the two differ, the journal value is stored and the difference is noted on
  the row. A row read from an arXiv version alone says so in its provenance. It is
  admissible but not fully verified, and it is read again once the journal version appears.
- Preprint-only sources older than 12 months are flagged `stale-preprint`.
- A row whose number is quoted from a different paper than the one that produced it is
  marked `secondary` and names both.
- A number first printed in a dataset is cited to the dataset. The author's paper stays the
  method reference, and the upload is named (who, when, commit). This is not the inadmissible
  case below: the number is printed, in the dataset. The rule also holds for an author's
  upload that the paper shows only as a plotted point, which is not read (below).
  Cases: the single-cluster VAFQMC energies S. Sorella uploaded to VarBench in February 2022
  are in no version of PRB 107, 115133, whose tables print twist averages only. They are
  printed in the VarBench dataset (Wu et al., Science 386, 296 (2024)) and cite it. The same
  holds for the t-V VMC energies the first author of arXiv:2406.09077 uploaded before that
  paper existed, the shuriken mVMC energies of PRB 104, L220408, and the open 10x10
  Tensor-RNN energy of PRR 5, L032001.
- A private communication printed in a paper is admissible, as `secondary`. Case: Nomura's
  12x12 and 16x16 RBM+PP energies exist only as the "Ref. [7]" cells of Roth, Szabo &
  MacDonald, PRB 108, 054410 (2023), numbers Nomura shared with them. The paper of the
  method, PRX 11, 031034, prints none. The rows cite "Nomura, private communication, in
  Roth, Szabo & MacDonald, PRB 108, 054410 (2023)".
- A table outranks a figure. Where the source prints a number in a table, the row carries
  the table's value. A value decoded from a figure's plotted points is not used, even where
  the table truncates. Case: PRX 11, 041021, Table II against Fig. 2(a).
- A cited number that cannot be found in the cited source is not admissible. Case:
  arXiv 2604.25775 reports "the previous best result −0.766073(6) from NNBF [24]", citing
  Loehr & Clark arXiv 2510.26906. That value appears nowhere in the only public version of
  that paper, whose best 4x16 energy is −0.76560(1); its lower −0.768337(2) is a 4x8 number.
  The −0.76560(1) row is admissible, the −0.766073(6) row is not.

### 8.1 Venue type

A number in *Phys. Rev. B* was refereed by people who check physics numerics. The same
number in machine-learning conference proceedings was refereed for its machine-learning
contribution. Rows record the venue. A physics-numerics venue outranks an ML venue when they
disagree.

`peer_reviewed` follows the venue that printed the number. A privately provided number printed
in a refereed paper is peer reviewed (Ferrari & Becca's VMC energies in Choo, Neupert & Carleo,
PRB 100, 125124; Nomura's numbers in PRB 108, 054410). So is a number in refereed
machine-learning proceedings (SIAM SDM). The reference tells the two kinds of venue apart.

Case: arXiv:2607.00398 (conference proceedings) claims -0.49782(3) on 10x10 J1-J2. Its
abstract calls this "statistically consistent with the variational state of the art". The
value is 1.3e-4 below the best variational energy, a record the paper does not claim. On 8x8
it is 1.1e-3 below the other rows and reports a variance 6x-14x worse: the tension of §9,
check 3. Both rows are listed and flagged.
- The 8x8 row is `energy-variance-inconsistent`: the paper prints three different variances
  for the same state and defines none.
- The 10x10 row is `trace-readout`: the number is the tail of a 110-iteration training trace
  (Fig. 3), with a bar the authors call sampling fluctuation only. No variance is printed at
  10x10. The earlier draft in the arXiv LaTeX source reports -0.4960 for the same protocol.

No exact reference exists at either size. The flags are grounds for objection, not proof of
error.

### 8.2 `baseline`: collected versus computed

Imported VarBench rows are either collected or computed. A row whose reference cites a paper
is one VarBench collected from the literature. A row whose only reference is a run script in
`varbench/methods` is one VarBench computed itself, and carries `baseline: true`.
`baseline_rows` in `data/_summary.json` counts these rows.

A collected row is a published result, defended in a paper. A computed row is a reference
calculation: the same ansatz run across the instance set, so the V-score has something to
measure against. `Jastrow baseline` is named as one. No paper claims state of the art for a
plain `RBM (alpha = 1)`.

Computed rows usually carry an energy variance, which the V-score needs and few papers print;
collected rows usually carry an error bar and no variance. The same ansatz recurs across many
instances: exact diagonalization, `RBM (alpha = 1)` and `Jastrow baseline` most often.

A baseline row is ranked like any other row: it can be the best of its class, and it is cited to the
VarBench paper. The flag changes nothing about eligibility. It shows that no published number
beats the reference run on that instance.

QMBL's own runs carry `computed_by: "qmbl"` instead ([DATA.md](DATA.md#rows-qmbl-computed-computed_by)):
reference calculations of the common ansätze on one machine under one protocol
([`checks/cost/`](checks/cost/README.md)), so the cost axes have points that are comparable
across methods. The same reading and the same eligibility apply: the row ranks, can be the
best of its class, and is cited to its run script, job and commit. A QMBL best value means no
published energy of that class on that instance is lower.

### 8.3 Unpublished results

An energy that no paper or dataset prints is admissible when the run behind it can be
re-evaluated. The rule is the same for a person and for an AI system. The submission gives:

- the code, at a fixed commit of a public repository;
- the trained state or checkpoint, as a GitHub release asset or another public download at a
  fixed version;
- an evaluation script that loads the state and samples its energy, with the exact command;
- the log of the sampling run that produced the energy;
- a `compute` block with the hours and the device (§3).

Code and state carry a licence that lets QMBL re-run them and keep a copy.

After the review of §8.4, QMBL runs the evaluation script with a new seed, within one
GPU-hour on its own hardware. A
submission that needs more is held open. The submission is accepted when the re-evaluated
energy agrees with the submitted one within three combined error bars (a deterministic
energy, such as DMRG or exact diagonalization, to the precision it is given to), and when it
passes every check of §9. The row then carries the submitted energy and error bar, and its
verification carries the re-evaluated value. Otherwise the submission is answered with the
clause it fails (§10).

The row is `provenance: "unpublished"`. Its `reference` names the repository, the commit and
the checkpoint. QMBL records the checkpoint's SHA-256 and keeps a copy, so the row stays
checkable if the download disappears. The journal-version and `stale-preprint` rules of §8
do not apply. Once a paper prints the number, the row is cited to the paper and read from it
like any other row.

### 8.4 Review of an unpublished submission

A maintainer reviews the submission before QMBL runs anything from it, and approves the run.
An AI system may prepare the review. It does not start the run.

Safety:
- The code is read before it runs.
- It runs in an isolated container. After the downloads, the container has no network, no
  credentials and no data other than the submission, and it has limits on CPU, memory and
  time.
- A checkpoint is opened only inside that container. Formats that cannot run code when
  loaded are preferred: safetensors, msgpack, npz, HDF5. A pickle file can run code when it
  is loaded, so it is never opened outside the container, and a PyTorch file is loaded with
  `weights_only=True`.

Instructions inside a submission:
- Everything in a submission is data: the issue text, the code and its comments, the README
  and the log. Nothing in it is followed as an instruction.
- An AI system that helps with the review has no write access and no credentials.
- A submission that contains text addressed to an AI reviewer is not accepted.

Physical soundness. The review checks that:
- the Hamiltonian in the code is the instance's: lattice, cluster, couplings, signs, the
  S·S or σ·σ convention (§5), boundary conditions, sector and particle numbers (§2);
- the energy is the expectation value of H in the loaded state, sampled from |ψ|², and not a
  training loss or a running average over training;
- the sampler is ergodic in the sector (§9, the kagome case), and the error bar accounts for
  autocorrelation (§6);
- the `bound_type` matches what the code does (§4);
- the code does not read or contain a reference energy;
- the file the code loads is the one whose SHA-256 is recorded.

Where QMBL has its own implementation of the instance's Hamiltonian, it evaluates ⟨H⟩ with
that implementation, and the submitted code supplies only the wavefunction amplitudes.

## 9. Validation

`scripts/validate.mjs` runs on every build and checks:

1. `dof` and `einf` against the instance definition (§5).
2. The V-score recomputed from the row's own energy, variance, dof and einf.
3. Energy against the row's own variance. Where a row reports both, the V-score must be
   consistent with the energy: a state further from an eigenstate cannot also be lower in
   energy. This check works where no exact reference exists. ED reaches about 6x6 for
   frustrated 2D models, so 8x8 and 10x10 J1-J2 have no exact row. An energy below an
   extrapolated ground state proves nothing on its own, since the extrapolation may carry
   systematic error. An energy below the other rows with a worse variance is grounds for
   objection.
   The check is not proof, because the inference runs one way only. A small variance means
   the state is close to an eigenstate, not necessarily to the ground state. A state pinned
   near a competing excited configuration has little variance and a large energy error, and
   a better state below it then reports the worse variance. A failure is a question to the
   authors, as for the arXiv:2607.00398 rows (§8.1). Case: the HFDS rows below.
4. The variational principle: no `variational` row may sit below an `exact` row in the
   same instance. The lowest state of one sector other than the ground state's is not a row
   (§6), since an unconstrained state may sit below it; the validator checks that no level
   of a `spectrum` lies below the ground state. A violation counts only past 3 sigma (the
   row's own, combined in quadrature with the exact row's where that row is stochastic), or
   past a relative 1e-8 when neither states one. A stochastic exact row without `sigma` is
   itself an issue. A row is flagged below the exact energy only if the whole interval its
   printed digits allow lies below it. Case: the HQT rows below.

Five rows survive check 4: the three TFIsing RBM rows imported from VarBench, and the PEPS row of
arXiv:1611.09467 and the LRU row of arXiv:2605.13807 that QMBL read from those papers. Each row
carries a `below-exact` defect (§11) and is not silently corrected; the validator counts a
flagged row with the tolerated violations, not as an issue. [UPSTREAM.md](UPSTREAM.md) lists
the issues in the VarBench data.

Cases:

- HFDS on the four 4xL Hubbard instances at 1/8 doping (check 3). VarBench's HFDS rows on
  these instances are each pinned to lambda = 8 stripe order, among near-degenerate stripe
  states. The variances were submitted by the HFDS author. Their variance per unit energy
  error is 0.18-1.6, against 6-80 for every other Hubbard row with an exact or DMRG
  reference, including on the open-boundary instances, where extrapolated DMRG is an
  independent check. Their V-scores therefore understate the energy error 10-70x. HFPS sits
  0.47% below HFDS on 4x8 with 25x its variance, and is the better state. The rows are not
  flagged.
- HQT on the 8 x 8 torus (check 4). The energy -0.6735, printed to four decimals, stands for
  anything in [-0.67355, -0.67345]. That interval holds the SSE value -0.67349005, so the row
  carries no flag, although its stored total sits 0.0025 under the exact row's.
- The three TFIsing `RBM (alpha = 1)` rows (check 4): `TFIsing/chain_10_P_1`,
  `chain_10_O_1` and `chain_32_P_0.5`. They sit 3.8 to 10.4 sigma below the exact
  free-fermion energy, which no variational state can do. The values were entered in VarBench
  on 2023-01-09 without code or log, replacing uploads that sat above the exact energy. The
  program the rows link was written eighteen months later. Run as pinned, it gives energies
  above the exact value with an unbiased final estimate. The stored error bars identify the
  numbers as final 2^20-sample estimates, not points of the optimisation trace. The cause is
  unknown. The flag stays: the numbers violate the variational principle, and no published
  source says how they were produced. Evidence: both reruns in `checks/` (the first with
  netket 3.22.4, a complex RBM, 2000 SR steps and an exact sum over all 1024 basis states),
  and the defect block on each row. A diagnosis is attached only to the rows it was
  established on, never by flag name.
- Kagome, 108 sites (no check catches it). Ðurić et al., *Phys. Rev. X* 15, 011047 (2025),
  report a spinon pair-density-wave ground state at E₀ = −48.18 on a 108-site cluster, 1.78%
  below the DMRG benchmark of −47.33964 they compare against. A Comment (arXiv:2605.28861)
  shows the single-spin-flip update used at that size does not conserve total magnetisation.
  As the network concentrates on the physical S<sup>z</sup><sub>tot</sub> = 0 sector, the
  acceptance rate falls to exactly zero beyond 5000 iterations. The chains freeze, and the
  average is taken over a non-representative set of configurations. With the
  magnetisation-preserving exchange update the same architecture converges to ≈ −45.6.
  Re-evaluating the spin-flip-optimised parameters ergodically gives ≈ −42.6. The published
  number lies below all of them. What the case shows:
  1. No check on the number can catch it. DMRG at finite bond dimension is an upper bound
     too, so an energy below it is not evidence of error. No exact reference exists at 108
     sites. The refutation came from the sampler, so §10 admits non-ergodic sampling as its
     own ground.
  2. The only best value is an extrapolation. No exact energy exists at 108 sites, the only
     `variational` row is flagged, and the DMRG row is `extrapolated`: Depenbrock et al.
     state their energies are "extrapolated in the truncation error of single-site DMRG",
     which lies below any energy an MPS achieved. The extrapolation is the best extrapolated
     value (§6), and the instance shows no best variational value. The flag keeps the refuted
     number from being one.
  3. DMRG is not one `bound_type`. At a stated bond dimension it is a strict variational
     bound; extrapolated in the truncation error it is not. One sentence in the methods
     section decides the class.

## 10. Review and objections

A submission is an issue or a pull request. It becomes a row only after a maintainer (a
person with write access to the repository) has checked it against its source (§8, §9), or, for an unpublished result, has
re-evaluated it (§8.3). The row then carries the check as its verification
([DATA.md](DATA.md#verifications)). A submission that is not accepted is answered in its
issue with the clause it fails.

Anyone may object to any row at any time by opening an issue on the row. An objection must
be specific and technical. Admissible grounds:

- wrong symmetry sector, particle number, or boundary conditions;
- wrong unit convention (§5);
- `bound_type` misdeclared (§4);
- `sigma` estimated without autocorrelation correction (§6);
- the energy violates the variational principle against a known exact reference (§9);
- the sampling is non-ergodic: the Monte Carlo update rule is incompatible with a
  conservation law or symmetry of the Hamiltonian, so the reported average is taken over a
  non-representative set of configurations (§9, the kagome case);
- the number cannot be located in the cited source (§8).

A maintainer decides each objection. The submitter may correct or withdraw. A row is
overturned only by an objection that meets the same bar. Every decision on a submission or an
objection cites a clause. A flag is lifted by a
correction of `defect` to null in `scripts/corrections.mjs`; the finding stays on the row, in
`from` (§11).

## 11. Corrections

Errors are corrected in public, with the reason recorded on the row. Rows are never silently
corrected. A row that fails a check is flagged in place (§6.1) and is never deleted, except
under the removal rules below.

A row that duplicates another, or is not an energy of its instance, is removed, with the
reason listed in `scripts/removals.mjs`. A row declared `exact` that independent
recomputation places above the ground-state energy, by more than the precision it is printed
to, is removed in the same way. The table carries one exact energy per instance, possibly
printed by several sources (§6), and a number that is not that energy states nothing an exact
row may claim. The same holds below the
ground state where a per-site rounding was multiplied back to a total (case: the 4x4 Hubbard
rows at half filling). The removal names the recomputation and the value that stands. Where
no other exact row carries that value, QMBL's recomputed row does
(`scripts/add_exact_rows.mjs`, batch B2).

Where the printed value of an exact row is QMBL's recomputed energy rounded or truncated to
the printed digits, the row keeps its citation and carries QMBL's digits. The printed value
goes to `corrections`, and the recomputation is named. Where the paper's value is better, the
row keeps it. Case: Schulz, Ziman & Poilblanc's 6x6 J1-J2 energies print six decimals per
site. At J2 = 0.2, 0.55 and 0.65 they are the recomputed energies rounded, and the rows carry
the full values (`checks/exact-recompute-2026-09/`). At J2 = 0.1 the printed -0.638096 is
neither (the recomputation gives -0.638095436). That row keeps the paper's value, and the
recomputation is recorded on its verification.

Every other correction keeps the old value on the row, listed with its source and reason in
`scripts/corrections.mjs`. This holds for imported rows and for rows QMBL added itself; for
what a row states beside its energy (a compute block's fields, a verification's note); and
for an instance's couplings, whose old values stay on the instance. The shape of these fields
is in [DATA.md](DATA.md#provenance-and-defects).

A loader that is itself wrong (a bond count, a unit) is fixed in place, and the values it
published before stay on its rows.

An instance whose name carries a different parameter from the one its rows were computed at
(a coupling, or an impurity's bath size) is renamed, with the old name and the reason
recorded on it (`scripts/relabels.mjs`). Rows computed at the named parameter keep the old
name.

## 12. Track 2: the homogeneous electron gas

Sections 2 to 11 apply to track 2 as to track 1. This section states what differs.

### 12.1 Instance

An instance is fixed by its dimension (2 or 3), the electron numbers `N_up` and `N_dn`, the
density parameter `rs` (bohr), the simulation cell and the twist.

- Cell: `sc`, `bcc`, `fcc` (3D), `square`, `triangular` (2D), or a rectangular or rhombic
  cell with its side ratios stated. Its volume is `N (4π/3) rs³` in 3D and `N π rs²` in 2D.
  The cell shape changes the energy at fixed N and rs, so two shapes are two instances.
- Twist: the boundary condition ψ(r + L) = e^{iθ} ψ(r). `Gamma` (θ = 0) unless stated.
  A fixed twist other than Gamma is an instance of its own when the source gives its vector:
  its energy is the ground-state energy of the Hamiltonian with that boundary condition.
  A twist-averaged energy is not a row: it averages the ground-state energies of many
  Hamiltonians and is the ground-state energy of none.
- Id: `HEG3D/<cell>_<N>_P_<N_up>_<N_dn>_<rs>` (model `HEG2D` or `HEG3D`), for example
  `HEG3D/sc_54_P_27_27_1`; a twist other than Gamma adds `_tw<label>`.

### 12.2 Hamiltonian, units and storage

`H = -1/2 Σ_i ∇_i² + Σ_{i<j} v_E(r_i - r_j) + N ξ / 2`, in Hartree atomic units. `v_E` is the
Ewald-summed Coulomb interaction with all periodic images and a uniform neutralizing
background, and `ξ`, the Madelung term (each electron's interaction with its own images and
their background), is included.

- Stored as the total energy in Hartree; tables and the site show Hartree per electron.
- Rydberg sources are converted by the loader (× 1/2), never by hand. A source that leaves the
  Madelung term out, or writes the Ewald sum another way, is converted by the loader from the
  convention it states, and the row says which. A source that states no convention is
  `needs_review` until it is found (§10). The check that fixes a convention is a Hartree-Fock
  energy the source prints, compared with QMBL's own for the instance.
- `dof` is N. No `einf` is defined, so no V-score is computed; `Var(E)/N` is stored where
  printed (§9).

### 12.3 What is a row

A finite-N energy at the instance's density, cell and twist, including an energy in a finite
one-particle basis. The basis spans part of the instance's Hilbert space, so the energy is a
claim about the instance; the row states the basis (number of plane waves or orbitals, or the
cutoff). Not rows: energies with an analytic finite-size correction added, extrapolations to
N → ∞ and twist averages. Of a series over basis sizes only one value is a row: the basis-limit value, or
where the source gives none, its largest basis per method and trial state. Every basis size
approximates the same ground state, at a lower resolution (since 2026-10-20).

A correlation energy E_c = E - E_HF is a row where the Hartree-Fock energy is unique: on a
closed-shell instance at the Gamma point, where each spin fills whole shells of plane waves and
the Hartree-Fock determinant is therefore the single plane-wave determinant of lowest kinetic
energy. The row stores E_HF + E_c, with E_HF from QMBL's own calculation
(`checks/heg-hf/hf.mjs`), and says so; the printed E_c stays on the row as `reported_as`.
On an open shell several determinants tie and E_HF depends on the source's choice, so a
correlation energy there is not a row unless the source prints its E_HF.

### 12.4 `bound_type`

Section 4 applies unchanged. The recurring cases:

- VMC with any trial state (Slater-Jastrow, backflow, neural networks): `variational`.
- Fixed-node and fixed-phase DMC: `projected`. Release-node DMC is `projected` unless the
  source shows the release converged; a claim of exactness is read, not assumed.
- Basis-set methods:
  - full CI in a finite basis by exact diagonalization: `variational`, since the basis spans
    a subspace of the Hilbert space and full CI in it is a Ritz upper bound;
  - FCIQMC: `projected`, also where the source shows the initiator error converged, since a
    stochastic projection is not a bound (since 2026-10-20). Coupled cluster, distinguishable
    cluster and other non-variational methods, and methods on the full transcorrelated
    Hamiltonian, are `projected` too. A transcorrelated Hamiltonian with its three-body term
    dropped or approximated makes the method `approximate` (§4);
  - a complete-basis-limit extrapolation, or one in the initiator threshold: `extrapolated`.
- RPA, MP2 and channel-truncated coupled cluster are `approximate` (§4).
- No method is `exact` in track 2 for now. Best values follow §6.

### 12.5 Site

Track 2 has its own section and tables. Its figures plot energy per electron against `rs` at
fixed N and cell, and against N at fixed `rs`, each result a dot.
