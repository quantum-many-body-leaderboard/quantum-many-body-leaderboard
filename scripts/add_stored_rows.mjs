// Rows already in the instance's stored convention, from passes/stored-rows/*.json, applied
// in file-name order. A file is { about, instances: [{ instance_id, create?, rows }] }; `about`
// names the source tables and the unit conversion that gave the stored energies.
//
// Each row is appended as written, except three fields the file leaves null: `dof` and `einf`
// come from the instance's first row (on a new instance, from `create`), and `v_score` is
// computed where the row has an energy variance. A new instance gets the `create` header
// without its dof and einf. Pass files of per-site readings are passes/rows/ (add_allresults_rows.mjs).
import fs from "node:fs";

const DIR = "passes/stored-rows";
const PASSES = fs.readdirSync(DIR).filter(f => f.endsWith(".json")).sort();

let added = 0, created = 0;
for (const file of PASSES) {
  const pass = JSON.parse(fs.readFileSync(`${DIR}/${file}`, "utf8"));
  for (const { instance_id: id, create, rows } of pass.instances) {
    const p = `data/${id}.json`;
    const exists = fs.existsSync(p);
    if (!exists && !create) throw new Error(`${file}: no instance ${id} and no create header`);
    const inst = exists ? JSON.parse(fs.readFileSync(p, "utf8")) : { ...create, instance_id: id, rows: [] };
    if (!exists) { delete inst.dof; delete inst.einf; created++; }
    const r0 = inst.rows[0];
    const dof = r0 ? r0.dof : create.dof;
    const einf = r0 ? r0.einf : create.einf;
    for (const r of rows) {
      const row = { ...r, dof, einf };
      row.v_score = row.energy_variance == null ? null : (dof * row.energy_variance) / (row.energy - einf) ** 2;
      inst.rows.push(row);
      added++;
    }
    fs.mkdirSync(`data/${id.split("/")[0]}`, { recursive: true });
    fs.writeFileSync(p, JSON.stringify(inst, null, 2) + "\n");
  }
}
console.log(`added ${added} stored rows from ${PASSES.length} passes (${created} new instances)`);
