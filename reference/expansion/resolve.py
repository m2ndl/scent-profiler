"""Matches each store row (rows.json) and each catalogue perfume to one Fragrantica page, through the house's designer
page. Writes resolved.json: {rows: [row + fid], catalogue: {id: fid}, unresolved: [...]}.

A row matches a Fragrantica perfume when every word of the perfume's name (less concentration words) is in the row,
and nothing is left in the row beyond sizes, concentration, sex and listing words: a leftover word marks a flanker the
designer page lacks, so the row stays unresolved rather than being given its parent. Among matches the longest name
wins; then the one whose concentration agrees with the row's, then the sex, then the most reviewed version.
Run from the repo root: python reference/expansion/resolve.py
"""
import json, os, re, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import fragrantica as F
from rows import fold, KEYS, designers as DINDEX

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))

def conc(t):
    if re.search(r"\b(perfume|fragrance|concentrated|body) oil\b|\battar\b|\bcpo\b|\bdehn\b|\bdahn\b", t): return "oil"
    if re.search(r"\bextrait\b|\belixir de parfum\b", t): return "extrait"
    # a name that says "Parfum" on its own is the Parfum, whatever the store's description adds ("Sauvage Parfum ... Eau de Parfum")
    if re.search(r"(?<!\bde )(?<!\ble )\bparfum\b", t) and re.search(r"(?<!\bde )(?<!\ble )\bparfum\b.*\beau de parf", t): return "parfum"
    if re.search(r"\beau de (parfum|perfum|perfume|parfume)\b|\bedp\b", t): return "edp"
    if re.search(r"\beau de toilette\b|\bedt\b", t): return "edt"
    if re.search(r"\beau de cologne\b|\bedc\b|\bcologne\b", t): return "edc"
    if re.search(r"\b(le |pure )?parfum\b|\bpure perfume\b", t): return "parfum"
    return ""

CONC_WORDS = set("de parfum perfum perfume parfume toilette toillette cologne edp edt edc extrait".split())
SEX_WORDS = set("for men women him her homme femme pour unisex male female mens womens ladies lady gents".split())
LISTING = set("ml spray vaporisateur natural original new version packaging may vary long lasting fragrance scent by the and "
              "with oz fl refillable limited gm g x of luxury perfumes collection niche private arabic "
              "concentrated oil unisex genuine authentic 100 50 75 90 30 125 150 200 80 60 20 15 10 12 6 3 110 105 250 40 35 45 "
              "85 120".split())
ALIAS_WORDS = {}
for k, v in KEYS.items(): ALIAS_WORDS.setdefault(v, set()).update(k.split())

# Fragrantica pages that are not a perfume to wear from a bottle (rollers of a perfume, mists, body care, sets).
NOT_A_PERFUME = re.compile(r"roller|rollerball|roll-on|hair mist|body mist|hair perfume|deodorant|shower|lotion|body oil|"
                           r"\bset\b|coffret|miniature|travel|candle|diffuser|home spray|room spray", re.I)

def words(s):
    """Folded words, with the spellings stores and Fragrantica write differently made one: "9 PM" and "9pm", "Woman"
    and "Women", "L' Interdit" and "L'Interdit", "Flower Bomb" and "Flowerbomb"."""
    t = fold(s)
    t = re.sub(r"\b(\d+) (pm|am)\b", r"\1\2", t)
    t = re.sub(r"\bwoman\b", "women", t); t = re.sub(r"\bman\b", "men", t)
    t = re.sub(r"\b([ld]) ([aeiouh]\w*)", r"\1\2", t)
    t = t.replace("flower bomb", "flowerbomb").replace("spice bomb", "spicebomb")
    t = re.sub(r"\bfrom (classic|prestige|wood|lady|garden flower) collection\b", "", t)   # Al Majed Oud's listing words
    return t.split()

def unphrase(ws):
    """Words without "eau de parfum" and its kind, so that a standalone "Eau" ("Eau Sauvage") is a word of the name."""
    return re.sub(r"\beau de (parfum|perfum|perfume|parfume|toilette|toillette|cologne)\b", " \\1 ", " ".join(ws)).split()

def name_conc(nw):
    """A Fragrantica name's concentration; "Le Parfum" is part of a name (Elie Saab Le Parfum is an Eau de Parfum)."""
    t = " ".join(nw)
    return conc(re.sub(r"\ble parfum\b", "", t))

def split_name(title, dname):
    """The perfume's own words from a designer card title ("Afnan 9pm" -> ["9pm"])."""
    w, d = words(title), words(dname)
    if w[:len(d)] == d: w = w[len(d):]
    return w

