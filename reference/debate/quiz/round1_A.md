# Path A: landmarks first

## 1. Claim

The quiz asks only what the visitor has worn, because a verdict on a worn bottle is the smell judgment people make most reliably.

- **Zero bottles:** no profile, no recommendations. The page offers three designer testers, each close to a pure test of one family, labelled with what a bad dry-down would show. Those three families decide eligibility for 231 of 286 perfumes.
- **Three bottles:** a profile. Stopped Sauvage EDP and Bleu de Chanel EDP, still wears Bade'e Al Oud: woody ambers likely, cedar and incense possible, 184 perfumes eligible, picks Montale Black Aoud, Initio Oud for Greatness, Guerlain Santal Royal (engine run).
- **Length:** three to five screens; about 10 seconds with zero bottles, 60 to 90 with three (UNCHECKED estimate).
- **Engine:** no change. The page writes ordinary ratings: still wear it = drydown +1; stopped wearing it = drydown -2; only smelled it in a shop = opening -1. A one-tap "when did it bother you?" can move the -2 to opening or heart; chips attach to that stage. The verdict also fills the existing `again` field (app.js:403) and a `src: "quiz"` label.

## 2. Evidence

1. **Ask about items people have seen.** At MovieLens sign-up, popular titles let new users rate ten films after 1.9 pages of ten, against 7.0 for the old method; random and entropy-based choices were dropped because users could rate too few (Rashid et al., IUI 2002, PDF read).
2. **Adapt the next question.** An interview tree over single items, with like, dislike and unknown branches, beat earlier approaches; seed items should be "familiar to the users, but also indicative of their tendencies" (Golbandi, Koren and Lempel, WSDM 2011, PDF read).
3. **Smell is judged as a whole object.** Odours "do not have their own names but are described as smelling like something else" (engen_odor_sensation_memory_1991.txt:608-609); people have "limited ability to analyze components of complex mixtures" (barkai_wilson_odor_memory_perception_2014.txt:13096-13097). The visitor judges the bottle; the engine splits it into families.
4. **Experts do the same.** At least 201 of 1,219 reviews in perfumes_the_guide_2018.txt name another perfume with its house (my regex count).
5. **Dislikes last.** "A long-term odor memory can be established with only one exposure" (engen:558); recognition was as good after a year as on the day (engen:3311-3322); odour aversions resist relearning (engen:3372-3374). Similarity studies "find only one common dimension, like-dislike" (jellinek_psychological_basis_1997.txt:9879).
6. **The landmarks are worn here.** Sauvage has been the world's best-selling fragrance since 2021 (en.wikipedia.org/wiki/Sauvage_(fragrance), fetched). Of 1,078 Saudi adults surveyed in 2020, 77.4% used imported brands and 15% unknown or counterfeit products (Healthcare 2021, 9:1248, PMC8535261, fetched).
7. **Twenty bottles separate the deciding families.** The grid below holds each of the ten families at exclusion strength in at least two bottles and separates 88 of 90 ordered family pairs (one at 0.5 or more, the other below 0.4). Sauvage EDP and Invictus test woody amber with no other deciding family at 0.4.
8. **Zero evidence carries no taste signal.** With empty ratings, recommend() returns Hermès H24, Afternoon Swim and Qaed Al Fursan, ranked only by fewest untested families, all scoring below zero.

Grid: Sauvage EDP, Bleu de Chanel EDP, Eros, Club de Nuit Intense Man, Hawas, Khamrah, Yara, Libre, Black Opium, Good Girl, Coco Mademoiselle, La Vie Est Belle, Baccarat Rouge 540, Interlude Man, Santal 33, Oud Wood, Bade'e Al Oud, Acqua di Giò, Aventus, Invictus. Counts use the engine's catalogue after evidence.

## 3. Worked example

1. "Which of these have you worn on your skin for a whole day or more?" Twenty tiles; "None of these"; "Another perfume" (search).
2. With zero taps: "Have you worn any other perfume long enough to remember it?" "Yes, search" / "No." Otherwise, per bottle: "Sauvage Eau de Parfum:" "I still wear it" / "I stopped wearing it because of how it smelled on me" / "I only smelled it in a shop."
3. Per stopped bottle: "When did it bother you?" "First minutes" / "First hours" / "Hours later, or on my clothes"; optional "What was wrong?" with the ten existing chips.
4. If a deal-breaker is only possible: "Have you worn any of these?" Grid bottles holding that family without the others seen (for woody amber: Invictus, Hawas, Bleu de Chanel EDP, Eros). Settled families are skipped.
5. Result.

**Zero bottles.** "Your profile comes from perfumes you have worn, so we can't build it yet. Spray a tester on your wrist and smell it four hours later. Dior Sauvage EDP is mainly woody amber; if it bothers you, 101 of our 286 perfumes become risky. Narciso Rodriguez For Her EDT: white musk (97). Valentino Uomo Born in Roma: vanilla (116). Two answers give your first recommendations." (Availability at Saudi counters UNCHECKED.)

**Stopped Sauvage EDP, still wears Khamrah** (engine run). "Possible deal-breaker: woody ambers. It is almost the whole dry-down of Sauvage EDP, which you stopped wearing, and weaker than vanilla and tonka in Khamrah, which you still wear. Possible likes: tonka, resinous amber. For you: Guerlain Tonka Impériale, By Kilian Angels' Share, Montale Arabians Tonka; none lists woody amber in its dry-down. To settle it: have you worn Invictus?"

## 4. Failure modes and falsifiers

- Zero-bottle visitors get a task, not a profile.
- A liked bottle blocks "likely": stopping Sauvage EDP and Hawas while wearing Khamrah leaves woody amber "possible", since Khamrah holds it at 0.5 (engine.js:116).
- No grid bottle separates tonka or white floral from vanilla.
- Flankers, clones and counterfeits mean the bottle worn may not be the bottle tagged.
- A visitor anosmic to Ambroxan who still wears Sauvage gives a false like.

Falsified within three months if more than half of Saudi starters tap no bottle; if under half of visitors with two or more bottles reach any deal-breaker class; if later stage ratings contradict the verdict's drydown sign more than a quarter of the time; or if under 10% of zero-bottle visitors return with a tester verdict.

## 5. Rivals

**B** ranks words. Labels alone change the pleasantness of an identical odour, patchouli among them (Herz and von Clef, Perception 2001, Europe PMC abstract). The site's hints carry such words: patchouli is "the 'dirty' part" (data.js:28). Unfamiliar odours were disliked 83% of the time, familiar ones 33% (engen:868-871), so unknown materials draw dislike. Three screens of four observe 15 of 45 family pairs.

**C**: the deciding families occur in every type. Of 73 catalogue perfumes opening citrus or aquatic, 58 dry down to woody amber or white musk at 0.5 or more. A type prior enters the engine as evidence nobody wore. Jellinek's own typing put nearly every perfume of his day in one type (jellinek_psychological_basis_1997.txt:11354-11357).

**D**: the engine counts chips only where the family is present in the rated perfume (engine.js:102), so bottle-less chips need an engine change and a golden diff. "Heavy" maps to four families (data.js CHIPS). "I barely smell it" is ordinary adaptation (rapid fatigue after Ambrox, scent_and_chemistry_2022.txt:1998). "Made you feel sick" measures perfume sensitivity (14.6% in the Saudi survey), not a family.

## 6. Cost

About 15 builder hours (estimate), page code in app.js in both languages. Engine change: no. Golden fixture touched: no.
