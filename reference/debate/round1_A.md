# Path A: provenance stack

## 1. Claim

Every tag records its source: brand notes (rank 1, through mapper.js), an INCI list (rank 2, through a material table giving each INCI name a family and a volatility class), or a quoted formula or expert description (rank 3). Higher rank overrides lower for the same family and stage. A label can add or confirm a family; it lowers a tag by absence only on a post-July-2026 list and only for families whose usual materials are all on Annex III (tonka_coumarin is the clean case). Ratings never write tags; consistent stage-level contradiction puts a tag in a review queue. The page shows each family's source in both languages.

**3 months.** All 286 entries carry per-tag sources. The 69 audit changes (43 entries) become rank-3 tags with quotes. INCI lists are transcribed by hand for an estimated 150 to 200 entries, mostly designer and EU-sold niche, few Arab-house. Notes-only tags count at reduced weight. No measured accuracy figure is possible yet; about half of the 32 proposed families become checkable against a label, and users see which claims are marketing.

**12 months.** As new-format labels reach most EU stock, label evidence grows for Iso E Super, Galaxolide, patchouli, sandalwood and vanillin. About 500 verified entries, plus a review queue fed by ratings.

## 2. Evidence

1. **Notes are wrong often enough to matter.** Of 68 entries with outside evidence, 40 needed correction (reference/audit/applied_changes.jsonl). Pyramids omitted Iso E Super at 25% (Fahrenheit) and about 35% (Déclaration), and Le Male's 39% musk (tags_part1_summary.md, tags_part2_summary.md).
2. **The new allergen list names drydown materials.** The 56 additions include Tetramethyl acetyloctahydronaphthalenes (Iso E Super), Hexamethylindanopyran (Galaxolide), Hexadecanolactone (a macrocyclic musk), Acetyl cedrene, Rose ketones, Santalol, Santalum album oil, Pogostemon cablin oil, Cedrus atlantica and Juniperus virginiana oils, Sclareol and Vanillin (https://cosmeservice.com/news/regulation2023-1545-changes-the-allergen-list/; https://www.alsglobal.com/en/news-and-publications/2024/07/eu-regulation-2023-1545-fragrance-allergen-labeling). Not listed: Ambroxan, Cashmeran, Habanolide, Helvetolide, ethyl maltol, Evernyl, Calone (https://safetymakeup.de/articles/verordnung-eu-20231545-vollstndige-liste-der-82-allergene-zur-kennzeichnung-kosmetischer-mittel). Since 31 July 2026 non-compliant products may not be placed on the EU market; older stock may be sold until 31 July 2028 (https://single-market-economy.ec.europa.eu/sectors/cosmetics/cosmetic-products-specific-topics/fragrance-allergens-labelling_en).
3. **Presence is reliable, dose is not.** At the 0.001% leave-on threshold (ALS, above), any use of a listed marker appears, so absence from a new label is evidence. Order carries dose only above 1%: ingredients under 1% may appear in any order (Article 19(1)(g), https://www.legislation.gov.uk/eur/2009/1223/article/19). Labels set weight only coarsely.
4. **New-format lists already show drydowns, but open data is sparse.** In Open Beauty Facts, CdG Blackpepper lists Iso E Super and acetyl cedrene first after parfum; Elie Saab Le Parfum Absolu lists Iso E Super, Galaxolide, patchouli oil and vanillin. The database holds 438 perfumes: 208 with ingredient text, 21 in new format; one of 14 Arab-house entries has a list (https://world.openbeautyfacts.org/api/v2/search?categories_tags=en:perfumes, 25 September 2026).
5. **Retailer coverage splits by region.** Notino UK (Sauvage EDT, list #09406/A) and Boots (Sauvage EDT #16097, EDP #16095) show full lists; Golden Scent (Lattafa Khamrah) and Niche Gallery (Thameen Sceptre) show only notes and accords (viewed 25 September 2026). Notino and Sephora block automated requests, so collection is manual. SFDA guidance requires INCI lists on cosmetics sold in Saudi Arabia (https://www.sanyogconformity.com/blog/sfda-labeling-requirements-for-cosmetic-products-in-saudi/, secondary), so boxes are a lawful source for Arab houses.
6. **Old-format lists say little, but consistently.** Both Sauvage EDT list codes carry the same six allergens in the same order; the EDP swaps two of them. Initio Oud for Greatness has three different lists at three sellers (search snippets, weak).
7. **The largest gap is the main family.** The brand's own new-format list for Baccarat Rouge 540 (code 2FROUGE540MFK3, https://www.franciskurkdjian.com/us-en/p/baccarat-rouge-540-eau-de-parfum-RA12232.html) names bitter orange peel oil, limonene, jasmine, benzyl benzoate and linalool, and none of the roughly 15% Ambroxan, 12% Evernyl and 3% ethyl maltol reported in reference/books/scent_and_chemistry_2022.txt line 6216.
8. **Vendors carry no ingredients.** Fragella returns notes, accords, performance and prices, no INCI (https://api.fragella.com/). FragDB offers accords, notes pyramid and community votes (https://fragdb.net/fragrantica).
9. **Volatility is documented per material, not in the book.** Scent and Chemistry gives stage windows (top 5 to 10 minutes, heart up to about 5 hours; line 5664) and a family order of evaporation (line 1964), but no material table. Suppliers do: Ambrofix lasts one month on a smelling strip (https://www.givaudan.com/fragrance-beauty/fragrance-ingredients-business/fragrance-molecules/ambrofix); Ambroxan substantivity exceeds 400 hours (https://www.thegoodscentscompany.com/data/rw1016071.html). families_proposed.json already lists 279 materials across 32 families.
10. **Label value on past corrections (my inference).** Of the 46 literature-driven changes, a new-format label would have flagged about 10 clearly (Iso E Super in Fahrenheit, Le Male, Déclaration; patchouli and rose in Black Aoud; coumarin in Twilly), about 10 possibly, and about 25 not at all (woody ambers, ethyl maltol, oud, lactone fruit, coffee).

## 3. Failure modes and falsifiers

- Labels name nothing for woody_amber, oud, vetiver, leather, incense, aldehydes, aquatic or coffee (items 2, 7). For the site's central family, A reduces to notes plus literature, which covers few perfumes.
- Dose: allergens sit below 1% in any order; position gives a rough rank at best.
- Lists differ by batch and seller; each needs its code and date stored.
- Volatility class is not stage: a heavily dosed base material can dominate the heart.
- Three sources and a precedence rule are more work than B for one builder.

Falsifiers:
- Fewer than 100 of 286 entries with a findable list by week 6: drop rank 2 at launch and ship labelled notes plus literature.
- On entries with both literature and a new-format list, label-derived tags contradict literature more often than notes-derived tags do: the material table is wrong.
- After six months, labels change fewer than one tag in ten entries: rank 2 is not worth its hours.

## 4. Weakest point of each rival

**B.** It publishes the error the site exists to correct (item 1), and "correct what users flag" depends on ratings the owner already judges unreliable. Its legal status is doubtful: FragDB's sales page is fragdb.net/fragrantica, its Kaggle sample is titled "FragDB Fragrantica Database", it sells review text with usernames (https://github.com/FragDB/fragrance-database), and it accepts cryptocurrency only. Licensing data derived from Fragrantica does not meet the no-Fragrantica constraint.

**C.** Coverage. The books covered 68 of 286; in audit part 3, 57 of 72 had no evidence, including every Parfums de Marly, Xerjoff and Initio entry. Labels name none of the woody-amber materials, so C would tag Baccarat Rouge 540 as citrus and jasmine and leave most Arab-house bottles, the ones Saudi users wear most, untagged and never recommended.

**D.** The site launches with no ratings, so for a year D is B plus a statistics plan. Pleasantness is the primary axis of odour perception (Khan et al. 2007, https://pubmed.ncbi.nlm.nih.gov/17855616/); a like-dislike score records where a perfume sits on it, not which material put it there. Roughly 30 to 37% of people cannot smell Galaxolide (scent_and_chemistry_2022.txt line 1992), so a dislike cluster mixes aversion with not smelling. Latent clusters also need names, which means tags again.

## 5. Cost

Money: $0 to $12 a month (Fragella Basic, already planned; A adds nothing). Builder hours to first useful version: about 40 (schema and source labels 8; INCI names and volatility classes 12; parser and stage rule 8; transcribing the first 100 lists 8; flag queue 4). Each further entry: 5 to 10 minutes.
