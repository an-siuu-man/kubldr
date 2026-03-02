/**
 * permutationUtils.ts
 *
 * Utility functions for generating valid schedule permutations.
 * Uses backtracking to find all combinations of class sections
 * that don't have time conflicts.
 */

import { ClassSection } from "@/types";
import { timeToDecimal, parseDays } from "@/lib/timeUtils";

/**
 * Groups sections by component type for a given class
 */
interface ComponentGroup {
  component: string;
  sections: ClassSection[];
}

/**
 * Groups all sections of a class by their component type (LEC, LAB, etc.)
 */
interface ClassWithComponents {
  classKey: string; // "DEPT-CODE"
  dept: string;
  code: string;
  components: ComponentGroup[];
}

/**
 * Checks if two class sections have a time conflict
 * @param section1 - First class section
 * @param section2 - Second class section
 * @returns true if there is a time conflict
 */
export function hasTimeConflict(
  section1: ClassSection,
  section2: ClassSection
): boolean {
  const days1 = parseDays(section1.days || "");
  const days2 = parseDays(section2.days || "");

  // Check if there's any day overlap
  const hasCommonDay = days1.some((day: string) => days2.includes(day));
  if (!hasCommonDay) return false;

  // Check time overlap
  const start1 = timeToDecimal(section1.starttime || "");
  const end1 = timeToDecimal(section1.endtime || "");
  const start2 = timeToDecimal(section2.starttime || "");
  const end2 = timeToDecimal(section2.endtime || "");

  // Time conflict: section1 starts before section2 ends AND section1 ends after section2 starts
  return start1 < end2 && end1 > start2;
}

/**
 * Checks if a new section conflicts with any existing sections in the schedule
 * @param newSection - The section to check
 * @param existingSections - Array of already selected sections
 * @returns true if there's a conflict with any existing section
 */
export function conflictsWithSchedule(
  newSection: ClassSection,
  existingSections: ClassSection[]
): boolean {
  for (const existing of existingSections) {
    if (hasTimeConflict(newSection, existing)) {
      return true;
    }
  }
  return false;
}

/**
 * Extracts unique classes from a draft schedule and groups their sections by component
 * @param draftSchedule - The current draft schedule (list of sections)
 * @returns Array of unique classes with their component groups
 */
export function getUniqueClassesFromDraft(
  draftSchedule: ClassSection[]
): ClassWithComponents[] {
  // First, get unique class keys (dept-code combinations)
  const classMap = new Map<string, ClassWithComponents>();

  for (const section of draftSchedule) {
    const classKey = `${section.dept}-${section.code}`;

    if (!classMap.has(classKey)) {
      classMap.set(classKey, {
        classKey,
        dept: section.dept,
        code: section.code,
        components: [],
      });
    }

    const classData = classMap.get(classKey)!;

    // Find or create the component group
    let componentGroup = classData.components.find(
      (c) => c.component === section.component
    );
    if (!componentGroup) {
      componentGroup = { component: section.component, sections: [] };
      classData.components.push(componentGroup);
    }

    // Add this section to the component group if not already present
    if (!componentGroup.sections.some((s) => s.uuid === section.uuid)) {
      componentGroup.sections.push(section);
    }
  }

  return Array.from(classMap.values());
}

/**
 * Generates all valid schedule permutations using backtracking.
 * Each permutation contains exactly one section for each component of each class.
 * Pinned sections are preserved and not changed during permutation generation.
 *
 * @param allSections - Map of classKey to all available sections (fetched from API)
 * @param uniqueClasses - Unique classes extracted from draft schedule
 * @param pinnedSections - Array of pinned section UUIDs that should not be changed
 * @returns Array of valid schedule permutations (each is an array of ClassSection)
 */
