// Narrative text for quest tales. Heroes are named, never pronouned (names and pronouns are rolled separately).
// Tokens: {party} all names, {leader}, {a} {b} two party members, {monster}, {items}, {town}

export const DEPARTURES = [
  'Dawn was still grey when {party} shouldered their packs and set out from the Wayfarer\'s Tavern. {leader} took the lead without being asked.',
  '{party} left the tavern to a chorus of half-hearted cheers from the regulars. Someone was already taking wagers on who would come back first.',
  'The road out of the crossroads was muddy and long. {leader} read the job notice one more time, folded it away, and set a brisk pace.',
  'They left at first light. {leader} checked every buckle twice, and nobody teased {leader} about it, because nobody wanted to be the one with a loose strap.',
  'The tavern door banged shut behind {party}. The sign creaked in the wind as if to wish them luck, or to warn them.',
  '{leader} bought a round before they left, "for luck." {party} drank it, paid their tab, and walked out into the morning.',
];

export const SOLO_DEPARTURES = [
  '{leader} set out alone at first light, pack light, steps sure.',
  'Nobody else was needed for this one. {leader} nodded to the barkeep and slipped out into the morning.',
];

export const PACKED = [
  'In the packs: {items}.',
  'The quartermaster had seen them off with {items}.',
];

// [line when the condition bites, line when the right supply cancels it]
export const CONDITION_LINES = {
  night: ['They would be working by night, and every shadow was a question.', 'They would be working by night, but the torches burned bright and steady.'],
  rain: ['Rain came down in grey sheets, soaking cloaks and tempers alike.', 'Rain hammered down, but the oilskin cloaks kept the worst of it out.'],
  cold: ['The cold bit through wool and leather and settled in the bones.', 'It was bitterly cold, but the oilskins and a brisk pace kept them moving.'],
  cursed: ['The ground itself felt wrong underfoot, sour and watchful.', 'The ground felt cursed, but a sprinkle of holy water made it feel a little less hungry.'],
  venom: ['Everyone had heard what the bite of those things could do.', 'Everyone had heard about the venom, which is why everyone had taken the antivenom.'],
  long: ['It was a long road, and the packs felt heavier with every mile.', 'It was a long road, but there was plenty of food in the packs.'],
  fearsFire: ['Old hunters said these creatures feared fire. Nobody had thought to bring any.', 'Old hunters said these creatures feared fire, so the torches stayed lit.'],
};

// Scene-setting before each encounter.
export const ENCOUNTER_INTROS = {
  brambles: ['The trail vanished into a wall of thorn and bramble that stretched as far as anyone could see.', 'Brambles had swallowed the old path whole, thick as a castle wall and twice as rude.'],
  trail: ['Past the last farm, the tracks they were following grew faint and confusing.', 'The trail split, rejoined and split again, as if whatever made it had been in no hurry.'],
  bridge: ['A rope bridge spanned the gorge, its planks grey with age and its ropes creaking in the wind.'],
  strongbox: ['Half-buried under leaves lay an iron strongbox with a very old, very stubborn lock.'],
  shrine: ['A forgotten shrine stood in a clearing, its candles still burning, though nobody had lit them.'],
  ambush: ['The road narrowed between two rocky banks. It was quiet. Far too quiet.', 'Fresh boot prints in the mud, then none at all. Someone was waiting.'],
  toll: ['A barricade of carts blocked the road, and the people behind it wanted coin.'],
  cave: ['The only way forward led into a cave mouth, black and cold and smelling of something alive.'],
  river: ['The river had broken its banks, brown water racing where the ford should have been.'],
  march: ['The next stretch was long, open and pitiless, with nowhere to rest and nothing to see.'],
  ward: ['Glowing sigils hung in the air across the path, humming like a nest of angry wasps.'],
  villagers: ['A village came into view. Its people watched them come with frightened, guarded eyes.'],
  map: ['In a ruined hut they found a faded map pinned to the wall with a rusted knife.'],
  carvings: ['Strange carvings covered a standing stone, worn by centuries of rain but still unsettling.'],
  fightWolves: ['Yellow eyes in the gloom. Then more. The {monster} had been following them for an hour.', 'A howl went up, close, then answered from three directions at once.'],
  fightBandits: ['Figures stepped out of the trees with drawn steel. A {monster}, and they had been waiting.', '"Your purses or your lives," said the leader of the {monster}. "We are not fussy about the order."'],
  fightSpider: ['Silk glistened everywhere. Something huge shifted in the webs above: a {monster}.'],
  fightDead: ['The barrow earth split, and the {monster} clawed their way up into the moonlight.', 'Cold fingers of mist curled over the graves. Then the graves opened.'],
  fightHorror: ['The brambles themselves stood up. The {monster} was taller than a house and furious about it.'],
  fightBoar: ['The ground shook. The {monster} burst from the undergrowth, tusks lowered and eyes red.'],
};

