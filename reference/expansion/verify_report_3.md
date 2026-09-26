# Identity check of 50 added perfumes (third sample)

Question per entry: do its store rows in `record.json` name this exact Fragrantica perfume? Checked against the house's
designer list in `cache/designers/`, the matcher's notes in `resolved.json`, every store row in `rows.json` for the same
name, and the catalogue above the expansion block in `site/js/data.js`.

Result: **48 right, 1 wrong, 1 unsure.** One of the right entries carries a row that names another perfume, and that
perfume is missing from the catalogue.

## Sample

Python `random.Random(20260929).sample(pool, 50)`, where `pool` is the 553 ids of `record.json`, in file order, that have
store rows and were in neither earlier sample.

littleblackdressedp, patchouliblanc, myburberryblush, dioraddictedt, valentinouomoborninromainten, ladyemblemelixir,
starwalker, gaultierdivineleparfum, pourunhommedecaron, rasaattarmubakhar, zafeeroudvanille, alwisamday,
monguerlainedpintense, goldintensiveaoud, cliniquehappyfw, lapetiterobenoireedt, narcisoedpambree,
blackstoneextraitdeparfum, splendidatubereusemystique, allurehomme, rose01, iconelite, greyvetiver, scandalleparfum,
thedreamer, aramis, costumenationalhomme, obsession, honourwoman, rabanne1milliongoldenoud, lapidusph, boisdore,
splendidajasminnoir, scherrer2, franckolivier, hugodarkblue, brightcrystalabsolu, cocomademoiselleleauprivee,
leathermalaki, almajeoudnoir, incandessencelotus, emotion, yvessainlaurelle, dunhicon, terroni, lhommeideallintense,
tresormidnightrose, narcisoedpcristal, goodgirlgonebadextreme, contradiction.

## Wrong

| Entry | Store rows | What they name instead, and the evidence | Fix |
|---|---|---|---|
| `cliniquehappyfw` (Happy For Women, fid 372) | Noon "CLINIQUE Happy EDT 100ml" (EDT list, rank 166) only | The row names no sex; `resolved.json` marks it "tie: Clinique Clinique Happy For Men" and the matcher took the women's page. The stores sell the women's Happy as a perfume spray or Eau de Parfum and the men's as the Eau de Toilette: Faces "Happy Perfume Spray Eau De Parfum 100ml Women" and "Clinique Happy For Men Cologne Spray 100 ml"; Nice One "clinique happy for men eau de toilette"; Noon's own women's Clinique listing is "Happy Heart Perfume Spray 100ml" in its EDP list. The EDT row is Happy For Men (fid 373), already in the block as `cliniquehappyfm`. | Move the row to `cliniquehappyfm`. `cliniquehappyfw` is then left with no scored row (the Faces women's listing carries no best-seller signal); remove it and refill from the next candidate. |

## Right, with one row that names another perfume

| Entry | Row | What it names, and the evidence | Fix |
|---|---|---|---|
| `obsession` (Obsession for women, fid 248) | Noon "CALVIN KLEIN Obsession Eau De Toilette 75ml" (EDT list, rank 20, 405 ratings) | The entry is right on its Nice One row ("calvin klein obsession for women eau de parfum"). The Noon row names no sex, and Nice One shows the split: the women's as "eau de parfum", the men's as "obsession for men 125ml eau de toilette". The 75 ml EDT is **Obsession for Men** (fid 249, 969 reviews on the Calvin Klein list). No tie was flagged because the men's page title carries "for Men". Obsession for Men is in neither the older catalogue nor the block: `candidates.json` scored it 0.518 on Nice One alone, just under the cap (the lowest entry in the block scores 0.53; the three left out, 0.529 to 0.53). | Move the row to fid 249. The Noon row alone scores 0.826 for `obsession`, so Obsession for Men clears the cap; add it in place of the lowest-scored entry. |

## Unsure

| Entry | Store rows | Doubt | What settles it |
|---|---|---|---|
| `littleblackdressedp` (Little Black Dress Eau de Parfum, 2024, fid 96265, 10 reviews on the house list) | Noon "AVON Little Black Dress EDP 50ml" (486 ratings) | Avon's list has the 2001 original "Little Black Dress" (fid 1864, 199 reviews), a 2016 re-edition (63525, 11) and this 2024 page. The original is also a 50 ml Eau de Parfum, so the row fits it equally; the matcher took the 2024 page because its title carries "Eau de Parfum". By the review rule the second fix used (keep the established page unless the newer one has 90+ reviews), the 2001 page would be the pick. | Whether Avon's current 50 ml EDP is the 2024 page: Avon's product page or the Noon listing's notes against 96265's (honeysuckle, apricot, plum blossom, peony / ylang-ylang, gardenia, plum, rose / musk). If not, re-point to 1864. |

## Newer same-name pages below the review rule

These stay by the rule the second fix applied (re-point only when the newer page has 90+ reviews). The rows cannot tell the
versions apart.

| Entry | Chosen page | Newer page |
|---|---|---|
| `pourunhommedecaron` | 1934, fid 3166, 554 reviews | "Pour Un Homme de Caron 2017", fid 44103, 12 reviews in nine years |
| `lapetiterobenoireedt` | 2012, fid 17387, 178 reviews | "La Petite Robe Noire Eau de Toilette (2025)", fid 101802, 19 reviews |
| `yvessainlaurelle` | 2007, fid 1574, 372 reviews | "Elle 2024", fid 98978, 9 reviews |

