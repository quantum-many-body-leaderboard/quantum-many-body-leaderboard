// Render a row's reference as a human citation, linked to its DOI.
//
// "Nomura & Imada (2021)" says whose result holds the record, and the link goes to the DOI,
// which outlives a publisher URL. Rows whose reference names no paper (VarBench cited run
// scripts for a large part of its table) keep the code link and are marked as such.
import { sourceOf, sources, paperOf, identify } from "./enrich_sources.mjs";

// Last name for the citation. Both registries are inconsistent about ordering: most
// records read "Yuntian Gu", some read "Gu, Yuntian". The comma form is unambiguous
// and is checked first: the trailing word of "Gu, Yuntian" would cite the paper as
// "Yuntian et al.". Unmarked particles ("van der Waals") are still cut wrongly; the full
// author list is in sources/openalex.json when the exact form matters.
// Authors OpenAlex lists family name first, checked against the paper's own byline: Rong Cheng
// (arXiv:2509.13746, "Rong Cheng and Tao Li") is "Cheng Rong" there.
const NAME_ORDER = new Map([["Cheng Rong", "Rong Cheng"]]);
const surname = name => {
  const n = NAME_ORDER.get((name || "").trim()) ?? (name || "").trim();
  const comma = n.match(/^([^,]+),/);
  return comma ? comma[1].trim() : n.split(/\s+/).pop();
};

export function citeText(s) {
  const a = s.authors || [];
  const y = s.year ? ` (${s.year})` : "";
  if (!a.length) return (s.title || "source").slice(0, 40) + y;
  if (a.length === 1) return `${surname(a[0])}${y}`;
  if (a.length === 2) return `${surname(a[0])} & ${surname(a[1])}${y}`;
  return `${surname(a[0])} et al.${y}`;
}

export const citeUrl = s =>
  s.doi ? `https://doi.org/${s.doi}`
    : s.resolved_via?.startsWith("10.48550/arXiv.")
      ? `https://arxiv.org/abs/${s.resolved_via.replace("10.48550/arXiv.", "")}`
      : s.openalex;

