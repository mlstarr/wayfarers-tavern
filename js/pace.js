// Early-game pacing: everything runs fast at first and slows to full length
// as the player sends more quests. See PACE_STAGES in config.js.
import { PACE_STAGES } from './config.js';

export function paceOf(state) {
  const sent = state.stats.questsSent || 0;
  let stage = 0;
  PACE_STAGES.forEach((s, i) => { if (sent >= s.sent) stage = i; });
  return { stage, scale: PACE_STAGES[stage].scale, last: stage === PACE_STAGES.length - 1 };
}

// Quest length after pacing, in game-minutes: at least 30 seconds, rounded to 15 seconds.
export function paced(minutes, scale) {
  if (scale >= 1) return minutes;
  return Math.max(0.5, Math.round(minutes * scale * 4) / 4);
}
