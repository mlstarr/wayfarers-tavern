// Level-up talents. Every hero draws from their own pool: their class and path, their
// background, their ancestry, what grew out of their quirks, and what their deeds earned.
// Effect fields are listed in js/talent-text.js (which also writes descriptions).
// src: general | rare | class | path | background | ancestry | quirk | deed
// classes: limits to those classes. minLevel: earliest level. requires: another talent first.
// line: a short flavor line shown under the effect.
import { PATH_TALENTS } from './paths.js';
import { PERSONAL_TALENTS } from './talents-personal.js';

const CORE = {
  // ---- General: anyone can learn these ----
  hardy: { name: 'Hardy', desc: '+5 max HP.', hp: 5 },
  hardier: { name: 'Harder than nails', requires: 'hardy', hp: 7, resist: 1 },
  keenSenses: { name: 'Keen senses', desc: '+2 Perception and Survival.', mods: { Perception: 2, Survival: 2 } },
  hawkEyed: { name: 'Hawk-eyed', requires: 'keenSenses', mods: { Perception: 3 }, firstStrike: true },
  smooth: { name: 'Smooth talker', desc: '+2 Persuasion and Insight.', mods: { Persuasion: 2, Insight: 2 } },
  nimble: { name: 'Nimble', desc: '+2 Acrobatics and Stealth.', mods: { Acrobatics: 2, Stealth: 2 } },
  wellRead: { name: 'Well read', desc: '+2 Arcana, History and Religion.', mods: { Arcana: 2, History: 2, Religion: 2 } },
  steadyNerves: { name: 'Steady nerves', desc: 'Advantage in dark places and against the dead.', adv: ['dark', 'undead'] },
  wildWise: { name: 'Wild-wise', desc: 'Advantage against beasts and around water.', adv: ['beast', 'water'] },
  athlete: { name: 'Athlete', desc: '+2 Athletics and +1 to CON saves.', mods: { Athletics: 2, con: 1 } },
  nimbleFingers: { name: 'Nimble fingers', desc: '+3 Sleight of Hand and Investigation.', mods: { 'Sleight of Hand': 3, Investigation: 3 } },
  quickStudy: { name: 'Quick study', xpSelf: 0.2, line: 'Asks too many questions. Remembers every answer.' },
  thrifty: { name: 'Thrifty', wage: -1, line: 'Sleeps in the hayloft and calls it a bargain.' },
  ironStomach: { name: 'Iron stomach', fatigueResist: 1, line: 'Eats anything, sleeps anywhere, wakes up ready.' },
  mountaineer: { name: 'Mountaineer', adv: ['heights'], mods: { Athletics: 2 } },
  fieldMedic: { name: 'Field medic', mods: { Medicine: 3 }, aura: { heal: 1 } },
  linguist: { name: 'Linguist', mods: { Insight: 2, History: 2 }, adv: ['social'] },
  trapSense: { name: 'Trap sense', mods: { Investigation: 2, Perception: 1 }, hazardResist: 2 },
  lightSleeper: { name: 'Light sleeper', adv: ['dark'], rest: 0.25 },
  brawler: { name: 'Tavern brawler', attackMod: 1, mods: { Athletics: 1, Intimidation: 2 } },
  campCook: { name: 'Camp cook', aura: { heal: 1 }, fatigueResist: 1, line: 'The stew is mostly turnip. Nobody complains.' },

  // ---- Rare: seldom offered, more often to rarer heroes ----
  luckyStar: { name: 'Born under a lucky star', src: 'rare', special: 'lucky', crit: 1 },
  dragonBlood: { name: 'Dragon-blooded', src: 'rare', hp: 8, resist: 1, line: 'A great-grandmother nobody talks about.' },
  feyTouched: { name: 'Fey-touched', src: 'rare', adv: ['magic'], mods: { Arcana: 2, Insight: 2 } },
  weaponMaster: { name: 'Weapon master', src: 'rare', attackMod: 2, dmg: 1 },
  secondSight: { name: 'Second sight', src: 'rare', aura: { ambush: true }, line: 'Wakes the camp a moment before the arrows fly.' },
  unkillable: { name: 'Unkillable', src: 'rare', special: 'unbroken', hp: 4 },
  naturalLeader: { name: 'Natural leader', src: 'rare', aura: { roll: 1 } },
  livingLegend: { name: 'Destined for songs', src: 'rare', aura: { xp: 0.1, gold: 0.1 } },

  // ---- Class ----
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

  greatWeapon: { name: 'Great weapon style', classes: ['fighter', 'paladin'], dmg: 2 },
  dueling: { name: 'Dueling style', classes: ['fighter', 'paladin', 'rogue'], attackMod: 1, dmg: 1 },
  indomitable: { name: 'Indomitable', classes: ['fighter'], minLevel: 5, mods: { str: 1, con: 1, wis: 1 }, special: 'lucky' },
  tireless: { name: 'Tireless', classes: ['fighter', 'barbarian', 'ranger'], fatigueResist: 1, hp: 3 },
  actionSurge: { name: 'Action surge', classes: ['fighter'], minLevel: 4, firstStrike: true, perkUses: 1 },

  cunningAction: { name: 'Cunning action', classes: ['rogue'], ac: 1, mods: { Stealth: 2 } },
  uncannyDodge: { name: 'Uncanny dodge', classes: ['rogue', 'ranger'], minLevel: 4, resist: 2 },
  reliableTalent: { name: 'Reliable talent', classes: ['rogue', 'bard'], minLevel: 6, special: 'reliable' },
  expertise: { name: 'Expertise', classes: ['rogue', 'bard'], mods: { Stealth: 2, Persuasion: 2, 'Sleight of Hand': 2, Deception: 2 } },

  turnUndead: { name: 'Turn undead', classes: ['cleric', 'paladin'], adv: ['undead'], atkVs: { undead: 1 } },
  bless: { name: 'Bless', classes: ['cleric'], aura: { roll: 1 } },
  spiritGuardians: { name: 'Spirit guardians', classes: ['cleric'], minLevel: 5, dmg: 3, resist: 1 },
  healingWord: { name: 'Healing word', classes: ['cleric', 'bard'], healBonus: 3, aura: { heal: 1 } },

  mistyStep: { name: 'Misty step', classes: ['wizard'], flag: 'evasion', ac: 1 },
  ritualCaster: { name: 'Ritual caster', classes: ['wizard'], mods: { Arcana: 3, History: 2, Religion: 2 } },
  counterspell: { name: 'Counterspell', classes: ['wizard'], minLevel: 5, aura: { foeAtk: -1 } },
  magicMissile: { name: 'Magic missile', classes: ['wizard'], attackMod: 3, line: 'It never misses. Well, rarely.' },

  naturalExplorer: { name: 'Natural explorer', classes: ['ranger'], mods: { Survival: 3, Nature: 2 }, aura: { hazard: 1 } },
  huntersMark: { name: 'Hunter\'s mark', classes: ['ranger'], dmg: 2 },
  sharpshooter: { name: 'Sharpshooter', classes: ['ranger', 'rogue'], attackMod: -1, dmg: 5, line: 'Takes the hard shot every time.' },

  jackOfAll: { name: 'Jack of all trades', classes: ['bard'], special: 'jack' },
  songOfRest: { name: 'Song of rest', classes: ['bard'], aura: { heal: 2 } },
  countercharm: { name: 'Countercharm', classes: ['bard'], aura: { finale: 1 }, adv: ['magic'] },

  layOnHands: { name: 'Lay on hands', classes: ['paladin'], special: 'layOnHands' },
  divineHealth: { name: 'Divine health', classes: ['paladin'], fatigueResist: 1, hp: 4 },
  auraProtection: { name: 'Aura of protection', classes: ['paladin'], minLevel: 5, aura: { roll: 1 } },

  reckless: { name: 'Reckless attack', classes: ['barbarian'], adv: ['attack'], exposed: 2, line: 'Defense is for people who plan to lose.' },
  dangerSense: { name: 'Danger sense', classes: ['barbarian'], flag: 'evasion', adv: ['heights'] },
  brutalCritical: { name: 'Brutal critical', classes: ['barbarian'], minLevel: 5, crit: 1, dmg: 1 },
  fastMovement: { name: 'Fast movement', classes: ['barbarian'], ac: 1, mods: { Athletics: 2, Acrobatics: 1 } },
};

for (const t of Object.values(CORE)) t.src = t.src || (t.classes ? 'class' : 'general');

export const TALENTS = { ...CORE, ...PATH_TALENTS, ...PERSONAL_TALENTS };
export const TALENT_IDS = Object.keys(TALENTS);
