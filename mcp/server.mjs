#!/usr/bin/env node
// QMBL MCP server: the read-only machine API of qmbl.org (api/, llms.txt) as four MCP tools,
// over stdio, newline-delimited JSON-RPC 2.0. One file, no dependencies, Node 22 or later.
//
//   QMBL_SITE=<dir>   read a local build (the _site/ that scripts/site.mjs writes) instead
//   QMBL_URL=<url>    read another deployment (default https://qmbl.org)
//
// The server only reads the published files; it computes no value of its own. Every energy
// it returns is the one the site shows, with the primary reference on the row.
import fs from "node:fs/promises";
import path from "node:path";

const SITE = process.env.QMBL_SITE ? path.resolve(process.env.QMBL_SITE) : null;
const BASE = (process.env.QMBL_URL ?? "https://qmbl.org").replace(/\/$/, "");
const SOURCE = SITE ?? BASE;
const PROTOCOL = "2025-06-18";
const VERSION = "1.0.0";
const NOTE = "Cite individual energies to the primary paper named on the row, not to QMBL.";

// --------------------------------------------------------------------------- reading
const cache = new Map();
class NotFound extends Error {}
async function get(rel) {
  if (cache.has(rel)) return cache.get(rel);
  let text;
  if (SITE) {
    try { text = await fs.readFile(path.join(SITE, rel), "utf8"); }
    catch (e) { if (e.code === "ENOENT") throw new NotFound(rel); throw e; }
  } else {
    const res = await fetch(`${BASE}/${rel}`);
    if (res.status === 404) throw new NotFound(rel);
    if (!res.ok) throw new Error(`${BASE}/${rel}: HTTP ${res.status}`);
    text = await res.text();
  }
  const value = JSON.parse(text);
  cache.set(rel, value);
  return value;
}

// The fields the API keeps for one release only (llms.txt, "deprecated"); never passed on.
const dropDeprecated = o => Object.fromEntries(Object.entries(o).filter(([k]) => !/^record(_|$)|^no_record_reason$/.test(k)));

// The instance index lines. Each query file is a slice of api/instances.json; a deployment
// built before the query files existed answers from the full index.
async function indexLines({ model, open }) {
  try {
    if (model) return (await get(`api/m/${model}.json`)).instances;
    if (open) return (await get("api/open.json")).instances;
  } catch (e) { if (!(e instanceof NotFound)) throw e; }
  const all = (await get("api/instances.json")).map(dropDeprecated);
  return all.filter(i => (!model || i.model === model) && (!open || isOpen(i)));
}

// has_exact since 2026-11-10; before it, exact_method (Impurity has no per-site energy to test).
const hasExact = i => i.has_exact ?? i.exact_method != null;
// Open as QMBL: Open Problems counts it: no exact row, flagged or not (`open`, since 2026-11-10).
const isOpen = i => i.open ?? !hasExact(i);

const ID = /^[A-Za-z0-9_-]+\/[A-Za-z0-9_.-]+$/;
async function instance(id) {
  if (typeof id !== "string" || !ID.test(id) || id.includes("..")) throw new UserError(`not an instance id: ${JSON.stringify(id)} (form <model>/<stem>, as search_instances returns it)`);
  for (const dir of ["i", "tdl"]) {
    try { return dropDeprecated(await get(`api/${dir}/${id}.json`)); }
    catch (e) { if (!(e instanceof NotFound)) throw e; }
  }
  throw new UserError(`no instance ${id} in QMBL (search_instances lists the ids)`);
}
class UserError extends Error {}

