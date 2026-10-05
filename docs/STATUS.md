# Status

Last updated: 2026-10-04 (showcase)

## Built
**M1 core loop**
- Seeded RNG, versioned save (now v6, with migrations from v1) and export/import.
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
- **Loyalty** (`data/loyalty.js`): 0 ready to quit (-1, quits after a failed quest or missed payday), 1 disgruntled (-1), 2-3 content, 4 loyal (+1), 5 devoted (+1 and gets back up once per quest after falling). Triumph +1, disaster -1, plus stories, scenes, dispatches and goals. Explained in the hero detail.
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

**Bar turnover** (save v4): 3 stools; each recruit stays 2 to 4 hours (paced early), then leaves and a new face arrives 15 min later. "Send on" frees a stool for free; "Buy a round" (10 gold + 4 per rank) replaces everyone at once. Constants in config.js (BAR_STAY, BAR_ARRIVE, ROUND_COST).

**Story book** (`js/ui/story.js`): stories show as "X wants a word" invitations on the home screen, only while the hero is at the tavern. Tapping opens the hero's tale: chapter track (Intro, I, II, III, Quest, Legacy), every past chapter with the choice you made and its result, then the current chapter with dialogue styling, a setting line and choice tags showing what each costs or gives. Also reachable from the hero detail ("Read the story"). Choices are logged in `adv.arc.log`.

**Auto-restock** (`autoRestock` in js/inn.js): each supply has a "keep" level (off, 1 to 3) in the quartermaster; after supplies are used the quartermaster buys back up to it, never spending below the next payday's wages. Master toggle in Settings (`state.settings.autoRestock`, on by default; targets in `state.settings.restock`).

**Tales and collections** (save v5)
- **Quest tales** (`data/narrative.js`, `js/tale.js`, `js/ui/report.js`): reports read as a story. A departure and packing line, travel paragraphs between scenes, an intro for each encounter, camp banter shaped by bonds and quirks, letters from the road for dispatches, then an epilogue. Each scene's dice sit behind a "The dice (n)" toggle. The tally card closes the report with rewards and loot. The tale has its own seed (`seedFrom(seed,'tale')`), so wording never changes outcomes.
- **Hall tab** (`js/ui/hall.js`, was Rooms): segments for Rooms, Trophies, Legends, Armory and Bestiary.
- **Trophies** (`data/trophies.js`): 20 trophies from specific foes, places and outcomes. Missing ones show a hint. Prestige (1, 2, 4, 8 by rarity) raises the rarity of bar recruits. Five sets of 4 grant a bonus every party carries. Duplicates sell for gold.
- **Legendary heroes** (`data/legends.js`, `js/legends.js`): 8 named legends. A rumor arrives after a quest (from quest 3, gated by rank). Then follow a trail (for example, beat wolves twice). Then win a recruitment quest that the legend's own story posts on the board. Legends have fixed stats, a signature trait and no hire cost. With no free bed, they wait at the bar.
- **Gear** (`data/gear.js`, `js/gear.js`): weapon, armor and trinket slots. Five rarities with affixes and 6 unique legendary items. The armory holds 24 items, and finds are sold when it is full. Gear is equipped from the hero detail or the armory, only while the hero is idle. Heroes who leave return their gear.
- **Bestiary and codex** (`data/bestiary.js`, `js/collection.js`): 3 defeats of a foe studies it (+1 attack) and 10 masters it (+2), each step unlocking lore. The codex tracks monsters, towns, classes, ancestries, quirks, trophies, legends and legendary gear.
- Set bonuses and foe knowledge are snapshotted per quest in `pending.tavern = questMods(state)`.

