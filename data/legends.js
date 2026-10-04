// Legendary heroes: named, hand-written adventurers the tavern owner hunts down.
// A rumor names them; a trail of deeds proves the tavern worthy; a recruitment quest wins them over.
// trail: { type: 'slay', target, n } | { type: 'template', target, n } | { type: 'won', tier, n } | { type: 'triumph', n }
// signature: same effect fields as talents. minRank: tavern rank index before the rumor can arrive.
// Story text uses names only.
export const LEGENDS = {
  vessa: {
    name: 'Vessa Thornwild', epithet: 'Hunter of the Deep Wood', ancestry: 'elf', cls: 'ranger', minRank: 0,
    abilities: { str: 12, dex: 19, con: 14, int: 12, wis: 17, cha: 10 }, quirks: ['keenEyed', 'beastFriend'], background: 'hunter',
    signature: { name: 'Thornwood\'s chosen', desc: 'Advantage against beasts and in dark places; +2 Survival.', adv: ['beast', 'dark'], mods: { Survival: 2 } },
    bio: 'Raised by wardens in the deep wood, Vessa knows every trail in the Thornwood, and some that are not on any map.',
    rumor: 'A trapper swears an elf in a green cloak saved him from a wolf pack, then vanished between the trees. "Vessa," he says. "She only works with hunters who prove themselves."',
    trail: { type: 'slay', target: 'wolves', n: 2, text: 'Drive off wolf packs twice' },
    quest: { title: 'The white hart', blurb: 'Vessa has agreed to meet your company at the white hart\'s glade, but the wolves will get there first.', pool: ['trail', 'brambles', 'cave'], count: [2, 2], finale: 'fightWolves', party: [2, 4], tier: 1 },
    join: 'Vessa watched your company fight, nodded once, and followed them home. She has taken the bed nearest the window.',
  },
  kaelen: {
    name: 'Kaelen Ashblade', epithet: 'the Exile Knight', ancestry: 'human', cls: 'fighter', minRank: 0,
    abilities: { str: 19, dex: 14, con: 17, int: 10, wis: 12, cha: 13 }, quirks: ['fearless', 'tough'], background: 'knight',
    signature: { name: 'Ashblade style', desc: 'Attacks twice each round; +1 to attack rolls.', flag: 'extraAttack', attackMod: 1 },
    bio: 'A knight who refused an unjust order and was stripped of name and lands. The ash on the blade is from the order\'s burned banner.',
    rumor: 'A drover talks of a knight with a scorched blade who has been clearing bandits off the salt road alone, for no pay. "Says he will fight beside any company that keeps the road safe."',
    trail: { type: 'slay', target: 'bandits', n: 3, text: 'Defeat bands of cutthroats three times' },
    quest: { title: 'Duel on the burning bridge', blurb: 'Kaelen is holding a burning bridge against an entire bandit company. Help him, and he is yours.', pool: ['ambush', 'march', 'bridge'], count: [2, 2], finale: 'fightBandits', party: [2, 4], tier: 2 },
    join: 'Kaelen sheathed the ash-black blade and offered your company his oath. He polishes it every night by the fire.',
  },
  sable: {
    name: 'Sable Quickfingers', epithet: 'Prince of Thieves', ancestry: 'halfling', cls: 'rogue', minRank: 1,
    abilities: { str: 9, dex: 20, con: 13, int: 16, wis: 13, cha: 16 }, quirks: ['lucky', 'silverTongue'], background: 'smuggler',
    signature: { name: 'Prince\'s touch', desc: 'Sneak attack deals 3d6; +3 Sleight of Hand and +2 Stealth.', flag: 'sneakPlus', mods: { 'Sleight of Hand': 3, Stealth: 2 } },
    bio: 'Nobody knows Sable\'s real name. Every guard captain in three towns knows Sable\'s handwriting.',
    rumor: 'A note was left on your bar, in very neat handwriting: "Bring me back two lost caravans and I will consider working for you. Yours, S."',
    trail: { type: 'template', target: 'caravan', n: 2, text: 'Recover the missing caravan twice' },
    quest: { title: 'The masked auction', blurb: 'Sable will join whichever company steals the Baron\'s ledger at tonight\'s masked auction. Others are trying too.', pool: ['villagers', 'strongbox', 'toll'], count: [2, 3], finale: 'fightBandits', party: [2, 3], tier: 2 },
    join: 'Sable appeared at the bar as if they had always been there, holding the Baron\'s ledger and your purse. They gave back the purse.',
  },
  brannoc: {
    name: 'Brannoc Ironvow', epithet: 'the Last Shieldbearer', ancestry: 'dwarf', cls: 'paladin', minRank: 1,
    abilities: { str: 18, dex: 10, con: 18, int: 11, wis: 14, cha: 15 }, quirks: ['fearless', 'tough'], background: 'soldier',
    signature: { name: 'Last of the shieldwall', desc: '+2 armor class; advantage against the dead.', ac: 2, adv: ['undead'] },
    bio: 'The last of a dwarven order sworn to keep the dead in their graves. He has been doing the job alone for thirty years.',
    rumor: 'Gravediggers whisper of a dwarf in iron who walks from barrow to barrow, putting the dead back to sleep. "He watches the companies who fight them."',
    trail: { type: 'slay', target: 'dead', n: 2, text: 'Lay the restless dead to rest twice' },
    quest: { title: 'The siege of Cairn Hollow', blurb: 'Brannoc is holding Cairn Hollow against a rising of the dead. He sent word: "Come if you are brave."', pool: ['carvings', 'shrine', 'cave'], count: [2, 3], finale: 'fightDead', party: [3, 4], tier: 2 },
    join: 'Brannoc set his scarred shield beside your door and said, "This is a good place to defend." He has not moved it since.',
  },
  orla: {
    name: 'Orla Stormcaller', epithet: 'the Weather-Witch', ancestry: 'human', cls: 'wizard', minRank: 1,
    abilities: { str: 8, dex: 14, con: 14, int: 20, wis: 15, cha: 13 }, quirks: ['bookworm', 'nightOwl'], background: 'apprentice',
    signature: { name: 'Stormcalling', desc: 'Spells deal 2d10; advantage in magical places.', flag: 'bigSpell', adv: ['magic'] },
    bio: 'Orla learned magic from the hedge-wizard of the tower, then outgrew her. Thunderstorms follow her moods.',
    rumor: 'Lightning struck the same hill three nights running. Villagers say a witch named Orla lives there and tests anyone who climbs it. "Show her you can handle the tower."',
    trail: { type: 'template', target: 'tower', n: 1, text: 'Brave the hedge-wizard\'s tower' },
    quest: { title: 'The storm at Kettlewick Tor', blurb: 'Orla\'s test: reach the top of Kettlewick Tor through a storm she is not holding back.', pool: ['ward', 'bridge', 'carvings'], count: [2, 3], finale: 'fightHorror', party: [2, 4], tier: 2 },
    join: 'Orla walked in out of a sudden downpour, dried instantly, and asked which room had the best view of the sky.',
  },
  grak: {
    name: 'Grak', epithet: 'the Unbowed', ancestry: 'orc', cls: 'barbarian', minRank: 2,
    abilities: { str: 20, dex: 14, con: 19, int: 9, wis: 12, cha: 11 }, quirks: ['tough', 'hothead'], background: 'soldier',
    signature: { name: 'Unbowed', desc: '+10 max HP; takes 2 less damage from every hit.', hp: 10, flag: 'damageResist' },
    bio: 'Champion of the fighting pits of Brackenridge, Grak walked out of the arena one day and never went back.',
    rumor: 'The pit-masters of Brackenridge are offering a fortune to anyone who can bring back their champion, Grak. Grak has let it be known he will only follow "a company of real winners."',
    trail: { type: 'triumph', n: 3, text: 'Win three triumphs' },
    quest: { title: 'The pit of Brackenridge', blurb: 'Grak wants to see your best fight the beast the pit-masters are keeping for him.', pool: ['villagers', 'march'], count: [1, 2], finale: 'fightBoar', party: [2, 4], tier: 3 },
    join: 'Grak lifted the tavern\'s heaviest table over his head, put it down gently, and said, "Good. I stay."',
  },
  mirael: {
    name: 'Mother Mirael', epithet: 'Saint of the Roadside', ancestry: 'human', cls: 'cleric', minRank: 2,
    abilities: { str: 12, dex: 10, con: 16, int: 13, wis: 20, cha: 16 }, quirks: ['fearless', 'keenEyed'], background: 'acolyte',
    signature: { name: 'Roadside saint', desc: 'Heals twice per quest; +3 Medicine and +1 to every roll.', flag: 'healPlus', mods: { Medicine: 3 }, rollMod: 1 },
    bio: 'Mirael has walked the roads for forty years, healing anyone who asks and many who do not.',
    rumor: 'Pilgrims say Mother Mirael is looking for a company with a good heart and a long record. "Six honest jobs well done," she told them. "Then I will come and see."',
    trail: { type: 'won', tier: 1, n: 6, text: 'Complete six quests successfully' },
    quest: { title: 'The plague cart', blurb: 'Mirael is escorting a cart of the sick through country where the dead walk. She asked for your company by name.', pool: ['march', 'villagers', 'shrine'], count: [2, 3], finale: 'fightDead', party: [2, 4], tier: 2 },
    join: 'Mother Mirael set down her pack, blessed the kitchen, and told the cook to put more garlic in everything.',
  },
  fennick: {
    name: 'Fennick Brightstring', epithet: 'Last Bard of Oakhallow', ancestry: 'gnome', cls: 'bard', minRank: 2,
    abilities: { str: 8, dex: 16, con: 13, int: 15, wis: 12, cha: 20 }, quirks: ['silverTongue', 'lucky'], background: 'entertainer',
    signature: { name: 'Oakhallow\'s song', desc: 'Inspires twice per quest with 1d8; +3 Persuasion and Performance.', flag: 'inspirePlus', mods: { Persuasion: 3, Performance: 3 } },
    bio: 'When Oakhallow went silent, Fennick was the only one left who knew its songs. They mean to sing them somewhere worth singing.',
    rumor: 'A traveling player says Fennick Brightstring is looking for a tavern famous enough to deserve the songs of Oakhallow. "Four hard jobs, and not the easy kind."',
    trail: { type: 'won', tier: 2, n: 4, text: 'Complete four risky or deadly quests successfully' },
    quest: { title: 'The silent festival', blurb: 'Oakhallow\'s festival has been silent for years. Something in the old orchard is keeping it that way.', pool: ['villagers', 'brambles', 'carvings'], count: [2, 3], finale: 'fightHorror', party: [2, 4], tier: 2 },
    join: 'Fennick tuned up by the hearth, played the first song of Oakhallow, and the whole tavern went quiet to listen.',
  },
};

export const LEGEND_IDS = Object.keys(LEGENDS);
export const RUMOR_CHANCE = 0.3;      // per completed quest, while a legend is still unheard of
export const FIRST_RUMOR_AFTER = 3;   // the first rumor is guaranteed after this many quests
