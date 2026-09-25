import json, re
A = r'C:/Users/malha/Desktop/Webapps/perfume-profiler/reference/audit/'
B = r'C:/Users/malha/Desktop/Webapps/perfume-profiler/reference/books/'
E = json.load(open(A+'entries_part2.json', encoding='utf-8'))
F = json.load(open(A+'families.json', encoding='utf-8'))
G = open(B+'perfumes_the_guide_2018.txt', encoding='utf-8').read()
C = open(B+'scent_and_chemistry_2022.txt', encoding='utf-8').read()
def norm(s): return re.sub(r'\s+', ' ', s)
GN, CN = norm(G), norm(C)

def ch(stage, fam, frm, to, reason, quote, source, conf):
    d = {'stage': stage, 'family': fam, 'from': frm, 'to': to, 'reason': reason,
         'quote': '"' + quote + '"', 'source': source, 'confidence': conf}
    return d

R = {}
def r(i, fg=False, fc=False, v='', changes=(), note=''):
    R[i] = {'id': i, 'found_in_guide': fg, 'found_in_chemistry': fc, 'guide_verdict': v,
            'changes': list(changes), 'note': note}

r('phantom')
r('lemale', fc=True, changes=[
  ch('drydown', 'white_musk', 0, 0.6,
     'The chemistry book gives the base as 39% musk, the largest share it names, yet the drydown carries no musk tag.',
     'in front of a musk‐ (39%) and Iso E Super', 'chemistry', 'high'),
  ch('drydown', 'cedar_dry', 0, 0.4,
     'The same passage gives 15% Iso E Super in the base, which this site files under dry cedar / Iso E Super.',
     'Iso E Super ( 6.85 , 15%)‐laden fond', 'chemistry', 'high')],
  note='The Guide mentions Le Mâle only as a comparison point in other reviews; the chemistry formula shares apply to the original and may differ in current batches.')
r('lemaleleparfum', note='A flanker, not a clone, so the Le Mâle formula data were not carried over.')
r('ultramale', note='A flanker, not a clone, so the Le Mâle formula data were not carried over.')
r('scandalhomme', note="The Guide's Scandal pour Homme is by Roja Dove, a different perfume.")
r('uomobornroma')
r('uomointense')
r('gentlemanedp', note="The chemistry book's Gentleman is the 1974 original with 35% patchouli oil, a different composition from this 2018 EDP.")
r('gentlemanreserve')
r('explorer')
r('legend', fc=True, note='Chemistry says it centres on Pomarose (dried fruit) and Evernyl (oakmoss, ink), which the fruity and oakmoss tags already show.')
r('bossbottled', fc=True, note="Chemistry names Amberketal with Karanal (woody-amber materials) in 'Boss' (1998), which by launch year is Boss Bottled; this supports the woody_amber tag but gives no dose, and the Guide reviews only the Bottled Tonic flanker.")
r('wantedbynight', note='The Guide reviews only the parent Wanted (1 star, with a strong woody-amber); this is a flanker with a different formula, so nothing was carried over.')
r('mostwantedparfum')
r('badboy')
r('burberryhero')
r('noirextreme', fg=True, v='2 stars; dull cedar-vanilla that smells like a drydown from the start', changes=[
  ch('drydown', 'cedar_dry', 0, 0.5,
     'The Guide names cedarwood as one of the two main materials, but the drydown has no cedar tag.',
     'a limp, lackluster cedarwood-vanilla confection', 'guide', 'medium'),
  ch('opening', 'vanilla_gourmand', 0, 0.5,
     'The Guide says the vanilla drydown character is there from the first spray, while the opening is tagged only citrus, saffron and spice.',
     'feels, right from the start, like an old drydown', 'guide', 'medium')],
  note="The Guide's two-word summary is pistachio and vanilla; the saffron-citrus opening and floral heart rest on the pyramid only.")
