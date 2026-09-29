import type { Puzzle } from "../content/schema";

// Kept small deliberately: Netlify's synchronous function time limit is
// ~10s on most plans, and asking the AI for a big batch of detailed
// puzzles in one call risks running past that. Firing several small
// requests in parallel finishes faster overall than one big one, since
// each gets its own fresh time budget.
const CHUNK_SIZE = 2;
const REQUEST_TIMEOUT_MS = 9_500;

type ChunkResult =
  | { ok: true; puzzles: Puzzle[] }
  | { ok: false; message: string; debug?: string };

export type GeneratePuzzlesResult =
  | { ok: true; puzzles: Puzzle[] }
  | { ok: false; message: string; debug?: string };

async function fetchChunk(camp: number, level: number, count: number): Promise<ChunkResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch("/.netlify/functions/generate-puzzles", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ camp, level, count }),
      signal: controller.signal,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        (data && typeof data.error === "string" && data.error) ||
        "Couldn't generate new puzzles right now. Please try again.";
      const debug = data?.debug
        ? `HTTP ${response.status}${data.debug.status ? ` (upstream ${data.debug.status})` : ""}: ${data.debug.body ?? ""}`
        : `HTTP ${response.status}`;
      return { ok: false, message, debug };
    }

    if (!data || !Array.isArray(data.puzzles) || data.puzzles.length === 0) {
      return { ok: false, message: "Couldn't generate new puzzles right now. Please try again." };
    }

    return { ok: true, puzzles: data.puzzles as Puzzle[] };
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return {
      ok: false,
      message: aborted
        ? "That took too long. Please try again."
        : "Couldn't reach the puzzle generator. Please try again.",
      debug: err instanceof Error ? err.message : String(err),
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function generatePuzzles(camp: number, level: number, count: number): Promise<GeneratePuzzlesResult> {
  const chunkCounts: number[] = [];
  let remaining = count;
  while (remaining > 0) {
    const size = Math.min(CHUNK_SIZE, remaining);
    chunkCounts.push(size);
    remaining -= size;
  }

  const results = await Promise.all(chunkCounts.map((size) => fetchChunk(camp, level, size)));

  const puzzles = results.flatMap((r) => (r.ok ? r.puzzles : []));
  if (puzzles.length > 0) {
    return { ok: true, puzzles };
  }

  const firstFailure = results.find((r): r is Extract<ChunkResult, { ok: false }> => !r.ok);
  return (
    firstFailure ?? { ok: false, message: "Couldn't generate new puzzles right now. Please try again." }
  );
}
