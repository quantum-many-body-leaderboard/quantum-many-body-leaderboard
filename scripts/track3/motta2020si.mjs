// Rows from Motta et al., PRX 10, 031058 (2020), Supplemental Information Table III (H10, open, R = 1.0 bohr),
// arXiv ancillary file si-compressed.pdf, text in sources/1911.01618-anc-si.txt.
// The table prints HF per atom and MP2 / CCSD correlation energies per atom: a correlation energy is a row
// where the source prints its reference energy on the same instance (RULES.md §13.3); the row stores HF + E_c.
import fs from "node:fs";
import { instanceId, createHeader, num, OUT_DIR } from "./common.mjs";
const [REPO = ".", MOTTA = `${OUT_DIR}/out-motta2017.json`, OUT = `${OUT_DIR}/out-motta2020si.json`] = process.argv.slice(2);
const L = fs.readFileSync(`${REPO}/sources/1911.01618-anc-si.txt`, "utf8").split("\n");
const motta = JSON.parse(fs.readFileSync(MOTTA, "utf8")).rows;
const REF = "M. Motta, C. Genovese, F. Ma, Z.-H. Cui, R. Sawaya, G. K.-L. Chan, N. Chepiga, P. Helms, C. Jiménez-Hoyos, A. J. Millis, U. Ray, E. Ronca, H. Shi, S. Sorella, E. M. Stoudenmire, S. R. White & S. Zhang, Ground-State Properties of the Hydrogen Chain: Dimerization, Insulator-to-Metal Transition, and Magnetic Phases, Phys. Rev. X 10, 031058 (2020), arXiv:1911.01618, doi:10.1103/PhysRevX.10.031058";
const BAS = { DZ: "cc-pVDZ", TZ: "cc-pVTZ", QZ: "cc-pVQZ", "5Z": "cc-pV5Z", "aug-TZ": "aug-cc-pVTZ", "aug-QZ": "aug-cc-pVQZ" };
const rows = [], held = [];
for (let ln = 1269; ln <= 1276; ln++) {
  const tok = L[ln - 1].trim().split(/\s+/);
  const label = tok[0];
  if (label === "CBS") { held.push({ source: "1911.01618", item: `SI Table III line ${ln} CBS`, value: tok[1], reason: "Hartree-Fock complete-basis estimate the caption attributes to an extrapolated sliced-basis calculation of its Ref. [36]: quoted, primary not read" }); continue; }
  const nao = +tok[1];
  if (label === "aug-QZ" && nao === 90) { held.push({ source: "1911.01618", item: `SI Table III line ${ln}`, value: tok.slice(2).join(" "), reason: "row labelled aug-QZ with NAO = 90 (9 orbitals per atom, the size of aug-cc-pVDZ); a second aug-QZ row has NAO = 460. Basis label doubtful, not filed" }); continue; }
  const basis = BAS[label];
  const [hf, mp2, ccsd] = tok.slice(2);
  const inst = { geometry: "chain", N: 10, boundary: "O", R: 1.0, basis };
  const base = {
    instance_id: instanceId(inst), create: createHeader(inst), tol: 5e-6, origin: "own", arxiv: "1911.01618", reference: REF, peer_reviewed: true,
    sigma_per_site: null, sampled: false, confidence: "high", verified_by: "single reading", defect: null,
    convention_check: "Hartree per atom, total energy with nuclear repulsion: the cc-pVDZ HF value -0.40101 matches RHF/cc-pVDZ of the 2017 data set (-4.010066006349 for H10).",
  };
  const ev = c => `SI Table III, row "${label}" (NAO ${nao}), ${c}; sources/1911.01618-anc-si.txt line ${ln}; version read: APS Supplemental Material (si.pdf, sources/1911.01618-PhysRevX.10.031058-si.txt) and the arXiv ancillary SI; identical`;
  const cand = [
    { method: "HF", method_detail: "", bound_type: "variational", eps: num(hf), reported_as: `${hf} per atom (HF column)`, col: "HF column" },
    mp2 && { method: "MP2", method_detail: "HF reference", bound_type: "approximate", eps: +(num(hf) + num(mp2)).toFixed(5), reported_as: `HF ${hf} + MP2 correlation ${mp2} per atom`, col: "HF and MP2 columns" },
    ccsd && { method: "CCSD", method_detail: "HF reference", bound_type: "projected", eps: +(num(hf) + num(ccsd)).toFixed(5), reported_as: `HF ${hf} + CCSD correlation ${ccsd} per atom`, col: "HF and CCSD columns" },
  ].filter(Boolean);
  for (const c of cand) {
    const fam = c.method === "HF" ? /^RHF$/ : c.method === "CCSD" ? /^RCCSD$/ : null;
    const dup = fam && motta.find(r => r.instance_id === base.instance_id && fam.test(r.method) && Math.abs(r.eps - c.eps) < 1e-5);
    if (dup) { held.push({ source: "1911.01618", item: `SI Table III line ${ln} ${c.method} ${label}`, value: c.reported_as, reason: `duplicate (RULES.md §11): the same energy as the 2017 row ${dup.method} ${dup.eps.toFixed(7)} per atom on ${dup.instance_id}, to the printed digits` }); continue; }
    rows.push({ ...base, method: c.method, method_detail: c.method_detail, bound_type: c.bound_type, eps: c.eps, reported_as: c.reported_as, evidence: ev(c.col) });
  }
}
fs.writeFileSync(OUT, JSON.stringify({ rows, held }, null, 1));
console.log(`motta2020si: ${rows.length} rows, ${held.length} held`);
