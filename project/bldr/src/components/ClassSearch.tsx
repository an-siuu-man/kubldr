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

import {
  autoUpdate,
  FloatingPortal,
  flip,
  offset,
  shift,
  size,
  useFloating,
} from "@floating-ui/react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { SearchedClass } from "@/types";
import Class from "./Class";
import Loader from "./Loader";

const toKeyPart = (value: unknown, fallback: string) => {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized.length > 0 ? normalized : fallback;
};

const toSearchedClassKey = (searchedClass: SearchedClass) => {
  const uuidKey = searchedClass.uuid?.trim();
  if (uuidKey && uuidKey.length > 0) {
    return uuidKey;
  }
  return `${toKeyPart(searchedClass.dept, "dept")}-${toKeyPart(searchedClass.code, "code")}-${toKeyPart(searchedClass.title, "title")}`;
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

  const [showTopShadow, setShowTopShadow] = useState(false);
  const [showBottomShadow, setShowBottomShadow] = useState(false);

  const checkShadows = useCallback(() => {
    const el = searchedListRef.current;
    if (!el) return;
    setShowTopShadow(el.scrollTop > 0);
    setShowBottomShadow(el.scrollTop + el.clientHeight < el.scrollHeight - 1);
  }, []);

  useEffect(() => {
    const el = searchedListRef.current;
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

  // Dynamic positioning styles for the dropdown
  const [_dropdownPosStyle, _setDropdownPosStyle] = useState<
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
  }, [dropdownOpen, update]);

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
          searchedListRef.current?.scrollTo({ top: 0, behavior: "auto" });
        });
      }
    }
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-b-[20px] border border-slate-200 bg-white dark:border-white/10 dark:bg-[#111111]">
      {/* Search header */}
      <div className="shrink-0 border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/8 dark:bg-[#0f0f0f]">
        <div
          ref={wrapperRef}
          className="class-search-form flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-[#1a1a1a]"
          tabIndex={-1}
          onFocus={() => setDropdownOpen(true)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) {
              setDropdownOpen(false);
            }
          }}
        >
          <Search
            className="h-4 w-4 shrink-0 text-slate-400 dark:text-white/30"
            aria-hidden="true"
          />
          <input
            value={searchQuery}
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
            placeholder="Search by dept, code, or title…"
            className="flex-1 bg-transparent font-inter text-sm text-slate-900 outline-none selection:bg-blue-400 placeholder:text-slate-400 dark:text-white/90 dark:placeholder:text-white/25"
          />
        </div>
      </div>

      <FloatingPortal>
        {dropdownOpen && searchQuery.trim() && (
          <ul
            ref={(el) => {
              refs.setFloating(el);
              dropdownRef.current = el;
            }}
            key="dropdown"
            className="overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-[0_8px_32px_rgba(15,23,42,0.16)] dark:divide-white/5 dark:border-white/10 dark:bg-[#111111] dark:shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
            style={{ position: strategy, left: x ?? 0, top: y ?? 0 }}
            tabIndex={-1}
            aria-label="Search results"
          >
            {isLoading ? (
              <li className="p-4 flex items-center justify-center">
                <Loader />
              </li>
            ) : classes.length === 0 ? (
              <li className="px-4 py-3 text-center font-inter text-xs text-slate-500 dark:text-white/40">
                No results found
              </li>
            ) : (
              <AnimatePresence mode="popLayout">
                {classes.map((c, index) => (
                  <motion.li
                    key={toSearchedClassKey(c)}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleDropdownSelect(c.uuid);
                      setDropdownOpen(false);
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    role="option"
                    aria-selected={index === highlightedIndex}
                    className={`flex items-center justify-between gap-3 px-4 py-3 cursor-pointer transition-colors ${
                      index === highlightedIndex
                        ? "bg-slate-100 dark:bg-white/5"
                        : "hover:bg-slate-50 dark:hover:bg-white/3"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="font-dmsans text-sm font-semibold text-slate-950 dark:text-white/90">
                        {c.dept} {c.code}
                      </p>
                      <p className="truncate font-inter text-xs text-slate-500 dark:text-white/45">
                        {c.title}
                      </p>
                    </div>
                    <div className="shrink-0 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-dmsans text-xs text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-white/60">
                      Add
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            )}
          </ul>
        )}
      </FloatingPortal>

      {/* Searched section */}
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3   shrink-0">
          <p className="font-dmsans text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-white/40">
            Searched
          </p>
          {selectedClasses.length > 0 && (
            <button
              onClick={() => {
                setSelectedClasses([]);
                setSearchQuery("");
              }}
              className="text-[10px] px-1.5 py-0.5 rounded-md bg-red-500/15 text-red-400 hover:bg-red-500/25 cursor-pointer transition-colors font-inter"
              aria-label="Clear all searched classes"
            >
              Clear all
            </button>
          )}
        </div>
        <div className="relative flex-1 min-h-0">
          {showTopShadow && (
            <div className="pointer-events-none absolute top-0 left-0 right-0 h-8 z-10 bg-linear-to-b from-white to-transparent dark:from-[#111111]" />
          )}
          {showBottomShadow && (
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 z-10 bg-linear-to-t from-white to-transparent dark:from-[#111111]" />
          )}
          <div
            ref={searchedListRef}
            className="h-full overflow-y-auto scrollbar-hidden divide-y divide-slate-100 p-2 font-inter dark:divide-white/5"
            role="region"
            aria-label="Searched classes list"
          >
            <AnimatePresence initial={false}>
              {selectedClasses.map((c) => (
                <motion.div
                  key={toSearchedClassKey(c)}
                  layout="position"
                  initial={{ opacity: 0, y: 8, scale: 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.99 }}
                  transition={{
                    layout: {
                      duration: 0.22,
                      ease: [0.22, 1, 0.36, 1],
                    },
                    opacity: {
                      duration: 0.18,
                      ease: "easeOut",
                    },
                    y: {
                      duration: 0.2,
                      ease: [0.22, 1, 0.36, 1],
                    },
                    scale: {
                      duration: 0.2,
                      ease: "easeOut",
                    },
                  }}
                  className="relative group origin-top"
                >
                  <Class
                    uuid={c.uuid}
                    classcode={c.code || ""}
                    dept={c.dept || ""}
                  />
                  <button
                    onClick={() =>
                      setSelectedClasses((prev) =>
                        prev.filter(
                          (cls) =>
                            toSearchedClassKey(cls) !== toSearchedClassKey(c),
                        ),
                      )
                    }
                    className="absolute top-3 right-3 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-white/90 opacity-0 transition-opacity duration-200 hover:bg-slate-100 group-hover:opacity-100 dark:bg-[#111111]/80 dark:hover:bg-[#1a1a1a]"
                    title="Remove from searched"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </motion.div>
              ))}
              {selectedClasses.length === 0 && (
                <motion.div
                  key="searched-empty-state"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="px-4 py-6 text-center font-inter text-xs text-slate-400 dark:text-white/30"
                >
                  No classes searched
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
