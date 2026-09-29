import type { ComponentType } from "react";
import type { Puzzle } from "../content/schema";
import type { PuzzleComponentProps } from "./types";
import { Riddle } from "./Riddle";
import { LimerickRiddle } from "./LimerickRiddle";
import { LimerickFill } from "./LimerickFill";

export const puzzleRegistry: Partial<Record<Puzzle["type"], ComponentType<PuzzleComponentProps>>> = {
  riddle: Riddle,
  "limerick-riddle": LimerickRiddle,
  "limerick-fill": LimerickFill,
};

export function getPuzzleComponent(type: Puzzle["type"]): ComponentType<PuzzleComponentProps> | undefined {
  return puzzleRegistry[type];
}
