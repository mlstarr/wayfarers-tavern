// Common-room scenes between quests. No DOM.
import { SCENES } from '../data/scenes.js';
import { QUIRKS } from '../data/quirks.js';
import { Rng, seedFrom } from './rng.js';
import { MIN, SCENE_EVERY, SCENE_CHANCE, SCENE_MAX } from './config.js';
import { checkBonus, changeLoyalty, gainXp, addHistory, firstName } from './adventurers.js';
import { bondValue, bondLevel, addBond } from './bonds.js';
import { fill } from './reports.js';
import { addLog } from './state.js';

const slotOf = (now, scale) => Math.floor(now / (SCENE_EVERY * Math.max(0.25, scale) * MIN));

function fits(state, tpl, actors) {
  const n = tpl.needs;
  if (!n) return true;
  const [a, b] = actors;
  if (n.cls && !n.cls.includes(a.cls)) return false;
  if (n.quirk && !a.quirks.includes(n.quirk)) return false;
  if (n.loyaltyMax != null && (a.loyalty || 0) > n.loyaltyMax) return false;
  if (n.hurt && a.hp >= a.maxHp) return false;
  if (n.bond) {
    const lv = b && bondLevel(bondValue(state, a.id, b.id));
    if (n.bond === 'friends' && !(lv && lv.mod > 0)) return false;
    if (n.bond === 'rivals' && !(lv && lv.mod < 0)) return false;
  }
  return true;
}

// Every SCENE_EVERY game-minutes, idle adventurers may start a scene. Returns true if anything changed.
// scale: early-game pacing. The first scene is guaranteed right after the first report.
export function refreshScenes(state, now, scale = 1) {
  const slot = slotOf(now, scale);
  state.flags = state.flags || {};
  const first = !state.flags.firstScene && state.stats.questsDone >= 1;
  if (!first && state.scenes.slot === slot) return false;
  state.scenes.slot = slot;
  const rng = new Rng(seedFrom(state.seed, 'scene', slot, first ? 'first' : ''));
  if (!first && !rng.chance(SCENE_CHANCE)) return true;
  const busy = new Set(state.scenes.list.flatMap((s) => s.actors));
  const free = rng.shuffle(state.roster.filter((a) => a.status === 'idle' && !busy.has(a.id)));
  const recent = state.scenes.list.map((s) => s.tpl);
  const options = [];
  for (const tpl of SCENES) {
    if (recent.includes(tpl.id) || free.length < tpl.actors) continue;
    // Try a few pairings so bond-based scenes can find the right two people.
    for (let k = 0; k < Math.min(free.length, 4); k++) {
      const actors = tpl.actors === 1 ? [free[k]] : [free[k], free[(k + 1) % free.length]];
      if (actors[0] && (tpl.actors === 1 || actors[1] !== actors[0]) && fits(state, tpl, actors)) {
        options.push({ tpl, actors });
        break;
      }
    }
  }
  if (!options.length) return true;
  const pick = rng.pick(options);
  if (first) state.flags.firstScene = true;
  state.scenes.list.push({ id: `sc${slot}`, tpl: pick.tpl.id, actors: pick.actors.map((a) => a.id), at: now });
  if (state.scenes.list.length > SCENE_MAX) state.scenes.list.shift();
  return true;
}

export function sceneVars(state, scene) {
  const [a, b] = scene.actors.map((id) => state.roster.find((x) => x.id === id));
  return { a: a ? firstName(a) : 'someone', b: b ? firstName(b) : 'someone' };
}

// Scenes whose actors are still around and free.
export function liveScenes(state) {
  return state.scenes.list.filter((s) => s.actors.every((id) => {
    const a = state.roster.find((x) => x.id === id);
    return a && a.status === 'idle';
  }));
}

export function describeScene(state, scene) {
  const tpl = SCENES.find((t) => t.id === scene.tpl);
  const vars = sceneVars(state, scene);
  return {
    text: fill(tpl.text, vars),
    choices: tpl.choices.map((c, i) => ({ index: i, label: fill(c.label, vars), cost: c.cost || 0 })),
  };
}

