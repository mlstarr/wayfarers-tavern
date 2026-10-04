// Single encounters: skill checks, group checks and combat. Called by js/resolve.js.
import { rollDice } from './rng.js';
import { CLASSES } from '../data/classes.js';
import * as T from '../data/report-templates.js';
import * as A from './adventurers.js';
import { line, actorVars, joinNames } from './reports.js';

const MAX_ROUNDS = 5;

// Situational modifiers for one roll: bonds/buffs, conditions, dispatch effects.
function situational(ctx, m, { skill, ability, attack }) {
  let mod = 0;
  const labels = [];
  const add = (n, label) => { if (n) { mod += n; labels.push(`${label} ${n > 0 ? '+' : ''}${n}`); } };
  const b = ctx.bonus[m.id] || 0;
  if (b) { mod += b; labels.push(...(ctx.bonusNotes[m.id] || [])); }
  const ab = ability || null;
  for (const c of ctx.conds) {
    if (c.rollMod) add(c.rollMod, c.short);
    if (!attack && skill && c.skillMods && c.skillMods[skill]) add(c.skillMods[skill], c.short);
    if (!attack && !skill && ab && c.abilityMods && c.abilityMods[ab]) add(c.abilityMods[ab], c.short);
    if (attack && c.attackMod) add(c.attackMod, c.short);
    if (c.fatigue && ctx.index >= ctx.half) add(c.fatigue, c.short);
  }
  for (const pm of ctx.partyMods) {
    const on = pm.finale ? ctx.isFinale : ctx.index >= pm.from && (pm.until == null || ctx.index <= pm.until);
    if (on) add(pm.mod, pm.label);
  }
  return { mod, labels };
}

// One d20 roll by a party member. Handles advantage, luck, nat 20s and 1s.
export function roll(ctx, m, { label, skill = null, ability = null, base, dc, tags = [], attack = false }) {
  const { plus, minus } = A.rollFactors(m.a, tags, attack);
  if (ctx.packed.rope && (tags.includes('heights') || tags.includes('water'))) plus.push('rope');
  if (ctx.isFinale) {
    for (const f of ctx.finaleAdv) plus.push(f);
    if (ctx.heroAdv[m.id]) plus.push(ctx.heroAdv[m.id]);
  }
  const { mode, reasons } = A.modeOf(plus, minus);
  const sit = situational(ctx, m, { skill, ability, attack });
  const bonus = base + sit.mod;
  const r = ctx.rng.d20(mode);
  const notes = [...reasons, ...(attack ? [] : sit.labels)];
  let d = r.d;
  const rolls = [...r.rolls];
  let extra = null;
  if (d === 1 && A.hasSpecial(m.a, 'lucky') && !m.used.lucky) {
    m.used.lucky = true;
    d = ctx.rng.d(20);
    rolls.push(d);
    notes.push('lucky reroll');
    extra = line(ctx.rng, T.LUCK_LINES, { ...actorVars(m.a), n: d });
  }
  const total = d + bonus;
  const pass = d === 20 || (d !== 1 && total >= dc);
  const nat = d === 20 ? 20 : d === 1 ? 1 : null;
  if (nat === 20) ctx.nats[m.id].n20 += 1;
  if (nat === 1) ctx.nats[m.id].n1 += 1;
  return { who: m.id, name: m.name, label, rolls, mode, d, bonus, total, dc, pass, nat, notes, extra };
}

export function natLine(ctx, m, r) {
  if (!r.nat) return null;
  const key = `${m.id}-${r.nat}`;
  if (!ctx.noted.has(key)) {
    ctx.noted.add(key);
    ctx.history.push({ id: m.id, text: `Rolled a natural ${r.nat} during "${ctx.quest.title}".` });
  }
  return line(ctx.rng, r.nat === 20 ? T.NAT20_LINES : T.NAT1_LINES, actorVars(m.a));
}

export function hurt(ctx, m, dmg, lines) {
  const wasUp = m.hp > 0;
  m.hp = Math.max(0, m.hp - dmg);
  if (wasUp && m.hp === 0) lines.push(line(ctx.rng, T.FALL_LINES, actorVars(m.a)));
}

