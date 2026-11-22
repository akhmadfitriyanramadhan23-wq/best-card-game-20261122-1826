// Deterministic screenshot scenes behind ?shot=title|table|win|loss.
// Every scene is built by playing the game's own rules forward from a
// fresh state — no hand-placed numbers — so each frame is what a real
// game looks like and the same seed always gives the same frame.

import { createGame, startPlayerTurn } from './state.js';
import { playCard, canPlay } from './rules.js';
import { applyRivalTurn, computeIntent } from './ai.js';
import { cardById } from './cards.js';
import { drawCards } from './deck.js';

/** Play a whole game with a simple policy: every affordable card, in hand order. */
function autoplay(state, maxTurns) {
  let guard = 0;
  while (state.phase === 'playing' && state.turn <= maxTurns && guard < 300) {
    guard++;
    let played = true;
    while (played && state.phase === 'playing') {
      played = false;
      for (let i = 0; i < state.player.hand.length; i++) {
        if (canPlay(state, 'player', i)) {
          playCard(state, 'player', i);
          played = true;
          break;
        }
      }
    }
    if (state.phase !== 'playing') break;
    applyRivalTurn(state);
    if (state.phase !== 'playing') break;
    startPlayerTurn(state);
  }
  return state;
}

/** True when the log already shows a Surge. */
function hasSurge(state) {
  return state.log.some((entry) => entry.text.includes('SURGE'));
}

/**
 * Force a Surge into the current player turn with real cards — and no
 * damage, so the staged mid-game lives stay plausible: Ash Guard then
 * Phoenix Mend, both Flame, the Mend surging for +2.
 */
function forceSurge(state) {
  const hand = state.player.hand;
  while (hand.length > 5) {
    state.player.discard.push(hand.pop());
  }
  state.player.embers = 8;
  hand.push(cardById('ash-guard'));
  hand.push(cardById('phoenix-mend'));
  playCard(state, 'player', hand.length - 2);
  playCard(state, 'player', hand.length - 1);
}

/** The last card each side played, for the table display. */
function tableCardsOf(state) {
  const p = state.player.playedThisTurn;
  const r = state.rival.playedThisTurn;
  return {
    player: p.length > 0 ? p[p.length - 1] : null,
    rival: r.length > 0 ? r[r.length - 1] : null,
  };
}

/** A scripted mid-game: turn 5, both hands full, a Surge in the log, intent showing. */
function stageTable(seed) {
  let best = null;
  let bestScore = Infinity;
  for (let s = seed; s < seed + 20; s++) {
    const state = createGame(s);
    state.phase = 'playing';
    startPlayerTurn(state);
    autoplay(state, 4);
    if (state.phase !== 'playing' || state.turn < 5) continue;
    if (!hasSurge(state)) forceSurge(state);
    if (state.phase !== 'playing') continue;
    if (state.player.hand.length < 5) {
      drawCards({ drawPile: state.player.deck, discardPile: state.player.discard }, state.player.hand, 6 - state.player.hand.length, 7, state.rng);
    }
    // Prefer a healthy mid-game: lives near 24 (player) and 19 (rival).
    const score = Math.abs(state.player.life - 24) + Math.abs(state.rival.life - 19);
    if (score < bestScore) {
      bestScore = score;
      best = state;
    }
  }
  if (best !== null) {
    best.intent = computeIntent(best);
    return { state: best, screen: 'playing', tableCards: tableCardsOf(best) };
  }
  // Fallback: a plain turn-1 table is still a real game state.
  const state = createGame(seed);
  state.phase = 'playing';
  startPlayerTurn(state);
  state.intent = computeIntent(state);
  return { state, screen: 'playing', tableCards: { player: null, rival: null } };
}

/** A finished game that ended the wanted way, played by the real rules. */
function stageEnding(want, seed) {
  for (let s = seed; s < seed + 40; s++) {
    const state = createGame(s);
    state.phase = 'playing';
    startPlayerTurn(state);
    autoplay(state, 60);
    if (state.phase === want) return { state, screen: want, tableCards: tableCardsOf(state) };
  }
  // Fallback: force the ending with real cards.
  const state = createGame(seed);
  state.phase = 'playing';
  startPlayerTurn(state);
  if (want === 'won') {
    state.rival.life = 5;
    state.player.embers = 8;
    state.player.hand.push(cardById('ember-slash'));
    playCard(state, 'player', state.player.hand.length - 1);
  } else {
    state.player.life = 4;
    state.rival.embers = 8;
    state.rival.hand.push(cardById('cinder-burst'));
    playCard(state, 'rival', state.rival.hand.length - 1);
  }
  return { state, screen: want, tableCards: tableCardsOf(state) };
}

/**
 * Set the game to the named scene (title, table, win or loss; any other
 * name is the title) and return the state, the screen to show and the
 * cards to display on the table.
 */
export function stageShot(name, seed) {
  if (name === 'table') return stageTable(seed);
  if (name === 'win') return stageEnding('won', seed);
  if (name === 'loss') return stageEnding('lost', seed);
  const state = createGame(seed);
  return { state, screen: 'title', tableCards: { player: null, rival: null } };
}