// ----------------------------------------------------------------------------- tools
const TOOLS = [
  {
    name: "list_models",
    description: "List the models in QMBL (the Quantum Many-Body Leaderboard) with, per model, the number of instances, energies, exact and open instances, the lattices, boundaries, size range and parameter names. Start here to see what search_instances can filter on.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    async run() {
      try { return await get("api/models.json"); }
      catch (e) {
        if (!(e instanceof NotFound)) throw e;
        const all = await indexLines({});
        return { models: [...Map.groupBy(all, i => i.model)].map(([model, list]) => ({ model, instances: list.length })) };
      }
    },
  },
  {
    name: "search_instances",
    description: "Find Hamiltonian instances in QMBL. Each result gives the instance id, label, size, boundary, parameters, the exact energy per site where one exists and the best energy per site of each bound type (variational, projected, extrapolated, approximate) with its method. All filters are optional and combine with AND. Per-site units follow the model's convention (DATA.md, 'Units and conventions').",
    inputSchema: {
      type: "object",
      properties: {
        model: { type: "string", description: "Model name as list_models gives it, e.g. Hubbard, J1J2, Heisenberg." },
        lattice: { type: "string", description: "Lattice as list_models gives it, or its family before the dash: \"kagome\" matches kagome-36a, \"rectangular\" matches rectangular-8x16." },
        boundary: { type: "string", description: "Boundary code as list_models gives it, e.g. P (periodic), O (open)." },
        n_sites_min: { type: "integer", description: "Smallest number of sites." },
        n_sites_max: { type: "integer", description: "Largest number of sites." },
        open_only: { type: "boolean", description: "Only open instances: no exact row, flagged or not (the QMBL: Open Problems list)." },
        params: { type: "object", description: "Parameter values that must match exactly, e.g. {\"U\": 8} (Hubbard) or {\"J2\": 0.5} (J1J2); list_models gives the names per model.", additionalProperties: true },
        text: { type: "string", description: "Words that must all appear in the label or the instance id (case-insensitive)." },
        limit: { type: "integer", description: "Most results to return (default 50, at most 500).", minimum: 1, maximum: 500 },
      },
      additionalProperties: false,
    },
    async run(a) {
      const words = (a.text ?? "").toLowerCase().split(/\s+/).filter(Boolean);
      const hits = (await indexLines({ model: a.model, open: a.open_only })).filter(i =>
        (!a.lattice || i.lattice === a.lattice || i.lattice?.startsWith(`${a.lattice}-`))
        && (!a.boundary || i.boundary === a.boundary)
        && (a.n_sites_min == null || (typeof i.n_sites === "number" && i.n_sites >= a.n_sites_min))
        && (a.n_sites_max == null || (typeof i.n_sites === "number" && i.n_sites <= a.n_sites_max))
        && (!a.open_only || isOpen(i))
        && Object.entries(a.params ?? {}).every(([k, v]) => i.params?.[k] === v)
        && words.every(w => `${i.label} ${i.instance_id}`.toLowerCase().includes(w)));
      const limit = Math.min(a.limit ?? 50, 500);
      return { matches: hits.length, returned: Math.min(hits.length, limit), instances: hits.slice(0, limit), note: NOTE };
    },
  },
  {
    name: "list_open_problems",
    description: "QMBL: Open Problems, the open instances as a benchmark: each with its best variational value (the bar an entry must beat, by more than 2 sigma combined for a new record), QMBL's other best values (projected, extrapolated, approximate; not upper bounds), whether the verifier can measure it yet, and its verified entries; plus the systems' scores. How to enter: https://github.com/quantum-many-body-leaderboard/open-problems.",
    inputSchema: {
      type: "object",
      properties: {
        model: { type: "string", description: "Model name as list_models gives it." },
        lattice: { type: "string", description: "Lattice, or its family before the dash (\"kagome\" matches kagome-36a)." },
        n_sites_min: { type: "integer", description: "Smallest number of sites." },
        n_sites_max: { type: "integer", description: "Largest number of sites." },
        verifier_supported: { type: "boolean", description: "Only instances the verifier can measure today (true), or only those it cannot yet (false)." },
        with_entries: { type: "boolean", description: "Only instances with at least one verified entry." },
        text: { type: "string", description: "Words that must all appear in the label or the instance id (case-insensitive)." },
        limit: { type: "integer", description: "Most targets to return (default 50, at most 500).", minimum: 1, maximum: 500 },
      },
      additionalProperties: false,
    },
    async run(a) {
      let op;
      try { op = await get("api/open-problems.json"); }
      catch (e) { if (e instanceof NotFound) throw new UserError(`${SOURCE} has no api/open-problems.json yet`); throw e; }
      const words = (a.text ?? "").toLowerCase().split(/\s+/).filter(Boolean);
      const entered = new Set(op.entries.map(e => e.instance_id));
      const hits = op.targets.filter(x =>
        (!a.model || x.model === a.model)
        && (!a.lattice || x.lattice === a.lattice || x.lattice?.startsWith(`${a.lattice}-`))
        && (a.n_sites_min == null || (typeof x.n_sites === "number" && x.n_sites >= a.n_sites_min))
        && (a.n_sites_max == null || (typeof x.n_sites === "number" && x.n_sites <= a.n_sites_max))
        && (a.verifier_supported == null || x.verifier.supported === a.verifier_supported)
        && (!a.with_entries || entered.has(x.instance_id))
        && words.every(w => `${x.label} ${x.instance_id}`.toLowerCase().includes(w)));
      const limit = Math.min(a.limit ?? 50, 500), shown = hits.slice(0, limit), ids = new Set(shown.map(x => x.instance_id));
      return { matches: hits.length, returned: shown.length, targets: shown, entries: op.entries.filter(e => ids.has(e.instance_id)), systems: op.systems, note: op.note };
    },
  },
  {
    name: "best_values",
    description: "The exact energy (where one exists) and the best energy of each bound type for one QMBL instance, each with sigma, method, ansatz, reference and per-site energy; also the rows passed over for lying more than 2 sigma below the exact energy. Smaller than get_instance.",
    inputSchema: { type: "object", properties: { instance_id: { type: "string", description: "Instance id, e.g. J1J2/square_36_P_J2-0.5." } }, required: ["instance_id"], additionalProperties: false },
    async run(a) {
      const i = await instance(a.instance_id);
      return {
        instance_id: i.instance_id, label: i.label ?? null, url: i.url, n_sites: i.n_sites, per_site_divisor: i.per_site_divisor, per_site_label: i.per_site_label,
        best: i.best, no_best_reason: i.no_best_reason ?? null,
        note: `There is no single record: each bound type has its own best (RULES.md section 6). ${NOTE}`,
      };
    },
  },
  {
    name: "get_instance",
    description: "Everything QMBL holds on one instance: the Hamiltonian parameters, every published energy (row) with sigma, method, bound type, reference, defects, error metrics and cost where known, and the best values. Can be large for instances with many rows.",
    inputSchema: { type: "object", properties: { instance_id: { type: "string", description: "Instance id, e.g. Hubbard/square_64_P_14_4." } }, required: ["instance_id"], additionalProperties: false },
    async run(a) { return { ...(await instance(a.instance_id)), note: NOTE }; },
  },
];

