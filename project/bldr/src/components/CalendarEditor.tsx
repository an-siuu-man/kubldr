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
import { useScheduleBuilder } from "@/contexts/ScheduleBuilderContext";
import { calculateDuration, parseDays, timeToDecimal } from "@/lib/timeUtils";
import type { ClassSection } from "@/types";

const toKeyPart = (value: unknown, fallback: string) => {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized.length > 0 ? normalized : fallback;
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
const CalendarEditor = () => {
  // Access the draft schedule data from the ScheduleBuilder context
  const {
    draftSchedule,
    draftScheduleName,
    removeClassFromDraft,
    togglePinSection,
  } = useScheduleBuilder();

  // Days of the week to display as column headers
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  // Hour slots from 8 AM to 8 PM (13 hours total)
  const hours = Array.from({ length: 13 }, (_, i) => 8 + i);

  /**
   * Handles removing a class section from the draft schedule
   * @param cls - The class section to remove
   */
  const handleRemoveSection = (cls: ClassSection) => {
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
    togglePinSection(cls.uuid);
  };

  return (
    <div className="relative grid grid-rows-1 bg-[#2c2c2c] border-2 border-[#404040] rounded-[10px] text-white px-2 py-2 w-full aspect-square md:aspect-auto md:h-full md:min-h-[500px]">
      <div className="w-full h-full overflow-hidden">
        <AnimatePresence mode="wait">
          {draftScheduleName && draftSchedule.length > 0 ? (
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
                <tbody>
                  {hours.map((hour) => (
                    <tr
                      key={hour}
                      className="relative h-[calc((100%-2rem)/13)] min-h-5 border-t border-[#404040]"
                    >
                      <td className="align-top pr-0.5 lg:pr-1 text-[8px] lg:text-[10px] text-right font-figtree whitespace-nowrap">
                        {hour}:00
                      </td>
                      {days.map((day) => (
                        <td key={day} className="relative align-top w-[18%]">
                          <div className="absolute top-[50%] translate-y-[-50%] w-full border-t border-dashed border-[#424242] z-0" />

                          {draftSchedule
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
                                            onDoubleClick={() =>
                                              handleTogglePin(cls)
                                            }
                                          >
                                            <div className="flex items-center justify-between font-bold text-[9px] lg:text-[10px] xl:text-xs font-dmsans truncate w-full">
                                              <span className="flex items-center gap-0.5 truncate">
                                                {cls.pinned && (
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
                                            borderTopWidth: "2px",
                                            borderColor: colors[colorIndex],
                                          }}
                                        >
                                          <div className="w-80 max-w-[calc(100vw-2rem)]">
                                            <div className="border-b border-white/10 px-3 py-2">
                                              <p className="text-sm font-bold text-slate-50">
                                                {cls.dept} {cls.code} (
                                                {cls.component})
                                              </p>
                                              <p className="truncate text-xs text-slate-400">
                                                {cls.title}
                                              </p>
                                            </div>

                                            <div className="space-y-2.5 px-3 pt-2.5 pb-4 text-xs">
                                              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                                                <p className="min-w-0 leading-5">
                                                  <span className="font-semibold text-slate-300">
                                                    Section:
                                                  </span>{" "}
                                                  <span className="text-slate-100">
                                                    #{cls.classID}
                                                  </span>
                                                </p>
                                                <p className="min-w-0 leading-5">
                                                  <span className="font-semibold text-slate-300">
                                                    Room:
                                                  </span>{" "}
                                                  <span className="text-slate-100">
                                                    {displayLocation}
                                                  </span>
                                                </p>
                                                <p className="col-span-2 min-w-0 leading-5">
                                                  <span className="font-semibold text-slate-300">
                                                    Meeting:
                                                  </span>{" "}
                                                  <span className="text-slate-100">
                                                    {cls.days || "TBA"} •{" "}
                                                    {cls.starttime || "TBA"} -{" "}
                                                    {cls.endtime || "TBA"}
                                                  </span>
                                                </p>
                                                <p className="col-span-2 min-w-0 leading-5">
                                                  <span className="font-semibold text-slate-300">
                                                    Instructor:
                                                  </span>{" "}
                                                  <span className="text-slate-100">
                                                    {cls.instructor || "Staff"}
                                                  </span>
                                                </p>
                                              </div>

                                              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-white/10 pt-2.5 text-[11px] leading-5">
                                                {cls.pinned && (
                                                  <p className="min-w-0">
                                                    <span className="font-semibold text-slate-300">
                                                      Status:
                                                    </span>{" "}
                                                    <span className="font-semibold text-amber-400">
                                                      Pinned
                                                    </span>
                                                  </p>
                                                )}
                                                {noOpenSeats && (
                                                  <p className="min-w-0">
                                                    <span className="font-semibold text-slate-300">
                                                      Seats:
                                                    </span>{" "}
                                                    <span className="font-semibold text-red-400">
                                                      Closed
                                                    </span>
                                                  </p>
                                                )}
                                                <p className="col-span-2 min-w-0 text-slate-400">
                                                  <span className="font-semibold text-slate-300">
                                                    Actions:
                                                  </span>{" "}
                                                  Double-click to{" "}
                                                  {cls.pinned ? "unpin" : "pin"}
                                                  {"; right-click for options"}
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </ContextMenuTrigger>
                                  <ContextMenuContent className=" bg-[#2a2a2a] border-[#404040]">
                                    <ContextMenuItem
                                      className="text-amber-400 font-dmsans focus:bg-[#404040] focus:text-amber-400 cursor-pointer"
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
                                      className="text-destructive font-dmsans focus:bg-[#404040] focus:text-destructive cursor-pointer"
                                      onClick={() => handleRemoveSection(cls)}
                                    >
                                      <Trash2 className="mr-1 h-4 text-destructive" />
                                      Remove Section
                                    </ContextMenuItem>
                                  </ContextMenuContent>
                                </ContextMenu>
                              );
                            })}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          ) : (
            <div className="font-inter flex h-full w-full justify-center items-center m-2 text-center text-xs md:text-sm">
              Add a class section to see it here!
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CalendarEditor;
