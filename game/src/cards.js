// The 24-card catalogue of Ashen Crown plus the element table.
// Elements are told apart by colour AND shape, never by text alone:
// Flame is red + triangle, Tide blue + droplet, Stone ochre + diamond,
// Gale green + leaf-swirl. The advantage cycle is Flame > Gale > Stone
// > Tide > Flame.

import { shuffle } from './rng.js';

/** Element metadata: display name, colour, shape icon, and what it beats. */
export const ELEMENTS = {
  flame: { name: 'Flame', color: '#e5484d', shape: 'triangle', beats: 'gale', glyph: '▲' },
  tide: { name: 'Tide', color: '#3e9bff', shape: 'droplet', beats: 'flame', glyph: '💧' },
  stone: { name: 'Stone', color: '#f5a524', shape: 'diamond', beats: 'tide', glyph: '◆' },
  gale: { name: 'Gale', color: '#46a758', shape: 'leaf', beats: 'stone', glyph: '🍃' },
};

/**
 * One entry per card in the deck (one copy each, 24 total).
 * type: 'Strike' (damage), 'Guard' (shield), 'Mend' (heal), 'Trick' (effect).
 * Optional extras: surgeBonus (Wildfire's surge is +3), draw (draw cards),
 * stripShield (Maelstrom), gainShield (Avalanche), emberBonus (Tempest).
 */
export const CATALOGUE = [
  // Flame
  { id: 'ember-slash', name: 'Ember Slash', element: 'flame', cost: 2, type: 'Strike', power: 5, text: 'Deal 5 damage.' },
  { id: 'cinder-burst', name: 'Cinder Burst', element: 'flame', cost: 4, type: 'Strike', power: 8, text: 'Deal 8 damage.' },
  { id: 'wildfire', name: 'Wildfire', element: 'flame', cost: 3, type: 'Strike', power: 4, text: 'Deal 4 damage. +3 if it Surges.', surgeBonus: 3 },
  { id: 'phoenix-mend', name: 'Phoenix Mend', element: 'flame', cost: 3, type: 'Mend', power: 5, text: 'Restore 5 life.' },
  { id: 'ash-guard', name: 'Ash Guard', element: 'flame', cost: 2, type: 'Guard', power: 5, text: 'Gain 5 shield.' },
  { id: 'inferno', name: 'Inferno', element: 'flame', cost: 6, type: 'Strike', power: 11, text: 'Deal 11 damage.' },
  // Tide
  { id: 'tidal-cut', name: 'Tidal Cut', element: 'tide', cost: 2, type: 'Strike', power: 4, text: 'Deal 4 damage.' },
  { id: 'deep-current', name: 'Deep Current', element: 'tide', cost: 3, type: 'Strike', power: 6, text: 'Deal 6 damage.' },
  { id: 'riptide', name: 'Riptide', element: 'tide', cost: 4, type: 'Strike', power: 7, text: 'Deal 7 damage. Draw 1 card.', draw: 1 },
  { id: 'still-water', name: 'Still Water', element: 'tide', cost: 2, type: 'Mend', power: 4, text: 'Restore 4 life.' },
  { id: 'coral-wall', name: 'Coral Wall', element: 'tide', cost: 2, type: 'Guard', power: 6, text: 'Gain 6 shield.' },
  { id: 'maelstrom', name: 'Maelstrom', element: 'tide', cost: 5, type: 'Strike', power: 9, text: 'Deal 9 damage. Remove rival shield.', stripShield: true },
  // Stone
  { id: 'pebble-jab', name: 'Pebble Jab', element: 'stone', cost: 1, type: 'Strike', power: 3, text: 'Deal 3 damage.' },
  { id: 'boulder-slam', name: 'Boulder Slam', element: 'stone', cost: 3, type: 'Strike', power: 6, text: 'Deal 6 damage.' },
  { id: 'quake', name: 'Quake', element: 'stone', cost: 4, type: 'Strike', power: 8, text: 'Deal 8 damage.' },
  { id: 'granite-guard', name: 'Granite Guard', element: 'stone', cost: 2, type: 'Guard', power: 7, text: 'Gain 7 shield.' },
  { id: 'moss-mend', name: 'Moss Mend', element: 'stone', cost: 3, type: 'Mend', power: 6, text: 'Restore 6 life.' },
  { id: 'avalanche', name: 'Avalanche', element: 'stone', cost: 6, type: 'Strike', power: 10, text: 'Deal 10 damage. Gain 3 shield.', gainShield: 3 },
  // Gale
  { id: 'zephyr-cut', name: 'Zephyr Cut', element: 'gale', cost: 1, type: 'Strike', power: 3, text: 'Deal 3 damage.' },
  { id: 'storm-lash', name: 'Storm Lash', element: 'gale', cost: 3, type: 'Strike', power: 6, text: 'Deal 6 damage.' },
  { id: 'cyclone', name: 'Cyclone', element: 'gale', cost: 4, type: 'Strike', power: 7, text: 'Deal 7 damage. Draw 1 card.', draw: 1 },
  { id: 'swift-mend', name: 'Swift Mend', element: 'gale', cost: 2, type: 'Mend', power: 4, text: 'Restore 4 life.' },
  { id: 'wind-wall', name: 'Wind Wall', element: 'gale', cost: 2, type: 'Guard', power: 5, text: 'Gain 5 shield.' },
  { id: 'tempest', name: 'Tempest', element: 'gale', cost: 5, type: 'Strike', power: 9, text: 'Deal 9 damage. +2 embers next turn.', emberBonus: 2 },
];

/** A fresh playable copy of a catalogue card, with its own uid. */
export function makeCard(def, uid) {
  return { ...def, uid };
}

let refCounter = 0;

/** A fresh card instance by catalogue id (a new object every call). */
export function cardById(id) {
  const def = CATALOGUE.find((c) => c.id === id);
  if (!def) throw new Error(`unknown card id: ${id}`);
  refCounter += 1;
  return makeCard(def, `ref-${id}-${refCounter}`);
}

/** A full shuffled 24-card deck, one copy of each catalogue card. */
export function buildDeck(rng) {
  const cards = CATALOGUE.map((def, i) => makeCard(def, `c${i}`));
  return shuffle(cards, rng);
}
