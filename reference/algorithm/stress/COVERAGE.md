# Where the picks go (28 September 2026)

The owner asked whether the three picks repeat a handful of perfumes instead of drawing on the 1,000. This was measured
on the engine of commit 0164d00, the engine was changed, and the checks were run again. The scripts and their outputs
are indexed in `README.md` in this folder.

## Summary

- **They did.** With three bottles and every answer, Molecule 01 went to 15 visitors in 100, Not a Perfume to 13 and
  Grand Soir to 12, and the ten most picked perfumes took a quarter of all picks. With verdicts only, Grand Soir went to
  21 in 100. Two visitors with no liking in common were given the same perfume 8 times in 100 (14 with verdicts only);
  for the best three the catalogue holds for each visitor, and for random picks, once in 100.
- **Concentration itself was not the fault.** The best three for each visitor are concentrated too (the ten most picked
  take 19% of picks), since a few perfumes are the purest of their family and suit everyone who likes it. The fault was
  that the engine gave the same perfumes to visitors whose tastes have nothing in common.
- **Cause.** The ranking added a liked family once for every stage it is in, so a perfume holding one family from
  opening to base collected up to 2.4 times the credit of one holding it in the base. And the ranking counted the four
  families most bases hold (woody ambers, white musks, vanilla, resinous amber) as liked for about four visitors in ten
  each, against one in ten who truly like each, because "I still wear it" credits every family in a kept bottle's base.
  The perfumes that are one of those families from start to finish were picked for visitors of every taste.
- **Change** (`site/js/engine.js`): a liked family earns its reward once, at its strongest presence; a family no rated
  stage holds at 0.4 or more is read from the visitor's words alone, and counts as unmet when there are none; the picks
  stay on the side of the gendered bottles the visitor kept (or rated, when they kept none); scores are read to nine
  decimal places. With three bottles and every answer, over five seeds, the most picked perfume now goes to 3 visitors
  in 100 (15 before), the ten most picked take 8% of picks (25%), visitors with no liking in common share a pick twice
  in 100 (8), picks are kept 75% of the time (74%) and turn 10% (9%), and 11% of picks are for the other gender (22%). Over the trial's four populations, 971 perfumes are picked at least once (894).
- **Found on the way.** 16% of pick cards said "Has X, which you like" of a family that the visitor's bottles held only
  as a trace and that the visitor never mentioned, and 14 in 4,356 said the opposite of the visitor's own words; now
  none of either. The independent review found that the first version of the change let a family's traces back in, at
  full weight, as soon as the visitor gave a word on it, so enjoying a note could lower the perfumes that hold it; the
  picks now read such a family from the words alone, and a test and an invariant check cover it. The first version
  also let the order of the stored ratings swap two picks tied to fifteen digits; the picks now read scores to nine
  places.
- **Open for the owner:** visitors who rate no bottle, whose side the engine cannot tell (their other-gender picks rose
  from 26% to 33%); and verdict-only visitors, who still meet Montale Leather Patchouli 11 times in 100 (section 8).

## How it was measured

The synthetic visitors of `REPORT.md` (`lib.js`): a hidden taste, bottles mostly from the quiz grid and More perfumes,
answers written the way the quiz writes them. Populations: three bottles with every answer (the headline), three with
verdicts only, one bottle, eight bottles, word answers only, and three bottles with likings drawn in proportion to how
many catalogue bases hold each family (tastes that follow what the market sells). Two yardsticks on the same visitors:
the best three the catalogue holds for each visitor's hidden taste, and three random perfumes.

Measures: the share of visitors given the most picked perfume; the share of all picks the ten most picked take; the
effective number of perfumes (one over the sum of the squared pick shares, the number of equally used perfumes that
would give the same concentration); and how often two visitors who share no liking are given at least one perfume in
common. Kept and turn come from 30 simulated wears of each pick, and the same pick for the same visitor always gets the
same wears, so two rankings are compared on equal terms.

## 1. Before the change

`h_coverage.js`, `out/h.txt`: 3,000 visitors per population, engine of 0164d00.

| Visitors | Most picked (engine / best three) | Ten most picked, share of picks | No liking in common, a pick shared |
|---|---|---|---|
| Three bottles, every answer | 15% Molecule 01 / 8% | 25% / 19% | 8% / 1% |
| Three bottles, verdicts only | 21% Grand Soir / 9% | 34% / 21% | 14% / 1% |
| One bottle, every answer | 11% Not a Perfume / 8% | 25% / 19% | 6% / 1% |
| Eight bottles, every answer | 15% Grand Soir / 9% | 21% / 19% | 7% / 1% |
| Word answers only | 17% Hugo Iced / 8% | 32% / 19% | 8% / 1% |
| Likings as common as the bases | 15% Molecule 01 / 23% | 26% / 41% | 7% / 0% |

