/* One-off: README paths and sections for the new layout, and the golden-update flag in the engine test.
   Exact matches, each must occur once. Not meant to be re-run. */
"use strict";
const fs = require("fs"), path = require("path");
const P = "C:/Users/malha/Desktop/Webapps/perfume-profiler";
function patch(f, pairs) {
  const file = path.join(P, f);
  let s = fs.readFileSync(file, "utf8");
  for (const [from, to] of pairs) { const n = s.split(from).length - 1; if (n !== 1) throw new Error(f + ": found " + n + ": " + from.slice(0, 80)); s = s.replace(from, () => to); }
  fs.writeFileSync(file, s); console.log("patched", f);
}

patch("tests/engine.test.js", [
  ["   After an intended engine change, review the diff and rewrite the golden:\n     UPDATE_GOLDEN=1 node --test tests/engine.test.js */",
   "   After an intended engine change, rewrite the golden and review its diff before committing:\n     node tests/engine.test.js --update */"],
  ["if (process.env.UPDATE_GOLDEN) fs.writeFileSync(", "if (process.argv.includes(\"--update\")) fs.writeFileSync("]
]);

patch("README.md", [
  ["## Files\n\n| File | Purpose |\n|---|---|\n| `index.html` | The whole app: UI, profile engine, storage adapter. Edit `CONFIG` near the top of the script. |\n| `site.css` | Shared styles",
   "## Layout\n\n`site/` is the website and the only folder that is deployed. Everything else builds, tests or documents it.\n\n| Path | Purpose |\n|---|---|\n| `site/index.html` | The profiler page. Markup only; its scripts are in `site/js/`. |\n| `site/site.css` | Shared styles"],
  ["| `articles.html` | Four bilingual pieces", "| `site/articles.html` | Four bilingual pieces"],
  ["| `data.js` | Verified catalogue",
   "| `site/og.png` | Share image for WhatsApp, Snapchat and X previews. |\n| `site/js/config.js` | Deployment settings: backend URL and shop links. The one file to edit when the site goes live. |\n| `site/js/data.js` | Verified catalogue"],
  ["| `mapper.js` | Note-to-family mapper: turns any published note pyramid into families at confidence 1 (about 380 rules plus accord floors). |\n" +
   "| `tools/tag_queue.js` | Reads the ratings and catalogue CSV exports and prints the unverified perfumes people rated, by demand, with a data.js stub for each. |\n" +
   "| `og.png` | Share image for WhatsApp, Snapchat and X previews. |\n" +
   "| `apps-script.gs` | Google Sheets backend: anonymous ratings, tag corrections, community stats, and the lazy catalogue (on-demand lookups through the Fragella API, cached for everyone). Includes `enrichVerified()` for bottle images. |\n" +
   "| `mock_backend.py` | Local stand-in for the backend with a three-perfume fixture, for testing without Google or an API key. |\n" +
   "| `build_artifact.py` | Produces `artifact/` for the claude.ai Artifact host (preview only; that host blocks outbound requests and outside images). |",
   "| `site/js/mapper.js` | Note-to-family mapper: turns any published note pyramid into families at confidence 1 (about 380 rules plus accord floors). |\n" +
   "| `site/js/materials.js` | Ingredient-list reader: 97 label materials with families and volatility classes (see Provenance). |\n" +
   "| `site/js/evidence.js` | Generated from `evidence/` by `tools/build_evidence.js`: the book and label layers. Never edited by hand. |\n" +
   "| `site/js/engine.js` | Profile engine: evidence merge, profile, recommendations, the one-sample suggestion. No page code, so tests and tools run the same engine under Node. |\n" +
   "| `site/js/app.js` | The page itself: language, rendering, storage on the device, backend calls, clicks. |\n" +
   "| `backend/apps-script.gs` | Google Sheets backend: anonymous ratings, tag corrections, community stats, and the lazy catalogue (on-demand lookups through the Fragella API, cached for everyone). Includes `enrichVerified()` for bottle images; its `VERIFIED` list is written by `tools/sync_backend.js`. |\n" +
   "| `evidence/` | Inputs to `site/js/evidence.js`: `labels/<id>.txt` (ingredient lists) and `applied_changes.jsonl` (every tag change, with its quote and source). |\n" +
   "| `tools/tag_queue.js` | Reads the ratings and catalogue CSV exports and prints the unverified perfumes people rated, by demand, with a data.js stub for each. |\n" +
   "| `tools/sync_backend.js` | Rewrites the backend's `VERIFIED` list from `site/js/data.js`; `--check` reports whether it is current. |\n" +
   "| `tools/mock_backend.py` | Local stand-in for the backend with a three-perfume fixture, for testing without Google or an API key. Serves `site/`. |\n" +
   "| `tools/build_artifact.py` | Produces `build/artifact/` for the claude.ai Artifact host (preview only; that host blocks outbound requests and outside images). |\n" +
   "| `tools/lib/site.js` | Loads the site scripts into Node the way the page does; every tool and test reads the catalogue through it. |\n" +
   "| `tests/` | `node --test tests/*.test.js`; see Tests. |\n" +
   "| `reference/` | Research record: the books (kept out of git), the tag audit, the round table. Never deployed; only `tools/apply_audit.js` reads from it. |\n" +
   "| `build/` | Generated output, kept out of git. |"],
  ["1. **curated** (data.js): the note list read by a person", "1. **curated** (site/js/data.js): the note list read by a person"],
  ["Files: `materials.js` (97 materials with families and volatility classes), `evidence.js` (generated:\nbook layer from reference/audit/applied_changes.jsonl, label layer from reference/labels/*.txt),\n`tools/build_evidence.js` (regenerates evidence.js), `tools/apply_audit.js`, `tools/split_families.js`.\nTo add a label: create reference/labels/<id>.txt with",
   "Files: `site/js/materials.js` (97 materials with families and volatility classes), `site/js/evidence.js` (generated:\nbook layer from evidence/applied_changes.jsonl, label layer from evidence/labels/*.txt),\n`tools/build_evidence.js` (regenerates evidence.js), `tools/apply_audit.js`, `tools/split_families.js`.\nTo add a label: create evidence/labels/<id>.txt with"],
  ["1. **Verified** (`data.js`): hand-tagged", "1. **Verified** (`site/js/data.js`): hand-tagged"],
  ["The backend looks each one up once in Fragella, stores its note pyramid and image, and the page maps notes to families at confidence 1.",
   "The backend looks each one up once in Fragella, the page maps its notes to families at confidence 1, and the backend keeps only those family weights and the image."],
  ["Promote an entry to verified by adding it to `data.js` with the same id.", "Promote an entry to verified by adding it to `site/js/data.js` with the same id, then run `node tools/sync_backend.js`."],
  ["```\npython mock_backend.py 8765\n```\nthen open `http://localhost:8765/?endpoint=http://localhost:8765/api`. The `endpoint` override works only on localhost. Without a backend, open `index.html` from any static server; ratings persist in that browser's localStorage.",
   "```\npython tools/mock_backend.py 8765\n```\nthen open `http://localhost:8765/?endpoint=http://localhost:8765/api`. The `endpoint` override works only on localhost. Without a backend, serve `site/` from any static server; ratings persist in that browser's localStorage.\n\n" +
   "## Tests\n\n```\nnode --test tests/*.test.js\n```\n" +
   "- `engine.test.js`: 60 seeded rating sets on a frozen 88-perfume catalogue (`tests/fixtures/`) must give the stored profiles, recommendations and one-sample suggestions, and the recommendation rules below must hold. Catalogue edits do not affect it. After an intended engine change, run `node tests/engine.test.js --update` and review the diff of `tests/fixtures/engine_golden.json`.\n" +
   "- `page.test.js`: the page, run in a stub browser, shows what the engine computes, handles clicks, and with a backend never sends the vendor's note lists back.\n" +
   "- `site.test.js`: `site/` holds only web files and every link in it resolves inside it; `evidence.js` and the backend's `VERIFIED` list are current; every family and perfume reference resolves."],
  ["Any static host works: GitHub Pages, Cloudflare Pages, Netlify. Upload `index.html` and `data.js`.",
   "Any static host works: GitHub Pages, Cloudflare Pages, Netlify. Publish the `site/` folder and nothing else (set it as the publish directory, or upload its contents). Set `endpoint` and `links` in `site/js/config.js` first. After the first deploy, change `og:image` in `site/index.html` to the image's full URL: most share previews ignore a relative path."],
  ["Follow the steps at the top of `apps-script.gs`, then paste the web-app URL into\n`CONFIG.endpoint` in `index.html`.", "Follow the steps at the top of `backend/apps-script.gs`, then paste the web-app URL into\n`endpoint` in `site/js/config.js`."],
  ["`CONFIG.links` holds three URL templates", "`links` in `site/js/config.js` holds three URL templates"],
  ["## How the profile is computed\n", "## How the profile is computed\n\nThe rules below are implemented in `site/js/engine.js`.\n"],
  ["Each entry: `p(id, house, name, arabicName, gender, tier, confidence, opening, heart, drydown, notes)`.", "Each entry in `site/js/data.js`: `p(id, house, name, arabicName, gender, tier, confidence, opening, heart, drydown, notes)`."],
  ["Prefer fewer families with honest weights over long lists.\n", "Prefer fewer families with honest weights over long lists. After editing, run `node tools/sync_backend.js`\nand the tests.\n"]
]);
