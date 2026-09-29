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
7. On a camp's level list, click **✨ Generate new puzzles** under an
   unlocked level to get 8 brand-new, never-seen-before puzzles written on
   the spot by AI. This needs the AI generation setup below — without it,
   you'll see a friendly "couldn't generate" message with a retry button.

## Setting up AI-generated puzzles ("✨ Generate new puzzles")

This feature calls Anthropic's API from a Netlify serverless function
(`netlify/functions/generate-puzzles.ts`) — never from the browser, so your
API key is never exposed to visitors. To turn it on:

1. Get an API key from [console.anthropic.com](https://console.anthropic.com).
2. In your Netlify site's dashboard: **Site configuration → Environment
   variables → Add a variable**.
   - `ANTHROPIC_API_KEY` — your key (required).
   - `CLAUDE_MODEL` — optional, defaults to `claude-sonnet-5`. You can set
     it to `claude-haiku-4-5-20251001` for a cheaper/faster option.
3. Redeploy the site (Netlify → Deploys → Trigger deploy) so the function
   picks up the new variables.

**Safety note:** generated puzzles are shown to children immediately, with
no adult review step — that's what makes the button feel instant and fun.
In its place, every generated puzzle automatically passes through:
- Schema validation (must match the exact puzzle shape the game expects).
- A check that the answer word never appears in the puzzle's own text.
- A keyword blocklist (violence, adult topics, scary content, brands, real
  people, politics, religion, and more) scanned across the prompt, hints,
  explanation, and answers.
- The function also enforces its own puzzle type restriction (only
  riddles and limericks, matching what Phase 1 can render) and a basic
  rate limit (20 requests/hour per visitor) to control cost and abuse.

Anything that fails any check is silently dropped before it ever reaches
the app — the child only ever sees puzzles that passed all of the above.

**Testing locally:** the plain `npm run dev` server can't run Netlify
functions. To test this feature on your own machine before deploying, use
the [Netlify CLI](https://docs.netlify.com/cli/get-started/) (`netlify dev`
instead of `npm run dev`) with a local `.env` file containing your
`ANTHROPIC_API_KEY` (already covered by `.gitignore`, so it won't be
committed).

## Project layout

```
src/
  app/            routes, layout, theme (light/dark), the landing page + game screens
  components/     shared UI: Button, HintLadder, ReadAloud, Stars
  puzzles/        one component per puzzle type + registry.tsx
  content/        puzzles/*.json, schema.ts (validation rules), generation.ts (AI prompt + safety filter)
  services/       speech.ts (read-aloud), generatePuzzles.ts (calls the generation function)
  state/          progress.ts, puzzleDeck.ts (saved to your browser's localStorage)
  lib/            answerMatching.ts, shuffle.ts
netlify/functions/generate-puzzles.ts   the serverless AI-generation endpoint
tests/            automated checks (vitest)
```

## Known limits of Phase 1 (by design)

- No internet-based puzzles yet (trivia, rhyme games) — that's Phase 2.
- Camps 3-5 have no puzzles yet — that's Phase 3.
- No grown-up settings screen or puzzle generator yet — that's Phase 4.
- Not deployed anywhere yet — that's Phase 5.
