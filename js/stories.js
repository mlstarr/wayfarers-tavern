// Personal story arcs: assignment, beats, personal quests and legacies. No DOM.
import { ARCS, ARC_IDS, STORY_AT } from '../data/arcs.js';
import { TIER_DURATIONS } from '../data/quests.js';
import { SUPPLIES } from '../data/supplies.js';
import { Rng, seedFrom } from './rng.js';
import { MIN } from './config.js';
import { fill } from './reports.js';
import { buildEncounter } from './encounters.js';
import { paceOf, paced } from './pace.js';
import { addLog } from './state.js';
import { changeLoyalty, gainXp, addHistory, firstName } from './adventurers.js';
import { checkRankUp } from './tavern.js';

// Prefers arcs that suit the hero's background and that nobody else in the company has.
export function assignArc(state, adv) {
  if (adv.arc) return adv.arc;
  const taken = new Set(state.roster.map((a) => a.arc && a.arc.id).filter(Boolean));
  const rng = new Rng(seedFrom(adv.seed, 'arc'));
  const free = ARC_IDS.filter((id) => !taken.has(id));
  const pool = free.length ? free : ARC_IDS;
  const id = rng.weighted(pool.map((a) => [a, ARCS[a].backgrounds.includes(adv.background) ? 4 : 1]));
  adv.arc = { id, step: 0 };
  return adv.arc;
}

const partLabel = (step) => (step === 0 ? 'Introduction' : `Part ${step} of 3`);

function sceneFor(adv) {
  const arc = ARCS[adv.arc.id];
  return adv.arc.step === 0 ? arc.intro : arc.beats[adv.arc.step - 1];
}

// Story moments ready to play: hero at the tavern and enough quests behind them.
export function readyStories(state) {
  return state.roster.filter((a) => a.arc && a.status === 'idle' && a.arc.step <= 3
    && (a.stats.quests || 0) >= STORY_AT[a.arc.step]);
}

export function describeStory(adv) {
  const arc = ARCS[adv.arc.id];
  const scene = sceneFor(adv);
  const vars = { name: firstName(adv) };
  return {
    title: arc.title,
    part: partLabel(adv.arc.step),
    text: fill(scene.text, vars),
    choices: scene.choices.map((c, i) => ({ index: i, label: fill(c.label, vars), cost: c.cost || 0 })),
  };
}

// Next story beat for a hero, for the detail screen.
export function storyStatus(adv) {
  if (!adv.arc) return null;
  const arc = ARCS[adv.arc.id];
  const s = adv.arc.step;
  if (s >= 5) return { title: arc.title, text: `Complete. ${arc.legacy.name}: ${fill(arc.legacy.desc, { name: firstName(adv) })}` };
  if (s === 4) return { title: arc.title, text: `${fill(arc.quest.title, { name: firstName(adv) })} is waiting on the quest board.` };
  const need = STORY_AT[s] - (adv.stats.quests || 0);
  return { title: arc.title, text: need > 0 ? `${partLabel(s)} after ${need} more quest${need > 1 ? 's' : ''}.` : `${partLabel(s)} is waiting at the tavern.` };
}

function applyEffects(state, adv, effects, out) {
  for (const e of effects) {
    if (e.loyalty) changeLoyalty(adv, e.loyalty);
    if (e.gold) { state.gold += e.gold; out.notes.push(`+${e.gold} gold`); }
    if (e.renown) { state.renown += e.renown; out.notes.push(`+${e.renown} renown`); }
    if (e.xp) {
      out.notes.push(`${firstName(adv)} +${e.xp} XP`);
      for (const u of gainXp(adv, e.xp)) out.notes.push(`${firstName(adv)} reached level ${u.level}.`);
    }
    if (e.buff) {
      adv.buffs = (adv.buffs || []).filter((b) => b.label !== e.buff.label);
      adv.buffs.push({ ...e.buff });
      out.notes.push(`${firstName(adv)}: ${e.buff.label.toLowerCase()} (+${e.buff.mod} for ${e.buff.quests} quest${e.buff.quests > 1 ? 's' : ''})`);
    }
    if (e.supply) {
      state.supplies[e.supply.id] = (state.supplies[e.supply.id] || 0) + e.supply.n;
      out.notes.push(`+${e.supply.n} ${SUPPLIES[e.supply.id].name.toLowerCase()}`);
    }
    if (e.loyalty) out.notes.push(`${firstName(adv)} loyalty ${e.loyalty > 0 ? '+' : ''}${e.loyalty}`);
  }
}

