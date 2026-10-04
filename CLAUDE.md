# Wayfarer's Tavern: notes for Claude sessions

A static browser game (GitHub Pages, no build step). Read only what the task needs:

1. `docs/STATUS.md`: what's built, what's next, known issues. Always read.
2. `docs/CONVENTIONS.md`: code rules. Always read.
3. `docs/DESIGN.md`: the full design. Read only the sections the task touches.

Work rules:
- Edit only the files the task needs; prefer targeted edits over rewrites.
- Run `node tools/smoke.mjs` before committing logic changes.
- Update `docs/STATUS.md` at the end of every session.
