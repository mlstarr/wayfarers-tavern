// What each hero has done on the road. Deeds unlock earned talents (data/talents-personal.js).
import { MONSTERS } from '../data/monsters.js';

export function ensureDeeds(adv) {
  adv.deeds = adv.deeds || { kills: {}, falls: 0, injuries: 0, expeditions: 0, disasters: 0, finales: 0, saved: 0 };
  return adv.deeds;
}

// Called for each party member when a quest is collected, before XP is applied.
export function recordDeeds(adv, result, quest) {
  const d = ensureDeeds(adv);
  for (const id of result.defeated || []) d.kills[id] = (d.kills[id] || 0) + 1;
  if ((result.downed || []).includes(adv.id)) d.falls += 1;
  if (quest.expedition) d.expeditions += 1;
  if (result.outcome === 'disaster') d.disasters += 1;
  const fights = (result.encounters || []).filter((b) => b.kind);
  const last = fights[fights.length - 1];
  if (last && last.finale && last.success) d.finales += 1;
  d.saved += (result.saves || []).filter(([healer]) => healer === adv.id).length;
}

function killsOf(adv, key) {
  const k = ensureDeeds(adv).kills;
  if (MONSTERS[key]) return k[key] || 0;
  return Object.entries(k).reduce((s, [id, n]) => s + (MONSTERS[id] && MONSTERS[id].tags.includes(key) ? n : 0), 0);
}

// extra: { friends, rivals } counted from bonds by the caller.
function deedCount(adv, key, sub, extra) {
  const d = ensureDeeds(adv);
  switch (key) {
    case 'kills': return killsOf(adv, sub);
    case 'quests': case 'triumphs': case 'nat20': case 'nat1': return adv.stats[key] || 0;
    case 'legacy': return adv.legacy ? 1 : 0;
    case 'goals': return adv.goalsDone || 0;
    case 'devoted': return (adv.loyalty || 0) >= 5 ? 1 : 0;
    case 'friends': case 'rivals': return (extra && extra[key]) || 0;
    default: return d[key] || 0;
  }
}

// [{ key, sub, have, need }] for every requirement in an earn rule.
export function deedProgress(adv, earn, extra) {
  const out = [];
  for (const [key, v] of Object.entries(earn)) {
    if (typeof v === 'object') {
      for (const [sub, need] of Object.entries(v)) out.push({ key, sub, need, have: deedCount(adv, key, sub, extra) });
    } else out.push({ key, need: v, have: deedCount(adv, key, null, extra) });
  }
  return out;
}

export function deedMet(adv, earn, extra) {
  return deedProgress(adv, earn, extra).every((p) => p.have >= p.need);
}

const KILL_NAME = (sub) => (MONSTERS[sub] ? MONSTERS[sub].plural : { beast: 'beasts', undead: 'the dead', spider: 'spiders' }[sub] || sub);
const TEXT = {
  kills: (n, sub) => `defeated ${KILL_NAME(sub)} ${n} times`,
  falls: (n) => (n === 1 ? 'fell in battle and lived' : `fell in battle ${n} times and lived`),
  injuries: (n) => `came home injured ${n} times`,
  nat20: (n) => `rolled ${n} natural 20s`,
  nat1: (n) => `rolled ${n} natural 1s`,
  quests: (n) => `went on ${n} quests`,
  triumphs: (n) => `won ${n} triumphs`,
  expeditions: (n) => `survived ${n} expeditions`,
  disasters: () => 'lived through a disaster',
  finales: (n) => `won ${n} final battles`,
  saved: (n) => `healed allies ${n} times`,
  friends: () => 'made a true friend',
  rivals: () => 'made a rival',
  legacy: () => 'finished their own story',
  goals: (n) => `fulfilled ${n} personal goals`,
  devoted: () => 'became devoted to the tavern',
};

export function deedText(earn) {
  const parts = [];
  for (const [key, v] of Object.entries(earn)) {
    if (typeof v === 'object') for (const [sub, n] of Object.entries(v)) parts.push(TEXT.kills(n, sub));
    else parts.push(TEXT[key](v));
  }
  return parts.join(', ');
}
