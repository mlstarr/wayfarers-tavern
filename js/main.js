// Boot, tick loop, player actions and tab routing.
import { newGame, load, save, importSave, addLog } from './state.js';
import { newSeed } from './rng.js';
import { refreshBoard, sendParty, collectQuest, isReturned } from './quests.js';
import { refreshBar, hire, dismiss, startingParty, buySupply } from './inn.js';
import { applyRest, fullName, setRestPace } from './adventurers.js';
import { paceOf } from './pace.js';
import { openDispatches, answerDispatch } from './dispatch.js';
import { refreshScenes, liveScenes, resolveScene } from './scenes.js';
import { chooseTalent } from './talents.js';
import { assignGoal } from './goals.js';
import { fmtSpan, fmtCountdown, openSheet, toast, h } from './ui/dom.js';
import { icon } from './ui/icons.js';
import { renderTavern } from './ui/tavern.js';
import { renderBoard } from './ui/board.js';
import { renderRoster } from './ui/roster.js';
import { renderBar } from './ui/bar.js';
import { openReport } from './ui/report.js';
import { openSettings } from './ui/settings.js';
import { adventurerDetail } from './ui/card.js';
import { formatRoll } from './reports.js';

const TABS = [
  { id: 'tavern', label: 'Tavern', render: renderTavern },
  { id: 'board', label: 'Quests', render: renderBoard },
  { id: 'roster', label: 'Roster', render: renderRoster },
  { id: 'bar', label: 'Bar', render: renderBar },
];

let state;
let tab = 'tavern';
let lastAlerts = '';

function freshGame() {
  const now = Date.now();
  const s = newGame(newSeed(), now);
  startingParty(s, now);
  addLog(s, 'The Wayfarer\'s Tavern opens its doors. Three regulars are already at the bar.', now);
  return s;
}

function alerts(now = Date.now()) {
  return {
    ready: state.pending.filter((p) => isReturned(p, now)).length,
    messages: openDispatches(state, now).length,
    scenes: liveScenes(state).length,
    talents: state.roster.filter((a) => (a.pendingTalents || []).length).length,
  };
}

// Board, bar, scenes, resting, returns, messengers. Returns true if anything changed.
function maintenance() {
  const now = Date.now();
  const pace = paceOf(state);
  setRestPace(pace.scale);
  let changed = refreshBoard(state, now);
  changed = refreshBar(state, now) || changed;
  changed = refreshScenes(state, now, pace.scale) || changed;
  for (const a of state.roster) {
    changed = applyRest(a, now) || changed;
    if (!a.goal) { assignGoal(a); changed = true; }
  }
  const sig = JSON.stringify(alerts(now));
  if (sig !== lastAlerts) { lastAlerts = sig; changed = true; }
  if (changed) save(state);
  return changed;
}

function commit() { save(state); lastAlerts = JSON.stringify(alerts()); render(); }

