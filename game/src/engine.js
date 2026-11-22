// Ember Pact — the rules engine. Pure logic, no DOM: a duel of cards between the
// player and Rook, the Thorn Keeper. First to 0 life loses.
//
// Turn flow: the player gains +1 max ember (cap 8), refills ember, draws a card,
// then plays as many cards as ember allows. Ending the turn lets Rook act on the
// intent it telegraphed, then a new round begins. Block soaks damage first and
// fades when its owner's next turn starts. Resonance: the second card of one suit
// played in a single turn gains +2 to its effect.
import { HAND_CAP, MAX_EMBER, MAX_HP, RESONANCE_BONUS, START_EMBER_MAX, START_HAND } from './config.js';
import { buildDeck, shuffle } from './deck.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_WIN = 'win';
export const SCREEN_LOSS = 'loss';

export const EVENT_NONE = 0;
export const EVENT_WIN = 1;
export const EVENT_LOSS = 2;

export function createGame(random) {
  const game = {
    random,
    screen: SCREEN_TITLE,
    round: 1,
    score: 0,
    log: [],
    you: { hp: MAX_HP, block: 0, ember: START_EMBER_MAX, emberMax: START_EMBER_MAX, hand: [], deck: [], discard: [] },
    foe: { hp: MAX_HP, block: 0, handCount: 5, intent: null },
    suitsPlayed: [],
  };
  resetDuel(game);
  return game;
}

export function resetDuel(game) {
  game.you.deck = shuffle(buildDeck(), game.random);
  game.you.discard = [];
  game.you.hand = [];
  game.you.hp = MAX_HP;
  game.you.block = 0;
  game.you.emberMax = START_EMBER_MAX;
  game.you.ember = START_EMBER_MAX;
  game.foe.hp = MAX_HP;
  game.foe.block = 0;
  game.foe.handCount = 5;
  game.round = 1;
  game.score = 0;
  game.suitsPlayed = [];
  game.log = ['The pact is sealed. Rook shuffles a thorn-wrapped deck.'];
  for (let i = 0; i < START_HAND; i++) drawCard(game);
  chooseIntent(game);
  game.screen = SCREEN_TITLE;
}

export function startDuel(game) {
  resetDuel(game);
  game.screen = SCREEN_PLAY;
  say(game, 'Your turn — play cards, then End Turn.');
}

function say(game, line) {
  game.log.push(line);
  if (game.log.length > 4) game.log.shift();
}

export function drawCard(game) {
  if (game.you.deck.length === 0) {
    if (game.you.discard.length === 0) return;
    game.you.deck = shuffle(game.you.discard, game.random);
    game.you.discard = [];
    say(game, 'Your discard pile is shuffled back into your deck.');
  }
  if (game.you.hand.length >= HAND_CAP) return;
  game.you.hand.push(game.you.deck.pop());
}

function dealDamage(game, target, amount) {
  const soaked = Math.min(target.block, amount);
  target.block -= soaked;
  const hurt = amount - soaked;
  target.hp = Math.max(0, target.hp - hurt);
  return hurt;
}

function resonance(game, card) {
  const bonus = game.suitsPlayed.includes(card.suit) ? RESONANCE_BONUS : 0;
  if (!game.suitsPlayed.includes(card.suit)) game.suitsPlayed.push(card.suit);
  return bonus;
}

/** Play the card at `index` in the player's hand. Returns an event flag. */
export function playCard(game, index) {
  if (game.screen !== SCREEN_PLAY) return EVENT_NONE;
  const card = game.you.hand[index];
  if (!card || card.cost > game.you.ember) return EVENT_NONE;
  game.you.ember -= card.cost;
  game.you.hand.splice(index, 1);
  game.you.discard.push(card);
  const bonus = resonance(game, card);
  const resText = bonus ? ` Resonance +${bonus}!` : '';
  let event = EVENT_NONE;
  if (card.kind === 'guard') {
    game.you.block += card.value + bonus;
    say(game, `You raise ${card.name}: +${card.value + bonus} Block.${resText}`);
  } else if (card.kind === 'mend') {
    const healed = Math.min(MAX_HP - game.you.hp, card.value + bonus);
    game.you.hp += healed;
    say(game, `You play ${card.name}: restore ${healed} life.${resText}`);
  } else {
    let damage = card.value + bonus;
    if (card.kind === 'volley' && bonus) damage += card.value;
    const hurt = dealDamage(game, game.foe, damage);
    game.score += hurt;
    say(game, `You play ${card.name}: ${damage} damage to Rook.${resText}`);
    if (game.foe.hp <= 0) {
      game.screen = SCREEN_WIN;
      say(game, 'Rook yields. The pact is yours!');
      return EVENT_WIN;
    }
  }
  return event;
}

/** Rook picks its next move and shows it, so the player can read it and counter. */
export function chooseIntent(game) {
  const r = game.random();
  const attackValue = Math.min(9, 4 + Math.floor(game.round / 3));
  if (game.foe.hp <= 8 && r < 0.45) {
    game.foe.intent = { type: 'mend', value: 5, text: `Rook plans to Mend — restore 5 life.` };
  } else if (r < 0.62) {
    game.foe.intent = { type: 'attack', value: attackValue, text: `Rook plans to Strike — ${attackValue} damage is coming.` };
  } else if (r < 0.85) {
    game.foe.intent = { type: 'guard', value: 6, text: `Rook plans to Guard — +6 Block.` };
  } else {
    game.foe.intent = { type: 'attack', value: attackValue + 2, text: `Rook plans a heavy Strike — ${attackValue + 2} damage is coming!` };
  }
}

/** End the player's turn: Rook acts on its telegraphed intent, then a new round begins. */
export function endTurn(game) {
  if (game.screen !== SCREEN_PLAY) return EVENT_NONE;
  const intent = game.foe.intent;
  game.foe.block = 0;
  let event = EVENT_NONE;
  if (intent) {
    if (intent.type === 'attack') {
      const hurt = dealDamage(game, game.you, intent.value);
      say(game, `Rook strikes for ${intent.value} (${hurt} through your Block).`);
      if (game.you.hp <= 0) {
        game.screen = SCREEN_LOSS;
        say(game, 'Your embers fade. Rook keeps the pact… this time.');
        return EVENT_LOSS;
      }
    } else if (intent.type === 'guard') {
      game.foe.block += intent.value;
      say(game, `Rook guards: +${intent.value} Block.`);
    } else {
      const healed = Math.min(MAX_HP - game.foe.hp, intent.value);
      game.foe.hp += healed;
      say(game, `Rook mends ${healed} life.`);
    }
  }
  game.round += 1;
  game.you.block = 0;
  game.you.emberMax = Math.min(MAX_EMBER, game.you.emberMax + 1);
  game.you.ember = game.you.emberMax;
  game.suitsPlayed = [];
  game.foe.handCount = 5;
  drawCard(game);
  chooseIntent(game);
  say(game, `Round ${game.round} — ${game.you.ember} ember, draw a card.`);
  return event;
}
