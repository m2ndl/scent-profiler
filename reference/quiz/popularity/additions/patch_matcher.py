"""Teaches match_popularity.py the spellings of the 26 Sep 2026 catalogue additions and perfume oils."""
import re
P = r"C:\Users\malha\Desktop\Webapps\perfume-profiler\reference\quiz\popularity\match_popularity.py"
s = open(P, encoding="utf-8").read()
def rep(a, b):
    global s
    assert s.count(a) == 1, a[:70]
    s = s.replace(a, b)

rep('''         "ameeraloudh": ["ameer al oud intense oud"], "9pm": ["9 pm"], "cdnim": ["club de nuit intense"]}''',
    '''         "ameeraloudh": ["ameer al oud intense oud"], "9pm": ["9 pm"], "cdnim": ["club de nuit intense"],
         # store slugs drop accents and split apostrophes ("idal", "l interdit"); Amazon writes "Club De Nuit ... for Women"
         "hugoman": ["man"], "lhommeidealedp": ["l homme idal"], "interditrouge": ["l interdit rouge"], "cdnwoman": ["club de nuit"]}''')
rep('''        "chanceeautendre": "edt"}''',
    '''        "chanceeautendre": "edt", "elieleparfum": "edp", "amaali": "oil", "chocomusk": "oil", "musksilk": "oil"}''')
rep('''def conc(t):
''', '''def conc(t):
    if re.search(r"\\b(perfume|fragrance|concentrated) oil\\b|\\battar\\b", t): return "oil"
''')
# a perfume oil row sells an oil, never the spray of the same name; a catalogue name that contains "parfum" ("Le Parfum")
# is read from CONC first
rep('''        pc, cc = conc(t), conc(fold(p["name"])) or CONC.get(p["id"], "")
        if pc and cc and pc != cc: continue''',
    '''        pc, cc = conc(t), CONC.get(p["id"], "") or conc(fold(p["name"]))
        if pc and cc and pc != cc: continue
        if (pc == "oil") != (cc == "oil"): continue''')
rep('''        for c in ("extrait de parfum", "eau de parfum", "eau de toilette", "eau de cologne"): bare = drop_phrase(bare, c)''',
    '''        for c in ("extrait de parfum", "eau de parfum", "eau de toilette", "eau de cologne", "perfume oil", "fragrance oil", "concentrated perfume oil", "oil"): bare = drop_phrase(bare, c)''')
rep('''        ("women", 80): ("khamrah", "a second Khamrah Eau de Parfum 100 ml listing; 'Adults' is listing noise")}''',
    '''        ("women", 80): ("khamrah", "a second Khamrah Eau de Parfum 100 ml listing; 'Adults' is listing noise"),
        ("women", 70): ("guessseductive", "the Eau de Toilette: the listing's own specifications say so; 'girls' is the seller's wording")}''')
open(P, "w", encoding="utf-8", newline="\n").write(s)
print("ok")
