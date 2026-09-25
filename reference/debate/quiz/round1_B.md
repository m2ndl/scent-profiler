# Round 1, B: stated preference over material descriptions

## 1. Claim

With zero bottles, a visitor answers six forced-choice screens built from the families' own descriptions (data.js hint_en, hint_ar) and always gets a profile: one or two stated "no" families, one stated "yes", three picks labelled "from what you told us", and the landmark bottles that would confirm the answers. With three bottles, the visitor also gives one drydown verdict per landmark (still wear +2, stopped -2, tried and never bought -1); worn evidence decides, and stated answers settle families the bottles leave mixed. Time: about 80 seconds for about 190 words and nine taps (my estimate, UNCHECKED).

The screens cover the twelve families whose likely deal-breaker would exclude 21 or more perfumes with book and label layers applied (cedar 34; the BRIEF's 21 is from raw tags).

Engine: computeProfile(state) reads state.stated (family to value) and adds each answer at weight 0.3, below a full-presence vendor-only drydown note (0.375). Stated answers stay out of the per-perfume count, so they never create a likely deal-breaker. A family with only stated evidence gets a new class, statedBad or statedGood; a stated answer opposing worn evidence sets "mixed" (today's rule returns "neutral"). Values: worst -1.5, second worst -1.0, other screen-worsts -0.5, best +1.0, other screen-bests +0.3, rest 0. recommend() and settleSuggestion() are unchanged: stated answers re-rank, never exclude.

Position 3 overclaims: best and worst answers on blocks of four, four and two leave 12,600 possible orders of ten families, and a full order needs at least seven screens of four (12^6 < 10!). B needs only the bottom two and the top one, which six screens identify exactly.

## 2. Evidence

1. Engine run via tools/lib/site.js, rule patched in memory: Sauvage EDP stopped plus Khamrah kept leaves woody amber "mixed" (-0.67), and the first pick, Jean Lowe Immortel, has woody amber 0.8 in its drydown. Adding "woody ambers worst" makes it badPossible (-0.84), and no pick carries it.
2. Same patch, 500 random rankings: the stated-worst family reaches 0.5 in the drydown of 1 of 1,500 picks.
3. Retest simulation (noise on each family's rank): with one family four rank steps below the rest, a second session names the same worst 98% of the time at noise of 1.5 rank steps, 82% at 2.3; with evenly spread dislikes, 41% and 34%.
4. Liang, Glover and Hawkins (2026, Behavior Research Methods, Europe PMC abstract): best-worst scaling retested better than ranking, "even over time frames as short as minutes".
5. Graus and Willemsen (2015, ACM RecSys, TU Eindhoven abstract): choice-based cold-start elicitation took less effort and gave more satisfying recommendations than rating.
6. Sawtooth "Anchored MaxDiff" help page: scores are relative only; a "none of these" follow-up sets a threshold, advised for at most four items per set, as B uses.
7. Jellinek 1997: "only one common dimension, like-dislike, for 20 odors" (jellinek_psychological_basis_1997.txt:9878-9879); components are "relatively easy to characterize", whole perfumes far harder (:6994-6996).
8. Engen 1991: "Odor preferences are like habits. They are easily established but difficult to change." (engen_odor_sensation_memory_1991.txt:4603-4604). Barkai and Wilson 2014: similar breathing "when subjects merely imagine pleasant or unpleasant smells" (barkai_wilson_odor_memory_perception_2014.txt:14799-14800).
9. Fiole's quiz offers binary choices between family descriptions ("fresh citrus fruit" or "warm woods"), claiming 25% sample-to-bottle conversion (typeform.com/blog/fioles-quiz-signature-scent).

Against B:

10. Engen: "Odors are not recalled by words, images, or other items" (:4638). Gilbert found fragrance professionals "had more vivid smell imagery" than lay people (gilbert_what_the_nose_knows_2008.txt:1017). Herz and von Clef (2001, Perception, Europe PMC abstract): labels changed the pleasantness of the same odours, patchouli among them.
11. Cardello and Maller (1982), reported by Wanich et al. (2018, Nutrients): liking of food names and tasted food correlated "mostly weak to moderate".

So B claims only the visitor's attitude to a described material, never what they smell.

## 3. Worked example

Screen 1: "Think of the smell left on your skin at the end of the day. Which would you least want?" Woody ambers; Vanilla and sugar; Dry cedar; Oud, smoky; None of these bothers me. Then "Which would you most want?" Each option shows its description.
Screen 2, same questions: Clean white musks; Resinous amber; Patchouli; White florals.
Screen 3: Tonka and hay; Creamy sandalwood; Tobacco and honey; Leather and birch smoke.
Screen 4: "You ruled out these three. Which is worst?" Woody ambers; Clean white musks; Leather.
Screen 5: "Which of these would you least want?" Clean white musks; Leather; Vanilla; Dry cedar.
Screen 6: best of the three screen-bests (smoky oud).

Zero bottles: "From what you told us: you would least want woody ambers, then clean white musks, and most want smoky oud (Oud and resin). Three to try: Swiss Arabian Shaghaf Oud, Tom Ford Oud Wood, Fragrance World Barakkat Satin Oud. To check: have you worn Sauvage Eau de Parfum (almost only woody amber in its base) or Yara (vanilla with white musk)?"

Stopped Sauvage EDP, still wears Khamrah, same answers: "Woody ambers: possible deal-breaker, from what you wore and told us. White musks: from what you told us. Vanilla, tonka, resinous amber: liked, from Khamrah. Three to try: Montale Arabians Tonka, Arabian Oud Kalemat, Guerlain Tonka Imperiale." None carries woody amber in its drydown.

## 4. Failure modes and falsifiers

- Answers may follow words, not smells (item 10). Loaded words ("dirty" patchouli, "harsh" leather) need neutral bilingual rewrites naming where each smell occurs; odours are named by their contexts (engen:3506-3509).
- Visitors may answer for bakhoor or natural oud, not the accord; each description should name one known bottle.
- Flat preferences retest poorly (item 3); the engine keeps stated results at "possible".
- A visitor anosmic to woody amber may still reject its description; D's anosmia question should be added.

Falsified within three months (stated answers stored beside ratings) if: (a) among the first 200 visitors whose ratings mark one of the twelve families bad, that family is in their stated bottom four under 40% of the time (chance 33%); (b) a retake names the same worst under half the time; (c) the first option is chosen worst over 35% of the time (chance 25%); (d) under 60% of starters finish. Any of (a) to (c) demotes B to an optional screen after landmarks.

## 5. Rivals

A. With zero bottles A gives no profile, which the owner asked for. One verdict per bottle cannot separate co-occurring families (item 1).

C. A type bundles families a dislike-first site must separate: Khamrah carries vanilla 0.9 and woody amber 0.5, so "sweet and warm" cannot say "vanilla yes, woody amber no". Engen: "Attempts to find general classes of liked and disliked odors fail" (:929-936).

D. Two of ten chips (too loud, faded fast) map to no family, and most spread over several: too sweet is vanilla 0.8, tonka 0.5, fruity 0.5, amber 0.3 (data.js CHIPS). A chip without a bottle cannot tell vanilla from tonka, and D's zero-bottle output has no liked family to rank picks by.

## 6. Cost

About 24 builder hours (estimate): screens 8, description rewrites 4, engine rule and tests 5, result labels 4, backend field 3. Engine change: yes, about ten lines in computeProfile. Golden fixture: touched only by adding stated scenarios; the 60 existing ones stay identical.
