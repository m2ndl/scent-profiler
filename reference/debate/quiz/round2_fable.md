# Round 2, Fable

## The strongest objection, answered

The objection: negative-only stated input cannot rank picks. C (round1_C.md, evidence 3) and D (round1_D.md, evidence 4) both show that told complaints alone return three bottles scoring below zero, and B (round1_B.md, rivals D) adds that a chip without a bottle cannot tell vanilla from tonka. I re-ran it through tools/lib/site.js: "too sweet" alone and "heavy plus smoky" both return H24, Afternoon Swim and Glacier Bold, so my zero-bottle "three to try" was not a function of the answer. I concede. At zero bottles the output is the stated deal-breakers and the three isolating samples, with no ranked picks, as D proposed; ranked picks appear once one bottle is worn. The stated layer itself stands: it is score-only, never enters the per-perfume count, and its weights are testable against chips attached to bottles.

Two rival numbers changed my design. A's verdict scale (round1_A.md:8, "still wear it = drydown +1") reproduces exactly: with Sauvage EDP -2 and Khamrah +1, woody amber becomes badPossible (-1.00) without any chip, and the picks are Tonka Impériale, Angels' Share and Arabians Tonka, none carrying woody amber. My +2 for "still wear" borrowed the site's "love" rating, and it let Jean Lowe Immortel (woody amber 0.8) rank first; a verdict is weaker evidence than a love rating, so I adopt +1. D's evidence 3 also reproduces: a chip at -1.5 on a -2 verdict lifts vanilla from -2.00 to -1.80, so chips on a stopped bottle slightly weaken their own families; D's fix (-2.5) touches 46 fixtures, and a cheaper one is to clamp the chip value to the stage rating.

One rival number did not reproduce. B's evidence 1 says a stated "woody ambers worst" (score -0.84, badPossible, out of n) leaves no pick carrying woody amber; under that rule Jean Lowe Immortel still ranks first at 4.69, because Khamrah at +2 supplies the reward. B's result needs A's +1, which B does not state.

What survives: verdicts on worn bottles are the only instrument with validated inputs (Engen's five-to-one unfamiliarity effect, round1_fable.md item 3; Rashid's popularity result, cited by A, D and me); the complaint chip is what turns a verdict into a family; the stated layer is a labelled fallback, not a profile.

## Borda vote

1. A: the verdict on a worn bottle is the one judgment people make reliably, A's grid separates 88 of 90 family pairs, and its +1 mapping fixes the case that broke mine.
2. D: the complaint chip is the missing half of every negative verdict, its engine reading (chip mean, present-family filter) is the sharpest in the round, and its zero-bottle honesty is right.
3. B: the score-only stated layer is the correct mechanism and its falsifiers are concrete, but its instrument measures familiarity and adjectives, and its key engine claim did not reproduce.
4. C: its own clustering finds no natural number of types (silhouette 0.27 to 0.30), 25 well-known hybrids fit no pool, and lifestyle answers have no shown link to material tolerance.
