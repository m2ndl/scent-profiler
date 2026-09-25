"""Matches both Saudi popularity sources to catalogue perfumes and writes sa_popularity.json, keyed by catalogue id,
with the evidence rows per id. tools/select_grid.js reads it and turns the rows into a score.

Sources (read-only, collected 25 September 2026):
  amazon_sa.json  Amazon.sa Best Sellers (ranked by Saudi purchases): men, women and all fragrances, ranks 1-30 and 51-80.
  niceone.json    Nice One, men / women / unisex category pages in the store's "Most Popular" order, pages 1-12.

A row matches a perfume when
  1. the house appears (any spelling in HOUSE), and is then removed from the row;
  2. every word of the perfume's name appears, not counting generic words or the house (so "Chanel Bleu De ... Eau de
     Parfum" matches Bleu de Chanel Eau de Parfum); a perfume may carry extra spellings in ALIAS;
  3. gender and concentration agree when both sides state them (CONC gives the concentration of catalogue entries
     whose name lacks one, read from the entry's note pyramid);
  4. no word is left over: a leftover word marks a flanker, a set or another product (Hawas Ice, Khamrah Qahwa,
     Stronger With You Intensely, Yara Moi). Size, price and listing words (STRIP) are not leftovers.
A Nice One row reading "... inspired by X" is a store-brand copy of X: kept apart as a copy, never as a sale of X.
Rows that pass 1 to 3 but fail 4 are kept per perfume as "flankers" (unscored), so a reader can see that a line sells
even when its original bottle is not in the lists.

This supersedes match_niceone.py, which missed rows whose store brand label repeats inside the title (YSL, Paco Rabanne),
names with numbers (Baccarat Rouge 540, 1 Million), names made only of generic or house words (Bleu de Chanel, For Her).
Run from the repo root: python reference/quiz/popularity/match_popularity.py
"""
import json, os, re, subprocess, unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))

def fold(s):
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode().lower()
    s = s.replace("&", " and ").replace("'", "").replace("’", "")
    s = re.sub(r"[^a-z0-9]+", " ", s).strip()
    s = re.sub(r"\beau de perfume?\b", "eau de parfum", s)          # Nice One's "Eau De Perfum"
    return s

HOUSE = {"Yves Saint Laurent": ["yves saint laurent", "yves saint", "ysl"],
         "Giorgio Armani": ["giorgio armani", "emporio armani", "armani"],
         "Maison Francis Kurkdjian": ["maison francis kurkdjian", "francis kurkdjian", "mfk"],
         "Dolce&Gabbana": ["dolce and gabbana", "dolce gabbana"], "Rabanne": ["paco rabanne", "rabanne"],
         "Montblanc": ["mont blanc", "montblanc"], "Hermès": ["hermes"], "Lancôme": ["lancome"], "Chloé": ["chloe"],
         "Viktor&Rolf": ["viktor and rolf", "viktor rolf"], "Roja Parfums": ["roja parfums", "roja"],
         "Jean Paul Gaultier": ["jean paul gaultier"], "Hugo Boss": ["hugo boss", "boss"],
         "French Avenue": ["french avenue", "fragrance world"], "Parfums de Marly": ["parfums de marly"]}
# Extra spellings of a perfume's name, as the stores write them.
ALIAS = {"khamrah": ["khamra"], "khamrahqahwa": ["khamra qahwa"], "qaedalfursan": ["qaid al fursan"],
         "ameeraloudh": ["ameer al oud intense oud"], "9pm": ["9 pm"], "cdnim": ["club de nuit intense"],
         # store slugs drop accents and split apostrophes ("idal", "l interdit"); Amazon writes "Club De Nuit ... for Women"
         "hugoman": ["man"], "lhommeidealedp": ["l homme idal"], "interditrouge": ["l interdit rouge"], "cdnwoman": ["club de nuit"]}
