# Round table record: how the quiz profiles a visitor with few or no perfumes

## 1. The question

The site profiles only visitors who remember perfumes they wore. The owner asked for a quiz that narrows a profile, asks about well-known bottles such as Sauvage, and still gives a profile and recommendations to a visitor who names no perfume. The debate asked what the quiz should ask, what it may honestly conclude, and how its output enters engine.js. The constraints were one builder, near-zero budget, static hosting, no accounts, both languages from day one, and a reviewed golden-fixture diff for any engine change (BRIEF.md:51-58).

## 2. Tally

| Participant | 1st | 2nd | 3rd | 4th |
|---|---|---|---|---|
| A (landmarks first) | A | D | B | C |
| B (stated preference) | A | B | D | C |
| C (archetype quiz) | A | B | C | D |
| D (experience anchors) | A | D | B | C |
| Fable (no path) | A | D | B | C |

Borda totals: A 20, B 12, D 12, C 6.

A won with all five first places, the maximum possible. B and D tied for second. Only A ranked itself first: B and D placed themselves second, C third. Fable had no assigned path and argued for A with two parts of D (round1_fable.md:5).

## 3. Evidence that moved the room

- **Asymmetric verdict scale** (A, round1_A.md:10): with still wear +1 and stopped -2, Sauvage EDP stopped and Khamrah kept make woody amber badPossible (-1.00) and no pick carries it; with +2 it is "mixed" (-0.67) and Jean Lowe Immortel (woody amber 0.8) ranks first. Adopted by B, C and Fable (round2_B.md:9; round2_C.md:7; round2_fable.md:7).
- **Told complaints alone give default picks** (C, round1_C.md:15; D, round1_D.md:24): "too sweet", and "heavy" plus "smoky", both return H24, Afternoon Swim and Glacier Bold, all below zero, like the no-answer list (round1_A.md:21). Rechecked by A, D and Fable, who conceded (round2_A.md:9; round2_D.md:9; round2_fable.md:5).
- **Chip defect** (D, round1_D.md:23): Khamrah stopped with "too sweet" gives vanilla -1.80 and woody amber -2.00. Confirmed by A and Fable (round2_A.md:13; round2_fable.md:7).
- **Bremner et al. 2003** (Fable, round1_fable.md:20): 16.3 percent putative androstenone non-detectors fell to an estimated 1.8 to 5.96 percent under forced choice. D withdrew its anosmia block on it (round2_D.md:11).
- **Five-to-one dislike of unfamiliar odours** (engen_odor_sensation_memory_1991.txt:868-871): cited by all five (round1_A.md:49; round1_fable.md:15; round2_B.md:5; round2_C.md:14; round2_D.md:21). With Klutky's adjective poles (jellinek_psychological_basis_1997.txt:10154-10157; round1_fable.md:17), it made B concede (round2_B.md:5).
- **Grid separates 88 of 90 family pairs** (A, round1_A.md:20): re-run by D and cited in the votes of D and Fable (round2_D.md:15, 19; round2_fable.md:15).
- **Types bundle co-occurring families** (round1_B.md:58; round1_A.md:51; round1_fable.md:47): C checked and accepted it (round2_C.md:5).
- **Also cited across briefs**: Gilbert on imagining a described smell, the best case for B (gilbert_what_the_nose_knows_2008.txt:1031; round2_A.md:9; round2_B.md:7); Rashid et al. 2002 on popular sign-up items (round1_A.md:14; round1_D.md:29); like-dislike as the one shared dimension (jellinek_psychological_basis_1997.txt:9879, in all five round-1 briefs); Herz and von Clef 2001 on labels (round1_A.md:49; round1_D.md:55); C's silhouette of 0.27 to 0.30 (round1_C.md:13; round2_A.md:20).

## 4. Concessions

- **A.** The zero-bottle page should return the visitor's answer, so A adds Fable's forced complaint and "stopped: another reason"; D's chip defect is real (round2_A.md:11, 13).
- **B.** As written, its descriptions measure words; its evidence item 1 needed the +2 scale (round2_B.md:5, 9).
- **C.** Every type rewards an untested deciding family, and lifestyle has no shown link to tolerance; withPrior is withdrawn and the type survives as a label (round2_C.md:5, 9).
- **D.** Bottle-free answers carry almost no information; D withdraws the anosmia block, the avoided-smells list and the "feel sick" mapping, and is not the main structure (round2_D.md:9, 11, 15).
- **Fable.** Its zero-bottle picks ignored the answer, so zero bottles get no ranked picks; it adopts +1 for "still wear" (round2_fable.md:5, 7).

