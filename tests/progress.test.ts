import { beforeEach, describe, expect, it } from "vitest";
import {
  getLevelSession,
  getPuzzleResult,
  isLevelUnlocked,
  recordLevelSession,
  recordPuzzleResult,
  resetProgress,
} from "../src/state/progress";

beforeEach(() => {
  window.localStorage.clear();
});

describe("recordPuzzleResult / getPuzzleResult", () => {
  it("stores and retrieves a puzzle result", () => {
    recordPuzzleResult("p1", { solved: true, stars: 3, hintsUsed: 0 });
    expect(getPuzzleResult("p1")).toEqual({ solved: true, stars: 3, hintsUsed: 0 });
  });

  it("keeps the best stars across repeated attempts", () => {
    recordPuzzleResult("p1", { solved: true, stars: 1, hintsUsed: 3 });
    recordPuzzleResult("p1", { solved: true, stars: 3, hintsUsed: 0 });
    expect(getPuzzleResult("p1")?.stars).toBe(3);
  });

  it("does not downgrade solved to unsolved", () => {
    recordPuzzleResult("p1", { solved: true, stars: 2, hintsUsed: 1 });
    recordPuzzleResult("p1", { solved: false, stars: 1, hintsUsed: 3 });
    expect(getPuzzleResult("p1")?.solved).toBe(true);
  });
});

describe("recordLevelSession / getLevelSession", () => {
  it("stores a session result", () => {
    recordLevelSession(1, 1, 6, 8, 20);
    const session = getLevelSession(1, 1);
    expect(session).toMatchObject({ bestSolved: 6, totalOutOf: 8, bestStars: 20, attempts: 1 });
  });

  it("keeps the best result across multiple attempts, and counts attempts", () => {
    recordLevelSession(1, 1, 3, 8, 10);
    recordLevelSession(1, 1, 7, 8, 22);
    recordLevelSession(1, 1, 5, 8, 15);
    const session = getLevelSession(1, 1);
    expect(session?.bestSolved).toBe(7);
    expect(session?.bestStars).toBe(22);
    expect(session?.attempts).toBe(3);
  });

  it("keeps separate sessions per camp/level", () => {
    recordLevelSession(1, 1, 8, 8, 24);
    recordLevelSession(1, 2, 2, 8, 5);
    expect(getLevelSession(1, 1)?.bestSolved).toBe(8);
    expect(getLevelSession(1, 2)?.bestSolved).toBe(2);
  });

  it("returns undefined for a level never played", () => {
    expect(getLevelSession(2, 3)).toBeUndefined();
  });
});

describe("isLevelUnlocked", () => {
  it("camp 1 level 1 is always unlocked", () => {
    expect(isLevelUnlocked(1, 1)).toBe(true);
  });

  it("camp 1 level 2 is locked until level 1 has a good enough session", () => {
    expect(isLevelUnlocked(1, 2)).toBe(false);
    recordLevelSession(1, 1, 5, 8, 15);
    expect(isLevelUnlocked(1, 2)).toBe(true);
  });

  it("requires at least 5 out of 8 (or the level's total) to unlock the next level", () => {
    recordLevelSession(1, 1, 4, 8, 12);
    expect(isLevelUnlocked(1, 2)).toBe(false);
    recordLevelSession(1, 1, 5, 8, 15);
    expect(isLevelUnlocked(1, 2)).toBe(true);
  });

  it("camp 2 level 1 unlocks after camp 1 level 3 is passed", () => {
    expect(isLevelUnlocked(2, 1)).toBe(false);
    recordLevelSession(1, 3, 6, 8, 18);
    expect(isLevelUnlocked(2, 1)).toBe(true);
  });
});

describe("resetProgress", () => {
  it("clears both puzzle results and level sessions", () => {
    recordPuzzleResult("p1", { solved: true, stars: 3, hintsUsed: 0 });
    recordLevelSession(1, 1, 8, 8, 24);
    resetProgress();
    expect(getPuzzleResult("p1")).toBeUndefined();
    expect(getLevelSession(1, 1)).toBeUndefined();
  });
});
