// Duchess Cinder's brain: a deterministic heuristic, plus the intent
// banner that tells the player what she plans to do next.
// She takes a lethal play when she has one, guards or mends when her
// life is low, otherwise plays her hardest affordable Strikes — and
// holds one Guard back when the player threatens lethal.

import { strikeDamage, playCard, MAX_EMBERS } from './rules.js';
import { startRivalTurn } from './state.js';

const MAX_PLAYS_PER_TURN = 3;
const LOW_LIFE = 10;

/** The embers the Duchess will start her next turn with. */
export function rivalNextEmbers(state) {
  return Math.min(3 + (state.turn - 1) + state.rival.bonusEmbers, MAX_EMBERS);
}

/** The player's total raw Strike power in hand: the damage she must respect. */
function playerThreat(state) {
  let total = 0;
  for (const card of state.player.hand) {
    if (card.type === 'Strike') total += card.power;
  }
  return total;
}

/**
 * Plan the Duchess's turn: an ordered list of indices into her current
 * hand. `opts.embers` overrides the embers she plans with (the intent
 * banner plans with her next turn's embers).
 */
export function planRivalTurn(state, opts) {
  const embers = opts !== undefined && opts.embers !== undefined ? opts.embers : state.rival.embers;
  const hand = state.rival.hand;
  const played = [];
  const damageOf = (card) => strikeDamage(card, played, state.lastPlayerElement);

  const affordable = hand
    .map((card, index) => ({ card, index }))
    .filter((entry) => entry.card.cost <= embers);

  // Lethal first: a Strike that ends the player through shield and life.
  const lethal = affordable
    .filter((entry) => entry.card.type === 'Strike')
    .filter((entry) => damageOf(entry.card) > state.player.shield
      && damageOf(entry.card) - state.player.shield >= state.player.life)
    .sort((a, b) => damageOf(b.card) - damageOf(a.card));
  if (lethal.length > 0) return [lethal[0].index];

  const guards = affordable.filter((entry) => entry.card.type === 'Guard');
  const mends = affordable.filter((entry) => entry.card.type === 'Mend');
  const strikes = affordable.filter((entry) => entry.card.type === 'Strike');

  const byPowerDesc = (a, b) => b.card.power - a.card.power;
  const byDamageDesc = (a, b) => damageOf(b.card) - damageOf(a.card);

  const plan = [];
  let left = embers;
  const take = (entry) => {
    if (plan.length >= MAX_PLAYS_PER_TURN) return false;
    if (entry.card.cost > left) return false;
    plan.push(entry.index);
    played.push(entry.card);
    left -= entry.card.cost;
    return true;
  };

  if (state.rival.life <= LOW_LIFE) {
    // Hurt: guard or mend first, then hit back with what is left.
    const defence = [...guards, ...mends].sort(byPowerDesc);
    if (defence.length > 0) take(defence[0]);
    for (const entry of [...strikes].sort(byDamageDesc)) take(entry);
    for (const entry of defence.slice(1)) take(entry);
    return plan;
  }

  // Healthy: hit hard. Keep one Guard in hand when the player threatens lethal.
  const threatensLethal = playerThreat(state) >= state.rival.life;
  let reservedGuard = null;
  if (threatensLethal && guards.length > 0) {
    reservedGuard = [...guards].sort(byPowerDesc)[0];
  }
  for (const entry of [...strikes].sort(byDamageDesc)) take(entry);
  // With embers to spare, raise a Guard — unless it is the reserved one.
  for (const entry of [...guards].sort(byPowerDesc)) {
    if (reservedGuard !== null && entry.index === reservedGuard.index) continue;
    take(entry);
  }
  for (const entry of [...mends].sort(byPowerDesc)) take(entry);
  return plan;
}

/**
 * The Duchess's intent for her coming turn, read from the live state:
 * the kind of the first card she would play (Strike, Guard or Mend),
 * or null when she has nothing worth playing.
 */
export function computeIntent(state) {
  const plan = planRivalTurn(state, { embers: rivalNextEmbers(state) });
  if (plan.length === 0) return null;
  return state.rival.hand[plan[0]].type;
}

/**
 * Play the Duchess's whole turn at once (used by the logic tests and
 * the deterministic replays): start her turn, plan, and play each
 * planned card in order, stopping if the game ends.
 */
export function applyRivalTurn(state) {
  startRivalTurn(state);
  if (state.phase !== 'playing') return 0;
  const plan = planRivalTurn(state);
  const uids = plan.map((i) => state.rival.hand[i].uid);
  for (const uid of uids) {
    if (state.phase !== 'playing') break;
    const index = state.rival.hand.findIndex((c) => c.uid === uid);
    if (index < 0) continue;
    playCard(state, 'rival', index);
  }
  return plan.length;
}
