// Adventurer generation, character-sheet math, leveling and rest.
import { CLASSES, CLASS_IDS } from '../data/classes.js';
import { ANCESTRIES, ANCESTRY_IDS } from '../data/ancestries.js';
import { NAMES, EPITHETS } from '../data/names.js';
import { BACKGROUNDS } from '../data/backgrounds.js';
import { QUIRKS, QUIRK_IDS } from '../data/quirks.js';
import { TALENTS } from '../data/talents.js';
import { ABILITIES, SKILLS } from '../data/skills.js';
import { MIN, REST_FRACTION, REST_MIN, START_LOYALTY, MAX_LOYALTY } from './config.js';
import { offerTalents } from './talents.js';
import { assignGoal } from './goals.js';

export const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
const RARITY_WEIGHTS = [60, 25, 10, 4, 1];
const RARITY_POINTS = [0, 2, 4, 6, 9];
const XP_TABLE = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200];
export const MAX_LEVEL = XP_TABLE.length;

export const mod = (score) => Math.floor((score - 10) / 2);
export const profBonus = (level) => 2 + Math.floor((level - 1) / 4);

export function generateAdventurer(rng, opts = {}) {
  const rIdx = opts.rarity
    ? RARITIES.indexOf(opts.rarity)
    : rng.weighted(RARITY_WEIGHTS.map((w, i) => [i, w]));
  const ancestry = opts.ancestry || rng.weighted(ANCESTRY_IDS.map((id) => [id, ANCESTRIES[id].weight]));
  const clsId = opts.cls || rng.pick(CLASS_IDS);
  const cls = CLASSES[clsId];

  // 4d6 drop lowest, best scores to the class's key abilities
  const rolls = ABILITIES.map(() => {
    const d = [rng.d(6), rng.d(6), rng.d(6), rng.d(6)].sort((a, b) => a - b);
    return d[1] + d[2] + d[3];
  }).sort((a, b) => b - a);
  const abilities = {};
  cls.priority.forEach((ab, i) => { abilities[ab] = rolls[i]; });
  for (const [ab, v] of Object.entries(ANCESTRIES[ancestry].bonus)) abilities[ab] += v;
  for (let i = 0; i < RARITY_POINTS[rIdx]; i++) {
    const ab = rng.chance(0.65) ? cls.priority[rng.int(0, 2)] : rng.pick(ABILITIES);
    if (abilities[ab] < 20) abilities[ab] += 1;
  }

  const names = NAMES[ancestry];
  const quirkCount = rIdx === 0 ? 1 : rIdx >= 4 ? 2 : rng.int(1, 2);
  const goodChance = 0.35 + 0.12 * rIdx;
  const quirks = [];
  while (quirks.length < quirkCount) {
    const wantGood = rng.chance(goodChance);
    const pool = QUIRK_IDS.filter((id) => !quirks.includes(id)
      && (wantGood ? QUIRKS[id].tone === 'good' : QUIRKS[id].tone !== 'good'));
    quirks.push(rng.pick(pool));
  }

  const adv = {
    id: null,
    seed: rng.int(0, 2147483647),
    name: `${rng.pick(names.first)} ${rng.pick(names.last)}`,
    epithet: rIdx >= 3 ? rng.pick(EPITHETS) : null,
    pronoun: rng.weighted([['she', 45], ['he', 45], ['they', 10]]),
    ancestry,
    cls: clsId,
    rarity: RARITIES[rIdx],
    level: 1,
    xp: 0,
    abilities,
    quirks,
    talents: [],
    pendingTalents: [],   // [[talentA, talentB], ...] waiting for the player
    background: rng.pick(BACKGROUNDS).id,
    hp: 0,
    maxHp: 0,
    loyalty: START_LOYALTY,
    buffs: [],            // { label, mod, quests }
    goal: null,
    goalsDone: 0,
    status: 'idle',       // idle | questing
    questId: null,
    restAt: null,
    history: [],
    stats: { quests: 0, triumphs: 0, nat20: 0, nat1: 0 },
  };
  adv.maxHp = Math.max(4, cls.hitDie + mod(abilities.con) + traitHp(adv));
  adv.hp = adv.maxHp;
  assignGoal(adv);
  return adv;
}

// Quirks and talents share effect fields: mods, adv, dis, hp, ac, flag, special.
export function traits(adv) {
  return [
    ...adv.quirks.map((q) => QUIRKS[q]),
    ...(adv.talents || []).map((t) => TALENTS[t]),
  ];
}

export function traitHp(adv) {
  return traits(adv).reduce((s, t) => s + (t.hp || 0), 0);
}

export function hasFlag(adv, flag) {
  return traits(adv).some((t) => t.flag === flag);
}

export function hasSpecial(adv, special) {
  if (special === 'lucky' && ANCESTRIES[adv.ancestry].trait === 'lucky') return true;
  return traits(adv).some((t) => t.special === special);
}

export function armorClass(adv) {
  const cls = CLASSES[adv.cls];
  let ac = cls.ac + Math.min(mod(adv.abilities.dex), cls.dexCap);
  if (cls.conAc) ac += mod(adv.abilities.con);
  for (const t of traits(adv)) ac += t.ac || 0;
  return ac;
}

