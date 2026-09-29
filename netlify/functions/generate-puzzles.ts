import type { Handler } from "@netlify/functions";
import { buildGenerationSystemPrompt, validateAndFilterGenerated } from "../../src/content/generation";
import type { Puzzle } from "../../src/content/schema";
import camp1Seed from "../../src/content/puzzles/camp1.json";
import camp2Seed from "../../src/content/puzzles/camp2.json";

// Netlify's own synchronous function time limit is 10s on most plans (up to
// 26s on some). We aim well under that per request, and the client fires
// several small requests in parallel instead of one big slow one - see
// src/services/generatePuzzles.ts.
const RATE_LIMIT_MAX_REQUESTS = 80;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_COUNT = 4;
const ANTHROPIC_TIMEOUT_MS = 8_500;

// Best-effort, in-memory only: resets on cold start and isn't shared across
// concurrent function instances. Good enough to blunt casual overuse
// without adding external infrastructure, matching the brief's own
// suggested approach ("e.g. 20 requests per hour per IP").
const requestLog = new Map<string, number[]>();

function isRateLimited(clientId: string): boolean {
  const now = Date.now();
  const history = (requestLog.get(clientId) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  history.push(now);
  requestLog.set(clientId, history);
  return history.length > RATE_LIMIT_MAX_REQUESTS;
}

const CAMP_NAMES: Record<number, { name: string; ageRange: string }> = {
  1: { name: "Meadow", ageRange: "6-7" },
  2: { name: "Forest", ageRange: "7-8" },
  3: { name: "River", ageRange: "8-10" },
  4: { name: "Cliffs", ageRange: "10-11" },
  5: { name: "Summit", ageRange: "11-12+" },
};

const SEED_BY_CAMP: Record<number, Puzzle[]> = {
  1: camp1Seed as Puzzle[],
  2: camp2Seed as Puzzle[],
};

function pickExamples(camp: number, level: number, n: number): Puzzle[] {
  const pool = (SEED_BY_CAMP[camp] ?? []).filter((p) => p.level === level);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function jsonResponse(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  };
}

function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return fenced ? fenced[1] : trimmed;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  const clientId =
    event.headers["x-nf-client-connection-ip"] ?? event.headers["client-ip"] ?? event.headers["x-forwarded-for"] ?? "unknown";
  if (isRateLimited(clientId)) {
    return jsonResponse(429, {
      error: "Too many requests right now. Take a breather and try generating again in a little while!",
    });
  }

  let payload: { camp?: number; level?: number; count?: number };
  try {
    payload = JSON.parse(event.body ?? "{}");
  } catch {
    return jsonResponse(400, { error: "Invalid request body" });
  }

  const camp = Number(payload.camp);
  const level = Number(payload.level);
  const count = Math.min(Math.max(Number(payload.count) || 8, 1), MAX_COUNT);

  if (!CAMP_NAMES[camp] || ![1, 2, 3].includes(level)) {
    return jsonResponse(400, { error: "Invalid camp or level" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return jsonResponse(500, {
      error: "Puzzle generation isn't set up yet. Ask a grown-up to add the ANTHROPIC_API_KEY setting.",
    });
  }

  // Haiku by default: it's meaningfully faster, which matters a lot here -
  // the whole request has to finish inside Netlify's ~10s function limit.
  // Set CLAUDE_MODEL to override (e.g. back to claude-sonnet-5) if you're
  // on a Netlify plan with a longer function timeout and want richer
  // puzzles over speed.
  const model = process.env.CLAUDE_MODEL || "claude-haiku-4-5-20251001";
  const campInfo = CAMP_NAMES[camp];
  const examples = pickExamples(camp, level, 2);

  const systemPrompt = buildGenerationSystemPrompt({
    campName: campInfo.name,
    ageRange: campInfo.ageRange,
    count,
    examples,
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ANTHROPIC_TIMEOUT_MS);

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        // Sized to the batch, not a flat 4096 - a smaller ceiling keeps
        // worst-case generation time down, which is what actually matters
        // for fitting inside Netlify's function time limit.
        max_tokens: Math.min(2000, 250 * count + 300),
        system: systemPrompt,
        messages: [{ role: "user", content: `Generate ${count} puzzles now.` }],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error("Anthropic API error", response.status, errText);

      let friendly = "The puzzle generator is having trouble right now. Please try again.";
      if (response.status === 401 || response.status === 403) {
        friendly = "The AI key doesn't seem to be working. Ask a grown-up to double-check ANTHROPIC_API_KEY in Netlify.";
      } else if (response.status === 404) {
        friendly = "The AI model name isn't recognized. Ask a grown-up to check the CLAUDE_MODEL setting in Netlify.";
      } else if (response.status === 429) {
        friendly = "The AI is busy right now. Please try again in a moment.";
      }

      return jsonResponse(502, {
        error: friendly,
        debug: { status: response.status, body: errText.slice(0, 300) },
      });
    }

    const data = (await response.json()) as { content?: { type: string; text?: string }[] };
    const textBlock = data.content?.find((block) => block.type === "text")?.text ?? "";
    const cleaned = stripCodeFences(textBlock);

    let rawPuzzles: unknown;
    try {
      rawPuzzles = JSON.parse(cleaned);
    } catch {
      console.error("Could not parse model output as JSON", cleaned.slice(0, 300));
      return jsonResponse(502, {
        error: "The generator returned something we couldn't read. Please try again.",
        debug: { body: cleaned.slice(0, 300) },
      });
    }

    const { accepted, rejectedCount, rejectionReasons } = validateAndFilterGenerated(rawPuzzles, camp, level);

    if (accepted.length === 0) {
      console.error("All generated puzzles were rejected", rejectionReasons);
      return jsonResponse(502, {
        error: "Couldn't come up with fresh puzzles that passed our safety checks this time. Please try again.",
        debug: { body: rejectionReasons.join(", ") },
      });
    }

    return jsonResponse(200, { puzzles: accepted, rejectedCount });
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    console.error("generate-puzzles failed", err);
    return jsonResponse(aborted ? 504 : 500, {
      error: aborted
        ? "That took too long to generate. Please try again."
        : "Something went wrong generating puzzles. Please try again.",
    });
  } finally {
    clearTimeout(timeout);
  }
};
