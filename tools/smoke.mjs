// Smoke test and balance check for the logic layer. Run: node tools/smoke.mjs
import { newGame } from '../js/state.js';
import { Rng } from '../js/rng.js';
import { startingParty, refreshBar, hire } from '../js/inn.js';
import { refreshBoard, sendParty, collectQuest, generateQuest } from '../js/quests.js';
import { resolveQuest } from '../js/resolve.js';
import { generateAdventurer, applyRest } from '../js/adventurers.js';
import { MIN } from '../js/config.js';

let failures = 0;
const check = (cond, msg) => { if (!cond) { failures += 1; console.error('FAIL:', msg); } };

// 1. A full play loop
let now = new Date(2026, 9, 4, 9, 0).getTime();
const state = newGame(12345, now);
startingParty(state, now);
check(state.roster.length === 3, 'starting party has 3 adventurers');
refreshBoard(state, now);
refreshBar(state, now);
check(state.board.quests.length > 0, 'board has quests');
check(state.bar.recruits.length === 3, 'bar has recruits');

for (let loop = 0; loop < 40; loop++) {
  refreshBoard(state, now);
  for (const a of state.roster) applyRest(a, now);
  const ready = state.roster.filter((a) => a.status === 'idle' && a.hp >= Math.ceil(a.maxHp / 2));
  const quest = state.board.quests.find((q) => q.party[0] <= ready.length);
  if (quest) {
    const ids = ready.slice(0, quest.party[1]).map((a) => a.id);
    const res = sendParty(state, quest.id, ids, now);
    check(res.ok, `send ok: ${res.reason || ''}`);
    now = res.pending.endAt + 1;
    const rec = collectQuest(state, res.pending.id, now);
    check(rec && rec.result.encounters.length === quest.encounters.length, 'report has every encounter');
  } else {
    now += 6 * 60 * MIN;
  }
  if (state.gold >= 45 && state.roster.length < 8) {
    refreshBar(state, now);
    const r = state.bar.recruits.find((x) => x.rarity === 'common' || x.rarity === 'uncommon');
    if (r) hire(state, r.id, now);
  }
}
check(JSON.parse(JSON.stringify(state)).roster.length === state.roster.length, 'state serializes');
console.log(`Loop: ${state.stats.questsDone} quests, ${state.gold} gold, ${state.renown} renown, roster ${state.roster.length}, levels ${state.roster.map((a) => a.level).join('/')}`);

// 2. Determinism
const q = generateQuest(new Rng(7), 2, 'qt');
const partyA = [1, 2, 3].map((i) => ({ ...generateAdventurer(new Rng(i)), id: `x${i}` }));
const r1 = resolveQuest(q, partyA, 99);
const r2 = resolveQuest(q, partyA, 99);
check(JSON.stringify(r1) === JSON.stringify(r2), 'same seed gives same result');

// 3. Balance: outcome spread by tier and party level
for (const level of [1, 3, 5]) {
  for (const tier of [1, 2, 3]) {
    const tally = { triumph: 0, success: 0, costly: 0, failure: 0, disaster: 0 };
    let downs = 0;
    for (let i = 0; i < 400; i++) {
      const rng = new Rng(1000 + i);
      const quest = generateQuest(rng.fork('q'), tier, `b${i}`);
      const size = Math.min(quest.party[1], 3);
      const party = Array.from({ length: Math.max(size, quest.party[0]) }, (_, k) => {
        const a = generateAdventurer(rng.fork(`a${k}`));
        a.id = `b${k}`;
        for (let l = 1; l < level; l++) { a.level += 1; a.maxHp += 6; }
        a.hp = a.maxHp;
        return a;
      });
      const res = resolveQuest(quest, party, i);
      tally[res.outcome] += 1;
      downs += res.downed.length;
    }
    const pct = (n) => `${Math.round(n / 4)}%`.padStart(4);
    console.log(`L${level} T${tier}: triumph ${pct(tally.triumph)} success ${pct(tally.success)} costly ${pct(tally.costly)} failure ${pct(tally.failure)} disaster ${pct(tally.disaster)} | falls/quest ${(downs / 400).toFixed(2)}`);
  }
}

console.log(failures ? `${failures} check(s) failed` : 'All checks passed');
process.exit(failures ? 1 : 0);
