// The quest board and the party picker.
import { h, section, countdown, fmtSpan, openSheet, toast } from './dom.js';
import { icon } from './icons.js';
import { adventurerCard, statusOf } from './card.js';
import { questChecks, nextBoardAt, unlockedTiers } from '../quests.js';
import { TIER_NAMES } from '../../data/quests.js';
import { TIER_RENOWN } from '../config.js';
import * as A from '../adventurers.js';

function passChance(bonus, dc, mode) {
  let n = 0;
  for (let d = 1; d <= 20; d++) if (d === 20 || (d !== 1 && d + bonus >= dc)) n++;
  const p = n / 20;
  return mode === 'adv' ? 1 - (1 - p) ** 2 : mode === 'dis' ? p * p : p;
}

const grade = (p) => (p >= 0.7 ? 'good' : p >= 0.45 ? 'fair' : 'poor');

function tierBadge(tier) {
  return h('span', { class: `tier t${tier}`, title: `${TIER_NAMES[tier]} quest` },
    h('span', { html: icon('skull').repeat(tier) }), TIER_NAMES[tier]);
}

export function questCard(quest, { onChoose } = {}) {
  return h('article', { class: 'quest-card' },
    h('div', { class: 'quest-head' }, h('h3', null, quest.title), tierBadge(quest.tier)),
    h('p', { class: 'quest-blurb' }, quest.blurb),
    h('div', { class: 'quest-meta' },
      h('span', { html: icon('clock') }, fmtSpan(quest.duration)),
      h('span', { html: icon('party') }, quest.party[0] === quest.party[1] ? `${quest.party[0]}` : `${quest.party[0]}–${quest.party[1]}`),
      h('span', { class: 'gold', html: icon('coin') }, `${quest.gold}`),
      h('span', null, `${quest.xp} XP each`)),
    h('div', { class: 'chips' }, questChecks(quest).map((c) => h('span', { class: `chip check ${c.kind}` }, c.label))),
    onChoose ? h('button', { class: 'btn primary block', onclick: onChoose }, 'Choose a party') : null);
}

export function renderBoard(ctx) {
  const { state } = ctx;
  const now = Date.now();
  const tiers = unlockedTiers(state);
  const nextTier = tiers.length < 3 ? tiers.length + 1 : null;

  const root = h('div', { class: 'screen board' });
  root.append(section('Quest board', null,
    h('p', { class: 'muted board-note' }, 'New postings in ', countdown(nextBoardAt(now), 'a moment'), '.',
      nextTier ? ` ${TIER_NAMES[nextTier]} jobs unlock at ${TIER_RENOWN[nextTier - 1]} renown.` : '')));

  if (!state.board.quests.length) {
    root.append(h('div', { class: 'empty panel' },
      h('h2', null, 'The board is bare'),
      h('p', { class: 'muted' }, 'Every posting has been taken. Fresh notices go up every few hours.')));
  }
  root.append(h('div', { class: 'list two' }, state.board.quests.map((q) =>
    questCard(q, { onChoose: () => openPartyPicker(ctx, q) }))));
  return root;
}

function openPartyPicker(ctx, quest) {
  const { state } = ctx;
  const chosen = [];
  const body = h('div', { class: 'picker' });
  const close = openSheet(body, { title: quest.title, wide: true });

  const draw = () => {
    const now = Date.now();
    body.replaceChildren();
    const party = chosen.map((id) => state.roster.find((a) => a.id === id));
    const [min, max] = quest.party;

    body.append(h('p', { class: 'muted' },
      `Choose ${min === max ? min : `${min} to ${max}`} adventurers. Tap a card to add or remove.`));

    // Coverage: how the chosen party matches each check
    body.append(h('div', { class: 'coverage' }, questChecks(quest).map((c) => {
      if (!party.length) return h('span', { class: 'chip check' }, c.label);
      if (c.kind === 'combat') return h('span', { class: 'chip check combat' }, 'Combat');
      const best = party.map((a) => {
        const { mode } = A.rollMode(a, c.tags);
        return { a, p: passChance(A.checkBonus(a, c.skill, c.ability), c.dc, mode) };
      }).sort((x, y) => y.p - x.p);
      if (c.kind === 'group') {
        const avg = best.reduce((s, b) => s + b.p, 0) / best.length;
        return h('span', { class: `chip check ${grade(avg)}` }, `${c.label}: whole party ${Math.round(avg * 100)}%`);
      }
      return h('span', { class: `chip check ${grade(best[0].p)}` },
        `${c.label}: ${best[0].a.name.split(' ')[0]} ${Math.round(best[0].p * 100)}%`);
    })));

    const sorted = [...state.roster].sort((a, b) => Number(A.isAvailable(b)) - Number(A.isAvailable(a)));
    body.append(h('div', { class: 'grid picker-grid' }, sorted.map((a) => {
      const avail = A.isAvailable(a);
      const sel = chosen.includes(a.id);
      return adventurerCard(a, {
        now,
        selected: sel,
        dim: !avail,
        onClick: () => {
          if (!avail) { toast(`${a.name.split(' ')[0]} is ${statusOf(a, now).text.toLowerCase()}.`); return; }
          if (sel) chosen.splice(chosen.indexOf(a.id), 1);
          else if (chosen.length < max) chosen.push(a.id);
          else { toast(`This job takes at most ${max}.`); return; }
          draw();
        },
      });
    })));

    const ok = chosen.length >= min && chosen.length <= max;
    body.append(h('div', { class: 'sheet-actions' },
      h('button', {
        class: 'btn primary block',
        disabled: ok ? null : true,
        onclick: () => {
          if (!ok) return;
          const res = ctx.send(quest.id, chosen);
          if (res.ok) close();
          else toast(res.reason);
        },
      }, ok ? `Send ${chosen.length} for ${fmtSpan(quest.duration)}` : `Choose ${min === max ? min : `at least ${min}`}`)));
  };
  draw();
}
