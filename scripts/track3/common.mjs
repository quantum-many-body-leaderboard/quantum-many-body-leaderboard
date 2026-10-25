// Shared helpers for the track-3 (hydrogen) generator. Conventions: RULES.md §13 on branch track3-hydrogen.
// Default paths, relative to the repo root (run every script from there; order in SWEEP.md, track 3).
export const OUT_DIR = "scripts/track3/.out"; // intermediate generator outputs, not committed
export const T3 = "passes/track3";
export const BASIS_TOKEN = b => b === "none" ? "none" : b.toLowerCase().replace(/[^a-z0-9*+]/g, "").replace(/\*/g, "s").replace(/\+/g, "p");
export const fmtR = r => String(+r);
export function instanceId({ geometry, N, boundary, R, basis, twist }) {
  const model = geometry === "chain" ? "Hchain" : "Hsheet";
  const lat = geometry === "chain" ? "chain" : "square";
  let id = `${model}/${lat}_${N}_${boundary}_R${fmtR(R)}_${BASIS_TOKEN(basis)}`;
  if (twist && twist !== "Gamma") id += `_tw${twist}`;
  return id;
}
export function createHeader({ geometry, N, boundary, R, basis, twist }) {
  return {
    model: geometry === "chain" ? "Hchain" : "Hsheet",
    lattice: geometry === "chain" ? "chain" : "square",
    n_sites: N, boundary,
    params: { N_up: Math.ceil(N / 2), N_dn: Math.floor(N / 2), R: +R, basis, ...(boundary === "P" ? { twist: twist || "Gamma" } : {}) },
  };
}
// Error bar from the printed string: "-0.53819(6)" -> 6e-5 ; returns null if none.
export function sigmaFromParen(s) {
  const m = s.match(/^[−-]?(\d+)\.(\d+)\((\d+)\)$/);
  if (!m) return null;
  return +(+m[3] * 10 ** -m[2].length).toPrecision(6);
}
export const num = s => +s.replace("−", "-").replace(/\(.*\)$/, "");
