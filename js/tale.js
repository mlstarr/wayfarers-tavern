// Turns a resolved quest into a tale: departure, travel and banter between encounters,
// scene-setting before each one, and an epilogue. Uses its own seed so it never changes outcomes.
import { Rng, seedFrom } from './rng.js';
import * as N from '../data/narrative.js';
import { SUPPLIES, CONDITIONS } from '../data/supplies.js';
import { MONSTERS } from '../data/monsters.js';
import { fill, joinNames } from './reports.js';
import { encounterTags } from './encounters.js';

// party: [{ id, name, a }] (a = adventurer). pairs: [[idA, idB, 'friends' | 'rivals']].
export function buildTale({ quest, party, blocks, outcome, packed = {}, pairs = [], seed }) {
  const rng = new Rng(seedFrom(seed, 'tale'));
  const names = party.map((m) => m.name);
  const leader = names[0];
  const base = { party: joinNames(names), leader };

  // Opening
  const opening = [fill(rng.pick(names.length > 1 ? N.DEPARTURES : N.SOLO_DEPARTURES), base)];
  const items = Object.entries(packed).filter(([, n]) => n).map(([k, n]) => `${n > 1 ? `${n} ` : ''}${SUPPLIES[k].name.toLowerCase()}`);
  for (const c of quest.conditions || []) {
    const lines = N.CONDITION_LINES[c];
    if (lines) opening.push(lines[packed[CONDITIONS[c].counter] ? 1 : 0]);
  }
  if (items.length) opening.push(fill(rng.pick(N.PACKED), { items: joinNames(items) }));

  // Between encounters
  const used = new Set();
  const banterFor = () => {
    if (names.length === 1) return fill(rng.pick(N.BANTER.solo), { a: leader });
    const quirky = party.filter((m) => m.a.quirks.some((q) => N.QUIRK_BANTER[q] && !used.has(`${m.id}${q}`)));
    if (quirky.length && rng.chance(0.4)) {
      const m = rng.pick(quirky);
      const q = rng.pick(m.a.quirks.filter((x) => N.QUIRK_BANTER[x] && !used.has(`${m.id}${x}`)));
      used.add(`${m.id}${q}`);
      return fill(N.QUIRK_BANTER[q], { a: m.name });
    }
    const pair = pairs.length && rng.chance(0.6) ? rng.pick(pairs) : null;
    if (pair) {
      const [x, y, kind] = pair;
      const a = party.find((m) => m.id === x);
      const b = party.find((m) => m.id === y);
      if (a && b) return fill(rng.pick(N.BANTER[kind]), { a: a.name, b: b.name });
    }
    const [a, b] = rng.shuffle(party);
    return fill(rng.pick(N.BANTER.neutral), { a: a.name, b: b.name });
  };

  let encIndex = 0;
  const total = blocks.filter((b) => b.kind).length;
  for (const block of blocks) {
    if (!block.kind) continue; // dispatch letters tell themselves
    const mon = block.monsterId ? MONSTERS[block.monsterId] : null;
    const intros = N.ENCOUNTER_INTROS[block.def];
    if (intros) block.intro = fill(rng.pick(intros), { monster: block.monster || (mon && mon.name) || 'enemy' });
    if (encIndex > 0) {
      const travel = [];
      const tags = block.tags || [];
      const tagged = tags.filter((t) => N.TRAVEL[t]);
      travel.push(tagged.length && rng.chance(0.7) ? rng.pick(N.TRAVEL[rng.pick(tagged)]) : rng.pick(N.TRAVEL.any));
      if (quest.duration >= 60 && encIndex === Math.floor(total / 2)) {
        const [a, b] = rng.shuffle(party);
        travel.push(fill(rng.pick(N.CAMPS), { a: a.name, b: (b || a).name }));
      }
      if (rng.chance(0.65)) travel.push(banterFor());
      block.travel = travel;
    }
    encIndex += 1;
  }

  const closing = [fill(rng.pick(N.EPILOGUES[outcome]), base)];
  return { opening, closing };
}

// Tags for a block's encounter, so travel can foreshadow it.
export function blockTags(enc) {
  return encounterTags(enc);
}
