"""Every store row, in one shape, with its house resolved to a Fragrantica designer page. Writes rows.json.

A row is {source, list, rank, text, brand, count, signal, designer}. Sources: Golden Scent best sellers, Amazon.sa best
sellers, Nice One popularity pages, Noon popularity lists, Sephora best sellers, Faces (its bestsellers page, and its
whole perfume section for the syndicated review counts). Rows that are not a wearable perfume (sets, minis, mists,
body care, home scents, bakhoor) and store-brand copies ("inspired by") are dropped here.
Run from the repo root: python reference/expansion/rows.py
"""
import json, os, re, unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
POP = os.path.join(os.path.dirname(HERE), "quiz", "popularity")

def fold(s):
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode().lower()
    s = s.replace("&", " and ").replace("'", "").replace("’", "").replace("°", " ")
    return re.sub(r"[^a-z0-9]+", " ", s).strip()

NOT_PERFUME = re.compile(r"after ?shave|deodorant|\bdeo\b|body (mist|spray|lotion|wash|splash|cream|oil|musk)|hair (mist|perfume)|"
                         r"shower|lotion|balm|roll ?on|\bset\b|gift|bundle|sample|travel|discovery|miniature|\bmini\b|cream|soap|"
                         r"incense|bakhoo?r|bukhoor|dukhoon|burner|wood chips|freshener|diffuser|home fragrance|room|candle|"
                         r"\bkit\b|pcs|pieces|\bpack\b|\bx ?\d+ ?ml|\*\d|refill(?!able)|tester|coffret|duo|trio|mist\b|powder\b|"
                         r"\d+ ?(grams|gm|g)\b|tola", re.I)

# Store spellings of houses that are not a Fragrantica designer name, folded -> Fragrantica page.
ALIAS = {"ysl": "Yves-Saint-Laurent", "saint laurent": "Yves-Saint-Laurent", "emporio armani": "Giorgio-Armani",
         "armani beauty": "Giorgio-Armani", "armani": "Giorgio-Armani", "armani prive": "Giorgio-Armani",
         "paco rabanne": "Paco-Rabanne", "rabanne": "Paco-Rabanne", "mont blanc": "Montblanc", "thierry mugler": "Mugler",
         "christian dior": "Dior", "ck": "Calvin-Klein", "boss": "Hugo-Boss", "hugo": "Hugo-Boss",
         "maison francis kurkdjian paris": "Maison-Francis-Kurkdjian", "mfk": "Maison-Francis-Kurkdjian", "kilian": "By-Kilian",
         "kilian paris": "By-Kilian", "bdk": "BDK-Parfums", "dolce gabbana": "Dolce-Gabbana", "dolce and gabbana": "Dolce-Gabbana",
         "d and g": "Dolce-Gabbana", "almajed oud": "Al-Majed-Oud", "al majed oud": "Al-Majed-Oud", "lattafa": "Lattafa-Perfumes",
         "al haramain": "Al-Haramain-Perfumes", "ibraheem al qurashi": "Ibraheem-AlQurashi", "ibraheem alqurashi": "Ibraheem-AlQurashi",
         "asaq": "Abdul-Samad-Al-Qurashi", "reef": "Reef-Perfumes", "jpg": "Jean-Paul-Gaultier", "gaultier": "Jean-Paul-Gaultier",
         "lancome": "Lancome", "hermes": "Hermes", "chloe": "Chloe", "viktor rolf": "Viktor-Rolf", "viktor and rolf": "Viktor-Rolf",
         "narciso": "Narciso-Rodriguez", "vcanda": "Van-Cleef-Arpels", "van cleef": "Van-Cleef-Arpels", "roja": "Roja-Dove",
         "roja parfums": "Roja-Dove", "roja dove": "Roja-Dove", "guerlain paris": "Guerlain", "giorgio armani prive": "Giorgio-Armani",
         "dunhill": "Alfred-Dunhill", "maison margiela": "Maison-Martin-Margiela", "margiela": "Maison-Martin-Margiela",
         "aigner": "Etienne-Aigner", "initio": "Initio-Parfums-Prives", "rosendo mateu": "Rosendo-Mateu-Olfactive-Expressions",
         "aldakheeloud": "Aldakheel-Oud", "aldakheel oud": "Aldakheel-Oud", "al ezz oud": "Alezz-Oud", "alezz oud": "Alezz-Oud",
         "hersh": "Alezz-Oud", "almas perfumes": "Almas", "deraah": "Deraah-Private", "al rehab": "ALREHAB-PERFUMES",
         "nautica": "Nautica", "rasasi": "Rasasi", "jaguar": "Jaguar", "maison criveilli": "Maison-Crivelli",
         "dkny": "Donna-Karan", "mcm": "MCM-Mode-Creation-Munich", "al dakheel": "Aldakheel-Oud"}

