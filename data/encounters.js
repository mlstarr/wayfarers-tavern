// kind: skill (best member rolls) | group (half the party must pass) | combat
// Text tokens: {name} actor, {monster}, {party}. Avoid pronouns.
// hazard: damage dice on failure. bonusGold: success adds gold. failGoldLoss: share of reward lost on failure.
export const ENCOUNTERS = {
  brambles: {
    title: 'The bramble maze', kind: 'skill', skill: 'Nature', tags: [], hazard: '1d6',
    success: ['{name} found the old deer path through the thorns.', '{name} read the moss, and the moss told the truth.'],
    fail: ['{name} led the party in a slow, bloody circle through the brambles.', 'The thorns won. {name} has the scratches to prove it.'],
  },
  trail: {
    title: 'Cold tracks', kind: 'skill', skill: 'Survival', tags: [],
    success: ['{name} picked up the trail from a single bent fern.', '{name} knelt, sniffed the air, and pointed. {name} was right.'],
    fail: ['The trail went cold. {name} insists it was never warm.', '{name} followed the tracks for an hour. They were the party\'s own.'],
  },
  bridge: {
    title: 'The rope bridge', kind: 'skill', skill: 'Acrobatics', tags: ['heights'], hazard: '1d8',
    success: ['{name} crossed the swaying bridge and lashed it steady for the others.', '{name} danced across the bridge like it was a tavern floor.'],
    fail: ['A plank gave way under {name}. The grip held. The dignity did not.', '{name} made it across, eventually, the hard way.'],
  },
  strongbox: {
    title: 'A locked strongbox', kind: 'skill', skill: 'Sleight of Hand', tags: [], bonusGold: true,
    success: ['{name} had the lock open before anyone finished arguing about it.', 'Three clicks and a whistle. {name} shared most of what was inside.'],
    fail: ['The lock jammed and the box stayed shut. {name} kicked it anyway.', '{name} snapped a pick in the lock. The box keeps its secrets.'],
  },
  shrine: {
    title: 'A forgotten shrine', kind: 'skill', skill: 'Religion', tags: ['magic'], hazard: '1d6',
    success: ['{name} spoke the old words, and the shrine let them pass with its blessing.'],
    fail: ['{name} guessed at the rite. The shrine did not appreciate the guess.'],
  },
  ambush: {
    title: 'Too quiet', kind: 'skill', skill: 'Perception', tags: [], hazard: '1d8',
    success: ['{name} spotted the tripwire, and the archers waiting behind it.', '{name} raised a hand. Everyone froze. The ambush never came.'],
    fail: ['Nobody saw the ambush coming. {name} saw it last, from the ground.'],
  },
  toll: {
    title: 'A toll on the road', kind: 'skill', skill: 'Persuasion', tags: ['social'], failGoldLoss: 0.15,
    success: ['{name} talked the toll-keepers down to a song and a handshake.'],
    fail: ['{name} tried to bargain. The toll went up.'],
  },
  cave: {
    title: 'Through the dark', kind: 'skill', skill: 'Stealth', tags: ['dark'], hazard: '1d6',
    success: ['{name} led them through the black tunnels without a sound.'],
    fail: ['Something in the dark heard {name}. Something in the dark bit.'],
  },
  river: {
    title: 'The swollen river', kind: 'group', skill: 'Athletics', tags: ['water'], hazard: '1d4',
    success: ['{party} forded the river arm in arm.'],
    fail: ['The river took a pack, a boot and most of the party\'s good mood.'],
  },
  march: {
    title: 'A forced march', kind: 'group', ability: 'con', tags: [], hazard: '1d4',
    success: ['{party} marched through the night and arrived ahead of schedule.'],
    fail: ['The march wore them down. Feet blistered, tempers frayed.'],
  },
  ward: {
    title: 'An arcane ward', kind: 'skill', skill: 'Arcana', tags: ['magic'], hazard: '2d4',
    success: ['{name} traced the glowing sigils and unpicked the ward thread by thread.'],
    fail: ['{name} touched the wrong sigil. The ward touched back.'],
  },
  villagers: {
    title: 'Frightened villagers', kind: 'skill', skill: 'Insight', tags: ['social'],
    success: ['{name} saw through the villagers\' fear and got the real story.'],
    fail: ['The villagers told {name} a great deal. None of it was true.'],
  },
  map: {
    title: 'A faded map', kind: 'skill', skill: 'Investigation', tags: [], bonusGold: true,
    success: ['{name} matched the faded map to the hills and found a forgotten cache.'],
    fail: ['{name} studied the map for an hour and held it upside down for most of it.'],
  },
  carvings: {
    title: 'Strange carvings', kind: 'skill', skill: 'History', tags: ['magic'],
    success: ['{name} recognized the carvings as an old warning, and heeded it.'],
    fail: ['{name} declared the carvings decorative. They were not.'],
  },

  // Combat: {name} is the party member who dealt the most damage (win) or fell first (loss)
  fightWolves: {
    title: 'Wolves in the gloaming', kind: 'combat', monster: 'wolves',
    success: ['{name} drove the {monster} off with blade and fire. They will not come back.', 'The {monster} broke and scattered. {name} stood at the center of it.'],
    fail: ['The {monster} ran them ragged through the trees.'],
  },
  fightBandits: {
    title: 'Steel on the road', kind: 'combat', monster: 'bandits',
    success: ['{name} put the {monster} to rout. The survivors will find honest work.', '{name} disarmed the bandit chief with one swing. The rest surrendered.'],
    fail: ['The {monster} took what they wanted and laughed about it.'],
  },
  fightSpider: {
    title: 'The webbed hollow', kind: 'combat', monster: 'spider',
    success: ['{name} cut through the webs and ended the {monster} at the heart of its lair.'],
    fail: ['The {monster} retreated into its webs, and nobody was brave enough to follow.'],
  },
  fightDead: {
    title: 'The dead walk', kind: 'combat', monster: 'dead',
    success: ['{name} laid the {monster} back to rest. The barrow is quiet again.'],
    fail: ['The {monster} would not stay down. The party ran. Nobody blames them.'],
  },
  fightHorror: {
    title: 'The bramble horror', kind: 'combat', monster: 'horror',
    success: ['{name} hacked the {monster} down to kindling.'],
    fail: ['The {monster} swallowed the path behind them, and the way forward too.'],
  },
  fightBoar: {
    title: 'The charge', kind: 'combat', monster: 'boar',
    success: ['{name} stood firm as the {monster} charged, and the hunt was over.'],
    fail: ['The {monster} scattered the party like skittles and trotted off.'],
  },
};
