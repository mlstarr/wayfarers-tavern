// Game state shape, save/load and migrations. The only module that touches storage.
import { START_GOLD, START_LOYALTY } from './config.js';
import { STARTING_SUPPLIES } from '../data/supplies.js';

export const SAVE_KEY = 'wayfarers-tavern-save';
export const SAVE_VERSION = 4;

export function newGame(seed, now = Date.now()) {
  return {
    version: SAVE_VERSION,
    seed,
    createdAt: now,
    gold: START_GOLD,
    renown: 0,
    nextId: 1,
    roster: [],       // adventurers
    pending: [],      // quests in progress: { id, quest, party, startAt, endAt, result }
    reports: [],      // archive of collected reports, newest first
    board: { quests: [], refills: [], counter: 0 },
    bar: { recruits: [], arrivals: [], counter: 0 },
    supplies: { ...STARTING_SUPPLIES },
    bonds: {},        // 'a1|a2' -> number
    scenes: { slot: null, list: [] },
    tavern: { rank: 0, upgrades: {}, aleAt: null, paydayAt: null },
    flags: {},
    log: [],          // { at, text }, newest first
    stats: { questsSent: 0, questsDone: 0, triumphs: 0, goldEarned: 0 },
    settings: {},
  };
}

// version -> function upgrading a save from that version to the next
const MIGRATIONS = {
  // v1 -> v2: rolling board, supplies, bonds, scenes, talents, loyalty, goals
  1: (s) => {
    s.board = { quests: [], refills: [], counter: 0 };
    s.supplies = { ...STARTING_SUPPLIES };
    s.bonds = {};
    s.scenes = { slot: null, list: [] };
    for (const a of [...s.roster, ...(s.bar.recruits || [])]) {
      a.talents = a.talents || [];
      a.pendingTalents = a.pendingTalents || [];
      a.loyalty = a.loyalty ?? START_LOYALTY;
      a.buffs = a.buffs || [];
      a.goal = a.goal || null; // assigned on load
      a.goalsDone = a.goalsDone || 0;
    }
    return s;
  },
  // v2 -> v3: tavern rank and rooms, fatigue, injuries, story arcs (assigned on load)
  2: (s) => {
    const ranks = [0, 15, 45, 100, 200];
    s.tavern = { rank: ranks.filter((r) => s.renown >= r).length - 1, upgrades: {}, aleAt: null, paydayAt: null };
    s.flags = s.flags || {};
    for (const a of s.roster) {
      a.fatigue = 0;
      a.fatigueAt = null;
      a.injuries = [];
      a.arc = a.arc || null;
      a.legacy = a.legacy || null;
    }
    return s;
  },
  // v3 -> v4: the bar turns over continuously
  3: (s) => {
    s.bar = { recruits: [], arrivals: [], counter: 0 };
    return s;
  },
};

function migrate(state) {
  let s = state;
  while (s.version < SAVE_VERSION) {
    const step = MIGRATIONS[s.version];
    if (!step) throw new Error(`No migration from save version ${s.version}`);
    s = step(s);
    s.version += 1;
  }
  return s;
}

function storage() {
  try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch { return null; }
}

export function load() {
  const ls = storage();
  if (!ls) return null;
  try {
    const raw = ls.getItem(SAVE_KEY);
    if (!raw) return null;
    return migrate(JSON.parse(raw));
  } catch (err) {
    console.error('Save could not be loaded', err);
    return null;
  }
}

export function save(state) {
  const ls = storage();
  if (!ls) return false;
  try {
    ls.setItem(SAVE_KEY, JSON.stringify(state));
    return true;
  } catch (err) {
    console.error('Save failed', err);
    return false;
  }
}

export function clearSave() {
  const ls = storage();
  if (ls) ls.removeItem(SAVE_KEY);
}

export function exportSave(state) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(state))));
}

export function importSave(text) {
  const json = decodeURIComponent(escape(atob(text.trim())));
  const s = JSON.parse(json);
  if (!s || typeof s.seed !== 'number' || !Array.isArray(s.roster)) {
    throw new Error('That does not look like a Wayfarer\'s Tavern save.');
  }
  return migrate(s);
}

export function nextId(state, prefix) {
  return `${prefix}${state.nextId++}`;
}

export function addLog(state, text, at = Date.now(), max = 30) {
  state.log.unshift({ at, text });
  if (state.log.length > max) state.log.length = max;
}
