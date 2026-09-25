# Round 1 brief, Path C: materials first

## 1. Claim

At 3 months: about 150 perfumes carry family tags, each resting on a named material from a dated source: an EU-format ingredient list, a formula figure in Scent and Chemistry, or an expert naming the material. Each tag stores source, date, market and formula number where printed. Other entries show "not yet evidenced" and the recommender ignores them. Target accuracy: no tag that the perfume's own label contradicts.

At 12 months: 400 to 600 perfumes. Every new EU launch from 31 July 2026, and all EU stock from 31 July 2028, must declare the expanded list (26 plus 56 allergens), and users can submit the list from their own box (evidence they can check, not opinion).

The limit: 13 of our 28 families have no declarable marker, including woody ambers (Ambroxan type), the family our own hint text blames first. For those, C depends on the book and expert statements, which reach few current perfumes. Cost: under $10 a month, about 80 hours to a first version.

## 2. Evidence

1. The audit. Of 286 entries, 68 had literature evidence and 40 of those needed corrections (BRIEF.md line 20). Formula figures produced the largest: Fahrenheit Iso E Super 25% (reference/audit/tags_part1_summary.md:18), Le Male base 39% musk (tags_part2_summary.md:15), Bois d'Argent 13.6% Ambrox (tags_part4_summary.md:13). Of 69 applied changes, 18 cite a formula figure, 28 a Guide description, 23 copy an original (applied_changes.jsonl, my count).

2. New label test. The official Parfums de Marly pages (parfums-de-marly.com/products/ althair, layton, herod, delina, pegasus, percival, greenley, sedley, carlisle, kalan, oriana, valaya) all show EU-format lists. All 12 were in the audit's no-evidence group (tags_part3_summary.md:7). Tetramethyl acetyloctahydronaphthalenes (Iso E Super, which families.json files under cedar_dry) is declared in 11 of 12, always among the first two fragrance materials; our tags have no cedar_dry in 6 of those 11 and 0.3 or less in 4 more. Kalan declares none, so the lists discriminate. 8 of 12 entries miss a family whose marker is among the first two declared materials, or carry a tag the label rules out. Althaïr (data.js:116) and Pegasus (data.js:652) carry tonka_coumarin though neither declares coumarin, which must be listed above 0.001%. Greenley and Oriana carry patchouli with no patchouli oil declared. Layton and Herod declare both patchouli oil and coumarin; neither family is tagged.

3. What the 2023/1545 list names (cosmeservice.com/news/regulation2023-1545-changes-the-allergen-list/; alsglobal.com/en/news-and-publications/2024/07/eu-regulation-2023-1545-fragrance-allergen-labeling): Iso E Super, Galaxolide (hexamethylindanopyran), hexadecanolactone, acetyl cedrene, rose ketones, santalol, sandalwood oil, patchouli oil, Virginia and Atlas cedar oils, vanillin, sclareol. Absent: Ambrox, Cashmeran, Norlimbanol, Habanolide, Hedione, ethyl maltol, Evernyl, vetiver oil. Mapped to families.json, 15 families have at least one declarable marker, several only partly (musks, iris, resins).

4. Baccarat Rouge 540: Scent and Chemistry gives Ambroxan ca. 15%, Evernyl ca. 12%, ethyl maltol ca. 3% (reference/books/scent_and_chemistry_2022.txt:6216). None is declarable. Its Open Beauty Facts record (world.openbeautyfacts.org/product/3700559603116) lists only limonene, benzyl benzoate and linalool as fragrance materials.

5. The book's reach: its perfume index names 493 perfumes (lines 10512 to 11577). By script, about 180 have at least one material percentage, and only 7 of those launched in 2010 or later.

6. Pyramids omit the leading material: none of the five official pyramids I read (Althaïr, Layton, Herod, Delina, Valaya) names Iso E Super, and all five labels declare it near the top.

7. Formulas change. Lilial banned in the EU from 1 March 2022 (cosmeservice.com/news/eu-commission-publishes-an-amendment-regulation-eu-2021-1902/); IFRA's 51st amendment added more than 40 standards, with existing creations to comply by 30 October 2025 (ul.com/news/ifra-notifies-51st-amendment-ifra-standards). Oakmoss classics were reformulated with Evernyl (scent_and_chemistry_2022.txt:4530), which moves oakmoss off the label. Book figures age; labels follow the formula.

8. Retailer lists for one product disagree: Lattafa Khamrah shows 15 items at boozyshop.com/products/khamrah-eau-de-parfum and about 23 at skinsafeproducts.com. Every label needs a date and market.

9. GC-MS is accurate but costly: PerfumersWorld charges $600 a sample and identifies 90 to 98% of a formula down to about 0.1% (perfumersworld.com/gcms-analysis.php); Aromaverse $250 to $425 (aromaverse.pro/gcms/); ScentFormulas sells 77 reconstructions for personal use only (scentformulas.com).

10. Open data is thin: Open Beauty Facts holds 438 products in its perfumes category, 208 with any ingredient text (API query, 25 September 2026). Almost 5,000 perfumes launched in 2020 and 2021 (fragrancesoftheworld.com/TheReferenceBook).

## 3. Failure modes and falsifiers

- Coverage. If fewer than half of the perfumes users try to rate are tagged at month 3, C cannot infer dislikes for most users. Log this share from day one.
- Undeclared families. If woody ambers and oud dominate what users reject, and remain untagged for over 80% of the catalogue at month 6, C's main source cannot serve the product's central claim.
- Trace declarations. A 0.001% threshold means declared is not the same as smelled. Rule: only materials listed before water, or among the first few fragrance materials, set a weight; the rest record presence only. Falsifier: if label-based tags predict stage dislikes no better than note-based tags on the site's own ratings (ratings used as a test, never a rewrite), C's accuracy claim fails.
- Drift. If more than one in five rechecked perfumes shows a changed list within a year, labels need rechecking at a rate one person cannot sustain.
- Collection. Dior and Chanel product pages refused automated reading in my test, so collection is manual.

## 4. Weakest point of each rival

**A (provenance stack).** Most entries will sit on the lowest layer, because the upper layers reach few perfumes, and the lowest layer is the one the audit corrected in 40 of 68 cases and the label test disagreed with in 8 of 12. For the 13 families no label can show, including woody ambers, notes remain the only source. A therefore ships C's evidence plus a larger body of note-derived tags that the recommender must either trust or down-weight by a factor nobody can calibrate. The user sees one tag and cannot see its grade.

**B (vendor and crowd).** Fragella's documented fields (api.fragella.com/docs.html) are notes, accords, longevity and similar; there is no ingredient field. B cannot see Iso E Super in any of the five Parfums de Marly perfumes above, because their pyramids leave it out. "Correct what users flag" does not reach this, since users cannot flag a material they were never told about. B keeps the product and drops its thesis.

**D (data first).** Latent factors from ratings cannot name a material when materials occur together: Iso E Super appears in 11 of 12 Parfums de Marly labels, often beside Galaxolide and vanillin, so a "Marly drydown" factor cannot say which of the three people reject. Specific anosmia to some musks (6 to 9 percent, BRIEF.md line 36) adds noise exactly where our families are hardest. D needs material data to name its factors, which is C's output.

## 5. Cost line

Money: $0 to $10 a month; no vendor fee. GC-MS ($250 or more a sample) stays outside the budget. Hours to first useful version: about 80: material table for the listed allergens and about 40 book-quantified non-allergens with volatility classes (15), labels for 150 perfumes at about 12 minutes each (30), provenance fields and re-tagging (15), "unknown" handling in recommender and interface (20). Upkeep about 3 hours a week.
