import { beforeEach, describe, expect, it } from "vitest";
import type { ClassSection } from "@/types";
import {
  clearPermutationsFromStorage,
  conflictsWithSchedule,
  createDraftHash,
  generatePermutations,
  getUniqueClassesFromDraft,
  hasTimeConflict,
  loadPermutationsFromStorage,
  PERMUTATION_DRAFT_HASH_KEY,
  PERMUTATION_INDEX_STORAGE_KEY,
  PERMUTATIONS_STORAGE_KEY,
  savePermutationsToStorage,
} from "./permutationUtils";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeSection(overrides: Partial<ClassSection> = {}): ClassSection {
  return {
    uuid: "uuid-1",
    classID: "1",
    dept: "EECS",
    code: "101",
    title: "Intro to CS",
    days: "MWF",
    starttime: "9:00 AM",
    endtime: "10:00 AM",
    component: "LEC",
    ...overrides,
  };
}

// ─── hasTimeConflict ──────────────────────────────────────────────────────────

describe("hasTimeConflict", () => {
  it("returns true when sections share a day and times overlap", () => {
    const s1 = makeSection({
      days: "MWF",
      starttime: "9:00 AM",
      endtime: "10:00 AM",
    });
    const s2 = makeSection({
      days: "MWF",
      starttime: "9:30 AM",
      endtime: "10:30 AM",
    });
    expect(hasTimeConflict(s1, s2)).toBe(true);
  });

  it("returns false when sections share a day but times don't overlap", () => {
    const s1 = makeSection({
      days: "MWF",
      starttime: "8:00 AM",
      endtime: "9:00 AM",
    });
    const s2 = makeSection({
      days: "MWF",
      starttime: "9:00 AM",
      endtime: "10:00 AM",
    });
    // end1 === start2 → open-interval, no overlap
    expect(hasTimeConflict(s1, s2)).toBe(false);
  });

  it("returns false when sections have no day in common", () => {
    const s1 = makeSection({
      days: "MWF",
      starttime: "9:00 AM",
      endtime: "10:00 AM",
    });
    const s2 = makeSection({
      days: "TuTh",
      starttime: "9:00 AM",
      endtime: "10:00 AM",
    });
    expect(hasTimeConflict(s1, s2)).toBe(false);
  });

  it("handles missing times gracefully (defaults to 0)", () => {
    const s1 = makeSection({ days: "MWF", starttime: "", endtime: "" });
    const s2 = makeSection({ days: "MWF", starttime: "", endtime: "" });
    // Both 0–0: start1 (0) < end2 (0) is false → no conflict
    expect(hasTimeConflict(s1, s2)).toBe(false);
  });

  it("returns true for a section that fully contains another", () => {
    const s1 = makeSection({
      days: "MWF",
      starttime: "8:00 AM",
      endtime: "11:00 AM",
    });
    const s2 = makeSection({
      days: "MWF",
      starttime: "9:00 AM",
      endtime: "10:00 AM",
    });
    expect(hasTimeConflict(s1, s2)).toBe(true);
  });
});

// ─── conflictsWithSchedule ────────────────────────────────────────────────────

describe("conflictsWithSchedule", () => {
  it("returns false for an empty existing schedule", () => {
    const newSec = makeSection();
    expect(conflictsWithSchedule(newSec, [])).toBe(false);
  });

  it("returns false when no section conflicts", () => {
    const newSec = makeSection({
      days: "MWF",
      starttime: "11:00 AM",
      endtime: "12:00 PM",
    });
    const existing = [
      makeSection({
        days: "MWF",
        starttime: "9:00 AM",
        endtime: "10:00 AM",
        uuid: "other",
      }),
    ];
    expect(conflictsWithSchedule(newSec, existing)).toBe(false);
  });

  it("returns true when one section conflicts", () => {
    const newSec = makeSection({
      days: "MWF",
      starttime: "9:30 AM",
      endtime: "10:30 AM",
    });
    const existing = [
      makeSection({
        days: "MWF",
        starttime: "9:00 AM",
        endtime: "10:00 AM",
        uuid: "other",
      }),
    ];
    expect(conflictsWithSchedule(newSec, existing)).toBe(true);
  });
});

// ─── getUniqueClassesFromDraft ────────────────────────────────────────────────

