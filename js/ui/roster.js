// The roster: every adventurer on the books.
import { h, section, openSheet, toast } from './dom.js';
import { adventurerCard, adventurerDetail } from './card.js';
import { ROSTER_CAP } from '../config.js';
import { fullName } from '../adventurers.js';

export function renderRoster(ctx) {
  const { state } = ctx;
  const now = Date.now();
  const order = { questing: 1, idle: 0 };
  const list = [...state.roster].sort((a, b) => order[a.status] - order[b.status] || b.level - a.level);
  return h('div', { class: 'screen roster' },
    section('Roster', `${state.roster.length} of ${ROSTER_CAP} beds`,
      h('div', { class: 'grid' }, list.map((a) => adventurerCard(a, { now, onClick: () => openDetail(ctx, a.id) })))));
}

export function openDetail(ctx, advId) {
  const adv = ctx.state.roster.find((a) => a.id === advId);
  if (!adv) return;
  let close;
  const actions = adv.status === 'idle' ? h('div', { class: 'detail-actions' },
    h('button', {
      class: 'btn subtle',
      onclick: (e) => {
        const btn = e.currentTarget;
        if (btn.dataset.armed !== '1') {
          btn.dataset.armed = '1';
          btn.textContent = `Tap again to let ${adv.name.split(' ')[0]} go`;
          return;
        }
        if (ctx.dismiss(adv.id)) { close(); toast(`${fullName(adv)} has left the company.`); }
      },
    }, 'Dismiss from the company')) : null;
  close = openSheet(adventurerDetail(adv, { actions }), { title: fullName(adv), wide: true });
}
