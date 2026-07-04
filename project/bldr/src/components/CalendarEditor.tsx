/**
 * CalendarEditor.tsx
 *
 * A visual calendar component that displays class sections in a weekly grid format.
 * This component renders classes as colored blocks positioned according to their
 * scheduled days and times, providing an intuitive view of the user's schedule.
 *
 * Features:
 * - Weekly calendar grid (Monday-Friday, 8AM-8PM)
 * - Dynamic positioning of class blocks based on start time and duration
 * - Color-coded classes based on department/course code hash
 * - Tooltip on hover showing detailed class information (instructor, room, days, ID)
 * - Animated transitions for adding/removing classes
 * - Responsive design for different screen sizes
 *
 * @component
 */
"use client";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Pin, PinOff, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { useScheduleBuilder } from "@/contexts/ScheduleBuilderContext";
import {
  calculateDuration,
  decimalToTimeString,
  formatDisplayTime,
  formatDisplayTimeRange,
  mapDayAbbreviation,
  parseDays,
  timeToDecimal,
} from "@/lib/timeUtils";
import type { BusyBlock, ClassSection } from "@/types";

type CalendarEditorProps = {
  classes?: ClassSection[];
  scheduleName?: string;
  readOnly?: boolean;
  emptyMessage?: string;
};

const toKeyPart = (value: unknown, fallback: string) => {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized.length > 0 ? normalized : fallback;
};

// Calendar grid bounds in decimal hours: rows run 8:00–20:00, and the last
// row represents the 20:00–21:00 slot.
const CAL_START_HOUR = 8;
const CAL_END_HOUR = 21;

// Full day name → allclasses-style abbreviation used by busy blocks
const DAY_ABBREVIATIONS: Record<string, string> = {
  Monday: "M",
  Tuesday: "Tu",
  Wednesday: "W",
  Thursday: "Th",
  Friday: "F",
};

const snapToQuarterHour = (time: number) => Math.round(time * 4) / 4;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

type BusyDragCreateState = {
  mode: "create";
  day: string; // full day name of the column the drag started in
  anchor: number; // decimal hour where the drag started (snapped)
  current: number; // decimal hour under the cursor (snapped)
  // Bounds the drag can extend to before it would overlap a neighboring
  // busy block (or the edge of the grid). Computed once at drag start.
  lowerBound: number;
  upperBound: number;
};

type BusyDragMoveState = {
  mode: "move";
  uuid: string;
  day: string; // full day name; moves never cross day columns
  anchor: number; // decimal hour where the drag started (snapped)
  current: number; // decimal hour under the cursor (snapped)
  originalStart: number;
  originalEnd: number;
  // Bounds the block can move within before it would overlap a neighboring
  // busy block (or the edge of the grid). Computed once at drag start.
  lowerBound: number;
  upperBound: number;
};

type BusyDragResizeState = {
  mode: "resize-start" | "resize-end";
  uuid: string;
  day: string;
  anchor: number; // decimal hour where the resize drag started (snapped)
  current: number; // decimal hour under the cursor (snapped)
  originalStart: number;
  originalEnd: number;
  // Bounds the dragged edge can extend to before it would overlap a
  // neighboring busy block (or the edge of the grid).
  lowerBound: number;
  upperBound: number;
};

type BusyDragState =
  | BusyDragCreateState
  | BusyDragMoveState
  | BusyDragResizeState;

const getMovedTimes = (drag: BusyDragMoveState) => {
  const duration = drag.originalEnd - drag.originalStart;
  const rawDelta = snapToQuarterHour(drag.current - drag.anchor);
  const minDelta = drag.lowerBound - drag.originalStart;
  const maxDelta = drag.upperBound - drag.originalEnd;
  const delta = clamp(rawDelta, minDelta, maxDelta);

  return {
    start: drag.originalStart + delta,
    end: drag.originalStart + delta + duration,
  };
};

const getResizedTimes = (drag: BusyDragResizeState) => {
  const delta = snapToQuarterHour(drag.current - drag.anchor);

  if (drag.mode === "resize-start") {
    return {
      start: clamp(
        drag.originalStart + delta,
        drag.lowerBound,
        drag.originalEnd - 0.25,
      ),
      end: drag.originalEnd,
    };
  }

  return {
    start: drag.originalStart,
    end: clamp(
      drag.originalEnd + delta,
      drag.originalStart + 0.25,
      drag.upperBound,
    ),
  };
};

