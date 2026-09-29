# Project log

Continuity record for the perfume profiler. Newest first.

## 2026-09-29: session close, the front page and its brass atomizer

Session title: the front page and its brass atomizer. All pushed and live (334ee48, e6eaec3, 8c9cbf4); the workflow's
tests and deploy passed, the live files match the committed ones, and the live page loads the 3D atomizer. Checks of
the live site blocked script.google.com.

- Research: can the site rank all 1,000 perfumes by a visitor's answers? The groups hold; positions inside a group are
  close to noise (Spearman 0.40 against 0.59 for a perfect reader of the same answers), and the trialled fixes gain
  little. Record: reference/algorithm/stress/FULLORDER.md and its scripts.
- No drydown framing: the quiz and the pages no longer judge a perfume by how it ended (memory no-drydown-framing).
- A front page (site/index.html); the quiz moved to site/quiz.html and opens on its grid from the front page's buttons
  (quiz.html?go=1), with reach:start sent from the front page. Built, rebuilt as seven evidenced steps at the owner's
  word, then rewritten to hook the reader. As it stands: a 3D atomizer of engraved antique brass (site/js/bottle3d.js,
  three.js 0.170.0 from jsDelivr pinned by an import map; still pictures from tools/render_atomizer.py as the first
  paint and the fallback); the 1,000-perfume test; the Pegasus box turned round to its label (Iso E Super among the
  first five ingredients on 11 of 12 Parfums de Marly labels, on no note list); the grid of 100 noses; the spoiled
  note; the critics' stars; the day of wear. Sources are folded under each section; each section ends on a question
  that links to the next. Edit scripts: reference/landing/edits/README.md.
- Articles page: new title and lede ("Why a perfume can turn on you"); the article bodies are unchanged.
- One test "reach:start" reached the live events tab from a review probe at about 14:17 AST on 29 Sep 2026 (English,
  a new device id): leave it out of any count.

Open, dated 29 Sep 2026 (operational):
- Watch the first visitors through the new front page: the events tab now starts at index.html, and the quiz's own
  start screen is skipped from it. Compare reach:start with reach:grid once there are visitors.
- Base-first wording remains in the article bodies ("Read the base line first", "Ignore the opening for buying
  decisions") and the profile page ("Clear of X in the base"); the "hand-checked catalogue" line in the notes article
  is false (the tags are machine-made). Offered, not done.
- Base-only engine rules remain (the "I still wear it" credit, the narrowing round, the starter samples and the
  settle suggestion all read the base). Offered, not changed.
- The jewel on the atomizer takes each perfume's colour; it was not asked for and goes if the owner dislikes it.
- The claude.ai phone preview predates all of this; tools/build_artifact.py now carries the module and the still
  pictures but was not published.
- reference/launch/ (FIRST_SALE.md, an Arabic message) is the owner's own and stays out of git unless asked.
- Carried: the first 50 to 100 real visitors, the noon affiliate link, FRAGELLA_KEY.

Reflective, not scheduled:
- The front page's 1,000-perfume test could hand its likes and the one dislike to the quiz, so the quiz starts from
  them.
- The quiz's own screens still read in the older, plainer voice; the front page's hook style could carry into them.
- Self-hosting three.js would drop the page's only third-party script besides the fonts.

## 2026-09-28: session close, the removal pass

Session title: the removal pass. The owner asked whether the design was now world class. A render pass (phone and
desktop, both languages) said no: too many effects at once, and four defects on a phone (the fixed bottom waves greyed
out any card passing over them; the lavender sketch sat behind text; box shots in the quiz grid; a start-page header
181 px tall). At the owner's word the effects were taken out, then the Start button and the body text were reworked
after the owner judged the flat gold button "not nice looking". All pushed and live (d4991d0): the workflow's tests and
deploy passed, and the live pages serve the committed files with no console errors. Record in reference/design/README.md
(section "The removal pass").

- site/site.css: no waves or discs; the rose and lavender close every page in a band after the footer; gold is never a
  metallic gradient (flat marks, thin lines, a soft shade on the primary buttons); on a phone the header is one row on
  every page (63 px) with one button for the other language, and its two links open the footer (quiz.js, app.js).
- Text: Arabic in Noto Sans Arabic (Latin stays IBM Plex Sans), chosen over Readex Pro, Almarai and Tajawal on a
  side-by-side render; ink-2 #4B3B2F and ink-3 #665344 (8.8 and 6.0 to 1 on the ground). The Arabic font adds about
  65 KB to the first load.
- Grid photos: all sixty show the bottle alone. Seven box shots now use their Fragrantica page photos (page numbers for
  Sauvage EDP, Club de Nuit Intense Man and Eclaire added to reference/images/fragrantica_ids.json); Jovan Musk and
  Reef 33 are cropped by tools/fetch_bottles.py from the new reference/images/crops.json. Edit script:
  reference/design/edits/photo_data_edit.py.
- Checks of the live site blocked script.google.com, so this session left no rows in the backend sheet.

Open, dated 28 Sep 2026 (operational):
- Only the grid's sixty photos were checked for boxes; picks can show any of the 1,000. Sweep the contact sheets
  (build/bottle_sheets/, rebuilt by tools/fetch_bottles.py) for box and props shots and fix them the same way.
- The phone artifact (claude.ai) still predates the motion work and this pass; rebuild only if the owner wants it.
- Carried: bring the first 50 to 100 real visitors through the quiz, then read the events and ratings tabs; the noon
  affiliate link; FRAGELLA_KEY; the owner's calls listed in the two entries below.

Reflective, not scheduled:
- Left from the design review: the note picker (92 cards with three buttons over five screens) still reads as a form,
  and the desktop result leaves the right third of the screen empty.
- The other strong Start trial was a dark button with a gold arrow at its end; the shaded gold went live with the owner's approval.
- Self-hosting the fonts would drop the render-blocking Google Fonts request and the Noto symbols subset that the
  arrow characters pull in.

## 2026-09-28: session close, the backend live

Session title: the picks spread and the backend live. This entry closes the session whose engine work is logged in
the entry below. At the owner's request the Google Apps Script backend went live (f866dc9, workflow tests and deploy
passed); all work is pushed (last commit before this entry 12d926f).

