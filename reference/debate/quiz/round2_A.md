# Round 2, path A: landmarks first

## The strongest objection

Every rival makes it: with zero bottles A gives no profile, which the owner asked for (round1_B.md:56, round1_C.md:47, round1_D.md:53, round1_fable.md:43). The second objection is that one verdict cannot say which family failed.

## Answer

What would fill a zero-bottle profile? I re-ran the rivals' inputs through tools/lib/site.js. A profile made only of stated dislikes returns H24, Afternoon Swim and Glacier Bold, for "too sweet" alone and for "heavy" plus "smoky"; empty ratings return H24, Afternoon Swim and Qaed Al Fursan. So C's negative input (round1_C.md:15), Fable's zero-bottle picks (round1_fable.md:31) and any told-dislike list give the no-data list with one bottle changed. D reached the same result and gives no picks (round1_D.md:7). Only a stated like produces distinct picks: B's oud answer gave Shaghaf Oud, Black Aoud and Barakkat Satin Oud in my run. That profile rests on words, and unfamiliar odours are disliked five times as often as liked (engen_odor_sensation_memory_1991.txt:868-871). The best evidence for B is Gilbert: a written description lets readers "accurately imagine a smell's intensity and character" (gilbert_what_the_nose_knows_2008.txt:1031). That is imagery, not tolerance on skin after six hours.

D and Fable changed my view on one point: the zero-bottle page should use the visitor's own answer. A therefore adds Fable's single forced complaint (round1_fable.md:28). The page shows it as a told possible dislike that never excludes and never ranks picks, and uses it to choose which starter tester comes first. A also adds Fable's "stopped: another reason" option (round1_fable.md:26), which writes no rating.

On co-occurrence, the "mixed" result of -0.67 (round1_B.md:15, round1_fable.md:14) holds only when "still wear" counts +2. A counts it +1, which gives "possible" at -1.00 and three picks with no woody amber (re-run). D is right that a chip on a -2 verdict weakens its own families (round1_D.md:23). I confirmed it: Khamrah at -2 with "too sweet" gives vanilla -1.80 and woody amber -2.00. A fixes this on the page. A stopped bottle is -2 without a complaint and -1 with one, so the chipped families score lowest: vanilla -1.20, woody amber -1.00. For Sauvage "sharp" with Khamrah still worn, woody amber is -0.71 and the picks are Tonka Impériale, Vanilla 28 and Angels' Share. Engine change: none. Golden fixture: untouched.

## Borda vote

1. **A.** Starting with bottles gives the unchanged engine evidence from what people wore, and the two additions above give the zero-bottle visitor their own answer back without inventing picks.
2. **D.** Its chip analysis corrected a real fault in A and its zero-bottle output matches mine, but it asks for told complaints before bottles, and its anosmia flag removes 35 or 36 perfumes on a self-report (re-run).
3. **B.** It is the only rival that gives a zero-bottle visitor distinct picks and never excludes, but it ranks descriptions, and labels shift the pleasantness of identical odours (Herz and von Clef, Perception 2001).
4. **C.** Its own clustering finds no natural number of types (silhouette 0.27 to 0.30, round1_C.md:13), and no evidence links lifestyle answers to which materials a person tolerates.
