// Track 3 (RULES.md 13, open since 2026-10-25): rows from passes/track3/sweep-rows-YYYY-MM-DD-hydrogen.json,
// written by scripts/track3/ (SWEEP.md, track 3). Each pass row is a per-atom reading in Hartree with the
// nuclear repulsion included; this script stores it as a total (x N) on its instance, creating the instance
// from the row's `create` header (data/Hchain/, data/Hsheet/). The generator has already applied the verify
// file of the pass (removals, corrections, notes, verifications) and the code links; they are carried over:
//   - a pass correction of `eps` or `sigma_per_site` is recorded on the row in stored units (energy,
//     sigma; x N), every other one as written;
//   - the verify pass's reading becomes the row's `verified.second_read`;
//   - `artifacts` (code, read_from) as add_code_links.mjs writes them.
// `dof` is N; no `einf` is defined, so there is no V-score (RULES.md 13.2). The published string is the pass
// method with its detail (method_names.mjs, track3Published), which apply_method_names.mjs names.
// `sampled` is written only where the reader's reading differs from what the method string says
// (units.mjs, isSampled), with a corrections record that states it.
import fs from "node:fs";
import { isSampled } from "./units.mjs";
import { track3Published } from "./method_names.mjs";

const DIR = "passes/track3";
const PASSES = fs.readdirSync(DIR).filter(f => /^sweep-rows-\d{4}-\d{2}-\d{2}-hydrogen\.json$/.test(f)).sort();
// RULES.md 13.4, by bound type
const REASON = {
  exact: "full CI or exact diagonalization in the instance's basis (RULES.md 13.4; assigned during source reading)",
  variational: "the energy of a stated wave function (Hartree-Fock, DMRG at a stated bond dimension, MRCI, VMC, a neural-network state); an upper bound in the instance's basis (RULES.md 13.4; assigned during source reading)",
  projected: "AFQMC, fixed-node or lattice-regularised DMC, coupled cluster, MRCI+Q or an embedding method; not a bound (RULES.md 13.4; assigned during source reading)",
  extrapolated: "extrapolated to the complete basis set or to zero truncation error; not a bound (RULES.md 13.4; assigned during source reading)",
  approximate: "finite-order perturbation theory, GW, or a perturbative correction to coupled cluster (track 3, 2026-10-21); error of unknown sign (RULES.md 13.4; assigned during source reading)",
};
const PER_ATOM = { eps: "energy", sigma_per_site: "sigma" };
const total = (x, n, digits) => x == null ? null : +(x * n).toPrecision(digits);

let added = 0, created = 0;
const instances = new Map();
for (const file of PASSES) {
  const date = file.slice(11, 21);
  for (const r of JSON.parse(fs.readFileSync(`${DIR}/${file}`, "utf8"))) {
    const id = r.instance_id, p = `data/${id}.json`;
    if (!instances.has(id)) {
      if (fs.existsSync(p)) instances.set(id, JSON.parse(fs.readFileSync(p, "utf8")));
      else { instances.set(id, { ...r.create, instance_id: id, rows: [] }); created++; }
    }
    const inst = instances.get(id), n = inst.n_sites;
    const src = `arXiv:${r.arxiv}`;
    const method = track3Published(r.method, r.method_detail);
    const corrections = (r.corrections || []).map(c => PER_ATOM[c.field]
      ? { ...c, field: PER_ATOM[c.field], from: total(c.from, n, PER_ATOM[c.field] === "energy" ? 12 : 6), to: total(c.to, n, PER_ATOM[c.field] === "energy" ? 12 : 6),
          conversion: [c.conversion, `per atom ${c.from} -> ${c.to}, stored as totals (x ${n})`].filter(Boolean).join("; ") }
      : c);
    const row = {
      energy: total(r.eps, n, 12), sigma: total(r.sigma_per_site, n, 6),
      energy_variance: null, dof: n, einf: null, v_score: null,
      method, bound_type: r.bound_type, bound_type_reason: r.bound_type_reason ?? REASON[r.bound_type] ?? null,
      reference: r.reference, peer_reviewed: r.peer_reviewed,
      source: `track3-${date}`, provenance: r.origin === "own" ? "primary" : "secondary",
      verified: {
        checked_on: date,
        method: `${r.dataset ? `dataset ${r.dataset}; ` : ""}source text of ${src} read locally (pypdf layout text; the generator finds every value again on its line), no LLM transcription of numbers; ${r.verified_by}`,
        reported_as: r.reported_as,
        note: [r.evidence, r.convention_check, r.note, r.confidence && r.confidence !== "high" ? `reader confidence ${r.confidence}` : ""].filter(Boolean).join(" | "),
        secondary_of: r.origin === "quoted" ? src : null,
        ...(r.verified ? { second_read: r.verified } : {}),
      },
    };
    if (r.defect) row.defect = r.defect;
    // One unit in the last printed digit of an exact energy without an error bar (DATA.md `precision`).
    if (r.precision_per_site != null) row.precision = total(r.precision_per_site, n, 6);
    if (r.artifacts) row.artifacts = r.artifacts;
    if (typeof r.sampled === "boolean" && r.sampled !== isSampled({ ...row, sampled: undefined })) {
      row.sampled = r.sampled;
      corrections.push({ field: "sampled", to: r.sampled, reported_as: r.reported_as, location: r.evidence, checked_on: date,
        reason: `${r.sampled ? "A Monte Carlo estimate" : "Deterministic, not a Monte Carlo estimate"}, as the track-3 reader recorded it (pass row \`sampled\`); the method string alone reads the other way (units.mjs, isSampled).`,
        source_entry: `${DIR}/${file}` });
    }
    if (corrections.length) row.corrections = corrections;
    inst.rows.push(row);
    added++;
  }
}
for (const [id, inst] of instances) {
  fs.mkdirSync(`data/${id.split("/")[0]}`, { recursive: true });
  fs.writeFileSync(`data/${id}.json`, JSON.stringify(inst, null, 2) + "\n");
}
console.log(`track 3: added ${added} rows from ${PASSES.length} pass${PASSES.length === 1 ? "" : "es"} (${PASSES.join(", ")}); ${created} new instances`);
