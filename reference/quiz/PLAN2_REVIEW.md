# Review of PLAN2.md

Runs used the real catalogue with engine.js patched in memory. The plan omits the QUIZ.taste weights; I assumed 0.3 to 0.8, strongest for vanilla and green.

## Blocking

**B1. Told answers move the classes that bottles set (Engine 2, lines 130-138).** Told items enter the sums behind score and class, so "no class of its own" protects only told-only families.
- They erase worn bottles' classes: 351 of 4,920 single-bottle quiz runs lost a class. Khamrah "I still wear it" plus ten enjoyed notes, five avoided and "bitter" takes vanilla, tonka and resinous amber from "probably liked" to neutral; vanilla scores -0.11 and is penalised, and all three picks change. The four citrus cards stack 1.20 of told weight, against 0.75 for a worn bottle.
- One answer can make a likely deal-breaker: on golden seed 5018, "avoid cedar" turns cedar from possible to likely; 12 of 4,838 runs on the golden rating sets gained an exclusion.
- This breaks line 13's safeguard and "your bottles count more". The requested case holds: Sauvage stopped at drydown -2 plus "enjoy woody amber" stays a possible deal-breaker (-2.00 to -1.14), same picks.

Fix: compute score, n and class from bottle and note evidence only, and keep told evidence in a separate `toldScore` that recommend uses only where n = 0.

## Should-fix

**S1. Cap (lines 73, 76).** The text says five rows; the plan's figures (1,118 rows, 3.9 average) and its Sauvage four-row test match four. At five, Sauvage gives five. Fix: state four.

**S2. Ties (lines 75, 124).** "Strongest stage" has no tie rule, and 38 asked families tie. If the earlier stage wins, Narciso For Her (a tester) and Not a Perfume lose their only drydown row; if the later wins, none does. Fix: one exported engine function picks the stage, ties to the later one, and notes.js calls it.

**S3. Override across stages (line 121).** 181 of 1,118 rows hold their family at 0.4 or more in another stage. Baccarat Rouge 540 rated heart +2, drydown -2 leaves woody amber neutral (-0.33); one "hated" on its "Hours later" row makes it a possible deal-breaker at -2.00 by dropping the heart +2. Fix: skip the family only in the row's stage.

**S4. Answer on a family the perfume no longer holds (line 124).** After a pasted label or evidence update removes the family, the weight is NaN and the family's score becomes 0. Sauvage and Bleu EDP at -2 make woody amber likely; adding Yara with a woody amber answer erases that class and every exclusion. Fix: skip note answers for families the perfume does not hold.

**S5. "Not on its note list" (lines 79, 96).** I count 54 wordless rows, not 35, and 18 list the family in another stage, such as Baccarat Rouge 540's amberwood in the heart. Fix: search all three stage lists first.

**S6. Mixed told sign (line 138).** "Enjoy musk" plus the soapy and powdery chips nets white musk to -1, so a pick reads "which you said you avoid" beside "You enjoy: musk". Fix: use kind "told" only when every told item for the family is negative.

**S7. Old string `quiz.told` (line 65).** The migration sits in the quiz flow, but toldItems is shared: "sweet" iterates as s, w, e, e, t, so the profiler drops it silently; quiz.js lines 380 and 416 also read the string. Old "none" should set toldNone. Fix: normalise inside toldItems.

**S8. Same picks on both pages (Profiler page).** app.js line 304 returns an empty profile with no ratings and line 342 needs two rated bottles, so with zero or one bottle plus told answers only the quiz shows picks. Fix: give app.js the quiz's gate, or limit the promise and page test to two bottles.

**S9. Zero-bottle picks from avoids only (Recommendations).** Of 39 single "avoid" answers, 33 share two or more picks with the no-answer set (H24, Afternoon Swim, Qaed Al Fursan), 14 match it exactly, all scoring below zero. "Avoid peach" gives H24, Afternoon Swim, Glacier Bold; "prefer bitter" gives Sycomore, Nuit de Feu, Light Blue Pour Homme. Fix: show zero-bottle picks only when a told item is positive.

**S10. Step counter and Back (line 21).** quiz.js keeps no history: round two overwrites `queue` (line 483), narrowing is recomputed on advance (line 222), and three paths jump to "told" (lines 223, 474, 475). The total depends on verdicts, skip-all and narrowing. Fix: keep a stack of {step, queue, at, round} for Back and count sections, not screens.

## Notes

**N1.** The golden holds: with all three engine edits, 60 of 60 scenarios and the mapped entries match, and kind "told" needs told input. Told-only families stayed neutral with n = 0 under all 39 notes and every chip.

**N2.** Arabic by position holds: 26 of 858 lists differ, as stated, and 1,610 of 1,611 dictionary-checked words align.

**N3.** Every picker note maps to a family used at 0.4 or more (fewest: lily of the valley, 11 perfumes). "Amber" splits evenly between resinous and woody amber.

**N4.** Tedium: every grid bottle reaches the cap (four rows of six answers), so five bottles mean about 18 screens. The picker re-asks notes just rated, counting them twice. Fix: drop picker cards for families already rated.

**N5.** A ratings column named `notes` sits beside the ban on storing vendor note lists; `noteAnswers` avoids confusion.
