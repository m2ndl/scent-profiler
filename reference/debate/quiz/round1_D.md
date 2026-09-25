# Round 1, path D: experience anchors

## 1. The claim

The quiz asks what has already gone wrong, because failures are the perfume memories people keep. Five screens, about 70 seconds (estimate, UNCHECKED), ending on 16 landmark bottles with one verdict each.

**Zero bottles:** possible deal-breakers marked "from what you told us", plus a starter set of up to three near-pure samples, each labelled with what a failure would prove. No ranked picks: told answers alone produce arbitrary ones (evidence 4).

**Three bottles:** the existing profile and picks, with told answers as one weak extra source.

**Entry into engine.js:**
- Verdicts are ratings: still wear it = drydown +1; stopped wearing it = drydown −2 with its chips; tried, never bought = opening −1.
- All told answers form one pseudo-entry in `state.auto`: drydown = the highest chip weight per family, rated −1. `computeProfile()` already weighs auto entries at half (engine.js:90). Change 1 (line 116): this entry never counts toward "two or more perfumes".
- Change 2 (line 103): chip value −1.5 becomes −2.5, so a chip marks the failing family inside a bottle (evidence 3).
- An anosmia flag tied to a named bottle drops perfumes whose top drydown family matches that bottle's, at 0.7 or more (36 white musk, 35 woody amber), by adding their ids to the ratings copy that `recommend()` skips (line 132).

## 2. Evidence

Items 1 to 4: computed via tools/lib/site.js.

1. A chip counts only on families present at 0.2 or more in the rated bottle (engine.js:102). A told "sharp / chemical" puts weight 0.338 on woody amber at −1, about 15% of the negative mass of a stopped Sauvage EDP with that chip.
2. Separate entries per chip make white musk a likely deal-breaker from zero bottles (soapy plus powdery). Told "chemical" plus one stopped Sauvage EDP makes woody amber likely, removing 101 perfumes.
3. Today a chip on a −2 verdict weakens its own families, because −1.5 pulls the mean up. Khamrah stopped, "too sweet": vanilla −1.80, woody amber −2.00; without the chip, both −2.00.
4. Told "too sweet" and "chemical" alone yield Gucci Bloom, Montale Roses Musk and Initio Oud for Greatness, all scoring below zero.
5. About 30 to 37 percent cannot smell Galaxolide; specific anosmias occur in "musks, ambery odorants, sandalwood materials" (scent_and_chemistry_2022.txt:1992). People miss even total loss: 3.4% of 8,348 people reporting normal smell scored functionally anosmic ("Whose nose does not know?", 2019, European Archives of Oto-Rhino-Laryngology; fetched). So one question asks what others noticed; specific anosmias explain "merely a fraction of the total variation" (gilbert_what_the_nose_knows_2008.txt:1759).
6. Woody ambers are mainly a dislike. Of 91 Japanese participants, 17.6% carried two non-functional OR7A17 alleles; they still detected (−)-Ambroxide but found it less pleasant ("An odorant receptor for a key odor constituent of ambergris", 2025, Communications Biology; fetched). The chemical chip captures this.
7. People share the verdict, not the words: Berglund et al. found "only one common dimension, like-dislike, for 20 odors" (jellinek_psychological_basis_1997.txt:9879). The Guide calls a marine, an aldehydic floral and a rose "soapy" (perfumes_the_guide_2018.txt:2140, 4980, 5031). "Sweet" as an odour word is learned by pairing odours with sugar (gilbert_what_the_nose_knows_2008.txt:736). Chips work at that level; a bottle resolves them to families.
8. "A long-term odor memory can be established with only one exposure" (engen_odor_sensation_memory_1991.txt:558); aversions persist (line 3374). Later studies found real forgetting ("A review on the neural bases of episodic odor memory", 2014, Frontiers in Behavioral Neuroscience; fetched), and flies forget aversive odours gradually (barkai_wilson_odor_memory_perception_2014.txt:2088). Against: 2,854 German partners predicted food likes better than dislikes ("Accuracy of food preference predictions in couples", 2019, Appetite).
9. In MovieLens sign-up, choosing the most informative items was "unusable"; popularity needed 1.9 pages of ten ("Getting to know you", IUI 2002; PDF read). So the grid holds bestsellers; diagnostic samples go in the starter set.
10. Parfumado's quiz (walked through) asks scent type, colours, "Which scents make you feel good?", outfits, reason and brands; Scentbird's learns dislikes only from later ratings (scentbird.com; fetched). Neither asks what failed.

