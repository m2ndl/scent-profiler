# The order of the whole catalogue (29 September 2026)

The owner asked whether the site could show all 1,000 perfumes ranked by a visitor's answers, whether the noisy middle
of that order is a big issue, and then for a trial of the fixes proposed for it. Measured on the engine of commit
33e1ca8 with the synthetic visitors of `REPORT.md`; the scripts and their outputs are indexed in `README.md`.

## Summary

- **The order is informative at its ends and weak in between.** A perfume in the engine's top 30 is kept 67% to 75% of
  the time, one past place 300 42%, and one the engine leaves out 13%; but two perfumes fewer than 25 places apart are in
  the right order 51% of the time, and a retest moves a top-100 perfume about 70 places.
- **The ranking formula and the tags are not the cause.** Given the visitor's whole true taste, the same formula agrees
  with it at 0.84; the engine agrees at 0.40. Shaking every tag by 15% leaves the order almost as it was (0.94).
- **The loss is in the step from answers to profile.** A reader who knew which of the families the answers expose is the
  liked or hated one would reach 0.59. The engine falls short because answers expose several families without saying
  which: a turned bottle accuses every strong family in the stage, "I still wear it" credits every family in the base,
  and a word answer touches several families.
- **The fixes trialled gain little.** Note rows asked outright on every bottle, the best of them, lift the order from
  0.40 to 0.43 and the picks kept from 75% to 77%, for 2.5 more answers per visitor. The narrowing round drawn from a
  wider pool gains nothing. Naming a deal-breaker only when a note row or a second bottle points to it makes the named
  one right 60% of the time instead of 44%, for half as many visitors.

## How it was measured

The visitors, their answers and their simulated wears are those of `REPORT.md` (`lib.js`). A visitor's list is every
perfume on their side of the catalogue they have not rated. Agreement is the Spearman correlation between the engine's
scores over that list and the best-possible score of `lib.js` (the chance of no ruin times the pleasure of heart and
base); perfumes the engine leaves out for a likely deal-breaker or an avoided note sit tied at the bottom. Section 1
reports it over the ranked perfumes only (0.33), sections 2 and 3 over the whole list (0.40). The upper bound gives the
formula the visitor's true likes and deal-breakers among the families the answers expose (a rated bottle holds the family
at 0.4 or more in its heart or base, or a word answer touches it) and the population's mean opinion for every other
family; it assumes the reader knows which exposed family is the one.

For the trial (section 3) the visitors have tried six bottles and name three at random, so the narrowing round can reach
the other three. Each fix is a switch on the same visitors, answers and wears, and the gains are paired differences with
their range over five seeds. Three populations: the stress test's visitors, who answer a bottle's note screen six times
in ten; visitors who answer it two times in ten; and visitors who have tried twelve bottles.

## 1. The order (`n_fullorder.js`, `out/n.txt`)

Three bottles and every answer, 1,000 visitors over five seeds:

| Where the engine lists a perfume | Kept | Turns | The same positions in the best possible order: kept |
|---|---|---|---|
| 1 to 3 | 75% | 11% | 97% |
| 4 to 10 | 71% | 12% | 95% |
| 11 to 30 | 67% | 14% | 92% |
| 31 to 100 | 62% | 17% | 86% |
| 101 to 300 | 54% | 23% | 66% |
| 301 onward | 42% | 34% | 29% |
| Left out (about 76 perfumes) | 13% | 79% | |
| Any listed perfume | 49% | 28% | |

- Two perfumes are in the right order 51% of the time when fewer than 25 places apart, 55% at 25 to 99, 61% at 100 to
  299 and 70% at 300 or more; a ranking that ignores the visitor scores 51% to 55%.
- The same visitor answering again with the same bottles: the two lists agree at 0.71, share 55% of their top 100, and a
  top-100 perfume moves a median of 71 places.
- Scores rarely tie (as many distinct scores as 96% of the ranked perfumes; the largest tie holds 1% of the list), so
  the middle is noisy, not flat.
- With verdicts only the order agrees at 0.20; with eight bottles at 0.33, no better than three; with words only at 0.34.

## 2. Where the order loses (`n2_cause.js`, `n3_reader.js`, `p_gap_ablation.js`)

| What the ranking formula is given | Agreement |
|---|---|
| The whole true taste | 0.84 |
| Every true like and deal-breaker, the rest at the mean | 0.69 |
| The likes and deal-breakers the answers expose, the rest at the mean (upper bound) | 0.59 |
| The engine's profile | 0.40 |

The ablation corrects one kind of error in the engine's profile at a time. A family flagged or liked wrongly is read as
neutral at the mean, since its true mild opinion is in no answer; an exposed like or deal-breaker that is found gets its
true strength.

| The engine's profile, with | Agreement |
|---|---|
| nothing changed | 0.40 |
| families wrongly flagged as deal-breakers read as neutral | 0.43 |
| families wrongly shown as liked read as neutral | 0.44 |
| both of those | 0.47 |
| the exposed deal-breakers found | 0.49 |
| the exposed likes found | 0.46 |
| the exposed deal-breakers and likes found | 0.55 |
| all four | 0.58 |
| the likes and deal-breakers among families known only from words found, the rest neutral | 0.49 |
| unmet families read as mildly liked instead of a risk | 0.39 |
| engine change: a family known only from words scores what the words say (no pull toward zero) | 0.41 |

