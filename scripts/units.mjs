// Unit and bookkeeping conventions for the VarBench schema, and the record eligibility rules.
// Every script imports them from here, so each rule is written once.

export const SPIN_MODELS = new Set(["Heisenberg", "J1J2", "TFIsing"]);
// Track 2 (RULES.md 12): the homogeneous electron gas, stored as totals in Hartree; n_sites holds N.
export const HEG_MODELS = new Set(["HEG2D", "HEG3D"]);

// Is the reported energy a Monte-Carlo estimate, or a deterministic contraction?
// Only a sampled energy has an error bar to report: DMRG at a stated bond dimension, exact
// diagonalization and statevector circuits carry no statistical error at all. No row needs a
// sigma to hold a record (RULES.md 6); the distinction decides the README's dagger marker and
// which rows the error-bar counts ask about.
//
// Which kind a row is, is read from its source, per row. A row whose reader established it
// carries `sampled`, true or false, set in corrections.mjs with the evidence, and that
// decides. The method string is only the fallback where the field is absent, as a name can mislead:
// the VQE "2^14 samples/grad" rows print the exact statevector energy (the shots estimate
// only the gradient), and a finite PEPS evaluated by Monte Carlo, an MPS-RNN or a projected
// mean-field state is sampled although its string matches a deterministic marker.
//
// The fallback: deterministic is asserted by explicit markers; everything else counts as sampled.
// A method string that is only "HF" is the Hartree-Fock energy a paper prints beside its
// own (arXiv:2210.05871, Tables 1 and 2). "HB K = 0 (HF)" is not: the HB paper samples its
// K = 0 state like every other depth (arXiv:2606.00924, Table II caption, "sampling errors
// are around 0.0003"), so the bare abbreviation matches only as the whole string. "ED" counts
// only at the start of the string ("ED", "ED (this work)"): "aCNN, sign structure fixed to
// the exact (ED) one" is a sampled network that names ED as its reference.
const DETERMINISTIC = /\bdmrg\b|\bmps\b|\bpeps\b|\bmera\b|tensor network|statevector|exact diagonaliz|exact solution|bethe ansatz|hartree|mean[- ]field|truncation error|bond dimension|\bfci\b|full configuration|^HF$|^ED\b/i;
// Takes the row, never a method string, so the row's own statement wins wherever there is
// one. A string argument would read as "sampled", so it throws.
export function isSampled(r) {
  if (r == null || typeof r !== "object") throw new TypeError("isSampled takes a row (its `sampled` field decides), not a method string");
  return r.sampled ?? !DETERMINISTIC.test(publishedMethod(r) || "");
}

// True when QMBL found neither a sigma nor an energy variance for this row in the source it
// read (the circle marker; DATA.md, error metrics). It is not a `defect` and withholds
// nothing (RULES.md 3). `exact` rows are not marked, as an exact diagonalization has no error
// to report, except stochastic ones (below), whose error bar is part of the claim.
export const noErrorMetrics = r =>
  (r.bound_type !== "exact" || stochasticExact(r)) && r.sigma == null && r.energy_variance == null;

// Sign-problem-free QMC is `exact` within its statistical error bar, not to the printed
// digits (RULES.md 4): such a row must state sigma, and every surface prints its class as
// "exact (stochastic)". The method name (AFQMC, SSE QMC, QMC) tells it
// apart from exact diagonalization and exact solutions.
const STOCHASTIC = /\bqmc\b|\bafqmc\b|monte carlo|stochastic series/i;
export const stochasticExact = r => r.bound_type === "exact" && STOCHASTIC.test(r.method || "");

// A row's bound_type as the site, the figures and records.mjs print it.
export const boundLabel = r => stochasticExact(r) ? "exact (stochastic)" : (r.bound_type ?? "unclassified");

// The method string exactly as the source printed it. Rows carry a short `method` name and a
// `method_detail` (scripts/method_names.mjs); the published string stays on the
// row, and the rules written against it (the fallback of isSampled, the row id) keep reading it.
export const publishedMethod = r => r.method_as_published ?? r.method;

