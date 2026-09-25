# Path D: data first (round 1 brief)

## 1. Claim

Path D keeps today's tags as priors. A shrinkage model sets each perfume's family weight per stage to its tag plus an offset learned from ratings, pulled toward zero the fewer raters the perfume has. A handful of votes moves nothing; ratings never overwrite a tag, they are weighed against it.

- **3 months.** The site runs on priors, as today. Added: a local fitting script over the Sheet export, a held-out test and a review queue. Expected data: a few hundred people, so no tag changes.
- **12 months** (assumption: 2,000 people each rate 3 to 8 perfumes; my simulation of popularity-skewed rating): about 18 perfumes reach 120 raters, enough to test a disputed drydown family; about 46 have a neighbour with 25 or more shared raters, enough for "people who hated this drydown also hated that one". At 5,000 people: 41 and 123. At 1,000: 7 and 24. Rarely rated perfumes stay on priors. Accuracy is measured on held-out drydown dislikes.
- **Honest limit.** In year one D checks fewer perfumes than the books did.

## 2. Evidence

1. Every current tag is a hypothesis. The books gave evidence for 68 of 286 entries and changed tags on 40 of those 68 (reference/debate/BRIEF.md line 20; 69 changes in reference/audit/applied_changes.jsonl). Where tags were checkable, most needed changes; 218 have no check.
2. The books are silent where this audience is: no review of "all ten Arab-house scents and every launch after 2018" (reference/audit/tags_part1_summary.md line 8); part 4 has 64 of 70 in neither book (tags_part4_summary.md line 5). Ratings can reach these; books cannot.
3. Material presence is not the percept a person rejects. Baccarat Rouge 540 carries about 12% Evernyl, yet no source says it smells mossy (tags_part1_summary.md line 31). The product profiles what people smell.
4. Most variance in odor pleasantness is individual: 54% personal taste, 41% molecule, 6% culture, across 225 people in 9 cultures (Arshamian et al. 2022, https://pubmed.ncbi.nlm.nih.gov/35381183/, abstract fetched via Europe PMC). Personal data hold information no tag holds, and Arabic and English raters can be pooled.
5. Chemistry predicts groups better than individuals, and is weakest on this site's families. In the DREAM challenge, pleasantness was predicted at r = 0.71 for the population and 0.41 for individuals; "wood" and "musky" were among the seven hardest descriptors (Keller et al. 2017, https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5455768/).
6. Anosmia mostly weakens a signal; it rarely reverses it. In the preprint, 7 of 8 significant receptor associations concerned intensity, not pleasantness (Trimmer et al., https://www.biorxiv.org/content/10.1101/212431v1.full). Musk anosmia is class-specific: OR5A2 covers polycyclic, linear and most macrocyclic lactone musks, OR5AN1 macrocyclic ketones, OR4D6 is judged "unlikely" to be a musk receptor, and Amoore's prevalence was 9% (https://academic.oup.com/chemse/article/doi/10.1093/chemse/bjae015/7642668). One white_musk weight cannot be right for everyone; a per-person factor can, and a "faded fast" chip already exists (data.js line 72).
7. The standard methods already discount small numbers. Neighbourhood recommenders down-weight similarities built on few shared raters (25 or more improved accuracy, 50 was best) or shrink them toward the prior with a typical constant of 100 (Nikolakopoulos et al., https://arxiv.org/pdf/2109.04584, p. 22).
8. Priors plus data do not lose to priors alone when data are sparse. Regression-based latent factor models derive item factors from item features (Agarwal and Chen 2009, https://dl.acm.org/doi/pdf/10.1145/1557019.1557029); LightFM "outperforms both collaborative and content-based models in cold-start or sparse" settings and matches pure factorisation when data are dense (https://arxiv.org/abs/1507.08439).
9. Choosing who rates what reduces error for new items (Netflix data, https://arxiv.org/abs/1406.2431). The site already names one unrated perfume to settle a suspect family (README.md lines 75 to 76).
10. Industry infers fragrance structure from liking. L'Oréal researchers map fragrance space from consumer liking plus expert "meta-variables" (Palczak et al. 2026, doi 10.1111/joss.70104, abstract via Crossref). Caveat: every consumer rated all 15 products; web data are sparse.
11. Traffic is the main limit. Only 1.74% of new pages reach Google's top ten within a year (https://ahrefs.com/blog/how-long-does-it-take-to-rank/). Sauvage EDT has 6,666 ratings on Parfumo after ten years (https://www.parfumo.com/Perfumes/Dior/Sauvage_Eau_de_Toilette, fetched today); the Sniff app has 115 App Store ratings (https://apps.apple.com/us/app/sniff/id1536435247).

**Test run for this brief** (Monte Carlo, not deposited): one perfume, one family disliked by 15% of raters, a 1.5-point drydown drop on the 5-point scale, raters' profiles classified at 80% sensitivity and 90% specificity. Detection power is 0.82 at 120 raters with a 5% false-positive rate. Anosmia at 9% lowers power from 0.87 to 0.82; at 30%, to 0.64. Perfect rater profiles give 0.99, so more ratings per person help more than more people. A 1-point drop needs about 200 raters.

## 3. Failure modes and falsifiers

- **Traffic.** Below about 1,000 people in year one, D is Path A's priors plus unused code.
- **Factors that are not materials.** Ratings may cluster on sweetness, strength, gender or hype; pleasantness is the main perceptual axis (Khan et al. 2007, https://pubmed.ncbi.nlm.nih.gov/17855616/). Families that co-occur (woody amber with white musk in modern drydowns) separate only through perfumes that have one without the other.
- **Selection bias.** People rate what they own and own what they like, so dislikes are under-reported and missing ratings are not random.
- **Skin.** Evaporation varies with skin properties (Hadjiefstathiou et al. 2025, https://pubmed.ncbi.nlm.nih.gov/40524649/): noise for tags, real for users.
- **Falsifiers.** (a) Fewer than 1,000 people by month 12. (b) Using reference/audit/data.before_audit.js as the prior, the data on well-rated perfumes move tags away from the book corrections (for example Grand Soir drydown woody_amber 0.3 to 0.8) as often as toward them. (c) Priors plus data fail to beat priors alone on held-out drydown dislikes. Any one ends the case for D.

## 4. Weakest point of each rival

**A. Provenance stack.** Its upper tiers are thin where the users are: 68 of 286 with book evidence and no Arab-house original. The allergen list now names Iso E Super, Galaxolide, Exaltolide and acetyl cedrene (https://cosmeservice.com/news/regulation2023-1545-changes-the-allergen-list/), which strengthens A, but Ambrox and Cashmeran are absent, labels show presence above 0.001% rather than how a material reads at each stage, and all products need them only from 31 July 2028. Its rule that ratings never rewrite tags means A cannot learn from the only source that observes stages on skin.

**B. Vendor and crowd first.** It adopts pyramids the audit found wrong where it matters: Le Male's base lists no musk while Scent and Chemistry reports 39% (tags_part2_summary.md line 30), and the Guide's reviewer found no oud in Oud Satin Mood (tags_part3_summary.md line 16). B drops the product's thesis that notes are not ingredients, and users can flag only what they can name.

**C. Materials first.** It leaves about three quarters of the catalogue untagged at launch, Arab houses included, and it records presence, not perception: 12% Evernyl, no reported moss. A profiler that recommends nothing for most searches loses the raters every path needs.

## 5. Cost line

Money: $0 a month beyond current hosting (Google Sheet backend, local Python with free libraries such as LightFM). Builder hours to first useful version: about 25 (fitting script with data.js priors, held-out test, review queue), then 1 to 2 hours a month. The first useful output depends on traffic, not hours: realistically month 6 to 12.
