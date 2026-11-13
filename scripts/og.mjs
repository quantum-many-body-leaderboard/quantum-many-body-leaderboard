// The link-preview card (og:image, 1200x630): the frozen mark, the name, one sentence on what
// QMBL holds, and the domain. The sentence is the scope line of README.md, CITATION.cff and
// .zenodo.json; change them together.
//
//   node scripts/og.mjs /tmp/og.html     writes the card as a page
//
// The Pages build has no browser, so the PNG is rendered by hand and committed, like the icons
// in scripts/logo.mjs (on a Mac, with Brave or Chrome):
//   "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" --headless --hide-scrollbars \
//     --window-size=1200,630 --screenshot=scripts/assets/og.png file:///tmp/og.html
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { faviconSvg } from "./logo.mjs";

export const SCOPE = "The best published ground-state energies for lattice models, hydrogen chains and sheets, the electron gas, atoms and molecules.";

export function ogHtml() {
  // the favicon without its dark-mode rule: the card is always light
  const mark = faviconSvg().replace(/@media[^\n]*\n/, "").replace("<svg ", '<svg class="mark" ');
  return `<!doctype html>
<meta charset="utf-8">
<style>
html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; background: #fcfcfb; }
body { position: relative; box-sizing: border-box; border-bottom: 10px solid #104281; }
.head { position: absolute; left: 96px; top: 84px; display: flex; align-items: center; gap: 40px; }
.mark { width: 160px; height: 160px; }
.name { font-family: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif; color: #0b0b0b; }
.name b { display: block; font-size: 124px; font-weight: 600; line-height: 1; letter-spacing: -0.01em; }
.name span { display: block; font-size: 46px; line-height: 1.15; margin-top: 4px; }
p { position: absolute; left: 96px; top: 370px; width: 960px; margin: 0;
  font: 400 30px/1.4 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif; color: #52514e; }
.url { position: absolute; left: 96px; top: 528px;
  font: 400 26px ui-monospace, "SF Mono", Menlo, Consolas, monospace; color: #898781; }
</style>
<div class="head">${mark}<div class="name"><b>QMBL</b><span>the Quantum Many-Body Leaderboard</span></div></div>
<p>${SCOPE}</p>
<div class="url">qmbl.org</div>
`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = process.argv[2];
  if (!out) { console.error("usage: node scripts/og.mjs <out.html>"); process.exit(1); }
  fs.writeFileSync(out, ogHtml());
  console.log(`wrote ${out}`);
}
