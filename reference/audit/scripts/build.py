import json
A = r"C:/Users/malha/Desktop/Webapps/perfume-profiler/reference/audit/"
ents = json.load(open(A + 'entries_part1.json', encoding='utf-8'))
fams = json.load(open(A + 'families.json', encoding='utf-8'))


def q(s):
    return '"' + s + '"'


def ch(stage, fam, to, reason, quote, source, conf):
    return dict(stage=stage, family=fam, to=to, reason=reason, quote=q(quote), source=source, confidence=conf)


D = {}
D['aventus'] = dict(g=True, c=False, v="4 stars, citrus fougère: good dry citrus-fruity with a warm, spreading aura",
    ch=[ch('drydown', 'spicy_warm', 0.3, "The Guide describes a warm, spicy radiance as the scent's main trait, while no stage carries any spice.", "an impressive ability to radiate a warm, spicy aura all around", 'guide', 'low')],
    n="The Guide calls it a dry citrus-fruity and a citrus fougère, and a second review cites 'Aventus-type dry citrus'; it says nothing about birch smoke, so the leather tags rest on the pyramid alone.")
D['hacivat'] = dict(g=True, c=False, v="2 stars, woody floral: pleasant but holds little interest", ch=[],
    n="The Guide files it as a woody floral and does not mention the pineapple or the mossy base, so it neither confirms nor contradicts the fruity-chypre tags.")
D['erbapura'] = dict(g=False, c=False, v="", ch=[], n="")
D['naxos'] = dict(g=False, c=False, v="", ch=[], n="")
D['layton'] = dict(g=False, c=False, v="", ch=[], n="")
D['herod'] = dict(g=False, c=False, v="", ch=[], n="")
D['althair'] = dict(g=False, c=False, v="", ch=[], n="")
D['delina'] = dict(g=False, c=False, v="", ch=[], n="")
D['br540'] = dict(g=True, c=True, v="3 stars, fruity cola: a fruity, syrupy oriental, less grand than it claims",
    ch=[ch('heart', 'vanilla_gourmand', 0.5, "Scent and Chemistry says the Ambroxan core is sweetened with about 3% ethyl maltol (cooked sugar) and the Guide calls it syrupy, yet no stage carries the sugar family.", "sweetened by an outrageous amount of ca. 3% of ethyl maltol", 'chemistry', 'high'),
        ch('drydown', 'vanilla_gourmand', 0.5, "The ethyl maltol dose is described as a structural part of the main accord, so the sugar should persist beside the Ambroxan in the drydown.", "counterbalanced by an even more extreme amount of ethyl maltol", 'chemistry', 'medium'),
        ch('opening', 'fruity_sweet', 0.5, "The Guide's whole description is of a fruit-punch, syrupy smell, while the opening is tagged only saffron and jasmine.", "count on this oriental being a fruity, syrupy experience", 'guide', 'medium')],
    n="Scent and Chemistry also reports about 12% Evernyl, a synthetic oakmoss material, which would put oakmoss_chypre in the drydown on composition alone; not proposed because neither source describes a mossy smell.")
D['grandsoir'] = dict(g=True, c=False, v="2 stars, woody-amber amber: amber dominated by a harsh woody-amber material",
    ch=[ch('drydown', 'woody_amber', 0.8, "The Guide says a very large dose of a woody-amber aromachemical dominates the scent, but the drydown tags it at 0.3 under resinous amber.", "a huge dose of some vile woody-amber material", 'guide', 'high'),
        ch('heart', 'woody_amber', 0.7, "The Guide describes the woody-amber as loud enough to cover the rest of the composition, so it belongs in the heart as well.", "the kind that smells like rubbing alcohol played at heavy metal concert volume", 'guide', 'high')],
    n="The pyramid lists only resinous amber, benzoin, tonka and vanilla; the Guide's category label names woody-amber first.")
