// Common-room scenes: small moments between quests. actors: 1 or 2 idle adventurers ({a}, {b}).
// needs (optional): { cls: [...] } | { quirk } | { bond: 'friends' | 'rivals' } | { loyaltyMax } | { hurt: true }
// choice: { label, cost (gold, optional), effects, text }
// Effects: gold, bond, loyalty { who: 'a'|'b'|'both', n }, buff { who, label, mod, quests },
//   hp { who, n }, xp { who, n }, quirk { who, id, p },
//   check { who: 'a'|'b'|'best', skill | ability, dc, pass, fail, passText, failText },
//   coin { win, lose, winText, loseText } (a plain d20: 11 or more wins)
export const SCENES = [
  {
    id: 'stew', actors: 2,
    text: '{a} and {b} are arguing over the last bowl of stew. Voices are rising.',
    choices: [
      { label: 'Side with {a}', effects: [{ bond: -2 }, { loyalty: { who: 'a', n: 1 } }, { loyalty: { who: 'b', n: -1 } }], text: '{a} eats smugly. {b} will remember this.' },
      { label: 'Cook another pot', cost: 5, effects: [{ bond: 1 }, { loyalty: { who: 'both', n: 1 } }], text: 'Two full bowls, two happy adventurers.' },
      {
        label: 'Let them sort it out', effects: [{
          check: { who: 'a', skill: 'Persuasion', dc: 12, pass: [{ bond: 2 }], fail: [{ bond: -2 }, { hp: { who: 'both', n: -2 } }], passText: '{a} talked {b} into splitting it. They ended up laughing.', failText: 'Fists flew. The stew lost.' },
        }],
      },
    ],
  },
  {
    id: 'armwrestle', actors: 2,
    text: '{a} has challenged {b} to an arm-wrestling match. The regulars are placing bets.',
    choices: [
      {
        label: 'Bet 10 gold on {a}', cost: 10, effects: [{
          check: { who: 'a', skill: 'Athletics', dc: 12, pass: [{ gold: 25 }, { loyalty: { who: 'a', n: 1 } }], fail: [], passText: '{a} slammed {b}\'s hand down. You collect 25 gold.', failText: '{b} won. Your 10 gold is gone.' },
        }],
      },
      {
        label: 'Bet 10 gold on {b}', cost: 10, effects: [{
          check: { who: 'b', skill: 'Athletics', dc: 12, pass: [{ gold: 25 }, { loyalty: { who: 'b', n: 1 } }], fail: [], passText: '{b} won to roaring cheers. You collect 25 gold.', failText: '{a} won. Your 10 gold is gone.' },
        }],
      },
      { label: 'Call it a draw', effects: [{ bond: 1 }], text: 'They shake on it and buy each other a drink.' },
    ],
  },
  {
    id: 'song', actors: 1, needs: { cls: ['bard', 'rogue', 'paladin', 'cleric'] },
    text: '{a} offers to entertain the crowd tonight.',
    choices: [
      {
        label: 'Pass the hat', effects: [{
          check: { who: 'a', skill: 'Performance', dc: 11, pass: [{ gold: 20 }, { loyalty: { who: 'a', n: 1 } }], fail: [{ loyalty: { who: 'a', n: -1 } }], passText: 'The room sang along. The hat came back heavy: 20 gold.', failText: 'Someone threw a turnip. {a} has retired from show business.' },
        }],
      },
      { label: 'Tell them to rest instead', effects: [{ buff: { who: 'a', label: 'Well rested', mod: 1, quests: 1 } }], text: '{a} sleeps like a stone and wakes up sharp.' },
    ],
  },
  {
    id: 'nightmare', actors: 1,
    text: '{a} has been waking up shouting. Something from the road is following them into sleep.',
    choices: [
      { label: 'Sit with them a while', effects: [{ loyalty: { who: 'a', n: 1 } }, { buff: { who: 'a', label: 'Steadied', mod: 1, quests: 1 } }], text: 'You talk until dawn. {a} looks lighter.' },
      { label: 'Buy them a strong drink', cost: 2, effects: [{ loyalty: { who: 'a', n: 1 } }, { quirk: { who: 'a', id: 'drinks', p: 0.25 } }], text: 'The drink helps. Maybe too much.' },
      { label: 'Leave them be', effects: [{ loyalty: { who: 'a', n: -1 } }], text: '{a} noticed nobody came.' },
    ],
  },
  {
    id: 'map', actors: 1,
    text: 'A hooded stranger is offering {a} a map "to a fortune" for 15 gold.',
    choices: [
      {
        label: 'Buy the map', cost: 15, effects: [{
          check: { who: 'a', skill: 'Insight', dc: 13, pass: [{ gold: 45 }], fail: [], passText: '{a} haggled, checked the map against old stories, and it was real. 45 gold.', failText: 'The map led to a pigsty. The pig was not impressed.' },
        }],
      },
      { label: 'Send the stranger on', effects: [], text: 'The stranger shrugs and tries the next table.' },
    ],
  },
  {
    id: 'spar', actors: 2,
    text: '{a} offers to teach {b} a few tricks in the yard.',
    choices: [
      { label: 'Spar until dusk', effects: [{ xp: { who: 'both', n: 15 } }, { bond: 1 }, { hp: { who: 'both', n: -2 } }], text: 'Bruised, sweaty and pleased with themselves.' },
      { label: 'Not today', effects: [], text: 'Maybe tomorrow.' },
    ],
  },
  {
    id: 'cards', actors: 2,
    text: '{a} has won every hand of cards tonight. {b} is starting to look suspicious.',
    choices: [
      {
        label: 'Have {b} watch closely', effects: [{
          check: { who: 'b', skill: 'Insight', dc: 13, pass: [{ bond: -2 }, { gold: 10 }], fail: [{ loyalty: { who: 'b', n: -1 } }], passText: '{b} caught a card up {a}\'s sleeve. The winnings go to the house: 10 gold.', failText: '{b} saw nothing and looks foolish for accusing anyone.' },
        }],
      },
      {
        label: 'Join the game for 10 gold', cost: 10, effects: [{
          coin: { win: [{ gold: 25 }, { bond: 1 }], lose: [], winText: 'You won the pot: 25 gold. {a} demands a rematch.', loseText: '{a} cleaned you out too.' },
        }],
      },
      { label: 'Let it go', effects: [{ bond: 1 }], text: 'Nobody wants a fight tonight.' },
    ],
  },
  {
    id: 'letter', actors: 1,
    text: 'A letter arrives for {a} from home.',
    choices: [
      { label: 'Give them the evening off', effects: [{ loyalty: { who: 'a', n: 1 } }, { buff: { who: 'a', label: 'Good news', mod: 1, quests: 1 } }], text: '{a} reads it three times, grinning.' },
      { label: 'Hand it over and get back to work', effects: [], text: '{a} pockets the letter for later.' },
    ],
  },
  {
    id: 'brawl', actors: 2,
    text: 'Some locals are picking a fight with {a}. {b} is already rolling up sleeves.',
    choices: [
      {
        label: 'Break it up', effects: [{
          check: { who: 'best', skill: 'Intimidation', dc: 12, pass: [{ loyalty: { who: 'both', n: 1 } }], fail: [{ hp: { who: 'both', n: -3 } }, { bond: 2 }], passText: 'One hard look and the locals remember somewhere else to be.', failText: 'It turned into a brawl anyway. {a} and {b} fought back to back.' },
        }],
      },
      { label: 'Pay off the locals', cost: 10, effects: [], text: 'A round of drinks buys a quiet evening.' },
      { label: 'Let them fight', effects: [{ hp: { who: 'both', n: -4 } }, { bond: 3 }], text: 'Bloody noses all round. {a} and {b} are now thick as thieves.' },
    ],
  },
  {
    id: 'dog', actors: 1,
    text: '{a} has adopted a scruffy dog. It has already eaten two chairs.',
    choices: [
      { label: 'The dog stays', cost: 5, effects: [{ loyalty: { who: 'a', n: 2 } }], text: 'The dog has a name now. You are not allowed to know it.' },
      { label: 'Find it a good home', effects: [{ loyalty: { who: 'a', n: -1 } }], text: 'A farmer takes the dog. {a} sulks for a day.' },
    ],
  },
  {
    id: 'confide', actors: 2, needs: { bond: 'friends' },
    text: '{a} quietly admits to {b} that the next road is frightening.',
    choices: [
      { label: 'Let {b} handle it', effects: [{ bond: 2 }, { buff: { who: 'both', label: 'Heartened', mod: 1, quests: 1 } }], text: '{b} says exactly the right thing. Both look braver.' },
      { label: 'Give a rousing speech yourself', effects: [{ loyalty: { who: 'both', n: 1 } }], text: 'A little overblown, but it works.' },
    ],
  },
  {
    id: 'grumble', actors: 1, needs: { loyaltyMax: 2 },
    text: '{a} is grumbling to anyone who will listen that the tavern does not appreciate them.',
    choices: [
      { label: 'Hand over a bonus', cost: 15, effects: [{ loyalty: { who: 'a', n: 2 } }], text: '{a} is suddenly very appreciative.' },
      { label: 'Remind them who took them in', effects: [{ loyalty: { who: 'a', n: -1 } }], text: '{a} goes quiet. That did not help.' },
      { label: 'Ask what they really want', effects: [{ loyalty: { who: 'a', n: 1 } }], text: 'A long talk about the road ahead. {a} seems to feel heard.' },
    ],
  },
  {
    id: 'wounds', actors: 1, needs: { hurt: true },
    text: '{a} is limping and pretending not to be.',
    choices: [
      { label: 'Send for the herbalist', cost: 8, effects: [{ hp: { who: 'a', n: 99 } }], text: 'Poultices, a stern lecture and a full recovery.' },
      { label: 'Plenty of soup and sleep', effects: [{ hp: { who: 'a', n: 4 } }, { loyalty: { who: 'a', n: 1 } }], text: '{a} appreciates the soup more than the advice.' },
    ],
  },
  {
    id: 'rivalry', actors: 2, needs: { bond: 'rivals' },
    text: '{a} and {b} are glaring at each other across the common room again.',
    choices: [
      { label: 'Make them work it out over a drink', cost: 4, effects: [{ bond: 3 }], text: 'Grudging respect, and a lot of ale.' },
      { label: 'Keep them apart', effects: [], text: 'Separate tables. It is a big tavern.' },
    ],
  },
];
