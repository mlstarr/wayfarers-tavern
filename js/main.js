// Boot, tick loop, player actions and tab routing.
import { newGame, load, save, importSave, addLog } from './state.js';
import { newSeed } from './rng.js';
import { refreshBoard, sendParty, collectQuest, isReturned } from './quests.js';
import { refreshBar, hire, dismiss, startingParty } from './inn.js';
import { applyRest, fullName } from './adventurers.js';
import { fmtSpan, fmtCountdown, openSheet, toast } from './ui/dom.js';
import { icon } from './ui/icons.js';
import { renderTavern } from './ui/tavern.js';
import { renderBoard } from './ui/board.js';
import { renderRoster } from './ui/roster.js';
import { renderBar } from './ui/bar.js';
import { openReport } from './ui/report.js';
import { openSettings } from './ui/settings.js';
import { adventurerDetail } from './ui/card.js';

const TABS = [
  { id: 'tavern', label: 'Tavern', render: renderTavern },
  { id: 'board', label: 'Quests', render: renderBoard },
  { id: 'roster', label: 'Roster', render: renderRoster },
  { id: 'bar', label: 'Bar', render: renderBar },
];

let state;
let tab = 'tavern';
let lastReady = 0;

function freshGame() {
  const now = Date.now();
  const s = newGame(newSeed(), now);
  startingParty(s, now);
  addLog(s, 'The Wayfarer\'s Tavern opens its doors. Three regulars are already at the bar.', now);
  return s;
}

// Board and bar refreshes, resting, returns. Returns true if anything changed.
function maintenance() {
  const now = Date.now();
  let changed = refreshBoard(state, now);
  changed = refreshBar(state, now) || changed;
  for (const a of state.roster) changed = applyRest(a, now) || changed;
  const ready = state.pending.filter((p) => isReturned(p, now)).length;
  if (ready !== lastReady) { lastReady = ready; changed = true; }
  if (changed) save(state);
  return changed;
}

const ctx = {
  get state() { return state; },
  go(id) { tab = id; render(); window.scrollTo({ top: 0 }); },
  send(questId, advIds) {
    const res = sendParty(state, questId, advIds, Date.now());
    if (res.ok) {
      save(state);
      toast(`The party set out. Back in ${fmtSpan(res.pending.quest.duration)}.`);
      ctx.go('tavern');
    }
    return res;
  },
  openReturn(pendingId) {
    const record = collectQuest(state, pendingId, Date.now());
    if (!record) return;
    save(state);
    lastReady = state.pending.filter((p) => isReturned(p, Date.now())).length;
    render();
    openReport(record);
  },
  openArchived(id) {
    const record = state.reports.find((r) => r.id === id);
    if (record) openReport(record);
  },
  hire(recruitId) {
    const res = hire(state, recruitId, Date.now());
    if (res.ok) { save(state); toast(`${fullName(res.adv)} joined the company.`); render(); } else toast(res.reason);
  },
  dismiss(advId) {
    const ok = dismiss(state, advId, Date.now());
    if (ok) { save(state); render(); }
    return ok;
  },
  inspectRecruit(id) {
    const a = state.bar.recruits.find((r) => r.id === id);
    if (a) openSheet(adventurerDetail(a), { title: fullName(a), wide: true });
  },
  importGame(text) {
    state = importSave(text);
    save(state);
    maintenance();
    render();
  },
  newGame() {
    state = freshGame();
    save(state);
    maintenance();
    tab = 'tavern';
    render();
  },
};

function renderChrome() {
  const ready = state.pending.filter((p) => isReturned(p, Date.now())).length;
  document.getElementById('purse').innerHTML =
    `<span class="gold" title="Gold">${icon('coin')}${state.gold}</span><span class="renown" title="Renown">${icon('renown')}${state.renown}</span>`;
  const nav = document.getElementById('tabs');
  nav.replaceChildren(...TABS.map((t) => {
    const b = document.createElement('button');
    b.className = `tab${t.id === tab ? ' active' : ''}`;
    b.setAttribute('aria-current', t.id === tab ? 'page' : 'false');
    b.innerHTML = `${icon(t.id)}<span>${t.label}</span>${t.id === 'tavern' && ready ? `<i class="dot" aria-label="${ready} reports waiting"></i>` : ''}`;
    b.onclick = () => ctx.go(t.id);
    return b;
  }));
  document.title = ready ? `(${ready}) Wayfarer's Tavern` : 'Wayfarer\'s Tavern';
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
  setInterval(() => { if (maintenance()) render(); }, 5000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) { maintenance(); render(); }
  });
}

boot();
