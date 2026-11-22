// Ember Pact — the deck. Four original suits, each told apart by colour, shape and
// name; six card kinds, four copies of each, one suit per copy, 24 cards in all.
// No names, art or rules are taken from any existing commercial card game.
export const SUITS = {
  flame: { name: 'Flame', glyph: '▲', color: '#e04a2f' },
  tide: { name: 'Tide', glyph: '●', color: '#2f7fe0' },
  thorn: { name: 'Thorn', glyph: '✦', color: '#3fae5a' },
  stone: { name: 'Stone', glyph: '■', color: '#8a7a5a' },
};

const KINDS = [
  { kind: 'strike', name: 'Ember Strike', cost: 1, value: 3, text: 'Deal 3 damage.' },
  { kind: 'slash', name: 'Cinder Slash', cost: 2, value: 5, text: 'Deal 5 damage.' },
  { kind: 'surge', name: 'Flame Surge', cost: 3, value: 7, text: 'Deal 7 damage.' },
  { kind: 'guard', name: 'Stone Guard', cost: 1, value: 5, text: 'Gain 5 Block.' },
  { kind: 'mend', name: 'Tide Mend', cost: 2, value: 4, text: 'Restore 4 life.' },
  { kind: 'volley', name: 'Thorn Volley', cost: 2, value: 4, text: 'Deal 4 damage. Resonance: deal 4 again.' },
];

const SUIT_KEYS = ['flame', 'tide', 'thorn', 'stone'];

export function buildDeck() {
  const deck = [];
  let id = 0;
  for (const kind of KINDS) {
    for (const suit of SUIT_KEYS) {
      deck.push({ id: id++, ...kind, suit });
    }
  }
  return deck;
}

/** Fisher–Yates shuffle driven by the seeded random, so a seed replays the same deck. */
export function shuffle(deck, random) {
  const out = deck.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