- Wrong flags and missed finds are one problem seen from two sides, and together they account for the gap to the upper
  bound. Correcting the wrong flags alone recovers less than finding the exposed families.
- The words carry more than the engine takes from them (0.49 when their strong families are read without error), but
  reading them at face value gains only 0.01 and one point of picks kept (76%). The engine never lets words set a class
  or exclude a perfume, by design; the gain would need that, and the model flatters it, since its visitors avoid a
  note only for a real deal-breaker.
- By population (`out/n3.txt`): verdicts only, engine 0.23 against a bound of 0.36; eight bottles, 0.43 against 0.64;
  words only, 0.39 against 0.54. More bottles raise the bound more than the engine.

## 3. The fixes trialled (`o_fixes_trial.js`, `out/o.txt`)

The stress test's visitors, about 1,950 over five seeds:

| Switch | More answers | Agreement | Gain (seed range) | Picks kept | Gain, points (seed range) |
|---|---|---|---|---|---|
| Now (grid narrowing round) | | 0.40 | | 75% | |
| Rows asked outright on kept bottles | 1.6 | 0.42 | +0.02 (+0.01 to +0.03) | 77% | +2.1 (+1.3 to +3.4) |
| Rows asked outright on every bottle | 2.5 | 0.43 | +0.03 (+0.02 to +0.03) | 77% | +2.6 (+2.0 to +3.7) |
| Rows on kept bottles, answered poorly | 1.6 | 0.41 | +0.01 (+0.01 to +0.02) | 76% | +1.5 (+0.8 to +2.6) |
| Narrowing round from the 60 popular bottles | 0.0 | 0.40 | +0.00 | 75% | +0.1 (-0.1 to +0.3) |
| Narrowing round from the whole catalogue | 0.0 | 0.40 | +0.00 | 75% | +0.1 (-0.1 to +0.3) |
| Lift | 0.0 | 0.41 | +0.01 (+0.01 to +0.01) | 76% | +1.4 (+1.1 to +1.8) |
| Rows on kept bottles, whole-catalogue round and lift | 1.6 | 0.43 | +0.03 (+0.02 to +0.04) | 78% | +3.5 (+2.5 to +5.1) |

- **Rows.** Where visitors answer the note screen two times in ten, rows on kept bottles gain +0.04 and +4.2 points for
  3.3 more answers, and on every bottle +0.06 and +5.1 points for 5.1; answered poorly, +0.02 and +3.2 points. Rows on
  every bottle also flag fewer innocent families (1.90 to 1.62 per visitor) and raise the first flagged deal-breaker's
  accuracy from 44% to 48%. They hardly move the palate (lead right 21% to 22%), since the visitor's strongest liking is
  seldom in a bottle they kept.
- **The narrowing round.** Offered to 29% of visitors now and 47% from the whole catalogue, it finds a bottle the visitor
  has tried for 3% to 4% of them (8% to 11% of visitors who tried twelve), and for them one more verdict does not
  measurably improve the picks. The quiz's rule fills its four tiles one accused family at a time, so from the whole
  catalogue the first family takes all four most of the time; filling them one family each gained nothing either in the
  independent review (`REVIEWS.md` section 6).
- **Lift** (a liking from a stage rating counts a family only for what the stage holds beyond the catalogue's average):
  the families shown as liked are true 23% of the time instead of 19%, because a third fewer are shown (2.66 to 1.72 per
  visitor); true likes shown fall from 19% to 15%, and visitors with no palate rise from 6% to 10%.
- **Naming a deal-breaker.** Today one is flagged for 50% of visitors and the first is right 44% of the time. Named only
  when a note row or a second bottle points to it, one is named for 25%, right 60%; for those same visitors today's first
  flagged is right 56%, so most of the gain comes from not naming one for the others. Counting a complaint chip as
  pointing too: 29%, right 64%. With rows on every bottle: 34%, right 61%.

## What it points to

- A list of the whole catalogue can show groups (best bets, worth a try, no clear signal, likely to turn on you) but not
  positions; the fixes do not change that.
- Of the question fixes, rows asked on every bottle is the only one with a clear gain, and it grows if real visitors
  skip the rows more often than the model assumes; the funnel's `notes:skip` events will show the real rate.
- Naming a deal-breaker only when a note row or a second bottle points to it makes the result's claims right more often,
  independent of the order; the other half of flagged visitors would see the accused families together.
- The narrowing round from a wider pool and lift are not worth building.
- The larger gain is in how the engine reads answers it already has (section 2). Letting words set a class or exclude a
  perfume is the obvious candidate; it is against the rule that words never exclude, and untested here.

## Limits

Every figure comes from synthetic visitors and machine-made tags. Several choices favour the question fixes: a row's
answer is the visitor's true opinion plus noise, a visitor made to answer rows answers them as well as one who chose to,
nobody leaves the quiz over more answers, and a complaint chip is ticked only when one family ruined the bottle. The
upper bound assumes the reader knows which exposed family is the one and counts a family exposed when any word answer
touches it. Real visitors' ratings, collected since 28 September, are the test that counts.
