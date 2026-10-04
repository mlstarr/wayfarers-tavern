// Fights: the party's attacks (with class gifts and talents), then the monster's.
import { rollDice } from './rng.js';
import { CLASSES } from '../data/classes.js';
import * as T from '../data/report-templates.js';
import * as A from './adventurers.js';
import { line, actorVars } from './reports.js';
import { auraSum, auraAny } from './auras.js';
import { roll, natLine, hurt } from './checks.js';

const MAX_ROUNDS = 5;

// The monster as it shows up under the quest's conditions, dispatch choices and party auras.
function fieldMonster(ctx, enc) {
  const mon = { ...enc.monster };
  for (const c of ctx.conds) {
    if (c.undeadAtk && mon.tags.includes('undead')) { mon.atk += c.undeadAtk; mon.hp = Math.round(mon.hp * c.undeadHp); }
    if (c.fireAc && (mon.tags.includes('beast') || mon.tags.includes('magic'))) mon.ac += c.fireAc;
    if (c.venom && mon.tags.includes('spider')) mon.venom = c.venom;
  }
  if (ctx.isFinale && ctx.finaleHarder) mon.atk += ctx.finaleHarder;
  mon.atk += auraSum(ctx, 'foeAtk');
  mon.ac = Math.max(8, mon.ac + auraSum(ctx, 'foeAc'));
  return mon;
}

function landHit(ctx, m, state, r, dmg, lines) {
  dmg = Math.max(1, dmg);
  r.dmg = dmg;
  state.mhp -= dmg;
  state.dealt[m.id] = (state.dealt[m.id] || 0) + dmg;
  const steal = A.sumTrait(m.a, 'lifesteal');
  if (steal && m.hp > 0) m.hp = Math.min(m.a.maxHp, m.hp + steal);
  if (r.crit && !state.critNoted) { state.critNoted = true; lines.push(line(ctx.rng, T.CRIT_LINES, actorVars(m.a))); }
}

function attackOnce(ctx, m, mon, state, rolls, lines) {
  const cls = CLASSES[m.a.cls];
  const opening = !state.swung[m.id];
  state.swung[m.id] = true;
  const extraPlus = opening && A.hasTrait(m.a, 'firstStrike') ? ['first strike'] : [];
  const r = roll(ctx, m, { label: 'Attack', base: A.attackBonus(m.a), dc: mon.ac, tags: mon.tags, attack: true, extraPlus });
  r.round = state.round;
  if (r.extra) lines.push(r.extra);
  if (r.pass) {
    const crit = r.crit;
    const keys = [...mon.tags, mon.id];
    let dmg = rollDice(ctx.rng, A.damageDice(m.a), crit) + A.mod(m.a.abilities[cls.attack]);
    if (cls.perk === 'rage') dmg += 2;
    dmg += A.sumTrait(m.a, 'dmg') + A.sumVs(m.a, 'dmgVs', keys);
    if (m.hp < m.a.maxHp / 2) dmg += A.sumVs(m.a, 'bloodied', ['dmg']);
    if (A.hasFlag(m.a, 'favoredFoe') && mon.tags.includes('beast')) dmg += rollDice(ctx.rng, '1d6', crit);
    if (ctx.packed.holyWater && mon.tags.includes('undead')) { dmg += rollDice(ctx.rng, '1d6', crit); r.notes.push('holy water'); }
    const first = !state.firstHit[m.id];
    state.firstHit[m.id] = true;
    if (cls.perk === 'sneak' && first) {
      const dice = (A.hasFlag(m.a, 'sneakPlus') ? 3 : 1) + A.sumTrait(m.a, 'sneak');
      dmg += rollDice(ctx.rng, `${dice}d6`, crit);
      r.notes.push('sneak attack');
    }
    if (cls.perk === 'smite') {
      const radiant = A.hasFlag(m.a, 'smitePlus');
      const undead = mon.tags.includes('undead');
      if (first || (radiant && undead)) {
        dmg += rollDice(ctx.rng, radiant || undead ? '3d8' : '2d8', crit);
        r.notes.push('smite');
      }
    }
    if (crit && r.nat !== 20) r.notes.push('critical');
    landHit(ctx, m, state, r, dmg, lines);
  } else if (r.nat === 1) {
    lines.push(natLine(ctx, m, r));
  }
  if (r.nat === 20) natLine(ctx, m, r);
  rolls.push(r);
}

