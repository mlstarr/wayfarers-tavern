// Bonds between adventurers: friendships and rivalries built on the road and in the tavern.
import { fatigueLevel } from './adventurers.js';
const LEVELS = [
  { min: 10, key: 'sworn', label: 'Sworn companions', mod: 2 },
  { min: 5, key: 'friends', label: 'Friends', mod: 1 },
];
const RIVALS = { max: -3, key: 'rivals', label: 'Rivals', mod: -1 };

const keyOf = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);

export function bondValue(state, a, b) {
  return (state.bonds || {})[keyOf(a, b)] || 0;
}

export function bondLevel(value) {
  if (value <= RIVALS.max) return RIVALS;
  return LEVELS.find((l) => value >= l.min) || null;
}

// Changes a bond. Returns a message if the relationship changed level.
export function addBond(state, a, b, delta, names) {
  if (!delta || a === b) return null;
  state.bonds = state.bonds || {};
  const k = keyOf(a, b);
  const before = bondLevel(state.bonds[k] || 0);
  state.bonds[k] = Math.max(-10, Math.min(20, (state.bonds[k] || 0) + delta));
  const after = bondLevel(state.bonds[k]);
  if ((before && before.key) === (after && after.key) || !names) return null;
  const [na, nb] = names;
  if (!after) return `${na} and ${nb} have put their differences behind them.`;
  if (after.key === 'rivals') return `${na} and ${nb} have become rivals.`;
  if (after.key === 'sworn') return `${na} and ${nb} are now sworn companions.`;
  return before && before.key === 'sworn' ? null : `${na} and ${nb} are now friends.`;
}

// All bonds involving one adventurer, strongest first: [{ id, value, level }].
export function bondsOf(state, id) {
  const out = [];
  for (const [k, value] of Object.entries(state.bonds || {})) {
    const [a, b] = k.split('|');
    if (a !== id && b !== id) continue;
    const level = bondLevel(value);
    if (level) out.push({ id: a === id ? b : a, value, level });
  }
  return out.sort((x, y) => Math.abs(y.value) - Math.abs(x.value));
}

export function hasFriend(state, id) {
  return bondsOf(state, id).some((b) => b.level.mod > 0);
}

const sign = (n) => (n > 0 ? `+${n}` : `${n}`);

// Roll bonus per party member from bonds, loyalty and buffs, with short labels.
export function partyBonuses(state, party) {
  const bonus = {};
  const notes = {};
  for (const a of party) {
    let total = 0;
    const n = [];
    let bond = 0;
    for (const o of party) {
      if (o.id === a.id) continue;
      const lv = bondLevel(bondValue(state, a.id, o.id));
      if (lv) bond += lv.mod;
    }
    bond = Math.max(-2, Math.min(2, bond));
    if (bond) { total += bond; n.push(`${bond > 0 ? 'bonds' : 'rivalry'} ${sign(bond)}`); }
    if ((a.loyalty || 0) >= 5) { total += 1; n.push('devoted +1'); }
    const tired = fatigueLevel(a);
    if (tired) { total += tired.mod; n.push(`${tired.label.toLowerCase()} ${tired.mod}`); }
    for (const b of a.buffs || []) { total += b.mod; n.push(`${b.label.toLowerCase()} ${sign(b.mod)}`); }
    bonus[a.id] = total;
    notes[a.id] = n;
  }
  return { bonus, notes };
}

// Pairs in the party and their current level, for display.
export function partyPairs(state, party) {
  const out = [];
  for (let i = 0; i < party.length; i++) {
    for (let j = i + 1; j < party.length; j++) {
      const lv = bondLevel(bondValue(state, party[i].id, party[j].id));
      if (lv) out.push({ a: party[i], b: party[j], level: lv });
    }
  }
  return out;
}
