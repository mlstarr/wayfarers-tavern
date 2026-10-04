// Smoke test and balance check for the logic layer. Run: node tools/smoke.mjs
import { newGame, importSave, exportSave } from '../js/state.js';
import { Rng } from '../js/rng.js';
import { startingParty, refreshBar, hire, buySupply, buyRound, sendAway } from '../js/inn.js';
import { refreshBoard, sendParty, collectQuest, generateQuest, recommendedSupplies } from '../js/quests.js';
import { resolveQuest } from '../js/resolve.js';
import { generateAdventurer, applyRest, isAvailable } from '../js/adventurers.js';
import { openDispatches, answerDispatch, planDispatches } from '../js/dispatch.js';
import { refreshScenes, liveScenes, resolveScene } from '../js/scenes.js';
import { chooseTalent } from '../js/talents.js';
import { assignGoal } from '../js/goals.js';
import { MIN } from '../js/config.js';
import { readyStories, playStory } from '../js/stories.js';
import { processPaydays, collectAle, buyUpgrade, rosterCap } from '../js/tavern.js';
import { UPGRADE_IDS } from '../data/tavern.js';
import { applyRecovery } from '../js/adventurers.js';

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

const tally = { dispatches: 0, answered: 0, scenes: 0, talents: 0, expeditions: 0, events: 0, stories: 0, personal: 0, legacies: 0, injuries: 0, contracts: 0, renownLost: 0, rankUps: 0, paydays: 0, built: 0 };
check(readyStories(state).length === 3, 'all three starting heroes have an introduction waiting');
for (let loop = 0; loop < 80; loop++) {
  refreshBoard(state, now);
  refreshScenes(state, now);
  for (const a of state.roster) { applyRest(a, now); applyRecovery(a, now); }
  tally.paydays += processPaydays(state, now).length;
  collectAle(state, now);
  for (const a of readyStories(state)) {
    const out = playStory(state, a.id, loop % 2, now);
    if (!out.error) tally.stories += 1; else { const o2 = playStory(state, a.id, 1 - (loop % 2), now); if (!o2.error) tally.stories += 1; }
  }
  for (const id of UPGRADE_IDS) if (state.gold > 300 && buyUpgrade(state, id, now).ok) tally.built += 1;
  for (const s of liveScenes(state)) {
    const res = resolveScene(state, s.id, 0, now);
    if (!res.error) tally.scenes += 1;
  }
  for (const a of state.roster) while (a.pendingTalents.length) { check(chooseTalent(a, loop % 2) || chooseTalent(a, 0), 'talent chosen'); tally.talents += 1; }
  const ready = state.roster.filter(isAvailable);
  const quest = state.board.quests.find((q) => q.party[0] <= ready.length
    && (!q.personal || ready.some((a) => a.id === q.personal))
    && (!q.contract || state.gold >= q.contract.deposit));
  if (quest) {
    if (quest.contract) tally.contracts += 1;
    if (quest.personal) tally.personal += 1;
    const order = quest.personal ? [ready.find((a) => a.id === quest.personal), ...ready.filter((a) => a.id !== quest.personal)] : ready;
    if (quest.expedition) tally.expeditions += 1;
    const packed = {};
    for (const k of recommendedSupplies(quest)) if (state.supplies[k]) packed[k] = 1;
    if (state.supplies.potion) packed.potion = 1;
    const res = sendParty(state, quest.id, order.slice(0, quest.party[1]).map((a) => a.id), packed, now);
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
    tally.injuries += rec.injuries.length;
    tally.renownLost += rec.renownLost;
    tally.rankUps += rec.rankUps.length;
    if (rec.personal && rec.events.some((e) => e.includes('earned a legacy'))) tally.legacies += 1;
  } else {
    now += 60 * MIN;
  }
  if (state.gold > 120) buySupply(state, 'potion', now);
  if (state.gold >= 60 && state.roster.length < rosterCap(state)) {
    refreshBar(state, now);
    const r = state.bar.recruits.find((x) => x.rarity === 'common' || x.rarity === 'uncommon');
    if (r) hire(state, r.id, now);
  }
  now += 30 * MIN;
}
console.log(`Loop: ${state.stats.questsDone} quests, ${state.gold} gold, ${state.renown} renown, roster ${state.roster.length}, levels ${state.roster.map((a) => a.level).join('/')}`);
console.log(`      ${tally.dispatches} dispatches (${tally.answered} answered), ${tally.scenes} scenes, ${tally.talents} talents, ${tally.expeditions} expeditions, ${tally.events} bond/goal events, ${Object.keys(state.bonds).length} bonds`);
check(tally.dispatches > 0 && tally.scenes > 0 && tally.talents > 0, 'new systems all fired');
console.log(`      ${tally.stories} story beats, ${tally.personal} personal quests (${tally.legacies} legacies), ${tally.injuries} injuries, ${tally.contracts} contracts, -${tally.renownLost} renown lost, ${tally.rankUps} rank-ups (rank ${state.tavern.rank + 1}), ${tally.paydays} payday events, ${tally.built} rooms built`);
check(tally.stories > 0 && tally.personal > 0 && tally.rankUps > 0, 'progression fired');

