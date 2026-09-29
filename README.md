# Puzzle Peaks

A riddle and puzzle website for kids aged 6-12. Climb a mountain by solving
riddles and limericks, camp by camp.

This is **Phase 1**: the playable core. Only Camp 1 (Meadow) and Camp 2
(Forest) have content so far. Opening a level doesn't show any puzzles
right away — it shows a single **✨ Generate 8 Puzzles** button. Clicking
it asks AI to write 8 brand-new riddles/limericks on the spot, so every
playthrough is genuinely different. There are also 8 built-in puzzles per
level (24 per camp) kept as a fallback for when generation isn't set up or
fails. Later phases will add the harder camps, online trivia/rhyme games,
and deployment to a live website.

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
3. Click **✨ Generate 8 Puzzles**. This needs the AI generation setup
   below — without it, you'll see a friendly "couldn't generate" message
   with a **Try again** button and an **or play the 8 built-in puzzles
   instead** link so the level is never a dead end.
4. Read the riddle (or click the 🔊 speaker icon to have it read aloud).
5. Type an answer and click **Check**.
   - A wrong answer gives a gentle nudge and offers a hint.
   - You get 3 tries; after the 3rd wrong try, the answer and explanation
     are revealed automatically.
   - Stuck or bored of one? Click **Skip this one** to move on any time.
   - A correct answer shows stars and a short explanation of why that's
     the answer.
6. Click **Next puzzle** to continue, or **Exit level** to go back.
7. At the end, click **✨ Generate 8 more!** for a completely different
   set, or head back to the camp.
8. Progress is saved in your browser automatically, tracked as your best
   result for that level (generated or built-in, whichever you solved
   more of). Camp 2 (Forest) unlocks once you've solved at least 5 of 8 in
   Camp 1's final level — that's the "climbing the mountain" rule.

## Setting up AI-generated puzzles ("✨ Generate 8 Puzzles")

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

**If generation fails on your live site:** the error screen shows a small
line of technical detail in parentheses (e.g. `(HTTP 502 (upstream 401): ...)`).
That's meant for you, not the child — screenshot or copy it if you need
help debugging. The most common causes are a typo in `ANTHROPIC_API_KEY`,
an invalid or out-of-credit key, or a deploy that happened before the
variable was added (trigger a fresh deploy after adding it).

## Project layout

```
src/
  app/            routes, layout, theme (light/dark), the landing page + game screens
  components/     shared UI: Button, HintLadder, ReadAloud, Stars
  puzzles/        one component per puzzle type + registry.tsx
  content/        puzzles/*.json, schema.ts (validation rules), generation.ts (AI prompt + safety filter)
  services/       speech.ts (read-aloud), generatePuzzles.ts (calls the generation function)
  state/          progress.ts (saved to your browser's localStorage)
  lib/            answerMatching.ts, shuffle.ts
netlify/functions/generate-puzzles.ts   the serverless AI-generation endpoint
tests/            automated checks (vitest)
```

## Known limits of Phase 1 (by design)

- No internet-based puzzles yet (trivia, rhyme games) — that's Phase 2.
- Camps 3-5 have no puzzles yet — that's Phase 3.
- No grown-up settings screen or puzzle generator yet — that's Phase 4.
- Not deployed anywhere yet — that's Phase 5.
