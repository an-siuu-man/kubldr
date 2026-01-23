/**
 * CurrentlySelected.tsx
 *
 * A component that displays the list of classes currently added to the draft schedule.
 * This component shows grouped sections by course with the ability to remove sections.
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

import { useScheduleBuilder } from "@/contexts/ScheduleBuilderContext";
import { Trash2, AlertCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/**
 * CurrentlySelected Component
 *
 * Displays the classes currently added to the draft schedule in a grouped format.
 *
 * @returns {JSX.Element} The currently selected classes panel
 */
export default function CurrentlySelected() {
  const { draftSchedule, removeClassFromDraft } = useScheduleBuilder();

  return (
    <div className="flex flex-col justify-start items-center my-2 lg:my-4 w-full min-w-[280px] max-w-[340px] lg:max-w-[380px] xl:max-w-[420px] h-[min(55vh,450px)] lg:h-[min(60vh,520px)] xl:h-[min(65vh,580px)] overflow-hidden bg-[#080808] transition-all duration-150 border-2 border-[#303030] rounded-[10px]">
      <div className="flex flex-col justify-start items-center w-full h-full p-2 lg:p-3 xl:p-4">
        <Accordion
          type="single"
          defaultValue="item-1"
          collapsible
          className="font-figtree w-full"
        >
          <AccordionItem value="item-1" className="border-b-0">
            <AccordionTrigger className="text-sm lg:text-base xl:text-lg text-purple-400 font-bold hover:no-underline hover:cursor-pointer py-2">
              Currently Selected
            </AccordionTrigger>
            <AccordionContent className="font-inter max-h-[min(42vh,380px)] lg:max-h-[min(47vh,430px)] overflow-y-auto scrollbar-hidden">
              {draftSchedule.length === 0 ? (
                <div className="text-xs lg:text-sm text-[#888888] font-figtree">
                  No classes added
                </div>
              ) : (
                (() => {
                  // Group sections by class (dept + code)
                  const groupedClasses = draftSchedule.reduce(
                    (acc: any, section: any, index: number) => {
                      const key = `${section.dept}-${section.code}`;
                      if (!acc[key]) {
                        acc[key] = {
                          dept: section.dept,
                          code: section.code,
                          title: section.title,
                          sections: [],
                        };
                      }
                      acc[key].sections.push({
                        ...section,
                        originalIndex: index,
                      });
                      return acc;
                    },
                    {},
                  );

                  return Object.values(groupedClasses).map(
                    (classGroup: any) => (
                      <div
                        key={`${classGroup.dept}-${classGroup.code}`}
                        className="bg-[#181818] rounded-md p-3 mb-2 border-2 border-[#303030]"
                      >
                        <div className="font-bold text-white mb-4 text-xs lg:text-sm font-inter">
                          {classGroup.dept} {classGroup.code}:{" "}
                          {classGroup.title}
                        </div>
                        <div className="flex flex-col gap-2">
                          {classGroup.sections.map((section: any) => (
                            <div
                              key={section.originalIndex}
                              className="relative group rounded-md bg-[#101010] p-2 border border-[#404040]"
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
                                <div className="text-[10px] lg:text-xs text-[#888888] font-inter">
                                  {section.days} • {section.starttime} -{" "}
                                  {section.endtime}
                                </div>
                                {section.instructor && (
                                  <div className="text-[10px] lg:text-xs text-[#888888] font-inter">
                                    {section.instructor}
                                  </div>
                                )}
                              </div>
                              <button
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
                      </div>
                    ),
                  );
                })()
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