def best_match(text, page, gender_hint=None):
    cards = F.designer(page)
    if not cards: return None, "no designer page"
    dname = DINDEX.get(f"/designers/{page}.html", page.replace("-", " "))
    dwords = set(words(dname)) | set(words(page.replace("-", " "))) | ALIAS_WORDS.get(page, set()) | {"by"}
    rc = conc(" ".join(words(text)))
    rw = unphrase(words(text))
    rset = set(rw)
    matches = []
    for c in cards:
        if NOT_A_PERFUME.search(c["title"]): continue
        raw = split_name(c["title"], dname)
        nw = unphrase(raw)
        keep_parfum = "le parfum" in " ".join(nw)
        core = [x for i, x in enumerate(nw) if x not in CONC_WORDS or (keep_parfum and x == "parfum" and i and nw[i - 1] == "le")]
        # the house's name inside the perfume's ("Gucci Bloom", "Burberry Her") and its sex words ("for Him") need not be
        # in the row; the sex only breaks ties
        need = [x for x in core if x not in dwords and x not in SEX_WORDS] or [x for x in core if x not in dwords] or core
        if not core or not all(x in rset for x in need): continue
        # a men's listing is never a women's perfume, and the reverse (unisex fits either)
        if gender_hint and c["gender"] in ("male", "female") and c["gender"] != gender_hint: continue
        cc = name_conc(raw)
        if rc and cc and cc != rc and not (rc == "parfum" and cc == "extrait"): continue
        # a name made only of house and sex words ("Hugo Woman", "Burberry Her") must account for every word of the row
        strict = not [x for x in need if x not in dwords and x not in SEX_WORDS]
        loose_sex = SEX_WORDS - ({"for", "pour", "men", "women", "unisex", "mens", "womens"} if strict else set())
        left = [x for i, x in enumerate(rw) if x not in core and x not in CONC_WORDS and x not in LISTING
                and not (x in SEX_WORDS and not (strict and x in loose_sex))
                and x not in dwords and not re.fullmatch(r"\d+(ml|g|gm|oz)?", x)
                # "Le Parfum" perfumes are sold as "Eau de Parfum Intense"
                and not (x == "intense" and keep_parfum and i and rw[i - 1] in ("parfum", "edp"))]
        spec = len([x for x in need if x not in dwords and x not in SEX_WORDS])
        present = len([x for x in core if x in rset])
        matches.append((c, need, cc, left, spec, (present - len(core), present)))
    clean = [m for m in matches if not m[3]]
    if not clean:
        return None, ("flanker? " + " / ".join(f'{" ".join(m[1])} +{" ".join(m[3])}' for m in matches[:3])) if matches else "no name match"
    g = gender_hint
    def key(m):
        # the name with the most distinctive words, then the agreeing concentration, then sex, then the name with fewest
        # words absent from the row and most present ("Hugo Man" over "Hugo"), then the most reviewed
        c, need, cc, _, spec, fit = m
        return (spec, (cc == rc) if rc else (not cc), bool(g and c["gender"] and c["gender"][0] == g[0]), fit, c["reviews"])
    clean.sort(key=key, reverse=True)
    top = clean[0]
    tied = [m for m in clean[1:] if key(m)[:4] == key(top)[:4]]
    return top[0], ("tie: " + ", ".join(m[0]["title"] for m in tied[:3])) if tied else ""

def sex_of(text):
    t = fold(text)
    m = bool(re.search(r"\b(men|man|him|homme|mens)\b", t)); f = bool(re.search(r"\b(women|woman|her|femme|womens|ladies)\b", t))
    return "male" if m and not f else "female" if f and not m else None

if __name__ == "__main__":
    rows = json.load(open(os.path.join(HERE, "rows.json"), encoding="utf-8"))
    cat = json.loads(subprocess.run(["node", "-e", "const {loadSite}=require('./tools/lib/site.js');const W=loadSite('data');"
        "process.stdout.write(JSON.stringify(W.PP_DATA.PERFUMES.map(p=>({id:p.id,name:p.name,house:p.house,gender:p.gender}))))"],
        cwd=ROOT, capture_output=True, check=True).stdout.decode("utf-8"))
    fids = json.load(open(os.path.join(ROOT, "reference", "images", "fragrantica_ids.json"), encoding="utf-8"))
    pages = sorted({r["designer"] for r in rows if r["designer"]})
    print(len(pages), "designer pages", flush=True)
    for i, p in enumerate(pages):
        try: F.designer(p)
        except F.Refused as e: print("refused:", e); sys.exit(1)
        if i % 25 == 0: print(" ", i, p, flush=True)
    out, unresolved = [], []
    for r in rows:
        if not r["designer"]: unresolved.append({**r, "why": "no designer"}); continue
        c, why = best_match(r["text"], r["designer"], sex_of(r["text"]))
        if c: out.append({**r, "fid": c["id"], "url": c["url"], "ftitle": c["title"], "note": why})
        else: unresolved.append({**r, "why": why})
    catmap = {}
    for p in cat:
        if p["id"] in fids: catmap[p["id"]] = fids[p["id"]]["fid"]; continue
        from rows import designer_of
        d, _ = designer_of(p["house"])
        if not d: continue
        try: c, why = best_match(p["house"] + " " + p["name"], d, {"m": "male", "f": "female"}.get(p["gender"]))
        except F.Refused as e: print("refused:", e); sys.exit(1)
        if c: catmap[p["id"]] = c["id"]
    json.dump({"rows": out, "catalogue": catmap, "unresolved": unresolved},
              open(os.path.join(HERE, "resolved.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=0)
    print(len(out), "rows resolved,", len(unresolved), "not;", len({r["fid"] for r in out}), "distinct perfumes;",
          len(catmap), "of", len(cat), "catalogue perfumes placed")
