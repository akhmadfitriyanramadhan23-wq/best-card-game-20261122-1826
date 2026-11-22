// DOM rendering for Ashen Crown: title screen, table, both hands
// (the rival's as card backs plus a count), life bars, embers, the
// intent banner, the log, and the win/loss screens with stats.

import { ELEMENTS, cardById } from './cards.js';
import { MAX_LIFE } from './rules.js';

/** Inline SVG for an element's shape (colour and shape, never text alone). */
export function elementShapeSvg(element) {
  const color = ELEMENTS[element].color;
  if (element === 'flame') {
    return `<svg viewBox="0 0 32 32" aria-hidden="true"><polygon points="16,3 29,27 3,27" fill="${color}"/></svg>`;
  }
  if (element === 'tide') {
    return `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3 C16 3 5 16 5 21 A11 11 0 0 0 27 21 C27 16 16 3 16 3 Z" fill="${color}"/></svg>`;
  }
  if (element === 'stone') {
    return `<svg viewBox="0 0 32 32" aria-hidden="true"><polygon points="16,3 29,16 16,29 3,16" fill="${color}"/></svg>`;
  }
  // gale: a leaf-swirl
  return `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M27 5 C12 4 4 12 5 22 C6 28 12 29 16 26 C22 22 24 14 27 5 Z" fill="${color}"/><path d="M8 25 C13 19 19 13 25 9" stroke="#f3e9d2" stroke-width="2" fill="none"/></svg>`;
}

/** A card's power label: Strike shows damage, Guard shield, Mend heal. */
function powerLabel(card) {
  if (card.type === 'Strike') return 'damage';
  if (card.type === 'Guard') return 'shield';
  if (card.type === 'Mend') return 'heal';
  return card.type.toLowerCase();
}

/** Build a card's DOM node. `opts` may carry mini (table display) and surge (glow). */
export function cardElement(card, opts) {
  const el = ELEMENTS[card.element];
  const node = document.createElement('div');
  node.className = `card${opts !== undefined && opts.mini ? ' mini' : ''}${opts !== undefined && opts.surge ? ' surge-glow' : ''}`;
  node.style.setProperty('--el-color', el.color);
  node.dataset.uid = card.uid;
  node.innerHTML =
    `<div class="cost">${card.cost}</div>` +
    `<div class="shape" title="${el.name}">${elementShapeSvg(card.element)}</div>` +
    `<div class="power">${card.power}</div>` +
    `<div class="power-label">${powerLabel(card)}</div>` +
    `<div class="name">${card.name}</div>` +
    `<div class="rule">${card.text}</div>` +
    `<div class="type">${el.name} · ${card.type}</div>`;
  return node;
}

function el(id) {
  return document.getElementById(id);
}

function emberDots(container, embers, max) {
  container.innerHTML = '';
  for (let i = 0; i < max; i++) {
    const dot = document.createElement('span');
    dot.className = `ember-dot${i < embers ? '' : ' empty'}`;
    container.appendChild(dot);
  }
  const label = document.createElement('span');
  label.className = 'ember-label';
  label.textContent = `Embers ${embers}/${max}`;
  container.appendChild(label);
}

function lifeBar(fillEl, numEl, life, shieldEl, shield) {
  numEl.textContent = String(life);
  fillEl.style.width = `${Math.max(0, (life / MAX_LIFE) * 100)}%`;
  shieldEl.textContent = shield > 0 ? `🛡 ${shield} shield` : '';
}

function elementChip(element) {
  if (element === null) return '—';
  const meta = ELEMENTS[element];
  return `<b style="color:${meta.color}">${meta.name} ${meta.shape === 'triangle' ? '▲' : meta.shape === 'droplet' ? '💧' : meta.shape === 'diamond' ? '◆' : '🍃'}</b>`;
}

