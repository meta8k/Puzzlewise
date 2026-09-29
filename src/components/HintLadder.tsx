import { ReadAloud } from "./ReadAloud";
import { Button } from "./Button";
import styles from "./HintLadder.module.css";

type Props = {
  hints: [string, string, string];
  hintsRevealed: number;
  onRevealNext: () => void;
};

export function HintLadder({ hints, hintsRevealed, onRevealNext }: Props) {
  const canRevealMore = hintsRevealed < hints.length;

  return (
    <div className={styles.wrapper}>
      {hints.slice(0, hintsRevealed).map((hint, i) => (
        <p key={i} className={styles.hint}>
          <span className={styles.hintLabel}>💡 Hint {i + 1}:</span> {hint}
          <ReadAloud text={hint} label={`Read hint ${i + 1} aloud`} />
        </p>
      ))}
      {canRevealMore && (
        <Button variant="secondary" onClick={onRevealNext}>
          {hintsRevealed === 0 ? "💡 Show a hint" : "💡 Show another hint"}
        </Button>
      )}
    </div>
  );
}
