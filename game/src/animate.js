// Feel: card flight and flip, floating damage numbers, table shake
// on big hits, and confetti on victory. All through the Web Animations
// API and CSS classes — no image assets.

const CONFETTI_COLORS = ['#f7d774', '#e5484d', '#3e9bff', '#f5a524', '#46a758', '#ff8a5a'];

/** Float a number (damage, heal, shield) up from a point and fade it out. */
export function floatText(layer, text, x, y, color) {
  const node = document.createElement('div');
  node.className = 'floater';
  node.textContent = text;
  node.style.left = `${x}px`;
  node.style.top = `${y}px`;
  node.style.color = color;
  layer.appendChild(node);
  node.animate(
    [
      { transform: 'translate(-50%, 0) scale(1)', opacity: 1 },
      { transform: 'translate(-50%, -70px) scale(1.15)', opacity: 0 },
    ],
    { duration: 950, easing: 'ease-out' },
  ).onfinish = () => node.remove();
}

/** Shake the table for a big hit. */
export function shakeTable(tableEl) {
  tableEl.classList.remove('shake');
  void tableEl.offsetWidth; // restart the animation
  tableEl.classList.add('shake');
}

/** A burst of confetti from the top of the screen (victory flourish). */
export function confetti(layer) {
  const width = layer.clientWidth;
  for (let i = 0; i < 80; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti';
    piece.style.left = `${Math.random() * width}px`;
    piece.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    layer.appendChild(piece);
    const fall = piece.animate(
      [
        { transform: `translateY(0) rotate(0deg)`, opacity: 1 },
        { transform: `translateY(${layer.clientHeight + 40}px) rotate(${360 + Math.random() * 360}deg)`, opacity: 0.9 },
      ],
      { duration: 1600 + Math.random() * 1400, easing: 'cubic-bezier(.2,.6,.6,1)', delay: Math.random() * 500 },
    );
    fall.onfinish = () => piece.remove();
  }
}

/**
 * Fly a card from one rectangle to another, flipping face-up as it
 * lands. Returns a promise that resolves when the flight ends.
 */
export function flyCard(layer, fromRect, toRect, cardHtml) {
  const ghost = document.createElement('div');
  ghost.innerHTML = cardHtml;
  const node = ghost.firstElementChild;
  node.style.cssText += ';position:absolute;margin:0;pointer-events:none;z-index:30;';
  node.style.left = `${fromRect.left}px`;
  node.style.top = `${fromRect.top}px`;
  node.style.width = `${fromRect.width}px`;
  node.style.height = `${fromRect.height}px`;
  layer.appendChild(node);
  const dx = toRect.left + toRect.width / 2 - (fromRect.left + fromRect.width / 2);
  const dy = toRect.top + toRect.height / 2 - (fromRect.top + fromRect.height / 2);
  const scale = toRect.width / fromRect.width;
  const anim = node.animate(
    [
      { transform: 'translate(0, 0) scale(1) rotateY(0deg)', opacity: 1 },
      { transform: `translate(${dx * 0.5}px, ${dy - 60}px) scale(1.05) rotateY(70deg)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${dx}px, ${dy}px) scale(${scale}) rotateY(0deg)`, opacity: 1 },
    ],
    { duration: 480, easing: 'ease-in-out' },
  );
  return anim.finished.then(() => node.remove());
}