/**
 * CalendarEditor Component
 *
 * Renders a weekly calendar grid displaying the user's draft schedule.
 * Each class section is displayed as a colored block with its position
 * calculated based on the class's day(s) and time slot.
 *
 * returns {JSX.Element} The calendar grid with positioned class blocks
 */
const CalendarEditor = ({
  classes,
  scheduleName,
  readOnly = false,
  emptyMessage = "Add a class section to see it here!",
}: CalendarEditorProps = {}) => {
  // Access the draft schedule data from the ScheduleBuilder context
  const {
    draftSchedule,
    draftScheduleName,
    removeClassFromDraft,
    togglePinSection,
    draftBusyBlocks,
    addBusyBlockToDraft,
    updateBusyBlockInDraft,
    removeBusyBlockFromDraft,
  } = useScheduleBuilder();
  const { theme, timeFormat } = useAppSettings();

  // In-progress busy block drag (null when not dragging)
  const [busyDrag, setBusyDrag] = useState<BusyDragState | null>(null);
  const busyDragRef = useRef<BusyDragState | null>(null);
  busyDragRef.current = busyDrag;
  const tbodyRef = useRef<HTMLTableSectionElement>(null);

  /**
   * Converts a viewport Y coordinate into a decimal-hour time on the grid,
   * snapped to the nearest 15-minute increment and clamped to the visible
   * calendar range.
   */
  const timeFromClientY = (clientY: number): number | null => {
    const rect = tbodyRef.current?.getBoundingClientRect();
    if (!rect || rect.height === 0) return null;
    const fraction = (clientY - rect.top) / rect.height;
    const time = CAL_START_HOUR + fraction * (CAL_END_HOUR - CAL_START_HOUR);
    return Math.min(
      Math.max(snapToQuarterHour(time), CAL_START_HOUR),
      CAL_END_HOUR,
    );
  };

  /**
   * Finds how far a busy block may extend up and down in a day column
   * before it would touch a neighboring busy block (or the edge of the
   * grid). `referenceStart`/`referenceEnd` describe the range currently
   * occupying free space — a single point (the drag anchor) when creating,
   * or the block's own current range when moving/resizing it — and
   * `excludeUuid` skips the block being moved/resized so it doesn't box
   * itself in.
   */
  const getNeighborBounds = (
    day: string,
    excludeUuid: string | null,
    referenceStart: number,
    referenceEnd: number,
  ) => {
    let lowerBound = CAL_START_HOUR;
    let upperBound = CAL_END_HOUR;

    for (const block of draftBusyBlocks as BusyBlock[]) {
      if (excludeUuid && block.uuid === excludeUuid) continue;
      if (mapDayAbbreviation(block.day) !== day) continue;
      const blockStart = timeToDecimal(block.starttime);
      const blockEnd = timeToDecimal(block.endtime);

      // Block sits above the reference range: it caps how far up we can extend
      if (blockEnd <= referenceStart) {
        lowerBound = Math.max(lowerBound, blockEnd);
      }
      // Block sits below the reference range: it caps how far down we can extend
      else if (blockStart >= referenceEnd) {
        upperBound = Math.min(upperBound, blockStart);
      }
    }

    return { lowerBound, upperBound };
  };

  /**
   * Starts a busy block drag from an empty spot in a day column.
   * Drags that begin on an existing class or busy block are ignored.
   */
  const handleCellMouseDown = (day: string, e: React.MouseEvent) => {
    if (readOnly || e.button !== 0) return;
    if ((e.target as HTMLElement).closest("[data-block]")) return;
    const time = timeFromClientY(e.clientY);
    if (time == null) return;
    e.preventDefault();
    const { lowerBound, upperBound } = getNeighborBounds(day, null, time, time);
    setBusyDrag({
      mode: "create",
      day,
      anchor: time,
      current: time,
      lowerBound,
      upperBound,
    });
  };

  /**
   * Starts moving an existing busy block within its current day column.
   */
  const handleBusyBlockMouseDown = (block: BusyBlock, e: React.MouseEvent) => {
    if (readOnly || e.button !== 0) return;

    const day = mapDayAbbreviation(block.day);
    const anchor = timeFromClientY(e.clientY);
    if (!day || anchor == null) return;

    e.preventDefault();
    e.stopPropagation();
    const originalStart = timeToDecimal(block.starttime);
    const originalEnd = timeToDecimal(block.endtime);
    const { lowerBound, upperBound } = getNeighborBounds(
      day,
      block.uuid,
      originalStart,
      originalEnd,
    );
    setBusyDrag({
      mode: "move",
      uuid: block.uuid,
      day,
      anchor,
      current: anchor,
      originalStart,
      originalEnd,
      lowerBound,
      upperBound,
    });
  };

  /**
   * Starts resizing an existing busy block from its top or bottom edge.
   */
  const handleBusyBlockResizeMouseDown = (
    block: BusyBlock,
    mode: BusyDragResizeState["mode"],
    e: React.MouseEvent,
  ) => {
    if (readOnly || e.button !== 0) return;

    const day = mapDayAbbreviation(block.day);
    const current = timeFromClientY(e.clientY);
    if (!day || current == null) return;

    e.preventDefault();
    e.stopPropagation();
    const originalStart = timeToDecimal(block.starttime);
    const originalEnd = timeToDecimal(block.endtime);
    const { lowerBound, upperBound } = getNeighborBounds(
      day,
      block.uuid,
      originalStart,
      originalEnd,
    );
    setBusyDrag({
      mode,
      uuid: block.uuid,
      day,
      anchor: current,
      current,
      originalStart,
      originalEnd,
      lowerBound,
      upperBound,
    });
  };

  // While a drag is active, track the cursor globally and commit on mouseup
  const isDraggingBusyBlock = busyDrag !== null;
  // biome-ignore lint/correctness/useExhaustiveDependencies: listeners only need to attach/detach per drag session; handlers read live state via refs
  useEffect(() => {
    if (!isDraggingBusyBlock) return;

    const handleMove = (e: MouseEvent) => {
      const time = timeFromClientY(e.clientY);
      if (time == null) return;
      setBusyDrag((prev) => {
        if (!prev) return prev;
        // While creating, stop the drag at the neighboring block's edge so
        // the new block can never overlap an existing one.
        if (prev.mode === "create") {
          return {
            ...prev,
            current: clamp(time, prev.lowerBound, prev.upperBound),
          };
        }
        return { ...prev, current: time };
      });
    };

    const handleUp = () => {
      const drag = busyDragRef.current;
      if (drag) {
        if (drag.mode === "create") {
          const start = Math.min(drag.anchor, drag.current);
          const end = Math.max(drag.anchor, drag.current);
          // Anything shorter than 15 minutes is treated as an accidental click
          if (end - start >= 0.25) {
            addBusyBlockToDraft({
              day: DAY_ABBREVIATIONS[drag.day],
              starttime: decimalToTimeString(start),
              endtime: decimalToTimeString(end),
              label: "Busy",
            });
          }
        } else if (drag.mode === "move") {
          const moved = getMovedTimes(drag);
          if (
            moved.start !== drag.originalStart ||
            moved.end !== drag.originalEnd
          ) {
            updateBusyBlockInDraft(
              drag.uuid,
              decimalToTimeString(moved.start),
              decimalToTimeString(moved.end),
            );
          }
        } else {
          const resized = getResizedTimes(drag);
          if (
            resized.start !== drag.originalStart ||
            resized.end !== drag.originalEnd
          ) {
            updateBusyBlockInDraft(
              drag.uuid,
              decimalToTimeString(resized.start),
              decimalToTimeString(resized.end),
            );
          }
        }
      }
      setBusyDrag(null);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setBusyDrag(null);
      }
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDraggingBusyBlock]);

  const getVisibleBusyBlock = (block: BusyBlock): BusyBlock => {
    if (
      !busyDrag ||
      busyDrag.mode === "create" ||
      busyDrag.uuid !== block.uuid
    ) {
      return block;
    }

    const times =
      busyDrag.mode === "move"
        ? getMovedTimes(busyDrag)
        : getResizedTimes(busyDrag);

    return {
      ...block,
      starttime: decimalToTimeString(times.start),
      endtime: decimalToTimeString(times.end),
    };
  };

  const calendarClasses = classes ?? draftSchedule;
  const calendarName = scheduleName ?? draftScheduleName;
  // Busy blocks come from the viewer's own draft, so they are never shown
  // in read-only mode (e.g. the public share page).
  const busyBlocks: BusyBlock[] = readOnly ? [] : (draftBusyBlocks ?? []);
  const shouldShowCalendar = readOnly
    ? Boolean(calendarName)
    : Boolean(
        calendarName && (calendarClasses.length > 0 || busyBlocks.length > 0),
      );

  // Days of the week to display as column headers
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  // Hour slots from 8 AM to 8 PM (13 hours total)
  const hours = Array.from({ length: 13 }, (_, i) => 8 + i);
  const formatDecimalDisplayTime = (time: number) =>
    formatDisplayTime(decimalToTimeString(time), timeFormat);
  const busyBlockBackgroundImage =
    theme === "dark"
      ? "repeating-linear-gradient(45deg, #454545 0, #454545 6px, #383838 6px, #383838 12px)"
      : "repeating-linear-gradient(45deg, rgba(203,213,225,0.9) 0, rgba(203,213,225,0.9) 6px, rgba(226,232,240,0.9) 6px, rgba(226,232,240,0.9) 12px)";
  const busyBlockPreviewBackgroundImage =
    theme === "dark"
      ? "repeating-linear-gradient(45deg, rgba(69,69,69,0.7) 0, rgba(69,69,69,0.7) 6px, rgba(56,56,56,0.7) 6px, rgba(56,56,56,0.7) 12px)"
      : "repeating-linear-gradient(45deg, rgba(203,213,225,0.75) 0, rgba(203,213,225,0.75) 6px, rgba(226,232,240,0.75) 6px, rgba(226,232,240,0.75) 12px)";

  /**
   * Handles removing a class section from the draft schedule
   * @param cls - The class section to remove
   */
  const handleRemoveSection = (cls: ClassSection) => {
    if (readOnly) return;

    const index = draftSchedule.findIndex(
      (item: ClassSection) => item.uuid === cls.uuid,
    );
    if (index !== -1) {
      removeClassFromDraft(index);
    }
  };

  /**
   * Handles toggling the pinned state of a class section
   * @param cls - The class section to toggle pin
   */
  const handleTogglePin = (cls: ClassSection) => {
    if (readOnly) return;

    togglePinSection(cls.uuid);
  };

  return (
    <div
      className="relative grid grid-rows-1 rounded-[10px] border-2 border-slate-300 bg-slate-50 px-2 py-2 text-slate-950 shadow-sm dark:border-[#404040] dark:bg-[#2c2c2c] dark:text-white w-full aspect-square md:aspect-auto md:h-full md:min-h-[500px]"
      onMouseLeave={isDraggingBusyBlock ? () => setBusyDrag(null) : undefined}
    >
      <div className="w-full h-full overflow-hidden">
        <AnimatePresence mode="wait">
          {shouldShowCalendar ? (
            <motion.div
              key="calendar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full"
            >
              <table className="table-fixed h-full w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-center font-semibold font-figtree h-6 lg:h-8 w-8 lg:w-10 md:w-[50px] text-[10px] lg:text-xs">
                      Time
                    </th>
                    {days.map((day) => (
                      <th
                        key={day}
                        className="text-center font-semibold font-figtree p-0.5 lg:p-1 text-[10px] lg:text-xs"
                      >
                        <span className="hidden lg:inline">{day}</span>
                        <span className="hidden md:inline lg:hidden">
                          {day.substring(0, 3)}
                        </span>
                        <span className="md:hidden">{day.substring(0, 2)}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody ref={tbodyRef}>
                  {hours.map((hour) => (
                    <tr
                      key={hour}
                      className="relative h-[calc((100%-2rem)/13)] min-h-5 border-t border-slate-200 dark:border-[#404040]"
                    >
                      <td className="align-top pr-0.5 lg:pr-1 text-[8px] lg:text-[10px] text-right font-figtree whitespace-nowrap text-slate-500 dark:text-white">
                        {formatDecimalDisplayTime(hour)}
                      </td>
                      {days.map((day) => (
                        <td
                          key={day}
                          className="relative align-top w-[18%]"
                          onMouseDown={
                            readOnly
                              ? undefined
                              : (e) => handleCellMouseDown(day, e)
                          }
                        >
                          <div className="absolute top-[50%] translate-y-[-50%] w-full border-t border-dashed border-slate-200 dark:border-[#424242] z-0" />

                          {calendarClasses
                            .filter((cls: ClassSection) => {
                              const classDays = parseDays(cls.days || "");
                              const startTime = timeToDecimal(
                                cls.starttime || "",
                              );
                              return (
                                classDays.includes(day) &&
                                startTime >= hour &&
                                startTime < hour + 1
                              );
                            })
                            .map((cls: ClassSection, clsIndex: number) => {
                              // Use CSS calc to make row height responsive
                              const startTime = timeToDecimal(
                                cls.starttime || "",
                              );
                              const duration = calculateDuration(
                                cls.starttime || "",
                                cls.endtime || "",
                              );
                              // Calculate offset and height as percentages of row
                              const offsetPercent = (startTime - hour) * 100;
                              const heightPercent = duration * 100;

                              const colors = [
                                "#f5d2d2", // soft pink
                                "#efd8c1", // peach
                                "#efefc1", // pastel yellow
                                "#d8efc1", // yellow-green
                                "#c1efc1", // mint
                                "#c1efd8", // aqua
                                "#c1efef", // light cyan
                                "#c1d8ef", // baby blue
                                "#c1c1ef", // periwinkle
                                "#d8c1ef", // lavender
                                "#efc1ef", // light magenta
                                "#efc1d8", // rose
                              ];

                              const classcode = (
                                `${cls.dept} ${cls.code}` || ""
                              ).toUpperCase();
                              let hash = 0;
                              let i = 0;
                              while (i < classcode.length) {
                                hash = hash * 31 + classcode.charCodeAt(i);
                                i++;
                              }
                              const colorIndex = Math.abs(hash) % colors.length;
                              const noOpenSeats =
                                (cls.seats_available ?? 0) <= 0;
                              const displayLocation =
                                cls.room || cls.location || "TBA";

                              return (
                                <ContextMenu
                                  key={
                                    cls.uuid?.trim() ||
                                    `${toKeyPart(cls.dept, "dept")}-${toKeyPart(cls.code, "code")}-${toKeyPart(cls.classID, "class")}-${toKeyPart(cls.component, "comp")}-${toKeyPart(cls.days, "days")}-${toKeyPart(cls.starttime, "start")}-${clsIndex}`
                                  }
                                >
                                  <ContextMenuTrigger>
                                    <TooltipProvider>
                                      <Tooltip delayDuration={200}>
                                        <TooltipTrigger asChild>
                                          <motion.div
                                            data-block
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className={`absolute flex flex-col items-start justify-center left-0.5 right-0.5 p-0.5 lg:p-1 rounded-md text-[#333333] shadow-md z-10 overflow-hidden cursor-pointer select-none ${
                                              cls.pinned
                                                ? "ring-2 ring-amber-500"
                                                : ""
                                            }`}
                                            style={{
                                              top: `${offsetPercent}%`,
                                              height: `${heightPercent}%`,
                                              minHeight: "16px",
                                              backgroundColor:
                                                colors[colorIndex],
                                            }}
                                            onDoubleClick={
                                              readOnly
                                                ? undefined
                                                : () => handleTogglePin(cls)
                                            }
                                          >
                                            <div className="flex items-center justify-between font-bold text-[9px] lg:text-[10px] xl:text-xs font-dmsans truncate w-full">
                                              <span className="flex items-center gap-0.5 truncate">
                                                {!readOnly && cls.pinned && (
                                                  <Pin className="h-2.5 w-2.5 lg:h-3 lg:w-3 text-amber-600 shrink-0" />
                                                )}
                                                <span className="truncate">
                                                  {cls.dept} {cls.code} (
                                                  {cls.component})
                                                </span>
                                              </span>
                                              {noOpenSeats && (
                                                <AlertTriangle className="inline-block h-3 lg:h-4 text-red-600 shrink-0" />
                                              )}
                                            </div>
                                          </motion.div>
                                        </TooltipTrigger>
                                        <TooltipContent
                                          className="font-figtree select-text p-0"
                                          side="top"
                                          style={{
                                            borderTopWidth: "3px",
                                            borderTopColor: colors[colorIndex],
                                          }}
                                        >
                                          <div className="w-80 max-w-[calc(100vw-2rem)]">
                                            <div className="border-b border-slate-200 px-3 py-2 dark:border-white/10">
                                              <p className="text-sm font-bold text-slate-950 dark:text-slate-50">
                                                {cls.dept} {cls.code} (
                                                {cls.component})
                                              </p>
                                              <p className="truncate text-xs text-slate-600 dark:text-slate-400">
                                                {cls.title}
                                              </p>
                                            </div>

                                            <div className="space-y-2.5 px-3 pt-2.5 pb-4 text-xs">
                                              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                                                <p className="min-w-0 leading-5">
                                                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                    Section:
                                                  </span>{" "}
                                                  <span className="text-slate-950 dark:text-slate-100">
                                                    #{cls.classID}
                                                  </span>
                                                </p>
                                                <p className="min-w-0 leading-5">
                                                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                    Room:
                                                  </span>{" "}
                                                  <span className="text-slate-950 dark:text-slate-100">
                                                    {displayLocation}
                                                  </span>
                                                </p>
                                                <p className="col-span-2 min-w-0 leading-5">
                                                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                    Meeting:
                                                  </span>{" "}
                                                  <span className="text-slate-950 dark:text-slate-100">
                                                    {cls.days || "TBA"} •{" "}
                                                    {formatDisplayTimeRange(
                                                      cls.starttime,
                                                      cls.endtime,
                                                      timeFormat,
                                                    )}
                                                  </span>
                                                </p>
                                                <p className="col-span-2 min-w-0 leading-5">
                                                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                    Instructor:
                                                  </span>{" "}
                                                  <span className="text-slate-950 dark:text-slate-100">
                                                    {cls.instructor || "Staff"}
                                                  </span>
                                                </p>
                                              </div>

                                              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-slate-200 pt-2.5 text-[11px] leading-5 dark:border-white/10">
                                                {!readOnly && cls.pinned && (
                                                  <p className="min-w-0">
                                                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                      Status:
                                                    </span>{" "}
                                                    <span className="font-semibold text-amber-400">
                                                      Pinned
                                                    </span>
                                                  </p>
                                                )}
                                                {noOpenSeats && (
                                                  <p className="min-w-0">
                                                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                      Seats:
                                                    </span>{" "}
                                                    <span className="font-semibold text-red-400">
                                                      Closed
                                                    </span>
                                                  </p>
                                                )}
                                                {!readOnly && (
                                                  <p className="col-span-2 min-w-0 text-slate-600 dark:text-slate-400">
                                                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                      Actions:
                                                    </span>{" "}
                                                    Double-click to{" "}
                                                    {cls.pinned
                                                      ? "unpin"
                                                      : "pin"}
                                                    {
                                                      "; right-click for options"
                                                    }
                                                  </p>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </ContextMenuTrigger>
                                  {!readOnly && (
                                    <ContextMenuContent className="border-slate-200 bg-white dark:border-[#404040] dark:bg-[#2a2a2a]">
                                      <ContextMenuItem
                                        className="cursor-pointer font-dmsans text-amber-600 focus:bg-slate-100 focus:text-amber-600 dark:text-amber-400 dark:focus:bg-[#404040] dark:focus:text-amber-400"
                                        onClick={() => handleTogglePin(cls)}
                                      >
                                        {cls.pinned ? (
                                          <PinOff className="mr-1 h-4 text-amber-400" />
                                        ) : (
                                          <Pin className="mr-1 h-4 text-amber-400" />
                                        )}
                                        {cls.pinned
                                          ? "Unpin Section"
                                          : "Pin Section"}
                                      </ContextMenuItem>
                                      <ContextMenuItem
                                        className="cursor-pointer font-dmsans text-destructive focus:bg-slate-100 focus:text-destructive dark:focus:bg-[#404040]"
                                        onClick={() => handleRemoveSection(cls)}
                                      >
                                        <Trash2 className="mr-1 h-4 text-destructive" />
                                        Remove Section
                                      </ContextMenuItem>
                                    </ContextMenuContent>
                                  )}
                                </ContextMenu>
                              );
                            })}

                          {busyBlocks
                            .map(getVisibleBusyBlock)
                            .filter((block: BusyBlock) => {
                              const blockStart = timeToDecimal(block.starttime);
                              return (
                                mapDayAbbreviation(block.day) === day &&
                                blockStart >= hour &&
                                blockStart < hour + 1
                              );
                            })
                            .map((block: BusyBlock) => {
                              const blockStart = timeToDecimal(block.starttime);
                              const blockDuration = calculateDuration(
                                block.starttime,
                                block.endtime,
                              );
                              const offsetPercent = (blockStart - hour) * 100;
                              const heightPercent = blockDuration * 100;

                              return (
                                <ContextMenu key={block.uuid}>
                                  <ContextMenuTrigger asChild>
                                    <motion.div
                                      data-block
                                      initial={{ opacity: 0, scale: 0.8 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      className="absolute flex flex-col items-start justify-center left-0.5 right-0.5 p-0.5 lg:p-1 rounded-md border border-slate-500 text-slate-900 shadow-md z-10 overflow-hidden cursor-grab active:cursor-grabbing select-none dark:border-[#5a5a5a] dark:text-[#d4d4d4]"
                                      onMouseDown={(e) =>
                                        handleBusyBlockMouseDown(block, e)
                                      }
                                      style={{
                                        top: `${offsetPercent}%`,
                                        height: `${heightPercent}%`,
                                        minHeight: "16px",
                                        backgroundImage:
                                          busyBlockBackgroundImage,
                                      }}
                                      title={`${block.label} • ${formatDisplayTimeRange(block.starttime, block.endtime, timeFormat)}`}
                                    >
                                      <button
                                        aria-label="Resize busy block start"
                                        className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize z-20 appearance-none border-0 bg-transparent p-0"
                                        tabIndex={-1}
                                        type="button"
                                        onMouseDown={(e) =>
                                          handleBusyBlockResizeMouseDown(
                                            block,
                                            "resize-start",
                                            e,
                                          )
                                        }
                                      />
                                      <button
                                        aria-label="Resize busy block end"
                                        className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize z-20 appearance-none border-0 bg-transparent p-0"
                                        tabIndex={-1}
                                        type="button"
                                        onMouseDown={(e) =>
                                          handleBusyBlockResizeMouseDown(
                                            block,
                                            "resize-end",
                                            e,
                                          )
                                        }
                                      />
                                      <span className="font-bold text-[8px] lg:text-[9px] xl:text-[10px] font-dmsans truncate w-full leading-tight">
                                        {block.label}:{" "}
                                        {formatDisplayTimeRange(
                                          block.starttime,
                                          block.endtime,
                                          timeFormat,
                                        )}
                                      </span>
                                    </motion.div>
                                  </ContextMenuTrigger>
                                  <ContextMenuContent className="border-slate-200 bg-white dark:border-[#404040] dark:bg-[#2a2a2a]">
                                    <ContextMenuItem
                                      className="cursor-pointer font-dmsans text-destructive focus:bg-slate-100 focus:text-destructive dark:focus:bg-[#404040]"
                                      onSelect={() =>
                                        removeBusyBlockFromDraft(block.uuid)
                                      }
                                    >
                                      <Trash2 className="mr-1 h-4 text-destructive" />
                                      Delete Busy Block
                                    </ContextMenuItem>
                                  </ContextMenuContent>
                                </ContextMenu>
                              );
                            })}

                          {busyDrag?.mode === "create" &&
                            busyDrag.day === day &&
                            (() => {
                              const previewStart = Math.min(
                                busyDrag.anchor,
                                busyDrag.current,
                              );
                              const previewEnd = Math.max(
                                busyDrag.anchor,
                                busyDrag.current,
                              );
                              if (
                                previewEnd - previewStart < 0.25 ||
                                previewStart < hour ||
                                previewStart >= hour + 1
                              ) {
                                return null;
                              }
                              return (
                                <div
                                  className="absolute left-0.5 right-0.5 rounded-md border border-dashed border-slate-500 z-20 pointer-events-none flex flex-col items-start justify-center p-0.5 lg:p-1 text-slate-900 dark:border-[#8a8a8a] dark:text-[#d4d4d4]"
                                  style={{
                                    top: `${(previewStart - hour) * 100}%`,
                                    height: `${(previewEnd - previewStart) * 100}%`,
                                    minHeight: "16px",
                                    backgroundImage:
                                      busyBlockPreviewBackgroundImage,
                                  }}
                                >
                                  <span className="font-bold text-[9px] lg:text-[10px] font-dmsans truncate w-full">
                                    Busy
                                  </span>
                                  <span className="text-[8px] lg:text-[9px] font-dmsans truncate w-full">
                                    {formatDecimalDisplayTime(previewStart)} –{" "}
                                    {formatDecimalDisplayTime(previewEnd)}
                                  </span>
                                </div>
                              );
                            })()}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          ) : (
            <div className="font-inter flex h-full w-full justify-center items-center m-2 text-center text-xs md:text-sm">
              {emptyMessage}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CalendarEditor;
