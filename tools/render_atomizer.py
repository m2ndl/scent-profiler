#!/usr/bin/env python
"""Makes the still pictures of the front page's atomizer, site/img/atomizer-ltr.webp and site/img/atomizer-rtl.webp,
from the live 3D atomizer in site/js/bottle3d.js, so the first paint, and any browser without WebGL, shows the same
atomizer. Draws at twice the atomizer box's size (840 x 660) on a transparent background, with three.js at the version
pinned by the import map in site/index.html. Also checks that the nozzle and the bulb fall where landing.js expects
them in the picture (its NOZZLE and BULB), since the page aims the mist and the hint from those.
Needs Playwright with Chromium, Pillow, and network access to jsDelivr.
Usage: python tools/render_atomizer.py"""
import base64, functools, http.server, io, json, pathlib, re, sys, threading
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = ROOT / "site"
W, H = 840, 660

importmap = re.search(r'<script type="importmap">(.*?)</script>', (SITE / "index.html").read_text(encoding="utf-8"), re.S).group(1)
landing = (SITE / "js" / "landing.js").read_text(encoding="utf-8")
expect = {k: json.loads(re.search(rf"\b{k} = (\[[^\]]+\])", landing).group(1)) for k in ("NOZZLE", "BULB")}

PAGE = """<!doctype html><html><head><script type="importmap">%s</script></head><body style="margin:0">
<canvas id="c" style="width:%dpx;height:%dpx"></canvas>
<script type="module">
import { createAtomizer } from "/js/bottle3d.js";
const c = document.getElementById("c"), a = createAtomizer(c, { still: true, rtl: location.hash === "#rtl" });
a.size(%d, %d, 1);
const n = a.nozzle(), b = a.bulb(), g = c.getContext("webgl2");
window.shot = { lost: g ? g.isContextLost() : true, png: c.toDataURL("image/png"), nozzle: [n.x / n.w, n.y / n.h], bulb: [b.x / b.w, b.y / b.h] };
</script></body></html>""" % (importmap, W, H, W, H)

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass
handler = functools.partial(Quiet, directory=str(SITE))
server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
base = f"http://127.0.0.1:{server.server_address[1]}"

problems = []
with sync_playwright() as p:
    browser = p.chromium.launch()
    for side in ("ltr", "rtl"):
        shot = None
        for attempt in range(4):   # the software renderer in headless Chromium sometimes loses its context: try again
            page = browser.new_page(viewport={"width": W, "height": H})
            page.route(f"{base}/__atomizer.html", lambda r: r.fulfill(body=PAGE, content_type="text/html"))
            page.goto(f"{base}/__atomizer.html#{side}")
            page.wait_for_function("window.shot", timeout=90000)
            shot = page.evaluate("window.shot")
            page.close()
            if not shot["lost"]:
                break
        if shot["lost"]:
            sys.exit(f"{side}: the WebGL context was lost on every attempt")
        im = Image.open(io.BytesIO(base64.b64decode(shot["png"].split(",", 1)[1]))).convert("RGBA")
        out = SITE / "img" / f"atomizer-{side}.webp"
        im.save(out, "WEBP", quality=90, method=6)
        nozzle, bulb = shot["nozzle"], shot["bulb"]
        if side == "rtl":   # landing.js keeps the left-to-right positions and mirrors them itself
            nozzle, bulb = [1 - nozzle[0], nozzle[1]], [1 - bulb[0], bulb[1]]
        for name, got in (("NOZZLE", nozzle), ("BULB", bulb)):
            if max(abs(a - b) for a, b in zip(got, expect[name])) > 0.01:
                problems.append(f"{side}: {name} is at {[round(v, 3) for v in got]}, landing.js says {expect[name]}")
        print(f"{out.relative_to(ROOT)}: {out.stat().st_size // 1024} KB; nozzle {[round(v, 3) for v in nozzle]}, bulb {[round(v, 3) for v in bulb]}")
    browser.close()
server.shutdown()
if problems:
    sys.exit("\n".join(problems))
print("OK")
