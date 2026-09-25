# -*- coding: utf-8 -*-
import json, io, re
ROOT = 'C:/Users/malha/Desktop/Webapps/perfume-profiler/reference'
part = json.load(open(ROOT + '/audit/entries_part4.json', encoding='utf-8'))
fams = set(json.load(open(ROOT + '/audit/families.json', encoding='utf-8')))
guide = io.open(ROOT + '/books/perfumes_the_guide_2018.txt', encoding='utf-8').read()
chem = io.open(ROOT + '/books/scent_and_chemistry_2022.txt', encoding='utf-8').read()
norm = lambda s: re.sub(r'[^0-9a-z]', '', s.lower())
G, C = norm(guide), norm(chem)


def ch(stage, family, frm, to, reason, quote, source, conf, book):
    return {'stage': stage, 'family': family, 'from': frm, 'to': to, 'reason': reason,
            'quote': quote, 'source': source, 'confidence': conf, '_book': book}


def br540():
    return [
        ch('heart', 'vanilla_gourmand', 0, 0.5,
           'Inherited from Baccarat Rouge 540: the Chemistry book reports about 3% ethyl maltol, a caramel-sugar material, and no sugar family is tagged at any stage.',
           'sweetened by an outrageous amount of ca. 3% of ethyl maltol', 'original', 'high', 'chem'),
        ch('drydown', 'vanilla_gourmand', 0, 0.4,
           'Inherited from Baccarat Rouge 540: the Guide describes the whole wear as syrupy, so the sweetness should persist into the drydown.',
           'count on this oriental being a fruity, syrupy experience', 'original', 'medium', 'guide'),
        ch('heart', 'fruity_sweet', 0, 0.4,
           'Inherited from Baccarat Rouge 540: the Guide classes it as "fruity cola" and reads it as fruity, but no fruit family is tagged.',
           'count on this oriental being a fruity, syrupy experience', 'original', 'medium', 'guide'),
        ch('drydown', 'oakmoss_chypre', 0, 0.4,
           'Inherited from Baccarat Rouge 540: Evernyl, the main synthetic oakmoss material, is dosed at about 12%; low confidence because it reads as a dry mineral facet rather than a mossy chypre.',
           'an impactful combination of Ambroxan (8.127, ca. 15%) and Evernyl (7.501, ca. 12%)', 'original', 'low', 'chem'),
    ]


def aventus():
    return [ch('heart', 'spicy_warm', 0, 0.4,
               'Inherited from Creed Aventus: the Guide notes a warm, spicy aura that no tag represents; low confidence because "spicy" may describe the overall radiance rather than a spice note.',
               'an impressive ability to radiate a warm, spicy aura all around', 'original', 'low', 'guide')]


AV_NOTE = "Clone of Creed Aventus, which the Guide reviews (4 stars, \"dry citrus-fruity\"), so the change inherits that review; the clone drops the original's opening leather_smoky 0.4"
BR_NOTE = 'Clone of Baccarat Rouge 540, which the Guide reviews (3 stars, "fruity cola") and the Chemistry book analyses (ca. 15% Ambroxan confirms woody_amber 1.0), so the changes inherit that evidence'

R = {}


def put(i, g=False, c=False, v='', changes=None, note=''):
    R[i] = dict(found_in_guide=g, found_in_chemistry=c, guide_verdict=v, changes=changes or [], note=note)


put('ambresultan', c=True, changes=[
    ch('drydown', 'sandalwood_creamy', 0, 0.4,
       'The Chemistry book reports 3.7% natural sandalwood oil, a base material that lasts into the drydown, where the entry has no sandalwood.',
       'features already 3.7% of natural sandalwood oil', 'chemistry', 'medium', 'chem')],
    note='The Guide does not review it but uses it as the reference niche amber in two other reviews, which supports the amber_resin lead.')

put('santalroyal', g=True, v='1 star, "not sandalwood"; eminently forgettable', changes=[
    ch('heart', 'sandalwood_creamy', 0.7, 0.4,
       'The Guide labels it "not sandalwood" and finds only one synthetic sandalwood molecule, so sandalwood should not read as the lead heart family.',
       'not sandalwood', 'guide', 'medium', 'guide'),
    ch('heart', 'oud_smoky', 0, 0.5,
       'The review describes half the scent as a Western-style synthetic oud accord, but the heart carries no oud.',
       'equal parts of Cool Water and any one of the lamentable so-called ouds', 'guide', 'medium', 'guide'),
    ch('opening', 'lavender_aromatic', 0, 0.4,
       'The other half is compared to Cool Water, an aromatic lavender fougere that no current tag represents; low confidence because this is an analogy, not a named material.',
       'equal parts of Cool Water and any one of the lamentable so-called ouds', 'guide', 'low', 'guide')],
    note='The review contradicts both the name and the pyramid; it describes the drydown only as a "monochrome dusty effect".')