// Author-year read off a reference that has no resolved paper behind it: the leading run
// of personal names and the publication year after them. The names are the forms the rows
// use ("W.-J. Hu, F. Becca, A. Parola, and S. Sorella", "Choo, Neupert & Carleo",
// "Francesco Ferrari, Federico Becca, and Juan Carrasquilla."), and a candidate counts only
// when what follows it is a list separator or the end of the list, so a title's first words
// ("C. Roth, Iterative Retraining of ...") are not taken for an author. Null unless both
// the names and a year are found: the caller then shows the reference text, never a guess.
const QUOTING = /\([^()]*\b(?:cited|quoted)\b[^()]*\)/gi;
const PART = "\\p{Lu}[\\p{L}'’-]+";
const NAME = new RegExp(`^(?:(?:\\p{Lu}\\.(?:-\\p{Lu}\\.)?\\s?)+(?:${PART}\\s)?${PART}|${PART}(?:\\s(?:\\p{Lu}\\.|${PART})){0,2})`, "u");
const NEXT = /^(?:,\s+and\s+|\s+and\s+|\s*&\s*|,\s+)/;
const ENDS = /^(?:[,.]|\s\(|$)/;
function authorYear(ref) {
  let rest = ref.replace(QUOTING, "").trim();
  const names = [];
  for (let last = false; ;) {
    const m = rest.match(NAME);
    if (!m) { if (last) return null; break; }
    const after = rest.slice(m[0].length), sep = after.match(NEXT);
    if (last || !sep) {
      if (ENDS.test(after)) { names.push(m[0]); rest = after; }
      // After "and" the next name must be the last one; one that does not read off cleanly
      // would drop an author, so the function returns null; a shorter list is never cited.
      else if (last) return null;
      break;
    }
    names.push(m[0]);
    rest = after.slice(sep[0].length);
    if (/^et al\./.test(rest)) { names.push("et al."); rest = rest.slice(7); break; }
    last = /and|&/.test(sep[0]);
  }
  const year = rest.match(/\(((?:19|20)\d{2})\)/)?.[1] ?? rest.match(/(?<![\d.:\/])((?:19|20)\d{2})(?!\d|\.\d)/)?.[1];
  if (!names.length || !year) return null;
  const s = names.map(x => x.split(/\s+/).pop());
  const who = s.length === 1 ? s[0] : s.length === 2 && s[1] !== "al." ? `${s[0]} & ${s[1]}` : `${s[0]} et al.`;
  return { text: `${who} (${year})`, year: +year };
}

// A VarBench run script is cited with the paper VarBench was published with, and dated by it:
// the paper behind a row whose reference is a script in github.com/varbench.
const VARBENCH_PAPER = "doi:10.1126/science.adg9774";
const varbenchPaper = (row, cache) =>
  /\[code\]\(https:\/\/github\.com\/varbench\//.test(row.reference || "") ? cache[VARBENCH_PAPER] ?? null : null;

// The year a row's number was published: its resolved paper's, VarBench's for its run scripts,
// else the year read off the reference text. The site's year column, the currency counts and
// the year figures use this.
export const paperYear = (row, cache = sources()) =>
  sourceOf(row, cache)?.year ?? varbenchPaper(row, cache)?.year ??
    (row.reference && !/\]\(https?:/.test(row.reference) ? authorYear(row.reference)?.year ?? null : null);

// The source of a row as text + url, before any markup. Falls back to the reference itself
// when the row names no paper QMBL has resolved, so every source is shown: an
// identifier not yet in the cache is shown and linked as itself, a citation without one as
// author-year where that reads off cleanly, else as its opening words. A quoted row with no
// paper of its own says where it was read. The README renders this as markdown and the site
// as HTML; building the text here keeps the citation under a number identical in both.
// A row QMBL computed cites the code that produced it, at the commit that ran, so it can be rerun.
const REPO = "https://github.com/quantum-many-body-leaderboard/quantum-many-body-leaderboard";
// QMBL's own rows name no person: a cost-to-reproduce run cites its checks/cost/ folder, an exact
// check its checks/ folder (2026-10-26).
const qmblRef = row => {
  const dir = (row.reference || "").match(/^QMBL, (checks\/[^\s/]+)\//)?.[1];
  if (row.computed_by === "qmbl" || dir === "checks/cost")
    return { text: "QMBL cost-to-reproduce run, checks/cost/", url: `${REPO}/tree/main/checks/cost` };
  return { text: `QMBL check, ${dir}/`, url: `${REPO}/tree/main/${dir}` };
};

// Where a quoted row's number was read (RULES.md 8): the work verified.secondary_of names, or,
// for a secondary row without it, the work after "printed in" / "quoted in" in its reference.
// Shown on every quoted row, whether its own paper is resolved or not. A quoting work QMBL has
// not resolved is named by author-year read off the reference text where it comes from there,
// else by its identifier. Nothing is shown when what secondary_of names is the row's own paper
// (the same title).
function quotedIn(row, cache, own) {
  const so = row.verified?.secondary_of;
  const text = so || (row.provenance === "secondary"
    ? (row.reference || "").match(/\b(?:printed|quoted|cited) in\s+(.+)$/i)?.[1] : null);
  if (!text) return undefined;
  const via = identify(text), s = via && cache[via.key];
  if (s && own?.title && s.title?.toLowerCase() === own.title.toLowerCase()) return undefined;
  const who = s ? citeText(s)
    : (!so && authorYear(text)?.text) || (via ? (via.arxiv ? `arXiv:${via.arxiv}` : via.doi) : null);
  return who ? `quoted in ${who}` : undefined;
}

export function citeRef(row, cache = sources()) {
  // A number QMBL computed (a cost run or an exact check) cites its checks/ folder (qmblRef);
  // the code column links the code and how to rerun it.
  if (row.computed_by === "qmbl" || /^QMBL, checks\//.test(row.reference || "")) return qmblRef(row);
  const s = sourceOf(row, cache);
  const note = quotedIn(row, cache, s);
  if (s) return note ? { text: citeText(s), url: citeUrl(s), note } : { text: citeText(s), url: citeUrl(s) };
  const ref = row.reference || "";
  const code = ref.match(/\[code\]\((https?:\/\/[^\s)]+)\)/);
  if (code) {
    const vb = varbenchPaper(row, cache);
    // The code column carries the script; the source cell then names the paper only.
    if (vb && row.artifacts?.code) return { text: citeText(vb), url: citeUrl(vb) };
    return vb ? { text: "run script", url: code[1], also: { text: citeText(vb), url: citeUrl(vb) } }
      : { text: "run script", url: code[1], note: "no paper cited" };
  }
  const link = ref.match(/\((https?:\/\/[^\s)]+)\)/);
  if (link) return note ? { text: "source", url: link[1], note } : { text: "source", url: link[1] };
  const id = paperOf(row);
  if (id) return id.arxiv
    ? { text: `arXiv:${id.arxiv}`, url: `https://arxiv.org/abs/${id.arxiv}`, note }
    : { text: id.doi, url: `https://doi.org/${id.doi}`, note };
  // identify() reads only new-style arXiv ids; a pre-2007 id ("cond-mat/9402061") still gives a link.
  const old = ref.match(/arXiv:\s?([a-z-]+(?:\.[A-Z]{2})?\/\d{7})/i)?.[1];
  const url = old ? `https://arxiv.org/abs/${old}` : null;
  const ay = authorYear(ref);
  if (ay) return { text: ay.text, url, note };
  const plain = ref.replace(QUOTING, "").trim();
  const cut = plain.length <= 40 ? plain : plain.slice(0, 40).replace(/[\s,;:.]+\S*$/, "") + "…";
  return { text: cut || "n/a", url, note };
}

// The code behind a row (DATA.md, "The code behind a row") as a short label + url, or null.
// A file or folder in a repository reads "run script" ("run scripts" for a folder); QMBL's own
// code reads "QMBL code"; a repository reads owner/repo; a Zenodo record reads "Zenodo <id>".
export function codeRef(row) {
  const a = row.artifacts;
  if (!a?.code) return null;
  const url = a.code;
  if (row.computed_by === "qmbl") return { text: "rerun (QMBL code)", url: `${REPO}/blob/main/checks/cost/README.md#rerun-a-row` };
  if (url.startsWith(REPO)) return { text: "QMBL code", url };
  if (a.scope === "model") return { text: "model code", url };
  if (a.script) return { text: a.script.endsWith("/") ? "run scripts" : "run script", url };
  const gh = url.match(/^https:\/\/(?:github\.com|gitlab\.com)\/([^/]+)\/([^/#?]+)/);
  if (gh) return { text: `${gh[1]}/${gh[2].replace(/\.git$/, "")}`, url };
  const zen = url.match(/zenodo[./](?:org\/records\/)?(\d+)$/);
  if (zen) return { text: `Zenodo ${zen[1]}`, url };
  return { text: new URL(url).hostname.replace(/^www\./, ""), url };
}

// The libraries a row's source says its authors used, for a row with no code of its own
// (DATA.md, "The code behind a row"), or null. Each reads as its name and, where the source
// states one, its version. The cell shows the first two and "+N" for the rest; `all` names
// every one.
export function libraryRef(row) {
  const a = row.artifacts;
  if (a?.code || !a?.libraries?.length) return null;
  const libs = a.libraries.map(l => ({ text: l.version ? `${l.name} ${l.version}` : l.name, url: l.url }));
  return { shown: libs.slice(0, 2), more: Math.max(0, libs.length - 2), all: libs.map(l => l.text).join(", ") };
}

// Markdown for the code cell: the label linked, else "uses" and the libraries, else empty.
export function codeCell(row) {
  const c = codeRef(row);
  if (c) return `[${c.text}](${c.url})`;
  const l = libraryRef(row);
  return l ? `*uses ${l.shown.map(x => `[${x.text}](${x.url})`).join(", ")}${l.more ? ` +${l.more}` : ""}*` : "";
}

// Markdown for the source cell.
export function citeCell(row, cache = sources()) {
  const r = citeRef(row, cache);
  const link = (r.url ? `[${r.text}](${r.url})` : r.text) + (r.also ? `, [${r.also.text}](${r.also.url})` : "");
  return r.note ? `${link}, ${r.note}` : link;
}
