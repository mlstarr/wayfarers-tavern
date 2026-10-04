// The quest report: encounters revealed one by one, every roll on show.
import { h, openSheet, fmtSpan } from './dom.js';
import { icon } from './icons.js';
import { formatRoll } from '../reports.js';

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

function encounterBlock(e, i) {
  const fight = e.kind === 'combat';
  const showInline = !fight && e.rolls.length <= 4;
  return h('div', { class: `enc ${e.success ? 'ok' : 'bad'}`, style: `--i:${i}` },
    h('div', { class: 'enc-head' },
      h('span', { class: 'enc-num' }, i + 1),
      h('b', null, e.title),
      h('span', { class: `enc-result ${e.success ? 'ok' : 'bad'}` }, e.skipped ? 'Skipped' : e.success ? 'Passed' : 'Failed')),
    e.lines.map((l) => h('p', { class: 'enc-line' }, l)),
    showInline ? h('div', { class: 'rolls' }, e.rolls.map(rollChip))
      : e.rolls.length ? h('details', { class: 'rolls-more' },
        h('summary', { html: icon('dice') }, `Show all ${e.rolls.length} rolls`),
        h('div', { class: 'rolls' }, e.rolls.map(rollChip))) : null);
}

// record: an archived report from collectQuest
export function openReport(record) {
  const r = record.result;
  const reveal = h('div', { class: 'report-body playing' });
  const rewards = h('div', { class: 'rewards', style: `--i:${r.encounters.length}` },
    h('div', { class: 'reward-row' },
      h('span', { class: 'gold', html: icon('coin') }, `+${r.gold} gold`),
      h('span', { html: icon('renown') }, `+${r.renown} renown`),
      h('span', null, `+${r.xp} XP each`)),
    record.levelUps.length ? h('ul', { class: 'levelups' }, record.levelUps.map((u) =>
      h('li', null, h('b', null, u.name), ` reached level ${u.level} (+${u.hpGain} max HP).`))) : null,
    record.party.some((p) => p.fell) ? h('p', { class: 'muted' },
      `${record.party.filter((p) => p.fell).map((p) => p.name.split(' ')[0]).join(' and ')} came home badly hurt and will need rest.`) : null);

  reveal.append(
    h('div', { class: `outcome o-${r.outcome}` },
      h('span', { class: 'outcome-label' }, r.outcomeLabel),
      h('p', null, r.headline),
      h('p', { class: 'muted small' }, `${record.party.map((p) => p.name.split(' ')[0]).join(', ')} · ${fmtSpan(record.duration)} · ${r.successes} of ${r.encounters.length} encounters won`)),
    ...r.encounters.map(encounterBlock),
    rewards);

  const skip = h('button', {
    class: 'btn small subtle skip',
    onclick: () => { reveal.classList.remove('playing'); skip.remove(); },
  }, 'Skip ahead');
  // Stop the animation once everything has appeared.
  setTimeout(() => { reveal.classList.remove('playing'); skip.remove(); }, (r.encounters.length + 1) * 900 + 400);

  openSheet(h('div', { class: 'report' }, skip, reveal), { title: record.title, wide: true });
}
