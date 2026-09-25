# Build plan 2: a deeper quiz

The owner's requests, 25 September 2026:
- The quiz is too short. It should probe deeper, allow more than one answer, and offer "I don't know".
- It should ask about likes such as citrus, musk and soapy-clean.
- For every bottle the visitor picks, it should ask about that bottle's own main notes. For example: "Cartier
  Déclaration has cardamom in the heart. Did you like it, and how much?" There should be an "I didn't notice
  it" option, and the questions must not feel tedious.
- It should not ask about budget. The quiz is about recognising taste.

The planner raised the round table's evidence against asking about smells by name, and the owner repeated
the request. The plan keeps the round table's safeguards instead. Answers given in words are labelled as
such. They can change the order of the picks, but they can never exclude a perfume or make a "likely"
deal-breaker on their own. Answers about the notes of a bottle the visitor has worn are different: they are
observations of that bottle, so they count as ratings.

Everything built under PLAN.md stays unless a line below changes it. The planner dropped the "who is it for"
question drafted in the first version of this plan along with the budget question, because it is not about
taste either.

## The flow (both languages)

**Parts.** The screens are grouped into four parts, and the top line shows "Part i of 4" with the part's name:
1. Your bottles: the grid, verdicts, note rows and narrowing.
2. Notes you know: the note picker.
3. Sweet or bitter.
4. What bothers you: complaints and anosmia.

**Back button.** Every screen but the first has one. It restores a stack of `{ step, queue, at, round, narrow }`
snapshots, one per screen shown, so round two, narrowing and "skip all" go back correctly.

1. **Grid** (as now).
2. **Per bottle, verdict** (as now), with two additions:
   - A fifth verdict, "I don't remember how it ended". It writes nothing and sends event `verdict:unsure`.
   - "When did it bother you?" gets "I don't remember". The -2 stays on the drydown, and event
     `when:unsure` is sent.
3. **Per bottle, its notes.** Shown after the verdict for "still", "turned" and "shop"; see "Note questions"
   below.
4. **Narrowing** (as now). Its "None of these" button reads "None of these, or I don't know them". A narrowing
   bottle gets the same verdict and note screens.
5. **Note picker**, four screens of single notes that people recognise. The owner decided on 25 September
   to ask about single notes, not families.
   - Each card shows one note in the page language and three buttons: "I enjoy it", "I avoid it", "Not sure".
     "Not sure" is the default, and any number of cards can be marked.
   - Less familiar notes carry a one-line hint: vetiver, patchouli, tonka, iris, ambergris, oakmoss.
   - The screens and their notes, held in data.js as `QUIZ.notePicker`:
     - Fresh and green: lemon, bergamot, grapefruit, orange, mint, lavender, tea, sea notes, ginger.
     - Flowers and fruit: rose, jasmine, orange blossom, iris, peach, apple, pineapple, coconut, lily of the
       valley.
     - Spices and sweets: cardamom, saffron, cinnamon, pink pepper, vanilla, caramel, honey, coffee, tonka.
     - Woods, resins and musks: oud, sandalwood, cedar, vetiver, patchouli, amber, frankincense, leather,
       tobacco, musk, oakmoss, ambergris.
   - Each note's English word must map through `PP_MAP.famsForNote`, and a site test checks this.
   - A picker card is hidden when its word was already listed on a bottle row the visitor answered, so the
     same note is not asked twice.
   - Answers are stored as `quiz.notes`: note id, then 1 or -1. "Not sure" removes the key.
   - Each answered card sends event `like:<note>` or `avoid:<note>` when the visitor leaves the screen.
   - Known limit, stated in the README: "peach" maps to the sweet-fruit family, which also holds berries and
     pineapple. A separate data task, the lactone split, will give peach, apricot, coconut, osmanthus and
     tuberose their own family.
