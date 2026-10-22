# Literature sweep: method

How published energies get into QMBL: papers are found, their text is committed, the numbers
are read from that text, written to a pass file, and the build converts and appends them.
What counts as a row, and which version of a paper is the source of record, is in
[RULES.md](RULES.md): instances in [§2](RULES.md#2-instances), `bound_type` in
[§4](RULES.md#4-bound_type), provenance and the journal version in
[§8](RULES.md#8-provenance), the electron gas in
[§12](RULES.md#12-track-2-the-homogeneous-electron-gas).

## 1. Finding papers

All tools are run by hand from the repository root. None is part of the build, and none
writes to `data/`.

- `scripts/sweep_search.mjs` runs keyword queries against arXiv and writes
  `sweep-candidates.tsv` and a per-query audit, `sweep-queries.tsv`.
  - It pages until it reaches the date floor (`--since`, default 2019-01-01).
  - A page cap that binds (`--max-pages`, default 40) is reported as TRUNCATED with the hit
    count it did not read. Raise `--max-pages` for those queries.
  - A failed request is a hard error: it is named in `sweep-queries.tsv`, printed, and the
    exit code is non-zero.
  - New candidates are merged into the existing file; `--fresh` replaces it.
  - The arXiv API and the arxiv.org search page are rate-limited separately. `--via auto`
    (the default) uses the API and falls back to the search page. The search page has no
    operator grouping, so each `A AND (B OR C)` query is expanded into flat AND queries.
- `scripts/harvest_refs.mjs <seed ids>` reads the bibliographies of seed papers and writes
  `sweep-refs.tsv`. Comparison tables and reviews cite results that keyword search misses.
- `scripts/cited_by.mjs --seed <arxiv-id|doi>` lists the papers citing a seed, from OpenAlex
  and Semantic Scholar merged, into `sweep-cites-<tag>.tsv`. A failed request is a hard
  error, so an outage cannot read as "no citing papers". This is how an instance that one
  paper defined is screened for later work.
- `scripts/scan_fulltext.mjs` scores the candidates on their full text and caches the arXiv
  HTML under `sources/`; it writes `sweep-fulltext.tsv`.
- `scripts/extract_claims.mjs` and `scripts/triage_claims.mjs` find sentences that claim a
  record ("state of the art", "lowest energy") and drop those that cannot map to a finite
  instance. They miss papers that print a table without such a sentence; the table harvest
  below does not.

These outputs are working files: they are gitignored and not read by the build.

## 2. Source text

A number is read from the paper's text as committed under `sources/`, never from an LLM
summary of a table.

- arXiv HTML is cached by `scan_fulltext.mjs`. arXiv has no HTML for most papers before
  about December 2023.
- `scripts/fetch_pdfs.mjs <arxiv-id> ...` downloads the PDF and extracts its text with pypdf
  into `sources/<id>.txt`. The text is committed; the PDF is gitignored. Layout mode keeps
  column positions and tells a minus sign from a missing entry; it is used unless it comes
  back much shorter than the default mode. The mode used is recorded in
  `sources/_extraction.tsv`.
- A journal version, a supplement or an authors' data file is committed under `sources/`
  the same way, with its origin in the file name.

## 3. Harvesting and matching tables

- `scripts/harvest_tables.mjs` takes every energy cell out of every data table in
  `sources/`, from the HTML table cells and from the pypdf layout text, and writes
  `sweep-tables.tsv`.
  - Zero-width characters and mathematical bold digits are normalised before parsing.
  - In layout text a dash is a minus sign before a digit and a missing entry otherwise.
  - Column alignment in PDF tables: a row with as many energies as header cells fixes one
    column offset per table, which is applied to the rows with missing entries.
- `scripts/match_tables.mjs` maps cells onto instances and ranks what is worth reading. It
  writes no row. With `--all` it keeps every cell and bands it against the instance:
  SUB-EXACT (below the exact energy), BEATS (below the record), FILLS (within 1% above it),
  WEAKER. `--tsv <file>` writes the worklist.
  - A cell that misses only by a unit convention is kept, with the factor named: 4 for Pauli
    against S·S, N for a total against a per-site energy.
  - Size: `harvest_tables.mjs` reads a bare integer alone in a row label as a linear size;
    on a chain the linear size is the site count; `L x W` matches in either order.
  - Boundary conditions must agree.
  - Couplings must agree: J2, V, h, the Hubbard filling and t′. A coupling is taken from the
    column header first, then the row label, then the caption, and one known only from the
    caption is marked as such. `alpha` is not read as a coupling (in NQS papers it is the
    hidden-unit density).
  - Papers rejected as a whole are listed in `REJECTED` in the script and counted, not
    matched. See [Rejected papers](#rejected-papers).
  - Values the instance already carries are removed.

Most papers state the lattice size in the caption or the body, not in the table, so many
papers have no cell with a size. Those are read by a person or an agent from the text.

## 4. Reading

The matcher only says which paper to open. Readers then go paper by paper through the
committed text and take every finite-size ground-state energy the paper prints on an
instance QMBL carries or should carry, not only records.

- **Convention check.** Before a paper's rows are written, a value it prints is compared with
  one QMBL already carries: its exact-diagonalization column against the stored exact rows,
  or, for the electron gas, its Hartree-Fock energy against QMBL's own (`checks/heg-hf/`).
  The check fixes the unit, the normalisation, the cell and the meaning of the coupling
  labels together.
- **Geometry.** The evidence names the lattice dimensions, not only the site count: an 8x32
  cylinder and the 16x16 torus both have 256 sites.
- **Error bars.** Sigma is parsed from the printed string: `(7)` is seven units of the last
  printed digit. A superscript citation next to the last digits is not part of the number.
- **Quoted numbers.** A number the paper quotes from another paper is read in that primary
  and is `secondary` only where the primary cannot be read ([RULES.md §8](RULES.md#8-provenance)).
  A rounded quote of an exact value is that value, not a new row.
- **Thermodynamic-limit values** (iPEPS, extrapolations to infinite size or ξ → ∞) are not
  rows on a finite instance ([RULES.md §2](RULES.md#2-instances)).
- **Method strings are data.** A method string decides whether a row counts as sampled or
  deterministic ([DATA.md](DATA.md#sampled-or-deterministic-sampled)), so it is copied as
  printed.
- **Second reading.** Every row that would take a record, sits below an exact energy, or was
  filed with low confidence is read a second time by a separate reader who tries to refute
  it.

## 5. Pass files

A pass is one reading of a set of papers. Its rows are data in one file under `passes/`,
applied by the build in date order:

| file | applied by | contents |
|---|---|---|
| `passes/rows/sweep-rows-YYYY-MM-DD[-label].json` | `scripts/add_allresults_rows.mjs` | rows, read per site |
| `passes/stored-rows/<date>-<label>.json` | `scripts/add_stored_rows.mjs` | rows already in the stored convention |
| `passes/coverage/sweep-coverage-YYYY-MM-DD[-cites].json` | `scripts/add_coverage.mjs` | [`coverage`](DATA.md#when-the-literature-was-last-checked-coverage) entries |
| `passes/compute/compute-rows-YYYY-MM-DD.json` | `scripts/add_compute.mjs` | [`compute`](DATA.md#what-a-number-cost-the-compute-block) blocks |
| `passes/error-metrics/error-metrics-YYYY-MM-DD.json` | `scripts/add_error_metrics.mjs` | [`error_metrics`](DATA.md#where-an-added-error-bar-or-variance-came-from-the-error_metrics-block) blocks |

A second pass on the same day takes a `-<label>` suffix. Each `sweep-rows` file is written
by a generator script, kept outside the repository with the pass's working notes, that re-finds
every printed string on its cited line of `sources/<id>.txt` and stops if it does not.

A `sweep-rows` file is a JSON array with one object per row:

| field | meaning |
|---|---|
| `instance_id` | the instance, `<model>/<name>` |
| `create` | the instance header (model, lattice, n_sites, boundary, params, ...), on the rows of a new instance |
| `eps`, `sigma_per_site` | energy and error bar per site, in the instance's per-site convention ([DATA.md](DATA.md#units-and-conventions)) |
| `var_per_site`, `var_rel` | variance as σ²/N, or relative variance; `variance_as_reported` is the printed form |
| `tol` | how close a stored row must be, per site, to count as the same number |
| `origin` | `own` (the paper's result) or `quoted` |
| `arxiv`, `reference`, `peer_reviewed` | the source |
| `method`, `bound_type` | as published, and its [`bound_type`](RULES.md#4-bound_type) |
| `reported_as`, `evidence`, `convention_check` | the printed string, where it was read, and the convention check |
| `confidence`, `verified_by` | the reader's confidence and who read it (first and second reading) |
| `compute`, `defect` | an optional `compute` block and defect flag |
| `same_value_distinct_method` | optional, `true` on a second method of the same paper that printed the same value; without it that row counts as one the instance already carries |

`add_allresults_rows.mjs` converts `eps` and `sigma_per_site` into the instance's stored
convention, skips a value the instance already carries, and writes each row with
`source: sweep-allresults-<date>`.

A `stored-rows` file holds the rows of the passes of 2026-09-10 to 2026-09-15 as they are
stored: `{ about, instances: [{ instance_id, create, rows }] }`. `about` names the source
tables and the unit conversion. `add_stored_rows.mjs` appends the rows and fills `dof`,
`einf` and `v_score`. New passes use `sweep-rows`.

## 6. Running a pass

1. Run the finding tools of section 1 for the families or seeds of the pass.
2. Fetch and commit the text of every paper to read (`fetch_pdfs.mjs`, `scan_fulltext.mjs`).
3. Run `harvest_tables.mjs`, then `match_tables.mjs --all --tsv <worklist>`.
4. Read each paper (section 4) and write the generator; it writes `passes/rows/sweep-rows-<date>.json`.
5. Add method labels for the new method strings to `scripts/method_names.mjs`.
6. Run `bash scripts/build.sh` and read its output: duplicates skipped, new instances,
   `validate.mjs` issues.
7. Have the second reading done; its results go to `scripts/corrections.mjs` and
   `scripts/verifications.mjs`.
8. If the pass screened papers for instances, add a `sweep-coverage` file.

## Passes

| file | what was read |
|---|---|
| `passes/stored-rows/*.json` (eight files) | the first passes: claim sentences, comparison tables and PDFs read on 2026-09-10 to 2026-09-15; each file's `about` names its tables |
| `sweep-rows-2026-09-15.json` | every number the table harvest of the cached sources mapped onto an instance, including Gong et al. 2014 Table I (DMRG on J1-J2 tori) and Hu, Becca, Parola & Sorella 2013 Tables I-IV |
| `sweep-rows-2026-09-17.json` | Wang, He & Lu, PRB 109, 245120 (arXiv:2308.09664) |
| `sweep-rows-2026-09-28.json` | tables read before their J1-J2 instances existed: Golubev et al. (arXiv:2606.04558) Table I, Chen et al. (arXiv:2206.14307) Tables 2, 4, 5, Nomura & Imada (PRX 11, 031034) Table I, Schulz, Ziman & Poilblanc 1996 Table II |
| `sweep-rows-2026-09-28-triangular.json` | Table 1 of arXiv:2602.02665 and the primaries it quotes |
| `sweep-rows-2026-10-07-records.json` | J1-J2 away from J2 = 0.5, 6x48 Hubbard stripes, 16x16 Hubbard with t′ |
| `sweep-rows-2026-10-16-nqspapers.json` | nine papers behind lattice results another leaderboard lists |
| `sweep-rows-2026-10-16-heg.json` | electron gas: nine NQS papers |
| `sweep-rows-2026-10-17-heglit.json` | electron gas: the primaries those papers compare with (DMC, FCIQMC, coupled cluster) |
| `sweep-rows-2026-10-19-hegcorr.json` | electron gas: correlation energies stored as QMBL Hartree-Fock + E_c ([RULES.md §12](RULES.md#12-track-2-the-homogeneous-electron-gas)) |
| `sweep-rows-2026-10-19-heglit2.json` | electron gas: papers citing the 2026-10-17 primaries |
| `sweep-rows-2026-10-20-azadism.json` | electron gas: the bcc Wigner crystals (N = 64, 216, 512) of the Supplemental Material of arXiv:2201.08743, read from the publisher's file; its fluid tables print single-twist energies on open shells without the twist vector and are held |
| `sweep-rows-2026-10-20-butler.json` | electron gas: the largest-basis CCD of the data release of arXiv:2403.04645, on the instances other papers also carry |
| `sweep-rows-2026-10-21-marino.json` | Marino, Becca & Tocchio (arXiv:2111.04623) Table 2 at t′ ≠ 0: stripe and uniform VMC at U = 12 on 6 × 48 tori, and on 6 × 40 for the λ = 5 stripes; the row printed t′/t = 0.5 between 0 and 0.1 is held |

The five passes of 2026-10-16 to 2026-10-19 had their second reading on 2026-10-19 (1079 rows, eight reader groups,
each with a skeptic). No energy was misread. The fixes went into the pass generators, so the pass files above carry
them: error bars kept to their printed digits (the generators had rounded them to two digits), method labels that a
text cleaner had cut, variances the papers print, and three DMRG energies a paper quotes, now cited to the paper that
computed them. 30 duplicates and two fits a paper prints only to reject them are in `scripts/removals.mjs`; two
fixed-node energies the source calls biased are flagged in `scripts/defects.mjs`; 699 rows carry the reading in
`scripts/verifications.mjs`. Rulings of 2026-10-20: FCIQMC is `projected` even with its initiator error converged, and
methods on a transcorrelated Hamiltonian without its three-body term are `approximate`.

## Rejected papers

Every energy in these papers is a thermodynamic-limit value or a lower bound, so no value
maps onto a finite instance. `match_tables.mjs` suppresses them.

- arXiv:2211.16932: iPEPS/iPESS on the infinite shuriken lattice. Its −0.440908 per site
  would sit below the records of the 96-, 216- and 384-site shuriken instances.
- arXiv:2510.04907: iPEPS on the infinite triangular and kagome lattices; the kagome value
  is an extrapolation to ξ → ∞.
- arXiv:2310.05844 and arXiv:2604.01555: SDP lower bounds and reference values quoted from
  other work.
- arXiv:1307.5794 (Spink, Needs & Drummond, PRB 88, 085121), cond-mat/0205339 (Zong, Lin & Ceperley, PRE 66, 036703) and
  cond-mat/0101339 (Lin, Zong & Ceperley, PRE 64, 016702): every finite-N energy printed is twist-averaged or
  extrapolated to N → ∞, or shown only in figures.
- Data releases: only the largest basis of a basis-size series is a row, since every basis size approximates the same
  ground state (2026-10-20). The release of arXiv:1706.09923 (doi:10.17863/CAM.14336) holds several runs per largest
  basis, many marked by the authors' own analysis, and its largest bases for CCSDTQ and above (66-162 spin orbitals)
  feed the paper's extrapolation; the paper's basis-limit values, which QMBL carries, are its results. The "mbpt"
  column of arXiv:2403.04645's release is not used (it does not approach the MP2 basis limit).
- arXiv:2505.20406 Tables 2 and 6 print V-scores and thermodynamic-limit energies; its
  finite-size energies are plotted, except at L = 6 (Table V). The rows at L = 12 to 30 come
  from the authors' data release (`scripts/add_repo_data_rows.mjs`).
