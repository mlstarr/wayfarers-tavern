// Quest resolution. Runs when the party returns, from the seed fixed at send time,
// applying the dispatch choices made along the way. Same inputs, same story.
import { Rng, rollDice } from './rng.js';
import { ENCOUNTERS } from '../data/encounters.js';
import { CLASSES } from '../data/classes.js';
import { CONDITIONS } from '../data/supplies.js';
import { DISPATCHES } from '../data/dispatches.js';
import * as T from '../data/report-templates.js';
import * as A from './adventurers.js';
import { line, actorVars, checkLabel, fill } from './reports.js';
import { buildEncounter, encounterTags } from './encounters.js';
import { roll, skillCheck, groupCheck, combat, bestAt, hurt } from './checks.js';
import { dispatchVars, defaultOption } from './dispatch.js';
import { buildTale } from './tale.js';

const MULT = {
  triumph: { gold: 1.5, xp: 1.25, renown: 3 },
  success: { gold: 1, xp: 1, renown: 2 },
  costly: { gold: 0.75, xp: 0.9, renown: 1 },
  failure: { gold: 0.25, xp: 0.6, renown: 0 },
  disaster: { gold: 0, xp: 0.4, renown: 0 },
};

// Conditions that still bite (not countered), plus boons the party can exploit.
export function activeConditions(quest, packed = {}) {
  const out = [];
  for (const id of quest.conditions || []) {
    const c = CONDITIONS[id];
    const countered = !!packed[c.counter];
    if (c.boon ? countered : !countered) out.push({ id, ...c });
  }
  return out;
}

// opts: { packed, bonus, bonusNotes, dispatches, tavern, pairs }
export function resolveQuest(quest, party, seed, opts = {}) {
  const rng = new Rng(seed);
  const packed = opts.packed || {};
  const sim = party.map((a) => ({ a, id: a.id, name: A.firstName(a), hp: a.hp, used: {} }));
  const conds = activeConditions(quest, packed);
  const extraTags = conds.flatMap((c) => c.addTags || []);
  const ctx = {
    rng, quest, sim, tier: quest.tier, packed, conds, tavern: opts.tavern || {},
    bonus: opts.bonus || {}, bonusNotes: opts.bonusNotes || {},
    bonusGold: 0, goldLoss: 0, goldMult: 0, goldFlat: 0, xpMult: 0,
    nats: Object.fromEntries(sim.map((m) => [m.id, { n20: 0, n1: 0 }])),
    history: [], noted: new Set(), saves: [], defeated: [], loyalty: {}, goalBoost: {},
    partyMods: [], finaleAdv: [], heroAdv: {}, finaleHarder: 0, bypassFinale: false,
    potions: packed.potion || 0, potionsUsed: 0,
    index: 0, half: 0, isFinale: false,
    tagsOf: (enc) => [...encounterTags(enc), ...extraTags],
  };

  const queue = quest.encounters.map((e) => ({ ...e }));
  const dispatches = [...(opts.dispatches || [])].sort((a, b) => a.after - b.after);
  const blocks = [];
  let successes = 0;
  let played = 0;

  for (let i = 0, done = 0; i < queue.length; i++, done++) {
    for (const d of dispatches.filter((x) => x.after === done)) {
      blocks.push(applyDispatch(ctx, d, queue, i));
    }
    if (i >= queue.length) break;
    const enc = queue[i];
    const def = ENCOUNTERS[enc.def];
    ctx.index = i;
    ctx.half = Math.ceil(queue.length / 2);
    ctx.isFinale = !!enc.finale;
    ctx.currentFoe = enc.monster ? enc.monster.id : null;
    const label = checkLabel(def);
    const alive = sim.filter((m) => m.hp > 0);
    let out;
    if (!alive.length) {
      out = { lines: ['Nobody was left standing to face this.'], rolls: [], success: false, skipped: true };
    } else if (enc.finale && ctx.bypassFinale) {
      out = { lines: ['With the hoard already in hand, the party slipped away before the fight could start.'], rolls: [], success: true };
    } else if (def.kind === 'combat') out = combat(ctx, enc, def, alive);
    else if (def.kind === 'group') out = groupCheck(ctx, enc, def, alive, label);
    else out = skillCheck(ctx, enc, def, alive, label);
    played += 1;
    if (out.success) successes += 1;
    if (!out.skipped) out.lines.push(...recover(ctx));
    blocks.push({
      def: enc.def, title: def.title, kind: def.kind, label, finale: !!enc.finale,
      tags: ctx.tagsOf(enc), monsterId: enc.monster ? enc.monster.id : null, ...out,
    });
  }

  const ratio = played ? successes / played : 0;
  const downed = sim.filter((m) => m.hp <= 0).map((m) => m.id);
  let outcome = ratio === 1 && !downed.length ? 'triumph'
    : ratio >= 0.6 ? 'success' : ratio >= 0.4 ? 'costly' : ratio >= 0.2 ? 'failure' : 'disaster';
  const last = blocks.filter((b) => b.kind)[blocks.filter((b) => b.kind).length - 1];
  const finaleLost = last && last.finale && last.kind === 'combat' && !last.success;
  if (downed.length === sim.length) outcome = ratio >= 0.5 ? 'failure' : 'disaster';
  else if ((outcome === 'success' || outcome === 'triumph') && (downed.length || finaleLost)) outcome = 'costly';

  const m = MULT[outcome];
  const greedy = party.some((a) => A.hasSpecial(a, 'greedy')) ? 1.1 : 1;
  const extra = outcome === 'disaster' ? 0 : ctx.bonusGold + ctx.goldFlat;
  let gold = (quest.gold + extra) * m.gold * greedy * Math.max(0, 1 + ctx.goldMult + (ctx.tavern.gold || 0));
  gold = Math.max(0, Math.round(gold * (1 - Math.min(0.9, ctx.goldLoss))));

  if (outcome === 'triumph') for (const s of sim) ctx.history.push({ id: s.id, text: `Triumphed: ${quest.title}.` });
  for (const id of downed) ctx.history.push({ id, text: `Fell during "${quest.title}" and was carried home.` });

  const tale = buildTale({
    quest, party: sim, blocks, outcome, packed, pairs: opts.pairs || [], seed,
  });

  return {
    seed,
    tale,
    encounters: blocks,
    successes,
    played,
    outcome,
    outcomeLabel: T.OUTCOMES[outcome].label,
    headline: rng.pick(T.OUTCOMES[outcome].lines),
    gold,
    xp: Math.round(quest.xp * m.xp * Math.max(0.2, 1 + ctx.xpMult + (ctx.tavern.xp || 0))),
    renown: quest.tier * m.renown,
    hp: Object.fromEntries(sim.map((s) => [s.id, s.hp])),
    downed,
    nats: ctx.nats,
    history: ctx.history,
    saves: ctx.saves,
    defeated: ctx.defeated,
    loyalty: ctx.loyalty,
    goalBoost: ctx.goalBoost,
    potionsLeft: ctx.potions,
    potionsUsed: ctx.potionsUsed,
    conditions: conds.map((c) => c.id),
  };
}

