import { useState } from "react";
import type { FormEvent } from "react";
import { checkAnswer } from "../lib/answerMatching";
import { HintLadder } from "../components/HintLadder";
import { ReadAloud } from "../components/ReadAloud";
import { Stars } from "../components/Stars";
import { Button } from "../components/Button";
import type { PuzzleComponentProps } from "./types";
import styles from "./TextAnswerPuzzle.module.css";

const MAX_TRIES_BEFORE_REVEAL = 3;

function starsForHints(hintsUsed: number): 1 | 2 | 3 {
  if (hintsUsed === 0) return 3;
  if (hintsUsed <= 2) return 2;
  return 1;
}

type Props = PuzzleComponentProps & {
  promptClassName?: string;
};

export function TextAnswerPuzzle({ puzzle, onComplete, promptClassName }: Props) {
  const [guess, setGuess] = useState("");
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const [tries, setTries] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [status, setStatus] = useState<"playing" | "solved" | "revealed">("playing");
  const [revealReason, setRevealReason] = useState<"tries" | "skip" | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (status !== "playing" || guess.trim().length === 0) return;

    const result = checkAnswer(guess, puzzle.answers);
    if (result.correct) {
      setStatus("solved");
      setFeedback(
        result.nearMiss
          ? `Nearly perfect spelling! It's ${result.matchedAnswer}.`
          : "That's it! Well done.",
      );
      onComplete({ solved: true, stars: starsForHints(hintsRevealed), hintsUsed: hintsRevealed });
    } else {
      const nextTries = tries + 1;
      setTries(nextTries);
      setGuess("");
      if (nextTries >= MAX_TRIES_BEFORE_REVEAL) {
        revealAnswer("tries");
      } else {
        setFeedback("Not quite. Want a hint?");
      }
    }
  }

  function revealAnswer(reason: "tries" | "skip") {
    setStatus("revealed");
    setRevealReason(reason);
    onComplete({ solved: false, stars: 1, hintsUsed: hintsRevealed });
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.promptRow}>
        <p className={[styles.prompt, promptClassName].filter(Boolean).join(" ")}>
          {puzzle.prompt}
        </p>
        <ReadAloud text={puzzle.prompt} label="Read the puzzle aloud" />
      </div>

      {status === "playing" && (
        <>
          <form onSubmit={handleSubmit} className={styles.form}>
            <label htmlFor="answer-input" className={styles.visuallyHidden}>
              Your answer
            </label>
            <input
              id="answer-input"
              className={styles.input}
              type="text"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              placeholder="Type your answer"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
            />
            <Button type="submit">Check</Button>
          </form>

          {feedback && <p className={styles.feedback}>{feedback}</p>}

          <HintLadder
            hints={puzzle.hints}
            hintsRevealed={hintsRevealed}
            onRevealNext={() => setHintsRevealed((n) => Math.min(n + 1, puzzle.hints.length))}
          />

          <button
            type="button"
            className={styles.skipLink}
            onClick={() => revealAnswer("skip")}
          >
            Skip this one →
          </button>
        </>
      )}

      {(status === "solved" || status === "revealed") && (
        <div className={styles.resultBox}>
          {status === "solved" ? (
            <>
              <p className={styles.feedback}>{feedback}</p>
              <Stars count={starsForHints(hintsRevealed)} />
            </>
          ) : (
            <p className={styles.feedback}>
              {revealReason === "skip" ? "No worries, here's the answer:" : "Nice try! The answer was"}{" "}
              <strong>{puzzle.answers[0]}</strong>.
            </p>
          )}
          <div className={styles.explanationRow}>
            <p className={styles.explanation}>{puzzle.explanation}</p>
            <ReadAloud text={puzzle.explanation} label="Read the explanation aloud" />
          </div>
        </div>
      )}
    </div>
  );
}