// -------------------------------------------------------------------------- protocol
const send = msg => process.stdout.write(JSON.stringify({ jsonrpc: "2.0", ...msg }) + "\n");
const tool = name => TOOLS.find(t => t.name === name);

async function handle(req) {
  const { id, method, params } = req;
  const isRequest = id !== undefined && id !== null;
  switch (method) {
    case "initialize":
      return send({ id, result: {
        protocolVersion: typeof params?.protocolVersion === "string" ? params.protocolVersion : PROTOCOL,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "qmbl", title: "QMBL: the Quantum Many-Body Leaderboard", version: VERSION },
        instructions: `Read-only access to QMBL, the best published ground-state energies of quantum many-body Hamiltonian instances, from ${SOURCE}. Start with list_models, then search_instances; best_values or get_instance for one instance; list_open_problems for the QMBL: Open Problems benchmark. ${NOTE}`,
      } });
    case "ping":
      return isRequest && send({ id, result: {} });
    case "tools/list":
      return send({ id, result: { tools: TOOLS.map(({ run, ...t }) => t) } });
    case "tools/call": {
      const t = tool(params?.name);
      if (!t) return send({ id, error: { code: -32602, message: `unknown tool: ${params?.name}` } });
      try {
        const out = await t.run(params.arguments ?? {});
        return send({ id, result: { content: [{ type: "text", text: JSON.stringify(out, null, 2) }], structuredContent: out } });
      } catch (e) {
        const message = e instanceof UserError ? e.message : `reading ${SOURCE} failed: ${e.message}`;
        return send({ id, result: { content: [{ type: "text", text: message }], isError: true } });
      }
    }
    default:
      // Notifications (notifications/initialized, cancellations) need no answer.
      if (isRequest) send({ id, error: { code: -32601, message: `method not found: ${method}` } });
  }
}

let buffer = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", chunk => {
  buffer += chunk;
  let nl;
  while ((nl = buffer.indexOf("\n")) >= 0) {
    const line = buffer.slice(0, nl).trim();
    buffer = buffer.slice(nl + 1);
    if (!line) continue;
    let req;
    try { req = JSON.parse(line); } catch { send({ id: null, error: { code: -32700, message: "parse error" } }); continue; }
    for (const r of Array.isArray(req) ? req : [req])
      handle(r).catch(e => r.id != null && send({ id: r.id, error: { code: -32603, message: e.message } }));
  }
});
