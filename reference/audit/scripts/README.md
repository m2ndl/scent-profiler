# Audit and debate scripts (evidence, not tools)

One-off scripts the audit and round-table agents wrote on 25 September 2026. They are kept so the
findings in ../tags_part*.json, ../taxonomy_audit.md and ../../debate/ can be traced; they are not
maintained and are not meant to be re-run.

- parse.py, match.py, mentions.py, hits.py, kw.py, sc.py, sc2.py, ctx.py, show.py: locate perfume
  reviews and material passages in ../../books/*.txt (Guide 2018 and Scent and Chemistry).
- build_tags4.py, build.py: assembled tags_part4.json and the taxonomy JSON from the agents' notes.
- mapper_vs_audit.js: the round-table test that the note mapper reproduces 8 of 69 book corrections.
- vendor_test.js, arab_cov.js: Fragella field check and Arab-house coverage count for the debate.
- ../build_jellinek_mapping.py: produced ../jellinek_mapping.json.
- p2_rv.py, p2_build.py: part 2 audit review finder and assembler. tax_build_proposed.py, tax_kwic.py: taxonomy audit keyword-in-context and JSON builder.

Their paths follow the layout they ran in: data.js, mapper.js and evidence.js at the project root (now
site/js/), labels and applied_changes.jsonl under reference/ (now evidence/).
