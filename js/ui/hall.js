// The Hall tab: everything the tavern owner has built and collected.
// Segments: rooms, trophies, legends, armory (gear), bestiary and codex.
import { h, section, openSheet } from './dom.js';
import { icon } from './icons.js';
import { renderRooms } from './rooms.js';
import { renderOverview, trophyArt } from './showcase.js';
import { markHallSeen } from '../showcase.js';
import { TROPHIES, TROPHY_SETS, PRESTIGE } from '../../data/trophies.js';
import { LEGENDS, LEGEND_IDS } from '../../data/legends.js';
import { MONSTERS } from '../../data/monsters.js';
import { SELL_VALUE, STASH_CAP, SLOTS } from '../../data/gear.js';
import { KNOWLEDGE } from '../../data/bestiary.js';
import { CLASSES } from '../../data/classes.js';
import { ANCESTRIES } from '../../data/ancestries.js';
import { prestige, setProgress, recruitBoost, knowledgeOf, codexStats, ensureCollections } from '../collection.js';
import { legendState } from '../legends.js';
import { itemDesc } from '../gear.js';
import { firstName } from '../adventurers.js';

const SEGMENTS = [
  { id: 'overview', label: 'Showcase' },
  { id: 'rooms', label: 'Rooms' },
  { id: 'trophies', label: 'Trophies' },
  { id: 'legends', label: 'Legends' },
  { id: 'armory', label: 'Armory' },
  { id: 'bestiary', label: 'Bestiary' },
];
let segment = 'overview';

export function renderHall(ctx) {
  ensureCollections(ctx.state);
  const nav = h('div', { class: 'segments', role: 'tablist' }, SEGMENTS.map((s) => h('button', {
    class: `segment${s.id === segment ? ' on' : ''}`,
    role: 'tab',
    'aria-selected': s.id === segment ? 'true' : 'false',
    onclick: () => { segment = s.id; ctx.go('rooms'); },
  }, s.label)));
  const body = segment === 'overview' ? renderOverview(ctx)
    : segment === 'rooms' ? renderRooms(ctx)
    : segment === 'trophies' ? renderTrophies(ctx)
      : segment === 'legends' ? renderLegends(ctx)
        : segment === 'armory' ? renderArmory(ctx)
          : renderBestiary(ctx);
  markHallSeen(ctx.state);
  return h('div', { class: 'screen hall' }, nav, body);
}

export function showHallSegment(id) { segment = id; }

// ---- Trophies ----

function renderTrophies(ctx) {
  const { state } = ctx;
  const p = prestige(state);
  const boost = recruitBoost(state);
  const sets = setProgress(state);
  const root = h('div');
  root.append(section('The trophy wall', `${Object.keys(state.trophies).length} of ${Object.keys(TROPHIES).length} mounted`,
    h('div', { class: 'prestige panel' },
      h('div', { class: 'prestige-num' }, h('span', { html: icon('renown') }), h('b', null, String(p)), h('span', { class: 'muted' }, 'prestige')),
      h('p', { class: 'muted small' }, `Every trophy adds prestige, and prestige draws rarer adventurers to the bar. Current pull: ${boost ? `+${boost}` : 'none yet'}. Complete a set for a bonus every party carries.`))));

  for (const s of sets) {
    if (s.id === 'legends') continue;
    root.append(h('section', { class: `trophy-set${s.complete ? ' complete' : ''}` },
      h('div', { class: 'set-head' },
        h('b', null, s.set.name),
        h('span', { class: 'muted small' }, `${s.have} of ${s.need}`)),
      h('p', { class: `set-bonus small${s.complete ? ' on' : ''}` }, s.complete ? `Active: ${s.set.bonus}` : `Complete the set: ${s.set.bonus}`),
      h('div', { class: 'trophy-grid' }, s.members.map((id) => trophyTile(state, id)))));
  }
  const singles = Object.keys(TROPHIES).filter((id) => !TROPHIES[id].set);
  root.append(h('section', { class: 'trophy-set' },
    h('div', { class: 'set-head' }, h('b', null, 'Curiosities')),
    h('div', { class: 'trophy-grid' }, singles.map((id) => trophyTile(state, id)))));
  return root;
}

