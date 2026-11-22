// Game state and the turn machine: title -> playing -> won/lost.
// A duelist holds life, shield, embers, a hand, a deck and a discard pile.

import { createRng } from './rng.js';
import { buildDeck } from './cards.js';
import { drawCards } from './deck.js';
import { MAX_HAND, MAX_LIFE, MAX_EMBERS } from './rules.js';

export const START_LIFE = 30;
export const START_HAND = 5;
export const START_EMBERS = 3;

function createDuelist(deck) {
  return {
    life: START_LIFE,
    shield: 0,
    embers: 0,
    maxEmbers: START_EMBERS,
    bonusEmbers: 0,
    hand: [],
    deck,
    discard: [],
    playedThisTurn: [],
  };
}

/** A fresh game for `seed`: two shuffled decks, five cards each, on the title screen. */
export function createGame(seed) {
  const rng = createRng(seed);
  const player = createDuelist(buildDeck(rng));
  const rival = createDuelist(buildDeck(rng));
  const state = {
    seed,
    rng,
    phase: 'title',
    turn: 1,
    active: 'player',
    player,
    rival,
    log: [],
    score: { damageDealt: 0, damageBlocked: 0, surges: 0, turns: 0, cardsPlayed: 0 },
    lastPlayerElement: null,
    lastRivalElement: null,
    intent: null,
  };
  drawCards({ drawPile: player.deck, discardPile: player.discard }, player.hand, START_HAND, MAX_HAND, rng);
  drawCards({ drawPile: rival.deck, discardPile: rival.discard }, rival.hand, START_HAND, MAX_HAND, rng);
  return state;
}

/** Embers a duelist starts a turn with: 3, +1 each round, max 8, plus any bonus. */
export function turnEmbers(state, side) {
  const duelist = state[side];
  return Math.min(START_EMBERS + (state.turn - 1) + duelist.bonusEmbers, MAX_EMBERS);
}

/**
 * Begin the player's turn: shield clears (it only lasts one round),
 * embers refill and one card is drawn. The caller reads the Duchess's
 * intent afterwards (ai.computeIntent) so the banner shows her plan.
 */
export function startPlayerTurn(state) {
  if (state.phase !== 'playing') return;
  const p = state.player;
  p.shield = 0;
  p.playedThisTurn = [];
  p.maxEmbers = Math.min(START_EMBERS + (state.turn - 1), MAX_EMBERS);
  p.embers = turnEmbers(state, 'player');
  p.bonusEmbers = 0;
  drawCards({ drawPile: p.deck, discardPile: p.discard }, p.hand, 1, MAX_HAND, state.rng);
  state.score.turns = state.turn;
  state.active = 'player';
  state.log.push({ text: `— Turn ${state.turn}: your move. Embers ${p.embers}. —`, kind: 'turn' });
}

/**
 * Begin the rival's turn: her shield clears, her embers refill, she
 * draws one card, and the round counter advances so the player's next
 * turn grows by one ember.
 */
export function startRivalTurn(state) {
  if (state.phase !== 'playing') return;
  const r = state.rival;
  r.shield = 0;
  r.playedThisTurn = [];
  r.maxEmbers = Math.min(START_EMBERS + (state.turn - 1), MAX_EMBERS);
  r.embers = turnEmbers(state, 'rival');
  r.bonusEmbers = 0;
  drawCards({ drawPile: r.deck, discardPile: r.discard }, r.hand, 1, MAX_HAND, state.rng);
  state.active = 'rival';
  state.turn += 1;
  state.log.push({ text: `— Duchess Cinder takes her turn. —`, kind: 'turn' });
}
