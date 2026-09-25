/* Note-to-family mapper.
   Turns a marketing note pyramid ({top, middle, base} lists of note names, plus optional
   accords) into the profiler's material families, per stage, with weights 0..1.
   Output is always confidence 1 (auto-tagged): it nudges a profile, never drives a
   recommendation. Rules are matched against a normalised note name, exact match first,
   then whole-word containment, in list order, so put specific rules before generic ones. */

window.PP_MAP = (function () {

  /* [pattern, {family: strength}] */
  const RULES = [
    /* woody ambers and their synthetics */
    ["ambroxan", { woody_amber: 1 }], ["ambrox", { woody_amber: 1 }], ["ambrofix", { woody_amber: 1 }],
    ["amberwood", { woody_amber: 1 }], ["amber wood", { woody_amber: 1 }], ["ambermax", { woody_amber: 1 }],
    ["ambrocenide", { woody_amber: 1 }], ["norlimbanol", { woody_amber: 1 }], ["timbersilk", { woody_amber: .9 }],
    ["amber xtreme", { woody_amber: 1 }], ["karanal", { woody_amber: .9 }], ["ambrinol", { woody_amber: .8, animalic: .3 }],
    ["cashmeran", { woody_amber: .8, white_musk: .2 }], ["cashmere wood", { woody_amber: .8 }], ["cashmere musk", { white_musk: .6, woody_amber: .4 }],
    ["iso e super", { cedar_dry: .7, woody_amber: .5 }], ["white amber", { woody_amber: .6, white_musk: .3 }],
    ["ambergris", { woody_amber: .6, amber_resin: .2, animalic: .2 }], ["grey amber", { woody_amber: .6, animalic: .2 }],
    ["amber", { amber_resin: .5, woody_amber: .5 }], ["mineral notes", { woody_amber: .4, aquatic_marine: .2 }],
    ["driftwood", { woody_amber: .6, aquatic_marine: .3 }], ["dry woods", { woody_amber: .5, cedar_dry: .3 }], ["dry wood", { woody_amber: .5, cedar_dry: .3 }],
    ["woody notes", { woody_amber: .5, cedar_dry: .3 }], ["woodsy notes", { woody_amber: .5, cedar_dry: .3 }], ["woods", { woody_amber: .5, cedar_dry: .3 }],
    ["guaiac wood", { woody_amber: .3, incense_resin: .3, cedar_dry: .2 }], ["akigalawood", { patchouli: .4, woody_amber: .4 }],
    ["clearwood", { patchouli: .6, woody_amber: .2 }], ["cypriol", { oud_smoky: .4, vetiver: .3, leather_smoky: .2 }], ["nagarmotha", { oud_smoky: .4, vetiver: .3, leather_smoky: .2 }],
    ["metallic notes", { aldehydes: .4, woody_amber: .3 }], ["ebony", { cedar_dry: .4, woody_amber: .3 }], ["mahogany", { cedar_dry: .4, woody_amber: .3 }],
    /* oud */
    ["hindi oud", { oud_animalic: .8, oud_smoky: .5 }], ["indian oud", { oud_animalic: .8, oud_smoky: .5 }], ["assam oud", { oud_animalic: .8, oud_smoky: .5 }],
    ["cambodian oud", { oud_smoky: .8, oud_animalic: .3 }], ["laotian oud", { oud_smoky: .8, oud_animalic: .3 }], ["thai oud", { oud_smoky: .8, oud_animalic: .3 }],
    ["agarwood", { oud_smoky: .8, oud_animalic: .3 }], ["oud", { oud_smoky: .8, oud_animalic: .3 }], ["oudh", { oud_smoky: .8, oud_animalic: .3 }],
    /* musks */
    ["white musk", { white_musk: .9 }], ["musk", { white_musk: .8 }], ["musk mallow", { white_musk: .5, animalic: .2 }], ["ambrette", { white_musk: .5, animalic: .2 }],
    ["galaxolide", { white_musk: .9 }], ["habanolide", { white_musk: .9 }], ["muscone", { white_musk: .6, animalic: .3 }], ["skin musk", { white_musk: .7, animalic: .2 }],
    ["cotton", { white_musk: .5, aldehydes: .2 }], ["cotton flower", { white_musk: .5, aldehydes: .2 }], ["laundry", { white_musk: .6, aldehydes: .3 }], ["linen", { white_musk: .5, aldehydes: .3 }],
    /* vanilla and gourmand */
    ["vanilla", { vanilla_gourmand: .9 }], ["vanilla absolute", { vanilla_gourmand: .9 }], ["vanilla orchid", { vanilla_gourmand: .8, white_floral: .2 }], ["vanillin", { vanilla_gourmand: 1 }],
    ["ethyl vanillin", { vanilla_gourmand: 1 }], ["bourbon vanilla", { vanilla_gourmand: .9 }], ["madagascar vanilla", { vanilla_gourmand: .9 }], ["tahitian vanilla", { vanilla_gourmand: .9 }],
    ["caramel", { vanilla_gourmand: .8 }], ["praline", { vanilla_gourmand: .7, coffee_gourmand: .3 }], ["sugar", { vanilla_gourmand: .7 }], ["brown sugar", { vanilla_gourmand: .8 }],
    ["cotton candy", { vanilla_gourmand: .8 }], ["candy", { vanilla_gourmand: .7, fruity_sweet: .3 }], ["marshmallow", { vanilla_gourmand: .8 }], ["toffee", { vanilla_gourmand: .8 }],
    ["dulce de leche", { vanilla_gourmand: .8 }], ["burnt sugar", { vanilla_gourmand: .7, incense_resin: .2 }], ["meringue", { vanilla_gourmand: .7 }], ["cake", { vanilla_gourmand: .7 }],
    ["milk", { vanilla_gourmand: .5, sandalwood_creamy: .3 }], ["cream", { vanilla_gourmand: .5, sandalwood_creamy: .3 }], ["condensed milk", { vanilla_gourmand: .7 }],
    ["whipped cream", { vanilla_gourmand: .6 }], ["custard", { vanilla_gourmand: .7 }], ["ice cream", { vanilla_gourmand: .7 }], ["honeycomb", { tobacco_honey: .5, vanilla_gourmand: .3 }],
    ["cupcake", { vanilla_gourmand: .8 }], ["gourmand accord", { vanilla_gourmand: .7, fruity_sweet: .2 }], ["gourmand notes", { vanilla_gourmand: .7 }],
    /* resins, balsams, incense */
    ["benzoin", { amber_resin: .8, vanilla_gourmand: .3 }], ["peru balsam", { amber_resin: .7, vanilla_gourmand: .3 }], ["tolu balsam", { amber_resin: .7, vanilla_gourmand: .3 }],
    ["balsam", { amber_resin: .7 }], ["balsamic notes", { amber_resin: .7 }], ["styrax", { amber_resin: .5, leather_smoky: .3, incense_resin: .2 }],
    ["labdanum", { amber_resin: .9 }], ["cistus", { amber_resin: .9 }], ["rockrose", { amber_resin: .9 }], ["opoponax", { amber_resin: .6, incense_resin: .4 }], ["sweet myrrh", { amber_resin: .6, incense_resin: .4 }],
    ["myrrh", { incense_resin: .6, amber_resin: .3 }], ["frankincense", { incense_resin: .9 }], ["olibanum", { incense_resin: .9 }], ["incense", { incense_resin: .9 }],
    ["elemi", { incense_resin: .5, citrus_fresh: .3 }], ["copal", { incense_resin: .6, amber_resin: .3 }], ["resins", { amber_resin: .6, incense_resin: .3 }], ["resin", { amber_resin: .6, incense_resin: .3 }],
    ["amber resin", { amber_resin: .9 }], ["smoke", { incense_resin: .5, leather_smoky: .5 }], ["smoky notes", { incense_resin: .5, leather_smoky: .5 }], ["burnt", { incense_resin: .5, leather_smoky: .4 }],
    ["ash", { incense_resin: .5, leather_smoky: .4 }], ["gunpowder", { incense_resin: .5, leather_smoky: .3, spicy_warm: .2 }], ["palo santo", { incense_resin: .4, cedar_dry: .3 }],
    ["fir resin", { incense_resin: .4, green_herbal: .4, amber_resin: .3 }], ["fir balsam", { incense_resin: .4, green_herbal: .4, amber_resin: .3 }], ["fir", { green_herbal: .5, incense_resin: .3 }],
    ["pine", { green_herbal: .5, cedar_dry: .3, incense_resin: .2 }], ["pine tree", { green_herbal: .5, cedar_dry: .3 }], ["conifer", { green_herbal: .5, cedar_dry: .3, incense_resin: .2 }],
    /* tonka and hay */
    ["tonka bean", { tonka_coumarin: .9 }], ["tonka", { tonka_coumarin: .9 }], ["coumarin", { tonka_coumarin: 1 }], ["hay", { tonka_coumarin: .6, green_herbal: .2 }],
    ["almond", { fruity_sweet: .5, tonka_coumarin: .3 }], ["bitter almond", { fruity_sweet: .5, tonka_coumarin: .3 }], ["marzipan", { vanilla_gourmand: .5, fruity_sweet: .4 }],
    ["heliotrope", { iris_powdery: .7, vanilla_gourmand: .3, tonka_coumarin: .2 }], ["mimosa", { iris_powdery: .5, white_floral: .3 }],
    /* moss, patchouli, vetiver, woods */
    ["oakmoss", { oakmoss_chypre: .9 }], ["oak moss", { oakmoss_chypre: .9 }], ["tree moss", { oakmoss_chypre: .8 }], ["moss", { oakmoss_chypre: .7, green_herbal: .2 }], ["evernyl", { oakmoss_chypre: .9 }],
    ["chypre accord", { oakmoss_chypre: .7, patchouli: .3 }], ["mossy notes", { oakmoss_chypre: .8 }],
    ["patchouli", { patchouli: .9 }], ["patchouli leaf", { patchouli: .9 }], ["earthy notes", { patchouli: .5, vetiver: .3 }],
    ["vetiver", { vetiver: .9 }], ["vetyver", { vetiver: .9 }], ["haitian vetiver", { vetiver: .9 }],
    ["sandalwood", { sandalwood_creamy: .9 }], ["australian sandalwood", { sandalwood_creamy: .9 }], ["mysore sandalwood", { sandalwood_creamy: .9 }], ["javanol", { sandalwood_creamy: .9 }],
    ["cedar", { cedar_dry: .8 }], ["cedarwood", { cedar_dry: .8 }], ["virginia cedar", { cedar_dry: .9 }], ["atlas cedar", { cedar_dry: .8 }], ["texas cedar", { cedar_dry: .8 }], ["cedar wood", { cedar_dry: .8 }],
    ["pencil shavings", { cedar_dry: .9 }], ["cypress", { cedar_dry: .5, green_herbal: .3 }], ["juniper", { green_herbal: .6, lavender_aromatic: .2 }], ["juniper berries", { green_herbal: .6, lavender_aromatic: .2 }],
    ["papyrus", { cedar_dry: .5, leather_smoky: .2, vetiver: .2 }], ["hinoki", { cedar_dry: .6 }], ["rosewood", { cedar_dry: .3, rose: .2, spicy_warm: .2 }], ["bois de rose", { cedar_dry: .3, rose: .2 }],
    ["teak", { cedar_dry: .5 }], ["oak", { cedar_dry: .4, tonka_coumarin: .2 }], ["cashmere", { woody_amber: .6, white_musk: .3 }], ["bamboo", { green_herbal: .5, cedar_dry: .2 }],
    /* leather and smoke */
    ["birch", { leather_smoky: .8 }], ["birch tar", { leather_smoky: .9 }], ["leather", { leather_smoky: .9 }], ["suede", { leather_smoky: .6, iris_powdery: .2 }],
    ["tar", { leather_smoky: .8 }], ["cade", { leather_smoky: .7, incense_resin: .2 }], ["rubber", { leather_smoky: .6 }], ["gasoline", { leather_smoky: .5, aldehydes: .2 }],
    /* aldehydes and soap */
    ["aldehydes", { aldehydes: 1 }], ["aldehydic notes", { aldehydes: 1 }], ["soap", { aldehydes: .5, white_musk: .5 }], ["soapy notes", { aldehydes: .5, white_musk: .5 }],
    ["lily of the valley", { white_floral: .4, aldehydes: .3, green_herbal: .2 }], ["lily-of-the-valley", { white_floral: .4, aldehydes: .3, green_herbal: .2 }], ["muguet", { white_floral: .4, aldehydes: .3, green_herbal: .2 }],
    ["hedione", { white_floral: .4, citrus_fresh: .2 }], ["ink", { cedar_dry: .3, oakmoss_chypre: .3, leather_smoky: .2, aldehydes: .2 }],
    /* white florals */
    ["jasmine", { white_floral: .9 }], ["jasmine sambac", { white_floral: .9 }], ["tuberose", { white_floral: 1 }], ["orange blossom", { white_floral: .8, citrus_fresh: .2 }],
    ["neroli", { white_floral: .6, citrus_fresh: .4 }], ["gardenia", { white_floral: .9 }], ["ylang-ylang", { white_floral: .7 }], ["ylang ylang", { white_floral: .7 }], ["ylang", { white_floral: .7 }],
    ["lily", { white_floral: .6 }], ["magnolia", { white_floral: .5, citrus_fresh: .2 }], ["frangipani", { white_floral: .7, fruity_sweet: .2 }], ["honeysuckle", { white_floral: .6, tobacco_honey: .2 }],
    ["osmanthus", { white_floral: .4, fruity_sweet: .4, leather_smoky: .2 }], ["narcissus", { white_floral: .4, green_herbal: .3, animalic: .2 }], ["champaca", { white_floral: .7 }],
    ["white flowers", { white_floral: .8 }], ["white floral notes", { white_floral: .8 }], ["stephanotis", { white_floral: .7 }], ["indole", { white_floral: .5, animalic: .4 }],
    ["freesia", { white_floral: .4, green_herbal: .2, fruity_sweet: .2 }], ["peony", { rose: .5, white_floral: .2, fruity_sweet: .2 }], ["lilac", { white_floral: .4, iris_powdery: .3 }],
    ["wisteria", { white_floral: .5 }], ["orchid", { white_floral: .3, vanilla_gourmand: .3 }], ["black orchid", { white_floral: .3, vanilla_gourmand: .3, patchouli: .2 }],
    ["lotus", { aquatic_marine: .3, white_floral: .3 }], ["water lily", { aquatic_marine: .3, white_floral: .3 }], ["floral notes", { white_floral: .4, rose: .3 }], ["flowers", { white_floral: .4, rose: .3 }],
    /* rose and geranium */
    ["rose", { rose: .9 }], ["bulgarian rose", { rose: .9 }], ["turkish rose", { rose: .9 }], ["damask rose", { rose: .9 }], ["rose absolute", { rose: .9 }], ["may rose", { rose: .9 }],
    ["rose oil", { rose: .9 }], ["rose water", { rose: .7 }], ["taif rose", { rose: .9 }], ["geranium", { rose: .5, green_herbal: .3, lavender_aromatic: .2 }],
    /* iris and powder */
    ["iris", { iris_powdery: .9 }], ["orris", { iris_powdery: .9 }], ["orris root", { iris_powdery: .9 }], ["iris pallida", { iris_powdery: .9 }], ["violet", { iris_powdery: .7 }],
    ["violet leaf", { green_herbal: .6, iris_powdery: .3 }], ["violet leaves", { green_herbal: .6, iris_powdery: .3 }], ["powdery notes", { iris_powdery: .8 }], ["powder", { iris_powdery: .8 }],
    ["rice powder", { iris_powdery: .6, white_musk: .3 }], ["talc", { iris_powdery: .8 }], ["lipstick", { iris_powdery: .8 }], ["makeup", { iris_powdery: .7 }], ["carrot seeds", { iris_powdery: .5 }],
    ["carrot", { iris_powdery: .4, green_herbal: .2 }], ["ionone", { iris_powdery: .7 }],
    /* citrus */
    ["bergamot", { citrus_fresh: .9 }], ["calabrian bergamot", { citrus_fresh: .9 }], ["lemon", { citrus_fresh: .9 }], ["sicilian lemon", { citrus_fresh: .9 }], ["lime", { citrus_fresh: .9 }],
    ["grapefruit", { citrus_fresh: .9 }], ["pink grapefruit", { citrus_fresh: .9 }], ["mandarin orange", { citrus_fresh: .8, fruity_sweet: .2 }], ["mandarin", { citrus_fresh: .8, fruity_sweet: .2 }],
    ["tangerine", { citrus_fresh: .8, fruity_sweet: .2 }], ["orange", { citrus_fresh: .8, fruity_sweet: .2 }], ["bitter orange", { citrus_fresh: .8 }], ["blood orange", { citrus_fresh: .8, fruity_sweet: .2 }],
    ["yuzu", { citrus_fresh: .9 }], ["citron", { citrus_fresh: .9 }], ["petitgrain", { citrus_fresh: .5, green_herbal: .4 }], ["lemongrass", { citrus_fresh: .6, green_herbal: .3 }],
    ["verbena", { citrus_fresh: .6, green_herbal: .3 }], ["lemon verbena", { citrus_fresh: .6, green_herbal: .3 }], ["citrus", { citrus_fresh: .9 }], ["citruses", { citrus_fresh: .9 }],
    ["kumquat", { citrus_fresh: .8 }], ["pomelo", { citrus_fresh: .8 }], ["clementine", { citrus_fresh: .8 }], ["citral", { citrus_fresh: .9 }], ["orange peel", { citrus_fresh: .8 }],
    ["lemon peel", { citrus_fresh: .8 }], ["lemon zest", { citrus_fresh: .8 }], ["bergamot leaf"?"bergamot leaf":"", { citrus_fresh: .5, green_herbal: .4 }],
    /* aquatic */
    ["sea notes", { aquatic_marine: .9 }], ["marine notes", { aquatic_marine: .9 }], ["sea water", { aquatic_marine: .9 }], ["sea salt", { aquatic_marine: .6, woody_amber: .2 }],
    ["salt", { aquatic_marine: .5 }], ["salty notes", { aquatic_marine: .5 }], ["water notes", { aquatic_marine: .8 }], ["watery notes", { aquatic_marine: .8 }], ["aquatic notes", { aquatic_marine: .9 }],
    ["calone", { aquatic_marine: 1 }], ["ozonic notes", { aquatic_marine: .7, aldehydes: .2 }], ["ozone", { aquatic_marine: .7 }], ["melon", { fruity_sweet: .5, aquatic_marine: .4 }],
    ["watermelon", { fruity_sweet: .5, aquatic_marine: .4 }], ["cucumber", { green_herbal: .5, aquatic_marine: .4 }], ["rain", { aquatic_marine: .6, green_herbal: .2 }], ["dew", { aquatic_marine: .5, green_herbal: .3 }],
    ["seaweed", { aquatic_marine: .6, green_herbal: .3 }], ["algae", { aquatic_marine: .6, green_herbal: .3 }], ["ice", { aquatic_marine: .4, green_herbal: .2 }],
    /* fruit */
    ["pineapple", { fruity_sweet: .9 }], ["apple", { fruity_sweet: .8 }], ["green apple", { fruity_sweet: .7, green_herbal: .3 }], ["red apple", { fruity_sweet: .8 }], ["pear", { fruity_sweet: .8 }],
    ["black currant", { fruity_sweet: .8, green_herbal: .2 }], ["blackcurrant", { fruity_sweet: .8, green_herbal: .2 }], ["cassis", { fruity_sweet: .8, green_herbal: .2 }],
    ["raspberry", { fruity_sweet: .8 }], ["strawberry", { fruity_sweet: .8 }], ["blackberry", { fruity_sweet: .8 }], ["blueberry", { fruity_sweet: .8 }], ["cherry", { fruity_sweet: .8 }],
    ["plum", { fruity_sweet: .8 }], ["peach", { fruity_sweet: .8 }], ["apricot", { fruity_sweet: .8 }], ["mango", { fruity_sweet: .8 }], ["passionfruit", { fruity_sweet: .8 }], ["passion fruit", { fruity_sweet: .8 }],
    ["lychee", { fruity_sweet: .8 }], ["litchi", { fruity_sweet: .8 }], ["fig", { green_herbal: .5, fruity_sweet: .3, sandalwood_creamy: .2 }], ["fig leaf", { green_herbal: .7 }],
    ["coconut", { fruity_sweet: .6, vanilla_gourmand: .3 }], ["dried fruits", { fruity_sweet: .7, tobacco_honey: .2 }], ["red berries", { fruity_sweet: .8 }], ["berries", { fruity_sweet: .8 }],
    ["fruity notes", { fruity_sweet: .8 }], ["fruits", { fruity_sweet: .8 }], ["tropical fruits", { fruity_sweet: .8 }], ["exotic fruits", { fruity_sweet: .8 }], ["guava", { fruity_sweet: .8 }],
    ["papaya", { fruity_sweet: .7 }], ["banana", { fruity_sweet: .7, vanilla_gourmand: .2 }], ["grape", { fruity_sweet: .7 }], ["quince", { fruity_sweet: .7 }], ["rhubarb", { green_herbal: .5, fruity_sweet: .4 }],
    ["pomegranate", { fruity_sweet: .7 }], ["dates", { fruity_sweet: .6, vanilla_gourmand: .3, amber_resin: .2 }], ["date", { fruity_sweet: .6, vanilla_gourmand: .3 }], ["raisin", { fruity_sweet: .6, tobacco_honey: .2 }],
    ["prune", { fruity_sweet: .6, tobacco_honey: .2 }], ["kiwi", { fruity_sweet: .7, green_herbal: .2 }], ["nectarine", { fruity_sweet: .8 }], ["champagne", { fruity_sweet: .4, aldehydes: .3 }],
    ["rum", { fruity_sweet: .4, vanilla_gourmand: .3, tobacco_honey: .2 }], ["cognac", { fruity_sweet: .4, spicy_warm: .3, vanilla_gourmand: .2 }], ["whiskey", { fruity_sweet: .3, tobacco_honey: .3, tonka_coumarin: .2 }],
    ["whisky", { fruity_sweet: .3, tobacco_honey: .3, tonka_coumarin: .2 }], ["bourbon", { fruity_sweet: .3, vanilla_gourmand: .3, tobacco_honey: .2 }], ["wine", { fruity_sweet: .5, spicy_warm: .2 }],
    ["gin", { green_herbal: .5, lavender_aromatic: .2, citrus_fresh: .2 }], ["red fruits", { fruity_sweet: .8 }], ["cassis leaf"?"cassis leaf":"", { green_herbal: .6, fruity_sweet: .3 }],
    /* spices */
    ["cinnamon", { spicy_warm: .9 }], ["cinnamon bark", { spicy_warm: .9 }], ["cardamom", { spice_fresh: .8 }], ["black pepper", { spice_fresh: .8 }], ["pepper", { spice_fresh: .8 }],
    ["pink pepper", { spice_fresh: .6, rose: .2 }], ["sichuan pepper", { spice_fresh: .7, citrus_fresh: .2 }], ["nutmeg", { spicy_warm: .8 }], ["clove", { spicy_warm: .8 }], ["cloves", { spicy_warm: .8 }],
    ["ginger", { spice_fresh: .6, citrus_fresh: .3 }], ["star anise", { spicy_warm: .5, lavender_aromatic: .2, green_herbal: .2 }], ["anise", { spicy_warm: .5, lavender_aromatic: .2 }],
    /* families added after the taxonomy audit */
    ["rose ketones", { damascone_fruit: .8, rose: .3 }], ["damascone", { damascone_fruit: .9 }], ["damascenone", { damascone_fruit: .9 }], ["dried fruits", { fruity_sweet: .5, damascone_fruit: .5 }],
    ["lily of the valley", { muguet_floral: .9 }], ["lily-of-the-valley", { muguet_floral: .9 }], ["muguet", { muguet_floral: .9 }], ["hydroxycitronellal", { muguet_floral: .9 }], ["lilial", { muguet_floral: .8 }],
    ["ambrette", { skin_musk: .6, white_musk: .3 }], ["musk mallow", { skin_musk: .6, white_musk: .3 }], ["muscone", { skin_musk: .8 }], ["skin musk", { skin_musk: .8 }], ["animalic musk", { skin_musk: .7, animalic: .3 }],
    ["licorice", { spicy_warm: .4, vanilla_gourmand: .3, tonka_coumarin: .2 }], ["liquorice", { spicy_warm: .4, vanilla_gourmand: .3, tonka_coumarin: .2 }], ["cumin", { spicy_warm: .6, animalic: .4 }],
    ["coriander", { spicy_warm: .5, green_herbal: .3 }], ["spices", { spicy_warm: .8 }], ["spicy notes", { spicy_warm: .8 }], ["warm spices", { spicy_warm: .9 }], ["oriental spices", { spicy_warm: .8 }],
    ["bay leaf", { green_herbal: .5, spicy_warm: .3 }], ["laurel", { green_herbal: .5, spicy_warm: .3 }], ["immortelle", { tobacco_honey: .5, spicy_warm: .3, amber_resin: .3 }],
    ["helichrysum", { tobacco_honey: .5, spicy_warm: .3, amber_resin: .3 }], ["everlasting flower", { tobacco_honey: .5, spicy_warm: .3 }], ["maple syrup", { vanilla_gourmand: .6, tobacco_honey: .4 }],
    ["saffron", { saffron_leathery: .9 }], ["turmeric", { spicy_warm: .6 }], ["chili", { spicy_warm: .7 }], ["chili pepper", { spicy_warm: .7 }], ["curry", { spicy_warm: .7, animalic: .2 }],
    ["fennel", { lavender_aromatic: .4, spicy_warm: .3 }], ["caraway", { spicy_warm: .6 }], ["cinnamon leaf", { spicy_warm: .7 }],
    /* aromatics and herbs */
    ["lavender", { lavender_aromatic: .9 }], ["lavandin", { lavender_aromatic: .9 }], ["fougere accord", { lavender_aromatic: .7, tonka_coumarin: .4, oakmoss_chypre: .2 }],
    ["aromatic notes", { lavender_aromatic: .7, green_herbal: .3 }], ["rosemary", { green_herbal: .5, lavender_aromatic: .4 }], ["thyme", { green_herbal: .6, lavender_aromatic: .3 }],
    ["clary sage", { green_herbal: .6, lavender_aromatic: .3 }], ["sage", { green_herbal: .6, lavender_aromatic: .3 }], ["basil", { green_herbal: .7, lavender_aromatic: .2 }],
    ["tarragon", { green_herbal: .6, lavender_aromatic: .2 }], ["artemisia", { green_herbal: .6, lavender_aromatic: .3 }], ["wormwood", { green_herbal: .6, lavender_aromatic: .3 }],
    ["mint", { green_herbal: .6, lavender_aromatic: .2 }], ["peppermint", { green_herbal: .6, lavender_aromatic: .2 }], ["spearmint", { green_herbal: .6, lavender_aromatic: .2 }],
    ["eucalyptus", { green_herbal: .5, lavender_aromatic: .3 }], ["tea", { green_herbal: .5, tobacco_honey: .2 }], ["green tea", { green_herbal: .6, citrus_fresh: .2 }], ["black tea", { green_herbal: .4, tobacco_honey: .3, leather_smoky: .2 }],
    ["white tea", { green_herbal: .5, white_musk: .2 }], ["earl grey", { green_herbal: .4, citrus_fresh: .4 }], ["mate", { green_herbal: .6, tobacco_honey: .2 }], ["oregano", { green_herbal: .6, spicy_warm: .3 }],
    ["chamomile", { lavender_aromatic: .4, green_herbal: .3 }], ["camphor", { green_herbal: .5, lavender_aromatic: .3 }], ["herbal notes", { green_herbal: .7, lavender_aromatic: .3 }], ["herbs", { green_herbal: .7 }],
    /* greens */
    ["green notes", { green_herbal: .9 }], ["grass", { green_herbal: .8 }], ["cut grass", { green_herbal: .8 }], ["leaves", { green_herbal: .7 }], ["green leaves", { green_herbal: .8 }],
    ["ivy", { green_herbal: .7 }], ["tomato leaf", { green_herbal: .8 }], ["galbanum", { green_herbal: .9 }], ["blackcurrant leaf", { green_herbal: .6, fruity_sweet: .3 }],
    ["stems", { green_herbal: .7 }], ["vine", { green_herbal: .6 }], ["green accord", { green_herbal: .8 }],
    /* animalic, honey, tobacco */
    ["civet", { animalic: .9 }], ["castoreum", { animalic: .8, leather_smoky: .3 }], ["animalic notes", { animalic: .9 }], ["animal notes", { animalic: .9 }], ["hyraceum", { animalic: .9 }],
    ["honey", { tobacco_honey: .8, animalic: .2 }], ["beeswax", { tobacco_honey: .6, amber_resin: .3 }], ["tobacco", { tobacco_honey: .9 }], ["tobacco leaf", { tobacco_honey: .9 }],
    ["tobacco blossom", { tobacco_honey: .7, white_floral: .2 }], ["pipe tobacco", { tobacco_honey: .9, vanilla_gourmand: .2 }], ["cigar", { tobacco_honey: .8, leather_smoky: .2 }],
    /* coffee, cacao, nuts */
    ["coffee", { coffee_gourmand: .9 }], ["coffee beans", { coffee_gourmand: .9 }], ["espresso", { coffee_gourmand: .9 }], ["cacao", { coffee_gourmand: .8 }], ["cocoa", { coffee_gourmand: .8 }],
    ["chocolate", { coffee_gourmand: .7, vanilla_gourmand: .3 }], ["dark chocolate", { coffee_gourmand: .8 }], ["hazelnut", { vanilla_gourmand: .5, coffee_gourmand: .3 }], ["nuts", { tonka_coumarin: .4, coffee_gourmand: .3 }],
    ["nutty notes", { tonka_coumarin: .4, coffee_gourmand: .3 }], ["chestnut", { vanilla_gourmand: .4, coffee_gourmand: .3 }], ["pistachio", { tonka_coumarin: .4, fruity_sweet: .3 }], ["walnut", { tonka_coumarin: .4, coffee_gourmand: .2 }],
    ["peanut", { tonka_coumarin: .4, coffee_gourmand: .2 }], ["sesame", { tonka_coumarin: .4, sandalwood_creamy: .2 }],
    /* gaps found by running the mapper over the verified catalogue's own note lists */
    ["guaiac", { woody_amber: .3, incense_resin: .3, cedar_dry: .2 }], ["carnation", { spicy_warm: .5, white_floral: .3, rose: .2 }], ["myrtle", { green_herbal: .5, lavender_aromatic: .3, citrus_fresh: .2 }],
    ["hyacinth", { green_herbal: .5, white_floral: .4 }], ["flint", { aldehydes: .4, woody_amber: .3, cedar_dry: .2 }], ["davana", { fruity_sweet: .6, green_herbal: .2 }], ["cetalox", { woody_amber: 1 }],
    ["fruit basket", { fruity_sweet: .9 }], ["tropical fruit", { fruity_sweet: .8 }], ["red fruit", { fruity_sweet: .8 }], ["truffle", { patchouli: .4, animalic: .3 }],
    ["pelargonium", { rose: .5, green_herbal: .3 }], ["olive blossom", { white_floral: .5, green_herbal: .2 }], ["olive tree", { green_herbal: .5, cedar_dry: .3 }], ["coal", { incense_resin: .4, leather_smoky: .4, aldehydes: .2 }],
    ["pepperwood", { spicy_warm: .6, cedar_dry: .3 }], ["kulfi", { vanilla_gourmand: .7, sandalwood_creamy: .2, spicy_warm: .2 }], ["griotte", { fruity_sweet: .8 }], ["angelica", { green_herbal: .5, white_musk: .2 }],
    ["sclarene", { aldehydes: .6, woody_amber: .3 }], ["pimento", { spicy_warm: .8 }], ["datura", { white_floral: .7 }], ["rangoon creeper", { white_floral: .6 }], ["sweet pea", { white_floral: .5, rose: .2 }],
    ["oolong", { green_herbal: .5, white_floral: .2 }], ["oolong tea", { green_herbal: .5, white_floral: .2 }], ["marigold", { green_herbal: .5, white_floral: .3 }], ["buchu", { green_herbal: .6, fruity_sweet: .3 }],
    ["cyclamen", { white_floral: .4, green_herbal: .3, aquatic_marine: .2 }], ["sapodilla", { fruity_sweet: .7 }], ["fig tree", { green_herbal: .5, fruity_sweet: .3 }], ["cannabis", { green_herbal: .6, incense_resin: .2 }],
    ["tolu", { amber_resin: .7 }], ["bulrush", { green_herbal: .5, aquatic_marine: .3 }], ["sycamore wood", { cedar_dry: .5 }], ["sycamore", { cedar_dry: .5 }], ["creamy notes", { vanilla_gourmand: .4, sandalwood_creamy: .4 }],
    ["sweet notes", { vanilla_gourmand: .5, fruity_sweet: .3 }], ["candied fruits", { fruity_sweet: .7, vanilla_gourmand: .4 }], ["green mango", { fruity_sweet: .5, green_herbal: .5 }], ["mate", { green_herbal: .6, tobacco_honey: .2 }],
    ["osmanthus absolute", { white_floral: .4, fruity_sweet: .4, leather_smoky: .2 }], ["ambrette seeds", { white_musk: .5, animalic: .2 }], ["cashmere wood", { woody_amber: .8 }], ["tea leaves", { green_herbal: .5 }]
  ].filter(r => r[0]);

  /* Whole-perfume accords (Fragrantica-style names) as a floor under the note-derived weights. */
  const ACCORDS = {
    woody: { woody_amber: .5, cedar_dry: .3 }, amber: { amber_resin: .5, woody_amber: .4 }, "warm spicy": { spicy_warm: .7 }, "fresh spicy": { spicy_warm: .4, citrus_fresh: .3 },
    musky: { white_musk: .8 }, powdery: { iris_powdery: .8 }, sweet: { vanilla_gourmand: .5, fruity_sweet: .3 }, vanilla: { vanilla_gourmand: .9 }, oud: { oud_smoky: .8 },
    smoky: { incense_resin: .5, leather_smoky: .5 }, leather: { leather_smoky: .9 }, animalic: { animalic: .8 }, citrus: { citrus_fresh: .9 }, aromatic: { lavender_aromatic: .7, green_herbal: .3 },
    "white floral": { white_floral: .9 }, floral: { white_floral: .4, rose: .3 }, rose: { rose: .9 }, iris: { iris_powdery: .8 }, violet: { iris_powdery: .7 }, tuberose: { white_floral: .9 },
    "yellow floral": { white_floral: .6 }, aquatic: { aquatic_marine: .9 }, marine: { aquatic_marine: .9 }, ozonic: { aquatic_marine: .7, aldehydes: .2 }, salty: { aquatic_marine: .6 },
    fruity: { fruity_sweet: .8 }, tropical: { fruity_sweet: .7 }, cherry: { fruity_sweet: .8 }, coconut: { fruity_sweet: .6, vanilla_gourmand: .3 }, almond: { fruity_sweet: .5, tonka_coumarin: .3 },
    green: { green_herbal: .8 }, herbal: { green_herbal: .6, lavender_aromatic: .3 }, earthy: { patchouli: .5, vetiver: .3 }, mossy: { oakmoss_chypre: .8 }, patchouli: { patchouli: .9 },
    vetiver: { vetiver: .9 }, tobacco: { tobacco_honey: .9 }, honey: { tobacco_honey: .7 }, coffee: { coffee_gourmand: .9 }, cacao: { coffee_gourmand: .8 }, caramel: { vanilla_gourmand: .8 },
    lavender: { lavender_aromatic: .9 }, aldehydic: { aldehydes: .9 }, soapy: { aldehydes: .5, white_musk: .5 }, balsamic: { amber_resin: .8 }, "soft spicy": { spicy_warm: .5 },
    cinnamon: { spicy_warm: .8 }, nutty: { tonka_coumarin: .4, coffee_gourmand: .3 }, milky: { vanilla_gourmand: .4, sandalwood_creamy: .4 }, lactonic: { vanilla_gourmand: .4, fruity_sweet: .4, sandalwood_creamy: .2 },
    beeswax: { tobacco_honey: .6, amber_resin: .3 }, metallic: { aldehydes: .4 }, mineral: { woody_amber: .3, aquatic_marine: .2 }, camphor: { green_herbal: .5, lavender_aromatic: .3 },
    anis: { spicy_warm: .4, lavender_aromatic: .2 }, alcohol: { fruity_sweet: .4, vanilla_gourmand: .3 }, boozy: { fruity_sweet: .4, vanilla_gourmand: .3 }, conifer: { green_herbal: .5, incense_resin: .3, cedar_dry: .3 },
    whiskey: { fruity_sweet: .3, tobacco_honey: .3 }, rum: { fruity_sweet: .4, vanilla_gourmand: .3 }, "sandalwood": { sandalwood_creamy: .9 }, "cedar": { cedar_dry: .8 }
  };

  const STAGE_ACCORD_FACTOR = { opening: .3, heart: .45, drydown: .6 };

  function norm(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9 ()\-\/&]/g, " ").replace(/\s+/g, " ").trim();
  }
  const INDEX = new Map(RULES.map(r => [r[0], r[1]]));
  const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const CONTAINS = RULES.filter(r => r[0].length >= 4).map(r => [new RegExp("(^|[^a-z])" + escapeRe(r[0]) + "([^a-z]|$)"), r[1], r[0].length]).sort((a, b) => b[2] - a[2]);

  function famsForNote(name) {
    const n = norm(name);
    if (!n) return null;
    const paren = n.match(/\(([^)]+)\)/);
    const bare = n.replace(/\(.*?\)/g, "").replace(/\s+/g, " ").trim();
    const candidates = [n, bare, paren ? paren[1].trim() : null].filter(Boolean);
    for (const c of candidates) { if (INDEX.has(c)) return INDEX.get(c); }
    for (const c of candidates) { const s = c.replace(/s$/, ""); if (s !== c && INDEX.has(s)) return INDEX.get(s); }
    for (const c of candidates) { for (const [re, fams] of CONTAINS) { if (re.test(c)) return fams; } }
    return null;
  }

  /* notes: {top:[], middle:[], base:[]} of note names; accords: optional array of accord names.
     Returns {stages:{opening,heart,drydown}, matched, unmatched}. */
  function mapNotes(notes, accords) {
    notes = notes || {};
    const lists = { opening: notes.top || [], heart: notes.middle || [], drydown: notes.base || [] };
    const accordFams = {};
    for (const a of (accords || [])) { const fams = ACCORDS[norm(a)]; if (fams) for (const [f, w] of Object.entries(fams)) accordFams[f] = Math.max(accordFams[f] || 0, w); }
    const matched = [], unmatched = [];
    const stages = {};
    for (const [stage, list] of Object.entries(lists)) {
      const acc = {};
      for (const note of list) {
        const fams = famsForNote(note);
        if (!fams) { unmatched.push(note); continue; }
        matched.push(note);
        for (const [f, w] of Object.entries(fams)) acc[f] = (acc[f] || 0) + w;
      }
      const max = Math.max(0, ...Object.values(acc));
      const lengthFactor = list.length <= 3 ? 1 : list.length <= 6 ? .85 : .7;
      const out = {};
      if (max > 0) for (const [f, v] of Object.entries(acc)) out[f] = Math.min(1, Math.round((.9 * v / max) * lengthFactor * 100) / 100);
      /* accord floor: fills stages with thin note lists */
      const k = STAGE_ACCORD_FACTOR[stage];
      for (const [f, w] of Object.entries(accordFams)) { const floor = Math.round(w * k * 100) / 100; if (floor >= .2 && (out[f] || 0) < floor) out[f] = floor; }
      /* drop traces so the stage stays readable */
      for (const f of Object.keys(out)) if (out[f] < .15) delete out[f];
      stages[stage] = out;
    }
    return { stages, matched, unmatched: Array.from(new Set(unmatched)) };
  }

  return { RULES, ACCORDS, famsForNote, mapNotes, norm };
})();
