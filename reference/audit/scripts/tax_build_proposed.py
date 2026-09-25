import json, collections
SRC = r"C:/Users/malha/Desktop/Webapps/perfume-profiler/reference/audit/families.json"
OUT = r"C:/Users/malha/Desktop/Webapps/perfume-profiler/reference/audit/families_proposed.json"
fam = json.load(open(SRC, encoding="utf-8"), object_pairs_hook=collections.OrderedDict)

hints = {
 "woody_amber": "Dry, radiant, slightly sharp 'amberwood' base (Ambroxan and related, stronger synthetics) found in many modern scents; it lasts for hours, and some people can barely smell it.",
 "white_musk": "Clean-laundry musk: soft, slightly soapy, like freshly ironed cotton; many people cannot smell one or more of these musks.",
 "oakmoss_chypre": "Damp, earthy tree moss with a faintly bitter, inky note; the base of classic chypre and fougère scents.",
 "vetiver": "Earthy, rooty wood with a grapefruit-like freshness; some grades smell smoky.",
 "sandalwood_creamy": "Soft, milky-creamy wood with a faint skin-like note; mostly synthetic today, and some people barely smell it.",
 "leather_smoky": "Tanned leather and birch-tar smoke: smoky, tarry and sometimes harsh or animal-like.",
 "aldehydes": "Waxy, soapy, slightly metallic sparkle at the start of classic floral perfumes (the Chanel No. 5 style), often compared to hot-ironed laundry.",
 "white_floral": "Heavy, sweet jasmine, tuberose and orange-blossom scent; some versions have a faint animal-like note from indole.",
 "rose": "Rose petals, from fresh, green and lemony to deep, honeyed and jammy; geranium, a greener rose, belongs here too.",
 "aquatic_marine": "Salty sea air and watery freshness (Calone); unlike citrus, it does not fade quickly.",
 "fruity_sweet": "Ripe or candied fruit: peach, pear, apple, berries, pineapple, cherry-almond and coconut.",
 "spicy_warm": "Sweet, warm kitchen spices: cinnamon, clove, nutmeg.",
 "lavender_aromatic": "Lavender and dry herbs such as rosemary, sage, thyme and mint: fresh and slightly camphor-like, the smell of classic men's fougère and lavender soap.",
 "green_herbal": "Sharp green smell of cut grass, crushed leaves and stems, and galbanum; can be slightly bitter.",
 "animalic": "Animal-gland smells (civet, castoreum, now made synthetically): warm fur with a slightly dirty, fecal or leathery note.",
 "tobacco_honey": "Sweet pipe or cigar tobacco leaf, often with dried-fruit, hay or honey tones.",
 "coffee_gourmand": "Roasted coffee and dark cocoa: toasty and bitter-sweet rather than sugary.",
}

