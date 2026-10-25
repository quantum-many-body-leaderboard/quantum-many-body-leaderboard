// Rows from Motta et al., PRX 7, 031059 (2017): Tables II-IV of the arXiv text (sources/1705.01608.txt)
// and the finite-N files of its data repository (sources/1705.01608-data-b99a183.tsv).
// A table cell is the row's value where it exists (RULES.md §8: a table outranks other prints);
// the dataset value is checked against it and recorded. Every other finite-N OBC value is cited to the dataset.
import fs from "node:fs";
import { instanceId, createHeader, sigmaFromParen, num, OUT_DIR } from "./common.mjs";

const REPO = process.argv[2] ?? ".";
const OUT = process.argv[3] ?? `${OUT_DIR}/out-motta2017.json`;
const T = fs.readFileSync(`${REPO}/sources/1705.01608.txt`, "utf8").split("\n");
const D = fs.readFileSync(`${REPO}/sources/1705.01608-data-b99a183.tsv`, "utf8").split("\n").slice(2).filter(Boolean)
  .map(l => { const [path, content] = l.split("\t"); return { path, content }; });

const REF = "M. Motta, D. M. Ceperley, G. K.-L. Chan, J. A. Gomez, E. Gull, S. Guo, C. A. Jiménez-Hoyos, T. N. Lan, J. Li, F. Ma, A. J. Millis, N. V. Prokof’ev, U. Ray, G. E. Scuseria, S. Sorella, E. M. Stoudenmire, Q. Sun, I. S. Tupitsyn, S. R. White, D. Zgid & S. Zhang, Towards the Solution of the Many-Electron Problem in Real Materials: Equation of State of the Hydrogen Chain with State-of-the-Art Many-Body Methods, Phys. Rev. X 7, 031059 (2017), arXiv:1705.01608, doi:10.1103/PhysRevX.7.031059";
const DATASET = "github.com/simonsfoundation/hydrogen-benchmark-PRX, commit b99a183 (2017-10-09, uploaded by the authors), CC BY 4.0";
const BASIS = { STO: "STO-6G", DZ: "cc-pVDZ", TZ: "cc-pVTZ", QZ: "cc-pVQZ", "5Z": "cc-pV5Z", SBSTO: "sliced-basis STO-6G", SBDZ: "sliced-basis cc-pVDZ", SBTZ: "sliced-basis cc-pVTZ" };

// Method key (dataset name) -> [method name, bound_type, sampled, method_detail]
function classify(key, cbs) {
  const k = key;
  let m;
  if (k === "FCI") m = ["FCI", "exact", false, ""];
  else if (k === "MRCI") m = ["MRCI", "variational", false, "(10,10) CASSCF reference, internally contracted"];
  else if (k === "MRCI+Q") m = ["MRCI+Q", "projected", false, "(10,10) CASSCF reference, Davidson correction"];
  else if (k === "MRCI+Q+F12") m = ["MRCI-F12+Q", "projected", false, "(10,10) CASSCF reference, Davidson and F12 corrections"];
  else if (k === "AFQMC") m = ["AFQMC", "projected", true, "phaseless"];
  else if (k === "AFQMC-SD") m = ["AFQMC", "projected", true, "phaseless, single-determinant trial (dataset label AFQMC-SD)"];
  else if (k === "AFQMC-MD") m = ["AFQMC", "projected", true, "phaseless, multi-determinant trial (dataset label AFQMC-MD)"];
  else if (/^DMET_(\d+)$/.test(k)) m = ["DMET", "projected", false, `fragment of ${k.split("_")[1]} atoms`];
  // Settled by reading (2026-10-21): Appendix A runs Block "with the standard settings described in Ref. [66]" up to
  // D = 2000; Ref. [66] (Olivares-Amaya et al., JCP 142, 034102, Sec. II B-D) ends the default schedule at the maximum
  // M and treats extrapolation in the discarded weight as a separate step, and the paper, which names every
  // extrapolation it makes (basis, N, lattice spacing, fragment size), names none in the bond dimension.
  else if (k === "DMRG") m = ["DMRG", "variational", false, "Block, bond dimension up to 2000"];
  else if (k === "SBDMRG") m = ["SBDMRG", "variational", false, "sliced basis, grid spacing 0.1"];
  else if (k === "GF2") m = ["GF2", "approximate", false, "self-consistent"];
  else if (k === "UGF2") m = ["GF2", "approximate", false, "spin-unrestricted, self-consistent"];
  else if (k === "SC-GW") m = ["GW", "approximate", false, "fully self-consistent"];
  else if (/^SEET/.test(k)) m = ["SEET", "projected", false, k.replace(/^SEET_/, "").replace("mix", "m")];
  else if (k === "PC-NEVPT2" || k === "SC-NEVPT2") m = [k, "approximate", false, "(10,10) CASSCF reference"];
  else if (k === "RHF" || k === "UHF") m = [k, "variational", false, ""];
  else if (k === "RCCSD" || k === "UCCSD") m = [k, "projected", false, ""];
  else if (k === "RCCSD(T)" || k === "UCCSD(T)") m = [k, "approximate", false, ""]; // RULES.md §13.4, provisional (2026-10-21)
  else if (/^LRDMC_(LDA|AGP)$/.test(k)) m = ["LR-DMC", "projected", true, `${k.split("_")[1]} trial state, cc-pVTZ trial basis`];
  else if (/^VMC_(LDA|AGP)$/.test(k)) m = ["VMC", "variational", true, `${k.split("_")[1]} determinant with Jastrow factor, cc-pVTZ trial basis`];
  else return null;
  if (cbs) {
    m = [...m];
    m[3] = [m[3], "extrapolated: complete basis set"].filter(Boolean).join("; ");
    // RULES.md §13.4: a complete-basis-set extrapolation is extrapolated, whatever the class of the method extrapolated, except an approximate method
    if (m[1] !== "approximate") m[1] = "extrapolated";
  }
  return m;
}

