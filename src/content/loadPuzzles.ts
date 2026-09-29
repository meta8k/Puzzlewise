import camp1Raw from "./puzzles/camp1.json";
import camp2Raw from "./puzzles/camp2.json";
import { PuzzleListSchema, type Puzzle } from "./schema";

function parseCamp(raw: unknown, label: string): Puzzle[] {
  const result = PuzzleListSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`Invalid puzzle content in ${label}: ${result.error.message}`);
  }
  return result.data;
}

export const allPuzzles: Puzzle[] = [
  ...parseCamp(camp1Raw, "camp1.json"),
  ...parseCamp(camp2Raw, "camp2.json"),
];

export function puzzlesForCampLevel(camp: number, level: number): Puzzle[] {
  return allPuzzles.filter((p) => p.camp === camp && p.level === level);
}

export function puzzleById(id: string): Puzzle | undefined {
  return allPuzzles.find((p) => p.id === id);
}
