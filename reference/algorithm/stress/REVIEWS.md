# Independent reviews (27 and 28 September 2026)

One Opus verifier, bounded (no web, no edits, a time budget), reviewed the stress test and then the fix. Its three
reports are condensed here. Each finding was either fixed (commit 77c5f70) or is recorded as open in PROJECT_LOG.md.
Section 4 condenses a fresh verifier's review of the coverage change of 28 September (COVERAGE.md).

## 1. On REPORT.md, before the fix

- **Section 8 defects.** The Supremacy Noir and Yara case was confirmed: vanilla is badLikely only because Supremacy
  Noir's heart rating counts against it. The count was wrong: of the 11 results showing a liked note under a
  deal-breaker, 3 come through the same bottle and 8 through another bottle, because `score <= -0.7 && neg >= 1` makes a
  family with a liking bottle a possible deal-breaker (the README calls such a family mixed). "Free of X" checking only
  the base, the rating-order case and the unclamped 99 were confirmed; the order case changed the order of the picks,
  not which perfumes were picked, and the hostile values were never range-checked.
- **The simulation.** `answer()` writes ratings as `writeVerdict` does, line by line; the page parsing matched the
  engine's picks on 60 of 60 raw pages; the "Woody for everyone" baseline uses the same denominator; the palate copy in
  `g_palate_whatif.js` is faithful. Two modelling choices were unstated: chips only when one family ruined the stage,
  and the narrowing round never simulated.
- **Numbers.** Every number in sections 1, 2, 4, 5, 6 and 9 matched `out/`, except figures from one-off checks (now
  scripted), the "by label" figures (two off by 2 to 3 points; now over five seeds), 2.7 accused families being the
  quiz bottles' figure (3.15 across the catalogue), and one-run figures carrying 2 to 3 points of sampling noise.
- **Overstatement.** "The cause is rule 1" for the palate was wrong: crediting the heart as well leaves the lead-group
  hit rate unchanged, and the ceiling of 22% caps any vote over kept bottles. On the real page the palate follows the
  note rows: floral or rose trios with those rows marked "Loved it" were named floral or rose 139 times in 150.
- **Missed.** The mixed rule's |score| < 0.7 condition; the profiler mirror of defect 1 (7 in 20,000 inputs); the
  narrowing round outside the figures.

## 2. On the fix, first version

- All five defects fixed. Side effects: a chip that contradicts a lean now drops out (a change in lean behaviour, and a
  real route of defect 1 closed); a "Didn't mind" answer neutralises every non-zero rating of the bottle and drops every
  chip on that family, which the docs did not say.
- **A new contradiction made reachable:** `vetoOf` read `pos > 0` as a kept bottle, so a liked note in a bottle that
  turned lifted an avoided note and the page said "Olympea, which you kept".
- Golden diff confirmed: 27 families to mixed, all with a bottle on each side; picks and deal-breaker lists follow from
  them; nothing else. The five tests fail on 23cab69 at their intended assertions.
- The broad mixed rule cost a little pick quality for the visitors it touched (hidden ruin chance 0.04 against 0.00 to
  0.01), from the flat 0.3 penalty; the verifier recommended keeping the rule and changing the penalty.
- The stored-value parser coerced true, lists, blank text and hex; the docs said otherwise.

## 3. On the changes after review 2

- The kept-only veto, the number-only parser, the mixed weighting (picks identical to 23cab69's in all 60 golden
  scenarios) and the docs were confirmed; all ten new tests fail on 23cab69, and the three for this round fail on the
  first version. No regression found.
- Minor: half values rounded upward (fixed, halves now mirror); on the profiler a kept bottle whose only liking is its
  opening can lift an avoided note (open).
- Still contradicting the visitor, by design: a note liked only in the first minutes can sit beside a deal-breaker from
  other bottles; the card does not show the note.

## 4. On the coverage change (ce09d2b)

- **Blocking, fixed:** a family known only from traces was left out of the picks, but its traces came back at full
  weight as soon as the visitor gave a word on it, so a word could move the picks against itself (Eros turned and
  Sauvage kept: enjoying the vetiver card made vetiver score below zero and took Sycomore out). The same mechanism,
  older than the change, let cards contradict the visitor's words ("Some vetiver in the base, which your answers lean
  against" after a bitter taste answer that leans towards vetiver). Fixed as the verifier proposed: for a family no
  rated stage exposes, the picks and the card lines read the words alone (engine.js `picksView`). A test, an invariant
  in c_invariants.js and `m_wordsteps.js` cover it; k_cards.js counts 14 contradicting cards on 0164d00, 17 on ce09d2b,
  none after.
- **Should fix, fixed:** COVERAGE.md overstated the old top perfumes as winning "for nearly everyone".
- **Notes:** the trial's side rule counts catalogue bottles only while the engine also reads vendor and custom bottles
  (stated in rank_trial.js); the fallback to rated bottles, when none was kept, takes the side from bottles the visitor
  disliked, which the model cannot test (COVERAGE.md section 5); a weak assertion in the trace test passed on 0164d00 too
  (tightened); the one-sample suggestion and narrowing round ignore the side; card lines, not picks, can still depend on
  the order of the ratings at an exact tie or threshold; README said "no rated bottle" where the code means "no rated
  stage" (corrected). Open items are in COVERAGE.md section 8.
- **Confirmed:** likes counted once, the side rule, reading to nine places, the golden diff (only picks change; every new
  pick equals the trialled ranking), the trial's equivalence with the site and its fairness (same visitors, seeded
  wears), the figures in out/j.txt, and no page reading the old reward sums. The new tests fail on 0164d00 at their
  assertions. The costs (turn up by one to two points in every population, word-only visitors' other-gender picks at a
  third) were judged no reason to hold, and are for the owner to accept.

## 5. On the fix of section 4 (words alone)

- **Nothing blocking.** For note-card answers the picks now always move the way the word points: the verifier patched a
  copy to expose every candidate's final score and found none of 730,306 moving against the card over 2,318 card steps
  on the site, against 7,057 on ce09d2b. Every reader of the profile uses the right view: the ranking and the card lines
  read the picks' view, while vetoes, deal-breakers, settle suggestions, "ruled out", the palate and the taste card read
  classes, the same in both. The "not tried" line still reads the profile.
- **Should fix, fixed:** the new test did not cover the card lines (reading the likes or the lean line from the profile
  passed all tests); two assertions added, and each of those two mutations now fails it. The README and COVERAGE.md
  claimed monotonicity for "a note"; they now say note card, since note-row answers are not covered.
- **Open, older than the change:** a note-row answer moved one step can move the picks the other way, 118 of 2,452 steps
  in the verifier's check on the site, 121 on ce09d2b and on 0164d00: "Liked" on a note strongest in the opening makes
  it a lean, so that bottle's own rating drops out and another bottle's dislike stands alone (two turned bottles with
  white musk: "Didn't mind" to "Liked" took white musk from a possible deal-breaker at -0.80 to -2.0). For a revision
  of the lean rule.
- **Guard added:** one avoided item of weight w costs a perfume 2w/(w + 1) per unit, against 0.3 for an unmet family, so
  below w = 0.18 avoiding a note would raise its perfumes; the lightest told item today is 0.2, and a notes test now
  fails if one falls under 0.18.
- **Confirmed:** the figures in COVERAGE.md against out/ (j, k, m, c, a1_seeds, e, i, l), and the site equal to the
  adopted variant on a fresh check (3,007 of 3,007).
