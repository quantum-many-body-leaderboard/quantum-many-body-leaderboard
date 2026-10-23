// Attach the libraries a row's source says its authors used (DATA.md, "The code behind a row")
// from passes/code/libraries-YYYY-MM-DD.json: one entry per row that has no code link, keyed
// by instance, energy, the reference's url or string, and the row's method, with a status:
//   library  the source says these libraries were used for this result; attached as
//            artifacts.libraries
//   none     the source names no library used for this result; nothing attached
//   unclear  a library is named, but the source does not settle that it was used for this
//            row; nothing attached
// A library counts only where the source says it was used for this result (methods,
// appendix, software availability, acknowledgements of software used for these
// calculations), never for a citation in the introduction or related work. The version is
// set only where the source states it. Each entry carries the quoted statement and where it
// was read, kept on the row as artifacts.libraries_read_from. A row with artifacts.code (a run
// script or a repository) gets no libraries: the code column shows the code. Runs right after
// add_code_links.mjs.
import fs from "node:fs";
import path from "node:path";
import { nameBeforeSplit } from "./method_names.mjs";
import { methodLabel } from "./units.mjs";
import { pathToFileURL } from "node:url";
// An entry names the row by its method as it was when the pass ran: the short name before
// the 2026-10-23 split, or the method, or the label ("VMC (ViT)") after it.
const sameMethod = (r, m) => m === nameBeforeSplit(r) || m === r.method || m === methodLabel(r);

// One canonical url per library: its official repository or homepage. Each resolved on the
// date of the pass that first used it.
export const LIBRARIES = {
  "ALPS": "https://alps.comp-phys.org/",
  "CASINO": "https://vallico.net/casinoqmc/",
  "CTF": "https://github.com/cyclops-community/ctf",
  "Equinox": "https://github.com/patrick-kidger/equinox",
  "FermiNet": "https://github.com/google-deepmind/ferminet",
  "Flax": "https://github.com/google/flax",
  "FlowKet": "https://github.com/HUJI-Deep/FlowKet",
  "HANDE-QMC": "https://github.com/hande-qmc/hande",
  "HyperCore": "https://github.com/Graph-and-Geometric-Learning/HyperCore",
  "JAX": "https://github.com/jax-ml/jax",
  "jVMC": "https://github.com/markusschmitt/vmc_jax",
  "KFAC JAX": "https://github.com/google-deepmind/deepmind-research/tree/master/kfac_ferminet_alpha",
  "LaQX": "https://github.com/bytedance/laqx",
  "lrux": "https://github.com/ChenAo-Phys/lrux",
  "mVMC": "https://github.com/issp-center-dev/mVMC",
  "NECI": "https://github.com/fkfest/NECI_STABLE",
  "NetKet": "https://www.netket.org/",
  "Optax": "https://github.com/google-deepmind/optax",
  "PAUXY": "https://github.com/pauxy-qmc/pauxy",
  "PyTorch": "https://pytorch.org/",
  "QMCPACK": "https://qmcpack.org/",
  "Quantax": "https://github.com/ChenAo-Phys/quantax",
  "QuSpin": "https://quspin.github.io/QuSpin/",
  "TensorFlow": "https://www.tensorflow.org/",
};

// Only computational-science codes are shown (2026-10-22). General machine-learning and array
// frameworks and low-level tools stay in the pass as read but are not attached: knowing that a
// result used JAX or a tensor-contraction engine does not tell a reader where to start.
export const NOT_SHOWN = new Set(["JAX", "PyTorch", "TensorFlow", "Flax", "Equinox", "Optax", "KFAC JAX", "lrux", "CTF", "HyperCore"]);

const DIR = "passes/code";
const STATUS = new Set(["library", "none", "unclear"]);
const refKey = ref => (ref || "").match(/\((https?:[^)]+)\)/)?.[1] ?? (ref || "");

function main() {
  const PASSES = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter(f => /^libraries-\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort() : [];
  const instances = new Map();
  for (const m of fs.readdirSync("data")) {
    const dir = path.join("data", m);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const f of fs.readdirSync(dir)) {
      const p = path.join(dir, f);
      const inst = JSON.parse(fs.readFileSync(p, "utf8"));
      instances.set(inst.instance_id, { path: p, inst, dirty: false });
    }
  }

  // Passes apply in date order; a later pass's entry for a row replaces the earlier one.
  const latest = new Map();
  const problems = [];
  for (const file of PASSES) {
    const date = file.slice(10, 20);
    for (const e of JSON.parse(fs.readFileSync(path.join(DIR, file), "utf8"))) {
      if (!STATUS.has(e.status)) { problems.push(`${e.instance_id} ${e.energy}: status ${e.status}`); continue; }
      latest.set(`${e.instance_id}|${e.energy}|${e.reference_key}|${e.method}`, { ...e, file: `${DIR}/${file}`, date });
    }
  }

  const counts = { library: 0, none: 0, unclear: 0 };
  const unmatched = [];
  let withCode = 0, generalOnly = 0;
  for (const e of latest.values()) {
    counts[e.status]++;
    if (e.status !== "library") continue;
    const entry = instances.get(e.instance_id);
    // The method tells apart two rows of one source at the same energy (a GFMC and an ACE row);
    // rows that share all four (two stripe orientations of one method) take the same entry.
    const rows = entry?.inst.rows.filter(r => r.energy === e.energy && refKey(r.reference) === e.reference_key && sameMethod(r, e.method)) ?? [];
    if (!rows.length) { unmatched.push(`${e.instance_id} ${e.energy} ${e.method} ${String(e.reference_key).slice(0, 50)}`); continue; }
    if (!e.libraries?.length || !e.quote || !e.location) { problems.push(`${e.instance_id} ${e.energy}: library without libraries, quote or location`); continue; }
    const bad = e.libraries.filter(l => !(l.name in LIBRARIES) || l.url !== LIBRARIES[l.name] || !l.url);
    if (bad.length) { problems.push(`${e.instance_id} ${e.energy}: ${bad.map(l => l.name).join(", ")} not in the url table or url differs`); continue; }
    const shown = e.libraries.filter(l => !NOT_SHOWN.has(l.name));
    if (!shown.length) { generalOnly++; continue; }
    for (const row of rows) {
      // An unpublished row's artifacts came with its submission (RULES.md 8.3) and are not replaced.
      if (row.provenance === "unpublished") continue;
      // The row's own code wins: the code column shows a run script or repository, never both.
      if (row.artifacts?.code) { withCode++; continue; }
      row.artifacts = {
        ...(row.artifacts || {}),
        libraries: shown.map(l => ({ name: l.name, version: l.version ?? null, url: l.url })),
        libraries_read_from: { quote: e.quote, location: e.location, checked_on: e.checked_on ?? e.date, pass: e.file },
      };
      entry.dirty = true;
    }
  }
  for (const { path: p, inst, dirty } of instances.values())
    if (dirty) fs.writeFileSync(p, JSON.stringify(inst, null, 2) + "\n");

  console.log(`libraries: ${counts.library} library, ${counts.none} none, ${counts.unclear} unclear; ${withCode} left to their code link; ${generalOnly} with general libraries only, not shown; ${unmatched.length} unmatched`);
  for (const u of unmatched) console.log(`  unmatched: ${u}`);
  if (problems.length) { problems.forEach(s => console.log("  !! " + s)); process.exitCode = 1; }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
