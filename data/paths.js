// Paths: at level 3 every hero chooses one of their class's three paths. The path's first
// feature comes with the choice; the second arrives at level 6 and the third at level 9.
// Features use the same effect fields as talents (see js/talent-text.js).
export const PATH_LEVEL = 3;
export const PATH_RANK_LEVELS = [3, 6, 9];

export const PATHS = {
  fighter: [
    { id: 'champion', name: 'Champion', line: 'Wants to be the best there is. Is getting there.', ranks: [
      { name: 'Improved critical', crit: 1 },
      { name: 'Remarkable athlete', mods: { Athletics: 2, str: 1, dex: 1, con: 1 } },
      { name: 'Superior critical', crit: 1, dmg: 2 },
    ] },
    { id: 'warden', name: 'Warden', line: 'Stands between the party and whatever wants them dead.', ranks: [
      { name: 'Protector', aura: { ac: 1 } },
      { name: 'Hold the line', taunt: true, resist: 2 },
      { name: 'Unbreakable wall', special: 'unbroken', aura: { ac: 1 } },
    ] },
    { id: 'battlemaster', name: 'Battle master', line: 'Reads a fight like a map and shouts the directions.', ranks: [
      { name: 'Commander\'s strike', aura: { attack: 1 } },
      { name: 'Precision attack', attackMod: 2 },
      { name: 'Rally the line', aura: { roll: 1 }, perkUses: 1 },
    ] },
  ],
  rogue: [
    { id: 'thief', name: 'Thief', line: 'Every lock is a question. Every pocket is an answer.', ranks: [
      { name: 'Fast hands', mods: { 'Sleight of Hand': 3, Investigation: 2 } },
      { name: 'Second-story work', adv: ['heights'], mods: { Athletics: 2, Acrobatics: 2 } },
      { name: 'Thief\'s eye', aura: { gold: 0.2 } },
    ] },
    { id: 'shadowblade', name: 'Shadowblade', line: 'The first anyone knows of them is the knife.', ranks: [
      { name: 'Ambusher', firstStrike: true, sneak: 1 },
      { name: 'Strike from nowhere', aura: { ambush: true } },
      { name: 'Death strike', crit: 1, sneak: 2 },
    ] },
    { id: 'swashbuckler', name: 'Swashbuckler', line: 'Fights with a grin, a flourish and a running commentary.', ranks: [
      { name: 'Fancy footwork', ac: 2, mods: { Acrobatics: 2 } },
      { name: 'Rakish audacity', adv: ['social'], mods: { Persuasion: 2, Intimidation: 2 } },
      { name: 'Master duelist', flag: 'extraAttack', retaliate: true },
    ] },
  ],
  cleric: [
    { id: 'life', name: 'Life domain', line: 'Nobody dies on their watch. Nobody.', ranks: [
      { name: 'Disciple of life', healBonus: 4 },
      { name: 'Blessed healer', perkUses: 1 },
      { name: 'Supreme healing', healBonus: 4, aura: { heal: 2 } },
    ] },
    { id: 'war', name: 'War domain', line: 'Prays with both hands on the mace.', ranks: [
      { name: 'Guided strike', attackMod: 2 },
      { name: 'Divine strike', dmg: 3 },
      { name: 'Avatar of battle', flag: 'extraAttack', resist: 2 },
    ] },
    { id: 'light', name: 'Light domain', line: 'Carries the dawn into places that have forgotten it.', ranks: [
      { name: 'Warding flare', aura: { foeAtk: -1 } },
      { name: 'Radiance of the dawn', dmgVs: { undead: 5, dark: 2 }, adv: ['dark'] },
      { name: 'Corona of light', aura: { foeAc: -1, finale: 1 } },
    ] },
  ],
  wizard: [
    { id: 'evoker', name: 'School of evocation', line: 'Believes most problems are improved by fire.', ranks: [
      { name: 'Sculpted spells', dmg: 2 },
      { name: 'Empowered evocation', dmg: 3 },
      { name: 'Overchannel', flag: 'bigSpell', crit: 1 },
    ] },
    { id: 'abjurer', name: 'School of abjuration', line: 'The best spell is the one that means nobody bleeds.', ranks: [
      { name: 'Arcane ward', ac: 2, hp: 5 },
      { name: 'Projected ward', aura: { resist: 1 } },
      { name: 'Spell resistance', aura: { ac: 1 }, resist: 2 },
    ] },
    { id: 'diviner', name: 'School of divination', line: 'Already knows how this ends. Won\'t say.', ranks: [
      { name: 'Foresight', aura: { skill: 1 } },
      { name: 'Portent', special: 'lucky', mods: { Insight: 2, Perception: 2, Investigation: 2 } },
      { name: 'The third eye', aura: { ambush: true }, adv: ['dark'] },
    ] },
  ],
  ranger: [
    { id: 'hunter', name: 'Hunter', line: 'Picks a quarry and does not stop.', ranks: [
      { name: 'Colossus slayer', dmg: 2, atkVs: { beast: 1 } },
      { name: 'Volley', flag: 'extraAttack' },
      { name: 'Superior defense', resist: 2, flag: 'evasion' },
    ] },
    { id: 'beastmaster', name: 'Beast master', line: 'Never travels alone. The companion has opinions.', ranks: [
      { name: 'Animal companion', companion: 1, desc: 'A loyal animal fights alongside them, attacking each round for 1d6.' },
      { name: 'Exceptional training', companion: 1, mods: { Survival: 2 }, desc: 'The companion now hits for 1d10. +2 Survival.' },
      { name: 'Bestial fury', companion: 1, desc: 'The companion attacks twice each round.' },
    ] },
    { id: 'gloomstalker', name: 'Gloom stalker', line: 'At home where the torchlight gives out.', ranks: [
      { name: 'Dread ambusher', firstStrike: true, adv: ['dark'] },
      { name: 'Umbral sight', mods: { Stealth: 3, wis: 1 }, dmgVs: { dark: 3 } },
      { name: 'Stalker\'s flurry', crit: 1, aura: { ambush: true } },
    ] },
  ],
  bard: [
    { id: 'lore', name: 'College of lore', line: 'Knows a story about everything, and a weakness for most things.', ranks: [
      { name: 'Cutting words', aura: { foeAtk: -1 } },
      { name: 'Peerless lore', mods: { Arcana: 2, History: 2, Religion: 2, Investigation: 2 } },
      { name: 'Peerless skill', aura: { skill: 2 } },
    ] },
    { id: 'valor', name: 'College of valor', line: 'Writes the war songs. Also fights in the wars.', ranks: [
      { name: 'Battle hymn', aura: { attack: 1 } },
      { name: 'Extra attack', flag: 'extraAttack' },
      { name: 'Battle magic', dmg: 3, perkUses: 1 },
    ] },
    { id: 'glamour', name: 'College of glamour', line: 'Crowds follow them. So do creditors.', ranks: [
      { name: 'Enthralling performance', adv: ['social'], mods: { Performance: 3 }, aura: { gold: 0.1 } },
      { name: 'Mantle of majesty', aura: { finale: 1 }, inspireBonus: 2 },
      { name: 'Unbreakable majesty', special: 'unbroken', aura: { finale: 1 } },
    ] },
  ],
  paladin: [
    { id: 'devotion', name: 'Oath of devotion', line: 'Honest, decent and unbearably sincere.', ranks: [
      { name: 'Sacred weapon', attackMod: 2 },
      { name: 'Aura of devotion', aura: { adv: ['undead'] } },
      { name: 'Holy nimbus', aura: { heal: 3 }, dmgVs: { undead: 4 } },
    ] },
    { id: 'vengeance', name: 'Oath of vengeance', line: 'Has a list. Is working through it.', ranks: [
      { name: 'Vow of enmity', adv: ['finale'] },
      { name: 'Relentless avenger', bloodied: { attack: 2, dmg: 3 } },
      { name: 'Avenging angel', aura: { foeAc: -1 }, crit: 1 },
    ] },
    { id: 'ancients', name: 'Oath of the ancients', line: 'Swore to protect the green and growing world.', ranks: [
      { name: 'Aura of warding', aura: { resist: 1 }, adv: ['magic'] },
      { name: 'Undying sentinel', special: 'unbroken' },
      { name: 'Elder champion', aura: { heal: 2 }, hp: 10 },
    ] },
  ],
  barbarian: [
    { id: 'berserker', name: 'Path of the berserker', line: 'Goes somewhere else when the fighting starts.', ranks: [
      { name: 'Frenzy', dmg: 3, fatigue: 1 },
      { name: 'Mindless rage', fearless: true },
      { name: 'Retaliation', retaliate: true, lifesteal: 2 },
    ] },
    { id: 'totem', name: 'Path of the totem', line: 'Bear for strength, wolf for the pack, eagle for the sky.', ranks: [
      { name: 'Bear totem', resist: 3 },
      { name: 'Wolf totem', aura: { attack: 1 } },
      { name: 'Eagle totem', adv: ['heights'], mods: { Perception: 3 }, firstStrike: true },
    ] },
    { id: 'zealot', name: 'Path of the zealot', line: 'The gods are watching, and they like a show.', ranks: [
      { name: 'Divine fury', dmg: 2, dmgVs: { undead: 3 } },
      { name: 'Fanatical focus', rollMod: 1 },
      { name: 'Rage beyond death', special: 'unbroken', hp: 10 },
    ] },
  ],
};

// Each rank becomes a talent: id `${pathId}${rank}` (for example champion1).
export const PATH_TALENTS = {};
for (const [cls, paths] of Object.entries(PATHS)) {
  for (const p of paths) {
    p.ranks.forEach((r, i) => {
      PATH_TALENTS[`${p.id}${i + 1}`] = { ...r, src: 'path', path: p.id, rank: i + 1, classes: [cls] };
    });
  }
}

export function pathOf(id) {
  for (const paths of Object.values(PATHS)) {
    const p = paths.find((x) => x.id === id);
    if (p) return p;
  }
  return null;
}
