// Legendary heroes: rumors, trails, recruitment quests and joining. No DOM.
import { LEGENDS, LEGEND_IDS, RUMOR_CHANCE, FIRST_RUMOR_AFTER } from '../data/legends.js';
import { CLASSES } from '../data/classes.js';
import { QUIRKS } from '../data/quirks.js';
import { TIER_DURATIONS } from '../data/quests.js';
import { Rng, seedFrom } from './rng.js';
import { MIN } from './config.js';
import { buildEncounter } from './encounters.js';
import { paceOf, paced } from './pace.js';
import { nextId, addLog } from './state.js';
import { generateAdventurer, addHistory, mod } from './adventurers.js';
import { rosterCap, maxTier } from './tavern.js';
import { assignArc } from './stories.js';

export function legendState(state, id) {
  return state.legends[id] || { status: 'unknown', progress: 0 };
}

const won = (o) => ['triumph', 'success', 'costly'].includes(o);

// Maybe a rumor about an unheard-of legend reaches the tavern. Returns { id, text } or null.
export function maybeRumor(state, rng, now, force = false) {
  const pool = LEGEND_IDS.filter((id) => legendState(state, id).status === 'unknown' && LEGENDS[id].minRank <= state.tavern.rank);
  if (!pool.length) return null;
  const heard = LEGEND_IDS.some((id) => legendState(state, id).status !== 'unknown');
  const due = force || (!heard && state.stats.questsDone >= FIRST_RUMOR_AFTER) || (heard && rng.chance(RUMOR_CHANCE));
  if (!due) return null;
  const id = rng.pick(pool);
  state.legends[id] = { status: 'rumored', progress: 0, heardAt: now };
  addLog(state, `A rumor reached the tavern: ${LEGENDS[id].name}, ${LEGENDS[id].epithet}.`, now);
  return { id, name: LEGENDS[id].name, text: LEGENDS[id].rumor, trail: LEGENDS[id].trail.text };
}

function trailGain(L, quest, result) {
  const t = L.trail;
  if (!won(result.outcome) && t.type !== 'slay') return 0;
  if (t.type === 'slay') return result.defeated.filter((m) => m === t.target).length;
  if (t.type === 'template') return quest.template === t.target ? 1 : 0;
  if (t.type === 'won') return quest.tier >= t.tier ? 1 : 0;
  if (t.type === 'triumph') return result.outcome === 'triumph' ? 1 : 0;
  return 0;
}

// Advances legend trails after a quest. Returns event lines.
export function progressLegends(state, quest, result, now) {
  const events = [];
  for (const id of LEGEND_IDS) {
    const s = state.legends[id];
    if (!s || s.status !== 'rumored') continue;
    const gain = trailGain(LEGENDS[id], quest, result);
    if (!gain) continue;
    s.progress = Math.min(LEGENDS[id].trail.n, s.progress + gain);
    if (s.progress >= LEGENDS[id].trail.n) {
      s.status = 'quest';
      const q = postLegendQuest(state, id, now, 0);
      events.push(`${LEGENDS[id].name} has heard of your company. A recruitment quest is on the board: ${q.title}.`);
      addLog(state, `Recruitment quest posted: ${q.title}.`, now);
    }
  }
  return events;
}

export function postLegendQuest(state, id, now, attempt = 0) {
  const L = LEGENDS[id];
  const q = L.quest;
  const rng = new Rng(seedFrom(state.seed, 'legendq', id, attempt));
  const tier = Math.min(q.tier, maxTier(state));
  const size = Math.max(2, Math.round((q.party[0] + q.party[1]) / 2));
  const ids = rng.shuffle(q.pool).slice(0, rng.int(q.count[0], q.count[1]));
  const encounters = ids.map((d) => buildEncounter(d, tier, size, rng));
  encounters.push({ ...buildEncounter(q.finale, tier, size, rng), finale: true });
  const n = encounters.length;
  const durations = TIER_DURATIONS[tier];
  const duration = paced(durations[Math.min(durations.length - 1, n)], paceOf(state).scale);
  const quest = {
    id: `lq-${id}-${attempt}`,
    seed: rng.int(0, 2147483647),
    template: `legend:${id}`,
    title: q.title,
    blurb: q.blurb,
    tier,
    expedition: false,
    legend: id,
    duration,
    party: q.party,
    encounters,
    conditions: [],
    gold: Math.round((15 + 15 * tier) * n * (1 + duration / 240)),
    xp: Math.round(15 * tier * n * (1 + duration / 360)),
    postedAt: now,
    expiresAt: now + 30 * 24 * 60 * MIN,
  };
  state.board.quests.unshift(quest);
  return quest;
}

// Builds the legend as an adventurer.
export function createLegend(state, id, now) {
  const L = LEGENDS[id];
  const rng = new Rng(seedFrom(state.seed, 'legend', id));
  const adv = generateAdventurer(rng, { rarity: 'legendary', cls: L.cls, ancestry: L.ancestry });
  adv.name = L.name;
  adv.epithet = L.epithet;
  adv.abilities = { ...L.abilities };
  adv.quirks = [...L.quirks];
  adv.background = L.background;
  adv.legendId = id;
  const quirkHp = adv.quirks.reduce((s, q) => s + (QUIRKS[q].hp || 0), 0);
  adv.maxHp = CLASSES[L.cls].hitDie + mod(adv.abilities.con) + quirkHp + (L.signature.hp || 0);
  adv.hp = adv.maxHp;
  adv.loyalty = 4;
  adv.recruitedAt = now;
  addHistory(adv, L.join, now);
  return adv;
}

// After a recruitment quest. Returns { events, joined }.
export function finishLegendQuest(state, quest, outcome, now) {
  const id = quest.legend;
  const L = LEGENDS[id];
  const s = state.legends[id];
  if (!won(outcome)) {
    postLegendQuest(state, id, now, Number(quest.id.split('-').pop()) + 1);
    return { events: [`${L.name} was not impressed. The recruitment quest is back on the board.`], joined: null };
  }
  s.status = 'recruited';
  s.joinedAt = now;
  const adv = createLegend(state, id, now);
  if (state.roster.length < rosterCap(state)) {
    adv.id = nextId(state, 'a');
    assignArc(state, adv);
    state.roster.push(adv);
    addLog(state, `${L.name}, ${L.epithet}, joined the company.`, now);
    return { events: [L.join], joined: { id, name: L.name, waiting: false } };
  }
  adv.id = `rl-${id}`;
  adv.arrivedAt = now;
  adv.leavesAt = now + 365 * 24 * 60 * MIN;
  state.bar.recruits.push(adv);
  addLog(state, `${L.name} is waiting at the bar for a free bed.`, now);
  return { events: [`${L.name} agreed to join, but every bed is taken. ${L.name} is waiting at the bar until you make room.`], joined: { id, name: L.name, waiting: true } };
}