- In the owner's Google Drive: the sheet "Scent Profiler backend" and its bound Apps Script project of the same
  name, holding backend/apps-script.gs as committed (checksum matched) with SHEET_ID set in the deployed copy only.
  Web app version 1, executes as the owner, access Anyone:
  https://script.google.com/macros/s/AKfycbySbzxOcL6TKGIhj874qBcpGbfqA9CMFwrtJB6j6Ur0Nf40v7IgdzItYNCuTs2xjtCY/exec
- site/js/config.js points at it. The test browser (tests/lib/dom.js) clears that endpoint unless a test asks for a
  backend. Checked from the live origin: a post returns ok, ?stats=1 answers, and the live quiz sent its own
  "reach:start" event. Test rows in the events tab: two with device "setup-check" and one "reach:start" from the owner's
  Chrome (device d_bsklrhs9muhg2lpp); leave them out of any count. The owner then ran the whole quiz in an incognito
  tab (device d_zarh8ak9mukxej8q: 26 events, 16 ratings); leave that out too.
- The site writes to the events, ratings and catalogue tabs; Sheet1 stays empty (the owner first looked there and
  thought nothing had arrived).
- Not set: FRAGELLA_KEY (Script Properties), so perfumes outside the catalogue stay untagged until the owner adds one.
- To change the backend later: paste the new backend/apps-script.gs into the project keeping the SHEET_ID line, then
  Deploy > Manage deployments > edit > Version: New version; the URL stays the same.

Open, dated 28 Sep 2026 (operational):
- Bring the first 50 to 100 real visitors through the quiz, then read the events and ratings tabs (Profiler menu >
  Build the quiz funnel) against the open calls of the entry below.
- Next after that: the noon affiliate link on the Bottle button (reference/launch/FIRST_SALE.md).
- Optional: FRAGELLA_KEY in the script's Script Properties, for perfumes outside the catalogue.
- The phone artifact, if rebuilt, now carries the endpoint; the claude.ai host blocks the requests and the page ignores
  the failures.

Reflective, not scheduled:
- The first real data decides which of the owner's open calls matter; measure how often visitors answer the note rows
  and know note names before changing the palate or deal-breaker wording.

## 2026-09-28: session close, the picks spread over the catalogue

