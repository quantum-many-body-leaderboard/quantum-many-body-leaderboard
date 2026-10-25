// Reference strings from arXiv metadata and Crossref (titles never typed by hand). Network; not part of the
// reproducible run. Usage: node scripts/track3/refs.mjs passes/track3/refs-hydrogen.json <arXiv ids...>
import fs from "node:fs";
const ids = process.argv.slice(3), out = {};
const sleep = ms => new Promise(r => setTimeout(r, ms));
for (const id of ids) {
  let t = "";
  for (let i = 0; i < 5; i++) { try { const r = await fetch(`https://export.arxiv.org/api/query?id_list=${id}`); if (r.ok) { t = await r.text(); break; } } catch {} await sleep(4000 * (i + 1)); }
  const e = t.match(/<entry>([\s\S]*?)<\/entry>/)?.[1] || "";
  const title = (e.match(/<title>([\s\S]*?)<\/title>/)?.[1] || "").replace(/\s+/g, " ").trim();
  const authors = [...e.matchAll(/<name>([^<]+)<\/name>/g)].map(m => m[1]);
  const doi = e.match(/<arxiv:doi[^>]*>([^<]+)/)?.[1];
  let journal = e.match(/<arxiv:journal_ref[^>]*>([^<]+)/)?.[1]?.replace(/\s+/g, " ");
  let ctitle = null;
  if (doi) { try { const r = await fetch(`https://api.crossref.org/works/${doi}`); if (r.ok) { const m = (await r.json()).message; ctitle = m.title?.[0]; journal = `${m["container-title"]?.[0]} ${m.volume ?? ""}, ${m["article-number"] || m.page || ""} (${m.issued?.["date-parts"]?.[0]?.[0]})`; } } catch {} }
  const au = authors.length > 4 ? `${authors.slice(0, 3).join(", ")} et al.` : authors.join(", ");
  out[id] = { reference: `${au}, ${ctitle || title}${journal ? `, ${journal}` : ""}, arXiv:${id}${doi ? `, doi:${doi}` : ""}`, peer_reviewed: !!doi, title_source: ctitle ? "Crossref" : "arXiv" };
  console.log(id, out[id].reference.slice(0, 140));
  await sleep(3500);
}
fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
