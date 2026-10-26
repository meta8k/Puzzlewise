import { useCallback, useState } from "react";

const STORAGE_KEY = "puzzle-peaks:settings:v1";

type Settings = {
  allLevelsUnlocked: boolean;
};

function defaultSettings(): Settings {
  return { allLevelsUnlocked: false };
}

function safeReadSettings(): Settings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings();
    const parsed = JSON.parse(raw) as Partial<Settings>;
    if (!parsed || typeof parsed !== "object") return defaultSettings();
    return { allLevelsUnlocked: Boolean(parsed.allLevelsUnlocked) };
  } catch {
    return defaultSettings();
  }
}

function safeWriteSettings(settings: Settings): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // localStorage may be blocked; the setting just won't persist across visits.
  }
}

export function getAllLevelsUnlocked(): boolean {
  return safeReadSettings().allLevelsUnlocked;
}

export function setAllLevelsUnlocked(value: boolean): void {
  const settings = safeReadSettings();
  safeWriteSettings({ ...settings, allLevelsUnlocked: value });
}

/**
 * React hook for the "unlock all levels" setting. Keeps a bit of local
 * state alongside localStorage so flipping the switch re-renders
 * immediately, rather than only taking effect on the next page visit.
 */
export function useAllLevelsUnlocked(): [boolean, (value: boolean) => void] {
  const [value, setValue] = useState(getAllLevelsUnlocked);
  const update = useCallback((next: boolean) => {
    setAllLevelsUnlocked(next);
    setValue(next);
  }, []);
  return [value, update];
}
