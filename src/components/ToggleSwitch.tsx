import styles from "./ToggleSwitch.module.css";

type Props = {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
};

export function ToggleSwitch({ id, checked, onChange, label, description }: Props) {
  return (
    <div className={styles.row}>
      <div className={styles.text}>
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        id={id}
        aria-checked={checked}
        className={styles.track}
        data-checked={checked}
        onClick={() => onChange(!checked)}
      >
        <span className={styles.thumb} aria-hidden="true" />
      </button>
    </div>
  );
}