**Growth: paths and personal talents** (save v6)
- **Paths** (`data/paths.js`): at level 3 each hero picks one of three paths for their class (24 in all, such as Champion, Warden or Battle master for fighters). The first feature comes with the choice, the second at level 6 and the third at level 9 (`grantPathRanks`). Heroes already past level 3 get the path choice first when the save migrates.
- **Personal talent pool** (`data/talents.js`, `data/talents-personal.js`): 222 talents. Every other level offers three choices, weighted toward what is personal to the hero: deeds 14, quirks 9, background 8, ancestry 6, class 3, general 1, rare 0.3 (more for rarer heroes). One slot is always personal when the hero has any personal option. Already-offered talents show up less often. Some general talents build on earlier ones (`requires`).
- **Deeds** (`js/deeds.js`, `adv.deeds`): kills by monster and tag, falls, injuries, expeditions, disasters, final battles, allies healed, plus stats, bonds, legacy, goals and devotion. These unlock earned talents (for example Wolfbane, Death's old friend, A natural). The hero page shows "Deeds within reach" with progress.
- **Quirk growth**: flaws can be overcome (Faced the dark removes Afraid of the dark) or sometimes embraced (Drunken master), from level 4.
- **New effect fields** (listed in `js/talent-text.js`, which writes every description from the data): dmg, dmgVs, atkVs, crit, resist, hazardResist, lifesteal, bloodied, finale, firstStrike, perkUses, healBonus, inspireBonus, sneak, companion, taunt, retaliate, fearless, exposed, fatigue and fatigueResist, rest, wage, xpSelf, and party-wide `aura` effects (`js/auras.js`). Specials: unbroken, reliable, jack, layOnHands. Pseudo-tags 'attack', 'finale' and skill names work in adv lists.
- Combat moved to `js/combat.js` (fieldMonster, companions, taunt, ambush, retaliation).

**Rarity and the climb to the top**
- **Recruit odds by rank** (`RANKS[].recruits` in data/tavern.js, `recruitOdds` in js/inn.js): from 72/23/4.5/0.5/0% at a roadside alehouse to 42/34/17/5.6/1.4% at the Hall of legends. Prestige lifts rare and above by 6% per recruit-boost point. The bar shows the current odds.
- **Rarity keeps mattering:** ability growth at levels 4 and 8 (1, 1, 2, 2, 3 points by rarity, into the class's key abilities); epic and legendary heroes see four talent options instead of three; rare talents and heroic talents are offered more often to rarer heroes. Measured at level 6 on deadly jobs: common 72%, rare 78%, legendary 84% success or better.
- **High levels take real work:** XP table is now 100 / 250 / 450 / 700 / 1050 / 1550 / 2250 / 3200 / 4500. Heroes above level 4 get 35% XP from easy jobs, above 7 from risky ones (`xpFactor` in quests.js; expeditions count one tier harder). The report says when this happened.
- **Heroic talents** (12, `src: 'heroic'`): need level 8 to 10 and a hard record, such as 5 deadly wins, 10 undead defeated or 8 final battles. New deed counter: `deadly` (won tier 3 jobs). New effect field: `swings` (extra attacks).

**Showcase** (`js/showcase.js`, `js/ui/showcase.js`)
- The Hall opens on a Showcase: prestige, collection percent (ring) and active bonus count; "Every party carries" lists every bonus in effect (rooms, trophy sets, bestiary knowledge, prestige pull); "Within reach" shows the closest next bonuses with progress (sets, bestiary levels, legend trails, next rank). Below it, shelves for the trophy wall (art per trophy, `art` in data/trophies.js), legends, best gear and bestiary bars, each opening its segment.
- Home screen has a "Your collection" card with the next milestone and a count of new finds; the Hall tab shows a dot for new trophies, gear, lore or legends since it was last opened (`state.hallSeen`, `flags.gearFound`).
- Quest cards show trophies the job could bring home that are not on the wall yet (`trophyChances`).

## How to test
- `node tools/smoke.mjs`: plays 80 quests through every system, checks save round-trip, v1 migration, determinism, validates every talent, checks that 300 level-10 heroes all have different builds, and prints the balance table (rows marked +T level heroes with real paths and talents).
- Open with `?fast` so game-minutes pass in seconds.

## Known limitations
- Nobody dies yet: a fallen hero comes home at 1 HP. Death, Hall of Heroes and Casual mode are next.
- Deadly quests are hard for level 1 to 5 parties without supplies (about a third succeed at level 5); that is intended but worth watching in play.
- Pronouns are rolled but text avoids them.
- `systems.css` holds styles for the depth update; `style.css` the base.

## Next
1. Death with risk shown upfront (legends and their gear raise the stakes); Hall of Heroes; Casual mode at new game.
2. Injuries and scars as lasting traits.
3. More dispatch, scene and goal content (cheap: data files only).
4. Early recall of a party.
