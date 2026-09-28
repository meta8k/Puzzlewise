import styles from "./Stars.module.css";

type Props = {
  count: number;
  max?: number;
  size?: "small" | "large";
};

export function Stars({ count, max = 3, size = "large" }: Props) {
  return (
    <div className={styles.row} aria-label={`${count} out of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={[styles.star, size === "small" ? styles.small : styles.big].join(" ")}
          aria-hidden="true"
        >
          {i < count ? "⭐" : "☆"}
        </span>
      ))}
    </div>
  );
}
