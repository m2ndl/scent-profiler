# Verification of the 667 added perfumes

Independent check of the block "added 26 Sep 2026 (the expansion to 1,000)" in `site/js/data.js`, against
`reference/expansion/record.json`, the cached Fragrantica pages in `reference/expansion/cache/`, and, for ten entries,
the house's own site or a major retailer. Scripts ran over all 667 entries; the hand review used a random sample of 40.

Totals: **10 blocking, 15 should-fix, 17 notes.**

## What held across all 667

- The English note lists equal the record's pyramid, and the record's pyramid equals the cached Fragrantica page, for every entry.
- Every entry's stage weights recompute exactly from `PP_MAP.mapNotes` with the aliases in `gen.js` and `decisions.json`.
- Every entry's sex equals Fragrantica's.
- No duplicate id, house and name, Fragrantica page, or Arabic name (within the block or against the older entries); no Latin letter in any Arabic field; no empty stage; the Arabic note count matches the English in every stage.
- `node --test tests/*.test.js`: 79 of 79 pass.

The defects below are therefore not transcription errors. They come from three places: store listings matched to the wrong
Fragrantica page (mostly perfumes whose name is the house name, or older versions of a current bottle), a handful of note
words the mapper reads as the wrong family, and a few naming and tier choices.

## Blocking

Each of these shows the notes of a perfume other than the bottle the stores sell, or puts one bottle in the catalogue twice.

| # | Entry | Evidence | Fix |
|---|---|---|---|
| B1 | `dolceandgabbana` (Dolce&Gabbana, 1992, fid 484) | Its only row, Golden Scent "Dolce & Gabbana Dolce Eau de Parfum for Women", names D&G **Dolce** (2014), which is already in the block as `dolce` (fid 22955). | Remove. |
| B2 | `lacoste` (Lacoste, men, 1984, fid 671) | Only row: Noon "Lacoste EDP Packaging May Vary 90ml". The 1984 Lacoste is an old men's EDT; a 90 ml Lacoste EDP is Lacoste Pour Femme, already `lacostepf` (Golden Scent and Nice One rows). | Remove. |
| B3 | `hugospray` (Hugo Spray, 2008 limited edition, fid 2404) | Only row: Noon "HUGO BOSS Hugo EDT For Men Spray 125ml", the regular Hugo Man EDT, the catalogue's `hugoman`. The matcher read "Spray" as part of the name. | Remove. |
| B4 | `tedlapited` (Ted, 1999, fid 5942) | Only row: Noon "TED LAPIDUS Lapidus EDT 100ml", which is Lapidus Pour Homme, already `lapidusph`. | Remove. |
| B5 | `carolinaherrera` (Carolina Herrera, 2016 unisex, fid 41888, 6 reviews on the house list) | Only row: Noon "CAROLINA HERRERA Herrera EDT 100ml", which is **Herrera for Men** (1991, fid 289, male). | Re-point to fid 289 (sex m) or remove. |
| B6 | `black` (Kenneth Cole Black, women, fid 877) | Only row: Noon "Kenneth Cole Black EDT 100ml". Black for Her is sold as an Eau de Parfum; the 100 ml EDT is **Kenneth Cole Black for Men** (fid 1956). Retail listings confirm the split (kennethcole.com "Black For Her Eau de Parfum"; maxaroma, fragrancenet "Kenneth Cole Black Eau de Toilette for Men 100 ml"). | Re-point to fid 1956 (sex m) or remove. The id `black` is also too generic; use `kennethcoleblack`. |
| B7 | `bossthescentforheredt` (The Scent for Her EDT, fid 48517, 14 reviews on the house list) | Only row: Noon "HUGO BOSS The Scent EDT 100ml", which names the men's Boss The Scent EDT, the catalogue's `thescentmen`. The keep decision in `decisions.json` compared it with the For Her EDP only. | Remove, unless a listing names the For Her EDT. |
| B8 | `diorhommeparfum` (2014, fid 27417) and `diorhommeparfum2025` (fid 101016) | The original and its 2025 relaunch, same name. Golden Scent's row reads "Dior Homme Parfum (2025 Version)"; Nice One's "dior homme for men parfum" does not say which. The same case was held back for Dior Homme Intense 2025 (101596). | Keep one. By the rule used for the held-back entries (the stores sell the current bottle), keep fid 101016 under the name "Dior Homme Parfum" / "ديور هوم بارفان" and remove `diorhommeparfum`. Its Fragrantica pyramid is thin (iris / amber / patchouli, vetiver). |
| B9 | `diorhommesport` (fid 4033, the 2008 Dior Homme Sport) | Rows: Golden Scent EDT and 200 ml EDT, Noon EDT 125 ml, Faces EDT. The bottle on sale is the 2021 reformulation (fid 71326, 885 reviews, sold in 75/125/200 ml); the 2008 version is discontinued. Same rule as held-back 13015 (Dior Homme 2011) and skipped 570 (Hugo 1995). | Re-point to fid 71326 and regenerate notes and tags. |
| B10 | `coach` (Coach, 2007, fid 942: guava, water lily, violet / jasmine, orange blossom, mimosa, honey / sandalwood, vanilla, amber, cedar) | Rows: Golden Scent "Coach Coach Women ... 90ml Eau De Perfum", Noon "Coach EDP 90ml". The 90 ml Coach Eau de Parfum on sale is the 2016 Coach (coach.com "Eau De Parfum 90 ml": raspberry, pear, pink pepper / Turkish rose, cyclamen, gardenia / suede musk), Fragrantica "Coach the Fragrance", fid 38855. | Re-point to fid 38855 and regenerate. |

