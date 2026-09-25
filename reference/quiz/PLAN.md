# Build plan: the landmark quiz

Source of the design: reference/debate/quiz/ROUNDTABLE.md, section 5 (the path as amended). This plan turns
it into file changes. Where it departs from the record, the departure is named under "Decisions". Two plan
reviews (PLAN_REVIEW_critic.md, PLAN_REVIEW_dryrun.md) were folded in; the last section says how.

## What is built

A second page, `site/quiz.html` with `site/js/quiz.js`, that asks which well-known bottles the visitor
has worn, takes one verdict per bottle, writes those verdicts as ordinary ratings into the same device
store the profiler reads (`pp_ratings_v1`), asks one complaint question and one anosmia question, and
shows a result. A visitor with no bottles gets three testers, not a profile. The engine gets one fix
(complaint chips). The profiler page gets links to the quiz and a `?add=<id>` parameter. The backend
records a `src` column and events so the record's falsifiers can be measured.

## Decisions taken by the planner

1. **Chip fix in the engine: a chip scores half a point below the rating it sits on.** Today a chip
   enters at -1.5 (engine.js:103), so on a -2 rating it raises its own families' means (ROUNDTABLE.md
   item 6). New rule: `cv = Math.min(-1.5, v - 0.5)`, where `v` is the stage rating (never null there;
   engine.js:93 has already skipped null stages). On 0 or -1 the chip stays at -1.5 as today; on -2 it
   becomes -2.5, so the accused families always score below the perfume's other families. A plain clamp
   to the rating was rejected because it makes chips inert on a single stopped bottle (critic, item 4).
   Family means can now fall below -2; the profiler's score bar clamps its position to 0 to 100 percent.
   Expected effect: 11 of 60 golden scenarios change, all with a chip on a -2 rating.
2. **Shop sniff writes opening -1 only when it put the visitor off.** The record's item 2 writes opening
   -1 for "only smelled it in a shop"; a sniff the visitor liked is not evidence against anything. The grid
   question therefore asks about bottles worn or tried on the wrist in a shop.
3. **quiz.js is self-contained.** It mirrors app.js for storage, device id, sending with a timer and flush,
   the lazy catalogue, and the lookup with `derived()` and the tagcache post (about 80 lines). app.js
   changes only for the links, `?add=`, dropping `src` on edit, and the bar clamp. A test asserts the two
   pages send rating records with the same keys, and that the quiz's tagcache carries no notes or accords.
4. **Told answers stay on the page.** The complaint question (asked of everyone, record item 9) and the
   anosmia question are stored in `pp_quiz_v1` and shown as "you told us"; they never enter
   computeProfile and never exclude or rank a perfume (items 9 and 10). They are sent as events.
5. **Testers are fixed ids in data.js**, chosen by rule and checked by a test: in the drydown, the tested
   family at 0.8 or more and no other family at 0.4 or more; designer tier. The heart is ignored on
   purpose: the tester is smelled four hours on. Today's weights: sauvageedp (woody_amber 1, vanilla 0.3),
   narcisoforher (white_musk 0.8 or more, nothing else at 0.4), uomobornroma (vanilla 0.9, woody_amber 0.3).
   E2 prints the three drydowns before writing and stops if one fails the rule.
6. **One narrowing round, drydown-based.** After the verdicts, for each family that is a possible
   deal-breaker seen in one perfume, the page offers unrated grid bottles that hold that family at 0.6 or
   more in the drydown and every other family that was at 0.4 or more in the offending perfume's stage at
   under 0.2 (the same rule as settleSuggestion). At most four tiles in total, strongest family first.
   The visitor may answer or skip.
7. **A rating counts as existing only when a stage is set.** Grid tiles for such bottles show "already
   rated" and cannot be re-answered; an all-null record (for example one left by a tester link) is treated
   as unrated. The result branch also counts only records with a stage set, so a visitor with profiler
   ratings who taps "None of these" still sees a profile.
8. **Quiz verdicts are kept out of community averages.** `stats_` skips rows whose `src` is "quiz";
   when the profiler changes a quiz rating it deletes `src`, so the re-rated row counts.

## Verdict mapping (record item 2, amended by decision 2)

