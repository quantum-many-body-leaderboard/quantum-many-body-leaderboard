// Generator of passes/rows/sweep-rows-2026-11-11-instances.json: the cells the 2026-11-11
// Ketboard/tachys pass held because their instance did not exist, and the instances they create
// (SWEEP.md, 2026-11-11).
//
// - arXiv:2304.01996 (Chen, Newhouse, Chen, Luo & Soljačić, NeurIPS 2023), Tables 1-4: the J1-J2
//   model on OPEN L x L squares, L = 8 (J2 = 0.2, 0.5, 0.8), 10 and 12 (J2 = 0.2 to 0.8): 17 new
//   instances J1J2/square_<N>_O_<J2>.
// - arXiv:2611.05174 (Sun, Roth, Chen & Heyl), Table I, L = 10: the 300-site kagome torus,
//   Heisenberg/kagome-10x10_300_P.
// - arXiv:2510.08430 (Shokry, Santini & Vicentini), Table 2: the periodic 16-site chain,
//   Heisenberg/chain_16_P. Its exact row is QMBL's own diagonalization (scripts/add_exact_rows.mjs,
//   batch B3; checks/heisenberg-chain-16-ed/), which creates the instance first.
//
// Every number below is copied from the committed source text as printed, and this script stops
// unless it finds the printed string on (or within five lines of) its cited line of that text
// (line numbers as grep -n counts them), compared with all whitespace removed, since the pypdf
// text of the NeurIPS PDF splits some cells ("-1 .93018 (8 )"). The values of arXiv:2304.01996 are
// read from the version of record (sources/2304.01996-neurips.txt) and must also appear in the
// arXiv v3 HTML (sources/2304.01996.html), whose table cells are LaTeXML spans; the two agree on
// all 159 energy cells of Tables 1-4. The script only fixes the per-site normalisation, the printed
// error bar and the instance.
//
// usage: node scripts/instances_2026_11_11.mjs   (writes the pass file; the build applies it)
import fs from "node:fs";

const OUT = "passes/rows/sweep-rows-2026-11-11-instances.json";

// --- references (Crossref and arXiv metadata, 2026-11-11) ------------------------------------
const REF = {
  "2304.01996": { pr: true, ref: "Chen, Newhouse, Chen, Luo & Soljačić, ANTN: Bridging Autoregressive Neural Networks and Tensor Networks for Quantum Many-Body Simulation, Adv. Neural Inf. Process. Syst. 36 (NeurIPS 2023), 450-476, doi:10.52202/075280-0022, arXiv:2304.01996" },
  // Same reference string as the 2026-11-11 Ketboard pass's rows of this paper.
  "2611.05174": { pr: false, ref: "Sun, Roth, Chen & Heyl, Evidence for a Dirac Spin Liquid in the Kagome Heisenberg Antiferromagnet from High-Precision Neural-Network Quantum States, arXiv:2611.05174" },
  // The first page of the arXiv text names the 1st Workshop on Differentiable Systems and Scientific
  // Machine Learning @ EurIPS 2025; arXiv lists no journal reference and Crossref no record.
  "2510.08430": { pr: false, ref: "Shokry, Santini & Vicentini, When Less is More: Approximating the Quantum Geometric Tensor with Block Structures, arXiv:2510.08430 (1st Workshop on Differentiable Systems and Scientific Machine Learning @ EurIPS 2025)" },
};
const VERSION = {
  "2304.01996": "version read: the version of record, Adv. Neural Inf. Process. Syst. 36 (NeurIPS 2023), publisher PDF from proceedings.neurips.cc (text in sources/2304.01996-neurips.txt), and arXiv v3 (HTML, sources/2304.01996.html); the two print the same value in every energy cell of Tables 1-4. The older committed PDF text (sources/2304.01996.txt) interleaves Tables 1 and 2 and reads the 10 x 10 MPS (8) cell at J2 = 0.7 as -1.7682258; the PDF page and both versions above print -1.768225",
  "2611.05174": "version read: arXiv 2611.05174v1 text (sources/2611.05174.txt), checked against the arXiv PDF; no journal version (arXiv metadata, 2026-11-11)",
  "2510.08430": "version read: arXiv text (sources/2510.08430.txt), checked against the arXiv v2 PDF; no journal version (arXiv metadata and Crossref, 2026-11-11)",
};

