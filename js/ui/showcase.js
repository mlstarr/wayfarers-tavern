// The Hall's showcase: the trophy wall, legends, armory and bestiary at a glance, every
// bonus the tavern has earned, and what is closest. Plus the collection card on the home screen.
import { h } from './dom.js';
import { icon } from './icons.js';
import { TROPHIES } from '../../data/trophies.js';
import { LEGENDS, LEGEND_IDS } from '../../data/legends.js';
import { MONSTERS } from '../../data/monsters.js';
import { CLASSES } from '../../data/classes.js';
import { GEAR_RARITIES } from '../../data/gear.js';
import { prestige, codexStats, knowledgeOf } from '../collection.js';
import { legendState } from '../legends.js';
import { activeBonuses, nearBonuses, newFinds } from '../showcase.js';
import { showHallSegment } from './hall.js';

const SOURCE_ICON = { room: 'tavern', set: 'rooms', bestiary: 'skull', prestige: 'renown' };
const SOURCE_LABEL = { room: 'Room', set: 'Trophy set', bestiary: 'Bestiary', prestige: 'Prestige' };
const NEAR_ICON = { set: 'rooms', bestiary: 'skull', legend: 'party', rank: 'renown' };

export function trophyArt(id, found) {
  return h('span', { class: 'trophy-art', html: icon(found ? (TROPHIES[id].art || 'rooms') : 'rooms') });
}

function ring(percent) {
  return h('div', { class: 'ring', style: `--p:${percent}` }, h('b', null, `${percent}%`));
}

function shelf(ctx, title, aside, seg, ...kids) {
  return h('section', { class: 'shelf' },
    h('button', { class: 'shelf-head', onclick: () => { showHallSegment(seg); ctx.go('rooms'); } },
      h('b', null, title), h('span', { class: 'muted small' }, aside), h('span', { class: 'shelf-open' }, 'Open ›')),
    ...kids);
}

function progressRow(n) {
  const pct = Math.min(100, Math.round((n.have / n.need) * 100));
  return h('li', { class: `near near-${n.kind}` },
    h('span', { class: 'near-icon', html: icon(NEAR_ICON[n.kind]) }),
    h('div', null,
      h('div', { class: 'near-top' }, h('b', null, n.name), h('span', { class: 'small muted' }, `${Math.min(n.have, n.need)} / ${n.need}`)),
      h('div', { class: 'goalbar' }, h('i', { style: `width:${pct}%` })),
      h('span', { class: 'small' }, n.text)));
}

