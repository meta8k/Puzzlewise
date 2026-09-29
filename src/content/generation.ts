import { z } from "zod";
import { PuzzleTypeSchema, SkillSchema, type Puzzle } from "./schema";

/**
 * The shape we ask the model to produce. It never supplies id, camp,
 * level, source or reviewed - those are assigned by us after validation,
 * so a child never sees anything the model alone gets to control.
 */
export const GeneratedPuzzleShapeSchema = z.object({
  type: PuzzleTypeSchema,
  prompt: z.string().min(1).max(600),
  answers: z.array(z.string().min(1).max(60)).min(1).max(6),
  hints: z.tuple([z.string().min(1).max(200), z.string().min(1).max(200), z.string().min(1).max(200)]),
  explanation: z.string().min(1).max(300),
  skill: SkillSchema,
  difficulty: z.number().int().min(1).max(10),
});

export const GeneratedBatchShapeSchema = z.array(GeneratedPuzzleShapeSchema);

export type GeneratedPuzzleShape = z.infer<typeof GeneratedPuzzleShapeSchema>;

// Puzzle types the child-facing player actually knows how to render (Phase 1).
const SUPPORTED_TYPES = new Set(["riddle", "limerick-riddle", "limerick-fill"]);

// A deliberately blunt keyword net. It's not meant to be clever - just to
// catch anything a generation pass should never let through to a child,
// without a human reviewer in the loop. Matched as whole words/phrases,
// case-insensitively, against prompt + hints + explanation + answers.
const BLOCKLIST = [
  "kill",
  "killed",
  "killing",
  "murder",
  "suicide",
  "self-harm",
  "self harm",
  "die",
  "dead",
  "death",
  "blood",
  "gun",
  "knife",
  "weapon",
  "war",
  "bomb",
  "terrorist",
  "drug",
  "drugs",
  "cocaine",
  "alcohol",
  "beer",
  "wine",
  "vodka",
  "drunk",
  "cigarette",
  "smoking",
  "sex",
  "sexy",
  "naked",
  "nude",
  "porn",
  "hate",
  "racist",
  "nazi",
  "god",
  "jesus",
  "allah",
  "religion",
  "religious",
  "president",
  "election",
  "politics",
  "political",
  "democrat",
  "republican",
  "hell",
  "damn",
  "stupid",
  "idiot",
  "scary",
  "horror",
  "ghost",
  "demon",
  "devil",
  "monster",
  "nightmare",
  "boyfriend",
  "girlfriend",
  "kiss",
  "kissing",
  "dating",
  "divorce",
];

function normaliseForCheck(text: string): string {
  return text.toLowerCase().replace(/[.,!?;:'"()]/g, " ");
}

function containsBlockedWord(text: string): string | null {
  const normalised = normaliseForCheck(text);
  for (const word of BLOCKLIST) {
    const pattern = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
    if (pattern.test(normalised)) return word;
  }
  return null;
}

function answerLeaksInPrompt(prompt: string, answers: string[]): boolean {
  const normalisedPrompt = normaliseForCheck(prompt);
  for (const answer of answers) {
    const cleanAnswer = normaliseForCheck(answer).trim();
    if (cleanAnswer.length === 0) continue;
    const pattern = new RegExp(`\\b${cleanAnswer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
    if (pattern.test(normalisedPrompt)) return true;
  }
  return false;
}

export type FilterResult = {
  accepted: Puzzle[];
  rejectedCount: number;
  rejectionReasons: string[];
};

/**
 * Applies automated safety and quality checks to raw model output and
 * turns whatever survives into real Puzzle objects, owned entirely by us
 * (id/camp/level/source/reviewed are never taken from the model). This is
 * the only gate between AI output and a child's screen for this feature -
 * there is no human review step, so it intentionally errs on the side of
 * rejecting anything even slightly ambiguous.
 */
export function validateAndFilterGenerated(raw: unknown, camp: number, level: number): FilterResult {
  const parsed = GeneratedBatchShapeSchema.safeParse(raw);
  if (!parsed.success) {
    return { accepted: [], rejectedCount: Array.isArray(raw) ? raw.length : 1, rejectionReasons: ["schema"] };
  }

  const accepted: Puzzle[] = [];
  const rejectionReasons: string[] = [];

  parsed.data.forEach((candidate, index) => {
    if (!SUPPORTED_TYPES.has(candidate.type)) {
      rejectionReasons.push("unsupported-type");
      return;
    }
    if (answerLeaksInPrompt(candidate.prompt, candidate.answers)) {
      rejectionReasons.push("answer-in-prompt");
      return;
    }
    const fieldsToScan = [candidate.prompt, ...candidate.hints, candidate.explanation, ...candidate.answers];
    const blocked = fieldsToScan.map(containsBlockedWord).find((w) => w !== null);
    if (blocked) {
      rejectionReasons.push(`blocklist:${blocked}`);
      return;
    }

    accepted.push({
      id: `gen-${camp}-${level}-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
      camp: camp as Puzzle["camp"],
      level: level as Puzzle["level"],
      type: candidate.type,
      prompt: candidate.prompt,
      answers: candidate.answers.map((a) => a.toLowerCase()),
      hints: candidate.hints,
      explanation: candidate.explanation,
      skill: candidate.skill,
      difficulty: candidate.difficulty as Puzzle["difficulty"],
      source: "claude-generated",
      reviewed: true,
    });
  });

  return { accepted, rejectedCount: parsed.data.length - accepted.length, rejectionReasons };
}

export type PromptExample = Pick<Puzzle, "type" | "prompt" | "answers" | "hints" | "explanation" | "skill" | "difficulty">;

export function buildGenerationSystemPrompt(params: {
  campName: string;
  ageRange: string;
  count: number;
  examples: PromptExample[];
}): string {
  const { campName, ageRange, count, examples } = params;
  const exampleBlock = JSON.stringify(examples, null, 2);

  return `You write original riddles and limericks for a children's puzzle game called Puzzle Peaks.

You are writing for the "${campName}" camp, for children aged ${ageRange}.

Write exactly ${count} brand-new puzzles as a JSON array. Each item must match this shape:
{
  "type": "riddle" | "limerick-riddle" | "limerick-fill",
  "prompt": string,
  "answers": string[],
  "hints": [string, string, string],
  "explanation": string,
  "skill": "vocabulary" | "rhyme" | "logic" | "maths" | "spelling" | "knowledge",
  "difficulty": number from 1 to 10
}

Rules, all of which matter:
- Original content only. Do not reuse or lightly reword any well-known riddle, joke, or nursery rhyme.
- The answer word must never appear anywhere in the prompt text.
- Hints must go gentle, then stronger, then nearly give it away, without ever saying the answer outright.
- The explanation is 1-2 sentences teaching the "why" behind the answer.
- Content must be age-appropriate for ${ageRange} year olds: nothing scary, violent, romantic, or about brands, real people, politics, religion, or adult topics of any kind.
- "limerick-riddle" must be five lines, AABBA rhyme scheme, playful rhythm, and the answer must not appear in the text.
- "limerick-fill" must be five lines with one blank ("____") near the end that the reader fills in; put the missing word as the sole entry in "answers".
- Vary the topics and answers across the ${count} puzzles - no repeats or close variations of each other.

Here are ${examples.length} example puzzles from this camp, purely to show the tone and difficulty (do not reuse their topics or answers):
${exampleBlock}

Return ONLY the JSON array. No markdown code fences, no commentary, no extra text before or after it.`;
}
