import { Link } from "react-router-dom";
import { CAMPS } from "./camps";
import { puzzlesForCampLevel } from "../content/loadPuzzles";
import { isLevelUnlocked } from "../state/progress";
import { useTheme } from "./theme";
import styles from "./HomePage.module.css";

function isCampUnlocked(campId: number): boolean {
  if (campId === 1) return true;
  return isLevelUnlocked(campId, 1, puzzlesForCampLevel);
}

export function HomePage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Puzzle Peaks</h1>
        <button
          type="button"
          className={styles.themeToggle}
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? "🌙" : "☀️"}
        </button>
      </header>
      <p className={styles.subtitle}>Climb the mountain by solving riddles and puzzles!</p>

      <ol className={styles.mountain}>
        {CAMPS.map((camp) => {
          const unlocked = camp.hasContent && isCampUnlocked(camp.id);
          const content = (
            <div className={[styles.camp, camp.paletteClass, unlocked ? "" : styles.locked].join(" ")}>
              <span className={styles.campNumber}>{camp.id}</span>
              <div className={styles.campBody}>
                <h2 className={styles.campName}>{camp.name}</h2>
                <p className={styles.campMeta}>Ages {camp.ageRange}</p>
                <p className={styles.campTagline}>{camp.tagline}</p>
              </div>
              {!unlocked && (
                <span className={styles.padlock} aria-label="Locked" title="Locked">
                  🔒
                </span>
              )}
            </div>
          );

          return (
            <li key={camp.id}>
              {unlocked ? (
                <Link to={`/camp/${camp.id}`} className={styles.campLink}>
                  {content}
                </Link>
              ) : (
                <div className={styles.campLinkDisabled} aria-disabled="true">
                  {content}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
