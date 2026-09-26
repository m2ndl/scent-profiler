"""Fragrantica reader, shared by the expansion scripts: designer pages (a house's perfumes with page numbers) and perfume
pages (pyramid, accords, sex, year, votes). Parsed results are cached as JSON under cache/; raw pages are not kept.
Requests go one at a time, twelve seconds apart (at 2.5 s the site answered 429 after about 60 pages, at 8 s after about
400). A 429 waits ten minutes and tries again, six times at most; a 403, or a seventh 429, stops the run.
"""
import html, json, os, re, time, urllib.error, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, "cache")
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
PAUSE = 12
_last = [0.0]

class Refused(Exception): pass

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html,application/xhtml+xml",
                                               "Accept-Language": "en-US,en;q=0.9"})
    busy = 0
    for attempt in range(6):
        wait = PAUSE - (time.time() - _last[0])
        if wait > 0: time.sleep(wait)
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                _last[0] = time.time()
                return r.read().decode("utf-8", "replace")
        except urllib.error.HTTPError as e:
            _last[0] = time.time()
            if e.code == 404: return None
            if e.code == 403: raise Refused(f"{e.code} {url}")
            if e.code == 429:
                busy += 1
                if busy > 6: raise Refused(f"{e.code} {url}")
                print(f"    429, waiting ten minutes ({busy})", flush=True)
                time.sleep(600)
                continue
            if attempt >= 2: raise
        except Exception:
            if attempt >= 2: raise
        time.sleep(10)

def _cached(kind, key, build):
    path = os.path.join(CACHE, kind, re.sub(r"[^A-Za-z0-9_.-]", "_", key) + ".json")
    if os.path.exists(path): return json.load(open(path, encoding="utf-8"))
    data = build()
    if data is None: return None
    os.makedirs(os.path.dirname(path), exist_ok=True)
    json.dump(data, open(path, "w", encoding="utf-8"), ensure_ascii=False)
    return data

CARD = re.compile(r'<a href="(/perfume/[^"]+-(\d+)\.html)"[^>]*?title="([^"]*)"', re.S)
def designer(page):
    """[{title, url, id, gender, year, reviews}] for the designer page /designers/<page>.html; title is the card's
    "<designer> <perfume>", reviews the count shown on the card."""
    def build():
        s = fetch(f"https://www.fragrantica.com/designers/{page}.html")
        if s is None: return None
        out, seen = [], set()
        cards = list(CARD.finditer(s))
        for i, c in enumerate(cards):
            href, pid, title = c.groups()
            if pid in seen: continue
            seen.add(pid)
            body = s[c.end():cards[i + 1].start() if i + 1 < len(cards) else c.end() + 6000]
            cnt = re.findall(r"<span>([\d,]+)</span>", body)
            t = html.unescape(title).strip()
            m = re.match(r"^(.*?)\s+(male|female|unisex)(?:\s+(\d{4}))?$", t)
            name, gender, year = (m.group(1), m.group(2), m.group(3)) if m else (t, None, None)
            out.append({"title": name, "url": "https://www.fragrantica.com" + href, "id": int(pid), "gender": gender,
                        "year": int(year) if year else None, "reviews": int(cnt[-1].replace(",", "")) if cnt else 0})
        return out
    return _cached("designers", page, build)

def _notes(block):
    return [html.unescape(n).strip() for n in re.findall(r'class="pyramid-note-label[^"]*"[^>]*>\s*([^<]+?)\s*</span>', block)]

def perfume(url):
    """{title, gender, year, votes, rating, top, middle, base, flat, accords} from a perfume page."""
    def build():
        s = fetch(url)
        if s is None: return None
        og = re.search(r'<meta property="og:title" content="([^"]*)"', s)
        title = html.unescape(og.group(1)) if og else ""
        g = re.search(r"\bfor (women and men|men and women|women|men)\b", title)
        gender = {"women and men": "u", "men and women": "u", "women": "f", "men": "m"}.get(g.group(1)) if g else None
        y = re.search(r"\b(19|20)\d{2}\s*$", title)
        votes = re.search(r'itemprop="ratingCount" content="(\d+)"', s)
        rating = re.search(r'itemprop="ratingValue"[^>]*>([\d.]+)<', s)
        levels = {}
        parts = re.split(r'<pyramid-level-new notes="(\w+)"', s)
        for i in range(1, len(parts) - 1, 2):
            block = parts[i + 1].split("</pyramid-level-new>")[0]
            levels.setdefault(parts[i], _notes(block))
        flat = []
        if not levels:
            # a page with no pyramid lists its notes in one row
            i = s.find("Fragrance Notes")
            if i > 0: flat = _notes(s[i:i + 40000].split("</pyramid-level-new>")[0]) or _notes(s[i:i + 20000])
        acc = re.findall(r'main accords</h6>(.*?)</div>\s*</div>\s*</div>\s*</div>', s, re.S)
        accords = [a.strip() for a in re.findall(r'<span class="truncate">([^<]+)</span>', acc[0])] if acc else []
        return {"title": title, "gender": gender, "year": int(y.group(0)) if y else None,
                "votes": int(votes.group(1)) if votes else 0, "rating": float(rating.group(1)) if rating else None,
                "top": levels.get("top", []), "middle": levels.get("middle", []), "base": levels.get("base", []),
                "flat": flat, "accords": accords}
    return _cached("perfumes", url.rsplit("/", 2)[-2] + "_" + url.rsplit("-", 1)[-1], build)
