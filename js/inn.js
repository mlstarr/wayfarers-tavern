// The inn: recruits at the bar, hiring and dismissing. (Rooms and upgrades arrive in M3.)
import { Rng, seedFrom } from './rng.js';
import { BAR_SIZE, ROSTER_CAP } from './config.js';
import { generateAdventurer, addHistory, fullName } from './adventurers.js';
import { nextId, addLog } from './state.js';
import { SUPPLIES } from '../data/supplies.js';

export const HIRE_COST = { common: 20, uncommon: 45, rare: 90, epic: 180, legendary: 350 };

export function barKey(now) {
  const d = new Date(now);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function nextBarAt(now) {
  const d = new Date(now);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime();
}

// New faces at the bar each day. Returns true if the bar changed.
export function refreshBar(state, now) {
  const key = barKey(now);
  if (state.bar.epoch === key) return false;
  const rng = new Rng(seedFrom(state.seed, 'bar', key));
  const recruits = [];
  for (let i = 0; i < BAR_SIZE; i++) {
    const adv = generateAdventurer(rng.fork(`r${i}`));
    adv.id = `r-${key}-${i}`;
    recruits.push(adv);
  }
  state.bar = { epoch: key, recruits };
  return true;
}

export function hireProblem(state, adv) {
  if (state.roster.length >= ROSTER_CAP) return 'Roster is full';
  if (state.gold < HIRE_COST[adv.rarity]) return 'Not enough gold';
  return null;
}

export function hire(state, recruitId, now) {
  const adv = state.bar.recruits.find((r) => r.id === recruitId);
  if (!adv) return { ok: false, reason: 'That recruit has moved on' };
  const problem = hireProblem(state, adv);
  if (problem) return { ok: false, reason: problem };
  state.gold -= HIRE_COST[adv.rarity];
  state.bar.recruits = state.bar.recruits.filter((r) => r.id !== recruitId);
  adv.id = nextId(state, 'a');
  adv.recruitedAt = now;
  addHistory(adv, 'Signed on at the Wayfarer\'s Tavern.', now);
  state.roster.push(adv);
  addLog(state, `${fullName(adv)} joined the company.`, now);
  return { ok: true, adv };
}

export function dismiss(state, advId, now) {
  const adv = state.roster.find((a) => a.id === advId);
  if (!adv || adv.status !== 'idle') return false;
  state.roster = state.roster.filter((a) => a.id !== advId);
  addLog(state, `${fullName(adv)} settled the tab and left for the road.`, now);
  return true;
}

// The first three regulars of a new game.
export function startingParty(state, now) {
  const rng = new Rng(seedFrom(state.seed, 'start'));
  const third = rng.pick(['cleric', 'wizard', 'bard']);
  for (const cls of ['fighter', 'rogue', third]) {
    const adv = generateAdventurer(rng.fork(cls), { cls, rarity: rng.chance(0.3) ? 'uncommon' : 'common' });
    adv.id = nextId(state, 'a');
    adv.recruitedAt = now;
    addHistory(adv, 'One of the tavern\'s first regulars.', now);
    state.roster.push(adv);
  }
}

// The quartermaster: supplies for the road.
export function buySupply(state, id, now) {
  const s = SUPPLIES[id];
  if (!s) return { ok: false, reason: 'Unknown supply' };
  if (state.gold < s.cost) return { ok: false, reason: 'Not enough gold' };
  state.gold -= s.cost;
  state.supplies[id] = (state.supplies[id] || 0) + 1;
  return { ok: true, supply: s, count: state.supplies[id], at: now };
}