// A row's method as every surface prints it: the algorithm and the ansatz, "VMC (ViT)",
// "FN-DMC (SJB)", or the algorithm alone where it has none ("ED", "DMRG"). Rows that differ
// only in their detail read the same; the detail is methodDetail, shown on hover (2026-10-23).
export const methodLabel = r => r.ansatz ? `${r.method} (${r.ansatz})` : r.method;
// What tells a row apart from others of the same label: the bond dimension from `compute`,
// the detail, the symmetry sector. An extrapolation's bond dimension is the largest it was
// fitted from, a cost and not the state, so its detail says what went to the limit instead.
export function methodDetail(r) {
  const bd = r.bound_type !== "extrapolated" && r.compute?.bond_dimension;
  return [bd != null && bd !== false && `bond dimension ${bd}`, r.method_detail, r.sector && `sector ${r.sector}`]
    .filter(Boolean).join(", ");
}
// The name a wave function or method is known by alone, for figure labels and the
// architecture table: the ansatz, else the method.
export const ansatzName = r => r.ansatz ?? r.method;

// Sector-resolved exact diagonalization: VarBench's "Exact Diagonalization 0.C1.A -1" is the
// lowest state in one symmetry sector, not the ground state, so an unconstrained variational
// energy may legitimately sit below it and it cannot stand in for the instance's exact
// energy. Such a row carries `sector` (scripts/method_names.mjs); where the instance has its
// ground-state row, apply_spectrum.mjs moves it off the rows into the instance's `spectrum`,
// and the record, the validator, the figures and the table matcher ask groundStateExact.
//
// The one sector row that is the ground state. J1J2/triangular_48_P_0.125 carries all 48
// (k.irrep, spin-flip) sectors of the Sz = 0 space from Wietek et al., PRX 14, 021010, whose
// App. B names Gamma.A1 (spin-flip +1) as the ground state; the number matches the paper's
// own upload. This row stays a row; the other 47 go to the instance's `spectrum`.
const RULED_GROUND_STATE_SECTOR = "Gamma.D6.A1, spin flip +1";

// Does this exact row state the ground-state energy, rather than a sector minimum?
export const groundStateExact = r =>
  r.bound_type === "exact" && (!r.sector || r.sector === RULED_GROUND_STATE_SECTOR);

// An exact row that states the instance's ground-state energy: exact diagonalization, an
// exact solution, or sign-problem-free QMC where that is established (RULES.md 4). The
// instance shows it first wherever one exists (RULES.md 6). A flagged exact row is skipped
// like any other (6.1).
export const exactEligible = r => groundStateExact(r) && !r.defect;

// Since 2026-10-22 an instance has no single record (RULES.md 6): it shows its exact energy,
// then one best value per bound type, each the lowest unflagged energy of that class. These
// are the classes, in the order every surface prints them; the label is "best <class>".
export const BEST_CLASSES = ["variational", "projected", "extrapolated", "approximate"];
export const bestLabel = c => `best ${c}`;
// Rows of these classes are not bounds, so an energy of theirs below the exact one is an
// overshoot, not a contradiction: the automatic flag below catches it. A variational row
// below exact violates the variational principle and keeps its `defect` (RULES.md 9.4).
const NOT_BOUNDS = new Set(["projected", "extrapolated", "approximate"]);

// The error bar of `r` measured against the exact row `exact`: its own sigma, combined in
// quadrature with the exact row's where that one is stochastic (as RULES.md 9.4 combines
// them). null where neither states one.
export function sigmaAgainstExact(r, exact) {
  const es = stochasticExact(exact) ? exact.sigma : null;
  return r.sigma != null || es != null ? Math.hypot(r.sigma ?? 0, es ?? 0) : null;
}

// The automatic flag (RULES.md 6.2, 2026-10-22): an unflagged projected, extrapolated or
// approximate row more than 2 sigma below the instance's exact energy, or below it at all
// where no sigma is stated. Such a row cannot be its class's best; it stays listed with a
// marker. It is not a `defect` and writes nothing into data/.
export function belowExact(r, exact) {
  if (!exact || r.defect || !NOT_BOUNDS.has(r.bound_type)) return false;
  const gap = exact.energy - r.energy, s = sigmaAgainstExact(r, exact);
  return s != null ? gap > 2 * s : gap > 0;
}