## 5. The path as amended

1. Screen 1 is a grid of about twenty well-known bottles, "None of these" and a search (A, round1_A.md:23, 27).
2. Each tapped bottle gets one verdict, written as an ordinary rating: still wear = drydown +1; stopped because of the smell = drydown -2; only smelled it in a shop = opening -1. It also fills the existing `again` field and a `src: "quiz"` label (A, round1_A.md:10; adopted at round2_B.md:13, round2_C.md:7, round2_fable.md:7).
3. "Stopped: another reason" writes no rating (Fable, round1_fable.md:26; A, round2_A.md:11).
4. "When did it bother you?" moves a stopped rating to the opening or heart (A, round1_A.md:10, 29).
5. Each negative verdict takes complaint chips, which name the family that failed (Fable, round1_fable.md:27 and round2_fable.md:11; D, round2_D.md:13).
6. The chip defect: engine.js:103 adds every chip at -1.5, so on a -2 rating it raises its own families' scores (D, round1_D.md:23). A, D and Fable agree it is real (round2_A.md:13; round2_D.md:13; round2_fable.md:7); B and C did not address the defect. No fix was agreed. D sets the chip value to -2.5 (round1_D.md:14); Fable clamps it to the stage rating (round2_fable.md:7); A writes a stopped bottle as -1 instead of -2 when a complaint is attached (round2_A.md:13). The winning path uses A's page-side fix; the other two change engine.js and need a reviewed golden diff.
7. Narrowing: while a deal-breaker is only possible, the page shows grid bottles holding that family without the others seen, and skips settled families (A, round1_A.md:30). settleSuggestion() acts only on a family seen in one perfume (engine.js:162), so the page picks the follow-up (D, round1_D.md:42).
8. Zero bottles: no ranked picks (A, round1_A.md:33; D, round1_D.md:7; Fable, round2_fable.md:5), but three near-pure testers labelled with what a failure would show: Sauvage EDP (woody amber, 101 perfumes), Narciso Rodriguez For Her EDT (white musk, 97), Valentino Uomo Born in Roma (vanilla, 116) (A, round1_A.md:33; D, round1_D.md:40).
9. Every visitor answers one bottle-free forced complaint (Fable, round1_fable.md:28), shown as a told possible dislike that never excludes or ranks picks and sets which tester comes first (A, round2_A.md:11; D, round2_D.md:13).
10. Anosmia is one page-side question pointing to a musk sample; it removes nothing (D, round2_D.md:11; Fable, round1_fable.md:9; B, round2_B.md:15).
11. Each result line names its source, worn or told (Fable, round1_fable.md:31; D, round1_D.md:40; BRIEF.md:18-19).
12. Optional, proposed by C alone: a named type as a bilingual label and share card for the top of the profile, from a table in data.js (round2_C.md:9).

Engine change: none, and the golden fixture is untouched, given A's fix in item 6 (round2_A.md:13).

## 6. Falsifiers and open questions

Tests that would end the case for the amended path or a part of it, within three months:

- Over half of Saudi starters tap no bottle; under half of two-bottle visitors reach a deal-breaker class; later stage ratings contradict the verdict's sign over a quarter of the time; under 10 percent of zero-bottle visitors return with a tester verdict (A, round1_A.md:45).
- Median taps below two; "another reason" under 10 percent of stops; completion under 50 percent; anosmia "yes" over 25 percent; under 60 percent of "too sweet" bottles hold vanilla or tonka at 0.4 in the drydown (Fable, round1_fable.md:38-39).
- Median visitor ticks four or more family chips; over 60 percent answer "often" on anosmia; told families score no lower than others among 200 later raters; under 5 percent open a starter-set link (D, round1_D.md:46-49).
- If B's screens are added: stated bottom four matches a rated deal-breaker under 40 percent of the time, retakes repeat the worst under half the time, or the first option is picked worst over 35 percent (B, round1_B.md:52).
- If C's label is used: over 40 percent of week-apart retakes change type, or one type exceeds 40 percent (C, round1_C.md:43).