// --- instances ---------------------------------------------------------------------------
const I = {};
const OPEN_SQ = L => `${L} x ${L} square lattice, open boundaries in both directions: nearest- and next-nearest-neighbour bonds only inside the lattice (arXiv:2304.01996 Sec. 6.2: 'the challenging 2D J1-J2 Heisenberg model with open boundary condition', the setting of every energy table of the paper, Tables 1-4, and of its 4 x 4 to 12 x 12 transfer learning, Appendix D)`;
for (const [L, J2s] of [[8, [0.2, 0.5, 0.8]], [10, [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]], [12, [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]]])
  for (const J2 of J2s) I[`sq${L}O_${J2}`] = { id: `J1J2/square_${L * L}_O_${J2}`, model: "J1J2", lattice: "square", n_sites: L * L, boundary: "O", params: { J2 }, cluster: OPEN_SQ(L) };
I.kag10 = { id: "Heisenberg/kagome-10x10_300_P", model: "Heisenberg", lattice: "kagome-10x10", n_sites: 300, boundary: "P", params: {},
  cluster: "rhombic torus of 10 x 10 three-site unit cells, edge vectors 10 a1 and 10 a2 (a1, a2 the triangular Bravais vectors, 60 degrees apart), the pattern of kagome-6x6_108_P and kagome-8x8_192_P. Defined by arXiv:2611.05174: 'the torus, and the system sizes L = 6, 8 and 10, with number of sites N = 108, 192 and 300, respectively (N = L x L x 3)' (Model section), the three sublattice sites of each unit cell forming 'three L x L feature maps indexed along the primitive vectors a1 and a2 of the underlying triangular Bravais lattice', periodic 'through cyclic shifts of the Bravais-lattice indices' (Fig. 1 caption)" };
I.chain16 = { id: "Heisenberg/chain_16_P", model: "Heisenberg", lattice: "chain", n_sites: 16, boundary: "P", params: {}, cluster: undefined };

// --- conventions per source ---------------------------------------------------------------
const CONV = {
  "2304.01996": "Eq. (8): H = J1 sum_<i,j> σ_i.σ_j + J2 sum_<<i,j>> σ_i.σ_j with Pauli matrices (Eq. 9), J1 = 1; the tables print 'Energy per site' of this H, the Pauli form, so E/N in the S.S convention is the printed value / 4 (RULES.md 5). Open boundaries (Sec. 6.2). Plausibility: the 10 x 10 cells at J2 = 0.5 (best -1.94030(9), -0.48508 in S.S units) lie above the periodic 10 x 10 records (about -0.4976), as an open lattice with fewer bonds per site must.",
  "2611.05174": "Eq. (1): H = sum_<i,j> S_i.S_j with spin-1/2 operators; Table I prints the energy density e = E/N (S.S per site) at the Γ point with even spin inversion; L = 10 is the 300-site torus (N = 3 L^2).",
  "2510.08430": "The text writes H = sum_i S_i.S_{i+1} with S_i = σ_i / 2 on the periodic chain of L = 16 sites (lines 126-128), but Table 2's energies are in the Pauli form: the exact ground state of that H is -7.142296 (QMBL's diagonalization and Bethe ansatz, checks/heisenberg-chain-16-ed/), and -28.5685(3) read with S = σ/2 would lie four times below it, impossible for a variational energy. Read as the Pauli total (4 x S.S, RULES.md 5), the two rows lie 6.9e-4 and 1.8e-3 above the exact Pauli total -28.569185, at 2.3 and 3.0 printed sigma. Stored as printed, the Pauli total; E/N in S.S units is the printed value / 64.",
};