# Concentration of entries whose catalogue name states none, read from the entry's note pyramid (data.js).
CONC = {"eros": "edt", "invictus": "edt", "onemillion": "edt", "adgedt": "edt", "libre": "edp", "goodgirl": "edp",
        "swy": "edt", "swyintensely": "edp", "hawas": "edp", "khamrah": "edp", "yara": "edp", "cdnim": "edt",
        "diorhomme2020": "edt", "paradigme": "edp", "lavieestbelle": "edp", "blackopium": "edp", "aventus": "edp",
        "bossbottled": "edt", "legend": "edt", "coolwater": "edt", "idole": "edp", "guccibloom": "edp",
        "scandal": "edp", "explorer": "edp", "santalroyal": "edp", "9pm": "edp", "oudwood": "edp", "br540": "edp",
        "chanceeautendre": "edt", "elieleparfum": "edp", "amaali": "oil", "chocomusk": "oil", "musksilk": "oil"}
CONC_WORDS = set("eau de toilette parfum edt edp".split())
FLANKERS = set("intense intensely elixir absolu absolute extreme extrait parfum le noir night nuit sport fresh fraiche "
               "cologne summer tonic aqua blush gold rouge edition privee prive reserve leau water bombe royal".split())
GENERIC = set("eau de toilette edt edp for men women him her pour homme femme spray ml the".split())
# Size, price and listing words that say nothing about which product it is.
STRIP = GENERIC | set("ml gm fl oz perfume perfumes fragrance scent natural long lasting longlasting unisex by and "
                      "packaging may vary mens cologne spray".split())

def conc(t):
    if re.search(r"\b(perfume|fragrance|concentrated) oil\b|\battar\b", t): return "oil"
    if re.search(r"\bextrait\b", t): return "extrait"
    if re.search(r"\beau de parfum\b|\bedp\b", t): return "edp"
    if re.search(r"\beau de toilette\b|\bedt\b", t): return "edt"
    if re.search(r"\bparfum\b", t): return "parfum"
    return ""

def gender_of(t):
    m = bool(re.search(r"\b(men|him|homme|mens)\b", t)); f = bool(re.search(r"\b(women|her|femme|woman)\b", t))
    return "m" if m and not f else "f" if f and not m else ""

def drop_phrase(words, phrase):
    p = phrase.split(); out, i = [], 0
    while i < len(words):
        if words[i:i + len(p)] == p: i += len(p)
        else: out.append(words[i]); i += 1
    return out

cat = json.loads(subprocess.run(["node", "-e", "const {loadSite}=require('./tools/lib/site.js');const W=loadSite('data');"
    "process.stdout.write(JSON.stringify(W.PP_DATA.PERFUMES.map(p=>({id:p.id,name:p.name,house:p.house,gender:p.gender}))))"],
    cwd=ROOT, capture_output=True, check=True).stdout.decode("utf-8"))

def forms(p):
    """Each accepted spelling of the name as its distinctive words (generic and house words removed; a name made only
    of such words, like Burberry Her or Dior Homme, keeps them, less the concentration)."""
    houses = sorted(HOUSE.get(p["house"], [fold(p["house"])]), key=len, reverse=True)
    out = []
    for n in [re.sub(r"\([^)]*\)", "", p["name"])] + ALIAS.get(p["id"], []):
        w = fold(n).split()
        for h in houses: w = drop_phrase(w, h)
        out.append([x for x in w if x not in GENERIC] or [x for x in w if x not in CONC_WORDS])
    return houses, out

CAT = [(p, *forms(p)) for p in cat]

