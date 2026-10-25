#!/bin/sh
# Track 3 (hydrogen chains and sheets), held pass: regenerate passes/track3/{sweep-rows,held,code-links}-*.json.
# Run from the repo root: sh scripts/track3/build.sh. Inputs: sources/ (paper texts, the 2017 data repository),
# passes/track3/read/result-*.json (reader results), passes/track3/refs-hydrogen.json (citations, refs.mjs),
# passes/track3/verify-2026-10-24-hydrogen.json (verify pass). Intermediate outputs go to scripts/track3/.out/.
set -e
cd "$(dirname "$0")/../.."
node scripts/track3/motta2017.mjs
node scripts/track3/hachmann.mjs
node scripts/track3/motta2020si.mjs
node scripts/track3/g1904.mjs
node scripts/track3/readers.mjs
node scripts/track3/assemble.mjs > scripts/track3/.out/assemble.json
node scripts/track3/codelinks.mjs