Random picks: 1%, 2% and 1%. Over the six populations 882 perfumes were picked at least once (best three 552, random
1,000). Where likings cluster on the common families, the best three concentrate more than the engine did; what they
never do is give the same perfume to two people who share no liking.

## 2. Why

- **The most picked perfumes are made of the common families.** The engine's twelve most picked (three bottles, every
  answer) hold 54% of their tag weight in the four common base families (catalogue 29%, the best three's most picked
  43%) and hold their main family at 0.5 or more in 2.7 of the 3 stages (catalogue 1.3, best three 2.2). They are no
  purer than the best three's (45% of their weight in one family, against 56%).
- **Nearly everyone "likes" those families.** The ranking rewarded woody ambers for 42% of visitors, white musks 42%,
  vanilla 45% and resinous amber 39%; each is truly liked by 9% or 10%. With eight bottles, 50% to 56%.
- **Each suspected cause was changed on its own**, on the same visitors (three bottles, every answer):

  | Ranking | Most picked | Ten most picked | No liking in common, shared | Kept | Turn |
  |---|---|---|---|---|---|
  | As it was | 15% | 25% | 8% | 74% | 10% |
  | A family counted once, at its strongest stage | 5% | 9% | 2% | 74% | 11% |
  | Heart and base only | 9% | 17% | 4% | 74% | 11% |
  | No cost for families not yet met | 14% | 23% | 7% | 74% | 10% |
  | The mean of the families instead of the sum | 28% | 33% | 14% | 73% | 10% |

  Counting a family once removes most of the effect; leaving out the opening removes part of it; the cost of unmet
  families is not the cause. Averaging makes it worse: a perfume of one family scores that family's mean, so the purest
  perfume of a family everyone "likes" wins for everyone.

## 3. The change and what it does

`j_trial.js`, `out/j.txt`: 2,000 visitors per population, the headline population under five seeds. The rules were
trialled in `rank_trial.js`; the site's `recommend()` picks what the trialled rules pick for 15,014 of 15,014 visitors.

- A liked family earns its reward once, at its strongest presence (weight × stage weight). A disliked, doubtful or unmet
  family still costs in every stage it is in, each stage being another chance for it to spoil the wear.
- A family no rated stage holds at 0.4 or more is read from the visitor's words alone (told items and leans, pulled
  toward zero as a family known only from words is), and counts as a family the visitor has not met when there are no
  words (section 4).
- The picks stay on the visitor's side: after kept bottles of one gender, that gender and unisex; with none kept, the
  gender of the bottles rated; bottles of both genders, unisex ones only, or none give no side (section 5).
- The picks read every score to nine decimal places, as the classes do, and a tie goes to the perfume listed first.

| Visitors | Most picked | Ten most picked | No liking in common, shared | Kept | Turn | Other gender |
|---|---|---|---|---|---|---|
| Three bottles, every answer (five seeds) | 15% → 3% | 25% → 8% | 8% → 2% | 74% → 75% | 9% → 10% | 22% → 11% |
| Three bottles, verdicts only | 21% → 11% | 34% → 18% | 14% → 5% | 60% → 60% | 16% → 18% | 18% → 8% |
| Eight bottles, every answer | 16% → 9% | 21% → 10% | 7% → 3% | 76% → 76% | 8% → 9% | 24% → 10% |
| Word answers only | 16% → 15% | 32% → 28% | 8% → 7% | 81% → 80% | 9% → 10% | 26% → 33% |

- Over five seeds, kept ranges from 73% to 75% before and 74% to 76% after, and turn from 9% to 10% before and 10% to
  11% after. The turn cost is real in the
  model: the old top picks held one or two families, leaving little room for a deal-breaker the visitor never
  mentioned, and the new ones hold more.
- Perfumes picked at least once over the four populations: 894 → 971. The effective number of perfumes (three bottles,
  every answer): 96 → 370.
- The most picked now (three bottles, every answer, first seed): Montale Leather Patchouli 4%, Hugo Iced 3%, Sycomore
  3%. Niche houses take 27% of picks (40% before; catalogue 19%) and Arab houses 25% (18%; catalogue 21%) (`e_bias.js`,
  `out/e_0164d00.txt` against `out/after_coverage/e.txt`).
