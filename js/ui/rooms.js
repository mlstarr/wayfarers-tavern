// The Rooms tab: tavern rank and upgrades.
import { h, section, openSheet } from './dom.js';
import { icon } from './icons.js';
import { RANKS, UPGRADES, UPGRADE_IDS } from '../../data/tavern.js';
import { rankOf, upgradeLevel, upgradeProblem, rosterCap } from '../tavern.js';
import { TIER_NAMES } from '../../data/quests.js';

export function rankPanel(state, { compact = false } = {}) {
  const { idx, rank, next } = rankOf(state);
  const pct = next ? Math.min(100, Math.round(((state.renown - rank.renown) / (next.renown - rank.renown)) * 100)) : 100;
  return h('div', { class: `rank-panel${compact ? ' compact' : ''}` },
    h('div', { class: 'rank-top' },
      h('span', { class: 'rank-badge' }, `Rank ${idx + 1}`),
      h('b', { class: 'rank-name' }, rank.name)),
    h('div', { class: 'rankbar' }, h('i', { style: `width:${pct}%` })),
    h('span', { class: 'muted small' }, next
      ? `${state.renown} of ${next.renown} renown to become a ${next.name.toLowerCase()}`
      : `${state.renown} renown. The most famous tavern in the land.`));
}

export function renderRooms(ctx) {
  const { state } = ctx;
  const { idx } = rankOf(state);
  const root = h('div', { class: 'screen rooms' });
  root.append(section('Your tavern', `${state.roster.length} of ${rosterCap(state)} beds used`, rankPanel(state)));

  root.append(section('Rooms', 'Gold well spent makes every party stronger',
    h('div', { class: 'list two' }, UPGRADE_IDS.map((id) => {
      const u = UPGRADES[id];
      const lv = upgradeLevel(state, id);
      const next = u.levels[lv];
      const problem = upgradeProblem(state, id);
      return h('article', { class: `room panel${lv ? ' built' : ''}` },
        h('div', { class: 'room-head' },
          h('b', null, u.name),
          h('span', { class: 'pips' }, u.levels.map((_, i) => h('i', { class: i < lv ? 'on' : '' })))),
        h('p', { class: 'muted small' }, u.desc),
        lv ? h('p', { class: 'room-now' }, `Now: ${u.levels[lv - 1].text}`) : null,
        next ? h('div', { class: 'room-next' },
          h('span', null, lv ? 'Next: ' : '', next.text),
          h('button', {
            class: `btn small${problem ? '' : ' primary'}`,
            disabled: problem ? true : null,
            title: problem || null,
            onclick: () => ctx.build(id),
          }, problem && problem.startsWith('Needs') ? problem : [h('span', { html: icon('coin') }), `${next.cost}`]))
          : h('p', { class: 'muted small' }, 'Fully built.'));
    }))));

  root.append(section('The road to fame', null,
    h('ol', { class: 'ladder' }, RANKS.map((r, i) => h('li', { class: i <= idx ? 'reached' : '' },
      h('b', null, r.name),
      h('span', { class: 'muted small' }, ` · ${r.renown} renown · ${r.beds} beds · ${TIER_NAMES[r.tier].toLowerCase()} jobs${r.reward ? ` · +${r.reward} gold` : ''}`))))));
  return root;
}

export function showRankUp(ranks) {
  const r = ranks[ranks.length - 1];
  openSheet(h('div', { class: 'rankup' },
    h('div', { class: 'rankup-art', html: icon('renown') }),
    h('h2', null, `The tavern is now a ${r.name.toLowerCase()}`),
    h('p', null, `Word has spread. Patrons celebrate with ${r.reward} gold, and the tavern now has ${r.beds} beds.`),
    r.tier > 1 ? h('p', { class: 'muted' }, `${TIER_NAMES[r.tier]} jobs can now appear on the board. New rooms may be ready to build.`) : null),
  { title: 'Rank up' });
}
