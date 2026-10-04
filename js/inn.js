// Recruits at the bar, hiring and dismissing, and the quartermaster. Rooms live in js/tavern.js.
import { Rng, seedFrom } from './rng.js';
import { BAR_SIZE, BAR_STAY, BAR_ARRIVE, ROUND_COST, MIN } from './config.js';
import { paceOf } from './pace.js';
import { rosterCap } from './tavern.js';
import { assignArc } from './stories.js';
import { generateAdventurer, addHistory, fullName } from './adventurers.js';
import { nextId, addLog } from './state.js';
import { SUPPLIES } from '../data/supplies.js';
import { recordRecruit, recruitBoost } from './collection.js';
import { returnGear } from './gear.js';

export const HIRE_COST = { common: 20, uncommon: 45, rare: 90, epic: 180, legendary: 350 };
export const hireCost = (adv) => (adv.legendId ? 0 : HIRE_COST[adv.rarity]);

// Early-game pacing applies at the bar too, so the first recruits turn over quickly.
const paceMin = (state) => MIN * Math.max(0.25, paceOf(state).scale);

function arrive(state, now) {
  const b = state.bar;
  const n = b.counter++;
  const rng = new Rng(seedFrom(state.seed, 'recruit', n));
  const adv = generateAdventurer(rng.fork('adv'), { boost: recruitBoost(state) });
  adv.id = `r${n}`;
  adv.arrivedAt = now;
  adv.leavesAt = now + rng.int(BAR_STAY[0], BAR_STAY[1]) * paceMin(state);
  b.recruits.push(adv);
}

// Recruits come and go: each waits a few hours, then a new face takes the stool.
// Returns true if the bar changed.
export function refreshBar(state, now) {
  const b = state.bar;
  let changed = false;
  const before = b.recruits.length;
  b.recruits = b.recruits.filter((r) => r.leavesAt > now);
  if (b.recruits.length !== before) changed = true;
  const due = b.arrivals.filter((t) => t <= now);
  if (due.length) {
    b.arrivals = b.arrivals.filter((t) => t > now);
    for (let k = 0; k < due.length; k++) arrive(state, now);
    changed = true;
  }
  if (b.counter === 0) {
    for (let k = 0; k < BAR_SIZE; k++) arrive(state, now);
    changed = true;
  }
  while (b.recruits.length + b.arrivals.length < BAR_SIZE) {
    b.arrivals.push(now + BAR_ARRIVE * paceMin(state));
    changed = true;
  }
  return changed;
}

export function nextArrivalAt(state) {
  return state.bar.arrivals.length ? Math.min(...state.bar.arrivals) : null;
}

export function roundCost(state) {
  return ROUND_COST[0] + ROUND_COST[1] * state.tavern.rank;
}

// Pay for a round: everyone at the bar moves on and new faces arrive at once.
export function buyRound(state, now) {
  const cost = roundCost(state);
  if (state.gold < cost) return { ok: false, reason: 'Not enough gold' };
  state.gold -= cost;
  state.bar.recruits = state.bar.recruits.filter((r) => r.legendId);
  state.bar.arrivals = [];
  for (let k = 0; k < BAR_SIZE; k++) arrive(state, now);
  addLog(state, `You bought a round. Word gets out, and new faces drift in.`, now);
  return { ok: true, cost };
}

// Wave a recruit off; someone new sits down shortly after.
export function sendAway(state, recruitId, now) {
  if ((state.bar.recruits.find((r) => r.id === recruitId) || {}).legendId) return false;
  const before = state.bar.recruits.length;
  state.bar.recruits = state.bar.recruits.filter((r) => r.id !== recruitId);
  if (state.bar.recruits.length === before) return false;
  refreshBar(state, now);
  return true;
}

export function hireProblem(state, adv) {
  if (state.roster.length >= rosterCap(state)) return 'No free beds';
  if (state.gold < hireCost(adv)) return 'Not enough gold';
  return null;
}

export function hire(state, recruitId, now) {
  const adv = state.bar.recruits.find((r) => r.id === recruitId);
  if (!adv) return { ok: false, reason: 'That recruit has moved on' };
  const problem = hireProblem(state, adv);
  if (problem) return { ok: false, reason: problem };
  state.gold -= hireCost(adv);
  state.bar.recruits = state.bar.recruits.filter((r) => r.id !== recruitId);
  adv.id = nextId(state, 'a');
  adv.recruitedAt = now;
  addHistory(adv, 'Signed on at the Wayfarer\'s Tavern.', now);
  assignArc(state, adv);
  recordRecruit(state, adv);
  state.roster.push(adv);
  addLog(state, `${fullName(adv)} joined the company.`, now);
  return { ok: true, adv };
}

export function dismiss(state, advId, now) {
  const adv = state.roster.find((a) => a.id === advId);
  if (!adv || adv.status !== 'idle') return false;
  state.roster = state.roster.filter((a) => a.id !== advId);
  returnGear(state, adv);
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
    assignArc(state, adv);
    recordRecruit(state, adv);
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

// Auto-restock: keeps each supply topped up to the player's chosen level after use.
// Never spends gold needed for the next payday. Returns { id: count bought }.
export function restockTargets(state) {
  state.settings.restock = state.settings.restock || {};
  return state.settings.restock;
}

export function setRestockTarget(state, id, n) {
  const t = restockTargets(state);
  if (n > 0) t[id] = n; else delete t[id];
}

export function autoRestock(state, reserve = 0) {
  if (state.settings.autoRestock === false) return {};
  const bought = {};
  for (const [id, target] of Object.entries(restockTargets(state))) {
    const s = SUPPLIES[id];
    if (!s) continue;
    while ((state.supplies[id] || 0) < target && state.gold - s.cost >= reserve) {
      state.gold -= s.cost;
      state.supplies[id] = (state.supplies[id] || 0) + 1;
      bought[id] = (bought[id] || 0) + 1;
    }
  }
  return bought;
}
