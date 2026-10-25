// Rows from the Sonnet readers of the citing papers (read/result-*.json). Every value is re-found on its cited line
// of sources/<id>.txt (±1 line); a miss holds the value. Conversions follow RULES.md §13.2.
import fs from "node:fs";
import { instanceId, createHeader, sigmaFromParen, OUT_DIR, T3 } from "./common.mjs";
const [REPO = ".", READDIR = `${T3}/read`, PRIOR = ["motta2017", "motta2020si", "hachmann", "1904"].map(n => `${OUT_DIR}/out-${n}.json`).join(","), OUT = `${OUT_DIR}/out-readers.json`, CROSSREF = `${T3}/refs-hydrogen.json`] = process.argv.slice(2);
const prior = PRIOR.split(",").flatMap(f => JSON.parse(fs.readFileSync(f, "utf8")).rows);
const refs = CROSSREF && fs.existsSync(CROSSREF) ? JSON.parse(fs.readFileSync(CROSSREF, "utf8")) : {};
const HA = { Ha: 1, mHa: 1e-3, eV: 1 / 27.211386245988, "kcal/mol": 1 / 627.5094740631, Ry: 0.5 };
const BOHR_PER_ANG = 1 / 0.529177210903;
const rows = [], held = [], notRows = [], unclear = [], coverage = [];
const textCache = {};
const lines = id => (textCache[id] ||= fs.readFileSync(`${REPO}/sources/${id}.txt`).toString("utf8").split("\n"));
const norm = s => s.replace(/[−–]/g, "-").replace(/\s+/g, "");
// Sources that diagonalized the cluster themselves and print an exact energy another source's row already
// carries: a row of their own (RULES.md 6, every published diagonalization of an exact energy is a row,
// 2026-10-24). arXiv:2305.12776 compares its selected configurations with the FCI wave functions of H10 at
// 1.8 and 3.6 bohr (its Fig. 7c, d: "percentages of the selected sample ... using the FCI wave function"),
// so it ran the FCI. Not here: arXiv:1904.01131 Table II, whose FCI column is Ref. [66]'s digits with no
// statement that the authors computed it, and arXiv:2604.02054, which does not say where its FCI benchmark
// comes from (held for a second reading).
const INDEPENDENT_EXACT = { "2305.12776": "the source's own FCI: it compares its selected configurations with the FCI wave functions at 1.8 and 3.6 bohr (Fig. 7c, d), a row beside Motta et al.'s under RULES.md 6 (2026-10-24)" };
for (const f of fs.readdirSync(READDIR).filter(f => /^result-\d+\.json$/.test(f)).sort()) {
  const o = JSON.parse(fs.readFileSync(`${READDIR}/${f}`, "utf8"));
  notRows.push(...(o.not_rows || [])); unclear.push(...(o.unclear || [])); coverage.push(...(o.coverage || []));
  for (const c of o.rows || []) {
    const H = (reason) => held.push({ source: c.arxiv, item: `${c.table || ""} line ${c.line}: ${c.method_as_published} N=${c.N} R=${c.R_as_printed} ${c.R_unit} ${c.boundary} ${c.basis}`, value: c.as_printed, reason });
    let L; try { L = lines(c.arxiv); } catch { H("source text missing"); continue; }
    const target = norm(c.as_printed);
    const hit = [0, -1, 1].map(d => c.line + d).find(n => n >= 1 && n <= L.length && norm(L[n - 1]).includes(target));
    if (!hit) { H("printed string not found on the cited line (±1): reader error or extraction artefact"); continue; }
    if (c.confidence === "low") { H(`reader confidence low (${c.note}): needs a second reading before it is filed`); continue; }
    if (c.arxiv === "1904.01131" && c.quantity === "relative") continue; // filed as FCI + difference by g1904.mjs
    if (!(c.geometry === "chain" || c.geometry === "sheet") || !Number.isInteger(c.N)) { H("geometry or N not stated"); continue; }
    if (/\bS\s*=\s*[1-9]|triplet|quintet|sector/i.test(`${c.note} ${c.method_as_published}`)) { H(`spin sector other than the lowest S_z (note: ${c.note}): belongs to another sector's instance (RULES.md §2, §13.1)`); continue; }
    if (c.boundary === "P") { H(`periodic: twist "${c.twist}", k-mesh ${c.kmesh ?? "n/a"}; exchange-divergence treatment not recorded (RULES.md §13.2, needs_review)`); continue; }
    const elec = c.quantity === "electronic_only" || c.nuclear_repulsion === "excluded";
    if (elec && !(c.geometry === "chain" && c.boundary === "O")) { H("electronic energy without nuclear repulsion on a geometry the conversion does not cover yet"); continue; }
    if (c.quantity !== "total" && !elec) { H(`quantity "${c.quantity}"${c.reference_energy ? `, reference ${c.reference_energy}` : ""}: not a total energy; a correlation energy needs its printed reference on the same instance (§13.3), done by hand`); continue; }
    if (!HA[c.unit]) { H(`unit "${c.unit}" not fixed`); continue; }
    if (!["atom", "total", "electron"].includes(c.per)) { H(`normalisation "${c.per}" not fixed`); continue; }
    // thousands separator as printed ("-2,167.55" in mHa)
    const pm = norm(c.as_printed).match(/^(-?[\d.]+)±([\d.]+)$/);
    const v = pm ? +pm[1] : +norm(c.as_printed).replace(/(\d),(\d{3})/g, "$1$2").replace(/\(.*\)$/, "");
    if (!Number.isFinite(v)) { H("value does not parse"); continue; }
    const perDiv = c.per === "total" ? c.N : 1;
    let eps = v * HA[c.unit] / perDiv, enn = null;
    let R0 = c.R_unit === "angstrom" ? +(+c.R_as_printed * BOHR_PER_ANG).toPrecision(6) : +c.R_as_printed;
    const R = R0;
    if (!Number.isFinite(R)) { H("bond length does not parse"); continue; }
    if (elec) { // nuclear repulsion of N unit point charges spaced R bohr on a line, per atom
      enn = 0; const Rb = c.R_unit === "angstrom" ? +c.R_as_printed * BOHR_PER_ANG : +c.R_as_printed;
      for (let k = 1; k < c.N; k++) enn += (c.N - k) / (k * Rb);
      eps += enn / c.N;
    }
    if (eps > -0.3 || eps < -0.7) { H(`per-atom energy ${eps.toFixed(5)} Ha outside -0.7..-0.3: unit, normalisation or nuclear repulsion doubtful`); continue; }
    let basis = (c.basis || "").trim() || "unstated";
    // real-space VMC / DMC: the Gaussian basis is the trial state's, the energy is basis-free (RULES.md §13.1)
    let trial = "";
    if (/\b(VMC|DMC|JSD|JAGP|Jastrow)\b/.test(c.method_as_published) && basis !== "none") { trial = `trial state in ${basis}`; basis = "none"; }
    if (basis === "unstated") { H("basis not stated"); continue; }
    const inst = { geometry: c.geometry, N: c.N, boundary: "O", R, basis: /^none$/i.test(basis) ? "none" : basis };
    const id = instanceId(inst);
    const s = pm ? +pm[2] : sigmaFromParen(norm(c.as_printed));
    const sig = s == null ? null : s * HA[c.unit] / perDiv;
    if (c.origin === "quoted") {
      const digits = ((norm(c.as_printed).replace(/\(.*$/, "").split(".")[1]) || "").length;
      const tolq = 10 ** -digits * HA[c.unit] / perDiv + 1e-9;
      const cand = prior.filter(r => r.instance_id === id && Math.abs(r.eps - eps) < tolq);
      const surname = r => (r.reference.split(",")[0].trim().split(/\s+/).pop() || "").replace(/[^A-Za-z]/g, "");
      const hitq = cand.find(r => (c.primary_ref || "").includes(surname(r))) || cand[0];
      if (hitq) H(`quoted; resolved in the primary: the same value as the carried row ${hitq.method}${hitq.method_detail ? ` (${hitq.method_detail})` : ""} from ${hitq.arxiv} on ${id} (${(hitq.eps * c.N).toFixed(6)} total) - not a new row`);
      else H(`quoted from ${c.primary_ref || "an unnamed source"}: primary not read, or the value is not among the primary's carried rows on ${id}`);
      continue;
    }
    let ex = null;
    if (c.bound_type === "exact") {
      ex = [...prior, ...rows].find(r => r.instance_id === id && r.bound_type === "exact" && Math.abs(r.eps - eps) <= 1e-6 + 0.5 * 10 ** -((norm(c.as_printed).split(".")[1] || "").replace(/\(.*$/, "").length) * HA[c.unit] / perDiv + 1e-9);
      if (ex && !INDEPENDENT_EXACT[c.arxiv]) { H(`exact value already carried on ${id} (${ex.method}, ${ex.arxiv}) to the printed digits: not a new row (RULES.md §11)`); continue; }
    }
    const indep = ex ? INDEPENDENT_EXACT[c.arxiv].replace("Motta et al.'s", `the ${ex.method} of arXiv:${ex.arxiv}`) : null;
    rows.push({
      instance_id: id, create: createHeader(inst), eps, sigma_per_site: c.sampled && sig != null ? +sig.toPrecision(6) : null, tol: 5e-7, origin: "own",
      arxiv: c.arxiv, reference: refs[c.arxiv]?.reference || `arXiv:${c.arxiv}`, peer_reviewed: refs[c.arxiv]?.peer_reviewed ?? null,
      method: c.method_as_published, method_detail: trial, bound_type: /\(T\)/.test(c.method_as_published) ? "approximate" : ["exact", "variational", "projected", "extrapolated", "approximate"].includes(c.bound_type) ? c.bound_type : null,
      bound_type_reason: c.bound_reason, sampled: !!c.sampled,
      reported_as: `${c.as_printed} ${c.unit} per ${c.per}${enn != null ? `; electronic energy as printed, nuclear repulsion ${(enn).toFixed(6)} Ha (point protons, N = ${c.N}, R as printed) added by the generator (RULES.md §13.2)` : ""}${c.R_unit === "angstrom" ? `; R = ${c.R_as_printed} Å = ${R} bohr` : ""}`,
      evidence: `${c.table}; sources/${c.arxiv}.txt line ${hit}; version read: arXiv text${refs[c.arxiv]?.peer_reviewed ? "; journal copy not reached (publisher returned HTTP 403 or a login page, 2026-10-21); read again when reachable (RULES.md §8)" : "; no journal version found"}`,
      convention_check: c.evidence_units, confidence: c.confidence, verified_by: "single reading (Sonnet reader)", defect: null,
      note: [c.note, indep].filter(Boolean).join("; "),
      // one unit in the last printed digit, per atom (SWEEP.md, precision_per_site)
      ...(indep ? { independent_exact: true, precision_per_site: +(10 ** -((norm(c.as_printed).split(".")[1] || "").replace(/\(.*$/, "").length) * HA[c.unit] / perDiv).toPrecision(3) } : {}),
    });
  }
}
fs.writeFileSync(OUT, JSON.stringify({ rows, held, notRows, unclear, coverage }, null, 1));
console.log(`readers: ${rows.length} rows, ${held.length} held, ${notRows.length} not-rows, ${unclear.length} unclear; papers with rows: ${[...new Set(rows.map(r => r.arxiv))].join(" ")}`);
