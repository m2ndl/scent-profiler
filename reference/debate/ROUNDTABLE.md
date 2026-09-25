# Round table record: the source of truth for material families

## 1. The question

The profiler needs the material families in each perfume, by stage and strength, and nobody publishes them. The debate asked which source should decide those tags: a provenance stack (A), a vendor and crowd feed (B), material evidence only (C), or families inferred from ratings (D). The constraints were one builder, tens of dollars a month, Arabic and English, launch within weeks, and no Fragrantica scraping (BRIEF.md:39-42).

## 2. Tally

| Participant | 1st | 2nd | 3rd | 4th |
|---|---|---|---|---|
| A (provenance stack) | A | B | D | C |
| B (vendor and crowd) | A | B | D | C |
| C (materials first) | A | C | B | D |
| D (data first) | A | B | D | C |
| Fable (no path) | A | B | C | D |

Borda totals: A 15, B 9, C 3, D 3.

A won with all five first places, the maximum possible. B came second; C and D tied for last. Three advocates ranked their own path below first: B and C placed themselves second, D third. Only A ranked itself first. Fable had no assigned path and had argued for a version of A.

## 3. Evidence that moved the room

- **Parfums de Marly label test** (C, round1_C.md:15; parfums-de-marly.com/products/): Iso E Super is declared among the first two fragrance materials on 11 of 12 official lists and absent from Kalan; 8 of 12 entries miss a declared family or carry one the label rules out. Rechecked by A (round2_A.md:10) and B (round2_B.md:5).
- **Regulation 2023/1545 additions** (BRIEF.md:26-32; cosmeservice.com): Iso E Super, Galaxolide, acetyl cedrene, santalol, patchouli oil and vanillin become declarable; Ambroxan, Cashmeran, Evernyl and ethyl maltol do not (A, round1_A.md:14, via alsglobal.com and safetymakeup.de). 13 of 28 families have no declarable marker (C, round1_C.md:9).
- **Baccarat Rouge 540 label** (A, round1_A.md:19, franciskurkdjian.com, code 2FROUGE540MFK3; C, round1_C.md:19): it names none of the Ambroxan, Evernyl or ethyl maltol in scent_and_chemistry_2022.txt:6216. Fable conceded on it (round2_fable.md:13).
- **Mapper reproduces 8 of 69 corrections** (B, round1_B.md:13): cited by all five in round 2.
- **Label value on past corrections** (A's inference, round1_A.md:22): labels would have clearly flagged about 10 of 46 literature-driven changes. Cited by B (round2_B.md:9) and Fable (round2_fable.md:11).
- **120-rater threshold** (D, round1_D.md:8, 25; simulation not deposited): power 0.82 for a 1.5-point drydown drop among 15 percent of raters; about 18 perfumes reach 120 raters at 2,000 people. Adopted by A (round2_A.md:14).
- **Galaxolide anosmia share** (A, round1_A.md:43; B, round1_B.md:46; scent_and_chemistry_2022.txt:1992): about 30 to 37 percent. D conceded it (round2_D.md:9).
- **Fragella caching term** (B, round1_B.md:19; api.fragella.com/terms-of-use.html): it forbids caching large portions, yet apps-script.gs (lines 111 to 146) stores every payload. Adopted by A (round2_A.md:16).
- **Identical Lattafa lists** (C, round2_C.md:13; oriental-style.de): one 22-allergen list for Yara, Khamrah and Asad. It was the first of three points C could not answer before dropping C as a standalone path.

## 4. Concessions

- **A.** Most entries, and nearly all Arab-house ones, rest on notes at launch, where A is "B plus a visible 'from the brand's notes' label"; the notes weight for the 13 undeclarable families cannot be calibrated. A accepted B's trace point and D's volatility point (round2_A.md:7, 13, 14).
- **B.** Pure B "ships errors that a label on the same product page would fix", and user flags cannot catch a family nobody named; the defensible form is B plus a label overlay (round2_B.md:7, 11).
- **C.** C cannot launch in weeks as a useful product for a Saudi user; some Arab-house lists are templates; labels will never show woody-amber or oud materials; the material table needs expert judgment. C's evidence belongs at the top of A (round2_C.md:11-17).
- **D.** D gives users nothing in year one that A does not; anosmia is larger than D assumed; ratings cannot separate co-occurring materials. D becomes A's review threshold (round2_D.md:5-13).
- **Fable.** Labels cannot see woody ambers, so that family rests on notes plus literature; D is right that only ratings observe the drydown on skin (round2_fable.md:13).

## 5. The path as amended

1. Vendor notes are the floor: Fragella notes and accords through mapper.js for every perfume typed; no FragDB (Fable, round1_fable.md:4; B, round2_B.md:11; A, round1_A.md:39).
2. Accord floors apply only to Dominant or Prominent accords (B, round1_B.md:33).
3. Each tag records one of three source ranks: notes, ingredient list, literature or formula. Higher overrides lower for the same family and stage (A, round1_A.md:5), with C's evidence as the top rank (C, round2_C.md:17).
4. A label adds or confirms a family. It lowers one by absence only on a post-July-2026 list and only where the family's usual materials are all declarable, as for tonka_coumarin (A, round1_A.md:5).
5. A declared material sets a weight only before water or among the first few fragrance materials; otherwise it records presence only (C, round1_C.md:37; A, round2_A.md:13).
6. Labels carry date, market and list code (A, round1_A.md:28; C, round1_C.md:5).
7. Lists that declare nearly every permitted allergen, the pattern C found repeated across three perfumes, are rejected (C, round2_C.md:13).
8. Lists are entered by hand, including users' pasted or photographed boxes (Fable, round1_fable.md:32; A, round1_A.md:17; C, round2_C.md:7).
9. Users see each family's source in both languages (A, round1_A.md:5; Fable, round2_fable.md:9).
10. Notes-only families weigh less than label-backed ones, through a third value of the existing confidence multiplier (Fable, round2_fable.md:9). For marker families, the share of mapper tags that labels confirm or rule out sets the notes weight (A, round2_A.md:11).
11. Every woody-amber verdict states that it rests on notes plus literature only (Fable, round2_fable.md:13).
12. Ratings never write tags. A contradiction enters the review queue (A, round1_A.md:5) at about 120 raters for a 1.5-point drydown drop, or 200 for a 1-point drop (D, round2_D.md:13). Ratings are also the held-out test for every layer (Fable, round2_fable.md:13).
13. Stage assignment from volatility classes is a rule under test against stage ratings (A, round2_A.md:14, after D).
14. The backend stores derived weights and the Fragella id, not raw payloads (B, round1_B.md:19; A, round2_A.md:16).

## 6. Falsifiers and open questions

Tests that would end the case for the amended path or a part of it:

- Fewer than 100 of the 286 entries with a findable list by week 6: launch without the label rank (A, round1_A.md:33); Fable names B as the fallback (round2_fable.md:18).
- Label-derived tags contradict literature more often than notes-derived tags do (A, round1_A.md:34); or after six months labels change fewer than one tag in ten entries (round1_A.md:35).
- Label-based tags predict stage dislikes no better than note-based tags (C, round1_C.md:37).
- More than one in five rechecked perfumes changes its list within a year (C, round1_C.md:38).
- New-format labels rarely list Iso E Super or Galaxolide (Fable, round1_fable.md:20).
- Notes floor: the top drydown family is wrong on more than half of 30 Arab-house perfumes the owner has smelled, or under 70 percent of queries match in Fragella (B, round1_B.md:38).
- Review threshold: under 1,000 people by month 12, or priors plus data no better than priors alone on held-out dislikes (D, round1_D.md:33).

Questions nobody settled:

- Fragella's coverage of Arab houses; B could not test it (round1_B.md:36).
- How many of the 286 have findable lists; A estimated 150 to 200 (round1_A.md:7).
- The true share of musk anosmia: 6 to 9 percent (BRIEF.md:36) or about a third for Galaxolide (scent_and_chemistry_2022.txt:1992).
- How to weight notes for the 13 undeclarable families, woody_amber and oud among them (round2_A.md:7).
- How many positions "the first few fragrance materials" covers; nobody fixed a number.
- Whether Fragella would count stored derived tags as a breach (round1_B.md:35).
- How to treat a large dose nobody reports smelling, such as Evernyl in Baccarat Rouge 540 (round2_C.md:15).
- Whether boxes sold in Saudi Arabia carry full lists; A's SFDA source is secondary (round1_A.md:17).

## 7. Corrections to the record

- **Hexadecanolactone.** The BRIEF (line 28), Fable (round1_fable.md:10) and D (round1_D.md:37) call it Exaltolide; A calls it only "a macrocyclic musk" (round1_A.md:14), and B and C give no trade name. Nobody sourced the trade name, so it stands unconfirmed.
- **2026 and 2028.** The BRIEF ties 2026 to new products (line 24), and D says all products need the labels only from 2028 (round1_D.md:37). A, citing the European Commission, states that since 31 July 2026 non-compliant products may not be placed on the EU market and older stock may be sold until 31 July 2028 (round1_A.md:14). Fable expected labels to start naming these materials within 12 months (round1_fable.md:6); A found 21 new-format lists already in Open Beauty Facts (round1_A.md:16).
- **Musk receptor.** Fable links Galaxolide anosmia to OR4D6 (round1_fable.md:15); D's source judges OR4D6 unlikely to be a musk receptor and assigns polycyclic musks to OR5A2 (round1_D.md:18).
- **Anosmia share.** The BRIEF's 6 to 9 percent (line 36) conflicts with the book's 30 to 37 percent, cited by A, B and D (scent_and_chemistry_2022.txt:1992).
- **"One in three".** Fable's figure (round1_fable.md:14, 27) does not match the 40 of 68 it cites, about 59 percent; D calls it "most" (round1_D.md:13), and Fable's rebuttal uses 40 of 68 (round2_fable.md:5).
- **Counts and examples.** B counts 61 entries with direct book evidence; the BRIEF's 68 includes clones (round1_B.md:11). C noted that A's "citrus and jasmine" example ignores the book figures C would use for Baccarat Rouge 540 (round2_C.md:9).

Borda totals: A 15, B 9, C 3, D 3. One of the four advocates (A) ranked its own path first.
