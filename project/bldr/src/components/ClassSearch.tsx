/**
 * ClassSearch.tsx
 *
 * A comprehensive class search component that allows users to search for courses,
 * view search results, and manage their selected classes. This is the primary
 * interface for building a schedule.
 *
 * Features:
 * - Real-time search with debounced API calls (400ms delay)
 * - Floating dropdown with search results using Floating UI
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - Searched section: Shows detailed info for classes the user has explored
 * - Ability to remove classes from both sections
 * - Grouped display of class sections by course
 * - Accessible with ARIA roles and keyboard support
 *
 * @component
 */
"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  useFloating,
  offset,
  flip,
  shift,
  size,
  autoUpdate,
  FloatingPortal,
} from "@floating-ui/react";
import { Input } from "./ui/input";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { SearchedClass } from "@/types";
import { Trash2, Search } from "lucide-react";
import Class from "./Class";
import Loader from "./Loader";

const toKeyPart = (value: unknown, fallback: string) => {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized.length > 0 ? normalized : fallback;
};

/**
 * ClassSearch Component
 *
 * Provides the main interface for searching and selecting classes.
 * Manages both the search functionality and the display of selected classes.
 *
 * @returns {JSX.Element} The class search panel with search input and accordion sections
 */
export default function ClassSearch() {
  // Classes that the user has selected from search results to view details
  const [selectedClasses, setSelectedClasses] = useState<SearchedClass[]>([]);

  // Search results from the API
  const [classes, setClasses] = useState<SearchedClass[]>([]);

  // Loading state for search
  const [isLoading, setIsLoading] = useState(false);

  // Current search input value
  const [searchQuery, setSearchQuery] = useState("");

  // Controls visibility of the search results dropdown
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Currently highlighted item index for keyboard navigation
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  // Refs for DOM elements used by Floating UI
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLUListElement | null>(null);
  const searchedListRef = useRef<HTMLDivElement | null>(null);

  // Dynamic positioning styles for the dropdown
  const [dropdownPosStyle, setDropdownPosStyle] = useState<
    React.CSSProperties | undefined
  >(undefined);

  /**
   * Floating UI configuration for the search results dropdown.
   * - offset: 6px gap between input and dropdown
   * - flip: Automatically flips to top if no room below
   * - shift: Keeps dropdown within viewport bounds
   * - size: Matches dropdown width to input and limits max height
   * - autoUpdate: Repositions on scroll/resize
   */
  const { x, y, strategy, refs, update, middlewareData } = useFloating({
    placement: "bottom-start",
    middleware: [
      offset(6),
      flip(),
      shift({ padding: 8 }),
      size({
        apply({ rects, availableWidth, availableHeight, elements }) {
          // Match the input width and respect available space
          const width = Math.min(rects.reference.width, availableWidth - 8);
          Object.assign(elements.floating.style, {
            width: `${width}px`,
            maxHeight: `${Math.min(320, availableHeight * 0.6)}px`,
          });
        },
        padding: 8,
      }),
    ],
    whileElementsMounted: autoUpdate,
  });

  /**
   * Debounced search effect.
   * Waits 400ms after the user stops typing before making an API call.
   * This prevents excessive API requests while typing.
   */
  useEffect(() => {
    const delay = setTimeout(() => {
      if (!searchQuery.trim()) {
        setClasses([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      fetch("/api/searchclass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      })
        .then((r) => r.json())
        .then((d) => {
          setClasses(d || []);
          setHighlightedIndex(0); // Reset highlight on new results
          setIsLoading(false);
        })
        .catch(() => {
          setClasses([]);
          setIsLoading(false);
        });
    }, 400);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  // Initialize Floating UI reference element
  useEffect(() => {
    refs.setReference(wrapperRef.current);
  }, [refs]);

  // Update dropdown position when it opens or results change
  useEffect(() => {
    if (dropdownOpen) update?.();
  }, [dropdownOpen, classes.length, update]);

  // Ensure the highlighted item is visible in the dropdown (keyboard navigation)
  useEffect(() => {
    if (!dropdownRef.current || !dropdownOpen) return;
    const listItems = dropdownRef.current.querySelectorAll("li");
    const highlightedItem = listItems[highlightedIndex];
    if (highlightedItem) {
      highlightedItem.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex, dropdownOpen]);

  /**
   * Handles selection of a class from the search dropdown.
   * Toggles the class in the selectedClasses list:
   * - If already selected, removes it
   * - If not selected, adds it to the beginning of the list
   *
   * @param {string} uuid - The unique identifier of the selected class
   */
  function handleDropdownSelect(uuid: string) {
    const isAlreadyPresent = selectedClasses.some((cls) => cls.uuid === uuid);
    if (isAlreadyPresent) {
      // Remove class if already in the list (toggle behavior)
      setSelectedClasses((prevClasses) =>
        prevClasses.filter((item) => item.uuid !== uuid),
      );
      console.log(selectedClasses);
    } else {
      // Add new class to the beginning of the list
      const newClass = classes.find((c) => c.uuid === uuid);
      if (newClass) {
        setSelectedClasses((prevClasses) => [
          {
            uuid: newClass.uuid,
            code: newClass.code,
            title: newClass.title,
            dept: newClass.dept,
            credithours: newClass.credithours,
            instructor: newClass.instructor,
            days: newClass.days,
          },
          ...prevClasses,
        ]);
        requestAnimationFrame(() => {
          searchedListRef.current?.scrollTo({ top: 0, behavior: "smooth" });
        });
        console.log(selectedClasses);
      }
    }
  }

  return (
    <div className="flex flex-col justify-start items-center w-full h-full overflow-hidden bg-[#080808] transition-all duration-150 border-2 border-[#303030] rounded-b-[10px] rounded-t-none">
      <div className="flex flex-col justify-start items-center w-full h-full p-2 lg:p-3 xl:p-4 overflow-hidden">
        <h1 className="text-sm lg:text-base xl:text-lg self-start font-figtree font-bold text-[#fafafa]">
          Search for classes
        </h1>
        <div className="flex-col justify-start items-center w-full">
          <div
            ref={wrapperRef}
            className="class-search-form flex flex-row justify-start items-center gap-2 w-full mt-3 lg:mt-4"
            tabIndex={-1}
            onFocus={() => setDropdownOpen(true)}
            onBlur={(e) => {
              // Only close if focus moves outside the dropdown/input
              if (!e.currentTarget.contains(e.relatedTarget)) {
                setDropdownOpen(false);
              }
            }}
          >
            <Input
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setDropdownOpen(true);
              }}
              onFocus={() => setDropdownOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  setDropdownOpen(false);
                  return;
                }

                if (!dropdownOpen || classes.length === 0) return;

                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setHighlightedIndex((prev) =>
                    prev < classes.length - 1 ? prev + 1 : prev,
                  );
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  if (classes[highlightedIndex]) {
                    handleDropdownSelect(classes[highlightedIndex].uuid);
                    setDropdownOpen(false);
                  }
                }
              }}
              placeholder="Class name"
              className="font-inter border-[#404040] border placeholder:text-xs selection:bg-blue-400 text-xs text-[#fafafa]"
            />
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <button className="cursor-pointer hover:bg-[#404040] p-1 rounded-md transition duration-300">
                    <Search className="h-6 w-6 text-[#fafafa]" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="font-figtree" side="bottom">
                  <p>Search class</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <FloatingPortal>
            {dropdownOpen && searchQuery.trim() && (
              <ul
                ref={(el) => {
                  refs.setFloating(el);
                  dropdownRef.current = el;
                }}
                key="dropdown"
                className="rounded shadow bg-[#232323] overflow-y-auto mt-2"
                style={{ position: strategy, left: x ?? 0, top: y ?? 0 }}
                tabIndex={-1}
                role="listbox"
                aria-label="Search results"
              >
                {isLoading ? (
                  <li className="p-4 flex items-center justify-center">
                    <Loader />
                  </li>
                ) : classes.length === 0 ? (
                  <li className="p-4 text-sm text-[#888888] text-center font-inter">
                    No results found
                  </li>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {classes.map((c, index) => (
                      <motion.li
                        key={
                          c.uuid?.trim() ||
                          `${toKeyPart(c.dept, "dept")}-${toKeyPart(c.code, "code")}-${toKeyPart(c.title, "title")}-${index}`
                        }
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        onMouseDown={async (e) => {
                          e.preventDefault();
                          await handleDropdownSelect(c.uuid);
                          setDropdownOpen(false);
                        }}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        role="option"
                        aria-selected={index === highlightedIndex}
                        className={`p-2 text-xs sm:text-sm text-[#fafafa] hover:cursor-pointer scroll-p-4 font-inter last:border-b-0 ${
                          index === highlightedIndex
                            ? "bg-[#181818]"
                            : "hover:bg-[#181818]"
                        }`}
                      >
                        <strong>
                          {c.dept} {c.code}
                        </strong>{" "}
                        - {c.title}
                      </motion.li>
                    ))}
                  </AnimatePresence>
                )}
              </ul>
            )}
          </FloatingPortal>
        </div>

        {/* Searched Section */}
        <div className="w-full max-w-full mt-3 lg:mt-4 flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="flex items-center justify-between py-2 shrink-0">
            <h2 className="text-sm lg:text-base text-green-400 font-bold font-figtree">
              Searched
            </h2>
            {selectedClasses.length > 0 && (
              <button
                onClick={() => {
                  setSelectedClasses([]);
                  setSearchQuery("");
                }}
                className="text-[10px] lg:text-xs px-1.5 lg:px-2 py-0.5 lg:py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 cursor-pointer transition-colors font-inter font-normal"
                aria-label="Clear all searched classes"
              >
                Clear all
              </button>
            )}
          </div>
          <div
            ref={searchedListRef}
            className="font-inter flex-1 min-h-0 overflow-y-auto scrollbar-hidden pb-4"
            role="region"
            aria-label="Searched classes list"
          >
            {selectedClasses.length === 0 ? (
              <div className="text-xs lg:text-sm text-[#888888] font-figtree">
                No classes searched
              </div>
            ) : (
              <AnimatePresence mode="popLayout" initial={false}>
                {selectedClasses.map((c, index) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{
                      layout: {
                        duration: 0.24,
                        ease: "easeOut",
                      },
                      opacity: {
                        duration: 0.22,
                        ease: "easeOut",
                      },
                      y: {
                        duration: 0.24,
                        ease: [0.22, 1, 0.36, 1],
                      },
                    }}
                    key={
                      c.uuid?.trim() ||
                      `${toKeyPart(c.dept, "dept")}-${toKeyPart(c.code, "code")}-${toKeyPart(c.title, "title")}-${index}`
                    }
                    className="relative group"
                  >
                    <Class
                      uuid={c.uuid}
                      classcode={c.code || ""}
                      dept={c.dept || ""}
                    />
                    <button
                      onClick={() =>
                        setSelectedClasses((prev) =>
                          prev.filter((cls) => cls.uuid !== c.uuid),
                        )
                      }
                      className="absolute top-3 right-3 cursor-pointer rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-[#080808]/80 hover:bg-[#181818]"
                      title="Remove from searched"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
