// Level-up choices, path choice and the talent list on a hero's page.
import { h } from './dom.js';
import { TALENTS, TALENT_IDS } from '../../data/talents.js';
import { pathOf, PATH_RANK_LEVELS } from '../../data/paths.js';
import { CLASSES } from '../../data/classes.js';
import { ANCESTRIES } from '../../data/ancestries.js';
import { BACKGROUNDS } from '../../data/backgrounds.js';
import { QUIRKS } from '../../data/quirks.js';
import { talentText } from '../talent-text.js';
import { deedText, deedProgress } from '../deeds.js';

const ROMAN = ['I', 'II', 'III'];
const cap = (t) => t[0].toUpperCase() + t.slice(1);

export function sourceLabel(t) {
  switch (t.src) {
    case 'path': return `${pathOf(t.path).name} ${ROMAN[t.rank - 1]}`;
    case 'class': return t.classes.length === 1 ? CLASSES[t.classes[0]].name : 'Class';
    case 'background': return BACKGROUNDS.find((b) => b.id === t.bg).name;
    case 'ancestry': return ANCESTRIES[t.ancestry].name;
    case 'quirk': return `${t.replaces ? 'Overcomes' : 'Grows from'}: ${QUIRKS[t.quirk].name.toLowerCase()}`;
    case 'deed': return `Earned: ${deedText(t.earn)}`;
    case 'heroic': return `Heroic · ${deedText(t.earn)}`;
    case 'rare': return 'Rare';
    default: return t.requires ? `Builds on ${TALENTS[t.requires].name.toLowerCase()}` : 'Open to anyone';
  }
}

function pathChoice(adv, offer, level, onChoose) {
  return h('div', { class: 'talent-choice path-choice' },
    h('h3', null, `Level ${level}: choose a path`),
    h('p', { class: 'small muted' }, 'This decides who they become. Each path grants a feature now, another at level 6 and a third at level 9.'),
    h('div', { class: 'path-options' }, offer.map((id, i) => {
      const p = pathOf(TALENTS[id].path);
      return h('button', { class: 'talent-option path-option', onclick: () => onChoose(i) },
        h('b', null, p.name),
        h('i', { class: 'small' }, p.line),
        h('ol', { class: 'path-ranks' }, p.ranks.map((r, k) => h('li', null,
          h('span', { class: 'rank-lvl' }, `Lv ${PATH_RANK_LEVELS[k]}`),
          h('span', null, h('b', null, `${r.name}. `), talentText(TALENTS[`${p.id}${k + 1}`]))))));
    })));
}

export function talentChoice(adv, onChoose) {
  const offer = (adv.pendingTalents || [])[0];
  if (!offer || !onChoose) return null;
  const level = adv.level - adv.pendingTalents.length + 1;
  if (TALENTS[offer[0]].src === 'path') return pathChoice(adv, offer, Math.max(3, level), onChoose);
  return h('div', { class: 'talent-choice' },
    h('h3', null, `Level ${level}: choose a talent`),
    h('div', { class: 'talent-options' }, offer.map((id, i) => {
      const t = TALENTS[id];
      return h('button', { class: `talent-option src-${t.src}`, onclick: () => onChoose(i) },
        h('span', { class: 'talent-src' }, sourceLabel(t)),
        h('b', null, t.name),
        h('span', null, talentText(t)),
        t.line ? h('i', { class: 'talent-line' }, t.line) : null);
    })));
}

export function talentItems(adv) {
  const items = [];
  if (adv.path) {
    const p = pathOf(adv.path);
    items.push(h('li', { class: 'talent path' }, h('b', null, `${p.name}. `), p.line));
  }
  for (const id of adv.talents || []) {
    const t = TALENTS[id];
    if (!t) continue;
    items.push(h('li', { class: `talent src-${t.src}` },
      h('b', null, `${t.name}. `), talentText(t),
      h('span', { class: 'talent-src inline' }, sourceLabel(t))));
  }
  return items;
}

// Deed talents this hero is closest to earning (not learned yet). extra: { friends, rivals }.
export function deedsInReach(adv, extra, max = 4) {
  return TALENT_IDS
    .filter((id) => ['deed', 'heroic'].includes(TALENTS[id].src) && !(adv.talents || []).includes(id))
    .map((id) => {
      const prog = deedProgress(adv, TALENTS[id].earn, extra);
      const frac = prog.reduce((s, p) => s + Math.min(1, p.have / p.need), 0) / prog.length;
      return { id, prog, frac };
    })
    .filter((x) => x.frac > 0)
    .sort((a, b) => b.frac - a.frac)
    .slice(0, max)
    .map(({ id, prog, frac }) => {
      const t = TALENTS[id];
      const lvl = t.minLevel && adv.level < t.minLevel ? ` Needs level ${t.minLevel}.` : '';
      return h('li', { class: `deed src-${t.src}` },
        h('b', null, `${t.src === 'heroic' ? 'Heroic: ' : ''}${t.name}. `),
        h('span', { class: 'muted' }, frac >= 1
          ? (lvl ? `Deeds done.${lvl}` : 'Earned, offered at a coming level-up.')
          : `${cap(deedText(t.earn))} (${prog.map((p) => `${Math.min(p.have, p.need)}/${p.need}`).join(', ')}).${lvl}`));
    });
}
