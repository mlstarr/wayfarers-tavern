// Quest generation, the quest board, sending parties and collecting results.
import { Rng, seedFrom } from './rng.js';
import {
  MIN, BOARD_SIZE, REFILL_MIN, POSTING_LIFE, EXPEDITION_CHANCE, EXPEDITION_MIN_STAGE, REPORT_ARCHIVE,
} from './config.js';
import { QUEST_TEMPLATES, TIER_DURATIONS, EXPEDITION_DURATIONS, PLACES } from '../data/quests.js';
import { ENCOUNTERS } from '../data/encounters.js';
import { SUPPLIES } from '../data/supplies.js';
import { SKILLS } from '../data/skills.js';
import { resolveQuest } from './resolve.js';
import { buildEncounter, encounterTags } from './encounters.js';
import { planDispatches } from './dispatch.js';
import { partyBonuses, addBond, hasFriend, partyPairs } from './bonds.js';
import { progressAfterQuest, progressBond, settleGoals } from './goals.js';
import {
  isAvailable, gainXp, addHistory, fullName, changeLoyalty, addFatigue, addInjury,
} from './adventurers.js';
import { fill, checkLabel } from './reports.js';
import { nextId, addLog } from './state.js';
import { paceOf, paced } from './pace.js';
import { maxTier, loseRenown, checkRankUp } from './tavern.js';
import { questMods, afterQuest } from './collection.js';
import { returnGear } from './gear.js';
import { finishPersonalQuest } from './stories.js';
import { CONTRACT, RENOWN_LOSS } from '../data/penalties.js';

export function unlockedTiers(state) {
  return [1, 2, 3].filter((t) => t <= maxTier(state));
}

// ---- Generation ----

function rollConditions(rng, tier, encounters, duration) {
  const tags = new Set(encounters.flatMap(encounterTags));
  const out = duration >= 180 ? ['long'] : [];
  const want = tier === 1 ? (rng.chance(0.45) ? 1 : 0) : tier === 2 ? 1 : rng.int(1, 2);
  let pool = ['night', 'rain', 'cold'];
  if (tags.has('undead')) pool.push('cursed', 'cursed');
  if (tags.has('spider')) pool.push('venom', 'venom');
  if (tags.has('beast') || tags.has('magic')) pool.push('fearsFire');
  let added = 0;
  while (added < want && pool.length) {
    const c = rng.pick(pool);
    pool = pool.filter((x) => x !== c);
    out.push(c);
    added += 1;
  }
  return out;
}

// scale: early-game pacing (1 = full length). calm: no conditions, for the very first jobs.
export function generateQuest(rng, tier, id, { avoid = [], expedition = false, now = 0, scale = 1, calm = false, contract = false } = {}) {
  const fits = QUEST_TEMPLATES.filter((q) => q.tiers.includes(tier) && !!q.expedition === expedition);
  const fresh = fits.filter((q) => !avoid.includes(q.id));
  const tpl = rng.pick(fresh.length ? fresh : fits);
  const vars = { town: rng.pick(PLACES.town), farm: rng.pick(PLACES.farm) };
  const [pMin, pMax] = tpl.party;
  const count = rng.int(tpl.count[0], tpl.count[1]);
  const ids = rng.shuffle(tpl.pool).slice(0, count);
  const finale = Array.isArray(tpl.finale) ? rng.pick(tpl.finale) : tpl.finale;
  const fightSize = Math.max(2, Math.round((pMin + pMax) / 2));
  const encounters = ids.map((defId) => buildEncounter(defId, tier, fightSize, rng));
  if (finale) encounters.push({ ...buildEncounter(finale, tier, fightSize, rng), finale: true });

  // Longer chains of encounters take longer.
  const durations = expedition ? EXPEDITION_DURATIONS : TIER_DURATIONS[tier];
  const span = tpl.count[1] - tpl.count[0];
  const pos = span ? (count - tpl.count[0]) / span : 0.5;
  const idx = Math.max(0, Math.min(durations.length - 1, Math.round(pos * (durations.length - 1)) + rng.int(-1, 1)));
  const full = durations[idx];
  const duration = expedition ? full : paced(full, scale);
  const n = encounters.length;
  const wiggle = 0.9 + rng.next() * 0.2;
  const rich = expedition ? 1.5 : 1;
  const baseGold = Math.round((8 + 10 * tier) * n * (1 + duration / 240) * rich * wiggle);

  return {
    id,
    seed: rng.int(0, 2147483647),
    template: tpl.id,
    title: fill(tpl.title, vars),
    blurb: fill(tpl.blurb, vars),
    place: tpl.blurb.includes('{town}') || tpl.title.includes('{town}') ? vars.town : null,
    tier,
    expedition,
    duration,             // game-minutes (after early-game pacing)
    intro: scale < 0.5,   // early job: gets a messenger even though it is short
    party: [pMin, pMax],
    encounters,
    conditions: calm ? [] : rollConditions(rng, tier, encounters, duration),
    gold: contract ? Math.round(baseGold * CONTRACT.payout) : baseGold,
    contract: contract ? { deposit: Math.round(baseGold * CONTRACT.deposit) } : null,
    xp: Math.round(10 * tier * n * (1 + duration / 360) * rich),
    postedAt: now,
    expiresAt: now + rng.int(POSTING_LIFE[0], POSTING_LIFE[1]) * MIN,
  };
}