materials = {
 "woody_amber": ["(-)-Ambrox / Ambroxan", "Ambrox Super", "Ambrofix", "Cetalox", "Isoambrox", "(-)-alpha-ambrinol", "ambra aldehyde", "Ambrinal", "Amberketal", "Superambrox", "Fixateur 404", "Grisambrol", "Ambropur", "Ambrocenide", "Ambrostar", "Ysamber K", "Karanal", "Spirambrene", "Okoumal", "Ambermax", "Symroxane", "Ambramone", "Acetarolle", "Belambre", "Trisamber", "Amber Xtreme", "Ambertonic", "Timberol", "Dextro Norlimbanol"],
 "white_musk": ["Galaxolide", "Tonalide / Fixolide", "Celestolide", "Phantolide", "Habanolide / Globalide", "ethylene brassylate", "Helvetolide", "Romandolide", "Serenolide", "Sylkolide", "Edenolide", "Musk xylene"],
 "vanilla_gourmand": ["vanilla abs. Bourbon", "vanillin", "ethyl vanillin", "ethyl maltol", "maltol", "Furaneol", "Cyclotene", "Sotolone"],
 "tonka_coumarin": ["coumarin", "tonka bean abs."],
 "oud_smoky": ["cedarwood oil", "rotundone", "Akigalawood"],
 "oud_animalic": ["oud oil", "castoreum"],
 "oakmoss_chypre": ["oak moss abs.", "tree moss", "Evernyl (Veramoss)", "Orcinyl 3", "methyl everninate", "ethyl everninate", "3-methoxy-2,5-dimethylphenol"],
 "patchouli": ["patchouli oil", "(-)-patchoulol", "nor-patchoulenol", "cypriol oil"],
 "vetiver": ["vetiver Haiti oil", "vetiver oil", "vetiveryl acetate", "khusimone", "3-epi-zizaen-2-one"],
 "sandalwood_creamy": ["sandalwood oil", "(Z)-alpha-santalol", "(Z)-beta-santalol", "Javanol", "Polysantol", "Ebanol", "Sandalore", "Sandranol", "Sandolen"],
 "cedar_dry": ["cedarwood Virginia oil", "cedarwood Texas oil", "cedarwood Atlas oil", "(+)-alpha-cedrol", "cedryl acetate", "Vertofix Coeur (Lignofix, methyl cedryl ketone)", "Cedramber", "Iso E Super", "arborone", "Georgywood", "guaiac wood oil"],
 "leather_smoky": ["6-isobutylquinoline", "birch-tar oil", "cade oil", "castoreum", "labdanum", "styrax oil"],
 "incense_resin": ["olibanum oil", "olibanum resin", "trans-olibanic acids", "Mystikal", "myrrh oil", "opoponax resinoid"],
 "amber_resin": ["labdanum res.", "labdanum abs.", "labdanum oil", "benzoin res."],
 "aldehydes": ["aldehyde C-10 (decanal)", "aldehyde C-11", "aldehyde C-12 lauric (dodecanal)", "aldehyde C-12 MNA", "octanal"],
 "white_floral": ["jasmin abs. (grandiflorum)", "jasmin Sambac abs.", "benzyl acetate", "1H-indole", "cis-jasmone", "methyl jasmonate", "Hedione", "Hedione HC", "Paradisone", "Jasmolactone", "tuberose abs.", "benzyl salicylate", "delta-decalactone", "methyl anthranilate", "neroli oil", "orange flower abs.", "ylang-ylang oil"],
 "rose": ["rose oil", "rose abs.", "2-phenylethanol", "citronellol", "geraniol", "nerol", "rose oxide", "nerol oxide", "rose furan", "geranium oil"],
 "iris_powdery": ["orris butter", "orris root absolute", "orris resinoid", "alpha-irone", "alpha-ionone", "beta-ionone", "Isoraldeine (gamma-methyl ionone)", "Raldeine (beta-isomethyl ionone)", "heliotropin", "anisaldehyde"],
 "citrus_fresh": ["bergamot oil", "lemon oil", "orange oil", "bitter orange oil", "mandarin oil", "grapefruit oil", "lime oil", "citral", "limonene", "linalyl acetate", "petitgrain oil"],
 "aquatic_marine": ["Calone 1951", "seaweed abs.", "Helional (Tropional)", "Azurone"],
 "fruity_sweet": ["gamma-undecalactone (aldehyde C-14)", "gamma-octalactone", "aldehyde C-16", "aldehyde C-18", "raspberry ketone", "ethyl methyl butyrate", "hexyl acetate", "amyl acetate", "Agrumex", "benzaldehyde", "Oxane", "Cassis base 345", "cassis bud abs.", "davana oil"],
 "spicy_warm": ["cinnamon bark oil", "cinnamaldehyde", "cinnamic alcohol", "clove bud oil", "eugenol", "nutmeg oil", "cumin oil"],
 "lavender_aromatic": ["lavender oil", "lavandin oil", "spike oil", "linalool", "linalyl acetate", "lavandulyl acetate", "clary sage oil", "rosemary oil", "thyme oil", "eucalyptus oil", "camphor", "peppermint oil", "spearmint oil", "(-)-menthol", "(-)-(R)-carvone", "basil oil", "laurel leaf oil", "artemisia oil", "cedar leaf oil", "coriander oil", "anise seed oil", "anethol", "tarragon oil", "estragol"],
 "green_herbal": ["galbanum oil", "(3Z)-hex-3-en-1-ol (leaf alcohol)", "cis-3-hexenyl acetate", "Cyclal C (Ligustral)", "styralyl acetate", "violet leaf abs.", "Undecavertol", "Dynascone", "(2E,6Z)-nona-2,6-dienal", "2-isobutyl-3-methoxypyrazine", "Magnolan", "phenylacetaldehyde"],
 "animalic": ["civet", "civetone", "castoreum", "musk tincture", "muscopyridine", "1H-indole", "beeswax abs."],
 "tobacco_honey": ["megastigmatrienones", "beta-damascenone"],
 "coffee_gourmand": ["2-furfurylthiol", "guaiacol", "tetramethylpyrazine", "3-ethyl-2,5-dimethylpyrazine", "2-ethyl-3,5-dimethylpyrazine", "2,3,5-trimethylpyrazine (Chocovan base)"],
 "saffron_leathery": ["saffron oil"],
}