D['oudwood'] = dict(g=False, c=False, v="", ch=[], n="")
D['tobaccovanille'] = dict(g=False, c=False, v="", ch=[], n="")
D['ombreleather'] = dict(g=False, c=False, v="", ch=[], n="")
D['blackorchid'] = dict(g=True, c=False, v="2 stars (EDT review), chocolate cucumber: the original accord now feels dated",
    ch=[ch('heart', 'coffee_gourmand', 0.5, "The Guide names chocolate as the first element of Black Orchid's defining accord, but no stage carries the cacao family.", "The huge chocolate-mothballs-cucumber accord of Black Orchid was a clever idea", 'guide', 'medium')],
    n="The review is filed under the eau de toilette but describes the 2006 original's accord; the 'mothballs' facet fits the patchouli tags and the 'cucumber' facet has no clear family.")
D['sauvageelixir'] = dict(g=False, c=False, v="", ch=[], n="The Guide reviews only the Sauvage EDT and EDP; the Elixir postdates it.")
D['sauvageedp'] = dict(g=True, c=False, v="2 stars, aromatic fougère: a pushy Cool Water imitation", ch=[],
    n="The Guide's aromatic fougère label fits the lavender and woody-amber tags.")
D['bleuedp'] = dict(g=True, c=True, v="3 stars, citrus fougère: Cool Water and Light Blue clichés made refined", ch=[],
    n="Both sources class it as a fougère (Scent and Chemistry lists 'Bleu' 2014 among fougères to study) yet no stage carries lavender, tonka or moss; not proposed because neither names those materials in it.")
D['diorhommeintense'] = dict(g=False, c=False, v="", ch=[],
    n="Both books discuss only the 2005 Dior Homme (orris, incense, myrrh, cocoa-accented base), not the Intense, so nothing was transferred.")
D['yedp'] = dict(g=False, c=True, v="", ch=[],
    n="Scent and Chemistry reports 3% Operanide, a woody-mossy ambergris material, which fits the dominant woody_amber drydown.")
D['libre'] = dict(g=False, c=False, v="", ch=[], n="")
D['blackopium'] = dict(g=True, c=True, v="1 star, fruity floral: a derivative linear clone", ch=[],
    n="The Guide files it as a linear fruity floral and never mentions coffee, while the entry makes coffee the whole heart; Scent and Chemistry only lists it as an oriental to study.")
D['cocomademoiselle'] = dict(g=False, c=True, v="", ch=[],
    n="Scent and Chemistry lists it among classic chypres to study without naming its materials; the Guide mentions it only as founder of a school of intersex orientals.")
D['lemaleelixir'] = dict(g=False, c=False, v="", ch=[],
    n="Scent and Chemistry analyses the 1995 Le Male (lavender over musk and Iso E Super), not the Elixir, so nothing was transferred.")
D['lebeauleparfum'] = dict(g=False, c=False, v="", ch=[], n="")
D['swyintensely'] = dict(g=False, c=False, v="", ch=[],
    n="The Guide reviews only the original Stronger With You; this flanker is not a clone, so nothing was transferred.")
D['adgprofumo'] = dict(g=False, c=False, v="", ch=[], n="")
D['pradalhomme'] = dict(g=False, c=False, v="", ch=[], n="")
D['onemillion'] = dict(g=False, c=True, v="", ch=[],
    n="Scent and Chemistry reports 0.18% Pomarose (apple-rose-dried fruit) set against a blond leather theme, plus Serenolide musk, which fits the rose, spice and leather tags.")
D['eros'] = dict(g=False, c=False, v="", ch=[], n="")
D['cedratboise'] = dict(g=False, c=False, v="", ch=[], n="")
D['arabianstonka'] = dict(g=False, c=False, v="", ch=[], n="")
D['oudforgreatness'] = dict(g=False, c=False, v="", ch=[], n="")
D['sideeffect'] = dict(g=False, c=False, v="", ch=[], n="")
D['interlude'] = dict(g=False, c=False, v="", ch=[], n="")
D['reflection'] = dict(g=False, c=False, v="", ch=[], n="")
D['angelsshare'] = dict(g=False, c=False, v="", ch=[], n="")
D['ombrenomade'] = dict(g=False, c=False, v="", ch=[], n="")
D['santal33'] = dict(g=False, c=False, v="", ch=[], n="")
D['bythefireplace'] = dict(g=True, c=False, v="1 star, clove balsam: a giant scented candle", ch=[],
    n="The Guide's clove-balsam label fits the spicy opening and balsamic drydown.")
