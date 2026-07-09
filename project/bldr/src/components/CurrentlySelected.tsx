/**
 * CurrentlySelected.tsx
 *
 * Displays classes currently added to the draft schedule in a grouped list view.
 *
 * Features:
 * - Grouped display of class sections by course (dept + code)
 * - Displays section component type, class ID, days, times, and instructor
 * - Warning indicator for classes with no open seats
 * - Remove button on hover for individual sections
 *
 * @component
 */
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { useScheduleBuilder } from "@/contexts/ScheduleBuilderContext";
import { formatDisplayTimeRange } from "@/lib/timeUtils";
import type { ClassSection } from "@/types";

const MISSING_COMPONENTS_NOTE_STORAGE_KEY = "missingComponentsNoteCollapsed";

const toKeyPart = (value: unknown, fallback: string) => {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized.length > 0 ? normalized : fallback;
};

const normalizeComponent = (value?: string) => {
  const normalized = value?.trim().toUpperCase() ?? "";
  return normalized.length > 0 ? normalized : null;
};

type GroupedSection = ClassSection & {
  originalIndex: number;
};

type GroupedClass = {
  classKey: string;
  dept: string;
  code: string;
  title: string;
  sections: GroupedSection[];
};

const layoutSpring = {
  type: "spring",
  stiffness: 380,
  damping: 34,
  mass: 0.45,
} as const;

/**
 * CurrentlySelected Component
 *
 * Displays the classes currently added to the draft schedule in a grouped format.
 *
 * @returns {JSX.Element} The currently selected classes panel
 */
