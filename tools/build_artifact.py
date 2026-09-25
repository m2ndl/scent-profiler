"""Builds build/artifact/ from site/ for the claude.ai Artifact host (the private preview).

The Artifact host wraps pages in its own <html>/<head>/<body>, so the
published file must contain only the inner content. site/index.html marks that content
with <!--ARTIFACT:START--> ... <!--ARTIFACT:END--> pairs; this script concatenates
them, inlines site.css and copies site/js/ alongside. Publish build/artifact/index.html
as the page, with articles.html and js/*.js as its files. Run after every edit under site/.
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
page = page.replace('<link rel="stylesheet" href="site.css">', "<style>\n" + css + "\n</style>")
(out / "index.html").write_text(page, encoding="utf-8")
# articles.html is a full document; the host wraps pages itself, so strip the outer skeleton and inline the CSS.
art = (site / "articles.html").read_text(encoding="utf-8")
head = re.search(r"<head>(.*?)</head>", art, flags=re.S).group(1)
body = re.search(r"<body>(.*?)</body>", art, flags=re.S).group(1)
head = re.sub(r"<meta[^>]*>\s*", "", head)
head = head.replace('<link rel="stylesheet" href="site.css">', "<style>\n" + css + "\n</style>")
(out / "articles.html").write_text(head.strip() + "\n" + body.strip() + "\n", encoding="utf-8")
for f in sorted((site / "js").glob("*.js")):
    shutil.copy(f, out / "js" / f.name)
print("OK", (out / "index.html").stat().st_size, "bytes")