const ctx = {
  get state() { return state; },
  go(id) { tab = id; render(); window.scrollTo({ top: 0 }); },
  send(questId, advIds, packed) {
    const res = sendParty(state, questId, advIds, packed, Date.now());
    if (res.ok) {
      const msgs = res.pending.dispatches.length;
      toast(`The party set out. Back in ${fmtSpan(res.pending.quest.duration)}.${msgs ? ' Watch for a messenger.' : ''}`);
      tab = 'tavern';
      commit();
    }
    return res;
  },
  decide(pendingId, dispatchId, index) {
    if (answerDispatch(state, pendingId, dispatchId, index, Date.now())) {
      toast('The messenger rides back with your answer.');
      commit();
    } else toast('Too late: the party has already moved on.');
  },
  playScene(sceneId, index) {
    const out = resolveScene(state, sceneId, index, Date.now());
    if (out.error) { toast(out.error); return; }
    commit();
    if (!out.roll && !out.notes.length) { toast(out.text); return; }
    openSheet(h('div', { class: 'scene-result' },
      out.roll ? h('div', { class: `roll ${out.roll.pass ? 'pass' : 'fail'}${out.roll.d === 20 ? ' n20' : out.roll.d === 1 ? ' n1' : ''}` },
        h('span', { class: 'roll-who' }, `${out.roll.name} · ${out.roll.label}`),
        h('span', { class: 'roll-math' }, formatRoll({ rolls: [out.roll.d], bonus: out.roll.bonus, total: out.roll.total, dc: out.roll.dc }), out.roll.pass ? ' ✓' : ' ✗')) : null,
      h('p', { class: 'enc-line' }, out.text),
      out.gold ? h('p', { class: 'muted' }, `${out.gold > 0 ? '+' : ''}${out.gold} gold`) : null,
      out.notes.map((t) => h('p', { class: 'muted' }, t))), { title: 'In the common room' });
  },
  openReturn(pendingId) {
    const record = collectQuest(state, pendingId, Date.now());
    if (!record) return;
    commit();
    openReport(record);
  },
  openArchived(id) {
    const record = state.reports.find((r) => r.id === id);
    if (record) openReport(record);
  },
  hire(recruitId) {
    const res = hire(state, recruitId, Date.now());
    if (res.ok) { toast(`${fullName(res.adv)} joined the company.`); commit(); } else toast(res.reason);
  },
  buy(id) {
    const res = buySupply(state, id, Date.now());
    if (res.ok) { toast(`Bought ${res.supply.name.toLowerCase()}. You have ${res.count}.`); commit(); } else toast(res.reason);
  },
  dismiss(advId) {
    const ok = dismiss(state, advId, Date.now());
    if (ok) commit();
    return ok;
  },
  chooseTalent(advId, index) {
    const adv = state.roster.find((a) => a.id === advId);
    const t = adv && chooseTalent(adv, index);
    if (t) commit();
    return t;
  },
  inspectRecruit(id) {
    const a = state.bar.recruits.find((r) => r.id === id);
    if (a) openSheet(adventurerDetail(a), { title: fullName(a), wide: true });
  },
  importGame(text) {
    state = importSave(text);
    maintenance();
    commit();
  },
  newGame() {
    state = freshGame();
    tab = 'tavern';
    maintenance();
    commit();
  },
};

function renderChrome() {
  const al = alerts();
  document.getElementById('purse').innerHTML =
    `<span class="gold" title="Gold">${icon('coin')}${state.gold}</span><span class="renown" title="Renown">${icon('renown')}${state.renown}</span>`;
  const dots = { tavern: al.ready + al.messages, roster: al.talents };
  const nav = document.getElementById('tabs');
  nav.replaceChildren(...TABS.map((t) => {
    const b = document.createElement('button');
    b.className = `tab${t.id === tab ? ' active' : ''}`;
    b.setAttribute('aria-current', t.id === tab ? 'page' : 'false');
    const n = dots[t.id] || 0;
    b.innerHTML = `${icon(t.id)}<span>${t.label}</span>${n ? `<i class="dot" aria-label="${n} waiting"></i>` : ''}`;
    b.onclick = () => ctx.go(t.id);
    return b;
  }));
  const waiting = al.ready + al.messages;
  document.title = waiting ? `(${waiting}) Wayfarer's Tavern` : 'Wayfarer\'s Tavern';
}

function render() {
  renderChrome();
  const screen = document.getElementById('screen');
  screen.replaceChildren(TABS.find((t) => t.id === tab).render(ctx));
}

// Every second: update countdowns and progress bars in place.
function tick() {
  const now = Date.now();
  for (const el of document.querySelectorAll('[data-ends]')) {
    const left = Number(el.dataset.ends) - now;
    el.textContent = left > 0 ? fmtCountdown(left) : el.dataset.done;
  }
  for (const el of document.querySelectorAll('.progress[data-end]')) {
    const s = Number(el.dataset.start);
    const e = Number(el.dataset.end);
    el.firstChild.style.width = `${Math.min(100, ((now - s) / (e - s)) * 100)}%`;
  }
}

function boot() {
  state = load();
  if (!state) { state = freshGame(); save(state); }
  maintenance();
  render();
  document.getElementById('settings-btn').onclick = () => openSettings(ctx);
  setInterval(tick, 1000);
  setInterval(() => { if (maintenance()) render(); }, 3000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) { maintenance(); render(); }
  });
}

boot();
