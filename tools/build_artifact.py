"""Builds build/artifact/ from site/ for the claude.ai Artifact host (the private preview).

The Artifact host wraps pages in its own <html>/<head>/<body>, so the
published file must contain only the inner content. site/index.html marks that content
with <!--ARTIFACT:START--> ... <!--ARTIFACT:END--> pairs; this script concatenates
them, inlines site.css and copies site/js/ alongside. articles.html and quiz.html are full
documents: their head and body contents are kept, meta tags dropped and site.css inlined.
Publish build/artifact/index.html as the page, with articles.html, quiz.html and js/*.js as
its files. Run after every edit under site/.
"""
import re, shutil, pathlib

root = pathlib.Path(__file__).resolve().parent.parent
site = root / "site"
src = (site / "index.html").read_text(encoding="utf-8")
parts = re.findall(r"<!--ARTIFACT:START-->(.*?)<!--ARTIFACT:END-->", src, flags=re.S)
if len(parts) != 2:
    raise SystemExit(f"expected 2 marked blocks, found {len(parts)}")
out = root / "build" / "artifact"
if out.exists():
    shutil.rmtree(out)
(out / "js").mkdir(parents=True)
page = "\n".join(p.strip("\n") for p in parts) + "\n"
# The artifact host only allows external stylesheets from Google Fonts, so inline site.css.
css = (site / "site.css").read_text(encoding="utf-8")
# The host blocks outside images, so the stylesheet's own images travel inside it as data URIs.
import base64
for ref in sorted(set(re.findall(r'url\("(img/[^"]+\.webp)"\)', css))):
    data = base64.b64encode((site / ref).read_bytes()).decode("ascii")
    css = css.replace(f'url("{ref}")', f'url("data:image/webp;base64,{data}")')
page = page.replace('<link rel="stylesheet" href="site.css">', "<style>\n" + css + "\n</style>")
(out / "index.html").write_text(page, encoding="utf-8")
# articles.html and quiz.html are full documents; the host wraps pages itself, so strip the outer skeleton and inline the CSS.
for name in ("articles.html", "quiz.html"):
    doc = (site / name).read_text(encoding="utf-8")
    head = re.search(r"<head>(.*?)</head>", doc, flags=re.S).group(1)
    body = re.search(r"<body>(.*?)</body>", doc, flags=re.S).group(1)
    head = re.sub(r"<meta[^>]*>\s*", "", head)
    head = head.replace('<link rel="stylesheet" href="site.css">', "<style>\n" + css + "\n</style>")
    (out / name).write_text(head.strip() + "\n" + body.strip() + "\n", encoding="utf-8")
for f in sorted((site / "js").glob("*.js")):
    shutil.copy(f, out / "js" / f.name)
# The host blocks outside images and caps a publish at 255 files, so the bottle photos travel inside
# js/bottles.js as data URIs, in the same id -> src shape the page already reads.
import base64, json
bottles = {}
for img in sorted((site / "img" / "bottles").glob("*.webp")):
    bottles[img.stem] = "data:image/webp;base64," + base64.b64encode(img.read_bytes()).decode("ascii")
(out / "js" / "bottles.js").write_text("window.PP_BOTTLES = " + json.dumps(bottles, separators=(",", ":")) + ";\n", encoding="utf-8")
print("OK", (out / "index.html").stat().st_size, "bytes;", len(bottles), "bottle photos,", (out / "js" / "bottles.js").stat().st_size, "bytes")