new = collections.OrderedDict()
new["new_muguet_floral"] = {"en": "Lily of the valley (muguet)", "ar": "", "hint_en": "Fresh, sweet lily-of-the-valley floral, light and clean rather than heavy.", "hint_ar": "",
  "materials": ["hydroxycitronellal", "Hydroxycitral", "Lyral", "Lilial", "Bourgeonal", "Cyclamen aldehyde", "Florhydral", "Florol", "cis-Mayol", "Super Muguet"]}
new["new_damascone_dried_fruit"] = {"en": "Rose ketones (damascones: dried fruit)", "ar": "", "hint_en": "Jammy dried-fruit smell of plum, raisin and apple with a rosy note, common in Poison-style florals and many modern men's scents.", "hint_ar": "",
  "materials": ["beta-damascenone", "alpha-damascone", "beta-damascone", "delta-damascone", "isodamascone", "Pomarose"]}
new["new_fresh_spice"] = {"en": "Fresh spices (pepper, cardamom)", "ar": "", "hint_en": "Dry, peppery spices: black and pink pepper, cardamom, ginger; sharp and fresh rather than sweet.", "hint_ar": "",
  "materials": ["black pepper oil", "pink pepper oil", "rotundone", "rotundol", "Akigalawood", "cardamom oil", "ginger oil", "juniper berry oil"]}
new["new_skin_musk"] = {"en": "Warm skin musks", "ar": "", "hint_en": "Warm, soft, powdery musk that smells like skin, sometimes faintly animal-like.", "hint_ar": "",
  "materials": ["(-)-(R)-muscone", "muscenone", "Nirvanolide", "Polvolide", "Exaltolide", "Exaltone", "ambrettolide", "Ambrettolide", "Velvione / Ambrettone", "Globanone", "Aurelione", "Cosmone", "Moxalone", "Nebulone", "Cashmeran", "Musk ketone", "Musk ambrette"]}

