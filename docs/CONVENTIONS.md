# Code conventions

## Stack
- Plain HTML, CSS and JavaScript ES modules. No framework, no bundler, no build step.
- `index.html` at the repo root is the entry point; GitHub Pages serves the repo as-is.
- Game content lives in `data/` as JS modules exporting plain objects (not JSON, so the game also runs from a local file server without fetch issues).

## Layout
- `js/*.js`: game logic. **Never touches the DOM.** Must run in Node (the smoke test imports it).
- `js/ui/*.js`: one file per screen plus shared components. Reads state, calls logic, renders.
- `js/main.js`: boot, tick loop, actions, tab routing.
- `data/*.js`: content tables (classes, quirks, encounters, quests, text templates).
- `tools/smoke.mjs`: Node smoke test and balance check for the logic layer.

## Rules
- Keep every file under about 400 lines. Split before it grows past that.
- All randomness goes through `js/rng.js` (`Rng`, seeded mulberry32). The only `Math.random` call is `newSeed()` at new game.
- Quest outcomes are rolled at send time from a seed and stored; the timer only reveals them.
- Game state is one plain JSON-serializable object. Only `js/state.js` reads or writes localStorage.
- Changing the state shape: bump `SAVE_VERSION` in `js/state.js` and add a migration.
- Time: use `Date.now()` and `MIN` from `js/config.js` (one game-minute in ms). `?fast` in the URL makes a game-minute last one real second, for testing.
- New content (an encounter, quirk, quest) should be a data-file edit wherever possible.
- UI text: sentence case, plain words, no "please"/"successfully".

## Legal (the game may be sold)
- Mechanics come from the 5e SRD under CC-BY-4.0; keep the credit in `README.md` and the in-game credits.
- Never use "Dungeons & Dragons", its settings, or its product-identity monsters (beholder, mind flayer, owlbear, displacer beast, etc.).
- All art and text must be original or licensed for commercial use.

## Session workflow
1. Read `docs/STATUS.md` and this file.
2. Make targeted changes to the named files.
3. Run `node tools/smoke.mjs`.
4. Update `docs/STATUS.md`, commit with a clear message, push.
