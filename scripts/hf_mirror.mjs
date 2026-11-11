// Mirror the QMBL dump to the Hugging Face dataset tristanzerweck/quantum-many-body-leaderboard.
//
// Reads the dump the site build writes (_site/api/qmbl.json) and uploads, as one commit:
//   energies.csv   one row per published energy, with its instance's fields;
//   instances.csv  one row per instance, the best energy of each bound type;
//   qmbl.json      the dump itself (over 10 MB, so it goes through Git LFS);
//   README.md      the dataset card, scripts/assets/hf-README.md with the counts filled in.
// The deploy workflow runs it after each deploy with HF_TOKEN, a fine-grained token that can
// write to that one dataset. Without HF_TOKEN, or with --out <dir>, it only writes the files.
//
// No dependencies: the Hub's HTTP API (preupload, LFS batch, commit) through fetch.
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const REPO = process.env.HF_REPO ?? "tristanzerweck/quantum-many-body-leaderboard";
const HUB = "https://huggingface.co";
const args = process.argv.slice(2);
const outAt = args.indexOf("--out");
const OUT = outAt >= 0 ? args[outAt + 1] : null;
const DUMP = args.find((a, i) => !a.startsWith("--") && !(outAt >= 0 && i === outAt + 1)) ?? "_site/api/qmbl.json";
const TOKEN = process.env.HF_TOKEN;

const dumpBytes = fs.readFileSync(DUMP);
const q = JSON.parse(dumpBytes.toString("utf8"));

const cell = v => v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
const csv = (cols, rows) => [cols.join(","), ...rows.map(r => cols.map(c => {
  const s = cell(r[c]);
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}).join(","))].join("\n") + "\n";

const INST = ["instance_id", "model", "lattice", "n_sites", "boundary", "params", "per_site_label", "url"];
const ROW = ["energy", "energy_per_site", "sigma", "energy_variance", "v_score", "dof", "method", "ansatz", "method_detail", "family", "bound_type", "reference", "peer_reviewed"];
const CLASSES = ["exact", "variational", "projected", "extrapolated", "approximate"];
const energies = [], instances = [];
for (const i of q.instances) {
  const base = Object.fromEntries(INST.map(k => [k, i[k]]));
  for (const r of i.rows)
    energies.push({ ...base, ...r, energy_per_site: r.energy == null ? null : Number((r.energy / i.per_site_divisor).toPrecision(12)) });
  const row = { ...base, n_energies: i.rows.length };
  for (const t of CLASSES) {
    const b = i.best?.[t];
    Object.assign(row, { [`${t}_energy`]: b?.energy, [`${t}_sigma`]: b?.sigma, [`${t}_method`]: b?.method, [`${t}_reference`]: b?.reference });
  }
  instances.push(row);
}

const n = energies.length;
const size = n < 1e3 ? "n<1K" : n < 1e4 ? "1K<n<10K" : n < 1e5 ? "10K<n<100K" : "100K<n<1M";
const card = fs.readFileSync(new URL("./assets/hf-README.md", import.meta.url), "utf8")
  .replaceAll("{{ENERGIES}}", n.toLocaleString("en-US"))
  .replaceAll("{{INSTANCES}}", instances.length.toLocaleString("en-US"))
  .replaceAll("{{SIZE}}", size);

const files = {
  "README.md": Buffer.from(card),
  "energies.csv": Buffer.from(csv([...INST, ...ROW], energies)),
  "instances.csv": Buffer.from(csv(Object.keys(instances[0]), instances)),
  "qmbl.json": dumpBytes,
};
console.log(`${n} energies, ${instances.length} instances (dump built ${q.built})`);

if (OUT || !TOKEN) {
  const dir = OUT ?? "_hf";
  fs.mkdirSync(dir, { recursive: true });
  for (const [p, b] of Object.entries(files)) fs.writeFileSync(path.join(dir, p), b);
  console.log(TOKEN ? `wrote ${dir}/` : `no HF_TOKEN: wrote ${dir}/, uploaded nothing`);
  process.exit(0);
}

