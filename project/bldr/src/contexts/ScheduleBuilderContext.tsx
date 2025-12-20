"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import { useActiveSchedule } from "@/contexts/ActiveScheduleContext";
import { useAuth } from "@/contexts/AuthContext";
import { timeToDecimal } from "@/lib/timeUtils";
import { parseDays } from "@/lib/timeUtils";
import { toast } from "sonner";
import {
  AlertTriangle,
  AlertCircle,
  Check,
  Repeat,
  Shuffle,
} from "lucide-react";
import toastStyle from "@/components/ui/toastStyle";
import { ActiveScheduleProvider } from "@/contexts/ActiveScheduleContext";
import { Trash2 } from "lucide-react";
import { ClassSection } from "@/types";
import {
  getUniqueClassesFromDraft,
  generatePermutations,
  createDraftHash,
  savePermutationsToStorage,
  loadPermutationsFromStorage,
  clearPermutationsFromStorage,
} from "@/lib/permutationUtils";

const ScheduleBuilderContext = createContext<any>(undefined);

export const ScheduleBuilderProvider = ({ children }: any) => {
  const { user, loading } = useAuth();

  // Track the previous user ID to detect user changes
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  // Helper to sync state with localStorage
  const usePersistedState = (key: string, initialValue: any) => {
    const [state, setStateInternal] = useState(() => {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : initialValue;
      }
      return initialValue;
    });

    // Wrap setState to immediately sync to localStorage on every update
    const setState = (valueOrUpdater: any) => {
      setStateInternal((prev: any) => {
        const nextValue =
          typeof valueOrUpdater === "function"
            ? valueOrUpdater(prev)
            : valueOrUpdater;
        // Sync to localStorage immediately within the same update
        if (typeof window !== "undefined") {
          localStorage.setItem(key, JSON.stringify(nextValue));
        }
        return nextValue;
      });
    };

    return [state, setState];
  };

  // Draft schedule data (unsaved)
  const [draftSchedule, setDraftSchedule] = usePersistedState(
    "draftSchedule",
    []
  );
  const [draftScheduleName, setDraftScheduleName] = usePersistedState(
    "draftScheduleName",
    ""
  );
  const [draftSemester, setDraftSemester] = usePersistedState(
    "draftSemester",
    ""
  );
  const [draftYear, setDraftYear] = usePersistedState("draftYear", "");

  // Track if editing existing schedule
  const [isEditingExisting, setIsEditingExisting] = usePersistedState(
    "isEditingExisting",
    false
  );
  const [existingScheduleId, setExistingScheduleId] = usePersistedState(
    "existingScheduleId",
    null
  );

  // Permutation browsing state
  const [permutations, setPermutations] = useState<ClassSection[][]>([]);
  const [permutationIndex, setPermutationIndex] = useState<number>(0);
  const [isGeneratingPermutations, setIsGeneratingPermutations] =
    useState<boolean>(false);
  const [allSectionsCache, setAllSectionsCache] = useState<
    Map<string, ClassSection[]>
  >(new Map());
  const prevDraftHashRef = useRef<string>("");

  // Try to read the active schedule from ActiveScheduleContext. If the
  // provider isn't present higher in the tree, the hook will throw; we
  // catch that and treat it as "no active schedule available" so this
  // provider can still be used independently in tests or other places.
  let activeSchedule: any = null;
  let setActiveSchedule: any = null;
  let addScheduleToList: any = null;
  try {
    // Calling the hook unconditionally (inside try) preserves hook order
    // while letting us handle the missing-provider case gracefully.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const activeScheduleContext = useActiveSchedule();
    activeSchedule = activeScheduleContext.activeSchedule;
    setActiveSchedule = activeScheduleContext.setActiveSchedule;
    addScheduleToList = activeScheduleContext.addScheduleToList;
  } catch (e) {
    activeSchedule = null;
    setActiveSchedule = null;
    addScheduleToList = null;
  }

  // Clear draft state when user changes (sign-out or different user signs in)
  useEffect(() => {
    if (loading) return; // wait until auth has finished initializing

    const currentUserId = user?.id ?? null;
    const prevUserId = prevUserIdRef.current;

    // Detect user change — skip the very first render (prevUserId === undefined)
    // to avoid clearing on page refresh
    if (prevUserId !== undefined && prevUserId !== currentUserId) {
      // User changed — clear all draft state in React and localStorage
      setDraftSchedule([]);
      setDraftScheduleName("");
      setDraftSemester("");
      setDraftYear("");
      setIsEditingExisting(false);
      setExistingScheduleId(null);

      // Also clear localStorage to prevent stale reads on next mount
      if (typeof window !== "undefined") {
        localStorage.removeItem("draftSchedule");
        localStorage.removeItem("draftScheduleName");
        localStorage.removeItem("draftSemester");
        localStorage.removeItem("draftYear");
        localStorage.removeItem("isEditingExisting");
        localStorage.removeItem("existingScheduleId");
        // Clear permutation storage
        clearPermutationsFromStorage();
      }

      // Clear permutation state
      setPermutations([]);
      setPermutationIndex(0);
      setAllSectionsCache(new Map());
    }

    // Update the ref for next comparison
    prevUserIdRef.current = currentUserId;
  }, [user?.id, loading]);

  // When a schedule becomes active, copy its classes into the draft so the
  // schedule builder immediately reflects the selected active schedule.
  useEffect(() => {
    if (!activeSchedule) {
      return;
    }

    // Don't overwrite if we're already editing the same schedule
    if (isEditingExisting && existingScheduleId === activeSchedule.id) return;

    setDraftSchedule(activeSchedule.classes || []);
    setDraftScheduleName(activeSchedule.name || "");
    setDraftSemester(activeSchedule.semester || "");
    setDraftYear(activeSchedule.year || "");
    setIsEditingExisting(true);
    setExistingScheduleId(activeSchedule.id || null);
  }, [activeSchedule?.id]);

  // Load permutations from localStorage on mount
  useEffect(() => {
    const stored = loadPermutationsFromStorage();
    if (stored) {
      setPermutations(stored.permutations);
      setPermutationIndex(stored.currentIndex);
      prevDraftHashRef.current = stored.draftHash;
    }
  }, []);

  // Helper function to check if two schedules are equivalent (same sections)
  const areSchedulesEquivalent = useCallback(
    (schedule1: ClassSection[], schedule2: ClassSection[]): boolean => {
      if (schedule1.length !== schedule2.length) return false;
      const uuids1 = new Set(schedule1.map((s) => s.uuid));
      const uuids2 = new Set(schedule2.map((s) => s.uuid));
      if (uuids1.size !== uuids2.size) return false;
      for (const uuid of uuids1) {
        if (!uuids2.has(uuid)) return false;
      }
      return true;
    },
    []
  );

  // Find the index of a schedule in the permutations list
  const findPermutationIndex = useCallback(
    (schedule: ClassSection[], permutationsList: ClassSection[][]): number => {
      for (let i = 0; i < permutationsList.length; i++) {
        if (areSchedulesEquivalent(schedule, permutationsList[i])) {
          return i;
        }
      }
      return 0; // Default to 0 if not found
    },
    [areSchedulesEquivalent]
  );

  // Fetch all sections for a class from the API
  const fetchAllSectionsForClass = useCallback(
    async (dept: string, code: string): Promise<ClassSection[]> => {
      const classKey = `${dept}-${code}`;

      // Check cache first
      if (allSectionsCache.has(classKey)) {
        return allSectionsCache.get(classKey) || [];
      }

      try {
        const response = await fetch("/api/getClassInfo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subject: `${dept} ${code}` }),
        });

        if (!response.ok) {
          console.error(`Failed to fetch sections for ${classKey}`);
          return [];
        }

        const data = await response.json();
        if (!data.success || !data.data || data.data.length === 0) {
          return [];
        }

        // Map the sections to include dept, code, and title
        const sections: ClassSection[] = data.data[0].sections.map(
          (section: any) => ({
            ...section,
            dept: data.data[0].dept,
            code: data.data[0].code,
            title: data.data[0].title,
          })
        );

        // Cache the result
        setAllSectionsCache((prev) => new Map(prev).set(classKey, sections));

        return sections;
      } catch (error) {
        console.error(`Error fetching sections for ${classKey}:`, error);
        return [];
      }
    },
    [allSectionsCache]
  );

  // Generate permutations when draft schedule changes
  const generateSchedulePermutations = useCallback(async () => {
    if (draftSchedule.length === 0) {
      setPermutations([]);
      setPermutationIndex(0);
      clearPermutationsFromStorage();
      return;
    }

    const currentDraftHash = createDraftHash(draftSchedule);

    // If the unique classes haven't changed, no need to regenerate
    if (
      currentDraftHash === prevDraftHashRef.current &&
      permutations.length > 0
    ) {
      return;
    }

    setIsGeneratingPermutations(true);

    try {
      const uniqueClasses = getUniqueClassesFromDraft(draftSchedule);

      // Fetch all sections for each unique class
      const allSections = new Map<string, ClassSection[]>();

      await Promise.all(
        uniqueClasses.map(async (cls) => {
          const sections = await fetchAllSectionsForClass(cls.dept, cls.code);
          allSections.set(cls.classKey, sections);
        })
      );

      // Generate permutations
      const newPermutations = generatePermutations(allSections, uniqueClasses);

      // Find the index of the current draft in the permutations
      const currentIndex = findPermutationIndex(draftSchedule, newPermutations);

      setPermutations(newPermutations);
      setPermutationIndex(currentIndex);
      prevDraftHashRef.current = currentDraftHash;

      // Save to localStorage
      savePermutationsToStorage(
        newPermutations,
        currentIndex,
        currentDraftHash
      );

    } catch (error) {
      console.error("Error generating permutations:", error);
    } finally {
      setIsGeneratingPermutations(false);
    }
  }, [
    draftSchedule,
    permutations.length,
    fetchAllSectionsForClass,
    findPermutationIndex,
  ]);

  // Trigger permutation generation when draft schedule changes
  useEffect(() => {
    // Debounce the generation to avoid too many API calls
    const timeoutId = setTimeout(() => {
      generateSchedulePermutations();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [draftSchedule]);

  // Navigate to next permutation
  const nextPermutation = useCallback(() => {
    if (permutations.length <= 1) return;

    const newIndex = (permutationIndex + 1) % permutations.length;
    setPermutationIndex(newIndex);
    setDraftSchedule(permutations[newIndex]);
    savePermutationsToStorage(permutations, newIndex, prevDraftHashRef.current);
  }, [permutations, permutationIndex, setDraftSchedule]);

  // Navigate to previous permutation
  const prevPermutation = useCallback(() => {
    if (permutations.length <= 1) return;

    const newIndex =
      (permutationIndex - 1 + permutations.length) % permutations.length;
    setPermutationIndex(newIndex);
    setDraftSchedule(permutations[newIndex]);
    savePermutationsToStorage(permutations, newIndex, prevDraftHashRef.current);
  }, [permutations, permutationIndex, setDraftSchedule]);

  // Jump to a specific permutation
  const goToPermutation = useCallback(
    (index: number) => {
      if (index < 0 || index >= permutations.length) return;

      setPermutationIndex(index);
      setDraftSchedule(permutations[index]);
      savePermutationsToStorage(permutations, index, prevDraftHashRef.current);
    },
    [permutations, setDraftSchedule]
  );

  // Sync permutation index to match a given schedule (without changing draft)
  const syncPermutationIndex = useCallback(
    (schedule: ClassSection[]) => {
      if (permutations.length === 0) return;
      const index = findPermutationIndex(schedule, permutations);
      setPermutationIndex(index);
      savePermutationsToStorage(permutations, index, prevDraftHashRef.current);
    },
    [permutations, findPermutationIndex]
  );

  // Helper functions
  const checkTimeConflict = (newClass: any, existingClasses: any[]) => {
    const newDays = parseDays(newClass.days);
    const newStart = timeToDecimal(newClass.starttime);
    const newEnd = timeToDecimal(newClass.endtime);

    for (const existing of existingClasses) {
      // Skip conflict check if it's the same class (dept, code, component) - we'll replace it anyway
      if (
        existing.dept === newClass.dept &&
        existing.code === newClass.code &&
        existing.component === newClass.component
      ) {
        continue;
      }

      const existingDays = parseDays(existing.days);
      const existingStart = timeToDecimal(existing.starttime);
      const existingEnd = timeToDecimal(existing.endtime);

      // Check if there's any day overlap
      const hasCommonDay = newDays.some((day: string) =>
        existingDays.includes(day)
      );

      if (hasCommonDay) {
        // Check if times overlap: new class starts before existing ends AND new class ends after existing starts
        const timeOverlap = newStart < existingEnd && newEnd > existingStart;

        if (timeOverlap) {
          console.log(
            `Checking conflict between ${newClass.dept} ${newClass.code} ${newClass.classID} and ${existing.dept} ${existing.code} ${existing.classID}`
          );

          return {
            conflict: true,
            conflictingClass: existing,
          };
        }
      }
    }

    return { conflict: false };
  };

  const addClassToDraft = async (classItem: any) => {
    // If no active schedule exists, create an "Untitled" schedule
    if (!activeSchedule && setActiveSchedule && addScheduleToList) {
      try {
        const response = await fetch("/api/createSchedule", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            scheduleName: "Untitled",
            semester: "Spring 2026",
            year: 2026,
          }),
        });

        if (!response.ok) {
          toast.error("Failed to create schedule. Please try again.", {
            style: toastStyle,
            duration: 2000,
            icon: <AlertCircle className="h-5 w-5" />,
          });
          return;
        }

        const data = await response.json();

        // Create the new schedule object and set it as active
        const newSchedule = {
          id: data.schedule.scheduleid,
          name: data.schedule.schedulename,
          semester: data.schedule.semester,
          year: data.schedule.year,
          classes: [],
        };

        addScheduleToList(newSchedule);

        // Wait a bit for the active schedule to be set
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error("Error creating schedule:", error);
        toast.error("Failed to create schedule. Please try again.", {
          style: toastStyle,
          duration: 2000,
          icon: <AlertCircle className="h-5 w-5" />,
        });
        return;
      }
    }

    // Check conditions before state update
    const exists = draftSchedule.some(
      (item: any) => item.uuid === classItem.uuid
    );
    if (exists) {
      // Show toast notification for duplicate
      toast.error(
        `Section #${classItem.classID} of ${classItem.dept} ${classItem.code} (${classItem.component}) is already in the schedule`,
        {
          style: toastStyle,
          duration: 2000,
          icon: <AlertCircle className="h-5 w-5 text-blue-500" />,
        }
      );
      return; // Don't add duplicate UUID
    }

    const sameComponentExists = draftSchedule.some(
      (item: any) =>
        item.dept === classItem.dept &&
        item.code === classItem.code &&
        item.component === classItem.component
    );

    const conflictCheck = checkTimeConflict(classItem, draftSchedule);
    if (conflictCheck.conflict) {
      // Show toast notification for conflict
      const conflicting = conflictCheck.conflictingClass;
      toast.error(
        `Time conflict with ${conflicting.dept} ${conflicting.code} (${conflicting.component})`,
        {
          style: toastStyle,
          duration: 2000,
          icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
        }
      );
      return;
    }

    if (sameComponentExists) {
      // Find the old class being replaced for the toast notification
      const oldClass = draftSchedule.find(
        (item: any) =>
          item.dept === classItem.dept &&
          item.code === classItem.code &&
          item.component === classItem.component
      );

      // Show toast notification for replacement
      toast.success(
        `Replaced ${oldClass.component} #${oldClass.classID} with #${classItem.classID}`,
        {
          style: toastStyle,
          duration: 2000,
          icon: <Repeat className="h-5 w-5 text-blue-500" />,
        }
      );

      // Replace the existing section of this component type
      setDraftSchedule((prev: any) => {
        const next = prev.map((item: any) =>
          item.dept === classItem.dept &&
          item.code === classItem.code &&
          item.component === classItem.component
            ? classItem
            : item
        );
        return next;
      });
      return;
    }

    // Show toast notification for new class addition
    toast.success(
      `Added ${classItem.dept} ${classItem.code} (${classItem.component}) #${classItem.classID} to schedule`,
      {
        style: toastStyle,
        duration: 2000,
        icon: <Check className="h-5 w-5 text-green-500" />,
      }
    );

    // Add new class section — compute next array so we can log the updated value
    setDraftSchedule((prev: any) => {
      const next = [...prev, classItem];
      return next;
    });
  };

  const removeClassFromDraft = (index: number) => {
    setDraftSchedule((prev: any) => {
      const next = prev.filter((_: any, i: number) => i !== index);
      return next;
    });

    // Trigger the toast after the state update
    toast(
      <div>
        Removed {draftSchedule[index].dept} {draftSchedule[index].code} (
        {draftSchedule[index].component}) #{draftSchedule[index].classID} from
        schedule
      </div>,
      {
        style: toastStyle,
        duration: 2000,
        icon: <Trash2 className="h-5 w-5 text-red-500" />,
      }
    );
  };

  const clearDraft = () => {
    setDraftSchedule([]);
    setIsEditingExisting(false);
    // setExistingScheduleId(null);
    // Clear permutations when draft is cleared
    setPermutations([]);
    setPermutationIndex(0);
    clearPermutationsFromStorage();
  };

  const loadExistingScheduleIntoDraft = (schedule: any) => {
    setDraftSchedule(schedule.classes || []);
    setDraftScheduleName(schedule.name || "");
    setDraftSemester(schedule.semester || "");
    setDraftYear(schedule.year || "");
    setIsEditingExisting(true);
    setExistingScheduleId(schedule.id || null);
  };

  return (
    <ScheduleBuilderContext.Provider
      value={{
        draftSchedule,
        setDraftSchedule,
        draftScheduleName,
        setDraftScheduleName,
        draftSemester,
        setDraftSemester,
        draftYear,
        setDraftYear,
        isEditingExisting,
        setIsEditingExisting,
        existingScheduleId,
        setExistingScheduleId,
        addClassToDraft,
        removeClassFromDraft,
        clearDraft,
        loadExistingScheduleIntoDraft,
        // Permutation browsing
        permutations,
        permutationIndex,
        isGeneratingPermutations,
        nextPermutation,
        prevPermutation,
        goToPermutation,
        syncPermutationIndex,
        generateSchedulePermutations,
      }}
    >
      {children}
    </ScheduleBuilderContext.Provider>
  );
};

export const useScheduleBuilder = () => {
  return useContext(ScheduleBuilderContext);
};
