// Loyalty tiers, from 0 to 5 hearts. mod: added to every roll the hero makes.
// Loyalty rises with triumphs, kept promises in stories, good choices in scenes and dispatches,
// and finished goals. It falls with disasters, unpaid wages and broken trust.
export const LOYALTY_TIERS = [
  { min: 5, key: 'devoted', label: 'Devoted', mod: 1, desc: '+1 to every roll, and once per quest gets back up after falling.' },
  { min: 4, key: 'loyal', label: 'Loyal', mod: 1, desc: '+1 to every roll.' },
  { min: 2, key: 'content', label: 'Content', mod: 0, desc: 'No effect.' },
  { min: 1, key: 'disgruntled', label: 'Disgruntled', mod: -1, desc: '-1 to every roll.' },
  { min: 0, key: 'leaving', label: 'Ready to quit', mod: -1, desc: '-1 to every roll. Quits after a failed quest or a missed payday.' },
];