// Ties (RULES.md 6): two rows whose 2-sigma error bars overlap share the rank; a row without
// sigma is compared by its energy alone.
export const tiedAt2Sigma = (a, b) => Math.abs(a.energy - b.energy) <= 2 * ((a.sigma ?? 0) + (b.sigma ?? 0));

// Rows that can be the best of their class, before the automatic flag: unflagged rows of the
// four classes (RULES.md 6, 6.1). The flag needs the instance's exact row, so classBest in
// summary.mjs applies it.
export const classEligible = r => BEST_CLASSES.includes(r.bound_type) && !r.defect;

// Until 2026-10-22 the record was the exact energy, else the lowest variational, projected or
// extrapolated energy, an approximate one only where nothing else qualified. The aggregates of
// RULES.md 7 and the estimate QMBL: Open Problems prints beside its target still read that
// value (summary.mjs, lowestOf), and so do the figure lines through the lowest energy at each size.
const RECORD_KINDS = new Set(["variational", "projected", "extrapolated"]);
export const recordEligible = r => RECORD_KINDS.has(r.bound_type) && !r.defect;
// `approximate` (RULES.md 4): a method that converges to a fixed approximation, not to the
// exact energy (RPA, MP2, channel-truncated coupled cluster).
export const approximateEligible = r => r.bound_type === "approximate" && !r.defect;

// VarBench writes spin Hamiltonians with Pauli matrices (sigma.sigma) and stores
// total energies. NQS papers quote E/N in the S.S convention. Factor 4 N_sites.
// Fermionic models (Hubbard, tV) are stored as totals; papers quote per site.
//
// TFIsing is the exception: its Hamiltonian is -sum s^z s^z - h sum s^x, already in Pauli
// operators with no S.S term to rescale, so the per-site energy is E/N. Check:
// TFIsing/chain_32_P_1 is the critical chain, whose free-fermion ground state is exact.
// Summing -2 sqrt(h^2 - 2h cos k + 1) over the antiperiodic momenta k = pi(2n+1)/N reproduces
// the stored total -40.760032 to 7e-15, and E/N = -1.2738 sits just below the thermodynamic
// limit -4/pi = -1.2732, as it must for PBC at criticality. scripts/validate.mjs asserts the
// identity on every build.
export function perSiteDivisor(inst) {
  if (inst.model === "TFIsing" || HEG_MODELS.has(inst.model)) return inst.n_sites;
  if (SPIN_MODELS.has(inst.model)) return 4 * inst.n_sites;
  if (inst.model === "Hubbard" || inst.model === "tV") return inst.n_sites;
  return null; // Impurity: no meaningful per-site energy
}

export function perSiteLabel(inst) {
  if (inst.model === "TFIsing") return "E/N (Pauli)";
  if (HEG_MODELS.has(inst.model)) return "E/N (Ha)";
  if (SPIN_MODELS.has(inst.model)) return "E/N (S.S)";
  return perSiteDivisor(inst) == null ? "E (total)" : "E/site";
}

// Degrees of freedom: spins for spin models, N_up + N_dn for fermions.
// VarBench filenames carry Nf = N_up = N_dn.
export function expectedDof(inst) {
  if (SPIN_MODELS.has(inst.model) || HEG_MODELS.has(inst.model)) return inst.n_sites;
  // t-V is spinless, so Nf is already the total particle number.
  if (inst.model === "tV") return inst.params?.Nf ?? null;
  if (inst.params?.Nf != null) return 2 * inst.params.Nf;
  return null;
}

// E_inf = Tr H / dim H. Zero for traceless spin Hamiltonians written in Pauli form;
// U * N_up * N_dn / N_sites for the Hubbard model.
export function expectedEinf(inst) {
  if (SPIN_MODELS.has(inst.model)) return 0;
  // Hopping terms are traceless, so a t' variant keeps the same E_inf; extra
  // density-density terms (V1, V2) do not, so those variants are excluded.
  if (inst.model === "Hubbard" && !/UV|V1|V2/.test(inst.instance_id)
      && inst.params?.U != null && inst.params?.Nf != null)
    return (inst.params.U * inst.params.Nf * inst.params.Nf) / inst.n_sites;
  return null;
}

export const vScore = (variance, dof, energy, einf) =>
  variance == null || !dof || einf == null || energy === einf
    ? null : (dof * variance) / (energy - einf) ** 2;
