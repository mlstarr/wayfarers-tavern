// Personal goals: assignment, progress and rewards. No DOM.
import { GOALS, GOAL_QUEST_NAMES } from '../data/goals.js';
import { MONSTERS } from '../data/monsters.js';
import { CLASSES } from '../data/classes.js';
import { Rng, seedFrom } from './rng.js';
import { fill } from './reports.js';
import { MAX_LOYALTY } from './config.js';

export function assignGoal(adv) {
  const rng = new Rng(seedFrom(adv.seed, 'goal', adv.goalsDone || 0));
  const prev = adv.goal ? adv.goal.id : null;
  const tpl = rng.weighted(GOALS.filter((g) => g.id !== prev).map((g) => [g, g.weight]));
  const goal = { id: tpl.id, type: tpl.type, progress: 0, n: 1, target: tpl.target || null };
  if (tpl.n) goal.n = rng.pick(tpl.n);
  if (tpl.type === 'slay') goal.target = rng.pick(tpl.targets);
  if (tpl.type === 'level') goal.n = adv.level + rng.int(2, 3);
  adv.goal = goal;
  return goal;
}

export function goalText(goal) {
  const tpl = GOALS.find((g) => g.id === goal.id);
  return fill(tpl.text, {
    n: goal.n,
    plural: goal.target && MONSTERS[goal.target] ? MONSTERS[goal.target].plural : '',
    quest: GOAL_QUEST_NAMES[goal.target] || '',
  });
}

export function goalProgress(goal, adv) {
  if (goal.type === 'level') return { have: Math.min(adv.level, goal.n), need: goal.n };
  return { have: Math.min(goal.progress, goal.n), need: goal.n };
}

function isDone(goal, adv) {
  const p = goalProgress(goal, adv);
  return p.have >= p.need;
}

// Reward for a finished goal: loyalty, +2 to the main ability (or +5 HP if maxed), a new goal.
function complete(adv, now) {
  const text = goalText(adv.goal);
  const main = CLASSES[adv.cls].priority[0];
  let reward;
  if (adv.abilities[main] < 20) {
    adv.abilities[main] = Math.min(20, adv.abilities[main] + 2);
    reward = `+2 ${main.toUpperCase()}`;
  } else {
    adv.maxHp += 5; adv.hp += 5;
    reward = '+5 max HP';
  }
  adv.loyalty = Math.min(MAX_LOYALTY, (adv.loyalty || 0) + 2);
  adv.goalsDone = (adv.goalsDone || 0) + 1;
  adv.history.unshift({ at: now, text: `Fulfilled a lifelong goal: ${text}` });
  assignGoal(adv);
  return { id: adv.id, name: adv.name.split(' ')[0], text, reward };
}

// After a quest. boost: { id: extra slay progress } from a dispatch.
export function progressAfterQuest(adv, result, quest, boost = 0) {
  const g = adv.goal;
  if (!g) return;
  const good = ['triumph', 'success', 'costly'].includes(result.outcome);
  if (g.type === 'slay') {
    const kills = result.defeated.filter((m) => m === g.target).length;
    if (kills) g.progress += kills + boost;
  } else if (g.type === 'gold') g.progress += result.gold;
  else if (g.type === 'triumph' && result.outcome === 'triumph') g.progress += 1;
  else if (g.type === 'quest' && good && quest.template === g.target) g.progress += 1;
  else if (g.type === 'nat20') g.progress += (result.nats[adv.id] || { n20: 0 }).n20;
}

export function progressBond(adv, hasFriend) {
  if (adv.goal && adv.goal.type === 'bond' && hasFriend) adv.goal.progress = 1;
}

// Completes any finished goals. Returns completion records.
export function settleGoals(advs, now) {
  const out = [];
  for (const a of advs) {
    if (a.goal && isDone(a.goal, a)) out.push(complete(a, now));
  }
  return out;
}