// --- readings ----------------------------------------------------------------------------
// Tables of arXiv:2304.01996, as printed in the version of record (sources/2304.01996-neurips.txt):
// [line, method string as printed, cells in column order]. Method strings: the row labels of the
// table each row comes from; Table 2's PixelCNN, Elementwise (8) and Blockwise (70) rows carry the
// labels Tables 3-5 print for the same runs, PixelCNN (7-48), EW (7-48-8) and BW (7-48-70) (Table 3
// repeats their 10 x 10 cells at J2 = 0.2, 0.5, 0.8, and Table 5 lists the same three networks for
// 12 x 12). Cells Tables 3 and 4 repeat from Table 2 are read once.
const ANTN = "2304.01996", NV = "2304.01996-neurips";
const T1 = { J2: [0.2, 0.5, 0.8], L: 8, where: "Table 1 (8 x 8)", rows: [
  [389, "RBM (NS)", ["-1.9609(16)", "-1.5128(20)", "-1.7508(19)"]],
  [390, "RBM (S)", ["-2.1944(17)", "-1.8625(20)", "-0.7267(29)"]],
  [391, "PixelCNN (NS)", ["-2.21218(16)", "-1.77058(29)", "-1.93825(16)"]],
  [392, "PixelCNN (S)", ["-2.23171(9)", "-1.88902(19)", "-1.83672(26)"]],
  [393, "Elementwise (8 NS)", ["-2.23690(4)", "-1.93018(8)", "-2.00036(16)"]],
  [394, "Elementwise (8 S)", ["-2.23688(4)", "-1.93102(7)", "-2.00262(11)"]],
  [395, "Blockwise (70 NS)", ["-2.23484(7)", "-1.93000(7)", "-1.99148(13)"]],
  [396, "Blockwise (70 S)", ["-2.23517(6)", "-1.92880(9)", "-1.99246(13)"]],
] };
const J2ALL = [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8];
const T2a = { J2: J2ALL, L: 10, where: "Table 2 (10 x 10)", rows: [
  [423, "MPS (8)", ["-1.997537", "-1.893753", "-1.797675", "-1.734326", "-1.716253", "-1.768225", "-1.869871"]],
  [424, "MPS (70)", ["-2.191048", "-2.069029", "-1.956480", "-1.866159", "-1.816249", "-1.854296", "-2.007845"]],
  [425, "MPS (1024)", ["-2.255633", "-2.138591", "-2.031681", "-1.938770", "-1.865561", "-1.894371", "-2.062730"]],
  [426, "PixelCNN (7-48)", ["-2.22462(24)", "-2.12873(14)", "-2.02053(14)", "-1.74098(29)", "-1.71885(27)", "-1.81800(13)", "-1.98331(17)"], "PixelCNN"],
  [427, "EW (7-48-8)", ["-2.26034(6)", "-2.14450(4)", "-2.03727(7)", "-1.94001(6)", "-1.85684(10)", "-1.88643(7)", "-2.05707(43)"], "Elementwise (8)"],
  [428, "BW (7-48-70)", ["-2.25755(8)", "-2.14152(8)", "-2.03319(10)", "-1.93842(42)", "-1.85270(12)", "-1.87853(13)", "-2.05088(14)"], "Blockwise (70)"],
] };
const T2b = { J2: J2ALL, L: 12, where: "Table 2 (12 x 12)", rows: [
  [431, "MPS (8)", ["-1.998207", "-1.887531", "-1.800784", "-1.735906", "-1.720619", "-1.788652", "-1.893916"]],
  [432, "MPS (70)", ["-2.185071", "-2.059443", "-1.944832", "-1.851954", "-1.812450", "-1.853650", "-2.030131"]],
  [433, "MPS (1024)", ["-2.264084", "-2.141043", "-2.027736", "-1.931243", "-1.858846", "-1.913483", "-2.093013"]],
  [434, "PixelCNN (7-48)", ["-2.24311(102)", "-2.12616(23)", "-2.01768(21)", "-1.74282(30)", "-1.72637(16)", "-1.85239(13)", "-2.03226(59)"], "PixelCNN"],
  [435, "EW (7-48-8)", ["-2.27446(27)", "-2.15537(6)", "-2.04437(7)", "-1.94686(6)", "-1.85443(15)", "-1.91391(10)", "-2.09457(10)"], "Elementwise (8)"],
  [436, "BW (7-48-70)", ["-2.26152(50)", "-2.15395(7)", "-2.04225(8)", "-1.94298(43)", "-1.85176(15)", "-1.90571(12)", "-2.09113(43)"], "Blockwise (70)"],
] };
const T3 = { J2: [0.2, 0.5, 0.8], L: 10, where: "Table 3 (10 x 10)", rows: [
  [1228, "PixelCNN (P) (7-48)", ["-2.1920(9)", "-1.6458(10)", "-1.9468(6)"]],
  [1229, "PixelCNN (8-48)", ["-2.23581(14)", "-1.86922(16)", "-2.01093(16)"]],
  [1231, "EW (RI) (7-48-8)", ["-2.25946(6)", "-1.94030(9)", "-2.05125(11)"]],
] };
const T4 = { J2: [0.5], L: 10, where: "Table 4 (10 x 10, J2 = 0.5)", rows: [
  [1282, "PixelCNN (9-48)", ["-1.90021(15)"]],
  [1283, "PixelCNN (10-48)", ["-1.90440(14)"]],
  [1284, "PixelCNN (11-48)", ["-1.92826(11)"]],
  [1285, "PixelCNN (12-48)", ["-1.92986(10)"]],
  [1286, "PixelCNN (15-48)", ["-1.92869(11)"]],
  [1287, "PixelCNN (20-48)", ["-1.91537(13)"]],
  [1288, "PixelCNN (8-72)", ["-1.88536(19)"]],
  [1289, "PixelCNN (9-72)", ["-1.89266(15)"]],
  [1290, "PixelCNN (10-72)", ["-1.90718(15)"]],
  [1291, "PixelCNN (11-72)", ["-1.92965(13)"]],
  [1292, "PixelCNN (12-72)", ["-1.91186(14)"]],
  [1293, "PixelCNN (S) (11-48)", ["-1.92915(12)"]],
  [1294, "PixelCNN (S) (12-48)", ["-1.93112(11)"]],
  [1295, "PixelCNN (S) (15-48)", ["-1.93233(9)"]],
  [1296, "PixelCNN (S) (20-48)", ["-1.93058(10)"]],
  [1297, "PixelCNN (S) (11-72)", ["-1.93211(10)"]],
  [1298, "PixelCNN (S) (12-72)", ["-1.92812(12)"]],
] };

