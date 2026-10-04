// Seeded randomness. Everything random in the game goes through here.

export function hashString(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

export function seedFrom(...parts) {
  return hashString(parts.join('|'));
}

// The only non-deterministic source: used once, at new game.
export function newSeed() {
  return (Math.random() * 4294967296) >>> 0;
}

export class Rng {
  constructor(seed) { this.s = seed >>> 0; }

  next() {
    this.s = (this.s + 0x6D2B79F5) >>> 0;
    let t = this.s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  int(min, max) { return min + Math.floor(this.next() * (max - min + 1)); }
  chance(p) { return this.next() < p; }
  pick(arr) { return arr[Math.floor(this.next() * arr.length)]; }
  d(sides) { return this.int(1, sides); }

  // entries: [[value, weight], ...]
  weighted(entries) {
    const total = entries.reduce((s, e) => s + e[1], 0);
    let r = this.next() * total;
    for (const [value, w] of entries) {
      r -= w;
      if (r < 0) return value;
    }
    return entries[entries.length - 1][0];
  }

  shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // mode: 'adv' | 'dis' | null
  d20(mode = null) {
    const a = this.d(20);
    if (!mode) return { d: a, rolls: [a] };
    const b = this.d(20);
    return { d: mode === 'adv' ? Math.max(a, b) : Math.min(a, b), rolls: [a, b] };
  }

  fork(label) { return new Rng(seedFrom(this.s, label)); }
}

export function parseDice(expr) {
  const m = /^(\d*)d(\d+)([+-]\d+)?$/.exec(String(expr).replace(/\s/g, ''));
  if (!m) return { count: 0, sides: 0, mod: parseInt(expr, 10) || 0 };
  return { count: Number(m[1] || 1), sides: Number(m[2]), mod: Number(m[3] || 0) };
}

// Rolls dice like '2d6+1'. A crit doubles the dice, not the modifier.
export function rollDice(rng, expr, crit = false) {
  const { count, sides, mod } = parseDice(expr);
  const n = crit ? count * 2 : count;
  let total = mod;
  for (let i = 0; i < n; i++) total += rng.d(sides);
  return Math.max(0, total);
}
