import { beforeEach, describe, expect, it } from "vitest";
import { commitPuzzleDraw, peekPuzzleIds } from "../src/state/puzzleDeck";

const POOL = Array.from({ length: 16 }, (_, i) => `p${i + 1}`);

beforeEach(() => {
  window.localStorage.clear();
});

describe("peekPuzzleIds", () => {
  it("returns the requested count without mutating the deck", () => {
    const a = peekPuzzleIds(1, 1, POOL, 8);
    const b = peekPuzzleIds(1, 1, POOL, 8);
    expect(a).toHaveLength(8);
    // Calling peek repeatedly (e.g. React double-render) must be a no-op,
    // so it returns the exact same set every time until something commits.
    expect(b).toEqual(a);
  });
});

describe("commitPuzzleDraw", () => {
  it("returns the requested count and matches what peek showed", () => {
    const peeked = peekPuzzleIds(1, 1, POOL, 8);
    const committed = commitPuzzleDraw(1, 1, POOL, 8);
    expect(committed).toHaveLength(8);
    expect(committed).toEqual(peeked);
  });

  it("draws every id exactly once across two consecutive commits before repeating", () => {
    const first = commitPuzzleDraw(1, 1, POOL, 8);
    const second = commitPuzzleDraw(1, 1, POOL, 8);
    const combined = [...first, ...second];
    expect(new Set(combined).size).toBe(16);
    expect(combined.every((id) => POOL.includes(id))).toBe(true);
  });

  it("peek reflects the deck state after a commit", () => {
    const first = commitPuzzleDraw(1, 1, POOL, 8);
    const peekedSecond = peekPuzzleIds(1, 1, POOL, 8);
    expect(peekedSecond.some((id) => first.includes(id))).toBe(false);
  });

  it("reshuffles and draws again without erroring once the pool is exhausted", () => {
    commitPuzzleDraw(1, 1, POOL, 8);
    commitPuzzleDraw(1, 1, POOL, 8);
    const third = commitPuzzleDraw(1, 1, POOL, 8);
    expect(third).toHaveLength(8);
    expect(third.every((id) => POOL.includes(id))).toBe(true);
  });

  it("keeps separate decks per camp/level", () => {
    const a = commitPuzzleDraw(1, 1, POOL, 8);
    const b = commitPuzzleDraw(1, 2, POOL, 8);
    expect(a).toHaveLength(8);
    expect(b).toHaveLength(8);
  });

  it("recovers gracefully if the pool size changes between visits", () => {
    commitPuzzleDraw(1, 1, POOL, 8);
    const smallerPool = POOL.slice(0, 10);
    const drawn = commitPuzzleDraw(1, 1, smallerPool, 8);
    expect(drawn).toHaveLength(8);
    expect(drawn.every((id) => smallerPool.includes(id))).toBe(true);
  });

  it("is unaffected by repeated peeks before it runs (simulates StrictMode double-render)", () => {
    peekPuzzleIds(1, 1, POOL, 8);
    peekPuzzleIds(1, 1, POOL, 8);
    peekPuzzleIds(1, 1, POOL, 8);
    const first = commitPuzzleDraw(1, 1, POOL, 8);
    const second = commitPuzzleDraw(1, 1, POOL, 8);
    const combined = [...first, ...second];
    expect(new Set(combined).size).toBe(16);
  });
});