| Option shown per tapped bottle | Rating written | again | chips |
|---|---|---|---|
| I still wear it | drydown +1 | 1 | none |
| I stopped wearing it: it turned on me | -2 on the stage from "When did it bother you?" (first minutes = opening, first hours = heart, hours later or on my clothes = drydown; default drydown) | 0 | optional, written under that same stage |
| I stopped for another reason | nothing written | | |
| I tried it in a shop and it put me off | opening -1 | null | optional, on opening |

Every written rating has the shape app.js writes, `{ opening, heart, drydown, again, chips }`, plus
`src: "quiz"`. Every answered bottle sends a `verdict:<still|turned|other|shop>` event.

## Screens (both languages, Arabic RTL)

1. **Grid.** "Which of these have you worn on your skin, or tried on your wrist in a shop?" Twenty tiles
   (bottle image from the lazy catalogue when a backend supplies one, else the placeholder; name in the
   page language; house), multi-select; a search box (`id="q"`, the only such id on the page) over the
   verified catalogue and the lazy catalogue, with a backend lookup when `CONFIG.endpoint` is set (a name
   the lookup cannot find gives a toast pointing to the profiler page); "None of these"; "Continue".
   Grid ids (round1_A.md:31): sauvageedp, bleuedp, eros, cdnim, hawas, khamrah, yara, libre, blackopium,
   goodgirl, cocomademoiselle, lavieestbelle, br540, interlude, santal33, oudwood, badeealoud, adgedt,
   aventus, invictus. Continue sends `quiz_grid` with n = tiles tapped (0 for none).
2. **Verdicts.** One bottle at a time: name, image, the four options above. "Turned on me" opens two
   follow-ups on the same screen: "When did it bother you?" (three options) and "What was wrong?" (the ten
   chips from data.js, optional, multi-select, attached to the chosen stage). Each verdict is written and
   sent as soon as it is given.
3. **Narrowing** (decision 6, only when there are candidates): "One more would settle it: have you worn
   any of these?" Tiles with the same verdict flow, plus "None of these".
4. **Told complaint** (everyone): "Which of these has bothered you most in a perfume?" Options: too sweet,
   sharp / chemical, soapy, heavy / cloying, powdery, smoky, none of these. Stored as `pp_quiz_v1.told`
   (a chip id or "none"); event `told:<value>`.
5. **Anosmia** (everyone): "Do people say a perfume is strong on you when you can barely smell it?"
   Yes / No / Not sure. Stored as `pp_quiz_v1.anosmia`; event `anosmia:<yes|no|unsure>`.
6. **Result.** Sends `quiz_done` with n = ratings with a stage set.
   - With one or more such ratings: the profile's non-neutral families in the profiler's order, each
     with its class word, the bottles it rests on and the source word "from what you wore"; with two or
     more, the three recommendations from `recommend()` with the profiler's sample links; with one, a line
     saying one more bottle gives recommendations. Then "See the full profile" to `index.html#sec-profile`.
   - With none: "Your profile comes from perfumes you have worn, so it cannot be built yet." Three tester
     cards, ordered by the told complaint: the tester whose family has the highest weight in that chip's
     family map comes first (sweet puts vanilla first, chemical woody amber, soapy white musk); any other
     answer keeps the default order woody amber, white musk, vanilla. Each card names the family it tests,
     says "If this bothers you, N other perfumes in our catalogue carry the same family in their base"
     (N = catalogue perfumes other than the tester with that family at 0.5 or more in the drydown or 0.7 or
     more in the heart, computed live), shows the three sample links from CONFIG.links, and "Rate it when
     you have worn it" to `index.html?add=<id>`. A tester's sample link click sends `tester:<id>` with n =
     its position; a recommendation's link sends `sample:<id>`.
   - Everyone: "You told us: <chip>. Unconfirmed until a bottle shows it." When anosmia is yes or not sure:
     a note that musks and woody ambers may be hard for them to judge, naming the white-musk tester with
     its sample link. Neither line changes any list.
   - Links from the quiz to the profiler carry the `?endpoint=` parameter forward when the page has one
     (localhost testing only).

## File changes

- `site/js/engine.js`: in computeProfile's chip loop, `const cv = Math.min(-1.5, v - 0.5);` used both as
  the added value and as `ev.value`. Nothing else.
