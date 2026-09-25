"""Exact-match replacements: python rep.py TARGET PAIRS_FILE.
PAIRS_FILE holds blocks:  @@@OLD\n<old text>\n@@@NEW\n<new text>\n@@@END
Each old text must occur exactly once in TARGET; nothing is written unless every block matches."""
import sys, re, pathlib
target = pathlib.Path(sys.argv[1])
spec = pathlib.Path(sys.argv[2]).read_text(encoding="utf-8")
blocks = re.findall(r"@@@OLD\n(.*?)\n@@@NEW\n(.*?)\n?@@@END", spec, flags=re.S)
text = target.read_text(encoding="utf-8")
for i, (old, new) in enumerate(blocks):
    n = text.count(old)
    if n != 1:
        raise SystemExit(f"block {i}: found {n} times: {old[:100]!r}")
    text = text.replace(old, new)
target.write_text(text, encoding="utf-8", newline="\n")
print("OK", len(blocks), "replacements in", target.name)
