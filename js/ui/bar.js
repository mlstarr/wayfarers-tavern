// The bar: today's recruits and the quartermaster.
import { h, section, countdown } from './dom.js';
import { icon } from './icons.js';
import { adventurerCard } from './card.js';
import { HIRE_COST, hireProblem, nextBarAt } from '../inn.js';
import { SUPPLIES } from '../../data/supplies.js';

export function renderBar(ctx) {
  const { state } = ctx;
  const now = Date.now();
  const root = h('div', { class: 'screen bar' });
  root.append(section('At the bar', null,
    h('p', { class: 'muted' }, 'Wanderers looking for work. New faces in ', countdown(nextBarAt(now), 'a moment'), '.')));

  if (!state.bar.recruits.length) {
    root.append(h('div', { class: 'empty panel' },
      h('h2', null, 'Nobody else is looking for work'),
      h('p', { class: 'muted' }, 'Come back tomorrow. Word travels.')));
  } else {
    root.append(h('div', { class: 'grid' }, state.bar.recruits.map((a) => {
      const problem = hireProblem(state, a);
      return adventurerCard(a, {
        now,
        onClick: () => ctx.inspectRecruit(a.id),
        footer: h('button', {
          class: 'btn primary block hire',
          disabled: problem ? true : null,
          title: problem || null,
          onclick: (e) => { e.stopPropagation(); ctx.hire(a.id); },
        }, h('span', { html: icon('coin') }), problem || `Hire for ${HIRE_COST[a.rarity]}`),
      });
    })));
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