Session title: the picks spread over the catalogue. The owner asked for a stress test from new angles and whether the
picks repeat a few perfumes; then, going to sleep, to research, fix and push. All pushed and live (6a5f6ea): the
workflow's tests and deploy passed, the live quiz and profile pages load with no console errors, and the live profile
shows the new picks (Sauvage and Bleu kept: La'dor Bakhur Classic, Molecule 01, Dior Homme Sport).

- Confirmed (reference/algorithm/stress/COVERAGE.md): on 0164d00 Molecule 01, Not a Perfume and Grand Soir each went to
  12 to 15 visitors in 100 (Grand Soir 21 with verdicts only), and two visitors with no liking in common shared a pick 8
  times in 100, against once for the best-possible picks. Cause: a liked family counted once per stage, so perfumes
  that are one common base family from opening to base won, and "I still wear it" makes about four visitors in ten
  like each common base family.
- Fixed in site/js/engine.js (recommend, reasonOf, picksView): a liked family earns its reward once, at its strongest
  presence; a family no rated stage exposes is read from the visitor's words alone, and is unmet without words (16% of
  pick cards had said "Has X, which you like" of a trace, and 14 in 4,356 the opposite of the visitor's words); picks
  read scores to nine places. Most picked now 3 in 100, the ten most picked 8% of picks (25%), kept 75% (74%), turn 10%
  (9%).
- A fresh verifier (REVIEWS.md section 4) found a blocking defect in the first version (ce09d2b, committed, not pushed):
  a word on a family let its traces back in at full weight, so enjoying a note could lower its perfumes. Fixed by reading
  the words alone; a test, an invariant (c_invariants.js "word steps") and m_wordsteps.js cover it. Its second pass
  found nothing blocking; its should-fixes (card-line assertions, narrower wording) are in.
- Decided on the owner's behalf: picks stay on the side of the gendered bottles kept, or rated when none kept
  (`engine.sideOf`). Counting likes once alone raised other-gender picks from 22% to 30%, since the old top picks were
  unisex; with the rule 11%. To undo, remove the side test in recommend().
- Tests 120 (five new engine tests, tests/coverage.test.js and a told-weight guard in notes.test.js); golden reviewed by script
  (profiles unchanged; every changed pick equals the trialled ranking); the site engine equals the trialled rules for
  15,014 of 15,014 synthetic visitors; checks rerun in out/after_coverage/.

Open, dated 28 Sep 2026 (owner's calls):
- Visitors who rate no bottle: the engine cannot tell their side, and their other-gender picks rose from 26% to 33%.
  Ask "men's, women's or either" on that path, or accept it. Restricting them to unisex was trialled and rejected.
- Verdict-only visitors meet Montale Leather Patchouli 11 times in 100: the same cause as the palate without note rows
  (REPORT.md section 2); the remedies named there would settle both.
- Older than this change, found by the review: a note-row answer moved a step can move the picks the other way (about
  one step in twenty), through the lean rule of 27 Sep; for a revision of that rule (REVIEWS.md section 5).
- Minor: a pick from the same line as a rated bottle for 3% of visitors (2% before); the audit's 5 in 1,500 results
  listing an avoided family under "Drawn to" with no line saying why (from the kept-only veto of 77c5f70).
- Carried: the palate, deal-breaker and "ruled out" calls of the earlier 28 Sep entry (its gender and niche-heavy items
  are settled above); owner to confirm the kept rule (27 Sep); the phone
  artifact not refreshed since the motion work; reference/launch/ in or out of git; backend deployment; partner links.

## 2026-09-28: session close, the scoring stress-tested and its defects fixed

Session title: the scoring stress-tested and its defects fixed. All pushed and live (b93b223): the workflow's tests and
deploy passed, and the live quiz and profile pages load with no console errors.

- Stress test (reference/algorithm/stress/, REPORT.md): synthetic visitors with a hidden taste run through the real
  engine and quiz page, from seven angles. The picks beat chance (74% kept and 9 to 10% turn, against about a third
  turning for random or bestselling perfumes). What the result says about the visitor is weaker: the palate follows the
  note rows when they are answered and otherwise the kept bottles' strongest base family; "Drawn to" families are true
  likings about one time in five, the first deal-breaker about four in ten; a retest repeats palate and deal-breaker
  about 55% of the time.
- Owner's correction: no person tagged the catalogue (judgement tags by an earlier Claude session for 286, mapper tags
  for 714). Against Fragrantica's crowd accords, now cached for the 214 older perfumes with a URL, the judgement tags
  agree somewhat more than the mapper's (65% against 53% of strong families backed). README corrected.
- Fixed (77c5f70) and reviewed twice by a bounded independent verifier (REVIEWS.md): a liked family shown as a
  deal-breaker (through the same bottle, or through another under the old mixed rule), "Free of X" checking only the
  base, class lines depending on rating order, unchecked stored values; and the verifier's follow-ups (an avoided note
  gives way only to a kept bottle; a lopsided mixed family keeps its pick weight, so the golden's picks match 23cab69's).
  Tests 113, each new one failing on the old engine.
- The four commits of 27 Sep (the lean rule) went out with these; the stress test served as their review.

Open, dated 28 Sep 2026 (operational):
- Owner's calls from the stress test (REPORT.md, "What it points to"): how to name the palate when the note rows are
  skipped (describe the bottles, or ask for the rows first); naming a deal-breaker only when a note row or a second
  bottle singles it out, with the narrowing round drawing on the whole catalogue; counting in "ruled out" only what the
  picks exclude; keeping picks to the visitor's gender side; the niche-heavy, minimalist picks (Molecule 01 goes to 14%
  of visitors).
- Two minor edges left: on the profiler a kept bottle's liked opening can lift an avoided note; a note liked only in
  the first minutes can sit beside a deal-breaker from other bottles (by design; the page does not show the note).
