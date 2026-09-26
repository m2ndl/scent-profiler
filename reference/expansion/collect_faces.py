"""Faces (faces.sa, Saudi store): every product in the perfume section in the store's default order, its Bestseller
badge, whether it is on the Fragrance Bestsellers page, and its Bazaarvoice review count. Writes faces.json.

The review counts are syndicated: Faces' own count ("NativeReviewStatistics") is empty, so the number is the
brand's reviews across stores worldwide, not Saudi sales. The Saudi signals are the bestsellers page and the Bestseller
badge (on about one product in fourteen).
Run from the repo root: python reference/expansion/collect_faces.py
"""
import html, http.cookiejar, json, os, re, time, urllib.parse, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
BASE = "https://www.faces.sa"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
jar = http.cookiejar.CookieJar()
op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
op.addheaders = [("User-Agent", UA), ("Accept-Language", "en-US,en;q=0.9")]

def get(url, data=None, ajax=False):
    req = urllib.request.Request(url, data=data, headers={"X-Requested-With": "XMLHttpRequest"} if ajax else {})
    for attempt in range(3):
        try:
            with op.open(req, timeout=60) as r: return r.read().decode("utf-8", "replace")
        except Exception as e:
            if attempt == 2: raise
            time.sleep(5)

TILE = re.compile(r'<div class="js-product-tile-container[^"]*" data-pid="([^"]+)">(.*?)(?=<div class="js-product-tile-container|\Z)', re.S)
def tiles(page):
    out = []
    for pid, body in TILE.findall(page):
        imp = re.search(r'data-gtm-enhancedecommerce-impression="([^"]+)"', body)
        g = json.loads(html.unescape(imp.group(1)))[0] if imp else {}
        text = re.sub(r"<[^>]+>", " ", body)
        out.append({"pid": pid, "brand": g.get("item_brand"), "name": g.get("item_name"), "category": g.get("item_category3"),
                    "bestseller": 'data-badge-value="bestseller"' in body})
    return out

def listing(path, cgid):
    """The category in the store's default order: the page for the total, then the grid the Load More button fetches
    (the page address itself ignores start=)."""
    total = int(re.search(r"([\d,]+)\s+items", get(f"{BASE}{path}")).group(1).replace(",", ""))
    rows, seen, start = [], set(), 0
    while start < total:
        t = tiles(get(f"{BASE}/on/demandware.store/Sites-Faces_SA-Site/en_SA/Search-UpdateGrid?cgid={cgid}&start={start}&sz=48", ajax=True))
        if not t: break
        for r in t:
            if r["pid"] not in seen: seen.add(r["pid"]); rows.append(r)
        start += 48
        time.sleep(1)
    for i, r in enumerate(rows): r["rank"] = i + 1
    return rows

allp = listing("/en/perfume", "perfume")
best = listing("/en/bestsellers-perfume", "bestsellers-perfume")
bestrank = {r["pid"]: r["rank"] for r in best}
reviews = {}
pids = [r["pid"] for r in allp] + [p for p in bestrank if p not in {r["pid"] for r in allp}]
for i in range(0, len(pids), 40):
    q = urllib.parse.urlencode({"filter": "productid:eq:" + ",".join(pids[i:i + 40])}).encode()
    js = json.loads(get(f"{BASE}/on/demandware.store/Sites-Faces_SA-Site/en_SA/Reviews-BazaarvoiceReviewsAjax", q))
    for res in (js.get("productReviews") or {}).get("Results", []):
        st = res.get("ProductStatistics", {})
        reviews[st.get("ProductId")] = [(st.get("ReviewStatistics") or {}).get("TotalReviewCount", 0),
                                        (st.get("NativeReviewStatistics") or {}).get("TotalReviewCount", 0)]
    time.sleep(1)
for r in allp + best:
    r["reviews"], r["native_reviews"] = reviews.get(r["pid"], [0, 0])
    r["bestsellers_page_rank"] = bestrank.get(r["pid"])
json.dump({"source": "Faces (faces.sa), /en/perfume in the store's default order ('FACES Recommends') and /en/bestsellers-perfume, "
                     "read " + time.strftime("%d %B %Y"),
           "note": "reviews is Bazaarvoice's count, syndicated from other stores (native_reviews is Faces' own); bestseller is the "
                   "store's badge on the tile; bestsellers_page_rank is the position on the Fragrance Bestsellers page",
           "rows": allp, "bestsellers_page": best},
          open(os.path.join(HERE, "faces.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=0)
print(len(allp), "perfume rows,", len(best), "on the bestsellers page,", sum(r["bestseller"] for r in allp), "badged,",
      sum(1 for r in allp if r["reviews"]), "with reviews,", sum(1 for r in allp if r["native_reviews"]), "with native reviews")
