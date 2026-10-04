# Wayfarer's Tavern: design doc

Source of truth for design decisions. The editable copy lives in Claude Docs; this file is the repo copy that build sessions read.

## Decisions

| Question | Decision | What it means for the build |
| --- | --- | --- |
| Name | Wayfarer's Tavern | Repo, title screen and save key |
| Visual style | Illustrated cards | Adventurers, quests, gear and monsters shown as cards with rarity borders. Procedural adventurers need a layered portrait system (face, hair, armor, palette). M1 uses procedural heraldic shields as placeholder card art |
| Tone | Classic heroic fantasy | Earnest heroes, real stakes; humor from quirks and natural 1s |
| Death | Permanent by default | Casual mode (long injuries instead) is an option at new game |
| Layout | Mobile-first, works on desktop | Phone portrait first; desktop gets wider multi-column layouts of the same screens |
| Notifications | Planned | Installable web app (PWA). Alerts while closed need a small push service beyond GitHub Pages; built after the core game works |
| Goal | Might sell | All art original or commercially licensed. SRD needs a CC-BY-4.0 credit. Keep code wrapper-ready for itch.io, Steam or app stores |

## Vision and pillars

You run a tavern at a fantasy crossroads, recruit procedurally generated adventurers, and send them on real-time quests resolved by visible d20 rolls. It plays in two-minute check-ins or two-hour sessions, and every run of the dice writes a story about characters you care about.

Target feel: a tabletop campaign you run from the bar. Warm, a little funny, occasionally tragic.

1. **Every adventurer is a character.** Names, quirks, grudges and histories make losses hurt and legends memorable.
2. **The dice tell the story.** Outcomes come from rolls the player can see, and every report reads like a session recap.
3. **Something is always waiting.** Returning after an hour or a day always has a payoff; returning never punishes.
4. **Short sessions feed long ones.** What you collect in check-ins powers the hands-on dungeon mode.
5. **Own world, open rules.** Original setting and names, mechanics from the openly licensed 5e SRD.

## Session rhythm

| Session | Length | What the player does | Payoff |
| --- | --- | --- | --- |
| Check-in | 1 to 3 min | Read quest reports, collect loot, heal the wounded, send the next party | Stories, gold, gear, level-ups |
| Daily | 5 to 10 min | New quest board, new recruits at the bar, daily seeded challenge, inn upgrades | Rare recruits, daily rewards, progress on bigger goals |
| Long session | 30 min+ | Hands-on dungeon delve, plan long expeditions, restructure the roster | Legendary loot, region unlocks, hero legends |
| Weekly | Ongoing | Rotating events: a festival, a dragon sighting, a plague in the next town | Limited-time recruits and items |

Quest lengths: Easy 2 to 10 minutes, Risky 12 to 60, Deadly 1 to 4 hours, Expeditions 6 to 12 hours with bigger rewards. Within a tier, more encounters means a longer quest. Postings expire and are replaced through the day. Offline progress resolves on return from saved timestamps. No streak penalties.

**Things to do on a check-in:** answer messengers from parties on the road (dispatch choices), handle common-room scenes, pick level-up talents, pack supplies against quest conditions, and read reports.

## Core loop

Recruit at the bar → build the party → send on a quest (15 min to 12 h) → dice resolve it (d20 rolls, story report) → collect rewards (gold, loot, XP, renown) → upgrade the inn (better recruits and quests) → repeat.

The dice step is the emotional center: everything before it is preparation, everything after it is consequence. Dungeon mode is the same party taken off the timer and played by hand.

## Adventurers

Each adventurer is generated from a seed and stored as a compact character sheet.

**Generated at recruitment**
- **Ancestry and class:** 6 ancestries and 8 classes (fighter, rogue, cleric, wizard, ranger, bard, paladin, barbarian).
- **Ability scores:** 4d6-drop-lowest, assigned by class priority. Modifiers drive every check.
- **Background:** a one-line history that grants a skill proficiency and flavors reports.
- **Quirks:** 1 to 3, each with a mechanical effect ("afraid of the dark": disadvantage in dark places; "lucky": reroll one natural 1 per quest).
- **Alignment and temperament:** shape relationships and which quests they accept (later milestone).
- **Rarity:** common to legendary, shown by stat totals and rare quirks or abilities.

**Over time**
- **Leveling:** levels 1 to 10, with feats or class features every few levels.
- **Relationships:** friendships (bonus when grouped) or rivalries (penalty); some become sworn companions.
- **Scars and history:** injuries can leave permanent traits; a log records notable deeds.
- **Mood and loyalty:** unpaid, overworked or grieving adventurers may refuse quests or leave.

**Injury and death**
- Failed quests can injure, curse or kill, with risk shown upfront.
- The dead go to a Hall of Heroes. Resurrection is possible but costly and rare.
- Casual mode turns death into long injuries.

## Quests and dice resolution

A quest is a chain of 3 to 6 encounters, each resolved by visible d20 checks.

**The quest board:** 4 to 8 postings showing region, duration, difficulty, party size, likely checks, risk and reward. Rare postings: named-monster bounties, rescues, relic hunts.

**Resolution**
- Each encounter calls a skill check (best-suited member vs DC), a group check (half the party must pass), or combat (rounds of attack rolls vs armor class).
- Natural 20s and 1s trigger special outcomes and memorable report lines.
- Party composition, quirks, relationships, gear and inn bonuses modify rolls.
- Outcome tiers: triumph, success, costly success, failure, disaster.

