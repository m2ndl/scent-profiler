# Independent reviews (27 and 28 September 2026)

One Opus verifier, bounded (no web, no edits, a time budget), reviewed the stress test and then the fix. Its three
reports are condensed here. Each finding was either fixed (commit 77c5f70) or is recorded as open in PROJECT_LOG.md.

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
