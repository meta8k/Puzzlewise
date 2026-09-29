import type { Puzzle } from "../content/schema";

const TIMEOUT_MS = 30_000;

export type GeneratePuzzlesResult =
  | { ok: true; puzzles: Puzzle[] }
  | { ok: false; message: string; debug?: string };

export async function generatePuzzles(camp: number, level: number, count: number): Promise<GeneratePuzzlesResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

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
