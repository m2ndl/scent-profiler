import json, math
POLES = ["anti_erogenous", "stimulating", "erogenous", "narcotic"]
P = {
 "anti_erogenous": {"anti_erogenous": 1.0},
 "stimulating": {"stimulating": 1.0},
 "erogenous": {"erogenous": 1.0},
 "narcotic": {"narcotic": 1.0},
 "fresh": {"anti_erogenous": .5, "stimulating": .5},
 "exalting": {"stimulating": .5, "erogenous": .5},
 "sultry": {"erogenous": .5, "narcotic": .5},
 "calming": {"anti_erogenous": .5, "narcotic": .5},
}
def vec(main, second=None, mix=None):
    v = {k: 0.0 for k in POLES}
    if mix:  # equal blend of two listings
        for c in mix:
            for k, x in P[c].items(): v[k] += x / len(mix)
        return v
    for k, x in P[main].items(): v[k] += x * (1.0 if second is None else 0.75)
    if second:
        for k, x in P[second].items(): v[k] += x * 0.25
    return v
def round05(v):
    # largest-remainder rounding to a 0.05 grid, ties to the larger weight
    units = {k: round(v[k] / 0.05, 6) for k in POLES}
    fl = {k: math.floor(units[k] + 1e-9) for k in POLES}
    short = 20 - sum(fl.values())
    order = sorted(POLES, key=lambda k: (-(units[k] - fl[k]), -v[k]))
    for k in order[:short]: fl[k] += 1
    return {k: round(fl[k] * 0.05, 2) for k in POLES}
