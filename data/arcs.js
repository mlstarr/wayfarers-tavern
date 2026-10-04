// Personal story arcs. Each hero gets one: an introduction, three beats unlocked by
// questing with them, then a personal quest only they can take. Finishing it grants
// the legacy trait and epithet and fulfils their current goal.
// Text tokens: {name}. Heroes are "they" in story text (names and pronouns are rolled separately).
// Choice fields: label, text (result), cost (gold), effects.
// Effects: loyalty, gold, xp, renown, buff { label, mod, quests }, supply { id, n }
// legacy: same effect fields as talents (mods, adv, ac, attackMod, rollMod, special) plus hp (added once).
// backgrounds: backgrounds this arc suits (more likely to be assigned).

export const STORY_AT = [0, 1, 3, 5]; // quests completed before each part unlocks

export const ARCS = {
  brother: {
    title: 'The missing brother', backgrounds: ['urchin', 'farmhand', 'sailor'],
    intro: {
      text: '{name} slides a worn drawing across the bar: a young man with the same stubborn jaw. "My brother. He rode off with a band of cutthroats a year ago. Somebody on these roads knows where he went."',
      choices: [
        { label: 'Promise to keep an ear out', text: '{name} tucks the drawing away. Nobody has offered before.', effects: [{ loyalty: 1 }] },
        { label: 'Tell {name} to focus on the work', text: '"Fair. Work first." But the drawing stays close.', effects: [{ buff: { label: 'Focused', mod: 1, quests: 1 } }] },
      ],
    },
    beats: [
      {
        text: 'A traveler recognized the drawing. The brother was seen near Kettlewick, riding with a crew that wears red scarves.',
        choices: [
          { label: 'Buy the traveler a meal', cost: 5, text: 'Over stew, the traveler adds that the crew answers to someone called the Red Hand.', effects: [{ loyalty: 1 }] },
          { label: 'Let {name} press for more', text: '{name} gets the rest of the story the hard way, and learns something about asking questions.', effects: [{ xp: 20 }] },
        ],
      },
      {
        text: '{name} came back with a red scarf torn from a fleeing cutthroat. Stitched inside is a crude map of the hills.',
        choices: [
          { label: 'Study the map together', text: 'By candlelight you trace the paths. {name} memorizes every one.', effects: [{ buff: { label: 'Determined', mod: 1, quests: 2 } }] },
          { label: 'Sell it to the town watch', text: 'The watch pays well. {name} says nothing, which says plenty.', effects: [{ gold: 30 }, { loyalty: -1 }] },
        ],
      },
      {
        text: 'The trail ends at a camp in the hills. {name} is sure the brother is there, maybe by choice. "Whatever he has become, I have to know."',
        choices: [
          { label: 'Give {name} your blessing', text: '"Thank you. For all of it."', effects: [{ loyalty: 1 }] },
          { label: 'Insist on bringing friends', text: '{name} grumbles, then looks relieved.', effects: [{ buff: { label: 'Backed up', mod: 1, quests: 1 } }] },
        ],
      },
    ],
    quest: {
      title: 'The red-scarf camp', blurb: '{name}\'s brother rides with the red-scarf crew in the hills. Bring him home, or bring home the truth.',
      pool: ['trail', 'ambush', 'march', 'villagers'], count: [2, 3], finale: 'fightBandits', party: [2, 4],
    },
    legacy: { name: 'Brother\'s keeper', desc: '+1 to every roll.', rollMod: 1 },
    epithet: 'the Seeker',
    ending: '{name} brought the brother home, thinner and ashamed and alive. The two of them sat at the bar until closing.',
  },

  oath: {
    title: 'The broken oath', backgrounds: ['knight', 'soldier', 'acolyte'],
    intro: {
      text: '{name} keeps a tarnished badge and never mentions it. Tonight, after a third ale: "I swore an oath to an order of knights. I broke it to save a friend. They cast me out."',
      choices: [
        { label: '"You kept the better oath."', text: '{name} looks up, surprised, and almost smiles.', effects: [{ loyalty: 1 }] },
        { label: '"Then prove yourself here."', text: '"I intend to."', effects: [{ buff: { label: 'Resolved', mod: 1, quests: 1 } }] },
      ],
    },
    beats: [
      {
        text: 'A knight of {name}\'s old order rode through town and spat at {name}\'s feet.',
        choices: [
          { label: 'Stand beside {name}', text: 'The knight sneers and rides on. {name} will not forget who stood up.', effects: [{ loyalty: 1 }] },
          { label: 'Tell {name} to let it go', text: '{name} swallows the insult and goes back to work, steadier for it.', effects: [{ buff: { label: 'Iron calm', mod: 1, quests: 2 } }] },
        ],
      },
      {
        text: 'A letter from the friend {name} once saved: the order\'s old chapel is overrun by the dead, and the knights who stayed are trapped inside.',
        choices: [
          { label: 'Send coin to the survivors', cost: 20, text: 'Word of the gift spreads. People speak of the tavern differently now.', effects: [{ loyalty: 2 }, { renown: 2 }] },
          { label: 'Keep it quiet for now', text: '{name} reads the letter twice and burns it. Not forgotten, though.', effects: [{ xp: 30 }] },
        ],
      },
      {
        text: '{name} has decided. "If I free the chapel, the order will have to take back what they said. Or not. Either way, it needs doing."',
        choices: [
          { label: 'Outfit {name} properly', cost: 15, text: 'New straps, a whetted blade, a polished shield.', effects: [{ buff: { label: 'Well armed', mod: 1, quests: 2 } }] },
          { label: 'Make {name} promise to come back', text: '"I promise." It sounds like an oath.', effects: [{ loyalty: 1 }] },
        ],
      },
    ],
    quest: {
      title: 'Trial at the old chapel', blurb: 'The dead hold the chapel of {name}\'s old order. Free it, and maybe win back a name.',
      pool: ['shrine', 'carvings', 'cave', 'march'], count: [2, 3], finale: 'fightDead', party: [2, 4],
    },
    legacy: { name: 'Oath restored', desc: '+2 armor class.', ac: 2 },
    epithet: 'the Restored',
    ending: 'The surviving knights knelt and returned {name}\'s badge. {name} pinned it on, then bought the whole tavern a round.',
  },

  debt: {
    title: 'The debt', backgrounds: ['smuggler', 'urchin', 'entertainer'],
    intro: {
      text: 'Two heavies came asking for {name} today. "Old business," {name} says. "I owe a man in Kettlewick called Maddox. A lot."',
      choices: [
        { label: 'Throw the heavies out', text: 'They leave. They will be back, but {name} is grateful.', effects: [{ loyalty: 1 }] },
        { label: 'Pay them off for now', cost: 15, text: 'The heavies count the coins and go. {name} owes you now, and knows it.', effects: [{ loyalty: 2 }] },
      ],
    },
    beats: [
      {
        text: 'Maddox has sent a letter: 200 gold by midsummer, or {name}\'s family pays instead.',
        choices: [
          { label: '"The tavern has your back."', text: 'For once, {name} has nothing clever to say. Just a nod.', effects: [{ loyalty: 2 }] },
          { label: '"Then we earn it."', text: '{name} cracks knuckles and asks what\'s on the board.', effects: [{ buff: { label: 'Driven', mod: 1, quests: 2 } }] },
        ],
      },
      {
        text: '{name} has learned Maddox skims from the town watch. With proof, the debt could vanish, along with Maddox.',
        choices: [
          { label: 'Help gather the proof', text: 'Late nights, borrowed ledgers, one very nervous clerk.', effects: [{ xp: 30 }] },
          { label: 'Pay toward the debt', cost: 40, text: 'Maddox\'s men take the coin and back off, for now.', effects: [{ loyalty: 2 }] },
        ],
      },
      {
        text: 'Time is up. {name} is going to Kettlewick to settle with Maddox, one way or another.',
        choices: [
          { label: '"Go in talking."', text: '{name} practices a speech in the mirror. It is a good speech.', effects: [{ loyalty: 1 }] },
          { label: '"Go in ready for a fight."', text: '{name} checks every blade twice.', effects: [{ buff: { label: 'Ready', mod: 1, quests: 1 } }] },
        ],
      },
    ],
    quest: {
      title: 'Settling accounts in Kettlewick', blurb: 'Maddox the moneylender is waiting for {name}, and so are his men.',
      pool: ['toll', 'villagers', 'strongbox', 'ambush'], count: [2, 3], finale: 'fightBandits', party: [2, 4],
    },
    legacy: { name: 'Free and clear', desc: 'Parties with {name} earn 10% more gold. +2 Persuasion.', special: 'greedy', mods: { Persuasion: 2 } },
    epithet: 'the Unbought',
    ending: 'Maddox\'s ledger went into the fire, debt and all. {name} slept until noon for the first time in years.',
  },

  curse: {
    title: 'The family curse', backgrounds: ['hunter', 'farmhand', 'herbalist'],
    intro: {
      text: '{name} woke the whole tavern howling last night. In the morning: "My family is cursed. Every generation, one of us dreams of wolves. Then the wolves come."',
      choices: [
        { label: '"Then we will be ready."', text: '{name} lets out a long breath.', effects: [{ loyalty: 1 }] },
        { label: 'Fetch a hedge-witch', cost: 10, text: 'The witch burns herbs and frowns. The curse is real, she says, but not hopeless.', effects: [{ buff: { label: 'Warded', mod: 1, quests: 2 } }] },
      ],
    },
    beats: [
      {
        text: '{name} came back pale. A huge grey wolf watched the whole party from a ridge, and did nothing.',
        choices: [
          { label: 'Ask what {name} saw', text: '"It knew me."', effects: [{ loyalty: 1 }] },
          { label: 'Double the night watch', text: 'Nothing comes. {name} sleeps a little easier.', effects: [{ buff: { label: 'Watchful', mod: 1, quests: 2 } }] },
        ],
      },
      {
        text: 'A shepherd tells of a white wolf that leads the packs under the full moon, and of a family who once bargained with it.',
        choices: [
          { label: 'Dig through the town records', text: 'An old deed names {name}\'s great-grandmother. The bargain was hers.', effects: [{ xp: 30 }] },
          { label: 'Buy silver for {name}\'s blade', cost: 20, text: 'The smith grins. "Wolves, is it?"', effects: [{ buff: { label: 'Silvered', mod: 1, quests: 3 } }] },
        ],
      },
      {
        text: 'The full moon is three nights away. "I am done running from my own dreams. I am going to find the white wolf."',
        choices: [
          { label: 'Give {name} your blessing', text: '{name} grips your hand hard.', effects: [{ loyalty: 1 }] },
          { label: 'Pack torches for the road', text: 'Fire, at least, every wolf respects.', effects: [{ supply: { id: 'torches', n: 2 } }] },
        ],
      },
    ],
    quest: {
      title: 'The wolf under the moon', blurb: 'The white wolf that haunts {name}\'s family runs with the packs at the full moon.',
      pool: ['trail', 'brambles', 'cave', 'shrine'], count: [2, 3], finale: 'fightWolves', party: [2, 4],
    },
    legacy: { name: 'Wolfblooded', desc: 'Advantage against beasts and in dark places.', adv: ['beast', 'dark'] },
    epithet: 'Moonbound',
    ending: 'The white wolf bowed its head to {name} and walked into the trees. The dreams stopped that night.',
  },

  book: {
    title: 'The stolen spellbook', backgrounds: ['apprentice', 'scholar'],
    intro: {
      text: '{name} keeps a spellbook chained to one wrist. "It is not mine. I took it from my master\'s tower when she vanished. If anyone finds out, I am finished."',
      choices: [
        { label: '"Your secret is safe here."', text: '{name} unclenches, just slightly.', effects: [{ loyalty: 1 }] },
        { label: '"Then learn to use it."', text: '{name} stays up all night reading.', effects: [{ xp: 25 }] },
      ],
    },
    beats: [
      {
        text: 'The book hums at night now. A page that was blank shows a map of the Thornwood.',
        choices: [
          { label: 'Copy the map for the tavern', text: 'The map is uncannily accurate. Parties stop getting lost.', effects: [{ buff: { label: 'Map-wise', mod: 1, quests: 2 } }] },
          { label: 'Tell {name} to close the book', text: '{name} does, and seems grateful someone said it.', effects: [{ loyalty: 1 }] },
        ],
      },
      {
        text: 'A stranger in grey asked about {name} by name, and about a missing book.',
        choices: [
          { label: 'Send the stranger away', text: 'The stranger leaves without argument. That is somehow worse.', effects: [{ loyalty: 1 }] },
          { label: 'Let {name} meet them', text: 'They talk in the yard for an hour. {name} will not say about what.', effects: [{ xp: 30 }] },
        ],
      },
      {
        text: 'The map now shows the master\'s tower, and a light in its window. "She is alive. Or something is."',
        choices: [
          { label: 'Pay for proper wards', cost: 15, text: 'Chalk circles, salt and a hedge-witch\'s blessing.', effects: [{ buff: { label: 'Warded', mod: 1, quests: 2 } }] },
          { label: 'Send {name} with your blessing', text: '"I will bring the book home. Or to its home."', effects: [{ loyalty: 1 }] },
        ],
      },
    ],
    quest: {
      title: 'Return to the tower', blurb: 'A light burns in the tower of {name}\'s vanished master, and the garden has teeth.',
      pool: ['ward', 'carvings', 'map', 'bridge'], count: [2, 3], finale: 'fightHorror', party: [2, 4],
    },
    legacy: { name: 'Keeper of the book', desc: 'Advantage in magical places. +2 Arcana.', adv: ['magic'], mods: { Arcana: 2 } },
    epithet: 'Bookbound',
    ending: 'The master was gone, but the tower knew {name}. The book unlocked its own chain and stayed anyway.',
  },

  home: {
    title: 'The burned village', backgrounds: ['farmhand', 'herbalist', 'hunter'],
    intro: {
      text: '{name} is from Millbrook, or was. "Something came out of the woods and the village burned. I was the only one who got out. I never saw what it was."',
      choices: [
        { label: 'Pour a drink and listen', text: '{name} talks until the fire burns low.', effects: [{ loyalty: 1 }] },
        { label: '"This can be home now."', text: '{name} looks around the common room as if seeing it for the first time.', effects: [{ buff: { label: 'At home', mod: 1, quests: 1 } }] },
      ],
    },
    beats: [
      {
        text: '{name} found a toy in the market, one {name} carved years ago for a neighbor\'s daughter. Someone else got out of Millbrook.',
        choices: [
          { label: 'Ask around the market', cost: 5, text: 'The trader got it from a girl living rough near the Thornwood.', effects: [{ loyalty: 1 }] },
          { label: 'Let {name} search alone', text: 'Three days later {name} comes back hollow-eyed but hopeful.', effects: [{ xp: 25 }] },
        ],
      },
      {
        text: 'The girl is real, grown now, and hiding in the woods. She says a brood of giant spiders burned Millbrook and nests in its ruins.',
        choices: [
          { label: 'Take her in at the tavern', cost: 10, text: 'She sweeps floors and tells stories. {name} has stopped having nightmares.', effects: [{ loyalty: 2 }] },
          { label: 'Give her coin for the road', cost: 5, text: 'She takes it and goes south. {name} watches until she is out of sight.', effects: [{ loyalty: 1 }] },
        ],
      },
      {
        text: '{name} wants to go back and burn the nest. "Nobody lives in Millbrook because of them. That ends now."',
        choices: [
          { label: 'Buy antivenom for the party', text: 'The apothecary says to drink it before the bite, not after.', effects: [{ supply: { id: 'antivenom', n: 1 } }] },
          { label: 'Give {name} your blessing', text: '"For Millbrook."', effects: [{ loyalty: 1 }] },
        ],
      },
    ],
    quest: {
      title: 'The ashes of Millbrook', blurb: 'The brood that burned {name}\'s village still nests in the ruins.',
      pool: ['cave', 'brambles', 'trail', 'villagers'], count: [2, 3], finale: 'fightSpider', party: [2, 4],
    },
    legacy: { name: 'Rebuilder', desc: '+6 max HP.', hp: 6 },
    epithet: 'of Millbrook',
    ending: 'The nest burned. {name} planted a sapling in the village square before coming home.',
  },

  song: {
    title: 'The lost song', backgrounds: ['entertainer', 'scholar', 'acolyte'],
    intro: {
      text: '{name} hums a tune that just stops halfway. "The Ballad of the Barrow King. Nobody knows the ending. My teacher said it was buried with him."',
      choices: [
        { label: 'Ask {name} to sing it', text: 'The room goes quiet. When it stops, people ask for the rest.', effects: [{ loyalty: 1 }] },
        { label: '"Songs do not pay the rent."', text: '"Fair. Then I will sing for coin." A hat goes round.', effects: [{ gold: 10 }] },
      ],
    },
    beats: [
      {
        text: 'An old woman in town remembers a second verse. She wants a drink for every line.',
        choices: [
          { label: 'Pay for the drinks', cost: 6, text: 'Four drinks, four lines. The song now mentions a door that opens only to music.', effects: [{ loyalty: 1 }] },
          { label: 'Let {name} charm her', text: 'It takes all evening and three songs of {name}\'s own.', effects: [{ xp: 20 }] },
        ],
      },
      {
        text: 'The new verses name a barrow outside Stonebridge. Grave robbers have been seen there.',
        choices: [
          { label: 'Warn the town watch', text: 'The watch thanks the tavern publicly.', effects: [{ renown: 2 }] },
          { label: 'Keep it quiet', text: 'Nobody beats {name} to the ending.', effects: [{ buff: { label: 'Eager', mod: 1, quests: 2 } }] },
        ],
      },
      {
        text: '{name} is ready. "I am going to sing to the dead and see if they sing back."',
        choices: [
          { label: 'Buy holy water for the road', text: 'Just in case the dead are bad critics.', effects: [{ supply: { id: 'holyWater', n: 1 } }] },
          { label: 'Give {name} your blessing', text: '{name} hums the first verse all the way out the door.', effects: [{ loyalty: 1 }] },
        ],
      },
    ],
    quest: {
      title: 'The singing barrow', blurb: 'The Barrow King took the last verse of his ballad to the grave. {name} means to hear it.',
      pool: ['carvings', 'shrine', 'cave', 'strongbox'], count: [2, 3], finale: 'fightDead', party: [2, 4],
    },
    legacy: { name: 'The last verse', desc: 'Advantage against the dead. +2 Performance and History.', adv: ['undead'], mods: { Performance: 2, History: 2 } },
    epithet: 'Songkeeper',
    ending: '{name} sang the whole ballad in the common room that night, ending and all. Nobody spoke for a long time after.',
  },

  rival: {
    title: 'The old rival', backgrounds: ['soldier', 'knight', 'sailor'],
    intro: {
      text: '"Vance Harrow," {name} spits, when a famous adventurer\'s name comes up. "We started out together. He has beaten me at everything since, and made sure everyone knew."',
      choices: [
        { label: '"Then let us make you better."', text: '{name} grins for the first time all night.', effects: [{ buff: { label: 'Fired up', mod: 1, quests: 1 } }] },
        { label: '"Forget Harrow. You are ours."', text: '{name} raises a mug to that.', effects: [{ loyalty: 1 }] },
      ],
    },
    beats: [
      {
        text: 'Harrow\'s company took a job right off your board, then bragged about it in your own common room.',
        choices: [
          { label: 'Throw Harrow\'s crew out', text: 'The regulars cheer. {name} cheers loudest.', effects: [{ loyalty: 1 }] },
          { label: 'Buy them a round and smile', cost: 8, text: 'Harrow looks confused. The town calls it gracious.', effects: [{ renown: 2 }] },
        ],
      },
      {
        text: 'Harrow has challenged {name} to settle things: a duel at Stonebridge, in front of the whole town.',
        choices: [
          { label: 'Train {name} hard', text: 'Dawn drills in the yard, every day.', effects: [{ xp: 40 }] },
          { label: 'Learn Harrow\'s tricks', cost: 10, text: 'A former squire of Harrow\'s talks, for a price.', effects: [{ buff: { label: 'Forewarned', mod: 1, quests: 2 } }] },
        ],
      },
      {
        text: 'On the eve of the duel, word comes that Harrow has hired cutthroats to make sure he wins.',
        choices: [
          { label: 'Send friends with {name}', text: '"An honest duel, then. Ours are watching."', effects: [{ buff: { label: 'Backed up', mod: 1, quests: 1 } }] },
          { label: 'Let {name} face it head on', text: '"Let him bring them. I will still be there."', effects: [{ loyalty: 1 }] },
        ],
      },
    ],
    quest: {
      title: 'The duel at Stonebridge', blurb: 'Vance Harrow is waiting at Stonebridge for {name}, with friends he should not have brought.',
      pool: ['villagers', 'ambush', 'toll'], count: [2, 2], finale: 'fightBandits', party: [2, 4],
    },
    legacy: { name: 'Unbeaten', desc: '+1 to attack rolls and +1 armor class.', attackMod: 1, ac: 1 },
    epithet: 'the Unbeaten',
    ending: 'Harrow yielded in front of the whole town. {name} helped him up, which annoyed him far more than losing.',
  },
};

export const ARC_IDS = Object.keys(ARCS);
