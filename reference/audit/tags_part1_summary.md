# Tag audit, part 1 (72 perfumes)

Sources: Turin and Sanchez, *Perfumes: The Guide 2018* ("Guide"); Ohloff, Pickenhagen, Kraft and Grau, *Scent and Chemistry* (2022) ("Chemistry"). Per-entry detail is in `tags_part1.json`.

## Counts

- Reviewed in the Guide: 12 of 72. Aventus, Hacivat, Baccarat Rouge 540, Grand Soir, Black Orchid (through the EDT review, which describes the original's accord), Sauvage EDP, Sauvage EDT, Bleu de Chanel EDP, Black Opium, Stronger With You, By the Fireplace, La Vie Est Belle.
- Not reviewed in the Guide: 60, including all ten Arab-house scents and every launch after 2018.
- Named in Chemistry: 13. Eight with material figures (Baccarat Rouge 540, Alien, Invictus, Y EDP, 1 Million, Allure Homme Sport, Terre d'Hermès, Fahrenheit); five only in lists of genre examples (Coco Mademoiselle, La Vie Est Belle, Black Opium, Bleu de Chanel EDP, Sauvage EDT).
- Entries with proposed changes: 10 (13 changes). Entries with at least one high-confidence change: 3 (Grand Soir, Baccarat Rouge 540, Fahrenheit).
- No entry in part 1 has a `cloneOf` value, so no evidence was inherited.

## Ten most consequential corrections

1. Grand Soir, drydown `woody_amber` 0.3 to 0.8 (high, Guide): "a huge dose of some vile woody-amber material".
2. Grand Soir, heart `woody_amber` 0 to 0.7 (high, Guide): "smells like rubbing alcohol played at heavy metal concert volume".
3. Baccarat Rouge 540, heart `vanilla_gourmand` 0 to 0.5 (high, Chemistry): "sweetened by an outrageous amount of ca. 3% of ethyl maltol".
4. Fahrenheit, drydown `cedar_dry` 0 to 0.5 (high, Chemistry; 6.92/6.93 is Iso E Super): "25% of 6.92 / 6.93 already in the earlier woody-violet-leaves creation".
5. Baccarat Rouge 540, drydown `vanilla_gourmand` 0 to 0.5 (medium, Chemistry): "counterbalanced by an even more extreme amount of ethyl maltol".
6. Black Orchid, heart `coffee_gourmand` 0 to 0.5 (medium, Guide): "The huge chocolate-mothballs-cucumber accord of Black Orchid".
7. Baccarat Rouge 540, opening `fruity_sweet` 0 to 0.5 (medium, Guide): "count on this oriental being a fruity, syrupy experience".
8. La Vie Est Belle, drydown `iris_powdery` 0 to 0.4 (medium, Guide): "the inclusion of an iris note".
9. Terre d'Hermès, drydown `oakmoss_chypre` 0 to 0.3 (medium, Chemistry; the material is tree moss): "more recently 0.5% by Jean-Claude Ellena in 'Terre d'Hermès'".
10. Stronger With You, heart `vanilla_gourmand` 0 to 0.3 (medium, Guide): "one in the heart (some sort of gourmand accord)".

The other three changes are low confidence: Terre d'Hermès drydown `woody_amber` 0.5 to 0.2, La Vie Est Belle heart `white_floral` 0.6 to 0.3, and Aventus drydown `spicy_warm` 0 to 0.3.

## Where the sources contradict the marketing pyramid

- **Grand Soir.** The pyramid lists only resinous amber, benzoin, tonka and vanilla. The Guide says a woody-amber aromachemical is the main smell.
- **Baccarat Rouge 540.** The pyramid omits the ethyl maltol sugar and the roughly 12% Evernyl (a synthetic oakmoss material) that Chemistry reports. A reviewer should decide whether Evernyl at that level earns an `oakmoss_chypre` tag, since neither source says the scent smells mossy.
- **Black Orchid.** The pyramid has truffle but no chocolate. The Guide names chocolate as the core of the accord.
- **Fahrenheit and Terre d'Hermès.** The pyramids list cedar or Iso E Super as one note among several, but Chemistry puts Iso E Super at 25% and about 50 to 55% of the two formulas. For Terre d'Hermès this probably means `cedar_dry` (0.7) should lead the drydown ahead of `vetiver` (0.9).
- **Black Opium.** The pyramid and the entry make coffee the whole heart. The Guide files it as a linear fruity floral and never mentions coffee.
- **La Vie Est Belle.** The pyramid gives iris, jasmine and orange blossom equal billing in the heart. The Guide says iris is what distinguishes it, calls it a linear "wall-of-sound" scent, and treats the white florals as a small addition.
- **Bleu de Chanel EDP and Aventus.** Neither pyramid lists lavender or tonka, and neither entry carries lavender at any stage, yet the Guide labels both "citrus fougère" and Chemistry lists Bleu among fougères to study. No change is proposed because neither source names lavender or tonka in either scent.
- **Coco Mademoiselle and La Vie Est Belle.** Chemistry lists both as chypres, and neither entry carries oakmoss. This is low priority, because modern patchouli chypres often contain little moss.
- **Data, not sources.** Bade'e Al Oud Oud for Glory has notes and tags identical to Initio Oud for Greatness, and Club de Nuit Intense Man's notes mirror Aventus, but both have `cloneOf` set to null.
