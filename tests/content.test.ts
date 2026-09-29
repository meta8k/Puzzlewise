import { describe, expect, it } from "vitest";
import { allPuzzles } from "../src/content/loadPuzzles";
import { normalise } from "../src/lib/answerMatching";

describe("puzzle content", () => {
  it("has puzzles loaded", () => {
    expect(allPuzzles.length).toBeGreaterThan(0);
  });

  it("has no duplicate ids", () => {
    const ids = allPuzzles.map((p) => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("has 48 puzzles for each of camp 1 and camp 2, 16 per level", () => {
    for (const camp of [1, 2]) {
      for (const level of [1, 2, 3]) {
        const count = allPuzzles.filter((p) => p.camp === camp && p.level === level).length;
        expect(count).toBe(16);
      }
    }
  });

  it.each(allPuzzles)("puzzle $id has three non-empty hints", (puzzle) => {
    expect(puzzle.hints).toHaveLength(3);
    for (const hint of puzzle.hints) {
      expect(hint.trim().length).toBeGreaterThan(0);
    }
  });

  it.each(allPuzzles)("puzzle $id has a non-empty explanation", (puzzle) => {
    expect(puzzle.explanation.trim().length).toBeGreaterThan(0);
  });

  it.each(allPuzzles)("puzzle $id has at least one accepted answer", (puzzle) => {
    expect(puzzle.answers.length).toBeGreaterThan(0);
    for (const answer of puzzle.answers) {
      expect(answer.trim().length).toBeGreaterThan(0);
    }
  });

  it.each(allPuzzles)("puzzle $id is marked reviewed before being shown to children", (puzzle) => {
    expect(puzzle.reviewed).toBe(true);
  });

  it.each(allPuzzles)("puzzle $id does not give away its answer in the prompt text", (puzzle) => {
    const normalisedPrompt = normalise(puzzle.prompt.replace(/\n/g, " "));
    for (const answer of puzzle.answers) {
      const normalisedAnswer = normalise(answer);
      if (normalisedAnswer.length === 0) continue;
      // Word-boundary match, so "car" doesn't false-positive on "carrying".
      const escaped = normalisedAnswer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = new RegExp(`\\b${escaped}\\b`);
      expect(pattern.test(normalisedPrompt)).toBe(false);
    }
  });
});
