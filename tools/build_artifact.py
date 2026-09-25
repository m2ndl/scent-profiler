"""Builds build/artifact/ from site/ for the claude.ai Artifact host (the private preview).

The Artifact host wraps pages in its own <html>/<head>/<body>, so each published file must contain only the
inner content. site/profile.html marks that content with <!--ARTIFACT:START--> ... <!--ARTIFACT:END--> pairs,
which are concatenated; the other pages (index.html, the quiz; articles.html; quiz.html, the redirect to the
front page) are full documents whose head and body contents are kept, meta tags dropped. site.css is inlined in
every page and js/ is copied alongside. Publish build/artifact/index.html (the quiz) as the page, with
profile.html, articles.html, quiz.html and js/*.js as its files. Run after every edit under site/.
"""
import base64, json, re, shutil, pathlib

root = pathlib.Path(__file__).resolve().parent.parent
site = root / "site"
out = root / "build" / "artifact"
if out.exists():
    shutil.rmtree(out)
(out / "js").mkdir(parents=True)

# The artifact host only allows external stylesheets from Google Fonts, so inline site.css.
css = (site / "site.css").read_text(encoding="utf-8")
# The host blocks outside images, so the stylesheet's own images travel inside it as data URIs.
for ref in sorted(set(re.findall(r'url\("(img/[^"]+\.webp)"\)', css))):
    data = base64.b64encode((site / ref).read_bytes()).decode("ascii")
    css = css.replace(f'url("{ref}")', f'url("data:image/webp;base64,{data}")')
STYLE = "<style>\n" + css + "\n</style>"

def inner(name):
    doc = (site / name).read_text(encoding="utf-8")
    parts = re.findall(r"<!--ARTIFACT:START-->(.*?)<!--ARTIFACT:END-->", doc, flags=re.S)
    if parts:
        page = "\n".join(p.strip("\n") for p in parts) + "\n"
    else:
        head = re.search(r"<head>(.*?)</head>", doc, flags=re.S).group(1)
        body = re.search(r"<body>(.*?)</body>", doc, flags=re.S).group(1)
        page = re.sub(r"<meta[^>]*>\s*", "", head).strip() + "\n" + body.strip() + "\n"
    return page.replace('<link rel="stylesheet" href="site.css">', STYLE)

for name in ("index.html", "profile.html", "articles.html", "quiz.html"):
    (out / name).write_text(inner(name), encoding="utf-8")
for f in sorted((site / "js").glob("*.js")):
    shutil.copy(f, out / "js" / f.name)
# The host blocks outside images and caps a publish at 255 files, so the bottle photos travel inside
# js/bottles.js as data URIs, in the same id -> src shape the page already reads.
bottles = {}
for img in sorted((site / "img" / "bottles").glob("*.webp")):
    bottles[img.stem] = "data:image/webp;base64," + base64.b64encode(img.read_bytes()).decode("ascii")
(out / "js" / "bottles.js").write_text("window.PP_BOTTLES = " + json.dumps(bottles, separators=(",", ":")) + ";\n", encoding="utf-8")
print("OK", (out / "index.html").stat().st_size, "bytes;", len(bottles), "bottle photos,", (out / "js" / "bottles.js").stat().st_size, "bytes")
