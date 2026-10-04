// Talents that come from who a hero is and what they have done.
// bg: needs that background. ancestry: needs that ancestry.
// quirk: grows out of that quirk; replaces: true removes the quirk when learned.
// earn: unlocked by deeds (js/deeds.js reads these keys):
//   kills {monsterId|tag: n}, falls, injuries, nat20, nat1, quests, triumphs, expeditions,
//   disasters, finales, saved (allies healed), friends, rivals, legacy, goals, devoted
// Unlocked deed talents are offered far more often than anything else.

const BACKGROUND = {
  courtlyManners: { bg: 'knight', name: 'Courtly manners', mods: { Persuasion: 2, Insight: 2 }, adv: ['social'], line: 'Still bows to people who do not deserve it.' },
  lanceAndShield: { bg: 'knight', name: 'Lance and shield', ac: 1, attackMod: 1, line: 'The training never left, only the title.' },
  stolenSpellbook: { bg: 'apprentice', name: 'The stolen spellbook', mods: { Arcana: 3 }, adv: ['magic'], line: 'Finally read the last chapter.' },
  hedgeCantrip: { bg: 'apprentice', name: 'A cantrip or two', dmgVs: { magic: 3 }, mods: { Investigation: 2 } },
  alleyWisdom: { bg: 'urchin', name: 'Alley wisdom', mods: { Stealth: 2, 'Sleight of Hand': 2, Deception: 1 } },
  scrapper: { bg: 'urchin', name: 'Scrapper', bloodied: { attack: 2, dmg: 2 }, line: 'Fights dirtiest when cornered.' },
  rekindledFaith: { bg: 'acolyte', name: 'Rekindled faith', mods: { Religion: 3 }, adv: ['undead'] },
  prayerBeads: { bg: 'acolyte', name: 'Worn prayer beads', finale: 2, line: 'Counts them when it matters most.' },
  trailSense: { bg: 'hunter', name: 'Trail sense', mods: { Survival: 3 }, adv: ['beast'] },
  forager: { bg: 'hunter', name: 'Forager', aura: { heal: 1 }, fatigueResist: 1 },
  seaLegs: { bg: 'sailor', name: 'Sea legs', adv: ['water'], mods: { Acrobatics: 2 } },
  knotsAndRigging: { bg: 'sailor', name: 'Knots and rigging', adv: ['heights'], mods: { Athletics: 2 } },
  footnotes: { bg: 'scholar', name: 'Extensive footnotes', mods: { History: 3, Investigation: 2 } },
  knowThyEnemy: { bg: 'scholar', name: 'Know thy enemy', aura: { foeAc: -1 }, line: 'Has read about this. Points at the soft bit.' },
  crowdPleaser: { bg: 'entertainer', name: 'Crowd-pleaser', mods: { Performance: 3 }, aura: { gold: 0.05 } },
  stageFighter: { bg: 'entertainer', name: 'Stage fighter', ac: 1, mods: { Acrobatics: 2 }, line: 'Learned to fall convincingly. Then to not fall at all.' },
  drillSergeant: { bg: 'soldier', name: 'Drill sergeant', aura: { attack: 1 }, line: 'Shouts. It helps.' },
  veteranScars: { bg: 'soldier', name: 'Veteran\'s scars', resist: 1, hp: 4 },
  poultices: { bg: 'herbalist', name: 'Poultices', aura: { heal: 2 } },
  mintAndTrouble: { bg: 'herbalist', name: 'Mint and trouble', mods: { Medicine: 3, Nature: 2 } },
  hiddenPockets: { bg: 'smuggler', name: 'Hidden pockets', aura: { gold: 0.1 }, line: 'Some of the loot even reaches the tavern.' },
  silverAlibi: { bg: 'smuggler', name: 'A silver alibi', mods: { Deception: 3, Insight: 2 } },
  strongBack: { bg: 'farmhand', name: 'Strong back', mods: { Athletics: 2 }, hp: 4, fatigueResist: 1 },
  weatherEye: { bg: 'farmhand', name: 'Weather eye', mods: { Nature: 3, Survival: 2 } },
};

