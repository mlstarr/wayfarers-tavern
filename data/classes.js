// priority: ability order for assigning rolled scores (best roll first)
// ac: base armor class; dexCap: max DEX modifier added; conAc: add CON modifier (unarmored)
export const CLASSES = {
  fighter: {
    name: 'Fighter', hitDie: 10, attack: 'str', damage: '1d8', ac: 16, dexCap: 0,
    priority: ['str', 'con', 'dex', 'wis', 'cha', 'int'],
    skills: ['Athletics', 'Intimidation', 'Perception'],
    perk: 'secondWind', perkText: 'Second wind: once per quest, recovers when badly hurt.',
    color: '#8c2f2f',
  },
  rogue: {
    name: 'Rogue', hitDie: 8, attack: 'dex', damage: '1d6', ac: 11, dexCap: 5,
    priority: ['dex', 'int', 'con', 'wis', 'cha', 'str'],
    skills: ['Stealth', 'Sleight of Hand', 'Acrobatics', 'Perception', 'Investigation'],
    perk: 'sneak', perkText: 'Sneak attack: first hit in each fight deals an extra 1d6.',
    color: '#3b3f46',
  },
  cleric: {
    name: 'Cleric', hitDie: 8, attack: 'wis', damage: '1d8', ac: 16, dexCap: 0,
    priority: ['wis', 'con', 'str', 'cha', 'int', 'dex'],
    skills: ['Religion', 'Medicine', 'Insight'],
    perk: 'heal', perkText: 'Healing: once per quest, restores the most wounded ally, even a fallen one.',
    color: '#b08a2e',
  },
  wizard: {
    name: 'Wizard', hitDie: 6, attack: 'int', damage: '1d10', ac: 10, dexCap: 5,
    priority: ['int', 'dex', 'con', 'wis', 'cha', 'str'],
    skills: ['Arcana', 'History', 'Investigation'],
    perk: 'arcane', perkText: 'Arcane insight: advantage on every roll in magical places.',
    color: '#34508c',
  },
  ranger: {
    name: 'Ranger', hitDie: 10, attack: 'dex', damage: '1d8', ac: 12, dexCap: 3,
    priority: ['dex', 'wis', 'con', 'str', 'int', 'cha'],
    skills: ['Survival', 'Nature', 'Perception', 'Stealth'],
    perk: 'hunter', perkText: 'Hunter: advantage on attacks against beasts.',
    color: '#3f6b3a',
  },
  bard: {
    name: 'Bard', hitDie: 8, attack: 'cha', damage: '1d6', ac: 11, dexCap: 5,
    priority: ['cha', 'dex', 'con', 'wis', 'int', 'str'],
    skills: ['Persuasion', 'Performance', 'Deception', 'Insight'],
    perk: 'inspire', perkText: 'Inspiration: once per quest, adds 1d6 to an ally\'s failed check.',
    color: '#8a3f74',
  },
  paladin: {
    name: 'Paladin', hitDie: 10, attack: 'str', damage: '1d8', ac: 18, dexCap: 0,
    priority: ['str', 'cha', 'con', 'wis', 'dex', 'int'],
    skills: ['Athletics', 'Religion', 'Persuasion'],
    perk: 'smite', perkText: 'Smite: first hit in each fight deals an extra 2d8 (3d8 against the dead).',
    color: '#c0a35a',
  },
  barbarian: {
    name: 'Barbarian', hitDie: 12, attack: 'str', damage: '1d12', ac: 10, dexCap: 5, conAc: true,
    priority: ['str', 'con', 'dex', 'wis', 'cha', 'int'],
    skills: ['Athletics', 'Survival', 'Intimidation'],
    perk: 'rage', perkText: 'Rage: +2 damage on every hit.',
    color: '#a2522a',
  },
};

export const CLASS_IDS = Object.keys(CLASSES);
