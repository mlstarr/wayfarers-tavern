// The bar: recruits who come and go, and the quartermaster.
import { h, section, countdown } from './dom.js';
import { icon } from './icons.js';
import { adventurerCard } from './card.js';
import { hireCost, hireProblem, nextArrivalAt, roundCost, recruitOdds } from '../inn.js';
import { RANKS } from '../../data/tavern.js';
import { SUPPLIES } from '../../data/supplies.js';

const RARITY_NAMES = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
const fmtPct = (n) => (n >= 10 ? `${Math.round(n)}%` : n >= 1 ? `${n.toFixed(1).replace(/\.0$/, '')}%` : n > 0 ? `${n.toFixed(1)}%` : 'not yet');

// Who a tavern of this standing attracts. Rank sets the odds; prestige nudges them.
function oddsLine(state) {
  const odds = recruitOdds(state);
  return h('p', { class: 'odds small' },
    h('span', { class: 'muted' }, `A ${RANKS[state.tavern.rank].name.toLowerCase()} draws: `),
    RARITY_NAMES.map((r, i) => h('span', { class: `odd r-${r}` }, `${r} ${fmtPct(odds[i])}`)));
}

export function renderBar(ctx) {
  const { state } = ctx;
  const now = Date.now();
  const root = h('div', { class: 'screen bar' });
  const cost = roundCost(state);
  const next = nextArrivalAt(state);
  root.append(section('At the bar', null,
    h('div', { class: 'bar-head' },
      h('p', { class: 'muted' }, 'Wanderers looking for work. Each waits a few hours before moving on, and someone new takes the stool.'),
      oddsLine(state),
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
          }, h('span', { html: icon('coin') }), problem || (a.legendId ? 'Welcome to the company' : `Hire for ${hireCost(a)}`)),
          a.legendId ? h('div', { class: 'recruit-meta' }, h('span', null, 'A legend, waiting for a free bed'))
            : h('div', { class: 'recruit-meta' },
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

  const targets = (state.settings.restock) || {};
  const autoOn = state.settings.autoRestock !== false;
  root.append(section('The quartermaster', 'Supplies for the road',
    h('p', { class: 'muted small restock-note' }, autoOn
      ? 'Set "keep" to have the quartermaster restock an item after it is used. Restocking never dips into the next payday\'s wages.'
      : 'Auto-restock is off. Turn it on in Settings.'),
    h('div', { class: 'market' }, Object.entries(SUPPLIES).map(([id, s]) => {
      const keep = targets[id] || 0;
      return h('div', { class: 'market-row' },
        h('div', { class: 'market-text' },
          h('b', null, s.name, h('span', { class: 'muted small' }, ` · you have ${state.supplies[id] || 0}`)),
          h('span', { class: 'muted small' }, s.desc),
          h('div', { class: 'keep', role: 'group', 'aria-label': `Keep ${s.name} stocked` },
            h('span', { class: 'muted small' }, 'Keep:'),
            [0, 1, 2, 3].map((n) => h('button', {
              class: `keep-btn${keep === n ? ' on' : ''}`,
              'aria-pressed': keep === n ? 'true' : 'false',
              onclick: () => ctx.setRestock(id, n),
            }, n === 0 ? 'Off' : String(n))))),
        h('button', {
          class: 'btn small',
          disabled: state.gold < s.cost ? true : null,
          onclick: () => ctx.buy(id),
        }, h('span', { html: icon('coin') }), `${s.cost}`));
    }))));
  return root;
}
