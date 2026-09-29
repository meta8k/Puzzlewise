import type { ButtonHTMLAttributes } from "react";
import styles from "./Button.module.css";

type Variant = "primary" | "secondary" | "ghost";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export function Button({ variant = "primary", className, ...rest }: Props) {
  const classes = [styles.button, styles[variant], className].filter(Boolean).join(" ");
  return <button className={classes} {...rest} />;
}
