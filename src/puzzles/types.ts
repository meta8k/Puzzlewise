import type { Puzzle } from "../content/schema";

export type PuzzleOutcome = {
  solved: boolean;
  stars: 1 | 2 | 3;
  hintsUsed: number;
};

export type PuzzleComponentProps = {
  puzzle: Puzzle;
  onComplete: (outcome: PuzzleOutcome) => void;
};
