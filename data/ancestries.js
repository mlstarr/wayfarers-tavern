// bonus: ability score increases. trait: optional innate effect handled in js/adventurers.js
export const ANCESTRIES = {
  human: {
    name: 'Human', weight: 30,
    bonus: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 },
  },
  dwarf: { name: 'Dwarf', weight: 14, bonus: { con: 2, str: 1 } },
  elf: { name: 'Elf', weight: 14, bonus: { dex: 2, int: 1 } },
  halfling: {
    name: 'Halfling', weight: 14, bonus: { dex: 2, cha: 1 },
    trait: 'lucky', traitText: 'Halfling luck: rerolls one natural 1 per quest.',
  },
  orc: { name: 'Orc', weight: 12, bonus: { str: 2, con: 1 } },
  gnome: { name: 'Gnome', weight: 12, bonus: { int: 2, dex: 1 } },
};

export const ANCESTRY_IDS = Object.keys(ANCESTRIES);
