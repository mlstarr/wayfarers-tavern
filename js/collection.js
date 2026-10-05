// The tavern owner's collections: trophies, the bestiary and codex, and loot after quests. No DOM.
import { TROPHIES, TROPHY_SETS, PRESTIGE, DUPLICATE_GOLD } from '../data/trophies.js';
import { BESTIARY, KNOWLEDGE } from '../data/bestiary.js';
import { MONSTERS } from '../data/monsters.js';
import { PLACES } from '../data/quests.js';
import { CLASS_IDS } from '../data/classes.js';
import { ANCESTRY_IDS } from '../data/ancestries.js';
import { QUIRK_IDS } from '../data/quirks.js';
import { LEGEND_IDS, LEGENDS } from '../data/legends.js';
import { LEGENDARY_GEAR } from '../data/gear.js';
import { Rng, seedFrom } from './rng.js';
import { tavernMods } from './tavern.js';
import { rollLoot, addToStash } from './gear.js';
import { maybeRumor, progressLegends, finishLegendQuest } from './legends.js';
import { addLog } from './state.js';

const WON = ['triumph', 'success', 'costly'];

export function ensureCollections(state) {
  state.trophies = state.trophies || {};
  state.stash = state.stash || [];
  state.legends = state.legends || {};
  state.codex = state.codex || {};
  const c = state.codex;
  for (const k of ['monsters', 'places', 'classes', 'ancestries', 'quirks']) c[k] = c[k] || {};
  state.flags = state.flags || {};
  return state;
}

// ---- Trophies ----

export function prestige(state) {
  return Object.keys(state.trophies).reduce((s, id) => s + (TROPHIES[id] ? PRESTIGE[TROPHIES[id].rarity] : 0), 0)
    + LEGEND_IDS.filter((id) => (state.legends[id] || {}).status === 'recruited').length * PRESTIGE.legendary;
}

export function setProgress(state) {
  return Object.entries(TROPHY_SETS).map(([id, set]) => {
    if (id === 'legends') {
      const have = LEGEND_IDS.filter((l) => (state.legends[l] || {}).status === 'recruited').length;
      return { id, set, have, need: set.need, complete: have >= set.need };
    }
    const members = Object.keys(TROPHIES).filter((t) => TROPHIES[t].set === id);
    const have = members.filter((t) => state.trophies[t]).length;
    const need = set.need || members.length;
    return { id, set, have, need, members, complete: have >= need };
  });
}

// Better recruits at the bar: from prestige and the legends set.
export function recruitBoost(state) {
  const fromSets = setProgress(state).filter((s) => s.complete).reduce((n, s) => n + (s.set.effects.recruit || 0), 0);
  return Math.min(6, Math.floor(prestige(state) / 8) + fromSets);
}

function sourceMatches(src, quest, result) {
  const outs = src.outcomes || WON;
  if (!outs.includes(result.outcome)) return false;
  if (src.monster) return result.defeated.includes(src.monster);
  if (src.template) return quest.template === src.template;
  if (src.encounter) return result.encounters.some((b) => b.def === src.encounter && b.success);
  if (src.condition) return (quest.conditions || []).includes(src.condition);
  return false;
}

function rollTrophies(state, quest, result, rng, now) {
  const found = [];
  const dupes = [];
  for (const [id, t] of Object.entries(TROPHIES)) {
    if (found.length + dupes.length >= 2) break;
    if (!t.source || !sourceMatches(t.source, quest, result) || !rng.chance(t.source.chance)) continue;
    if (state.trophies[id]) {
      state.gold += DUPLICATE_GOLD[t.rarity];
      dupes.push({ id, name: t.name, gold: DUPLICATE_GOLD[t.rarity] });
    } else {
      state.trophies[id] = { at: now, quest: quest.title };
      found.push({ id, name: t.name, rarity: t.rarity, desc: t.desc });
      addLog(state, `Mounted on the wall: ${t.name}.`, now);
    }
  }
  return { found, dupes };
}

// ---- Bestiary and codex ----

export function knowledgeOf(state, monsterId) {
  const n = (state.codex.monsters[monsterId] || {}).defeated || 0;
  let level = null;
  for (const k of KNOWLEDGE) if (n >= k.at) level = k;
  return { defeated: n, seen: (state.codex.monsters[monsterId] || {}).seen || 0, level, lore: BESTIARY[monsterId].slice(0, KNOWLEDGE.filter((k) => n >= k.at).length) };
}

export function foeBonuses(state) {
  const out = {};
  for (const id of Object.keys(MONSTERS)) {
    const k = knowledgeOf(state, id);
    if (k.level && k.level.attack) out[id] = k.level.attack;
  }
  return out;
}

