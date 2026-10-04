// Chosen at level-up (one of two offered). Same effect fields as quirks
// (mods, adv, dis, hp) plus ac and flag; flags are read by js/checks.js and js/resolve.js.
// classes: limits a talent to those classes. minLevel: earliest level it can be offered.
export const TALENTS = {
  // General
  hardy: { name: 'Hardy', desc: '+5 max HP.', hp: 5 },
  keenSenses: { name: 'Keen senses', desc: '+2 Perception and Survival.', mods: { Perception: 2, Survival: 2 } },
  smooth: { name: 'Smooth talker', desc: '+2 Persuasion and Insight.', mods: { Persuasion: 2, Insight: 2 } },
  nimble: { name: 'Nimble', desc: '+2 Acrobatics and Stealth.', mods: { Acrobatics: 2, Stealth: 2 } },
  wellRead: { name: 'Well read', desc: '+2 Arcana, History and Religion.', mods: { Arcana: 2, History: 2, Religion: 2 } },
  steadyNerves: { name: 'Steady nerves', desc: 'Advantage in dark places and against the dead.', adv: ['dark', 'undead'] },
  wildWise: { name: 'Wild-wise', desc: 'Advantage against beasts and around water.', adv: ['beast', 'water'] },
  athlete: { name: 'Athlete', desc: '+2 Athletics and +1 to CON saves.', mods: { Athletics: 2, con: 1 } },
  nimbleFingers: { name: 'Nimble fingers', desc: '+3 Sleight of Hand and Investigation.', mods: { 'Sleight of Hand': 3, Investigation: 3 } },

  // Class
  extraAttack: { name: 'Extra attack', desc: 'Attacks twice each round.', classes: ['fighter', 'paladin', 'barbarian', 'ranger'], minLevel: 3, flag: 'extraAttack' },
  shieldWall: { name: 'Shield wall', desc: '+2 armor class.', classes: ['fighter', 'paladin', 'cleric'], ac: 2 },
  assassin: { name: 'Assassin', desc: 'Sneak attack deals 3d6.', classes: ['rogue'], flag: 'sneakPlus' },
  evasion: { name: 'Evasion', desc: 'Takes half damage from traps and hazards.', classes: ['rogue', 'ranger', 'bard'], flag: 'evasion' },
  mercy: { name: 'Font of mercy', desc: 'Can heal twice per quest.', classes: ['cleric'], flag: 'healPlus' },
  fireball: { name: 'Fireball', desc: 'Spells deal 2d10 instead of 1d10.', classes: ['wizard'], flag: 'bigSpell' },
  shieldSpell: { name: 'Shield spell', desc: '+3 armor class.', classes: ['wizard'], ac: 3 },
  ballad: { name: 'Rousing ballad', desc: 'Inspires twice per quest, with 1d8.', classes: ['bard'], flag: 'inspirePlus' },
  radiant: { name: 'Radiant smite', desc: 'Smite deals 3d8, and every hit on the dead smites.', classes: ['paladin'], flag: 'smitePlus' },
  thickSkin: { name: 'Thick skin', desc: 'Takes 2 less damage from every enemy hit.', classes: ['barbarian', 'fighter'], flag: 'damageResist' },
  favoredFoe: { name: 'Favored foe', desc: '+1d6 damage against beasts.', classes: ['ranger', 'barbarian'], flag: 'favoredFoe' },
};

export const TALENT_IDS = Object.keys(TALENTS);