export function isProficient(adv, skill) {
  if (!skill) return false;
  const bg = BACKGROUNDS.find((b) => b.id === adv.background);
  return CLASSES[adv.cls].skills.includes(skill) || (bg && bg.skill === skill);
}

// Bonus for a skill check, or a raw ability check/save when skill is null.
export function checkBonus(adv, skill, ability) {
  const ab = ability || SKILLS[skill];
  let bonus = mod(adv.abilities[ab]);
  if (isProficient(adv, skill)) bonus += profBonus(adv.level);
  for (const t of traits(adv)) {
    if (!t.mods) continue;
    if (skill && t.mods[skill]) bonus += t.mods[skill];
    if (t.mods[ab]) bonus += t.mods[ab];
  }
  return bonus;
}

export function attackBonus(adv) {
  return mod(adv.abilities[CLASSES[adv.cls].attack]) + profBonus(adv.level);
}

export function damageDice(adv) {
  if (adv.cls === 'wizard' && hasFlag(adv, 'bigSpell')) return '2d10';
  return CLASSES[adv.cls].damage;
}

// Sources of advantage and disadvantage from traits and class perks.
export function rollFactors(adv, tags = [], attack = false) {
  const plus = [];
  const minus = [];
  for (const t of traits(adv)) {
    if (t.adv && t.adv.some((x) => tags.includes(x))) plus.push(t.name.toLowerCase());
    if (t.dis && t.dis.some((x) => tags.includes(x))) minus.push(t.name.toLowerCase());
  }
  const perk = CLASSES[adv.cls].perk;
  if (perk === 'arcane' && tags.includes('magic')) plus.push('arcane insight');
  if (perk === 'hunter' && attack && tags.includes('beast')) plus.push('hunter');
  return { plus, minus };
}

export function modeOf(plus, minus) {
  const mode = plus.length && !minus.length ? 'adv' : minus.length && !plus.length ? 'dis' : null;
  return { mode, reasons: mode === 'adv' ? plus : mode === 'dis' ? minus : [] };
}

export function rollMode(adv, tags = [], attack = false) {
  const { plus, minus } = rollFactors(adv, tags, attack);
  return modeOf(plus, minus);
}

export function xpToNext(adv) {
  return adv.level >= MAX_LEVEL ? null : XP_TABLE[adv.level];
}

// Adds XP and applies level-ups, each with a talent choice. Returns [{ level, hpGain }].
export function gainXp(adv, amount) {
  adv.xp += amount;
  const ups = [];
  while (adv.level < MAX_LEVEL && adv.xp >= XP_TABLE[adv.level]) {
    adv.level += 1;
    const hpGain = Math.max(1, Math.floor(CLASSES[adv.cls].hitDie / 2) + 1 + mod(adv.abilities.con));
    adv.maxHp += hpGain;
    adv.hp += hpGain;
    adv.pendingTalents = adv.pendingTalents || [];
    const offer = offerTalents(adv);
    if (offer.length) adv.pendingTalents.push(offer);
    ups.push({ level: adv.level, hpGain });
  }
  return ups;
}

export function changeLoyalty(adv, n) {
  adv.loyalty = Math.max(0, Math.min(MAX_LOYALTY, (adv.loyalty ?? START_LOYALTY) + n));
}

export const isDevoted = (adv) => (adv.loyalty || 0) >= MAX_LOYALTY;
export const isRested = (adv) => adv.hp >= Math.ceil(adv.maxHp / 2);
export const isAvailable = (adv) => adv.status === 'idle' && isRested(adv);

// Early-game pacing speeds up resting too. Set by main.js from js/pace.js.
let restPace = 1;
export function setRestPace(scale) { restPace = scale; }

function msPerHp(adv) {
  return (REST_MIN * MIN * restPace) / Math.max(1, adv.maxHp * REST_FRACTION);
}

// Idle adventurers recover HP over real time. Returns true if HP changed.
export function applyRest(adv, now) {
  if (adv.status !== 'idle' || adv.hp >= adv.maxHp) { adv.restAt = null; return false; }
  if (!adv.restAt) { adv.restAt = now; return false; }
  const per = msPerHp(adv);
  const gained = Math.floor((now - adv.restAt) / per);
  if (gained <= 0) return false;
  adv.hp = Math.min(adv.maxHp, adv.hp + gained);
  adv.restAt = adv.hp >= adv.maxHp ? null : adv.restAt + gained * per;
  return true;
}

// Timestamp when the adventurer is rested enough to quest (half HP).
export function restedAt(adv, now) {
  if (isRested(adv)) return now;
  const need = Math.ceil(adv.maxHp / 2) - adv.hp;
  return (adv.restAt || now) + need * msPerHp(adv);
}

export function addHistory(adv, text, at) {
  adv.history.unshift({ at, text });
  if (adv.history.length > 14) adv.history.length = 14;
}

export function fullName(adv) {
  return adv.epithet ? `${adv.name} ${adv.epithet}` : adv.name;
}

export function firstName(adv) {
  return adv.name.split(' ')[0];
}

export function describe(adv) {
  return `Lv ${adv.level} ${ANCESTRIES[adv.ancestry].name.toLowerCase()} ${CLASSES[adv.cls].name.toLowerCase()}`;
}
