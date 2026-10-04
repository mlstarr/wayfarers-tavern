// Building encounters for a quest: DCs for checks, scaled monsters for fights.
import { ENCOUNTERS } from '../data/encounters.js';
import { MONSTERS } from '../data/monsters.js';

function addFlat(dice, n) {
  if (!n) return dice;
  const m = /^(.*?)([+-]\d+)?$/.exec(dice);
  const flat = Number(m[2] || 0) + n;
  return `${m[1]}${flat >= 0 ? '+' : ''}${flat}`;
}

export function scaleMonster(id, tier, partySize) {
  const base = MONSTERS[id];
  const t = tier - 1;
  return {
    id,
    name: base.name,
    ac: base.ac + Math.floor(t / 2),
    hp: Math.round(base.hp * (1 + 0.45 * t) * (0.5 + 0.25 * partySize)),
    atk: base.atk + t,
    dmg: addFlat(base.dmg, Math.round(1.5 * t)),
    attacks: base.attacks,
    tags: base.tags,
  };
}

// partySize: the party size the fight is balanced for.
export function buildEncounter(defId, tier, partySize, rng) {
  const def = ENCOUNTERS[defId];
  const enc = { def: defId };
  if (def.kind === 'combat') enc.monster = scaleMonster(def.monster, tier, partySize);
  else enc.dc = 9 + tier * 2 + rng.int(-1, 1);
  return enc;
}

export function encounterTags(enc) {
  return enc.monster ? enc.monster.tags : ENCOUNTERS[enc.def].tags;
}
