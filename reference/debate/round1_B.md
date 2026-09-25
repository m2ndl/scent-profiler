# Path B: vendor and crowd first

## 1. Claim

**3 months.** Every perfume a user types that Fragella knows (80,000+) gets per-stage family tags from one API call, mapped by the existing mapper.js. The 286 audited entries stay as they are. This covers the Arab-house perfumes Saudi users own, which no other path can tag. Accuracy is marketing-level: right where the pyramid or crowd accords name the family, wrong where a material is named only by a vague note ("amber", "woody notes") or not listed at all. Cost: $12 a month and about 25 builder hours.

**12 months.** Several thousand demand-driven entries, a flag queue that sends the most-rated perfumes to hand review, and the saved hours spent on Arabic content, sharing and sample links. B does not claim material truth. It claims the most coverage per hour a solo builder can get.

## 2. Evidence

1. **Material evidence does not cover the perfumes users own.** Across tags_part1 to tags_part5.json, 61 of 286 entries have direct evidence in either book (31 Guide, 37 Chemistry); the BRIEF counts 68 with clones. Of the 42 Arab-house originals in data.js, none has any (my count; also reference/audit/tags_part1_summary.md line 8, tags_part4_summary.md line 5). No Parfums de Marly, Xerjoff, Initio or Mancera entry in part 3 has any (tags_part3_summary.md line 7).

2. **A test that counts against B.** I ran mapper.js on the pre-audit note lists (reference/audit/data.before_audit.js) and compared the output with the 69 applied corrections (applied_changes.jsonl). Mechanical mapping reproduces 8 of 69 (6 of 64 increases, 2 of 5 decreases). It misses unlisted or misnamed materials: Grand Soir's woody amber, Le Male's musk, the ethyl maltol in Baccarat Rouge 540.

3. **The vendor feed is richer than the lists the audit started from.** In the FragDB sample (huggingface.co/datasets/FragDBnet/fragrance-database), Black Orchid's pyramid includes "Mexican chocolate", which the audit reported absent (tags_part1_summary.md line 32). La Vie Est Belle's crowd "powdery" accord (53%) maps to a drydown iris of 0.48, matching the expert correction to 0.4. The cost: "powdery" appears in 7 of the 10 sample perfumes, so unscaled accord floors put iris into most drydowns.

4. **Fragella** (api.fragella.com, /docs): 80,000+ fragrances; Top, Middle and Base notes; "Main Accords" with a Dominant or Prominent level; longevity, sillage, season and occasion rankings; image URL; price; a /similar endpoint. Basic costs $12 a month for 5,000 requests. Fragella says a model fills "missing data points (like sillage, longevity, or accords)", so some accords are predicted, not voted.

5. **Fragella's terms** (api.fragella.com/terms-of-use.html) forbid caching "large portions of the API data" to avoid calling the API. The current apps-script.gs stores every payload for everyone (lines 111 to 146). Under B the sheet keeps our derived family weights and the Fragella id, not the raw notes.

6. **FragDB fails the legal test.** It sells a "Fragrantika" catalogue of 140,230 records, $200 one-time, payable only in cryptocurrency (fragdb.net/purchase), and its terms disclaim ownership of the underlying facts (fragdb.net/legal). It is repackaged Fragrantica. B should not buy it, despite useful fields (reminds_of, pros_cons, Arabic labels; github.com/FragDB/fragrance-database).

7. **Crowd accords are crowd-weighted notes.** Fragrantica's accords come from "an algorithm that aggregates the notes voted by users" (osmetheca.be/en/guides/how-to-read-a-fragrantica-entry). They correct emphasis; they cannot add a material nobody listed.

8. **Ingredient data is sparse where it matters.** Golden Scent's Khamrah page shows notes and family, no INCI (global.goldenscent.com). SkinSAFE lists Khamrah's allergens alphabetically, old list only (skinsafeproducts.com). Ingredients under 1% may be listed "in any order" (Regulation 1223/2009 Art. 19, legislation.gov.uk). Open Beauty Facts holds 438 perfumes, 208 with ingredient text; the INCI name for Iso E Super appears in 12 (API query, 25 September 2026).

9. **The new allergen list** (cosmeservice.com/news/regulation2023-1545-changes-the-allergen-list, checked) adds Iso E Super (tetramethyl acetyloctahydronaphthalenes), Galaxolide (hexamethylindanopyran), hexadecanolactone, acetyl cedrene, vanillin, santalol, sclareol and patchouli oil. It omits Ambrox, Cashmeran, Norlimbanol, Habanolide and ethyl maltol, the materials behind woody_amber and the Baccarat Rouge sugar. Labels apply from 31 July 2026 (new products) and 2028 (all). Presence above 0.001% separates little: every perfume contains musks, and about 40% contain Ambrox at trace level (taxonomy_audit.md line 20).

10. **Competitors and research.** Scentbird and PERFUMIST build profiles from notes, families and ratings (scentbird.com/blog/find-your-perfect-scent-with-the-new-scentbird-quiz; App Store listing). The one competitor with a material layer, Nose Paris, got it from perfumers who "reconstructed over 12,000 perfume formulas" (noseparis.com/en/nose-olfactive-diagnosis). Published recommenders use Fragrantica-style notes with small evaluations (30 respondents, Precision@3 0.867; Aryanto et al., IC-ITECHS 2026). The RecSys 2025 paper (Luţan) is a doctoral agenda with no results. I found no study of dislike avoidance on any data source.

## 3. Failure modes and falsifiers

- **Low discrimination.** Accord floors, and the rule sending "amber" half to amber_resin and half to woody_amber (mapper.js line 20), make many drydowns look alike. Fix: apply floors only to Dominant or Prominent accords.
- **Misses on the site's own thesis.** The hidden materials in item 2 are the drydown problems the site exists to explain. B tags them only after users flag them.
- **Terms.** If Fragella rules that storing derived tags also breaches its terms, every page view costs a request.
- **Arab-house coverage in Fragella is untested.** I had no key to query it.

B is falsified if (a) the owner checks 30 auto-tagged Arab-house perfumes he has smelled and the top drydown family is wrong in more than half; (b) after 300 rated recommendations, recommended drydowns score no better than random catalogue picks; or (c) fewer than 70% of typed queries find a Fragella match.

## 4. Weakest point of each rival

**A.** Higher evidence can override a tag only where it exists: literature for about a quarter of famous Western perfumes and no Arab original, and INCI rarely on Saudi retail pages and without doses. A pays for a material table with volatility classes and per-tag provenance, then serves B's tags to most users. It also invites false positives: an allergen present at 0.002% enters as a family, and the label cannot show it is a trace.

**C.** Coverage is the problem. With evidence for 68 of 286 famous perfumes and none of the 42 Arab originals, a Saudi user who rates Khamrah, Asad and Hawas gets no profile. Some evidence is also dated: the Le Male figures describe the original formula and "current batches may differ" (tags_part2_summary.md line 30). C cannot launch within weeks.

**D.** Its first year is B, because it runs on priors, and its second needs co-rating density a new anonymous site will not reach. Galaxolide goes unsmelled by 30 to 37% of people (taxonomy_audit.md line 19), so a latent "musk" cluster will partly be an anosmia cluster. The crowd volume D needs already exists elsewhere: La Vie Est Belle carries about 35,600 appreciation votes in the FragDB sample.

## 5. Cost

$12 a month (Fragella Basic; $9.83 on yearly billing). About 25 builder hours to a first useful version: store derived tags instead of payloads (4), scale accord floors by level (6), enrich the 286 once (2), flag-and-promote queue (8), regression test against the audit sample (5). The lookup and mapper already exist.
