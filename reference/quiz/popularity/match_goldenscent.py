"""Golden Scent's best sellers (goldenscent.json) against the catalogue: writes goldenscent_candidates.csv, one line per
perfume on the list that the catalogue lacks, in the store's order, and prints how many catalogue perfumes it contains.

It uses match_popularity.py's matcher unchanged (its definitions only, so sa_popularity.json is not rewritten), after
the store's spellings of houses and names are read as the catalogue writes them (FIX) and the concentration is taken
from the name when the name states one: the store's description field says "Eau de Parfum" for Dior Sauvage Parfum and
"Elixir de Parfum" for Le Male Elixir. A row is a perfume when the store's product type is Perfume, which leaves out
sets, bundles, mists, bakhoor and cosmetics. Rows that differ only in bottle size ("- 100 ml"), a travel-spray pack or
the word "Refillable" are one perfume. A candidate whose name holds a whole catalogue name is marked as its flanker;
most are separate perfumes (Si Passione, Y Intense), but a few may be the same juice under a new label (NOTE).
Run from the repo root: python reference/quiz/popularity/match_goldenscent.py
"""
import collections, csv, json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "match_popularity.py")
defs = {"__file__": SRC, "__name__": "defs"}
exec(compile(open(SRC, encoding="utf-8").read().split("\namazon = json.load")[0], SRC, "exec"), defs)
match, fold, conc, gender_of = defs["match"], defs["fold"], defs["conc"], defs["gender_of"]

# The store's spellings of catalogue names: a city after the house, the designer's first name, the house repeated or
# shortened, the line name left out, and "Elixir Parfum" for the perfume the catalogue calls Elixir.
FIX = [(r"\bMaison Francis Kurkdjian Paris\b", "Maison Francis Kurkdjian"), (r"\bThierry Mugler( Mugler)?\b", "Mugler"),
       (r"\bParfums de Marly Marly\b", "Parfums de Marly"), (r"\bCalvin Klein Ck\b", "Calvin Klein"),
       (r"\bMaison Margiela (?!Replica)", "Maison Margiela Replica "), (r"^Kilian\b", "By Kilian"),
       (r"(?i)^BDK\b(?! Parfums)", "BDK Parfums"), (r"\bElixir (de )?Parfum\b", "Elixir"), (r"\bGabanna\b", "Gabbana"),
       (r"\bL' Interdit\b", "L'Interdit"), (r"\bN°\s?5\b", "No 5"), (r"\bFlower Bomb\b", "Flowerbomb"),
       (r"\bHipnotic\b", "Hypnotic"), (r"^Xerjoff Naxos\b", "Xerjoff XJ 1861 Naxos")]
NAME_CONC = re.compile(r"(?i)(?<!\bde )(?<!\ble )\bparfum\b|\belixir\b")   # "Sauvage Parfum", not "Le Parfum" or "Eau de Parfum"
# Candidates that may be a catalogue perfume under a new label, left for a reader to settle.
NOTE = {"dior homme edt new version": "may be Dior Homme 2020 (diorhomme2020), sold as the 'new version'",
        "dior homme intense edp 2025 version": "Dior's 2025 relaunch of Dior Homme Intense (catalogue: diorhommeintense)",
        "hermes terre dhermes pure perfume": "the store says Eau de Parfum; may be Terre d'Hermes Parfum (terreparfum)",
        "christian dior miss dior edp new version": "may be Miss Dior (2021), the catalogue's missdior"}

rows = json.load(open(os.path.join(HERE, "goldenscent.json"), encoding="utf-8"))["rows"]
cat = {p["id"]: p for p, *_ in defs["CAT"]}

def text(r):
    n = r["name"] or ""
    if not fold(n).startswith(fold(r["brand"] or "")): n = f'{r["brand"]} {n}'
    d = r["description"] or ""
    if NAME_CONC.search(n): d = re.sub(r"(?i)\b(eau de|elixir de|elixir)?\s*(parfum|perfume?)\b", "", d)   # keep only the sex
    for a, b in FIX: n = re.sub(a, b, n)
    return f"{n} {d}"

