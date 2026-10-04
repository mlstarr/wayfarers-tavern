// Tunable constants. `?fast` in the URL makes one game-minute last one real second.
const params = typeof location !== 'undefined'
  ? new URLSearchParams(location.search)
  : new URLSearchParams();

export const FAST = params.has('fast');
export const TIME_SCALE = FAST ? 60 : 1;
export const MIN = 60000 / TIME_SCALE; // one game-minute in ms

export const START_GOLD = 60;
export const ROSTER_CAP = 8;

export const BOARD_SIZE = 6;            // postings on the board at once
export const REFILL_MIN = 20;           // game-minutes until a taken or expired posting is replaced
export const POSTING_LIFE = [240, 480]; // game-minutes a posting stays up
export const EXPEDITION_CHANCE = 0.3;   // chance a new posting is an expedition (max one on the board)

// Early-game pacing: quest lengths, refills, resting and scenes are scaled down
// until the player has sent this many quests. The first jobs finish in under a minute.
export const PACE_STAGES = [
  { sent: 0, scale: 0.12 },
  { sent: 3, scale: 0.3 },
  { sent: 8, scale: 0.6 },
  { sent: 15, scale: 1 },
];
export const EXPEDITION_MIN_STAGE = 2;

export const BAR_SIZE = 3;              // recruits per day
export const REST_FRACTION = 0.1;       // share of max HP regained per REST_MIN game-minutes
export const REST_MIN = 10;
export const TIER_RENOWN = [0, 10, 40]; // renown needed to see tier 1, 2, 3 quests

export const SCENE_EVERY = 90;          // game-minutes between chances of a common-room scene
export const SCENE_CHANCE = 0.75;
export const SCENE_MAX = 3;

export const MAX_LOYALTY = 5;
export const START_LOYALTY = 2;

export const REPORT_ARCHIVE = 25;
export const LOG_SIZE = 30;
