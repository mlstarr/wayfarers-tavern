// Quest generation, the quest board, sending parties and collecting results.
import { Rng, seedFrom } from './rng.js';
import { MIN, BOARD_SIZE, BOARD_HOURS, TIER_RENOWN, REPORT_ARCHIVE } from './config.js';
import { QUEST_TEMPLATES, TIER_DURATIONS, PLACES } from '../data/quests.js';
import { ENCOUNTERS } from '../data/encounters.js';
import { MONSTERS } from '../data/monsters.js';
import { SKILLS } from '../data/skills.js';
import { resolveQuest } from './resolve.js';
import { isAvailable, gainXp, addHistory, fullName } from './adventurers.js';
import { fill, checkLabel } from './reports.js';
import { nextId, addLog } from './state.js';

// ---- Board timing (local time, every BOARD_HOURS hours) ----

export function boardKey(now) {
  const d = new Date(now);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}-${Math.floor(d.getHours() / BOARD_HOURS)}`;
}

export function nextBoardAt(now) {
  const d = new Date(now);
  const block = Math.floor(d.getHours() / BOARD_HOURS) + 1;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), block * BOARD_HOURS).getTime();
}

export function unlockedTiers(state) {
  return [1, 2, 3].filter((t) => state.renown >= TIER_RENOWN[t - 1]);
}

// ---- Generation ----

function scaleMonster(base, tier, partySize) {
  const t = tier - 1;
  return {
    name: base.name,
    ac: base.ac + Math.floor(t / 2),
    hp: Math.round(base.hp * (1 + 0.6 * t) * (0.5 + 0.25 * partySize)),
    atk: base.atk + t,
    dmg: t ? `${base.dmg}+${2 * t}`.replace(/\+(\d+)\+(\d+)$/, (m, a, b) => `+${Number(a) + Number(b)}`) : base.dmg,
    attacks: base.attacks,
    tags: base.tags,
  };
}

export function generateQuest(rng, tier, id, avoid = []) {
  const fits = QUEST_TEMPLATES.filter((q) => q.tiers.includes(tier));
  const fresh = fits.filter((q) => !avoid.includes(q.id));
  const tpl = rng.pick(fresh.length ? fresh : fits);
  const vars = { town: rng.pick(PLACES.town), farm: rng.pick(PLACES.farm) };
  const duration = rng.pick(TIER_DURATIONS[tier]);
  const [pMin, pMax] = tpl.party;
  const partyMax = pMax;
  const count = rng.int(tpl.count[0], tpl.count[1]);
  const ids = rng.shuffle(tpl.pool).slice(0, count);
  const finale = Array.isArray(tpl.finale) ? rng.pick(tpl.finale) : tpl.finale;
  if (finale) ids.push(finale);

  const encounters = ids.map((defId) => {
    const def = ENCOUNTERS[defId];
    const enc = { def: defId };
    if (def.kind === 'combat') {
      // Scaled for the largest allowed party; smaller parties face the same foe.
      enc.monster = scaleMonster(MONSTERS[def.monster], tier, Math.max(2, Math.round((pMin + partyMax) / 2)));
    } else {
      enc.dc = 9 + tier * 2 + rng.int(-1, 1);
    }
    return enc;
  });

  const wiggle = 0.9 + rng.next() * 0.2;
  return {
    id,
    seed: rng.int(0, 2147483647),
    template: tpl.id,
    title: fill(tpl.title, vars),
    blurb: fill(tpl.blurb, vars),
    tier,
    duration,             // game-minutes
    party: [pMin, pMax],
    encounters,
    gold: Math.round((15 + 25 * tier) * (1 + duration / 180) * wiggle),
    xp: Math.round(20 * tier * (1 + duration / 360)),
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
        dc: enc.dc || null,
        tags: def.kind === 'combat' ? enc.monster.tags : def.tags,
      });
    }
  }
  return [...seen.values()];
}

export function refreshBoard(state, now) {
  const key = boardKey(now);
  if (state.board.epoch === key) return false;
  const rng = new Rng(seedFrom(state.seed, 'board', key));
  const tiers = unlockedTiers(state);
  const quests = [];
  for (let i = 0; i < BOARD_SIZE; i++) {
    // Always at least two easy postings so a new or battered company has options.
    const tier = i < 2 ? 1 : rng.pick(tiers);
    quests.push(generateQuest(rng.fork(`q${i}`), tier, `q-${key}-${i}`, quests.map((q) => q.template)));
  }
  quests.sort((a, b) => a.tier - b.tier || a.duration - b.duration);
  state.board = { epoch: key, quests };
  return true;
}

// ---- Sending and collecting ----

export function sendParty(state, questId, advIds, now) {
  const quest = state.board.quests.find((q) => q.id === questId);
  if (!quest) return { ok: false, reason: 'That posting is gone' };
  const party = advIds.map((id) => state.roster.find((a) => a.id === id)).filter(Boolean);
  if (party.length < quest.party[0] || party.length > quest.party[1]) {
    return { ok: false, reason: `Needs ${quest.party[0]} to ${quest.party[1]} adventurers` };
  }
  if (!party.every(isAvailable)) return { ok: false, reason: 'Someone in that party is not ready' };

  const result = resolveQuest(quest, party, seedFrom(quest.seed, now));
  const pending = {
    id: nextId(state, 'p'),
    quest,
    party: party.map((a) => a.id),
    startAt: now,
    endAt: now + quest.duration * MIN,
    result,
  };
  for (const a of party) { a.status = 'questing'; a.questId = pending.id; a.restAt = null; }
  state.board.quests = state.board.quests.filter((q) => q.id !== questId);
  state.pending.push(pending);
  state.stats.questsSent += 1;
  addLog(state, `${party.map((a) => a.name.split(' ')[0]).join(', ')} set out: ${quest.title}.`, now);
  return { ok: true, pending };
}

export const isReturned = (p, now) => now >= p.endAt;

// Applies a finished quest's result and archives the report. Returns the report record.
export function collectQuest(state, pendingId, now) {
  const p = state.pending.find((x) => x.id === pendingId);
  if (!p || !isReturned(p, now)) return null;
  const r = p.result;
  const levelUps = [];
  const partyInfo = [];

  for (const id of p.party) {
    const a = state.roster.find((x) => x.id === id);
    if (!a) continue;
    const fell = r.downed.includes(id);
    a.hp = Math.max(1, Math.min(a.maxHp, r.hp[id] ?? a.hp));
    a.status = 'idle';
    a.questId = null;
    a.restAt = p.endAt; // starts recovering from the moment they got home
    a.stats.quests += 1;
    if (r.outcome === 'triumph') a.stats.triumphs += 1;
    const nat = r.nats[id] || { n20: 0, n1: 0 };
    a.stats.nat20 += nat.n20;
    a.stats.nat1 += nat.n1;
    for (const h of r.history.filter((x) => x.id === id)) addHistory(a, h.text, p.endAt);
    const ups = gainXp(a, r.xp);
    for (const u of ups) {
      levelUps.push({ id, name: fullName(a), level: u.level, hpGain: u.hpGain });
      addHistory(a, `Reached level ${u.level}.`, p.endAt);
    }
    partyInfo.push({ id, name: fullName(a), cls: a.cls, fell });
  }

  state.gold += r.gold;
  state.renown += r.renown;
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
  };
  state.reports.unshift(record);
  if (state.reports.length > REPORT_ARCHIVE) state.reports.length = REPORT_ARCHIVE;
  state.pending = state.pending.filter((x) => x.id !== pendingId);
  addLog(state, `${p.quest.title}: ${r.outcomeLabel.toLowerCase()}. +${r.gold} gold.`, now);
  return record;
}
