"""28 Sep 2026, the removal pass: bottle-only photos for the quiz grid. Adds Fragrantica page numbers for three grid
bottles that had none (their Fragella photos show the box), rejects Fragella's EDT bottle for the Sauvage EDP entry
(the next candidate the tool would take), and records crops for the two photos whose only source shows the box or
props. Run once, then: python tools/fetch_bottles.py --drop <the seven>; python tools/fetch_bottles.py --only jovanmusk,reef33"""
import json, os
ROOT = r"C:/Users/malha/Desktop/Webapps/perfume-profiler"
P = lambda n: os.path.join(ROOT, "reference", "images", n)
dump = lambda f, d: open(f, "w", encoding="utf-8", newline="\n").write(json.dumps({k: d[k] for k in sorted(d)}, ensure_ascii=False, indent=1) + "\n")
fids = json.load(open(P("fragrantica_ids.json"), encoding="utf-8"))
new = {
    "sauvageedp": {"url": "https://www.fragrantica.com/perfume/Dior/Sauvage-Eau-de-Parfum-48100.html", "fid": 48100, "note": "2018"},
    "cdnim": {"url": "https://www.fragrantica.com/perfume/Armaf/Club-de-Nuit-Intense-Man-34696.html", "fid": 34696, "note": "2015"},
    "eclaire": {"url": "https://www.fragrantica.com/perfume/Lattafa-Perfumes/Eclaire-93628.html", "fid": 93628, "note": "2024"},
}
for k, v in new.items():
    assert k not in fids, k
    fids[k] = v
dump(P("fragrantica_ids.json"), fids)
rej = json.load(open(P("rejected.json"), encoding="utf-8"))
edt = "https://cdn.fragella.com/images/dior-sauvage-eau-de-toilette.webp"
assert edt not in rej.get("sauvageedp", [])
rej.setdefault("sauvageedp", []).append(edt)
dump(P("rejected.json"), rej)
crops = {
    "jovanmusk": {"source": "https://fimgs.net/mdimg/perfume/375x500.7523.jpg", "box": [0, 0, 0.354, 1],
                  "why": "the page photo shows the red box to the right of the bottle; the box starts at x=134 of 375"},
    "reef33": {"source": "https://fimgs.net/mdimg/perfume/375x500.89358.jpg", "box": [0.368, 0, 0.667, 0.744],
               "why": "the page photo lays saffron, agarwood and rosemary around the bottle; the wood touches its base at y=373 of 500"},
}
assert not os.path.exists(P("crops.json"))
dump(P("crops.json"), crops)
print("ok", len(fids))
