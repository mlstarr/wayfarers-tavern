// Turns roll results into story text, and formats rolls for display. No DOM.
import { ABILITY_SHORT } from '../data/skills.js';

export function checkLabel(def) {
  if (def.kind === 'combat') return 'Combat';
  if (def.skill) return def.skill;
  return `${ABILITY_SHORT[def.ability]} save`;
}

export function fill(template, vars) {
  return template.replace(/\{(\w+)\}/g, (m, key) => (vars[key] != null ? vars[key] : m));
}

export function line(rng, templates, vars) {
  return fill(rng.pick(templates), vars);
}

// Pronoun tokens for an adventurer.
export function actorVars(adv) {
  const their = adv.pronoun === 'she' ? 'her' : adv.pronoun === 'he' ? 'his' : 'their';
  return { name: adv.name.split(' ')[0], their, Their: their[0].toUpperCase() + their.slice(1) };
}

export function joinNames(names) {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

// "d20 14 +3 = 17 vs 12"
export function formatRoll(r) {
  const dice = r.rolls.length > 1 ? `${r.rolls.join('/')}` : `${r.rolls[0]}`;
  const sign = r.bonus >= 0 ? '+' : '−';
  return `${dice} ${sign}${Math.abs(r.bonus)} = ${r.total} vs ${r.dc}`;
}