function trophyTile(state, id) {
  const t = TROPHIES[id];
  const got = state.trophies[id];
  return h('div', { class: `trophy ${got ? `found r-${t.rarity}` : 'missing'}`, title: got ? t.desc : t.hint },
    trophyArt(id, got),
    h('b', null, got ? t.name : '???'),
    h('span', { class: 'small' }, got ? t.desc : `Hint: ${t.hint.toLowerCase()}.`),
    got ? h('span', { class: 'trophy-meta small' }, `${t.rarity} · +${PRESTIGE[t.rarity]} prestige`) : null);
}

// ---- Legends ----

function renderLegends(ctx) {
  const { state } = ctx;
  const recruited = LEGEND_IDS.filter((id) => legendState(state, id).status === 'recruited').length;
  const sets = setProgress(state).find((s) => s.id === 'legends');
  return h('div', null,
    section('Legends of the realm', `${recruited} of ${LEGEND_IDS.length} recruited`,
      h('p', { class: 'muted' }, 'Somewhere out there are heroes whose names are already sung. Rumors of them reach the tavern as your fame grows. Follow the trail, prove your company worthy, and win them over.'),
      h('p', { class: `set-bonus small${sets.complete ? ' on' : ''}` }, `${sets.set.name}: recruit ${sets.need} legends. ${sets.set.bonus}`)),
    h('div', { class: 'legend-grid' }, LEGEND_IDS.map((id) => legendTile(ctx, id))));
}

function legendTile(ctx, id) {
  const L = LEGENDS[id];
  const s = legendState(ctx.state, id);
  if (s.status === 'unknown') {
    return h('article', { class: 'legend unknown' },
      h('div', { class: 'legend-portrait', html: icon('party') }),
      h('b', null, 'A name not yet heard'),
      h('p', { class: 'muted small' }, L.minRank > ctx.state.tavern.rank ? 'Rumors of this legend need a more famous tavern.' : 'Keep taking jobs. Rumors travel.'));
  }
  const cls = CLASSES[L.cls].name.toLowerCase();
  const anc = ANCESTRIES[L.ancestry].name.toLowerCase();
  const head = [
    h('div', { class: 'legend-portrait known', style: `--cc:${CLASSES[L.cls].color}`, html: icon(L.cls) }),
    h('b', { class: 'legend-name' }, L.name),
    h('span', { class: 'legend-epithet' }, L.epithet),
    h('span', { class: 'muted small' }, `${anc} ${cls}`),
  ];
  if (s.status === 'rumored') {
    return h('article', { class: 'legend rumored' }, head,
      h('p', { class: 'legend-rumor' }, L.rumor),
      h('div', { class: 'trail' },
        h('span', { class: 'small' }, `The trail: ${L.trail.text}`),
        h('div', { class: 'goalbar' }, h('i', { style: `width:${Math.round((s.progress / L.trail.n) * 100)}%` })),
        h('span', { class: 'muted small' }, `${s.progress} of ${L.trail.n}`)));
  }
  if (s.status === 'quest') {
    return h('article', { class: 'legend quest' }, head,
      h('p', { class: 'legend-rumor' }, L.bio),
      h('p', { class: 'notice' }, `Recruitment quest on the board: ${L.quest.title}.`),
      h('button', { class: 'btn small primary', onclick: () => ctx.go('board') }, 'Go to the quest board'));
  }
  return h('article', { class: 'legend recruited' }, head,
    h('p', { class: 'legend-rumor' }, L.bio),
    h('p', { class: 'small' }, h('b', null, `${L.signature.name}. `), L.signature.desc));
}

// ---- Armory ----

