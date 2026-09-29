import { shuffle } from "../lib/shuffle";

const STORAGE_KEY = "puzzle-peaks:deck:v1";

type DeckState = {
  order: string[];
  cursor: number;
};

type DeckStore = Record<string, DeckState>;

function deckKey(camp: number, level: number): string {
  return `${camp}-${level}`;
}

function safeReadDecks(): DeckStore {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as DeckStore;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function safeWriteDecks(decks: DeckStore): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
  } catch {
    // localStorage may be blocked; the deck just won't persist across visits.
  }
}

/**
 * Loads the deck for this camp/level, creating (and persisting) a freshly
 * shuffled one if none exists yet, the pool has changed, or the current
 * deck doesn't have `count` ids left. Persisting the fresh shuffle
 * immediately - even from a "read" path - is what makes repeated calls
 * (e.g. React re-rendering, or peek followed by commit) agree on the same
 * order instead of each inventing their own randomness.
 */
function loadOrCreateDeck(
  camp: number,
  level: number,
  poolIds: string[],
  count: number,
): { decks: DeckStore; key: string; deck: DeckState } {
  const decks = safeReadDecks();
  const key = deckKey(camp, level);
  const existing = decks[key];
  const stillValid =
    existing && existing.order.length === poolIds.length && existing.order.every((id) => poolIds.includes(id));

  let deck: DeckState = stillValid ? existing! : { order: shuffle(poolIds), cursor: 0 };
  if (deck.cursor + count > deck.order.length) {
    deck = { order: shuffle(poolIds), cursor: 0 };
  }

  if (deck !== existing) {
    decks[key] = deck;
    safeWriteDecks(decks);
  }

  return { decks, key, deck };
}

/**
 * Read-only preview of what the next draw for this camp/level would be.
 * Safe to call more than once for the same draw (e.g. React calling a
 * render function twice in development) - it always returns the same ids
 * until something actually commits a draw.
 */
export function peekPuzzleIds(camp: number, level: number, poolIds: string[], count: number): string[] {
  const { deck } = loadOrCreateDeck(camp, level, poolIds, count);
  return deck.order.slice(deck.cursor, deck.cursor + count);
}

/**
 * Advances the deck for this camp/level, persisting that this draw has been
 * shown so it won't repeat until the pool cycles. Call this exactly once
 * per real visit to a level (e.g. from a ref-guarded effect), never
 * directly from render.
 */
export function commitPuzzleDraw(camp: number, level: number, poolIds: string[], count: number): string[] {
  const { decks, key, deck } = loadOrCreateDeck(camp, level, poolIds, count);
  const chosen = deck.order.slice(deck.cursor, deck.cursor + count);
  decks[key] = { order: deck.order, cursor: deck.cursor + count };
  safeWriteDecks(decks);
  return chosen;
}
