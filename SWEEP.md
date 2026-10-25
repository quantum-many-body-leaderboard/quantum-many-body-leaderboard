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
| `passes/tdl-rows/tdl-rows-YYYY-MM-DD[-label].json` | `scripts/add_tdl_rows.mjs` | track 4 rows, read per site ([DATA.md](DATA.md#the-thermodynamic-limit-tdl)): `model`, `lattice`, `params` name the instance; `how_tdl`; otherwise the fields of a `sweep-rows` file |
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
| `arxiv`, `reference`, `peer_reviewed` | the source; `doi` instead of `arxiv` for a source with no arXiv version |
| `read_method` | optional: how the source was read, where it was not the arXiv text |
| `method`, `bound_type` | as published, and its [`bound_type`](RULES.md#4-bound_type) |
| `reported_as`, `evidence`, `convention_check` | the printed string, where it was read, and the convention check |
| `confidence`, `verified_by` | the reader's confidence and who read it (first and second reading) |
| `compute`, `defect` | an optional `compute` block and defect flag |
| `same_value_distinct_method` | optional, `true` on a second method of the same paper that printed the same value; without it that row counts as one the instance already carries |
| `independent_exact` | optional, `true` on an `own` exact row whose source diagonalized the cluster itself and printed an exact energy the instance already carries ([RULES.md §6](RULES.md#6-best-values-and-ties)); without it that row counts as one the instance already carries |
| `venue_type` | optional, `proceedings` or `book_chapter` where the number was printed in neither a journal nor an arXiv preprint ([DATA.md](DATA.md#provenance-and-defects)); copied to the row |
| `precision_per_site` | optional: one unit in the last printed digit of an exact energy without an error bar, per site; stored as the row's `precision` |
| `bound_type_reason` | optional: why the row has its `bound_type`, where the source says so (the isoTNS rows of arXiv:2112.08394); without it the loader writes the generic reason |
| `scale`, `source_couplings` | optional: the source's Hamiltonian is the instance's times `scale` (couplings normalised, [RULES.md §2.1](RULES.md#21-instance-names)); `eps`, `sigma_per_site`, `var_per_site`, `precision_per_site` and `tol` are as printed, and the loader divides them by `scale` and keeps the factor and the source's couplings on the row as `normalised` |
| `artifacts` | optional: the code the source names for this row, with `read_from` (quote, location, checked_on, pass) as in [DATA.md](DATA.md#the-code-behind-a-row-artifacts); copied to the row |

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
| `sweep-rows-2026-10-20-families.json` | new families ([RULES.md §2.1](RULES.md#21-instance-names)): Kitaev (arXiv:1411.5198 Tables I-II, 2112.08394 Table III, 2009.04129 Supplement), Shastry-Sutherland (cond-mat/0605464 Tables I-II, 2311.16889 Table I, 2505.03466, 2309.10955 Table III, 2503.20122 Table VI, cond-mat/0309368), honeycomb J1-J2 (2110.06390 Table IV, 2206.07370 Table 1); written by `scripts/families_2026_10_20.mjs` |
| `sweep-rows-2026-10-21-marino.json` | Marino, Becca & Tocchio (arXiv:2111.04623) Table 2 at t′ ≠ 0: stripe and uniform VMC at U = 12 on 6 × 48 tori, and on 6 × 40 for the λ = 5 stripes; the row printed t′/t = 0.5 between 0 and 0.1 is held |
| `sweep-rows-2026-10-22-quoted.json` | the primaries behind held t′ = −0.2 quotes: Gu et al. (Nat. Commun. 17, 7838; arXiv:2507.02644) Supplementary Table 5, PBC energies at t′ = 0 and −0.2 on 8 × 8 to 32 × 8, and the two zero-variance extrapolations of the main text, read in the journal version (the arXiv text has no raw-data table); Liang (PRB 113, 155121; arXiv:2507.01856) Tables V and VI at t′ = −0.2. Held: Gu et al.'s OBC table (doping not printed) and 16 × 8 cylinder (doping and periodic direction not printed), and four error-bar values quoted by arXiv:2609.22618 that PRB 113, 155121 does not print |
| `sweep-rows-2026-10-22-tc.json` | electron gas: Tanatar & Ceperley, PRB 39, 5005 (1989), no arXiv version, Tables I and II: VMC energies of the normal (N = 26-114, rs = 1-50) and fully polarized (N = 21-113, rs = 5-75) fluids in square cells, and fixed-node GFMC at N = 58 and 57. Read from the text layer of the publisher's 1989 scan, every number checked against the page image; Rydberg, Madelung term included (QMBL's HF check). Held: Table III, the crystal, whose cell is not printed |
| `sweep-rows-2026-10-22-instances.json` | the rows the 2026-10-16 NQS-papers pass held for want of an instance, on the 22 instances created for them: 32 × 16 at t′ = 0 and −0.2, 32 × 32, the open 16 × 16 at t′ = 0 and −0.2, attractive U = −2 and −8 at δ = 1/8 (arXiv:2604.25775, arXiv:2609.22618); 12 × 12 and the 12√2 × 12√2 tilted torus at δ = 1/6, and 24 × 4 (arXiv:2511.07566); 4 × 4 at n = 7/8 (arXiv:2111.10420, arXiv:2507.10705); pyrochlore 4 × 2²× {3, 4, 6} and 4 × 2 × 4 × 6 (arXiv:2101.08787). Written by the 2026-10-16 generator in its `QMBL_PASS=2026-10-22-instances` mode; Table II of arXiv:2604.25775 names each stripe state by orientation and filling |
| `sweep-rows-2026-10-22-tj.json` | the first rows of the t-J family (RULES.md §2.1): 145 energies on 27 new instances from 12 papers, written by `scripts/tj_2026_10_22.mjs`; see [The t-J pass](#the-t-j-pass-2026-10-22) |
| `sweep-rows-2026-10-27-psrnqs.json` | Merali, Hibat-Allah et al. (arXiv:2605.13807) Table VI: the 2D minGRU energies (iterative retraining, open square Heisenberg) at the 19 sizes L = 6 to 52 not yet carried (10 × 10 and 16 × 16 came with the 2026-09-15 pass), with each size's A100 training steps and cumulative time; 7 new instances, L = 30, 36, 40, 44, 46, 50, 52, where the table prints no QMC value. Single reading |

The five passes of 2026-10-16 to 2026-10-19 had their second reading on 2026-10-19 (1079 rows, eight reader groups,
each with a skeptic). No energy was misread. The fixes went into the pass generators, so the pass files above carry
them: error bars kept to their printed digits (the generators had rounded them to two digits), method labels that a
text cleaner had cut, variances the papers print, and three DMRG energies a paper quotes, now cited to the paper that
computed them. 30 duplicates and two fits a paper prints only to reject them are in `scripts/removals.mjs`; two
fixed-node energies the source calls biased are flagged in `scripts/defects.mjs`; 699 rows carry the reading in
`scripts/verifications.mjs`. Rulings of 2026-10-20: FCIQMC is `projected` even with its initiator error converged, and
methods on a transcorrelated Hamiltonian without its three-body term are `approximate`.

### The families pass (2026-10-20)

- Finding: four arXiv queries in `sweep_search.mjs` (`kitaev-honeycomb`, `kitaev-heisenberg`,
  `shastry-sutherland`, `honeycomb-j1j2`, since 2000) gave 534 candidates. Every candidate's PDF
  was fetched and extracted (pypdf layout mode; pdftotext layout mode where pypdf failed or
  for old-style ids). The 138 texts with a negative number to three decimals were screened.
  References and citations of twelve on-target papers (Semantic Scholar) added 17 papers the
  queries had missed, among them the honeycomb J1-J2 exact-diagonalization and DMRG papers.
  76 papers were read in full.
- Reading: three readers (one per family, Kitaev split in two), then an adversarial second
  reading of every doubtful point on the session model.
- Convention checks:
  - QMBL's flux-free free-Majorana energies reproduce the Kitaev Exact values of arXiv:1411.5198
    (3 x 4 and 4 x 4 tori), 2112.08394 (open 5 x 5, 7 x 7 and 11 x 11 patches, all eight printed
    digits) and 2009.04129 (6 x 6 cylinder).
  - A Lanczos diagonalization reproduces the 4 x 4 Shastry-Sutherland energy of
    cond-mat/0309368.
  - The scripts are in the pass's working notes, not in the repository. They are checks, and
    they write no row.
- Second reading:
  - It corrected two first readings. arXiv:1411.5198 Table I is computed at alpha = 1 of its
    Eq. (28), H = 2 H_K: its energies are twice those of K = -1 (loader factor 2). 2206.07370's
    GNN numbers are copies of 2110.06390 Table IV, which is cited instead.
  - It fixed the open boundaries of 2112.08394, which the paper does not print. The
    free-Majorana check confirms them.
- What the readers got wrong:
  - The Shastry-Sutherland papers name the dimer coupling J, J', J1, J2 or J3. Two papers
    contradict themselves: cond-mat/0605464's Fig. 1 caption and 2505.03466's text swap the
    labels. The readers mapped couplings by bond, and the tables fixed which is which.
  - A sector energy (2311.16889's -0.444040, a triplet at k = 0) was screened as a ground state.
- Held, not rows:
  - Every honeycomb N = 32 energy (2110.06390 Table IV, 2206.07370 Tables 1-4 and 6): the
    cluster's printed periodic vectors span 64 sites, so the cluster is not defined.
  - Table I of 2510.02428: Kx = Ky ≠ Kz, unequal Kitaev couplings, not yet in scope.
  - 2304.00555: a field and Γ′.
  - 2212.13271: XXZ.
  - 2309.10955 Table II: the J-Q model.
  - 2603.02992's 24-site value, which sits in a field paragraph.
  - The stochastic-state-selection estimates of cond-mat/0309368, which estimate the exact
    state's energy.
  - Everything shown only in figures: Albuquerque et al. 2011, Gong et al. 2013, Zhu, Huse &
    White 2013, 2303.14108, the cylinder energies of 2104.08887.
- Normalisation (2026-10-21): couplings are normalised to |K| = 1 and Jd = 1 (RULES.md 2.1).
  The Kitaev instances were renamed from `K-2`, `K-4` and `K4` to `K-1` and `K1`. The loader
  divides the energies of arXiv:1411.5198 by 2 and those of 2112.08394 and 2009.04129 by 4, and
  records the factor on each row (`normalised`). No two instances became one, and no record
  changed its row.
- Code links (2026-10-22): of the eleven sources with rows, only arXiv:2505.03466 names the code
  that produced its energies: https://github.com/NeuralQXLab/convnextnnqs, in its Data and Code
  Availability section and Ref. [71], with no commit stated. Its three rows carry `artifacts`. The
  other ten texts were searched for URLs, repository names and availability statements and
  contain none. 2311.16889 names NetKet, a library, which is not the row's code.
- Duplicates: identical numbers from the same paper collapse to one row. This affects the
  three Wilson-loop sectors of arXiv:1411.5198 Table II. Its 3 x 4 VMC -9.546(1) matches the
  exact value to its printed digits and was dropped too, though it is another method's number;
  since the verification of 2026-10-23 (ruled 2026-10-24) it carries
  `same_value_distinct_method` and is a row.
- Exact rows under RULES.md 6 (every published diagonalization of an exact energy is a row,
  2026-10-24; applied when the pass reached `main`): the loader had held one exact row as a value
  the instance already carries, arXiv:2311.16889's -0.4517531 on the 6 x 6 cluster at J = 0.8. The
  source diagonalized the cluster itself (its Fig. 5 shows exact spin-spin correlations and its
  Fig. 8 exact triplet energies, which cond-mat/0605464 does not print), so it carries
  `independent_exact` and is a row. cond-mat/0605464's -0.451753105004501 (2006), printed to more
  digits, stays the exact energy shown. The other held values are the Wilson-loop sector repeats
  above.
- The three code-link rows carry `artifacts` in the shape `add_code_links.mjs` writes (`code`,
  `read_from` with the quote, location, date and pass).

### The t-J pass (2026-10-22)

The family was opened on a branch and ported onto `main` on 2026-10-24.

- **Finding.** `sweep_search.mjs --only tj-energy,tj-methods --since 1992-01-01` gave 823 candidates
  (58 and 806 hits). Their abstracts were screened (Haiku): 146 likely to print a finite-cluster t-J
  energy, 303 possible, 374 not. The 449 likely and possible papers were fetched
  (`fetch_pdfs.mjs`, old-style ids stored as `sources/cond-mat-XXXXXXX.txt`); 442 texts were
  extracted, and 7 PDFs could not be fetched or parsed (cond-mat/9311013, cond-mat/0605226,
  cond-mat/9212009, cond-mat/9312075, cond-mat/0409367, cond-mat/0508357, 2402.10455). The texts were
  ranked by energies printed to 3 and 4 decimals and by tables; 69 went to a full-text screen
  (Haiku), and 30 to Sonnet readers in eight batches, with an adversarial re-read of the exact,
  record-holding and converted rows. Only the texts of the 30 papers read are committed.
- **Checks by diagonalization** ([`checks/tj-ed-2026-10/`](checks/README.md)). QMBL's own Lanczos
  runs reproduce six printed exact energies: the periodic 18-site cluster, the open 4 x 4 lattice,
  the 3 x 6 ladder with antiperiodic legs (1 and 2 holes), the 2 x 11 ladder and the 24-site
  honeycomb flake with one hole. They fix the -n_i n_j / 4 term, the boundaries, the clusters and
  the factor 3 of the t/J = 3 source.
- **The 32-site cluster with t' and t''** (arXiv:cond-mat/0508035) is checked against print, not by
  diagonalization: its half-filling energy E00 = -11.329720 at J = 0.3 gives -0.6801792 per site
  for the S_i.S_j Heisenberg energy with -n_i n_j / 4 included, the 32-site value -0.680179 of
  arXiv:cond-mat/9402061 Table II (`sources/cond-mat-9402061.txt` line 1642).
- **Correction to a commit message.** Commit e7ae212 says five exact energies were reproduced by
  QMBL's diagonalization at that point; it was four (18-site, open 4 x 4, and the 3 x 6 ladder with 1
  and 2 holes). The six of `checks/tj-ed-2026-10/` came with the next commit.
- **Second reading.** It changed three rows: the method labels of the zero-variance extrapolation
  and of the pure VMC energy of arXiv:cond-mat/0110460, and the provenance of three 26-site exact
  energies. arXiv:cond-mat/0009149 credits D. Poilblanc's unpublished 26-site data, and its Exact
  column (J = 0.3, 0.5, 1, 4 holes) is reprinted without a citation in arXiv:cond-mat/0606659
  Table II. Those three rows are `secondary`, cited to the private communication through the paper
  that printed it first (RULES.md §8). The other nine exact values of arXiv:cond-mat/0606659 are not
  in any earlier paper read here and stay with it.
- **The 26-site cluster is inferred.** arXiv:cond-mat/0606659 describes its clusters as rotated by
  45 degrees with L = 2l², l odd, which excludes 26, and states no shape for it. The 12 instances use
  the square-shaped (5, 1) cluster of RULES.md §2.1; arXiv:cond-mat/0009149's 13 shells on 26 sites
  agree with it. A symmetry-resolved diagonalization (2 holes, about 3e7 states per momentum) would
  settle it. It did: QMBL's diagonalization of the (5, 1) cluster
  ([`checks/tj-exact-recompute-2026-10/`](checks/README.md), 2026-10-23) reproduces all 12 printed
  26-site exact energies (ruled 2026-10-24).
- **Held, with the reason** (not rows until the reason is resolved):
  - arXiv:cond-mat/9911071 (Hellberg & Manousakis, Tables I, II, IV, V and the text value
    E(4) = -42.23 ± 0.12; 161 energies): each cluster uses one of four boundaries, periodic with a
    0 or π phase in x and in y, and the tables do not say which. The quoted DMRG value of White &
    Scalapino (8 x 8 cylinder) waits for its primary.
  - arXiv:cond-mat/0104067 Table II (15 energies): 'the lattices and boundary conditions are chosen
    exactly the same as those chosen by Hellberg et al.', so the same open question.
  - arXiv:1812.03657 Table III (fPEPS, 4 x 4 to 12 x 12, 14 energies): the boundary is not stated.
  - arXiv:cond-mat/0009149, the 32- and 98-site rows (21 energies, including P. W. Leung's
    unpublished 32-site exact energy): no boundary or cluster is stated.
  - arXiv:0708.0788, 0801.2722, 0805.2400 (VMC with J S_i.S_j and no -n_i n_j / 4): the boundary,
    and for two of them the cluster, are not stated; 0805.2400 quotes the other two.
  - arXiv:cond-mat/9705156 (one energy): cluster, boundary and quantity are not stated.
  - arXiv:cond-mat/9607050 Table I: the model has a three-site term whose coupling the table does
    not state.
  - arXiv:cond-mat/9502097 (triangular, J = 0): the zero of the printed hole energies is not stated.
  - arXiv:cond-mat/0103096 Table I, U(1) m = 1000: quoted from White & Scalapino (1999); waits for
    its primary.
- **Not in the family**, read and rejected: arXiv:2604.25775 (its t-J table has a staggered pinning
  field), 2606.17045 (sawtooth chain with J2), 2404.11950 and cond-mat/0601301 (extra density
  terms), 2003.02850 (kagome). The other papers read print t-J energies only in figures, as
  thermodynamic-limit values, or as energies relative to the undoped cluster.
- **No code link.** None of the 12 papers with rows names a repository for its own code in the
  arXiv text, so no row carries `artifacts`.
- **Journal versions** were not reached (the publishers returned 403 to this session); every row
  says it was read from the arXiv text. arXiv:2602.21206 was published under a different title.

### Track 3: hydrogen chains and sheets

Track 3 ([RULES.md §13](RULES.md#13-track-3-hydrogen-chains-and-sheets)) opened on 2026-10-25 (§1). Its
passes sit in `passes/track3/`; `scripts/add_track3_rows.mjs` loads the rows file in every build (totals in Hartree,
nuclear repulsion included; `dof` = N; no `einf` or V-score), with the corrections, notes, verifications and code
links the generator has written on each row. The generators are in `scripts/track3/`; `sh scripts/track3/build.sh`, run from the repo root, rewrites the three pass files below byte for
byte, in this order (every path relative to the repo root, intermediate outputs in `scripts/track3/.out/`, not
committed):

1. `motta2017.mjs`: Motta et al. 2017 Tables II-IV (`sources/1705.01608.txt`) and the data repository
   (`sources/1705.01608-data-b99a183.tsv`).
2. `hachmann.mjs`: Hachmann, Cardoen & Chan 2006 Table VI (`sources/cond-mat-0606115.txt`).
3. `motta2020si.mjs`: Motta et al. 2020 SI Table III (`sources/1911.01618-anc-si.txt`); reads step 1 to drop duplicates.
4. `g1904.mjs`: arXiv:1904.01131 Table II as FCI + difference; citation from `passes/track3/refs-hydrogen.json`.
5. `readers.mjs`: the reader results of the citing papers (`passes/track3/read/result-*.json`), each value found again
   on its line of `sources/<id>.txt`; reads steps 1-4 to resolve quoted values.
6. `assemble.mjs`: merges steps 1-5, applies `passes/track3/verify-2026-10-24-hydrogen.json`, writes the rows and
   held files.
7. `codelinks.mjs`: code links into the rows and `passes/track3/code-links-2026-10-22-hydrogen.json`.

`refs.mjs` (arXiv API and Crossref, network) wrote `passes/track3/refs-hydrogen.json` and is not part of the run.
`common.mjs` holds the instance naming and the default paths.

| file | what was read |
|---|---|
| `passes/track3/sweep-rows-2026-10-20-hydrogen.json` | hydrogen chains: Motta et al., PRX 7, 031059 (2017), Tables II-IV and its data repository (`sources/1705.01608-data-b99a183.tsv`); Motta et al., PRX 10, 031058 (2020), SI Table III (journal and arXiv versions read); Hachmann, Cardoen & Chan, JCP 125, 144101 (2006), Table VI (H50, STO-6G), the primary of quoted values; the papers citing both seeds that print finite-N energies, including arXiv:1904.01131 Table II filed as FCI + difference (difference = method − FCI, read from the text, 2026-10-21) |
| `passes/track3/held-2026-10-20-hydrogen.json` | values read and not filed, each with its reason: periodic cells without a stated twist, sliced-basis and F12 energies, table-dataset disagreements, quoted values whose primary was not read; and the 32 rows the verify pass of 2026-10-24 removed as duplicates, each with the row that stands |

`passes/track3/code-links-2026-10-22-hydrogen.json` holds the code-link reading of every paper that is the own
source of rows (rule of 2026-10-22, [DATA.md](DATA.md)): linked, ambiguous or not found, with the statement
quoted. The pass's rows carry `artifacts` where the entry is linked, in the shape `add_code_links.mjs` writes
(`code`, `read_from` with the quote, location, date and pass).

`passes/track3/verify-2026-10-24-hydrogen.json` applies the verify pass of 2026-10-23/24 (44 groups, every row read
again, a skeptic on every correction and defect; rulings of 2026-10-24). The generator's assemble step reads it,
keyed by instance + method + method detail + printed value, and fails on a key that matches no row or several.
Changed values keep the printed value in `reported_as` and the old value in `corrections` (RULES.md §11); pass
fields are `eps` (per atom) and `sigma_per_site`, which the loader converts to totals.

- Rows: 1742 before, 1710 after (1712 with the two exact rows below). Removed as duplicates (listed in the held file with the row that stands): 10 DMET
  rows with a 5-atom fragment in STO-6G that repeat the paper's FCI digits, and 22 rows of the 2017 data repository
  for H50 in STO-6G (RHF at all ten R; RCCSD and RCCSD(T) at R = 1.0 to 2.0) equal in every printed digit to
  Hachmann, Cardoen & Chan 2006, which stays primary.
- Corrections (463 on 394 rows, plus 14 records where a note was appended to an existing one): citations and
  `peer_reviewed` for six papers found published or arXiv-only; the STO-6G FCI rows carry QMBL's recomputed
  digits; where Tables II-IV truncate, the repository's digits (143 rows); the printed complete-basis fit
  uncertainty as sigma on approximate CBS rows, and the Table III UHF error bars, which the generator had divided
  by N twice (both fixed in `scripts/track3/motta2017.mjs`); no sigma on the two arXiv:1904.01131 MkMRCC rows whose printed ±
  is not explained; the arXiv:2604.02054 seed spread as sigma; UGF2 relabelled; the DMET solver, the AFQMC
  multi-determinant trial on two CBS rows, the near-linear-dependence threshold on H50 RHF/UHF rows and the CASCI
  active space as method details; arXiv:2005.11349 FCI label; arXiv:1905.06971 LRDMC; arXiv:2006.14956 FCIQMC
  `projected`; DUCC-QFlow `approximate`; the Motta 2017 DMRG rows variational with medium confidence; the R = 1.0
  MRCI+Q and MRCI-F12+Q complete-basis values relabelled as the AFQMC-based estimate of the Table III caption
  (the F12 one by the second ruling of 2026-10-24: the repository builds it the same way).
- Notes (111 rows): MRCI and MRCI+Q in STO-6G (the active space is the whole orbital space), density-fitted and
  ITHC integrals, the LMO estimator, complete-basis Hartree-Fock above cc-pV5Z, the DMRG reading, and H50
  RHF/cc-pV5Z at R = 1.2, about 36 mEh below its basis-set trend (noted, no recompute, ruled 2026-10-24).
- Verified: 1437 rows carry a `verified` block (checked 2026-10-24, scope, the version read).
- Not applied: no defect flags for values below variational or exact references, or for superseded values (rule of
  2026-10-24); three method-detail corrections the skeptic left unsettled (not applied, ruled 2026-10-24); two
  defect findings without a ruling (H30 UCCSD/cc-pVTZ at R = 1.0 inconsistent with its UHF reference, the two
  arXiv:2006.14956 FCIQMC values that differ from the thesis they cite). All are listed in the file's `not_applied`.

In track 3, CCSD(T) and other perturbative corrections to coupled cluster are `approximate`
([RULES.md §13.4](RULES.md#134-bound_type)). This is provisional (2026-10-21): the record rule
for all tracks is being rethought, and §4 keeps its wording until then.

Exact rows under RULES.md 6 (every published diagonalization of an exact energy is a row, 2026-10-24; applied
when the track opened): the generator had held 12 FCI values in STO-6G as values already carried by Motta et
al. 2017. arXiv:2305.12776's FCI of H10 at 1.8 and 3.6 bohr are its own (it compares its selected
configurations with the FCI wave functions, Fig. 7c, d), so the two carry `independent_exact` and are rows
(`readers.mjs`, `INDEPENDENT_EXACT`). The ten FCI values of arXiv:1904.01131 Table II stay held: the column is
Motta et al.'s to the printed digits and the paper does not say it computed it. arXiv:2604.02054's FCI
benchmark (H10, 1.6 bohr) stays held for its second reading: the paper does not say where it comes from.

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
