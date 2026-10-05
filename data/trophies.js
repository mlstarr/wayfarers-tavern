// Trophies mounted on the tavern walls. Found on quests, displayed in the Hall.
// rarity sets prestige: common 1, rare 2, epic 4, legendary 8. Prestige draws better recruits to the bar.
// source: { monster, chance, outcomes } | { template, chance } | { encounter, chance } | { condition, chance } | { legend }
// outcomes defaults to any won outcome (triumph, success, costly).
export const PRESTIGE = { common: 1, rare: 2, epic: 4, legendary: 8 };

export const TROPHIES = {
  // Hunter's lodge
  wolfPelt: { name: 'Grey wolf pelt', set: 'hunt', rarity: 'common', desc: 'Thick, silver-tipped, and still smelling faintly of rain.', hint: 'Taken from a wolf pack', source: { monster: 'wolves', chance: 0.5 } },
  boarTusks: { name: 'Great boar tusks', set: 'hunt', rarity: 'common', desc: 'Each tusk is as long as a forearm. They hang crossed above the hearth.', hint: 'Taken from a great boar', source: { monster: 'boar', chance: 0.5 } },
  spiderSilk: { name: 'Bolt of giant spider silk', set: 'hunt', rarity: 'rare', desc: 'Stronger than rope and lighter than linen. The tailor keeps asking about it.', hint: 'Cut from a spider\'s lair', source: { monster: 'spider', chance: 0.4 } },
  alphaFang: { name: 'Fang of the pack leader', set: 'hunt', rarity: 'epic', desc: 'From a wolf that led its pack for a dozen winters. It earned its place on the wall.', hint: 'Only after a triumph against wolves', source: { monster: 'wolves', chance: 0.25, outcomes: ['triumph'] } },

  // The grave-keeper's shelf
  boneDice: { name: 'Bone dice', set: 'grave', rarity: 'common', desc: 'Carved from something nobody wants to think about. They always roll sevens.', hint: 'Dropped by the restless dead', source: { monster: 'dead', chance: 0.45 } },
  ghostLantern: { name: 'Ghost lantern', set: 'grave', rarity: 'rare', desc: 'It lights itself on cold nights, with a pale green flame.', hint: 'Carried by the restless dead', source: { monster: 'dead', chance: 0.25 } },
  barrowCrown: { name: 'The Barrow King\'s crown', set: 'grave', rarity: 'epic', desc: 'Tarnished bronze set with river stones. It hums when nobody is listening.', hint: 'From the old barrow, after a triumph', source: { template: 'barrow', chance: 0.4, outcomes: ['triumph'] } },

  // Trophies of the road
  banditBanner: { name: 'Red bandit banner', set: 'road', rarity: 'common', desc: 'Captured from a band of cutthroats. Patrons like to spit at it.', hint: 'Taken from bandits', source: { monster: 'bandits', chance: 0.45 } },
  tollLedger: { name: 'A crooked toll ledger', set: 'road', rarity: 'common', desc: 'Every swindled traveler, written down in tidy columns.', hint: 'From a toll on the road', source: { encounter: 'toll', chance: 0.3 } },
  caravanBell: { name: 'Caravan bell', set: 'road', rarity: 'rare', desc: 'Rung once for every caravan that made it home.', hint: 'From the missing caravan', source: { template: 'caravan', chance: 0.35 } },
  saltCrown: { name: 'Salt merchant\'s chain', set: 'road', rarity: 'epic', desc: 'A gift from the salt caravan\'s grateful owners. Heavy, gaudy and very valuable.', hint: 'From a salt caravan expedition', source: { template: 'saltroad', chance: 0.45 } },

  // The curiosity cabinet
  sigilStone: { name: 'Humming sigil stone', set: 'arcane', rarity: 'common', desc: 'Part of an old ward. It buzzes when magic is near.', hint: 'Pried from an arcane ward', source: { encounter: 'ward', chance: 0.3 } },
  horrorHeart: { name: 'Heartwood of a bramble horror', set: 'arcane', rarity: 'rare', desc: 'Still warm. Small green shoots keep sprouting from it.', hint: 'Cut from a bramble horror', source: { monster: 'horror', chance: 0.4 } },
  wizardHat: { name: 'The hedge-wizard\'s hat', set: 'arcane', rarity: 'rare', desc: 'Pointed, patched and stubbornly magical. It turns to face visitors.', hint: 'From the hedge-wizard\'s tower', source: { template: 'tower', chance: 0.35 } },
  singingStone: { name: 'Singing standing stone', set: 'arcane', rarity: 'epic', desc: 'A chunk of carved stone that sings very quietly at dawn.', hint: 'Taken from strange carvings', source: { encounter: 'carvings', chance: 0.15 } },

  // Wilderness keepsakes
  moonpetal: { name: 'Pressed moonpetal', set: 'wild', rarity: 'common', desc: 'It glows faintly in the dark, framed behind glass.', hint: 'Gathered for the apothecary', source: { template: 'herbs', chance: 0.5 } },
  eagleFeather: { name: 'Gorge eagle feather', set: 'wild', rarity: 'common', desc: 'Found at the far end of a rope bridge, as long as an arm.', hint: 'Found while crossing a rope bridge', source: { encounter: 'bridge', chance: 0.25 } },
  riverPearl: { name: 'River pearl', set: 'wild', rarity: 'rare', desc: 'Black and perfect, swept out of the flood.', hint: 'Found while fording a river', source: { encounter: 'river', chance: 0.2 } },
  deepwoodMap: { name: 'Map of the deep wood', set: 'wild', rarity: 'epic', desc: 'The first true map of the Thornwood\'s heart, drawn by your own company.', hint: 'From an expedition into the deep wood', source: { template: 'deepwood', chance: 0.45 } },

  // Singles
  nightCandle: { name: 'The candle that never burns down', set: null, rarity: 'rare', desc: 'Lit on a night of victory, it has not shortened since.', hint: 'Only after a triumph by night', source: { condition: 'night', chance: 0.5, outcomes: ['triumph'] } },
};

