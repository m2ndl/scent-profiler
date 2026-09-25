"""Rows of the Saudi popularity lists that match no catalogue perfume as a sale: candidates for the catalogue."""
import json, os, re, sys
ROOTP = r"C:\Users\malha\Desktop\Webapps\perfume-profiler"
SRC = os.path.join(ROOTP, "reference", "quiz", "popularity", "match_popularity.py")
code = open(SRC, encoding="utf-8").read()
code = code.split("\namazon = json.load")[0]          # definitions and the catalogue only
g = {"__file__": SRC, "__name__": "defs"}
os.chdir(ROOTP)
exec(compile(code, SRC, "exec"), g)
match, fold = g["match"], g["fold"]
HERE = os.path.dirname(SRC)
amazon = json.load(open(os.path.join(HERE, "amazon_sa.json"), encoding="utf-8"))["rows"]
niceone = json.load(open(os.path.join(HERE, "niceone.json"), encoding="utf-8"))["rows"]
NOT_PERFUME = re.compile(r"after ?shave|deodorant|deo\b|body (mist|spray|lotion|wash|splash)|hair (mist|perfume)|shower|lotion|balm|roll ?on|\bset\b|gift|bundle|sample|travel|discovery|miniature|mini\b|cream|soap|incense|bakhoor|bukhoor|burner|oud wood chips|air freshener|car ", re.I)
out = []
for lst, rank, ratings, title in amazon:
    m = match(title)
    if any(k in ("sale", "copy") for _, k, _ in m): continue
    if NOT_PERFUME.search(title): continue
    out.append(("amazon", lst, rank, ratings, title, "; ".join(f"flanker of {p['id']}" for p, k, _ in m)))
seen = set()
for r in niceone:
    key = (r["list"], r["rank"], r["slug"])
    if key in seen: continue
    seen.add(key)
    text = re.sub(r"-n\d+$", "", r["slug"]).replace("-", " ")
    if " inspired by " in f" {text} ": continue            # store-brand copies
    m = match(text)
    if any(k in ("sale", "copy") for _, k, _ in m): continue
    if NOT_PERFUME.search(text): continue
    out.append(("niceone", r["list"], r["rank"], r["reviews"], text, "; ".join(f"flanker of {p['id']}" for p, k, _ in m)))
json.dump(out, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "missing.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=0)
print(len(out), "rows")
for src in ("amazon", "niceone"):
    rows = [o for o in out if o[0] == src]
    rows.sort(key=lambda o: -(o[3] or 0))
    print(f"\n== {src}: top by {'ratings' if src == 'amazon' else 'reviews'}")
    for o in rows[:70]: print(f"{o[1]:6} #{o[2]:<3} {o[3]:>6}  {o[4][:95]}  {o[5]}")
