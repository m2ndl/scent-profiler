
## Confirmed

**1. Blocking: a note hated in a kept bottle becomes a like. `site/js/engine.js:121/126`, `:143-144`, `:180`.**
- **Cause:** a lean diverts only the note answer. The same bottle's other rated stage still adds strong evidence for that family, now with nothing against it. Because n ≥ 1, the told rule then drops the lean.
- **Scenario (real clicks, grid bottle):** Bade'e Al Oud, "I still wear it", oud row "Hated it". The result says "The Oud Palate", "Probably drawn to Oud", and "How we worked this out" lists Oud as "Probably liked". Before the change: Woody Palate, oud not liked. This is the owner's complaint in reverse.
- **Eros kept, tonka hated, bitter answer:**
  - the taste card shows Tonka as liked
  - the new line says "your bottles show a liking for vanilla and sugar and tonka and hay"
  - picks are rewarded for tonka, yet their caveats say "which you disliked in Eros"
- **Profile page, one card:** "Shares Incense with Interlude Man, which you liked. Contains Incense in the heart, which you disliked in Interlude Man."
- **Scale:** the hated answer disappears from every evidence list. In 4,000 synthetic all-kept profiles there are 332 same-bottle cases; before the change, 0.

**2. Should fix: a loved top note becomes a deal-breaker. Same lines, reverse direction.**
- **Scenario:** Good Girl (grid), "it turned on me" hours later; coffee row (opening 0.6, base 0.4) "Loved it". The result shows "Possible deal-breaker: Coffee and cacao" at −2, and the love appears nowhere on the page.
- **Before the change:** neutral, with the note line shown.
- **Scale:** 21 of 4,000 synthetic profiles, against 0 before.

**Fix for 1, 2 and 4.** Let a lean silence the same bottle's stage evidence for its family where that evidence points the other way (engine.js, stage loop):
```js
const leanOf = f => answers.find(a => a[0] === f && ((a[1] > 0 && a[2] === "opening") || (a[1] < 0 && kept)));
// in the stage loop:
const la = leanOf(f);
if (unnoticed.has(f) || (la ? Math.sign(v) === -Math.sign(la[1]) : answered(f, s))) continue;
```
- **Trial result in a scratch copy:** 96/96 pass and the golden is unchanged. Bade'e Al Oud, Eros, Good Girl and Aventus return to their pre-change classes, and both counts drop to 0.
- **Side effect:** Jannet El Firdaus White turned in the base, with musk loved and Yara kept. Musk changes from mixed to liked through Yara, because the turned base no longer blames musk.

**3. Should fix: the Selective palate now sits beside liked rows. `site/js/quiz.js:836`, texts at `:93` and `:190`.**
- **Scenario:** Emotion put off in a shop, sweet fruit loved. The page says "None of your bottles stands out as a like" directly above "Probably drawn to Sweet fruit, from your bottles: Emotion". With the bitter answer it also says "your bottles show a liking for sweet fruit".
- **Scale:** 41 of 584 synthetic results; before, 0.
- **Profiler records:** Sauvage rated opening −1, heart +1, drydown +2, buy again "Yes" was the Woody Palate and is now Selective with three liked families. `keptBottle` (`quiz.js:260`) treats any stage below 0 as turned, which fits one-stage quiz records but not three-stage profiler ones.
- **Test:** `tests/quiz.test.js:1119-1121` pins this combination.
- **Fix:** a different Selective sentence when liked families exist, in both languages. Separately, the owner should decide whether `again === 1` makes a record kept; that change would go in `engine.js:112` and `quiz.js:260` together.

**4. Should fix (profile page only): answering a note row removes a like. `engine.js:121/143`.**
- **Scenario:** Aventus rated opening "Love" shows "Sweet fruit: Probably liked". Answering the pineapple row "Loved it" removes that verdict (score 2.0 falls to 0.47, neutral).
- The fix above also covers this.

**5. Minor: `site/js/app.js:331-332`.**
- The "Shares X with…" line does not skip families disliked in a kept bottle, but the engine's pick reasons do.
- When another bottle likes X, one profile-page card says "Shares X with B, which you liked" and also "which you disliked in A".
- **Fix:** skip families with a kept-bottle dislike, as the engine does.

**6. Minor: `engine.js:251-254`.**
- **Order:** the kept-dislike caveat is checked before the mixed one, and it ranks by strongest presence in any stage, the opening included.
- **Example:** keep Stronger With You Intensely and hate its fresh spices. L'Homme Idéal L'Intense's only caveat then names fresh spices in the opening instead of mixed amber at 0.9 in its heart and base.
- **Scale:** 59 of 2,789 such caveats push out a mixed family at 0.5 or more. That goes against "a detail never outranks a verdict".
- **Fix:** move the block after the mixed check.

**7. Minor wording.**
- The taste line runs names together: "a liking for vanilla and sugar and tonka and hay".
- The profile page says "a perfume you still wear" for profiler records that never said so.

## Tests
- The first new engine test uses only a family Sauvage holds in its base alone, so it cannot catch #1. Adding Bade'e Al Oud or Eros would. It also never asserts that a pick carries the caveat; today both picks do.
- Nothing tests a loved top note whose family also sits in a rated later stage (#2), or a rated opening (#4).
- No page test shows the two new caveats on the quiz or profile page, in either language.

## Suspicions (not defects)
- Lean weights skip the half weight for vendor-only bottles and the provenance weight (`engine.js:144`).
- A result can show liked chips with no palate at all (4 of 584), with no false text on the page.

## Checked and fine
- `keptBottle` matches the reveal's kept and turned split.
- A named palate always has a chip from its group.
- The taste line stays silent for "both", "unsure" and likes from note cards only.
- Trace families (under 0.3) are never named.
- No em dashes or the ل-ب-س root in the added strings.
- The new Arabic reads naturally, with masculine reference to the family.
