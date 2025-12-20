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

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Loader from "@/components/Loader";
import {
  ClassProps,
  ClassSection,
  ClassData,
  ClassInfoResponse,
} from "@/types";
import { useScheduleBuilder } from "@/contexts/ScheduleBuilderContext";
import { timeToDecimal, calculateDuration } from "@/lib/timeUtils";

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
  const [selectedClasses, setSelectedClasses] = useState<any>({});

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
    classData: ClassData
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
  }, []);

  // Debug logging for class info updates
  useEffect(() => {
    if (classInfo) {
      console.log(classInfo);
    }
  }, [classInfo]);

  return (
    <AnimatePresence>
      {classInfo && classInfo.data.length > 0 ? (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{
            scale: 1,
            opacity: 1,
            transition: { delay: 0.3 },
          }}
          exit={{ scale: 0.6, opacity: 0 }}
          key={props.uuid}
          className="flex flex-col p-2 mt-2 mb-6 rounded-md text-[#fafafa] border-2 max-w-[340px] lg:max-w-[378px] xl:max-w-[400px] border-[#404040] shadow-md justify-start items-center"
        >
          <h1 className="font-dmsans text-base font-bold self-start">
            {classInfo.data[0].dept} {classInfo.data[0].code}:{" "}
            {classInfo.data[0].title}
          </h1>
          <p className="text-xs text-[#b0b0b0] font-inter self-start">
            {classInfo.data[0].description || "No description available."}
          </p>
          {classInfo.data[0].sections.map((section: ClassSection) => (
            <button
              // disabled={(section.seats_available ?? 0) <= 0}
              key={section.uuid}
              onClick={() => handleSectionClick(section, classInfo.data[0])}
              className={`w-full font-inter rounded-md mt-2 bg-[#181818] hover:bg-[#232323] transition duration-100 px-2 text-left cursor-pointer`}
            >
              <div className="flex flex-row w-full justify-between gap-3 items-start my-1">
                <div className="flex flex-row gap-3 items-start">
                  <div className="flex flex-col">
                    <span className="font-semibold">#{section.classID}</span>
                    <span className="text-xs text-[#a8a8a8] self-center">
                      {section.component}
                    </span>
                  </div>
                  <div className="flex flex-col justify-start items-start font-inter">
                    <span className="text-sm text-[#fafafa]">
                      {section.days}{" "}
                      {section.starttime && section.endtime
                        ? `${section.starttime} - ${section.endtime}`
                        : section.starttime || section.endtime || ""}
                    </span>
                    {section.instructor ? (
                      <span className="text-xs text-[#a8a8a8]">
                        {section.instructor}
                      </span>
                    ) : (
                      <span className="text-xs text-[#a8a8a8]">
                        Instructor TBA
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={`text-sm font-semibold justify-self-end ${
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
        </motion.div>
      ) : (
        <motion.div
          className="flex w-full justify-center items-center mb-6 "
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <Loader />
          <p className="mx-2 text-xs font-inter text-[#b0b0b0]">
            Loading details for {props.dept} {props.classcode}...
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
