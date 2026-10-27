// The `cluster` field (DATA.md) of instances that no family script creates: the shape in words and
// where it is defined. The family scripts (families_2026_10_20.mjs, tj_2026_10_22.mjs) set it on the
// instances they create; this sets it on instances that came from VarBench or the sweep.
import fs from "node:fs";

const RHOMBIC = L => `rhombic torus of ${L} x ${L} three-site unit cells, edge vectors ${L} a1 and ${L} a2 (a1, a2 the triangular Bravais vectors, 60 degrees apart)`;
const DEPENBROCK = L => `For arXiv:1205.4858 inferred, not printed: Table I labels the cluster 'Torus ${L}' and Fig. 8 draws the DMRG path, but no edge vectors are given; its tori have N = 3 L^2 sites, and its 'Torus 3' energy equals the 27-site exact energy it is compared with (2026-10-27)`;

const CLUSTERS = {
  // 2026-10-27: the kagome tori that the DMRG rows of arXiv:1205.4858 share with other sources.
  "Heisenberg/kagome-4x4_48_P": `${RHOMBIC(4)}. Defined by VarBench's Gutzwiller run input (a 6-site supercell repeated '2 0 0 4') and by arXiv:2401.02866 ('4x4x3', periodic), whose ED reference equals this instance's exact row. ${DEPENBROCK(4)}`,
  "Heisenberg/kagome-6x6_108_P": `${RHOMBIC(6)}. Defined by arXiv:2401.02866 ('6 x 6 x 3 cluster, periodic boundary conditions'). ${DEPENBROCK(6)}`,
};

for (const [id, cluster] of Object.entries(CLUSTERS)) {
  const p = `data/${id}.json`;
  const inst = JSON.parse(fs.readFileSync(p, "utf8"));
  if (inst.cluster && inst.cluster !== cluster) throw new Error(`${id} already has a different cluster`);
  // the field sits before instance_id, where the family scripts put it
  const out = {};
  for (const [k, v] of Object.entries(inst)) { if (k === "instance_id") out.cluster = cluster; if (k !== "cluster") out[k] = v; }
  fs.writeFileSync(p, JSON.stringify(out, null, 2) + "\n");
}
console.log(`cluster set on ${Object.keys(CLUSTERS).length} instances`);
