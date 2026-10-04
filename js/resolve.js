// Quest resolution: plays every encounter with visible d20 rolls. Runs once, at send time.
import { Rng, rollDice } from './rng.js';
import { ENCOUNTERS } from '../data/encounters.js';
import { CLASSES } from '../data/classes.js';
import * as T from '../data/report-templates.js';
import * as A from './adventurers.js';
import { line, actorVars, joinNames, checkLabel } from './reports.js';

const MULT = {
  triumph: { gold: 1.5, xp: 1.25, renown: 3 },
  success: { gold: 1, xp: 1, renown: 2 },
  costly: { gold: 0.75, xp: 0.9, renown: 1 },
  failure: { gold: 0.25, xp: 0.6, renown: 0 },
  disaster: { gold: 0, xp: 0.4, renown: 0 },
};
const MAX_ROUNDS = 5;

export function resolveQuest(quest, party, seed) {
  const rng = new Rng(seed);
  const sim = party.map((a) => ({ a, id: a.id, name: A.firstName(a), hp: a.hp, used: {} }));
  const ctx = {
    rng, quest, sim, tier: quest.tier, bonusGold: 0, goldLoss: 0,
    nats: Object.fromEntries(sim.map((m) => [m.id, { n20: 0, n1: 0 }])),
    history: [], noted: new Set(),
  };

  const encounters = [];
  let successes = 0;
  for (const enc of quest.encounters) {
    const def = ENCOUNTERS[enc.def];
    const alive = sim.filter((m) => m.hp > 0);
    let out;
    if (!alive.length) {
      out = { lines: ['Nobody was left standing to face this.'], rolls: [], success: false, skipped: true };
    } else if (def.kind === 'combat') out = combat(ctx, enc, def, alive);
    else if (def.kind === 'group') out = groupCheck(ctx, enc, def, alive);
    else out = skillCheck(ctx, enc, def, alive);
    if (out.success) successes += 1;
    if (!out.skipped) out.lines.push(...recover(ctx));
    encounters.push({ def: enc.def, title: def.title, kind: def.kind, label: checkLabel(def), ...out });
  }

  const total = quest.encounters.length;
  const ratio = successes / total;
  const downed = sim.filter((m) => m.hp <= 0).map((m) => m.id);
  let outcome = ratio === 1 && !downed.length ? 'triumph'
    : ratio >= 0.6 ? 'success' : ratio >= 0.4 ? 'costly' : ratio >= 0.2 ? 'failure' : 'disaster';
  const finaleLost = ENCOUNTERS[quest.encounters[total - 1].def].kind === 'combat' && !encounters[total - 1].success;
  if (downed.length === sim.length) outcome = ratio >= 0.5 ? 'failure' : 'disaster';
  else if ((outcome === 'success' || outcome === 'triumph') && (downed.length || finaleLost)) outcome = 'costly';

  const m = MULT[outcome];
  const greedy = party.some((a) => A.hasSpecial(a, 'greedy')) ? 1.1 : 1;
  let gold = (quest.gold + (outcome === 'disaster' ? 0 : ctx.bonusGold)) * m.gold * greedy;
  gold = Math.max(0, Math.round(gold * (1 - ctx.goldLoss)));

  if (outcome === 'triumph') {
    for (const s of sim) ctx.history.push({ id: s.id, text: `Triumphed: ${quest.title}.` });
  }
  for (const id of downed) {
    ctx.history.push({ id, text: `Fell during "${quest.title}" and was carried home.` });
  }

  return {
    seed,
    encounters,
    successes,
    outcome,
    outcomeLabel: T.OUTCOMES[outcome].label,
    headline: rng.pick(T.OUTCOMES[outcome].lines),
    gold,
    xp: Math.round(quest.xp * m.xp),
    renown: quest.tier * m.renown,
    hp: Object.fromEntries(sim.map((s) => [s.id, s.hp])),
    downed,
    nats: ctx.nats,
    history: ctx.history,
  };
}

