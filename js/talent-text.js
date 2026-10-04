// Plain-language descriptions of talent effects, so data never drifts from its text.
// Effect fields (shared by quirks, talents, legacies, legend signatures and gear):
//   mods {skill|ability: n}, adv/dis [tags], ac, hp, rollMod, attackMod, flag, special
//   dmg, dmgVs {tag|monster: n}, atkVs {tag|monster: n}, crit, resist, hazardResist,
//   lifesteal, bloodied {attack, dmg}, finale, firstStrike, perkUses, healBonus,
//   inspireBonus, sneak, companion, taunt, retaliate, fearless, exposed,
//   fatigue, fatigueResist, rest, wage, xpSelf
//   aura {roll, skill, attack, finale, ac, resist, hazard, heal, foeAtk, foeAc, gold, xp, ambush, adv}
import { ABILITY_SHORT } from '../data/skills.js';
import { MONSTERS } from '../data/monsters.js';

const TAG = {
  undead: 'the dead', beast: 'beasts', dark: 'dark places', water: 'water', magic: 'magic',
  heights: 'heights', spider: 'spiders', social: 'social scenes', finale: 'the final encounter', attack: 'every attack',
};
const tagName = (t) => TAG[t] || (MONSTERS[t] ? MONSTERS[t].plural : t);
const plus = (n) => (n > 0 ? `+${n}` : `${n}`);
const list = (arr) => (arr.length < 2 ? arr.join('') : `${arr.slice(0, -1).join(', ')} and ${arr[arr.length - 1]}`);
const pct = (x) => `${Math.round(x * 100)}%`;

const SPECIAL = {
  lucky: 'rerolls one natural 1 per quest',
  greedy: 'party earns 10% more gold',
  unbroken: 'once per quest, gets back up at 1 HP after falling',
  reliable: 'never rolls below 10 on a skill they are trained in',
  jack: '+2 to skill checks they are not trained in',
  layOnHands: 'once per quest, heals the most wounded ally (2 HP per level)',
};
const FLAG = {
  extraAttack: 'attacks twice each round',
  evasion: 'takes half damage from traps and hazards',
  bigSpell: 'spells deal 2d10',
  favoredFoe: '+1d6 damage against beasts',
  damageResist: 'takes 2 less damage from every hit',
};

function modsText(mods) {
  const groups = {};
  for (const [k, v] of Object.entries(mods)) {
    const name = ABILITY_SHORT[k] ? `${ABILITY_SHORT[k]} checks` : k;
    (groups[v] = groups[v] || []).push(name);
  }
  return Object.entries(groups).map(([v, names]) => `${plus(Number(v))} ${list(names)}`);
}

function auraText(a) {
  const p = [];
  if (a.roll) p.push(`${plus(a.roll)} to every roll`);
  if (a.skill) p.push(`${plus(a.skill)} to skill checks`);
  if (a.attack) p.push(`${plus(a.attack)} to attacks`);
  if (a.finale) p.push(`${plus(a.finale)} in the final encounter`);
  if (a.ac) p.push(`${plus(a.ac)} armor class`);
  if (a.resist) p.push(`takes ${a.resist} less damage from hits`);
  if (a.hazard) p.push(`takes ${a.hazard} less damage from hazards`);
  if (a.heal) p.push(`recovers ${a.heal} HP after each encounter`);
  if (a.adv) p.push(`advantage against ${list(a.adv.map(tagName))}`);
  if (a.gold) p.push(`${pct(a.gold)} more gold`);
  if (a.xp) p.push(`${pct(a.xp)} more XP`);
  const foe = [];
  if (a.foeAtk) foe.push(`${plus(a.foeAtk)} to hit`);
  if (a.foeAc) foe.push(`${plus(a.foeAc)} armor class`);
  if (foe.length) p.push(`enemies get ${list(foe)}`);
  if (a.ambush) p.push('enemies lose their first round of attacks');
  return p.length ? `Whole party: ${list(p)}` : '';
}

export function effectText(t) {
  const p = [];
  if (t.mods) p.push(...modsText(t.mods));
  if (t.adv) p.push(`advantage ${t.adv.map((x) => (x === 'attack' ? 'on every attack' : x === 'finale' ? 'in the final encounter' : `against ${tagName(x)}`)).join(' and ')}`);
  if (t.dis) p.push(`disadvantage against ${list(t.dis.map(tagName))}`);
  if (t.ac) p.push(`${plus(t.ac)} armor class`);
  if (t.hp) p.push(`${plus(t.hp)} max HP`);
  if (t.rollMod) p.push(`${plus(t.rollMod)} to every roll`);
  if (t.attackMod) p.push(`${plus(t.attackMod)} to attack rolls`);
  if (t.dmg) p.push(`${plus(t.dmg)} damage on every hit`);
  for (const [k, v] of Object.entries(t.atkVs || {})) p.push(`${plus(v)} to hit ${tagName(k)}`);
  for (const [k, v] of Object.entries(t.dmgVs || {})) p.push(`${plus(v)} damage against ${tagName(k)}`);
  if (t.crit) p.push(t.crit === 1 ? 'critical hits on one more number (stacks)' : `critical hits on ${t.crit} more numbers (stacks)`);
  if (t.resist) p.push(`takes ${t.resist} less damage from every hit`);
  if (t.hazardResist) p.push(`takes ${t.hazardResist} less damage from hazards`);
  if (t.lifesteal) p.push(`heals ${t.lifesteal} HP with every hit`);
  if (t.bloodied) {
    const b = [t.bloodied.attack ? `${plus(t.bloodied.attack)} to hit` : null, t.bloodied.dmg ? `${plus(t.bloodied.dmg)} damage` : null].filter(Boolean);
    p.push(`${list(b)} while below half HP`);
  }
  if (t.finale) p.push(`${plus(t.finale)} to every roll in the final encounter`);
  if (t.firstStrike) p.push('advantage on the first attack of every fight');
  if (t.perkUses) p.push('one more use of their class gift each quest');
  if (t.healBonus) p.push(`heals ${t.healBonus} more`);
  if (t.inspireBonus) p.push(`inspiration adds ${t.inspireBonus} more`);
  if (t.sneak) p.push(`sneak attack deals ${t.sneak}d6 more`);
  if (t.companion) p.push('their animal companion grows stronger');
  if (t.taunt) p.push('enemies attack them more often');
  if (t.retaliate) p.push('strikes back for 1d6 when hit');
  if (t.fearless) p.push('ignores disadvantage');
  if (t.exposed) p.push(`enemies get ${plus(t.exposed)} to hit them`);
  if (t.fatigue) p.push(`gains ${t.fatigue} more fatigue per quest`);
  if (t.fatigueResist) p.push(`gains ${t.fatigueResist} less fatigue per quest`);
  if (t.rest) p.push(`rests ${pct(t.rest)} faster`);
  if (t.wage) p.push(`daily wage ${plus(t.wage)} gold`);
  if (t.xpSelf) p.push(`earns ${pct(t.xpSelf)} more XP`);
  if (t.special && SPECIAL[t.special]) p.push(SPECIAL[t.special]);
  if (t.flag && FLAG[t.flag]) p.push(FLAG[t.flag]);
  let s = p.join(', ');
  s = s ? s[0].toUpperCase() + s.slice(1) : '';
  const aura = t.aura ? auraText(t.aura) : '';
  return [s, aura].filter(Boolean).map((x) => `${x}.`).join(' ');
}

export function talentText(t) {
  return t.desc || effectText(t);
}
