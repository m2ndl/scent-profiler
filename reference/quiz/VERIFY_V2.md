# V2 verification: the deeper quiz

Verdict: one blocking, three should-fix, ten notes. The engine keeps its safeguards, both pages show the same picks, and records, events and backend columns match PLAN2.md. B1 is a plan defect E7 implemented as written.

Checks:
- `node --test tests/*.test.js`: 67 pass, 0 fail (engine 17, notes 15, page 8, quiz 18, site 9).
- `node tests/engine.test.js`: 17 pass; `sync_backend.js --check`: "VERIFIED list is current".
- `python tools/build_artifact.py`: "OK 28113 bytes"; build/artifact/quiz.html loads js/notes.js.
- Golden: `golden_diff.js` output is identical to E1_golden_diff.txt (same 11 seeds).

Engine probes: Khamrah "still" plus 80 told items and seed 5018 plus "avoid cedar" leave every family with n of 1 or more unchanged, with the same picks; 2,400 random told runs over the 60 scenarios changed none, and no class or likely list. On Baccarat Rouge 540 (heart +2, drydown -2), a woody amber answer replaces only the drydown. Answers on families not held are skipped (no NaN). TOLD_PRIOR gives 0.5, 0.667 and 0.231, as documented.

Stub-browser runs (Arabic three-bottle run with Back across bottles, rounds and the picker; narrowing with skip-all; zero bottles with "sweet", "avoid vanilla" and "Nothing has bothered me", where vanilla nets to -0.04; a lookup bottle): records, `pp_quiz_v1` and events were right, and profiler picks matched the quiz's.

## Blocking

**B1. site/js/app.js:50, :116, :416. "Which you said you avoid" names families the visitor never mentioned.** Kind "told" fires when every told item for a family is negative, taste side effects included. Zero bottles, "sweet" plus "avoid vanilla": the profiler's first pick reads "Contains Citrus in the opening, which you said you avoid." Citrus came only from the bitter side of "sweet". In 1,180 random rated runs, 1,203 told risks reached picks; 348 came from the taste answer alone, 785 had no picker card behind them. It breaks the plan's rule that word answers are labelled as such.

## Should-fix

**S1. site/js/quiz.js:640. Disagreement line on side effects (E7 choice 10).** The test's own full run flags a loved lavender because the soapy chip reaches it at 0.3. Of 3,010 lines in the same runs, 1,486 rest on a picker card's main family; 580 come from taste alone and 638 from chips alone. Yes, limit it: picker-card and chip items at weight 0.5 or more, with the answer named.

**S2. site/js/quiz.js:41, :100. "Parts" in the intro (E7 choice 2).** Reading it as the bottle's rows is right (the plan's example matches Sauvage's four rows), but the word sits under "Part 1 of 4", and "في أربعة أجزاء" reads as a perfume in four instalments.

**S3. Arabic**, items 1 to 6 below.

## Notes

- **N1. E7 choices accepted.** 1 matches the profiler's Hate-to-Love scale (app.js:328). 3, 4, 5 and 8 fit the plan. 7: vendor note lists are never kept, so "not on its note list" would be false. 9: at one bottle the heading would be false; PLAN2 should say "no rated bottle". 11: ملابس shares the root.
- **N2. Choice 6 (quiz.js:303-314).** 60 catalogue row words hold a card word inside a phrase ("white musk", "jasmine sambac"), so those cards are asked again. Plain containment would wrongly hide 23 ("green apple", "orange blossom"). Rule if wanted: whole-word containment plus the same family.
- **N3. engine.js:166.** The weak-evidence branch has no prior: Sauvage Elixir (vetiver 0.3) rated 0 plus "enjoy vetiver" scores 0.571, above the no-bottle 0.5; rated -2 it moves to -0.286. As planned; the planner's call.
- **N4. tests/engine.test.js:131-132** hand-code taste weights unlike QUIZ.taste (the invariant still holds). Use `N.toldItems`.
- **N5. tests/site.test.js:123** has the only em dash in the changed files, a literal in the em-dash check. Use `String.fromCharCode(0x2014)`.
- **N6. backend/apps-script.gs:21, :63-69.** The 15 headers and 15 cells align in order. `(body.unnoticed || []).join` throws on a non-array, as chips do.
- **N7.** "Rate its notes" asks a shop trial about its drydown (worn rows, per plan).
- **N8.** Closing the tab on a note screen loses that bottle's verdict event.
- **N9.** Khamrah's catalogue "مر" (myrrh) reads as "مرّ" (bitter) in its note line; perfume entries are do-not-touch.
- **N10.** The phone-width browser pass is still open.