// Text tables: [first line, last line, columns (dataset keys or null), basis or "CBS"], 1-based lines.
const TABLES = [
  { name: "Table II", from: 1252, to: 1261, basis: "STO", cols: ["AFQMC", "DMET_2", "FCI", "GF2", "SC-GW", "SEET_CI-HF_mix(4,SAO)", "SEET_CI-HF_mix(6,SAO)", "SEET_CI-GF2_mix(6,SAO)", "RCCSD", "RCCSD(T)", "UCCSD", "UCCSD(T)", "RHF", "UHF"] },
  { name: "Table III (first block)", from: 1267, to: 1276, basis: "CBS", cols: ["AFQMC", "DMET_2", "LRDMC_AGP", "LRDMC_LDA", "MRCI+Q", "MRCI+Q+F12", "PC-NEVPT2", "SC-NEVPT2"] },
  { name: "Table III (second block)", from: 1280, to: 1289, basis: "CBS", cols: ["SBDMRG", "RCCSD", "RCCSD(T)", "UCCSD", "UCCSD(T)", "UHF", "VMC_AGP", "VMC_LDA"] },
  { name: "Table IV", from: 1401, to: 1412, basis: null, cols: [["MRCI+Q", "DZ"], ["MRCI+Q", "TZ"], ["MRCI+Q", "QZ"], ["MRCI+Q", "5Z"]] },
];
const cells = new Map(); // key: N|R|method|basis -> {str, line, table}
for (const t of TABLES) for (let ln = t.from; ln <= t.to; ln++) {
  const line = T[ln - 1];
  if (!line || !/^\s*\d\.\d\s/.test(line)) continue;
  const tok = line.trim().split(/\s+/).slice(0, t.cols.length + 1);
  const R = tok[0];
  t.cols.forEach((c, i) => {
    const s = tok[i + 1];
    if (!s || s === "N/A") return;
    const [meth, b] = Array.isArray(c) ? c : [c, t.basis];
    cells.set(`10|${+R}|${meth}|${b}`, { str: s, line: ln, table: t.name });
  });
}