export function renderOverview(ctx) {
  const { state } = ctx;
  const bonuses = activeBonuses(state);
  const near = nearBonuses(state, 5);
  const stats = codexStats(state);
  const mounted = Object.keys(state.trophies).length;
  const recruited = LEGEND_IDS.filter((id) => legendState(state, id).status === 'recruited').length;
  const gear = [...state.stash, ...state.roster.flatMap((a) => Object.values(a.gear || {}))]
    .sort((a, b) => GEAR_RARITIES.indexOf(b.rarity) - GEAR_RARITIES.indexOf(a.rarity));

  return h('div', { class: 'showcase' },
    h('div', { class: 'show-banner' },
      h('div', { class: 'banner-stat' }, h('span', { class: 'banner-icon', html: icon('renown') }), h('b', null, String(prestige(state))), h('span', { class: 'small' }, 'prestige')),
      h('div', { class: 'banner-stat' }, ring(stats.percent), h('span', { class: 'small' }, 'collected')),
      h('div', { class: 'banner-stat' }, h('span', { class: 'banner-icon', html: icon('heart') }), h('b', null, String(bonuses.length)), h('span', { class: 'small' }, `bonus${bonuses.length === 1 ? '' : 'es'} active`))),

    h('section', { class: 'bonus-board' },
      h('h3', null, 'Every party carries'),
      bonuses.length
        ? h('ul', { class: 'bonus-list' }, bonuses.map((b) => h('li', { class: `bonus src-${b.source}` },
          h('span', { class: 'bonus-icon', html: icon(SOURCE_ICON[b.source]) }),
          h('div', null, h('b', null, b.name), h('span', { class: 'small' }, b.text)),
          h('span', { class: 'bonus-src small' }, SOURCE_LABEL[b.source]))))
        : h('p', { class: 'muted small' }, 'Nothing yet. Build rooms, finish trophy sets and study your foes, and every bonus you earn shows up here.')),

    near.length ? h('section', { class: 'bonus-board' },
      h('h3', null, 'Within reach'),
      h('ul', { class: 'near-list' }, near.map(progressRow))) : null,

    shelf(ctx, 'The trophy wall', `${mounted} of ${Object.keys(TROPHIES).length}`, 'trophies',
      h('div', { class: 'wall' }, Object.keys(TROPHIES).map((id) => {
        const got = state.trophies[id];
        return h('div', { class: `plaque ${got ? `found r-${TROPHIES[id].rarity}` : 'missing'}`, title: got ? TROPHIES[id].name : TROPHIES[id].hint }, trophyArt(id, got));
      }))),

    shelf(ctx, 'Legends', `${recruited} of ${LEGEND_IDS.length} recruited`, 'legends',
      h('div', { class: 'legend-row' }, LEGEND_IDS.map((id) => {
        const s = legendState(state, id);
        const L = LEGENDS[id];
        const known = s.status !== 'unknown';
        return h('div', { class: `legend-chip ${s.status}`, title: known ? L.name : 'A name not yet heard' },
          h('span', { class: 'legend-face', style: known ? `--cc:${CLASSES[L.cls].color}` : '', html: icon(known ? L.cls : 'party') }),
          h('span', { class: 'small' }, known ? L.name.split(' ')[0] : '???'));
      }))),

    shelf(ctx, 'The armory', `${state.stash.length} on the racks`, 'armory',
      gear.length ? h('ul', { class: 'best-gear' }, gear.slice(0, 3).map((g) => h('li', { class: `r-${g.rarity}` },
        h('b', null, g.name), h('span', { class: 'small muted' }, g.rarity))))
        : h('p', { class: 'muted small' }, 'Nothing found yet. Harder jobs and expeditions turn up more.')),

    shelf(ctx, 'Bestiary', `${stats.parts[0].have} of ${stats.parts[0].total} studied`, 'bestiary',
      h('ul', { class: 'beast-bars' }, Object.keys(MONSTERS).map((id) => {
        const k = knowledgeOf(state, id);
        const name = k.seen || k.defeated ? MONSTERS[id].plural : '???';
        return h('li', null,
          h('span', { class: 'small' }, name),
          h('div', { class: 'goalbar' }, h('i', { style: `width:${Math.min(100, k.defeated * 10)}%` })),
          h('span', { class: 'small muted' }, k.level && k.level.attack ? k.level.label : `${k.defeated}/3`));
      }))));
}

// Home screen: a glance at the collection, with what is new and what is next.
export function collectionCard(ctx) {
  const { state } = ctx;
  const fresh = newFinds(state);
  const near = nearBonuses(state, 1)[0];
  const stats = codexStats(state);
  return h('button', { class: 'collection-card', onclick: () => { showHallSegment('overview'); ctx.go('rooms'); } },
    h('div', { class: 'cc-top' },
      h('span', { class: 'cc-icon', html: icon('rooms') }),
      h('b', null, 'Your collection'),
      fresh ? h('span', { class: 'cc-new' }, `${fresh} new`) : null),
    h('div', { class: 'cc-stats small' },
      h('span', null, `${prestige(state)} prestige`),
      h('span', null, `${Object.keys(state.trophies).length}/${Object.keys(TROPHIES).length} trophies`),
      (() => { const n = activeBonuses(state).length; return h('span', null, `${n} bonus${n === 1 ? '' : 'es'} active`); })(),
      h('span', null, `${stats.percent}% collected`)),
    near ? h('div', { class: 'cc-next small' },
      h('span', { class: 'muted' }, 'Next: '), `${near.name} (${Math.min(near.have, near.need)}/${near.need}). ${near.text}`) : null);
}
