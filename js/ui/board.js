// The quest board and the party picker (party, supplies, bonds).
import { h, section, countdown, fmtSpan, openSheet, toast } from './dom.js';
import { icon } from './icons.js';
import { adventurerCard, statusOf } from './card.js';
import { questChecks, unlockedTiers, recommendedSupplies, nextPostingAt } from '../quests.js';
import { activeConditions } from '../resolve.js';
import { partyBonuses, partyPairs } from '../bonds.js';
import { TIER_NAMES } from '../../data/quests.js';
import { CONDITIONS, SUPPLIES } from '../../data/supplies.js';
import { TIER_RENOWN } from '../config.js';
import * as A from '../adventurers.js';

function passChance(bonus, dc, mode) {
  let n = 0;
  for (let d = 1; d <= 20; d++) if (d === 20 || (d !== 1 && d + bonus >= dc)) n++;
  const p = n / 20;
  return mode === 'adv' ? 1 - (1 - p) ** 2 : mode === 'dis' ? p * p : p;
}

const grade = (p) => (p >= 0.7 ? 'good' : p >= 0.45 ? 'fair' : 'poor');

function tierBadge(quest) {
  if (quest.expedition) return h('span', { class: 'tier exp', title: 'A long, rich expedition' }, 'Expedition');
  return h('span', { class: `tier t${quest.tier}`, title: `${TIER_NAMES[quest.tier]} quest` },
    h('span', { html: icon('skull').repeat(quest.tier) }), TIER_NAMES[quest.tier]);
}

export function conditionChips(quest, packed = null) {
  return (quest.conditions || []).map((id) => {
    const c = CONDITIONS[id];
    const handled = packed && packed[c.counter];
    const cls = c.boon ? (handled ? 'boon on' : 'boon') : handled ? 'cond handled' : 'cond';
    return h('span', { class: `chip ${cls}`, title: c.desc }, handled && !c.boon ? `${c.name} ✓` : c.name);
  });
}

export function questCard(quest, { onChoose } = {}) {
  return h('article', { class: `quest-card${quest.expedition ? ' expedition' : ''}` },
    h('div', { class: 'quest-head' }, h('h3', null, quest.title), tierBadge(quest)),
    h('p', { class: 'quest-blurb' }, quest.blurb),
    h('div', { class: 'quest-meta' },
      h('span', { html: icon('clock') }, fmtSpan(quest.duration)),
      h('span', { html: icon('party') }, quest.party[0] === quest.party[1] ? `${quest.party[0]}` : `${quest.party[0]}–${quest.party[1]}`),
      h('span', { class: 'gold', html: icon('coin') }, `${quest.gold}`),
      h('span', null, `${quest.xp} XP each`)),
    h('div', { class: 'chips' },
      questChecks(quest).map((c) => h('span', { class: `chip check ${c.kind}` }, c.label)),
      conditionChips(quest)),
    h('div', { class: 'quest-foot' },
      h('span', { class: 'muted small' }, 'Leaves the board in ', countdown(quest.expiresAt, 'moments')),
      onChoose ? h('button', { class: 'btn primary', onclick: onChoose }, 'Choose a party') : null));
}

export function renderBoard(ctx) {
  const { state } = ctx;
  const tiers = unlockedTiers(state);
  const nextTier = tiers.length < 3 ? tiers.length + 1 : null;
  const next = nextPostingAt(state);

  const root = h('div', { class: 'screen board' });
  root.append(section('Quest board', null,
    h('p', { class: 'muted board-note' },
      next ? ['Next posting in ', countdown(next, 'a moment'), '. '] : null,
      nextTier ? `${TIER_NAMES[nextTier]} jobs unlock at ${TIER_RENOWN[nextTier - 1]} renown.` : '')));

  if (!state.board.quests.length) {
    root.append(h('div', { class: 'empty panel' },
      h('h2', null, 'The board is bare'),
      h('p', { class: 'muted' }, 'Every posting has been taken. New notices go up through the day.')));
  }
  root.append(h('div', { class: 'list two' }, state.board.quests.map((q) =>
    questCard(q, { onChoose: () => openPartyPicker(ctx, q) }))));
  return root;
}