const rows = [], held = [];
const used = new Set();
for (const { path, content } of D) {
  const m = path.match(/^N_(\d+)_(OBC|PBC)\/R_([\d.]+)\/(.+?)(?:_basis-(\w+)|_CBS)$/);
  if (!m) { held.push({ source: "1705.01608-data", item: path, reason: "path not parsed" }); continue; }
  const [, Ns, bc, Rs, key, bkey] = m;
  const N = +Ns, R = +Rs, cbs = !bkey;
  if (/nan|N\/A/.test(content)) continue; // placeholder files, no value
  const cls = classify(key, cbs);
  const where = `${path} in sources/1705.01608-data-b99a183.tsv`;
  if (!cls) { held.push({ source: "1705.01608-data", item: path, value: content, reason: "method key not mapped" }); continue; }
  if (bc === "PBC") { held.push({ source: "1705.01608-data", item: path, value: content, reason: "periodic supercell (40 x 40 bohr transverse, 3D Ewald): twist and exchange-divergence treatment not stated (RULES.md §13.2, needs_review)" }); continue; }
  const continuum = /^(LRDMC|VMC)_/.test(key);
  if (bkey && /^SB/.test(bkey)) { held.push({ source: "1705.01608-data", item: path, value: content, reason: "sliced basis with finite-difference kinetic energy (grid spacing 0.1): not a projection of H onto a basis, no §13 instance" }); continue; }
  if (key === "MRCI+Q+F12" && !cbs) { held.push({ source: "1705.01608-data", item: path, value: content, reason: "F12 adds explicitly correlated terms outside the basis: the energy is not a claim about the cc-pVxZ instance and not a complete-basis value" }); continue; }
  const basis = cbs || continuum ? "none" : BASIS[bkey];
  const [vs, es] = content.trim().split(/\s+/);
  const total = +vs, err = es != null ? +es : null;
  const eps = total / N;
  const inst = { geometry: "chain", N, boundary: "O", R, basis };
  const id = instanceId(inst);
  const tkey = `${N}|${R}|${key}|${cbs ? "CBS" : continuum ? "CBS" : bkey}`;
  const cell = cells.get(tkey);
  let row = {
    instance_id: id, create: createHeader(inst),
    tol: 5e-7, origin: "own", arxiv: "1705.01608", reference: REF, peer_reviewed: true,
    method: cls[0], method_detail: cls[3], bound_type: cls[1], sampled: cls[2],
    confidence: "high", verified_by: "single reading", defect: null,
    convention_check: "Hartree, lengths in bohr (Appendix B). Total energies with nuclear repulsion: FCI/STO-6G H10 at R = 1.8 is -5.42438538 in the dataset and -0.542439 per atom in Table II, and the paper's FCI E_inf = -0.471039 is the STO-6G hydrogen-atom energy per atom.",
  };
  if (cell) {
    used.add(tkey);
    const eT = num(cell.str);
    // UHF in Table III is printed as a total for H10 (-5.40150(2) beside per-atom columns near -0.54).
    const tableTotal = Math.abs(eT) > 2;
    const epsT = tableTotal ? eT / N : eT;
    const digits = (cell.str.replace(/\(.*$/, "").split(".")[1] || "").length;
    // tables truncate or round to the printed digits (case: RULES.md §11): agreement means less than one unit of the last printed digit
    const halfUlp = 10 ** -digits / (tableTotal ? N : 1) - 1e-12;
    if (Math.abs(epsT - eps) >= halfUlp) {
      held.push({ source: "1705.01608", item: `${cell.table} line ${cell.line} ${cls[0]} R=${R}`, value: cell.str, dataset: content, reason: `table and dataset disagree by one unit of the last printed digit or more (${epsT} vs ${eps.toFixed(8)} per atom)` });
      continue;
    }
    const sig = sigmaFromParen(cell.str.replace("−", "-"));
    Object.assign(row, {
      // the (..) is per atom also where the cell prints the H10 total (Table III UHF column; it tracks the dataset _CBS error / 10
      // at all ten R). Fixed after the verify pass of 2026-10-23/24; the values published before stay in the rows' corrections.
      eps: epsT, sigma_per_site: sig,
      reported_as: cell.str + (tableTotal ? " (printed as the H10 total, in a column of per-atom values)" : " per atom"),
      evidence: `${cell.table}, R = ${R} row; sources/1705.01608.txt line ${cell.line}; version read: journal PDF (PRX 7, 031059, APS, sources/1705.01608-PhysRevX.7.031059.txt) and arXiv text; the table values agree digit for digit. Dataset file ${path}: ${content.trim()}`,
    });
    // Ruling 2026-10-24 (ruling 2 of the hydrogen verify pass): the printed complete-basis fit uncertainty is the sigma of an
    // approximate CBS row too, as on the paper's extrapolated CBS rows; the journal print wins where print and repository disagree.
    if (!cls[2] && row.bound_type !== "extrapolated" && !cbs) row.sigma_per_site = null;
  } else {
    Object.assign(row, {
      eps, sigma_per_site: err == null ? null : err / N,
      reported_as: `${content.trim()} (total for N = ${N}${err != null ? "; second number the stated uncertainty" : ""})`,
      evidence: `dataset ${DATASET}, file ${where}; number first printed in the dataset (RULES.md §8), the paper is the method reference`,
      dataset: DATASET,
    });
    // a deterministic finite-basis energy carries no statistical sigma (RULES.md §6); keep the stated uncertainty in the note
    if (!cls[2] && row.bound_type !== "extrapolated" && err != null) { row.uncertainty_note = `stated uncertainty ${es} (total), not a statistical error bar`; row.sigma_per_site = null; }
  }
  rows.push(row);
}
for (const [k, c] of cells) if (!used.has(k)) held.push({ source: "1705.01608", item: `${c.table} line ${c.line} ${k}`, value: c.str, reason: "table cell with no matching dataset file; not filed by the generator, needs a hand reading" });
fs.mkdirSync(OUT.replace(/\/[^/]*$/, ""), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ rows, held }, null, 1));
console.log(`motta2017: ${rows.length} rows, ${held.length} held; table cells ${cells.size}, matched ${used.size}`);