def bare(name):
    """The name without a bottle size or a travel-spray pack."""
    name = re.sub(r"\s-\s*Travel Spray\b.*$", "", name or "", flags=re.I)
    return re.sub(r"\s-\s*\d+(\.\d+)?\s*ml\b", "", name, flags=re.I).strip()

def key(r):
    """One perfume across the store's listings: the name's words in any order (212 VIP Black, VIP 212 Black) less size,
    pack, "Refillable", house words, "EDP"/"EDT", "for" and men or women (Chloe Nomade Women, Chloe Nomade), with the
    concentration and sex kept apart."""
    n = bare(r["name"])
    c = conc(fold(n)) if NAME_CONC.search(n) else conc(fold(r["description"] or "")) or conc(fold(n))
    for a, b in FIX: n = re.sub(a, b, n)
    drop = set(fold(r["brand"] or "").split()) | {"paco", "christian", "thierry", "refillable", "edp", "edt", "for", "men", "women", "woman", "man"}
    return " ".join(sorted(w for w in fold(n).split() if w not in drop)), c, sex(r)

def sex(r):
    """m, f, u when the description names both, or "" when it names neither."""
    d = fold(r["description"] or "")
    return gender_of(d) or ("u" if re.search(r"\b(men|him|homme)\b", d) else "")

# Rows read by hand as a catalogue perfume the matcher cannot reach: (folded name) -> (id, reason).
SAME = {"jean paul gaultier le male le parfum edp intense": ("lemaleleparfum", "Le Male Le Parfum is sold as an Eau de Parfum Intense"),
        "dior hipnotic poison roller edt": ("hypnoticpoison", "Hypnotic Poison Eau de Toilette in a rollerball"),
        "dior miss dior pearl roller edp": ("missdior", "Miss Dior Eau de Parfum in Dior's roller-pearl")}

found, cands = collections.defaultdict(list), {}
for r in rows:
    if r["type"] != "Perfume": continue
    m = match(text(r))
    sale = [p["id"] for p, k, _ in m if k == "sale"] or [SAME[s][0] for s in [fold(bare(r["name"]))] if s in SAME]
    for i in sale: found[i].append(r["rank"])
    if sale: continue
    k = key(r)
    c = cands.setdefault(k, {"best_rank": r["rank"], "brand": r["brand"], "name": bare(r["name"]),
                             "concentration": k[1], "gender": k[2], "listings": 0,
                             "flanker_of": "; ".join(sorted({f'{cat[p["id"]]["house"]} {cat[p["id"]]["name"]}' for p, kk, _ in m if kk == "flanker"})),
                             "note": next((v for n, v in NOTE.items() if fold(bare(r["name"])).startswith(n)), ""), "slug": r["slug"]})
    c["listings"] += 1
# A listing whose description names no concentration or sex joins the one candidate of the same name that agrees with
# it wherever it does say something, if there is exactly one.
for k in [k for k in cands if not k[1] or not k[2]]:
    same = [o for o in cands if o != k and o[0] == k[0] and (not k[1] or o[1] == k[1]) and (not k[2] or o[2] == k[2])]
    if len(same) == 1:
        o = cands[same[0]]; o["listings"] += cands[k]["listings"]; o["best_rank"] = min(o["best_rank"], cands[k]["best_rank"]); del cands[k]

out = sorted(cands.values(), key=lambda c: c["best_rank"])
with open(os.path.join(HERE, "goldenscent_candidates.csv"), "w", encoding="utf-8-sig", newline="") as f:
    w = csv.DictWriter(f, fieldnames=list(out[0])); w.writeheader(); w.writerows(out)
perf = sum(1 for r in rows if r["type"] == "Perfume")
print(f"{perf} perfume rows; {len(found)} catalogue perfumes on the list; {len(out)} perfumes the catalogue lacks "
      f"({sum(1 for c in out if not c['flanker_of'])} with no catalogue relative)")
