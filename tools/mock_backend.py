"""Local stand-in for backend/apps-script.gs, for testing the page without Google.

Serves site/ as static files and the backend contract at /api:
  POST /api  {type: rating|correction|lookup|tagcache|label|event, ...}
  GET  /api?stats=1        -> {perfumes: {id: {n, o, h, d}}, quiz: {n, palates, breakers}}
  GET  /api?catalogue=1    -> {entries: [...derived entries...]}
Lookups answer from a small fixture (no Fragella key needed) and store nothing; the page posts the
derived weights back as "tagcache", which is what the catalogue then serves. Data lives in memory.

Run:  python tools/mock_backend.py 8765
Open: http://localhost:8765/?endpoint=http://localhost:8765/api
"""
import json, sys, re, os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "site"))  # serve site/, wherever it is launched from

FIXTURE = {
    "tea tonique": {"Name": "Tea Tonique", "Brand": "Miller Harris", "Gender": "unisex", "OilType": "Eau de Toilette", "_id": "TeaTonique",
        "Notes": {"Top": [{"name": "Bergamot"}, {"name": "Lemon"}, {"name": "Nutmeg"}], "Middle": [{"name": "Black Tea"}, {"name": "Birch"}, {"name": "Mate"}],
                  "Base": [{"name": "Musk"}, {"name": "Iso E Super"}, {"name": "Smoke"}]},
        "Main Accords": ["citrus", "aromatic", "smoky", "woody"], "Image URL": ""},
    "green irish tweed": {"Name": "Green Irish Tweed", "Brand": "Creed", "Gender": "men", "OilType": "Eau de Parfum", "_id": "GreenIrishTweed",
        "Notes": {"Top": [{"name": "Lemon Verbena"}, {"name": "Iris"}], "Middle": [{"name": "Violet Leaf"}], "Base": [{"name": "Ambergris"}, {"name": "Sandalwood"}]},
        "Main Accords": ["green", "fresh", "woody", "aromatic"], "Image URL": ""},
    "encre noire": {"Name": "Encre Noire", "Brand": "Lalique", "Gender": "men", "OilType": "Eau de Toilette", "_id": "EncreNoire",
        "Notes": {"Top": [{"name": "Cypress"}], "Middle": [{"name": "Vetiver"}], "Base": [{"name": "Musk"}, {"name": "Cashmere Wood"}]},
        "Main Accords": ["woody", "earthy", "smoky"], "Image URL": ""},
}
RATINGS, CORRECTIONS, LABELS, EVENTS, CATALOGUE = [], [], [], [], {}

def quiz_stats():
    """As quizStats_ in the backend: each device's last "result:<palate>:<deal-breakers>" event, counted."""
    last = {}
    for e in EVENTS:
        name = str(e.get("name") or "")
        if name.startswith("result:") and e.get("device"): last[e["device"]] = name
    out = {"n": 0, "palates": {}, "breakers": {}}
    for name in last.values():
        parts = name.split(":"); palate = parts[1] if len(parts) > 1 and parts[1] else "none"
        out["n"] += 1; out["palates"][palate] = out["palates"].get(palate, 0) + 1
        for f in (parts[2].split("+") if len(parts) > 2 and parts[2] else []):
            if f: out["breakers"][f] = out["breakers"].get(f, 0) + 1
    return out

def slug(s): return re.sub(r"^-|-$", "", re.sub(r"[^a-z0-9]+", "-", s.lower()))[:80]
def names(arr): return [x["name"] if isinstance(x, dict) else x for x in (arr or [])]

class H(SimpleHTTPRequestHandler):
    def _json(self, obj, code=200):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(code); self.send_header("Content-Type", "application/json"); self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body))); self.end_headers(); self.wfile.write(body)
    def do_GET(self):
        u = urlparse(self.path)
        if u.path != "/api": return super().do_GET()
        q = parse_qs(u.query)
        if "catalogue" in q: return self._json({"entries": list(CATALOGUE.values())})
        if "stats" in q:
            last = {}
            for r in RATINGS: last[(r.get("device"), r.get("perfume"))] = r
            agg = {}
            for r in last.values():
                a = agg.setdefault(r["perfume"], {"n": 0, "o": [], "h": [], "d": []}); a["n"] += 1
                for k, s in (("opening", "o"), ("heart", "h"), ("drydown", "d")):
                    if r.get(k) is not None: a[s].append(r[k])
            return self._json({"perfumes": {k: {"n": a["n"], "o": sum(a["o"]) / len(a["o"]) if a["o"] else None, "h": sum(a["h"]) / len(a["h"]) if a["h"] else None, "d": sum(a["d"]) / len(a["d"]) if a["d"] else None} for k, a in agg.items()}, "quiz": quiz_stats()})
        return self._json({"ok": True, "hint": "append ?stats=1 or ?catalogue=1"})
    def do_POST(self):
        n = int(self.headers.get("Content-Length", 0)); body = json.loads(self.rfile.read(n) or b"{}")
        t = body.get("type")
        if t == "lookup":
            key = (body.get("q") or "").strip().lower()
            for e in CATALOGUE.values():
                if e["name"].lower() == key or (e["brand"] + " " + e["name"]).lower() == key: return self._json({"found": True, "entry": e, "cached": True})
            f = FIXTURE.get(key) or next((v for k, v in FIXTURE.items() if key in k or k in key), None)
            if not f: return self._json({"found": False, "reason": "no_match"})
            e = {"id": "f_" + slug(f["Brand"] + " " + f["Name"]), "name": f["Name"], "brand": f["Brand"], "gender": f["Gender"], "oilType": f["OilType"],
                 "notes": {"top": names(f["Notes"]["Top"]), "middle": names(f["Notes"]["Middle"]), "base": names(f["Notes"]["Base"])},
                 "accords": f["Main Accords"], "image": f["Image URL"], "vendorId": f["_id"], "source": "fixture"}
            return self._json({"found": True, "entry": e, "cached": False})   # nothing stored: the page posts derived weights back
        if t == "tagcache":
            if body.get("id") and body.get("stages"):
                CATALOGUE.setdefault(body["id"], {k: body.get(k) for k in ("id", "name", "brand", "gender", "oilType", "image", "vendorId", "stages", "source")})
            return self._json({"ok": True})
        if t == "label": LABELS.append(body); print("label", body.get("perfume"), body.get("format")); return self._json({"ok": True})
        if t == "correction": CORRECTIONS.append(body); return self._json({"ok": True})
        if t == "event": EVENTS.append(body); print("event", body.get("name"), body.get("n")); return self._json({"ok": True})
        RATINGS.append(body); return self._json({"ok": True})
    def do_OPTIONS(self):
        self.send_response(204); self.send_header("Access-Control-Allow-Origin", "*"); self.send_header("Access-Control-Allow-Headers", "content-type"); self.end_headers()
    def log_message(self, *a): pass

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    print("mock backend on", port)
    ThreadingHTTPServer(("127.0.0.1", port), H).serve_forever()
