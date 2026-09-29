import { z } from "zod";

export const CampSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);

export const LevelSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);

export const PuzzleTypeSchema = z.enum([
  "riddle",
  "limerick-riddle",
  "limerick-fill",
  "word-ladder",
  "anagram",
  "sequence",
  "logic",
  "cipher",
  "trivia",
  "rhyme-builder",
]);

export const SkillSchema = z.enum([
  "vocabulary",
  "rhyme",
  "logic",
  "maths",
  "spelling",
  "knowledge",
]);

export const SourceSchema = z.enum(["original", "claude-generated", "opentdb"]);

export const MediaSchema = z.object({
  kind: z.enum(["image", "svg", "audio", "interactive"]),
  ref: z.string(),
  alt: z.string(),
});

export const PuzzleSchema = z.object({
  id: z.string().min(1),
  camp: CampSchema,
  level: LevelSchema,
  type: PuzzleTypeSchema,
  prompt: z.string().min(1),
  answers: z.array(z.string().min(1)).min(1),
  choices: z.array(z.string()).optional(),
  hints: z.tuple([z.string().min(1), z.string().min(1), z.string().min(1)]),
  explanation: z.string().min(1),
  skill: SkillSchema,
  difficulty: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
    z.literal(6),
    z.literal(7),
    z.literal(8),
    z.literal(9),
    z.literal(10),
  ]),
  source: SourceSchema,
  reviewed: z.boolean(),
  media: MediaSchema.optional(),
});

export type Puzzle = z.infer<typeof PuzzleSchema>;

export const PuzzleListSchema = z.array(PuzzleSchema);