const auth = { authorization: `Bearer ${TOKEN}` };
async function call(url, init = {}) {
  const res = await fetch(url, { ...init, headers: { ...auth, ...init.headers } });
  if (!res.ok) throw new Error(`${init.method ?? "GET"} ${url}: HTTP ${res.status} ${await res.text()}`);
  return res;
}

// Which files the Hub wants through LFS.
const entries = Object.entries(files).map(([p, b]) => ({ path: p, bytes: b, oid: createHash("sha256").update(b).digest("hex") }));
const pre = await (await call(`${HUB}/api/datasets/${REPO}/preupload/main`, {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ files: entries.map(e => ({ path: e.path, size: e.bytes.length, sample: e.bytes.subarray(0, 512).toString("base64") })) }),
})).json();
const lfs = new Set(pre.files.filter(f => f.uploadMode === "lfs").map(f => f.path));

// Upload the LFS objects; an object the Hub already holds comes back without actions.
const lfsEntries = entries.filter(e => lfs.has(e.path));
if (lfsEntries.length) {
  const lfsHeaders = { accept: "application/vnd.git-lfs+json", "content-type": "application/vnd.git-lfs+json" };
  const batch = await (await call(`${HUB}/datasets/${REPO}.git/info/lfs/objects/batch`, {
    method: "POST", headers: lfsHeaders,
    body: JSON.stringify({ operation: "upload", transfers: ["basic", "multipart"], hash_algo: "sha_256", ref: { name: "main" },
      objects: lfsEntries.map(e => ({ oid: e.oid, size: e.bytes.length })) }),
  })).json();
  for (const obj of batch.objects) {
    if (obj.error) throw new Error(`LFS ${obj.oid}: ${JSON.stringify(obj.error)}`);
    const up = obj.actions?.upload;
    if (!up) continue;
    const bytes = lfsEntries.find(e => e.oid === obj.oid).bytes;
    const { chunk_size, ...partUrls } = up.header ?? {};
    if (chunk_size) {
      const size = Number(chunk_size), parts = [];
      for (const [k, url] of Object.entries(partUrls).filter(([k]) => /^\d+$/.test(k)).sort(([a], [b]) => a - b)) {
        const i = Number(k) - 1;
        const res = await fetch(url, { method: "PUT", body: bytes.subarray(i * size, (i + 1) * size) });
        if (!res.ok) throw new Error(`LFS part ${k}: HTTP ${res.status}`);
        parts.push({ partNumber: Number(k), etag: res.headers.get("etag") });
      }
      await call(up.href, { method: "POST", headers: lfsHeaders, body: JSON.stringify({ oid: obj.oid, parts }) });
    } else {
      const res = await fetch(up.href, { method: "PUT", headers: up.header ?? {}, body: bytes });
      if (!res.ok) throw new Error(`LFS upload ${obj.oid}: HTTP ${res.status}`);
    }
    if (obj.actions.verify) await call(obj.actions.verify.href, { method: "POST", headers: { ...lfsHeaders, ...obj.actions.verify.header }, body: JSON.stringify({ oid: obj.oid, size: obj.size }) });
  }
}

// One commit with every file.
const lines = [{ key: "header", value: { summary: `Mirror qmbl.org (dump built ${q.built})`, description: "" } },
  ...entries.map(e => lfs.has(e.path)
    ? { key: "lfsFile", value: { path: e.path, algo: "sha256", oid: e.oid, size: e.bytes.length } }
    : { key: "file", value: { path: e.path, content: e.bytes.toString("base64"), encoding: "base64" } })];
const commit = await (await call(`${HUB}/api/datasets/${REPO}/commit/main`, {
  method: "POST", headers: { "content-type": "application/x-ndjson" },
  body: lines.map(l => JSON.stringify(l)).join("\n"),
})).json();
console.log(`committed ${commit.commitOid ?? "(no change)"} to ${HUB}/datasets/${REPO} (LFS: ${[...lfs].join(", ") || "none"})`);
