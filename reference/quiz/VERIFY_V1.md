# V1 verification: the landmark quiz

Verdict: no blocking finding, three should-fix, six notes. The build matches PLAN.md on the verdict
mapping, screens, events, storage keys, data attributes and the no-querySelector rule, and keeps vendor
note lists out of storage and posts.

Required runs:
- `node --test tests/*.test.js`: tests 23, pass 23, fail 0 (page.test.js unchanged and passing).
- `node tools/sync_backend.js --check`: "VERIFIED list is current".
- `python tools/build_artifact.py`: "OK 23858 bytes"; build/artifact holds quiz.html.
- Golden fixture: 11 of 60 scenarios differ from HEAD, as the plan expects.

## Blocking

None.

## Should-fix

**S1. site/js/quiz.js:252 and :332.** Search hides picked and rated bottles, so Enter on the name of a
picked bottle falls through to `lookup()`. Probe: tapped sauvageedp, pressed Enter on "sauvage eau de
parfum" with a lookup responder; a lookup was posted and the grid then held two pressed tiles, sauvageedp
and a vendor duplicate `f_dior-sauvage`. Answering both writes two ratings for one bottle, which can lift a
possible deal-breaker to likely (two negative perfumes). Without a backend the same input toasts "Not
found", though the perfume is in the catalogue. app.js:494 has the same path for rated names; it predates
this build.

**S2. site/js/quiz.js:38 and :76 (narrowHint).** English "without the other suspects" is a metaphor, and
it is untrue in the case plan test 2 exercises (Sauvage turned, no other family at 0.4 in its drydown).
Arabic "كيف انتهى معك يبيّن" makes كيف the subject of the verb, which is ungrammatical.

**S3. README.md:158-161 and :182.** The narrowing paragraph says the page uses "the rule settleSuggestion
uses". quiz.js `narrowCandidates` differs twice: it also runs when the offending perfume has no other
family at 0.4 (settleSuggestion skips those), and it leaves out bottles answered on this visit, including
"another reason". The events table does not say that a verdict event goes out when the visitor leaves the
bottle, not on the tap.

## Notes

**N1. E3's flag on the shop verdict.** Confirmed: a shop verdict on Hawas alone gives fruity_sweet −1.14
(with "too sweet"), citrus −1.00, spicy_warm −1.00, all "Possible deal-breaker". This follows from
engine.js:118 (score at or below −0.7 with one negative perfume is badPossible); one −1 opening rating on the
profiler does the same. `recommend()` only penalises badPossible families, at the opening's 0.6 weight, and
excludes nothing. Recommendation: no plan or engine change. Record item 2 fixed opening −1, and the "later
ratings contradict the verdict" falsifier measures it. One mismatch with record item 11: these lines carry
"from what you wore" (quiz.js:45, :83) though the bottle was only tried in a shop. Planner's call.

**N2. E3's other choices, all accepted.** (1) Both attributes are in the plan's list. (2) Matches
"written and sent as soon as it is given". (3) Matches record item 3. (4) Consistent; see S3 and N4.
(5) Plan test 2 requires it. (6) The plan asks for a toast; see S1. (7) "none" has no chip to show.
(8) Correct: skipping quiz rows first would count a superseded profiler rating. (9) A language toggle on
the result does not resend it.

**N3. quiz.js:193.** If the 1.2 s send has gone out, switching to "another reason" leaves the "turned"
row in the sheet (probe: eros drydown −2 sent, store empty, event `verdict:other`). stats_ skips it and
app.js's remove behaves the same; analyses of quiz rows must take the final answer from the verdict events.

**N4. quiz.js:404.** The anosmia note's link sends `tester:narcisoforher` with n equal to that tester's
card position when cards are shown, so note clicks and card clicks cannot be told apart. In the profile
branch it sends n = 0, as README says.

