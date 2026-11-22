// The pure rules of Ashen Crown: costs, Surge, advantage, damage and
// shield resolution, win/loss detection. These functions take a game
// state and a card and say what happens; they never touch the DOM.

import { ELEMENTS } from './cards.js';
import { drawCards, discardCard } from './deck.js';

export const MAX_LIFE = 30;
export const MAX_HAND = 7;
export const MAX_EMBERS = 8;

/** True when element `a` beats element `b` in the advantage cycle. */
export function elementBeats(a, b) {
  return ELEMENTS[a] !== undefined && ELEMENTS[a].beats === b;
}

/**
 * The Surge bonus a card gets: +2 when another card of the same element
 * was already played this turn (Wildfire's own surge is +3). Zero when
 * no same-element card was played yet this turn.
 */
export function surgeBonus(card, playedThisTurn) {
  const surging = playedThisTurn.some((c) => c.element === card.element);
  if (!surging) return 0;
  return card.surgeBonus ?? 2;
}

/** A Strike's damage: power + Surge bonus + 1 advantage when it beats the rival's last element. */
export function strikeDamage(card, playedThisTurn, lastRivalElement) {
  let damage = card.power + surgeBonus(card, playedThisTurn);
  if (lastRivalElement !== null && elementBeats(card.element, lastRivalElement)) damage += 1;
  return damage;
}

/** Whether the duelist can play the hand card at `index` right now. */
export function canPlay(state, side, index) {
  if (state.phase !== 'playing') return false;
  const duelist = state[side];
  const card = duelist.hand[index];
  return card !== undefined && duelist.embers >= card.cost;
}

/**
 * Apply damage to a duelist: shield absorbs first, the rest hits life.
 * Returns { blocked, dealt }.
 */
export function applyDamage(duelist, amount) {
  const blocked = Math.min(duelist.shield, amount);
  duelist.shield -= blocked;
  const dealt = amount - blocked;
  duelist.life = Math.max(0, duelist.life - dealt);
  return { blocked, dealt };
}

/** Check for a winner: 'won' when the rival is at 0, 'lost' when the player is. Sets state.phase. */
export function checkEnd(state) {
  if (state.rival.life <= 0) {
    state.phase = 'won';
    return 'won';
  }
  if (state.player.life <= 0) {
    state.phase = 'lost';
    return 'lost';
  }
  return null;
}

function pileOf(duelist) {
  return { drawPile: duelist.deck, discardPile: duelist.discard };
}

function addLog(state, text, kind) {
  state.log.push({ text, kind: kind ?? 'info' });
  if (state.log.length > 60) state.log.splice(0, state.log.length - 60);
}

/**
 * Play the hand card at `index` for `side` ('player' or 'rival').
 * Pays its cost, resolves its effect, moves it to the discard pile and
 * updates the score and the log. Returns an events object describing
 * what happened (or null when the card cannot be played).
 */
export function playCard(state, side, index) {
  const duelist = state[side];
  const opponent = side === 'player' ? state.rival : state.player;
  const card = duelist.hand[index];
  if (card === undefined || duelist.embers < card.cost) return null;
  if (state.phase !== 'playing') return null;

  const playedBefore = duelist.playedThisTurn.slice();
  const surge = surgeBonus(card, playedBefore);
  const lastOpponentElement = side === 'player' ? state.lastRivalElement : state.lastPlayerElement;
  const advantage = card.type === 'Strike' && lastOpponentElement !== null && elementBeats(card.element, lastOpponentElement);

  duelist.embers -= card.cost;
  duelist.hand.splice(index, 1);
  duelist.playedThisTurn.push(card);
  discardCard(pileOf(duelist), card);
  if (side === 'player') state.score.cardsPlayed += 1;
  if (surge > 0 && side === 'player') state.score.surges += 1;

  const who = side === 'player' ? 'You' : 'Duchess';
  const events = { card, surge: surge > 0, advantage, damage: 0, blocked: 0, heal: 0, shield: 0 };

  if (card.type === 'Strike') {
    const damage = strikeDamage(card, playedBefore, lastOpponentElement);
    if (card.stripShield === true && opponent.shield > 0) {
      opponent.shield = 0;
      events.stripShield = true;
    }
    const res = applyDamage(opponent, damage);
    events.damage = res.dealt;
    events.blocked = res.blocked;
    if (side === 'player') state.score.damageDealt += res.dealt;
    state.score.damageBlocked += res.blocked;
    let line = `${who} played ${card.name} — ${damage} damage`;
    if (events.surge) line += ' (SURGE!)';
    if (advantage) line += ' (advantage!)';
    if (events.stripShield) line += ', shield shattered';
    if (res.blocked > 0) line += `, ${res.blocked} blocked`;
    addLog(state, `${line}.`, side === 'player' ? 'player' : 'rival');
  } else if (card.type === 'Guard') {
    const gain = card.power + surge;
    duelist.shield += gain;
    events.shield = gain;
    addLog(state, `${who} played ${card.name} — +${gain} shield${events.surge ? ' (SURGE!)' : ''}.`, side === 'player' ? 'player' : 'rival');
  } else if (card.type === 'Mend') {
    const heal = Math.min(card.power + surge, MAX_LIFE - duelist.life);
    duelist.life += heal;
    events.heal = heal;
    addLog(state, `${who} played ${card.name} — restored ${heal} life${events.surge ? ' (SURGE!)' : ''}.`, side === 'player' ? 'player' : 'rival');
  } else {
    addLog(state, `${who} played ${card.name}.`, side === 'player' ? 'player' : 'rival');
  }

  if (card.draw !== undefined && card.draw > 0) {
    const drawn = drawCards(pileOf(duelist), duelist.hand, card.draw, MAX_HAND, state.rng);
    events.draw = drawn;
    if (drawn > 0) addLog(state, `${who} draws ${drawn} card${drawn === 1 ? '' : 's'}.`, 'info');
  }
  if (card.gainShield !== undefined && card.gainShield > 0) {
    duelist.shield += card.gainShield;
    events.shield += card.gainShield;
    addLog(state, `${who} gains ${card.gainShield} shield.`, 'info');
  }
  if (card.emberBonus !== undefined && card.emberBonus > 0) {
    duelist.bonusEmbers += card.emberBonus;
    events.emberBonus = card.emberBonus;
    addLog(state, `${who} will start next turn with +${card.emberBonus} embers.`, 'info');
  }

  if (side === 'player') state.lastPlayerElement = card.element;
  else state.lastRivalElement = card.element;

  checkEnd(state);
  return events;
}