// Set bonuses apply to every party once the set is complete (or `need` pieces).
// Effects merge into quest modifiers: tagAttack, tagRoll, tagSkill ({ tag: n }), gold, xp, recruit.
export const TROPHY_SETS = {
  hunt: { name: 'Hunter\'s lodge', bonus: '+1 to attack rolls against beasts.', effects: { tagAttack: { beast: 1 } } },
  grave: { name: 'The grave-keeper\'s shelf', bonus: '+1 to every roll against the dead.', effects: { tagRoll: { undead: 1 } } },
  road: { name: 'Trophies of the road', bonus: '+10% gold from every quest.', effects: { gold: 0.1 } },
  arcane: { name: 'The curiosity cabinet', bonus: '+1 to skill checks in magical places.', effects: { tagSkill: { magic: 1 } } },
  wild: { name: 'Wilderness keepsakes', bonus: '+15% XP from every quest.', effects: { xp: 0.15 } },
  legends: { name: 'Hall of legends', bonus: 'Rarer recruits come to the bar.', need: 3, effects: { recruit: 2 } },
};

// Duplicate trophies are sold to collectors.
export const DUPLICATE_GOLD = { common: 8, rare: 20, epic: 50, legendary: 100 };

// Art for each trophy (icon names in js/ui/icons.js).
const ART = {
  wolfPelt: 'pelt', boarTusks: 'tusk', spiderSilk: 'web', alphaFang: 'fang', boneDice: 'dice', ghostLantern: 'lantern',
  barrowCrown: 'crown', banditBanner: 'banner', tollLedger: 'scroll', caravanBell: 'bell', saltCrown: 'crown',
  sigilStone: 'stone', horrorHeart: 'leaf', wizardHat: 'hat', singingStone: 'stone', moonpetal: 'flower',
  eagleFeather: 'feather', riverPearl: 'pearl', deepwoodMap: 'map', nightCandle: 'candle',
};
for (const [id, art] of Object.entries(ART)) if (TROPHIES[id]) TROPHIES[id].art = art;