- `tests/fixtures/engine_golden.json`: regenerated with `node tests/engine.test.js --update`; the diff is
  reviewed by the planner before anything else is built on it.
- `site/js/data.js`: a `QUIZ` export beside FAMILIES and CHIPS: `{ grid: [20 ids], testers: [{ id, family }] }`.
  No perfume entry changes.
- `site/quiz.html`: a full document like articles.html (meta, fonts, site.css; no ARTIFACT markers), header
  with brand, a nav holding links to the profiler and the articles plus the language toggle,
  `<main class="wrap"><div id="quiz"></div></main>`, toast, scripts in this order: config, data, mapper,
  materials, evidence, engine, quiz.
- `site/js/quiz.js`: the page. Structure: script guard; localhost `?endpoint=` override as app.js;
  bilingual T; store, lang, device, ratings, quiz state; engine instance; lazy catalogue and images
  (`?catalogue=1`, as app.js); step machine (grid, verdicts, narrow, told, anosmia, result); render
  functions writing innerHTML; one document click listener on data attributes; send with a 1.2 s timer
  per perfume and flush on visibilitychange hidden and pagehide, as app.js; events through the existing
  record `{ type: "event", name, n, device, lang }`. Every clickable is a `<button type="button">` or an
  `<a>`, reached through `ev.target.closest("button, a")`; every element is reached by getElementById
  or built into innerHTML; no querySelector or querySelectorAll. Data attributes: `data-tile` (toggle a
  grid or narrowing tile), `data-none`, `data-continue`, `data-add` (a search result; the Enter key adds
  the first, as app.js), `data-verdict` (still, turned, other, shop), `data-when` (opening, heart,
  drydown), `data-chip` with `data-stage`, `data-told`, `data-anosmia`, `data-skip`, `data-event` on
  tester and sample links.
- `site/site.css`: styles for the grid tiles, verdict card, option buttons, tester cards, quiz nav;
  nothing existing removed or renamed.
- `site/index.html`: nav link to quiz.html (`id="nav-quiz"`) and a hero link under the lede
  (`id="hero-quiz"`). `site/articles.html`: a nav link to quiz.html beside its existing back link, with
  `navQuiz` added to its inline T in both languages the way `back` is set.
- `site/js/app.js`: T gains `navQuiz` and `heroQuiz`; renderChrome sets them; on load, `?add=<id>` adds
  that perfume if not yet rated, retrying once loadCatalogue resolves (for lazy ids), then removes the
  parameter with `history.replaceState` inside a try block; the rate, chip and again handlers delete
  `r.src`; the verdict bar position is clamped to 0 to 100.
- `backend/apps-script.gs`: `RATING_HEADERS` gains `src` at the end and the ratings appendRow adds
  `clip_(body.src, 20)`, both in one edit; `sheet_()` writes any missing header cells into row 1 when an
  existing sheet has fewer header columns than the list; `stats_` skips rows whose `src` is "quiz".
- `tools/build_artifact.py`: quiz.html handled by the articles route (head and body extraction), docstring
  updated to list it.
- `tools/mock_backend.py`: no change (it stores whole bodies and prints events).
- `tests/lib/dom.js`: a `search` option that sets `location.search` (combined with the endpoint form when
  both are given) and a `history.replaceState` stub that records calls; page.test.js must pass unchanged.
- `tests/quiz.test.js`: see Tests. `tests/site.test.js`: QUIZ grid and tester ids resolve; each tester
  passes the rule in decision 5.
- `README.md`: layout rows for quiz.html and quiz.js; a "Quiz" section with the verdict table, the told
  and anosmia rules, the events and which falsifier each measures (ROUNDTABLE.md section 6); the chip
  rule added to "How the profile is computed"; a note that the live ratings sheet gains a `src` header on
  the first post after deploy. `CLAUDE.md`: quiz.js named in the layout line.

## Tests (tests/quiz.test.js, stub browser; assertions read `page.snapshot()` HTML with regexes)

1. quiz.html's scripts load in the listed order; the grid shows the twenty QUIZ ids as tiles.
2. Two bottles: sauvageedp "turned on me", "hours later", chip "chemical"; yara "still wear it". Stored
   ratings equal `{ opening: null, heart: null, drydown: -2, again: 0, chips: { drydown: ["chemical"] }, src: "quiz" }`
   and `{ opening: null, heart: null, drydown: 1, again: 1, chips: {}, src: "quiz" }`. Narrowing offers at
   least one tile and every offered tile has woody_amber at 0.6 or more in its drydown. After skipping, the
   told screen, the anosmia screen, then a result whose profile section names woody ambers as a possible
   deal-breaker with the "worn" source word and shows three recommendations in `recommend()`'s order.
