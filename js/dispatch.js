// Planning dispatches when a party sets out, and describing them for the UI. No DOM.
import { DISPATCHES, DISPATCH_IDS } from '../data/dispatches.js';
import { ENCOUNTERS } from '../data/encounters.js';
import { MONSTERS } from '../data/monsters.js';
import { Rng, seedFrom } from './rng.js';
import { checkBonus } from './adventurers.js';
import { fill } from './reports.js';

export function finaleOf(quest) {
  const last = quest.encounters[quest.encounters.length - 1];
  return last && last.finale ? last : null;
}

function finaleMonster(quest) {
  const f = finaleOf(quest);
  return f && f.monster ? f.monster : null;
}

// How many messengers a quest gets, by length in game-minutes.
function dispatchCount(quest) {
  if (quest.encounters.length < 2) return 0;
  if (quest.duration < 5) return quest.intro ? 1 : 0; // early jobs teach messengers
  return quest.duration >= 180 && quest.encounters.length >= 3 ? 2 : 1;
}

// Decided at send time from the quest seed: which dispatches arrive, when, and who they feature.
export function planDispatches(quest, party, seed, startAt, endAt) {
  const n = dispatchCount(quest);
  if (!n) return [];
  const rng = new Rng(seedFrom(seed, 'dispatch'));
  const total = quest.encounters.length;
  const spots = n === 2 ? [1, total - 1] : [rng.int(1, total - 1)];
  const mon = finaleMonster(quest);
  const avenger = mon && party.find((a) => a.goal && a.goal.type === 'slay' && a.goal.target === mon.id);
  const used = [];
  return spots.map((after, k) => {
    let pool = DISPATCH_IDS.filter((id) => !used.includes(id) && DISPATCHES[id].requires !== 'vengeance'
      && (DISPATCHES[id].requires !== 'finaleCombat' || mon));
    let tplId = rng.pick(pool);
    if (avenger && !used.includes('vengeance') && (k === spots.length - 1) && rng.chance(0.8)) tplId = 'vengeance';
    used.push(tplId);
    const tpl = DISPATCHES[tplId];
    let hero;
    if (tplId === 'vengeance') hero = avenger;
    else if (tpl.heroSkill) hero = [...party].sort((a, b) => checkBonus(b, tpl.heroSkill) - checkBonus(a, tpl.heroSkill))[0];
    else hero = rng.pick(party);
    return {
      id: `d${k}`,
      tpl: tplId,
      after,
      at: Math.round(startAt + (endAt - startAt) * (after / total)),
      hero: hero.id,
      heroName: hero.name.split(' ')[0],
      monsterId: mon ? mon.id : null,
      choice: null,
    };
  });
}

export function dispatchVars(d) {
  const mon = d.monsterId ? MONSTERS[d.monsterId] : null;
  return { hero: d.heroName, monster: mon ? mon.name : 'enemy', plural: mon ? mon.plural : 'enemies' };
}

// Text for the UI: situation plus labelled options.
export function describeDispatch(d) {
  const tpl = DISPATCHES[d.tpl];
  const vars = dispatchVars(d);
  return {
    text: fill(tpl.text, vars),
    options: tpl.options.map((o, i) => ({
      index: i,
      label: fill(o.label, vars),
      desc: fill(o.desc, vars),
      isDefault: !!o.default,
    })),
  };
}

export function defaultOption(d) {
  const i = DISPATCHES[d.tpl].options.findIndex((o) => o.default);
  return i < 0 ? 0 : i;
}

// Dispatches waiting for an answer right now.
export function openDispatches(state, now) {
  const out = [];
  for (const p of state.pending) {
    for (const d of p.dispatches || []) {
      if (d.choice == null && now >= d.at && now < p.endAt) out.push({ pending: p, dispatch: d });
    }
  }
  return out;
}

export function answerDispatch(state, pendingId, dispatchId, index, now) {
  const p = state.pending.find((x) => x.id === pendingId);
  const d = p && (p.dispatches || []).find((x) => x.id === dispatchId);
  if (!d || d.choice != null || now < d.at || now >= p.endAt) return false;
  if (!DISPATCHES[d.tpl].options[index]) return false;
  d.choice = index;
  d.answeredAt = now;
  return true;
}

export function isEncounterCombat(defId) {
  return ENCOUNTERS[defId].kind === 'combat';
}