describe("getUniqueClassesFromDraft", () => {
  it("returns an empty array for an empty draft", () => {
    expect(getUniqueClassesFromDraft([])).toEqual([]);
  });

  it("groups sections by dept-code", () => {
    const draft = [
      makeSection({ dept: "EECS", code: "101", component: "LEC", uuid: "u1" }),
      makeSection({ dept: "EECS", code: "101", component: "LAB", uuid: "u2" }),
      makeSection({ dept: "MATH", code: "220", component: "LEC", uuid: "u3" }),
    ];
    const result = getUniqueClassesFromDraft(draft);
    expect(result).toHaveLength(2);
    const eecs = result.find((c) => c.classKey === "EECS-101");
    expect(eecs?.components).toHaveLength(2);
    const math = result.find((c) => c.classKey === "MATH-220");
    expect(math?.components).toHaveLength(1);
  });

  it("deduplicates sections with the same uuid within a component group", () => {
    const draft = [
      makeSection({ dept: "EECS", code: "101", component: "LEC", uuid: "u1" }),
      makeSection({ dept: "EECS", code: "101", component: "LEC", uuid: "u1" }), // duplicate
    ];
    const result = getUniqueClassesFromDraft(draft);
    expect(result[0].components[0].sections).toHaveLength(1);
  });
});

// ─── generatePermutations ─────────────────────────────────────────────────────

describe("generatePermutations", () => {
  it("returns [] when uniqueClasses is empty", () => {
    expect(generatePermutations(new Map(), [])).toEqual([]);
  });

  it("returns one permutation for a single section with no conflict", () => {
    const section = makeSection({ uuid: "u1" });
    const draft = [section];
    const uniqueClasses = getUniqueClassesFromDraft(draft);
    const allSections = new Map([["EECS-101", [section]]]);
    const perms = generatePermutations(allSections, uniqueClasses);
    expect(perms).toHaveLength(1);
    expect(perms[0]).toHaveLength(1);
    expect(perms[0][0].uuid).toBe("u1");
  });

  it("returns all non-conflicting permutations for two classes with two options each", () => {
    // Class A: LEC at 9–10 AM (MWF) or 10–11 AM (MWF)
    // Class B: LEC at 9–10 AM (TuTh) — different days, never conflicts
    const a1 = makeSection({
      dept: "EECS",
      code: "101",
      component: "LEC",
      uuid: "a1",
      days: "MWF",
      starttime: "9:00 AM",
      endtime: "10:00 AM",
    });
    const a2 = makeSection({
      dept: "EECS",
      code: "101",
      component: "LEC",
      uuid: "a2",
      days: "MWF",
      starttime: "10:00 AM",
      endtime: "11:00 AM",
    });
    const b1 = makeSection({
      dept: "MATH",
      code: "220",
      component: "LEC",
      uuid: "b1",
      days: "TuTh",
      starttime: "9:00 AM",
      endtime: "10:00 AM",
    });
    const b2 = makeSection({
      dept: "MATH",
      code: "220",
      component: "LEC",
      uuid: "b2",
      days: "TuTh",
      starttime: "10:00 AM",
      endtime: "11:00 AM",
    });

    const draft = [a1, b1];
    const uniqueClasses = getUniqueClassesFromDraft(draft);
    const allSections = new Map([
      ["EECS-101", [a1, a2]],
      ["MATH-220", [b1, b2]],
    ]);

    const perms = generatePermutations(allSections, uniqueClasses);
    // 2 options × 2 options = 4, none conflict across different day patterns
    expect(perms).toHaveLength(4);
    // Each permutation should have 2 sections
    for (const p of perms) {
      expect(p).toHaveLength(2);
    }
  });

  it("prunes conflicting branches", () => {
    // Two classes both MWF 9–10 AM — they always conflict
    const a1 = makeSection({
      dept: "EECS",
      code: "101",
      component: "LEC",
      uuid: "a1",
      days: "MWF",
      starttime: "9:00 AM",
      endtime: "10:00 AM",
    });
    const b1 = makeSection({
      dept: "MATH",
      code: "220",
      component: "LEC",
      uuid: "b1",
      days: "MWF",
      starttime: "9:00 AM",
      endtime: "10:00 AM",
    });

    const draft = [a1, b1];
    const uniqueClasses = getUniqueClassesFromDraft(draft);
    const allSections = new Map([
      ["EECS-101", [a1]],
      ["MATH-220", [b1]],
    ]);

    const perms = generatePermutations(allSections, uniqueClasses);
    expect(perms).toHaveLength(0);
  });

  it("forces pinned section and excludes it from exploration", () => {
    const a1 = makeSection({
      dept: "EECS",
      code: "101",
      component: "LEC",
      uuid: "a1",
      days: "MWF",
      starttime: "9:00 AM",
      endtime: "10:00 AM",
      pinned: true,
    });
    const a2 = makeSection({
      dept: "EECS",
      code: "101",
      component: "LEC",
      uuid: "a2",
      days: "MWF",
      starttime: "10:00 AM",
      endtime: "11:00 AM",
    });

    const draft = [a1, a2]; // a1 is in draft (pinned), a2 is an alternative
    const uniqueClasses = getUniqueClassesFromDraft(draft);
    const allSections = new Map([["EECS-101", [a1, a2]]]);
    const pinnedSections = new Set(["a1"]);

    const perms = generatePermutations(
      allSections,
      uniqueClasses,
      pinnedSections,
    );
    // Only a1 should be used since it's pinned
    expect(perms).toHaveLength(1);
    expect(perms[0][0].uuid).toBe("a1");
    expect(perms[0][0].pinned).toBe(true);
  });

  it("returns [] when the pinned section conflicts with another required section", () => {
    const a1 = makeSection({
      dept: "EECS",
      code: "101",
      component: "LEC",
      uuid: "a1",
      days: "MWF",
      starttime: "9:00 AM",
      endtime: "10:00 AM",
      pinned: true,
    });
    const b1 = makeSection({
      dept: "MATH",
      code: "220",
      component: "LEC",
      uuid: "b1",
      days: "MWF",
      starttime: "9:00 AM",
      endtime: "10:00 AM",
    });

    const draft = [a1, b1];
    const uniqueClasses = getUniqueClassesFromDraft(draft);
    const allSections = new Map([
      ["EECS-101", [a1]],
      ["MATH-220", [b1]],
    ]);
    const pinnedSections = new Set(["a1"]);

    const perms = generatePermutations(
      allSections,
      uniqueClasses,
      pinnedSections,
    );
    expect(perms).toHaveLength(0);
  });
});

