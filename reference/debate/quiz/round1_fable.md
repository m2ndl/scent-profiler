# Round 1, Fable: ask about remembered reactions, never about imagined materials

## 1. The claim

The spine is A (verdicts on landmark bottles) with two parts from D: every negative verdict names its complaint (the existing chips), and the same complaint question about an unnamed bottle is the zero-bottle fallback.

Zero bottles: a profile labelled "from what you remember, not from what you wore": the complaint that most often ended a bottle, mapped through CHIPS to families; three recommendations ranked by penalty; three isolating samples. Three bottles: the ordinary profile. Verdicts map to the drydown only: still wear +2; stopped for another reason +1; tried, did not buy -1; stopped because of the smell -2 plus chips. Five screens, 60 to 90 seconds (UNCHECKED estimate).

Engine: computeProfile(state) reads state.stated = { chips, anosmia }; a stated chip calls add() at half weight with strong: false, so it moves the score but never enters per or n; a new class statedBad covers n === 0 and score ≤ -0.7. recommend() is unchanged: it excludes only badLikely, so stated evidence steers ranking and never excludes. Anosmia is a page-side risk line.

## 2. Evidence

1. Catalogue (tools/lib/site.js, evidence layers applied): the landmark list resolves to 52 entries; drydown coverage at ≥ 0.5: vanilla 28, woody amber 25, amber resin 18, white musk 17, rose 0. A landmark carries 2.5 such families. Excluding vanilla, woody amber and white musk leaves 55 of 286.
2. Simulation: Sauvage EDP drydown -2 plus Khamrah +2 gives woody amber "mixed" (-0.67), because Khamrah carries woody amber 0.5; the "sharp / chemical" chip on Sauvage makes it badPossible (-0.94). One verdict spread over three stages invents lavender and fresh-spice dislikes from Sauvage alone.
3. engen_odor_sensation_memory_1991.txt: 868-871 (p. 34), familiar odours were liked 67 percent and disliked 33, unfamiliar odours liked 17 and disliked 83, "a ratio of about five to one"; 3262-3275 (p. 100), smelling a lemon by merely thinking of it "has not been demonstrated"; 1498 (p. 51), odour perception "resists forgetting"; 4499-4501 (p. 135), odour information is acquired "typically after only one exposure. Aversion illustrates this".
4. gilbert_what_the_nose_knows_2008.txt: 258, in mixtures of three or more odours "fewer than 15 percent of people could identify even one component"; 560 and 1017, fragrance professionals have more vivid smell imagery than "civilians"; against me, 1031, a written description lets a reader "accurately imagine a smell's intensity and character".
5. jellinek_psychological_basis_1997.txt: 6993-6998, describing a whole perfume in words is "far harder and often impossible"; 9879, Berglund (1973) found "only one common dimension, like-dislike"; 10154-10157, Klutky (1990): sharp, dark, heavy, cold and hard go with "unpleasant", tested with no actual fragrances.
6. mcgee_nose_dive_2020.txt:12566, agarwood has facets "from woods and resins to flowers, spices, and leather": a raw material is not one family.
7. Rashid et al., "Getting to know you", IUI 2002 (PDF fetched): pure entropy was worst on both items users could rate and prediction error; popularity times entropy best, popularity close behind.
8. Anosmia: scent_and_chemistry_2022.txt:1992, about a third cannot smell androstenone, "a similar number" for Galaxolide; Bremner et al., Chemical Senses 2003 (fetched): 16.3 percent putative non-detectors fell to 1.8 to 5.96 percent under forced-choice retesting. Self-report over-flags.
9. RevenueHunt 2026 benchmark (fetched, 45 million responses): 69 percent of starters finish; 5.5 percent of finishers buy; fragrance leads at 6.9 percent. Scentbird's quiz (review fetched, mysubscriptionaddiction.com 2022) is five binary lifestyle choices and asks about no bottle ever worn.

## 3. Worked example

S1. "Which of these have you worn, or tried on your skin? Tap all that apply." Twenty bottle images, a men / women toggle, "None of these".
S2. Per tapped bottle: "Still wear it / Stopped: the smell turned on me / Stopped: another reason / Tried on skin, did not buy."
S3. Per negative verdict: "What was wrong, hours later?" The ten chips plus "Can't say".
S4. Everyone: "Think of a perfume you stopped wearing or refused to buy, even one you cannot name. Pick the one complaint that fits best." The chips plus "Never happened".
S5. "Has anyone said a perfume was strong on you when you could barely smell it yourself?" Yes / No / Not sure.

No bottles, "too sweet": heading "From what you remember, not from what you wore"; stated deal-breakers vanilla and sugar, tonka and hay, sweet fruit; three to try Hermès H24, Louis Vuitton Afternoon Swim, Maison Alhambra Glacier Bold; then samples: Sauvage EDP (woody amber alone), Byredo Blanche (white musk alone), Replica Coffee Break (vanilla).

Sauvage EDP stopped for the smell, "sharp / chemical", Khamrah still worn: possible deal-breaker woody ambers, seen in 2 perfumes, one liked; probably liked tonka, resinous amber, vanilla; three to try Jean Lowe Immortel, Tonka Impériale, Vanilla 28.

## 4. Failure modes and falsifiers

- Jean Lowe Immortel (woody amber 0.8) is still recommended because reward outweighs a badPossible penalty; recommend() needs a cap at ≥ 0.7 drydown.
- Chip weights: falsified if, among rated bottles carrying "too sweet", fewer than 60 percent have vanilla or tonka ≥ 0.4 in the drydown (month 3).
- Median visitor taps fewer than two landmarks: the verdict layer fails. "Stopped: another reason" under 10 percent of stops: -2 is too strong. Completion under 50 percent (benchmark 69): too many screens. Anosmia "yes" above 25 percent: over-reporting.

## 5. Weakest point of each rival

A. Its narrowing rule assumes early answers settle families; a landmark carries 2.5 heavy families (item 1) and Sauvage plus Khamrah gives "mixed" (item 2). Without the reason split, "stopped wearing" mixes price and boredom with smell. The zero-bottle visitor gets nothing.

B. Gilbert's readers imagine a described smell's character (item 4); the quiz needs tolerability on skin after six hours, which imagery has never been shown to deliver (item 3), and laypeople's imagery is the weaker kind. The hints name materials this audience has never met in isolation, and unfamiliar odours are disliked five to one (item 3), so "Ambroxan-type" loses to "musk" whatever the skin says; Klutky's poles add that "sharp" and "dirty" lose to "clean" and "soft" (item 5). Under the current engine a stated verdict counts toward n, so one stated answer plus one bottle would exclude 97 to 116 perfumes.

C. Lifestyle questions have no demonstrated mapping to material tolerance; Jellinek's type diagrams are the precedent, judged culture-bound and unsupported (reference/audit/jellinek_axes.md, section b, point 5). A "sweet and warm" type is three co-occurring families that already dominate 116 of 286 entries, so the prior recommends the most common thing.

D. Chips without a bottle carry little information when nearly everyone says yes to several; hence one forced choice at half weight, never excluding. Its anosmia block would remove 97 to 101 perfumes on a self-report that overstates anosmia (item 8). "Everyday smells you avoid" cannot map a material with five facets to one family (item 6), and the families it reaches exclude almost nothing (rose 18, incense 8).

## 6. Cost

About 25 to 35 builder hours to a first useful version (UNCHECKED estimate). Engine change: yes, about 15 lines in computeProfile plus state.stated and the statedBad class. Golden fixture: regenerated, expected unchanged since no fixture carries a stated layer; one new fixture with stated input.