r('lostcherry')
r('bitterpeach')
r('tuscanleather')
r('fabulous')
r('neroliportofino', fc=True, note='Chemistry lists it among neroli and orange-blossom soliflores, consistent with the white_floral heart.')
r('h24')
r('terreparfum', note="Both books cover only Terre d'Hermès EDT (Guide: a nutty note; chemistry: about 50% Iso E Super with cedar, vetiver and patchouli); the existing cedar and vetiver tags agree.")
r('maninblack')
r('tygar')
r('woodessence')
r('leaudissey', fc=True, note='Chemistry places it in the Calone marine trend, consistent with the aquatic heart tag.')
r('coolwater', fc=True, changes=[
  ch('opening', 'citrus_fresh', 0, 0.4,
     'Chemistry says Bourdon doubled the dose of dihydromyrcenol in Cool Water and describes that material as citrusy and lime-like; the Guide calls this style not-quite-citrus.',
     'fresh citrusy‐floral, lime‐ and lavender‐like‐smelling dihydromyrcenol', 'chemistry', 'medium'),
  ch('heart', 'lavender_aromatic', 0, 0.5,
     'The formula has a large lavender complex (lavandin, linalyl acetate, linalool) that carries past the top, but lavender is tagged only in the opening.',
     'with 3.5% lavandin oil, 9.5% synthetic linalyl acetate', 'chemistry', 'low'),
  ch('drydown', 'tonka_coumarin', 0, 0.3,
     'Chemistry calls it the archetype modern fougère and defines that accord with tonka (coumarin), which the drydown lacks.',
     'the archetype modern fougère ‘ Cool Water ’', 'chemistry', 'low')],
  note='Neither book mentions Calone or any marine material in Cool Water; both describe a fresh fougère built on dihydromyrcenol and lavender, so the aquatic 0.9 opening rests on the pyramid.')
r('lhommeideal', note='The Guide reviews only the Cologne flanker and says the original has an unusually long-lasting fresh drydown, which does not map to a single family.')
r('theonemen')
r('lightbluemen', fc=True, note="Chemistry lists it as a classic citrus fragrance, consistent with the citrus opening; the Guide's Light Blue mentions refer to the 2001 feminine.")
r('kdg')
r('declaration', fc=True, changes=[
  ch('heart', 'cedar_dry', 0, 0.5,
     'Chemistry gives about 35% Iso E Super, a dose that is present from the heart onward, yet the heart has no cedar tag.',
     'declaring his love for Iso E Super ( 1.45 , ca . 35%)', 'chemistry', 'medium'),
  ch('drydown', 'cedar_dry', 0.5, 0.8,
     'With 35% Iso E Super plus 5% cedarwood oil, cedar should lead the drydown rather than sit below vetiver.',
     "5% of Texas cedarwood oil in the Jean‐Claude Ellena 's woody milestone", 'chemistry', 'medium')],
  note='The Guide reviews only Déclaration Parfum (4 stars) and describes the original as spare and lean.')
r('spicebombextreme')
r('cocomademoiselleintense', note='Both books describe only the original Coco Mademoiselle (Guide: floral oriental joined to a Héritage-type masculine; chemistry: a classic chypre); this Intense flanker is not covered.')
r('chanelno5', fc=True, note="Chemistry gives the 1921 formula (aldehyde overdose, jasmine-rose, 15% civet and 15% Tonquin musk tinctures); the modern EDP is a different formula, so animalic 0.3 was left alone. The Guide reviews only No. 5 L'Eau.")
r('chanceeautendre', note='Only Chance Eau Vive (Guide) and Chance Eau Fraîche (chemistry) appear; neither is this flanker.')
r('jadore', fc=True, note='Chemistry lists it as a classic floral and the Guide calls it an abstract floral in passing; the Guide reviews only two flankers. Tags agree.')
r('missdior', note="The chemistry book's Miss Dior is the 1947 chypre, a different perfume from the 2021 version.")
r('idole', note="The Guide's Idole is Lubin's, a different perfume.")
r('monparis', note="The Guide's Mon Paris Secret is by Jean-Michel Duriez, a different perfume.")
r('libreintense')
r('si', fg=True, v='4 stars; lovely fruity-powdery pastry accord with a balanced drydown', changes=[
  ch('drydown', 'tobacco_honey', 0, 0.3,
     'The Guide hears tobacco with the woods in the background of the development; no stage carries a tobacco tag.',
     'with tobacco and woody notes letting us know that Sì has suave male company', 'guide', 'medium'),
  ch('heart', 'iris_powdery', 0, 0.4,
     "The Guide's two-word summary names powder as one of the two main characters, but no stage has a powder tag; the stage is our inference.",
     'fruity powdery', 'guide', 'low')],
  note='The Guide describes strawberry-like fruit over vanilla custard and a sweet pastry base; the rose heart comes from the pyramid and is not mentioned.')
