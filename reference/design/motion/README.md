# The quiz in motion

- `PLAN.md`: what was built and the rules it keeps.
- `lockstep.js`: the check that the in-place patch (site/js/motion.js) draws exactly what a plain redraw draws. It
  walks the shipped page and the same page with `window.PP_MOTION_OFF` through the same drawn buttons and compares the
  quiz columns with isEqualNode after every step; one walk loses four bottle photos so the drawn-bottle fallback is
  patched too. To run it: start the mock backend (launch config `site-mock-backend`, port 8765), copy the file into
  `.playwright-mcp/` and run it with the Playwright MCP's `browser_run_code_unsafe` (`filename`). On 27 Sep 2026 five
  walks of 70 steps, English and Arabic, reached every screen with no difference; a planted defect (stale attributes
  never removed) was caught at the first step.