function hazardDamage(ctx, def, m) {
  let dmg = rollDice(ctx.rng, def.hazard) + (ctx.tier - 1) * 2;
  for (const c of ctx.conds) dmg += c.hazardPlus || 0;
  if (A.hasFlag(m.a, 'evasion')) dmg = Math.floor(dmg / 2);
  return Math.max(1, dmg);
}

// Bard inspiration rescues a failed roll if the die can cover the gap.
function tryInspire(ctx, r, lines) {
  if (r.pass || r.nat === 1) return;
  const bard = ctx.sim.find((s) => s.hp > 0 && s.id !== r.who && CLASSES[s.a.cls].perk === 'inspire'
    && (s.used.inspire || 0) < (A.hasFlag(s.a, 'inspirePlus') ? 2 : 1));
  if (!bard) return;
  const die = A.hasFlag(bard.a, 'inspirePlus') ? 8 : 6;
  if (r.total + die < r.dc) return;
  bard.used.inspire = (bard.used.inspire || 0) + 1;
  const n = ctx.rng.d(die);
  r.total += n;
  r.notes.push(`inspired +${n}`);
  if (r.total >= r.dc) r.pass = true;
  lines.push(line(ctx.rng, T.INSPIRE_LINES, { bard: bard.name, n }));
}

export function bestAt(ctx, members, skill, ability, tags = []) {
  const score = (m) => {
    const { mode } = A.rollMode(m.a, tags);
    return A.checkBonus(m.a, skill, ability) + (mode === 'adv' ? 4 : mode === 'dis' ? -4 : 0);
  };
  return members.reduce((best, m) => (score(m) > score(best) ? m : best), members[0]);
}

export function skillCheck(ctx, enc, def, alive, label) {
  const actor = bestAt(ctx, alive, def.skill, def.ability, ctx.tagsOf(enc));
  const r = roll(ctx, actor, {
    label, skill: def.skill, ability: def.ability, base: A.checkBonus(actor.a, def.skill, def.ability), dc: enc.dc, tags: ctx.tagsOf(enc),
  });
  const lines = [];
  if (r.extra) lines.push(r.extra);
  tryInspire(ctx, r, lines);
  lines.unshift(line(ctx.rng, r.pass ? def.success : def.fail, actorVars(actor.a)));
  const nl = natLine(ctx, actor, r);
  if (nl) lines.push(nl);
  if (r.pass && def.bonusGold) ctx.bonusGold += 10 * ctx.tier + ctx.rng.int(0, 10);
  if (!r.pass && def.failGoldLoss) ctx.goldLoss += def.failGoldLoss;
  if (!r.pass && def.hazard) {
    const dmg = hazardDamage(ctx, def, actor);
    r.dmgTaken = dmg;
    hurt(ctx, actor, dmg, lines);
  }
  return { success: r.pass, lines, rolls: [r] };
}

export function groupCheck(ctx, enc, def, alive, label) {
  const rolls = [];
  const lines = [];
  for (const m of alive) {
    const r = roll(ctx, m, {
      label, skill: def.skill, ability: def.ability, base: A.checkBonus(m.a, def.skill, def.ability), dc: enc.dc, tags: ctx.tagsOf(enc),
    });
    if (r.extra) lines.push(r.extra);
    const nl = natLine(ctx, m, r);
    if (nl) lines.push(nl);
    rolls.push(r);
  }
  const passes = rolls.filter((r) => r.pass).length;
  const success = passes >= Math.ceil(alive.length / 2);
  lines.unshift(line(ctx.rng, success ? def.success : def.fail, { party: joinNames(alive.map((m) => m.name)) }));
  if (def.hazard) {
    for (const r of rolls.filter((x) => !x.pass)) {
      const m = alive.find((x) => x.id === r.who);
      const dmg = Math.max(1, Math.ceil(hazardDamage(ctx, def, m) / 2));
      r.dmgTaken = dmg;
      hurt(ctx, m, dmg, lines);
    }
  }
  return { success, lines, rolls };
}