// 1b. Penalties on a hopeless job: injuries, fatigue, renown loss, lost deposit
{
  const t0 = new Date(2026, 9, 5, 9, 0).getTime();
  const s2 = newGame(4242, t0);
  startingParty(s2, t0);
  s2.renown = 30; s2.tavern.rank = 1; s2.gold = 500;
  const hard = generateQuest(new Rng(99), 3, 'hard', { contract: true });
  hard.party = [2, 3];
  s2.board.quests.push(hard);
  const res = sendParty(s2, 'hard', s2.roster.map((a) => a.id), {}, t0);
  check(res.ok && s2.gold === 500 - hard.contract.deposit, 'contract deposit taken at send');
  const rec = collectQuest(s2, res.pending.id, res.pending.endAt + 1);
  const bad = !['triumph', 'success', 'costly'].includes(rec.result.outcome);
  console.log(`      hopeless job: ${rec.result.outcome}, ${rec.injuries.length} injuries, -${rec.renownLost} renown, fatigue ${s2.roster.map((a) => a.fatigue).join('/')}`);
  check(s2.roster.every((a) => a.fatigue === 1), 'quest adds fatigue');
  if (bad) {
    check(rec.renownLost > 0 || s2.renown === 15, 'failure costs renown (never below the rank floor)');
    check(rec.events.some((e) => e.includes('deposit is lost')), 'failed contract loses its deposit');
  }
  if (rec.result.downed.length) check(rec.injuries.length >= rec.result.downed.length, 'everyone who fell is injured');
  const hurt = s2.roster.find((a) => a.injuries.length);
  if (hurt) {
    check(applyRecovery(hurt, hurt.injuries[0].healAt + 1) && !hurt.injuries.some((i) => i.healAt <= hurt.injuries[0]?.healAt - 1), 'injuries heal with time');
  }
  const owed = s2.roster.length;
  processPaydays(s2, t0);
  s2.gold = 0;
  const ev = processPaydays(s2, t0 + 10 * 86400000);
  check(ev.some((e) => e.includes('short')), 'an empty chest misses payday');
  check(ev.filter((e) => e.startsWith('Payday')).length <= 2, 'time away charges at most 2 paydays');
  check(s2.roster.length <= owed, 'unpaid wages handled');
}
console.log(`      quest lengths sent, in minutes: ${firstLengths.slice(0, 24).join(' ')}`);

// 1c. Bar turnover
{
  const t0 = new Date(2026, 9, 6, 9, 0).getTime();
  const s3 = newGame(31337, t0);
  startingParty(s3, t0);
  refreshBar(s3, t0);
  const first = s3.bar.recruits.map((r) => r.id).join();
  refreshBar(s3, Math.max(...s3.bar.recruits.map((r) => r.leavesAt)) + 1);
  check(s3.bar.recruits.length + s3.bar.arrivals.length === 3 && s3.bar.recruits.map((r) => r.id).join() !== first, 'recruits move on and are replaced');
  const gold = s3.gold;
  const res = buyRound(s3, t0);
  check(res.ok && s3.gold === gold - res.cost && s3.bar.recruits.length === 3, 'buying a round brings three new faces');
  check(sendAway(s3, s3.bar.recruits[0].id, t0) && s3.bar.recruits.length === 2 && s3.bar.arrivals.length === 1, 'sending a recruit on frees a stool');
}

// 2. Save round trip
const copy = importSave(exportSave(state));
check(copy.roster.length === state.roster.length && copy.version === 4, 'save round-trips');

// 3. Migration from a version 1 save
const v1 = JSON.parse(JSON.stringify(state));
v1.version = 1;
delete v1.supplies; delete v1.bonds; delete v1.scenes;
for (const a of v1.roster) { delete a.talents; delete a.pendingTalents; delete a.loyalty; delete a.buffs; delete a.goal; }
const migrated = importSave(exportSave(v1));
check(migrated.version === 4 && migrated.tavern && migrated.bar.arrivals && migrated.supplies && migrated.roster.every((a) => Array.isArray(a.talents)), 'v1 save migrates');
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
