# Stress test of the scoring (27 September 2026)

Commit tested: 23cab69, with the four engine commits that are not yet pushed. The scripts and how to rerun them are in
`README.md` in this folder; their numbers are in `out/`.

## Summary

The three picks are the strongest part of the result. For a visitor with three bottles who answers the note rows and
the word questions, the picks are kept about three times in four and turn on the visitor about one time in ten; three
random perfumes, or the three bestsellers of the visitor's gender, turn about one time in three.

What the result says about the visitor is weaker:

- **The palate name follows the note rows when the visitor answers them, and the bases of the kept bottles when they do
  not.** Three kept floral perfumes are named Floral or Rose 149 times in 150 when their floral rows are marked "Loved
  it", and 13 times in 150 on the verdict alone, when the name comes from the strongest family in the bottles' bases.
  Those bases are dominated by four families, so the quiz's 60 bottles, kept, vote Woody, Sweet, Musk, Amber or Oud 59
  times out of 60.
- **The families under "Drawn to" are true likings about one time in five**, because "I still wear it" makes every
  family in a kept bottle's base a liking.
- **The first deal-breaker named is right about four times in ten**, because a bottle that turned accuses every strong
  family in the stage (2.7 for a quiz bottle's base). "Likely deal-breaker" is right about six times in ten, "Possible
  deal-breaker" about one time in five.
- **The same visitor taking the quiz again with the same bottles** gets the same palate 55% of the time and the same
  first deal-breaker 57%.

Section 8 lists five defects, including two ways a family the visitor said they liked is shown as a deal-breaker.

## How the numbers were made

Synthetic visitors with a hidden taste take the quiz, the real engine and quiz page build their result, and the hidden
taste scores it. Each visitor has a mild opinion on every family, two or three liked families and, nine times in ten,
one or two deal-breakers, drawn evenly across the families. A deal-breaker ruins a stage it is strong in, with a chance
that rises from none at 0.25 presence to certain at 0.6; a stage it does not ruin is judged on the presence-weighted mean
of the visitor's opinions, with noise. Visitors have tried bottles mostly from the quiz grid and More perfumes, of their
own gender nine times in ten, and bought them after a test in the shop, so what turns on them tends to turn later. They
answer as the quiz writes its verdicts (checked line by line against `writeVerdict`): "I don't remember" when a bottle
turned one time in four; complaint chips only when one family ruined the stage; the note rows on 60% of bottles; and in
the word questions they know half the note names. This gives 42% "I still wear it", 22% "it turned on me" (61% of those
in the base), 13% "another reason" and 3% "put me off in a shop"; the rest are "I don't remember how it ended", or shop
trials that did not put them off. A pick is scored by 30 simulated wears: "kept" is the share ending in "I still wear
it", "turns" the share ending in "it turned on me". Unless a section says otherwise, the visitor has three bottles and
answers everything. Figures from one run carry about two to three points of sampling noise; the ranges given are over
five seeds.

## 1. The picks beat chance, mostly through the word answers

| What the visitor answered, or where the picks came from | Kept | Turn |
|---|---|---|
| Verdicts only | 57% | 18% |
| Verdicts and note rows | 63% | 15% |
| Verdicts, note rows and word answers (five seeds) | 74% (72 to 74) | 10% (9 to 11) |
| The same with eight bottles | 75% | 8% |
| Word answers only, no bottle | 79% | 10% |
| Word answers only, knowing one note name in five and blaming a deal-breaker on its usual companion three times in ten | 69% | 14% |
| Three random perfumes | 45% | 34% |
| The three bestsellers of the visitor's gender they have not rated | 47% | 31% |
| The best three the catalogue holds for the visitor | 97% | 3% |

- Most of the gain comes from the word answers (note picker, sweet or bitter, complaints). Bottles alone lift the picks
  from 45% to 57%; more bottles add little once the words are in. How much the words carry depends on how well real
  visitors know note names, which the model can only assume; the weak-knowledge row is the cautious figure.
- With one bottle and no enjoyed note the page shows no picks; those picks would be kept 53% of the time and turn 21%.
- When visitors own bottles for what they like in them (a stronger link between taste and bottles), the picks with every
  answer move by one point or less.

## 2. The palate name follows the note rows, or else the bases

- **Without note rows**, a kept bottle votes for the group of its strongest base family, since "I still wear it" writes
  only the base. Four families fill most bases: woody ambers, white musks, vanilla and resinous amber are each in 34% to
  43% of the catalogue's bases, and 85% of perfumes hold at least one of them at 0.4 or more there. Kept, the 60 grid and
  More bottles vote Woody 19 times, Sweet 16, Musk 14, Amber 5, Oud 5, Fresh once, and Floral, Rose and Spiced never.
  Across the catalogue 31 of 1,000 perfumes vote Floral, Fresh, Rose or Spiced, although those groups hold 30% of the
  catalogue's heart and base weight.
- **With note rows**, the name follows them. On the page:

  | Kept bottles | Verdict only | "Loved it" on the rows of that kind |
  |---|---|---|
  | Acqua di Giò, Bleu de Chanel, Invictus | The Woody and Musk Palate | The Woody and Fresh Palate |
  | Coco Mademoiselle, Libre, Miss Dior Blooming Bouquet | The Musk and Woody Palate | The Rose and Floral Palate |
  | 150 random trios of perfumes holding floral or rose at 0.8 or more in the heart or base | Floral or Rose named 13 times (leading 2) | 149 times (leading 144) |
  | 150 random trios holding a fresh family at 0.8 or more in the heart or base | Fresh named 30 times (leading 10) | 137 times (leading 128) |

- **Against the synthetic visitors' hidden taste**, who answer the rows on 60% of their bottles, the palate's lead group
  is their strongest liking for 21% of visitors; naming everyone "The Woody Palate" would score 24%. It names some group
  they like for 53%, against 52% for the constant. This figure depends on how the synthetic visitors choose bottles and
  spread their likings, and reads best as a statement about three bottles: the strongest liking sits in the heart or
  base of a bottle the visitor kept for only 22% of them (30% when they own bottles for what they like in them). No vote
  over kept bottles gets past that. Voting by how far a family stands above its catalogue average, or for the family
  loved on the rows, gives 19% and 20%; letting "I still wear it" also credit the heart changes which palates are named
  (Floral rises from 4% to 15% of visitors) but not how often the name is right (19%).
- The same visitor with the same bottles gets the same palate 55% of the time on a retest, mostly from which note rows
  they answer.
- What it points to: the name describes the person when the note rows are answered and describes the bottles when they
  are not. Either ask for the rows of the kept bottles before naming the palate, or word a verdict-only name as the
  bottles ("Your bottles lean woody and musky").

## 3. Deal-breakers are found, but innocent families are accused with them

- When a rated bottle holds the visitor's deal-breaker, it is flagged 86% of the time (90% with eight bottles).
- Of the flagged families, 29% are true deal-breakers (28% to 30% over five seeds) and 65% are families the visitor
  dislikes at all; about two innocent families are flagged per visitor. The first one named is right 41% of the time (39%
  to 44%); 29% with one bottle and verdicts only, 53% with eight bottles and note rows.
- By label, over five seeds: "Likely deal-breaker" is a true deal-breaker 59% of the time (83% a family the visitor
  dislikes at all); "Possible deal-breaker" 22% (58%). "Reliably liked" is a true liking 27% of the time, "Probably
  liked" 17%.
- The cause is that a bottle that turned gives −2 to every strong family in the stage: 2.7 families for the base of a
  quiz bottle, 3.15 across the catalogue. The narrowing round draws on the 20 grid bottles, which can separate 60% of the
  families a quiz bottle accuses; the whole catalogue can separate all of them. And 43% of the turns and shop put-offs
  in the model come from a general dislike of the perfume rather than a ruin by one family, so most of the families such
  a turn accuses are innocent.
- Note rows raise the share that is true from 22% to 29%; the word answers never set a class, so they do not change it.
  The narrowing round is not in these figures: the synthetic visitors name every bottle they know on the first screen,
  so the unrated bottles it offers are ones they have not tried.
- What it points to: the "Possible" label is honest, but a possible deal-breaker still drives the "ruled out" count,
  the rose wash on the wheel, the share card, the result event and the comparison line. Name a deal-breaker only when a
  note row or a second bottle singles it out, and otherwise show the accused families together; let the narrowing round
  draw on the whole catalogue.

## 4. "Ruled out for you" counts too many

With three bottles and every answer, the count averages 268 perfumes, of which 55% would really turn on the visitor; with
verdicts only, 257, of which 36%. The count includes possible deal-breakers, which the picks do not exclude, so a pick can
be one of the perfumes counted as ruled out (216 of 60,000 picks for quiz-shaped inputs in section 9). What it points
to: count what the picks exclude, the open question logged on 25 Sep.

## 5. The result changes on a retest

| The same visitor twice | Same first deal-breaker | Picks in common (of 3) | No pick in common |
|---|---|---|---|
| Same three bottles and history, answered again | 57% | 0.96 | 39% |
| Same, five bottles | 62% | 0.83 | 43% |
| A different three of the same six owned bottles | 44% | 0.48 | 65% |
| Same three bottles, only "When did it bother you?" and chips answered again | 81% | 2.79 | 4% |
| Same three bottles, only the note rows answered again | 57% | 1.23 | 34% |
| Same three bottles, only the word answers given again | 100% | 2.11 | 6% |

The note rows move the deal-breaker most: a row answered "Didn't notice it" or "Didn't mind" on an accused family lifts
its −2, so which rows a visitor answers decides which family stays accused. The word answers move the picks but never
the deal-breaker. The picks changing matters less than it looks, since many perfumes score about the same and the kept
rate holds near 74%; the named deal-breaker and palate changing matters more, since the result presents them as
findings.

## 6. Where the picks go

- 22% of picks are perfumes for the other gender (23% for women, 20% for men); 43% of visitors get at least one. Their
  own bottles cross over 7% of the time. The engine does not read gender.
- Niche houses take 40% of picks against 19% of the catalogue; Arab houses 18% against 21%.
- The same few perfumes go to many visitors: Molecule 01 to 14.5% of visitors, Grand Soir to 13%, Not a Perfume to 12%;
  the ten most picked take a quarter of all picks (with word answers only, Hugo Iced 16%, Tobacco Vanille 15%). Molecule
  01 and Not a Perfume hold one or two common base families from opening to base, so the base family that "I still wear
  it" made a liking counts in all three stages and nothing else in them costs anything.
- A pick from the same line as a bottle the visitor rated (Yara Candy after Yara): 2% of visitors.
- What it points to: keep picks to the visitor's side (the genders of their bottles, and unisex) unless their bottles
  cross over.

## 7. The tags

No person tagged any perfume. The 286 older entries carry judgement tags, set by an earlier Claude session from each
perfume's note list and descriptions (about 40 were later corrected against two books); the 714 added on 25 and 26
September were tagged by `mapper.js` from their note lists. Neither set had been checked against how the perfumes smell,
so both are compared here with the one independent human source at hand, Fragrantica's crowd-voted main accords, read
through `mapper.js`'s own accord table.

| Tags | Perfumes | Strongest base family among the first six accords | Strong families (0.5+, heart or base) among the first six accords |
|---|---|---|---|
| Judgement tags | 214 | 71% | 65% |
| Mapper tags for the same 214 perfumes | 214 | 66% | 53% |
| Mapper tags of the 667 expansion perfumes | 667 | 64% | 61% |

- The judgement tags agree with the crowd somewhat more often than the mapper does on the same perfumes. Counted by
  palate group rather than by family, the three rows are level (82%, 84% and 84%).
- On the 265 judgement-tagged perfumes (clones left out), the two methods name the same strongest base family 59% of
  the time. The mapper can only read the listed notes: Baccarat Rouge 540's listed base is "fir resin, cedar", so it gives
  cedar, incense and green where the judgement tags give woody ambers at full weight; Tobacco Vanille's listed base is
  "dried fruits, woods". It also spreads weight more evenly, with 3.2 families at 0.4 or more in a base against 2.9, so a
  mapper-tagged bottle that turns accuses more families.
- The disagreement costs about four points either way. If the judgement tags are how the perfumes smell, an engine
  reading the mapper's tags keeps 70% of picks instead of 74% and names the right first deal-breaker 39% of the time
  instead of 47%; if the mapper's tags are, the judgement tags keep 67% instead of 71%.
- What it points to: the expansion perfumes whose strongest base family no accord in their first six backs, even by
  palate group (16%), are a checking queue; Arabian Oud Aseel Special Edition, for one, is voted rose, vanilla, caramel,
  sweet and white floral, and tagged with a base of patchouli, white musk and woody ambers.

## 8. Defects

All five were fixed after this report, in `site/js/engine.js`, `README.md` and a comment in `site/js/data.js`, and an
independent review of the fix found four follow-ups, also fixed: an avoided note now gives way only to a bottle the
visitor kept; stored values are read only when they are numbers; a family relabelled mixed keeps its old weight in the
picks, so the picks are unchanged; and the docs cover the "Didn't mind" answer. `fix_trial.js` compares the ways of
fixing them on the same visitors, and `out/after_fix/` holds the checks rerun on the fixed code.

1. **A family the visitor said they liked can be shown as their deal-breaker.** 11 of 1,500 simulated results (0.7%)
   show a deal-breaker card that lists "you liked" or "you loved" that family's note. Two rules cause it.
   - *Through the same bottle* (3 of the 11). A note answer replaces the rating only in the family's strongest stage,
     so the bottle's other stage still counts against the family. Supremacy Noir turned in its heart with its vanilla
     answered "Liked it", and Yara turned in its base: the result shows "Vanilla and sugar: Likely deal-breaker" above
     "Supremacy Noir: you liked the vanilla (hours later)". The engine already has the rule that prevents this, for
     leans only: a bottle's stage ratings count for a family only where they agree with the visitor's answer on it.
     Applied to every note answer, it removes these cases, and their mirror on the profiler, where a disliked note
     counted as a liking through a better stage of the same bottle (7 of 20,000 profiler-shaped inputs).
   - *Through another bottle* (8 of the 11). A family liked in one bottle and disliked in another is "mixed" only while
     its mean stays between −0.7 and 0.7 (`engine.js`, the class rules in `computeProfile`); below −0.7 it becomes a
     possible deal-breaker, and a complaint chip's −2.5 easily takes it there. Idôle kept with its vanilla liked, and La
     Vie Est Belle turned with "too sweet": the result shows "Vanilla and sugar: Possible deal-breaker" above "Idôle: you
     liked the vanilla (hours later)". The README says a family that drew both likes and dislikes is mixed.
2. **"Free of X" checks the base only.** 1.2% of "Free of" lines name a family the pick holds at 0.3 or more in its
   heart or opening; on 0.3% of pick cards the line sits beside a warning about the same family ("Free of woody ambers"
   and "Some woody ambers in the heart, which may be a deal-breaker for you").
3. **A score that lands on a class boundary can fall either side.** Sums of the same ratings in another order differ in
   the last digit (0.7 against 0.6999999999999998), which moves a family across the 0.7 line: 1 in 20,000 quiz-shaped
   inputs and 3 in 20,000 profiler-shaped ones; in one of them the same three picks came in another order. Rounding the
   score before the class rules fixes it.
4. **Stored ratings are not checked.** A rating of 99, or a note answer of a million, in the browser's storage is used as
   it is, so it outweighs every other rating. Only editing the storage by hand reaches this.
5. **The README describes the tags as a person's work.** "The note list read by a person" and "confidence 3 means the
   tagger has worn it" do not describe how the tags were made (section 7).

## 9. What held

On 40,000 generated inputs (quiz-shaped from synthetic visitors, and profiler-shaped with any ratings, chips, note
answers and word answers): nothing threw; no score left its range; no pick was already rated, shared a house with another
pick, sat beside its clone, or held a likely deal-breaker at the strength that excludes it; raising or lowering one
rating never moved a family's class the other way; apart from defect 3, the order of the ratings changed nothing. The
seven hostile stored values threw nothing either (defect 4 is what they do instead). Arabic and English gave the same
palate and picks for 300 of 300 visitors. The audit kept with the lean rule (`reference/algorithm/audit.js`) reports on
this commit only the pattern it recorded as legitimate (306 of 1,500).

## Limits

Every accuracy figure outside section 7 comes from synthetic visitors and takes the catalogue's tags as what the
perfumes smell like. The visitors' likings and deal-breakers are spread evenly across families; real tastes cluster,
and where most visitors like woody or sweet perfumes a Woody or Sweet palate is right more often, for the same reason a
constant would be. The narrowing round is not simulated (section 3). No real visitor data exists yet, since the backend
is not deployed; the falsifiers in `reference/debate/quiz/ROUNDTABLE.md` section 6 remain the test that counts.