// What the board shows about a quest's checks, deduplicated, in order.
export function questChecks(quest) {
  const seen = new Map();
  for (const enc of quest.encounters) {
    const def = ENCOUNTERS[enc.def];
    const label = checkLabel(def);
    if (!seen.has(label)) {
      seen.set(label, {
        label,
        kind: def.kind,
        skill: def.skill || null,
        ability: def.ability || (def.skill ? SKILLS[def.skill] : null),
        rawAbility: def.ability || null,
        dc: enc.dc || null,
        tags: encounterTags(enc),
      });
    }
  }
  return [...seen.values()];
}

// Supplies worth packing for this quest.
export function recommendedSupplies(quest) {
  const rec = new Set();
  for (const c of quest.conditions || []) {
    if (c === 'night' || c === 'fearsFire') rec.add('torches');
    if (c === 'rain' || c === 'cold') rec.add('cloaks');
    if (c === 'cursed') rec.add('holyWater');
    if (c === 'venom') rec.add('antivenom');
    if (c === 'long') rec.add('rations');
  }
  if (quest.encounters.some((e) => ['heights', 'water'].some((t) => encounterTags(e).includes(t)))) rec.add('rope');
  return rec;
}

// ---- The board: postings expire and are replaced one at a time ----

function spawnPosting(state, now) {
  const b = state.board;
  const n = b.counter++;
  const rng = new Rng(seedFrom(state.seed, 'post', n));
  const tiers = unlockedTiers(state);
  const easy = b.quests.filter((q) => q.tier === 1 && !q.expedition && !q.personal && !q.legend).length;
  const pace = paceOf(state);
  const expedition = pace.stage >= EXPEDITION_MIN_STAGE && !b.quests.some((q) => q.expedition) && rng.chance(EXPEDITION_CHANCE);
  const tier = expedition ? rng.pick(tiers) : easy < 2 ? 1 : rng.pick(tiers);
  b.quests.push(generateQuest(rng, tier, `q${n}`, {
    avoid: b.quests.map((q) => q.template), expedition, now, scale: pace.scale, calm: pace.stage === 0,
    contract: pace.stage >= 1 && !expedition && rng.chance(CONTRACT.chance),
  }));
  b.quests.sort((x, y) => Number(x.expedition) - Number(y.expedition) || x.tier - y.tier || x.duration - y.duration);
}

export function refreshBoard(state, now) {
  const b = state.board;
  let changed = false;
  const before = b.quests.length;
  b.quests = b.quests.filter((q) => q.expiresAt > now);
  if (b.quests.length !== before) changed = true;
  const due = b.refills.filter((at) => at <= now);
  if (due.length) {
    b.refills = b.refills.filter((at) => at > now);
    for (let k = 0; k < due.length; k++) spawnPosting(state, now);
    changed = true;
  }
  if (b.counter === 0) {
    for (let k = 0; k < BOARD_SIZE; k++) spawnPosting(state, now);
    changed = true;
  }
  while (b.quests.filter((q) => !q.personal && !q.legend).length + b.refills.length < BOARD_SIZE) {
    b.refills.push(now + refillDelay(state));
    changed = true;
  }
  return changed;
}

// Early on, taken postings are replaced within minutes.
function refillDelay(state) {
  return Math.max(1, REFILL_MIN * paceOf(state).scale) * MIN;
}

export function nextPostingAt(state) {
  return state.board.refills.length ? Math.min(...state.board.refills) : null;
}

// ---- Sending and collecting ----

