// The bar: recruits who come and go, and the quartermaster.
import { h, section, countdown } from './dom.js';
import { icon } from './icons.js';
import { adventurerCard } from './card.js';
import { HIRE_COST, hireProblem, nextArrivalAt, roundCost } from '../inn.js';
import { SUPPLIES } from '../../data/supplies.js';

export function renderBar(ctx) {
  const { state } = ctx;
  const now = Date.now();
  const root = h('div', { class: 'screen bar' });
  const cost = roundCost(state);
  const next = nextArrivalAt(state);
  root.append(section('At the bar', null,
    h('div', { class: 'bar-head' },
      h('p', { class: 'muted' }, 'Wanderers looking for work. Each waits a few hours before moving on, and someone new takes the stool.'),
      h('button', {
        class: 'btn small',
        disabled: state.gold < cost ? true : null,
        title: 'Everyone at the bar moves on and new faces arrive now',
        onclick: () => ctx.buyRound(),
      }, 'Buy a round for new faces', h('span', { class: 'cost', html: `${icon('coin')}${cost}` })))));

  root.append(h('div', { class: 'grid' },
    state.bar.recruits.map((a) => {
      const problem = hireProblem(state, a);
      return adventurerCard(a, {
        now,
        onClick: () => ctx.inspectRecruit(a.id),
        footer: h('div', { class: 'recruit-foot' },
          h('button', {
            class: 'btn primary block hire',
            disabled: problem ? true : null,
            title: problem || null,
            onclick: (e) => { e.stopPropagation(); ctx.hire(a.id); },
          }, h('span', { html: icon('coin') }), problem || `Hire for ${HIRE_COST[a.rarity]}`),
          h('div', { class: 'recruit-meta' },
            h('span', null, 'Leaves in ', countdown(a.leavesAt, 'moments')),
            h('button', { class: 'link-btn', onclick: (e) => { e.stopPropagation(); ctx.sendAway(a.id); } }, 'Send on')))
      });
    }),
    state.bar.arrivals.map((t) => h('div', { class: 'stool panel' },
      h('span', { class: 'stool-art', html: icon('bar') }),
      h('b', null, 'An empty stool'),
      h('span', { class: 'muted small' }, 'Someone new in ', countdown(t, 'a moment'))))));
  if (!state.bar.recruits.length && next) {
    root.append(h('p', { class: 'muted' }, 'The bar is quiet for now.'));
  }

  root.append(section('The quartermaster', 'Supplies for the road',
    h('div', { class: 'market' }, Object.entries(SUPPLIES).map(([id, s]) => h('div', { class: 'market-row' },
      h('div', { class: 'market-text' },
        h('b', null, s.name, h('span', { class: 'muted small' }, ` · you have ${state.supplies[id] || 0}`)),
        h('span', { class: 'muted small' }, s.desc)),
      h('button', {
        class: 'btn small',
        disabled: state.gold < s.cost ? true : null,
        onclick: () => ctx.buy(id),
      }, h('span', { html: icon('coin') }), `${s.cost}`))))));
  return root;
}
