const STORAGE_KEY = "puzzle-peaks:progress:v2";

export type PuzzleResult = {
  solved: boolean;
  stars: 1 | 2 | 3;
  hintsUsed: number;
};

export type LevelSessionResult = {
  bestSolved: number;
  bestStars: number;
  totalOutOf: number;
  attempts: number;
};

export type ProgressData = {
  puzzles: Record<string, PuzzleResult>;
  levelSessions: Record<string, LevelSessionResult>;
};

function emptyProgress(): ProgressData {
  return { puzzles: {}, levelSessions: {} };
}

function safeReadStorage(): ProgressData {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw) as Partial<ProgressData>;
    if (!parsed || typeof parsed !== "object") return emptyProgress();
    return {
      puzzles: parsed.puzzles ?? {},
      levelSessions: parsed.levelSessions ?? {},
    };
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

function levelKey(camp: number, level: number): string {
  return `${camp}-${level}`;
}

export function getProgress(): ProgressData {
  return safeReadStorage();
}

/**
 * Records the outcome of a single puzzle, kept mainly so a replayed local
 * (non-generated) puzzle can say "you've solved this one before".
 */
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

/**
 * Records how a full level playthrough went - generated puzzles included,
 * since they don't have stable ids to track individually. Progression is
 * based on the best result ever achieved for that camp/level, not on
 * solving any particular fixed set of puzzles.
 */
export function recordLevelSession(camp: number, level: number, solved: number, total: number, stars: number): void {
  const data = safeReadStorage();
  const key = levelKey(camp, level);
  const existing = data.levelSessions[key];
  data.levelSessions[key] = {
    bestSolved: Math.max(solved, existing?.bestSolved ?? 0),
    bestStars: Math.max(stars, existing?.bestStars ?? 0),
    totalOutOf: total,
    attempts: (existing?.attempts ?? 0) + 1,
  };
  safeWriteStorage(data);
}

export function getLevelSession(camp: number, level: number): LevelSessionResult | undefined {
  return safeReadStorage().levelSessions[levelKey(camp, level)];
}

export function isLevelUnlocked(camp: number, level: number): boolean {
  if (camp === 1 && level === 1) return true;
  const prevCamp = level === 1 ? camp - 1 : camp;
  const prevLevel = level === 1 ? 3 : level - 1;
  if (prevCamp < 1) return true;
  const session = getLevelSession(prevCamp, prevLevel);
  if (!session) return false;
  return session.bestSolved >= Math.min(5, session.totalOutOf);
}

export function resetProgress(): void {
  safeWriteStorage(emptyProgress());
}