/** The renderer: owns the static skeleton from index.html and repaints it from state. */
export function createRenderer() {
  function render(state, ui) {
    const screenTitle = el('screen-title');
    const screenGame = el('screen-game');
    const screenEnd = el('screen-end');

    screenTitle.hidden = state.phase !== 'title';
    screenGame.hidden = state.phase === 'title';
    screenEnd.hidden = state.phase !== 'won' && state.phase !== 'lost';

    if (state.phase === 'title') {
      renderTitleCards();
      return;
    }

    // Score line.
    const s = state.score;
    el('score-line').innerHTML =
      `DMG <b>${s.damageDealt}</b> · BLOCKED <b>${s.damageBlocked}</b> · SURGES <b>${s.surges}</b> · ` +
      `TURN <b>${state.turn}</b> · CARDS <b>${s.cardsPlayed}</b>`;

    // Duelists.
    lifeBar(el('rival-life-fill'), el('rival-life'), state.rival.life, el('rival-shield'), state.rival.shield);
    lifeBar(el('player-life-fill'), el('player-life'), state.player.life, el('player-shield'), state.player.shield);
    emberDots(el('rival-embers'), state.rival.embers, Math.max(state.rival.maxEmbers, 3));
    emberDots(el('player-embers'), state.player.embers, Math.max(state.player.maxEmbers, 3));
    el('deck-counts').textContent = `Deck ${state.player.deck.length} · Discard ${state.player.discard.length} · Rival deck ${state.rival.deck.length}`;

    // Rival hand as card backs + count.
    const rivalHand = el('rival-hand');
    rivalHand.innerHTML = '';
    const countLabel = document.createElement('span');
    countLabel.className = 'count-label';
    countLabel.textContent = `Hand ${state.rival.hand.length}`;
    rivalHand.appendChild(countLabel);
    for (let i = 0; i < Math.min(state.rival.hand.length, 7); i++) {
      const back = document.createElement('div');
      back.className = 'card-back mini';
      back.textContent = '♛';
      rivalHand.appendChild(back);
    }

    // Intent banner.
    const banner = el('intent-banner');
    if (state.intent === null || state.intent === undefined) {
      banner.textContent = 'Duchess Cinder bides her time…';
      banner.classList.add('calm');
    } else {
      banner.textContent = `Duchess plots: ${state.intent} — answer it!`;
      banner.classList.remove('calm');
    }

    // Played cards on the table.
    const played = el('played-area');
    played.innerHTML = '';
    const table = ui !== undefined && ui.tableCards !== undefined ? ui.tableCards : { player: null, rival: null };
    if (table.player === null && table.rival === null) {
      const empty = document.createElement('div');
      empty.className = 'played-empty';
      empty.textContent = 'Play a card — it lands here, face-up.';
      played.appendChild(empty);
    } else {
      if (table.rival !== null) played.appendChild(playedSlot('Duchess played', table.rival, ui !== undefined ? ui.rivalSurge : false));
      if (table.player !== null) played.appendChild(playedSlot('You played', table.player, ui !== undefined ? ui.playerSurge : false));
    }
    const lastEl = document.createElement('div');
    lastEl.className = 'last-element';
    lastEl.style.cssText = 'position:absolute;bottom:6px;left:0;right:0;text-align:center;';
    lastEl.innerHTML = `Rival's last element: ${elementChip(state.lastRivalElement)} &nbsp;·&nbsp; Your last element: ${elementChip(state.lastPlayerElement)}`;
    played.appendChild(lastEl);

    // Log.
    const log = el('log');
    log.innerHTML = '';
    for (const entry of state.log.slice(-10)) {
      const p = document.createElement('p');
      p.className = entry.kind;
      p.textContent = entry.text;
      log.appendChild(p);
    }
    log.scrollTop = log.scrollHeight;

    // Player hand, fanned.
    const handRow = el('hand-row');
    handRow.innerHTML = '';
    const hand = state.player.hand;
    const mid = (hand.length - 1) / 2;
    hand.forEach((card, i) => {
      const affordable = state.player.embers >= card.cost;
      const node = cardElement(card);
      node.dataset.index = String(i);
      node.style.transform = `rotate(${(i - mid) * 3.5}deg) translateY(${Math.abs(i - mid) * 3}px)`;
      if (!affordable) node.classList.add('unaffordable');
      if (ui !== undefined && ui.selected === i) node.classList.add('selected');
      node.title = `${card.name} — ${card.text} (cost ${card.cost})`;
      handRow.appendChild(node);
    });

    // Turn controls.
    const endBtn = el('btn-end-turn');
    endBtn.disabled = state.phase !== 'playing' || (ui !== undefined && ui.rivalBusy === true);
    el('turn-label').textContent = state.active === 'player' ? `Turn ${state.turn} — your move` : 'Duchess is playing…';
    el('btn-mute').textContent = ui !== undefined && ui.muted ? 'Sound: Off' : 'Sound: On';

    // End screen.
    if (state.phase === 'won' || state.phase === 'lost') renderEnd(state);
  }

  function renderEnd(state) {
    const won = state.phase === 'won';
    const title = el('end-title');
    title.textContent = won ? '👑 Victory!' : 'Defeat';
    title.classList.toggle('lost', !won);
    el('end-story').textContent = won
      ? 'The Duchess bows her head. The Ashen Crown is yours — the hall is silent but for the candles.'
      : 'Duchess Cinder takes the crown from the table. The embers dim… but a Warden always duels again.';
    const s = state.score;
    el('end-stats').innerHTML =
      `<div><span>Damage dealt</span><b>${s.damageDealt}</b></div>` +
      `<div><span>Damage blocked</span><b>${s.damageBlocked}</b></div>` +
      `<div><span>Surges triggered</span><b>${s.surges}</b></div>` +
      `<div><span>Turns played</span><b>${s.turns}</b></div>` +
      `<div><span>Cards played</span><b>${s.cardsPlayed}</b></div>` +
      `<div><span>Final life (you / Duchess)</span><b>${state.player.life} / ${state.rival.life}</b></div>`;
  }

  function renderTitleCards() {
    const row = el('title-cards');
    if (row.childElementCount > 0) return;
    for (const id of ['ember-slash', 'maelstrom', 'tempest']) {
      row.appendChild(cardElement(cardById(id), { mini: true }));
    }
  }

  function playedSlot(label, card, surge) {
    const slot = document.createElement('div');
    slot.className = 'played-slot';
    const tag = document.createElement('div');
    tag.className = 'played-label';
    tag.textContent = label;
    slot.appendChild(tag);
    const node = cardElement(card, { mini: true, surge: surge === true });
    node.classList.add('flip-in');
    const wrap = document.createElement('div');
    wrap.className = 'played-card-wrap';
    wrap.appendChild(node);
    slot.appendChild(wrap);
    return slot;
  }

  return { render, renderEnd };
}
