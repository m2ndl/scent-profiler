@@@OLD
| `site/js/engine.js` | Profile engine: evidence merge, profile, recommendations, the one-sample suggestion. No page code, so tests and tools run the same engine under Node. |
@@@NEW
| `site/js/engine.js` | Profile engine: evidence merge, profile, recommendations, the one-sample suggestion. No page code, so tests and tools run the same engine under Node. |
| `site/js/notes.js` | Note questions shared by both pages: which of a perfume's families to ask a wearer about, in which stage and with which of its listed note words, and the quiz's word answers turned into the engine's told items. No page, storage or language. |
@@@END
@@@OLD
| `site/js/quiz.js` | The quiz page: grid, verdicts, narrowing round, told answers, result. Writes ordinary ratings into the profiler's device store; storage, sending and lookups work as in app.js. |
@@@NEW
| `site/js/quiz.js` | The quiz page: grid, verdicts, note rows, narrowing round, note picker, taste and complaints, Back, result. Writes ordinary ratings into the profiler's device store; storage, sending and lookups work as in app.js. |
@@@END
@@@OLD
- `quiz.test.js`: the quiz page in the stub browser: the grid, verdicts written as ratings, the narrowing round, told and anosmia answers, testers, what is sent to a backend, and the profiler reading the quiz's ratings and `?add=`.
@@@NEW
- `quiz.test.js`: the quiz page in the stub browser: the grid, verdicts written as ratings, the note rows, the narrowing round, the note picker, taste, complaints and anosmia answers, Back, the result and testers, the events and ratings sent to a backend, and the profiler reading the quiz's ratings and `?add=`.
- `notes.test.js`: the note rows (cap, order, shop limit, tie rule, note words and their Arabic) and the told items built from the quiz's answers.
- `page.test.js` also loads the quiz first: with the same device storage both pages give the same picks, and the profiler's "Rate its notes" block writes `noteAnswers`.
@@@END
@@@OLD
| I stopped wearing it: it turned on me | −2 on the stage named by "When did it bother you?" (first minutes: opening; first hours: heart; hours later or on clothes: drydown, the default) | 0 | optional, on that stage |
| I stopped for another reason | nothing | | |
| I tried it in a shop and it put me off | opening −1 | null | optional, on opening |
@@@NEW
| I stopped wearing it: it turned on me | −2 on the stage named by "When did it bother you?" (first minutes: opening; first hours: heart; hours later or on clothes: drydown, the default; "I don't remember" keeps the drydown) | 0 | optional, on that stage |
| I stopped for another reason | nothing | | |
| I tried it in a shop and it put me off | opening −1 | null | optional, on opening |
| I don't remember how it ended | nothing | | |

The screens come in four parts, named on a top line ("Part 1 of 4 · Your bottles"): your bottles (grid, verdicts,
note rows, narrowing), notes you know (the note picker), sweet or bitter, and what bothers you (complaints and
anosmia). Every screen but the first has a Back button. It restores a snapshot of the screen before (the bottle
queue and position, the round, the narrowing list, the picker screen and "skip notes for the other bottles"), so
round two, narrowing and skip-all go back correctly; answers already given stay.

After "still", "turned" or "shop" comes one screen of the bottle's note rows, from `PP_NOTES.questions(P, kind)` in
`site/js/notes.js` (kind "worn" for still and turned, "shop" for a shop trial). Each row is a family the perfume
holds at 0.4 or more, asked in its strongest stage: at most one opening, two heart and three drydown rows, five in
all; a shop trial gets opening and heart rows only, two at most. A row shows the stage in plain words (first
minutes, first hours, hours later), the perfume's own note words for that family in the page language, and the
family name, for example "First hours · cardamom, pepper · Fresh spices". A row whose family matches no word on the
note list reads "not on its note list", with a hint that some materials are in a perfume without being listed.
The answers run from "Hated it" to "Loved it" (−2 to +2) with "Didn't notice it" set apart, and an answered row
collapses to its answer. They go into the bottle's rating record as `noteAnswers: { family: -2..2 }` and
`unnoticed: [family]`, and the record is sent again. The intro line names the bottle and its number of rows; every
row is optional and Next always works; "Skip the notes for this bottle" is on every note screen, and from the
second bottle on "Skip notes for the other bottles" ends note screens for the visit. The profiler's rated cards
carry the same rows (kind "worn") in a collapsible "Rate its notes" block, which keeps a quiz record's `src`
because its stage ratings do not change.
@@@END
@@@OLD
answered "another reason". The visitor may answer them or skip.
@@@NEW
answered "another reason". The visitor may answer them, with the same verdict and note screens, or skip with
"None of these, or I don't know them".
@@@END
@@@OLD
Everyone then answers two told questions: the complaint that has bothered them most (a chip id or "none")
and whether people call a perfume strong on them when they can barely smell it (yes, no, not sure). Both
are kept in `pp_quiz_v1` and shown on the result as "you told us". They never enter computeProfile and
never exclude or rank a perfume: the complaint orders the testers below, and yes or not sure adds a note
naming the white-musk tester and its sample link.

