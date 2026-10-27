// Resolve every paper identifier in the table to authors, institutions and countries,
// and cache the result in sources/openalex.json.
//
// Run by hand, outside build.sh: it is the only script that uses the network, and the build
// stays offline and byte-idempotent. The cache is committed. Only identifiers missing from
// the cache are fetched; pass --refresh to re-fetch everything.
//
//   node scripts/enrich_sources.mjs [--refresh]
//
// Source is OpenAlex: one call gives title, year, DOI, the author list, institutions and
// ISO country codes. arXiv ids resolve through their DataCite DOI, 10.48550/arXiv.<id>.
import fs from "node:fs";
import path from "node:path";
import { collect } from "./summary.mjs";

// Kept outside data/, which emit.mjs wipes on every build. The cache is committed.
const CACHE = "sources/openalex.json";
// OpenAlex "polite pool": a contact address in the User-Agent, from QMBL_MAILTO when set.
const MAILTO = process.env.QMBL_MAILTO;
const UA = { headers: { "User-Agent": `qmbl/0.1${MAILTO ? ` (mailto:${MAILTO})` : ""}` } };
const sleep = ms => new Promise(r => setTimeout(r, ms));

// A reference may carry an arXiv id, a journal DOI, both, or only a link to a run
// script. VarBench cites code for a large part of its table, so null ("no identifier") is a
// common, valid result.
//
// A DOI runs to the next space or to a markdown link's "](", and then loses the punctuation
// of the sentence around it: "doi:10.1103/PhysRevB.92.035122, arXiv:..." is
// 10.1103/PhysRevB.92.035122, and "[paper](https://doi.org/10.1126/science.adg9774)" is
// 10.1126/science.adg9774. A closing bracket stays when it closes one opened inside the DOI,
// so 10.1016/S0022-3697(01)00112-3 is kept whole and "(doi:10.1016/0003-4916(70)90270-8)"
// loses only the outer one.
const DOI = /10\.\d{4,9}\/(?:(?!\]\()\S)+/;
const PAIRS = { ")": "(", "]": "[" };
function trimDoi(d) {
  const count = c => d.split(c).length - 1;
  for (;;) {
    const last = d.at(-1);
    if (/[.,;:'"!?>]/.test(last) || (PAIRS[last] && count(last) > count(PAIRS[last]))) d = d.slice(0, -1);
    else return d;
  }
}
export function identify(ref) {
  ref = ref || "";
  const arxiv = ref.match(/arxiv\.org\/abs\/(\d{4}\.\d{4,5})|arXiv:\s?(\d{4}\.\d{4,5})/i);
  const m = ref.match(DOI);
  const doi = m && trimDoi(m[0]);
  if (doi) return { key: `doi:${doi}`, doi };
  if (arxiv) { const id = arxiv[1] || arxiv[2]; return { key: `arxiv:${id}`, arxiv: id }; }
  return null;
}

const get = async url => {
  const r = await fetch(url, UA);
  if (!r.ok) return null;
  const j = await r.json().catch(() => null);
  return j && !j.error ? j : null;
};

const affiliations = w => ({
  institutions: [...new Set((w.authorships || []).flatMap(a => a.institutions.map(i => i.display_name)))],
  countries: [...new Set((w.authorships || []).flatMap(a => a.countries || []))],
});

// The first author's affiliation, kept separately from the paper-wide lists. A paper with
// authors in several countries has no single country, so the by-country view uses the
// first author's institution. The country is the institution's country (a researcher at
// ETH counts as CH), never a nationality.
const firstAuthor = w => {
  const a = (w.authorships || [])[0];
  return {
    first_author_institution: a?.institutions?.[0]?.display_name ?? null,
    first_author_institution_country: a?.countries?.[0] ?? a?.institutions?.[0]?.country_code ?? null,
  };
};

// DataCite mints the arXiv DOIs, so it has every preprint as soon as it is posted,
// including recent ones OpenAlex has not indexed yet. It gives authors and a year but
// rarely any affiliation.
// Names arrive as "Chen, Ao", which is flipped here so one surname rule serves both.
async function resolveDatacite(id) {
  const doi = id.doi || `10.48550/arXiv.${id.arxiv}`;
  const j = await get(`https://api.datacite.org/dois/${doi}`);
  const a = j?.data?.attributes;
  if (!a) return null;
  const authors = (a.creators || []).map(c => {
    const n = c.name || [c.givenName, c.familyName].filter(Boolean).join(" ");
    const m = n.match(/^([^,]+),\s*(.+)$/);
    return m ? `${m[2]} ${m[1]}` : n;
  });
  const institutions = [...new Set((a.creators || [])
    .flatMap(c => (c.affiliation || []).map(x => x.name || x).filter(Boolean)))];
  return {
    key: id.key, resolved_via: doi, openalex: null,
    doi: id.doi ?? doi,
    title: a.titles?.[0]?.title ?? null,
    year: a.publicationYear ?? null,
    type: a.types?.resourceTypeGeneral?.toLowerCase() ?? "preprint",
    venue: a.publisher ?? null,
    authors, institutions, countries: [],
    first_author_institution: institutions[0] ?? null,
    first_author_institution_country: null,
    affiliations_from: null,
    source_api: "datacite",
    checked_on: new Date().toISOString().slice(0, 10),
  };
}

async function resolve(id) {
  const doi = id.doi || `10.48550/arXiv.${id.arxiv}`;
  let w = await get(`https://api.openalex.org/works/doi:${encodeURIComponent(doi)}`);
  if (!w) return resolveDatacite(id);

  let { institutions, countries } = affiliations(w);
  let first = firstAuthor(w);
  let merged_from = null;
  // Preprint records in OpenAlex usually carry the author list but no affiliations. The
  // published version of the same paper does, so when we land on a bare preprint we look
  // it up by title and take the affiliations from there. The authors stay the preprint's.
  if (!institutions.length && w.display_name) {
    await sleep(150);
    const q = `https://api.openalex.org/works?filter=title.search:${encodeURIComponent(w.display_name)}&per_page=5`;
    const alt = await get(q);
    const hit = (alt?.results || []).find(r =>
      r.id !== w.id && affiliations(r).institutions.length &&
      r.display_name?.toLowerCase() === w.display_name.toLowerCase());
    if (hit) {
      ({ institutions, countries } = affiliations(hit));
      first = firstAuthor(hit);
      merged_from = hit.doi || hit.id;
    }
  }

  const authors = (w.authorships || []).map(a => a.author.display_name);
  return {
    key: id.key,
    resolved_via: doi,
    openalex: w.id,
    doi: w.doi ? w.doi.replace(/^https?:\/\/doi\.org\//, "") : null,
    title: w.display_name || null,
    year: w.publication_year ?? null,
    type: w.type || null,
    venue: w.primary_location?.source?.display_name || null,
    authors,
    institutions,
    countries,
    ...first,
    // Set when the affiliations come from the published version of the same paper.
    affiliations_from: merged_from,
    source_api: "openalex",
    checked_on: new Date().toISOString().slice(0, 10),
  };
}

// Read the committed cache, with locally parsed affiliations layered on top. Every consumer
// reads through this function, which also handles a missing file.
//
// The local layer only fills gaps: a registry's first-author affiliation wins, because it
// can be checked. affiliations_local.mjs only writes entries the registries left empty.
const LOCAL = "sources/affiliations-local.json";
export function sources() {
  const base = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, "utf8")) : {};
  if (!fs.existsSync(LOCAL)) return base;
  for (const [key, loc] of Object.entries(JSON.parse(fs.readFileSync(LOCAL, "utf8")))) {
    const s = base[key];
    if (!s || s.first_author_institution_country) continue;
    s.first_author_institution = s.first_author_institution ?? loc.first_author_institution;
    s.first_author_institution_country = loc.first_author_institution_country;
    s.first_author_country_from = loc.from;
  }
  return base;
}

// The identifier of the paper a row's number is from, or null. A quoted row names the
// original and then where it was read, "Y. Nomura and M. Imada, Phys. Rev. X 11, 031034
// (2021) (cited as ref [7] in Table I of arXiv:2211.07749)", so the first identifier in the
// string can be the quoting paper's. A "(cited ... )" or "(quoted ... )" clause is cut before
// looking, and an identifier that verified.secondary_of names as the quoting source is
// refused, which covers the clause-less forms ("arXiv:1903.06713 (footnote [39] there)").
const QUOTING = /\([^()]*\b(?:cited|quoted)\b[^()]*\)/gi;
export function paperOf(row) {
  const id = identify((row.reference || "").replace(QUOTING, ""));
  return id && !(row.verified?.secondary_of || "").includes(id.arxiv ?? id.doi) ? id : null;
}

// The metadata for a row's paper, or null when the reference names none we can resolve.
export function sourceOf(row, cache = sources()) {
  const id = paperOf(row);
  return id ? cache[id.key] ?? null : null;
}

async function main() {
  const refresh = process.argv.includes("--refresh");
  const cache = refresh ? {} : sources();

  const wanted = new Map();
  let noId = 0;
  for (const inst of collect())
    for (const r of inst.rows) {
      const id = identify(r.reference);
      if (id) wanted.set(id.key, id); else noId++;
    }

  const todo = [...wanted.values()].filter(id => !cache[id.key]);
  console.log(`${wanted.size} distinct identifiers, ${todo.length} to fetch, ${noId} rows carry no identifier`);

  let ok = 0;
  for (const [i, id] of todo.entries()) {
    const rec = await resolve(id);
    if (rec) { cache[id.key] = rec; ok++; }
    else console.log(`  UNRESOLVED ${id.key}`);
    process.stdout.write(`\r  ${i + 1}/${todo.length}`);
    await sleep(150);
  }
  console.log(`\nresolved ${ok}/${todo.length}`);

  // Sorted so the committed file has a stable diff.
  const sorted = Object.fromEntries(Object.keys(cache).sort().map(k => [k, cache[k]]));
  fs.writeFileSync(CACHE, JSON.stringify(sorted, null, 2) + "\n");
  const withInst = Object.values(sorted).filter(s => s.institutions.length).length;
  console.log(`${CACHE}: ${Object.keys(sorted).length} sources, ${withInst} with institutions`);
}

// Network access only when run directly; importing this module never fetches.
if (process.argv[1] && import.meta.url === `file://${path.resolve(process.argv[1])}`) await main();
