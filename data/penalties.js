// Lasting injuries from falling on a quest. heal: game-minutes of rest to recover.
// Same effect fields as quirks (mods, dis) plus rollMod (every roll) and attackMod.
export const INJURIES = {
  brokenArm: { name: 'Broken arm', desc: '-2 to attack rolls.', attackMod: -2, heal: 180 },
  crackedRibs: { name: 'Cracked ribs', desc: '-2 to Athletics and CON saves.', mods: { Athletics: -2, con: -2 }, heal: 120 },
  sprainedAnkle: { name: 'Sprained ankle', desc: '-2 to Acrobatics and Stealth.', mods: { Acrobatics: -2, Stealth: -2 }, heal: 90 },
  concussion: { name: 'Concussion', desc: '-2 to INT and WIS checks.', mods: { int: -2, wis: -2 }, heal: 120 },
  bloodLoss: { name: 'Blood loss', desc: '-1 to every roll.', rollMod: -1, heal: 90 },
  shaken: { name: 'Shaken nerves', desc: 'Disadvantage in dark places.', dis: ['dark'], heal: 60 },
};
export const INJURY_IDS = Object.keys(INJURIES);

export const HERBALIST_COST = 15;        // gold to heal one injury at once

// Fatigue: +1 per quest, +2 per expedition, max 4. Fades by 1 per FATIGUE_MIN game-minutes of rest.
export const FATIGUE_MIN = 45;
export const FATIGUE_LEVELS = [
  { min: 3, label: 'Exhausted', mod: -2 },
  { min: 2, label: 'Tired', mod: -1 },
];

// Daily wages by rarity, plus 1 per level above 1. Paid at local midnight.
export const WAGES = { common: 3, uncommon: 5, rare: 8, epic: 12, legendary: 18 };
export const MAX_MISSED_PAYDAYS = 2;     // time away is never charged for more than this

// Renown lost on a bad outcome, per quest tier.
export const RENOWN_LOSS = { failure: 1, disaster: 2 };

// Contracts: a deposit up front, lost on failure, for a bigger purse.
export const CONTRACT = { chance: 0.25, deposit: 0.35, payout: 1.8 };
