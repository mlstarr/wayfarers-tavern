// Tunable constants. `?fast` in the URL makes one game-minute last one real second.
const params = typeof location !== 'undefined'
  ? new URLSearchParams(location.search)
  : new URLSearchParams();

export const FAST = params.has('fast');
export const TIME_SCALE = FAST ? 60 : 1;
export const MIN = 60000 / TIME_SCALE; // one game-minute in ms

export const START_GOLD = 60;
export const ROSTER_CAP = 8;
export const BOARD_SIZE = 5;          // postings per board refresh
export const BOARD_HOURS = 6;         // board refreshes every 6 real hours
export const BAR_SIZE = 3;            // recruits per day
export const REST_FRACTION = 0.1;     // share of max HP regained per 30 game-minutes
export const TIER_RENOWN = [0, 10, 40]; // renown needed to see tier 1, 2, 3 quests
export const REPORT_ARCHIVE = 25;
export const LOG_SIZE = 30;
