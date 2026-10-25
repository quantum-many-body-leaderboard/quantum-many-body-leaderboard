// arXiv:1904.01131 Table II (H10, STO-6G, open): FCI total and differences from FCI in mHa.
// Sign settled by reading (2026-10-21): difference = method - FCI. The text calls the large negative CCSD
// values at 3.2 a.u. a "non-variational collapse" and the -47.3 CCSDT value at 3.6 a.u. "a sizable CCSDT energy
// error of 47 milliHartree"; the CCSD column equals the RCCSD/STO-6G energies of the 2017 data minus FCI
// (R = 1.8: -5.422549 + 5.424385 = +1.84 mHa, printed 1.8; R = 3.2: -990.4, printed -990.0).
import fs from "node:fs";
import { instanceId, createHeader, OUT_DIR, T3 } from "./common.mjs";
const [REPO = ".", REFS = `${T3}/refs-hydrogen.json`, OUT = `${OUT_DIR}/out-1904.json`] = process.argv.slice(2);
const refs = JSON.parse(fs.readFileSync(REFS, "utf8"));
const L = fs.readFileSync(`${REPO}/sources/1904.01131.txt`).toString("utf8").split("\n");
const COLS = [
  ["CCSD", null, "the RCCSD energies of the 2017 data (Ref. [66] there), collated: duplicate"],
  ["CCSDT", "projected", ""], ["CCSDTQ", "projected", ""], ["MkMRCCSD", "projected", ""],
  ["MkMRCCSD(T)", "approximate", "perturbative triples on coupled cluster, RULES.md §13.4 (provisional, 2026-10-21)"],
  ["RPE", null, "robust phase estimation of a first-order Trotter-Suzuki circuit (Microsoft QDK): Trotter bias, no §13.4 class"],
];
const rows = [], held = [];
for (let ln = 1752; ln <= 1761; ln++) {
  const s = L[ln - 1].replace(/[−–]/g, "-");
  const toks = [...s.matchAll(/(-?\d+\.\d+)(?:±\s*(\d+\.\d+))?/g)].map(m => ({ v: m[1], s: m[2], raw: m[0] }));
  const [Rt, fci, ...d] = toks;
  if (d.length !== 6) throw new Error(`line ${ln}: ${d.length} differences`);
  const R = +Rt.v, N = 10, inst = { geometry: "chain", N, boundary: "O", R, basis: "STO-6G" };
  const id = instanceId(inst);
  d.forEach((x, i) => {
    const [method, bt, why] = COLS[i];
    const item = `Table II line ${ln} ${method} R=${R}`;
    if (method === "CCSD") { held.push({ source: "1904.01131", item, value: x.raw, reason: why }); return; }
    if (method === "RPE") { held.push({ source: "1904.01131", item, value: x.raw, reason: why }); return; }
    const total = +fci.v + (+x.v) * 1e-3;
    rows.push({
      instance_id: id, create: createHeader(inst), eps: +(total / N).toFixed(8),
      sigma_per_site: x.s ? +(+x.s * 1e-3 / N).toPrecision(6) : null, tol: 5e-6, origin: "own", arxiv: "1904.01131",
      reference: refs["1904.01131"]?.reference || "arXiv:1904.01131", peer_reviewed: refs["1904.01131"]?.peer_reviewed ?? null,
      method, method_detail: "RHF orbitals", bound_type: bt, sampled: false, confidence: "medium", verified_by: "single reading", defect: null,
      reported_as: `FCI ${fci.v} Ha (total) + difference ${x.raw} mHa = ${total.toFixed(6)} Ha`,
      evidence: `Table II, R = ${R} row; sources/1904.01131.txt line ${ln}; difference = method - FCI (settled 2026-10-21 from the text); version read: arXiv text`,
      convention_check: "Totals in Hartree with nuclear repulsion: the FCI column equals the 2017 STO-6G FCI totals to 5 decimals.",
      ...(why ? { note: why } : {}),
    });
  });
}
fs.writeFileSync(OUT, JSON.stringify({ rows, held }, null, 1));
console.log(`1904.01131: ${rows.length} rows, ${held.length} held`);
