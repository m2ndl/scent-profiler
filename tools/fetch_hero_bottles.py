"""Makes the large bottle pictures the front page stands under its arch: one for each of the quiz's twenty bottles
(QUIZ.grid), the sprayed perfume's own bottle, cut out of its background and trimmed to the glass.

Sources, tried in order for each bottle: the address its catalogue photo came from (reference/images/bottles.json),
then Fragrantica's original and 375x500 pictures by page number (reference/images/fragrantica_ids.json). A picture on
transparency is kept as it is; one on white has the white that touches its edges cut away. The first candidate whose
bottle stands at least MIN_H pixels tall is taken, otherwise the tallest. An address listed in reference/images/
rejected.json is never taken.

Each is saved as site/img/hero/<id>.webp, at most MAX_H pixels tall, and described in reference/images/hero.json:
its source, size, and the point the spray leaves from (the middle of the top of the glass, as shares of the width
and height), which tools/build_landing.js copies into site/js/landing-data.js. A contact sheet, build/hero_sheet.png,
shows every bottle on the page's cream with that point marked, for checking by eye.

  python tools/fetch_hero_bottles.py              make what is missing
  python tools/fetch_hero_bottles.py --refresh    make all twenty again
  python tools/fetch_hero_bottles.py --only a,b   make these again
Then run node tools/build_landing.js and node --test tests/*.test.js.
"""
import io, json, os, subprocess, sys, urllib.request
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "site", "img", "hero")
RECORD = os.path.join(ROOT, "reference", "images", "hero.json")
BOTTLES = os.path.join(ROOT, "reference", "images", "bottles.json")
FIDS = os.path.join(ROOT, "reference", "images", "fragrantica_ids.json")
REJECTED = os.path.join(ROOT, "reference", "images", "rejected.json")
SHEET = os.path.join(ROOT, "build", "hero_sheet.png")
MIN_H, MAX_H = 400, 520
UA = {"User-Agent": "Mozilla/5.0"}


def grid():
    js = "const {loadSite}=require('./tools/lib/site');process.stdout.write(JSON.stringify(loadSite('data').PP_DATA.QUIZ.grid))"
    return json.loads(subprocess.run(["node", "-e", js], cwd=ROOT, capture_output=True, text=True, check=True).stdout)


def fetch(url):
    try:
        return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30).read()
    except Exception:
        return None


def cut(data):
    """the bottle on transparency, trimmed to its glass"""
    im = Image.open(io.BytesIO(data))
    if im.mode in ("RGBA", "LA") or "transparency" in im.info:
        im = im.convert("RGBA")
    else:
        rgb = im.convert("RGB"); w, h = rgb.size
        probe = rgb.copy()
        for xy in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
            if probe.getpixel(xy) != (255, 0, 255):
                ImageDraw.floodfill(probe, xy, (255, 0, 255), thresh=18)
        mask = Image.new("L", (w, h), 255)
        pp, mp = probe.load(), mask.load()
        for y in range(h):
            for x in range(w):
                if pp[x, y] == (255, 0, 255):
                    mp[x, y] = 0
        im = rgb.convert("RGBA"); im.putalpha(mask.filter(ImageFilter.GaussianBlur(0.7)))
    box = im.getchannel("A").point(lambda a: 255 if a > 12 else 0).getbbox()
    return im.crop(box) if box else None


def spray_point(im):
    """the middle of the top of the glass: the first rows that hold the bottle, averaged across"""
    a = im.getchannel("A").load(); w, h = im.size
    y0 = next(y for y in range(h) if sum(1 for x in range(w) if a[x, y] > 60) >= 3)
    xs = [x for y in range(y0, min(h, y0 + max(4, h // 50))) for x in range(w) if a[x, y] > 60]
    return round(sum(xs) / len(xs) / w, 3), round(y0 / h, 3)


def main(argv):
    refresh, only = "--refresh" in argv, set(argv[argv.index("--only") + 1].split(",")) if "--only" in argv else None
    load = lambda f: json.load(open(f, encoding="utf-8")) if os.path.exists(f) else {}
    record, bottles, fids, rejected = load(RECORD), load(BOTTLES), load(FIDS), load(REJECTED)
    os.makedirs(OUT_DIR, exist_ok=True); os.makedirs(os.path.dirname(SHEET), exist_ok=True)
    ids = grid()
    for i in ids:
        if not (refresh or (only and i in only) or (not only and (i not in record or not os.path.exists(os.path.join(OUT_DIR, i + ".webp"))))):
            continue
        cands = []
        if i in bottles: cands.append(bottles[i]["source"])
        if i in fids:
            f = fids[i]["fid"]
            cands += [f"https://fimgs.net/mdimg/perfume/o.{f}.jpg", f"https://fimgs.net/mdimg/perfume/375x500.{f}.jpg"]
        best = None
        for url in cands:
            if url in rejected.get(i, []): continue
            data = fetch(url); im = cut(data) if data else None
            if im is None: continue
            if best is None or im.height > best[1].height: best = (url, im)
            if im.height >= MIN_H: best = (url, im); break
        if not best:
            print("  none:", i); continue
        url, im = best
        if im.height > MAX_H: im = im.resize((round(im.width * MAX_H / im.height), MAX_H), Image.LANCZOS)
        im.save(os.path.join(OUT_DIR, i + ".webp"), "WEBP", quality=90, method=6)
        nx, ny = spray_point(im)
        record[i] = {"source": url, "w": im.width, "h": im.height, "nx": nx, "ny": ny}
        print(f"  {i}: {im.width}x{im.height} from {url}")
    for i in list(record):
        if i not in ids: del record[i]
    with open(RECORD, "w", encoding="utf-8", newline="\n") as f:
        f.write(json.dumps({k: record[k] for k in sorted(record)}, ensure_ascii=False, indent=1) + "\n")
    # the contact sheet: every bottle at the height the phone shows it, on the page's cream, the spray point in red
    cell, per = 230, 5
    sheet = Image.new("RGB", (cell * per, cell * ((len(ids) + per - 1) // per)), (246, 232, 208))
    d = ImageDraw.Draw(sheet)
    for n, i in enumerate(ids):
        if i not in record: continue
        im = Image.open(os.path.join(OUT_DIR, i + ".webp")).convert("RGBA")
        s = min(200 / im.height, 200 / im.width); im = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))))
        x, y = (n % per) * cell + (cell - im.width) // 2, (n // per) * cell + 20
        sheet.paste(im, (x, y), im)
        px, py = x + record[i]["nx"] * im.width, y + record[i]["ny"] * im.height
        d.ellipse([px - 4, py - 4, px + 4, py + 4], fill=(200, 30, 60))
        d.text(((n % per) * cell + 6, (n // per) * cell + 4), i, fill=(42, 27, 17))
    sheet.save(SHEET)
    print(f"{sum(1 for i in ids if i in record)} of {len(ids)} bottles; sheet: {SHEET}")


if __name__ == "__main__":
    main(sys.argv[1:])