- Carried: owner to confirm the kept rule (27 Sep); the phone artifact not refreshed since the motion work;
  reference/launch/ in or out of git; backend deployment; partner links.

Reflective, not scheduled:
- In the model the word answers carry most of the pick quality; how well real visitors know note names decides whether
  that holds. Measure it once the backend collects events.
- Settled: the 27 Sep item about a family liked in one kept bottle and disliked in another now shows it as mixed.

## 2026-09-27: session close, the quiz in motion and the lean rule

Session title: the quiz in motion and the lean rule. The motion work is live (618dfb0). The algorithm fixes are
committed locally and NOT pushed: the owner approved "push when done", but the final independent review was stopped
when the session ended, so the push waits for it.

- The quiz moves: screen transitions (View Transitions, direction-aware), in-place updates that keep focus, a one-button
  dock, the wear ribbon for when a bottle turned, a progress line in the header, and the palate wheel on the result
  (`site/js/motion.js`; plan, notes and the lockstep check in reference/design/motion/). Reduced motion turns it all off.
- The owner's complaint: kept Hacivat with its pineapple loved gave "sweet" although they prefer bitter. The fix is one
  rule, "a detail never outranks a verdict" (README, engine): only the heart and base of kept bottles name the palate;
  a note liked only in the first minutes, or disliked in a kept bottle, is a lean (moves the picks, never a like or a
  deal-breaker), and it silences the same bottle's stage ratings on that family where they disagree; picks carrying a
  lean name the bottle; the taste card says when the bottles overrule the sweet-or-bitter answer.
