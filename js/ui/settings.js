// Settings: backup, restore, new game, credits.
import { h, openSheet, toast } from './dom.js';
import { exportSave } from '../state.js';
import { FAST } from '../config.js';

export function openSettings(ctx) {
  const out = h('textarea', { class: 'save-box', readonly: true, rows: 4, 'aria-label': 'Save code' });
  const inp = h('textarea', { class: 'save-box', rows: 4, placeholder: 'Paste a save code here', 'aria-label': 'Save code to load' });
  let close;

  const body = h('div', { class: 'settings' },
    h('h3', null, 'Back up your tavern'),
    h('p', { class: 'muted' }, 'Your game saves in this browser automatically. Copy a save code to keep a backup or move to another device.'),
    h('div', { class: 'row' },
      h('button', {
        class: 'btn',
        onclick: async () => {
          out.value = exportSave(ctx.state);
          out.select();
          try { await navigator.clipboard.writeText(out.value); toast('Save code copied'); } catch { toast('Save code ready to copy'); }
        },
      }, 'Copy save code'),
      h('button', {
        class: 'btn',
        onclick: () => {
          const blob = new Blob([exportSave(ctx.state)], { type: 'text/plain' });
          const a = h('a', { href: URL.createObjectURL(blob), download: 'wayfarers-tavern-save.txt' });
          a.click();
          setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        },
      }, 'Download')),
    out,

    h('h3', null, 'Load a save'),
    inp,
    h('button', {
      class: 'btn',
      onclick: () => {
        try { ctx.importGame(inp.value); close(); toast('Save loaded'); } catch (err) { toast(err.message || 'That save code did not work'); }
      },
    }, 'Load save code'),

    h('h3', null, 'Start over'),
    h('p', { class: 'muted' }, 'Begins a new tavern with new adventurers. Your current game is lost unless you back it up first.'),
    h('button', {
      class: 'btn danger',
      onclick: (e) => {
        const b = e.currentTarget;
        if (b.dataset.armed !== '1') { b.dataset.armed = '1'; b.textContent = 'Tap again to start a new game'; return; }
        ctx.newGame(); close(); toast('A new tavern opens its doors');
      },
    }, 'New game'),

    FAST ? h('p', { class: 'notice' }, 'Fast mode is on: one game-minute lasts one real second.') : null,

    h('h3', null, 'Credits'),
    h('p', { class: 'muted small' },
      'This work includes material taken from the System Reference Document 5.1 ("SRD 5.1") by Wizards of the Coast LLC, ',
      'licensed under the Creative Commons Attribution 4.0 International License.'),
    h('p', { class: 'muted small' }, 'Wayfarer\'s Tavern · early build (M1)'));

  close = openSheet(body, { title: 'Settings' });
}
