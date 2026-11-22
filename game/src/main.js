// Ember Pact — boot. ?seed=N fixes the deck and Rook's intents. ?shot=start|play|
// win|loss stages that scene instead of starting the loop, renders it twice and
// sets window.__shotReady for a screenshot. Otherwise the duel runs on clicks
// and keys, re-rendering after every action.
import { createRandom } from './random.js';
import { createGame, endTurn, EVENT_LOSS, EVENT_WIN, playCard, resetDuel, startDuel } from './engine.js';
import { createInput } from './input.js';
import { render } from './render.js';
import { stageShot } from './shots.js';
import { sfx } from './audio.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const game = createGame(createRandom(seed));
const status = document.getElementById('status');

function announce(message) {
  status.textContent = message;
}

function afterAction(event) {
  if (event === EVENT_WIN) { sfx.win(); announce(`Victory! Score ${game.score}.`); }
  else if (event === EVENT_LOSS) { sfx.loss(); announce('Defeat. Rook keeps the pact.'); }
  render(game);
}

game.onPlayCard = (index) => afterAction(playCard(game, index));

const hooks = {
  start() { startDuel(game); sfx.play(); announce('Playing. Your turn.'); render(game); },
  restart() { resetDuel(game); startDuel(game); announce('A new duel begins.'); render(game); },
  endTurn() { afterAction(endTurn(game)); },
  play(index) { game.onPlayCard(index); },
};

if (shot) {
  stageShot(shot, game);
  let painted = 0;
  (function paint() {
    render(game);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }());
} else {
  createInput(game, hooks);
  render(game);
  announce('Ember Pact. Press Enter or click Begin the Duel to start.');
}
