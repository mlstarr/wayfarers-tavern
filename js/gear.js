// Hero gear: generation, the stash, equipping and selling. No DOM.
import {
  GEAR_RARITIES, GEAR_WEIGHTS, SELL_VALUE, STASH_CAP, BASES, AFFIXES, LEGENDARY_GEAR,
} from '../data/gear.js';
import { nextId } from './state.js';

const EPIC_WORDS = ['Ancient', 'Runed', 'Gleaming', 'Heirloom', 'Storm-forged'];
const lower = (s) => s[0].toLowerCase() + s.slice(1);

function mergeAffix(item, a) {
  if (a.mods) item.mods = { ...item.mods, ...Object.fromEntries(Object.entries(a.mods).map(([k, v]) => [k, (item.mods[k] || 0) + v])) };
  if (a.ac) item.ac = (item.ac || 0) + a.ac;
  if (a.attackMod) item.attackMod = (item.attackMod || 0) + a.attackMod;
  if (a.hp) item.hp = (item.hp || 0) + a.hp;
  if (a.adv) item.adv = [...(item.adv || []), ...a.adv];
}

export function makeItem(state, rng, slot, rIdx) {
  const base = rng.pick(BASES[slot].names);
  const item = { uid: nextId(state, 'g'), slot, rarity: GEAR_RARITIES[rIdx], base, mods: {}, legendary: null };
  if (BASES[slot].attack) item.attackMod = BASES[slot].attack[rIdx];
  if (BASES[slot].ac) item.ac = BASES[slot].ac[rIdx];
  if (slot === 'trinket' && rIdx === 0) item.hp = 3;
  const affixes = rIdx === 0 ? [] : rng.shuffle(AFFIXES).slice(0, rIdx === 3 ? 2 : 1);
  for (const a of affixes) mergeAffix(item, a);
  const suffix = affixes.length ? ` ${affixes[0].name}` : '';
  item.name = rIdx === 0 ? base
    : rIdx === 1 ? `${base}${suffix}`
      : rIdx === 2 ? `Masterwork ${lower(base)}${suffix}`
        : `${rng.pick(EPIC_WORDS)} ${lower(base)}${suffix}`;
  return item;
}

function makeLegendary(state, id) {
  const L = LEGENDARY_GEAR[id];
  return { uid: nextId(state, 'g'), rarity: 'legendary', base: L.name, legendary: id, mods: {}, ...L };
}

// Maybe finds an item after a quest. Returns the item or null.
export function rollLoot(state, quest, outcome, rng) {
  if (outcome === 'disaster') return null;
  const bonus = { triumph: 0.15, success: 0.08, costly: 0, failure: -0.12 }[outcome] || 0;
  const special = quest.expedition ? 0.3 : quest.personal || quest.legend ? 0.2 : 0;
  const chance = Math.max(0, Math.min(0.9, 0.12 + 0.06 * quest.tier + bonus + special));
  if (!rng.chance(chance)) return null;
  const weights = GEAR_WEIGHTS.map((w, i) => [i, w * (1 + 0.35 * (quest.tier - 1) * i + (quest.expedition ? 0.4 * i : 0))]);
  let rIdx = rng.weighted(weights);
  if (rIdx === 4) {
    state.flags.legendaryGear = state.flags.legendaryGear || [];
    const free = Object.keys(LEGENDARY_GEAR).filter((id) => !state.flags.legendaryGear.includes(id));
    if (free.length) {
      const id = rng.pick(free);
      state.flags.legendaryGear.push(id);
      return makeLegendary(state, id);
    }
    rIdx = 3;
  }
  return makeItem(state, rng, rng.pick(['weapon', 'armor', 'trinket']), rIdx);
}

// Puts an item in the stash, or sells it if the stash is full. Returns gold earned.
export function addToStash(state, item) {
  if (state.stash.length >= STASH_CAP) {
    state.gold += SELL_VALUE[item.rarity];
    return SELL_VALUE[item.rarity];
  }
  state.stash.push(item);
  return 0;
}

export function itemDesc(item) {
  const parts = [];
  if (item.attackMod) parts.push(`+${item.attackMod} to attack rolls`);
  if (item.ac) parts.push(`+${item.ac} armor class`);
  if (item.hp) parts.push(`+${item.hp} max HP`);
  for (const [k, v] of Object.entries(item.mods || {})) parts.push(`+${v} ${k.length === 3 ? `${k.toUpperCase()} checks` : k}`);
  const tagNames = { undead: 'the dead', beast: 'beasts', dark: 'dark places', water: 'water', magic: 'magical places' };
  for (const t of item.adv || []) parts.push(`advantage against ${tagNames[t] || t}`);
  if (item.special === 'lucky') parts.push('rerolls one natural 1 per quest');
  if (item.special === 'greedy') parts.push('party earns 10% more gold');
  if (item.flag === 'favoredFoe') parts.push('+1d6 damage against beasts');
  return parts.join(', ');
}

function setHpFor(adv, item, sign) {
  if (!item || !item.hp) return;
  adv.maxHp += sign * item.hp;
  adv.hp = Math.max(1, Math.min(adv.maxHp, adv.hp + sign * item.hp));
}

export function equip(state, advId, uid) {
  const adv = state.roster.find((a) => a.id === advId);
  const item = state.stash.find((i) => i.uid === uid);
  if (!adv || !item) return { ok: false, reason: 'Item not found' };
  if (adv.status !== 'idle') return { ok: false, reason: 'Heroes can only change gear at the tavern' };
  adv.gear = adv.gear || {};
  const old = adv.gear[item.slot];
  if (old) { setHpFor(adv, old, -1); state.stash.push(old); }
  state.stash = state.stash.filter((i) => i.uid !== uid);
  adv.gear[item.slot] = item;
  setHpFor(adv, item, 1);
  return { ok: true, item, old };
}

export function unequip(state, advId, slot) {
  const adv = state.roster.find((a) => a.id === advId);
  const item = adv && adv.gear && adv.gear[slot];
  if (!item) return { ok: false, reason: 'Nothing equipped' };
  if (adv.status !== 'idle') return { ok: false, reason: 'Heroes can only change gear at the tavern' };
  if (state.stash.length >= STASH_CAP) return { ok: false, reason: 'The armory is full' };
  setHpFor(adv, item, -1);
  delete adv.gear[slot];
  state.stash.push(item);
  return { ok: true, item };
}

export function sellItem(state, uid) {
  const item = state.stash.find((i) => i.uid === uid);
  if (!item) return 0;
  state.stash = state.stash.filter((i) => i.uid !== uid);
  state.gold += SELL_VALUE[item.rarity];
  return SELL_VALUE[item.rarity];
}

// Gear a hero carries when they leave the company goes back to the armory.
export function returnGear(state, adv) {
  for (const item of Object.values(adv.gear || {})) addToStash(state, item);
  adv.gear = {};
}