export function sendParty(state, questId, advIds, packed, now) {
  const quest = state.board.quests.find((q) => q.id === questId);
  if (!quest) return { ok: false, reason: 'That posting is gone' };
  const party = advIds.map((id) => state.roster.find((a) => a.id === id)).filter(Boolean);
  if (party.length < quest.party[0] || party.length > quest.party[1]) {
    return { ok: false, reason: `Needs ${quest.party[0]} to ${quest.party[1]} adventurers` };
  }
  if (!party.every(isAvailable)) return { ok: false, reason: 'Someone in that party is not ready' };
  if (quest.personal && !advIds.includes(quest.personal)) return { ok: false, reason: 'This is a personal quest: its hero must go' };
  if (quest.contract && state.gold < quest.contract.deposit) return { ok: false, reason: `The contract needs a ${quest.contract.deposit} gold deposit` };
  const pack = {};
  for (const [k, n] of Object.entries(packed || {})) {
    if (!n || !SUPPLIES[k]) continue;
    if ((state.supplies[k] || 0) < n) return { ok: false, reason: `Not enough ${SUPPLIES[k].name.toLowerCase()}` };
    pack[k] = n;
  }
  for (const [k, n] of Object.entries(pack)) state.supplies[k] -= n;
  if (quest.contract) state.gold -= quest.contract.deposit;

  const seed = seedFrom(quest.seed, now);
  const snapshot = party.map((a) => JSON.parse(JSON.stringify(a)));
  const { bonus, notes } = partyBonuses(state, party);
  const endAt = now + quest.duration * MIN;
  const pending = {
    id: nextId(state, 'p'),
    quest,
    party: party.map((a) => a.id),
    snapshot,
    seed,
    packed: pack,
    bonus,
    bonusNotes: notes,
    tavern: questMods(state),
    pairs: partyPairs(state, party).map((x) => [x.a.id, x.b.id, x.level.mod > 0 ? 'friends' : 'rivals']),
    dispatches: planDispatches(quest, snapshot, seed, now, endAt),
    startAt: now,
    endAt,
  };
  for (const a of party) {
    a.status = 'questing';
    a.questId = pending.id;
    a.restAt = null;
    a.buffs = (a.buffs || []).map((b) => ({ ...b, quests: b.quests - 1 })).filter((b) => b.quests > 0);
  }
  state.board.quests = state.board.quests.filter((q) => q.id !== questId);
  if (!quest.personal && !quest.legend) state.board.refills.push(now + refillDelay(state));
  state.pending.push(pending);
  state.stats.questsSent += 1;
  addLog(state, `${party.map((a) => a.name.split(' ')[0]).join(', ')} set out: ${quest.title}.`, now);
  return { ok: true, pending };
}

export const isReturned = (p, now) => now >= p.endAt;

export function resultFor(p) {
  if (p.result) return p.result; // saves from before version 2
  return resolveQuest(p.quest, p.snapshot, p.seed, {
    packed: p.packed, bonus: p.bonus, bonusNotes: p.bonusNotes, dispatches: p.dispatches, tavern: p.tavern, pairs: p.pairs,
  });
}