function renderArmory(ctx) {
  const { state } = ctx;
  const equipped = state.roster.flatMap((a) => Object.values(a.gear || {}).map((g) => ({ g, a })));
  return h('div', null,
    section('The armory', `${state.stash.length} of ${STASH_CAP} racks`,
      h('p', { class: 'muted' }, 'Gear found on the road. Equip it from a hero\'s page in the roster, or sell what you will not use. When the racks are full, new finds are sold to the smith.')),
    state.stash.length ? h('div', { class: 'gear-grid' }, state.stash.map((g) => gearTile(g, {
      actions: [
        h('button', { class: 'btn small', onclick: () => openEquip(ctx, g) }, 'Equip'),
        h('button', { class: 'btn small subtle', onclick: () => ctx.sell(g.uid) }, `Sell ${SELL_VALUE[g.rarity]}`),
      ],
    }))) : h('div', { class: 'empty panel' }, h('p', { class: 'muted' }, 'The racks are empty. Gear turns up on quests, more often on hard ones and expeditions.')),
    equipped.length ? section('Carried by the company', null,
      h('div', { class: 'gear-grid' }, equipped.map(({ g, a }) => gearTile(g, { owner: firstName(a) })))) : null);
}

export function gearTile(g, { actions, owner } = {}) {
  return h('div', { class: `gear r-${g.rarity}` },
    h('div', { class: 'gear-head' },
      h('span', { class: 'gear-slot small' }, SLOTS[g.slot]),
      h('span', { class: 'gear-rarity small' }, g.rarity)),
    h('b', { class: 'gear-name' }, g.name),
    h('span', { class: 'small' }, itemDesc(g)),
    g.story ? h('span', { class: 'gear-story small' }, g.story) : null,
    owner ? h('span', { class: 'muted small' }, `Carried by ${owner}`) : null,
    actions ? h('div', { class: 'gear-actions' }, actions) : null);
}

function openEquip(ctx, g) {
  const heroes = ctx.state.roster.filter((a) => a.status === 'idle');
  let close;
  const body = h('div', { class: 'equip-pick' },
    gearTile(g),
    h('p', { class: 'muted' }, heroes.length ? 'Who should carry it?' : 'Everyone is out on the road. Gear can only change hands at the tavern.'),
    h('div', { class: 'list' }, heroes.map((a) => {
      const cur = (a.gear || {})[g.slot];
      return h('button', { class: 'option', onclick: () => { if (ctx.equip(a.id, g.uid)) close(); } },
        h('b', null, a.name),
        h('span', { class: 'muted' }, cur ? `Swaps out: ${cur.name}` : `No ${SLOTS[g.slot].toLowerCase()} yet`));
    })));
  close = openSheet(body, { title: 'Equip' });
}

// ---- Bestiary and codex ----

function renderBestiary(ctx) {
  const { state } = ctx;
  const stats = codexStats(state);
  return h('div', null,
    section('The codex', `${stats.percent}% complete`,
      h('div', { class: 'codex panel' },
        h('div', { class: 'rankbar' }, h('i', { style: `width:${stats.percent}%` })),
        h('ul', { class: 'codex-list' }, stats.parts.map((p) => h('li', { class: p.have >= p.total ? 'done' : '' },
          h('span', null, p.label), h('b', null, `${p.have} / ${p.total}`)))))),
    section('Bestiary', null,
      h('p', { class: 'muted small' }, 'Defeat a foe 3 times to study it (+1 to attacks), 10 times to master it (+2).'),
      h('div', { class: 'list two' }, Object.keys(MONSTERS).map((id) => {
        const k = knowledgeOf(state, id);
        const m = MONSTERS[id];
        if (!k.seen && !k.defeated) {
          return h('article', { class: 'beast unknown panel' }, h('b', null, '???'), h('span', { class: 'muted small' }, 'Not yet encountered.'));
        }
        const next = KNOWLEDGE.find((x) => k.defeated < x.at);
        return h('article', { class: 'beast panel' },
          h('div', { class: 'beast-head' },
            h('b', null, m.name[0].toUpperCase() + m.name.slice(1)),
            h('span', { class: `beast-level small${k.level && k.level.attack ? ' on' : ''}` }, k.level ? k.level.label : 'Encountered')),
          h('span', { class: 'muted small' }, `Faced ${k.seen} time${k.seen === 1 ? '' : 's'} · defeated ${k.defeated}${k.level && k.level.attack ? ` · +${k.level.attack} to attacks` : ''}`),
          k.lore.length ? h('ul', { class: 'lore' }, k.lore.map((t) => h('li', null, t))) : null,
          next ? h('span', { class: 'muted small' }, `Next: ${next.label} at ${next.at} defeats.`) : null);
      }))));
}
