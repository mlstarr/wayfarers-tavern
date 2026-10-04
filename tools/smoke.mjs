// Smoke test and balance check for the logic layer. Run: node tools/smoke.mjs
import { newGame, importSave, exportSave } from '../js/state.js';
import { Rng } from '../js/rng.js';
import { startingParty, refreshBar, hire, buySupply } from '../js/inn.js';
import { refreshBoard, sendParty, collectQuest, generateQuest, recommendedSupplies } from '../js/quests.js';
import { resolveQuest } from '../js/resolve.js';
import { generateAdventurer, applyRest, isAvailable } from '../js/adventurers.js';
import { openDispatches, answerDispatch, planDispatches } from '../js/dispatch.js';
import { refreshScenes, liveScenes, resolveScene } from '../js/scenes.js';
import { chooseTalent } from '../js/talents.js';
import { assignGoal } from '../js/goals.js';
import { MIN } from '../js/config.js';

let failures = 0;
const check = (cond, msg) => { if (!cond) { failures += 1; console.error('FAIL:', msg); } };

// 1. A full play loop: board, packing, dispatches, scenes, talents, shop
let now = new Date(2026, 9, 4, 9, 0).getTime();
const state = newGame(12345, now);
startingParty(state, now);
check(state.roster.length === 3, 'starting party has 3 adventurers');
check(state.roster.every((a) => a.goal), 'everyone has a personal goal');
refreshBoard(state, now);
refreshBar(state, now);
check(state.board.quests.length === 6, `board has 6 postings (got ${state.board.quests.length})`);
check(state.board.quests.every((q) => q.duration <= 1.25), `first board is all quick jobs (${state.board.quests.map((q) => q.duration).join(', ')})`);
check(state.board.quests.every((q) => !q.conditions.length && !q.expedition), 'first jobs are calm');
const firstLengths = [];

const tally = { dispatches: 0, answered: 0, scenes: 0, talents: 0, expeditions: 0, events: 0 };
for (let loop = 0; loop < 80; loop++) {
  refreshBoard(state, now);
  refreshScenes(state, now);
  for (const a of state.roster) applyRest(a, now);
  for (const s of liveScenes(state)) {
    const res = resolveScene(state, s.id, 0, now);
    if (!res.error) tally.scenes += 1;
  }
  for (const a of state.roster) while (a.pendingTalents.length) { check(chooseTalent(a, loop % 2) || chooseTalent(a, 0), 'talent chosen'); tally.talents += 1; }
  const ready = state.roster.filter(isAvailable);
  const quest = state.board.quests.find((q) => q.party[0] <= ready.length);
  if (quest) {
    if (quest.expedition) tally.expeditions += 1;
    const packed = {};
    for (const k of recommendedSupplies(quest)) if (state.supplies[k]) packed[k] = 1;
    if (state.supplies.potion) packed.potion = 1;
    const res = sendParty(state, quest.id, ready.slice(0, quest.party[1]).map((a) => a.id), packed, now);
    check(res.ok, `send ok: ${res.reason || ''}`);
    const p = res.pending;
    firstLengths.push(quest.duration);
    if (state.stats.questsSent === 1) check(p.dispatches.length === 1, 'the very first job brings a messenger');
    for (const d of p.dispatches) {
      tally.dispatches += 1;
      const open = openDispatches(state, d.at);
      check(open.some((o) => o.dispatch.id === d.id), 'dispatch opens at its time');
      if (loop % 3) { check(answerDispatch(state, p.id, d.id, 0, d.at), 'answer dispatch'); tally.answered += 1; }
    }
    now = p.endAt + 1;
    const rec = collectQuest(state, p.id, now);
    check(rec && rec.result.encounters.filter((e) => !e.dispatch).length >= 1, 'report has encounters');
    check(rec.result.encounters.filter((e) => e.dispatch).length === p.dispatches.length, 'report shows every dispatch');
    tally.events += rec.events.length;
  } else {
    now += 60 * MIN;
  }
  if (state.gold > 120) buySupply(state, 'potion', now);
  if (state.gold >= 60 && state.roster.length < 8) {
    refreshBar(state, now);
    const r = state.bar.recruits.find((x) => x.rarity === 'common' || x.rarity === 'uncommon');
    if (r) hire(state, r.id, now);
  }
  now += 30 * MIN;
}
console.log(`Loop: ${state.stats.questsDone} quests, ${state.gold} gold, ${state.renown} renown, roster ${state.roster.length}, levels ${state.roster.map((a) => a.level).join('/')}`);
console.log(`      ${tally.dispatches} dispatches (${tally.answered} answered), ${tally.scenes} scenes, ${tally.talents} talents, ${tally.expeditions} expeditions, ${tally.events} bond/goal events, ${Object.keys(state.bonds).length} bonds`);
check(tally.dispatches > 0 && tally.scenes > 0 && tally.talents > 0, 'new systems all fired');
console.log(`      quest lengths sent, in minutes: ${firstLengths.slice(0, 24).join(' ')}`);

