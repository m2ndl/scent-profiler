import sys, re
path = r"C:/Users/malha/Desktop/Webapps/perfume-profiler/reference/books/scent_and_chemistry_2022.txt"
lines = open(path, encoding="utf-8").read().split("\n")
cur_h = ""; in_ref = False
body = []
for i, l in enumerate(lines[:6262], 1):
    if l.startswith("#"):
        cur_h = l.strip("# ").strip()
        in_ref = cur_h.startswith("References") or i < 1491
        continue
    if in_ref or not l.strip(): continue
    body.append((i, cur_h, l))
args = sys.argv[1:]
maxn = 8; width = 280
while args and args[0][:2] in ("-n", "-w"):
    if args[0].startswith("-n"): maxn = int(args[0][2:])
    else: width = int(args[0][2:])
    args = args[1:]
for term in args:
    rx = re.compile(term, re.I)
    hits = 0
    print(f"=== {term}")
    for i, h, l in body:
        for m in rx.finditer(l):
            s = max(0, m.start()-width); e = min(len(l), m.end()+width)
            print(f"[{i} | {h}] ...{l[s:e]}...")
            hits += 1
            if hits >= maxn: break
        if hits >= maxn: break