designers = json.load(open(os.path.join(HERE, "fragrantica_designers.json"), encoding="utf-8"))
KEYS = {}
for href, name in designers.items():
    page = href.split("/designers/")[1][:-5]
    f = fold(name)
    for k in {f, re.sub(r"\b(perfumes?|parfums?|fragrances?|paris|london|profumi|cosmetics|beauty)\b", "", f).strip()}:
        if k and (k not in KEYS or len(page) < len(KEYS[k])): KEYS[k] = page
for k, v in ALIAS.items(): KEYS[fold(k)] = v
MAXW = 6

# Single words that name some small Fragrantica designer but in a title are only a word ("Al Rehab", "Oud ...").
GENERIC = set("al el la le les the my eau oud musk black white gold golden pure royal paris london for by new ard dar bait "
              "dream blue red rose amber noir night love miss mister one number no n".split())

def designer_of(text, brand=None):
    """The Fragrantica designer page of a row: the store's brand field if it names one, else the longest run of
    leading words of the title that does, else a house named after "by" or anywhere in the title (two words or more)."""
    for t in ([brand] if brand else []) + [text]:
        w = fold(t).split()
        for n in range(min(MAXW, len(w)), 0, -1):
            k = " ".join(w[:n])
            if k in KEYS and not (n == 1 and (k in GENERIC or len(k) < 3)): return KEYS[k], n
    w = fold(text).split()
    if "by" in w:
        i = w.index("by")
        for n in range(min(MAXW, len(w) - i - 1), 0, -1):
            k = " ".join(w[i + 1:i + 1 + n])
            if k in KEYS and not (n == 1 and (k in GENERIC or len(k) < 3)): return KEYS[k], 0
    for n in range(MAXW, 1, -1):
        for i in range(len(w) - n + 1):
            k = " ".join(w[i:i + n])
            if k in KEYS: return KEYS[k], 0
    return None, 0

rows = []
def add(source, lst, rank, text, brand=None, count=None, signal=None):
    if NOT_PERFUME.search(text) or re.search(r"inspired by|\bdupe\b|alternative to", text, re.I): return
    d, n = designer_of(text, brand)
    rows.append({"source": source, "list": lst, "rank": rank, "text": re.sub(r"\s+", " ", text).strip(), "brand": brand,
                 "count": count, "signal": signal, "designer": d})

gs = json.load(open(os.path.join(POP, "goldenscent.json"), encoding="utf-8"))["rows"]
for r in gs:
    if r["type"] == "Perfume": add("goldenscent", "best", r["rank"], f'{r["name"]} {r["description"] or ""}', r["brand"])
for lst, rank, ratings, title in json.load(open(os.path.join(POP, "amazon_sa.json"), encoding="utf-8"))["rows"]:
    add("amazon", lst, rank, title, None, ratings)
seen = set()
for r in json.load(open(os.path.join(POP, "niceone.json"), encoding="utf-8"))["rows"]:
    key = (r["list"], r["rank"], r["slug"])
    if key in seen: continue
    seen.add(key)
    add("niceone", r["list"], r["rank"], re.sub(r"-n\d+$", "", r["slug"]).replace("-", " "), None, r["reviews"])
for line in open(os.path.join(HERE, "noon.txt"), encoding="utf-8"):
    if line.startswith("#") or not line.strip(): continue
    p = line.rstrip("\n").split("|")
    cat, rank, count, best, sold = p[0], int(p[1]), p[-3], p[-2], p[-1]
    add("noon", cat, rank, "|".join(p[2:-3]), None, int(count or 0),
        {"best_in_category": int(best) if best else None, "sold_recently": int(sold) if sold else None})
for line in open(os.path.join(HERE, "sephora.txt"), encoding="utf-8"):
    if line.startswith("#") or not line.strip(): continue
    p = line.rstrip("\n").split("|")
    add("sephora", "best", int(p[0]), "|".join(p[2:-1]), p[1], int(p[-1]) if p[-1] else None)
faces = json.load(open(os.path.join(HERE, "faces.json"), encoding="utf-8"))
first = {}
for r in faces["bestsellers_page"]: first.setdefault(r["pid"], len(first) + 1)
done = set()
for r in faces["rows"] + faces["bestsellers_page"]:
    if r["pid"] in done: continue
    done.add(r["pid"])
    add("faces", "best" if r["pid"] in first else "badge" if r.get("bestseller") else "all", first.get(r["pid"]),
        f'{r["name"]} {r["category"] or ""}', r["brand"], r["reviews"] or None)

json.dump(rows, open(os.path.join(HERE, "rows.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=0)
import collections
by = collections.Counter(r["source"] for r in rows)
res = collections.Counter(r["source"] for r in rows if r["designer"])
print({s: f"{res[s]}/{by[s]}" for s in by})
miss = collections.Counter((r["brand"] or " ".join(r["text"].split()[:2])) for r in rows if not r["designer"])
print("no designer:", miss.most_common(60))