For `lapetiterobenoireedt`, two Golden Scent best-seller rows the matcher left unresolved as a possible flanker, "La Petite
Robe Noire Ma Robe Cocktail Eau De Toilette for Women" (ranks 494 and 905), also name an LPRN Eau de Toilette; Guerlain's
list has no "Ma Robe Cocktail" page, so they belong to this entry.

## Right

| Entry | Why the rows name it |
|---|---|
| `patchouliblanc` | Exact name; only page. |
| `myburberryblush` | Exact name, women's EDP; only page. |
| `dioraddictedt` | "Dior Addict EDT ... For Women": the only Dior Addict Eau de Toilette page (2014). |
| `valentinouomoborninromainten` | "Uomo Born In Roma Intense EDP"; distinct from the older catalogue's `uomobornroma`. |
| `ladyemblemelixir` | Exact name; only page. |
| `starwalker` | "starwalker for men eau de toilette": the 2005 EDT; Extreme carries its word. |
| `gaultierdivineleparfum` | "Divine Le Parfum EDP Intense": Le Parfum, not Divine or Divine Elixir. |
| `pourunhommedecaron` | "Pour Un Homme De Caron ... Eau de Toilette For Men"; see the table above. |
| `rasaattarmubakhar` | Exact name, oil; only page. |
| `zafeeroudvanille` | Exact name; only page. |
| `alwisamday` | "Al Wisam Day ... for Men EDP"; only page. |
| `monguerlainedpintense` | "Mon Guerlain Intense EDP": the 2019 Eau de Parfum Intense. |
| `goldintensiveaoud` | Exact name; only page. |
| `lapetiterobenoireedt` | "la petite robe noire for women eau de toilette"; see the table above. |
| `narcisoedpambree` | "Narciso Ambree ... Eau de Parfum"; Eau Néroli Ambrée is a different page. |
| `blackstoneextraitdeparfum` | Exact name; only Black Stone page on the Ramón Béjar list. |
| `splendidatubereusemystique` | Exact name; only page. |
| `allurehomme` | "Allure Homme Eau de Toilette for Men": the 1999 original, not Sport (older catalogue) or Edition Blanche. |
| `rose01` | "Rose 01 - Unisex Eau De Parfum"; the other page is the oil. |
| `iconelite` | Exact name, EDP for men. |
| `greyvetiver` | "grey vetiver for men eau de parfum": the 2009 EDP; the EDT (2014) and Parfum (2023) have their own pages. |
| `scandalleparfum` | "Scandal Le Parfum EDP Intense ... For Women": the women's page, not Pour Homme Le Parfum. |
| `thedreamer` | "The Dreamer" EDT for men matches fid 59417's title; the 1996 page is now titled "Dreamer The Original Edition". |
| `aramis` | "Aramis Man EDT 110ml": the house's 1966 flagship, sold at 110 ml; every flanker carries its own word. |
| `costumenationalhomme` | "homme for men eau de perfum": the 2009 EDP; Homme Parfum (2020) is separate. |
| `obsession` | Nice One "obsession for women eau de parfum"; see the row flag above. |
| `honourwoman` | "Amouage Honour EDP ... For Women": Honour Woman, not Honour 43. |
| `rabanne1milliongoldenoud` | Exact name; only page. |
| `lapidusph` | "TED LAPIDUS Pour Homme EDT 100ml"; the Black, Gold and Sport flankers carry their words. |
| `boisdore` | Exact name; only page. |
| `splendidajasminnoir` | Exact name; only page. |
| `scherrer2` | Exact name; only page. |
| `franckolivier` | "Franck Olivier Franck Olivier EDP ... for Women" (Golden Scent and Nice One): brand then product name, so the product is the 1998 women's Franck Olivier, not a house-only listing. |
| `hugodarkblue` | "HUGO BOSS Dark Blue EDT 75ml"; only page. |
| `brightcrystalabsolu` | Exact name; only page. |
| `cocomademoiselleleauprivee` | Exact name; only page. |
| `leathermalaki` | Exact name; distinct from the older catalogue's `oudmalaki`. |
| `almajeoudnoir` | "Al Majed Oud Noir From Classic Collection": the only Noir page. |
| `incandessencelotus` | Exact name; only page. |
| `emotion` | "Rasasi Emotion ... for Women": the women's page, not Emotion Men. |
| `yvessainlaurelle` | "Elle Eau de Parfum For Women"; see the table above. |
| `dunhicon` | "Dunhill Icon Eau de Parfum For Men"; Absolute, Elite and Racing carry their words. |
| `terroni` | Exact name; only page. |
| `lhommeideallintense` | Exact name; distinct from the older catalogue's `lhommeideal` and `lhommeidealedp`. |
| `tresormidnightrose` | Exact name; only page. |
| `narcisoedpcristal` | "Narciso Rodriguez Cristal EDP"; only Cristal page. |
| `goodgirlgonebadextreme` | Exact name; distinct from the older catalogue's `goodgirlgonebad`. |
| `contradiction` | "contradiction for men 100ml eau de toilette": the men's page (256), not the 1997 women's (255). |