// Roll modifier the picker can predict for one check (bonds, buffs, uncountered conditions).
function previewMod(c, a, conds, bonus) {
  let mod = bonus[a.id] || 0;
  for (const k of conds) {
    if (k.rollMod) mod += k.rollMod;
    if (c.skill && k.skillMods && k.skillMods[c.skill]) mod += k.skillMods[c.skill];
    if (!c.skill && c.rawAbility && k.abilityMods && k.abilityMods[c.rawAbility]) mod += k.abilityMods[c.rawAbility];
  }
  return mod;
}

function openPartyPicker(ctx, quest) {
  const { state } = ctx;
  const chosen = [];
  const packed = {};
  for (const k of recommendedSupplies(quest)) if (state.supplies[k] && k !== 'rope') packed[k] = 1;
  const body = h('div', { class: 'picker' });
  const close = openSheet(body, { title: quest.title, wide: true });

  const draw = () => {
    const now = Date.now();
    body.replaceChildren();
    const party = chosen.map((id) => state.roster.find((a) => a.id === id));
    const [min, max] = quest.party;
    const conds = activeConditions(quest, packed);
    const extraTags = conds.flatMap((c) => c.addTags || []);
    const { bonus } = partyBonuses(state, party);

    body.append(h('p', { class: 'muted' },
      `Choose ${min === max ? min : `${min} to ${max}`} adventurers and what to pack. Tap a card to add or remove.`));

    // Conditions and supplies
    const rec = recommendedSupplies(quest);
    body.append(h('div', { class: 'prep' },
      quest.conditions.length ? h('div', { class: 'chips' }, conditionChips(quest, packed)) : null,
      h('div', { class: 'supplies' }, Object.entries(SUPPLIES).map(([k, s]) => {
        const have = state.supplies[k] || 0;
        const n = packed[k] || 0;
        if (!have && !rec.has(k)) return null;
        return h('button', {
          class: `supply${n ? ' on' : ''}${rec.has(k) ? ' rec' : ''}`,
          title: s.desc,
          onclick: () => {
            if (!have) { toast(`No ${s.name.toLowerCase()} left. The quartermaster at the bar sells them.`); return; }
            if (s.stack) packed[k] = (n + 1) % (Math.min(have, s.stack) + 1);
            else packed[k] = n ? 0 : 1;
            draw();
          },
        }, s.name, s.stack && n ? ` ×${n}` : '', h('span', { class: 'supply-count' }, ` ${have}`));
      }))));

    // Coverage: how the chosen party matches each check
    body.append(h('div', { class: 'coverage' }, questChecks(quest).map((c) => {
      if (!party.length) return h('span', { class: 'chip check' }, c.label);
      if (c.kind === 'combat') return h('span', { class: 'chip check combat' }, 'Combat');
      const tags = [...c.tags, ...extraTags];
      const best = party.map((a) => {
        const f = A.rollFactors(a, tags);
        if (packed.rope && (tags.includes('heights') || tags.includes('water'))) f.plus.push('rope');
        const { mode } = A.modeOf(f.plus, f.minus);
        return { a, p: passChance(A.checkBonus(a, c.skill, c.rawAbility) + previewMod(c, a, conds, bonus), c.dc, mode) };
      }).sort((x, y) => y.p - x.p);
      if (c.kind === 'group') {
        const avg = best.reduce((s, b) => s + b.p, 0) / best.length;
        return h('span', { class: `chip check ${grade(avg)}` }, `${c.label}: party ${Math.round(avg * 100)}%`);
      }
      return h('span', { class: `chip check ${grade(best[0].p)}` },
        `${c.label}: ${best[0].a.name.split(' ')[0]} ${Math.round(best[0].p * 100)}%`);
    })));

    const pairs = partyPairs(state, party);
    if (pairs.length) {
      body.append(h('div', { class: 'chips bonds-line' }, pairs.map((p) =>
        h('span', { class: `chip bond ${p.level.mod > 0 ? 'good' : 'bad'}` },
          `${p.a.name.split(' ')[0]} & ${p.b.name.split(' ')[0]}: ${p.level.label.toLowerCase()} (${p.level.mod > 0 ? '+' : ''}${p.level.mod})`))));
    }

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
          const res = ctx.send(quest.id, chosen, packed);
          if (res.ok) close();
          else toast(res.reason);
        },
      }, ok ? `Send ${chosen.length} for ${fmtSpan(quest.duration)}` : `Choose ${min === max ? min : `at least ${min}`}`)));
  };
  draw();
}