put('tonkaimperiale', g=True, v='2 stars, "coumarin syrup"', changes=[
    ch('drydown', 'tobacco_honey', 0, 0.5,
       'The review says the scent ends as pipe tobacco, but the drydown has no tobacco tag.',
       'it ends up merely like a not very interesting pipe tobacco', 'guide', 'medium', 'guide')],
    note='The review confirms coumarin (tonka) as the lead family.')

put('coromandel', changes=[
    ch('drydown', 'coffee_gourmand', 0.3, 0.5,
       'The Guide names Coromandel (with Lutens Borneo 1834) as one of two landmark chocolate-patchouli scents, so cacao is a co-lead with patchouli rather than a minor accent.',
       'chocolate-patchouli was memorably achieved by Chris Sheldrake twice', 'guide', 'medium', 'guide')],
    note="Not reviewed; the evidence is a passing mention in the Guide's review of Bond-T (Sammarco).")

put('sycomore', note='Not reviewed; the Guide names it a landmark "dry, transparent woody" fragrance, which fits the vetiver and cedar tags.')

put('ambrenuit', c=True, note='The Chemistry book (as "Ambre Nuit Cologne", Dior 2009) describes pink pepper and a "strawberry-tinged rose" on a "transparent sweet, ambery base", which fits the tags.')

put('boisdargent', c=True, changes=[
    ch('drydown', 'woody_amber', 0, 0.7,
       'Compound 8.127 is (-)-Ambrox; the book calls 13.6% an unprecedented dose, yet the entry has no woody amber at any stage.',
       "We find previously unimaginable levels of 13.6% of 8.127 in 'Bois d'Argent'", 'chemistry', 'high', 'chem'),
    ch('heart', 'woody_amber', 0, 0.5,
       'At 13.6% Ambrox is a high-impact, radiant material that is already evident by the heart, not only in the base.',
       "We find previously unimaginable levels of 13.6% of 8.127 in 'Bois d'Argent'", 'chemistry', 'medium', 'chem'),
    ch('drydown', 'patchouli', 0, 0.4,
       'The book names patchouli as one of the four themes of the scent; the entry has no patchouli.',
       "The subtle and gentle orris-honey-patchouli-incense theme of 'Bois d'Argent Cologne'", 'chemistry', 'medium', 'chem')],
    note='The book cites the scent under two labels ("Bois d\'Argent" and "Bois d\'Argent Cologne", both Dior 2004); its 0.8% orris butter and 1.1% incense oil confirm the iris, incense and honey tags.')

put('twilly', g=True, v='5 stars, "ginger tuberose"; an androgynous fougere', changes=[
    ch('drydown', 'tonka_coumarin', 0, 0.5,
       'The review describes sweet hay and calls the result a fougere, and a second review describes Twilly as tuberose in a "coumarin context"; the entry has no tonka.',
       'sweet notes of hay', 'guide', 'high', 'guide'),
    ch('heart', 'green_herbal', 0, 0.4,
       'The review says the ginger and aromatics turn the tuberose herbal, but the heart is tagged as white floral only.',
       'turn tuberose into a herbal note', 'guide', 'medium', 'guide'),
    ch('heart', 'spicy_warm', 0, 0.4,
       'The Guide classes the scent as "ginger tuberose", so ginger runs through the heart rather than only the opening.',
       'Sharp, medicinal ginger', 'guide', 'medium', 'guide')],
    note='The Guide also names Twilly among the few modern scents with a "monumental, innovative" drydown.')

put('fakharblack', note='Clone of YSL Y Eau de Parfum, which the Guide does not review; the Chemistry book reports 3% Operanide (a woody ambergris odorant) in Y EDP, which supports the woody_amber lead, and the tags match the original.')

put('anaabiyedhrouge', changes=br540(), note=BR_NOTE + '; the tags match the original.')
put('amberoudruby', changes=br540(), note=BR_NOTE + "; the clone also lacks the original's heart amber_resin 0.4 and drydown white_musk 0.3.")
put('barakkatrouge', changes=br540(), note=BR_NOTE + "; the clone also lacks the original's heart amber_resin 0.4 and drydown white_musk 0.3.")

for i in ['cdnmilestone', 'supremacynotonly', 'avant', 'bhararaking', 'safariextreme']:
    put(i, changes=aventus(), note=AV_NOTE + '.')