Questions nobody settled:

- Which chip fix to use (item 6).
- Whether told answers stay on the page (round2_A.md:11; round2_D.md:13) or enter computeProfile as a score-only layer (round1_B.md:9; round2_B.md:14; round2_fable.md:5).
- How to separate tonka and white florals from vanilla, which no grid bottle does (round1_A.md:41); B offers its screens (round2_B.md:9).
- Whether recommend() needs a cap on badPossible families at 0.7 drydown (round1_fable.md:37).
- Tester availability at Saudi counters, flankers, clones, counterfeits and anosmic false likes (round1_A.md:33, 42-43); quiz length and builder hours are UNCHECKED estimates.

## 7. Corrections to the record

Engine numbers, re-run through tools/lib/site.js with the evidence layers:

- **VERIFIED.** Every engine number in sections 3 and 5, and those at round1_A.md:7-8, round1_D.md:15, 22, 24 and 42, round1_fable.md:14 and round2_D.md:15.
- **VERIFIED, with a note.** A's fix gives vanilla -1.20, woody amber -1.00, and -0.71 with Tonka Impériale, Vanilla 28 and Angels' Share (round2_A.md:13); -0.71 is 0.01 from the line between badPossible and "mixed" (engine.js:115-117).
- **REFUTED.** A stated "woody ambers worst" leaves no pick carrying woody amber (round1_B.md:15). Under B's rule it is badPossible at -0.84, but Jean Lowe Immortel still ranks first at 4.69, as Fable reported (round2_fable.md:9); the claim holds only with +1.
- **REFUTED.** D's -2.5 alters "the 46 that carry chips" (round1_D.md:61; repeated at round2_C.md:16, round2_fable.md:7). 46 of 60 scenarios carry chips, but a chip applies in 29, and 29 change. Fable's clamp, read as the lower of -1.5 and the rating, changes 11.
- **VERIFIED, both.** A's 58 of 73 citrus or aquatic openings (round1_A.md:51), which C could not reproduce (round2_C.md:5), holds at opening weight 0.7 or more; C's 66 of 96 holds by leading opening family.
- The BRIEF's exclusion counts are from raw tags (BRIEF.md:29-34); with evidence layers cedar rises to 34 (round1_B.md:7, VERIFIED).
- **UNCHECKED**, not deposited: B's simulations (round1_B.md:16-17), C's clustering (round1_C.md:13), A's count of 201 reviews (round1_A.md:17). B's zero-bottle picks (round1_B.md:41) differ by one bottle from A's re-run (round2_A.md:9); B's inputs are incomplete.

Books, files and web:

- **VERIFIED at the cited lines**, each saying what its citer says: every book line cited in the briefs (13 Engen passages, 7 Jellinek, 6 Gilbert, 3 Barkai and Wilson, 4 Scent and Chemistry, 3 Calkin and Jellinek, 3 McGee, 4 Perfumes: The Guide); engine.js 90, 102, 103, 116, 132; data.js:28; app.js:403; reference/audit/jellinek_axes.md, section (b), point 5.
- **Anosmia share.** scent_and_chemistry_2022.txt:1992 has androstenone smelled by 70.5 percent of women and 62.8 percent of men, and "a similar number" of Galaxolide anosmias; D's reading that such single tests overstate it (round2_D.md:11) is an inference.
- **Web, VERIFIED:** Rashid et al. 2002 (full text: 1.9 pages for Popularity against 7.0 for Classique; pure entropy "unusable"); Bremner et al. 2003 (PubMed abstract); Herz and von Clef 2001 (abstract; patchouli among five odours); RevenueHunt 2026 (69 percent completion; the fragrance 6.9 percent UNCHECKED). All other web sources: UNCHECKED, not fetched.
- **"Another reason".** Fable first scored it +1 (round1_fable.md:7); A adopted it as writing no rating (round2_A.md:11).

Borda totals: A 20, B 12, D 12, C 6. One of the four advocates (A) ranked its own path first.