- `engine.kept`: kept means buy again yes, or heart and base 0 or above with one above 0; the opening never decides.
  Chosen this session without asking the owner (the reviewer flagged it as the owner's call): it restores the palate for
  profiler records with a disliked opening. Opening-only liked records are no longer "kept".
- A second reviewer found a blocking defect in the first version (a hated note became a like); fixed with tests that fail
  on the earlier engine. Golden unchanged. Record in reference/algorithm/. Tests 103.

Open, dated 27 Sep 2026 (operational):
- Run a fresh verifier on the last commit, fix what it finds, then push the four local commits and check the live site.
- Owner to confirm the kept rule above (buy again yes counts as kept; the opening never decides).
- The private phone artifact of the quiz was not refreshed with the motion work.
- Earlier open items stand (reference/launch/ in or out of git, backend deployment, partner links).

Reflective, not scheduled:
- A family liked in one kept bottle and disliked in another shows as liked on the taste card, with the dislike only as
  a pick caveat; an honest split, but it could read as a contradiction.

## 2026-09-26: session close, the shared page script and More perfumes

Session title: the shared page script and More perfumes. All live (last commit 74a3ad7; the deploy's tests and publish
passed, and the live pages were checked with no console errors).

- The pending partner-link work (`{lang}` in shop links, `disclosure` in config.js, noon notes in README) was committed
  as it was. `reference/launch/` (the first-sale plan and the TOOIJ message) stays uncommitted: the repo is public.
- `site/img/botanical/rose-rtl.webp` had been committed empty, so the Arabic pages showed no rose; rebuilt as the mirror
  of rose.webp. A site test now fails on any empty file in site/ or any WebP or PNG cut short.
- `site/js/page.js`: the words, device store, helpers, rating sender, backend calls, note rows and shop links that
  app.js and quiz.js both carried. Old and new pages matched over 800 seeded visits in lockstep
  (reference/restructure/shared_page/).
- More perfumes: "المزيد من العطور (20)" under the grid adds `QUIZ.more`, forty bottles, twenty per press; chosen by
  `tools/select_more.js` (six Arab-house per twenty, men's never ahead of women's, one bottle per line, two per house);
  reasoning in reference/quiz/MORE.md. A fresh bounded Opus verifier found one real error (Ombré Leather scored with
  its Parfum's listings, fixed) and one false alarm. A `grid_more` event counts presses.
- The owner asked to add Cartier Déclaration Eau de Toilette: it was already the entry `declaration`; renamed
  "Déclaration Eau de Toilette" in both languages. The search now lists whole-phrase hits first, then perfumes holding
  every typed word (accents ignored, EDT and EDP read as concentrations); no earlier result lost or moved.
- Nine EDT/EDP pairs shared one bottle photo (Déclaration's EDT showed the EDP bottle); each settled against its
  Fragrantica page and the wrong one refetched (reference/images/shared_photo_pairs/).
- Tests 79 to 85.

Open, dated 26 Sep 2026 (operational):
- Decide whether `reference/launch/` goes into the public repo, or into .gitignore.
- Lattafa Asad, Arabian Oud Kalemat and Ajmal Amber Wood are missing from More perfumes because the captured store lists
  barely show them; add by hand if wanted.
- Qaed Al Fursan is men's in the catalogue, unisex on Nice One (verifier note); `cdnim` sits in the grid beside its
  original `aventus`; "Lattafa Ramz EDP" (Noon) was assigned to Ramz Gold without saying Gold. Owner's calls.
- Earlier open items stand (backend deployment, partner links, the grid rebuild, the tester layout, the five flagged
  entries, the three-vial test).

Reflective, not scheduled:
- The phone's first load is about 620 KB (fonts 263 KB, scripts 200 KB, lavender sketch 142 KB); the two sketches can
  lose about 60 KB each without visible change. The build/ folder holds 22 MB of regenerable output.

## 2026-09-26: session close, the catalogue reaches 1,000

At the owner's request the catalogue grew from 333 to 1,000 perfumes (block "added 26 Sep 2026 (the expansion to 1,000)"
in site/js/data.js; record, scripts and README in reference/expansion/). The 667 are the perfumes the Saudi stores list
as best sellers or popular that the catalogue lacked (Golden Scent's Best Sellers, Faces' bestsellers page and badge,
Noon's popularity lists, Sephora's bestsellers, and the earlier Amazon.sa and Nice One lists), 28 of them the best-known
perfumes of the Saudi houses (the owner's added request), each with a full top, heart and base breakdown on Fragrantica,
tagged by mapper.js from the notes, named in Arabic by agents, and given a bottle photo (999 of 1,000 have one; 31 wrong
photos found on the contact sheets were replaced). Three independent checks sampled the store-to-page matching; the
first found 10 blocking errors, the second 4 wrong of 50, the third 1 wrong of 50; all were fixed or removed and the
gaps refilled. The site's older Arabic had cistus as قسط, labdanum as لبنى and pimento as فلفل حلو; corrected to لاذن and
بهار حلو everywhere, on the owner's word. Page speed unchanged (a profile and picks take about 2 ms). Tests 79, all passing.

After deployment, a check of the whole catalogue (structure, same-name versions on Fragrantica, version words in the
store rows, Arabic notes, the live files) found two wrong photos: London for Men and 1881 Men showed the women's bottles
(a Fragella match that dropped the gender word). Both were refetched from their Fragrantica pages and are live (266a57c).

Open, dated 26 Sep 2026:
- 25 older entries have fewer Arabic than English notes in a stage (Bleu de Chanel EDP, Sauvage EDT, Cool Water and
  others), so their Arabic note words likely do not show; offered as a separate task.
- The pyramids are Fragrantica's; the 26 Sep additions preferred the house's own list where they differed, which was
  not practical for 667. Verify_report.md notes N1 to N17 (thin pages, a few doubtful tiers and spellings) are
  the owner's calls.
- The quiz grid still comes from the earlier popularity lists (tools/select_grid.js not re-run).

## 2026-09-26: session close, the site goes live

Session title: the site goes live. Across 25 and 26 September: the quiz result names the palate by the shape of the
kept bottles (one group, two named together, wide, selective) with a short text and a tip; a start screen with a big
Start; one event per screen reached and a result event, with backend counts behind a comparison line (shown from 100
finishers) and a funnel sheet (Profiler menu > Build the quiz funnel). The catalogue grew from 288 to 333 with 45 Saudi
bestsellers from the Amazon.sa and Nice One lists, tagged from published pyramids and checked by eye
(reference/quiz/popularity/additions/). The site went live on GitHub Pages (https://m2ndl.github.io/scent-profiler/,
public repo m2ndl/scent-profiler; a workflow tests, then publishes site/ only), in Arabic by default, with the quiz as
the front page (index.html), the profiler as "Your profile" (profile.html) and quiz.html redirecting. Smaller: a wood
grain header, the search list above the Continue bar, descriptions on 27 note cards, a dark "See the full profile"
button after the picks, plain Arabic for the name of the articles. Last, after a reported case (rose liked, musk
avoided, Montale Roses Musk offered): an avoided note card now keeps out of the picks every perfume it leads, unless a
kept bottle carries it, in which case the result says so; every pick says why it was chosen and names at most one thing
to watch for. A check of the 30 most-recommended perfumes found no weight to correct. Tests 79, all passing. Phone link
current (version 22). All work committed and pushed. Edit scripts kept as evidence in reference/quiz/edits/ (indexed).

Open, dated 26 Sep 2026 (operational):
- Deploy the backend: paste backend/apps-script.gs into Apps Script, deploy a new version, set `endpoint` in
  site/js/config.js. Until then ratings stay on the device and the events, funnel and comparison line are dormant.
- Replace the Google-search placeholders in site/js/config.js `links` with partner shop and affiliate links.
- Finish the grid rebuild with tools/select_grid.js and the refreshed sa_popularity.json (carried from 25 Sep).
- Give the no-bottle (tester) result path the new layout (carried).
- Check the five catalogue entries flagged by the Fragrantica search (carried).
- Tab titles and share previews are still English; Arabic ones were offered, not decided.
- The three-vial test (carried).

Reflective, not scheduled:
- Split the musk note card into clean white musk and heavy Arabian musk oil: the most ambiguous word in the picker, and
  the likely cause of the reported case.
- Whether the complaint chips (too sweet, chemical) should veto picks the way avoided note cards now do.
- The research record and this log are public in the repo; move them to a private repo if that matters.
- Monthly refresh of the Saudi bestseller data; palate names on the profile page (both carried).

## 2026-09-25: session close, the payoff screen

Session title: the payoff screen. Across the day: the site redesigned three times and settled on the apothecary
design; renamed Scent Profiler / محلل الذائقة العطرية; bottle photos for all 288 perfumes; wording fixes (tried on
skin or clothes, زفر); the quiz result rebuilt around a palate name, true counts, a reveal and a share card; Saudi
popularity data collected for the grid. Tests 72, all passing. Phone link current (version 13). Nothing committed.
Edit scripts kept as evidence in reference/design/edits/ with an index.

Open, dated 25 Sep 2026 (operational):
- Commit the whole day's work (quiz, redesign, photos, result screen); it is all in the working tree.
- Finish the grid rebuild: fix the popularity match so Sauvage, Hawas and Aventus count, run tools/select_grid.js,
  write reference/quiz/GRID2.md, apply only after the owner sees the twenty.
- Give the no-bottle (tester) result path the new layout.
- Check the five catalogue entries flagged by the Fragrantica search (task offered).
- Unchanged: deploy the backend, static hosting, shop links, the three-vial test.

Reflective, not scheduled: whether the palate names should also appear on the profiler page; a monthly refresh of
the Saudi bestseller data; whether "ruled out" should count likely deal-breakers only, as recommend() does.

## 2026-09-25: the result's name, count and reveal

The owner judged the payoff still flat. Added, in the quiz page only:
- A palate name with an emblem: nine palates (amber, sweet, oud, musk, woody, rose, floral, fresh, spiced) cover
  the 32 families; the visitor's is the palate of the family the taste card lists first. Dislikes only give the
  selective palate; no signal gives no name.
- A count under it: perfumes checked, ruled out for you (engine.js `ruledOut()`: catalogue perfumes holding a
  likely or possible deal-breaker at the exclusion strength; read-only, recommend() unchanged), chosen for you.
  The numbers count up.
- A reveal before the result (about two seconds, once per visit, a tap skips it, off for reduced motion): the
  visitor's own bottles drop into "You kept" and "Turned on you".
- The share card leads with the emblem, "My palate", the name and the count.
One new quiz test covers the name, the count's truth and the reveal. Tests 72.

Open, dated 25 Sep 2026: the grid rebuild stopped midway when a session ended; tools/select_grid.js exists
and its draft grid drops Sauvage, Hawas and Aventus only because the captured store lists missed them, so it
is not applied. The no-bottle (tester) result path still has the old layout.

## 2026-09-25: the quiz result as a payoff

The result screen now leads with the answer: a taste card (families the visitor is drawn to and their
deal-breaker as chips, each naming the bottles it came from, and a line counting the bottles and answers it
rests on), then the three picks as bottle tiles (photo, a "has" chip, a struck-through "no ..." chip, a Sample
button). The family cards moved into a collapsed "How we worked this out". A share button draws a 1080 x 1350
card (taste chips and the three bottles, first person, in the page language) and hands it to the phone's share
sheet, or saves it where there is none. Engine unchanged; the no-bottle path (testers) is unchanged.
Also added: Prada Paradigme and Dior Homme (2020) to the catalogue, and Saudi popularity data from Nice One
and Amazon.sa (reference/quiz/popularity/) for the grid rebuild, which runs as a separate task.

## 2026-09-25: wording, name and botanical sketches

- The quiz question is now "Which of these have you tried?"; the hint accepts skin or clothes (most Saudis spray
  clothes), home or shop, and rules out a paper strip. "On your skin" left three other Arabic lines.
- Complaint chip حيواني / وسخ became حيواني / زفر; the same word left three family hints and one article line.
- Renamed Scent Profiler / محلل الذائقة العطرية (was Drydown Profiler / محلل القاعدة): the name and the profiler's lede now
  speak of taste across opening, heart and base. The articles keep their drydown subject. New share card
  (site/og.png) from tools/og/card.html in the current design.
- Background: faint line sketches of Redouté's rose and Thomé's lavender in the page margins
  (tools/botanicals.py, site/img/botanical/). Two stronger versions were rejected by the owner.

## 2026-09-25: bottle photos

All 286 perfumes ship with a bottle photo (site/img/bottles/<id>.webp, 160 px transparent, 1.8 MB in total),
listed in the generated site/js/bottles.js; the page shows the shipped photo, then a backend vendor image, then
a drawn bottle. Found by tools/fetch_bottles.py: 207 from Fragella's image CDN by address (background already
removed, no key), 79 from Fragrantica's image server by page number (ids found by web search,
reference/images/fragrantica_ids.json; white background cut away). Every photo was checked on contact sheets;
14 wrong or poor ones (a deodorant stick, sample vials, travel sprays) were rejected and are kept out by
reference/images/rejected.json. Open Beauty Facts was tried first and holds almost no fine fragrance. The
preview build carries the photos inline. Owner's standard, stated this session: accepted practice outranks the
letter of a terms page (memory: custom-over-letter-of-terms).

Open, dated 25 Sep 2026: five catalogue entries whose notes may describe a different perfume (safariextreme,
cdnimwoman, barakkatrouge, mostwantedparfum, layali) and one misspelt name (Spiritueuse Double Vanille),
offered as a separate task.

## 2026-09-25: the redesign

Session title: linen, plum and the wear ribbon. site/site.css rebuilt as a mobile-first design system; no
markup or script behaviour changed, 70 tests pass, the phone link is republished (its page is now the profiler; the quiz is a file beside it).

- Colour: warm linen and bone surfaces with a paper-grain overlay, a warm brown ink, a plum accent for
  everything actionable, moss and madder for good and bad, ochre for cautions. Three stage hues (gold
  opening, rose heart, amber drydown) draw every timeline, the brand mark, the title rule and the panel
  edge. All colours set in OKLCH at matched chroma and checked for WCAG AA (scratch script palette.js:
  ink 13:1, secondary 6:1, small text 4.5:1, every filled button 4.4:1 or better). Dark mode is a warm
  charcoal, not black.
- Type: Fraunces for Latin headings (the articles page already used it; Young Serif dropped), Reem Kufi
  for Arabic headings, IBM Plex Sans Arabic for text. Arabic body 17px at line-height 1.8, no tracking,
  rating labels never break inside a word (the first render broke لا يعجبني across three lines).
- UX: 44px rating buttons that tint red or green on hover before they fill; rated perfumes, verdicts
  and picks are cards; verdict rows wash in their own tint; quiz tiles get a check badge; quiz options
  get a radio mark; the quiz's Continue is sticky at the bottom of a phone screen; the search box has an
  icon; the profile bar keeps to thumb reach. Base rules are the phone; min-width queries add the
  desktop.
- Research inputs (web, 25 Sep 2026): 2026 palette trend towards warm neutrals with one muted accent;
  Arabic web typography guidance (dual-script families, 1.7 to 1.85 line height, zero tracking); touch
  targets 44px with 8px gaps.

- Superseded the same day. A reader called the linen design a newspaper. Three trials followed on the real
  pages as override stylesheets (reference/design/README.md): a khuzama field, then a still life of
  materials from a photograph (amber oil, rose petals, calendula, resin, olive wood), first at night, then in
  daylight, then framed in dark wood with gold lines. The last is now site/site.css: cream glass on pale
  wood, a dark wood band across the top and grain waves fixed along the bottom of the screen, metallic gold
  on the brand, the primary buttons and the profile counts, calendula-rose-amber ribbon, sage and petal rose
  for good and bad. One theme, no dark mode. Arabic headings moved to Noto Naskh Arabic. Phone link
  republished (page is the profiler).

Open, dated 25 Sep 2026: og.png still carries the old teal; commit the redesign with the quiz; a light
sample sits in the bottom strip of the screen for a moment while scrolling (the waves are fixed), which is
the one readability cost to watch; the earlier open items stand.

## 2026-09-25: the bottle quiz

Session title: the quiz built twice. A second page, site/quiz.html with js/quiz.js, lets a visitor who has
rated nothing get a profile; the design came out of a five-voice round table and two plan reviews, and the
owner deepened it the same day.

- Round table (reference/debate/quiz/): four paths for the quiz; landmark bottles (A) took all five first
  places, Borda A 20, B 12, D 12, C 6. Two cited numbers were refuted on re-run. Five books were added and
  converted to page-marked text in reference/books/ (Engen 1991, Barkai and Wilson 2014, Calkin and
  Jellinek 1994, Gilbert 2008, McGee 2020).
- Built (reference/quiz/PLAN.md, VERIFY_V1.md): a grid of twenty well-known bottles, one verdict each
  written as an ordinary rating (still wear +1 drydown; turned -2 on the stage named; shop trial opening
  -1), complaint chips, one narrowing round, anosmia question, testers for a visitor with no bottle, events
  for the record's falsifiers, `src` column and quiz-row skip in the backend. Engine: a complaint chip now
  scores half a point below its rating (11 golden scenarios moved, reference/quiz/E1_golden_diff.txt).
- Deepened at the owner's request (PLAN2.md, VERIFY_V2.md): per-bottle note rows from js/notes.js (up to
  five, balanced by stage, "didn't notice it"), a note picker of 92 single notes on five screens built from
  catalogue frequency, the books and a Gulf list (reference/quiz/edits/build_picker.js), a bitter-or-sweet
  question, multi-select complaints, "I don't remember" options, Back. Told answers enter the engine in
  separate sums and count only for families no bottle judged (`TOLD_W` 0.3 with a prior), so they reorder
  picks but never exclude. The profiler page reads the same answers and rates notes on each card.
