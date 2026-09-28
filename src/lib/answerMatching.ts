const LEADING_ARTICLES = /^(a|an|the)\s+/;

export function normalise(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:'"()]/g, "")
    .replace(/\s+/g, " ")
    .replace(LEADING_ARTICLES, "")
    .trim();
}

function stripTrailingS(word: string): string {
  if (word.endsWith("ies") && word.length > 3) return `${word.slice(0, -3)}y`;
  if (word.endsWith("es") && word.length > 2) return word.slice(0, -2);
  if (word.endsWith("s") && word.length > 1) return word.slice(0, -1);
  return word;
}

function isSimplePluralMatch(guess: string, answer: string): boolean {
  return stripTrailingS(guess) === stripTrailingS(answer);
}

export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let prevRow = Array.from({ length: n + 1 }, (_, j) => j);
  let currRow = new Array(n + 1).fill(0);

  for (let i = 1; i <= m; i++) {
    currRow[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      currRow[j] = Math.min(
        currRow[j - 1] + 1,
        prevRow[j] + 1,
        prevRow[j - 1] + cost,
      );
    }
    [prevRow, currRow] = [currRow, prevRow];
  }
  return prevRow[n];
}

export type MatchResult =
  | { correct: true; nearMiss: false }
  | { correct: true; nearMiss: true; matchedAnswer: string }
  | { correct: false };

export function checkAnswer(rawGuess: string, answers: string[]): MatchResult {
  const guess = normalise(rawGuess);
  if (guess.length === 0) return { correct: false };

  const normalisedAnswers = answers.map(normalise);

  if (normalisedAnswers.includes(guess)) {
    return { correct: true, nearMiss: false };
  }

  for (const answer of normalisedAnswers) {
    if (isSimplePluralMatch(guess, answer)) {
      return { correct: true, nearMiss: false };
    }
  }

  for (let i = 0; i < normalisedAnswers.length; i++) {
    const answer = normalisedAnswers[i];
    if (answer.length >= 5 && guess.length >= 5) {
      if (levenshtein(guess, answer) === 1) {
        return { correct: true, nearMiss: true, matchedAnswer: answers[i] };
      }
    }
  }

  return { correct: false };
}
