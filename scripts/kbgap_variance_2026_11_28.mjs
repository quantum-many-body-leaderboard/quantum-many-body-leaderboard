// Override on passes/rows/sweep-rows-2026-11-26-kbgap.json (qmbl-verify 2026-11-27, ruled 2026-11-28):
// the eight NN-GPEPS rows of arXiv:2611.26604 store the printed σ²/N column as var_per_site.
// The pass left it out ("convention not verified"); the released code settles it: code/nngtn/measure.py
// line 221 prints 'var/N = (E_sqr - E_mean**2) / N', with E_mean and E_sqr the means of the total
// local energy (line 182), so the column is Var(H)/N and the loader's var_per_site x N is Var(H)
// (RULES.md 8, 2026-11-26). Each row is found by instance, method and printed energy; its printed
// variance is already on the row (variance_as_reported) and is located again in the source text here.
//
// usage: node scripts/kbgap_variance_2026_11_28.mjs   (rewrites the pass file in place; idempotent)
import fs from "node:fs";

const PASS = "passes/rows/sweep-rows-2026-11-26-kbgap.json";
const A = "2611.26604";
// [instance, method, printed energy, txt line of the printed variance]
const ROWS = [
  ["Hubbard/rectangular-4x16_64_P_28_8", "NN-GPEPS, Nv = 3 (projected)", "−0.765883(26)", 902],
  ["Hubbard/rectangular-4x16_64_P_28_8", "NN-GPEPS, Nv = 4 (projected)", "−0.766152(16)", 903],
  ["Hubbard/square_256_P_112_8", "NN-GPEPS, Nv = 3 (projected)", "−0.759835(14)", 195],
  ["Hubbard/square_256_P_112_8", "NN-GPEPS, Nv = 4 (projected)", "−0.760115(11)", 196],
  ["Hubbard/square_1024_P_448_8", "NN-GPEPS, Nv = 3", "−0.757451(21)", 252],
  ["Hubbard/square_1024_P_448_8", "NN-GPEPS, Nv = 4", "−0.758019(22)", 253],
  ["Hubbard/square_1024_P_448_8", "NN-GPEPS, Nv = 3 (P)", "−0.758414(27)", 254],
  ["Hubbard/square_1024_P_448_8", "NN-GPEPS, Nv = 4 (P)", "−0.758727(33)", 255],
];
const NOTE = "variance: the printed σ²/N column is Var(H)/N (released code, code/nngtn/measure.py line 221; qmbl-verify 2026-11-27)";

const rows = JSON.parse(fs.readFileSync(PASS, "utf8"));
const txt = fs.readFileSync(`sources/${A}.txt`, "utf8").split("\n");
for (const [id, method, printed, line] of ROWS) {
  const hit = rows.filter(r => r.arxiv === A && r.instance_id === id && r.method === method && r.reported_as === printed);
  if (hit.length !== 1) throw new Error(`${id} ${method}: ${hit.length} rows`);
  const r = hit[0], v = r.variance_as_reported;
  if (typeof v !== "number") throw new Error(`${id} ${method}: no printed variance on the row`);
  if (!txt[line - 1]?.includes(printed) || !txt[line - 1].includes(String(v))) throw new Error(`${id} ${method}: '${printed}' and ${v} not on line ${line}`);
  r.var_per_site = v;
  if (!r.convention_check.includes(NOTE)) r.convention_check += `; ${NOTE}`;
}
fs.writeFileSync(PASS, JSON.stringify(rows, null, 1) + "\n");
console.log(`${ROWS.length} rows: var_per_site set -> ${PASS}`);
