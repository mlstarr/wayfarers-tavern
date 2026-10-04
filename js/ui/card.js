// Adventurer card (the collectible), plus compact and detail views.
import { h, countdown, fmtAgo } from './dom.js';
import { shieldSvg } from './heraldry.js';
import { icon } from './icons.js';
import { CLASSES } from '../../data/classes.js';
import { ANCESTRIES } from '../../data/ancestries.js';
import { QUIRKS } from '../../data/quirks.js';
import { BACKGROUNDS } from '../../data/backgrounds.js';
import { ABILITIES, ABILITY_SHORT, ABILITY_NAMES, SKILLS } from '../../data/skills.js';
import * as A from '../adventurers.js';

export function statusOf(adv, now) {
  if (adv.status === 'questing') return { key: 'questing', text: 'On a quest' };
  if (!A.isRested(adv)) return { key: 'resting', text: 'Resting', until: A.restedAt(adv, now) };
  return { key: 'ready', text: 'Ready' };
}

function hpBar(adv) {
  const pct = Math.round((adv.hp / adv.maxHp) * 100);
  return h('div', { class: 'hp', title: `${adv.hp} of ${adv.maxHp} HP` },
    h('div', { class: 'hpbar' }, h('i', { style: `width:${pct}%` })),
    h('span', null, `${adv.hp}/${adv.maxHp} HP`));
}

function quirkChips(adv) {
  return h('div', { class: 'chips' }, adv.quirks.map((q) =>
    h('span', { class: `chip ${QUIRKS[q].tone}`, title: QUIRKS[q].desc }, QUIRKS[q].name)));
}

function statusBadge(adv, now) {
  const st = statusOf(adv, now);
  if (st.key === 'ready') return null;
  return h('span', { class: `status ${st.key}` },
    st.text, st.until ? [' · ', countdown(st.until, 'ready')] : null);
}

export function adventurerCard(adv, { now = Date.now(), onClick, selected = false, dim = false, footer } = {}) {
  const cls = CLASSES[adv.cls];
  const top3 = cls.priority.slice(0, 3);
  return h('article', {
    class: `card rarity-${adv.rarity}${selected ? ' selected' : ''}${dim ? ' dim' : ''}`,
    style: `--cc:${cls.color}`,
    tabindex: onClick ? '0' : null,
    role: onClick ? 'button' : null,
    'aria-pressed': onClick && selected ? 'true' : null,
    onclick: onClick,
    onkeydown: onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(e); } } : null,
  },
  h('div', { class: 'art', html: shieldSvg(adv.seed, adv.cls) },
  ),
  h('span', { class: 'rarity-tag' }, adv.rarity),
  statusBadge(adv, now),
  h('div', { class: 'body' },
    h('div', { class: 'name' }, A.fullName(adv)),
    h('div', { class: 'sub' }, A.describe(adv)),
    hpBar(adv),
    h('div', { class: 'stats' }, top3.map((ab) =>
      h('span', null, h('b', null, ABILITY_SHORT[ab]), ` ${adv.abilities[ab]}`))),
    quirkChips(adv),
    footer || null));
}

// One-line row for pickers and party lists.
export function miniShield(adv) {
  return h('span', { class: 'mini-shield', title: A.fullName(adv), html: shieldSvg(adv.seed, adv.cls) });
}

export function adventurerDetail(adv, { now = Date.now(), actions } = {}) {
  const cls = CLASSES[adv.cls];
  const anc = ANCESTRIES[adv.ancestry];
  const bg = BACKGROUNDS.find((b) => b.id === adv.background);
  const next = A.xpToNext(adv);
  const profs = Object.keys(SKILLS).filter((s) => A.isProficient(adv, s));
  const sign = (n) => (n >= 0 ? `+${n}` : `${n}`);

  return h('div', { class: 'detail' },
    h('div', { class: 'detail-top' },
      adventurerCard(adv, { now }),
      h('div', { class: 'detail-facts' },
        h('p', { class: 'lead' }, `${bg.name}. ${bg.line}`),
        h('div', { class: 'facts' },
          fact('Armor class', A.armorClass(adv)),
          fact('Attack', `${sign(A.attackBonus(adv))} · ${cls.damage}`),
          fact('Level', next ? `${adv.level} (${adv.xp}/${next} XP)` : `${adv.level} (max)`),
          fact('Quests', `${adv.stats.quests} · ${adv.stats.triumphs} triumphs`),
          fact('Natural 20s', adv.stats.nat20),
          fact('Natural 1s', adv.stats.nat1)),
        next ? h('div', { class: 'xpbar', title: 'Experience' },
          h('i', { style: `width:${Math.min(100, Math.round((adv.xp / next) * 100))}%` })) : null)),
    h('h3', null, 'Ability scores'),
    h('div', { class: 'abilities' }, ABILITIES.map((ab) =>
      h('div', { class: 'ability', title: ABILITY_NAMES[ab] },
        h('span', { class: 'ab-name' }, ABILITY_SHORT[ab]),
        h('span', { class: 'ab-score' }, adv.abilities[ab]),
        h('span', { class: 'ab-mod' }, sign(A.mod(adv.abilities[ab])))))),
    h('h3', null, 'Talents'),
    h('ul', { class: 'traits' },
      h('li', null, h('b', null, `${cls.name}. `), cls.perkText),
      anc.trait ? h('li', null, h('b', null, `${anc.name}. `), anc.traitText) : null,
      adv.quirks.map((q) => h('li', { class: QUIRKS[q].tone }, h('b', null, `${QUIRKS[q].name}. `), QUIRKS[q].desc)),
      h('li', null, h('b', null, 'Trained in: '), profs.join(', '))),
    h('h3', null, 'History'),
    h('ul', { class: 'history' }, adv.history.map((e) =>
      h('li', null, e.text, h('span', { class: 'muted' }, ` · ${fmtAgo(e.at, now)}`)))),
    actions || null);
}

function fact(label, value) {
  return h('div', { class: 'fact' }, h('span', { class: 'muted' }, label), h('b', null, String(value)));
}

export function classIcon(clsId) {
  return h('span', { class: 'cls-icon', html: icon(clsId) });
}
