import { Link, Navigate, useParams } from "react-router-dom";
import { campInfo } from "./camps";
import { puzzlesForCampLevel } from "../content/loadPuzzles";
import { isLevelUnlocked, levelSolvedCount, levelStars } from "../state/progress";
import { Stars } from "../components/Stars";
import styles from "./CampPage.module.css";

const LEVELS = [1, 2, 3] as const;

export function CampPage() {
  const { campId } = useParams();
  const camp = campInfo(Number(campId));

  if (!camp || !camp.hasContent) {
    return <Navigate to="/mountain" replace />;
  }

  return (
    <div className={[styles.page, camp.paletteClass].join(" ")}>
      <Link to="/mountain" className={styles.backLink}>
        ← Back to the mountain
      </Link>
      <h1 className={styles.title}>
        <span aria-hidden="true">{camp.emoji}</span> {camp.name}{" "}
        <span className={styles.ageRange}>(ages {camp.ageRange})</span>
      </h1>
      <p className={styles.tagline}>{camp.tagline}</p>

      <ul className={styles.levelList}>
        {LEVELS.map((level) => {
          const puzzles = puzzlesForCampLevel(camp.id, level);
          const unlocked = isLevelUnlocked(camp.id, level, puzzlesForCampLevel);
          const solved = levelSolvedCount(puzzles.map((p) => p.id));
          const stars = levelStars(puzzles.map((p) => p.id));

          const body = (
            <div className={[styles.level, unlocked ? "" : styles.locked].join(" ")}>
              <span className={styles.levelNumber} aria-hidden="true">
                {level}
              </span>
              <div className={styles.levelBody}>
                <h2 className={styles.levelName}>Level {level}</h2>
                <p className={styles.levelProgress}>
                  {solved}/{puzzles.length} solved
                </p>
              </div>
              {unlocked ? <Stars count={Math.min(3, Math.round(stars / puzzles.length))} /> : <span aria-label="Locked">🔒</span>}
            </div>
          );

          return (
            <li key={level}>
              {unlocked ? <Link to={`/camp/${camp.id}/level/${level}`}>{body}</Link> : body}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
