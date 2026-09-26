"""Cases the resolver got wrong while it was built, each with the Fragrantica perfume it must choose (None: it must refuse).
Needs the designer pages in cache/. python reference/expansion/resolve_check.py"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import resolve as R

CASES = [
    ("Bloom Eau de Parfum Intense Women Perfume", "Gucci", "female", "Gucci Gucci Bloom Intense"),          # house word inside the name
    ("Her Eau de Parfum Women Perfume", "Burberry", "female", "Burberry Burberry Her"),
    ("AFNAN 9 PM Elixir Unisex Extrait De Parfum,100ML", "Afnan", None, "Afnan 9PM Elixir"),               # "9 PM" and "9pm"
    ("Invictus Parfum Men Perfume", "Paco-Rabanne", "male", "Rabanne Invictus Parfum"),
    ("Amouage Honour - 100 ml Eau De Parfum for Women", "Amouage", "female", "Amouage Honour Woman"),       # Woman and Women
    ("Elie Saab Le Parfum Eau de Parfum for women", "Elie-Saab", "female", "Elie Saab Le Parfum"),         # Le Parfum is a name
    ("Dior Sauvage EDP For Men 100ml", "Dior", "male", "Dior Sauvage Eau de Parfum"),
    ("Dior Sauvage EDT 100ml", "Dior", None, "Dior Sauvage"),                                              # not Eau Sauvage
    ("Dior Sauvage Parfum - 200 ml Eau De Parfum For Men", "Dior", "male", "Dior Sauvage Parfum"),         # name's Parfum wins
    ("Jean Paul Gaultier Le Male Le Parfum EDP Intense Eau de Parfum Intense for Men", "Jean-Paul-Gaultier", "male",
     "Jean Paul Gaultier Le Male Le Parfum"),
    ("Hugo Boss The Scent For Him Eau de Toilette for Men", "Hugo-Boss", "male", "Hugo Boss Boss The Scent"),  # not For Her
    ("Hugo Boss The Scent For Her Eau de Parfum for Women", "Hugo-Boss", "female", "Hugo Boss Boss The Scent For Her"),
    ("Hugo Boss Femme By Boss - 50 ml Eau de Parfum for Women", "Hugo-Boss", "female", "Hugo Boss Femme"),  # not Hugo Woman
    ("Hugo Boss Hugo Man - 125 ml Eau de Toilette for Men", "Hugo-Boss", "male", "Hugo Boss Hugo Man"),
    ("Gucci Guilty Pour Homme EDT Eau de Toilette for Men", "Gucci", "male", "Gucci Guilty Pour Homme"),  # not Eau Pour Homme
    ("JAGUAR Classic EDT For Men 100ml", "Jaguar", "male", "Jaguar Jaguar Classic"),
    ("GUCCI Guilty Absolute EDP 90ml", "Gucci", None, "Gucci Gucci Guilty Absolute"),
    ("Nishane Ani Extrait de Parfum", "Nishane", None, "Nishane Ani"),                                     # extrait by default
    ("Dior Miss Dior Pearl Roller EDP Eau de Parfum For Women", "Dior", "female", None),                  # a roller
    ("Libre - Eau de Parfum", "Yves-Saint-Laurent", None, "Yves Saint Laurent Libre"),
]
bad = 0
for text, page, sex, want in CASES:
    c, why = R.best_match(text, page, sex)
    got = c and c["title"]
    if got != want: bad += 1; print(f"WRONG  {text!r}: {got!r} (want {want!r}) {why}")
print(f"{len(CASES) - bad} of {len(CASES)} right")
sys.exit(1 if bad else 0)