// ─── createDraftHash ──────────────────────────────────────────────────────────

describe("createDraftHash", () => {
  it("returns an empty hash for an empty draft", () => {
    expect(createDraftHash([])).toBe("||");
  });

  it("is stable regardless of section order in the draft", () => {
    const s1 = makeSection({
      dept: "EECS",
      code: "101",
      component: "LEC",
      uuid: "u1",
    });
    const s2 = makeSection({
      dept: "MATH",
      code: "220",
      component: "LEC",
      uuid: "u2",
    });
    const hash1 = createDraftHash([s1, s2]);
    const hash2 = createDraftHash([s2, s1]);
    expect(hash1).toBe(hash2);
  });

  it("changes when a pinned section is added", () => {
    const s1 = makeSection({
      dept: "EECS",
      code: "101",
      component: "LEC",
      uuid: "u1",
    });
    const hash1 = createDraftHash([s1]);
    const pinnedS1 = { ...s1, pinned: true };
    const hash2 = createDraftHash([pinnedS1]);
    expect(hash1).not.toBe(hash2);
  });

  it("generates distinct hashes for different class compositions", () => {
    const draft1 = [
      makeSection({ dept: "EECS", code: "101", component: "LEC", uuid: "u1" }),
    ];
    const draft2 = [
      makeSection({ dept: "MATH", code: "220", component: "LEC", uuid: "u2" }),
    ];
    expect(createDraftHash(draft1)).not.toBe(createDraftHash(draft2));
  });
});

// ─── localStorage helpers ─────────────────────────────────────────────────────

describe("localStorage permutation helpers", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("savePermutationsToStorage writes index and draftHash", () => {
    savePermutationsToStorage([], 3, "myhash");
    expect(localStorage.getItem(PERMUTATION_INDEX_STORAGE_KEY)).toBe("3");
    expect(localStorage.getItem(PERMUTATION_DRAFT_HASH_KEY)).toBe("myhash");
    // The permutations key itself should be absent (intentionally not persisted)
    expect(localStorage.getItem(PERMUTATIONS_STORAGE_KEY)).toBeNull();
  });

  it("loadPermutationsFromStorage returns null when nothing saved", () => {
    expect(loadPermutationsFromStorage()).toBeNull();
  });

  it("loadPermutationsFromStorage returns saved state", () => {
    savePermutationsToStorage([], 5, "testhash");
    const result = loadPermutationsFromStorage();
    expect(result).not.toBeNull();
    expect(result?.currentIndex).toBe(5);
    expect(result?.draftHash).toBe("testhash");
    // permutations is always empty (regenerated on mount)
    expect(result?.permutations).toEqual([]);
  });

  it("clearPermutationsFromStorage removes all keys", () => {
    savePermutationsToStorage([], 2, "hash");
    clearPermutationsFromStorage();
    expect(localStorage.getItem(PERMUTATION_INDEX_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(PERMUTATION_DRAFT_HASH_KEY)).toBeNull();
    expect(localStorage.getItem(PERMUTATIONS_STORAGE_KEY)).toBeNull();
  });
});