export function recordRecruit(state, adv) {
  ensureCollections(state);
  state.codex.classes[adv.cls] = true;
  state.codex.ancestries[adv.ancestry] = true;
  for (const q of adv.quirks) state.codex.quirks[q] = true;
}

function recordQuest(state, quest, result) {
  const lore = [];
  const c = state.codex;
  for (const b of result.encounters) {
    if (b.kind === 'combat' && b.monsterId) {
      const m = c.monsters[b.monsterId] = c.monsters[b.monsterId] || { seen: 0, defeated: 0 };
      m.seen += 1;
    }
  }
  for (const id of result.defeated) {
    const m = c.monsters[id] = c.monsters[id] || { seen: 1, defeated: 0 };
    const before = KNOWLEDGE.filter((k) => m.defeated >= k.at).length;
    m.defeated += 1;
    const after = KNOWLEDGE.filter((k) => m.defeated >= k.at).length;
    if (after > before) {
      const k = KNOWLEDGE[after - 1];
      lore.push({ id, name: MONSTERS[id].name, level: k.label, text: BESTIARY[id][after - 1], attack: k.attack });
    }
  }
  if (quest.place) c.places[quest.place] = true;
  return lore;
}

export function codexStats(state) {
  const c = state.codex;
  const parts = [
    { key: 'monsters', label: 'Monsters studied', have: Object.keys(MONSTERS).filter((id) => (c.monsters[id] || {}).defeated >= 3).length, total: Object.keys(MONSTERS).length },
    { key: 'places', label: 'Towns visited', have: Object.keys(c.places).length, total: PLACES.town.length },
    { key: 'classes', label: 'Classes recruited', have: CLASS_IDS.filter((x) => c.classes[x]).length, total: CLASS_IDS.length },
    { key: 'ancestries', label: 'Ancestries recruited', have: ANCESTRY_IDS.filter((x) => c.ancestries[x]).length, total: ANCESTRY_IDS.length },
    { key: 'quirks', label: 'Quirks seen', have: QUIRK_IDS.filter((x) => c.quirks[x]).length, total: QUIRK_IDS.length },
    { key: 'trophies', label: 'Trophies mounted', have: Object.keys(state.trophies).length, total: Object.keys(TROPHIES).length },
    { key: 'legends', label: 'Legends recruited', have: LEGEND_IDS.filter((x) => (state.legends[x] || {}).status === 'recruited').length, total: LEGEND_IDS.length },
    { key: 'gear', label: 'Legendary gear found', have: (state.flags.legendaryGear || []).length, total: Object.keys(LEGENDARY_GEAR).length },
  ];
  const have = parts.reduce((s, p) => s + p.have, 0);
  const total = parts.reduce((s, p) => s + p.total, 0);
  return { parts, percent: Math.round((have / total) * 100) };
}

// ---- Modifiers every party carries (snapshotted at send) ----

export function questMods(state) {
  ensureCollections(state);
  const mods = { ...tavernMods(state), foes: foeBonuses(state), tagAttack: {}, tagRoll: {}, tagSkill: {}, gold: 0 };
  for (const s of setProgress(state)) {
    if (!s.complete) continue;
    const e = s.set.effects;
    for (const k of ['tagAttack', 'tagRoll', 'tagSkill']) {
      for (const [tag, n] of Object.entries(e[k] || {})) mods[k][tag] = (mods[k][tag] || 0) + n;
    }
    if (e.gold) mods.gold += e.gold;
    if (e.xp) mods.xp = (mods.xp || 0) + e.xp;
  }
  return mods;
}

// ---- After a quest ----

// Trophies, gear, bestiary, rumors and legends. Returns { loot, events }.
export function afterQuest(state, p, result, now) {
  ensureCollections(state);
  const quest = p.quest;
  const rng = new Rng(seedFrom(p.seed, 'loot'));
  const events = [];
  const loot = { trophies: [], dupes: [], gear: null, gearSold: 0, lore: [], rumor: null, legend: null };

  loot.lore = recordQuest(state, quest, result);
  const t = rollTrophies(state, quest, result, rng, now);
  loot.trophies = t.found;
  loot.dupes = t.dupes;

  const item = rollLoot(state, quest, result.outcome, rng);
  if (item) {
    loot.gear = item;
    loot.gearSold = addToStash(state, item);
    state.flags.gearFound = (state.flags.gearFound || 0) + 1;
    addLog(state, `Found on the road: ${item.name}.`, now);
  }

  if (quest.legend) {
    const r = finishLegendQuest(state, quest, result.outcome, now);
    events.push(...r.events);
    loot.legend = r.joined;
    if (r.joined && !r.joined.waiting) recordRecruit(state, state.roster[state.roster.length - 1]);
  }
  events.push(...progressLegends(state, quest, result, now));
  loot.rumor = maybeRumor(state, rng, now);
  return { loot, events };
}

export { LEGENDS };