def match(text):
    """(perfume, kind, leftover) for one row text: kind is sale, copy or flanker."""
    t = fold(text); dupe = " inspired by " in f" {t} "
    if dupe: t = t.split("inspired by", 1)[1].strip()
    res = []
    for p, houses, names in CAT:
        if not any(re.search(rf"\b{h}\b", t) for h in houses): continue
        g = gender_of(t)
        if g and p["gender"] in ("m", "f") and g != p["gender"]: continue
        ng = gender_of(fold(p["name"]))                          # Aventus for Her, Shuhrah Pour Homme: the row must say so
        if ng and g != ng: continue
        pc, cc = conc(t), CONC.get(p["id"], "") or conc(fold(p["name"]))
        if pc and cc and pc != cc: continue
        if (pc == "oil") != (cc == "oil"): continue
        w = t.split()
        for h in houses: w = drop_phrase(w, h)
        bare = w
        for c in ("extrait de parfum", "eau de parfum", "eau de toilette", "eau de cologne", "perfume oil", "fragrance oil", "concentrated perfume oil", "oil"): bare = drop_phrase(bare, c)
        best = None
        for words in names:
            if not all(x in w for x in words): continue
            rest = [x for x in bare if x not in words and x not in STRIP and not re.fullmatch(r"\d+(ml|g|gm)?(edp|edt)?|\d+[.,]\d+", x)]
            if best is None or len(rest) < len(best): best = rest
        if best is None or (dupe and best): continue             # a copy of a flanker is not a copy of this perfume
        res.append((p, "copy" if dupe else "flanker" if best else "sale", best))
    return res

# Amazon rows read one by one and accepted although a word is left over: the word is the seller's, not the product's.
READ = {("men", 1): ("9pm", "Afnan 9pm; 'Edition' is the seller's wording, Afnan sells no flanker by that name"),
        ("all", 4): ("9pm", "the same listing as men #1"),
        ("men", 17): ("cdnim", "the Eau de Toilette, sold in a black bottle; 'Black' is the listing's colour field"),
        ("men", 28): ("mostwantedparfum", "listing descriptors: fougere, oriental, spicy, black"),
        ("all", 58): ("mostwantedparfum", "the same listing as men #28"),
        ("women", 80): ("khamrah", "a second Khamrah Eau de Parfum 100 ml listing; 'Adults' is listing noise"),
        ("women", 70): ("guessseductive", "the Eau de Toilette: the listing's own specifications say so; 'girls' is the seller's wording")}

amazon = json.load(open(os.path.join(HERE, "amazon_sa.json"), encoding="utf-8"))["rows"]
niceone = json.load(open(os.path.join(HERE, "niceone.json"), encoding="utf-8"))["rows"]

pop, used = {}, set()
def entry(p):
    return pop.setdefault(p["id"], {"name": f'{p["house"]} {p["name"]}', "gender": p["gender"], "amazon": [], "niceone": [], "copies": [], "flankers": []})

for lst, rank, ratings, title in amazon:
    for p, kind, rest in match(title):
        row = {"list": lst, "rank": rank, "ratings": ratings, "title": title}
        read = READ.get((lst, rank))
        if kind == "flanker" and read and read[0] == p["id"]: kind, row = "sale", dict(row, read=read[1]); used.add((lst, rank))
        if kind == "sale": entry(p)["amazon"].append(row)
        elif kind == "flanker": entry(p)["flankers"].append(dict(row, source="amazon", extra=" ".join(rest)))
seen = set()
for r in niceone:
    key = (r["list"], r["rank"], r["slug"])
    if key in seen: continue                                   # the unisex pages were read twice
    seen.add(key)
    text = re.sub(r"-n\d+$", "", r["slug"]).replace("-", " ")    # the slug: the title without the store's brand label
    for p, kind, rest in match(text):
        row = {"list": r["list"], "rank": r["rank"], "reviews": r["reviews"], "title": text}
        if kind == "sale": entry(p)["niceone"].append(row)
        elif kind == "copy": entry(p)["copies"].append(row)
        else: entry(p)["flankers"].append(dict(row, source="niceone", extra=" ".join(rest)))

assert used == set(READ), f"rows read by hand no longer found: {set(READ) - used}"
for e in pop.values():
    for k in ("amazon", "niceone", "copies", "flankers"): e[k].sort(key=lambda r: r["rank"])
json.dump({"source": "amazon_sa.json and niceone.json matched to the catalogue by match_popularity.py",
           "perfumes": dict(sorted(pop.items()))},
          open(os.path.join(HERE, "sa_popularity.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
sold = [i for i, e in pop.items() if e["amazon"] or e["niceone"]]
print(len(sold), "catalogue perfumes sold in the lists;", sum(1 for e in pop.values() if e["amazon"]), "on Amazon.sa,",
      sum(1 for e in pop.values() if e["niceone"]), "on Nice One")
