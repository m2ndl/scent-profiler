# One-off edit (29 Sep 2026): landing.css follows the rewritten front page: the strips, cards and bars go; the test,
# the turning box, the folded sources and the closing questions come in. The new rules are in hook_css.css.
import pathlib, re, sys
HERE = pathlib.Path(__file__).parent
p = pathlib.Path("C:/Users/malha/Desktop/Webapps/perfume-profiler/site/landing.css")
s = p.read_text(encoding="utf-8")

def cut(start, end, new=""):
    global s
    i, j = s.find(start), s.find(end)
    if s.count(start) != 1 or s.count(end) != 1 or not (0 <= i < j):
        sys.exit(f"markers: {start[:40]!r} / {end[:40]!r}")
    s = s[:i] + new + s[j:]

cut("/* materials: paper test strips", "@keyframes lp-rise")
cut("/* book lines, small and quiet under what they support */", "/* the Guide's star count, after the strips */")
s = s.replace("/* the Guide's star count, after the strips */", "/* the critics' big number */")
i = s.index("/* ---------- the seven steps: their labels, examples, evidence and the small charts ---------- */")
tail = s[i:]
label = tail[tail.index("/* the note list beside the ingredient label */"):tail.index("/* a whole and the share of it that holds something else */")]
label = label.replace("/* the note list beside the ingredient label */", "/* the box and its label: the perfume, its note chips, and the ingredients with the unnamed ones marked */")
label = "".join(l for l in label.splitlines(True) if "lp-label-cols" not in l)
stars = tail[tail.index("/* the critics' stars, one bar for each rating */"):tail.index("/* liked by most, loved by a few */")]
quiz = tail[tail.index("/* what the quiz does with a step */"):]
s = s[:i] + (HERE / "hook_css.css").read_text(encoding="utf-8") + "\n" + label + stars + quiz
p.write_bytes(s.encode("utf-8"))
print("landing.css rewritten")
