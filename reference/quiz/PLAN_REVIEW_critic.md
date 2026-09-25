# Review of PLAN.md (landmark quiz)

## Blocking

1. **Test 2 contradicts decision 6.** PLAN.md:124-129. Khamrah's drydown holds woody_amber 0.5, above STRONG 0.4 (engine.js:82), so woody amber rests on two perfumes (badPossible, n 2, -1.32 with the clamp). No family is possible and seen once, so narrowing never appears and the narrowing and "after skipping" assertions fail. Eleven of the 19 possible kept bottles, Khamrah included, fail this way. Fix: keep Yara instead (woody amber n 1, 11 grid candidates, three picks), or assert that no narrowing screen appears.

2. **The told complaint is asked at zero ratings only.** PLAN.md:64 against ROUNDTABLE.md:50 ("Every visitor answers"). This departure is not listed under Decisions, it contradicts the plan's own "Everyone: the told complaint" line (PLAN.md:81), and removes the told answers D's falsifier needs from raters (ROUNDTABLE.md:63). Fix: ask it of everyone after the verdicts, or name the departure and delete that result line and falsifier.

3. **Several falsifiers cannot be measured.** PLAN.md:43, 100-101. "Another reason" writes and sends nothing, so "another reason under 10 percent of stops", "median taps below two" and "tap no bottle" (ROUNDTABLE.md:61-62; quiz_done n counts written ratings only) cannot be computed, and no event records tester or sample link clicks (63). Missed data cannot be recovered. Fix: send one `verdict:<option>` event per answered bottle and a click event for tester and sample links, and state when `tester:<id>` fires.

## Should-fix

4. **The clamp makes chips inert on a single stopped bottle.** engine.js:103; PLAN.md:17-21. A chip on -2 now adds -2, the rating's own value: Khamrah at -2 gives four families at -2.00 with or without "too sweet", same picks and settle suggestion. Every "turned on me" chip sits on a -2, so "What was wrong?" changes nothing for a one-bottle visitor; record item 5 holds only in the evidence text. The plan's figures hold: 11 of 60 golden scenarios change, all with a chip on -2; A's -1 gives woody amber -0.712. Fix: state this in Decision 1 and the README, or clamp strictly below the rating (for example v - 0.5) before regenerating the golden.

5. **`?add=` cannot add a lazy id.** app.js:224-231, 409, 498-500. AUTO is empty until the catalogue fetch resolves, so addPerfume silently does nothing at load. The parameter also stays, so a removed bottle returns on reload. Fix: retry the add when loadCatalogue resolves and clear the parameter with history.replaceState.

6. **The live sheet's header is never updated.** apps-script.gs:31 writes headers only when a sheet is created, so the existing ratings sheet gets an unlabelled 13th column, and tools/tag_queue.js:26-27 keys columns by header, so `src` is lost from exports. stats_ (apps-script.gs:75-86) also mixes +1/-2 quiz verdicts into the community drydown averages. Fix: write `src` into row 1 when it is missing, and decide whether stats_ counts quiz rows.

7. **`src` survives profiler edits.** app.js:191 sends every stored key, so a quiz bottle re-rated on the profiler is sent as "quiz", blurring the "later ratings contradict the verdict" falsifier. Fix: have app.js drop `src` when the profiler changes a rating.

8. **The result branch ignores existing ratings.** PLAN.md:64, 70-75. A visitor with profiler ratings who taps "None of these" is told no profile can be built. An all-null record left by a tester `?add=` link also counts as "already rated" on a retake (PLAN.md:47-48). Fix: branch on records with a stage set, as app.js:301 does, and treat all-null records as unrated.

9. **The tester count overstates.** PLAN.md:78-79. One failed tester gives badPossible, and recommend() excludes only badLikely (engine.js:128, 139), so nothing is excluded. The record's 101, 97 and 116 include the tester itself (100, 96, 115 without). Fix: word it as perfumes marked down and count without the tester.

10. **The grid question rules out the shop option.** PLAN.md:44, 52. Visitors asked about bottles worn "for a whole day or more" will not tap bottles they only smelled. Fix: ask "worn or smelled in a shop", or drop the shop option and name that departure.

11. **quiz.js scope and vendor terms.** PLAN.md:24-26, 53-55. The backend lookup also needs AUTO, derived(), tagcache posting and custom ids (app.js:386-432), far beyond 25 lines, and no quiz test checks that tagcache carries no notes or accords. Fix: add the page.test.js:103-108 assertion to quiz test 4.

## Notes

12. **Stub browser.** dom.js:66 sets `location.search` only from `endpoint`, so test 5 needs a new `search` option; dom.js:91 answers only `closest("button, a")`, so every clickable must be a button found that way. Fix: name the option and the selector in the plan.

13. **Artifact build.** PLAN.md:93 (ARTIFACT markers) conflicts with :112 (the articles route ignores them); build_artifact.py:7 does not list quiz.html for publishing. No grid bottle has an image in data.js, so without a backend all twenty tiles show the placeholder. Fix: use the articles route, update the docstring, and load catalogue images as app.js:228 does.

14. **Smaller gaps.** articles.html has no nav (lines 35-42), so the nav link needs new markup and T entries. Quiz links drop `?endpoint=`, so the mock-backend acceptance run loses the backend on the profiler. The anosmia note points to a white-musk tester that rated visitors never see. Narrowing checks the drydown when the stop was in the heart, and "up to four" is unclear (per family or in total). Decision 5 leaves "deciding family" undefined and ignores the heart (Sauvage lavender 0.6, Uomo Born in Roma vetiver 0.8). Fix: settle each in the plan.
