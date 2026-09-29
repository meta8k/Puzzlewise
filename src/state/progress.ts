const STORAGE_KEY = "puzzle-peaks:progress:v1";

export type PuzzleResult = {
  solved: boolean;
  stars: 1 | 2 | 3;
  hintsUsed: number;
};

export type ProgressData = {
  puzzles: Record<string, PuzzleResult>;
};

function emptyProgress(): ProgressData {
  return { puzzles: {} };
}

function safeReadStorage(): ProgressData {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw) as ProgressData;
    if (!parsed || typeof parsed !== "object" || !parsed.puzzles) {
      return emptyProgress();
    }
    return parsed;
  } catch {
    return emptyProgress();
  }
}

function safeWriteStorage(data: ProgressData): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage may be blocked (private browsing, disabled storage).
    // The game still works for the current session; progress just won't persist.
  }
}

export function getProgress(): ProgressData {
  return safeReadStorage();
}

export function recordPuzzleResult(puzzleId: string, result: PuzzleResult): void {
  const data = safeReadStorage();
  const existing = data.puzzles[puzzleId];
  if (!existing || result.stars > existing.stars || (!existing.solved && result.solved)) {
    data.puzzles[puzzleId] = {
      solved: result.solved || existing?.solved || false,
      stars: (Math.max(result.stars, existing?.stars ?? 0) as 1 | 2 | 3),
      hintsUsed: result.hintsUsed,
    };
    safeWriteStorage(data);
  }
}

export function getPuzzleResult(puzzleId: string): PuzzleResult | undefined {
  return safeReadStorage().puzzles[puzzleId];
}

export function levelStars(puzzleIds: string[]): number {
  const data = safeReadStorage();
  return puzzleIds.reduce((sum, id) => sum + (data.puzzles[id]?.stars ?? 0), 0);
}

export function levelSolvedCount(puzzleIds: string[]): number {
  const data = safeReadStorage();
  return puzzleIds.filter((id) => data.puzzles[id]?.solved).length;
}

export function isLevelUnlocked(
  camp: number,
  level: number,
  puzzlesByLevel: (camp: number, level: number) => { id: string }[],
): boolean {
  if (camp === 1 && level === 1) return true;
  const prevCamp = level === 1 ? camp - 1 : camp;
  const prevLevel = level === 1 ? 3 : level - 1;
  if (prevCamp < 1) return true;
  const prevPuzzles = puzzlesByLevel(prevCamp, prevLevel);
  if (prevPuzzles.length === 0) return false;
  const solved = levelSolvedCount(prevPuzzles.map((p) => p.id));
  return solved >= Math.min(5, prevPuzzles.length);
}

export function resetProgress(): void {
  safeWriteStorage(emptyProgress());
}
