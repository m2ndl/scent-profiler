"""Ranks the perfumes the store rows name (resolved.json) that the catalogue lacks, adds the best-known perfumes of the
Saudi houses, reads each one's Fragrantica page in rank order, and keeps those with a full pyramid. Writes
candidates.json (every candidate with its store evidence and page) and chosen.json (the ones to add).

Score: each store a perfume is listed in adds 0.5 plus up to 0.5 for its place in that list (Noon: by its rating count
and a "#N in category" badge; Faces: its bestsellers page, or 0.1 for its Bestseller badge; its review counts are
syndicated from other stores and are not used).
A perfume in three stores outranks one high in a single store. The Saudi houses (the owner's request, 26 Sep 2026)
add their most-reviewed Fragrantica perfumes, scored like one store listing by their Fragrantica review count (0.5 plus
up to 0.5 at 200 reviews), kept only with a full top, heart and base breakdown. Pages are read in score order until the
catalogue would reach the target.
Run from the repo root: python reference/expansion/choose.py [target]
"""
import json, math, os, re, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import fragrantica as F

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
TARGET = int(sys.argv[1]) if len(sys.argv) > 1 else 1000

SAUDI = ["Arabian-Oud", "Abdul-Samad-Al-Qurashi", "Ibraheem-AlQurashi", "Al-Majed-Oud", "Aldakheel-Oud", "Deraah-Private",
         "Reef-Perfumes", "DKHOUN", "Anfasic", "Laverne", "Surrati-Perfumes", "Alezz-Oud", "Almas", "Nasamat"]
PER_SAUDI_HOUSE = 12

def place(r):
    n = {"goldenscent": 1079, "amazon": 100, "niceone": 360, "sephora": 34, "faces": 96}.get(r["source"])
    if r["source"] == "noon":
        s = min(0.5, math.log10((r["count"] or 0) + 1) / 8)
        b = (r.get("signal") or {}).get("best_in_category")
        return s + (0.5 * (1 - (b - 1) / 50) if b else 0)
    if r["source"] == "faces" and r["list"] == "badge": return 0.1
    if r["source"] == "faces" and r["list"] != "best": return None
    return max(0.0, 0.5 * (1 - (r["rank"] - 1) / n))

# the catalogue without this expansion's own block, if an earlier run already put it in data.js
_HEAD = "added 26 Sep 2026 (the expansion to 1,000)"
_src = open(os.path.join(ROOT, "site", "js", "data.js"), encoding="utf-8").read()
_block = len(re.findall(r'^    p\("', _src[_src.index(_HEAD):], re.M)) if _HEAD in _src else 0
N_CATALOGUE = int(subprocess.run(["node", "-e", "const {loadSite}=require('./tools/lib/site.js');"
    "process.stdout.write(String(loadSite('data').PP_DATA.PERFUMES.length))"], cwd=ROOT, capture_output=True, check=True).stdout) - _block

def main():
    res = json.load(open(os.path.join(HERE, "resolved.json"), encoding="utf-8"))
    have = set(res["catalogue"].values())
    cands = {}
    for r in res["rows"]:
        if r["fid"] in have: continue
        p = place(r)
        if p is None: continue
        c = cands.setdefault(r["fid"], {"fid": r["fid"], "url": r["url"], "ftitle": r["ftitle"], "designer": r["designer"],
                                        "stores": {}, "rows": []})
        c["stores"][r["source"]] = max(c["stores"].get(r["source"], 0), 0.5 + p)
        c["rows"].append({k: r[k] for k in ("source", "list", "rank", "text", "count")})
    for c in cands.values(): c["score"] = round(sum(c["stores"].values()), 3); c["origin"] = "stores"
    for page in SAUDI:
        cards = F.designer(page) or []
        for card in sorted(cards, key=lambda x: -x["reviews"])[:PER_SAUDI_HOUSE]:
            if card["id"] in have or card["id"] in cands or card["reviews"] < 5: continue
            cands[card["id"]] = {"fid": card["id"], "url": card["url"], "ftitle": card["title"], "designer": page,
                                 "stores": {}, "rows": [], "score": round(0.5 + min(0.5, card["reviews"] / 400), 3),
                                 "origin": "saudi house"}
    order = sorted(cands.values(), key=lambda c: -c["score"])
    need = TARGET - N_CATALOGUE
    chosen, n_read = [], 0
    for c in order:
        if len(chosen) >= need: break
        try: pg = F.perfume(c["url"])
        except F.Refused as e:
            print("refused:", e); break
        n_read += 1
        if not pg: c["page"] = None; continue
        c["page"] = pg
        full = all(pg[s] for s in ("top", "middle", "base"))
        c["full"] = full
        if full: chosen.append(c)
        if n_read % 50 == 0: print(f"  read {n_read}, kept {len(chosen)}", flush=True)
    json.dump(order, open(os.path.join(HERE, "candidates.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=0)
    json.dump(chosen, open(os.path.join(HERE, "chosen.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=0)
    print(len(order), "candidates;", n_read, "pages read;", len(chosen), "with a full pyramid (",
          sum(1 for c in chosen if c["origin"] == "saudi house"), "from the Saudi houses)")

if __name__ == "__main__":
    main()
