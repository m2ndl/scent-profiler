"use strict";
/* Run the real quiz page (new tree or old tree) for stored ratings and quiz answers; return the result HTML and a digest. */
const fs = require("fs"), path = require("path");
const NEW = "C:/Users/malha/Desktop/Webapps/perfume-profiler";
const OLD = path.join(__dirname, "old");
function make(root) {
  const SITE = path.join(root, "site");
  const { createPage } = require(path.join(root, "tests/lib/dom"));
  const { loadSite } = require(path.join(root, "tools/lib/site"));
  const scriptsOf = file => [...fs.readFileSync(path.join(SITE, file), "utf8").matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => ({ filename: m[1], code: fs.readFileSync(path.join(SITE, m[1]), "utf8") }));
  const quizScripts = scriptsOf("index.html"), appScripts = scriptsOf("profile.html");
  const W = loadSite("data", "mapper", "materials", "evidence", "engine", "notes");
  const D = W.PP_DATA, E = W.PP_ENGINE.create(D, W.PP_MAP, W.PP_EVIDENCE), N = W.PP_NOTES.create(D, W.PP_MAP, E);
  function quiz(ratings, answers, lang) {
    answers = Object.assign({ taste: "unsure", told: [], anosmia: "no" }, answers || {});
    const p = createPage({ localStorage: { pp_device: JSON.stringify("d"), pp_lang: JSON.stringify(lang || "en"), pp_ratings_v1: JSON.stringify(ratings), pp_quiz_v1: JSON.stringify(answers) } });
    p.load(quizScripts);
    const html = () => p.snapshot().els.quiz.innerHTML;
    p.click({ dataset: { start: "1" } });
    p.click({ dataset: { none: "1" } });
    for (let i = 0; i < 6 && /data-pn=/.test(html()); i++) p.click({ dataset: { continue: "1" } });
    p.click({ dataset: { taste: answers.taste } });
    p.click({ dataset: { continue: "1" } });
    p.click({ dataset: { anosmia: answers.anosmia } });
    return { html: html(), page: p };
  }
  function profile(ratings, answers, lang) {
    const p = createPage({ localStorage: { pp_device: JSON.stringify("d"), pp_lang: JSON.stringify(lang || "en"), pp_ratings_v1: JSON.stringify(ratings), pp_quiz_v1: JSON.stringify(answers || {}) } });
    p.load(appScripts);
    const els = p.snapshot().els;
    return { profile: els.profile ? els.profile.innerHTML : "", recs: els.recs ? els.recs.innerHTML : "", panel: els.panel ? els.panel.innerHTML : "", page: p };
  }
  return { D, E, N, quiz, profile };
}
const strip = s => s.replace(/<svg[^]*?<\/svg>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
function digest(h) {
  const o = {};
  o.palate = (/<h1>([^<]*)<\/h1>/.exec(h) || [])[1];
  o.qpal = strip((/<p class="qpal">([^]*?)<\/p>/.exec(h) || ["", ""])[1]);
  o.good = strip((/<div class="qtaste-row good">([^]*?)<\/div><\/div>/.exec(h) || ["", ""])[1]);
  o.bad = strip((/<div class="qtaste-row bad">([^]*?)<\/div><\/div>/.exec(h) || ["", ""])[1]);
  o.note = strip((/<p class="qtaste-note">([^]*?)<\/p>/.exec(h) || ["", ""])[1]);
  o.picks = [...h.matchAll(/<div class="rec qpick">([^]*?)<div class="qpick-links">/g)].map(m => strip(m[1]));
  o.how = [...h.matchAll(/<div class="verdict [^"]*">([^]*?)<\/div><\/div>/g)].map(m => strip(m[1]));
  o.petals = [...h.matchAll(/class="qpet( trace)?[^"]*"[^>]*fill="url\(#qp-(\w+)\)"/g)].map(m => m[2] + (m[1] ? "(trace)" : ""));
  return o;
}
module.exports = { make, NEW, OLD, digest, strip };
