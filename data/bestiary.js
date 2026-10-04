// Bestiary lore and knowledge thresholds. Defeating a kind of monster enough times
// teaches every party how to fight it.
export const KNOWLEDGE = [
  { at: 1, label: 'Encountered', attack: 0 },
  { at: 3, label: 'Studied', attack: 1 },
  { at: 10, label: 'Mastered', attack: 2 },
];

export const BESTIARY = {
  wolves: [
    'Grey wolves hunt in packs of five to nine, led by the oldest female.',
    'They test a party before they strike, circling for hours. The patient ones live longest.',
    'A wolf pack will not cross a line of fire, but it will wait on the other side of it.',
  ],
  bandits: [
    'Most cutthroats are farmers who lost a bad harvest and found a good knife.',
    'They wear red scarves to look like one company. Most have never met their supposed captain.',
    'Bandits break and run once their leader falls. Strike the loudest one first.',
  ],
  spider: [
    'Giant spiders spin webs strong enough to hold a horse, and patient enough to wait for one.',
    'Their venom numbs before it burns. Victims rarely feel the first bite.',
    'They hate smoke, cold and the smell of vinegar, in that order.',
  ],
  dead: [
    'The restless dead rise where burial rites were left unfinished.',
    'They remember fragments of their old lives: a song, a grudge, a name.',
    'Holy water does not destroy them. It reminds them they are supposed to be asleep.',
  ],
  horror: [
    'Bramble horrors grow where wild magic soaks into old hedgerows.',
    'A horror\'s heartwood keeps growing after it falls. Burn it, or it will be back by spring.',
    'They can be reasoned with, briefly, by anyone who speaks fluent Hedge.',
  ],
  boar: [
    'Great boars grow larger every year they live, and the oldest are the size of carts.',
    'A charging boar turns badly. Step aside at the last moment.',
    'Farmers say a great boar remembers every hunter who ever hurt it.',
  ],
};
