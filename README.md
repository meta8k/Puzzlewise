# Puzzle Peaks

A riddle and puzzle website for kids aged 6-12. Climb a mountain by solving
riddles and limericks, camp by camp.

This is **Phase 1**: the playable core. Only Camp 1 (Meadow) and Camp 2
(Forest) have content so far — 96 puzzles in total, 16 per level. Each
level draws a fresh, non-repeating set of 8 from its pool of 16 every time
it's opened, so replaying a level doesn't always show the same puzzles.
Later phases will add the harder camps, online trivia/rhyme games, a
grown-up puzzle generator, and deployment to a live website.

## How to run it

You'll need [Node.js](https://nodejs.org) installed (version 18 or newer).

```bash
npm install
npm run dev
```

Then open the web address it prints (usually `http://localhost:5173`) in
your browser.

## How to test it

```bash
npm test
```

This checks that every puzzle has 3 hints, an explanation, doesn't give
away its answer in the puzzle text, and that the answer-checking logic
(ignoring capital letters, "the/a/an", plurals, and small typos) works
correctly.

## What to click to try it

1. You'll land on the **home page** — click **Start Climbing** to enter the
   mountain.
2. Click **Meadow** (Camp 1), then **Level 1**.
3. Read the riddle (or click the 🔊 speaker icon to have it read aloud).
4. Type an answer and click **Check**.
   - A wrong answer gives a gentle nudge and offers a hint.
   - You get 3 tries; after the 3rd wrong try, the answer and explanation
     are revealed automatically.
   - Stuck or bored of one? Click **Skip this one** to move on any time.
   - A correct answer shows stars and a short explanation of why that's
     the answer.
5. Click **Next puzzle** to continue, or **Exit level** to go back.
6. Progress is saved in your browser automatically. Camp 2 (Forest)
   unlocks once you've solved at least 5 of the 8 puzzles in Camp 1's
   final level — that's the "climbing the mountain" rule.

## Project layout

```
src/
  app/            routes, layout, theme (light/dark), the landing page + 3 game screens
  components/     shared UI: Button, HintLadder, ReadAloud, Stars
  puzzles/        one component per puzzle type + registry.tsx
  content/        puzzles/*.json, schema.ts (validation rules)
  services/       speech.ts (read-aloud)
  state/          progress.ts, puzzleDeck.ts (saved to your browser's localStorage)
  lib/            answerMatching.ts, shuffle.ts
tests/            automated checks (vitest)
```

## Known limits of Phase 1 (by design)

- No internet-based puzzles yet (trivia, rhyme games) — that's Phase 2.
- Camps 3-5 have no puzzles yet — that's Phase 3.
- No grown-up settings screen or puzzle generator yet — that's Phase 4.
- Not deployed anywhere yet — that's Phase 5.