## Should-fix

| # | Entry | Evidence | Fix |
|---|---|---|---|
| S1 | `themostwantedintense` (fid 90953) | Fragrantica's "The Most Wanted Intense" is the **Eau de Toilette Intense** (azzaro.com lists it under that name; bergamot, lavender, liquor, moss). Five of its six rows name the EDP Intense, the catalogue's `mostwantedintense`; one Nice One row ("eau de toilette intense", rank 288) names this one. Beside "The Most Wanted Eau de Parfum Intense", the name "The Most Wanted Intense" reads as the same bottle. | Rename "The Most Wanted Eau de Toilette Intense" / "ذا موست وانتد أو دو تواليت إنتنس"; drop the five EDP rows from its record. |
| S2 | `theoneedt` (The One EDT, women, fid 46273) | Only row: Noon "Dolce & Gabbana The One EDT 150ml". The men's The One EDT is sold at 150 ml (D&G site, Amazon); the women's EDT is not, as far as retail listings show. The row most likely names the catalogue's `theonemen`. | Remove unless a listing names the women's EDT. |
| S3 | `bleudechanel` (the 2010 EDT, fid 9099) | English "Bleu de Chanel", Arabic "بلو دو شانيل أو دو تواليت"; the older `bleuedp` is English "Bleu de Chanel Eau de Parfum", Arabic "بلو دو شانيل". In English the EDT reads as the parent line, in Arabic the EDP does. Every row names the EDT. | English name "Bleu de Chanel Eau de Toilette". |
| S4 | `afna9pmelixir` | Drydown carries rose 0.77 from "rock rose", which is cistus (labdanum), not rose. The Arabic is already لاذن. | `mapalias`: "rock rose" to "labdanum". The Arabic then lists لاذن twice; drop one. |
| S5 | `mercedesbenzintense`, `infiniteedt` | "Bourbon pepper" is read as bourbon whiskey: heart fruity 0.26, vanilla 0.26, tobacco 0.17 (Mercedes); fruity 0.39, vanilla 0.39, tobacco 0.26 (Bentley). | `mapalias`: "bourbon pepper" to "pepper". |
| S6 | `mrburberry`, `gentlemenonly` | "Birch leaf" is read as birch tar: heart leather 0.68 (Mr. Burberry), opening leather 0.36 (Gentlemen Only). Birch leaf is a green note. | `mapalias`: "birch leaf" to "green notes". |
| S7 | `sakura` (Dior) | Its namesake note "japanese cherry blossom" is read as cherry fruit: heart fruity 0.47. "cherry blossom" is aliased to floral notes; the Japanese variant was missed. | `mapalias`: "japanese cherry blossom" to "floral notes". |
| S8 | `bluelaverne` | "baie rose" (pink pepper) is read as rose: opening rose 0.26. The Arabic is right (فلفل وردي). | `mapalias`: "baie rose" to "pink pepper". |
| S9 | `lanuitdelhommeleparfum` | Arabic "لبنى فرنسي" for "French labdanum". لبنى is storax; `decisions.json` (`ar_notes_why`) says the new entries use لاذن. | "لاذن فرنسي". |
| S10 | `armaniprivevertmalachite`, `armanipriverougemalachite` | Tier designer. Armani Privé is Armani's exclusive line, the counterpart of Dior's Collection Privée, which the catalogue tags niche (`oudispahan`, `oudrosewood`, `sakura`). | Tier niche (add `armani prive` to a `PRIVATE` pattern for Giorgio Armani in `gen.js`). |
| S11 | `pashacartier` (fid 315) | Name "Pasha Cartier" copies Fragrantica's title; the perfume is **Pasha de Cartier** (1992 EDT), as the sibling entries are named. The Nice One row ("pasha de cartier ... eau de toilette") fits; the Noon row "Cartier Pasha Parfum EDP 100ml" is Pasha de Cartier Parfum (fid 59418), a different perfume. | Rename "Pasha de Cartier" / "باشا دو كارتييه"; drop the Noon row from its record. |
| S12 | `jilsandjil` (Jil, 1997, fid 624, 26 reviews on the house list) | Only row: Noon "jil sander EDT 125ml", which names the house and nothing else. Nothing shows that Jil is on sale. | Remove unless a listing names Jil. |
| S13 | `versacephoudnoir` | "leatherwood" is aliased to honey, so the drydown has tobacco/honey 0.8 and no leather. In Versace's copy (as retailers reproduce it: oud, patchouli, leatherwood) the word stands for the leather facet. Arabic "خشب الجلد" is a word-for-word rendering. | `mapalias`: "leatherwood" to "leather"; Arabic "جلد". |
| S14 | `pureblack`, `jilsandjil`, `matsukita` | "balsam fir" matches the mapper's "balsam" rule (amber resin only); the "fir balsam" rule (incense, green, amber) is missed because of word order. | `mapalias`: "balsam fir" to "fir balsam". |
| S15 | `cubantobacco` | "kashmir wood" is unmatched, so it adds no family; "cashmirwood" is already aliased. | `mapalias`: "kashmir wood" to "cashmere wood". |

