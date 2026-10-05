// What the tavern owner has earned: every bonus in effect, the next ones within reach,
// trophies a quest could bring home, and new finds since the Hall was last opened. No DOM.
import { TROPHIES } from '../data/trophies.js';
import { UPGRADES, RANKS } from '../data/tavern.js';
import { MONSTERS } from '../data/monsters.js';
import { KNOWLEDGE } from '../data/bestiary.js';
import { LEGENDS, LEGEND_IDS } from '../data/legends.js';
import { setProgress, knowledgeOf, prestige, recruitBoost, ensureCollections } from './collection.js';
import { legendState } from './legends.js';
import { upgradeLevel } from './tavern.js';

const cap = (s) => s[0].toUpperCase() + s.slice(1);

// [{ source, name, text }] for everything currently helping the company.
export function activeBonuses(state) {
  ensureCollections(state);
  const out = [];
  for (const [id, u] of Object.entries(UPGRADES)) {
    const lv = upgradeLevel(state, id);
    if (lv) out.push({ source: 'room', name: `${u.name} ${'I'.repeat(lv)}`, text: u.levels[lv - 1].text });
  }
  for (const s of setProgress(state)) {
    if (s.complete) out.push({ source: 'set', name: s.set.name, text: s.set.bonus });
  }
  for (const id of Object.keys(MONSTERS)) {
    const k = knowledgeOf(state, id);
    if (k.level && k.level.attack) out.push({ source: 'bestiary', name: `${cap(MONSTERS[id].plural)}: ${k.level.label.toLowerCase()}`, text: `+${k.level.attack} to attacks against ${MONSTERS[id].plural}.` });
  }
  const boost = recruitBoost(state);
  if (boost) out.push({ source: 'prestige', name: `Prestige ${prestige(state)}`, text: `Rare, epic and legendary heroes come to the bar ${Math.round(boost * 6)}% more often.` });
  return out;
}

// The next few bonuses within reach, closest first: [{ kind, name, text, have, need }].
export function nearBonuses(state, max = 4) {
  ensureCollections(state);
  const out = [];
  for (const s of setProgress(state)) {
    if (s.complete || !s.have) continue;
    out.push({ kind: 'set', name: s.set.name, text: s.set.bonus, have: s.have, need: s.need });
  }
  for (const id of Object.keys(MONSTERS)) {
    const k = knowledgeOf(state, id);
    const next = KNOWLEDGE.find((x) => k.defeated < x.at && x.attack);
    if (!next || !k.defeated) continue;
    out.push({ kind: 'bestiary', name: `${cap(MONSTERS[id].plural)}: ${next.label.toLowerCase()}`, text: `+${next.attack} to attacks against ${MONSTERS[id].plural}.`, have: k.defeated, need: next.at });
  }
  for (const id of LEGEND_IDS) {
    const s = legendState(state, id);
    if (s.status === 'rumored') out.push({ kind: 'legend', name: LEGENDS[id].name, text: `The trail: ${LEGENDS[id].trail.text.toLowerCase()}.`, have: s.progress, need: LEGENDS[id].trail.n });
    if (s.status === 'quest') out.push({ kind: 'legend', name: LEGENDS[id].name, text: `Recruitment quest on the board: ${LEGENDS[id].quest.title}.`, have: 1, need: 1 });
  }
  const next = RANKS[state.tavern.rank + 1];
  if (next) out.push({ kind: 'rank', name: next.name, text: `${next.beds} beds, rarer recruits and ${next.reward} gold.`, have: state.renown, need: next.renown });
  return out.sort((a, b) => b.have / b.need - a.have / a.need).slice(0, max);
}

function couldDrop(src, quest) {
  if (src.monster) return (quest.encounters || []).some((e) => e.monster && e.monster.id === src.monster);
  if (src.template) return quest.template === src.template;
  if (src.encounter) return (quest.encounters || []).some((e) => e.def === src.encounter);
  if (src.condition) return (quest.conditions || []).includes(src.condition);
  return false;
}

// Trophies the tavern does not have yet that this quest could bring home.
export function trophyChances(state, quest) {
  return Object.entries(TROPHIES)
    .filter(([id, t]) => !state.trophies[id] && t.source && couldDrop(t.source, quest))
    .map(([id, t]) => ({ id, name: t.name, rarity: t.rarity, triumph: (t.source.outcomes || []).includes('triumph') }));
}

// ---- New finds since the Hall was last opened ----

function counts(state) {
  ensureCollections(state);
  return {
    trophies: Object.keys(state.trophies).length,
    gear: state.flags.gearFound || 0,
    lore: Object.values(state.codex.monsters).reduce((s, m) => s + KNOWLEDGE.filter((k) => (m.defeated || 0) >= k.at).length, 0),
    legends: LEGEND_IDS.filter((id) => legendState(state, id).status !== 'unknown').length,
  };
}

export function newFinds(state) {
  const now = counts(state);
  const seen = state.hallSeen || now;
  if (!state.hallSeen) state.hallSeen = now;
  return Object.keys(now).reduce((s, k) => s + Math.max(0, now[k] - (seen[k] || 0)), 0);
}

export function markHallSeen(state) {
  state.hallSeen = counts(state);
}