const ANCESTRY = {
  versatile: { ancestry: 'human', name: 'Human versatility', rollMod: 1 },
  ambition: { ancestry: 'human', name: 'Human ambition', xpSelf: 0.25, line: 'Short lives, long plans.' },
  stonecunning: { ancestry: 'dwarf', name: 'Stonecunning', adv: ['dark'], mods: { History: 2 } },
  dwarvenToughness: { ancestry: 'dwarf', name: 'Dwarven toughness', hp: 6, resist: 1 },
  feyAncestry: { ancestry: 'elf', name: 'Fey ancestry', adv: ['magic'], mods: { Perception: 1 } },
  elvenAccuracy: { ancestry: 'elf', name: 'Elven accuracy', crit: 1 },
  brave: { ancestry: 'halfling', name: 'Halfling courage', fearless: true },
  nimbleEscape: { ancestry: 'halfling', name: 'Nimble escape', ac: 1, mods: { Stealth: 3 } },
  relentless: { ancestry: 'orc', name: 'Relentless endurance', special: 'unbroken' },
  savageAttacks: { ancestry: 'orc', name: 'Savage attacks', dmg: 2, crit: 1, minLevel: 5 },
  gnomeCunning: { ancestry: 'gnome', name: 'Gnome cunning', adv: ['magic'], mods: { int: 1, wis: 1, cha: 1 } },
  tinkerer: { ancestry: 'gnome', name: 'Tinkerer', mods: { Investigation: 3, 'Sleight of Hand': 2 }, aura: { gold: 0.05 } },
};

// Quirks grow: good ones deepen, flaws can be overcome (or, sometimes, embraced).
const QUIRK = {
  charmedLife: { quirk: 'lucky', name: 'Charmed life', crit: 1 },
  eagleEye: { quirk: 'keenEyed', name: 'Eagle eye', mods: { Perception: 2 }, firstStrike: true },
  goldenVoice: { quirk: 'silverTongue', name: 'Golden voice', adv: ['social'], aura: { gold: 0.1 } },
  ironHide: { quirk: 'tough', name: 'Iron hide', resist: 2 },
  fearNothing: { quirk: 'fearless', name: 'Fear nothing', fearless: true, finale: 1 },
  childOfNight: { quirk: 'nightOwl', name: 'Child of the night', dmgVs: { dark: 3 }, mods: { Stealth: 2 } },
  beastSpeaker: { quirk: 'beastFriend', name: 'Beast speaker', aura: { adv: ['beast'] } },
  likeAFish: { quirk: 'swimmer', name: 'Like a fish', aura: { adv: ['water'] } },
  lightningReflexes: { quirk: 'quick', name: 'Lightning reflexes', flag: 'evasion', ac: 1 },
  treasureNose: { quirk: 'greedy', name: 'A nose for treasure', aura: { gold: 0.1 } },
  soberedUp: { quirk: 'drinks', replaces: true, name: 'Sobered up', mods: { Perception: 2, Persuasion: 1 }, line: 'Put the cup down for good.' },
  drunkenMaster: { quirk: 'drinks', name: 'Drunken master', ac: 2, mods: { Acrobatics: 2 }, line: 'Sways out of every swing.' },
  walkingLibrary: { quirk: 'bookworm', name: 'Walking library', aura: { skill: 1 } },
  tempered: { quirk: 'hothead', replaces: true, name: 'Tempered', mods: { Persuasion: 2, Intimidation: 2 }, line: 'Learned to count to ten. Usually gets to four.' },
  battleFury: { quirk: 'hothead', name: 'Battle fury', dmg: 3, bloodied: { attack: 2 } },
  facedTheDark: { quirk: 'afraidDark', replaces: true, name: 'Faced the dark', adv: ['dark'], line: 'Walked into the black on purpose, and came back out.' },
  conqueredHeights: { quirk: 'acrophobe', replaces: true, name: 'Conquered heights', adv: ['heights'], line: 'Looked down. Kept going.' },
  spiderSlayer: { quirk: 'arachnophobe', replaces: true, name: 'Spider-slayer', atkVs: { spider: 2 }, dmgVs: { spider: 3 }, line: 'Still hates them. Now they should be afraid.' },
  foundTheirFeet: { quirk: 'clumsy', replaces: true, name: 'Found their feet', mods: { Acrobatics: 1, Stealth: 1 } },
  builtBackUp: { quirk: 'frail', replaces: true, name: 'Built back up', hp: 4, line: 'Three square meals and a lot of stairs.' },
  wardsAndCharms: { quirk: 'superstitious', replaces: true, name: 'Wards and charms', adv: ['magic'], mods: { Religion: 2 } },
};
for (const t of Object.values(QUIRK)) t.minLevel = t.minLevel || 4;

