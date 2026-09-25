"""Finds a bottle photo for every catalogue perfume and ships it with the site.

Source: Fragella's image CDN, which serves background-removed bottle shots at
https://cdn.fragella.com/images/<slug>.webp, where the slug is built from the house and the name
("creed-aventus"). No API key is needed; a wrong slug answers 403. For each perfume the tool tries
slug variants in order of likelihood (house plus full name, house aliases, name alone, then the name
without its concentration words) and keeps the first hit. Flanker words (Intense, Elixir, Absolu...)
are never dropped, so a hit is the right perfume or no hit at all; dropping a concentration word
("Eau de Parfum") is recorded as a fallback so the contact sheet can be checked for it.

Second source, for what the first lacks: Fragrantica's image server by page number
(https://fimgs.net/mdimg/perfume/375x500.<n>.jpg), with the numbers in reference/images/fragrantica_ids.json.
Those shots sit on white; the white that touches the edges is cut away. An address dropped with --drop is kept in
reference/images/rejected.json and never taken again.

Each hit is trimmed to the bottle, fitted into a 160 px transparent square and saved as
site/img/bottles/<id>.webp. The tool then writes site/js/bottles.js (id -> path, only ids with a file)
and reference/images/bottles.json (id -> source slug, kind), and draws contact sheets into build/
for checking every match by eye.

  python tools/fetch_bottles.py            fetch what is missing, rewrite bottles.js, draw sheets
  python tools/fetch_bottles.py --refresh  fetch everything again
  python tools/fetch_bottles.py --only a,b refetch these ids
  python tools/fetch_bottles.py --drop a,b remove these ids (a wrong match found on the sheet)
Needs Pillow with WebP support. Run node --test tests/*.test.js afterwards.
"""
import concurrent.futures, io, json, os, re, subprocess, sys, unicodedata, urllib.error, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG_DIR = os.path.join(ROOT, "site", "img", "bottles")
JS_OUT = os.path.join(ROOT, "site", "js", "bottles.js")
RECORD = os.path.join(ROOT, "reference", "images", "bottles.json")
SHEETS = os.path.join(ROOT, "build", "bottle_sheets")
REJECTED = os.path.join(ROOT, "reference", "images", "rejected.json")
FIDS = os.path.join(ROOT, "reference", "images", "fragrantica_ids.json")
CDN = "https://cdn.fragella.com/images/{}.webp"
FRAGRANTICA = "https://fimgs.net/mdimg/perfume/375x500.{}.jpg"
UA = {"User-Agent": "DrydownProfiler/1.0 (bottle thumbnails)"}
SIZE, PAD = 160, 6

HOUSE_ALIASES = {
    "Maison Francis Kurkdjian": ["maison-francis-kurkdjian", "francis-kurkdjian", "mfk"],
    "Yves Saint Laurent": ["yves-saint-laurent", "ysl", "saint-laurent"],
    "Giorgio Armani": ["giorgio-armani", "armani"],
    "Dior": ["dior", "christian-dior"],
    "Christian Dior": ["christian-dior", "dior"],
    "Rabanne": ["rabanne", "paco-rabanne"],
    "Paco Rabanne": ["paco-rabanne", "rabanne"],
    "Lattafa": ["lattafa", "lattafa-perfumes"],
    "Armaf": ["armaf"],
    "Afnan": ["afnan", "afnan-perfumes"],
    "Rasasi": ["rasasi"],
    "Ajmal": ["ajmal"],
    "Arabian Oud": ["arabian-oud"],
    "Swiss Arabian": ["swiss-arabian"],
    "Ard Al Zaafaran": ["ard-al-zaafaran"],
    "Al Haramain": ["al-haramain", "al-haramain-perfumes"],
    "Maison Alhambra": ["maison-alhambra"],
    "French Avenue": ["french-avenue", "fragrance-world"],
    "Roja Parfums": ["roja-parfums", "roja-dove"],
    "Le Labo": ["le-labo"],
    "By Kilian": ["by-kilian", "kilian", "kilian-paris"],
    "Kilian": ["kilian", "by-kilian", "kilian-paris"],
    "Jean Paul Gaultier": ["jean-paul-gaultier"],
    "Dolce & Gabbana": ["dolce-gabbana", "dolce-and-gabbana"],
    "Viktor & Rolf": ["viktor-rolf", "viktor-and-rolf"],
    "Maison Margiela": ["maison-margiela", "margiela"],
    "Parfums de Marly": ["parfums-de-marly"],
    "Xerjoff": ["xerjoff"],
    "Carolina Herrera": ["carolina-herrera"],
    "Juliette Has a Gun": ["juliette-has-a-gun"],
    "Hugo Boss": ["hugo-boss", "boss"],
    "Calvin Klein": ["calvin-klein"],
    "Montblanc": ["montblanc", "mont-blanc"],
    "Dolce&Gabbana": ["dolce-gabbana", "dolce-and-gabbana"],
    "Hermès": ["hermes"],
    "Fragrance World": ["fragrance-world"],
    "Abdul Samad Al Qurashi": ["abdul-samad-al-qurashi", "asaq"],
    "Escentric Molecules": ["escentric-molecules"],
    "BDK Parfums": ["bdk-parfums", "bdk"],
    "Louis Vuitton": ["louis-vuitton"],
    "Jo Malone": ["jo-malone", "jo-malone-london"],
    "Narciso Rodriguez": ["narciso-rodriguez"],
    "Sol de Janeiro": ["sol-de-janeiro"],
    "Ariana Grande": ["ariana-grande"],
    "Issey Miyake": ["issey-miyake"],
}
CONC = re.compile(r"\b(eau de parfum|eau de toilette|extrait de parfum|edp|edt)\b", re.I)
MALE = re.compile(r"\s+(man|men|for men|for him|pour homme|homme)$", re.I)   # never Woman, Femme or Her
SUFFIXES = ["for-him", "for-her", "for-men", "for-women", "pour-homme", "pour-femme", "eau-de-parfum", "eau-de-toilette", "parfum"]

