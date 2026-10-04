// tone: good | bad | mixed
// mods: bonus to a skill or ability (e.g. { Perception: 2, dex: -1 })
// adv / dis: encounter tags where this adventurer rolls with advantage / disadvantage
// hp: change to max HP. special: handled by name in js/
export const QUIRKS = {
  lucky: { name: 'Lucky', tone: 'good', desc: 'Rerolls one natural 1 per quest.', special: 'lucky' },
  keenEyed: { name: 'Keen-eyed', tone: 'good', desc: '+2 Perception, +1 Investigation.', mods: { Perception: 2, Investigation: 1 } },
  silverTongue: { name: 'Silver tongue', tone: 'good', desc: '+2 Persuasion and Deception.', mods: { Persuasion: 2, Deception: 2 } },
  tough: { name: 'Tough as boots', tone: 'good', desc: '+4 max HP.', hp: 4 },
  fearless: { name: 'Fearless', tone: 'good', desc: 'Advantage against the dead.', adv: ['undead'] },
  nightOwl: { name: 'Night owl', tone: 'good', desc: 'Advantage in dark places.', adv: ['dark'] },
  beastFriend: { name: 'Beast friend', tone: 'good', desc: 'Advantage against beasts.', adv: ['beast'] },
  swimmer: { name: 'Strong swimmer', tone: 'good', desc: 'Advantage around water.', adv: ['water'] },
  quick: { name: 'Quick on their feet', tone: 'good', desc: '+2 Acrobatics.', mods: { Acrobatics: 2 } },
  greedy: { name: 'Greedy', tone: 'mixed', desc: 'Party earns 10% more gold. -1 Insight.', special: 'greedy', mods: { Insight: -1 } },
  drinks: { name: 'Drinks too much', tone: 'mixed', desc: '+2 Persuasion, -2 Perception.', mods: { Persuasion: 2, Perception: -2 } },
  bookworm: { name: 'Bookworm', tone: 'mixed', desc: '+2 Arcana and History, -1 Athletics.', mods: { Arcana: 2, History: 2, Athletics: -1 } },
  hothead: { name: 'Hothead', tone: 'mixed', desc: '+2 Intimidation, -2 Persuasion.', mods: { Intimidation: 2, Persuasion: -2 } },
  afraidDark: { name: 'Afraid of the dark', tone: 'bad', desc: 'Disadvantage in dark places.', dis: ['dark'] },
  acrophobe: { name: 'Hates heights', tone: 'bad', desc: 'Disadvantage at heights.', dis: ['heights'] },
  arachnophobe: { name: 'Terrified of spiders', tone: 'bad', desc: 'Disadvantage against spiders.', dis: ['spider'] },
  clumsy: { name: 'Clumsy', tone: 'bad', desc: '-2 Acrobatics and Stealth.', mods: { Acrobatics: -2, Stealth: -2 } },
  frail: { name: 'Frail', tone: 'bad', desc: '-3 max HP.', hp: -3 },
  superstitious: { name: 'Superstitious', tone: 'bad', desc: 'Disadvantage in magical places.', dis: ['magic'] },
};

export const QUIRK_IDS = Object.keys(QUIRKS);