// One d20 roll by a party member. Handles advantage, luck, nat 20s and 1s.
function roll(ctx, m, { label, bonus, dc, tags = [], attack = false }) {
  const { mode, reasons } = A.rollMode(m.a, tags, attack);
  const r = ctx.rng.d20(mode);
  const notes = [...reasons];
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

function natLine(ctx, m, r) {
  if (!r.nat) return null;
  const key = `${m.id}-${r.nat}`;
  if (!ctx.noted.has(key)) {
    ctx.noted.add(key);
    ctx.history.push({ id: m.id, text: r.nat === 20
      ? `Rolled a natural 20 during "${ctx.quest.title}".`
      : `Rolled a natural 1 during "${ctx.quest.title}".` });
  }
  return line(ctx.rng, r.nat === 20 ? T.NAT20_LINES : T.NAT1_LINES, actorVars(m.a));
}

function hazardDamage(ctx, def) {
  return rollDice(ctx.rng, def.hazard) + (ctx.tier - 1) * 2;
}

function hurt(ctx, m, dmg, lines) {
  const wasUp = m.hp > 0;
  m.hp = Math.max(0, m.hp - dmg);
  if (wasUp && m.hp === 0) lines.push(line(ctx.rng, T.FALL_LINES, actorVars(m.a)));
}

// Bard inspiration: once per quest, rescues a failed roll if a d6 is enough.
function tryInspire(ctx, r, lines) {
  if (r.pass || r.nat === 1) return;
  const bard = ctx.sim.find((s) => s.hp > 0 && CLASSES[s.a.cls].perk === 'inspire' && !s.used.inspire && s.id !== r.who);
  if (!bard || r.total + 6 < r.dc) return;
  bard.used.inspire = true;
  const n = ctx.rng.d(6);
  r.total += n;
  r.notes.push(`inspired +${n}`);
  if (r.total >= r.dc) r.pass = true;
  lines.push(line(ctx.rng, T.INSPIRE_LINES, { bard: bard.name, n }));
}

function skillCheck(ctx, enc, def, alive) {
  const label = checkLabel(def);
  const score = (m) => {
    const { mode } = A.rollMode(m.a, def.tags);
    return A.checkBonus(m.a, def.skill, def.ability) + (mode === 'adv' ? 4 : mode === 'dis' ? -4 : 0);
  };
  const actor = alive.reduce((best, m) => (score(m) > score(best) ? m : best), alive[0]);
  const r = roll(ctx, actor, { label, bonus: A.checkBonus(actor.a, def.skill, def.ability), dc: enc.dc, tags: def.tags });
  const lines = [];
  if (r.extra) lines.push(r.extra);
  tryInspire(ctx, r, lines);
  const vars = actorVars(actor.a);
  lines.unshift(line(ctx.rng, r.pass ? def.success : def.fail, vars));
  const nl = natLine(ctx, actor, r);
  if (nl) lines.push(nl);
  if (r.pass && def.bonusGold) ctx.bonusGold += 10 * ctx.tier + ctx.rng.int(0, 10);
  if (!r.pass && def.failGoldLoss) ctx.goldLoss += def.failGoldLoss;
  if (!r.pass && def.hazard) {
    const dmg = hazardDamage(ctx, def);
    r.dmgTaken = dmg;
    hurt(ctx, actor, dmg, lines);
  }
  return { success: r.pass, lines, rolls: [r] };
}

function groupCheck(ctx, enc, def, alive) {
  const label = checkLabel(def);
  const rolls = [];
  const lines = [];
  for (const m of alive) {
    const r = roll(ctx, m, { label, bonus: A.checkBonus(m.a, def.skill, def.ability), dc: enc.dc, tags: def.tags });
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
      const dmg = Math.max(1, Math.ceil(hazardDamage(ctx, def) / 2));
      r.dmgTaken = dmg;
      hurt(ctx, alive.find((m) => m.id === r.who), dmg, lines);
    }
  }
  return { success, lines, rolls };
}

