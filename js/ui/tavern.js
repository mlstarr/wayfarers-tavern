// Home screen: messengers, common-room scenes, returns, parties on the road.
import { h, section, countdown, fmtAgo, fmtSpan } from './dom.js';
import { icon } from './icons.js';
import { miniShield } from './card.js';
import { isReturned } from '../quests.js';
import { openDispatches, describeDispatch } from '../dispatch.js';
import { liveScenes, describeScene } from '../scenes.js';
import { readyStories, describeStory } from '../stories.js';
import { wagesDue, nextPaydayAt, tavernMods } from '../tavern.js';
import { rankPanel } from './rooms.js';

function storyCard(ctx, adv) {
  const info = describeStory(adv);
  return h('article', { class: 'story-card' },
    h('div', { class: 'story-head' },
      miniShield(adv),
      h('span', { class: 'dispatch-title' },
        h('b', null, info.title),
        h('span', { class: 'muted small' }, `${adv.name} · ${info.part}`))),
    h('p', { class: 'story-text' }, info.text),
    h('div', { class: 'options' }, info.choices.map((c) => h('button', {
      class: 'option',
      disabled: c.cost && ctx.state.gold < c.cost ? true : null,
      onclick: () => ctx.story(adv.id, c.index),
    }, h('b', null, c.label, c.cost ? h('span', { class: 'cost dark', html: `${icon('coin')}${c.cost}` }) : null)))));
}

function upkeepLine(state, now) {
  const due = wagesDue(state);
  const short = state.gold < due;
  const ale = tavernMods(state).ale;
  return h('div', { class: `upkeep${short ? ' short' : ''}` },
    h('span', null, 'Payday in ', countdown(nextPaydayAt(now), 'now'), `: ${due} gold in wages`, short ? '. The chest is short.' : '.'),
    ale ? h('span', { class: 'muted' }, `Taproom: ${ale} gold an hour.`) : null);
}

function dispatchCard(ctx, p, d) {
  const info = describeDispatch(d);
  return h('article', { class: 'dispatch-card' },
    h('div', { class: 'dispatch-head' },
      h('span', { class: 'seal small', html: icon('scroll') }),
      h('span', { class: 'dispatch-title' }, h('b', null, 'A messenger arrives'), h('span', { class: 'muted small' }, p.quest.title)),
      h('span', { class: 'timer small', title: 'Answer before the party returns' }, countdown(p.endAt, 'now'))),
    h('p', { class: 'dispatch-text' }, info.text),
    h('div', { class: 'options' }, info.options.map((o) => h('button', {
      class: 'option', onclick: () => ctx.decide(p.id, d.id, o.index),
    },
    h('b', null, o.label, o.isDefault ? h('span', { class: 'muted small' }, ' · their plan if you stay silent') : null),
    h('span', { class: 'muted' }, o.desc)))));
}

function sceneCard(ctx, s) {
  const info = describeScene(ctx.state, s);
  const actors = s.actors.map((id) => ctx.state.roster.find((a) => a.id === id)).filter(Boolean);
  return h('article', { class: 'scene-card panel' },
    h('div', { class: 'scene-head' }, actors.map((a) => miniShield(a)), h('p', null, info.text)),
    h('div', { class: 'scene-choices' }, info.choices.map((c) => h('button', {
      class: 'btn small',
      disabled: c.cost && ctx.state.gold < c.cost ? true : null,
      onclick: () => ctx.playScene(s.id, c.index),
    }, c.label, c.cost ? h('span', { class: 'cost', html: `${icon('coin')}${c.cost}` }) : null))));
}

export function renderTavern(ctx) {
  const { state } = ctx;
  const now = Date.now();
  const back = state.pending.filter((p) => isReturned(p, now));
  const out = state.pending.filter((p) => !isReturned(p, now)).sort((a, b) => a.endAt - b.endAt);
  const partyOf = (p) => p.party.map((id) => state.roster.find((a) => a.id === id)).filter(Boolean);
  const messages = openDispatches(state, now);
  const scenes = liveScenes(state);

  const stories = readyStories(state);
  const root = h('div', { class: 'screen tavern' });
  root.append(h('div', { class: 'home-head' }, rankPanel(state, { compact: true }), upkeepLine(state, now)));

  if (messages.length) {
    root.append(section('Word from the road', null,
      h('div', { class: 'list two' }, messages.map((m) => dispatchCard(ctx, m.pending, m.dispatch)))));
  }

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
        const nextMsg = (p.dispatches || []).find((d) => d.choice == null && d.at > now);
        const answered = (p.dispatches || []).filter((d) => d.choice != null).length;
        return h('div', { class: 'road-card panel' },
          h('div', { class: 'road-top' },
            h('b', null, p.quest.title),
            h('span', { class: 'timer', html: icon('clock') }, countdown(p.endAt, 'back now'))),
          h('div', { class: 'road-party' }, partyOf(p).map((a) => miniShield(a))),
          h('div', { class: 'progress', 'data-start': p.startAt, 'data-end': p.endAt },
            h('i', { style: `width:${Math.min(100, ((now - p.startAt) / total) * 100)}%` }),
            (p.dispatches || []).map((d) => h('b', { class: `pip${d.choice != null ? ' done' : ''}`, style: `left:${((d.at - p.startAt) / total) * 100}%` }))),
          h('span', { class: 'muted small' },
            `${fmtSpan(p.quest.duration)} quest`,
            nextMsg ? [' · messenger in ', countdown(nextMsg.at, 'moments')] : answered ? ` · ${answered} message${answered > 1 ? 's' : ''} answered` : ''));
      }))));
  }

  if (stories.length) {
    root.append(section('Stories', null,
      h('div', { class: 'list two' }, stories.map((a) => storyCard(ctx, a)))));
  }

  if (scenes.length) {
    root.append(section('In the common room', null,
      h('div', { class: 'list two' }, scenes.map((s) => sceneCard(ctx, s)))));
  }

  if (!back.length && !out.length && !messages.length && !stories.length) {
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