D['khamrah'] = dict(g=False, c=False, v="", ch=[], n="")
D['yara'] = dict(g=False, c=False, v="", ch=[], n="")
D['asad'] = dict(g=False, c=False, v="", ch=[], n="")
D['badeealoud'] = dict(g=False, c=False, v="", ch=[],
    n="Notes and tags are identical to Initio Oud for Greatness, but cloneOf is null; check whether the clone link is missing.")
D['cdnim'] = dict(g=False, c=False, v="", ch=[],
    n="The notes mirror Creed Aventus but cloneOf is null; if linked, it would inherit the Guide's Aventus evidence.")
D['amberwood'] = dict(g=False, c=False, v="", ch=[], n="")
D['kalemat'] = dict(g=False, c=False, v="", ch=[], n="")
D['shaghafoud'] = dict(g=False, c=False, v="", ch=[], n="")
D['hawas'] = dict(g=False, c=False, v="", ch=[], n="")
D['9pm'] = dict(g=False, c=False, v="", ch=[], n="")
D['lavieestbelle'] = dict(g=True, c=True, v="3 stars, peach iris: sugary fruity floral with a cheap, sour iris",
    ch=[ch('drydown', 'iris_powdery', 0.4, "The Guide makes iris the note that defines the scent and calls it a linear wall-of-sound perfume, but the entry drops iris entirely after the heart.", "the inclusion of an iris note", 'guide', 'medium'),
        ch('heart', 'white_floral', 0.3, "The Guide says jasmine and orange flower are added only in small amounts, while the heart tags white florals at 0.6.", "adds just enough jasmine and orange flower to distinguish it", 'guide', 'low')],
    n="Scent and Chemistry lists it among classic chypres to study but names no materials; the Guide's 'sugary maltol' supports the high vanilla_gourmand drydown.")
D['goodgirl'] = dict(g=False, c=False, v="", ch=[], n="")
D['alien'] = dict(g=False, c=True, v="", ch=[],
    n="Scent and Chemistry reports 5.1% Ambrox, which fits the woody_amber heart and drydown; the Guide reviews only the Eau Extraordinaire flanker.")
D['hypnoticpoison'] = dict(g=False, c=False, v="", ch=[],
    n="The Guide only mentions it in passing as 'great', with no description of materials.")
D['terredhermes'] = dict(g=False, c=True, v="",
    ch=[ch('drydown', 'oakmoss_chypre', 0.3, "Scent and Chemistry reports 0.5% tree moss, an oakmoss-type material, which no stage carries.", "more recently 0.5% by Jean-Claude Ellena in 'Terre d'Hermès'", 'chemistry', 'medium'),
        ch('drydown', 'woody_amber', 0.2, "Scent and Chemistry gives the full structure as Iso E Super with cedar, vetiver, patchouli, pink pepper and citrus, and names no Ambroxan-type amber.", "a woody concoction of cedarwood, vetiver, and patchouli with a spicy (pink pepper), citrus", 'chemistry', 'low')],
    n="Scent and Chemistry puts Iso E Super at about 50 to 55% of the formula, so cedar_dry rather than vetiver should probably lead the drydown.")
D['gypsywater'] = dict(g=False, c=False, v="", ch=[], n="")
D['vanilla28'] = dict(g=False, c=False, v="", ch=[], n="")
D['sauvageedt'] = dict(g=True, c=True, v="3 stars, citrus fruity: brisk and subdued, better than the EDP", ch=[],
    n="Scent and Chemistry lists 'Sauvage' (2015) among fougères to study, which fits the lavender heart.")