def slug(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower()
    s = s.replace("&", " ").replace("+", " ")
    s = re.sub(r"['’`]", "", s)
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")

def slug_apos(s):
    """Variant that turns an apostrophe into a hyphen: Bade'e -> bade-e."""
    return slug(re.sub(r"['’`]", " ", s))

def candidates(house, name):
    houses = HOUSE_ALIASES.get(house, [slug(house)])
    names = []
    for n in (name, re.sub(rf"^{re.escape(house)}\s+", "", name, flags=re.I)):
        for f in (slug, slug_apos):
            v = f(n)
            if v and v not in names: names.append(v)
    out = []
    for n in names:
        for h in houses:
            if not n.startswith(h + "-"): out.append((h + "-" + n, "exact"))
        out.append((n, "exact"))
    name = re.sub(r"\s*\([^)]*\)", "", name).strip()          # "Miss Dior (2021)" -> "Miss Dior"
    for h in houses: out.append((h + "-" + slug(name), "exact"))
    short = re.sub(r"\s+", " ", CONC.sub(" ", name)).strip()
    if short and short.lower() != name.lower():
        for h in houses: out.append((h + "-" + slug(short), "no-concentration"))
        out.append((slug(short), "no-concentration"))
    base = slug(short or name)
    for h in houses:                                          # the name plus a word the source adds
        for suf in SUFFIXES: out.append((f"{h}-{base}-{suf}", "added-word"))
    male = MALE.sub("", short or name).strip()                # the men's default: "Interlude Man" -> "Interlude"
    if male and male.lower() != (short or name).lower():
        for h in houses: out.append((h + "-" + slug(male), "no-gender-word"))
    seen, uniq = set(), []
    for s, k in out:
        if s not in seen: seen.add(s); uniq.append((s, k))
    return uniq

def get(url):
    req = urllib.request.Request(url, headers=UA)
    try:
        with urllib.request.urlopen(req, timeout=25) as r:
            return r.read() if r.status == 200 else None
    except Exception:
        return None

def cut_white(im):
    """Fragrantica shots sit on white: clear the white that touches the edges, keep white inside the bottle."""
    import numpy as np
    from PIL import Image, ImageFilter
    a = np.asarray(im.convert("RGB")).astype(np.int16)
    white = (a.min(axis=2) > 232) & ((a.max(axis=2) - a.min(axis=2)) < 14)
    h, w = white.shape
    bg = np.zeros_like(white)
    stack = [(y, x) for y in (0, h - 1) for x in range(w) if white[y, x]] + [(y, x) for x in (0, w - 1) for y in range(h) if white[y, x]]
    while stack:
        y, x = stack.pop()
        if bg[y, x]: continue
        bg[y, x] = True
        for yy, xx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= yy < h and 0 <= xx < w and white[yy, xx] and not bg[yy, xx]: stack.append((yy, xx))
    alpha = Image.fromarray(np.where(bg, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))
    out = im.convert("RGBA"); out.putalpha(alpha)
    return out

def thumb(data, white_bg=False):
    from PIL import Image
    im = Image.open(io.BytesIO(data)).convert("RGBA")
    if white_bg: im = cut_white(im)
    box = im.getchannel("A").point(lambda a: 255 if a > 12 else 0).getbbox()
    if box: im = im.crop(box)
    inner = SIZE - 2 * PAD
    scale = min(inner / im.width, inner / im.height)
    im = im.resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))), Image.LANCZOS)
    canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    canvas.alpha_composite(im, ((SIZE - im.width) // 2, SIZE - PAD - im.height))
    out = io.BytesIO()
    canvas.save(out, "WEBP", quality=82, method=6)
    return out.getvalue()

def catalogue():
    code = ("const {loadSite}=require('./tools/lib/site.js');const W=loadSite('data');"
            "process.stdout.write(JSON.stringify(W.PP_DATA.PERFUMES.map(p=>({id:p.id,name:p.name,house:p.house}))));")
    return json.loads(subprocess.run(["node", "-e", code], cwd=ROOT, capture_output=True, check=True).stdout.decode("utf-8"))

def find(p, rejected, fids):
    """First source: Fragella's CDN by address. Second: Fragrantica's image server by page number."""
    for s, kind in candidates(p["house"], p["name"]):
        url = CDN.format(s)
        if url in rejected: continue
        data = get(url)
        if data: return p, url, kind, data, False
    fid = fids.get(p["id"], {}).get("fid")
    if fid:
        url = FRAGRANTICA.format(fid)
        if url not in rejected:
            data = get(url)
            if data: return p, url, "fragrantica", data, True
    return p, None, None, None, False

def write_js(record):
    ids = sorted(i for i in record if os.path.exists(os.path.join(IMG_DIR, i + ".webp")))
    body = ",\n".join(f'  {json.dumps(i)}: "img/bottles/{i}.webp"' for i in ids)
    text = ("/* Bottle thumbnails shipped with the site: perfume id -> image path. Generated by\n"
            "   tools/fetch_bottles.py; do not edit by hand. A perfume missing here shows the drawn bottle. */\n"
            "window.PP_BOTTLES = {\n" + body + "\n};\n")
    with open(JS_OUT, "w", encoding="utf-8", newline="\n") as f: f.write(text)
    return len(ids)

def sheets(cat, record):
    from PIL import Image, ImageDraw, ImageFont
    os.makedirs(SHEETS, exist_ok=True)
    for f in os.listdir(SHEETS): os.remove(os.path.join(SHEETS, f))
    items = [p for p in cat if p["id"] in record]
    cols, cw, ch, per = 8, 190, 230, 48
    try: font = ImageFont.truetype("arial.ttf", 12)
    except Exception: font = ImageFont.load_default()
    for n in range(0, len(items), per):
        chunk = items[n:n + per]
        rows = (len(chunk) + cols - 1) // cols
        sheet = Image.new("RGB", (cols * cw, rows * ch), (246, 232, 208))
        d = ImageDraw.Draw(sheet)
        for k, p in enumerate(chunk):
            x, y = (k % cols) * cw, (k // cols) * ch
            im = Image.open(os.path.join(IMG_DIR, p["id"] + ".webp")).convert("RGBA")
            sheet.paste(im, (x + 15, y + 8), im)
            kind = record[p["id"]]["kind"]
            flag = "" if kind == "exact" else f"  [{kind}]"
            d.text((x + 6, y + 172), (p["house"])[:28], fill=(97, 78, 63), font=font)
            d.text((x + 6, y + 188), (p["name"])[:28], fill=(42, 27, 17), font=font)
            d.text((x + 6, y + 204), (p["id"] + flag)[:32], fill=(167, 42, 104) if flag else (129, 109, 93), font=font)
        sheet.save(os.path.join(SHEETS, f"sheet_{n // per + 1:02d}.png"))

def main(argv):
    refresh = "--refresh" in argv
    only = set(argv[argv.index("--only") + 1].split(",")) if "--only" in argv else None
    drop = set(argv[argv.index("--drop") + 1].split(",")) if "--drop" in argv else set()
    os.makedirs(IMG_DIR, exist_ok=True); os.makedirs(os.path.dirname(RECORD), exist_ok=True)
    load = lambda f, d: json.load(open(f, encoding="utf-8")) if os.path.exists(f) else d
    record, rejected, fids = load(RECORD, {}), load(REJECTED, {}), load(FIDS, {})
    cat = catalogue()
    for i in drop:                                            # a wrong or poor photo: never take that address again
        if i in record: rejected.setdefault(i, []).append(record.pop(i)["source"])
        f = os.path.join(IMG_DIR, i + ".webp")
        if os.path.exists(f): os.remove(f)
    todo = [p for p in cat if (refresh or (only and p["id"] in only) or (not only and p["id"] not in record))]
    misses = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        for p, url, kind, data, white in pool.map(lambda p: find(p, set(rejected.get(p["id"], [])), fids), todo):
            if not data: misses.append(p); continue
            with open(os.path.join(IMG_DIR, p["id"] + ".webp"), "wb") as f: f.write(thumb(data, white))
            record[p["id"]] = {"kind": kind, "source": url}
    dump = lambda f, d: (open(f, "w", encoding="utf-8", newline="\n").write(json.dumps({k: d[k] for k in sorted(d)}, ensure_ascii=False, indent=1) + "\n"))
    dump(RECORD, record); dump(REJECTED, rejected)
    n = write_js(record)
    sheets(cat, record)
    print(f"{n} of {len(cat)} perfumes have a bottle; {len(misses)} tried this run found none")
    for p in misses: print("  none:", p["id"], "|", p["house"], "|", p["name"])

if __name__ == "__main__":
    main(sys.argv[1:])
