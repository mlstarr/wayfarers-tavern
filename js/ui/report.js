// The quest report: the tale of the job, told start to finish, with the dice a tap away,
// then the tally of what came home.
import { h, openSheet, fmtSpan } from './dom.js';
import { icon } from './icons.js';
import { formatRoll } from '../reports.js';
import { SELL_VALUE } from '../../data/gear.js';
import { itemDesc } from '../gear.js';

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

function dice(e) {
  if (!e.rolls.length) return null;
  return h('details', { class: 'tale-dice' },
    h('summary', { html: icon('dice') }, `The dice (${e.rolls.length})`),
    h('div', { class: 'rolls' }, e.rolls.map(rollChip)));
}

// Splits narration from "spoken words" so dialogue can be styled.
function prose(text, cls = 'tale-p') {
  const parts = String(text).split(/("[^"]*")/g).filter(Boolean);
  return h('p', { class: cls }, parts.map((p) => (p.startsWith('"') ? h('span', { class: 'speech' }, p) : p)));
}

function encounterSection(e, i) {
  if (e.dispatch) {
    return h('section', { class: 'tale-letter', style: `--i:${i}` },
      h('div', { class: 'letter-head' }, h('span', { html: icon('scroll') }), h('b', null, 'A letter from the road'),
        h('span', { class: 'muted small' }, e.auto ? 'They decided' : 'You decided')),
      e.lines.map((l) => prose(l, 'letter-p')),
      dice(e));
  }
  return h('section', { class: 'tale-scene', style: `--i:${i}` },
    (e.travel || []).map((t) => prose(t, 'tale-travel')),
    h('div', { class: 'scene-title' },
      h('b', null, e.title),
      h('span', { class: `scene-mark ${e.skipped ? '' : e.success ? 'ok' : 'bad'}` }, e.skipped ? 'Skipped' : e.success ? 'Overcome' : 'Failed')),
    e.intro ? prose(e.intro, 'tale-intro') : null,
    e.lines.map((l) => prose(l)),
    dice(e));
}

function lootBlock(record) {
  const L = record.loot;
  if (!L) return null;
  const items = [];
  for (const t of L.trophies) {
    items.push(h('div', { class: `loot trophy-loot r-${t.rarity}` },
      h('span', { class: 'loot-icon', html: icon('renown') }),
      h('div', null, h('b', null, `Mounted on the wall: ${t.name}`), h('span', { class: 'small' }, t.desc))));
  }
  for (const d of L.dupes) items.push(h('p', { class: 'muted small' }, `Another ${d.name.toLowerCase()}, sold to a collector for ${d.gold} gold.`));
  if (L.gear) {
    items.push(h('div', { class: `loot gear-loot r-${L.gear.rarity}` },
      h('span', { class: 'loot-icon', html: icon('fighter') }),
      h('div', null,
        h('b', null, `Found: ${L.gear.name}`),
        h('span', { class: 'small' }, `${L.gear.rarity} · ${itemDesc(L.gear)}`),
        L.gear.story ? h('span', { class: 'small gear-story' }, L.gear.story) : null,
        h('span', { class: 'muted small' }, L.gearSold ? `The armory was full, so it was sold for ${SELL_VALUE[L.gear.rarity]} gold.` : 'Waiting in the armory.'))));
  }
  for (const l of L.lore) {
    items.push(h('div', { class: 'loot lore-loot' },
      h('span', { class: 'loot-icon', html: icon('scroll') }),
      h('div', null,
        h('b', null, `Bestiary: ${l.name} (${l.level.toLowerCase()})`),
        h('span', { class: 'small' }, l.text),
        l.attack ? h('span', { class: 'small good-text' }, `Every party now gets +${l.attack} to attacks against them.`) : null)));
  }
  if (L.rumor) {
    items.push(h('div', { class: 'loot rumor-loot' },
      h('span', { class: 'loot-icon', html: icon('party') }),
      h('div', null,
        h('b', null, `A rumor: ${L.rumor.name}`),
        prose(L.rumor.text, 'small'),
        h('span', { class: 'small' }, `The trail: ${L.rumor.trail}. Follow it in the Hall, under Legends.`))));
  }
  if (L.legend) {
    items.push(h('div', { class: 'loot legend-loot' },
      h('span', { class: 'loot-icon', html: icon('renown') }),
      h('div', null, h('b', null, L.legend.waiting ? `${L.legend.name} is waiting at the bar` : `${L.legend.name} joined the company`))));
  }
  return items.length ? h('div', { class: 'loot-list' }, items) : null;
}

// record: an archived report from collectQuest
export function openReport(record) {
  const r = record.result;
  const reveal = h('div', { class: 'report-body tale playing' });
  const names = record.party.map((p) => p.name.split(' ')[0]);
  const scenes = r.encounters.map((e, i) => encounterSection(e, i + 1));
  const total = r.encounters.length + 2;

  const tally = h('div', { class: `tally-card o-${r.outcome}`, style: `--i:${total}` },
    h('span', { class: 'outcome-label' }, r.outcomeLabel),
    h('p', null, r.headline),
    h('div', { class: 'reward-row' },
      h('span', { class: 'gold', html: icon('coin') }, `+${r.gold} gold`),
      h('span', { html: icon('renown') }, `+${r.renown} renown`),
      h('span', null, `+${r.xp} XP each`)),
    record.renownLost ? h('p', { class: 'penalty' }, `-${record.renownLost} renown: word of the ${r.outcome} spread.`) : null,
    record.depositBack ? h('p', { class: 'muted small' }, `Contract deposit of ${record.depositBack} gold returned${record.contractBonus ? `, plus ${record.contractBonus} from the map room's bargaining` : ''}.`) : null,
    lootBlock(record),
    (record.injuries || []).length ? h('ul', { class: 'injuries' }, record.injuries.map((i) =>
      h('li', null, h('b', null, i.name), ` came home with a ${i.injury.toLowerCase()} (${i.desc.replace(/\.$/, '').toLowerCase()} until healed).`))) : null,
    r.potionsUsed ? h('p', { class: 'muted small' }, `${r.potionsUsed} healing potion${r.potionsUsed > 1 ? 's' : ''} used${r.potionsLeft ? `, ${r.potionsLeft} brought home` : ''}.`) : null,
    record.levelUps.length ? h('ul', { class: 'levelups' }, record.levelUps.map((u) =>
      h('li', null, h('b', null, u.name), ` reached level ${u.level} (+${u.hpGain} max HP)${(u.path || []).length ? ` and mastered ${u.path.join(' and ')}` : ''}. ${u.level === 3 ? 'Choose a path on the roster.' : 'Choose a talent on the roster.'}`))) : null,
    (record.events || []).length ? h('ul', { class: 'events' }, record.events.map((t) => h('li', null, t))) : null);

  reveal.append(
    h('header', { class: 'tale-cover' },
      h('span', { class: 'story-kicker' }, 'A tale from the road'),
      h('h2', { class: 'story-title' }, record.title),
      h('span', { class: 'muted small' }, `${names.join(', ')} · ${fmtSpan(record.duration)}`)),
    r.tale ? h('section', { class: 'tale-scene', style: '--i:0' }, r.tale.opening.map((t) => prose(t))) : null,
    ...scenes,
    r.tale ? h('section', { class: 'tale-scene epilogue', style: `--i:${total - 1}` }, r.tale.closing.map((t) => prose(t))) : null,
    tally);

  const skip = h('button', {
    class: 'btn small subtle skip',
    onclick: () => { reveal.classList.remove('playing'); skip.remove(); tally.scrollIntoView({ behavior: 'smooth', block: 'start' }); },
  }, 'Skip to the tally');
  setTimeout(() => { reveal.classList.remove('playing'); skip.remove(); }, (total + 1) * 1100 + 400);

  openSheet(h('div', { class: 'report' }, skip, reveal), { title: 'Report', wide: true });
}
