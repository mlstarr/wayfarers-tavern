# Status

Last updated: 2026-10-04 (stories, tavern progression, penalties)

## Built
**M1 core loop**
- Seeded RNG, versioned save (now v2, with a v1 migration) and export/import.
- Adventurers: 6 ancestries, 8 classes with perks, 4d6-drop-lowest stats, backgrounds, 19 quirks with effects, 5 rarities.
- Resolution: skill checks, group checks, combat rounds, advantage and disadvantage, luck, inspiration, healing, second wind, sneak attack, smite, rage. Outcomes from triumph to disaster.
- Reports with every roll visible; bar recruits; resting; offline catch-up; card UI with heraldic shields.

**Depth update (from playtest feedback: too little to do, no connection to heroes, waits too long)**
- **Timing:** Easy 2 to 10 min, Risky 12 to 60, Deadly 1 to 4 h, Expeditions 6 to 12 h (1.5x rewards). More encounters means longer. Rest is 10% HP per 10 min.
- **Rolling board:** 6 postings, each expires after 4 to 8 h; taken or expired postings are replaced 20 min later. At most one expedition up at a time.
- **Dispatches** (`data/dispatches.js`, `js/dispatch.js`): quests of 5+ min get a messenger partway through (2 on quests of 3+ h) with a choice; unanswered, the party takes the default. Resolution now runs at return time from the seed fixed at send, applying the choices.
- **Conditions and supplies** (`data/supplies.js`): quests roll conditions (night, rain, cold, cursed ground, venom, long road, fears fire); supplies counter them. Shop in the Bar tab; packing in the party picker; potions auto-drink and unused ones come home. Picker odds include conditions, bonds and buffs.
- **Tavern scenes** (`data/scenes.js`, `js/scenes.js`): every 90 min of game time, idle heroes may start a scene with 2 to 3 choices (gold, loyalty, bonds, buffs, XP, d20 checks).
- **Personal goals** (`data/goals.js`, `js/goals.js`): each hero has one (avenge, earn gold, triumphs, a quest, natural 20s, a friend, a level). Finishing gives +2 to main ability and +2 loyalty, then a new goal. Vengeance dispatches appear when a hero's nemesis is the finale foe.
- **Loyalty:** 0 to 5 hearts; at 5 the hero is devoted (+1 to every roll).
- **Bonds** (`js/bonds.js`): questing together, triumphs and heals build bonds; friends +1, sworn +2, rivals -1 to rolls when in the same party.
- **Talents** (`data/talents.js`, `js/talents.js`): every level-up offers a choice of two (one class, one general). Roster tab shows a dot when a choice is waiting.

**Early-game pacing** (`js/pace.js`, `PACE_STAGES` in config.js)
- Quest lengths, posting refills, resting and scene timing scale with quests sent: x0.12 for the first 3, x0.3 to 7, x0.6 to 14, full from 15.
- The first jobs take about 30 seconds, have no conditions, and still bring a messenger so the player learns dispatches in their first minute. Expeditions appear from stage 2.
- The first scene is guaranteed right after the first report.
- Measured in a browser without `?fast`: first messenger at 22 s, party back at 31 s.

**Stories, tavern progression and penalties** (save v3)
- **Story arcs** (`data/arcs.js`, `js/stories.js`): 8 arcs. Each hero gets one (biased to background, no duplicates): an introduction right away, parts 1 to 3 after 1, 3 and 5 quests, then a personal quest posted on the board that the hero must lead. Success grants a legacy trait, an epithet and fulfils the current goal; failure re-posts it and costs loyalty. Story text uses singular "they" for heroes.
- **Tavern rank** (`data/tavern.js`, `js/tavern.js`): renown sets rank (5 ranks); each rank gives gold, beds and harder quest tiers. Renown lost to failure never drops below the current rank.
- **Rooms** (Rooms tab): taproom (ale income while away, 8 h cap), bunkhouse, infirmary, kitchen, armory, map room, training yard, chapel. Bonuses are snapshotted into each quest at send.
- **Penalties** (`data/penalties.js`): heroes who fall get a lasting injury (healed by time or the herbalist); disasters may injure others. Fatigue +1 per quest (+2 expedition): tired -1, exhausted -2, fades with rest. Failure and disaster cost renown by tier. Daily wages at local midnight, at most 2 missed paydays charged; an empty chest costs everyone loyalty and heroes at 0 quit (never while questing). Contracts: deposit up front, 1.8x pay, deposit lost on failure.

## How to test
- `node tools/smoke.mjs`: plays 80 quests through every system, checks save round-trip, v1 migration, determinism, and prints the balance table.
- Open with `?fast` so game-minutes pass in seconds.

## Known limitations
- Nobody dies yet: a fallen hero comes home at 1 HP. Death, Hall of Heroes and Casual mode are next.
- Deadly quests are hard for level 1 to 5 parties without supplies (about a third succeed at level 5); that is intended but worth watching in play.
- Pronouns are rolled but text avoids them.
- `systems.css` holds styles for the depth update; `style.css` the base.

## Next
1. Death with risk shown upfront; Hall of Heroes; Casual mode at new game.
2. Injuries and scars as lasting traits.
3. More dispatch, scene and goal content (cheap: data files only).
4. Early recall of a party.
