// tiers: tiers this quest can appear at. pool: optional encounters, `count` picked.
// finale: final encounter (string, array to pick one, or null). party: [min, max].
// Text tokens: {town}, {farm}
export const QUEST_TEMPLATES = [
  {
    id: 'wolves', title: 'Wolves at {farm}', tiers: [1, 2],
    blurb: 'Something has been taking sheep from {farm}. The farmer suspects wolves and is not wrong.',
    pool: ['trail', 'brambles', 'river', 'ambush'], count: [2, 3], finale: 'fightWolves', party: [2, 4],
  },
  {
    id: 'caravan', title: 'The missing caravan', tiers: [1, 2, 3],
    blurb: 'A spice caravan never reached {town}. Find it, or find out what happened to it.',
    pool: ['trail', 'toll', 'ambush', 'march', 'strongbox', 'map'], count: [2, 4], finale: 'fightBandits', party: [2, 4],
  },
  {
    id: 'herbs', title: 'Moonpetal for the apothecary', tiers: [1, 2],
    blurb: 'The apothecary in {town} needs moonpetal, which grows only where sensible people do not go.',
    pool: ['brambles', 'trail', 'river', 'bridge', 'shrine', 'cave'], count: [3, 4], finale: null, party: [1, 3],
  },
  {
    id: 'scout', title: 'Find the lost scout', tiers: [1, 2, 3],
    blurb: 'A scout from {town} went into the Thornwood three days ago. Her horse came back alone.',
    pool: ['trail', 'bridge', 'ambush', 'march', 'cave', 'villagers'], count: [2, 3],
    finale: ['fightWolves', 'fightBandits', 'fightBoar'], party: [2, 4],
  },
  {
    id: 'boar', title: 'The great boar of {farm}', tiers: [1, 2],
    blurb: 'A boar the size of a cart has flattened two fences and one very surprised farmer.',
    pool: ['trail', 'brambles', 'villagers'], count: [2, 2], finale: 'fightBoar', party: [2, 3],
  },
  {
    id: 'spider', title: 'The webbed hollow', tiers: [2, 3],
    blurb: 'Woodcutters from {town} have stopped coming home from the hollow. Their axes have been found in the webs.',
    pool: ['cave', 'brambles', 'trail', 'ward'], count: [2, 3], finale: 'fightSpider', party: [3, 4],
  },
  {
    id: 'barrow', title: 'Trouble at the old barrow', tiers: [2, 3],
    blurb: 'Lights have been seen at the barrow outside {town}. The dead are supposed to stay put.',
    pool: ['carvings', 'shrine', 'cave', 'villagers'], count: [2, 3], finale: 'fightDead', party: [3, 4],
  },
  {
    id: 'tower', title: 'The hedge-wizard\'s tower', tiers: [2, 3],
    blurb: 'The hedge-wizard near {town} has not been seen in a month, and her garden has started moving.',
    pool: ['ward', 'map', 'carvings', 'strongbox', 'bridge'], count: [2, 3], finale: 'fightHorror', party: [2, 4],
  },
];

// Minutes. Longer quests pay more.
export const TIER_DURATIONS = {
  1: [15, 30, 45, 60],
  2: [60, 90, 120, 240],
  3: [240, 360, 480, 720],
};

export const TIER_NAMES = { 1: 'Easy', 2: 'Risky', 3: 'Deadly' };

export const PLACES = {
  town: ['Ashby', 'Hollin\'s Ford', 'Millbrook', 'Kettlewick', 'Brackenridge', 'Oakhallow', 'Fennmoor', 'Stonebridge'],
  farm: ['the Hollin farm', 'Old Pell\'s farm', 'the Wren homestead', 'Marlow\'s croft', 'the Tanner farm'],
};