r('myway')
r('guccibloom', fg=True, v='3 stars; natural-smelling sweet white floral, pleasant', note='The Guide confirms a white floral with honeysuckle (the Rangoon creeper); tags agree.')
r('gucciguilty')
r('floragardenia')
r('paradoxe')
r('pradacandy')
r('burberryher')
r('cloud')
r('cheirosa62')
r('lovefestcherry')
r('scandal')
r('daisy', note="The Guide reviews only Daisy flankers, which say nothing about the original's materials.")
r('flowerbomb', fc=True, note='Chemistry lists it among classic orientals; the Guide names it only as a model for later imitations. Tags agree.')
r('narcisoforher', fc=True, note="Chemistry gives 66% Galaxolide for 'Narcisso Rodriguez Musk For Her' (2003), which supports the white_musk 1.0 tags; the Guide mentions For Her only for its radiance.")
r('chloe', fc=True, note='Chemistry describes a metallic rose (rose oxide) with a cedarwood accord, matching the tags; the Guide reviews only the later EDT, a different formula.')
r('angel', fc=True, note='Both books agree with the tags: patchouli about 20% with vanillin, coumarin and ethyl maltol (chemistry), and a cocoa-patchouli base with a blackcurrant top (Guide). The Guide calls the floral accord intense while the heart has white_floral 0.3.')
r('linterdit')
r('olympea', fg=True, v='2 stars; big amber-toffee start that fades within minutes', changes=[
  ch('opening', 'vanilla_gourmand', 0, 0.6,
     'The Guide says the first minutes are a large amber-toffee chord, while the opening is tagged citrus, white floral and aquatic only.',
     'an unearthly large amber-toffee chord, then dissolves in coughing fits', 'guide', 'medium')],
  note="The Guide says little follows the opening; the pyramid's mandarin and water-jasmine top is not mentioned.")
r('ladymillion', fg=True, fc=True, v='2 stars; air-freshener style peony-grapefruit', note='The Guide gives only a two-line dismissal; chemistry names 0.35% Operanide, a woody-mossy amber material, too small a dose to justify a new tag.')
r('goodgirlblush')
r('woodsage')
r('englishpear')
r('peonysuede')
r('git')
r('smw')
r('millesimeimperial', fc=True, note='Chemistry cites it as the example of damascone-damascenone synergy (fruity-rosy materials), which the heart tags (aquatic, iris) do not show; no dose is given, so this is flagged rather than changed.')
r('viking')
r('aventusforher', note='The Guide reviews only the masculine Aventus (dry citrus-fruity), a different composition, so nothing was carried over.')

ids = [e['id'] for e in E]
assert set(ids) == set(R), (set(ids) ^ set(R))
out, problems = [], []
for e in E:
    o = R[e['id']]
    for c in o['changes']:
        if c['family'] not in F: problems.append((e['id'], 'bad family', c['family']))
        cur = e[c['stage']].get(c['family'], 0)
        if cur != c['from']: problems.append((e['id'], c['family'], 'from mismatch', cur, c['from']))
        q = c['quote'].strip('"')
        if len(q.split()) > 15: problems.append((e['id'], 'quote too long', len(q.split())))
        src = GN if c['source'] == 'guide' else CN
        if norm(q) not in src: problems.append((e['id'], 'quote not found', q))
    for s in [o['note'], o['guide_verdict']] + [c['reason'] for c in o['changes']]:
        if '\u2014' in s or '\u2013' in s: problems.append((e['id'], 'dash'))
    out.append(o)
print('problems:', problems)
json.dump(out, open(A + 'tags_part2.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print('written', len(out))
print('found_guide', sum(o['found_in_guide'] for o in out), 'found_chem', sum(o['found_in_chemistry'] for o in out))
print('entries with changes', sum(bool(o['changes']) for o in out), 'total changes', sum(len(o['changes']) for o in out))
print('entries with high', [o['id'] for o in out if any(c['confidence'] == 'high' for c in o['changes'])])