- Each rule alone: counting likes once gives most of the coverage but, since the old top picks were unisex, raises
  other-gender picks to 30%; the side rule brings them to 11%; the trace rule changes coverage little.
- The golden scenarios (`golden_review.js`, `out/golden.txt`): profiles, deal-breakers and settle suggestions unchanged
  in all 60; the picks changed in 55, and all 60 are what the trialled rules pick.

## 4. Traces and words on the pick cards

`k_cards.js`, `out/k.txt`: 1,500 visitors, three bottles, every answer, 4,356 pick cards on each engine.

| Pick cards that | 0164d00 | ce09d2b (first version) | Site |
|---|---|---|---|
| say "Has X, which you like" of a family known only from traces | 676 | 0 | 0 |
| say "which your answers lean against" of a family known only from traces | 3 | 0 | 0 |
| say the opposite of the visitor's own words | 14 | 17 | 0 |

A family is known only from traces when no rated stage holds it at 0.4 or more and the visitor never spoke of it: on
0164d00, Molecule 01's card said "Has cedar, which you like" to a visitor whose bottles held cedar only as a trace.
README promises a liked class or the visitor's own words. The last row counts a like when every word on the family was
against it, or "your answers lean against" when every word was for it: the traces of a bottle that turned outweighed
the words, as in the independent review's case of a bitter taste answer (which leans towards vetiver) beside a trace of
vetiver in Eros, which turned, and the card "Some vetiver in the base, which your answers lean against".

The first version of the change (ce09d2b) left out a family known only from traces, but let its traces back in at full
weight as soon as the visitor gave a word on it. So a word could move the picks against itself: with Eros turned and
Sauvage kept, enjoying the vetiver card made vetiver score below zero and took Sycomore out of the picks. The site now
reads such a family from the words alone. The invariant check (`c_invariants.js`) now also adds one enjoyed or avoided
card to each input and checks that what the picks read of its families moves its way. On a copy of the first version's
reading the same steps move the picks against the word 87 times in 5,832 (avoiding melon made aquatic notes a liking);
on the site's, none (`m_wordsteps.js`, `out/m.txt`; section 7 for the full check).

## 5. The other gender

The quiz does not ask the visitor's gender. Before the change 21% to 22% of picks were for the other gender (the
visitors' own bottles cross over 7% of the time). Counting likes once alone would have raised this to 29% to 30%, since
the old top picks were unisex; with the side rule it is 11% to 12%. When the visitor kept no bottle, the side comes
from the bottles they tried and did not keep; it is wrong when those were all of the other gender, and then every pick
is for the other gender or unisex. The model makes tried bottles the visitor's own gender nine times in ten, so it
cannot say how often that happens with real visitors.

Visitors who rate no bottle have no side, and their other-gender picks rose from 26% to 33% (for women, 29% to 41%,
`e_bias.js`). Restricting them to unisex perfumes was trialled and rejected: it left 200 distinct picks instead of 483,
the most picked went to 18 visitors in 100 and the ten most picked took 35%, and 63% of picks were niche. Asking these
visitors whether they want men's, women's or either would settle it; that is a change to the quiz, left to the owner.

## 6. Other angles

- **Extreme answers** (`i_extremes.js`, `out/i.txt` and `out/after_coverage/i.txt`): every note card avoided or loved,
  all 60 quiz bottles kept or turned, one bottle, words only, 100 to 1,000 profiler ratings. Nothing threw, the page
  showed the engine's picks, no pick held a likely deal-breaker at the excluding strength or was led by an avoided note
  without a kept bottle behind it, and the engine took at most 30 ms. The same before and after.
- **The order of the ratings.** The invariant check on the first version of the change found a profiler input whose
  second and third picks swapped with the order of the ratings: Kashmir Musk and Chance tied to fifteen digits, and the
  last digit of a score decided. The picks now read scores to nine places; a test covers the case, and the rerun over
  40,000 inputs found none, nor any of 77,646 steps of one note card more moving the picks against the card (`out/after_coverage/c.txt`).
