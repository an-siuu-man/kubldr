/**
 * Sidebar.tsx
 *
 * The main navigation sidebar component for the schedule builder application.
 * Provides schedule management functionality including creating, renaming,
 * deleting, and switching between schedules.
 *
 * Features:
 * - Collapsible sidebar with smooth animations
 * - Create new schedules with custom names
 * - List and filter schedules by semester
 * - Inline schedule renaming with keyboard support
 * - Schedule deletion with confirmation toast
 * - User account information display
 * - Upgrade prompt for guest users
 * - Responsive design with toggle button
 * - Mobile-friendly top bar for smaller screens
 *
 * @component
 */
"use client";

import type { Variants } from "framer-motion";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Check,
  ChevronDown,
  Edit2,
  Menu,
  MoreHorizontal,
  Sidebar as SidebarIcon,
  Trash2,
  User,
  UserPlus,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import toastStyle from "@/components/ui/toastStyle";
import { useActiveSchedule } from "@/contexts/ActiveScheduleContext";
import { useAuth } from "@/contexts/AuthContext";
import { useScheduleBuilder } from "@/contexts/ScheduleBuilderContext";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Schedule } from "@/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Spinner } from "./ui/spinner";

const sidebarEnterEase = [0.22, 1, 0.36, 1] as const;
const sidebarExitEase = [0.4, 0, 1, 1] as const;

const sidebarContentVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.22,
      ease: sidebarEnterEase,
    },
  },
  exit: {
    opacity: 0,
    y: 6,
    transition: {
      duration: 0.16,
      ease: sidebarExitEase,
    },
  },
};

const mobileDropdownVariants: Variants = {
  hidden: { opacity: 0, y: -10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.22,
      ease: sidebarEnterEase,
    },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: {
      duration: 0.16,
      ease: sidebarExitEase,
    },
  },
};

const scheduleItemVariants: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.18,
      ease: sidebarEnterEase,
    },
  },
  exit: {
    opacity: 0,
    y: 4,
    transition: {
      duration: 0.14,
      ease: sidebarExitEase,
    },
  },
};

/**
 * Sidebar Component
 *
 * Renders the collapsible sidebar with schedule management controls.
 * Integrates with multiple contexts for authentication, active schedule,
 * and schedule builder state management.
 *
 * @returns {JSX.Element} The sidebar navigation panel
 */