6. **Bitter or sweet.** The question: "When a perfume leans one way, which do you prefer?"
   - Options: "Bitter and fresh (tea, grapefruit, vetiver)", "Sweet (vanilla, caramel, ripe fruit)", "Both, it
     depends", "I don't know".
   - Stored as `quiz.taste`. Event `taste:<bitter|sweet|both|unsure>`.
   - The families each answer moves, and their weights, live in data.js as `QUIZ.taste`. The executor prints
     the weights, from 0.3 to 0.8, before writing.
     - Sweet side: vanilla_gourmand, fruity_sweet, tonka_coumarin, amber_resin, tobacco_honey.
     - Bitter side: green_herbal, citrus_fresh, vetiver, incense_resin, oakmoss_chypre, leather_smoky.
   - "Bitter" adds +1 to the bitter side and -1 to the sweet side, each scaled by its weight. "Sweet" does the
     reverse. The other two answers add nothing.
6b. **Complaints, multi-select.** The question: "Which of these have bothered you in a perfume? Pick all that
   apply." The options are the six chips as now, plus "Nothing has bothered me" and "I don't know"; the last
   two each clear the others.
   - Stored as `quiz.told`: an array of chip ids, or `[]`.
   - `quiz.toldNone` is true for "Nothing has bothered me".
   - An old string value of `quiz.told` is read as a one-item array, and "none" as `[]`.
   - Events: `told:<chip>` for each chip, `told:none`, `told:unsure`.
7. **Anosmia** (as now).
8. **Result** (below).

## Note questions (one screen per bottle)

**Which notes are asked.** A new shared file `site/js/notes.js` exposes
`PP_NOTES.questions(P, kind)` to both pages. It returns at most five rows for a perfume. Each row is
`{ f, stage, w, words: { en: [...], ar: [...] } }`.
- **Candidates:** every family at 0.4 or more, taken at its strongest stage, as given by the engine's exported
  `strongestStage(P, f)`. A tie goes to the later stage, so a family equal in heart and drydown is asked
  about the drydown.
- **Cap and balance (planner, after E5):** at most one opening row, two heart rows and three drydown rows,
  strongest first within each stage, and five in all. A stage with fewer candidates leaves its places unused;
  when the total is still above five, the weakest drydown row goes first. The first rule (a cap of four with
  drydown priority) dropped the owner's own example: the cardamom in the heart of Declaration.
