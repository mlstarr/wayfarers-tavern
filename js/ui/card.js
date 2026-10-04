// Adventurer card (the collectible), plus compact and detail views.
import { h, countdown, fmtAgo } from './dom.js';
import { shieldSvg } from './heraldry.js';
import { icon } from './icons.js';
import { CLASSES } from '../../data/classes.js';
import { ANCESTRIES } from '../../data/ancestries.js';
import { QUIRKS } from '../../data/quirks.js';
import { TALENTS } from '../../data/talents.js';
import { BACKGROUNDS } from '../../data/backgrounds.js';
import { ABILITIES, ABILITY_SHORT, ABILITY_NAMES, SKILLS } from '../../data/skills.js';
import { MAX_LOYALTY } from '../config.js';
import { goalText, goalProgress } from '../goals.js';
import { bondsOf } from '../bonds.js';
import { INJURIES } from '../../data/penalties.js';
import { storyStatus } from '../stories.js';
import { wageOf } from '../tavern.js';
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
  const tired = A.fatigueLevel(adv);
  return h('div', { class: 'chips' },
    (adv.injuries || []).map((i) => h('span', { class: 'chip injury', title: INJURIES[i.id].desc }, INJURIES[i.id].name)),
    tired ? h('span', { class: 'chip tired', title: `${tired.mod} to every roll until rested` }, tired.label) : null,
    adv.quirks.map((q) => h('span', { class: `chip ${QUIRKS[q].tone}`, title: QUIRKS[q].desc }, QUIRKS[q].name)));
}

function statusBadge(adv, now) {
  if ((adv.pendingTalents || []).length && adv.id && !adv.id.startsWith('r-')) {
    return h('span', { class: 'status levelup' }, 'Level up!');
  }
  const st = statusOf(adv, now);
  if (st.key === 'ready') return null;
  return h('span', { class: `status ${st.key}` },
    st.text, st.until ? [' · ', countdown(st.until, 'ready')] : null);
}

export function hearts(adv) {
  const n = adv.loyalty ?? 0;
  return h('span', { class: `hearts${n >= MAX_LOYALTY ? ' devoted' : ''}`, title: `Loyalty ${n} of ${MAX_LOYALTY}${n >= MAX_LOYALTY ? ': devoted, +1 to every roll' : ''}` },
    Array.from({ length: MAX_LOYALTY }, (_, i) => h('i', { class: i < n ? 'on' : '' })));
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
  h('div', { class: 'art', html: shieldSvg(adv.seed, adv.cls) }),
  h('span', { class: 'rarity-tag' }, adv.rarity),
  statusBadge(adv, now),
  h('div', { class: 'body' },
    h('div', { class: 'name' }, A.fullName(adv)),
    h('div', { class: 'sub' }, A.describe(adv), ' ', hearts(adv)),
    hpBar(adv),
    h('div', { class: 'stats' }, top3.map((ab) =>
      h('span', null, h('b', null, ABILITY_SHORT[ab]), ` ${adv.abilities[ab]}`))),
    quirkChips(adv),
    footer || null));
}

export function miniShield(adv) {
  return h('span', { class: 'mini-shield', title: A.fullName(adv), html: shieldSvg(adv.seed, adv.cls) });
}

function talentChoice(adv, onChoose) {
  const offer = (adv.pendingTalents || [])[0];
  if (!offer || !onChoose) return null;
  return h('div', { class: 'talent-choice' },
    h('h3', null, `Level ${adv.level - adv.pendingTalents.length + 1}: choose a talent`),
    h('div', { class: 'talent-options' }, offer.map((id, i) => h('button', {
      class: 'talent-option', onclick: () => onChoose(i),
    }, h('b', null, TALENTS[id].name), h('span', null, TALENTS[id].desc)))));
}