D['fahrenheit'] = dict(g=False, c=True, v="",
    ch=[ch('drydown', 'cedar_dry', 0.5, "Scent and Chemistry reports 25% Iso E Super (compound 6.92/6.93), a long-lasting material the drydown does not carry at all.", "25% of 6.92 / 6.93 already in the earlier woody-violet-leaves creation 'Fahrenheit'", 'chemistry', 'high')],
    n="Scent and Chemistry also confirms the massive violet-leaf (methyl heptine carbonate) dose and the leathery accord, both already tagged.")
D['bleuparfum'] = dict(g=False, c=False, v="", ch=[], n="The Guide reviews only the Bleu de Chanel EDP (3 stars, citrus fougère).")
D['allurehommesport'] = dict(g=False, c=True, v="", ch=[],
    n="Scent and Chemistry reports only 0.11% galbanum in the top, too small to justify a green tag.")
D['armanicode'] = dict(g=False, c=False, v="", ch=[], n="")
D['adgedt'] = dict(g=False, c=False, v="", ch=[],
    n="Scent and Chemistry names 'Aqua di Giò' (1995), which by date is the women's version, and gives only a trace damascone dose.")
D['swy'] = dict(g=True, c=False, v="2 stars, green woody: clichéd masculine with a faint gourmand heart",
    ch=[ch('heart', 'vanilla_gourmand', 0.3, "The Guide places a gourmand accord in the heart, where the entry has none (sweetness starts only in the drydown).", "one in the heart (some sort of gourmand accord)", 'guide', 'medium')],
    n="The Guide also confirms the sage and violet-leaf top, matching the green opening.")
D['lanuit'] = dict(g=False, c=False, v="", ch=[], n="")
D['yedt'] = dict(g=False, c=False, v="", ch=[], n="")
D['myslf'] = dict(g=False, c=False, v="", ch=[], n="")
D['lunarossacarbon'] = dict(g=False, c=False, v="", ch=[], n="")
D['lunarossaocean'] = dict(g=False, c=False, v="", ch=[], n="")
D['erosflame'] = dict(g=False, c=False, v="", ch=[], n="")
D['dylanblue'] = dict(g=False, c=False, v="", ch=[], n="")
D['invictus'] = dict(g=False, c=True, v="", ch=[],
    n="Scent and Chemistry describes it as marine woody ambery with an extreme dose of Amber Xtreme, which fits the woody_amber drydown and aquatic opening.")
D['onemillionelixir'] = dict(g=False, c=False, v="", ch=[], n="")

out = []
errs = []
ids = [e['id'] for e in ents]
assert set(ids) == set(D), (set(ids) ^ set(D))
for e in ents:
    d = D[e['id']]
    chs = []
    for c in d['ch']:
        assert c['family'] in fams, c['family']
        frm = e[c['stage']].get(c['family'], 0)
        wc = len(c['quote'].strip('"').split())
        if wc > 15:
            errs.append((e['id'], c['family'], wc))
        chs.append({'stage': c['stage'], 'family': c['family'], 'from': frm, 'to': c['to'], 'reason': c['reason'],
                    'quote': c['quote'], 'source': c['source'], 'confidence': c['confidence']})
    out.append({'id': e['id'], 'found_in_guide': d['g'], 'found_in_chemistry': d['c'], 'guide_verdict': d['v'],
                'changes': chs, 'note': d['n']})
print('errs', errs)
json.dump(out, open(A + 'tags_part1.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(out))
for o in out:
    for c in o['changes']:
        print(o['id'], c['stage'], c['family'], c['from'], '->', c['to'], c['confidence'], c['source'])
print('guide', sum(o['found_in_guide'] for o in out), 'chem', sum(o['found_in_chemistry'] for o in out),
      'high', sum(any(c['confidence'] == 'high' for c in o['changes']) for o in out))
