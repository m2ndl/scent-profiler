# Stress test of the scoring (27 and 28 Sep 2026)

The findings are in `REPORT.md`, and those on where the picks go (the owner's question of 28 Sep: do they repeat a few
perfumes?) in `COVERAGE.md`; the independent reviews are condensed in `REVIEWS.md`. The scripts run the site's own code: the engine and note rows through
`tools/lib/site.js`, and the quiz page through the stub browser in `tests/lib/dom.js`. They change nothing in `site/`.
Each is seeded, so a rerun prints the same numbers for the same code and catalogue; each writes its numbers to `out/`.

| Script | Angle | Run | Time |
|---|---|---|---|
| `lib.js` | Synthetic wearers with a hidden taste, how they react to a perfume, how they answer the quiz, the baselines. | (library) | |
| `a1_accuracy.js` | Deal-breakers, likes, picks and "ruled out" against the hidden taste, by number of bottles and depth of answers, with random, bestseller and best-possible baselines, and by label. `--seeds` runs the three-bottle cell under five seeds (`out/a1_seeds.txt`). | `node a1_accuracy.js 1500 11`, then with `--seeds` | 7 min, 3 min |
| `a2_stability.js` | The same wearer answering twice, and naming a different three of their six bottles; which part of the quiz moves the result. | `node a2_stability.js 2000 23` | 1 min |
| `b_tags.js` | Judgement tags against mapper tags on the same perfumes; both against Fragrantica's crowd accords; what the disagreement costs the picks. Needs the cached pages (below). | `node b_tags.js 1500 41` | 1 min |
| `c_invariants.js` | The engine's promises on 40,000 quiz-shaped and profiler-shaped inputs, rating order, one-step changes, one note card more (from 28 Sep: what the picks read of its families must move its way), and hostile stored values. | `node c_invariants.js 20000 31` | 8 min |
| `c_order_trace.js` | The rating-order cases in `out/c.json`, traced to the family and scores that change. | `node c_order_trace.js` | seconds |
| `d_identify.js` | What the catalogue lets the quiz tell apart: common base families, families a turned bottle accuses, what the narrowing round can separate, the palate each quiz bottle votes for. | `node d_identify.js` | seconds |
| `e_bias.js` | Where the picks go: the other gender, tiers, the most picked perfumes, picks from a rated bottle's line. | `node e_bias.js 3000 53` | 20 s |
| `f_page.js` | What the result page says: palate, chips, pick lines, visible contradictions, Arabic against English, the palate on a retest. | `node f_page.js 1500 61` | 3 min |
| `f2_palate_cases.js` | The palate on the page for visitors who keep floral, rose or fresh perfumes, with the verdict alone and with "Loved it" on those note rows. | `node f2_palate_cases.js 150 81` | 40 s |
| `fix_trial.js` | The fixes for REPORT.md section 8 applied to the engine of commit 23cab69 in memory, the two ways of fixing "mixed" compared on the same visitors, the changes made after the independent review, and the fixed site engine checked against the adopted version visitor by visitor. | `node fix_trial.js 3000 97` | 4 min |
| `g_palate_whatif.js` | The quiz's palate rule copied (checked against the page), two other voting rules, bottles owned for what the visitor likes, and "I still wear it" crediting the heart too. | `node g_palate_whatif.js 3000 71` | 1 min |
| `h_coverage.js` | Where the picks go, on the engine of commit 0164d00: six populations, against the best three for each visitor's hidden taste and three random perfumes; the tag shape of the most picked; the families counted as liked against the true likings; variants of the ranking, each changing one suspected cause; reachability. Its copy of the ranking matches the site only on that engine. | `node h_coverage.js 3000 101` | 6 min |
| `rank_trial.js` | The ranking of `recommend()` rewritten with switches (a liked family counted once or in every stage, traces, the visitor's side, scores read to nine places), for trials. With no switch it is the ranking of 0164d00. | (library) | |
| `j_trial.js` | The switches trialled on the same visitors: coverage, kept and turn (the headline population under five seeds), other gender, niche, the catalogue in another order, tags shaken by 15%, perfumes ever picked, reachability; and a check that the site's `recommend()` picks what the adopted switches pick for every visitor (`--check` runs only that). | `node j_trial.js 2000 211`, `--check` | 8 min, 5 min |
| `i_extremes.js` | Extreme but valid answers through the engine and the quiz page: every card avoided or loved, every quiz bottle kept or turned, one bottle, words only, up to 1,000 profiler ratings. | `node i_extremes.js 131` | 20 s |
| `m_wordsteps.js` | One note card more, enjoyed or avoided, on the first version's reading of the profile (traces back at full weight once a word is given) and on the site's: how often the picks move against the word. | `node m_wordsteps.js 3000 31` | 20 s |
| `l_tagnoise.js` | Pick quality when the engine reads the tags shaken by 15% or 30% while the visitors smell the catalogue's, for the ranking of 0164d00 and the site's. | `node l_tagnoise.js 2000 307` | 3 min |
| `k_cards.js` | Pick cards that call a family liked, or say the answers lean against it, when it is known only from traces, and cards that say the opposite of the visitor's words, on the engine of 0164d00, on ce09d2b and on the site's; perfumes with identical tags. | `node k_cards.js 1500 5` | 2 min |

`out/` holds the numbers the report cites, from the code as tested; `out/after_fix/` holds `c_invariants.js` and `f_page.js`
rerun on the fixed code; `out/after_coverage/` holds the checks rerun on the engine that counts a liked family once
(`c_invariants.js`, `a1_accuracy.js --seeds`, `e_bias.js`, `f_page.js`, `i_extremes.js` and the audit). `out/h.txt`,
`out/i.json` and `out/k.txt` are from the engine of 0164d00 (k also from the site's), `out/j.txt` compares the two.

`out/audit.txt` is the output of `reference/algorithm/audit.js 1500 7` (run from the repository root) on the commit tested.

`b_tags.js` reads Fragrantica pages from `reference/expansion/cache/perfumes/` (git-ignored). The 667 expansion pages were
cached when the catalogue grew; the pages of the older perfumes were fetched for this test with
`reference/expansion/fragrantica.py` (one page every 12 seconds), from the list in `out/judgement_urls.json`.