// state: needed for bonds. onChooseTalent(index): level-up choice handler.
// onHeal(injuryId) and herbCost: the herbalist button for injuries.
export function adventurerDetail(adv, { now = Date.now(), actions, state, onChooseTalent, onHeal, herbCost } = {}) {
  const cls = CLASSES[adv.cls];
  const anc = ANCESTRIES[adv.ancestry];
  const bg = BACKGROUNDS.find((b) => b.id === adv.background);
  const next = A.xpToNext(adv);
  const profs = Object.keys(SKILLS).filter((s) => A.isProficient(adv, s));
  const sign = (n) => (n >= 0 ? `+${n}` : `${n}`);
  const goal = adv.goal;
  const gp = goal ? goalProgress(goal, adv) : null;
  const bonds = state && adv.id ? bondsOf(state, adv.id) : [];
  const nameOf = (id) => { const o = state && state.roster.find((x) => x.id === id); return o ? A.fullName(o) : null; };
  const story = storyStatus(adv);
  const tired = A.fatigueLevel(adv);

  return h('div', { class: 'detail' },
    talentChoice(adv, onChooseTalent),
    h('div', { class: 'detail-top' },
      adventurerCard(adv, { now }),
      h('div', { class: 'detail-facts' },
        h('p', { class: 'lead' }, `${bg.name}. ${bg.line}`),
        story ? h('div', { class: 'goal story' },
          h('span', { class: 'muted small' }, 'Story'),
          h('p', null, h('b', null, `${story.title}. `), story.text)) : null,
        goal ? h('div', { class: 'goal' },
          h('span', { class: 'muted small' }, 'Personal goal'),
          h('p', null, goalText(goal)),
          gp.need > 1 ? h('div', { class: 'goalbar' }, h('i', { style: `width:${Math.round((gp.have / gp.need) * 100)}%` })) : null,
          h('span', { class: 'muted small' }, gp.need > 1 ? `${gp.have} of ${gp.need}` : gp.have ? 'Done' : 'Not yet')) : null,
        h('div', { class: 'facts' },
          fact('Loyalty', hearts(adv)),
          fact('Armor class', A.armorClass(adv)),
          fact('Attack', `${sign(A.attackBonus(adv))} · ${A.damageDice(adv)}`),
          fact('Level', next ? `${adv.level} (${adv.xp}/${next} XP)` : `${adv.level} (max)`),
          fact('Quests', `${adv.stats.quests} · ${adv.stats.triumphs} triumphs`),
          fact('Natural 20s / 1s', `${adv.stats.nat20} / ${adv.stats.nat1}`),
          fact('Daily wage', `${wageOf(adv)} gold`),
          fact('Fatigue', tired ? `${tired.label} (${tired.mod})` : 'Fresh')),
        next ? h('div', { class: 'xpbar', title: 'Experience' },
          h('i', { style: `width:${Math.min(100, Math.round((adv.xp / next) * 100))}%` })) : null)),
    (adv.injuries || []).length ? [h('h3', null, 'Injuries'),
      h('ul', { class: 'traits' }, adv.injuries.map((i) => h('li', { class: 'bad' },
        h('b', null, `${INJURIES[i.id].name}. `), INJURIES[i.id].desc, ' Heals in ', countdown(i.healAt, 'moments'), '. ',
        onHeal ? h('button', { class: 'btn small', onclick: () => onHeal(i.id) }, `Herbalist: ${herbCost} gold`) : null)))] : null,
    h('h3', null, 'Ability scores'),
    h('div', { class: 'abilities' }, ABILITIES.map((ab) =>
      h('div', { class: 'ability', title: ABILITY_NAMES[ab] },
        h('span', { class: 'ab-name' }, ABILITY_SHORT[ab]),
        h('span', { class: 'ab-score' }, adv.abilities[ab]),
        h('span', { class: 'ab-mod' }, sign(A.mod(adv.abilities[ab])))))),
    h('h3', null, 'Talents and traits'),
    h('ul', { class: 'traits' },
      h('li', null, h('b', null, `${cls.name}. `), cls.perkText),
      anc.trait ? h('li', null, h('b', null, `${anc.name}. `), anc.traitText) : null,
      adv.legacy && state ? h('li', { class: 'talent' }, h('b', null, 'Legacy. '), storyStatus(adv).text.replace(/^Complete\. /, '')) : null,
      (adv.talents || []).map((t) => h('li', { class: 'talent' }, h('b', null, `${TALENTS[t].name}. `), TALENTS[t].desc)),
      adv.quirks.map((q) => h('li', { class: QUIRKS[q].tone }, h('b', null, `${QUIRKS[q].name}. `), QUIRKS[q].desc)),
      (adv.buffs || []).map((b) => h('li', { class: 'good' }, h('b', null, `${b.label}. `), `+${b.mod} to rolls on the next quest.`)),
      h('li', null, h('b', null, 'Trained in: '), profs.join(', '))),
    bonds.length ? [h('h3', null, 'Bonds'),
      h('ul', { class: 'traits' }, bonds.filter((b) => nameOf(b.id)).map((b) =>
        h('li', { class: b.level.mod > 0 ? 'good' : 'bad' }, h('b', null, `${nameOf(b.id)}. `),
          `${b.level.label} (${b.level.mod > 0 ? '+' : ''}${b.level.mod} to rolls when questing together).`)))] : null,
    adv.history.length ? [h('h3', null, 'History'),
      h('ul', { class: 'history' }, adv.history.map((e) =>
        h('li', null, e.text, h('span', { class: 'muted' }, ` · ${fmtAgo(e.at, now)}`))))] : null,
    actions || null);
}

function fact(label, value) {
  return h('div', { class: 'fact' }, h('span', { class: 'muted' }, label), h('b', null, value instanceof Node ? value : String(value)));
}

export function classIcon(clsId) {
  return h('span', { class: 'cls-icon', html: icon(clsId) });
}
