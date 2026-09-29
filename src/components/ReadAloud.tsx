import { useEffect, useState } from "react";
import { isSpeechSupported, speak, stopSpeaking } from "../services/speech";
import styles from "./ReadAloud.module.css";

type Props = {
  text: string;
  label?: string;
};

export function ReadAloud({ text, label = "Read aloud" }: Props) {
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(isSpeechSupported());
    return () => stopSpeaking();
  }, []);

  if (!supported) return null;

  return (
    <button
      type="button"
      className={styles.speaker}
      onClick={() => speak(text)}
      aria-label={label}
      title={label}
    >
      🔊
    </button>
  );
}
