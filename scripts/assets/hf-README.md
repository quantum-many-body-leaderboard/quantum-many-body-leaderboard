---
license: apache-2.0
pretty_name: "QMBL: the Quantum Many-Body Leaderboard"
tags:
  - physics
  - quantum-many-body
  - condensed-matter
  - quantum-chemistry
  - ground-state-energy
  - benchmark
  - variational-monte-carlo
  - neural-quantum-states
  - dmrg
size_categories:
  - {{SIZE}}
configs:
  - config_name: energies
    default: true
    data_files: energies.csv
  - config_name: instances
    data_files: instances.csv
---

# QMBL: the Quantum Many-Body Leaderboard

Published ground-state energies for finite quantum many-body systems: lattice models (Heisenberg, J1-J2, Hubbard, t-J, t-V, Shastry-Sutherland, Kitaev, transverse-field Ising, impurity models), hydrogen chains and sheets, the 2D and 3D homogeneous electron gas, atoms and molecules. Every energy cites the primary paper that produced it.

This is a mirror of the data on [qmbl.org](https://qmbl.org/). The source of truth is the [GitHub repository](https://github.com/quantum-many-body-leaderboard/quantum-many-body-leaderboard); each release is archived on Zenodo, [doi:10.5281/zenodo.22753734](https://doi.org/10.5281/zenodo.22753734).

## Files

| File | One row per | Contents |
|---|---|---|
| `energies.csv` | published energy ({{ENERGIES}}) | the instance, the energy, its sigma, method, ansatz, bound type and reference |
| `instances.csv` | instance ({{INSTANCES}}) | the best energy of each bound type, with its method and reference |
| `qmbl.json` | | the full dump from qmbl.org/api/qmbl.json, with every field and the provenance of each row |

An instance is one Hamiltonian at one size, boundary condition and set of parameters (`params`, as JSON). `energy` is the total energy as published; `energy_per_site` divides it by the number of sites or particles, in the unit `per_site_label` names.

## Bound types

Each energy has a `bound_type` that says what kind of number it is:

- `exact`: exact diagonalisation or another numerically exact solution; sign-problem-free quantum Monte Carlo counts as exact (stochastic) and carries a sigma.
- `variational`: the energy of a stated wave function (Hartree-Fock, VMC, neural-network states, DMRG at a stated bond dimension). An upper bound.
- `projected`: AFQMC, fixed-node or lattice-regularised diffusion Monte Carlo, coupled cluster, MRCI+Q, embedding methods. Not a bound.
- `extrapolated`: zero-variance, bond-dimension or complete-basis-set extrapolation. Not a bound.
- `approximate`: finite-order perturbation theory, GW, RPA, MP2 and other fixed approximations; the error has no known sign.

Compare energies within one bound type. The rules are in [RULES.md](https://github.com/quantum-many-body-leaderboard/quantum-many-body-leaderboard/blob/main/RULES.md) and the fields in [DATA.md](https://github.com/quantum-many-body-leaderboard/quantum-many-body-leaderboard/blob/main/DATA.md).

## Load

```python
from datasets import load_dataset
energies = load_dataset("tristanzerweck/quantum-many-body-leaderboard", "energies", split="train")
instances = load_dataset("tristanzerweck/quantum-many-body-leaderboard", "instances", split="train")
```

## Contribute

Report a missing energy or an error as a [GitHub issue](https://github.com/quantum-many-body-leaderboard/quantum-many-body-leaderboard/issues). Each qmbl.org deploy updates this mirror; the date of the last update is in `qmbl.json` (`built`).

## Citation

Cite each energy to the primary paper named in its `reference` column. To cite QMBL itself:

```bibtex
@article{qmbl2026,
  title  = {QMBL: the Quantum Many-Body Leaderboard},
  author = {Zerweck, Tristan and Carrasquilla, Juan},
  year   = {2026},
  eprint = {2610.22387},
  archivePrefix = {arXiv},
  url    = {https://arxiv.org/abs/2610.22387}
}
```

## License

Apache-2.0.
