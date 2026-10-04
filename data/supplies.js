// Supplies are bought at the quartermaster and packed for a quest. One of each is used
// per quest, except potions, which are packed by count and returned if not drunk.
export const SUPPLIES = {
  torches: { name: 'Torches', cost: 4, desc: 'Cancels night work. Foes that fear fire are easier to hit.' },
  potion: { name: 'Healing potion', cost: 12, desc: 'Drunk by anyone badly hurt: restores 2d4+2 HP. Unused potions come home.', stack: 3 },
  holyWater: { name: 'Holy water', cost: 10, desc: 'Cancels cursed ground. Hits on the dead deal +1d6.' },
  antivenom: { name: 'Antivenom', cost: 8, desc: 'Cancels venomous foes.' },
  cloaks: { name: 'Oilskin cloaks', cost: 6, desc: 'Cancels heavy rain and bitter cold.' },
  rations: { name: 'Trail rations', cost: 3, desc: 'Cancels fatigue on the long road.' },
  rope: { name: 'Rope and grapnel', cost: 5, desc: 'Advantage on rolls at heights and around water.' },
};

export const STARTING_SUPPLIES = { torches: 2, potion: 2, rations: 2 };

// counter: the supply that cancels it. boon: an opportunity rather than a hazard.
export const CONDITIONS = {
  night: {
    name: 'Night work', short: 'night', counter: 'torches',
    desc: '-2 to every roll, and every place counts as dark. Torches cancel it.',
    rollMod: -2, addTags: ['dark'],
  },
  rain: {
    name: 'Heavy rain', short: 'rain', counter: 'cloaks',
    desc: '-2 to Perception, Survival and attacks. Oilskin cloaks cancel it.',
    skillMods: { Perception: -2, Survival: -2 }, attackMod: -2,
  },
  cold: {
    name: 'Bitter cold', short: 'cold', counter: 'cloaks',
    desc: '-2 to Athletics and CON saves, and hazards hit 2 harder. Cloaks cancel it.',
    skillMods: { Athletics: -2 }, abilityMods: { con: -2 }, hazardPlus: 2,
  },
  cursed: {
    name: 'Cursed ground', short: 'curse', counter: 'holyWater',
    desc: 'The dead hit 2 harder and take longer to put down. Holy water cancels it.',
    undeadAtk: 2, undeadHp: 1.3,
  },
  venom: {
    name: 'Venomous foes', short: 'venom', counter: 'antivenom',
    desc: 'Spider bites deal an extra 1d4 poison. Antivenom cancels it.',
    venom: '1d4',
  },
  long: {
    name: 'Long road', short: 'fatigue', counter: 'rations',
    desc: 'After the halfway point, -1 to every roll. Rations cancel it.',
    fatigue: -1,
  },
  fearsFire: {
    name: 'Fears fire', short: 'fire', counter: 'torches', boon: true,
    desc: 'Bring torches and beasts and bramble horrors are 2 easier to hit.',
    fireAc: -2,
  },
};
