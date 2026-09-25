# Part 4 tag audit: summary

## Counts

- 70 entries. Reviewed in the Guide: 3 (Santal Royal, Tonka Impériale, Twilly d'Hermès). Named in the Chemistry book: 3 (Ambre Sultan, Ambre Nuit, Bois d'Argent). In neither book: 64, including every Arab-house entry that is not a clone.
- 13 clones copy an original that one of the books covers (7 Aventus, 3 Baccarat Rouge 540, Grand Soir, Oud Satin Mood, Y Eau de Parfum). They inherit that evidence; their own `found_in_*` fields stay false.
- Coromandel and Sycomore are mentioned in the Guide without a review.
- 18 entries have proposed changes (36 in total: 6 high, 19 medium, 11 low confidence). 6 entries have at least one high-confidence change: Bois d'Argent, Twilly, Jean Lowe Immortel, and the three Baccarat Rouge 540 clones (Ana Abiyedh Rouge, Amber Oud Ruby, Barakkat Rouge 540).

## Ten most consequential corrections

1. Baccarat Rouge 540 clones (3 entries), heart `vanilla_gourmand` 0 to 0.5, high: "sweetened by an outrageous amount of ca. 3% of ethyl maltol" (Chemistry).
2. Bois d'Argent, drydown `woody_amber` 0 to 0.7, high: "previously unimaginable levels of 13.6% of 8.127" (Chemistry; 8.127 is Ambrox).
3. Jean Lowe Immortel, drydown `woody_amber` 0 to 0.8, high: "using a huge dose of some vile woody-amber material" (Guide, on Grand Soir).
4. Barakkat Satin Oud, `oud_smoky` heart 0.7 to 0.3 and drydown 0.6 to 0.3, medium: "was there supposed to be oud?" (Guide, on Oud Satin Mood).
5. Twilly, drydown `tonka_coumarin` 0 to 0.5, high: "sweet notes of hay" (Guide; the review calls it a fougère).
6. Baccarat Rouge 540 clones (3 entries), heart `fruity_sweet` 0 to 0.4 and drydown `vanilla_gourmand` 0 to 0.4, medium: "count on this oriental being a fruity, syrupy experience" (Guide).
7. Santal Royal, heart `sandalwood_creamy` 0.7 to 0.4, medium: "not sandalwood" (Guide, heading of the review).
8. Santal Royal, heart `oud_smoky` 0 to 0.5, medium: "equal parts of Cool Water and any one of the lamentable so-called ouds" (Guide).
9. Tonka Impériale, drydown `tobacco_honey` 0 to 0.5, medium: "it ends up merely like a not very interesting pipe tobacco" (Guide).
10. Bois d'Argent, drydown `patchouli` 0 to 0.4, medium: "orris-honey-patchouli-incense theme" (Chemistry).

The same evidence applies to four originals outside Part 4, which carry the same gaps: `br540` (no sugar or fruit), `grandsoir` (`woody_amber` only 0.3), `oudsatinmood` (oud at 0.7 and 0.6), and `aventus` (no spice).

## Where the sources contradict the pyramid

- **Santal Royal.** The pyramid centres on sandalwood. The Guide finds only a synthetic sandalwood molecule and describes the scent as Cool Water mixed with a Western-style oud.
- **Bois d'Argent.** The pyramid lists neither ambroxan nor patchouli. The Chemistry book reports 13.6% Ambrox and names patchouli as one of four themes. It also calls the scent "subtle and gentle", which does not fit that Ambrox dose, and it uses two labels ("Bois d'Argent" and "Bois d'Argent Cologne"). The two figures may describe different editions.
- **Baccarat Rouge 540 clones.** The pyramid (saffron, jasmine, amberwood, ambergris, fir resin, cedar) leaves out the two materials the Chemistry book highlights: ethyl maltol (sugar) and Evernyl (synthetic oakmoss, about 12%). The proposed `oakmoss_chypre` is low confidence because the Guide describes a sweet, fruity scent and never mentions moss.
- **Barakkat Satin Oud.** The pyramid lists oud in both the heart and the base. The Guide could find no oud in the original and describes an almond biscuit and a fruity rose instead. A clone may contain more oud than the original, so check a sample if possible.
- **Jean Lowe Immortel.** The pyramid is entirely resinous amber (labdanum, benzoin, tonka, vanilla, cistus). The Guide says the original's main feature is a large dose of woody-amber material.
- **Twilly d'Hermès.** The three-note pyramid (ginger, tuberose, sandalwood) leaves out the hay and coumarin that the Guide treats as central.
- **Aventus clones (7 entries), low confidence.** The pyramid has no spice, but the Guide notes a "warm, spicy aura". Keep or drop all seven together.

## Clone tags that do not match their originals

- All 7 Aventus clones lack the original's opening `leather_smoky` 0.4. L'Aventure also has no `oakmoss_chypre` (its pyramid omits oakmoss) and moves patchouli from the heart to the drydown.
- Amber Oud Ruby and Barakkat Rouge 540 lack the original's heart `amber_resin` 0.4 and drydown `white_musk` 0.3. Ana Abiyedh Rouge matches.
- Kismet Angel has no heart `spicy_warm` (Angels' Share 0.7) and no drydown `amber_resin` (0.4).
- Amber Oud Gold has no opening `fruity_sweet` (Erba Pura 0.6) and half the original's heart fruit (0.5 vs 1.0). This follows its own pyramid, not the original's.
- Jean Lowe Immortel lacks Grand Soir's drydown `woody_amber` 0.3.