// Applies a finished quest's result and archives the report. Returns the report record.
export function collectQuest(state, pendingId, now) {
  const p = state.pending.find((x) => x.id === pendingId);
  if (!p || !isReturned(p, now)) return null;
  const r = resultFor(p);
  const levelUps = [];
  const events = [];
  const partyInfo = [];
  const advs = p.party.map((id) => state.roster.find((x) => x.id === id)).filter(Boolean);

  for (const a of advs) {
    const id = a.id;
    const fell = (r.downed || []).includes(id);
    a.hp = Math.max(1, Math.min(a.maxHp, r.hp[id] ?? a.hp));
    a.status = 'idle';
    a.questId = null;
    a.restAt = p.endAt;
    a.stats.quests += 1;
    if (r.outcome === 'triumph') a.stats.triumphs += 1;
    const nat = (r.nats || {})[id] || { n20: 0, n1: 0 };
    a.stats.nat20 += nat.n20;
    a.stats.nat1 += nat.n1;
    if (r.loyalty && r.loyalty[id]) changeLoyalty(a, r.loyalty[id]);
    if (r.outcome === 'triumph') changeLoyalty(a, 1);
    if (r.outcome === 'disaster') changeLoyalty(a, -1);
    for (const h of (r.history || []).filter((x) => x.id === id)) addHistory(a, h.text, p.endAt);
    for (const u of gainXp(a, r.xp)) {
      levelUps.push({ id, name: fullName(a), level: u.level, hpGain: u.hpGain });
      addHistory(a, `Reached level ${u.level}.`, p.endAt);
    }
    if (r.defeated) progressAfterQuest(a, r, p.quest, (r.goalBoost || {})[id] || 0);
    addFatigue(a, p.quest.expedition ? 2 : 1, p.endAt);
    partyInfo.push({ id, name: fullName(a), cls: a.cls, fell });
  }

  // Injuries: everyone who fell, and some of the rest after a disaster.
  const injuries = [];
  const hurtRng = new Rng((p.seed ^ 0x1badbeef) >>> 0);
  for (const a of advs) {
    const fell = (r.downed || []).includes(a.id);
    if (fell || (r.outcome === 'disaster' && hurtRng.chance(0.3))) {
      const inj = addInjury(a, hurtRng, p.endAt);
      if (inj) {
        injuries.push({ id: a.id, name: a.name.split(' ')[0], injury: inj.name, desc: inj.desc });
        addHistory(a, `Came home from "${p.quest.title}" with a ${inj.name.toLowerCase()}.`, p.endAt);
      }
    }
  }

  // Reputation, contracts and personal quests.
  const won = ['triumph', 'success', 'costly'].includes(r.outcome);
  const renownLost = RENOWN_LOSS[r.outcome] ? loseRenown(state, RENOWN_LOSS[r.outcome] * p.quest.tier) : 0;
  let depositBack = 0;
  let contractBonus = 0;
  if (p.quest.contract) {
    if (won) {
      depositBack = p.quest.contract.deposit;
      contractBonus = Math.round(r.gold * (p.tavern ? p.tavern.contract || 0 : 0));
      state.gold += depositBack + contractBonus;
    } else events.push(`The contract failed: the ${p.quest.contract.deposit} gold deposit is lost.`);
  }
  if (p.quest.personal) {
    const hero = advs.find((a) => a.id === p.quest.personal);
    if (hero) events.push(...finishPersonalQuest(state, hero, p.quest, r.outcome, p.endAt));
  }

  // Bonds: questing together builds them; saving a life builds them faster.
  for (let i = 0; i < advs.length; i++) {
    for (let j = i + 1; j < advs.length; j++) {
      const [x, y] = [advs[i], advs[j]];
      const saves = (r.saves || []).filter(([s, t]) => (s === x.id && t === y.id) || (s === y.id && t === x.id)).length;
      const delta = 1 + (r.outcome === 'triumph' ? 1 : 0) + saves * 2;
      const msg = addBond(state, x.id, y.id, delta, [x.name.split(' ')[0], y.name.split(' ')[0]]);
      if (msg) { events.push(msg); addLog(state, msg, now); }
    }
  }
  for (const a of advs) progressBond(a, hasFriend(state, a.id));
  if (renownLost) events.push(`Word of the ${r.outcome} spread: -${renownLost} renown.`);
  const col = afterQuest(state, p, r, now);
  events.push(...col.events);
  if (r.outcome === 'triumph') events.push('A triumph: everyone in the party grew more loyal.');
  if (!won) {
    for (const a of advs.filter((x) => (x.loyalty || 0) <= 0)) {
      state.roster = state.roster.filter((x) => x.id !== a.id);
      returnGear(state, a);
      const msg = `${a.name.split(' ')[0]} has had enough and left the company.`;
      events.push(msg);
      addLog(state, msg, now);
    }
  }
  for (const g of settleGoals(advs, p.endAt)) {
    const msg = `${g.name} fulfilled a personal goal (${g.reward}, loyalty up).`;
    events.push(msg);
    addLog(state, msg, now);
  }

  if (r.potionsLeft) state.supplies.potion = (state.supplies.potion || 0) + r.potionsLeft;
  state.gold += r.gold;
  state.renown += r.renown;
  const rankUps = checkRankUp(state, now);
  state.stats.questsDone += 1;
  state.stats.goldEarned += r.gold;
  if (r.outcome === 'triumph') state.stats.triumphs += 1;

  const record = {
    id: p.id,
    at: p.endAt,
    title: p.quest.title,
    tier: p.quest.tier,
    duration: p.quest.duration,
    party: partyInfo,
    result: r,
    levelUps,
    events,
    injuries,
    renownLost,
    depositBack,
    contractBonus,
    personal: !!p.quest.personal,
    loot: col.loot,
    rankUps,
  };
  state.reports.unshift(record);
  if (state.reports.length > REPORT_ARCHIVE) state.reports.length = REPORT_ARCHIVE;
  state.pending = state.pending.filter((x) => x.id !== pendingId);
  addLog(state, `${p.quest.title}: ${r.outcomeLabel.toLowerCase()}. +${r.gold} gold.`, now);
  return record;
}
