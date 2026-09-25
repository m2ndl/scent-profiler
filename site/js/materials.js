/* Material table: ingredient-list (INCI) names to material families and volatility classes.
   Covers the 26 allergens labelled since 2005 and the 56 added by Regulation (EU) 2023/1545
   (labels from 31 July 2026 for new products, 31 July 2028 for all), plus the solvents, filters
   and colourants that appear on perfume labels and carry no scent.
   Rules agreed at the round table (reference/debate/ROUNDTABLE.md):
   - a declared material sets a weight only when it is among the first few fragrance materials;
     further down it records presence only;
   - a new-format label can rule a family OUT only for families whose usual materials are all
     on the allergen list (tonka, oakmoss, patchouli, sandalwood, dry cedar);
   - stage comes from the material's volatility class and is a rule under test, not a fact. */

window.PP_MATERIALS = (function () {

  /* Things on a label that are not scent materials. */
  const IGNORE = [
    /^alcohol/, /^aqua\b|^water\b|^eau\b/, /^parfum\b|^fragrance\b|^aroma\b/, /methoxycinnamate/, /methoxydibenzoylmethane/,
    /ethylhexyl salicylate/, /^bht$/, /^ci\s?\d+/, /^cl\s?\d+/, /tetramethylhydroxypiperidinol/, /hydroxypropyl/, /tocopherol/, /propylene glycol/,
    /^peg[- ]/, /glycerin/, /^disodium/, /benzophenone/, /^ethylhexyl/, /^octocrylene/, /^homosalate/, /^butylene glycol/, /^dipropylene/,
    /^denat/, /^sd alcohol/, /^isopropyl myristate/, /^triethyl citrate/, /^diethyl phthalate/, /^benzyl alcohol$/, /^sodium/, /^citric acid/,
    /^caramel$/, /^may contain/, /^\+\/-/, /^\[/, /^colou?r/, /^yellow \d/, /^red \d/, /^blue \d/, /^green \d/
  ];

  /* stage: opening (top), heart, drydown (base). fams: family weights. allergen: on Annex III; added: on the 2023/1545 list. */
  const MATERIALS = [
    /* the 26 labelled since 2005 */
    { inci: "limonene", aliases: ["d-limonene", "dipentene"], fams: { citrus_fresh: .8 }, stage: "opening", allergen: true },
    { inci: "linalool", fams: { lavender_aromatic: .5, white_floral: .2 }, stage: "opening", allergen: true },
    { inci: "citral", fams: { citrus_fresh: .9 }, stage: "opening", allergen: true },
    { inci: "geraniol", fams: { rose: .7 }, stage: "heart", allergen: true },
    { inci: "citronellol", fams: { rose: .7 }, stage: "heart", allergen: true },
    { inci: "farnesol", fams: { white_floral: .3, muguet_floral: .3 }, stage: "drydown", allergen: true },
    { inci: "hydroxycitronellal", fams: { muguet_floral: .9 }, stage: "heart", allergen: true },
    { inci: "hexyl cinnamal", aliases: ["hexyl cinnamaldehyde"], fams: { white_floral: .7 }, stage: "heart", allergen: true },
    { inci: "amyl cinnamal", aliases: ["amylcinnamaldehyde"], fams: { white_floral: .6 }, stage: "heart", allergen: true },
    { inci: "amylcinnamyl alcohol", fams: { white_floral: .4 }, stage: "heart", allergen: true },
    { inci: "cinnamal", aliases: ["cinnamaldehyde"], fams: { spicy_warm: .9 }, stage: "heart", allergen: true },
    { inci: "cinnamyl alcohol", fams: { spicy_warm: .6, amber_resin: .2 }, stage: "heart", allergen: true },
    { inci: "eugenol", fams: { spicy_warm: .9 }, stage: "heart", allergen: true },
    { inci: "isoeugenol", fams: { spicy_warm: .7, white_floral: .2 }, stage: "heart", allergen: true },
    { inci: "coumarin", fams: { tonka_coumarin: 1 }, stage: "drydown", allergen: true },
    { inci: "alpha-isomethyl ionone", aliases: ["alpha isomethyl ionone", "a-isomethyl ionone"], fams: { iris_powdery: .9 }, stage: "heart", allergen: true },
    { inci: "benzyl benzoate", fams: { amber_resin: .3 }, stage: "drydown", allergen: true },
    { inci: "benzyl salicylate", fams: { white_floral: .3, amber_resin: .3 }, stage: "drydown", allergen: true },
    { inci: "benzyl cinnamate", fams: { amber_resin: .5 }, stage: "drydown", allergen: true },
    { inci: "anise alcohol", aliases: ["anisyl alcohol"], fams: { spicy_warm: .3, muguet_floral: .3 }, stage: "heart", allergen: true },
    { inci: "methyl 2-octynoate", aliases: ["methyl heptine carbonate"], fams: { green_herbal: .8 }, stage: "opening", allergen: true },
    { inci: "evernia prunastri extract", aliases: ["evernia prunastri", "oakmoss extract", "oak moss"], fams: { oakmoss_chypre: 1 }, stage: "drydown", allergen: true },
    { inci: "evernia furfuracea extract", aliases: ["evernia furfuracea", "treemoss extract", "tree moss"], fams: { oakmoss_chypre: .9 }, stage: "drydown", allergen: true },
    { inci: "butylphenyl methylpropional", aliases: ["lilial"], fams: { muguet_floral: .8 }, stage: "heart", allergen: true, banned: true },
    { inci: "hydroxyisohexyl 3-cyclohexene carboxaldehyde", aliases: ["lyral"], fams: { muguet_floral: .8 }, stage: "heart", allergen: true, banned: true },
    /* the 56 added by Regulation 2023/1545 */
    /* Iso E Super sits between dry cedar and the woody ambers; it is filed under cedar so that a label never claims to prove the Ambrox family, which no label can show. */
    { inci: "tetramethyl acetyloctahydronaphthalenes", aliases: ["otne", "iso e super", "iso-e-super", "isocyclemone e"], fams: { cedar_dry: .8, woody_amber: .3 }, stage: "drydown", allergen: true, added: true },
    { inci: "hexamethylindanopyran", aliases: ["hhcb", "galaxolide"], fams: { white_musk: .9 }, stage: "drydown", allergen: true, added: true },
    { inci: "hexadecanolactone", aliases: ["dihydroambrettolide"], fams: { white_musk: .5, skin_musk: .5 }, stage: "drydown", allergen: true, added: true },
    { inci: "acetyl cedrene", aliases: ["methyl cedryl ketone", "vertofix"], fams: { cedar_dry: .6, woody_amber: .3 }, stage: "drydown", allergen: true, added: true },
    { inci: "rose ketones", aliases: ["damascenone", "damascone", "alpha-damascone", "beta-damascone", "delta-damascone", "beta-damascenone"], fams: { damascone_fruit: .8, rose: .3 }, stage: "heart", allergen: true, added: true },
    { inci: "santalol", aliases: ["alpha-santalol", "beta-santalol"], fams: { sandalwood_creamy: .9 }, stage: "drydown", allergen: true, added: true },
    { inci: "santalum album oil", aliases: ["santalum album", "sandalwood oil"], fams: { sandalwood_creamy: .9 }, stage: "drydown", allergen: true, added: true },
    { inci: "trimethylcyclopentenyl methylisopentenol", aliases: ["ebanol"], fams: { sandalwood_creamy: .8 }, stage: "drydown", allergen: true, added: true },
    { inci: "vanillin", fams: { vanilla_gourmand: .9 }, stage: "drydown", allergen: true, added: true },
    { inci: "sclareol", fams: { amber_resin: .7 }, stage: "drydown", allergen: true, added: true },
    { inci: "pogostemon cablin oil", aliases: ["pogostemon cablin", "patchouli oil"], fams: { patchouli: 1 }, stage: "drydown", allergen: true, added: true },
    { inci: "cedrus atlantica oil", aliases: ["cedrus atlantica", "cedarwood atlas oil"], fams: { cedar_dry: .8 }, stage: "drydown", allergen: true, added: true },
    { inci: "juniperus virginiana oil", aliases: ["juniperus virginiana", "cedarwood virginia oil"], fams: { cedar_dry: .8 }, stage: "drydown", allergen: true, added: true },
    { inci: "myroxylon pereirae oil", aliases: ["myroxylon pereirae", "peru balsam", "balsam peru"], fams: { amber_resin: .7, vanilla_gourmand: .3 }, stage: "drydown", allergen: true, added: true },
    { inci: "camphor", fams: { green_herbal: .4, lavender_aromatic: .4 }, stage: "opening", allergen: true, added: true },
    { inci: "carvone", fams: { green_herbal: .6, lavender_aromatic: .2 }, stage: "opening", allergen: true, added: true },
    { inci: "menthol", fams: { green_herbal: .6, lavender_aromatic: .2 }, stage: "opening", allergen: true, added: true },
    { inci: "terpineol", aliases: ["alpha-terpineol"], fams: { lavender_aromatic: .4, green_herbal: .3 }, stage: "heart", allergen: true, added: true },
    { inci: "terpinolene", fams: { green_herbal: .6 }, stage: "opening", allergen: true, added: true },
    { inci: "alpha-terpinene", fams: { green_herbal: .5, citrus_fresh: .2 }, stage: "opening", allergen: true, added: true },
    { inci: "pinene", aliases: ["alpha-pinene", "beta-pinene"], fams: { green_herbal: .6 }, stage: "opening", allergen: true, added: true },
    { inci: "turpentine", aliases: ["turpentine oil"], fams: { green_herbal: .6 }, stage: "opening", allergen: true, added: true },
    { inci: "pinus mugo oil", aliases: ["pinus mugo"], fams: { green_herbal: .6 }, stage: "opening", allergen: true, added: true },
    { inci: "pinus pumila oil", aliases: ["pinus pumila"], fams: { green_herbal: .6 }, stage: "opening", allergen: true, added: true },
    { inci: "anethole", aliases: ["trans-anethole"], fams: { spicy_warm: .3, lavender_aromatic: .3 }, stage: "opening", allergen: true, added: true },
    { inci: "benzaldehyde", fams: { fruity_sweet: .6 }, stage: "opening", allergen: true, added: true },
    { inci: "beta-caryophyllene", aliases: ["caryophyllene"], fams: { spice_fresh: .6 }, stage: "heart", allergen: true, added: true },
    { inci: "salicylaldehyde", fams: { green_herbal: .3 }, stage: "opening", allergen: true, added: true },
    { inci: "methyl salicylate", fams: { green_herbal: .5 }, stage: "opening", allergen: true, added: true },
    { inci: "amyl salicylate", fams: { green_herbal: .3, white_floral: .3 }, stage: "heart", allergen: true, added: true },
    { inci: "dimethyl phenethyl acetate", fams: { fruity_sweet: .4, rose: .3 }, stage: "heart", allergen: true, added: true },
    { inci: "trimethylbenzenepropanol", aliases: ["majantol"], fams: { muguet_floral: .8 }, stage: "heart", allergen: true, added: true },
    { inci: "3-propylidenephthalide", fams: { green_herbal: .6 }, stage: "opening", allergen: true, added: true },
    { inci: "lippia citriodora absolute", aliases: ["lippia citriodora", "verbena absolute"], fams: { citrus_fresh: .6, green_herbal: .3 }, stage: "opening", allergen: true, added: true },
    { inci: "cananga odorata oil", aliases: ["cananga odorata", "ylang ylang oil", "ylang-ylang oil"], fams: { white_floral: .7 }, stage: "heart", allergen: true, added: true },
    { inci: "cinnamomum cassia leaf oil", aliases: ["cinnamomum cassia"], fams: { spicy_warm: .9 }, stage: "heart", allergen: true, added: true },
    { inci: "cinnamomum zeylanicum bark oil", aliases: ["cinnamomum zeylanicum", "cinnamon bark oil"], fams: { spicy_warm: .9 }, stage: "heart", allergen: true, added: true },
    { inci: "citrus aurantium flower oil", aliases: ["citrus aurantium amara flower oil", "neroli oil"], fams: { white_floral: .6, citrus_fresh: .4 }, stage: "opening", allergen: true, added: true },
    { inci: "citrus aurantium peel oil", aliases: ["citrus aurantium amara peel oil", "bitter orange oil", "citrus aurantium dulcis peel oil", "orange peel oil"], fams: { citrus_fresh: .9 }, stage: "opening", allergen: true, added: true },
    { inci: "citrus aurantium bergamia peel oil", aliases: ["citrus bergamia", "bergamot oil"], fams: { citrus_fresh: .9 }, stage: "opening", allergen: true, added: true },
    { inci: "citrus limon peel oil", aliases: ["citrus limon", "lemon peel oil", "lemon oil"], fams: { citrus_fresh: .9 }, stage: "opening", allergen: true, added: true },
    { inci: "cymbopogon oil", aliases: ["lemongrass oil", "cymbopogon citratus", "cymbopogon schoenanthus"], fams: { citrus_fresh: .6, green_herbal: .3 }, stage: "opening", allergen: true, added: true },
    { inci: "eucalyptus globulus oil", aliases: ["eucalyptus globulus", "eucalyptus oil"], fams: { green_herbal: .6, lavender_aromatic: .3 }, stage: "opening", allergen: true, added: true },
    { inci: "eugenia caryophyllus oil", aliases: ["eugenia caryophyllus", "clove oil", "clove bud oil"], fams: { spicy_warm: .9 }, stage: "heart", allergen: true, added: true },
    { inci: "jasmine oil", aliases: ["jasminum grandiflorum", "jasminum sambac", "jasmine extract", "jasminum officinale"], fams: { white_floral: .9 }, stage: "heart", allergen: true, added: true },
    { inci: "laurus nobilis leaf oil", aliases: ["laurus nobilis", "bay leaf oil"], fams: { green_herbal: .5, spicy_warm: .3 }, stage: "heart", allergen: true, added: true },
    { inci: "lavandula oil", aliases: ["lavandula angustifolia", "lavandula hybrida", "lavender oil", "lavandin oil", "lavandula extract"], fams: { lavender_aromatic: .9 }, stage: "opening", allergen: true, added: true },
    { inci: "mentha piperita oil", aliases: ["mentha piperita", "peppermint oil"], fams: { green_herbal: .6, lavender_aromatic: .2 }, stage: "opening", allergen: true, added: true },
    { inci: "mentha viridis leaf oil", aliases: ["mentha viridis", "spearmint oil", "mentha spicata"], fams: { green_herbal: .6, lavender_aromatic: .2 }, stage: "opening", allergen: true, added: true },
    { inci: "narcissus extract", aliases: ["narcissus poeticus", "narcissus absolute"], fams: { white_floral: .4, green_herbal: .3, animalic: .2 }, stage: "heart", allergen: true, added: true },
    { inci: "pelargonium graveolens flower oil", aliases: ["pelargonium graveolens", "geranium oil"], fams: { rose: .5, green_herbal: .3 }, stage: "heart", allergen: true, added: true },
    { inci: "rose flower oil", aliases: ["rosa damascena", "rosa centifolia", "rose extract", "rose absolute", "rosa damascena flower oil"], fams: { rose: .9 }, stage: "heart", allergen: true, added: true },
    { inci: "eugenyl acetate", fams: { spicy_warm: .7 }, stage: "heart", allergen: true, added: true },
    { inci: "geranyl acetate", fams: { rose: .4, citrus_fresh: .3 }, stage: "opening", allergen: true, added: true },
    { inci: "isoeugenyl acetate", fams: { spicy_warm: .6 }, stage: "heart", allergen: true, added: true },
    { inci: "linalyl acetate", fams: { lavender_aromatic: .8 }, stage: "opening", allergen: true, added: true },
    /* sometimes declared voluntarily or under trade names */
    { inci: "ethyl vanillin", fams: { vanilla_gourmand: 1 }, stage: "drydown" },
    { inci: "ethyl maltol", fams: { vanilla_gourmand: .9 }, stage: "drydown" },
    { inci: "dodecahydro-3a,6,6,9a-tetramethylnaphtho[2,1-b]furan", aliases: ["ambroxan", "ambrox", "ambrofix", "cetalox", "ambroxide"], fams: { woody_amber: 1 }, stage: "drydown" },
    { inci: "cashmeran", aliases: ["dpmi"], fams: { woody_amber: .8 }, stage: "drydown" },
    { inci: "methyl dihydrojasmonate", aliases: ["hedione"], fams: { white_floral: .4 }, stage: "heart" },
    { inci: "ethylene brassylate", fams: { white_musk: .8 }, stage: "drydown" },
    { inci: "vetiveria zizanoides root oil", aliases: ["vetiveria zizanoides", "vetiver oil"], fams: { vetiver: .9 }, stage: "drydown" },
    { inci: "boswellia carterii oil", aliases: ["boswellia", "olibanum oil", "frankincense oil"], fams: { incense_resin: .9 }, stage: "drydown" },
    { inci: "styrax benzoin resin extract", aliases: ["styrax benzoin", "benzoin resin"], fams: { amber_resin: .8 }, stage: "drydown" },
    { inci: "cistus ladaniferus", aliases: ["labdanum", "cistus ladaniferus resin"], fams: { amber_resin: .9 }, stage: "drydown" },
    { inci: "vanilla planifolia", aliases: ["vanilla planifolia fruit extract"], fams: { vanilla_gourmand: .9 }, stage: "drydown" },
    { inci: "aquilaria", aliases: ["aquilaria agallocha", "agarwood oil", "oud oil"], fams: { oud_smoky: .7, oud_animalic: .5 }, stage: "drydown" },
    { inci: "crocus sativus", aliases: ["saffron extract"], fams: { saffron_leathery: .8 }, stage: "opening" },
    { inci: "nicotiana", aliases: ["tobacco absolute", "nicotiana tabacum"], fams: { tobacco_honey: .9 }, stage: "drydown" },
    { inci: "coffea arabica", aliases: ["coffee extract"], fams: { coffee_gourmand: .9 }, stage: "heart" },
    { inci: "iris pallida", aliases: ["orris", "iris florentina"], fams: { iris_powdery: .9 }, stage: "heart" }
  ];

  /* Families a NEW-format label can rule out when none of their marker materials is declared. */
  const ABSENCE = {
    tonka_coumarin: ["coumarin"],
    oakmoss_chypre: ["evernia prunastri extract", "evernia furfuracea extract"],
    patchouli: ["pogostemon cablin oil"],
    sandalwood_creamy: ["santalol", "santalum album oil", "trimethylcyclopentenyl methylisopentenol"],
    cedar_dry: ["tetramethyl acetyloctahydronaphthalenes", "acetyl cedrene", "cedrus atlantica oil", "juniperus virginiana oil"]
  };
  /* Families no label can show (their materials are not allergens). Verdicts on these rest on notes and literature. */
  const NEVER_ON_LABEL = ["woody_amber", "oud_smoky", "oud_animalic", "aquatic_marine", "coffee_gourmand", "saffron_leathery", "incense_resin", "leather_smoky", "vetiver", "aldehydes", "animalic", "tobacco_honey"];

  const INDEX = new Map();
  for (const m of MATERIALS) { INDEX.set(m.inci, m); for (const a of (m.aliases || [])) INDEX.set(a, m); }
  const norm = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\([^)]*\)/g, " ").replace(/[*†‡]/g, "").replace(/\s+/g, " ").trim();
  const WEIGHT_BY_RANK = [.9, .8, .7, .6, .5, .4];   /* first six fragrance materials set a weight; the rest are presence only */

  function match(name) {
    const n = norm(name);
    if (!n) return null;
    if (INDEX.has(n)) return INDEX.get(n);
    for (const [k, m] of INDEX) { if (n.includes(k) && k.length >= 6) return m; }
    return null;
  }

  /* Parse a pasted ingredient list. Returns stage weights, presence, format and the parsed items. */
  function parse(text) {
    const raw = String(text || "").replace(/ingredients?\s*:/i, "").split(/[,;•\n]+/).map(s => s.trim()).filter(Boolean);
    const items = [];
    let fragranceIndex = 0;
    for (const r of raw) {
      const n = norm(r);
      if (!n || IGNORE.some(re => re.test(n))) { items.push({ raw: r, ignored: true }); continue; }
      const m = match(r);
      const item = { raw: r, name: n, matched: !!m, index: fragranceIndex, material: m ? m.inci : null, fams: m ? m.fams : null, stage: m ? m.stage : null, allergen: !!(m && m.allergen), added: !!(m && m.added), banned: !!(m && m.banned) };
      items.push(item);
      fragranceIndex++;
    }
    const format = items.some(i => i.added) ? "new" : items.some(i => i.allergen) ? "old" : "unknown";
    const stages = { opening: {}, heart: {}, drydown: {} };
    const presence = new Set();
    for (const it of items) {
      if (!it.matched) continue;
      const w = it.index < WEIGHT_BY_RANK.length ? WEIGHT_BY_RANK[it.index] : 0;
      for (const [f, s] of Object.entries(it.fams)) {
        presence.add(f);
        if (w > 0) stages[it.stage][f] = Math.min(1, Math.round(Math.max(stages[it.stage][f] || 0, w * s) * 100) / 100);
      }
    }
    const absent = [];
    if (format === "new") {
      for (const [f, markers] of Object.entries(ABSENCE)) { if (!items.some(i => i.matched && markers.includes(i.material))) absent.push(f); }
    }
    for (const s of Object.keys(stages)) for (const f of Object.keys(stages[s])) if (stages[s][f] < .15) delete stages[s][f];
    return { items, format, stages, presence: [...presence], absent, unmatched: items.filter(i => !i.ignored && !i.matched).map(i => i.raw), materialsDeclared: items.filter(i => !i.ignored).length };
  }

  return { MATERIALS, IGNORE, ABSENCE, NEVER_ON_LABEL, parse, match, norm };
})();