## Notes

| # | Entry | Observation | Suggestion |
|---|---|---|---|
| N1 | `hugowomanedp` | Only row: Nice One "hugo boss women for women eau de parfum 90ml". Hugo Woman EDP (2015) is sold in 30/50/75 ml as far as I know; Boss Woman (fid 381) is sold at 90 ml. Low confidence. | Check the Nice One listing. |
| N2 | `creation` (Ted Lapidus, 2011, fid 28823) | Row "TED LAPIDUS Creation EDT 100ml" fits it or Creation 1984 (fid 806). | Check which is sold. |
| N3 | `cerr1881`, `caroherrch`, `perrelli360`, `jaguarfm` | Rows name no sex ("Cerruti 1881 EDT 200ml", "CH EDT 100ml", "Perry Ellis 360 EDT 100ml", "Jaguar EDT For Men 100ml"). The 200 ml 1881 EDT is usually the men's. | Owner's call. |
| N4 | `gucciguiltyelixirdeparfumpf` | Noon "GUCCI Guilty Elixir De Parfum 60ml" fits the pour Femme or pour Homme elixir; the Golden Scent row does name pour Femme. | None needed. |
| N5 | `pinkdiamondsakura`, `leparfumroyal`, `noora`, `reef11` | Store rows state a different sex from Fragrantica (Golden Scent "For Men & Women" for two women's perfumes; Amazon "For Women" for unisex Noora; Reef 11 listed both "For Women" and "For Men"). The entries follow Fragrantica. | None needed. |
| N6 | `officer` (1 vote), `velvettouch` (0), `primemax` (2), `lancy` (1), `theone` (9) | Pyramids from Fragrantica pages almost no one has confirmed. | Keep only if the house site agrees. |
| N7 | `blackincense`, `rosenoir`, `oudcouture`, `amberoud` | The name promises a material the pyramid lacks (no incense, rose, oud, oud respectively), so the entry carries none of that family. The tags follow the notes correctly. | Check these four against the house sites. |
| N8 | `elizarde5thavenue`, `coachdreamssunset`, others | Minor misreads: "lime (linden blossom)" read as lime (citrus); "pear ice cream" read as vanilla only (coach.com calls it pear sorbet, so no fruity family); "white ginger lily" read as ginger; "apple tree blossom", "pear blossom", "raspberry blossom", "papaya flower" read as fruit; "wild strawberry leaf" read as fruit. | Aliases if wanted. |
| N9 | Arabic collisions | قرنفل for both clove and carnation (`aguabrava`); عنبر for both amber and ambergris (6 entries); oakmoss is "طحلب" in 69 places and "طحلب البلوط" in 6, and "moss" is also "طحلب"; "green notes" is "أخضر". | "زهر القرنفل" for carnation; one form for oakmoss. |
| N10 | Arabic spellings | `premierjour` "بروميه جور" reads "Promié"; "بريمييه جور" is closer. "citron" is "سترون"; the usual word is أترج. | Small edits. |
| N11 | Tiers | `fahrenheitleparfum` is niche because the `PRIVATE` pattern includes it, though it is a counter line; `eaudombreleather` is designer while the older `ombreleather` is niche; `greyvetiver` is niche. Sapil (a UAE house, `solid`) is designer; Creation Lamis, Dorall Collection and J. Casanova are budget houses tagged designer. | Owner's call; Sapil fits arab. |
| N12 | Naming | 127 new names begin with the house's first word, most because they keep Fragrantica's house prefix ("Rabanne Invictus Victory", "Rabanne Paco Rabanne Pour Homme", "Gucci Guilty Eau de Parfum", "Versace Pour Femme Dylan Blue", "Emporio Armani Stronger With You Leather"), while the older entries drop it ("Invictus", "Guilty", "Dylan Blue", "Stronger With You"). | Strip the prefix where the page shows the house beside the name. |
| N13 | `musksilksupreme` | Same note list as the older `musksilk`; the profiler cannot tell them apart. | None needed; Fragrantica gives both the same notes. |
| N14 | `felino` (web check) | Carner's own page lists absinth, papyrus / night-blooming jasmine, ylang-ylang / myrrh, opoponax (extrait). The Fragrantica pyramid adds hazelnut, bergamot, leather, clove, civet, vanilla and styrax, which give the opening citrus 0.9, the heart leather 0.43, the drydown animalic 0.49. | Consider the house pyramid. |
| N15 | `pashadecartiereditionnoireed` | The 2019 EDT page (fid 59432, 4 reviews on the house list) was chosen over the 2013 Edition Noire (fid 22861, 175 reviews), also an EDT. The Nice One row fits both. | Check which is sold. |
| N16 | `coral` (Reef) | Noon lists "Reef Coral 1"; Fragrantica has only "Coral" (3 reviews). | None needed. |
| N17 | Thin pyramids | 59 entries have four notes or fewer (mostly Reef, Al Majed Oud, Osma, and recent designer flankers), so each note carries a whole stage. | None needed. |

## Sample of 40

Drawn with mulberry32, seed 20260926, as a Fisher-Yates shuffle of the new ids in `data.js` order, first 40 taken:

jennlopelive, felino, reef31, nauticavoyageheritage, teintdeneigeedp, muscnoirroseforher, interludeblackiris, burberrywomen,
happyspirit, polosport, afna9pmrebel, narcisorodriguezforhimbleuno, epicman, bossthescentforheredt, diordune,
mercedesbenzclubblackedt, kashmirmusk, whitef, coachdreamssunset, theone, coachfm, jaguarfm, black, idolenow,
elizarde5thavenue, pashadecartiereditionnoireed, happychopardlemondulci, inred, noora, idoleaura, specialmusk, coral,
perceive, bentleyfmintense, salvointense, theonefmedpintense, sauvageparfum, hawaskobra, yvessainlaurm7,
dolceandgabbanaphintenso.

Per entry: identity against the store rows, Arabic name, a spot check of Arabic note words, family weights against the notes,
sex and tier. Two identity errors (`black` B6, `bossthescentforheredt` B7). Notes on `felino` (N14), `elizarde5thavenue` and
`coachdreamssunset` (N8), `pashadecartiereditionnoireed` (N15), `coral` (N16), `noora` (N5), `theone` (N6), `jaguarfm` (N3).
The other 30 are clean. Arabic names in the sample all read as the English (house names included where the entry needs
them, e.g. "جينيفر لوبيز لايف", "مسك إبراهيم القرشي الخاص"). Arabic note words were right in every sampled entry; the
whole-block pass over all 558 distinct English note words found the problems listed in S9, S13, N9 and N10.

## Pyramids against the house or a major retailer (10 of the sample)

| Entry | Source | Result |
|---|---|---|
| `sauvageparfum` | dior.com (via search; the page refuses direct fetch) | Agrees: mandarin, bergamot, sandalwood, tonka. The entry also has elemi, olibanum and vanilla. |
| `idoleaura` | lancome.co.uk, lancome-usa.com | Agrees: rose, jasmine, bergamot, salted vanilla, musk. |
| `muscnoirroseforher` | nordstrom.com | Agrees: bergamot, tuberose / musk / vanilla. The entry adds plum, pink pepper, rose. |
| `epicman` | amouage.com | Agrees except Amouage lists cumin where Fragrantica has caraway. |
| `felino` | carnerbarcelona.com | Disagrees (N14). |
| `afna9pmrebel` | us.afnan.com | Agrees exactly. |
| `salvointense` | retailer copy (donnatellaperfumes, intenseoud) | Agrees exactly. |
| `bentleyfmintense` | fragrancex, fragrancenet, macys | Agrees. |
| `kashmirmusk` | goldenscent.com, retailer copy | Agrees (retailer copy likely follows Fragrantica). |
| `coachdreamssunset` | coach.com | Agrees on notes; coach.com's pear sorbet is read as vanilla only (N8). |

`hawaskobra` was also tried; the Noon page timed out and Rasasi's site gave no pyramid.

## Fix order

1. Remove or re-point B1 to B10 (and S2, S12 if no listing turns up); re-run `gen.js`, `tools/fetch_bottles.py` for the re-pointed ones, and the tests.
2. Add the aliases in S4 to S8 and S13 to S15 to `decisions.json` `mapalias` and regenerate; the tags of 12 entries change.
3. The Arabic and name edits in S1, S3, S9, S11.
4. The tier change in S10.
