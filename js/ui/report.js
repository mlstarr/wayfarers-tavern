// The quest report: encounters revealed one by one, every roll on show.
import { h, openSheet, fmtSpan } from './dom.js';
import { icon } from './icons.js';
import { formatRoll } from '../reports.js';
import { CONDITIONS } from '../../data/supplies.js';

function rollChip(r) {
  const cls = ['roll', r.pass ? 'pass' : 'fail', r.enemy ? 'enemy' : '', r.nat === 20 ? 'n20' : '', r.nat === 1 ? 'n1' : '']
    .filter(Boolean).join(' ');
  const who = r.enemy ? r.label : `${r.name} · ${r.label}`;
  const extras = [
    r.mode === 'adv' ? 'advantage' : r.mode === 'dis' ? 'disadvantage' : null,
    ...r.notes,
    r.dmg ? `${r.dmg} dmg` : null,
    r.dmgTaken ? `took ${r.dmgTaken}` : null,
  ].filter(Boolean);
  return h('div', { class: cls },
    h('span', { class: 'roll-who' }, who),
    h('span', { class: 'roll-math' }, formatRoll(r), r.pass ? ' ✓' : ' ✗'),
    extras.length ? h('span', { class: 'roll-note' }, extras.join(' · ')) : null);
}

function rollsBlock(e) {
  if (!e.rolls.length) return null;
  if (e.kind !== 'combat' && e.rolls.length <= 4) return h('div', { class: 'rolls' }, e.rolls.map(rollChip));
  return h('details', { class: 'rolls-more' },
    h('summary', { html: icon('dice') }, `Show all ${e.rolls.length} rolls`),
    h('div', { class: 'rolls' }, e.rolls.map(rollChip)));
}

function encounterBlock(e, i, n) {
  if (e.dispatch) {
    return h('div', { class: 'enc dispatch', style: `--i:${i}` },
      h('div', { class: 'enc-head' },
        h('span', { class: 'enc-num', html: icon('scroll') }),
        h('b', null, e.title),
        h('span', { class: 'enc-result' }, e.auto ? 'Their call' : 'Your call')),
      e.lines.map((l) => h('p', { class: 'enc-line' }, l)),
      rollsBlock(e));
  }
  return h('div', { class: `enc ${e.success ? 'ok' : 'bad'}`, style: `--i:${i}` },
    h('div', { class: 'enc-head' },
      h('span', { class: 'enc-num' }, n),
      h('b', null, e.title, e.finale ? h('span', { class: 'muted small' }, ' · final') : null),
      h('span', { class: `enc-result ${e.success ? 'ok' : 'bad'}` }, e.skipped ? 'Skipped' : e.success ? 'Passed' : 'Failed')),
    e.lines.map((l) => h('p', { class: 'enc-line' }, l)),
    rollsBlock(e));
}

// record: an archived report from collectQuest
export function openReport(record) {
  const r = record.result;
  const reveal = h('div', { class: 'report-body playing' });
  let n = 0;
  const blocks = r.encounters.map((e, i) => encounterBlock(e, i, e.dispatch ? 0 : ++n));
  const conds = (r.conditions || []).map((id) => CONDITIONS[id]).filter(Boolean);

  const rewards = h('div', { class: 'rewards', style: `--i:${r.encounters.length}` },
    h('div', { class: 'reward-row' },
      h('span', { class: 'gold', html: icon('coin') }, `+${r.gold} gold`),
      h('span', { html: icon('renown') }, `+${r.renown} renown`),
      h('span', null, `+${r.xp} XP each`)),
    record.renownLost ? h('p', { class: 'penalty' }, `-${record.renownLost} renown: word of the ${r.outcome} spread.`) : null,
    record.depositBack ? h('p', { class: 'muted small' }, `Contract deposit of ${record.depositBack} gold returned${record.contractBonus ? `, plus ${record.contractBonus} from the map room's bargaining` : ''}.`) : null,
    (record.injuries || []).length ? h('ul', { class: 'injuries' }, record.injuries.map((i) =>
      h('li', null, h('b', null, i.name), ` came home with a ${i.injury.toLowerCase()} (${i.desc.replace(/\.$/, '').toLowerCase()} until healed).`))) : null,
    r.potionsUsed ? h('p', { class: 'muted small' }, `${r.potionsUsed} healing potion${r.potionsUsed > 1 ? 's' : ''} used${r.potionsLeft ? `, ${r.potionsLeft} brought home` : ''}.`) : null,
    record.levelUps.length ? h('ul', { class: 'levelups' }, record.levelUps.map((u) =>
      h('li', null, h('b', null, u.name), ` reached level ${u.level} (+${u.hpGain} max HP). Choose a talent on the roster.`))) : null,
    (record.events || []).length ? h('ul', { class: 'events' }, record.events.map((t) => h('li', null, t))) : null,
    record.party.some((p) => p.fell) ? h('p', { class: 'muted' },
      `${record.party.filter((p) => p.fell).map((p) => p.name.split(' ')[0]).join(' and ')} came home badly hurt and will need rest.`) : null);

  reveal.append(
    h('div', { class: `outcome o-${r.outcome}` },
      h('span', { class: 'outcome-label' }, r.outcomeLabel),
      h('p', null, r.headline),
      h('p', { class: 'muted small' }, `${record.party.map((p) => p.name.split(' ')[0]).join(', ')} · ${fmtSpan(record.duration)} · ${r.successes} of ${r.played ?? r.encounters.length} encounters won`),
      conds.length ? h('p', { class: 'muted small' }, `Faced: ${conds.map((c) => c.name.toLowerCase()).join(', ')}`) : null),
    ...blocks,
    rewards);

  const total = r.encounters.length;
  const skip = h('button', {
    class: 'btn small subtle skip',
    onclick: () => { reveal.classList.remove('playing'); skip.remove(); },
  }, 'Skip ahead');
  setTimeout(() => { reveal.classList.remove('playing'); skip.remove(); }, (total + 1) * 900 + 400);

  openSheet(h('div', { class: 'report' }, skip, reveal), { title: record.title, wide: true });
}
