// QMBL's own cost-to-reproduce runs leave the table (2026-11-24: QMBL adds no rows of its own,
// RULES.md 8.2) but stay in the cost figures. After validation, this moves every row
// add_cost_runs.mjs made out of data/<model>/ into data/_cost_runs.json, which collect()
// does not read; pareto.mjs appends them to their instances again when it draws.
import fs from "node:fs";
import path from "node:path";
import { isCostRun } from "./cost.mjs";

const out = [];
for (const m of fs.readdirSync("data").sort()) {
  const dir = path.join("data", m);
  if (!fs.statSync(dir).isDirectory()) continue;
  for (const f of fs.readdirSync(dir).sort()) {
    const p = path.join(dir, f);
    const inst = JSON.parse(fs.readFileSync(p, "utf8"));
    const runs = inst.rows.filter(isCostRun);
    if (!runs.length) continue;
    inst.rows = inst.rows.filter(r => !isCostRun(r));
    fs.writeFileSync(p, JSON.stringify(inst, null, 2) + "\n");
    for (const row of runs) out.push({ instance_id: inst.instance_id, row });
  }
}
fs.writeFileSync("data/_cost_runs.json", JSON.stringify(out, null, 2) + "\n");
console.log(`cost runs: ${out.length} rows moved from the table to data/_cost_runs.json (figures only)`);
