import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { campInfo } from "./camps";
import { puzzlesForCampLevel } from "../content/loadPuzzles";
import { isLevelUnlocked } from "../state/progress";
import { getPuzzleComponent } from "../puzzles/registry";
import { generatePuzzles } from "../services/generatePuzzles";
import type { PuzzleOutcome } from "../puzzles/types";
import type { Puzzle } from "../content/schema";
import { Button } from "../components/Button";
import { Stars } from "../components/Stars";
import styles from "./LevelPage.module.css";
import genStyles from "./GeneratedPlayPage.module.css";

const COUNT = 8;

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

const LOADING_LINES = [
  "Dreaming up brand-new riddles...",
  "Sprinkling in some rhymes...",
  "Double-checking they're kid-friendly...",
  "Almost ready...",
];

type Status = "loading" | "error" | "ready";

export function GeneratedPlayPage() {
  const { campId, levelId } = useParams();
  const camp = campInfo(Number(campId));
  const level = Number(levelId);

  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [loadingLine, setLoadingLine] = useState(0);
  const [runId, setRunId] = useState(0);

  const [index, setIndex] = useState(0);
  const [lastOutcome, setLastOutcome] = useState<PuzzleOutcome | null>(null);
  const [sessionStars, setSessionStars] = useState(0);
  const [sessionSolved, setSessionSolved] = useState(0);
  const [solvedIds, setSolvedIds] = useState<Record<string, boolean>>({});

  const validCamp = camp && camp.hasContent && [1, 2, 3].includes(level);
  const unlocked = validCamp && isLevelUnlocked(camp.id, level, puzzlesForCampLevel);

  const runRef = useRef(0);

  useEffect(() => {
    if (!validCamp || !unlocked) return;
    const thisRun = runId;
    runRef.current = thisRun;
    setStatus("loading");
    setIndex(0);
    setLastOutcome(null);
    setSessionStars(0);
    setSessionSolved(0);
    setSolvedIds({});

    generatePuzzles(camp.id, level, COUNT).then((result) => {
      if (runRef.current !== thisRun) return;
      if (result.ok) {
        setPuzzles(result.puzzles);
        setStatus("ready");
      } else {
        setErrorMessage(result.message);
        setStatus("error");
      }
    });
  }, [camp, level, unlocked, validCamp, runId]);

  useEffect(() => {
    if (status !== "loading") return;
    const timer = setInterval(() => {
      setLoadingLine((n) => (n + 1) % LOADING_LINES.length);
    }, 1800);
    return () => clearInterval(timer);
  }, [status]);

  if (!validCamp) {
    return <Navigate to="/mountain" replace />;
  }
  if (!unlocked) {
    return <Navigate to={`/camp/${camp.id}`} replace />;
  }

  function tryAgain() {
    setRunId((n) => n + 1);
  }

  if (status === "loading") {
    return (
      <div className={[styles.page, camp.paletteClass].join(" ")}>
        <div className={genStyles.loadingCard}>
          <span className={genStyles.sparkle} aria-hidden="true">
            ✨
          </span>
          <h1 className={genStyles.loadingTitle}>Generating new puzzles...</h1>
          <p className={genStyles.loadingLine}>{LOADING_LINES[loadingLine]}</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className={[styles.page, camp.paletteClass].join(" ")}>
        <div className={genStyles.loadingCard}>
          <span className={genStyles.sparkle} aria-hidden="true">
            😕
          </span>
          <h1 className={genStyles.loadingTitle}>Hmm, that didn't work</h1>
          <p className={genStyles.loadingLine}>{errorMessage}</p>
          <div className={styles.actions}>
            <Button onClick={tryAgain}>Try again</Button>
          </div>
          <Link to={`/camp/${camp.id}`} className={genStyles.backLinkSmall}>
            ← Back to {camp.name}
          </Link>
        </div>
      </div>
    );
  }

  const finished = index >= puzzles.length;

  if (finished) {
    return (
      <div className={[styles.page, camp.paletteClass].join(" ")}>
        <div className={styles.finishedCard}>
          <span className={styles.finishedEmoji} aria-hidden="true">
            🎉
          </span>
          <h1 className={styles.title}>Bonus round complete!</h1>
          <p className={styles.summary}>
            You solved {sessionSolved} out of {puzzles.length} brand-new puzzles.
          </p>
          <Stars count={Math.min(3, Math.round(sessionStars / puzzles.length))} />
          <div className={styles.actions}>
            <Button onClick={tryAgain}>✨ Generate more!</Button>
          </div>
          <Link to={`/camp/${camp.id}`} className={genStyles.backLinkSmall}>
            ← Back to {camp.name}
          </Link>
        </div>
      </div>
    );
  }

  const puzzle = puzzles[index];
  const PuzzleComponent = getPuzzleComponent(puzzle.type);
  const isLastPuzzle = index === puzzles.length - 1;

  function handleComplete(outcome: PuzzleOutcome) {
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

  return (
    <div className={[styles.page, camp.paletteClass].join(" ")}>
      <div className={styles.topBar}>
        <Link to={`/camp/${camp.id}`} className={styles.backLink}>
          ← Exit
        </Link>
        <span className={genStyles.generatedLabel}>✨ {camp.emoji} Bonus Round · Level {level}</span>
      </div>

      <ol className={styles.trail} aria-label={`Puzzle ${index + 1} of ${puzzles.length}`}>
        {puzzles.map((p, i) => {
          const dotState = i === index ? styles.dotCurrent : solvedIds[p.id] ? styles.dotSolved : styles.dotPending;
          return <li key={p.id} className={[styles.dot, dotState].join(" ")} aria-hidden="true" />;
        })}
      </ol>

      <div className={styles.card}>
        <span className={styles.cardWatermark} aria-hidden="true">
          {camp.emoji}
        </span>
        <span className={genStyles.freshBadge}>✨ Freshly generated</span>
        <span className={styles.typeBadge}>{TYPE_BADGES[puzzle.type] ?? puzzle.type}</span>
        {PuzzleComponent ? (
          <PuzzleComponent key={puzzle.id} puzzle={puzzle} onComplete={handleComplete} />
        ) : (
          <p>This puzzle type isn't supported yet.</p>
        )}
      </div>

      {lastOutcome && (
        <div className={styles.actions}>
          <Button onClick={goNext}>{isLastPuzzle ? "Finish bonus round 🏁" : "Next puzzle →"}</Button>
        </div>
      )}
    </div>
  );
}
