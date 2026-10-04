// Hero gear: weapons, armor and trinkets found on quests.
// Items use the same effect fields as traits: mods, ac, attackMod, hp, adv, special, flag.
export const GEAR_RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
export const GEAR_WEIGHTS = [55, 28, 12, 4, 1];
export const SELL_VALUE = { common: 5, uncommon: 12, rare: 30, epic: 70, legendary: 150 };
export const STASH_CAP = 24;
export const SLOTS = { weapon: 'Weapon', armor: 'Armor', trinket: 'Trinket' };

// Base items. attack / ac per rarity index (common .. epic).
export const BASES = {
  weapon: {
    names: ['Longsword', 'Battleaxe', 'Spear', 'Dagger', 'Shortbow', 'Mace', 'Quarterstaff', 'Warhammer', 'Sabre'],
    attack: [1, 1, 2, 2],
  },
  armor: {
    names: ['Leather jerkin', 'Chain shirt', 'Scale coat', 'Brigandine', 'Padded gambeson', 'Studded vest'],
    ac: [1, 1, 2, 2],
  },
  trinket: {
    names: ['Amulet', 'Ring', 'Charm', 'Brooch', 'Talisman', 'Locket'],
  },
};

// Affixes. Uncommon and rare items get one, epic items two.
export const AFFIXES = [
  { name: 'of the Owl', desc: '+1 to WIS checks', mods: { wis: 1 } },
  { name: 'of the Fox', desc: '+2 Stealth', mods: { Stealth: 2 } },
  { name: 'of the Bear', desc: '+4 max HP', hp: 4 },
  { name: 'of Warding', desc: '+1 armor class', ac: 1 },
  { name: 'of the Hawk', desc: '+2 Perception', mods: { Perception: 2 } },
  { name: 'of Silver Tongues', desc: '+2 Persuasion', mods: { Persuasion: 2 } },
  { name: 'of the Scholar', desc: '+2 Arcana and History', mods: { Arcana: 2, History: 2 } },
  { name: 'of the Wild', desc: '+2 Survival and Nature', mods: { Survival: 2, Nature: 2 } },
  { name: 'of Grace', desc: '+2 Acrobatics', mods: { Acrobatics: 2 } },
  { name: 'of Might', desc: '+2 Athletics', mods: { Athletics: 2 } },
  { name: 'of Sundering', desc: '+1 to attack rolls', attackMod: 1 },
  { name: 'of the Dawn', desc: 'advantage against the dead', adv: ['undead'] },
  { name: 'of Embers', desc: 'advantage against beasts', adv: ['beast'] },
  { name: 'of the Lantern', desc: 'advantage in dark places', adv: ['dark'] },
  { name: 'of the Deep', desc: 'advantage around water', adv: ['water'] },
  { name: 'of Nimble Fingers', desc: '+2 Sleight of Hand', mods: { 'Sleight of Hand': 2 } },
];

// Hand-written legendary items. One of each can exist.
export const LEGENDARY_GEAR = {
  dawnbreaker: { slot: 'weapon', name: 'Dawnbreaker', attackMod: 3, adv: ['undead'], story: 'Forged in the last light of a summer solstice. The dead remember it.' },
  thornheart: { slot: 'weapon', name: 'Thornheart bow', attackMod: 2, adv: ['beast'], flag: 'favoredFoe', story: 'Strung with a bramble horror\'s sinew. It hums before a hunt.' },
  greyMantle: { slot: 'armor', name: 'The Grey Mantle', ac: 3, adv: ['dark'], story: 'Worn by a scout who walked the deep wood for forty years and never got lost.' },
  wolfskin: { slot: 'armor', name: 'Cloak of the Wolf King', ac: 2, hp: 6, story: 'Made from the pelt of a wolf the size of a pony. It still growls in storms.' },
  saltwifeRing: { slot: 'trinket', name: 'The Saltwife\'s ring', special: 'lucky', mods: { Persuasion: 2 }, story: 'A sailor\'s widow wore it through three shipwrecks and never drowned.' },
  firstToll: { slot: 'trinket', name: 'Coin of the first toll', special: 'greedy', mods: { Insight: 2 }, story: 'The first coin ever paid at the crossroads. Gold follows it home.' },
};