- **Ties by catalogue order.** Five pairs of perfumes carry identical tags (Ajmal Musk Silk and Musk Silk Supreme,
  Initio Oud for Greatness and Lattafa Bade'e Al Oud Oud for Glory, and three more; `out/k.txt`), and a tie goes to the
  perfume listed first. With the catalogue in another order, 97% of visitors get the same picks in the same order (98%
  before).
- **Tag noise.** With every tag shaken by 15%, a quarter of visitors keep the same three picks (a third before). The
  exact three rest on tag differences finer than the tags' own accuracy (`REPORT.md` section 7); many perfumes score
  about the same for a visitor, as the retest in `REPORT.md` section 5 also showed.
- **Wrong tags** (`l_tagnoise.js`, `out/l.txt`, 2,000 visitors): the visitors smell the catalogue's tags while the
  engine reads them with every weight shaken by 15% or 30%. Both rankings lose about the same (kept 74%, 73%, 73% for
  the old ranking; 75%, 74%, 74% for the new; turn one point up for each), and the old ranking's concentration survives
  the noise (Grand Soir to 14 and 15 visitors in 100), so it came from its structure, not from particular tag values.
- **Reachability.** A perfume is reachable when it is among the picks of a visitor whose liked families are exactly its
  own. 79% of the catalogue is (65% before). The rest are rich perfumes with more than four families in the heart and
  base, and originals whose clones are tagged with a little more of the same families: Creed Aventus loses to its
  clones, and the rule against a clone beside its original then keeps it out.

## 7. What held

- Tests: 119. The six new ones fail on the engine of 0164d00, and the one on words also fails on the first version of
  the change (ce09d2b), at the case the review found. `tests/coverage.test.js` fails if a perfume goes to more than 11
  in 100 of its seeded visitors or the ten most picked take 18% of picks, as they did on the old engine.
- The result page (`f_page.js`, 1,500 visitors, `out/after_coverage/f.txt`): palate, chips and retest figures
  unchanged; no "Free of X" beside a warning about X; no deal-breaker card listing a note the visitor liked; the same
  palate and picks in Arabic and English for 300 of 300. The audit (`reference/algorithm/audit.js`) finds its two
  patterns at the counts it found on 0164d00 (`out/after_coverage/audit.txt`, `out/audit_0164d00.txt`).
- Accuracy under `a1_accuracy.js --seeds` (its own visitors): picks kept 74% (74% to 75%), turn 10% (10% to 11%);
  deal-breaker and liking figures as before, since the profile is unchanged.

## 8. Open, for the owner

- **Visitors who rate no bottle** (section 5): ask for men's, women's or either, or accept a third of their picks
  being for the other gender.
- **Verdict-only visitors** meet Montale Leather Patchouli 11 times in 100. With "I still wear it" alone the engine knows
  only the kept bottles' bases, which are mostly the four common families; Leather Patchouli holds all four among its
  eleven families, three of them at 0.6 to 0.9 in its base. This is the cause `REPORT.md` section 2 found behind the
  palate without note rows, and the remedies are the same: ask for the note rows of kept bottles, or read "I still wear
  it" as a liking of what a base holds beyond an ordinary base.
- **A pick from the same line as a rated bottle**: 3% of visitors (2% before), such as Hawas Black after Hawas.
- **The side rule elsewhere**: the one-sample suggestion, the narrowing round and the testers ignore the visitor's side,
  so a man can be asked to sample a women's perfume to settle a deal-breaker.
- **Note-row answers against themselves**: the review found that moving one note-row answer a step can still move
  the picks the other way, as it could on 0164d00 (REVIEWS.md section 5). Changing "Didn't mind" to "Liked" on a note
  strongest in the opening makes it a lean, so that bottle's own rating drops out and another bottle's dislike of the
  family stands alone. The note picker, the taste question and the complaints are not affected. A revision of the lean
  rule of 27 September would settle it.
- **Card lines and the order of the ratings**: the picks never depend on it, but a card's like or watch line can, at an
  exact tie or on a threshold, since the lines read the unrounded score at 0.3 and 0 and list some families in the
  profile's order.
- **An avoided note shown as "Drawn to"**: the audit's 5 results in 1,500 where a family the visitor avoided on a card is
  listed under "Drawn to" with no line saying why. The liking comes from a bottle that turned; since commit 77c5f70 only
  a kept bottle lifts the avoidance, so the picks leave the family out but the taste card still lists it.

## Limits

Every figure comes from synthetic visitors and machine-made tags. In the model a visitor's liking of a perfume is the
weighted mean of the families in its heart and base, which favours perfumes made of one family; that is why the best
three concentrate, and it may flatter the old engine's pure picks on kept and turn. The model's visitors have no
preference for their own gender's perfumes, so the side rule cannot show a gain there; it costs about one point of kept
in the model (76% without it, 75% with it).
