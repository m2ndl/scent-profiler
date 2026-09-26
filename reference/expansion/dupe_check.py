"""Second guard against adding a perfume the catalogue has: each chosen perfume's Fragrantica title goes through
match_popularity.py's matcher (the one the store lists were matched with); a "sale" match means the catalogue already
holds it under another page. Also flags two chosen perfumes with the same house and name. Prints what it finds and
writes dupes.json (fid -> catalogue id) for gen.js to skip.
python reference/expansion/dupe_check.py"""
import json, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
SRC = os.path.join(ROOT, "reference", "quiz", "popularity", "match_popularity.py")
g = {"__file__": SRC, "__name__": "defs"}
cwd = os.getcwd(); os.chdir(ROOT)
exec(compile(open(SRC, encoding="utf-8").read().split("\namazon = json.load")[0], SRC, "exec"), g)
os.chdir(cwd)
# compare with the catalogue without this expansion's own block, if an earlier run already put it in data.js
HEAD = "added 26 Sep 2026 (the expansion to 1,000)"
src = open(os.path.join(ROOT, "site", "js", "data.js"), encoding="utf-8").read()
block = set(re.findall(r'^    p\("([^"]+)"', src[src.index(HEAD):], re.M)) if HEAD in src else set()
g["CAT"] = [x for x in g["CAT"] if x[0]["id"] not in block]
match, fold = g["match"], g["fold"]
chosen = json.load(open(os.path.join(HERE, "chosen.json"), encoding="utf-8"))
dupes, seen = {}, {}
for c in chosen:
    t = c["page"]["title"] if c.get("page") else c["ftitle"]
    t = re.sub(r"\s+(cologne|perfume)\s+-\s+a (new )?fragrance for.*$", "", t)     # "9pm Afnan cologne - a fragrance for men 2020"
    sex = {"m": " for men", "f": " for women"}.get((c.get("page") or {}).get("gender"), "")
    hits = [p["id"] for p, kind, _ in match(t + sex) if kind == "sale"]
    if hits:
        dupes[c["fid"]] = hits[0]; print(f"in the catalogue: {c['ftitle']} -> {hits}")
    k = fold(c["ftitle"])
    if k in seen: print(f"chosen twice: {c['ftitle']} ({seen[k]}, {c['fid']})"); dupes[c["fid"]] = f"fid {seen[k]}"
    seen.setdefault(k, c["fid"])
json.dump(dupes, open(os.path.join(HERE, "dupes.json"), "w", encoding="utf-8"), indent=1)
print(len(dupes), "of", len(chosen), "held back")
