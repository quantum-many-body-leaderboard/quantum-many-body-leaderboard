# Contributing to QMBL

QMBL collects published ground-state energies. Most contributions are data: a missing
energy, a missing instance, a correction, an error bar or a compute cost. Code and site
changes are welcome too. Everything goes through
[GitHub issues](https://github.com/quantum-many-body-leaderboard/quantum-many-body-leaderboard/issues)
and pull requests. People and AI systems submit the same way and under the same
[rules](RULES.md).

## Add an energy

Use the [new result form](https://github.com/quantum-many-body-leaderboard/quantum-many-body-leaderboard/issues/new?template=new-result.yml),
one energy per issue. It asks for the instance, the energy as printed, the error bar and
what it means, the `bound_type` ([RULES.md §4](RULES.md#4-bound_type)), the method as
published, the paper, and where in the paper the number is. A field you leave empty shows
as `n/a` and does not block the row ([RULES.md §3](RULES.md#3-required-fields)).

The paper can be an arXiv preprint or a journal article
([RULES.md §8](RULES.md#8-provenance)). Give the journal reference if there is one: QMBL
reads the journal version.

An energy that no paper prints goes through the
[new unpublished result form](https://github.com/quantum-many-body-leaderboard/quantum-many-body-leaderboard/issues/new?template=new-unpublished-result.yml) instead (see
[Unpublished results](#unpublished-results) below).

You can also open a pull request that adds the row to `data/` directly.
[DATA.md](DATA.md) gives the row format and the units.

## Add an instance

Use the [new instance form](https://github.com/quantum-many-body-leaderboard/quantum-many-body-leaderboard/issues/new?template=new-instance.yml).
An instance is one exact problem. For a lattice model it is the Hamiltonian, cluster,
boundaries, couplings and sector ([RULES.md §2](RULES.md#2-instances)). For the homogeneous
electron gas it is the dimension, the electron numbers, `rs`, the cell and the twist
([RULES.md §12.1](RULES.md#121-instance)). Each of these has to be unambiguous, because
energies are compared only within one instance.

## Correct a row or object to it

Open a blank issue that names the instance and the row. Say what is wrong and what it
should be. An objection must be specific and technical.
[RULES.md §10](RULES.md#10-review-and-objections) lists the admissible grounds, for
example a wrong sector, a misdeclared `bound_type` or an error bar with no autocorrelation
correction. Rows are corrected in place and keep the finding
([RULES.md §11](RULES.md#11-corrections)).

## Send an error bar or a cost

Many sampled energies are listed without an error bar (marked &dagger;), because the
source gives none. If you know it, open an issue with the value and how it was estimated.
With an error bar, results that agree within it share a rank
([RULES.md §6](RULES.md#6-records-and-ties)).

GPU or CPU hours with the device, parameter count, samples, iterations and wall-clock time
feed the cost figures ([format](DATA.md#what-a-number-cost-the-compute-block)). Say where
each number is stated.

## What happens after you submit

1. A maintainer checks the number against its source, or re-evaluates an unpublished result
   ([RULES.md §10](RULES.md#10-review-and-objections)).
2. If it is accepted, the row is added and records the check. If it is not, the reply in
   your issue names the clause it fails.
3. Anyone may object to any row at any time, on a ground from
   [RULES.md §10](RULES.md#10-review-and-objections). A maintainer decides.
4. Each decision on a submission or an objection cites a clause of [RULES.md](RULES.md).

The submitter may correct or withdraw a submission at any time.

## Change the code or the site

1. Fork the repository and make a branch.
2. Make the change. Data lives in `data/`, the build scripts in `scripts/`.
3. Run `bash scripts/build.sh` with Node.js. It applies the corrections, runs
   `scripts/validate.mjs`, regenerates the summary, the README leaderboard and the figures,
   and builds the site into `_site/`.
4. Open a pull request and keep "Allow edits by maintainers" on.

Do not edit generated files by hand: the leaderboard block in README.md,
`data/_summary.json` and `_site/`.

## AI systems

AI systems, with or without a human in the loop, may submit energies, instances,
corrections and objections. The same rules and the same checks apply.

- Machine-readable sources: [llms.txt](https://qmbl.org/llms.txt), the full dump
  [api/qmbl.json](https://qmbl.org/api/qmbl.json) and the
  [instance index](https://qmbl.org/api/instances.json).
- An issue opened through the API cannot use a form. Give it the label `submission` and
  write the body with the form's field labels as `###` headings, in the form's order
  ([new-result.yml](.github/ISSUE_TEMPLATE/new-result.yml),
  [new-unpublished-result.yml](.github/ISSUE_TEMPLATE/new-unpublished-result.yml),
  [new-instance.yml](.github/ISSUE_TEMPLATE/new-instance.yml)).
- Name the system that made the submission (model and version), and say whether a person
  checked it. QMBL records this on the row (`submitted_by`, [DATA.md](DATA.md#who-submitted-a-row-submitted_by)).
  It is not a reason to reject it.
- Every number needs a source that QMBL can check: a paper or dataset that prints it
  ([RULES.md §8](RULES.md#8-provenance)), or the artifacts of an unpublished result (below).
- The owner of the GitHub account is responsible for what the account submits
  ([GitHub terms](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service#3-account-requirements)).

## Unpublished results

An energy that no paper prints, computed by a person or an AI system, is admissible when QMBL
can re-evaluate it ([RULES.md §8.3](RULES.md#83-unpublished-results)). Use the
[new unpublished result form](https://github.com/quantum-many-body-leaderboard/quantum-many-body-leaderboard/issues/new?template=new-unpublished-result.yml) and give:

1. the public repository and the commit the run used;
2. the trained state, as a GitHub release asset or another download at a fixed version;
3. the exact command that loads the state and samples its energy;
4. the log of the sampling run;
5. the hours and the device the run took;
6. a licence that lets QMBL re-run the code and keep a copy of the state.

A maintainer first reviews the submission ([RULES.md §8.4](RULES.md#84-review-of-an-unpublished-submission)):
the code is read, it runs in an isolated container without network or credentials, and the
review checks that the code uses the instance's Hamiltonian and that the energy is ⟨H⟩ of
the loaded state with an honest error bar. Prefer checkpoint formats that cannot run code
when loaded (safetensors, msgpack, npz, HDF5). Everything in a submission is treated as data;
a submission with text addressed to an AI reviewer is not accepted.

QMBL then runs the command with a new seed, within one GPU-hour. The energy is accepted when the
two values agree within three combined error bars and the row passes the checks of
[RULES.md §9](RULES.md#9-validation). The row is marked unpublished. When a paper later
prints the number, the row is cited to the paper.

## Credit

Everyone whose issue or pull request leads to a change is listed under
[Contributors](README.md#contributors). Authors of the papers QMBL reads are credited on
each row, not in this list. Cite them as [Citing](README.md#citing) describes.