def focal(w):
    E = w["erogenous"] - w["anti_erogenous"]; N = w["narcotic"] - w["stimulating"]
    ang = math.degrees(math.atan2(E, N)) % 360  # 0 = narcotic, 90 = erogenous
    names = ["narcotic", "sultry", "erogenous", "exalting", "stimulating", "fresh", "anti_erogenous", "calming"]
    return names[int(((ang + 22.5) % 360) // 45)]

def M(name, cls, pages, second=None, mix=None):
    return {"name": name, "class": cls if not second else f"{cls}, tending {second}", "pages": pages, "_v": vec(cls, second, mix)}

fam = {
"white_musk": ([M("synthetic nitro musks (musk ketone, musk xylol, musk ambrette)", "narcotic", "146-147; 75-76", "sultry")], "low",
 "Jellinek lists the synthetic musks of his day as narcotic (p. 146) tending towards sultry (p. 147) and says they are not close enough to natural musk to count as body-like (pp. 75-76). The editor extends this to the later synthetic musk palette and adds evidence that synthetic musks are not perceived as body-like: few animal descriptors for Exaltolide, acceptance rising with concentration, heavy use in laundry products (pp. 253-254). Excluded: Ambrettolide and Exaltolide, which Jellinek lists as erogenous (p. 145); the editor's evidence contradicts that listing. Today's polycyclic and newer macrocyclic musks are not named in the book, and musk ambrette is banned (p. vii)."),
"vanilla_gourmand": ([M("vanillin", "stimulating", "145, 148, 66", "narcotic"), M("vanilla resinoid", "stimulating", "145")], "medium",
 "Vanillin and vanilla resinoid are listed as stimulating (p. 145); vanillin also has a balsamic-narcotic effect (p. 148), weighted here as a secondary note. Jellinek insists vanillin is stimulating, not balsamic, and that its balsamic reputation comes from the narcotic resins it occurs in (p. 66). Sugar, caramel and praline materials are not covered."),
"tonka_coumarin": ([M("coumarin", "stimulating", "144, 148", "narcotic"), M("tonka resinoid", "exalting", "145")], "medium",
 "Coumarin is stimulating (p. 144) with a balsamic-narcotic note (p. 148); tonka resinoid is exalting (p. 145). Hay perfumes built on coumarin are primarily stimulating, softened by narcotic components (p. 74). Coumarin was one of the materials on which Jellinek's three judges contradicted each other (p. 21)."),
"oakmoss_chypre": ([M("oak moss extract, green (chlorophyll) grades", "stimulating", "145, 148", "calming"), M("oak moss extract, decolorized grades", "stimulating", "145, 148", "exalting")], "medium",
 "Oak moss absolute is stimulating (p. 145); green grades carry a calming note, decolorized grades an exalting tendency (p. 148). In the Chypre accord oak moss is the stimulating component, set against bergamot (calming), jasmine (sultry) and rose (narcotic) (pp. 79, 95). Oak moss was one of the materials on which the judges contradicted each other (p. 21)."),
"patchouli": ([M("patchouli oil", "stimulating", "145, 148", "exalting"), M("patchouli resinoid", "stimulating", "145")], "high",
 "Patchouli oil and resinoid are listed as stimulating (p. 145); the oil has an exalting tendency (p. 148). Jellinek uses small amounts of patchouli as a stimulating contrast to narcotic rose (p. 106)."),
"vetiver": ([M("vetiver oil", "stimulating", "145, 148", "exalting"), M("vetiverol", "stimulating", "145, 148", "fresh"), M("vetiveryl acetate", "stimulating", "145, 148", "fresh")], "high",
 "Vetiver oil is stimulating with an exalting tendency; vetiverol and vetiveryl acetate are stimulating with fresh tendencies (pp. 145, 148). Vetiveryl acetate is used where a sultry note is to be counteracted (p. 98). Judges contradicted each other on vetiveryl acetate (p. 21)."),
"sandalwood_creamy": ([M("santalol", "narcotic", "146, 151", "calming"), M("santalyl acetate", "calming", "146, 151")], "medium",
 "Santalol is narcotic with a calming tendency and its acetate is calming (pp. 146, 151). Excluded: East Indian sandalwood oil, which Jellinek uses as a narcotic component in amber, musk, Fougere and Chypre complexes (pp. 76, 78, 79) but calls stimulating on p. 99. The editor proposes adding sandalwood to the body-odor-like (erogenous) materials because of its kinship with androstenol (p. 249). Later measurements cited by Steiner rate sandalwood oil as calming (pp. 213, 216). Modern synthetic sandalwood materials are not covered."),
"cedar_dry": ([M("cedarwood oil", "stimulating", "145, 148", "narcotic")], "medium",
 "Cedarwood oil is stimulating (p. 145) with a balsamic-narcotic note that contrasts with the main effect (p. 148), weighted as a secondary note. Iso E Super and other modern dry woods are not covered, so this weight describes the cedarwood half of the family only."),
"leather_smoky": ([M("birch tar oil", "exalting", "145, 74"), M("isobutyl quinolin", "stimulating", "144, 148", "exalting")], "medium",
 "Birch tar oil is listed as exalting (p. 145) and described as stimulating in itself (p. 74); isobutyl quinolin is stimulating with an exalting tendency (p. 148). Jellinek's leather perfume type is erogenous (pp. 74-75, 121) because birch tar is combined with castoreum, musk, civet and ambergris; those animal materials belong to the 'animalic' family, not here."),
"incense_resin": ([M("olibanum resinoid (listed twice)", "exalting + calming", "145, 146", None, ["exalting", "calming"])], "conflicting",
 "Olibanum resinoid appears in both the exalting (p. 145) and the calming (p. 146) lists, which sit on opposite sides of the diagram. Elsewhere incense is said to recall the perspiration of brunettes and redheads (p. 40), olibanum gives sultry effects in Opoponax perfumes (p. 77), and its resin oil is refreshing (p. 76). The two listings are averaged, which leaves no net direction; exclude this family from profile computation."),
"amber_resin": ([M("labdanum resinoid", "sultry", "145"), M("ciste labdanum resinoid", "calming", "146"), M("benzoin resinoid", "narcotic", "146, 148", "sultry"), M("balsam tolu", "sultry", "145"), M("styrax resinoid", "sultry", "145")], "high",
 "Labdanum, tolu and styrax resinoids are sultry (p. 145); cistus labdanum resinoid is calming and benzoin resinoid narcotic with a sultry tendency (pp. 146, 148). Labdanum, styrax and tolu are among the materials Jellinek says recall regional skin odors (pp. 40, 44)."),
"aldehydes": ([M("aldehyde C8 (octanal)", "erogenous", "145, 147, 98", "exalting"), M("aldehyde C9 (nonanal)", "erogenous", "145, 147, 98", "exalting"), M("aldehyde C10 (decanal)", "exalting", "145"), M("aldehyde C11 undecylic", "exalting", "145"), M("aldehyde C11 undecylenic", "exalting", "145"), M("methyl nonyl acetaldehyde (C12 MNA)", "exalting", "145"), M("methyl hexyl acetaldehyde", "exalting", "145"), M("nonylenic aldehyde", "exalting", "145"), M("lauric aldehyde (C12)", "sultry", "145, 98")], "high",
 "The fatty aldehydes are, apart from lauric aldehyde, the only aroma chemicals Jellinek calls exalting (p. 98): C8 and C9 are erogenous with exalting tendencies (pp. 145, 147), C10, C11, MNA and related aldehydes exalting (p. 145), and lauric aldehyde sultry (pp. 98, 145). Their erogenous side comes from the fatty-sweaty note (p. 150). The so-called aldehydes C14, C16 and C18 are lactones or esters and are placed under 'fruity_sweet'."),
"white_floral": ([M("jasmine absolute", "sultry", "145"), M("orange blossom absolute", "sultry", "145"), M("tuberose absolute", "narcotic", "146")], "high",
 "Jasmine and orange blossom absolutes are sultry (p. 145), tuberose absolute narcotic (p. 146). Their indol accounts for the erogenous side; indol is erogenous tending towards sultry (pp. 42, 146-147). In the flower summary jasmine and tuberose are classed as both sultry and stimulating (p. 70), and jasmine's effect is shown spanning narcotic to stimulating (p. 161); the Chapter 18 material listing is used because Jellinek says it gives the effect of each material by itself (p. 144)."),
"rose": ([M("rose oil", "narcotic", "146"), M("rose absolute", "narcotic", "146"), M("rose alcohols (geraniol, citronellol, nerol, phenyl ethyl alcohol)", "narcotic", "146-147", "calming")], "high",
 "Rose oil and rose absolute are narcotic (p. 146); the rose alcohols are floral narcotics with a calming tendency (p. 147). Jellinek calls the rose complex almost purely narcotic (p. 54)."),
"iris_powdery": ([M("orris root concrete", "sultry", "145, 41"), M("orris oil liquid", "narcotic", "146-147", "calming"), M("orris resinoid", "narcotic", "146, 148", "calming"), M("ionone and irone", "narcotic", "146-147", "calming"), M("methyl ionone", "stimulating", "145, 148", "narcotic"), M("violet absolute", "narcotic", "146")], "medium",
 "Orris concrete is sultry because of its fatty-sweaty note (pp. 41, 145); liquid orris oil, orris resinoid, ionone and irone are narcotic with calming tendencies (pp. 146-148); violet absolute is narcotic (p. 146). Methyl ionone is stimulating with a floral-narcotic note (pp. 145, 148). Jellinek's own 'powdery' descriptor (delta-methyl ionone) is strongly stimulating (pp. 92, 97), so a version of this family dominated by powdery notes would score higher on stimulating than these weights."),
"citrus_fresh": ([M("lemon oil", "anti_erogenous", "144"), M("lime oil", "anti_erogenous", "144"), M("sweet orange oil", "anti_erogenous", "144"), M("bitter orange oil", "anti_erogenous", "144"), M("bergamot oil", "calming", "73, 92")], "high",
 "Lemon, lime and orange oils are anti-erogenous (refreshing) (p. 144). Bergamot is not in the Chapter 18 list; the text calls it distinctly calming because its refreshing linalyl acetate and terpenes are offset by narcotic linalool (p. 92). Two opposing secondary tendencies are stated but not weighted: terpene-rich oils tend towards narcotic (p. 147), while lemon and orange oils give Eau de Cologne a stimulating effect through citral and decanal (p. 80). Grapefruit is not covered. Refreshing effects are by definition short-lived (pp. 4-5)."),
"fruity_sweet": ([M("aldehyde C14 (peach, undecalactone)", "narcotic", "146-147", "sultry"), M("aldehyde C16 (strawberry, ethyl methyl phenyl glycidate)", "narcotic", "146-147", "sultry"), M("nonalactone (aldehyde C18, coconut)", "exalting", "145"), M("almond (benzaldehyde, bitter almond oil)", "stimulating", "144-145, 148", "narcotic")], "low",
 "Peach and strawberry aldehydes are balsamic narcotics tending towards sultry (pp. 146-147); coconut nonalactone is exalting (p. 145); benzaldehyde and bitter almond oil are stimulating with a floral-narcotic note (p. 148). Two general statements contradict each other and are not weighted: Jellinek says most fruit aromas are erotically indifferent or anti-erogenous (pp. 46-47), and the editor says blackcurrant and tropical fruit notes recall body odor (p. 250). Pineapple and apple materials are not covered."),
"spicy_warm": ([M("cinnamon oil (Ceylon)", "stimulating", "145, 148", "narcotic"), M("cardamom oil", "stimulating", "145, 148", "fresh"), M("pepper oil", "stimulating", "145"), M("nutmeg oil", "stimulating", "145")], "high",
 "Most spice oils are stimulating (pp. 145, 148); cinnamon oil adds a balsamic-narcotic note and cardamom a fresh tendency (p. 148). Jellinek describes the stimulating effect as hard, sharp and activating (pp. 51-52)."),
"lavender_aromatic": ([M("lavender absolute", "calming", "146"), M("lavender oil", "calming", "58, 128", "anti_erogenous"), M("spike lavender oil", "fresh", "144"), M("rosemary oil", "anti_erogenous", "144")], "medium",
 "Lavender absolute is calming (p. 146); lavender oil is not in the Chapter 18 list, but the text calls it calming and more refreshing than the absolute (pp. 58, 128). Spike lavender is fresh and rosemary anti-erogenous (p. 144). Judges contradicted each other on lavender oil (p. 21). Fougere and barbershop accords also draw on 'tonka_coumarin', 'oakmoss_chypre' and 'patchouli'."),
"green_herbal": ([M("sage oil", "fresh", "144"), M("peppermint oil", "anti_erogenous", "144, 149"), M("spearmint oil", "fresh", "144"), M("juniper berry oil", "anti_erogenous", "144"), M("galbanum resinoid", "fresh", "144"), M("violet leaf absolute", "fresh", "73")], "high",
 "Sage, spearmint and galbanum are fresh and peppermint and juniper anti-erogenous (p. 144); menthol is purely anti-erogenous (p. 149). Violet leaf absolute and other leafy notes are fresh (p. 73)."),
"animalic": ([M("civet", "erogenous", "145, 147", "sultry"), M("castoreum", "erogenous", "145, 147", "exalting")], "high",
 "Civet and castoreum are erogenous; civet tends towards sultry and castoreum towards exalting (pp. 145, 147). Jellinek bases their erogenous effect on resemblance to body odors (civet mainly fecal, p. 40) and says such materials become erogenous only alongside other pleasant sensations, at low concentration (p. 44). The editor limits the claim to odors recalling the urogenital and anal regions (p. 250) and notes that civet and castoreum were never used universally (p. 254)."),
"tobacco_honey": ([M("phenyl acetic acid", "erogenous", "145, 44"), M("phenyl acetate esters (methyl, ethyl)", "sultry", "145, 151"), M("para-methyl quinolin", "erogenous", "145, 147, 44", "sultry")], "low",
 "The honey materials are covered: phenyl acetic acid is erogenous (p. 145) with an acidic honey odor (p. 44), and its esters are sultry (pp. 145, 151). Para-methyl quinolin is erogenous tending towards sultry (pp. 145, 147) and its note is found in tobacco (p. 44). Tobacco itself is not classified as a material; tobacco-type perfumes are woody Fougere variants with an exalting effect (p. 100)."),
}

families = {}
for key, (mats, conf, basis) in fam.items():
    vs = [m.pop("_v") for m in mats]
    mean = {k: sum(v[k] for v in vs) / len(vs) for k in POLES}
    w = round05(mean)
    assert abs(sum(w.values()) - 1) < 1e-9, key
    entry = dict(w)
    entry["focal"] = "none" if conf == "conflicting" else focal(w)
    entry["confidence"] = conf
    entry["materials"] = mats
    entry["basis"] = basis
    families[key] = entry

effects = [
 {"key": "anti_erogenous", "name": "Anti-erogenous (refreshing)", "type": "primary", "meaning": "Refreshing, volatile and short-lived; masks body odor and works against the erogenous effect, its opposite pole.", "pages": "4-6, 52, 144", "diagram": "top corner (a); calculation value -2e", "display_en": "refreshing, clean", "jellinek_color": "aquamarine"},
 {"key": "stimulating", "name": "Stimulating (anti-narcotic)", "type": "primary", "meaning": "'Hard' odors that animate, sharpen attention and raise activity; opposite of narcotic.", "pages": "49-52, 122, 144-145", "diagram": "right corner (s); calculation value -2n", "display_en": "sharp, spicy or dry", "jellinek_color": "yellow"},
 {"key": "erogenous", "name": "Erogenous", "type": "primary", "meaning": "Arousing sexual desire; carried by materials whose odor recalls the human body, effective only at low concentration and alongside pleasant impressions.", "pages": "9, 32-45, 145", "diagram": "bottom corner (e); calculation value +2e", "display_en": "animalic, skin-like", "jellinek_color": "red"},
 {"key": "narcotic", "name": "Narcotic", "type": "primary", "meaning": "'Soft' floral or balsamic odors that dull critical thought and increase receptivity to feelings; opposite of stimulating.", "pages": "49-51, 146", "diagram": "left corner (n); calculation value +2n", "display_en": "soft, floral or balsamic", "jellinek_color": "ultramarine"},
 {"key": "fresh", "name": "Fresh", "type": "composite", "components": ["anti_erogenous", "stimulating"], "meaning": "Refreshing plus stimulating; green, herbal and sharp effects.", "pages": "105, 144", "diagram": "side a-s; calculation value -e, -n", "display_en": "fresh, green", "jellinek_color": "leaf green"},
 {"key": "exalting", "name": "Exalting", "type": "composite", "components": ["stimulating", "erogenous"], "meaning": "Simultaneous, long-lasting stimulating and erogenous effect; in Jellinek's view the mark of the successful fashion perfume of his time.", "pages": "89, 98-100, 145", "diagram": "side s-e; calculation value +e, -n", "display_en": "sharp and animalic", "jellinek_color": "orange"},
 {"key": "sultry", "name": "Sultry", "type": "composite", "components": ["erogenous", "narcotic"], "meaning": "Erogenous plus narcotic; heavy, sweet, indolic or balsamic effects.", "pages": "48-49, 55, 145", "diagram": "side e-n; calculation value +e, +n", "display_en": "heavy, sweet", "jellinek_color": "violet"},
 {"key": "calming", "name": "Calming", "type": "composite", "components": ["narcotic", "anti_erogenous"], "meaning": "Narcotic plus refreshing; soft, cool floral and lavender-like effects.", "pages": "55, 105, 146", "diagram": "side n-a; calculation value -e, +n", "display_en": "soft and cool", "jellinek_color": "icy blue"},
]

unmapped = [
 {"key": "woody_amber", "note": "Ambroxan-type woody ambers are not in the book. It covers natural ambergris (erogenous, sultry tendency, pp. 40, 145, 147) and 1940s ambergris bases built on labdanum (pp. 76, 100); the editor says synthetic ambergris substitutes are far less animal (p. 254), so the ambergris placement cannot be carried over."},
 {"key": "oud_smoky", "note": "Agarwood (oud) and the Western oud accord are not mentioned anywhere in the book."},
 {"key": "oud_animalic", "note": "Oud is not mentioned. Animal materials the book does cover are mapped under 'animalic'."},
 {"key": "aquatic_marine", "note": "Calone-type marine notes are not in the book. Jellinek's 'watery' descriptor (dimethyl benzyl carbinol) is calming (pp. 91-92, 146), while the editor links algae and seafood notes to urogenital odor (p. 250); the two contradict each other, so no weight is assigned."},
 {"key": "coffee_gourmand", "note": "Coffee and cacao are not classified; coffee appears only as a lipstick flavor the public rejected (p. 134)."},
 {"key": "saffron_leathery", "note": "Saffron is not mentioned in the book."},
]

out = {
 "source": "Paul Jellinek, The Psychological Basis of Perfumery, translation of the expanded fourth German edition, ed. J. Stephan Jellinek (Blackie Academic & Professional, 1997). Part I reproduces the 1951 first edition.",
 "page_convention": "Printed book page numbers. In reference/books/jellinek_psychological_basis_1997.txt the '=== page N ===' marker equals printed page + 14 in Part I (pp. 3-162) and printed page + 13 in Part II (pp. 165-257). Roman page vii is file page 7.",
 "weight_rule": [
  "Weights are shares over the four primary effects and sum to 1 for each family. They describe direction, not strength: Jellinek had no absolute measure of effect intensity (pp. 20, 158).",
  "The primary source for each material is the Chapter 18 listing (pp. 144-148), which Jellinek says gives each material's effect by itself (p. 144). Earlier chapters are used only for materials that listing omits.",
  "A material placed at a corner of the diagram scores 1.0 on that effect; one placed on a side (fresh, exalting, sultry, calming) scores 0.5 on each of its two effects. This is Jellinek's calculation diagram (p. 123, Table 14.2) scaled to 1.",
  "A named tendency or secondary note (pp. 146-148) gives 0.75 x the main position + 0.25 x the position of the named effect. Tendencies stated only for whole chemical groups, or stated in opposite directions for the same material, are reported in 'basis' but not weighted.",
  "A family weight is the unweighted mean of its listed materials, rounded to 0.05 by largest remainder.",
  "Composite effects are not stored; they are read from the four weights (fresh = anti_erogenous + stimulating, exalting = stimulating + erogenous, sultry = erogenous + narcotic, calming = narcotic + anti_erogenous).",
  "'focal' names the nearest of Jellinek's eight effect positions, using the axes E = erogenous - anti_erogenous and N = narcotic - stimulating (p. 122)."
 ],
 "confidence_levels": {"high": "all named family members are classified in the book, without internal conflict", "medium": "partial coverage, or the judges' contradictory results are reported for a key material", "low": "most of the family's current materials are absent, or general statements conflict", "conflicting": "the book places the key material on opposite sides of the diagram; exclude from profile computation"},
 "diagram": "A square, not a hexagon: anti-erogenous at the top, stimulating right, erogenous bottom, narcotic left; the sides are fresh (a-s), exalting (s-e), sultry (e-n) and calming (n-a). Figures 8.1 (p. 53), 11.1 (p. 89) and 14.7 (p. 123).",
 "effects": effects,
 "families": families,
 "unmapped": unmapped,
}
path = r"C:\Users\malha\Desktop\Webapps\perfume-profiler\reference\audit\jellinek_mapping.json"
with open(path, "w", encoding="utf-8") as fh:
    json.dump(out, fh, ensure_ascii=False, indent=1)
for k, v in families.items():
    print(f"{k:20s} a={v['anti_erogenous']:.2f} s={v['stimulating']:.2f} e={v['erogenous']:.2f} n={v['narcotic']:.2f} focal={v['focal']:15s} {v['confidence']}")
print(len(families), "mapped +", len(unmapped), "unmapped")