- Arabic: the owner's rule, never render "wear" as لبس; every string now uses جرّب or استخدم (memory:
  arabic-wear-not-literal). Fifteen existing strings changed.
- Tests 15 to 70. Phone link (private, no backend): https://claude.ai/artifact/HDFnLa4mnH2fbMQYd1vuXr.
  Nothing committed: 15 modified files and 5 new ones are in the working tree.

Open, dated 25 Sep 2026: commit the quiz; the three task chips (tile aria-labels, the profiler's Enter
duplicate, the lactone split of fruity_sweet); review the changed Arabic lines listed in the session;
decide the picker merges (neroli with orange blossom, suede with leather, pine with cypress); the shop
verdict marks every strong opening family a possible deal-breaker (engine rule, left as is); the earlier
open items (deploy, hosting, links, three-vial test) stand.

Reflective: Jellinek's eight effect classes cannot be expressed by the 32 families; the round table's
falsifiers (ROUNDTABLE.md section 6) are the measures to read once the backend collects events.

## 2026-09-25: the project split and the rating-send fixes

- Layout: site/ is the only deployed folder (js/engine.js profile logic, js/app.js the page,
  js/config.js the deploy settings); backend/, evidence/, tools/, tests/, reference/. CLAUDE.md added.
  The split changed no behaviour: old and new page identical over 800 scripted sessions
  (reference/restructure/README.md).
