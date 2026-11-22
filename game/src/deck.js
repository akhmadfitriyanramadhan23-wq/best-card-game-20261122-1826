// Deck, hand and discard piles: drawing and reshuffling.
// A pile is { drawPile, discardPile }; the arrays are mutated in place,
// never replaced, so a duelist's deck/discard references stay valid.

import { shuffle } from './rng.js';

/** Shuffle the discard pile back into the draw pile (in place). */
export function reshuffle(pile, rng) {
  const drawPile = pile.drawPile ?? pile.deck;
  const discardPile = pile.discardPile ?? pile.discard;
  if (discardPile.length === 0) return 0;
  const back = shuffle(discardPile, rng);
  discardPile.length = 0;
  drawPile.push(...back);
  return back.length;
}

/**
 * Draw up to `count` cards into `hand` (never past `maxHand` cards).
 * An empty draw pile reshuffles the discard pile first. Returns how
 * many cards were actually drawn.
 */
export function drawCards(pile, hand, count, maxHand, rng) {
  const drawPile = pile.drawPile ?? pile.deck;
  const discardPile = pile.discardPile ?? pile.discard;
  let drawn = 0;
  while (drawn < count && hand.length < maxHand) {
    if (drawPile.length === 0) {
      if (discardPile.length === 0) break;
      reshuffle(pile, rng);
    }
    hand.push(drawPile.pop());
    drawn++;
  }
  return drawn;
}

/** Move a card from a hand into its owner's discard pile. */
export function discardCard(pile, card) {
  const discardPile = pile.discardPile ?? pile.discard;
  discardPile.push(card);
}
