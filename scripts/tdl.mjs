// Track 4 (RULES.md 14): ground-state energies of lattice Hamiltonians in the thermodynamic
// limit. Instances live in tdl/<Model>/<name>.json, apart from data/, because they have no site
// count: `n_sites` is "inf" and every energy is stored per site, in the stored convention of
// track 1 for one site (spin models: Pauli, 4 x the S.S energy; TFIsing: Pauli; Hubbard and
// t-V: units of t). The scripts that work on finite instances never see them.
//
// collectTDL() returns the instances as views with n_sites = 1, so the per-site helpers of
// units.mjs and the row tables of site.mjs apply unchanged; `tdl: true` marks them.
import fs from "node:fs";
import path from "node:path";

export const TDL_DIR = "tdl";

export function collectTDL() {
  if (!fs.existsSync(TDL_DIR)) return [];
  const out = [];
  for (const m of fs.readdirSync(TDL_DIR).sort()) {
    const dir = path.join(TDL_DIR, m);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const f of fs.readdirSync(dir).sort())
      out.push({ ...JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")), n_sites: 1, tdl: true });
  }
  return out.sort((a, b) => a.instance_id.localeCompare(b.instance_id));
}

// The couplings of an instance as a reader writes them, in the order of its id.
const COUPLINGS = {
  Heisenberg: p => (p.S != null ? [`S = ${p.S}`] : []),
  J1J2: p => [`J2 = ${p.J2}`],
  TFIsing: p => [`h = ${p.h}`],
  Hubbard: p => [`U = ${p.U}`, `n = ${p.n}`, ...(p.t2 != null ? [`t' = ${p.t2}`] : [])],
  tV: p => [`V = ${p.V}`, `n = ${p.n}`],
};
export const tdlCouplings = inst => (COUPLINGS[inst.model]?.(inst.params ?? {}) ?? Object.entries(inst.params ?? {}).map(([k, v]) => `${k} = ${v}`));
export const tdlLabel = inst => [inst.lattice, ...tdlCouplings(inst)].join(", ");

// The id: <Model>/<lattice>_inf, then the coupling values in the order of COUPLINGS.
// Spin models are S = 1/2 unless params.S says otherwise (RULES.md 14.1).
export function tdlId(model, lattice, params = {}) {
  const order = { Heisenberg: ["S"], J1J2: ["J2"], TFIsing: ["h"], Hubbard: ["n", "U", "t2"], tV: ["n", "V"] }[model] ?? Object.keys(params).sort();
  // The spin length is written with its letter (`_S1`); S = 1/2 carries no parameter.
  const vals = order.filter(k => params[k] != null).map(k => (k === "S" ? `S${params[k]}` : String(params[k])));
  return `${model}/${[lattice, "inf", ...vals].join("_")}`;
}
