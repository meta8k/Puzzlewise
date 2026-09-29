import { useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { campInfo } from "./camps";
import { puzzlesForCampLevel } from "../content/loadPuzzles";
import { getPuzzleResult, recordPuzzleResult } from "../state/progress";
import { getPuzzleComponent } from "../puzzles/registry";
import type { PuzzleOutcome } from "../puzzles/types";
import type { Puzzle } from "../content/schema";
import { shuffle } from "../lib/shuffle";
import { Button } from "../components/Button";
import { Stars } from "../components/Stars";
import styles from "./LevelPage.module.css";

const TYPE_BADGES: Record<Puzzle["type"], string> = {
  riddle: "🧩 Riddle",
  "limerick-riddle": "🎵 Limerick",
  "limerick-fill": "✏️ Finish the rhyme",
  "word-ladder": "🪜 Word ladder",
  anagram: "🔤 Anagram",
  sequence: "🔢 Sequence",
  logic: "🧠 Logic",
  cipher: "🔐 Cipher",
  trivia: "❓ Trivia",
  "rhyme-builder": "🎤 Rhyme builder",
};

export function LevelPage() {
  const { campId, levelId } = useParams();
  const camp = campInfo(Number(campId));
  const level = Number(levelId);
  const puzzles = useMemo(
    () => (camp ? shuffle(puzzlesForCampLevel(camp.id, level)) : []),
    [camp, level],
  );

  const [index, setIndex] = useState(0);
  const [lastOutcome, setLastOutcome] = useState<PuzzleOutcome | null>(null);
  const [sessionStars, setSessionStars] = useState(0);
  const [sessionSolved, setSessionSolved] = useState(0);
  const [solvedIds, setSolvedIds] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const p of puzzles) {
      if (getPuzzleResult(p.id)?.solved) initial[p.id] = true;
    }
    return initial;
  });

  if (!camp || !camp.hasContent || puzzles.length === 0 || Number.isNaN(level)) {
    return <Navigate to="/mountain" replace />;
  }

  const puzzle = puzzles[index];
  const PuzzleComponent = getPuzzleComponent(puzzle.type);
  const isLastPuzzle = index === puzzles.length - 1;
  const finished = index >= puzzles.length;

  function handleComplete(outcome: PuzzleOutcome) {
    recordPuzzleResult(puzzle.id, outcome);
    setLastOutcome(outcome);
    setSessionStars((s) => s + outcome.stars);
    if (outcome.solved) {
      setSessionSolved((s) => s + 1);
      setSolvedIds((ids) => ({ ...ids, [puzzle.id]: true }));
    }
  }

  function goNext() {
    setLastOutcome(null);
    setIndex((i) => i + 1);
  }

  if (finished) {
    return (
      <div className={[styles.page, camp.paletteClass].join(" ")}>
        <div className={styles.finishedCard}>
          <span className={styles.finishedEmoji} aria-hidden="true">
            🎉
          </span>
          <h1 className={styles.title}>Level complete!</h1>
          <p className={styles.summary}>
            You solved {sessionSolved} out of {puzzles.length} puzzles.
          </p>
          <Stars count={Math.min(3, Math.round(sessionStars / puzzles.length))} />
          <div className={styles.actions}>
            <Link to={`/camp/${camp.id}`}>
              <Button>Back to {camp.name}</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const previousResult = getPuzzleResult(puzzle.id);

  return (
    <div className={[styles.page, camp.paletteClass].join(" ")}>
      <div className={styles.topBar}>
        <Link to={`/camp/${camp.id}`} className={styles.backLink}>
          ← Exit level
        </Link>
        <span className={styles.campLabel}>
          {camp.emoji} {camp.name} · Level {level}
        </span>
      </div>

      <ol className={styles.trail} aria-label={`Puzzle ${index + 1} of ${puzzles.length}`}>
        {puzzles.map((p, i) => {
          const dotState = i === index ? styles.dotCurrent : solvedIds[p.id] ? styles.dotSolved : styles.dotPending;
          return (
            <li key={p.id} className={[styles.dot, dotState].join(" ")} aria-hidden="true" />
          );
        })}
      </ol>

      <div className={styles.card}>
        <span className={styles.cardWatermark} aria-hidden="true">
          {camp.emoji}
        </span>
        <span className={styles.typeBadge}>{TYPE_BADGES[puzzle.type] ?? puzzle.type}</span>
        {PuzzleComponent ? (
          <PuzzleComponent
            key={puzzle.id}
            puzzle={puzzle}
            onComplete={handleComplete}
          />
        ) : (
          <p>This puzzle type isn't supported yet.</p>
        )}
      </div>

      {previousResult?.solved && !lastOutcome && (
        <p className={styles.alreadySolvedNote}>✅ You've already solved this one before.</p>
      )}

      {lastOutcome && (
        <div className={styles.actions}>
          <Button onClick={goNext}>{isLastPuzzle ? "Finish level 🏁" : "Next puzzle →"}</Button>
        </div>
      )}
    </div>
  );
}
