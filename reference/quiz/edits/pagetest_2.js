
/* The quiz and the profiler on one device: the quiz's word answers reach the profiler as the same told items. */
const quizSeed = extra => Object.assign({ pp_device: JSON.stringify("d_test"), pp_lang: JSON.stringify("en") }, extra || {});
const picksOf = h => [...h.matchAll(/<div class="rec">[^]*?<b>([^<]+)<\/b>/g)].map(m => m[1]);
/* the quiz from its picker to the result, every card left as it is */
function quizToEnd(q, o) {
  o = Object.assign({ taste: "unsure", told: ["unsure"] }, o);
  const at = () => q.snapshot().els.quiz.innerHTML;
  if (/data-skip="1"/.test(at())) q.click({ dataset: { skip: "1" } });
  for (let i = 0; i < 4 && /data-pn=/.test(at()); i++) q.click({ dataset: { continue: "1" } });
  q.click({ dataset: { taste: o.taste } });
  for (const c of o.told) q.click({ dataset: { told: c } });
  q.click({ dataset: { continue: "1" } });
  q.click({ dataset: { anosmia: "no" } });
  return at();
}

test("the profiler, loaded with the quiz's storage, gives the quiz's picks and uses its answers", () => {
  const q = createPage({ localStorage: quizSeed() });
  q.load(quizScripts);
  q.click({ dataset: { tile: "sauvageedp" } });
  q.click({ dataset: { tile: "yara" } });
  q.click({ dataset: { continue: "1" } });
  q.click({ dataset: { verdict: "turned" } });
  q.click({ dataset: { continue: "1" } });
  q.click({ dataset: { na: "citrus_fresh", v: "-2" } });
  q.click({ dataset: { na: "woody_amber", v: "u" } });
  q.click({ dataset: { continue: "1" } });
  q.click({ dataset: { verdict: "still" } });
  q.click({ dataset: { continue: "1" } });
  if (/data-skip="1"/.test(q.snapshot().els.quiz.innerHTML)) q.click({ dataset: { skip: "1" } });
  q.click({ dataset: { pn: "lemon", pv: "1" } });
  q.click({ dataset: { continue: "1" } });
  q.click({ dataset: { pn: "peach", pv: "-1" } });
  const qh = quizToEnd(q, { taste: "bitter", told: ["sweet"] });
  assert.equal(picksOf(qh).length, 3);

  const page = createPage({ localStorage: q.localStorage.dump() });
  page.load(scripts);
  const els = page.snapshot().els;
  assert.deepEqual(picksOf(els.recs.innerHTML), picksOf(qh));
  assert.equal(els["recs-h"].textContent, "Three to try next");
  assert.match(els.profile.innerHTML, /<p class="hint"><a href="quiz\.html">Also uses 4 answers from the quiz\.<\/a><\/p>/);
  assert.match(els.profile.innerHTML, new RegExp(`${esc(E.byId.sauvageedp.name)}, opening: you hated the bergamot<`), "the evidence line names the note");
});

test("every rated card has a Rate its notes block that writes noteAnswers and unnoticed, and resends the rating", () => {
  const page = createPage({ localStorage: seed(), endpoint: "http://mock.local/api", respond: () => ({ ok: true }) });
  page.load(scripts);
  const rated = page.snapshot().els.rated.innerHTML;
  for (const id of Object.keys(ratings)) assert.match(rated, new RegExp(`<details class="nbox" data-nbox="${id}"><summary>Rate its notes</summary>`));
  const id = hated[0], P = E.byId[id], rows = N.questions(P, "worn");
  assert.equal((rated.match(new RegExp(`data-nid="${id}" data-v="-2"`, "g")) || []).length, rows.length, "one row per question");
  const a = rows.find(r => r.f === "woody_amber"), b = rows.find(r => r.f !== "woody_amber");
  page.click({ dataset: { na: a.f, nid: id, v: "-2" } });
  page.click({ dataset: { na: b.f, nid: id, v: "u" } });
  const r = stored(page)[id];
  assert.deepEqual(r.noteAnswers, { [a.f]: -2 });
  assert.deepEqual(r.unnoticed, [b.f]);
  const els = page.snapshot().els;
  assert.match(els.rated.innerHTML, new RegExp(`<details class="nbox" data-nbox="${id}" open><summary>Rate its notes <span class="ncount">2/${rows.length}</span>`));
  assert.match(els.rated.innerHTML, new RegExp(`<span class="npick">Hated it</span><button type="button" class="qlink" data-nedit="${a.f}" data-nid="${id}">Change</button>`));
  page.flushTimers();
  const sent = page.calls.filter(c => c.body && c.body.type === "rating").pop().body;
  assert.deepEqual([sent.perfume, sent.noteAnswers, sent.unnoticed], [id, { [a.f]: -2 }, [b.f]]);
  const words = a.words.en.length > 1 ? a.words.en.slice(0, -1).join(", ") + " and " + a.words.en[a.words.en.length - 1] : a.words.en[0] || FAMILIES[a.f].en[0].toLowerCase() + FAMILIES[a.f].en.slice(1);
  assert.match(els.profile.innerHTML, new RegExp(`${esc(P.name)}, drydown: you hated the ${words.replace(/[()]/g, "\\$&")}<`), "the evidence line names the note");
  /* the same answer again clears it */
  page.click({ dataset: { nedit: a.f, nid: id } });
  page.click({ dataset: { na: a.f, nid: id, v: "-2" } });
  assert.equal("noteAnswers" in stored(page)[id], false);
});

test("with no rated perfume and an enjoyed note in the quiz, the profiler shows the quiz's heading and picks", () => {
  const answers = { notes: { lemon: 1, musk: -1 } };
  const q = createPage({ localStorage: quizSeed({ pp_quiz_v1: JSON.stringify(answers) }) });
  q.load(quizScripts);
  q.click({ dataset: { none: "1" } });
  const qh = quizToEnd(q);
  assert.match(qh, /<h1>Based only on what you told us<\/h1>/);

  const page = createPage({ localStorage: q.localStorage.dump() });
  page.load(scripts);
  const els = page.snapshot().els;
  assert.equal(els["recs-h"].textContent, "Based only on what you told us");
  assert.equal(picksOf(els.recs.innerHTML).length, 3);
  assert.deepEqual(picksOf(els.recs.innerHTML), picksOf(qh).slice(0, 3));
  assert.match(els.profile.innerHTML, /Also uses 2 answers from the quiz\./);
  /* a pick holding a family the visitor said they avoid says so */
  const { picks } = E.recommend(E.computeProfile({ ratings: {}, auto: {}, images: {}, told: N.toldItems(answers) }), {});
  const risk = picks.map(p => p.risks.slice().sort((x, y) => y.sev - x.sev)[0]).find(x => x && x.kind === "told");
  assert.ok(risk, "a pick's main risk is a family the visitor avoids");
  const stage = { opening: "opening", heart: "heart", drydown: "drydown" }[risk.s];
  assert.match(els.recs.innerHTML, new RegExp(`Contains ${esc(FAMILIES[risk.f].en).replace(/[()]/g, "\\$&")} in the ${stage}, which you said you avoid\\.`));
});
