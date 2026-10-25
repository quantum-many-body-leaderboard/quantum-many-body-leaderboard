// Code links for track 3 (rule of 2026-10-22): rows get artifacts { code, commit (only if stated), read_from }.
// One entry per paper that is the own source of rows. A quote is the source text with the layout's runs of spaces
// and line breaks collapsed to one space; the script finds it again in sources/<file> and stops if it does not.
// A URL counts only if it appears in that quote (a PDF line break inside a URL is the only thing joined).
import fs from "node:fs";
import { T3 } from "./common.mjs";
const [REPO = ".", PASS = `${T3}/sweep-rows-2026-10-20-hydrogen.json`, OUT = `${T3}/code-links-2026-10-22-hydrogen.json`] = process.argv.slice(2);
const CHECKED = "2026-10-22";
// const flat = f => fs.readFileSync(`${REPO}/sources/${f}`).toString("utf8").replace(/\s+/g, " ");
// const flatJoin = f => fs.readFileSync(`${REPO}/sources/${f}`).toString("utf8").replace(/\s*\n\s*/g, "").replace(/\s+/g, " ");
const E = [
  { arxiv: "2605.02056", status: "linked", code: "https://github.com/rr637/QC-AFQMC", file: "2605.02056.txt", section: "Code Availability",
    quote: ["The complete implementation used in this work, en-", "compassing GPU-accelerated VQE and ph-AFQMC sim-", "ulations with quantum trial wavefunctions, is publicly", "available at:https://github.com/rr637/QC-AFQMC."],
    note: "the AFQMC(UHF) rows are ph-AFQMC runs of this implementation; no commit or release stated" },
  { arxiv: "2303.10825", status: "linked", code: "https://github.com/tencent-quantum-lab/TenCirChem", file: "2303.10825.txt", section: "2.5 Installing and contributing to TenCirChem",
    quote: ["The source code is hosted on the GitHub repository https://github.", "com/tencent-quantum-lab/TenCirChem."],
    note: "the authors' own library; Table 1 reports the UCCSD energies of the hydrogen chains computed with it (method string \"UCCSD (TenCirChem)\"); no version or commit stated" },
  { arxiv: "2006.14956", status: "linked", code: "https://github.com/ghb24/NECI_STABLE", file: "2006.14956.txt", section: "XVIII. Data Availability Statement",
    quote: ["The NECI program can be obtained at https://github.", "com/ghb24/NECI_STABLE, the development version can be obtained from the corresponding", "author upon reasonable request."],
    note: "the authors' own program; the GUGA-FCIQMC energies of Table II (reproduced from a 2019 PhD thesis) are a NECI feature. The paper does not say whether the stable or the development version produced them, and states no commit. The URL redirects to github.com/fkfest/NECI_STABLE (checked 2026-10-22)" },
  { arxiv: "1905.06971", status: "ambiguous", file: "1905.06971.txt", section: "Sec. II and Ref. 24",
    quote: ["For all the calculations we used the Tur-", "boRVB package.24"],
    reason: "TurboRVB is the authors' own program and the text says it produced every number, but Ref. 24 is the project website (https://people.sissa.it/~sorella/web/, now redirecting to sissaschool.github.io/turborvb_website), not a code repository, and no version is stated" },
  { arxiv: "2604.02054", status: "ambiguous", file: "2604.02054.txt", section: "Data availability",
    quote: ["The code is openly available on the", "ipie GitHub repository by by Joonho Leeet al. 16,30 ."],
    reason: "the statement names the ipie GitHub repository but prints no URL (Refs. 16 and 30 are papers). The URLs it does print are a Zenodo data record (Ref. 32: ITHC data and integrals) and github.com/carrot6869/Isometric-THC (Ref. 35, cited for computing the ITHC factors, not for the AFQMC energies)" },
  { arxiv: "2005.11349", status: "not_found", file: "2005.11349.txt", section: "Data Availability and Ref. 113",
    quote: ["The geometries of the hydrogen models, energy errors at", "eachvalueof Npar forap-sCI,ACI,SVD-FCIandDMRG,and", "rawdataforthepotentialenergycurvesoftheH10modelsusing", "RHF, MP2, CCSD, CCSD(T), CR-CC(2,3), V2RDM-PQG,", "V2RDM-PQGT2, and FCI are openly available on GitHub,", "reference number113."],
    reason: "Ref. 113 (github.com/evangelistalab/hydrogen-models-data) is a data release, not code; Forte (Ref. 144), the authors' code, is cited without a URL" },
  { arxiv: "1904.01131", status: "ambiguous", file: "1904.01131.txt", section: "Sec. II and the H10 example",
    quote: ["InTable II, we have also collated CCSDT [73–75] and CCSDTQ [76,77] ground-state energies, which", "also have not been studied in Ref. [66]."],
    reason: "the paper presents the authors' NWChem and Q# tools (github.com/nwchemgit/nwchem, github.com/Microsoft/Quantum appear in the text) but does not say which program produced the CCSDT, CCSDTQ and MkMRCC energies of Table II" },
  { arxiv: "1911.05163", status: "not_found", file: "1911.05163.txt", section: "full text", reason: "QForte, the authors' package, is named without a URL; the FCI rows' program is not stated" },
  ...["1705.01608", "1911.01618", "cond-mat/0606115", "2305.12776", "2305.05168", "1807.07014", "2604.02054x", "2505.08635", "1804.03310"].filter(a => !a.endsWith("x")).map(a => ({ arxiv: a, status: "not_found", file: null, section: "full text",
    reason: a === "1705.01608" ? "Ref. [11] of the journal version names the data repository (github.com/simonsfoundation/hydrogen-benchmark-PRX), a data release; the many codes used (Block, PySCF, Molpro, QMC codes) are named without a repository the paper says produced a row" :
      a === "1804.03310" ? "the GPU AFQMC code is described but no repository or availability statement is printed" : "no code repository or availability statement in the text" })),
];
// A quote is given as its line fragments (two-column layout interleaves the columns); each fragment must be found on
// a later line than the one before, within 3 lines, with runs of spaces collapsed.
for (const e of E) {
  if (!e.quote) continue;
  const L = fs.readFileSync(`${REPO}/sources/${e.file}`).toString("utf8").split("\n").map(l => l.replace(/\s+/g, " "));
  const norm = x => x.replace(/\s+/g, " ").trim();
  let prev = -1, first = -1;
  e.quote.forEach((frag, i) => {
    const f = norm(frag);
    const idx = i === 0 ? L.findIndex(l => l.includes(f)) : L.findIndex((l, j) => j > prev && j <= prev + 3 && l.includes(f));
    if (idx < 0) throw new Error(`fragment not found in ${e.file}: ${f}`);
    if (i === 0) first = idx; prev = idx;
  });
  e.lines = `${first + 1}-${prev + 1}`;
  e.quote = e.quote.map(norm).join(" ");
  if (e.code && !e.quote.replace(/(https?:\/\/\S*?\.) (\S)/g, "$1$2").includes(e.code)) throw new Error(`url not in quote: ${e.code}`);
}
const rows = JSON.parse(fs.readFileSync(PASS, "utf8"));
let linked = 0;
for (const r of rows) {
  const e = E.find(x => x.arxiv === r.arxiv && x.status === "linked");
  if (!e) continue;
  // main's shape (DATA.md, "The code behind a row"; add_code_links.mjs): { code, commit (only if stated),
  // read_from: { quote, location, checked_on, pass } }
  r.artifacts = { code: e.code, ...(e.commit ? { commit: e.commit } : {}),
    read_from: { quote: e.quote, location: `${e.section} (sources/${e.file}, lines ${e.lines})`, checked_on: CHECKED, pass: OUT } };
  linked++;
}
fs.writeFileSync(PASS, JSON.stringify(rows, null, 1) + "\n");
fs.writeFileSync(OUT, JSON.stringify(E.map(({ file, ...e }) => ({ ...e, source_text: file && `sources/${file}`, checked_on: CHECKED, pass: "passes/track3/code-links-2026-10-22-hydrogen.json", rows: rows.filter(r => r.arxiv === e.arxiv).length })), null, 1) + "\n");
console.log(`code links: ${linked} rows linked; papers ${E.length}: ${E.map(e => `${e.arxiv}=${e.status}`).join(" ")}`);
