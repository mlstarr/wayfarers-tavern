// Personal goals. One active goal per adventurer; finishing it raises loyalty and an ability.
// type: slay (defeat a monster kind n times) | gold (earn n gold on quests) | triumph (n triumphs)
//       | quest (succeed at a quest type) | nat20 (roll n natural 20s) | bond (make a friend) | level
// Text tokens: {plural} monster plural, {n}, {quest}
export const GOALS = [
  { id: 'avenge', type: 'slay', weight: 3, text: 'Avenge a sibling lost to the {plural}: defeat them {n} times.', n: [2, 3], targets: ['wolves', 'bandits', 'spider', 'dead', 'boar', 'horror'] },
  { id: 'farm', type: 'gold', weight: 2, text: 'Earn {n} gold on the road and buy a farm of their own one day.', n: [300, 400, 500] },
  { id: 'songs', type: 'triumph', weight: 2, text: 'Earn a place in the songs: win {n} triumphs.', n: [2, 3, 4] },
  { id: 'barrow', type: 'quest', weight: 1, text: 'Find out what really lies beneath the old barrow.', target: 'barrow' },
  { id: 'tower', type: 'quest', weight: 1, text: 'Learn what became of the hedge-wizard who taught them their letters.', target: 'tower' },
  { id: 'caravan', type: 'quest', weight: 1, text: 'Recover the family spice caravan, or what is left of it.', target: 'caravan' },
  { id: 'luck', type: 'nat20', weight: 1, text: 'Prove that luck is a skill: roll {n} natural 20s.', n: [2, 3] },
  { id: 'friend', type: 'bond', weight: 1, text: 'Find a true friend on the road.' },
  { id: 'doubters', type: 'level', weight: 1, text: 'Reach level {n} and prove the doubters back home wrong.' },
];

export const GOAL_QUEST_NAMES = {
  barrow: 'Trouble at the old barrow',
  tower: 'The hedge-wizard\'s tower',
  caravan: 'The missing caravan',
};