**The report:** an animated log the player can tap through or skip, with each roll shown (d20 + modifier vs DC), written from templates filled with names and quirks. Notable moments go into each adventurer's history.

**Timing:** the seed is fixed at send time; the quest resolves at return using that seed plus the player's dispatch choices (deterministic, no save-scumming).

**Dispatches:** a messenger arrives partway through quests of 5+ minutes with a choice (take the old trail, let the ranger find a way around). Unanswered, the party takes its default.

**Conditions and supplies:** quests carry conditions (night, rain, cold, cursed ground, venom, long road, fears fire). Supplies bought from the quartermaster counter them. Parties can be recalled early for partial rewards (later milestone).

## Stories and progression (built)

Every hero has a personal story arc (introduction, three beats, a personal quest, a legacy). The tavern ranks up with renown, and rooms bought with gold give every party bonuses. Penalties (injuries, fatigue, renown loss, wages, contract deposits) create pressure; time away is never charged more than two paydays. See docs/STATUS.md for numbers.

## The Inn

| Room | What it does | Upgrades improve |
| --- | --- | --- |
| Common room | Recruits appear at the bar; ale income while away | Recruit count and rarity, passive income |
| Quest board | Shows available quests | Number of postings, rare quest chance |
| Bunkhouse | Houses the roster | Roster cap |
| Infirmary | Heals injuries over time | Healing speed, curse removal |
| Forge | Repairs, upgrades and crafts gear | Gear tiers, recipes |
| Chapel | Blessings before quests; resurrection | Blessing strength, resurrection cost |
| Training yard | XP for idle adventurers | XP rate |
| Library | Identifies relics, reveals lore and regions | Lore, scouting info |
| Cellar (late game) | Entrance to dungeon mode | Dungeon depth |

**Economy:** gold (quests, ale; spent on wages, upgrades, healing, recruits), materials (forge), renown (unlocks regions and better recruits). Wages keep the roster lean. No premium currency.

## Loot and collection

- **Gear:** five rarities, procedural affixes ("of the Owl: +1 Wisdom"); legendaries are hand-written with names and stories.
- **Adventurers:** the Codex tracks ancestries, classes and rare quirks seen; the Hall of Legends holds level-10 or notable heroes.
- **Bestiary:** monsters encountered, filled in with lore as you defeat them.
- **The chase:** legendaries under 1% with a soft pity counter; set bonuses; conditional secrets (full-moon quests, an all-bard party).

## Dungeon mode

Lead a party of 4 through a procedural dungeon by hand: a branching Slay-the-Spire-style map across 3 to 5 floors (combat, traps, puzzles, shrines, merchants, rest, boss), turn-based grid combat with visible rolls, skill-check gambles where you choose who attempts them, real deaths, retreat between floors keeps loot, save anywhere. Unlocks with the Cellar.

## Progression and retention

Always a near goal (a quest returning, a level-up), a mid goal (a region, a legendary bounty) and a far goal (Codex completion, the final region).

- **Regions:** 5 at launch (forest, marsh, mountains, ruined city, far north), each with monsters, quest types, loot and a story arc. Unlocked with renown.
- **Prestige ("New Season"):** a fresh inn in a new world, keeping the Codex, Hall of Legends and a permanent bonus; legends can retire as mentors.
- **Daily seeded challenge:** one shared quest per day with a fixed seed and pre-made party.
- **Events:** weekly rotating events with limited quests, recruits and items.

## Technical architecture

Static browser game on GitHub Pages: plain HTML, CSS and JS modules. See `docs/CONVENTIONS.md` for the rules.

```
wayfarers-tavern/
  index.html  style.css  systems.css
  js/   main.js state.js config.js rng.js adventurers.js talents.js goals.js bonds.js inn.js quests.js
        encounters.js resolve.js checks.js dispatch.js scenes.js reports.js
        ui/  dom.js icons.js heraldry.js card.js tavern.js board.js roster.js bar.js report.js settings.js
  data/ skills.js classes.js ancestries.js names.js backgrounds.js quirks.js talents.js goals.js monsters.js
        encounters.js quests.js supplies.js dispatches.js scenes.js report-templates.js
  tools/smoke.mjs
  docs/ DESIGN.md CONVENTIONS.md STATUS.md
```

- ES modules loaded directly by the browser; data as JS modules.
- Seeded RNG (mulberry32): every adventurer, quest and dungeon comes from a seed.
- Save: one JSON object in localStorage with a version number and migrations, autosaved after every action, with export/import as backup.
- Offline progress: store timestamps, not timers.
- Logic modules never touch the page.
- Files under about 400 lines each.

## Milestones

1. **M1 Core loop:** seeded RNG, adventurer generation, quest board, timed quests, dice resolution, text reports, save/load, offline catch-up.
2. **M2 Roster depth:** quirk depth, injuries and death, Hall of Heroes, relationships, feats, Casual mode.
3. **M3 The inn:** rooms and upgrades, gold economy, wages, infirmary and chapel.
4. **M4 Loot and Codex:** gear with rarities and affixes, the forge, Codex and bestiary.
5. **M5 Regions and story:** 5 regions, renown unlocks, region quests and story arcs, library lore.
6. **M6 Dungeon mode:** map, turn-based grid combat, room events, bosses.
7. **M7 Retention layer:** daily seeded challenge, weekly events, New Season prestige, PWA with quest-return notifications.
8. **M8 Polish:** layered portrait system, card art for quests, gear and monsters, sound, animations, desktop layout, onboarding.
