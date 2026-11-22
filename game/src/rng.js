// Seeded randomness for Ashen Crown: mulberry32 plus a shuffle.
// Every random choice in a game flows through one rng created from the
// game's seed, so the same seed always replays the same game.

/** A small deterministic PRNG (mulberry32) seeded by an integer. */
export function createRng(seed) {
  let a = seed >>> 0;
  return {
    /** Next float in [0, 1). */
    next() {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    /** Next integer in [0, n). */
    int(n) {
      return Math.floor(this.next() * n);
    },
  };
}

/** A shuffled copy of `array` (Fisher-Yates), driven by `rng`. */
export function shuffle(array, rng) {
  const out = array.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = rng.int(i + 1);
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}