3. Zero bottles: "None of these", told "sweet", anosmia "yes". Result shows three tester cards, the vanilla
   tester first, each with three links carrying the encoded house and name; no recommendations;
   `pp_quiz_v1.told` is "sweet" and `.anosmia` is "yes"; the anosmia note names the white-musk tester.
4. With a backend: each rating record carries `src: "quiz"` and no `auto` or `label` key; events
   `quiz_grid`, `verdict:turned`, `verdict:still`, `told:sweet`, `anosmia:yes`, `quiz_done` are posted with
   the right n; a pending rating goes out as a beacon on hide; a lookup's tagcache post carries no `notes`
   or `accords` (as page.test.js asserts for the profiler).
5. Integration: the profiler page (index.html scripts) loaded with the quiz's localStorage shows both quiz
   bottles as rated cards with the quiz's values; re-rating one there removes `src`; `?add=sauvageedp`
   adds it and replaceState was called.
6. Language: the Arabic toggle sets `dir="rtl"`, stores `pp_lang`, and tiles show Arabic names.
7. Mirror: the key set of a quiz rating record equals the key set of an app.js rating record plus `src`.

## Acceptance

- `node --test tests/*.test.js` passes; the golden diff touches only scenarios that carry a chip on a -2
  rating, and the planner has read it.
- In the browser against `python tools/mock_backend.py 8765`, both flows above work in English and
  Arabic, on a 375 px wide viewport as well as desktop, with no console errors.
- No em dashes in any string. No vendor note list stored or sent.
- `python tools/build_artifact.py` prints OK and the artifact folder contains quiz.html.

## Do not touch

engine.js beyond the chip line; any perfume entry or FAMILIES or CHIPS in data.js; evidence.js;
mapper.js; materials.js; the backend's VERIFIED list; anything under reference/ except this folder;
git (no commits, no adds).

## Execution schedule

One agent at a time, none on the Fable model; the planner (this session) runs tests and reviews between steps.

- **E1 (Opus):** engine chip rule, golden update, README sentence, app.js bar clamp. Planner reviews the
  golden diff.
- **E2 (Opus):** data.js QUIZ block, site.test.js additions.
- **E3 (Opus):** quiz.html, quiz.js, site.css, index.html and articles.html links, app.js (`?add=`, `src`
  drop, T strings), backend, build_artifact.py, dom.js additions, README and CLAUDE.md, tests/quiz.test.js.
- **V1 (Opus, fresh):** verifies against this plan: runs the tests, reads the diff, drives both flows in
  the stub browser with its own inputs, checks the Arabic strings for sense and for em dashes, and returns
  a verdict (blocking, should-fix, note) with a paste-ready fix list.
- **E4 (Opus):** applies the fixes. Planner runs the tests and the browser check, then reports.

## How the reviews were folded in

Critic: 1 test 2 now keeps Yara; 2 the told question is asked of everyone; 3 verdict, grid, tester and
sample events added; 4 chip rule changed to half a point below the rating; 5 `?add=` retries and clears
the parameter; 6 header written into row 1 and quiz rows skipped by stats_; 7 `src` dropped on profiler
edit; 8 result and "already rated" branch on records with a stage set; 9 tester line counts other
perfumes carrying the family; 10 grid question includes shop trials; 11 lookup scope stated and the
tagcache assertion added; 12 dom.js `search` option and the button-or-anchor rule stated; 13 articles
route, docstring, catalogue images; 14 articles nav, endpoint carried forward, anosmia note names the
tester, narrowing rule fixed to settleSuggestion's, testers defined on the drydown. Dry-run: 1 null
branch dropped; 2 told ordering fallback stated; 3 as critic 13; 4 and 5 as critic 14; 6 as critic 5;
7 data attributes named; 8 tests read snapshot HTML; 9 one `id="q"`; 10 chips written under the chosen
stage; 11 header and row edited together; 12 tester weights printed before writing.