- **One row per word:** a note word appears on the row whose family it maps to most strongly; it is repeated
  on another row only when that row would otherwise have no word (Sauvage's star anise appeared twice).
- **Order:** opening, heart, drydown.
- **Shop trials:** for `kind` "shop", only opening and heart rows, at most two.
- **Note words:** for each row, the words from the perfume's own note list whose mapper families
  (`PP_MAP.famsForNote`) include the row's family. The row's own stage list is searched first, then the
  other two. A row is "not on its note list" only when no stage lists a matching word.
- **Arabic note words:** taken by position from the Arabic note list when that stage's Arabic and English
  lists have the same length. When they differ (26 of 858 stage lists today), `ar` is empty and the page
  shows the family name.

The executor of E5 reports, by script, the average number of rows per perfume under the final rules and how
many rows have no listed note in any stage.

**Told items.** notes.js also exposes `PP_NOTES.toldItems(quiz, D, M)`, used by both pages so they build
the same list:
- **A note answer:** one item per family from `M.famsForNote(word)`, with that family's weight as `w`.
- **The taste answer:** one item per family in `QUIZ.taste`.
- **Old values:** toldItems itself normalises an old string `quiz.told`. A chip id becomes a one-item array,
  and "none" becomes `[]` with `toldNone` true, so both pages read old storage the same way.
- **A complaint chip:** one item per family in the chip's family map, with value -1.

**What a row looks like.** The stage in plain words ("First minutes", "First hours", "Hours later"), the note
words, and the family name in small type. For example: "First hours · cardamom, pepper · fresh spices".
A row with no listed note reads "Hours later · not on its note list · woody ambers (Ambroxan-type)". It
carries a one-line hint that some materials sit in a perfume without being listed. This is the site's thesis
shown on the visitor's own bottle.

**Answers per row.** "Loved it", "Liked it", "Didn't mind", "Disliked it", "Hated it" (+2 to -2), and,
set apart, "Didn't notice it". A row collapses to show the chosen answer once answered.

**Keeping it light:**
- The intro line names the bottle and the number of parts, for example "Sauvage in four parts. Tap what you
  remember; skip what you don't."
- Every row is optional and "Next" always works.
- A "Skip the notes for this bottle" link is on every note screen.
- After the first bottle, a second link, "Skip notes for the other bottles", ends note screens for this visit.
- Events: `notes:<n answered>` per bottle, and `notes:skip` or `notes:skipall`.

**Where the answers go.** They are written into the bottle's rating record, next to the stage ratings.
- `noteAnswers: { family: -2..2 }`, named so it cannot be confused with vendor note lists, which are never
  stored.
- `unnoticed: [family]`

## Engine (site/js/engine.js)

These are the only engine changes. They are additive: without the new inputs every output is unchanged, and
the golden fixture must not move.

**1. Note answers in computeProfile.** For each rated perfume:
- An answer counts only for a family the perfume holds. An answer on a family it no longer holds, after a
  pasted label or an evidence update, is skipped.
- In the stage loop, a family with a note answer is skipped only in the answer's stage, which is
  `strongestStage(P, f)`. In its other stages the stage rating still applies.
- An unnoticed family is skipped in every stage, and the chip loop skips it too.
- After the stage loop, run one note loop for each `[f, val]` in `r.noteAnswers`:
  - Take `s = strongestStage(P, f)` and its weight `w`.
  - `add(f, val, w * STAGE_W[stage] * cm * PROV_W[prov], { perfume, stage, value: val, strong: w >= STRONG, prov, note: true })`.
  - This runs even when that stage has no stage rating.
- A note answer is an observation of a worn bottle, so it is strong. It counts toward classes and can make a
  "likely" deal-breaker, like a stage rating.

**2. Told answers in computeProfile, kept apart from bottle evidence.** The function takes an optional `state.told`, a flat list of items
`[{ f, value: 1 | -1, w: 0..1, src }]`. The engine stays generic: it knows nothing about notes, the taste
axis or chips, and the page builds the list (see notes.js below).
- **Each item:** `add(f, value, TOLD_W * w, { told: true, src, stage: null, value, strong: false, prov: "told" })`.
- **src** says where the item came from, for display: `note:<id>`, `taste:<bitter|sweet>` or `chip:<id>`.
- **Weight:** `TOLD_W = 0.3` times the item's own weight, against 0.75 for one strong drydown tag on a worn bottle.
- **Separate sums.** Told items go into their own sums, `tsum` and `twsum`. They never enter the sums that set
  a family's score, n and class, which come from bottle and note evidence exactly as today. This fixes the
  review's blocking finding: mixing the two let a long told list erase a class a worn bottle had set, and let
  one answer create an exclusion.
- **Where told answers count.** Only for a family with n = 0, that is, one with no strong bottle evidence.
  - With weak bottle evidence, the score becomes `(sum + tsum) / (wsum + twsum)`.
  - With no bottle evidence, the score is `tsum / twsum`. The family is neutral, with n 0, pos 0, neg 0 and
    an empty evidence list.
  - A family with n = 0 is always neutral. Told answers therefore cannot create a class or an exclusion,
    and cannot trigger settleSuggestion.
- **Fields for display:** `out[f].toldScore = tsum / twsum`, and `out[f].toldNeg`, which is true when every
  told item for the family is negative. Both are set only when told items exist.

**3. Risk kind in recommend().** A family with `v.n === 0` and `v.toldNeg` true gets risk kind `"told"`.
A family with mixed told answers keeps the usual risk kinds.

**4. `strongestStage(P, f)`** is exported. It returns the stage with the highest weight for f, with ties
going to the later stage, and null when the perfume does not hold f.

**README.** "How the profile is computed" gets one sentence for each of the three changes.

## Quiz result (site/js/quiz.js)

**Family lines.** Classed families appear as today, with their bottles and source words.
- **Note answers:** evidence from them names the note, for example "Sauvage: you hated the ambroxan (hours
  later)".
