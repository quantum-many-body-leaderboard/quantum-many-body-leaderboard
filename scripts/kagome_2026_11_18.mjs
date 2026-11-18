// Targeted pass 2026-11-18: kagome 192 and 432 energies that the 2026-11-16 second reading of the
// frustrated-lattice pass found printed but not carried. Writes passes/rows/sweep-rows-2026-11-18-kagome.json.
// Values are matched against the committed source text at the stated line; journal versions read
// (PRL 98, 117205 in the publisher PDF on 2026-11-18; PRB 84, 020407 publisher PDF on 2026-11-16).
import fs from "node:fs";

const OUT = "passes/rows/sweep-rows-2026-11-18-kagome.json";

// --- references (Crossref, 2026-11-18) ------------------------------------------------------
const REF = {
  "cond-mat/0611414": { file: "cond-mat-0611414", ref: "Ran, Hermele, Lee & Wen, Projected-Wave-Function Study of the Spin-1/2 Heisenberg Model on the Kagomé Lattice, Phys. Rev. Lett. 98, 117205 (2007), doi:10.1103/PhysRevLett.98.117205, arXiv:cond-mat/0611414",
    version: "version read: Phys. Rev. Lett. 98, 117205 publisher PDF (2026-11-18, Tables I and III identical to the arXiv text)" },
  "1105.0341": { file: "1105.0341", ref: "Iqbal, Becca & Poilblanc, Projected wave function study of Z2 spin liquids on the kagome lattice for the spin-1/2 quantum Heisenberg antiferromagnet, Phys. Rev. B 84, 020407(R) (2011), doi:10.1103/PhysRevB.84.020407, arXiv:1105.0341",
    version: "version read: Phys. Rev. B 84, 020407(R) publisher PDF (2026-11-16, the four values identical to the arXiv text)" },
};

const INST = { 192: "Heisenberg/kagome-8x8_192_P", 432: "Heisenberg/kagome-12x12_432_P" };
const BEST = { 192: "-0.435949 per site (KagomeResNet, arXiv:2611.05174)", 432: "-0.432519 per site (1-LS VMC, arXiv:1311.5038)" };
const CONV = N => `H = J sum_<ij> S_i.S_j with spin-1/2 operators, nearest neighbours only; energies printed as E/J per site, the S.S convention per site (RULES.md 5). The spin Hamiltonian is periodic; the mixed periodic-antiperiodic boundary conditions are those of the fermionic mean-field state before projection. Plausibility: every value lies above the instance's best variational energy, ${BEST[N]}.`;

// [N, source, line, printed, method_as_published, bound, where, extra]
const R = [];
// Ran et al. Table I (lines 93-99): columns 8x8x3 (192 sites) and 12x12x3 (432 sites). The SL-[0, π]
// row is carried already on both clusters.
for (const [line, state, p192, p432] of [
  [93, "SL-[π/2, 0]", "−0.4010(1)", "−0.4010(1)"],
  [95, "SL-[±π/2, 0]", "−0.3907(1)", "−0.3910(1)"],
  [97, "SL-[π/2, π]", "−0.3814(1)", "−0.3822(1)"],
  [99, "uniform RVB SL-[0, 0]", "−0.4115(1)", "−0.4121(1)"]])
  for (const [N, p] of [[192, p192], [432, p432]])
    R.push([N, "cond-mat/0611414", line, p, `VMC, Gutzwiller-projected ${state} spin liquid, mixed spinon boundary conditions`, "variational",
      `Table I, row ${state}, column ${N === 192 ? "8x8x3" : "12x12x3"} lattice ('For all candidate projected spin-liquids, we list the energy per site in unit of J')`, {}]);
// Ran et al. Table III (lines 159-163): states next to the U(1) Dirac state.
for (const [line, state, p192, p432] of [
  [159, "VBS state (|χ1/χ2| = 1.05)", "−0.42848(2)", "−0.42844(2)"],
  [161, "VBS state (|χ1/χ2| = 0.95)", "−0.42846(2)", "−0.42846(2)"],
  [163, "chiral spin liquid (θ = 0.05)", "−0.42857(2)", "−0.42853(2)"]])
  for (const [N, p] of [[192, p192], [432, p432]])
    R.push([N, "cond-mat/0611414", line, p, `VMC, Gutzwiller-projected ${state}, mixed spinon boundary conditions`, "variational",
      `Table III, row '${state}', column ${N === 192 ? "8x8x3" : "12x12x3"} lattice ('energy per site in unit of J for possible' instabilities of the U(1)-Dirac state)`, {}]);
// arXiv:1105.0341, 432-site cluster ('We performed our variational calculations on a 432-site cluster', line 125).
R.push(
  [432, "1105.0341", 182, "−0.42872(1)", "VMC, extended U(1) Dirac SL [0, π; 0, π] (optimised 2nd-neighbour hopping)", "variational",
    "page 3, 'For the present cluster, these values are E/J = −0.42872(1) per site, and χ2 = −0.0186(2)' (the [0,π; 0,π] state, nearest-neighbour Hamiltonian); the same value is printed for the 576-site cluster in arXiv:1011.3954, a row there", {}],
);

// Held after the second reading (2026-11-18): SL-[π,π] 'E/J ≃ −0.38372(1)' (page 4; the open-shell state is reached
// only as θ → 0 and the text does not say whether the value is one small-θ state or an extrapolation), and the
// fixed-node values −0.431453(2) and −0.431443(2) (page 4; the sentence names no cluster, the first lies below
// the same trial state's fixed-node energy on 192 sites, arXiv:1209.1858, and "NNN" in that paragraph also names
// the model with J').

// --- conversion (as scripts/frustrated_2026_11_12.mjs) ---------------------------------------
const clean = s => s.replace(/[−–]/g, "-").replace(/\s+/g, "");
function parse(p) {
  const m = clean(p).match(/^(-?\d*\.(\d+))\((\d+)\)$/);
  return m ? { v: +m[1], sigma: +m[3] * 10 ** -m[2].length, dec: m[2].length } : null;
}
const text = {};
const linesOf = f => (text[f] ??= fs.readFileSync(`sources/${f}.txt`, "utf8").split("\n"));
const out = [];
for (const [N, a, line, printed, asPub, bound, where, x] of R) {
  const id = INST[N]; if (!fs.existsSync(`data/${id}.json`)) throw new Error(`instance ${id} missing`);
  const L = linesOf(REF[a].file), want = clean(printed);
  const at = [0, -1, 1, -2, 2].map(d => line + d).find(k => clean(L[k - 1] ?? "").includes(want));
  if (at == null) throw new Error(`${a}: '${printed}' not found at line ${line}`);
  const p = parse(printed); if (!p) throw new Error(`cannot parse ${printed}`);
  out.push({
    instance_id: id, eps: p.v, tol: +(0.5 * 10 ** -p.dec).toPrecision(3),
    sigma_per_site: +p.sigma.toPrecision(6), var_per_site: null,
    arxiv: a, peer_reviewed: true, origin: "own", bound_type: bound, method: asPub,
    reference: REF[a].ref,
    evidence: [`${where}; sources/${REF[a].file}.txt line ${at}`, x.note, REF[a].version].filter(Boolean).join("; "),
    convention_check: CONV(N), reported_as: printed, confidence: x.conf ?? "high",
    verified_by: "single reading (2026-11-18)", variance_as_reported: null, defect: null, sampled: true,
  });
}
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + "\n");
console.log(`${out.length} rows on ${new Set(out.map(r => r.instance_id)).size} instances -> ${OUT}`);
