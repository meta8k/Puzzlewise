export type CampInfo = {
  id: 1 | 2 | 3 | 4 | 5;
  name: string;
  ageRange: string;
  tagline: string;
  paletteClass: string;
  hasContent: boolean;
};

export const CAMPS: CampInfo[] = [
  {
    id: 1,
    name: "Meadow",
    ageRange: "6-7",
    tagline: "Everyday riddles and rhymes",
    paletteClass: "camp-meadow",
    hasContent: true,
  },
  {
    id: 2,
    name: "Forest",
    ageRange: "7-8",
    tagline: "Wordplay and finish-the-rhyme",
    paletteClass: "camp-forest",
    hasContent: true,
  },
  {
    id: 3,
    name: "River",
    ageRange: "8-10",
    tagline: "Spelling, anagrams, word ladders",
    paletteClass: "camp-river",
    hasContent: false,
  },
  {
    id: 4,
    name: "Cliffs",
    ageRange: "10-11",
    tagline: "Sequences and lateral thinking",
    paletteClass: "camp-cliffs",
    hasContent: false,
  },
  {
    id: 5,
    name: "Summit",
    ageRange: "11-12+",
    tagline: "Ciphers and multi-step logic",
    paletteClass: "camp-summit",
    hasContent: false,
  },
];

export function campInfo(id: number): CampInfo | undefined {
  return CAMPS.find((c) => c.id === id);
}
