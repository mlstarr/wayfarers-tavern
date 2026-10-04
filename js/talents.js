// Picking and applying level-up talents. No DOM.
import { TALENTS, TALENT_IDS } from '../data/talents.js';
import { Rng, seedFrom } from './rng.js';

function eligible(adv, id) {
  const t = TALENTS[id];
  if ((adv.talents || []).includes(id)) return false;
  if (t.classes && !t.classes.includes(adv.cls)) return false;
  if (t.minLevel && adv.level < t.minLevel) return false;
  return true;
}

// Two talents to choose from: one for the class when possible, one general.
export function offerTalents(adv) {
  const rng = new Rng(seedFrom(adv.seed, 'talent', adv.level));
  const own = rng.shuffle(TALENT_IDS.filter((id) => TALENTS[id].classes && eligible(adv, id)));
  const general = rng.shuffle(TALENT_IDS.filter((id) => !TALENTS[id].classes && eligible(adv, id)));
  const offer = [];
  if (own.length) offer.push(own[0]);
  for (const id of general) if (offer.length < 2) offer.push(id);
  for (const id of own.slice(1)) if (offer.length < 2) offer.push(id);
  return offer;
}

// Takes the next pending offer and learns the chosen talent. Returns the talent def or null.
export function chooseTalent(adv, index) {
  const offer = (adv.pendingTalents || [])[0];
  if (!offer || !offer[index]) return null;
  adv.pendingTalents.shift();
  const id = offer[index];
  adv.talents.push(id);
  const t = TALENTS[id];
  if (t.hp) { adv.maxHp += t.hp; adv.hp += t.hp; }
  return t;
}