// Plays a story choice. Returns { text, notes, quest } or { error }.
export function playStory(state, advId, index, now) {
  const adv = state.roster.find((a) => a.id === advId);
  if (!adv || !readyStories(state).includes(adv)) return { error: 'That moment has passed' };
  const scene = sceneFor(adv);
  const choice = scene.choices[index];
  if (!choice) return { error: 'Choose an option' };
  if (choice.cost && state.gold < choice.cost) return { error: 'Not enough gold' };
  if (choice.cost) state.gold -= choice.cost;
  const vars = { name: firstName(adv) };
  const out = { text: fill(choice.text, vars), notes: choice.cost ? [`-${choice.cost} gold`] : [], quest: null };
  applyEffects(state, adv, choice.effects, out);
  addHistory(adv, out.text, now);
  adv.arc.step += 1;
  if (adv.arc.step === 4) {
    out.quest = postPersonalQuest(state, adv, now);
    addLog(state, `A personal quest for ${firstName(adv)} is on the board: ${out.quest.title}.`, now);
  }
  checkRankUp(state, now);
  return out;
}

function tierFor(adv) {
  return adv.level <= 2 ? 1 : adv.level <= 5 ? 2 : 3;
}

// A posting only this hero can lead. Stays up until done.
export function postPersonalQuest(state, adv, now, attempt = 0) {
  const arc = ARCS[adv.arc.id];
  const q = arc.quest;
  const rng = new Rng(seedFrom(adv.seed, 'personal', attempt));
  const tier = tierFor(adv);
  const size = Math.max(2, Math.round((q.party[0] + q.party[1]) / 2));
  const ids = rng.shuffle(q.pool).slice(0, rng.int(q.count[0], q.count[1]));
  const encounters = ids.map((d) => buildEncounter(d, tier, size, rng));
  encounters.push({ ...buildEncounter(q.finale, tier, size, rng), finale: true });
  const n = encounters.length;
  const durations = TIER_DURATIONS[tier];
  const duration = paced(durations[Math.min(durations.length - 1, n)], paceOf(state).scale);
  const vars = { name: firstName(adv) };
  const quest = {
    id: `pq-${adv.id}-${attempt}`,
    seed: rng.int(0, 2147483647),
    template: `arc:${adv.arc.id}`,
    title: fill(q.title, vars),
    blurb: fill(q.blurb, vars),
    tier,
    expedition: false,
    personal: adv.id,
    duration,
    party: q.party,
    encounters,
    conditions: [],
    gold: Math.round((20 + 15 * tier) * n * (1 + duration / 240)),
    xp: Math.round(15 * tier * n * (1 + duration / 360)),
    postedAt: now,
    expiresAt: now + 30 * 24 * 60 * MIN,
  };
  state.board.quests.unshift(quest);
  return quest;
}

// After a personal quest returns. Returns event lines.
export function finishPersonalQuest(state, adv, quest, outcome, now) {
  const arc = ARCS[adv.arc.id];
  const won = ['triumph', 'success', 'costly'].includes(outcome);
  const vars = { name: firstName(adv) };
  if (!won) {
    changeLoyalty(adv, -1);
    const attempt = Number(quest.id.split('-').pop()) + 1;
    postPersonalQuest(state, adv, now, attempt);
    addHistory(adv, `Fell short at "${quest.title}". The story is not over.`, now);
    return [`${firstName(adv)}'s personal quest failed. It is back on the board, and ${firstName(adv)} is shaken (loyalty -1).`];
  }
  adv.arc.step = 5;
  adv.legacy = adv.arc.id;
  if (arc.legacy.hp) { adv.maxHp += arc.legacy.hp; adv.hp += arc.legacy.hp; }
  if (!adv.epithet) adv.epithet = arc.epithet;
  changeLoyalty(adv, 5);
  if (adv.goal) adv.goal.forced = true;
  const ending = fill(arc.ending, vars);
  addHistory(adv, ending, now);
  return [ending, `${firstName(adv)} earned a legacy: ${arc.legacy.name} (${fill(arc.legacy.desc, vars)}) and the name "${adv.epithet}".`];
}
