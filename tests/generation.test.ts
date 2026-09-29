import { describe, expect, it } from "vitest";
import {
  buildGenerationSystemPrompt,
  validateAndFilterGenerated,
} from "../src/content/generation";

const goodPuzzle = {
  type: "riddle",
  prompt: "I have petals and a stem, and bees love to visit me.",
  answers: ["flower"],
  hints: ["I grow in gardens.", "I come in many colours.", "Bees collect pollen from me."],
  explanation: "Flowers attract bees with their colour and scent.",
  skill: "knowledge",
  difficulty: 2,
};

describe("validateAndFilterGenerated", () => {
  it("accepts a well-formed, safe puzzle and assigns id/camp/level/source/reviewed", () => {
    const { accepted, rejectedCount } = validateAndFilterGenerated([goodPuzzle], 1, 2);
    expect(rejectedCount).toBe(0);
    expect(accepted).toHaveLength(1);
    const p = accepted[0];
    expect(p.camp).toBe(1);
    expect(p.level).toBe(2);
    expect(p.source).toBe("claude-generated");
    expect(p.reviewed).toBe(true);
    expect(p.id).toMatch(/^gen-1-2-/);
  });

  it("rejects a puzzle whose answer appears in its own prompt", () => {
    const bad = { ...goodPuzzle, prompt: "I am a flower that bees love to visit." };
    const { accepted, rejectedCount } = validateAndFilterGenerated([bad], 1, 1);
    expect(accepted).toHaveLength(0);
    expect(rejectedCount).toBe(1);
  });

  it("rejects a puzzle containing a blocklisted word in the prompt", () => {
    const bad = { ...goodPuzzle, prompt: "I have a gun and bees love to visit me anyway." };
    const { accepted } = validateAndFilterGenerated([bad], 1, 1);
    expect(accepted).toHaveLength(0);
  });

  it("rejects a puzzle containing a blocklisted word in the explanation", () => {
    const bad = { ...goodPuzzle, explanation: "This is scary but flowers are nice." };
    const { accepted } = validateAndFilterGenerated([bad], 1, 1);
    expect(accepted).toHaveLength(0);
  });

  it("rejects a puzzle containing a blocklisted word in a hint", () => {
    const bad = { ...goodPuzzle, hints: ["I grow in gardens.", "War is bad.", "Bees collect pollen from me."] as [string, string, string] };
    const { accepted } = validateAndFilterGenerated([bad], 1, 1);
    expect(accepted).toHaveLength(0);
  });

  it("rejects a puzzle whose type isn't supported by the Phase 1 player", () => {
    const bad = { ...goodPuzzle, type: "cipher" };
    const { accepted } = validateAndFilterGenerated([bad], 1, 1);
    expect(accepted).toHaveLength(0);
  });

  it("rejects malformed input that doesn't match the schema", () => {
    const { accepted, rejectedCount } = validateAndFilterGenerated([{ prompt: "incomplete" }], 1, 1);
    expect(accepted).toHaveLength(0);
    expect(rejectedCount).toBeGreaterThan(0);
  });

  it("rejects non-array input entirely", () => {
    const { accepted } = validateAndFilterGenerated({ not: "an array" }, 1, 1);
    expect(accepted).toHaveLength(0);
  });

  it("keeps good puzzles and drops bad ones from a mixed batch", () => {
    const bad = { ...goodPuzzle, prompt: "I have a knife and bees love to visit me." };
    const { accepted, rejectedCount } = validateAndFilterGenerated([goodPuzzle, bad], 1, 1);
    expect(accepted).toHaveLength(1);
    expect(rejectedCount).toBe(1);
  });

  it("assigns unique ids across multiple accepted puzzles", () => {
    const second = { ...goodPuzzle, prompt: "I glow at night and orbit the earth." , answers: ["moon"]};
    const { accepted } = validateAndFilterGenerated([goodPuzzle, second], 1, 1);
    expect(accepted).toHaveLength(2);
    expect(accepted[0].id).not.toBe(accepted[1].id);
  });

  it("lowercases answers for consistent matching", () => {
    const shouting = { ...goodPuzzle, answers: ["FLOWER"] };
    const { accepted } = validateAndFilterGenerated([shouting], 1, 1);
    expect(accepted[0].answers).toEqual(["flower"]);
  });
});

describe("buildGenerationSystemPrompt", () => {
  it("includes the camp name, age range, and requested count", () => {
    const prompt = buildGenerationSystemPrompt({
      campName: "Meadow",
      ageRange: "6-7",
      count: 8,
      examples: [],
    });
    expect(prompt).toContain("Meadow");
    expect(prompt).toContain("6-7");
    expect(prompt).toContain("8 brand-new puzzles");
  });

  it("instructs the model to return only JSON with no commentary", () => {
    const prompt = buildGenerationSystemPrompt({ campName: "Forest", ageRange: "7-8", count: 5, examples: [] });
    expect(prompt.toLowerCase()).toContain("only the json array");
  });

  it("embeds the provided examples", () => {
    const prompt = buildGenerationSystemPrompt({
      campName: "Meadow",
      ageRange: "6-7",
      count: 3,
      examples: [goodPuzzle as never],
    });
    expect(prompt).toContain("bees love to visit me");
  });
});