## Arabic

No form of لبس appears in quiz.js, app.js, notes.js, data.js QUIZ, the HTML files or the README. The rest reads well.

1. quiz.js:133 disagree, now the calque "والعطور تُحتسب أكثر": `عطورك وإجابتك (${w}) لا تتفقان، ولعطورك الوزن الأكبر.`
2. quiz.js:135, app.js:117 toldOnlyH, an adjective with no noun: "بناءً على ما أخبرتنا به فقط".
3. quiz.js:136 toldOnlyLede, where "لا عطر بعد" reads "no perfume yet": "لم تقيّم أي عطر بعد، لذلك تعتمد هذه الترشيحات على إجاباتك وحدها. وإجاباتك دليل أضعف من عطر جرّبته: جرّب عينة أولاً."
4. quiz.js:100 notesIntro: `${["", "نوتة واحدة", "نوتتان", "ثلاث نوتات", "أربع نوتات", "خمس نوتات"][n] || n + " نوتات"} من ${name}. اختر ما تتذكره، وتجاوز ما لا تتذكره.`
5. app.js:118 toldUses, no subject: `يعتمد الملف أيضاً على إجاباتك في الاختبار (${n}).`
6. data.js:148 ambergris hint_ar: "الجلد" reads as leather, the card above. Use "مالح دافئ يشبه رائحة البشرة؛ يُصنع اليوم صناعياً (أمبروكسان)."
7. Optional, quiz.js:130 and app.js:119 noteLine (two colons, mixed persons): `${perfume}: «${words}» (${stage}): إجابتك «${answer}»`.
8. Optional, data.js:140: عنبر often means ambergris to Saudi readers. Add hint_ar "راتنجي دافئ حلو، غير العنبر الرمادي", hint_en "Warm, sweet and resinous; not ambergris."

## Tedium

Three grid bottles, all "still", answering everything: 15 screens including grid and result, 61 to 64 taps, about 35 on the picker. With skip-all: 14. Answering nothing ("I don't remember" on each verdict): 12 screens, 14 taps. The bottles are light (two screens each, working skips); the picker is not (4 of 13 question screens, over half the taps). The goal is met for the bottles, not the picker. The biggest single cut is one picker screen with the four groups as headings: three fewer screens on every path (15 to 12, 12 to 9), zero-bottle visitors included. Merging verdict and note rows saves three, but none when answering nothing. That layout change is the planner's and owner's call.

## Fix list for E8

1. **app.js (B1).** For a risk of kind "told", take `told.filter(i => i.f === risk.f && i.value < 0)`. Use riskTold only if one has src starting "note:" and w of 0.5 or more; otherwise a new riskLean: en `Contains ${fam} in the ${stage.toLowerCase()}, which your quiz answers lean against.`, ar `يحتوي على ${fam} في ${stage}، وإجاباتك في الاختبار تميل ضده.` No engine change.
2. **quiz.js:640 (S1).** From `N.toldItems(quiz)`, keep items for f with w of 0.5 or more, src starting "note:" or "chip:", opposing the class. Show the line only if any remain, passing their card or chip words (listJoin) to ``disagree: w => `Your bottles and your answer (${w}) disagree; your bottles count more.` ``, and Arabic item 1.
3. **quiz.js:41, :100 (S2).** en: `${cap(["", "one", "two", "three", "four", "five"][n] || String(n))} ${n === 1 ? "note" : "notes"} from ${name}. Tap what you remember; skip what you don't.` ar: Arabic item 4.
4. **Arabic items 1 to 6 (S3)**; 7 and 8 optional.
5. **Tests.** quiz.test.js:316 takes the new intro; in the full run, lavender has no `qdis` and citrus names lemon. page.test.js adds zero bottles with "sweet" and "enjoy lemon": no pick says "which you said you avoid".
6. **README.md:223, :236** follow items 1 and 2.
7. **Optional:** N2, N4, N5, and an `Array.isArray` guard for N6.
8. Run `node --test tests/*.test.js` and `python tools/build_artifact.py`.

## Do not touch

- engine.js (TOLD_W, TOLD_PRIOR, chip rule, told sums) and tests/fixtures/engine_golden.json. No fix needs the engine.
- data.js except the hints in Arabic items 6 and 8: perfume entries, FAMILIES, CHIPS, QUIZ.grid, testers, taste, picker ids.
- notes.js, evidence.js, mapper.js, materials.js, the backend's VERIFIED list.
- Row order, event timing, src handling, the zero-bottle heading rule, ثيابي.
- reference/ outside reference/quiz/, and git.
