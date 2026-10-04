// Party-wide talent effects ("aura" fields). A hero's aura works while they are standing.
import { traits } from './adventurers.js';

export function partyAuras(sim) {
  const out = [];
  for (const m of sim) {
    for (const t of traits(m.a)) if (t.aura) out.push({ ...t.aura, label: t.name.toLowerCase(), from: m.id });
  }
  return out;
}

export function activeAuras(ctx) {
  return (ctx.auras || []).filter((a) => {
    const s = ctx.sim.find((x) => x.id === a.from);
    return s && s.hp > 0;
  });
}

// Sum of a numeric aura field. live: only heroes still standing count.
export function auraSum(ctx, field, live = true) {
  return (live ? activeAuras(ctx) : ctx.auras || []).reduce((s, a) => s + (typeof a[field] === 'number' ? a[field] : 0), 0);
}

export const auraAny = (ctx, field) => activeAuras(ctx).find((a) => a[field]) || null;