// [instance key, source, file, line, as printed, normalisation, method, bound_type, sampled, where, extra]
// normalisation: "pauli-site" (Pauli form per site, / 4), "pauli-total" (Pauli total, / 4N), "site" (S.S per site).
const READINGS = [];
for (const T of [T1, T2a, T2b, T3, T4])
  for (const [line, method, cells, label] of T.rows)
    cells.forEach((printed, k) => {
      const mps = /^MPS /.test(method);
      READINGS.push([`sq${T.L}O_${T.J2[k]}`, ANTN, NV, line, printed, "pauli-site", method, "variational", !mps,
        `${T.where}, row ${label ? `'${label}' (${method} in Tables 3-5)` : `'${method}'`}, column J2 = ${T.J2[k]}`,
        { note: mps ? "MPS optimised by DMRG at this bond dimension (Table 2 caption), deterministic: no error bar" : null }]);
    });
READINGS.push(
  ["kag10", "2611.05174", "2611.05174", 137, "−0.435239(4)", "site", "KagomeResNet c=n=32", "variational", true, "Table I, row L = 10, column c = n = 32, e", { var: "0.00506(6)" }],
  ["kag10", "2611.05174", "2611.05174", 137, "−0.435472(5)", "site", "KagomeResNet c=n=40", "variational", true, "Table I, row L = 10, column c = n = 40, e", { var: "0.00434(4)" }],
  ["chain16", "2510.08430", "2510.08430", 193, "-28.5685(3)", "pauli-total", "Block-layer QGT (ViT)", "variational", true, "Table 2, row 'Block-layer QGT', column Energy E (the Vision Transformer with a two-layer encoder of the chain benchmark, lines 130-131, optimised with the QGT block-diagonal by network layer)", { var: "0.008" }],
  ["chain16", "2510.08430", "2510.08430", 194, "-28.5674(6)", "pauli-total", "Full QGT (ViT)", "variational", true, "Table 2, row 'Full QGT', column Energy E (the same Vision Transformer optimised with the full sampled QGT, 'full SR', line 131)", { var: "0.026" }],
);

