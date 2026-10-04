// Picking and applying level-up talents. No DOM.
// Each level offers three talents drawn from the hero's own pool, weighted toward what is
// most personal: deeds they earned first, then quirks, background, ancestry and class.
// At level 3 the hero chooses a path instead; its later features arrive at levels 6 and 9.
import { TALENTS, TALENT_IDS } from '../data/talents.js';
import { PATHS, PATH_LEVEL, PATH_RANK_LEVELS } from '../data/paths.js';
import { QUIRKS } from '../data/quirks.js';
import { ANCESTRIES } from '../data/ancestries.js';
import { Rng, seedFrom } from './rng.js';
import { deedMet } from './deeds.js';

// Choices per level-up by rarity: epic and legendary heroes see one more option.
const OFFER_SIZE = { common: 3, uncommon: 3, rare: 3, epic: 4, legendary: 4 };
const HEROIC_RARITY = { common: 0.6, uncommon: 0.8, rare: 1, epic: 1.3, legendary: 1.6 };
const WEIGHT = { heroic: 16, deed: 14, quirk: 9, background: 8, ancestry: 6, class: 3, general: 1, rare: 0.3 };
const PERSONAL = ['heroic', 'deed', 'quirk', 'background', 'ancestry'];
const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

function learned(adv, pred) {
  return (adv.talents || []).some((id) => TALENTS[id] && pred(TALENTS[id]));
}

function alreadyLucky(adv) {
  return adv.quirks.includes('lucky') || ANCESTRIES[adv.ancestry].trait === 'lucky' || learned(adv, (t) => t.special === 'lucky');
}

// extra: { friends, rivals } from bonds, for deed talents.
export function eligible(adv, id, extra) {
  const t = TALENTS[id];
  if ((adv.talents || []).includes(id) || t.src === 'path') return false;
  if (t.classes && !t.classes.includes(adv.cls)) return false;
  if (t.minLevel && adv.level < t.minLevel) return false;
  if (t.requires && !(adv.talents || []).includes(t.requires)) return false;
  if (t.bg && t.bg !== adv.background) return false;
  if (t.ancestry && t.ancestry !== adv.ancestry) return false;
  if (t.quirk && !adv.quirks.includes(t.quirk)) return false;
  if (t.earn && !deedMet(adv, t.earn, extra)) return false;
  // No point learning the same once-per-quest gift twice.
  if (t.special === 'lucky' && alreadyLucky(adv)) return false;
  if (t.special && t.special !== 'lucky' && learned(adv, (x) => x.special === t.special)) return false;
  if (t.flag && learned(adv, (x) => x.flag === t.flag)) return false;
  return true;
}

function weightOf(adv, id) {
  const t = TALENTS[id];
  let w = WEIGHT[t.src] || 1;
  if (t.src === 'rare') w *= 1 + RARITY_ORDER.indexOf(adv.rarity);
  if (t.src === 'heroic') w *= HEROIC_RARITY[adv.rarity] || 1;
  if (t.requires) w = Math.max(w, 4);
  if ((adv.offered || []).includes(id)) w *= 0.3;
  return w;
}

export function pathOffer(adv) {
  return (PATHS[adv.cls] || []).map((p) => `${p.id}1`);
}

const isPathOffer = (offer) => offer.some((id) => TALENTS[id] && TALENTS[id].src === 'path');
export const needsPath = (adv) => adv.level >= PATH_LEVEL && !adv.path && !(adv.pendingTalents || []).some(isPathOffer);

export function offerTalents(adv, extra) {
  if (needsPath(adv)) return pathOffer(adv);
  const rng = new Rng(seedFrom(adv.seed, 'talent', adv.level));
  const pool = TALENT_IDS.filter((id) => eligible(adv, id, extra)).map((id) => [id, weightOf(adv, id)]);
  const offer = [];
  // One slot always goes to something only this hero could have, when there is one.
  const personal = pool.filter(([id]) => PERSONAL.includes(TALENTS[id].src));
  if (personal.length) {
    const id = rng.weighted(personal);
    offer.push(id);
    pool.splice(pool.findIndex((e) => e[0] === id), 1);
  }
  while (offer.length < (OFFER_SIZE[adv.rarity] || 3) && pool.length) {
    const id = rng.weighted(pool);
    offer.push(id);
    pool.splice(pool.findIndex((e) => e[0] === id), 1);
  }
  adv.offered = [...new Set([...(adv.offered || []), ...offer])];
  return offer;
}

function learn(adv, id) {
  adv.talents.push(id);
  const t = TALENTS[id];
  if (t.hp) { adv.maxHp += t.hp; adv.hp += t.hp; }
  if (t.replaces && t.quirk && adv.quirks.includes(t.quirk)) {
    adv.quirks = adv.quirks.filter((q) => q !== t.quirk);
    const lost = QUIRKS[t.quirk].hp || 0;
    adv.maxHp -= lost;
    adv.hp = Math.max(1, Math.min(adv.maxHp, adv.hp - lost));
  }
  return t;
}

// Path features the hero's level has reached but they do not have yet. Returns the new talents.
export function grantPathRanks(adv) {
  const out = [];
  if (!adv.path) return out;
  PATH_RANK_LEVELS.forEach((lvl, i) => {
    const id = `${adv.path}${i + 1}`;
    if (adv.level >= lvl && TALENTS[id] && !adv.talents.includes(id)) out.push(learn(adv, id));
  });
  return out;
}

// Takes the next pending offer and learns the chosen talent. Returns the talent def or null.
export function chooseTalent(adv, index) {
  const offer = (adv.pendingTalents || [])[0];
  if (!offer || !offer[index]) return null;
  adv.pendingTalents.shift();
  const id = offer[index];
  const t = learn(adv, id);
  if (t.path) {
    adv.path = t.path;
    grantPathRanks(adv);
  }
  return t;
}
