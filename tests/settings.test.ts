import { beforeEach, describe, expect, it } from "vitest";
import { getAllLevelsUnlocked, setAllLevelsUnlocked } from "../src/state/settings";

beforeEach(() => {
  window.localStorage.clear();
});

describe("getAllLevelsUnlocked / setAllLevelsUnlocked", () => {
  it("defaults to locked (false) when nothing is stored", () => {
    expect(getAllLevelsUnlocked()).toBe(false);
  });

  it("persists true across reads", () => {
    setAllLevelsUnlocked(true);
    expect(getAllLevelsUnlocked()).toBe(true);
  });

  it("persists false after being set true", () => {
    setAllLevelsUnlocked(true);
    setAllLevelsUnlocked(false);
    expect(getAllLevelsUnlocked()).toBe(false);
  });

  it("ignores corrupted storage and falls back to the default", () => {
    window.localStorage.setItem("puzzle-peaks:settings:v1", "not json");
    expect(getAllLevelsUnlocked()).toBe(false);
  });
});