function apply(state, effects, ctx, out) {
  const who = (w) => (w === 'both' ? ctx.actors : w === 'b' ? [ctx.actors[1]] : [ctx.actors[0]]).filter(Boolean);
  for (const e of effects) {
    if (e.gold) { state.gold = Math.max(0, state.gold + e.gold); out.gold += e.gold; }
    if (e.bond && ctx.actors[1]) {
      const [a, b] = ctx.actors;
      const msg = addBond(state, a.id, b.id, e.bond, [firstName(a), firstName(b)]);
      if (msg) out.notes.push(msg);
    }
    if (e.loyalty) for (const a of who(e.loyalty.who)) changeLoyalty(a, e.loyalty.n);
    if (e.buff) for (const a of who(e.buff.who)) {
      a.buffs = (a.buffs || []).filter((x) => x.label !== e.buff.label);
      a.buffs.push({ label: e.buff.label, mod: e.buff.mod, quests: e.buff.quests });
      out.notes.push(`${firstName(a)}: ${e.buff.label.toLowerCase()} (+${e.buff.mod} next quest).`);
    }
    if (e.hp) for (const a of who(e.hp.who)) {
      a.hp = Math.max(1, Math.min(a.maxHp, a.hp + e.hp.n));
      if (a.hp < a.maxHp && !a.restAt) a.restAt = ctx.now;
    }
    if (e.xp) for (const a of who(e.xp.who)) {
      for (const u of gainXp(a, e.xp.n)) out.notes.push(`${firstName(a)} reached level ${u.level}.`);
    }
    if (e.quirk) for (const a of who(e.quirk.who)) {
      if (!a.quirks.includes(e.quirk.id) && ctx.rng.chance(e.quirk.p ?? 1)) {
        a.quirks.push(e.quirk.id);
        out.notes.push(`${firstName(a)} picked up a new quirk: ${QUIRKS[e.quirk.id].name.toLowerCase()}.`);
      }
    }
    if (e.check) {
      const c = e.check;
      let actor = who(c.who === 'best' ? 'a' : c.who)[0];
      if (c.who === 'best') actor = [...ctx.actors].sort((x, y) => checkBonus(y, c.skill, c.ability) - checkBonus(x, c.skill, c.ability))[0];
      const bonus = checkBonus(actor, c.skill || null, c.ability || null);
      const d = ctx.rng.d(20);
      const pass = d === 20 || (d !== 1 && d + bonus >= c.dc);
      out.roll = { name: firstName(actor), label: c.skill || `${c.ability.toUpperCase()} save`, d, bonus, total: d + bonus, dc: c.dc, pass };
      out.text = fill(pass ? c.passText : c.failText, ctx.vars);
      apply(state, pass ? c.pass : c.fail, ctx, out);
    }
    if (e.coin) {
      const d = ctx.rng.d(20);
      const win = d >= 11;
      out.roll = { name: 'Luck', label: 'd20', d, bonus: 0, total: d, dc: 11, pass: win };
      out.text = fill(win ? e.coin.winText : e.coin.loseText, ctx.vars);
      apply(state, win ? e.coin.win : e.coin.lose, ctx, out);
    }
  }
}

// Plays out a choice. Returns { text, roll, notes } or { error }.
export function resolveScene(state, sceneId, index, now) {
  const scene = state.scenes.list.find((s) => s.id === sceneId);
  if (!scene) return { error: 'That moment has passed' };
  const tpl = SCENES.find((t) => t.id === scene.tpl);
  const choice = tpl.choices[index];
  if (!choice) return { error: 'Choose an option' };
  if (choice.cost && state.gold < choice.cost) return { error: 'Not enough gold' };
  const actors = scene.actors.map((id) => state.roster.find((x) => x.id === id)).filter(Boolean);
  const vars = sceneVars(state, scene);
  const ctx = { actors, vars, now, rng: new Rng(seedFrom(state.seed, sceneId, index)) };
  const out = { text: choice.text ? fill(choice.text, vars) : '', roll: null, notes: [], gold: 0 };
  if (choice.cost) { state.gold -= choice.cost; out.gold -= choice.cost; }
  apply(state, choice.effects, ctx, out);
  state.scenes.list = state.scenes.list.filter((s) => s.id !== sceneId);
  for (const a of actors) addHistory(a, out.text || fill(tpl.text, vars), now);
  addLog(state, out.text || fill(tpl.text, vars), now);
  return out;
}