- **What you told us:** a block below lists the visitor's own words, not families: "You enjoy: lemon, tea",
  "You avoid: peach", "You prefer bitter to sweet". Each line carries the source word "from what you told
  us".
- **Disagreements:** where bottles and told answers point opposite ways, a line reads "Your bottles and your
  answer disagree; your bottles count more."

**Unnoticed musks and woods.** If the visitor did not notice a white musk, woody amber, creamy sandalwood or
dry cedar row, the anosmia note appears and names that bottle and family, whatever the anosmia answer was.

**Recommendations.** They appear when the visitor has two or more rated bottles, or when the told list holds
at least one positive item. Avoid-only answers barely moved the zero-bottle picks: in the review, most
matched the picks for no answers at all.
- **No rated bottle:** the heading reads "Based only on what you told us", and the testers follow under
  "Samples that would confirm it".
- **Nothing at all:** with no rated bottle and no told answers, the page shows the testers only, as today.

## Profiler page (site/js/app.js, site/index.html)

**Quiz answers.** app.js reads `pp_quiz_v1` and passes the same told list into computeProfile.
- It also uses the quiz's gate for recommendations, so both pages show the same picks for the same device,
  with any number of bottles.
- With told answers and fewer than two bottles, the profiler's recommendations section carries the quiz's
  heading, "Based only on what you told us". When told answers exist, the profile section gets one line with a link to
the quiz: "Also uses <n> answers from the quiz."

**Note rows on each rated card.** A collapsible "Rate its notes" block holds the same rows from
`PP_NOTES.questions(P, "worn")`. The six answers write `noteAnswers` and `unnoticed` into the record and resend it.

**Wording.**
- Evidence lines from note answers name the note, as in the quiz.
- Risk kind "told" reads "Contains <family> in the <stage>, which you said you avoid."

**Scripts.** index.html and quiz.html load `js/notes.js` after `js/engine.js`.

## Backend and tools

- `backend/apps-script.gs`: RATING_HEADERS gains `noteAnswers` and `unnoticed`, and the ratings row gains
  `clip_(JSON.stringify(body.noteAnswers || {}), 500)` and `clip_((body.unnoticed || []).join("|"))`, in the same
  edit. The missing-header fill covers old sheets.