put('fattan', changes=aventus(), note=AV_NOTE + ' and its drydown vanilla_gourmand 0.2.')
put('laventure', changes=aventus(), note=AV_NOTE + ', has no oakmoss_chypre (original 0.4, and its own pyramid omits oakmoss), and moves patchouli from the heart to the drydown.')

put('supremacysilver', note='Clone of Creed Silver Mountain Water, which neither book covers; the tags match the original within 0.1.')
put('layuqawam', note='Clone of Tom Ford Tuscan Leather, which neither book covers; the tags match the original within 0.1.')
put('toscanoleather', note='Clone of Tom Ford Tuscan Leather, which neither book covers; the tags match the original apart from a missing opening green_herbal 0.2.')
put('amberoudgold', note="Clone of Xerjoff Erba Pura, which neither book covers; the clone has no opening fruity_sweet (original 0.6) and half the original's heart fruity_sweet (0.5 vs 1.0), which follows its own pyramid but not the original.")
put('kismetangel', note="Clone of Kilian Angels' Share, which neither book covers; the clone has no heart spicy_warm (original 0.7) and no drydown amber_resin (original 0.4).")
put('liquidbrun', note='Clone of Louis Vuitton Ombre Nomade, which neither book covers; the tags match the original within 0.2.')

put('jeanloweimmortel', changes=[
    ch('drydown', 'woody_amber', 0, 0.8,
       'Inherited from MFK Grand Soir: the Guide says a huge dose of woody-amber material dominates, but the clone has no woody amber at any stage.',
       'using a huge dose of some vile woody-amber material', 'original', 'high', 'guide'),
    ch('heart', 'woody_amber', 0, 0.5,
       'Inherited from MFK Grand Soir: the Guide describes the woody amber as a huge dose that drowns the other notes, so it is present before the drydown.',
       'using a huge dose of some vile woody-amber material', 'original', 'medium', 'guide')],
    note="Clone of MFK Grand Soir, which the Guide reviews (2 stars, \"woody-amber amber\"), so the changes inherit that review; the clone also drops the original's drydown woody_amber 0.3, and the original's own 0.3 is too low on the same evidence.")

put('barakkatsatinoud', changes=[
    ch('heart', 'oud_smoky', 0.7, 0.3,
       'Inherited from MFK Oud Satin Mood: the Guide could not find the oud, yet the heart tags it as a co-lead.',
       'was there supposed to be oud?', 'original', 'medium', 'guide'),
    ch('drydown', 'oud_smoky', 0.6, 0.3,
       'Inherited from MFK Oud Satin Mood: the same review finds no perceptible oud, so the drydown should not present it as a major family.',
       'was there supposed to be oud?', 'original', 'medium', 'guide'),
    ch('heart', 'fruity_sweet', 0, 0.4,
       'Inherited from MFK Oud Satin Mood: the Guide reads an almond biscuit and a fruity rose, and almond and fruit fall under fruity_sweet, which is untagged.',
       'an almond biscuit gourmand and a fruity green rose', 'original', 'medium', 'guide')],
    note='Clone of MFK Oud Satin Mood, which the Guide reviews (1 star, "rose cookie"), so the changes inherit that review; confidence is medium because a clone may carry more oud than the original, and the tags match the original.')

out, problems = [], []
for x in part:
    r = R.get(x['id'], dict(found_in_guide=False, found_in_chemistry=False, guide_verdict='', changes=[], note=''))
    for c in r['changes']:
        if c['family'] not in fams:
            problems.append(('family', x['id'], c['family']))
        cur = x[c['stage']].get(c['family'], 0)
        if abs(cur - c['from']) > 1e-9:
            problems.append(('from', x['id'], c['stage'], c['family'], cur, c['from']))
        book = G if c['_book'] == 'guide' else C
        if norm(c['quote']) not in book:
            problems.append(('quote', x['id'], c['quote']))
        if len(c['quote'].split()) > 15:
            problems.append(('qlen', x['id'], c['quote']))
        if '\u2014' in c['reason'] + c['quote']:
            problems.append(('emdash', x['id']))
    rec = {'id': x['id'], **{k: v for k, v in r.items() if k != 'changes'},
           'changes': [{k: v for k, v in c.items() if k != '_book'} for c in r['changes']]}
    rec = {k: rec[k] for k in ['id', 'found_in_guide', 'found_in_chemistry', 'guide_verdict', 'changes', 'note']}
    if '\u2014' in rec['note'] + rec['guide_verdict']:
        problems.append(('emdash-note', x['id']))
    out.append(rec)
unknown = set(R) - {x['id'] for x in part}
print('records', len(out), 'unknown ids', unknown, 'problems', problems)
json.dump(out, open(ROOT + '/audit/tags_part4.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
