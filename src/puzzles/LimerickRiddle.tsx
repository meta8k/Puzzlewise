import { TextAnswerPuzzle } from "./TextAnswerPuzzle";
import type { PuzzleComponentProps } from "./types";
import styles from "./Limerick.module.css";

export function LimerickRiddle(props: PuzzleComponentProps) {
  return <TextAnswerPuzzle {...props} promptClassName={styles.limerick} />;
}
