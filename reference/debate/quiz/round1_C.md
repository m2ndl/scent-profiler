# Round 1, advocate C: the archetype quiz

## 1. The claim

Five question screens and one landmark screen, about 45 to 60 seconds (UNCHECKED estimate), always end in a named type, a runner-up, three recommendations and one bottle to smell first. The seven types are family sets drawn from the catalogue's clusters: Clean musk, Fresh radiant, Dry woods, Soft sweet, Warm sweet, Oud and amber, Leather and smoke. They name smells, never the person (reference/audit/jellinek_axes.md).

- Zero bottles: results are labelled "from your answers, not yet from your skin"; if the type's landmark bottle puts you off, the type is wrong.
- Three bottles: verdicts become ratings (still wear: heart +1, drydown +2; stopped: heart -1, drydown -2; tried, never bought: drydown -1) and move type points by 2. Any family a rating touches ignores the type.
- Engine: one new pure function, withPrior(prof, prior), adds the type's families (liked +0.5, avoided -0.5, each complaint chip -0.5 times its weight, clipped to ±0.6) as class "stated" wherever computeProfile found nothing. Existing functions are unchanged; since recommend excludes only "badLikely" families, a type ranks but never excludes.

## 2. Evidence

1. Structure (computed through tools/lib/site.js, cosine k-means on the 286 drydowns): the silhouette stays at 0.27 to 0.30 for 3 to 12 clusters, so no number of types is natural. Heart plus drydown gives eight readable groups, from vanilla-musk (54) to tobacco (20). "Earthy chypre" and "powdery floral" do not appear: oakmoss leads 2 drydowns, iris 1.
2. Coverage: 261 of 286 perfumes fall in at least one type's pool, 130 in two; pools run from 25 to 129. recommend() gives 21 different picks across the seven.
3. Negative-only input separates visitors poorly: "too sweet" alone and "heavy" plus "smoky" both return H24, Afternoon Swim and Glacier Bold, all scoring below zero. recommend() needs liked families; a type supplies them.
4. Consumers sort perfumes on two axes, "heavy-light and floral-non-floral" (jellinek_psychological_basis_1997.txt:10973-10974). A five-country map puts "autumn", "evening" and "night" beside oriental, honey and animal bases, and "morning" and "spring" beside cologne and green notes (lines 10981-11012, 11023-11025).
5. Preference sits in lived associations: "odor preferences are learned" through "the memory of associations" (engen_odor_sensation_memory_1991.txt:420-421), and "They are easily established but difficult to change" (engen:4603-4604). Home-incense and occasion questions ask about those associations; bakhoor is "deeply ingrained in social customs" (AramcoWorld, March 2025, fetched).
6. Named groups are how perfume is sold and taught. Edwards wrote The Fragrance Manual (1984) "to help retailers suggest perfumes to consumers"; his wheel was "widely adopted in the industry" (en.wikipedia.org/wiki/Michael_Edwards_(fragrance_expert), fetched). Perfumers learn to "identify the archetypes of certain perfumery families" (scent_and_chemistry_2022.txt:6152).
7. AlRossais, Kudenko and Yuan, "Improving cold-start recommendations using item-based stereotypes" (User Modeling and User-Adapted Interaction, 2021) found that stereotypes built from item metadata, without ratings, improved cold-start results (thesis abstract, etheses.whiterose.ac.uk/id/eprint/28719, fetched). Rashid et al. (IUI 2002, full text read): with popular items, over 90 percent of users who finished sign-up did so within five pages.
8. Short quizzes get finished: 69 percent of starters finish, and 6.9 percent of fragrance-quiz finishers order (RevenueHunt 2026 benchmark, 45 million responses, self-selected; revenuehunt.com, fetched). Scentbird asks five two-way questions (mysubscriptionaddiction.com, 2022, fetched). No published share rate for named types was found: UNCHECKED.

## 3. Worked example

