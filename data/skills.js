export const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

export const ABILITY_NAMES = {
  str: 'Strength', dex: 'Dexterity', con: 'Constitution',
  int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma',
};

export const ABILITY_SHORT = {
  str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA',
};

// skill -> governing ability
export const SKILLS = {
  Athletics: 'str',
  Acrobatics: 'dex', Stealth: 'dex', 'Sleight of Hand': 'dex',
  Arcana: 'int', History: 'int', Investigation: 'int', Nature: 'int', Religion: 'int',
  Insight: 'wis', Medicine: 'wis', Perception: 'wis', Survival: 'wis',
  Deception: 'cha', Intimidation: 'cha', Performance: 'cha', Persuasion: 'cha',
};
