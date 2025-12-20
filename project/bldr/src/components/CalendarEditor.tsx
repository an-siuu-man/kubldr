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
import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useScheduleBuilder } from "@/contexts/ScheduleBuilderContext";
import { ClassSection } from "@/types";
import { timeToDecimal, calculateDuration, parseDays } from "@/lib/timeUtils";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Trash2, AlertTriangle } from "lucide-react";

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
  const { draftSchedule, draftScheduleName, removeClassFromDraft } =
    useScheduleBuilder();

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
      (item: ClassSection) => item.uuid === cls.uuid
    );
    if (index !== -1) {
      removeClassFromDraft(index);
    }
  };

  return (
    <div className="relative flex justify-center items-center mt-5 bg-[#2c2c2c] border-2 border-[#404040] rounded-[10px] text-white px-2 w-full max-w-[90%] lg:max-w-[85%] xl:max-w-[1100px] mx-auto h-[500px] lg:h-[550px] xl:h-[600px]">
      <div className="w-full h-full overflow-hidden">
        <AnimatePresence>
          {draftScheduleName && draftSchedule.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full"
            >
              <table className="table-fixed h-full w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-center font-semibold font-figtree h-10 w-10 md:w-[50px] text-xs md:text-sm">
                      Time
                    </th>
                    {days.map((day) => (
                      <th
                        key={day}
                        className="text-center font-semibold font-figtree p-1 md:p-2 text-xs md:text-sm"
                      >
                        <span className="hidden md:inline">{day}</span>
                        <span className="md:hidden">{day.substring(0, 2)}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hours.map((hour) => (
                    <tr
                      key={hour}
                      className="relative h-7 border-t border-[#404040]"
                    >
                      <td className="align-top pr-1 md:pr-2 text-[9px] md:text-xs text-right font-figtree">
                        {hour}:00
                      </td>
                      {days.map((day) => (
                        <td
                          key={day}
                          className="relative align-top w-20 md:w-[150px]"
                        >
                          <div className="absolute top-[50%] translate-y-[-50%] w-full border-t border-dashed border-[#424242] z-0" />

                          {draftSchedule
                            .filter((cls: ClassSection) => {
                              const classDays = parseDays(cls.days || "");
                              const startTime = timeToDecimal(
                                cls.starttime || ""
                              );
                              return (
                                classDays.includes(day) &&
                                startTime >= hour &&
                                startTime < hour + 1
                              );
                            })
                            .map((cls: ClassSection, idx: number) => {
                              const baseRowHeight = 38;
                              const startTime = timeToDecimal(
                                cls.starttime || ""
                              );
                              const duration = calculateDuration(
                                cls.starttime || "",
                                cls.endtime || ""
                              );
                              const offset = (startTime - hour) * baseRowHeight;
                              const height = duration * baseRowHeight;

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

                              return (
                                <ContextMenu key={idx}>
                                  <ContextMenuTrigger>
                                    <TooltipProvider>
                                      <Tooltip delayDuration={200}>
                                        <TooltipTrigger asChild>
                                          <motion.div
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className={`absolute flex flex-col items-start justify-center left-0.5 right-0.5 p-1 rounded-md text-[#333333] shadow-md z-10 overflow-hidden`}
                                            style={{
                                              top: `${offset}px`,
                                              height: `${height}px`,
                                              backgroundColor:
                                                colors[colorIndex],
                                            }}
                                          >
                                            <div className="flex items-center justify-between font-bold text-xs font-dmsans truncate w-full">
                                              <>
                                                {cls.dept} {cls.code} (
                                                {cls.component})
                                              </>
                                              {(cls.seats_available ?? 0) <=
                                                0 && (
                                                <AlertTriangle className="inline-block mr-1 h-5 text-red-600" />
                                              )}
                                            </div>
                                          </motion.div>
                                        </TooltipTrigger>
                                        <TooltipContent
                                          className="font-figtree"
                                          side="top"
                                          style={{
                                            borderTopWidth: "2px",
                                            borderColor: colors[colorIndex],
                                          }}
                                        >
                                          <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                              {/* <p className="text-sm font-bold text-slate-100 truncate">
                                                {cls.dept} {cls.code} <span className="font-normal text-slate-300">({cls.component})</span>
                                              </p> */}
                                            </div>

                                            <p className="text-xs text-slate-300">
                                              <span className="font-semibold text-slate-200">
                                                Instructor:{" "}
                                              </span>
                                              <span className="text-slate-100">
                                                {cls.instructor || "Staff"}
                                              </span>
                                            </p>

                                            <p className="text-xs text-slate-300">
                                              <span className="font-semibold text-slate-200">
                                                Room:{" "}
                                              </span>
                                              <span className="text-slate-100">
                                                {cls.room || "TBA"}
                                              </span>
                                            </p>

                                            <div className="flex items-center text-xs text-slate-300">
                                              <p className="mr-4">
                                                <span className="font-semibold text-slate-200">
                                                  ID{" "}
                                                </span>
                                                <span className="text-slate-100">
                                                  #{cls.classID}
                                                </span>
                                              </p>
                                              <p>
                                                <span className="font-semibold text-slate-200">
                                                  Days{" "}
                                                </span>
                                                <span className="text-slate-100">
                                                  {cls.days}
                                                </span>
                                              </p>
                                            </div>
                                            {
                                              (cls.seats_available ?? 0) <= 0 &&
                                              <p>
                                              <span className="font-semibold text-red-400">
                                                Warning: No open seats!
                                              </span>
                                            </p>}
                                            <p className="text-slate-400">
                                              Right click for more options
                                            </p>
                                          </div>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </ContextMenuTrigger>
                                  <ContextMenuContent className=" bg-[#2a2a2a] border-[#404040]">
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