export function generatePermutations(
  allSections: Map<string, ClassSection[]>,
  uniqueClasses: ClassWithComponents[],
  pinnedSections: Set<string> = new Set()
): ClassSection[][] {
  const permutations: ClassSection[][] = [];

  // Build a flat list of component groups to iterate through
  // Each entry is { classKey, component, sections (all available sections for this component) }
  const componentChoices: {
    classKey: string;
    dept: string;
    code: string;
    component: string;
    sections: ClassSection[];
    pinnedSection?: ClassSection; // If a section is pinned for this component
  }[] = [];

  for (const cls of uniqueClasses) {
    const classKey = cls.classKey;
    const allClassSections = allSections.get(classKey) || [];

    for (const compGroup of cls.components) {
      // Check if any section in this component group is pinned
      const pinnedSection = compGroup.sections.find((s) =>
        pinnedSections.has(s.uuid)
      );

      // Get all sections for this component from the fetched data
      const sectionsForComponent = allClassSections.filter(
        (s) => s.component === compGroup.component
      );

      if (sectionsForComponent.length > 0) {
        componentChoices.push({
          classKey,
          dept: cls.dept,
          code: cls.code,
          component: compGroup.component,
          sections: sectionsForComponent,
          pinnedSection: pinnedSection
            ? { ...pinnedSection, pinned: true }
            : undefined,
        });
      }
    }
  }

  if (componentChoices.length === 0) {
    return [];
  }

  // Backtracking algorithm
  function backtrack(index: number, currentSchedule: ClassSection[]): void {
    // Base case: we've selected a section for each component
    if (index === componentChoices.length) {
      permutations.push([...currentSchedule]);
      return;
    }

    const choice = componentChoices[index];

    // If this component has a pinned section, only use that section
    if (choice.pinnedSection) {
      // Check if the pinned section conflicts with current schedule
      if (!conflictsWithSchedule(choice.pinnedSection, currentSchedule)) {
        currentSchedule.push(choice.pinnedSection);
        backtrack(index + 1, currentSchedule);
        currentSchedule.pop();
      }
      // If pinned section conflicts, this branch is invalid - don't proceed
      return;
    }

    // Try each section for this component (non-pinned)
    for (const section of choice.sections) {
      // Check if this section conflicts with the current schedule
      if (!conflictsWithSchedule(section, currentSchedule)) {
        currentSchedule.push(section);
        backtrack(index + 1, currentSchedule);
        currentSchedule.pop();
      }
    }
  }

  backtrack(0, []);

  return permutations;
}

/**
 * Storage key for permutations in localStorage
 */
export const PERMUTATIONS_STORAGE_KEY = "schedulePermutations";
export const PERMUTATION_INDEX_STORAGE_KEY = "permutationIndex";
export const PERMUTATION_DRAFT_HASH_KEY = "permutationDraftHash";

/**
 * Creates a hash of the draft schedule to detect changes
 * @param draftSchedule - The draft schedule
 * @returns A string hash representing the unique class components and pinned sections in the draft
 */
export function createDraftHash(draftSchedule: ClassSection[]): string {
  const uniqueComponents = new Set<string>();
  const pinnedSections: string[] = [];
  for (const section of draftSchedule) {
    uniqueComponents.add(
      `${section.dept}-${section.code}-${section.component}`
    );
    // Include pinned sections in the hash so regeneration happens when pins change
    if (section.pinned) {
      pinnedSections.push(`pinned:${section.uuid}`);
    }
  }
  const componentsHash = Array.from(uniqueComponents).sort().join("|");
  const pinnedHash = pinnedSections.sort().join("|");
  return `${componentsHash}||${pinnedHash}`;
}

/**
 * Saves permutations to localStorage
 * @param permutations - Array of valid schedule permutations
 * @param currentIndex - Current permutation index
 * @param draftHash - Hash of the draft that generated these permutations
 */
export function savePermutationsToStorage(
  permutations: ClassSection[][],
  currentIndex: number,
  draftHash: string
): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(
      PERMUTATIONS_STORAGE_KEY,
      JSON.stringify(permutations)
    );
    localStorage.setItem(PERMUTATION_INDEX_STORAGE_KEY, String(currentIndex));
    localStorage.setItem(PERMUTATION_DRAFT_HASH_KEY, draftHash);
  } catch (e) {
    console.error("Failed to save permutations to localStorage:", e);
  }
}

/**
 * Loads permutations from localStorage
 * @returns Object with permutations, currentIndex, and draftHash, or null if not found
 */
export function loadPermutationsFromStorage(): {
  permutations: ClassSection[][];
  currentIndex: number;
  draftHash: string;
} | null {
  if (typeof window === "undefined") return null;

  try {
    const permutationsStr = localStorage.getItem(PERMUTATIONS_STORAGE_KEY);
    const indexStr = localStorage.getItem(PERMUTATION_INDEX_STORAGE_KEY);
    const draftHash = localStorage.getItem(PERMUTATION_DRAFT_HASH_KEY);

    if (!permutationsStr || !draftHash) return null;

    return {
      permutations: JSON.parse(permutationsStr),
      currentIndex: indexStr ? parseInt(indexStr, 10) : 0,
      draftHash,
    };
  } catch (e) {
    console.error("Failed to load permutations from localStorage:", e);
    return null;
  }
}

/**
 * Clears permutations from localStorage
 */
export function clearPermutationsFromStorage(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem(PERMUTATIONS_STORAGE_KEY);
  localStorage.removeItem(PERMUTATION_INDEX_STORAGE_KEY);
  localStorage.removeItem(PERMUTATION_DRAFT_HASH_KEY);
}
