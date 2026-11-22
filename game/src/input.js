// Mouse + keyboard input for Ashen Crown.
// Click a card (or keys 1-7) to play it, Space/Enter to end the turn
// (or to confirm on the title/end screens), R to restart, H for help,
// M to mute. Handlers are supplied by main.js; this module only routes.

const HAND_KEYS = ['1', '2', '3', '4', '5', '6', '7'];

/**
 * Attach input handling. `handlers`:
 *   playCard(index), endTurn(), confirm(), restart(), toggleHelp(), toggleMute()
 * Returns a detach function.
 */
export function attachInput(handlers) {
  const handRow = document.getElementById('hand-row');

  function onHandClick(event) {
    const cardEl = event.target.closest('.card');
    if (cardEl === null || cardEl.dataset.index === undefined) return;
    handlers.playCard(Number(cardEl.dataset.index));
  }

  function onKey(event) {
    if (event.repeat) return;
    const key = event.key;
    if (HAND_KEYS.includes(key)) {
      handlers.playCard(Number(key) - 1);
      return;
    }
    if (key === ' ' || key === 'Enter') {
      event.preventDefault();
      handlers.confirm();
      return;
    }
    if (key === 'r' || key === 'R') {
      handlers.restart();
      return;
    }
    if (key === 'h' || key === 'H') {
      handlers.toggleHelp();
      return;
    }
    if (key === 'm' || key === 'M') {
      handlers.toggleMute();
    }
  }

  function onEndTurn() {
    handlers.endTurn();
  }
  function onStart() {
    handlers.confirm();
  }
  function onAgain() {
    handlers.restart();
  }
  function onRestart() {
    handlers.restart();
  }
  function onHelp() {
    handlers.toggleHelp();
  }
  function onCloseHelp() {
    handlers.toggleHelp();
  }
  function onMute() {
    handlers.toggleMute();
  }

  handRow.addEventListener('click', onHandClick);
  document.addEventListener('keydown', onKey);
  document.getElementById('btn-end-turn').addEventListener('click', onEndTurn);
  document.getElementById('btn-start').addEventListener('click', onStart);
  document.getElementById('btn-again').addEventListener('click', onAgain);
  document.getElementById('btn-restart').addEventListener('click', onRestart);
  document.getElementById('btn-help').addEventListener('click', onHelp);
  document.getElementById('btn-close-help').addEventListener('click', onCloseHelp);
  document.getElementById('btn-mute').addEventListener('click', onMute);

  return function detach() {
    handRow.removeEventListener('click', onHandClick);
    document.removeEventListener('keydown', onKey);
    document.getElementById('btn-end-turn').removeEventListener('click', onEndTurn);
    document.getElementById('btn-start').removeEventListener('click', onStart);
    document.getElementById('btn-again').removeEventListener('click', onAgain);
    document.getElementById('btn-restart').removeEventListener('click', onRestart);
    document.getElementById('btn-help').removeEventListener('click', onHelp);
    document.getElementById('btn-close-help').removeEventListener('click', onCloseHelp);
    document.getElementById('btn-mute').removeEventListener('click', onMute);
  };
}