- `tools/build_artifact.py` copies js/*.js already; confirm notes.js arrives.

## Data (site/js/data.js)

- `QUIZ.notePicker`: `[{ id, notes: [{ id, en, ar, hint_en?, hint_ar? }] }]` for the four screens, with the
  screen titles in the T strings.
  - `en` is the word passed to `PP_MAP.famsForNote`.
  - Before writing, the executor prints each note's families. A note that maps to nothing, or only to
    families no catalogue perfume holds at 0.4 or more, is reported and not silently dropped.
- `QUIZ.taste`: `{ sweet: { family: weight }, bitter: { family: weight } }`, printed before writing.

## Arabic

No form of لبس anywhere (memory: arabic-wear-not-literal).

| English | Arabic |
|---|---|
| I enjoy it | أحبه |
| I avoid it | أتجنبه |
| Not sure | لست متأكداً |
| I don't remember | لا أتذكر |
| Loved it | أعجبني كثيراً |
| Liked it | أعجبني |
| Didn't mind | لا بأس به |
| Disliked it | لم يعجبني |
| Hated it | كرهته |
| Didn't notice it | لم ألاحظه |
| Not on its note list | غير مذكور في قائمة نوتاته |

Match the register of app.js.

## Tests

**tests/engine.test.js.** New tests; the golden is unchanged.
- A note answer replaces the stage rating for its family, in the answer's stage only.
- Answers on families the perfume does not hold are skipped, with no NaN.
- Told items never change the score, n or class of a family with n of 1 or more. Tested on two cases:
  - Khamrah "still" plus a long told list.
  - Golden seed 5018 plus "avoid cedar".
- An unnoticed family gives no evidence.
- A note answer on a family whose strongest stage has no stage rating still counts.
- Two bottles with a hated note in the same family give a "likely" deal-breaker.
- Told-only families stay neutral with n = 0, never appear in `likely` or `badAny`, and never exclude.
- A told "avoid" lowers a perfume's rank and "enjoy" raises it.
- Risk kind "told" appears only with told input.

**tests/notes.test.js** (new). For `PP_NOTES.questions`:
- The cap, the order and the shop limit on real catalogue perfumes.
- Sauvage EDP gives four rows, with "ambroxan" on the woody amber row.
- Narciso Rodriguez For Her gets a drydown row. This tests the tie rule.
- Baccarat Rouge 540's woody amber row finds "amberwood" in its heart list. This tests the all-stages search.
- Every Arabic word list is the same length as its English list, or empty.

**tests/quiz.test.js.** The full flow in the stub browser:
- The run: two bottles; notes on the first (one loved, one hated, one unnoticed); "skip notes for the other
  bottles"; note picker with lemon and tea enjoyed and peach avoided; taste "bitter"; complaints [sweet,
  soapy]; anosmia no.
- It checks the stored ratings with `noteAnswers` and `unnoticed`, `pp_quiz_v1`, the events, and the result: the
  note evidence line, the told block, the disagreement line and the unnoticed note.
- A zero-bottle run with told answers shows "Based only on what you told us", three picks, then the testers.
- A zero-bottle run with every screen at "not sure" shows only the testers.
- It also covers the new "I don't remember" options, Back navigation, and an old string `quiz.told`.

**tests/page.test.js.**
- The profiler, loaded with the same storage, gives picks equal to the quiz's.
- Its "Rate its notes" block writes `noteAnswers`.
- With zero bottles and a positive told item, it shows the same picks as the quiz.
- The script list includes notes.js.

## Do not touch

- The chip rule in engine.js.
- tests/fixtures/engine_golden.json, which must not change.
- In data.js: perfume entries, FAMILIES, CHIPS, QUIZ.grid and QUIZ.testers.
- evidence.js, mapper.js, materials.js.
- The backend's VERIFIED list.
- Anything under reference/ except reference/quiz/.
- git.

## Schedule

One agent at a time, all Opus. The planner runs the tests and reads each diff between steps.
- **E5:** engine (note answers, told layer, risk kind), notes.js with its test, engine tests, README engine sentences.
- **E6:** data.js QUIZ.notePicker and QUIZ.taste, site test; notes.js `toldItems` with its test.
- **E7:** quiz.js, site.css, quiz.html, index.html and app.js (told, note rows), backend columns, quiz and
  page tests, README Quiz section.
- **V2:** a fresh verifier against this plan, including every Arabic string and a real-browser pass at phone width.
- **E8:** fixes from V2.
- **Planner:** rebuilds the preview and republishes the phone link at the same URL.

## Review folded in (PLAN2_REVIEW.md)

- **Blocking finding:** fixed by engine change 2; told evidence is kept apart from bottle evidence.
- **S1:** the cap is four rows.
- **S2:** ties go to the later stage, in `strongestStage`.
- **S3:** a note answer overrides only in its own stage.
- **S4:** answers on families the perfume no longer holds are skipped.
- **S5:** note words are searched in all three stage lists.
- **S6:** risk kind "told" applies only when every told item for the family is negative.
- **S7:** toldItems normalises old values itself.
- **S8:** the profiler uses the quiz's gate.
- **S9:** zero-bottle picks need a positive told item.
- **S10:** parts and a snapshot stack replace the step count.
- **N4:** picker cards already answered on a bottle are hidden.
- **N5:** the field is renamed `noteAnswers`.