// The monster as it shows up under the quest's conditions and dispatch choices.
function fieldMonster(ctx, enc) {
  const mon = { ...enc.monster };
  for (const c of ctx.conds) {
    if (c.undeadAtk && mon.tags.includes('undead')) { mon.atk += c.undeadAtk; mon.hp = Math.round(mon.hp * c.undeadHp); }
    if (c.fireAc && (mon.tags.includes('beast') || mon.tags.includes('magic'))) mon.ac += c.fireAc;
    if (c.venom && mon.tags.includes('spider')) mon.venom = c.venom;
  }
  if (ctx.isFinale && ctx.finaleHarder) mon.atk += ctx.finaleHarder;
  return mon;
}

function attackOnce(ctx, m, mon, state, rolls, lines) {
  const cls = CLASSES[m.a.cls];
  const r = roll(ctx, m, { label: 'Attack', base: A.attackBonus(m.a), dc: mon.ac, tags: mon.tags, attack: true });
  r.round = state.round;
  if (r.extra) lines.push(r.extra);
  if (r.pass) {
    const crit = r.nat === 20;
    let dmg = rollDice(ctx.rng, A.damageDice(m.a), crit) + A.mod(m.a.abilities[cls.attack]);
    if (cls.perk === 'rage') dmg += 2;
    if (A.hasFlag(m.a, 'favoredFoe') && mon.tags.includes('beast')) dmg += rollDice(ctx.rng, '1d6', crit);
    if (ctx.packed.holyWater && mon.tags.includes('undead')) { dmg += rollDice(ctx.rng, '1d6', crit); r.notes.push('holy water'); }
    const first = !state.firstHit[m.id];
    state.firstHit[m.id] = true;
    if (cls.perk === 'sneak' && first) {
      dmg += rollDice(ctx.rng, A.hasFlag(m.a, 'sneakPlus') ? '3d6' : '1d6', crit);
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
    dmg = Math.max(1, dmg);
    r.dmg = dmg;
    state.mhp -= dmg;
    state.dealt[m.id] = (state.dealt[m.id] || 0) + dmg;
    if (crit && !state.critNoted) { state.critNoted = true; lines.push(line(ctx.rng, T.CRIT_LINES, actorVars(m.a))); }
  } else if (r.nat === 1) {
    lines.push(natLine(ctx, m, r));
  }
  if (r.nat === 20) natLine(ctx, m, r);
  rolls.push(r);
}

export function combat(ctx, enc, def, alive) {
  const mon = fieldMonster(ctx, enc);
  const state = { mhp: mon.hp, dealt: {}, firstHit: {}, critNoted: false, round: 0 };
  const rolls = [];
  const lines = [];
  let fallen = null;

  while (state.round < MAX_ROUNDS && state.mhp > 0 && ctx.sim.some((s) => s.hp > 0)) {
    state.round += 1;
    for (const m of ctx.sim.filter((s) => s.hp > 0)) {
      const swings = A.hasFlag(m.a, 'extraAttack') ? 2 : 1;
      for (let s = 0; s < swings && state.mhp > 0; s++) attackOnce(ctx, m, mon, state, rolls, lines);
    }
    if (state.mhp <= 0) break;
    for (let k = 0; k < mon.attacks; k++) {
      const targets = ctx.sim.filter((s) => s.hp > 0);
      if (!targets.length) break;
      const t = ctx.rng.pick(targets);
      const ac = A.armorClass(t.a);
      const d = ctx.rng.d(20);
      const pass = d === 20 || (d !== 1 && d + mon.atk >= ac);
      const er = {
        who: 'enemy', name: mon.name, label: `Attacks ${t.name}`, rolls: [d], d, bonus: mon.atk,
        total: d + mon.atk, dc: ac, pass, nat: d === 20 ? 20 : d === 1 ? 1 : null, notes: [], enemy: true, round: state.round,
      };
      if (pass) {
        let dmg = rollDice(ctx.rng, mon.dmg, d === 20);
        if (mon.venom) { dmg += rollDice(ctx.rng, mon.venom); er.notes.push('venom'); }
        if (A.hasFlag(t.a, 'damageResist')) dmg = Math.max(1, dmg - 2);
        er.dmg = dmg;
        hurt(ctx, t, dmg, lines);
        if (t.hp === 0 && !fallen) fallen = t;
      }
      rolls.push(er);
    }
  }

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