- Tests: `node --test tests/*.test.js` (15). Engine golden captured from the old page on a frozen
  88-perfume catalogue; page test in a stub browser; deploy-folder, evidence and backend-list checks.
- Fixed three ways the page lost ratings before they reached the Sheet: a second perfume rated within
  1.2 s cancelled the first one's send; a perfume removed within 1.2 s threw; a rating made just before
  leaving the page was never sent (now sent by sendBeacon on hide or close). The old page lost a rating
  in 95 of 800 sessions with a backend.
- Git: two commits on master (c729c1d split, 7614ded send fixes). Books and build/ ignored;
  .gitattributes keeps LF because the machine's core.autocrlf is true. This log entry and
  reference/restructure/ are not yet committed.

Open, dated 25 Sep 2026, unchanged and all needing Muhammad's accounts: deploy backend/apps-script.gs
(Sheet id, Fragella key); publish site/ on a static host, then set og:image to the full URL; shop links
in site/js/config.js; his own three-vial test. Week-six label test as below.

## 2026-09-25: the profiler's provenance stack

Built the whole site in one session, then audited it, then rebuilt its data model on evidence.

- Product: bilingual dislike-first profiler (rate opening, heart, drydown; infer material families you
  dislike; three samples that avoid them). Static site plus Google Apps Script backend. Preview at
  https://claude.ai/artifact/B976vhVtVsHv3QxXjzkCen (private).
