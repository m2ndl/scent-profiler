"""Matches the store rows that reference/expansion/resolve.py could not place on a Fragrantica page (resolved.json,
"unresolved") to catalogue perfumes with match_popularity.py's own matcher, and writes unresolved_sales.json, keyed
by catalogue id. tools/select_more.js reads it beside resolved.json and sa_popularity.json.

Why: the resolver left 950 rows, among them the sales of some of the best-known bottles (Afnan 9pm's "9 PM Edition"
rows: Amazon.sa men's #1, Noon's Eau de Parfum #10, Golden Scent #808), so a flanker whose rows did resolve outranked
its original. Only a row that matches exactly one catalogue perfume as a sale (no word left over) is kept.
Run from the repo root: python reference/quiz/popularity/match_unresolved.py
"""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))

# match_popularity.py's definitions (fold, HOUSE, ALIAS, CONC, the catalogue and match), without its run, which
# rewrites sa_popularity.json: everything before its first run step.
src = open(os.path.join(HERE, "match_popularity.py"), encoding="utf-8").read()
cut = src.index("# Amazon rows read one by one")
env = {"__file__": os.path.join(HERE, "match_popularity.py"), "__name__": "match_popularity_defs"}
cwd = os.getcwd(); os.chdir(ROOT)
try: exec(compile(src[:cut], "match_popularity.py (definitions)", "exec"), env)
finally: os.chdir(cwd)
match = env["match"]

# Rows read one by one and accepted although a word is left over, as match_popularity.py's READ: the word is the
# seller's or a typo, not another product. Every other near miss in the unresolved rows is a real flanker or another
# perfume (Idole Intense, Le Male Ultra, Coach Floral, Jaguar Pace).
READ = {("noon", "ep", 10): ("9pm", "'Edition' is the seller's wording, as on the Amazon.sa rows match_popularity.py reads"),
        ("amazon", "women", 1): ("jovanmusk", "Jovan Musk for Women is sold as a cologne concentrate"),
        ("amazon", "all", 2): ("jovanmusk", "the same listing as women #1"),
        ("amazon", "all", 21): ("reef33", "'Oriental Luxury Fragrance' is the listing's description"),
        ("amazon", "women", 16): ("sacrificeforher", "'Floral Perfume' is the listing's description"),
        ("sephora", "best", 12): ("missdiorbloomingbouquet", "the same perfume in a limited-edition bottle"),
        ("noon", "ep", 186): ("elizarde5thavenue", "'Lilial Free' marks the reformulated bottle of the same perfume"),
        ("niceone", "women", 144): ("floragorgeousorchid", "'pafrum' is a typo for parfum"),
        ("niceone", "men", 171): ("bossinmotion", "'eue' is a typo for eau"),
        ("niceone", "women", 223): ("justcavalli", "'detoilette' is a typo for de toilette"),
        ("noon", "ep", 263): ("shaghafoudaswad", "'Eue' is a typo for eau"),
        ("niceone", "men", 187): ("mexicantobacco", "'extriat' is a typo for extrait")}

res = json.load(open(os.path.join(ROOT, "reference", "expansion", "resolved.json"), encoding="utf-8"))
out, n_rows, n_sales, ambiguous, used = {}, 0, 0, [], set()
for r in res["unresolved"]:
    n_rows += 1
    found = match(r["text"])
    sales = [p for p, kind, rest in found if kind == "sale"]
    read = READ.get((r["source"], r["list"], r.get("rank")))
    if not sales and read:
        sales = [p for p, kind, rest in found if kind == "flanker" and p["id"] == read[0]]
        if sales: used.add((r["source"], r["list"], r.get("rank")))
    if len(sales) > 1: ambiguous.append((r["source"], r.get("rank"), r["text"], [p["id"] for p in sales])); continue
    if not sales: continue
    p = sales[0]; n_sales += 1
    row = {k: r.get(k) for k in ("source", "list", "rank", "count", "signal", "text")}
    if read and read[0] == p["id"]: row["read"] = read[1]
    out.setdefault(p["id"], []).append(row)
assert used == set(READ), f"rows read by hand no longer found: {set(READ) - used}"
for rows in out.values(): rows.sort(key=lambda x: (x["source"], x["rank"] or 0))
json.dump({"source": "reference/expansion/resolved.json unresolved rows, matched to the catalogue by match_popularity.py's matcher",
           "perfumes": dict(sorted(out.items()))},
          open(os.path.join(HERE, "unresolved_sales.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(n_rows, "unresolved rows;", n_sales, "matched one catalogue perfume as a sale, for", len(out), "perfumes;",
      len(ambiguous), "matched more than one and were left out")
for a in ambiguous[:20]: print("  ambiguous:", a)
