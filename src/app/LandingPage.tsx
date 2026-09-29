import { Link } from "react-router-dom";
import { useTheme } from "./theme";
import { Button } from "../components/Button";
import styles from "./LandingPage.module.css";

const FEATURES = [
  { emoji: "🧩", title: "Riddles & rhymes", body: "Playful puzzles that make you think and giggle." },
  { emoji: "💡", title: "Gentle hints", body: "Stuck? Three hints are always there to help." },
  { emoji: "⭐", title: "Earn stars", body: "Solve puzzles to collect stars as you climb." },
  { emoji: "🔊", title: "Read aloud", body: "Every puzzle can be read out loud for you." },
];

export function LandingPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <button
          type="button"
          className={styles.themeToggle}
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? "🌙" : "☀️"}
        </button>

        <div className={styles.floaters} aria-hidden="true">
          <span className={[styles.floater, styles.f1].join(" ")}>⭐</span>
          <span className={[styles.floater, styles.f2].join(" ")}>🧩</span>
          <span className={[styles.floater, styles.f3].join(" ")}>🏔️</span>
          <span className={[styles.floater, styles.f4].join(" ")}>✨</span>
          <span className={[styles.floater, styles.f5].join(" ")}>🌈</span>
        </div>

        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>A puzzle adventure for curious kids</p>
          <h1 className={styles.heroTitle}>Puzzle Peaks</h1>
          <p className={styles.heroSubtitle}>
            Climb a mountain of riddles, rhymes and brain-teasers — one camp at a time!
          </p>
          <Link to="/mountain">
            <Button className={styles.ctaButton}>Start Climbing 🚀</Button>
          </Link>
        </div>
      </div>

      <div className={styles.features}>
        {FEATURES.map((f) => (
          <div key={f.title} className={styles.featureCard}>
            <span className={styles.featureEmoji} aria-hidden="true">
              {f.emoji}
            </span>
            <h2 className={styles.featureTitle}>{f.title}</h2>
            <p className={styles.featureBody}>{f.body}</p>
          </div>
        ))}
      </div>

      <p className={styles.footerNote}>Made for kids aged 6-12. No sign-up, no ads — just puzzles.</p>
    </div>
  );
}
