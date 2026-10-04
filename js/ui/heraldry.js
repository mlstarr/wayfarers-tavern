// Procedural coat of arms: placeholder card art until the portrait system (M8).
import { Rng } from '../rng.js';
import { iconPaths } from './icons.js';

const METALS = ['#e9dfc6', '#d8a93a'];                                     // argent, or
const COLOURS = ['#9b2c2c', '#24508f', '#2f6a45', '#5c3b7d', '#2a2522'];   // gules, azure, vert, purpure, sable
const DIVISIONS = ['plain', 'pale', 'fess', 'bend', 'chevron', 'quarterly', 'saltire', 'chief'];
const SHIELD = 'M10 6h80v42c0 24-18 40-40 46C28 88 10 72 10 48z';

function field(div, a, b) {
  switch (div) {
    case 'pale': return `<rect x="50" y="0" width="50" height="100" fill="${b}"/>`;
    case 'fess': return `<rect x="0" y="34" width="100" height="26" fill="${b}"/>`;
    case 'bend': return `<path d="M0 10 L10 0 L100 90 L90 100 Z" fill="${b}" transform="scale(1.1)"/>`;
    case 'chevron': return `<path d="M0 78 L50 36 L100 78 L100 96 L50 54 L0 96 Z" fill="${b}"/>`;
    case 'quarterly': return `<rect x="50" y="0" width="50" height="50" fill="${b}"/><rect x="0" y="50" width="50" height="50" fill="${b}"/>`;
    case 'saltire': return `<path d="M0 0h14l86 86v14h-14L0 14zM100 0v14L14 100H0V86L86 0z" fill="${b}"/>`;
    case 'chief': return `<rect x="0" y="0" width="100" height="30" fill="${b}"/>`;
    default: return '';
  }
}

export function shieldSvg(seed, clsId) {
  const rng = new Rng(seed ^ 0x5eed);
  const metalFirst = rng.chance(0.5);
  const metal = rng.pick(METALS);
  const colour = rng.pick(COLOURS);
  const [a, b] = metalFirst ? [metal, colour] : [colour, metal];
  const div = rng.pick(DIVISIONS);
  // The charge sits on the plain field; use the contrasting tincture.
  const charge = div === 'plain' ? b : (rng.chance(0.5) ? a : b);
  const ring = charge === a ? b : a;
  const id = `s${seed}`;
  return `<svg class="shield" viewBox="0 0 100 100" aria-hidden="true">
    <defs><clipPath id="${id}"><path d="${SHIELD}"/></clipPath></defs>
    <g clip-path="url(#${id})"><rect width="100" height="100" fill="${a}"/>${field(div, a, b)}</g>
    <circle cx="50" cy="47" r="19" fill="${ring}" opacity="${div === 'plain' ? 0 : 0.92}"/>
    <g transform="translate(34 31) scale(1.33)" fill="none" stroke="${charge}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconPaths(clsId)}</g>
    <path d="${SHIELD}" fill="none" stroke="#1b130c" stroke-width="3"/>
  </svg>`;
}