// --- conversion --------------------------------------------------------------------------
const clean = s => s.replace(/[−–]/g, "-").replace(/\s+/g, "");
function parse(p) {
  const s = clean(p);
  let m = s.match(/^(-?\d*\.(\d+))\((\d+)\)$/);
  if (m) return { v: +m[1], sigma: +m[3] * 10 ** -m[2].length, dec: m[2].length };
  m = s.match(/^(-?\d*\.(\d+))$/);
  if (m) return { v: +m[1], sigma: null, dec: m[2].length };
  return null;
}
const text = {};
const linesOf = f => (text[f] ??= fs.readFileSync(`sources/${f}.txt`, "utf8").split("\n"));
const html = fs.readFileSync("sources/2304.01996.html", "utf8").replace(/\s+/g, "");
const out = [];
for (const [key, a, file, line, printed, norm, method, bound, sampled, where, extra = {}] of READINGS) {
  const def = I[key]; if (!def) throw new Error(`no instance ${key}`);
  const L = linesOf(file), want = clean(printed);
  const at = [0, -1, 1, -2, 2, -3, 3, -4, 4, -5, 5].map(d => line + d).find(k => clean(L[k - 1] ?? "").includes(want));
  if (at == null) throw new Error(`${file}: '${printed}' not found at line ${line}`);
  // the arXiv HTML prints the minus sign as text before the cell's math, the number in its alttext
  if (a === ANTN && !new RegExp(`alttext="(?:\\\\boldsymbol\\{|\\\\it\\{)?${want.slice(1).replace(/[.()]/g, "\\$&")}\\}?"`).test(html))
    throw new Error(`sources/2304.01996.html: '${printed}' not in a table cell`);
  if (extra.var != null && !clean(L[at - 1]).includes(clean(extra.var))) throw new Error(`${file}: variance '${extra.var}' not on line ${at}`);
  const p = parse(printed); if (!p) throw new Error(`cannot parse ${printed}`);
  const div = norm === "pauli-site" ? 4 : norm === "pauli-total" ? 4 * def.n_sites : 1;
  const { id, model, lattice, n_sites, boundary, params, cluster } = def;
  out.push({
    instance_id: id, eps: +(p.v / div).toPrecision(15), tol: +(0.5 * 10 ** -p.dec / div).toPrecision(3),
    sigma_per_site: p.sigma == null ? null : +(p.sigma / div).toPrecision(6),
    var_per_site: null,
    arxiv: a, peer_reviewed: REF[a].pr, origin: "own", bound_type: bound, method,
    reference: REF[a].ref,
    evidence: [`${where}; sources/${file}.txt line ${at}`, extra.note, VERSION[a]].filter(Boolean).join("; "),
    convention_check: CONV[a], reported_as: printed, confidence: a === "2510.08430" ? "medium" : "high",
    verified_by: "single reading (2026-11-11)",
    variance_as_reported: extra.var == null ? null : a === "2611.05174" ? `σ² = ${extra.var} (energy-variance density, Table I)` : `σ² = ${extra.var} (Table 2, column Energy Variance)`,
    defect: null, sampled,
    create: { model, lattice, n_sites, boundary, params, ...(cluster ? { cluster } : {}) },
  });
}
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + "\n");
console.log(`${out.length} rows on ${new Set(out.map(r => r.instance_id)).size} instances -> ${OUT}`);
