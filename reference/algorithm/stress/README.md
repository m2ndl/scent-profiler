# Stress test of the scoring (27 Sep 2026)

The findings are in `REPORT.md`; the independent reviews of the report and of the fix are condensed in `REVIEWS.md`. The scripts run the site's own code: the engine and note rows through
`tools/lib/site.js`, and the quiz page through the stub browser in `tests/lib/dom.js`. They change nothing in `site/`.
Each is seeded, so a rerun prints the same numbers for the same code and catalogue; each writes its numbers to `out/`.

| Script | Angle | Run | Time |
|---|---|---|---|
| `lib.js` | Synthetic wearers with a hidden taste, how they react to a perfume, how they answer the quiz, the baselines. | (library) | |
| `a1_accuracy.js` | Deal-breakers, likes, picks and "ruled out" against the hidden taste, by number of bottles and depth of answers, with random, bestseller and best-possible baselines, and by label. `--seeds` runs the three-bottle cell under five seeds (`out/a1_seeds.txt`). | `node a1_accuracy.js 1500 11`, then with `--seeds` | 7 min, 3 min |
| `a2_stability.js` | The same wearer answering twice, and naming a different three of their six bottles; which part of the quiz moves the result. | `node a2_stability.js 2000 23` | 1 min |
| `b_tags.js` | Judgement tags against mapper tags on the same perfumes; both against Fragrantica's crowd accords; what the disagreement costs the picks. Needs the cached pages (below). | `node b_tags.js 1500 41` | 1 min |
| `c_invariants.js` | The engine's promises on 40,000 quiz-shaped and profiler-shaped inputs, rating order, one-step changes, and hostile stored values. | `node c_invariants.js 20000 31` | 7 min |
| `c_order_trace.js` | The rating-order cases in `out/c.json`, traced to the family and scores that change. | `node c_order_trace.js` | seconds |
| `d_identify.js` | What the catalogue lets the quiz tell apart: common base families, families a turned bottle accuses, what the narrowing round can separate, the palate each quiz bottle votes for. | `node d_identify.js` | seconds |
| `e_bias.js` | Where the picks go: the other gender, tiers, the most picked perfumes, picks from a rated bottle's line. | `node e_bias.js 3000 53` | 20 s |
| `f_page.js` | What the result page says: palate, chips, pick lines, visible contradictions, Arabic against English, the palate on a retest. | `node f_page.js 1500 61` | 3 min |
| `f2_palate_cases.js` | The palate on the page for visitors who keep floral, rose or fresh perfumes, with the verdict alone and with "Loved it" on those note rows. | `node f2_palate_cases.js 150 81` | 40 s |
| `fix_trial.js` | The fixes for REPORT.md section 8 applied to the engine of commit 23cab69 in memory, the two ways of fixing "mixed" compared on the same visitors, the changes made after the independent review, and the fixed site engine checked against the adopted version visitor by visitor. | `node fix_trial.js 3000 97` | 4 min |
| `g_palate_whatif.js` | The quiz's palate rule copied (checked against the page), two other voting rules, bottles owned for what the visitor likes, and "I still wear it" crediting the heart too. | `node g_palate_whatif.js 3000 71` | 1 min |

`out/` holds the numbers the report cites, from the code as tested; `out/after_fix/` holds `c_invariants.js` and `f_page.js`
rerun on the fixed code.

`out/audit.txt` is the output of `reference/algorithm/audit.js 1500 7` (run from the repository root) on the commit tested.

`b_tags.js` reads Fragrantica pages from `reference/expansion/cache/perfumes/` (git-ignored). The 667 expansion pages were
cached when the catalogue grew; the pages of the older perfumes were fetched for this test with
`reference/expansion/fragrantica.py` (one page every 12 seconds), from the list in `out/judgement_urls.json`.