The result lists the profile's families with the bottles each rests on and, from two rated bottles, the
three recommendations. A visitor with no rated bottle gets three testers instead (`QUIZ.testers`: the
tested family at 0.8 or more in the drydown, no other family at 0.4 or more, designer tier), each with the
number of other catalogue perfumes that carry its family in the base; the tester whose family weighs most
in the told chip's family map comes first. "Rate it when you have worn it" opens `index.html?add=<id>`,
which adds that perfume on the profiler (retrying once the lazy catalogue loads, for looked-up ids) and
then removes the parameter from the address.
@@@NEW
Everyone then answers the told questions, answers in words kept in `pp_quiz_v1`:
- **Note picker** (part 2): four screens of single notes (`QUIZ.notePicker`: fresh and green; flowers and fruit;
  spices and sweets; woods, resins and musks). Each card offers "I enjoy it", "I avoid it" and "Not sure" (the
  default), with a one-line hint on less familiar notes. A card is hidden when its word was on a bottle row the
  visitor answered, and a screen with no card left is skipped. Stored as `notes: { noteId: 1 | -1 }`.
- **Sweet or bitter** (part 3): bitter and fresh, sweet, both, or I don't know; stored as `taste`. "Bitter" adds +1
  to the bitter side of `QUIZ.taste` and −1 to the sweet side, each scaled by its weight; "sweet" does the reverse;
  the other two add nothing.
- **Complaints** (part 4): any number of six chips, or "Nothing has bothered me" or "I don't know", each of which
  clears the others. Stored as `told: [chipId]`, with `toldNone` for "Nothing has bothered me"; an older string
  value is read as a one-item list, and "none" as `toldNone`.
- **Anosmia** (part 4): whether people call a perfume strong on them when they can barely smell it (yes, no, not
  sure); stored as `anosmia`.

Both pages turn these answers into the same told items (`PP_NOTES.toldItems`) and pass them to computeProfile
(see How the profile is computed): they can reorder the picks but never set a class or exclude a perfume. The
complaints also order the testers, and anosmia yes or not sure adds a note naming the white-musk tester and its
sample link. Known limit: "peach" maps to the sweet-fruit family, which also holds berries and pineapple. A
separate data task, the lactone split, will give peach, apricot, coconut, osmanthus and tuberose their own family.

The result lists the profile's families with the bottles each rests on. Evidence from a note answer names the note
("Sauvage: you hated the ambroxan (hours later)"), and a classed family whose told answers point the other way says
"Your bottles and your answer disagree; your bottles count more." Below it, the visitor's own words are listed
("You enjoy: lemon, tea", "You avoid: peach", "You prefer bitter to sweet", "Has bothered you: too sweet"), each
marked "from what you told us". A white musk, woody amber, creamy sandalwood or dry cedar row the visitor did not
notice brings the anosmia note, naming that bottle and family, whatever the anosmia answer was.

Three recommendations appear from two rated bottles, or from any number once a told item is positive (an enjoyed
note, or a side of the taste question); avoid-only answers barely move the zero-bottle picks, so they do not
unlock them. With no rated bottle and a positive told item, the heading reads "Based only on what you told us" and
the testers follow under "Samples that would confirm it". Otherwise a visitor with no rated bottle gets the three
testers alone (`QUIZ.testers`: the tested family at 0.8 or more in the drydown, no other family at 0.4 or more,
designer tier), each with the number of other catalogue perfumes that carry its family in the base; the tester
whose family weighs most in the told complaints' family maps comes first. The profiler uses the same gate and
heading, and its profile section adds "Also uses <n> answers from the quiz." with a link to the quiz; its risk
line for a family known only from avoid answers reads "which you said you avoid". "Rate it when you have worn it"
opens `index.html?add=<id>`, which adds that perfume on the profiler (retrying once the lazy catalogue loads, for
looked-up ids) and then removes the parameter from the address.
@@@END
@@@OLD
| `verdict:still`, `verdict:turned`, `verdict:other`, `verdict:shop` | chips attached; the event goes out when the visitor leaves the bottle, carrying the final verdict | "another reason" under 10 percent of stops; median visitor ticks four or more chips |
| `told:<chip>`, `told:none` | 0 | told families score no lower than others among later raters |
@@@NEW
| `verdict:still`, `verdict:turned`, `verdict:other`, `verdict:shop`, `verdict:unsure` | chips attached; the event goes out when the visitor leaves the bottle, after its note screen | "another reason" under 10 percent of stops; median visitor ticks four or more chips; "I don't remember" over a quarter of verdicts |
| `when:unsure` | 0 | over half of "turned" verdicts cannot name the stage, so most −2s rest on the drydown default |
| `notes:<rows answered>`, `notes:skip`, `notes:skipall` | rows on the screen | median answered rows under one per note screen, or skip and skip-all together over half of note screens; with the ratings rows, a note answer's sign contradicts a later profiler rating of that stage over a quarter of the time |
| `like:<note>`, `avoid:<note>` | 0; sent for each answered card when the visitor leaves the picker screen | over 80 percent of answered cards are "avoid"; among later raters, families of avoided notes score no lower than others |
| `taste:bitter`, `taste:sweet`, `taste:both`, `taste:unsure` | 0 | "I don't know" over 40 percent; among later raters, bitter answerers' sweet-side families score no lower than sweet answerers' |
| `told:<chip>`, `told:none`, `told:unsure` | 0; one per chip ticked | told families score no lower than others among later raters; median visitor ticks four or more complaints |
@@@END
@@@OLD
The ratings rows measure the rest: a later profiler rating of a quiz bottle whose sign contradicts the
verdict (over a quarter of the time falsifies the mapping), and whether bottles given "too sweet" hold
vanilla or tonka at 0.4 or more in the drydown.
@@@NEW
Each event goes out once per visit, when its screen is first left, so going Back and answering again sends nothing
new. The ratings rows measure the rest: a later profiler rating of a quiz bottle whose sign contradicts the
verdict (over a quarter of the time falsifies the mapping), and whether bottles given "too sweet" hold
vanilla or tonka at 0.4 or more in the drydown.
@@@END
