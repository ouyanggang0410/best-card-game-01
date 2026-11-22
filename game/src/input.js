// Ember Pact — keyboard and mouse input. Keys 1-7 play hand cards, Space ends the
// turn, Enter starts, R restarts. Clicking a card or the buttons does the same.
import { SCREEN_LOSS, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './engine.js';

export function createInput(game, hooks) {
  function onKey(event) {
    if (event.repeat) return;
    const key = event.key;
    if (game.screen === SCREEN_TITLE && (key === 'Enter' || key === ' ')) {
      event.preventDefault();
      hooks.start();
      return;
    }
    if ((game.screen === SCREEN_WIN || game.screen === SCREEN_LOSS) && (key === 'r' || key === 'R' || key === 'Enter' || key === ' ')) {
      event.preventDefault();
      hooks.restart();
      return;
    }
    if (game.screen !== SCREEN_PLAY) return;
    if (key === ' ') {
      event.preventDefault();
      hooks.endTurn();
      return;
    }
    if (key === 'r' || key === 'R') {
      hooks.restart();
      return;
    }
    const n = Number.parseInt(key, 10);
    if (n >= 1 && n <= game.you.hand.length) hooks.play(n - 1);
  }
  document.addEventListener('keydown', onKey);
  document.getElementById('end-turn').addEventListener('click', hooks.endTurn);
  document.getElementById('restart').addEventListener('click', hooks.restart);
  document.getElementById('overlay-btn').addEventListener('click', () => {
    if (game.screen === SCREEN_TITLE) hooks.start();
    else hooks.restart();
  });
}
