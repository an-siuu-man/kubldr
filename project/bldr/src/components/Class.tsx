/**
 * Class.tsx
 *
 * A component that displays detailed information about a specific class/course,
 * including all available sections. Users can click on a section to add it
 * to their draft schedule.
 *
 * Features:
 * - Fetches and displays class information from the API on mount
 * - Shows course title, description, and department/code
 * - Lists all available sections with:
 *   - Class ID and component type (LEC, LAB, etc.)
 *   - Days and time information
 *   - Instructor name
 *   - Seat availability with color-coded indicators
 * - Disables sections with no available seats
 * - Animated loading state while fetching data
 *
 * @component
 * @param {ClassProps} props - Contains uuid, classcode, and dept for the class
 */
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import Loader from "@/components/Loader";
import { useScheduleBuilder } from "@/contexts/ScheduleBuilderContext";
import type {
  ClassData,
  ClassInfoResponse,
  ClassProps,
  ClassSection,
} from "@/types";

const toKeyPart = (value: unknown, fallback: string) => {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized.length > 0 ? normalized : fallback;
};

const COMPONENT_COLORS: Record<string, string> = {
  LEC: "text-blue-400",
  LAB: "text-green-400",
  LBN: "text-emerald-400",
  DIS: "text-violet-400",
  REC: "text-orange-400",
  SEM: "text-yellow-400",
  STU: "text-pink-400",
  CLI: "text-cyan-400",
  IND: "text-rose-400",
};

const componentBadgeClass = (component?: string) => {
  const key = component?.trim().toUpperCase() ?? "";
  return COMPONENT_COLORS[key] ?? "text-[#a8a8a8]";
};

/**
 * Class Component
 *
 * Displays a class card with all its sections. Fetches class details
 * from the API and allows users to add sections to their schedule.
 *
 * @param {ClassProps} props - The class properties (uuid, classcode, dept)
 * @returns {JSX.Element} The class card with sections list
 */
export default function Class(props: ClassProps) {
  // Access the schedule builder context to add classes
  const { addClassToDraft } = useScheduleBuilder();

  // Local state for tracking selected classes (for UI feedback)
  const [_selectedClasses, _setSelectedClasses] = useState<any>({});

  // State to hold the fetched class information from the API
  const [classInfo, setClassInfo] = useState<ClassInfoResponse>({ data: [] });

  /**
   * Handles when a user clicks on a class section to add it to their schedule.
   * Combines section data with parent class data and adds to the draft schedule.
   *
   * @param {ClassSection} section - The selected section's data
   * @param {ClassData} classData - The parent class data (dept, code, title)
   */
  const handleSectionClick = async (
    section: ClassSection,
    classData: ClassData,
  ) => {
    // Merge section data with class-level data for the calendar display
    const classToAdd: ClassSection = {
      ...section,
      dept: classData.dept,
      code: classData.code,
      title: classData.title,
    };

    // Add the class to the draft schedule via context
    await addClassToDraft(classToAdd);

    // Notify parent component if a callback was provided
    if (props.onSectionClick) {
      props.onSectionClick(section, classData);
    }
  };

  /**
   * Fetches detailed class information from the API.
   * Retrieves all sections for the specified department and course code.
   *
   * @param {string} dept - Department code (e.g., "EECS")
   * @param {string} code - Course code (e.g., "581")
   */
  const callAPI = async (dept: string, code: string) => {
    const r = await fetch(`/api/getClassInfo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject: `${dept} ${code}`, term: "4262" }),
    });
    const d = await r.json();
    setClassInfo(d);
  };

  // Fetch class info when component mounts
  useEffect(() => {
    callAPI(props.dept, props.classcode);
  }, [callAPI, props.classcode, props.dept]);

  // Debug logging for class info updates
  useEffect(() => {
    if (classInfo) {
      console.log(classInfo);
    }
  }, [classInfo]);

  return (
    <AnimatePresence initial={false} mode="wait">
      {classInfo && classInfo.data.length > 0 ? (
        <motion.div
          key="class-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 0.18,
            ease: "easeOut",
          }}
          className="flex flex-col p-1.5 lg:p-2 mb-3 lg:mb-4 rounded-md text-[#fafafa] border-2 max-w-full border-[#404040] shadow-md justify-start items-center"
        >
          <h1 className="font-dmsans text-xs lg:text-sm font-bold self-start leading-tight">
            {classInfo.data[0].dept} {classInfo.data[0].code}:{" "}
            {classInfo.data[0].title}
          </h1>
          <p className="text-[10px] lg:text-xs text-[#b0b0b0] font-inter self-start line-clamp-2">
            {classInfo.data[0].description || "No description available."}
          </p>
          <div className="flex flex-col gap-2 mt-2 w-full">
            {classInfo.data[0].sections.map((section: ClassSection, index) => (
              <button
                // disabled={(section.seats_available ?? 0) <= 0}
                key={
                  section.uuid?.trim() ||
                  `${toKeyPart(section.classID, "class")}-${toKeyPart(section.component, "comp")}-${toKeyPart(section.days, "days")}-${toKeyPart(section.starttime, "start")}-${toKeyPart(section.endtime, "end")}-${index}`
                }
                onClick={() => handleSectionClick(section, classInfo.data[0])}
                className={`w-full font-inter rounded-md bg-[#181818] hover:bg-[#232323] transition duration-100 p-2 border border-[#404040] text-left cursor-pointer`}
              >
                <div className="flex flex-row w-full justify-between gap-1 sm:gap-2 items-start">
                  <div className="flex flex-row gap-2 items-start">
                    <div className="flex flex-col">
                      <span className="font-semibold text-xs lg:text-sm">
                        #{section.classID}
                      </span>
                      <span
                        className={`text-[10px] lg:text-xs self-center ${componentBadgeClass(section.component)}`}
                      >
                        {section.component}
                      </span>
                    </div>
                    <div className="flex flex-col justify-start items-start font-inter">
                      <span className="text-xs lg:text-sm text-[#fafafa] break-words">
                        {section.days}{" "}
                        {section.starttime && section.endtime
                          ? `${section.starttime} - ${section.endtime}`
                          : section.starttime || section.endtime || ""}
                      </span>
                      {section.instructor ? (
                        <span className="text-[10px] lg:text-xs text-[#a8a8a8] truncate max-w-[90px] sm:max-w-[120px] lg:max-w-[150px]">
                          {section.instructor}
                        </span>
                      ) : (
                        <span className="text-[10px] lg:text-xs text-[#a8a8a8]">
                          Instructor TBA
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`text-xs lg:text-sm font-semibold justify-self-end ${
                      (section.seats_available ?? 0) <= 0
                        ? "text-gray-500"
                        : (section.seats_available ?? 0) <= 3
                          ? "text-red-400"
                          : (section.seats_available ?? 0) < 10
                            ? "text-yellow-400"
                            : "text-green-400"
                    }`}
                  >
                    {section.seats_available}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="class-loading"
          className="flex w-full justify-center items-center mb-3 lg:mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.14, ease: "easeOut" }}
        >
          <Loader />
          <p className="mx-2 text-[10px] lg:text-xs font-inter text-[#b0b0b0]">
            Loading {props.dept} {props.classcode}...
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