// Beast masters' companions: 1d6, 1d10 once trained, twice a round at full fury.
function companionAttacks(ctx, m, mon, state, rolls, lines) {
  const lvl = A.sumTrait(m.a, 'companion');
  if (!lvl) return;
  for (let k = 0; k < (lvl >= 3 ? 2 : 1) && state.mhp > 0; k++) {
    const r = roll(ctx, m, { label: 'Companion', base: A.attackBonus(m.a), dc: mon.ac, tags: mon.tags, attack: true });
    r.round = state.round;
    r.notes.push('companion');
    if (r.pass) landHit(ctx, m, state, r, rollDice(ctx.rng, lvl >= 2 ? '1d10' : '1d6', r.crit) + Math.floor(m.a.level / 2), lines);
    rolls.push(r);
  }
}

function pickTarget(ctx, targets) {
  if (!targets.some((t) => A.hasTrait(t.a, 'taunt'))) return ctx.rng.pick(targets);
  return ctx.rng.weighted(targets.map((t) => [t, A.hasTrait(t.a, 'taunt') ? 3 : 1]));
}

function monsterTurn(ctx, mon, state, rolls, lines) {
  let fallen = null;
  for (let k = 0; k < mon.attacks; k++) {
    const targets = ctx.sim.filter((s) => s.hp > 0);
    if (!targets.length) break;
    const t = pickTarget(ctx, targets);
    const ac = A.armorClass(t.a) + (ctx.tavern.ac || 0) + auraSum(ctx, 'ac');
    const atk = mon.atk + A.sumTrait(t.a, 'exposed');
    const d = ctx.rng.d(20);
    const pass = d === 20 || (d !== 1 && d + atk >= ac);
    const er = {
      who: 'enemy', name: mon.name, label: `Attacks ${t.name}`, rolls: [d], d, bonus: atk,
      total: d + atk, dc: ac, pass, nat: d === 20 ? 20 : d === 1 ? 1 : null, notes: [], enemy: true, round: state.round,
    };
    if (pass) {
      let dmg = rollDice(ctx.rng, mon.dmg, d === 20);
      if (mon.venom) { dmg += rollDice(ctx.rng, mon.venom); er.notes.push('venom'); }
      let resist = A.sumTrait(t.a, 'resist') + auraSum(ctx, 'resist');
      if (A.hasFlag(t.a, 'damageResist')) resist += 2;
      dmg = Math.max(1, dmg - resist);
      er.dmg = dmg;
      hurt(ctx, t, dmg, lines);
      if (t.hp === 0 && !fallen) fallen = t;
      if (t.hp > 0 && A.hasTrait(t.a, 'retaliate')) {
        const back = ctx.rng.d(6);
        state.mhp -= back;
        state.dealt[t.id] = (state.dealt[t.id] || 0) + back;
        er.notes.push(`${t.name} struck back for ${back}`);
      }
    }
    rolls.push(er);
    if (state.mhp <= 0) break;
  }
  return fallen;
}

export function combat(ctx, enc, def, alive) {
  const mon = fieldMonster(ctx, enc);
  ctx.foeKeys = [...mon.tags, mon.id];
  const state = { mhp: mon.hp, dealt: {}, firstHit: {}, swung: {}, critNoted: false, round: 0 };
  const rolls = [];
  const lines = [];
  let fallen = null;
  const ambush = auraAny(ctx, 'ambush');

  while (state.round < MAX_ROUNDS && state.mhp > 0 && ctx.sim.some((s) => s.hp > 0)) {
    state.round += 1;
    for (const m of ctx.sim.filter((s) => s.hp > 0)) {
      const swings = A.hasFlag(m.a, 'extraAttack') ? 2 : 1;
      for (let s = 0; s < swings && state.mhp > 0; s++) attackOnce(ctx, m, mon, state, rolls, lines);
      if (state.mhp > 0) companionAttacks(ctx, m, mon, state, rolls, lines);
    }
    if (state.mhp <= 0) break;
    if (state.round === 1 && ambush) {
      const who = ctx.sim.find((s) => s.id === ambush.from);
      lines.push(`${who ? who.name : 'Someone'} saw it coming, and the ${mon.name} never got its first blow in.`);
      continue;
    }
    const f = monsterTurn(ctx, mon, state, rolls, lines);
    if (f && !fallen) fallen = f;
  }
  ctx.foeKeys = [];

  const success = state.mhp <= 0;
  let star;
  if (success) {
    const bestId = Object.entries(state.dealt).sort((a, b) => b[1] - a[1])[0]?.[0];
    star = ctx.sim.find((s) => s.id === bestId) || alive[0];
    ctx.defeated.push(mon.id);
  } else {
    star = fallen || alive[0];
  }
  const roundsText = `${state.round} round${state.round === 1 ? '' : 's'}`;
  lines.unshift(`${line(ctx.rng, success ? def.success : def.fail, { ...actorVars(star.a), monster: mon.name })} (${roundsText})`);
  return { success, lines: lines.filter(Boolean), rolls, monster: mon.name };
}
