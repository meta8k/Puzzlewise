import { describe, expect, it } from "vitest";
import { checkAnswer, levenshtein, normalise } from "../src/lib/answerMatching";

describe("normalise", () => {
  it("lowercases and trims", () => {
    expect(normalise("  Banana  ")).toBe("banana");
  });

  it("strips punctuation", () => {
    expect(normalise("banana!")).toBe("banana");
    expect(normalise("the clock.")).toBe("clock");
  });

  it("strips leading articles", () => {
    expect(normalise("a banana")).toBe("banana");
    expect(normalise("an umbrella")).toBe("umbrella");
    expect(normalise("the clock")).toBe("clock");
  });
});

describe("levenshtein", () => {
  it("is zero for identical strings", () => {
    expect(levenshtein("banana", "banana")).toBe(0);
  });

  it("counts single-character edits", () => {
    expect(levenshtein("banana", "banna")).toBe(1);
    expect(levenshtein("clock", "cloak")).toBe(1);
  });

  it("counts larger differences", () => {
    expect(levenshtein("kitten", "sitting")).toBe(3);
  });
});

describe("checkAnswer", () => {
  const answers = ["banana", "bananas"];

  it("accepts an exact match", () => {
    const result = checkAnswer("banana", answers);
    expect(result.correct).toBe(true);
  });

  it("is case and whitespace insensitive", () => {
    const result = checkAnswer("  BANANA  ", answers);
    expect(result.correct).toBe(true);
  });

  it("accepts a leading article", () => {
    const result = checkAnswer("a banana", answers);
    expect(result.correct).toBe(true);
  });

  it("accepts a simple plural the answer list didn't include", () => {
    const result = checkAnswer("clocks", ["clock"]);
    expect(result.correct).toBe(true);
  });

  it("accepts a near-miss typo for longer words and flags it", () => {
    const result = checkAnswer("banann", answers);
    expect(result.correct).toBe(true);
    if (result.correct) {
      expect(result.nearMiss).toBe(true);
    }
  });

  it("accepts a typo for a 5-letter word (per the forgiving-answer rule)", () => {
    const result = checkAnswer("clocc", ["clock"]);
    expect(result.correct).toBe(true);
  });

  it("does not accept typos for short words under 5 letters", () => {
    const result = checkAnswer("cot", ["cat"]);
    expect(result.correct).toBe(false);
  });

  it("rejects unrelated words", () => {
    const result = checkAnswer("umbrella", answers);
    expect(result.correct).toBe(false);
  });

  it("rejects an empty guess", () => {
    const result = checkAnswer("   ", answers);
    expect(result.correct).toBe(false);
  });
});
