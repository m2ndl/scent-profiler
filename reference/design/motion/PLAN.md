# The quiz in motion: plan

Owner's brief (27 Sep 2026): make the quiz screens interactive and striking, at the level of the best designed sites.
The apothecary design stays (cream glass on pale wood, dark wood and gold as accents, Fraunces and Noto Naskh Arabic);
this work adds motion, touch and a few new visual pieces, all drawn from the visitor's own answers.

## Rules that bind the work

- Owner's taste (memory owner-design-taste): perfume, not print; dark and gold as accents; decoration never over text;
  one unmistakable call to action, never two buttons in one sticky bar; honest numbers, no fake pause.
- Behaviour, events, storage and the engine do not change. `node --test tests/*.test.js` passes; markup the tests
  read stays as it is, and every change to a test is a deliberate one named in the diff.
- Arabic is the first language: every motion mirrors in RTL, text is never split into letters, new Arabic words
  are checked for calques and for the root ل-ب-س.
- Reduced motion, a browser without view transitions, and the Node stub all get the plain page: the screen is redrawn.

## Engineering

`site/js/motion.js` (window.PP_MOTION), loaded before quiz.js on the front page only:
- `paint(host, html, {key, dir, after})`: a new screen (key changed) runs as a view transition; the quiz column
  slides and fades by direction (forward, back, fade for a language switch), mirrored in Arabic; elements carrying the
  same `data-vt` on both screens (a bottle) fly from one place to the other. The same screen (key unchanged) is
  patched in place, keeping its elements, so a pressed option animates and keyboard focus stays.
- `patch(el, html)`: the in-place patch for the grid's tiles, More button and dock.
- `pick(button, on, id)`: gold mist from the bottle's top, a light tap on phones, the bottle's flight to the dock.
- `tap`, `chosen`: a soft light where the finger lands; the chosen option held in the outgoing picture.
- `whenSeen(el, fn)`: the counts count up when they come into view.

## Screens

- Header: on every screen after the start the wood band is compact (brand and language on one line; the nav links
  stay on the result and on wide screens). A progress line in four quarters runs along its gold edge.
- Start: the five bottles stand on a glass shelf with reflections and float; Start carries a light sweep. On Start
  the five bottles fly into their places on the grid.
- Grid: tiles lift and glow when picked, a check pops, gold mist rises from the bottle and the bottle flies into the
  dock. The dock is one button: "None of these" until a bottle is picked, then gold "Continue with n" holding the
  picked bottles.
- Bottle screens: the bottle stands on a lit plinth with one dot per bottle (coloured by its verdict); verdicts carry
  icons and their own colour; "When did it bother you?" is the wear ribbon, first minutes to hours later, filling to
  the moment chosen. The bottle stays in place from its verdict to its notes.
- Narrowing: tiles as on the grid; "None of these, or I don't know them" below the tiles; Continue alone in the dock.
- Note picker: each of the five screens has its own hue and drawn mark; a card turns sage when enjoyed, rose when
  avoided; "Not sure" stays quiet.
- Sweet or bitter: two tall cards side by side, then "Both" and "I don't know".
- Complaints: a two-column grid with a drawn mark each; Anosmia: three pills in a row.
- Result: the palate name, then its wheel: nine kinds of perfume around the emblem; a petal grows for each kind the
  kept bottles lean to (a short petal for a kind with a liked family but no bottle of its own), a mark for a
  deal-breaker. Tapping a kind names the families behind it. The counts gain bars (share of the catalogue) and count up
  when seen; the picks are numbered.

## Checks

1. Tests, with the script-list test naming motion.js, and new tests for the markup that is new.
2. In Chromium (Playwright): every screen at 390 and 1200 px, English and Arabic, no console errors.
3. Lockstep: a patched page and a plainly redrawn page (`window.PP_MOTION_OFF`) walked through the same drawn buttons,
   their quiz columns compared with isEqualNode after every step.
4. A fresh Opus verifier reads the diff and the renders; its findings are fixed.
