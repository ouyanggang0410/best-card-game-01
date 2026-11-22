// Ember Pact — screenshot scenes behind ?shot=start|play|win|loss. Each scene plays
// the real rules forward from a fresh duel with a fixed seed, steered by a simple
// autopilot, so every frame is what a short game really looks like and the same
// seed always gives the same frame. No state is faked: win and loss are earned
// by playing (or, for the loss, by passing while Rook attacks).
import { endTurn, playCard, SCREEN_LOSS, SCREEN_PLAY, SCREEN_WIN, startDuel } from './engine.js';

/** The autopilot's card order: guard a telegraphed heavy strike, mend when hurt,
 *  otherwise biggest damage first — the sensible play a good player makes. */
function pickCard(game) {
  const hand = game.you.hand;
  const affordable = (kind) => hand.findIndex((card) => card.kind === kind && card.cost <= game.you.ember);
  const intent = game.foe.intent;
  if (intent && intent.type === 'attack' && intent.value >= 6 && game.you.block < intent.value) {
    const guard = affordable('guard');
    if (guard >= 0) return guard;
  }
  if (game.you.hp <= 10) {
    const mend = affordable('mend');
    if (mend >= 0) return mend;
  }
  const damage = hand
    .map((card, index) => ({ card, index }))
    .filter(({ card }) => card.cost <= game.you.ember && card.kind !== 'guard' && card.kind !== 'mend')
    .sort((a, b) => b.card.value - a.card.value);
  if (damage.length) return damage[0].index;
  if (intent && intent.type === 'attack') {
    const guard = affordable('guard');
    if (guard >= 0) return guard;
  }
  return -1;
}

function playTurn(game) {
  for (let guard = 0; guard < 7; guard++) {
    const index = pickCard(game);
    if (index < 0) break;
    playCard(game, index);
    if (game.screen !== SCREEN_PLAY) return;
  }
  endTurn(game);
}

/**
 * Set `game` to the named scene and return it. start shows the title; play a
 * mid-duel table; win and loss play the duel out to its real end.
 */
export function stageShot(name, game) {
  startDuel(game);
  if (name === 'start') {
    game.screen = 'title';
    return game;
  }
  if (name === 'win') {
    for (let round = 0; round < 40 && game.screen === SCREEN_PLAY; round++) playTurn(game);
    return game;
  }
  if (name === 'loss') {
    for (let round = 0; round < 40 && game.screen === SCREEN_PLAY; round++) endTurn(game);
    return game;
  }
  // play: three full rounds, then open the fourth with a fresh hand on the table.
  for (let round = 0; round < 3 && game.screen === SCREEN_PLAY; round++) playTurn(game);
  return game;
}