function combat(ctx, enc, def, alive) {
  const mon = enc.monster;
  let mhp = mon.hp;
  const rolls = [];
  const lines = [];
  const dealt = {};
  const firstHit = {};
  let critNoted = false;
  let fallen = null;
  let round = 0;

  while (round < MAX_ROUNDS && mhp > 0 && ctx.sim.some((s) => s.hp > 0)) {
    round += 1;
    for (const m of ctx.sim.filter((s) => s.hp > 0)) {
      if (mhp <= 0) break;
      const cls = CLASSES[m.a.cls];
      const r = roll(ctx, m, { label: 'Attack', bonus: A.attackBonus(m.a), dc: mon.ac, tags: mon.tags, attack: true });
      r.round = round;
      if (r.extra) lines.push(r.extra);
      if (r.pass) {
        const crit = r.nat === 20;
        let dmg = rollDice(ctx.rng, cls.damage, crit) + A.mod(m.a.abilities[cls.attack]);
        if (cls.perk === 'rage') dmg += 2;
        if (!firstHit[m.id]) {
          firstHit[m.id] = true;
          if (cls.perk === 'sneak') { dmg += rollDice(ctx.rng, '1d6', crit); r.notes.push('sneak attack'); }
          if (cls.perk === 'smite') {
            dmg += rollDice(ctx.rng, mon.tags.includes('undead') ? '3d8' : '2d8', crit);
            r.notes.push('smite');
          }
        }
        dmg = Math.max(1, dmg);
        r.dmg = dmg;
        mhp -= dmg;
        dealt[m.id] = (dealt[m.id] || 0) + dmg;
        if (crit && !critNoted) { critNoted = true; lines.push(line(ctx.rng, T.CRIT_LINES, actorVars(m.a))); }
      } else if (r.nat === 1) {
        lines.push(natLine(ctx, m, r));
      }
      if (r.nat === 20) natLine(ctx, m, r); // records history; crit line already told the story
      rolls.push(r);
    }
    if (mhp <= 0) break;
    for (let k = 0; k < mon.attacks; k++) {
      const targets = ctx.sim.filter((s) => s.hp > 0);
      if (!targets.length) break;
      const t = ctx.rng.pick(targets);
      const ac = A.armorClass(t.a);
      const d = ctx.rng.d(20);
      const pass = d === 20 || (d !== 1 && d + mon.atk >= ac);
      const er = {
        who: 'enemy', name: mon.name, label: `Attacks ${t.name}`, rolls: [d], d, bonus: mon.atk,
        total: d + mon.atk, dc: ac, pass, nat: d === 20 ? 20 : d === 1 ? 1 : null, notes: [], enemy: true, round,
      };
      if (pass) {
        er.dmg = rollDice(ctx.rng, mon.dmg, d === 20);
        hurt(ctx, t, er.dmg, lines);
        if (t.hp === 0 && !fallen) fallen = t;
      }
      rolls.push(er);
    }
  }

  const success = mhp <= 0;
  let star;
  if (success) {
    const bestId = Object.entries(dealt).sort((a, b) => b[1] - a[1])[0]?.[0];
    star = ctx.sim.find((s) => s.id === bestId) || alive[0];
  } else {
    star = fallen || alive[0];
  }
  const roundsText = `${round} round${round === 1 ? '' : 's'}`;
  lines.unshift(`${line(ctx.rng, success ? def.success : def.fail, { ...actorVars(star.a), monster: mon.name })} (${roundsText})`);
  return { success, lines: lines.filter(Boolean), rolls, monster: mon.name };
}

// Between encounters: fighters catch a second wind, clerics heal the most wounded.
function recover(ctx) {
  const lines = [];
  for (const m of ctx.sim) {
    if (m.hp > 0 && m.hp < m.a.maxHp / 2 && CLASSES[m.a.cls].perk === 'secondWind' && !m.used.secondWind) {
      m.used.secondWind = true;
      const n = Math.min(m.a.maxHp - m.hp, ctx.rng.d(10) + m.a.level);
      m.hp += n;
      lines.push(line(ctx.rng, T.SECOND_WIND_LINES, { ...actorVars(m.a), n }));
    }
  }
  const cleric = ctx.sim.find((s) => s.hp > 0 && CLASSES[s.a.cls].perk === 'heal' && !s.used.heal);
  if (cleric) {
    const hurtMost = ctx.sim
      .filter((s) => s.hp <= s.a.maxHp / 2)
      .sort((a, b) => a.hp / a.a.maxHp - b.hp / b.a.maxHp)[0];
    if (hurtMost) {
      cleric.used.heal = true;
      const n = Math.min(hurtMost.a.maxHp - hurtMost.hp, ctx.rng.d(8) + A.mod(cleric.a.abilities.wis) + cleric.a.level);
      hurtMost.hp += Math.max(1, n);
      lines.push(line(ctx.rng, T.HEAL_LINES, {
        ...actorVars(cleric.a), target: hurtMost.id === cleric.id ? 'their own' : hurtMost.name, n: Math.max(1, n),
      }).replace("their own's", 'their own'));
    }
  }
  return lines;
}
