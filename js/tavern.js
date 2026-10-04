// The tavern itself: rank, rooms, ale income and paydays. No DOM.
import { RANKS, UPGRADES } from '../data/tavern.js';
import { WAGES, MAX_MISSED_PAYDAYS } from '../data/penalties.js';
import { addLog } from './state.js';
import { changeLoyalty, firstName } from './adventurers.js';

const HOUR = 3600000;
const ALE_CAP_HOURS = 8;

export function rankIndex(renown) {
  let idx = 0;
  RANKS.forEach((r, i) => { if (renown >= r.renown) idx = i; });
  return idx;
}

export function rankOf(state) {
  const idx = state.tavern.rank;
  return { idx, rank: RANKS[idx], next: RANKS[idx + 1] || null };
}

export function upgradeLevel(state, id) {
  return state.tavern.upgrades[id] || 0;
}

function effect(state, id) {
  const lv = upgradeLevel(state, id);
  return lv ? UPGRADES[id].levels[lv - 1] : {};
}

// Everything the rooms add, in one object.
export function tavernMods(state) {
  const e = (id) => effect(state, id);
  return {
    attack: e('armory').attack || 0,
    ac: e('armory').ac || 0,
    skill: e('maproom').skill || 0,
    contract: e('maproom').contract || 0,
    finale: e('chapel').finale || 0,
    heal: !!e('chapel').heal,
    xp: e('yard').xp || 0,
    healSpeed: e('infirmary').heal || 1,
    cheapHerbs: !!e('infirmary').cheapHerbs,
    fatigueSpeed: e('kitchen').fatigue || 1,
    rations: e('kitchen').rations || 0,
    ale: e('taproom').ale || 0,
    beds: e('bunkhouse').beds || 0,
  };
}

export function rosterCap(state) {
  return RANKS[state.tavern.rank].beds + tavernMods(state).beds;
}

export function maxTier(state) {
  return RANKS[state.tavern.rank].tier;
}

export function upgradeProblem(state, id) {
  const lv = upgradeLevel(state, id);
  const next = UPGRADES[id].levels[lv];
  if (!next) return 'Fully built';
  if (state.tavern.rank < next.rank) return `Needs ${RANKS[next.rank].name.toLowerCase()}`;
  if (state.gold < next.cost) return 'Not enough gold';
  return null;
}

export function buyUpgrade(state, id, now) {
  const problem = upgradeProblem(state, id);
  if (problem) return { ok: false, reason: problem };
  const next = UPGRADES[id].levels[upgradeLevel(state, id)];
  state.gold -= next.cost;
  state.tavern.upgrades[id] = upgradeLevel(state, id) + 1;
  if (id === 'taproom' && !state.tavern.aleAt) state.tavern.aleAt = now;
  addLog(state, `Built: ${UPGRADES[id].name.toLowerCase()} (level ${state.tavern.upgrades[id]}).`, now);
  return { ok: true, name: UPGRADES[id].name, level: state.tavern.upgrades[id] };
}

// Reaching a new rank pays a reward. Returns the ranks reached, if any.
export function checkRankUp(state, now) {
  const reached = [];
  while (rankIndex(state.renown) > state.tavern.rank) {
    state.tavern.rank += 1;
    const r = RANKS[state.tavern.rank];
    state.gold += r.reward;
    addLog(state, `The tavern is now a ${r.name.toLowerCase()}. +${r.reward} gold from grateful patrons.`, now);
    reached.push({ ...r, idx: state.tavern.rank });
  }
  return reached;
}

// Renown lost to failure never drops below the current rank. Returns the amount lost.
export function loseRenown(state, n) {
  const floor = RANKS[state.tavern.rank].renown;
  const lost = Math.max(0, Math.min(n, state.renown - floor));
  state.renown -= lost;
  return lost;
}

// Ale income while away, real time, capped. Returns gold earned.
export function collectAle(state, now) {
  const rate = tavernMods(state).ale;
  if (!rate) { state.tavern.aleAt = now; return 0; }
  const start = Math.max(state.tavern.aleAt || now, now - ALE_CAP_HOURS * HOUR);
  const gold = Math.floor(((now - start) / HOUR) * rate);
  if (gold <= 0) { if (!state.tavern.aleAt) state.tavern.aleAt = now; return 0; }
  state.tavern.aleAt = start + (gold / rate) * HOUR;
  state.gold += gold;
  return gold;
}

// ---- Wages ----

export function wageOf(adv) {
  return WAGES[adv.rarity] + Math.max(0, adv.level - 1);
}

export function wagesDue(state) {
  return state.roster.reduce((s, a) => s + wageOf(a), 0);
}

export function nextPaydayAt(now) {
  const d = new Date(now);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime();
}

// Settles any paydays that have passed (at most MAX_MISSED_PAYDAYS). Returns event lines.
export function processPaydays(state, now) {
  const t = state.tavern;
  if (!t.paydayAt) { t.paydayAt = nextPaydayAt(now); return []; }
  if (now < t.paydayAt) return [];
  let missed = 0;
  while (t.paydayAt <= now) { missed += 1; t.paydayAt = nextPaydayAt(t.paydayAt); }
  const charged = Math.min(missed, MAX_MISSED_PAYDAYS);
  const events = [];
  const mods = tavernMods(state);
  for (let i = 0; i < charged; i++) {
    const due = wagesDue(state);
    if (mods.rations) state.supplies.rations = (state.supplies.rations || 0) + mods.rations;
    if (state.gold >= due) {
      state.gold -= due;
      events.push(`Payday: ${due} gold in wages.`);
      continue;
    }
    events.push(`Payday: the chest came up short of ${due} gold. Nobody got paid.`);
    for (const a of [...state.roster]) {
      changeLoyalty(a, -1);
      if (a.loyalty <= 0 && a.status === 'idle') {
        state.roster = state.roster.filter((x) => x.id !== a.id);
        events.push(`${firstName(a)} quit over unpaid wages.`);
      }
    }
  }
  for (const e of events) addLog(state, e, now);
  return events;
}
