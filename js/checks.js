// Single encounters: skill checks, group checks and combat. Called by js/resolve.js.
import { rollDice } from './rng.js';
import { CLASSES } from '../data/classes.js';
import * as T from '../data/report-templates.js';
import * as A from './adventurers.js';
import { line, actorVars, joinNames } from './reports.js';
import { activeAuras, auraSum } from './auras.js';

const MAX_ROUNDS = 5;

// Situational modifiers for one roll: bonds/buffs, conditions, dispatch effects.
function situational(ctx, m, { skill, ability, attack, tags = [] }) {
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
  const tv = ctx.tavern;
  if (attack && tv.attack) add(tv.attack, 'armory');
  if (attack && tv.foes && ctx.currentFoe && tv.foes[ctx.currentFoe]) add(tv.foes[ctx.currentFoe], 'known foe');
  for (const t of tags) {
    if (attack && tv.tagAttack && tv.tagAttack[t]) add(tv.tagAttack[t], 'trophies');
    if (tv.tagRoll && tv.tagRoll[t]) add(tv.tagRoll[t], 'trophies');
    if (!attack && skill && tv.tagSkill && tv.tagSkill[t]) add(tv.tagSkill[t], 'trophies');
  }
  if (!attack && skill && tv.skill) add(tv.skill, 'maps');
  if (ctx.isFinale && tv.finale) add(tv.finale, 'chapel');
  if (ctx.isFinale) add(A.sumTrait(m.a, 'finale'), 'talent');
  for (const a of activeAuras(ctx)) {
    add(a.roll || 0, a.label);
    if (!attack && skill) add(a.skill || 0, a.label);
    if (attack) add(a.attack || 0, a.label);
    if (ctx.isFinale) add(a.finale || 0, a.label);
  }
  if (attack) {
    if (m.hp > 0 && m.hp < m.a.maxHp / 2) add(A.sumVs(m.a, 'bloodied', ['attack']), 'bloodied');
    add(A.sumVs(m.a, 'atkVs', ctx.foeKeys || []), 'foe-hunter');
  }
  for (const pm of ctx.partyMods) {
    const on = pm.finale ? ctx.isFinale : ctx.index >= pm.from && (pm.until == null || ctx.index <= pm.until);
    if (on) add(pm.mod, pm.label);
  }
  return { mod, labels };
}

// One d20 roll by a party member. Handles advantage, luck, nat 20s and 1s.
// Tags plus the pseudo-tags talents can name: the skill, 'attack' and 'finale'.
export function factorTags(ctx, tags, skill, attack) {
  return [...tags, ...(skill ? [skill] : []), ...(attack ? ['attack'] : []), ...(ctx.isFinale ? ['finale'] : [])];
}

export function roll(ctx, m, { label, skill = null, ability = null, base, dc, tags = [], attack = false, extraPlus = [] }) {
  const ft = factorTags(ctx, tags, skill, attack);
  const { plus, minus } = A.rollFactors(m.a, ft, attack);
  plus.push(...extraPlus);
  for (const a of activeAuras(ctx)) if (a.adv && a.adv.some((t) => ft.includes(t))) plus.push(a.label);
  if (ctx.packed.rope && (tags.includes('heights') || tags.includes('water'))) plus.push('rope');
  if (ctx.isFinale) {
    for (const f of ctx.finaleAdv) plus.push(f);
    if (ctx.heroAdv[m.id]) plus.push(ctx.heroAdv[m.id]);
  }
  const { mode, reasons } = A.modeOf(plus, minus);
  const sit = situational(ctx, m, { skill, ability, attack, tags });
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
  let nat = d === 20 ? 20 : d === 1 ? 1 : null;
  if (!attack && skill && d < 10 && A.hasSpecial(m.a, 'reliable') && A.isProficient(m.a, skill)) {
    d = 10;
    nat = null;
    notes.push('reliable');
  }
  const total = d + bonus;
  const pass = d === 20 || (d !== 1 && total >= dc);
  const crit = attack && pass && d >= 20 - Math.min(3, A.sumTrait(m.a, 'crit'));
  if (nat === 20) ctx.nats[m.id].n20 += 1;
  if (nat === 1) ctx.nats[m.id].n1 += 1;
  return { who: m.id, name: m.name, label, rolls, mode, d, bonus, total, dc, pass, nat, crit, notes, extra };
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
  if (wasUp && m.hp === 0 && A.hasSpecial(m.a, 'unbroken') && !m.used.unbroken) {
    m.used.unbroken = true;
    m.hp = 1;
    lines.push(`${m.name} went down, and refused to stay there.`);
    return;
  }
  // Devoted heroes get back up once per quest.
  if (wasUp && m.hp === 0 && A.isDevoted(m.a) && !m.used.rally) {
    m.used.rally = true;
    m.hp = 1;
    lines.push(`${m.name} went down, then got back up. Devotion is stubborn.`);
    return;
  }
  if (wasUp && m.hp === 0) lines.push(line(ctx.rng, T.FALL_LINES, actorVars(m.a)));
}

function hazardDamage(ctx, def, m) {
  let dmg = rollDice(ctx.rng, def.hazard) + (ctx.tier - 1) * 2;
  for (const c of ctx.conds) dmg += c.hazardPlus || 0;
  if (A.hasFlag(m.a, 'evasion')) dmg = Math.floor(dmg / 2);
  dmg -= A.sumTrait(m.a, 'hazardResist') + auraSum(ctx, 'hazard');
  return Math.max(1, dmg);
}

// Bard inspiration rescues a failed roll if the die can cover the gap.
function tryInspire(ctx, r, lines) {
  if (r.pass || r.nat === 1) return;
  const bard = ctx.sim.find((s) => s.hp > 0 && s.id !== r.who && CLASSES[s.a.cls].perk === 'inspire'
    && (s.used.inspire || 0) < (A.hasFlag(s.a, 'inspirePlus') ? 2 : 1) + A.sumTrait(s.a, 'perkUses'));
  if (!bard) return;
  const die = A.hasFlag(bard.a, 'inspirePlus') ? 8 : 6;
  const more = A.sumTrait(bard.a, 'inspireBonus');
  if (r.total + die + more < r.dc) return;
  bard.used.inspire = (bard.used.inspire || 0) + 1;
  const n = ctx.rng.d(die) + more;
  r.total += n;
  r.notes.push(`inspired +${n}`);
  if (r.total >= r.dc) r.pass = true;
  lines.push(line(ctx.rng, T.INSPIRE_LINES, { bard: bard.name, n }));
}

export function bestAt(ctx, members, skill, ability, tags = []) {
  const score = (m) => {
    const { mode } = A.rollMode(m.a, factorTags(ctx, tags, skill, false));
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