notes = collections.OrderedDict([
 ("amber", ["amber_resin", "woody_amber"]),
 ("ambergris", ["woody_amber"]),
 ("ambroxan", ["woody_amber"]),
 ("amberwood", ["woody_amber"]),
 ("woody amber", ["woody_amber"]),
 ("cashmere wood", ["new_skin_musk", "woody_amber"]),
 ("musk", ["white_musk", "new_skin_musk"]),
 ("white musk", ["white_musk"]),
 ("clean linen", ["white_musk", "aldehydes"]),
 ("ambrette", ["new_skin_musk"]),
 ("vanilla", ["vanilla_gourmand"]),
 ("caramel", ["vanilla_gourmand"]),
 ("cotton candy", ["vanilla_gourmand"]),
 ("praline", ["vanilla_gourmand"]),
 ("tonka bean", ["tonka_coumarin"]),
 ("hay", ["tonka_coumarin"]),
 ("almond", ["tonka_coumarin", "fruity_sweet"]),
 ("heliotrope", ["iris_powdery", "tonka_coumarin"]),
 ("oud", ["oud_smoky", "oud_animalic"]),
 ("agarwood", ["oud_smoky", "oud_animalic"]),
 ("oakmoss", ["oakmoss_chypre"]),
 ("moss", ["oakmoss_chypre"]),
 ("chypre", ["oakmoss_chypre", "patchouli"]),
 ("fougere", ["lavender_aromatic", "tonka_coumarin", "oakmoss_chypre"]),
 ("patchouli", ["patchouli"]),
 ("vetiver", ["vetiver"]),
 ("sandalwood", ["sandalwood_creamy"]),
 ("cedar", ["cedar_dry"]),
 ("woody notes", ["cedar_dry", "woody_amber", "sandalwood_creamy", "vetiver", "patchouli"]),
 ("leather", ["leather_smoky", "saffron_leathery"]),
 ("suede", ["leather_smoky", "iris_powdery"]),
 ("birch", ["leather_smoky"]),
 ("incense", ["incense_resin"]),
 ("frankincense", ["incense_resin"]),
 ("olibanum", ["incense_resin"]),
 ("myrrh", ["incense_resin"]),
 ("labdanum", ["amber_resin", "leather_smoky"]),
 ("cistus", ["amber_resin", "leather_smoky"]),
 ("benzoin", ["amber_resin"]),
 ("balsamic", ["amber_resin", "vanilla_gourmand", "tonka_coumarin"]),
 ("oriental", ["amber_resin", "vanilla_gourmand", "tonka_coumarin"]),
 ("aldehydes", ["aldehydes"]),
 ("jasmine", ["white_floral"]),
 ("tuberose", ["white_floral"]),
 ("orange blossom", ["white_floral", "citrus_fresh"]),
 ("neroli", ["white_floral", "citrus_fresh"]),
 ("ylang-ylang", ["white_floral"]),
 ("lily of the valley", ["new_muguet_floral"]),
 ("muguet", ["new_muguet_floral"]),
 ("rose", ["rose", "new_damascone_dried_fruit"]),
 ("geranium", ["rose"]),
 ("violet", ["iris_powdery"]),
 ("iris", ["iris_powdery"]),
 ("orris", ["iris_powdery"]),
 ("powdery notes", ["iris_powdery", "tonka_coumarin", "new_skin_musk"]),
 ("violet leaf", ["green_herbal"]),
 ("bergamot", ["citrus_fresh"]),
 ("lemon", ["citrus_fresh"]),
 ("orange", ["citrus_fresh"]),
 ("mandarin", ["citrus_fresh"]),
 ("grapefruit", ["citrus_fresh"]),
 ("lime", ["citrus_fresh"]),
 ("yuzu", ["citrus_fresh"]),
 ("petitgrain", ["citrus_fresh"]),
 ("sea notes", ["aquatic_marine"]),
 ("marine", ["aquatic_marine"]),
 ("ozonic", ["aquatic_marine"]),
 ("cucumber", ["green_herbal", "aquatic_marine"]),
 ("melon", ["fruity_sweet", "aquatic_marine"]),
 ("peach", ["fruity_sweet"]),
 ("pear", ["fruity_sweet", "white_musk"]),
 ("apple", ["fruity_sweet", "new_damascone_dried_fruit"]),
 ("plum", ["new_damascone_dried_fruit", "fruity_sweet"]),
 ("dried fruits", ["new_damascone_dried_fruit"]),
 ("raspberry", ["fruity_sweet", "iris_powdery"]),
 ("strawberry", ["fruity_sweet", "vanilla_gourmand"]),
 ("cherry", ["fruity_sweet", "vanilla_gourmand"]),
 ("blackcurrant", ["fruity_sweet"]),
 ("cassis", ["fruity_sweet"]),
 ("pineapple", ["fruity_sweet"]),
 ("coconut", ["fruity_sweet"]),
 ("cinnamon", ["spicy_warm"]),
 ("clove", ["spicy_warm"]),
 ("nutmeg", ["spicy_warm"]),
 ("cardamom", ["new_fresh_spice"]),
 ("pepper", ["new_fresh_spice"]),
 ("pink pepper", ["new_fresh_spice"]),
 ("ginger", ["new_fresh_spice"]),
 ("juniper", ["new_fresh_spice", "lavender_aromatic"]),
 ("saffron", ["saffron_leathery", "leather_smoky"]),
 ("lavender", ["lavender_aromatic"]),
 ("rosemary", ["lavender_aromatic"]),
 ("sage", ["lavender_aromatic"]),
 ("clary sage", ["lavender_aromatic"]),
 ("thyme", ["lavender_aromatic"]),
 ("mint", ["lavender_aromatic"]),
 ("anise", ["lavender_aromatic"]),
 ("galbanum", ["green_herbal"]),
 ("green notes", ["green_herbal"]),
 ("civet", ["animalic"]),
 ("castoreum", ["animalic", "leather_smoky"]),
 ("animalic", ["animalic", "oud_animalic"]),
 ("tobacco", ["tobacco_honey"]),
 ("honey", ["tobacco_honey", "rose"]),
 ("beeswax", ["animalic"]),
 ("coffee", ["coffee_gourmand"]),
 ("cacao", ["coffee_gourmand", "vanilla_gourmand"]),
 ("chocolate", ["coffee_gourmand", "vanilla_gourmand"]),
 ("gourmand", ["vanilla_gourmand", "coffee_gourmand"]),
])

out = collections.OrderedDict()
for k, v in fam.items():
    d = collections.OrderedDict()
    d["en"] = v["en"]; d["ar"] = v["ar"]
    d["hint_en"] = hints.get(k, v["hint_en"])
    d["hint_ar"] = v["hint_ar"]
    d["materials"] = materials[k]
    out[k] = d
for k, v in new.items():
    out[k] = collections.OrderedDict((kk, v[kk]) for kk in ("en", "ar", "hint_en", "hint_ar", "materials"))
for w, fs in notes.items():
    for f in fs:
        assert f in out, (w, f)
assert set(hints) <= set(fam) and set(materials) == set(fam)
out["_note_to_families"] = notes
with open(OUT, "w", encoding="utf-8") as fh:
    json.dump(out, fh, ensure_ascii=False, indent=1)
    fh.write("\n")
print("families:", len(out) - 1, "hints changed:", len(hints), "note words:", len(notes))
