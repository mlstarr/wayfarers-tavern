// Dispatches: a messenger reaches the tavern mid-quest with a choice.
// Unanswered by the time the party returns, the party takes the `default` option.
// heroSkill: the hero is the party member best at this skill. requires: 'finaleCombat' | 'vengeance'
// Tokens: {hero}, {monster} (the finale foe), {plural}
// Effects (applied when the party reaches this point, see js/resolve.js):
//   addEncounter, skipNext, goldMult, goldPerTier, xpMult, heal, hurt,
//   mod + label + scope ('next' | 'rest' | 'finale'), finaleAdv, heroFinaleAdv, finaleHarder,
//   bypassFinale, loyalty (hero), loyaltyAll, goalBoost (hero),
//   check: { who: 'hero' | 'best', skill | ability, dcMod, pass: [...], fail: [...], passText, failText }
export const DISPATCHES = {
  fork: {
    text: 'The road splits. The old trail is shorter, but it runs past a ruined watchtower that someone has been using.',
    options: [
      { label: 'Take the old trail', desc: 'One more fight, 30% more gold.', effects: [{ addEncounter: 'ambush' }, { goldMult: 0.3 }] },
      { label: 'Stay on the main road', desc: 'Nothing gained, nothing risked.', effects: [], default: true },
    ],
  },
  storm: {
    heroSkill: 'Survival',
    text: 'Black clouds are rolling in over the hills, and the party is a long way from shelter.',
    options: [
      { label: 'Push on through the rain', desc: '-1 to every roll for the rest of the job.', effects: [{ mod: -1, label: 'soaked', scope: 'rest' }] },
      { label: 'Shelter and wait it out', desc: 'Everyone rests a little, but the client pays 10% less for the delay.', effects: [{ heal: 4 }, { goldMult: -0.1 }], default: true },
      {
        label: 'Let {hero} find a way around', desc: 'Survival check. Pass: +1 to rolls for the rest of the job. Fail: everyone takes a soaking and some bruises.',
        effects: [{ check: { who: 'hero', skill: 'Survival', pass: [{ mod: 1, label: 'good ground', scope: 'rest' }], fail: [{ hurt: '1d4' }], passText: '{hero} found a sheltered gully that cut an hour off the road.', failText: '{hero} led them straight into the worst of it.' } }],
      },
    ],
  },
  stranger: {
    heroSkill: 'Insight',
    text: 'The party found a wounded traveler by the road, begging for help reaching the next town.',
    options: [
      { label: 'Escort them to safety', desc: 'A detour, but a grateful family pays 25% extra.', effects: [{ addEncounter: 'march' }, { goldMult: 0.25 }, { loyaltyAll: 1 }] },
      { label: 'Leave supplies and move on', desc: 'Kind enough, and no delay.', effects: [], default: true },
      {
        label: 'Have {hero} ask what lies ahead', desc: 'Insight check. Pass: advantage in the final encounter.',
        effects: [{ check: { who: 'hero', skill: 'Insight', pass: [{ finaleAdv: 'forewarned' }], fail: [], passText: 'The traveler described exactly what was waiting ahead. {hero} believed every word.', failText: 'The traveler\'s story did not add up, and {hero} could not untangle it.' } }],
      },
    ],
  },
  camp: {
    heroSkill: 'Survival',
    text: 'Night is falling, and the party has to decide where to sleep.',
    options: [
      { label: 'Post a double watch', desc: 'A safe, short night. Everyone recovers a little.', effects: [{ heal: 3 }], default: true },
      { label: 'March through the night', desc: 'Skip the next encounter, but -1 to rolls for the rest of the job.', effects: [{ skipNext: true }, { mod: -1, label: 'weary', scope: 'rest' }] },
      {
        label: 'Let {hero} hunt for supper', desc: 'Survival check. Pass: a feast that heals everyone well and steadies nerves.',
        effects: [{ check: { who: 'hero', skill: 'Survival', pass: [{ heal: 7 }, { mod: 1, label: 'well fed', scope: 'next' }], fail: [{ heal: 1 }], passText: '{hero} came back with a brace of rabbits and wild garlic. A fine night.', failText: '{hero} came back with one sad mushroom.' } }],
      },
    ],
  },
  scouted: {
    requires: 'finaleCombat', heroSkill: 'Stealth',
    text: '{hero} spotted the {monster} from a ridge before they spotted the party.',
    options: [
      { label: 'Strike at first light', desc: 'Advantage in the final fight.', effects: [{ finaleAdv: 'surprise attack' }] },
      {
        label: 'Have {hero} sneak in and steal their hoard', desc: 'Stealth check, hard. Pass: 50% more gold. Fail: the {monster} is ready and angry (+2 to its attacks).',
        effects: [{ check: { who: 'hero', skill: 'Stealth', dcMod: 2, pass: [{ goldMult: 0.5 }], fail: [{ finaleHarder: 2 }], passText: '{hero} slipped in and out with a heavy sack. Nobody noticed.', failText: 'A twig snapped under {hero}. Now everybody knows the party is here.' } }],
      },
      { label: 'Wait and let them come', desc: 'No surprises either way.', effects: [], default: true },
    ],
  },
  rivals: {
    text: 'Another adventuring company is after the same job and is a few hours ahead.',
    options: [
      { label: 'Race them', desc: '-1 to rolls for the rest of the job, 30% more gold.', effects: [{ mod: -1, label: 'rushed', scope: 'rest' }, { goldMult: 0.3 }] },
      { label: 'Offer to split the reward', desc: '30% less gold, but +2 to rolls in the final encounter.', effects: [{ goldMult: -0.3 }, { mod: 2, label: 'allies', scope: 'finale' }] },
      { label: 'Ignore them', desc: 'Let the best company win.', effects: [], default: true },
    ],
  },
  shrine: {
    heroSkill: 'Religion',
    text: 'A wayside shrine glows softly beside the path. The offering bowl is empty.',
    options: [
      {
        label: 'Have {hero} pray at the shrine', desc: 'Religion check. Pass: everyone heals and gets +1 to rolls for the rest of the job. Fail: the shrine bites back.',
        effects: [{ check: { who: 'hero', skill: 'Religion', pass: [{ heal: 5 }, { mod: 1, label: 'blessed', scope: 'rest' }], fail: [{ hurt: '1d6' }], passText: 'Warm light washed over the party. {hero} smiled for the first time in days.', failText: 'The light turned cold. {hero} apologized to the shrine. The shrine did not accept.' } }],
      },
      { label: 'Leave a coin and walk on', desc: 'A small blessing. Everyone heals a little.', effects: [{ heal: 2 }], default: true },
    ],
  },
  cache: {
    heroSkill: 'Investigation',
    text: '{hero} noticed fresh digging under an old oak, as if someone buried something in a hurry.',
    options: [
      {
        label: 'Dig it up', desc: 'Investigation check. Pass: a cache of coin. Fail: a trap, and a small purse.',
        effects: [{ check: { who: 'hero', skill: 'Investigation', pass: [{ goldPerTier: 25 }], fail: [{ hurt: '1d6' }, { goldPerTier: 5 }], passText: '{hero} found the tripwire first, then the strongbox.', failText: '{hero} found the tripwire with a shin.' } }],
      },
      { label: 'Leave it', desc: 'Somebody else\'s problem.', effects: [], default: true },
    ],
  },
  lost: {
    heroSkill: 'Survival',
    text: 'The map is wrong. The party is lost, and the light is going.',
    options: [
      {
        label: 'Trust {hero}\'s instincts', desc: 'Survival check. Pass: a shortcut that skips the next encounter. Fail: a bramble thicket.',
        effects: [{ check: { who: 'hero', skill: 'Survival', pass: [{ skipNext: true }], fail: [{ addEncounter: 'brambles' }], passText: '{hero} sniffed the wind and found a shortcut.', failText: '{hero} found a shortcut. It was not short, and it was mostly thorns.' } }],
      },
      { label: 'Backtrack to the last landmark', desc: 'Slow but certain: a hard march.', effects: [{ addEncounter: 'march' }], default: true },
    ],
  },
  vengeance: {
    requires: 'vengeance',
    text: '{hero} has gone quiet. The {monster} ahead are the same kind that took family from {hero} years ago.',
    options: [
      { label: 'Let {hero} lead the charge', desc: '{hero} gets advantage in the final fight. Counts double toward the personal goal.', effects: [{ heroFinaleAdv: 'vengeance' }, { loyalty: 1 }, { goalBoost: 1 }] },
      { label: 'Stick to the plan', desc: 'Cool heads. {hero} will not be pleased.', effects: [{ loyalty: -1 }], default: true },
    ],
  },
};

export const DISPATCH_IDS = Object.keys(DISPATCHES);
