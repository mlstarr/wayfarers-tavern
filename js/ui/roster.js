// The roster: every adventurer on the books.
import { h, section, openSheet, toast } from './dom.js';
import { adventurerCard, adventurerDetail } from './card.js';
import { rosterCap } from '../tavern.js';
import { fullName } from '../adventurers.js';
import { openStory } from './story.js';
import { gearTile } from './hall.js';
import { SLOTS } from '../../data/gear.js';

export function renderRoster(ctx) {
  const { state } = ctx;
  const now = Date.now();
  const order = { questing: 1, idle: 0 };
  const list = [...state.roster].sort((a, b) =>
    (b.pendingTalents || []).length - (a.pendingTalents || []).length || order[a.status] - order[b.status] || b.level - a.level);
  const leveling = state.roster.filter((a) => (a.pendingTalents || []).length);
  return h('div', { class: 'screen roster' },
    section('Roster', `${state.roster.length} of ${rosterCap(state)} beds`,
      leveling.length ? h('p', { class: 'notice' },
        `${leveling.map((a) => a.name.split(' ')[0]).join(', ')} leveled up. Tap to choose a talent.`) : null,
      h('div', { class: 'grid' }, list.map((a) => adventurerCard(a, { now, onClick: () => openDetail(ctx, a.id) })))));
}

export function openDetail(ctx, advId) {
  const adv = ctx.state.roster.find((a) => a.id === advId);
  if (!adv) return;
  let close;
  const actions = adv.status === 'idle' ? h('div', { class: 'detail-actions' },
    h('button', {
      class: 'btn subtle',
      onclick: (e) => {
        const btn = e.currentTarget;
        if (btn.dataset.armed !== '1') {
          btn.dataset.armed = '1';
          btn.textContent = `Tap again to let ${adv.name.split(' ')[0]} go`;
          return;
        }
        if (ctx.dismiss(adv.id)) { close(); toast(`${fullName(adv)} has left the company.`); }
      },
    }, 'Dismiss from the company')) : null;
  close = openSheet(adventurerDetail(adv, {
    actions,
    state: ctx.state,
    herbCost: ctx.herbalistCost(),
    onStory: adv.arc ? () => { close(); openStory(ctx, adv.id); } : null,
    onGear: (slot) => openGearSlot(ctx, adv, slot, () => { close(); openDetail(ctx, adv.id); }),
    onHeal: (injuryId) => { if (ctx.herbalist(adv.id, injuryId)) { close(); openDetail(ctx, adv.id); } },
    onChooseTalent: (i) => {
      const t = ctx.chooseTalent(adv.id, i);
      if (t) {
        toast(`${adv.name.split(' ')[0]} learned ${t.name.toLowerCase()}.`);
        close();
        openDetail(ctx, adv.id);
      }
    },
  }), { title: fullName(adv), wide: true });
}

function openGearSlot(ctx, adv, slot, refresh) {
  const cur = (adv.gear || {})[slot];
  const options = ctx.state.stash.filter((g) => g.slot === slot);
  let close;
  const done = (ok) => { if (ok) { close(); refresh(); } };
  const body = h('div', { class: 'equip-pick' },
    adv.status !== 'idle' ? h('p', { class: 'notice' }, 'Gear can only change hands while the hero is at the tavern.') : null,
    cur ? h('div', null, h('h3', null, 'Carrying'), gearTile(cur, {
      actions: [h('button', { class: 'btn small', onclick: () => done(ctx.unequip(adv.id, slot)) }, 'Take off')],
    })) : null,
    h('h3', null, `In the armory (${SLOTS[slot].toLowerCase()})`),
    options.length ? h('div', { class: 'gear-grid' }, options.map((g) => gearTile(g, {
      actions: [h('button', { class: 'btn small primary', onclick: () => done(ctx.equip(adv.id, g.uid)) }, 'Equip')],
    }))) : h('p', { class: 'muted' }, 'Nothing for this slot yet. Gear turns up on quests.'));
  close = openSheet(body, { title: `${adv.name.split(' ')[0]}: ${SLOTS[slot].toLowerCase()}`, wide: true });
}