export default function CurrentlySelected() {
  const { draftSchedule, removeClassFromDraft, fetchAllSectionsForClass } =
    useScheduleBuilder();
  const { timeFormat } = useAppSettings();
  const typedDraftSchedule = draftSchedule as ClassSection[];

  const [missingComponentsByClass, setMissingComponentsByClass] = useState<
    Record<string, string[]>
  >({});
  const [isMissingNoteCollapsed, setIsMissingNoteCollapsed] = useState(false);

  const listRef = useRef<HTMLElement>(null);
  const [showTopShadow, setShowTopShadow] = useState(false);
  const [showBottomShadow, setShowBottomShadow] = useState(false);

  const checkShadows = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    setShowTopShadow(el.scrollTop > 0);
    setShowBottomShadow(el.scrollTop + el.clientHeight < el.scrollHeight - 1);
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    checkShadows();
    el.addEventListener("scroll", checkShadows, { passive: true });
    const ro = new ResizeObserver(checkShadows);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", checkShadows);
      ro.disconnect();
    };
  }, [checkShadows]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedValue = window.localStorage.getItem(
      MISSING_COMPONENTS_NOTE_STORAGE_KEY,
    );
    setIsMissingNoteCollapsed(storedValue === "true");
  }, []);

  const setMissingNoteCollapsed = (collapsed: boolean) => {
    setIsMissingNoteCollapsed(collapsed);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        MISSING_COMPONENTS_NOTE_STORAGE_KEY,
        collapsed ? "true" : "false",
      );
    }
  };

  const groupedClasses = useMemo<GroupedClass[]>(() => {
    const groupedMap = typedDraftSchedule.reduce<Record<string, GroupedClass>>(
      (acc, section: ClassSection, index: number) => {
        const classKey = `${section.dept}-${section.code}`;
        if (!acc[classKey]) {
          acc[classKey] = {
            classKey,
            dept: section.dept,
            code: section.code,
            title: section.title,
            sections: [],
          };
        }
        acc[classKey].sections.push({
          ...section,
          originalIndex: index,
        });
        return acc;
      },
      {},
    );

    return Object.values(groupedMap);
  }, [typedDraftSchedule]);

  useEffect(() => {
    let isCancelled = false;

    if (groupedClasses.length === 0) {
      setMissingComponentsByClass({});
      return;
    }

    const updateMissingComponents = async () => {
      const nextMissingComponents: Record<string, string[]> = {};

      await Promise.all(
        groupedClasses.map(async (classGroup) => {
          const selectedComponents = new Set(
            classGroup.sections
              .map((section) => normalizeComponent(section.component))
              .filter((component): component is string => component !== null),
          );

          if (selectedComponents.size === 0) {
            return;
          }

          const allSections: ClassSection[] = await fetchAllSectionsForClass(
            classGroup.dept,
            classGroup.code,
          );
          const availableComponents = new Set(
            allSections
              .map((section) => normalizeComponent(section.component))
              .filter((component): component is string => component !== null),
          );

          const missingComponents = Array.from(availableComponents)
            .filter((component) => !selectedComponents.has(component))
            .sort();

          if (missingComponents.length > 0) {
            nextMissingComponents[classGroup.classKey] = missingComponents;
          }
        }),
      );

      if (!isCancelled) {
        setMissingComponentsByClass(nextMissingComponents);
      }
    };

    updateMissingComponents();

    return () => {
      isCancelled = true;
    };
  }, [fetchAllSectionsForClass, groupedClasses]);

  const classesWithMissingComponents = groupedClasses.filter(
    (classGroup) =>
      (missingComponentsByClass[classGroup.classKey] ?? []).length > 0,
  );
  const missingClassCount = classesWithMissingComponents.length;
  const missingComponentCount = classesWithMissingComponents.reduce(
    (total, classGroup) =>
      total + (missingComponentsByClass[classGroup.classKey] ?? []).length,
    0,
  );
  const showMissingComponentsReminder = missingClassCount > 0;
  
  return (
    <TooltipProvider delayDuration={200}>
      <motion.div
        layout
        transition={{ layout: layoutSpring }}
        className="flex h-full w-full flex-col items-center justify-start overflow-hidden rounded-b-[10px] rounded-t-none border-2 border-slate-200 bg-white transition-all duration-150 dark:border-[#303030] dark:bg-[#111111]"
      >
        <motion.div
          layout
          transition={{ layout: layoutSpring }}
          className="flex flex-col justify-start items-center w-full h-full p-2 lg:p-3 xl:p-4 overflow-hidden"
        >
          <motion.div
            layout
            transition={{ layout: layoutSpring }}
            className="flex items-center justify-between pt-1 pb-1.5 shrink-0 w-full"
          >
            <h2 className="text-sm lg:text-base xl:text-lg text-purple-400 font-bold font-figtree">
              Currently Selected
            </h2>
            <AnimatePresence initial={false} mode="popLayout">
              {showMissingComponentsReminder && isMissingNoteCollapsed && (
                <motion.div
                  key="missing-note-restore"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => setMissingNoteCollapsed(false)}
                        aria-label="Show missing components reminder"
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-yellow-500/80 bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 transition-colors cursor-pointer"
                      >
                        <AlertCircle className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="font-inter">
                      <p className="text-xs">
                        Show missing components reminder
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <AnimatePresence initial={false}>
            {showMissingComponentsReminder && !isMissingNoteCollapsed && (
              <motion.div
                key="missing-components-note"
                layout
                initial={{ opacity: 0, height: 0, y: -8 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -8 }}
                transition={{
                  height: { duration: 0.24, ease: "easeOut" },
                  opacity: { duration: 0.18, ease: "easeOut" },
                  y: { duration: 0.18, ease: "easeOut" },
                  layout: layoutSpring,
                }}
                className="w-full overflow-hidden"
              >
                <div className="mb-2 w-full rounded-md border border-yellow-500/50 bg-yellow-900/20 px-2.5 py-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-yellow-500/15 text-yellow-300">
                        <AlertCircle className="h-3 w-3" />
                      </span>
                      <p className="text-[10px] lg:text-xs text-yellow-100 font-inter leading-4">
                        You are missing {missingComponentCount} component
                        {missingComponentCount === 1 ? "" : "s"} across{" "}
                        {missingClassCount} class
                        {missingClassCount === 1 ? "" : "es"}. Add all
                        components to avoid incomplete schedules.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMissingNoteCollapsed(true)}
                      aria-label="Dismiss missing components reminder"
                      className="inline-flex h-5 w-5 items-center justify-center rounded-full text-yellow-200 hover:bg-yellow-500/20 transition-colors cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative flex-1 min-h-0 w-full">
            {showTopShadow && (
              <div className="pointer-events-none absolute top-0 left-0 right-0 h-8 z-10 bg-linear-to-b from-white to-transparent dark:from-[#080808]" />
            )}
            {showBottomShadow && (
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 z-10 bg-linear-to-t from-white to-transparent dark:from-[#080808]" />
            )}
            <motion.section
              ref={listRef}
              layout
              transition={{ layout: layoutSpring }}
              className="font-inter h-full w-full overflow-y-auto scrollbar-hidden pt-1 pb-4"
              aria-label="Currently selected classes"
            >
              {typedDraftSchedule.length === 0 ? (
                <div className="font-figtree text-xs text-slate-500 dark:text-[#888888] lg:text-sm">
                  No classes added
                </div>
              ) : (
                groupedClasses.map((classGroup, groupIndex) => {
                  const missingComponents =
                    missingComponentsByClass[classGroup.classKey] ?? [];
                  const hasMissingComponents = missingComponents.length > 0;

                  return (
                    <motion.div
                      layout
                      transition={{ layout: layoutSpring }}
                      key={`${toKeyPart(classGroup.classKey, "class")}-${groupIndex}`}
                      className="mb-2 rounded-md border-2 border-slate-200 bg-slate-50 p-3 dark:border-[#303030] dark:bg-[#181818]"
                    >
                      <div className="mb-4 flex items-start justify-between gap-2">
                        <div className="font-inter text-xs font-bold text-slate-950 dark:text-white lg:text-sm">
                          {classGroup.dept} {classGroup.code}:{" "}
                          {classGroup.title}
                        </div>
                        {hasMissingComponents && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-yellow-500/70 bg-yellow-500/15 text-yellow-300">
                                <AlertCircle className="h-3.5 w-3.5" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="font-inter">
                              <p className="text-xs">
                                You haven&apos;t added all components for this
                                class.
                              </p>
                              <p className="mt-1 text-[11px] text-yellow-300">
                                Missing: {missingComponents.join(", ")}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        {classGroup.sections.map((section) => (
                          <div
                            key={section.originalIndex}
                            className="group relative rounded-md border border-slate-200 bg-white p-2 dark:border-[#404040] dark:bg-[#101010]"
                          >
                            <div className="flex flex-col gap-1">
                              <div className="flex flex-row items-center justify-start gap-1 text-xs lg:text-sm font-semibold text-purple-400 font-inter">
                                {section.component} ({section.classID})
                                {(section.seats_available ?? 0) <= 0 && (
                                  <span className="flex items-center text-red-400">
                                    <AlertCircle className="inline h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                                    <span className="text-[10px] lg:text-xs">
                                      No open seats
                                    </span>
                                  </span>
                                )}
                              </div>
                              <div className="font-inter text-[10px] text-slate-600 dark:text-[#888888] lg:text-xs">
                                {section.days} |{" "}
                                {formatDisplayTimeRange(
                                  section.starttime,
                                  section.endtime,
                                  timeFormat,
                                )}
                              </div>
                              {section.instructor && (
                                <div className="font-inter text-[10px] text-slate-600 dark:text-[#888888] lg:text-xs">
                                  {section.instructor}
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                removeClassFromDraft(section.originalIndex)
                              }
                              className="absolute top-1 right-1 cursor-pointer rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                              title="Remove section"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </motion.section>
          </div>
        </motion.div>
      </motion.div>
    </TooltipProvider>
  );
}
