// Tokens: {name}, {n}, {target}, {bard}. Avoid pronouns: names and pronouns are rolled separately.
export const NAT20_LINES = [
  '{name} rolled a natural 20. Even the trees seemed impressed.',
  'A natural 20 for {name}. That one is going in the song.',
  '{name} rolled a natural 20 and has not stopped mentioning it.',
];

export const NAT1_LINES = [
  '{name} rolled a natural 1. Nobody saw. Everybody saw.',
  'A natural 1 for {name}, whose dignity is still somewhere back there.',
  '{name} rolled a natural 1 and blamed the dice. The dice blamed {name}.',
];

export const CRIT_LINES = [
  '{name} landed a critical blow.',
  '{name} found the gap in the armor. Critical hit.',
];

export const FALL_LINES = [
  '{name} went down hard and had to be carried.',
  '{name} fell and had to be dragged clear of the fight.',
];

export const HEAL_LINES = [
  '{name} tended to {target}\'s wounds (+{n} HP).',
  '{name} murmured a prayer over {target} (+{n} HP).',
];

export const SECOND_WIND_LINES = [
  '{name} gritted teeth and found a second wind (+{n} HP).',
];

export const INSPIRE_LINES = [
  '{bard} struck up a tune at exactly the right moment (+{n}).',
];

export const LUCK_LINES = [
  '{name}\'s luck held: the 1 became a {n}.',
];

export const OUTCOMES = {
  triumph: { label: 'Triumph', lines: ['A triumph. The tale will be told for weeks.', 'Flawless. The tavern will be buying them drinks all night.'] },
  success: { label: 'Success', lines: ['The job is done, and done well.', 'Mission accomplished, with only the usual bruises.'] },
  costly: { label: 'Costly success', lines: ['They got it done, but it cost them.', 'A win, of sorts. Nobody is smiling.'] },
  failure: { label: 'Failure', lines: ['They came back with less than they left with.', 'Not every road ends well.'] },
  disaster: { label: 'Disaster', lines: ['A disaster. They limped home in the dark.', 'Nobody wants to talk about it.'] },
};
