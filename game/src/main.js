// Bootstrap: builds the state, wires input/render/audio, and runs the
// duel. In shot mode (?shot=title|table|win|loss&seed=N) it stages that
// scene instead and sets window.__shotReady once it has settled.

import { createGame, startPlayerTurn, startRivalTurn } from './state.js';
import { playCard, canPlay } from './rules.js';
import { planRivalTurn, computeIntent } from './ai.js';
import { createRenderer } from './render.js';
import { floatText, shakeTable, confetti, flyCard } from './animate.js';
import { createAudio } from './audio.js';
import { attachInput } from './input.js';
import { stageShot } from './shots.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const renderer = createRenderer();
const audio = createAudio();
const floatLayer = document.getElementById('float-layer');
const playedArea = document.getElementById('played-area');
const statusEl = document.getElementById('status');

let state = null;
let ui = freshUi(false);

function freshUi(muted) {
  return {
    selected: -1,
    rivalBusy: false,
    muted,
    tableCards: { player: null, rival: null },
    playerSurge: false,
    rivalSurge: false,
  };
}

function announce(message) {
  statusEl.textContent = message;
}

function render() {
  renderer.render(state, ui);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function newGame(nextSeed) {
  state = createGame(nextSeed);
  ui = freshUi(ui.muted);
}

/** Start a fresh duel from the title screen. */
function startDuel() {
  state.phase = 'playing';
  startPlayerTurn(state);
  state.intent = computeIntent(state);
  audio.unlock();
  render();
  announce(`Duel started. Turn 1, ${state.player.embers} embers. Draw a card and play.`);
}

/** Show the end screen, fanfare included, when the duel is over. */
function endDuel() {
  render();
  if (state.phase === 'won') {
    audio.win();
    confetti(floatLayer);
    announce('Victory! You won the duel and kept the Ashen Crown.');
  } else if (state.phase === 'lost') {
    audio.lose();
    announce('Defeat. Duchess Cinder takes the crown.');
  }
}

function lifePoint(which) {
  const rect = document.getElementById(which === 'rival' ? 'rival-life' : 'player-life').getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top - 6 };
}

function showEvents(events, side) {
  const target = side === 'player' ? 'rival' : 'player';
  const point = lifePoint(target);
  if (events.damage > 0) {
    floatText(floatLayer, `-${events.damage}`, point.x, point.y, '#ff6b6b');
    if (events.damage >= 8) shakeTable(playedArea);
    audio.hit();
  }
  if (events.heal > 0) {
    const self = lifePoint(side);
    floatText(floatLayer, `+${events.heal}`, self.x, self.y, '#7dff9a');
    audio.heal();
  }
  if (events.shield > 0) {
    const self = lifePoint(side);
    floatText(floatLayer, `+${events.shield} shield`, self.x, self.y, '#9fd8ff');
    audio.heal();
  }
  if (events.surge) {
    floatText(floatLayer, 'SURGE!', point.x, point.y - 40, '#ffd700');
  }
}

/** Play the player's hand card at `index`, with flight and floaters. */
function playCardAt(index) {
  if (state.phase !== 'playing' || ui.rivalBusy) return;
  const card = state.player.hand[index];
  if (card === undefined) return;
  if (!canPlay(state, 'player', index)) {
    audio.click();
    return;
  }
  audio.unlock();
  audio.play();
  const fromEl = document.querySelector(`#hand-row .card[data-index="${index}"]`);
  const fromRect = fromEl !== null ? fromEl.getBoundingClientRect() : null;
  const events = playCard(state, 'player', index);
  if (events === null) return;
  ui.tableCards.player = events.card;
  ui.playerSurge = events.surge;
  render();
  if (fromRect !== null) {
    const toEl = document.querySelector('#played-area .played-slot:last-child .card');
    if (toEl !== null) {
      const toRect = toEl.getBoundingClientRect();
      void flyCard(floatLayer, fromRect, toRect, toEl.outerHTML);
    }
  }
  showEvents(events, 'player');
  if (state.phase !== 'playing') endDuel();
}

/** The Duchess plays her turn, one card at a time with a short delay. */
async function endTurn() {
  if (state.phase !== 'playing' || ui.rivalBusy) return;
  audio.unlock();
  ui.rivalBusy = true;
  ui.selected = -1;
  render();
  await sleep(350);
  startRivalTurn(state);
  const plan = planRivalTurn(state);
  const uids = plan.map((i) => state.rival.hand[i].uid);
  for (const uid of uids) {
    if (state.phase !== 'playing') break;
    const index = state.rival.hand.findIndex((c) => c.uid === uid);
    if (index < 0) continue;
    await sleep(650);
    const events = playCard(state, 'rival', index);
    if (events === null) continue;
    ui.tableCards.rival = events.card;
    ui.rivalSurge = events.surge;
    audio.play();
    render();
    showEvents(events, 'rival');
  }
  if (state.phase === 'playing') {
    startPlayerTurn(state);
    state.intent = computeIntent(state);
  }
  ui.rivalBusy = false;
  render();
  if (state.phase !== 'playing') endDuel();
  else announce(`Turn ${state.turn}. ${state.player.embers} embers. Duchess plots: ${state.intent ?? 'nothing'}.`);
}

/** Space/Enter: start from the title, end the turn in play, duel again at the end. */
function confirm() {
  audio.unlock();
  if (state.phase === 'title') startDuel();
  else if (state.phase === 'playing') void endTurn();
  else {
    newGame(Math.floor(Math.random() * 4294967296));
    startDuel();
  }
}

function restart() {
  audio.unlock();
  newGame(Math.floor(Math.random() * 4294967296));
  startDuel();
}

function toggleHelp() {
  const overlay = document.getElementById('help-overlay');
  overlay.hidden = !overlay.hidden;
  audio.click();
}

function toggleMute() {
  ui.muted = audio.toggleMute();
  render();
}

function runShot(name) {
  const staged = stageShot(name, seed);
  state = staged.state;
  ui.tableCards = staged.tableCards;
  ui.playerSurge = false;
  ui.rivalSurge = false;
  render();
  // Let the flip-in settle, then signal the screenshot.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        window.__shotReady = true;
      }, 650);
    });
  });
}

function runGame() {
  newGame(seed);
  render();
  attachInput({
    playCard: playCardAt,
    endTurn: () => void endTurn(),
    confirm,
    restart,
    toggleHelp,
    toggleMute,
  });
  announce('Ashen Crown. Press Space or click Begin the Duel to start.');
}

if (shot !== null) runShot(shot);
else runGame();
