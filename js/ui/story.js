// The story view: a hero's personal tale as a book of chapters, with the current
// chapter played inside it. Also the "wants a word" invitations on the home screen.
import { h, openSheet, closeAllSheets } from './dom.js';
import { icon } from './icons.js';
import { miniShield } from './card.js';
import { ARCS } from '../../data/arcs.js';
import { CHAPTERS, describeStory, storyJournal, storyProgress, readyStories } from '../stories.js';
import { fill } from '../reports.js';
import { fullName, firstName, loyaltyTier } from '../adventurers.js';

// Splits text into narration and "spoken words" so dialogue can be styled.
function prose(text, cls = 'story-prose') {
  const parts = text.split(/("[^"]*")/g).filter(Boolean);
  return h('p', { class: cls }, parts.map((p) => (p.startsWith('"') ? h('span', { class: 'speech' }, p) : p)));
}

function track(adv) {
  const step = adv.arc.step;
  return h('ol', { class: 'chapter-track' }, CHAPTERS.map((c, i) => h('li', {
    class: i < step ? 'done' : i === step ? 'now' : '',
    title: c,
  }, h('i'), h('span', null, i === 0 ? 'Intro' : i <= 3 ? ['I', 'II', 'III'][i - 1] : i === 4 ? 'Quest' : 'Legacy'))));
}

function journalEntry(e) {
  return h('section', { class: 'chapter past' },
    h('div', { class: 'chapter-head' }, h('span', { class: 'chapter-name' }, e.chapter), h('span', { class: 'chapter-setting' }, e.setting)),
    prose(e.text),
    e.choice ? h('p', { class: 'your-choice' }, h('span', null, 'You chose: '), e.choice) : null,
    e.result ? prose(e.result, 'story-result') : null);
}

function waitingNote(adv, ctx) {
  const prog = storyProgress(adv);
  const arc = ARCS[adv.arc.id];
  const name = firstName(adv);
  if (prog.step >= 5) {
    return h('section', { class: 'chapter legacy' },
      h('div', { class: 'chapter-head' }, h('span', { class: 'chapter-name' }, 'Legacy')),
      h('p', { class: 'story-result' }, h('b', null, `${arc.legacy.name}. `), fill(arc.legacy.desc, { name })),
      h('p', { class: 'muted small' }, `Known now as ${fullName(adv)}.`));
  }
  if (prog.step === 4) {
    return h('section', { class: 'chapter next' },
      h('div', { class: 'chapter-head' }, h('span', { class: 'chapter-name' }, 'Personal quest')),
      h('p', null, `${fill(arc.quest.title, { name })} is waiting on the quest board. ${name} must lead it.`),
      h('button', { class: 'btn primary', onclick: () => { closeAllSheets(); ctx.go('board'); } }, 'Go to the quest board'));
  }
  const text = adv.status === 'questing'
    ? `${name} is out on the road. The next chapter waits until ${name} is back at the tavern.`
    : prog.need > 0
      ? `The next chapter comes after ${prog.need} more quest${prog.need > 1 ? 's' : ''} with ${name}.`
      : `${name} is at the tavern and ready to talk.`;
  return h('section', { class: 'chapter next' },
    h('div', { class: 'chapter-head' }, h('span', { class: 'chapter-name' }, CHAPTERS[prog.step])),
    h('p', { class: 'muted' }, text));
}

function currentChapter(ctx, adv, body, redraw) {
  const info = describeStory(adv);
  return h('section', { class: 'chapter current' },
    h('div', { class: 'chapter-head' }, h('span', { class: 'chapter-name' }, info.chapter), h('span', { class: 'chapter-setting' }, info.setting)),
    prose(info.text),
    h('div', { class: 'story-choices' }, info.choices.map((c) => {
      const poor = c.cost && ctx.state.gold < c.cost;
      return h('button', {
        class: 'story-choice',
        disabled: poor ? true : null,
        onclick: () => {
          const out = ctx.story(adv.id, c.index);
          if (!out || out.error) return;
          redraw(out);
        },
      },
      h('span', { class: 'choice-label' }, c.label),
      c.hints.length ? h('span', { class: 'choice-hints' }, c.hints.map((t) => h('span', { class: `hint ${t.tone}` }, t.text))) : null,
      poor ? h('span', { class: 'hint bad' }, 'Not enough gold') : null);
    })));
}

export function openStory(ctx, advId) {
  const body = h('div', { class: 'story-book' });
  let close;
  const draw = (lastOut) => {
    const adv = ctx.state.roster.find((a) => a.id === advId);
    if (!adv || !adv.arc) { close(); return; }
    const arc = ARCS[adv.arc.id];
    const ready = readyStories(ctx.state).includes(adv);
    const lt = loyaltyTier(adv);
    body.replaceChildren(...[
      h('header', { class: 'story-cover' },
        miniShield(adv),
        h('div', null,
          h('span', { class: 'story-kicker' }, `The tale of ${fullName(adv)}`),
          h('h2', { class: 'story-title' }, arc.title),
          h('span', { class: 'muted small' }, `Loyalty: ${lt.label.toLowerCase()} (${adv.loyalty} of 5)`))),
      track(adv),
      storyJournal(adv).map(journalEntry),
      lastOut ? h('div', { class: 'story-outcome' },
        lastOut.notes.length ? h('div', { class: 'choice-hints' }, lastOut.notes.map((n) => h('span', { class: `hint ${n.startsWith('-') ? 'bad' : 'good'}` }, n))) : null,
        lastOut.quest ? h('p', { class: 'notice' }, `A personal quest is on the board: ${lastOut.quest.title}.`) : null) : null,
      ready ? currentChapter(ctx, adv, body, (out) => { draw(out); body.lastElementChild.scrollIntoView({ block: 'end', behavior: 'smooth' }); })
        : waitingNote(adv, ctx),
    ].flat().filter(Boolean));
  };
  draw(null);
  close = openSheet(body, { title: 'Story', wide: true });
  setTimeout(() => {
    const cur = body.querySelector('.chapter.current');
    if (cur && body.querySelectorAll('.chapter.past').length) cur.scrollIntoView({ block: 'start' });
  }, 50);
}

// Home-screen invitations: one line per hero who wants a word.
export function storyInvites(ctx) {
  const ready = readyStories(ctx.state);
  if (!ready.length) return null;
  return h('div', { class: 'invites' }, ready.map((a) => {
    const info = describeStory(a);
    return h('button', { class: 'invite', onclick: () => openStory(ctx, a.id) },
      miniShield(a),
      h('span', { class: 'invite-text' },
        h('b', null, `${firstName(a)} wants a word`),
        h('span', { class: 'muted small' }, `${info.title} · ${info.chapter}`)),
      h('span', { class: 'invite-go', html: icon('scroll') }));
  }));
}