## 3. Worked example

1. "Has a perfume ever gone wrong on you? Tick everything that happened." Too sweet; powdery; sharp or chemical after an hour; soapy; heavy, or gave me a headache; smoky; dirty; sour; far too loud; gone within an hour; never.
2. Per tick, up to three: "Do you remember which perfume?" Search, bottle images, "I don't remember".
3. "Has someone smelled your perfume hours later when you could barely smell it yourself?" Often (which perfume?), once or twice, never, not sure.
4. "Which of these do you avoid in daily life?" Cake shops; laundry and fabric softener; smoke; farmyards; none. Each maps to an existing chip: musks scent laundry (mcgee_nose_dive_2020.txt:31247), and vanillin is "not unlike coumarin" (line 11067).
5. "Tap the perfumes you have worn": still wear it, stopped wearing it (why?), tried but never bought.

**Worn nothing** (too sweet, sharp or chemical; anosmia "not sure"): "Possible deal-breakers, from what you told us: vanilla, tonka, sweet fruit, woody ambers. Try first: Dior Sauvage EDP (woody amber 1.0: sharp after an hour confirms it); Valentino Uomo Born in Roma (vanilla 0.9: a too-sweet base confirms it); Replica Lazy Sunday Morning (white musk only: if a friend smells it when you cannot, read the musk article)."

**Stopped Sauvage EDP (sharp or chemical), still wears Khamrah:** "Woody ambers: possible deal-breaker; Khamrah contains some and you still wear it. Tonka and resinous amber: possible likes. Try Guerlain Tonka Impériale, By Kilian Angels' Share, Montale Arabians Tonka." Engine output; with Khamrah at +2 the first pick carries woody amber 0.8. `settleSuggestion()` returns nothing, so the page names Not a Perfume (woody amber alone).

## 4. Failure modes and falsifiers

- Visitors tick most chips. Falsified if the median visitor ticks four or more family-mapped chips.
- The anosmia question measures adaptation, fast for musks and ambery odorants (scent_and_chemistry_2022.txt:1994), or desert climate (perfumes_the_guide_2018.txt:338); and perfumers who cannot smell a musk alone still notice it in a blend (calkin_jellinek_perfumery_practice_principles_1994.txt:314). Falsified if over 60% answer "often".
- Told answers do not predict. Falsified if, among 200 or more visitors who later rate bottles, told families score no lower than other families.
- Under 5% of zero-bottle visitors open a starter-set link.

## 5. Rivals' weakest points

**A.** Zero bottles get nothing, which the owner rejected, and a bare "stopped wearing" cannot say which family failed: Khamrah stopped makes four families possible at −2.00 (computed).

**B.** It ranks descriptions of materials a third may not perceive (Galaxolide) or perceive differently by genotype (OR7A17). Positive or negative labels changed how the same odours were perceived ("The influence of verbal labeling on the perception of odors", 2001, Perception). Forcing a "worst of four" among materials this audience likes creates a dislike.

**C.** Colours, outfits and vibe have no shown link to family dislikes, and perfumers find it hard to know what "fresh" means to consumers (calkin_jellinek_perfumery_practice_principles_1994.txt:5607). A type prior rewards families the visitor may reject, and `recommend()` ranks them up.

## 6. Cost

About 25 builder hours (UNCHECKED estimate). Engine change: yes, two lines. Golden fixture: yes; change 1 leaves the 60 scenarios unchanged, change 2 alters the 46 that carry chips and needs a reviewed diff.
