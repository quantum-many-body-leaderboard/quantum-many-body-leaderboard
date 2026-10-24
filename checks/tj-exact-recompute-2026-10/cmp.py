"""Compare sector results with full-space runs: python cmp.py results.jsonl [bf.txt]"""
import json, re, sys, collections
R = [json.loads(l) for l in open(sys.argv[1]) if l.strip().startswith("{")]
bf = {}
if len(sys.argv) > 2:
    for l in open(sys.argv[2]):
        m = re.match(r"(\S+) dim (\d+) E0 (\S+)", l)
        if m: bf[m.group(1)] = (int(m.group(2)), float(m.group(3)))
groups = collections.defaultdict(list)
for r in R:
    lab = r["label"]
    base = re.sub(r"_(full|k\d+-\d+_l\d+_star\d+|n\d+_p[+-]|l\d)$", "", lab)
    groups[base].append(r)
for base, rs in sorted(groups.items()):
    full = [r for r in rs if r["label"].endswith("_full")]
    sec = [r for r in rs if not r["label"].endswith("_full")]
    dsum = 0
    for r in sec:
        m = re.search(r"_star(\d+)$", r["label"])
        w = int(m.group(1)) if m else 1
        if re.search(r"_n(\d+)_p", r["label"]):  # ladder: n and L-n
            n = int(re.search(r"_n(\d+)_p", r["label"]).group(1)); w = 1
        dsum += w * r["dim"]
    emin = min((r["E"] for r in sec if r["dim"] > 0), default=None)
    arg = min((r for r in sec if r["dim"] > 0), key=lambda r: r["E"], default=None)
    line = f"{base:34s}"
    if full: line += f" full dim {full[0]['dim']:>10d} E {full[0]['E']:.10f}"
    if sec: line += f" | sectors {len(sec)} min E {emin:.10f} ({arg['label'][len(base)+1:]}) dimsum(weighted) {dsum}"
    b = bf.get(base + "_full")
    if b: line += f" | bf dim {b[0]} E {b[1]:.10f}"
    print(line)
