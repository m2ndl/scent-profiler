"""Matches Nice One's popularity lists (niceone.json) to catalogue perfumes and writes popularity.json:
id -> best rank in any list, the list it came from, the highest review count among its matching products, and
the product texts matched, plus how many store-brand copies
("inspired by") of it the store sells, a separate sign that the original is well known. A product matches a perfume when the house appears and every word of the perfume's
name appears; a product carrying a flanker word the perfume's name lacks (Intense, Elixir, Parfum, Absolu...) does
not match, so Stronger With You and Stronger With You Intensely stay apart. Run from the repo root:
python reference/quiz/popularity/match_niceone.py
"""
import json, os, re, subprocess, unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))

def fold(s):
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode().lower()
    s = s.replace("&", " and ").replace("'", "").replace("’", "")
    return re.sub(r"[^a-z0-9]+", " ", s).strip()

HOUSE = {"Yves Saint Laurent": ["yves saint laurent", "ysl"], "Giorgio Armani": ["giorgio armani", "emporio armani", "armani"],
         "Maison Francis Kurkdjian": ["maison francis kurkdjian", "francis kurkdjian"], "Dolce&Gabbana": ["dolce and gabbana", "dolce gabbana"],
         "Rabanne": ["rabanne", "paco rabanne"], "Montblanc": ["mont blanc", "montblanc"], "Hermès": ["hermes"],
         "Viktor&Rolf": ["viktor and rolf", "viktor rolf"], "Montale": ["montale"], "Roja Parfums": ["roja"], "Carolina Herrera": ["carolina herrera"],
         "Jean Paul Gaultier": ["jean paul gaultier"], "Hugo Boss": ["hugo boss", "boss"], "Parfums de Marly": ["parfums de marly"]}
FLANKERS = set("intense intensely elixir absolu absolute extreme extrait parfum le noir night nuit sport fresh fraiche cologne summer tonic aqua blush gold rouge edition privee prive reserve leau water bombe royal".split())
GENERIC = set("eau de toilette edt edp for men women him her pour homme femme spray ml the".split())

cat = json.loads(subprocess.run(["node", "-e", "const {loadSite}=require('./tools/lib/site.js');const W=loadSite('data');"
    "process.stdout.write(JSON.stringify(W.PP_DATA.PERFUMES.map(p=>({id:p.id,name:p.name,house:p.house,gender:p.gender}))))"],
    cwd=ROOT, capture_output=True, check=True).stdout.decode("utf-8"))
rows = json.load(open(os.path.join(HERE, "niceone.json"), encoding="utf-8"))["rows"]
prods = [(r, fold(r["text"])) for r in rows]

pop = {}
STRIP = GENERIC | set("ml parfum perfum perfume de eau toilette cologne".split())
def conc(t):
    if re.search(r"\bextrait\b", t): return "extrait"
    if re.search(r"\beau de (parfum|perfum|perfume)\b|\bedp\b", t): return "edp"
    if re.search(r"\beau de toilette\b|\bedt\b", t): return "edt"
    if re.search(r"\bparfum\b", t): return "parfum"
    return ""
def gender_of(t):
    if re.search(r"\bfor (women|her)\b", t): return "f"
    if re.search(r"\bfor (men|him)\b", t): return "m"
    return ""
for p in cat:
    houses = HOUSE.get(p["house"], [fold(p["house"])])
    name = fold(re.sub(r"\([^)]*\)", "", p["name"]))
    words = [w for w in name.split() if w not in GENERIC]
    if not words: continue
    for r, t in prods:
        dupe = "inspired by" in t
        if dupe: t = t.split("inspired by", 1)[1]              # a copy: judge the original it names
        house = next((h for h in houses if h in t), None)
        if not house: continue
        g = gender_of(t)
        if g and p["gender"] in ("m", "f") and g != p["gender"]: continue
        pc, cc = conc(t), conc(fold(p["name"]))
        if pc and cc and pc != cc: continue                     # Eau de Toilette and Eau de Parfum stay apart
        tw = [w for w in t.replace(house, " ").split() if not re.fullmatch(r"[\d.,%-]+|\d+ml", w)]
        if not all(w in tw for w in words): continue
        rest = [w for w in tw if w not in words and w not in STRIP and w not in house.split()]
        if rest and not dupe: continue                          # a flanker, a set or another product
        e = pop.setdefault(p["id"], {"gender": p["gender"], "best_rank": None, "list": "", "max_reviews": 0, "copies_sold": 0, "matched": []})
        if dupe:
            e["copies_sold"] += 1
        else:
            if e["best_rank"] is None or r["rank"] < e["best_rank"]: e["best_rank"], e["list"] = r["rank"], r["list"]
            e["max_reviews"] = max(e["max_reviews"], r["reviews"])
        e["matched"].append(("copy " if dupe else "") + f'{r["list"]} #{r["rank"]} ({r["reviews"]}): {r["text"][:80]}')
json.dump({"source": "niceone.json matched to the catalogue by match_niceone.py", "perfumes": dict(sorted(pop.items()))},
          open(os.path.join(HERE, "popularity.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(len(pop), "catalogue perfumes found in Nice One's top lists")
