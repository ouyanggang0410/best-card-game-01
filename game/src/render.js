// Ember Pact — rendering. Reads the engine state and paints the DOM table:
// life bars with numbers, telegraphed intent, ember pips, the log, and the hand
// as big readable cards (value, suit glyph + name + colour, cost, effect).
import { MAX_EMBER, MAX_HP } from './config.js';
import { SUITS } from './deck.js';
import { SCREEN_LOSS, SCREEN_PLAY, SCREEN_WIN } from './engine.js';

function el(id) { return document.getElementById(id); }

function hpFill(fillEl, textEl, hp) {
  fillEl.style.width = `${(hp / MAX_HP) * 100}%`;
  textEl.textContent = `♥ ${hp} / ${MAX_HP}`;
}

export function render(game) {
  hpFill(el('foe-hp-fill'), el('foe-hp-text'), game.foe.hp);
  hpFill(el('you-hp-fill'), el('you-hp-text'), game.you.hp);
  el('foe-block').textContent = game.foe.block;
  el('you-block').textContent = game.you.block;
  el('score').textContent = game.score;
  el('round').textContent = game.round;
  el('deck-count').textContent = game.you.deck.length;
  el('foe-intent').textContent = game.foe.intent ? game.foe.intent.text : '';
  el('ember-text').textContent = ` ${game.you.ember} / ${game.you.emberMax}`;
  el('ember-pips').textContent = '●'.repeat(game.you.ember) + '○'.repeat(Math.max(0, MAX_EMBER - game.you.ember));
  el('log').innerHTML = game.log.map((line) => `<div>${line}</div>`).join('');
  const played = game.suitsPlayed.map((s) => SUITS[s].name).join(', ');
  el('resonance-line').textContent = played
    ? `Suits played this turn: ${played} — a second card of one suit gains Resonance +2`
    : 'Play two cards of one suit in a turn: Resonance +2';

  const foeHand = el('foe-hand');
  foeHand.innerHTML = '';
  for (let i = 0; i < game.foe.handCount; i++) {
    const back = document.createElement('div');
    back.className = 'mini-card';
    back.textContent = '✦';
    foeHand.appendChild(back);
  }

  const hand = el('hand');
  hand.innerHTML = '';
  game.you.hand.forEach((card, index) => {
    const suit = SUITS[card.suit];
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `card suit-${card.suit}`;
    button.disabled = game.screen !== SCREEN_PLAY || card.cost > game.you.ember;
    button.setAttribute('aria-label', `${card.name}, ${suit.name}, cost ${card.cost}, ${card.text}`);
    button.innerHTML =
      `<span class="cost">${card.cost}</span>` +
      `<span class="suit"><span class="glyph">${suit.glyph}</span> ${suit.name}</span>` +
      `<h3>${card.name}</h3>` +
      `<div class="value">${card.value}</div>` +
      `<div class="effect">${card.text}</div>` +
      `<span class="key">Play: click or press ${index + 1}</span>`;
    button.addEventListener('click', () => game.onPlayCard && game.onPlayCard(index));
    hand.appendChild(button);
  });

  el('end-turn').disabled = game.screen !== SCREEN_PLAY;
  renderOverlay(game);
}

function renderOverlay(game) {
  const overlay = el('overlay');
  const title = el('overlay-title');
  const sub = el('overlay-sub');
  const how = el('overlay-how');
  const btn = el('overlay-btn');
  if (game.screen === SCREEN_PLAY) {
    overlay.classList.add('hidden');
    return;
  }
  overlay.classList.remove('hidden');
  if (game.screen === SCREEN_WIN) {
    title.textContent = '★ VICTORY ★';
    sub.textContent = `Rook yields! You won the duel in ${game.round} rounds with ${game.score} damage dealt.`;
    how.textContent = 'The pact is yours — the embers answer to you now.';
    btn.textContent = 'Play Again [R]';
  } else if (game.screen === SCREEN_LOSS) {
    title.textContent = 'DEFEAT';
    sub.textContent = `Your embers fade in round ${game.round}. Rook keeps the pact… this time.`;
    how.textContent = 'Tip: watch Rook’s telegraphed intent — Guard before a heavy Strike, and chain one suit for Resonance +2.';
    btn.textContent = 'Try Again [R]';
  } else {
    title.textContent = 'EMBER PACT';
    sub.textContent = 'A duel of cards against Rook, the Thorn Keeper. First to 0 life loses.';
    how.textContent = 'How to play: each round you gain ember and draw a card. Click a card (or press 1–7) to play it — damage, Block or healing. Two cards of one suit in a turn trigger Resonance +2. Rook shows its next move in advance: read it, then counter it. Space ends your turn.';
    btn.textContent = 'Begin the Duel [Enter]';
  }
}
