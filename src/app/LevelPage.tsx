import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { campInfo } from "./camps";
import { puzzlesForCampLevel } from "../content/loadPuzzles";
import { getPuzzleResult, isLevelUnlocked, recordLevelSession, recordPuzzleResult } from "../state/progress";
import { getPuzzleComponent } from "../puzzles/registry";
import { generatePuzzles } from "../services/generatePuzzles";
import { shuffle } from "../lib/shuffle";
import type { PuzzleOutcome } from "../puzzles/types";
import type { Puzzle } from "../content/schema";
import { Button } from "../components/Button";
import { Stars } from "../components/Stars";
import styles from "./LevelPage.module.css";

const PUZZLES_PER_LEVEL = 8;

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

type Status = "idle" | "loading" | "error" | "playing" | "finished";

export function LevelPage() {
  const { campId, levelId } = useParams();
  const camp = campInfo(Number(campId));
  const level = Number(levelId);
  const validRoute = Boolean(camp && camp.hasContent && [1, 2, 3].includes(level));
  const unlocked = validRoute && isLevelUnlocked(camp!.id, level);

  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [errorDebug, setErrorDebug] = useState<string | undefined>(undefined);
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [usingFallback, setUsingFallback] = useState(false);
  const [loadingLine, setLoadingLine] = useState(0);

  const [index, setIndex] = useState(0);
  const [lastOutcome, setLastOutcome] = useState<PuzzleOutcome | null>(null);
  const [sessionStars, setSessionStars] = useState(0);
  const [sessionSolved, setSessionSolved] = useState(0);
  const [solvedIds, setSolvedIds] = useState<Record<string, boolean>>({});

  if (!validRoute) {
    return <Navigate to="/mountain" replace />;
  }
  if (!unlocked) {
    return <Navigate to={`/camp/${camp!.id}`} replace />;
  }

  function resetSession() {
    setIndex(0);
    setLastOutcome(null);
    setSessionStars(0);
    setSessionSolved(0);
    setSolvedIds({});
  }

  async function startGeneration() {
    resetSession();
    setUsingFallback(false);
    setStatus("loading");
    const cycleTimer = setInterval(() => {
      setLoadingLine((n) => (n + 1) % LOADING_LINES.length);
    }, 1800);

    const result = await generatePuzzles(camp!.id, level, PUZZLES_PER_LEVEL);
    clearInterval(cycleTimer);

    if (result.ok) {
      setPuzzles(result.puzzles);
      setStatus("playing");
    } else {
      setErrorMessage(result.message);
      setErrorDebug(result.debug);
      setStatus("error");
    }
  }

  function playBuiltInInstead() {
    resetSession();
    setUsingFallback(true);
    setPuzzles(shuffle(puzzlesForCampLevel(camp!.id, level)));
    setStatus("playing");
  }

  function handleComplete(outcome: PuzzleOutcome, puzzle: Puzzle) {
    if (usingFallback) {
      recordPuzzleResult(puzzle.id, outcome);
    }
    setLastOutcome(outcome);
    setSessionStars((s) => s + outcome.stars);
    if (outcome.solved) {
      setSessionSolved((s) => s + 1);
      setSolvedIds((ids) => ({ ...ids, [puzzle.id]: true }));
    }
  }

  function goNext() {
    setLastOutcome(null);
    const next = index + 1;
    if (next >= puzzles.length) {
      recordLevelSession(camp!.id, level, sessionSolved, puzzles.length, sessionStars);
      setStatus("finished");
    } else {
      setIndex(next);
    }
  }

  const campEl = camp!;

  if (status === "idle") {
    return (
      <div className={[styles.page, campEl.paletteClass].join(" ")}>
        <div className={styles.topBar}>
          <Link to={`/camp/${campEl.id}`} className={styles.backLink}>
            ← Exit level
          </Link>
          <span className={styles.campLabel}>
            {campEl.emoji} {campEl.name} · Level {level}
          </span>
        </div>
        <div className={styles.idleCard}>
          <span className={styles.idleEmoji} aria-hidden="true">
            🎲
          </span>
          <h1 className={styles.idleTitle}>Ready for some puzzles?</h1>
          <p className={styles.idleBody}>
            Hit the button and we'll dream up {PUZZLES_PER_LEVEL} brand-new riddles and puzzles, made just for
            this level.
          </p>
          <Button className={styles.generateButton} onClick={startGeneration}>
            ✨ Generate {PUZZLES_PER_LEVEL} Puzzles
          </Button>
          <button type="button" className={styles.secondaryLink} onClick={playBuiltInInstead}>
            or play the {PUZZLES_PER_LEVEL} built-in puzzles instead
          </button>
        </div>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className={[styles.page, campEl.paletteClass].join(" ")}>
        <div className={styles.loadingCard}>
          <span className={styles.sparkle} aria-hidden="true">
            ✨
          </span>
          <h1 className={styles.loadingTitle}>Generating new puzzles...</h1>
          <p className={styles.loadingLine}>{LOADING_LINES[loadingLine]}</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className={[styles.page, campEl.paletteClass].join(" ")}>
        <div className={styles.loadingCard}>
          <span className={styles.sparkle} aria-hidden="true">
            😕
          </span>
          <h1 className={styles.loadingTitle}>Hmm, that didn't work</h1>
          <p className={styles.loadingLine}>{errorMessage}</p>
          {errorDebug && <p className={styles.debugText}>({errorDebug})</p>}
          <div className={styles.actions}>
            <Button onClick={startGeneration}>Try again</Button>
          </div>
          <button type="button" className={styles.secondaryLink} onClick={playBuiltInInstead}>
            or play the {PUZZLES_PER_LEVEL} built-in puzzles instead
          </button>
          <Link to={`/camp/${campEl.id}`} className={styles.backLink}>
            ← Back to {campEl.name}
          </Link>
        </div>
      </div>
    );
  }

  if (status === "finished") {
    return (
      <div className={[styles.page, campEl.paletteClass].join(" ")}>
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
            <Button onClick={startGeneration}>✨ Generate {PUZZLES_PER_LEVEL} more!</Button>
          </div>
          <Link to={`/camp/${campEl.id}`} className={styles.backLink}>
            ← Back to {campEl.name}
          </Link>
        </div>
      </div>
    );
  }

  // status === "playing"
  const puzzle = puzzles[index];
  const PuzzleComponent = getPuzzleComponent(puzzle.type);
  const isLastPuzzle = index === puzzles.length - 1;
  const previousResult = usingFallback ? getPuzzleResult(puzzle.id) : undefined;

  return (
    <div className={[styles.page, campEl.paletteClass].join(" ")}>
      <div className={styles.topBar}>
        <Link to={`/camp/${campEl.id}`} className={styles.backLink}>
          ← Exit level
        </Link>
        <span className={styles.campLabel}>
          {campEl.emoji} {campEl.name} · Level {level}
        </span>
      </div>

      <ol className={styles.trail} aria-label={`Puzzle ${index + 1} of ${puzzles.length}`}>
        {puzzles.map((p, i) => {
          const dotState = i === index ? styles.dotCurrent : solvedIds[p.id] ? styles.dotSolved : "";
          return <li key={p.id} className={[styles.dot, dotState].join(" ")} aria-hidden="true" />;
        })}
      </ol>

      <div className={styles.card}>
        <span className={styles.cardWatermark} aria-hidden="true">
          {campEl.emoji}
        </span>
        {!usingFallback && <span className={styles.freshBadge}>✨ Freshly generated</span>}
        <span className={styles.typeBadge}>{TYPE_BADGES[puzzle.type] ?? puzzle.type}</span>
        {PuzzleComponent ? (
          <PuzzleComponent key={puzzle.id} puzzle={puzzle} onComplete={(outcome) => handleComplete(outcome, puzzle)} />
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
