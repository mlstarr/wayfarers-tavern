// Base stats for a tier-1 fight with a party of two. js/quests.js scales them
// by quest tier and party size. attacks: enemy attacks per round.
export const MONSTERS = {
  wolves: { name: 'grey wolf pack', ac: 13, hp: 22, atk: 4, dmg: '1d6+2', attacks: 2, tags: ['beast'] },
  bandits: { name: 'band of cutthroats', ac: 12, hp: 24, atk: 3, dmg: '1d6+1', attacks: 2, tags: [] },
  spider: { name: 'giant spider', ac: 14, hp: 26, atk: 5, dmg: '1d8+3', attacks: 1, tags: ['beast', 'spider', 'dark'] },
  dead: { name: 'restless dead', ac: 13, hp: 28, atk: 4, dmg: '1d6+2', attacks: 2, tags: ['undead', 'dark'] },
  horror: { name: 'bramble horror', ac: 12, hp: 32, atk: 4, dmg: '2d6', attacks: 1, tags: ['magic'] },
  boar: { name: 'great tusked boar', ac: 11, hp: 26, atk: 4, dmg: '1d8+2', attacks: 1, tags: ['beast'] },
};