// ---- Dispatches ----

function applyDispatch(ctx, d, queue, i) {
  const tpl = DISPATCHES[d.tpl];
  const auto = d.choice == null;
  const choice = auto ? defaultOption(d) : d.choice;
  const opt = tpl.options[choice];
  const vars = dispatchVars(d);
  const alive = ctx.sim.filter((s) => s.hp > 0);
  const hero = alive.find((s) => s.id === d.hero) || alive[0] || ctx.sim[0];
  const heroVars = { ...vars, hero: hero.name };
  const lines = [fill(tpl.text, vars)];
  lines.push(auto
    ? `No word came back from the tavern, so the party decided: ${fill(opt.label, heroVars).toLowerCase()}.`
    : `Your answer: ${fill(opt.label, heroVars).toLowerCase()}.`);
  const rolls = [];
  applyEffects(ctx, opt.effects, queue, i, lines, rolls, hero, heroVars);
  return { dispatch: true, title: 'Word from the road', lines, rolls, success: true, auto };
}

function applyEffects(ctx, effects, queue, i, lines, rolls, hero, vars) {
  const alive = () => ctx.sim.filter((s) => s.hp > 0);
  for (const e of effects) {
    if (e.addEncounter) {
      const size = Math.max(2, Math.round((ctx.quest.party[0] + ctx.quest.party[1]) / 2));
      queue.splice(i, 0, buildEncounter(e.addEncounter, ctx.tier, size, ctx.rng));
    }
    if (e.skipNext) {
      const idx = queue.findIndex((q, k) => k >= i && !q.finale);
      if (idx >= 0) { const gone = queue.splice(idx, 1)[0]; lines.push(`They avoided ${ENCOUNTERS[gone.def].title.toLowerCase()} entirely.`); }
    }
    if (e.goldMult) ctx.goldMult += e.goldMult;
    if (e.goldPerTier) ctx.goldFlat += e.goldPerTier * ctx.tier;
    if (e.xpMult) ctx.xpMult += e.xpMult;
    if (e.mod) ctx.partyMods.push({ mod: e.mod, label: e.label, from: i, until: e.scope === 'next' ? i : null, finale: e.scope === 'finale' });
    if (e.finaleAdv) ctx.finaleAdv.push(e.finaleAdv);
    if (e.heroFinaleAdv && hero) ctx.heroAdv[hero.id] = e.heroFinaleAdv;
    if (e.finaleHarder) ctx.finaleHarder += e.finaleHarder;
    if (e.bypassFinale) ctx.bypassFinale = true;
    if (e.heal) {
      for (const s of alive()) s.hp = Math.min(s.a.maxHp, s.hp + e.heal + s.a.level);
      lines.push(`Everyone recovered a little (+${e.heal}+ HP).`);
    }
    if (e.hurt) for (const s of alive()) hurt(ctx, s, rollDice(ctx.rng, e.hurt), lines);
    if (e.loyalty && hero) ctx.loyalty[hero.id] = (ctx.loyalty[hero.id] || 0) + e.loyalty;
    if (e.loyaltyAll) for (const s of ctx.sim) ctx.loyalty[s.id] = (ctx.loyalty[s.id] || 0) + e.loyaltyAll;
    if (e.goalBoost && hero) ctx.goalBoost[hero.id] = (ctx.goalBoost[hero.id] || 0) + e.goalBoost;
    if (e.check) {
      const c = e.check;
      const pool = alive();
      if (!pool.length) continue;
      const who = c.who === 'hero' && pool.includes(hero) ? hero : bestAt(ctx, pool, c.skill || null, c.ability || null);
      const r = roll(ctx, who, {
        label: c.skill || `${(c.ability || '').toUpperCase()} save`, skill: c.skill || null, ability: c.ability || null,
        base: A.checkBonus(who.a, c.skill || null, c.ability || null), dc: 9 + ctx.tier * 2 + (c.dcMod || 0),
      });
      rolls.push(r);
      const v = { ...vars, hero: who.name };
      lines.push(fill(r.pass ? c.passText : c.failText, v));
      applyEffects(ctx, r.pass ? c.pass : c.fail, queue, i, lines, rolls, who, v);
    }
  }
}