- S1. After a shower, what would you rather smell of all day? Clean cotton and cold water; warm vanilla and amber; dry wood and pepper; oud smoke and rose.
- S2. What do you burn at home most often? Oud chips; sweet bakhoor; luban; nothing.
- S3. When do you wear perfume most? Daytime and work; evenings out; majlis and weddings; always.
- S4. Has a perfume ever put you off by being: too sweet; soapy; smoky; sharp or chemical; never.
- S5. Who should smell it? The whole room; people who greet me; only me.
- S6. Landmarks, one per type: Acqua di Giò, Sauvage EDP, Terre d'Hermès, Yara, Khamrah, Bade'e Al Oud for Glory, Club de Nuit Intense Man.

Zero bottles (oud smoke, oud chips, majlis, too sweet, greet): Oud and amber 5 points, Leather and smoke 2. "Your type: Oud and amber. Runner-up: Leather and smoke. From your answers: Oud Ispahan (Dior), Shaghaf Oud (Swiss Arabian), Ombre Nomade (Louis Vuitton). Smell Bade'e Al Oud for Glory first; if it fails, try Club de Nuit Intense Man." The share link carries the type only.

Stopped Sauvage EDP, still wears Khamrah (vanilla, sweet bakhoor, evenings, never, room): Warm sweet 7, Soft sweet 4, Fresh radiant -1. Sweet families become possible likes, lavender and warm spice possible dislikes, and woody amber mixed, because Khamrah's drydown carries it at 0.5. Picks: Jean Lowe Immortel (Maison Alhambra), Tonka Impériale (Guerlain), Fan Your Flames (Nishane); bottles alone give Jean Lowe Immortel, Vanilla 28, Good Girl. The type shifts two picks toward tonka and tobacco but cannot remove Jean Lowe Immortel (woody amber 0.8), since ratings outrank it; its "mixed" warning must show. Next test: Yara.

## 4. Failure modes and falsifiers

- Engen's objection: "Attempts to find general classes of liked and disliked odors fail" (engen:929-935). My types classify perfumes, and the landmark tests each placement.
- Types divide a continuous space, so borderline visitors will flip: 39 to 76 percent get a different MBTI type on retest after five weeks (en.wikipedia.org/wiki/Myers%E2%80%93Briggs_Type_Indicator, fetched). The runner-up must always show.
- Forer's 39 students rated one generic description 4.30 of 5 (en.wikipedia.org/wiki/Barnum_effect, fetched): liking a type proves nothing.
- An S2 answer above 70 percent carries no information; then drop S2.
- Owners of "often four or more" perfumes (jellinek:11340) fit one type badly. 160 of 286 perfumes have a sweet base; 25 well-known hybrids (Baccarat Rouge 540, Layton, Angel) fit no pool.

Falsified within three months if over 40 percent of retakes within a week change type; if in-type bottles score no higher than out-of-type bottles on the drydown across 150 later ratings; if one type exceeds 40 percent of results; if over a third stopped wearing their own type's landmark; or if under 60 percent of starters finish. The first two reduce the type to a label.

## 5. Rivals' weakest points

A. Zero bottles get no profile, the owner's central request. "Stopped wearing" is ambiguous for people who rotate bottles. Well-known bottles share families: woody amber reaches 0.5 or more in 101 drydowns, Khamrah's included, so two verdicts left it mixed in my example.

B. Verbal descriptions are the weakest evidence: across 20 odours only like-dislike was shared; "All other dimensions are purely individual" (jellinek:9879-9880). About a third cannot smell Galaxolide (scent_and_chemistry_2022.txt:1992), so a stated dislike of "clean-laundry musk" may concern a word. Nobody forwards a ranking of material names.

D. Without liked families, recommend() ranks by avoidance alone: two different complaint sets returned the same three bottles (item 3). The zero-bottle output lists possible dislikes, and the everyday-smells question asks about materials this audience mostly likes (BRIEF.md:48-50).

## 6. Cost

About 28 builder hours: types table in data.js 3, six bilingual screens 10, withPrior and tests 3, result and share page 6, tuning on synthetic answers 6. Engine change: yes, one added function. Golden fixture: not changed (regenerate to confirm a zero diff); new tests go beside it.
