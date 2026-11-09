// Compare QMBL's pyscf FCI (results.jsonl) with the published exact rows of the pass.
import fs from "node:fs";
const [RES, PASS] = process.argv.slice(2);
const res = fs.readFileSync(RES, "utf8").split("\n").filter(Boolean).map(JSON.parse);
const rows = JSON.parse(fs.readFileSync(PASS, "utf8"));
console.log("| instance | QMBL FCI total (Ha) | per atom | published exact (per atom, source) | difference per atom | <S^2> |");
console.log("|---|---|---|---|---|---|");
for (const r of res) {
  const ex = rows.filter(x => x.instance_id === r.id && x.bound_type === "exact");
  const pub = ex.map(x => `${x.reported_as.split(" ")[0]} (${x.arxiv})`).join("; ") || "none";
  const diff = ex.map(x => (x.eps - r.E_per_atom).toExponential(1)).join("; ") || "";
  console.log(`| ${r.id} | ${r.E.toFixed(8)} | ${r.E_per_atom.toFixed(8)} | ${pub} | ${diff} | ${r.S2.toFixed(4)} |`);
}
