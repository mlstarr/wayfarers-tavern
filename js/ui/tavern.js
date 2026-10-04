// Home screen: who's back, who's out, and what's been happening.
import { h, section, countdown, fmtAgo, fmtSpan } from './dom.js';
import { icon } from './icons.js';
import { miniShield } from './card.js';
import { isReturned } from '../quests.js';

export function renderTavern(ctx) {
  const { state } = ctx;
  const now = Date.now();
  const back = state.pending.filter((p) => isReturned(p, now));
  const out = state.pending.filter((p) => !isReturned(p, now)).sort((a, b) => a.endAt - b.endAt);
  const partyOf = (p) => p.party.map((id) => state.roster.find((a) => a.id === id)).filter(Boolean);

  const root = h('div', { class: 'screen tavern' });

  if (back.length) {
    root.append(section('Back from the road', null,
      h('div', { class: 'list two' }, back.map((p) => h('button', {
        class: 'return-card', onclick: () => ctx.openReturn(p.id),
      },
      h('span', { class: 'seal', html: icon('scroll') }),
      h('span', { class: 'return-text' },
        h('b', null, p.quest.title),
        h('span', { class: 'muted' }, partyOf(p).map((a) => a.name.split(' ')[0]).join(', '))),
      h('span', { class: 'btn primary small' }, 'Read report'))))));
  }

  if (out.length) {
    root.append(section('On the road', `${out.length} part${out.length === 1 ? 'y' : 'ies'} out`,
      h('div', { class: 'list two' }, out.map((p) => {
        const total = p.endAt - p.startAt;
        return h('div', { class: 'road-card panel' },
          h('div', { class: 'road-top' },
            h('b', null, p.quest.title),
            h('span', { class: 'timer', html: icon('clock') }, countdown(p.endAt, 'back now'))),
          h('div', { class: 'road-party' }, partyOf(p).map((a) => miniShield(a))),
          h('div', { class: 'progress', 'data-start': p.startAt, 'data-end': p.endAt },
            h('i', { style: `width:${Math.min(100, ((now - p.startAt) / total) * 100)}%` })),
          h('span', { class: 'muted small' }, `${fmtSpan(p.quest.duration)} quest`));
      }))));
  }

  if (!back.length && !out.length) {
    root.append(h('div', { class: 'empty panel' },
      h('div', { class: 'empty-art', html: icon('tavern') }),
      h('h2', null, 'The tables are quiet'),
      h('p', { class: 'muted' }, 'Pick a job from the quest board and send a party out. They\'ll be back with gold, scars and stories.'),
      h('button', { class: 'btn primary', onclick: () => ctx.go('board') }, 'Open the quest board')));
  }

  const idle = state.roster.filter((a) => a.status === 'idle').length;
  root.append(h('div', { class: 'tally' },
    tally('Adventurers', `${state.roster.length}`, `${idle} at the tavern`),
    tally('Quests done', state.stats.questsDone, `${state.stats.triumphs} triumphs`),
    tally('Gold earned', state.stats.goldEarned, 'all time')));

  if (state.log.length) {
    root.append(section('Tavern talk', null,
      h('ul', { class: 'log panel' }, state.log.slice(0, 8).map((e) =>
        h('li', null, e.text, h('span', { class: 'muted' }, ` · ${fmtAgo(e.at, now)}`))))));
  }

  if (state.reports.length) {
    root.append(section('Past reports', null,
      h('div', { class: 'past' }, state.reports.slice(0, 6).map((r) =>
        h('button', { class: `past-item o-${r.result.outcome}`, onclick: () => ctx.openArchived(r.id) },
          h('span', null, r.title),
          h('span', { class: 'muted' }, `${r.result.outcomeLabel} · ${fmtAgo(r.at, now)}`))))));
  }
  return root;
}

function tally(label, value, sub) {
  return h('div', { class: 'tally-item' },
    h('span', { class: 'muted small' }, label), h('b', null, String(value)), h('span', { class: 'muted small' }, sub));
}