// Travel between encounters. Tag lists foreshadow what comes next.
export const TRAVEL = {
  any: [
    'The trail wound on through birch and bracken. Somewhere ahead, a crow kept count of them.',
    'They stopped at midday in a hollow out of the wind and ate cold bread by a small, careful fire.',
    'Hours passed in the steady rhythm of boots on dirt.',
    'A milestone, half-sunk in moss, told them they were further from home than anyone had admitted.',
    'The light changed, the woods thickened, and the conversation dried up the way it does before trouble.',
    'They passed a burned-out cart by the roadside. Nobody said anything. Everybody walked a little faster.',
    'A farmer leaning on a gate watched them pass and shook their head slowly, which was not encouraging.',
  ],
  dark: ['The way grew dim, the trees closing overhead like a roof.'],
  water: ['They heard the river long before they saw it.'],
  heights: ['The path began to climb, and then kept climbing.'],
  undead: ['The birds stopped singing. That was the first sign.'],
  magic: ['The air began to taste of copper and old lightning.'],
  beast: ['Tracks crossed the path: big ones, still sharp-edged in the mud.'],
  spider: ['Strands of silk drifted across the path, catching the light.'],
  social: ['Smoke from village chimneys rose ahead.'],
};

export const CAMPS = [
  'That night they camped under a sky thick with stars, and {a} kept first watch.',
  'They made camp in the lee of a fallen oak. {a} cooked; {b} complained about the cooking; everyone ate it anyway.',
  'Rain drummed on the oilcloth all night. Nobody slept much.',
];

export const BANTER = {
  friends: [
    '{a} and {b} traded old stories along the way, laughing at the same parts as always.',
    '{a} shared the last of the dried apples with {b} without being asked.',
    '{a} and {b} walked side by side in the comfortable silence of people who trust each other.',
  ],
  rivals: [
    '{a} and {b} argued about the route for an hour. Both of them were wrong.',
    '{a} made a point of walking ahead of {b}. {b} made a point of noticing.',
    '{b} muttered something about {a}\'s sword arm. {a} heard every word.',
  ],
  neutral: [
    '{a} asked {b} where they learned to fight. The answer took a mile and got taller in the telling.',
    '{b} taught {a} a marching song with far too many verses.',
    '{a} and {b} discovered they hate the same bard, and became a little friendlier for it.',
    '{a} and {b} played a game of guess-the-bird. {a} lost badly and demanded a rematch.',
  ],
  solo: [
    '{a} talked to the horse for a while, then remembered there was no horse.',
    '{a} whistled to fill the silence.',
  ],
};

// A party member with this quirk can get one of these lines.
export const QUIRK_BANTER = {
  drinks: '{a} produced a flask "for emergencies." The emergency turned out to be boredom.',
  greedy: '{a} kept a running tally of what the job would pay, out loud, for most of the morning.',
  afraidDark: '{a} insisted on walking in the middle of the group, and nobody argued.',
  bookworm: '{a} read while walking and tripped twice.',
  hothead: '{a} picked a fight with a signpost and, after a struggle, won.',
  lucky: '{a} found a silver coin on the road, which surprised nobody at all.',
  keenEyed: '{a} spotted a hawk\'s nest a mile off and would not stop pointing at it.',
  clumsy: '{a} fell into a ditch. It was only a small ditch.',
  silverTongue: '{a} talked a passing tinker out of a pie.',
  arachnophobe: '{a} checked every bush for spiders. There were spiders.',
  nightOwl: '{a} seemed to come alive as the sun went down.',
  fearless: '{a} walked straight past a sign reading "Turn back." Twice.',
  acrophobe: '{a} looked at the hills ahead and went a little green.',
};

export const EPILOGUES = {
  triumph: [
    '{party} walked back into the Wayfarer\'s Tavern to applause, and for once nobody exaggerated the story. They did not need to.',
    'The road home felt short. By the time the tavern came into sight, {leader} had the whole tale polished and ready to tell.',
  ],
  success: [
    '{party} returned dusty and satisfied, the job done and the pay earned.',
    'They came home tired, a little bruised and pleased with themselves, and ordered the good ale.',
  ],
  costly: [
    '{party} limped home. The job was done, but it had taken more than it should have.',
    'The walk home was quiet. Nobody talked about the parts that went wrong.',
  ],
  failure: [
    '{party} came back with less than they left with, and they knew it.',
    'The common room went quiet when they walked in. Their faces said enough.',
  ],
  disaster: [
    'They straggled home in the dark, carrying each other. The regulars made room by the fire without a word.',
    'It was the kind of night that makes adventurers think seriously about farming.',
  ],
};