// 2. Save round trip
const copy = importSave(exportSave(state));
check(copy.roster.length === state.roster.length && copy.version === 2, 'save round-trips');

// 3. Migration from a version 1 save
const v1 = JSON.parse(JSON.stringify(state));
v1.version = 1;
delete v1.supplies; delete v1.bonds; delete v1.scenes;
for (const a of v1.roster) { delete a.talents; delete a.pendingTalents; delete a.loyalty; delete a.buffs; delete a.goal; }
const migrated = importSave(exportSave(v1));
check(migrated.version === 2 && migrated.supplies && migrated.roster.every((a) => Array.isArray(a.talents)), 'v1 save migrates');
for (const a of migrated.roster) if (!a.goal) assignGoal(a);
check(migrated.roster.every((a) => a.goal), 'migrated adventurers get goals');

// 4. Determinism with dispatch choices
const q = generateQuest(new Rng(7), 2, 'qt');
const partyA = [1, 2, 3].map((i) => ({ ...generateAdventurer(new Rng(i)), id: `x${i}` }));
const ds = planDispatches(q, partyA, 99, 0, q.duration * MIN);
ds.forEach((d) => { d.choice = 0; });
const r1 = resolveQuest(q, partyA, 99, { dispatches: ds, packed: { torches: 1 } });
const r2 = resolveQuest(q, partyA, 99, { dispatches: ds, packed: { torches: 1 } });
check(JSON.stringify(r1) === JSON.stringify(r2), 'same seed and choices give the same result');

// 5. Balance: outcome spread by tier and party level (no supplies, default dispatches)
for (const level of [1, 3, 5]) {
  for (const tier of [1, 2, 3]) {
    const t = { triumph: 0, success: 0, costly: 0, failure: 0, disaster: 0 };
    let downs = 0;
    for (let i = 0; i < 400; i++) {
      const rng = new Rng(1000 + i);
      const quest = generateQuest(rng.fork('q'), tier, `b${i}`);
      const size = Math.max(Math.min(quest.party[1], 3), quest.party[0]);
      const party = Array.from({ length: size }, (_, k) => {
        const a = generateAdventurer(rng.fork(`a${k}`));
        a.id = `b${k}`;
        for (let l = 1; l < level; l++) { a.level += 1; a.maxHp += 6; }
        a.hp = a.maxHp;
        return a;
      });
      const res = resolveQuest(quest, party, i, { dispatches: planDispatches(quest, party, i, 0, 1) });
      t[res.outcome] += 1;
      downs += res.downed.length;
    }
    const pct = (n) => `${Math.round(n / 4)}%`.padStart(4);
    console.log(`L${level} T${tier}: triumph ${pct(t.triumph)} success ${pct(t.success)} costly ${pct(t.costly)} failure ${pct(t.failure)} disaster ${pct(t.disaster)} | falls/quest ${(downs / 400).toFixed(2)}`);
  }
}

console.log(failures ? `${failures} check(s) failed` : 'All checks passed');
process.exit(failures ? 1 : 0);