// ---- Between encounters ----

// Potions for the badly hurt, fighters' second wind, clerics' healing.
function recover(ctx) {
  const lines = [];
  const low = (s) => s.hp <= s.a.maxHp / 3;
  for (const s of [...ctx.sim].sort((a, b) => a.hp / a.a.maxHp - b.hp / b.a.maxHp)) {
    if (ctx.potions > 0 && low(s)) {
      ctx.potions -= 1;
      ctx.potionsUsed += 1;
      const n = Math.min(s.a.maxHp - s.hp, rollDice(ctx.rng, '2d4+2'));
      s.hp += Math.max(1, n);
      lines.push(`${s.name} drank a healing potion (+${Math.max(1, n)} HP).`);
    }
  }
  if (ctx.tavern.heal && !ctx.chapelUsed) {
    const s = ctx.sim.filter(low).sort((a, b) => a.hp - b.hp)[0];
    if (s) {
      ctx.chapelUsed = true;
      const n = Math.max(1, Math.min(s.a.maxHp - s.hp, rollDice(ctx.rng, '2d6')));
      s.hp += n;
      lines.push(`${s.name} touched the chapel charm and felt the blessing (+${n} HP).`);
    }
  }
  for (const m of ctx.sim) {
    if (m.hp > 0 && m.hp < m.a.maxHp / 2 && CLASSES[m.a.cls].perk === 'secondWind' && !m.used.secondWind) {
      m.used.secondWind = true;
      const n = Math.min(m.a.maxHp - m.hp, ctx.rng.d(10) + m.a.level);
      m.hp += n;
      lines.push(line(ctx.rng, T.SECOND_WIND_LINES, { ...actorVars(m.a), n }));
    }
  }
  const cleric = ctx.sim.find((s) => s.hp > 0 && CLASSES[s.a.cls].perk === 'heal'
    && (s.used.heal || 0) < (A.hasFlag(s.a, 'healPlus') ? 2 : 1));
  if (cleric) {
    const target = ctx.sim
      .filter((s) => s.hp <= s.a.maxHp / 2)
      .sort((a, b) => a.hp / a.a.maxHp - b.hp / b.a.maxHp)[0];
    if (target) {
      cleric.used.heal = (cleric.used.heal || 0) + 1;
      const n = Math.max(1, Math.min(target.a.maxHp - target.hp, ctx.rng.d(8) + A.mod(cleric.a.abilities.wis) + cleric.a.level));
      target.hp += n;
      if (target.id !== cleric.id) ctx.saves.push([cleric.id, target.id]);
      lines.push(line(ctx.rng, T.HEAL_LINES, {
        ...actorVars(cleric.a), target: target.id === cleric.id ? 'their own' : target.name, n,
      }).replace("their own's", 'their own'));
    }
  }
  return lines;
}