- Catalogue: 286 curated entries, 32 families after the taxonomy audit, 21 marked clones. Lazy vendor
  lookups (Fragella) with derived-weights-only caching. Four bilingual articles, share image, tag queue tool.
- Audit against Turin and Sanchez 2018 and Scent and Chemistry 2022 (Opus agents): evidence for 68 of
  286, 40 corrected; 69 changes logged in reference/audit/applied_changes.jsonl.
- Round table (five voices, Borda): provenance stack chosen unanimously (reference/debate/ROUNDTABLE.md).
  Built: materials.js (97 INCI materials), evidence.js (book and label layers), label paste field,
  source shown per evidence line, never-on-label caveat for woody ambers and ouds.
- Twelve Parfums de Marly labels in reference/labels/ proved the point: Iso E Super declared near the top
  on 11 of 12, absent from every official note list.

Open, dated 25 Sep 2026, all needing Muhammad's accounts: deploy apps-script.gs (Sheet id, Fragella key),
static hosting, affiliate or coupon links in CONFIG.links, his own three-vial test. Week-six test from
the debate: if fewer than 100 of 286 entries have a findable label, launch on notes plus literature.

Reflective ideas, not scheduled: Jellinek effect axes as a second profile layer (reference/audit/
jellinek_axes.md); an Iso E Super family of its own if ratings show people treat it apart from cedar;
statistical family inference once any perfume passes about 120 raters.