export function Sidebar() {
  // Authentication context for user info and session
  const { user, session } = useAuth();

  // Check if we're on mobile
  const isMobile = useIsMobile();

  // Active schedule context for managing user's schedules
  const {
    activeSchedule,
    setActiveSchedule,
    activeSemester,
    setActiveSemester,
    userSchedules,
    isLoadingSchedules,
    loadSchedule,
    addScheduleToList,
    updateScheduleInList,
    removeScheduleFromList,
  } = useActiveSchedule();

  // Schedule builder context for draft schedule management
  const { clearDraft, draftScheduleName, setDraftScheduleName } =
    useScheduleBuilder();

  // Sidebar open/closed state (desktop) and mobile menu open state
  const [open, setOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Loading state for async operations (e.g., creating schedules)
  const [loading, setLoading] = useState(false);

  // Input value for new schedule name
  const [newScheduleName, setNewScheduleName] = useState("");

  // Track which schedule is being hovered for showing action buttons
  const [hoveredScheduleId, setHoveredScheduleId] = useState<string | null>(
    null,
  );

  // Track which schedule is in rename mode
  const [renamingScheduleId, setRenamingScheduleId] = useState<string | null>(
    null,
  );

  // Input value for renaming a schedule
  const [renameValue, setRenameValue] = useState("");

  // Track which schedule is being deleted (for AlertDialog)
  const [deletingScheduleId, setDeletingScheduleId] = useState<string | null>(
    null,
  );

  // Track if the schedule list has overflow (for showing gradient shadow)
  const [hasScheduleListOverflow, setHasScheduleListOverflow] = useState(false);
  const scheduleListRef = useRef<HTMLUListElement>(null);

  // Check if the schedule list has overflow using ResizeObserver
  useEffect(() => {
    if (isMobile || !open) {
      setHasScheduleListOverflow(false);
      return;
    }

    const listElement = scheduleListRef.current;
    if (!listElement) return;

    const checkOverflow = () => {
      const { scrollHeight, clientHeight } = listElement;
      setHasScheduleListOverflow(scrollHeight > clientHeight);
    };

    // Initial check with a small delay to ensure DOM is ready
    const timeoutId = setTimeout(checkOverflow, 50);

    // Use ResizeObserver to detect content size changes
    const resizeObserver = new ResizeObserver(checkOverflow);
    resizeObserver.observe(listElement);

    // Also check on window resize
    window.addEventListener("resize", checkOverflow);

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", checkOverflow);
    };
  }, [isMobile, open]);

  /**
   * Toggles the sidebar between open and closed states.
   */
  const toggleSidebar = () => {
    setOpen(!open);
  };

  /**
   * Toggles the mobile menu between open and closed states.
   */
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  /**
   * Creates a new schedule via API and adds it to the local state.
   * Defaults to "Untitled" if no name is provided.
   *
   * @param {string} newScheduleName - The name for the new schedule
   */
  const handleCreateSchedule = async (newScheduleName: string) => {
    setLoading(true);
    const scheduleName = newScheduleName.trim() || "Untitled";
    try {
      const response = await fetch("/api/createSchedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scheduleName: scheduleName,
          semester: activeSemester || "Spring 2026",
          year: 2026,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create schedule");
      }

      const data = await response.json();

      // Add the new schedule to the local list
      const newSchedule = {
        id: data.schedule.scheduleid,
        name: data.schedule.schedulename,
        semester: data.schedule.semester,
        year: data.schedule.year,
        classes: [],
      };
      addScheduleToList(newSchedule);
      setNewScheduleName("");
    } catch (error) {
      console.error("Error creating schedule:", error);
      toast.error("Failed to create schedule", {
        style: toastStyle,
        duration: 2000,
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Renames an existing schedule via API.
   * Updates both the backend and local state on success.
   *
   * @param {string} scheduleId - The ID of the schedule to rename
   * @param {string} newName - The new name for the schedule
   */
  const handleRenameSchedule = async (scheduleId: string, newName: string) => {
    if (!newName.trim()) {
      toast.error("Schedule name cannot be empty", {
        style: toastStyle,
        duration: 2000,
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      });
      return;
    }

    if (!session?.access_token) {
      toast.error("You must be logged in to rename schedules", {
        style: toastStyle,
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      });
      return;
    }

    try {
      const res = await fetch("/api/renameSchedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ scheduleId, newName: newName.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to rename schedule");
      }

      setDraftScheduleName(newName.trim());
      // Update the local schedule list with the new name
      const scheduleToUpdate = userSchedules.find((s) => s.id === scheduleId);
      if (scheduleToUpdate) {
        updateScheduleInList(scheduleId, {
          ...scheduleToUpdate,
          name: newName.trim(),
        });
      }

      toast.success("Schedule renamed successfully", {
        style: toastStyle,
        duration: 2000,
        icon: <Check className="h-5 w-5 text-green-500" />,
      });
    } catch (err: unknown) {
      console.error("Error renaming schedule:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to rename schedule",
        {
          style: toastStyle,
          icon: <AlertCircle className="h-5 w-5 text-red-500" />,
        },
      );
    } finally {
      setRenamingScheduleId(null);
      setRenameValue("");
    }
  };

  /**
   * Initiates the rename mode for a schedule.
   * Sets the current name as the initial input value.
   *
   * @param schedule - The schedule object to rename
   */
  const startRenaming = (schedule: Schedule) => {
    setRenamingScheduleId(schedule.id);
    setRenameValue(schedule.name);
  };

  /**
   * Cancels the rename operation and clears the rename state.
   */
  const cancelRenaming = () => {
    setRenamingScheduleId(null);
    setRenameValue("");
  };

  /**
   * Deletes a schedule after user confirmation.
   * Shows an AlertDialog for confirmation.
   * On confirmation, removes from both backend and local state.
   *
   * @param {string} scheduleId - The ID of the schedule to delete
   */
  const handleDeleteSchedule = (scheduleId: string) => {
    if (!session?.access_token) {
      toast.error("You must be logged in to delete schedules", {
        style: toastStyle,
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      });
      return;
    }

    // Open the AlertDialog by setting the schedule ID
    setDeletingScheduleId(scheduleId);
  };

  /**
   * Confirms the deletion of a schedule.
   * Called when user clicks "Delete" in the AlertDialog.
   */
  const confirmDelete = async () => {
    if (!deletingScheduleId || !session?.access_token) return;

    try {
      const res = await fetch("/api/deleteSchedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ scheduleId: deletingScheduleId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete schedule");
      }

      // Remove from local context
      removeScheduleFromList(deletingScheduleId);
      setActiveSchedule(null);
      setActiveSemester("");
      clearDraft();
      toast.success("Schedule deleted", {
        duration: 2000,
        style: toastStyle,
        icon: <Trash2 className="h-5 w-5 text-green-500" />,
      });
    } catch (err: unknown) {
      console.error("Error deleting schedule:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to delete schedule",
        {
          style: toastStyle,
          icon: <AlertCircle className="h-5 w-5 text-red-500" />,
        },
      );
    } finally {
      setDeletingScheduleId(null);
    }
  };

  const visibleSchedules = userSchedules.filter(
    (schedule) => schedule.semester === activeSemester || activeSemester === "",
  );

  return (
    <>
      {/* Mobile Top Bar */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-50">
          {/* Mobile Header Bar */}
          <div className="bg-[#1a1a1a] border-b border-[#2a2a2a] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleMobileMenu}
                className="p-1.5 rounded-md hover:bg-[#333] transition cursor-pointer"
              >
                <Menu
                  size={22}
                  className={`transition-transform duration-300 ${
                    mobileMenuOpen ? "rotate-90" : ""
                  }`}
                />
              </button>
              <span className="font-figtree font-bold text-sm text-gray-300">
                {activeSchedule?.name || draftScheduleName || "Schedules"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {user?.is_anonymous && (
                <Link href="/upgrade">
                  <Button
                    variant="outline"
                    size="sm"
                    className="cursor-pointer font-dmsans border-yellow-600/50 text-yellow-400 hover:bg-yellow-900/30 hover:text-yellow-300 text-xs py-1 px-2 h-7"
                  >
                    <UserPlus className="h-3 w-3 mr-1" />
                    Sign Up
                  </Button>
                </Link>
              )}
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <User className="h-4 w-4" />
                <span className="font-figtree truncate max-w-20">
                  {user?.is_anonymous ? "Guest" : user?.email?.split("@")[0]}
                </span>
              </div>
            </div>
          </div>

          {/* Mobile Dropdown Menu */}
          <AnimatePresence initial={false}>
            {mobileMenuOpen && (
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.16, ease: sidebarExitEase }}
                  className="fixed inset-0 bg-black/50 z-40 top-[52px]"
                  onClick={toggleMobileMenu}
                />
                {/* Dropdown Panel */}
                <motion.div
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={mobileDropdownVariants}
                  className="relative bg-[#1a1a1a] border-b border-[#333] shadow-2xl z-50 overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-4 max-h-[70vh] overflow-y-auto">
                    <h2 className="text-base font-bold text-gray-300 mb-3 font-figtree">
                      Your Schedules
                    </h2>

                    {/* Semester Section */}
                    <div className="mb-3">
                      <div className="flex items-center gap-2 text-green-400 font-bold text-sm mb-2">
                        <ChevronDown className="h-4 w-4" />
                        <span>Spring 2026</span>
                      </div>

                      {/* New schedule input */}
                      <div className="pl-4">
                        <Label
                          htmlFor="mobile-schedule-name"
                          className="text-xs font-dmsans mb-1 text-[#888888]"
                        >
                          Make new schedule
                        </Label>
                        <div className="flex flex-row items-center gap-2 mb-3">
                          <Input
                            type="text"
                            id="mobile-schedule-name"
                            value={newScheduleName}
                            onChange={(e) => setNewScheduleName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleCreateSchedule(newScheduleName);
                                setMobileMenuOpen(false);
                              }
                            }}
                            placeholder="Schedule name"
                            className="font-inter border-[#404040] border placeholder:text-xs selection:bg-blue-400 text-xs h-9 flex-1"
                          />
                          <Button
                            type="submit"
                            disabled={loading}
                            onClick={() => {
                              handleCreateSchedule(newScheduleName);
                              setMobileMenuOpen(false);
                            }}
                            className="bg-[#fafafa] text-xs text-[#1a1a1a] hover:bg-[#404040] hover:text-[#fafafa] cursor-pointer font-dmsans px-3 h-9"
                          >
                            {loading ? (
                              <Spinner className="h-3 w-3" />
                            ) : (
                              "Create"
                            )}
                          </Button>
                        </div>

                        {/* Schedule list */}
                        <div className="space-y-1">
                          {isLoadingSchedules ? (
                            <div className="flex items-center justify-center gap-2 py-4">
                              <Spinner className="size-4" />
                              <span className="text-xs">Loading...</span>
                            </div>
                          ) : userSchedules.length === 0 ? (
                            <p className="text-xs text-gray-400 py-2">
                              No schedules found.
                            </p>
                          ) : (
                            <AnimatePresence initial={false}>
                              {visibleSchedules.map((schedule) => (
                                <motion.div
                                  key={schedule.id}
                                  layout="position"
                                  initial="hidden"
                                  animate="visible"
                                  exit="exit"
                                  variants={scheduleItemVariants}
                                  className={`flex items-center justify-between rounded-lg text-sm font-inter ${
                                    activeSchedule?.id === schedule.id
                                      ? "bg-[#444] font-semibold"
                                      : "bg-[#252525] hover:bg-[#333]"
                                  } transition`}
                                >
                                  {renamingScheduleId === schedule.id ? (
                                    <div className="flex items-center gap-2 w-full p-2">
                                      <Input
                                        type="text"
                                        value={renameValue}
                                        onChange={(e) =>
                                          setRenameValue(e.target.value)
                                        }
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") {
                                            handleRenameSchedule(
                                              schedule.id,
                                              renameValue,
                                            );
                                          } else if (e.key === "Escape") {
                                            cancelRenaming();
                                          }
                                        }}
                                        autoFocus
                                        className="h-8 text-xs border-[#404040] bg-[#2a2a2a] flex-1"
                                      />
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleRenameSchedule(
                                            schedule.id,
                                            renameValue,
                                          )
                                        }
                                        className="p-1.5 hover:bg-[#555] rounded transition cursor-pointer"
                                      >
                                        <Check className="h-4 w-4 text-green-500" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={cancelRenaming}
                                        className="p-1.5 hover:bg-[#555] rounded transition cursor-pointer"
                                      >
                                        <X className="h-4 w-4 text-red-500" />
                                      </button>
                                    </div>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        className="py-3 px-3 cursor-pointer flex-1 text-left truncate"
                                        onClick={() => {
                                          loadSchedule(schedule.id);
                                          setActiveSemester(schedule.semester);
                                          setMobileMenuOpen(false);
                                        }}
                                      >
                                        {schedule.name}
                                      </button>
                                      <div className="flex items-center gap-1 pr-2">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            startRenaming(schedule)
                                          }
                                          className="p-1.5 hover:bg-[#555] rounded transition cursor-pointer"
                                        >
                                          <Edit2 className="h-4 w-4 text-gray-400" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleDeleteSchedule(schedule.id)
                                          }
                                          className="p-1.5 hover:bg-[#555] rounded transition cursor-pointer"
                                        >
                                          <Trash2 className="h-4 w-4 text-red-400" />
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </motion.div>
                              ))}
                            </AnimatePresence>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Mobile spacer to push content below fixed header */}
      {isMobile && <div className="h-[52px]" />}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <div
          className={`${
            open ? "mr-[min(280px,25vw)]" : "mr-[70px]"
          } z-45 transition-all duration-300 ease-out`}
        >
          <div
            className={`sidebar flex flex-col justify-between rounded-tr-3xl rounded-br-3xl fixed top-0 left-0 h-screen transition-all duration-300 ease-out ${
              open
                ? "min-w-[min(280px,25vw)] max-w-[min(280px,25vw)] bg-linear-to-b from-[#1a1a1a] to-[#141414] shadow-2xl shadow-black/50"
                : "bg-transparent min-w-[70px] max-w-[70px]"
            } overflow-hidden p-4 lg:p-5`}
          >
            {/* Top section */}
            <div>
              <div className="buttons-container flex items-center justify-between mb-4 lg:mb-5">
                <button
                  type="button"
                  className={`p-2 rounded-xl transition-all duration-300 cursor-pointer ${
                    open ? "hover:bg-white/5" : "hover:bg-white/10"
                  }`}
                  onClick={toggleSidebar}
                >
                  <SidebarIcon
                    size={22}
                    className={`transition-transform duration-500 ease-out text-gray-400 ${
                      open ? "" : "rotate-180"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="main-content grow flex flex-col justify-between overflow-hidden">
              {/* Main Sidebar Content */}
              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={sidebarContentVariants}
                    className="flex flex-col h-full overflow-hidden"
                  >
                    <h1 className="text-lg lg:text-xl font-semibold text-gray-200 mb-3 lg:mb-4 font-figtree tracking-tight">
                      Your Schedules
                    </h1>

                    <Accordion
                      type="single"
                      collapsible
                      defaultValue="spring-2026"
                      className="font-figtree flex-1 overflow-hidden"
                    >
                      <AccordionItem value="spring-2026" className="border-b-0">
                        <AccordionTrigger className="text-sm lg:text-base text-emerald-400 hover:text-emerald-300 hover:no-underline hover:cursor-pointer font-semibold py-2 transition-colors">
                          Spring 2026
                        </AccordionTrigger>
                        <AccordionContent className="font-inter">
                          {/* New schedule input */}
                          <Label
                            htmlFor="schedule-name"
                            className="text-xs lg:text-sm font-dmsans mb-1 text-[#888888]"
                          >
                            Make new schedule
                          </Label>
                          <div className="flex flex-row items-center justify-between gap-2 mb-3 lg:mb-4">
                            <Input
                              type="text"
                              id="schedule-name"
                              value={newScheduleName}
                              onChange={(e) =>
                                setNewScheduleName(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleCreateSchedule(newScheduleName);
                                }
                              }}
                              placeholder="Schedule name"
                              className="font-inter bg-white/5 border-white/10 border rounded-lg placeholder:text-xs focus:border-emerald-500/50 focus:ring-emerald-500/20 selection:bg-emerald-400 text-xs h-9 transition-colors"
                            />
                            <Button
                              type="submit"
                              disabled={loading}
                              onClick={() => {
                                handleCreateSchedule(newScheduleName);
                              }}
                              className="bg-white text-xs text-[#1a1a1a] hover:bg-white/90 cursor-pointer font-dmsans font-medium px-3 h-9 rounded-lg shadow-sm transition-all"
                            >
                              {loading ? (
                                <Spinner className="h-3 w-3" />
                              ) : (
                                "Create"
                              )}
                            </Button>
                          </div>

                          {/* Schedule list with overflow indicator */}
                          <div className="relative">
                            <ul
                              ref={scheduleListRef}
                              className="list-none overflow-y-auto overflow-x-hidden scrollbar-hidden max-h-[min(40vh,250px)] pb-4"
                            >
                              {isLoadingSchedules ? (
                                <div className="flex items-center justify-center gap-2 py-6">
                                  <Spinner className="size-4 text-emerald-400" />
                                  <span className="text-xs text-gray-400">
                                    Loading...
                                  </span>
                                </div>
                              ) : userSchedules.length === 0 ? (
                                <p className="text-xs text-gray-500 py-2">
                                  No schedules found.
                                </p>
                              ) : (
                                <AnimatePresence initial={false}>
                                  {visibleSchedules.map((schedule) => (
                                    <motion.li
                                      key={schedule.id}
                                      layout="position"
                                      initial="hidden"
                                      animate="visible"
                                      exit="exit"
                                      variants={scheduleItemVariants}
                                      onMouseEnter={() =>
                                        setHoveredScheduleId(schedule.id)
                                      }
                                      onMouseLeave={() =>
                                        setHoveredScheduleId(null)
                                      }
                                      className={`flex justify-between items-center text-xs text-gray-200 font-inter my-1 rounded-lg transition-all duration-150 ${
                                        activeSchedule?.id === schedule.id
                                          ? "bg-white/10 font-medium shadow-sm"
                                          : "hover:bg-white/5"
                                      }`}
                                    >
                                      {renamingScheduleId === schedule.id ? (
                                        <div className="flex items-center gap-1 lg:gap-2 w-full px-1.5 lg:px-2 py-0.5 lg:py-1">
                                          <Input
                                            type="text"
                                            value={renameValue}
                                            onChange={(e) =>
                                              setRenameValue(e.target.value)
                                            }
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter") {
                                                handleRenameSchedule(
                                                  schedule.id,
                                                  renameValue,
                                                );
                                              } else if (e.key === "Escape") {
                                                cancelRenaming();
                                              }
                                            }}
                                            autoFocus
                                            className="h-7 text-xs border-[#404040] bg-[#2a2a2a] flex-1"
                                          />
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleRenameSchedule(
                                                schedule.id,
                                                renameValue,
                                              )
                                            }
                                            className="p-1 hover:bg-[#444] rounded transition cursor-pointer"
                                          >
                                            <Check className="h-4 w-4 text-green-500" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={cancelRenaming}
                                            className="p-1 hover:bg-[#444] rounded transition cursor-pointer"
                                          >
                                            <X className="h-4 w-4 text-red-500" />
                                          </button>
                                        </div>
                                      ) : (
                                        <>
                                          <button
                                            type="button"
                                            className="py-2 px-3 cursor-pointer w-full text-left truncate"
                                            onClick={() => {
                                              loadSchedule(schedule.id);
                                              setActiveSemester(
                                                schedule.semester,
                                              );
                                              console.log(activeSchedule);
                                            }}
                                          >
                                            {schedule.name}
                                          </button>
                                          {hoveredScheduleId ===
                                            schedule.id && (
                                            <Popover>
                                              <PopoverTrigger asChild>
                                                <button
                                                  type="button"
                                                  className="flex items-center z-50 cursor-pointer"
                                                >
                                                  <MoreHorizontal className="h-4 w-4 mr-2" />
                                                </button>
                                              </PopoverTrigger>
                                              <PopoverContent className="bg-[#2a2a2a] border rounded-md border-[#404040] p-2 w-fit">
                                                <div className="flex flex-col items-start justify-between gap-1 text-sm">
                                                  <button
                                                    type="button"
                                                    className="p-2 rounded-md w-full flex flex-row items-center justify-start gap-2 font-inter cursor-pointer hover:bg-[#444] transition text-white"
                                                    onClick={() =>
                                                      startRenaming(schedule)
                                                    }
                                                  >
                                                    <Edit2 className="h-4 w-4" />
                                                    Rename
                                                  </button>
                                                  <hr className="w-full border-t border-[#606060]" />
                                                  <button
                                                    type="button"
                                                    className="p-2 rounded-md w-full flex flex-row items-center justify-start gap-2 font-inter cursor-pointer hover:bg-[#444] transition text-red-500"
                                                    onClick={() =>
                                                      handleDeleteSchedule(
                                                        schedule.id,
                                                      )
                                                    }
                                                  >
                                                    <Trash2 className="h-4 w-4 " />
                                                    Delete
                                                  </button>
                                                </div>
                                              </PopoverContent>
                                            </Popover>
                                          )}
                                        </>
                                      )}
                                    </motion.li>
                                  ))}
                                </AnimatePresence>
                              )}
                            </ul>
                            {/* Gradient overlay to indicate scrollable content - only visible when content overflows */}
                            {hasScheduleListOverflow && (
                              <div className="absolute bottom-0 left-0 right-0 h-8 bg-linear-to-t from-[#141414] to-transparent pointer-events-none" />
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Section */}
            <div className="flex flex-col w-full gap-3 shrink-0 mt-4 pt-4 border-t border-white/15">
              {/* Upgrade button for guest users */}
              <AnimatePresence initial={false}>
                {open && user?.is_anonymous && (
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={sidebarContentVariants}
                  >
                    <Link href="/upgrade">
                      <Button
                        variant="outline"
                        className="w-full cursor-pointer font-dmsans border-yellow-600/50 text-yellow-400 hover:bg-yellow-900/30 hover:text-yellow-300 text-xs lg:text-sm py-1.5 lg:py-2"
                      >
                        <UserPlus className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
                        Create Account
                      </Button>
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* User info */}
              <div className="flex flex-row w-full items-center justify-start gap-1.5 lg:gap-2">
                <User className="h-4 w-4 lg:h-5 lg:w-5 shrink-0" />
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      variants={sidebarContentVariants}
                      key={user?.email || "guest"}
                      className="font-figtree text-xs lg:text-sm truncate"
                    >
                      {user?.is_anonymous ? "Guest" : user?.email}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog
        open={deletingScheduleId !== null}
        onOpenChange={(open) => !open && setDeletingScheduleId(null)}
      >
        <AlertDialogContent className="bg-[#1a1a1a] border-[#404040]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#fafafa] font-figtree">
              Delete Schedule?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#888888] font-inter">
              This action cannot be undone. This will permanently delete this
              schedule from your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-dmsans bg-[#2a2a2a] border-[#404040] text-white hover:bg-[#333333] hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive/60 hover:bg-destructive/70 text-white border-red-200 font-dmsans"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