// Earned by deeds on the road.
const DEED = {
  beastSlayer: { earn: { kills: { beast: 5 } }, name: 'Beast-slayer', dmgVs: { beast: 3 }, atkVs: { beast: 1 } },
  wolfbane: { earn: { kills: { wolves: 3 } }, name: 'Wolfbane', adv: ['beast'], line: 'The packs have learned the name.' },
  graveWarden: { earn: { kills: { undead: 3 } }, name: 'Grave warden', adv: ['undead'], dmgVs: { undead: 3 } },
  webcutter: { earn: { kills: { spider: 2 } }, name: 'Webcutter', adv: ['spider'], resist: 1 },
  banditsBane: { earn: { kills: { bandits: 3 } }, name: 'Bandit\'s bane', atkVs: { bandits: 2 }, dmgVs: { bandits: 3 }, aura: { gold: 0.05 } },
  thornbreaker: { earn: { kills: { horror: 2 } }, name: 'Thornbreaker', dmgVs: { horror: 4, magic: 1 }, adv: ['magic'] },
  tuskScarred: { earn: { kills: { boar: 2 } }, name: 'Tusk-scarred', hp: 5, resist: 1 },
  hardToKill: { earn: { falls: 1 }, name: 'Hard to kill', hp: 6, line: 'Was carried home once. Not again.' },
  deathsFriend: { earn: { falls: 3 }, name: 'Death\'s old friend', special: 'unbroken', line: 'Death keeps coming close, then thinking better of it.' },
  scarred: { earn: { injuries: 2 }, name: 'Scarred and smiling', resist: 1, mods: { Intimidation: 3 } },
  natural: { earn: { nat20: 3 }, name: 'A natural', crit: 1 },
  learnedBlunders: { earn: { nat1: 4 }, name: 'Learned from every blunder', special: 'lucky' },
  rallyingName: { earn: { triumphs: 5 }, name: 'A name that rallies', aura: { roll: 1 } },
  roadWorn: { earn: { expeditions: 2 }, name: 'Road-worn', fatigueResist: 1, mods: { Survival: 3 }, aura: { heal: 1 } },
  survivor: { earn: { disasters: 1 }, name: 'Survivor\'s instinct', flag: 'evasion', hp: 3 },
  veteran: { earn: { quests: 15 }, name: 'Veteran of the road', rollMod: 1 },
  finisher: { earn: { finales: 4 }, name: 'Finisher', finale: 2 },
  lifesaver: { earn: { saved: 4 }, name: 'Lifesaver', healBonus: 3, aura: { heal: 1 } },
  shoulderToShoulder: { earn: { friends: 1 }, name: 'Shoulder to shoulder', aura: { ac: 1 } },
  spite: { earn: { rivals: 1 }, name: 'Spite', attackMod: 1, dmg: 1, line: 'Will not be outdone. Especially by that one.' },
  livingStory: { earn: { legacy: 1 }, name: 'A living story', aura: { xp: 0.1 }, mods: { Persuasion: 2 } },
  forTheTavern: { earn: { devoted: 1 }, name: 'For the tavern!', aura: { finale: 1 } },
  driven: { earn: { goals: 2 }, name: 'Driven', xpSelf: 0.15, rollMod: 1 },
};

for (const t of Object.values(BACKGROUND)) t.src = 'background';
for (const t of Object.values(ANCESTRY)) t.src = 'ancestry';
for (const t of Object.values(QUIRK)) t.src = 'quirk';
for (const t of Object.values(DEED)) t.src = 'deed';

export const PERSONAL_TALENTS = { ...BACKGROUND, ...ANCESTRY, ...QUIRK, ...DEED };
