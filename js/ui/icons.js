// Original line icons on a 24px grid. icon(name) returns an SVG string.
const PATHS = {
  rooms: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 21h8M9 17h6"/>',
  pelt: '<path d="M6 5c2 1 4 1 6 0 2 1 4 1 6 0l-1 5 2 4-4 1-1 5h-4l-1-5-4-1 2-4z"/>',
  tusk: '<path d="M5 19C5 11 10 5 19 4c-6 3-9 8-10 15z"/><path d="M9 21c2-6 6-10 12-12"/>',
  fang: '<path d="M8 3h8l-2 10-2 8-2-8z"/><path d="M8 3c0 3 2 5 4 5s4-2 4-5"/>',
  web: '<path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4"/><path d="M12 7l3.5 1.5L17 12l-1.5 3.5L12 17l-3.5-1.5L7 12l1.5-3.5z"/>',
  lantern: '<path d="M9 3h6M12 3v2M8 7h8l-1 10H9z"/><path d="M7 17h10v3H7zM12 10v4"/>',
  crown: '<path d="M4 18 3 7l5 4 4-6 4 6 5-4-1 11z"/><path d="M4 21h16"/>',
  banner: '<path d="M6 21V3"/><path d="M6 4h12l-3 4 3 4H6"/>',
  bell: '<path d="M6 17c1-2 1-4 1-7a5 5 0 0 1 10 0c0 3 0 5 1 7z"/><path d="M4 17h16M10 20a2 2 0 0 0 4 0"/>',
  stone: '<path d="M6 21 8 6l4-3 4 3 2 15z"/><path d="M10 10h4M10 14h4"/>',
  leaf: '<path d="M5 19C5 10 11 4 20 4c0 9-6 15-15 15z"/><path d="M5 19 13 11"/>',
  hat: '<path d="M3 19h18"/><path d="M6 19 11 3l2 4 5 12"/>',
  flower: '<circle cx="12" cy="9" r="2"/><path d="M12 7c-1-3 2-4 2-1M14 9c3-1 4 2 1 2M12 11c1 3-2 4-2 1M10 9c-3 1-4-2-1-2M12 11v10M12 16c2-2 4-2 5-1"/>',
  feather: '<path d="M20 4C10 4 5 10 5 19"/><path d="M20 4c0 8-6 13-13 13M9 13h5M12 9h5"/>',
  pearl: '<path d="M4 15c3-6 13-6 16 0-3 4-13 4-16 0z"/><circle cx="12" cy="13" r="2.5"/>',
  map: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>',
  candle: '<path d="M9 10h6v11H9z"/><path d="M12 10V7"/><path d="M12 3c1.5 1.5 1.5 3 0 4-1.5-1-1.5-2.5 0-4z"/>',
  fighter: '<path d="M14.5 17.5 3 6V3h3l11.5 11.5"/><path d="M13 19l6-6M16 16l4 4M19 21l2-2"/>',
  rogue: '<path d="M12 2l2.5 4v8h-5V6z"/><path d="M7.5 14h9M12 14v5M10 21.5h4"/>',
  cleric: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
  wizard: '<path d="M12 3l2.2 5.6 5.8.4-4.5 3.8L17 19l-5-3.2L7 19l1.5-6.2L4 9l5.8-.4z"/>',
  ranger: '<path d="M6 3c7 3 7 15 0 18"/><path d="M6 3v18M4 12h14M15 9l3 3-3 3"/>',
  bard: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  paladin: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M12 8v8M8.5 11.5h7"/>',
  barbarian: '<path d="M7 21L17 5"/><path d="M13 4c3-1 6 1 7 4l-3 3c-1-2-3-4-5-4z"/>',
  tavern: '<path d="M4 10l8-6 8 6v10H4z"/><path d="M9 20v-6h6v6"/>',
  board: '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  roster: '<circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14c2.8 0 5 2 5 5"/>',
  bar: '<path d="M6 4h10v14a3 3 0 01-3 3H9a3 3 0 01-3-3z"/><path d="M16 8h2a2 2 0 012 2v3a2 2 0 01-2 2h-2M6 8h10"/>',
  coin: '<circle cx="12" cy="12" r="8"/><path d="M12 7v10M9.5 9.5c0-1 1-1.5 2.5-1.5s2.5.6 2.5 1.7c0 2.6-5 1.3-5 4 0 1.1 1 1.8 2.5 1.8s2.5-.6 2.5-1.6"/>',
  renown: '<path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/>',
  party: '<circle cx="8" cy="9" r="3"/><circle cx="16" cy="9" r="3"/><path d="M2.5 19c.5-3 2.8-5 5.5-5s5 2 5.5 5M10.5 19c.5-3 2.8-5 5.5-5s5 2 5.5 5"/>',
  skull: '<path d="M12 3c-4.4 0-7.5 3-7.5 7 0 2.4 1.2 4 2.5 5v3h10v-3c1.3-1 2.5-2.6 2.5-5 0-4-3.1-7-7.5-7z"/><circle cx="9" cy="11" r="1.5"/><circle cx="15" cy="11" r="1.5"/><path d="M10 18v3M14 18v3"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0112 7.3 4.3 4.3 0 0119.5 10c0 5.4-7.5 10-7.5 10z"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
  scroll: '<path d="M7 4h11v13a3 3 0 01-3 3H6a2 2 0 01-2-2v-2h11v2a2 2 0 002 2"/><path d="M7 4a2 2 0 00-2 2v10M10 8h5M10 12h5"/>',
  dice: '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.2"/><circle cx="15" cy="15" r="1.2"/><circle cx="15" cy="9" r="1.2"/><circle cx="9" cy="15" r="1.2"/>',
};

export function iconPaths(name) {
  return PATHS[name] || '';
}

export function icon(name, cls = 'icon') {
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PATHS[name] || ''}</svg>`;
}
