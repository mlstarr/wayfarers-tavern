# Status

Last updated: 2026-10-04 (M1 complete)

## Built (M1: core loop)
- Seeded RNG (`js/rng.js`), versioned save with export/import (`js/state.js`).
- Adventurer generation: 6 ancestries, 8 classes with perks, 4d6-drop-lowest stats, backgrounds, 19 quirks with real effects, 5 rarities, epithets for epic and legendary.
- Leveling (XP table to level 10, HP on level-up). Feats and class features are not in yet.
- Quest board: 5 postings, refreshes every 6 hours (local time), never repeats a quest type on one board; 8 quest templates, 20 encounters, 6 monsters, tiers gated by renown (10 for Risky, 40 for Deadly).
- Resolution at send time: skill checks, group checks, combat rounds; advantage and disadvantage from quirks and perks; luck rerolls, bard inspiration, cleric healing, fighter second wind, sneak attack, smite, rage.
- Outcomes: triumph, success, costly, failure, disaster. Losing a finale fight caps the outcome at costly.
- Reports: animated reveal, every roll visible, story lines from templates, archive of the last 25.
- Bar: 3 recruits a day, hire cost by rarity, roster cap 8, dismiss.
- Resting: idle adventurers regain 10% max HP per 30 minutes; need half HP to quest.
- Offline catch-up from timestamps. Tab badge and page title show waiting reports.
- UI: parchment cards with rarity borders, procedural heraldic shields as placeholder art, mobile-first with a desktop layout.

## How to test
- `node tools/smoke.mjs`: logic checks plus an outcome table by party level and tier.
- Open the game with `?fast` so a 15-minute quest takes 15 seconds.

## Known limitations (by design for M1)
- Nobody dies yet: a fallen adventurer comes home at 1 HP. Death, Hall of Heroes and Casual mode are M2.
- No gold sinks beyond hiring; gold piles up until the inn upgrades (M3).
- No early recall of a party.
- Pronouns are rolled but not used in text, since first names and pronouns are rolled separately. Report text avoids pronouns.

## Next (M2: roster depth)
1. Death on a failed quest with risk shown on the board; Hall of Heroes; Casual mode toggle at new game.
2. Injuries and scars as lasting traits.
3. Relationships: friendships and rivalries from questing together.
4. Feats or class features at levels 4 and 8.
5. Adventurer detail polish (history filters, rename).