**N5. Wording.** The other Arabic strings in quiz.js, app.js and articles.html read correctly and match
the site's register; shared strings are copied from app.js.
- quiz.js:63 gridQ is singular (لبستَه، جرّبته) on a multi-select screen.
- quiz.js:85 noFamilies: the second sentence has no clear subject.
- quiz.js:90 noneLede "لترى هل تزعجك تلك العائلة" is weaker than the usual "إن كانت".
- quiz.js:43 and :81 "What your bottles say" / "ما تقوله عطورك" personify the bottles.

**N6. tools/build_artifact.py** is CRLF on all 38 lines in the working copy (`git ls-files --eol`:
w/crlf) against `.gitattributes` eol=lf. Harmless; git normalises it on add.

Probes the tests do not run, all as the plan requires: shop plus chip (opening −1, `chips.opening`,
again null); turned, first hours, two chips (heart −2, again 0, both chips on heart); turned then "another
reason" (record removed, a tester-link blank restored); None, chemical, unsure (Sauvage first, told line,
anosmia note, nothing written); the Arabic flow to both result branches; a vendor lookup (tagcache and
stored `auto` hold identity and stages only, no note names in localStorage); the profiler showing all of
these; `?add=` for verified, lazy, rated and unknown ids. Backend header and row are both 13 columns in
order; VERIFIED is untouched. No em dash in any changed file. The real-browser check is the planner's.

## Fix list for E4

1. **site/js/quiz.js:332 (S1).** In the Enter handler, when `search()` returns nothing, run the same hit
   test without the `open()` filter over PERFUMES and AUTO. If anything matches, call `addPick(first.id)`
   (it toasts "already rated" for a rated bottle; a picked one stays picked) and skip `lookup()`. Add a test
   in tests/quiz.test.js: tap sauvageedp, Enter "Sauvage Eau de Parfum" with a lookup responder, assert no
   lookup call and one pressed tile.
2. **site/js/quiz.js:38 and :76 (S2).** narrowHint becomes:
   EN "Each of these has, in its base, a family that may be a deal-breaker for you. Your verdict on it
   shows whether that family is the problem."
   AR "في قاعدة كل واحد منها عائلة قد تكون مُفسدة لك. وجوابك عنه يبيّن إن كانت هذه العائلة هي السبب."
3. **README.md:158-161 and :182 (S3).** State that narrowing also runs when the offending perfume has no
   other family at 0.4, unlike settleSuggestion, and skips bottles answered on this visit; state that a
   verdict event goes out when the visitor leaves the bottle, carrying the final verdict.
4. **site/js/quiz.js (N5).**
   :63 "أيّ هذه العطور لبستها على بشرتك، أو جرّبتها على معصمك في متجر؟"
   :85 "لا تبرز أي عائلة بعد. قيّم عطوراً أخرى في صفحة المحلل لتظهر."
   :90 replace "لترى هل تزعجك تلك العائلة" with "لترى إن كانت تلك العائلة تزعجك"
   :43 "Your profile from these bottles"; :81 "ملفك من هذه العطور"
5. **Optional, site/js/quiz.js:404 (N4).** Mark the note's link `data-note="1"` and send n = 0 for it in
   the click handler; README's `tester:<id>` row then says "0 for the anosmia note's link".
6. **tools/build_artifact.py (N6).** Convert to LF; no content change.

Then run `node --test tests/*.test.js` and `python tools/build_artifact.py`.

## Do not touch

- site/js/engine.js (the chip line is approved) and tests/fixtures/engine_golden.json.
- data.js perfume entries, FAMILIES, CHIPS and QUIZ; evidence.js, mapper.js, materials.js.
- backend/apps-script.gs: its edits are correct, and VERIFIED stays generated.
- site/js/app.js, including the pre-existing Enter path at :494.
- tests/lib/dom.js.
- E3's nine choices (N2) and the shop mapping (N1).
- Anything under reference/ other than reference/quiz/; git.
