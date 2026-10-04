// Tavern ranks, earned with renown. Renown lost to failure never drops below the current rank.
// beds: roster size before the bunkhouse. tier: hardest quest tier on the board. reward: gold on reaching it.
export const RANKS = [
  { renown: 0, name: 'Roadside alehouse', beds: 4, tier: 1, reward: 0 },
  { renown: 15, name: 'Village inn', beds: 5, tier: 2, reward: 60 },
  { renown: 45, name: 'Crossroads tavern', beds: 6, tier: 3, reward: 150 },
  { renown: 100, name: 'Famed lodge', beds: 7, tier: 3, reward: 300 },
  { renown: 200, name: 'Hall of legends', beds: 8, tier: 3, reward: 600 },
];

// Rooms. Each level lists its full effect (not added to the level before). rank: rank index required.
export const UPGRADES = {
  taproom: {
    name: 'Taproom', desc: 'Ale sells while you are away, for up to 8 hours.',
    levels: [
      { cost: 40, rank: 0, text: '4 gold an hour.', ale: 4 },
      { cost: 150, rank: 2, text: '10 gold an hour.', ale: 10 },
      { cost: 400, rank: 3, text: '20 gold an hour.', ale: 20 },
    ],
  },
  bunkhouse: {
    name: 'Bunkhouse', desc: 'More beds, for a bigger company.',
    levels: [
      { cost: 80, rank: 0, text: '+1 bed.', beds: 1 },
      { cost: 200, rank: 1, text: '+2 beds.', beds: 2 },
      { cost: 450, rank: 3, text: '+3 beds.', beds: 3 },
    ],
  },
  infirmary: {
    name: 'Infirmary', desc: 'Wounds and injuries heal faster.',
    levels: [
      { cost: 70, rank: 0, text: 'Rest and injuries heal 50% faster.', heal: 1.5 },
      { cost: 220, rank: 2, text: 'Twice as fast, and the herbalist charges half.', heal: 2, cheapHerbs: true },
    ],
  },
  kitchen: {
    name: 'Kitchen', desc: 'Hot meals ease fatigue.',
    levels: [
      { cost: 60, rank: 0, text: 'Fatigue fades twice as fast.', fatigue: 2 },
      { cost: 180, rank: 1, text: 'Fatigue fades twice as fast, and 2 free trail rations every payday.', fatigue: 2, rations: 2 },
    ],
  },
  armory: {
    name: 'Armory', desc: 'Better steel for every party.',
    levels: [
      { cost: 120, rank: 1, text: '+1 to attack rolls.', attack: 1 },
      { cost: 350, rank: 3, text: '+1 to attack rolls and +1 armor class.', attack: 1, ac: 1 },
    ],
  },
  maproom: {
    name: 'Map room', desc: 'Scouting reports before every job.',
    levels: [
      { cost: 100, rank: 1, text: '+1 to skill checks.', skill: 1 },
      { cost: 300, rank: 2, text: '+1 to skill checks, and contracts pay 20% more.', skill: 1, contract: 0.2 },
    ],
  },
  yard: {
    name: 'Training yard', desc: 'Drills between jobs.',
    levels: [
      { cost: 90, rank: 1, text: '+20% XP from quests.', xp: 0.2 },
      { cost: 260, rank: 2, text: '+40% XP from quests.', xp: 0.4 },
    ],
  },
  chapel: {
    name: 'Chapel', desc: 'A blessing before the road.',
    levels: [
      { cost: 150, rank: 2, text: '+1 to rolls in the final encounter.', finale: 1 },
      { cost: 400, rank: 4, text: '+2 in the final encounter, and one free heal on every quest.', finale: 2, heal: true },
    ],
  },
};

export const UPGRADE_IDS = Object.keys(UPGRADES);
