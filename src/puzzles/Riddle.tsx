import { TextAnswerPuzzle } from "./TextAnswerPuzzle";
import type { PuzzleComponentProps } from "./types";

export function Riddle(props: PuzzleComponentProps) {
  return <TextAnswerPuzzle {...props} />;
}
