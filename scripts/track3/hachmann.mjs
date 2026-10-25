// Hachmann, Cardoen & Chan, J. Chem. Phys. 125, 144101 (2006), arXiv:cond-mat/0606115 (v3, pdftotext -layout,
// sources/cond-mat-0606115.txt). Table VI: symmetric dissociation of H50 (equally spaced, STO-6G, open):
// total RHF energy and correlation energies. A correlation energy with its printed reference on the same instance
// is a row (RULES.md §13.3): stored as E_RHF + E_corr. "conv." cells (converged at a smaller M) are not rows.
import fs from "node:fs";
import { instanceId, createHeader, OUT_DIR } from "./common.mjs";
const [REPO = ".", OUT = `${OUT_DIR}/out-hachmann.json`] = process.argv.slice(2);
const L = fs.readFileSync(`${REPO}/sources/cond-mat-0606115.txt`, "utf8").split("\n");
const REF = "J. Hachmann, W. Cardoen & G. K.-L. Chan, Multireference correlation in long molecules with the quadratic scaling density matrix renormalization group, J. Chem. Phys. 125, 144101 (2006), arXiv:cond-mat/0606115, doi:10.1063/1.2345196";
const COLS = [["MP2", "approximate", "RHF reference"], ["CCSD", "projected", "RHF reference"], ["CCSD(T)", "approximate", "RHF reference; RULES.md §13.4 (provisional, 2026-10-21)"],
  ["LDMRG", "variational", "M = 50"], ["LDMRG", "variational", "M = 100"], ["LDMRG", "variational", "M = 250"], ["LDMRG", "variational", "M = 500"]];
const rows = [], held = [];
for (const ln of [826, 827, 828, 829, 830, 831, 833, 835, 837, 839, 841]) {
  const raw = L[ln - 1];
  const s = raw.replace(/(\.\d{3}) (\d{1,3})\b/g, "$1$2");
  const toks = s.trim().split(/\s+/);
  const R = +toks[0], erhf = toks[1], el = toks[2];
  let cells = toks.slice(3); // MP2, [CCSD, CCSD(T)], LDMRG50..500 with conv. placeholders
  const cols = cells.length === 7 ? COLS : [COLS[0], ...COLS.slice(3)];
  if (cells.length !== cols.length) throw new Error(`line ${ln}: ${cells.length} cells`);
  const N = 50, inst = { geometry: "chain", N, boundary: "O", R, basis: "STO-6G" }, id = instanceId(inst);
  const base = { instance_id: id, create: createHeader(inst), tol: 5e-7, origin: "own", arxiv: "cond-mat/0606115", reference: REF, peer_reviewed: true,
    sigma_per_site: null, sampled: false, confidence: "high", verified_by: "single reading", defect: null,
    convention_check: "Hartree totals: E_RHF (total, with nuclear repulsion) and E_RHF,el printed side by side; at R = 1.8 bohr E_RHF + E_corr[LDMRG(500)] = -27.03865 against the 2017 STO-6G DMRG -27.03864 for H50.",
    evidence_base: `Table VI, R = ${R} row; sources/cond-mat-0606115.txt line ${ln}; version read: arXiv v3 (journal copy not reached, AIP HTTP 403)` };
  const mk = (method, bt, detail, eTot, reported) => { const { evidence_base, ...b } = base; rows.push({ ...b, method, method_detail: detail, bound_type: bt, eps: +(eTot / N).toFixed(9), reported_as: reported, evidence: evidence_base }); };
  mk("RHF", "variational", "", +erhf, `E_RHF ${raw.trim().split(/\s+/).slice(1, 3).join(" ")} (total)`);
  cols.forEach(([m, bt, d], i) => {
    const c = cells[i];
    if (/^conv/.test(c)) return;
    const e = +erhf + +c;
    mk(m, bt, d, e, `E_RHF ${erhf} + E_corr ${c} = ${e.toFixed(5)} (totals)`);
  });
}
fs.writeFileSync(OUT, JSON.stringify({ rows, held }, null, 1));
console.log(`hachmann: ${rows.length} rows`);
