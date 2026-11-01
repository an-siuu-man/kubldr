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
  Copy,
  Edit2,
  Link as LinkIcon,
  Loader2,
  LogOut,
  Menu,
  MoreHorizontal,
  Settings,
  Share2,
  Sidebar as SidebarIcon,
  Trash2,
  User,
  UserPlus,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppSettingsDialog } from "@/components/AppSettingsDialog";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useActiveSchedule } from "@/contexts/ActiveScheduleContext";
import { useAuth } from "@/contexts/AuthContext";
import { useScheduleBuilder } from "@/contexts/ScheduleBuilderContext";
import { useAppToast } from "@/hooks/use-app-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Schedule } from "@/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Spinner } from "./ui/spinner";
import { Switch } from "./ui/switch";

const sidebarEnterEase = [0.22, 1, 0.36, 1] as const;
const sidebarExitEase = [0.4, 0, 1, 1] as const;

const SIDEBAR_WIDTH_MS = 300;
const CONTENT_FADE_OUT_MS = 160;

const sidebarContentVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.22,
      ease: sidebarEnterEase,
      delay: SIDEBAR_WIDTH_MS / 1000,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: CONTENT_FADE_OUT_MS / 1000,
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

type SidebarProps = {
  /** Vertical pixels to offset the sidebar's fixed panels by, e.g. to sit below a page-level banner. */
  topOffset?: number;
  /** Called when the user clicks the Sign Out button. */
  onSignOut: () => void;
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
export function Sidebar({ topOffset = 0, onSignOut }: SidebarProps) {
  // Authentication context for user info and session
  const { user, session } = useAuth();
  const appToast = useAppToast();

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
  const [isSidebarWide, setIsSidebarWide] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // True while the rename API call is in-flight
  const [isRenamingSaving, setIsRenamingSaving] = useState(false);
  const [sharingScheduleId, setSharingScheduleId] = useState<string | null>(
    null,
  );

  // Track which schedule is being deleted (for AlertDialog)
  const [deletingScheduleId, setDeletingScheduleId] = useState<string | null>(
    null,
  );

  const scheduleListRef = useRef<HTMLUListElement>(null);
  const [showTopShadow, setShowTopShadow] = useState(false);
  const [showBottomShadow, setShowBottomShadow] = useState(false);

  // Cleanup close timer on unmount
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const checkShadows = useCallback(() => {
    const el = scheduleListRef.current;
    if (!el) return;
    setShowTopShadow(el.scrollTop > 0);
    setShowBottomShadow(el.scrollTop + el.clientHeight < el.scrollHeight - 1);
  }, []);

  useEffect(() => {
    if (isMobile || !isSidebarWide) {
      setShowTopShadow(false);
      setShowBottomShadow(false);
      return;
    }
    const el = scheduleListRef.current;
    if (!el) return;
    checkShadows();
    el.addEventListener("scroll", checkShadows, { passive: true });
    const ro = new ResizeObserver(checkShadows);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", checkShadows);
      ro.disconnect();
    };
  }, [isMobile, isSidebarWide, checkShadows]);

  /**
   * Toggles the sidebar between open and closed states.
   * Close: content fades out first, then width collapses.
   * Open: width expands first, then content fades in (via variant delay).
   */
  const toggleSidebar = () => {
    if (open) {
      setOpen(false);
      closeTimerRef.current = setTimeout(() => {
        setIsSidebarWide(false);
      }, CONTENT_FADE_OUT_MS);
    } else {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      setIsSidebarWide(true);
      setOpen(true);
    }
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
      appToast.error("Failed to create schedule", {
        action: "scheduleCreate",
        duration: 2000,
        icon: <AlertCircle className="h-5 w-5 text-destructive" />,
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
      appToast.error("Schedule name cannot be empty", {
        action: "scheduleRename",
        duration: 2000,
        icon: <AlertCircle className="h-5 w-5 text-destructive" />,
      });
      return;
    }

    if (!session?.access_token) {
      appToast.error("You must be logged in to rename schedules", {
        action: "scheduleRename",
        icon: <AlertCircle className="h-5 w-5 text-destructive" />,
      });
      return;
    }

    setIsRenamingSaving(true);
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

      appToast.success("Schedule renamed successfully", {
        action: "scheduleRename",
        duration: 2000,
        icon: <Check className="h-5 w-5 text-success" />,
      });
    } catch (err: unknown) {
      console.error("Error renaming schedule:", err);
      appToast.error(
        err instanceof Error ? err.message : "Failed to rename schedule",
        {
          action: "scheduleRename",
          icon: <AlertCircle className="h-5 w-5 text-destructive" />,
        },
      );
    } finally {
      setIsRenamingSaving(false);
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

  const getPublicScheduleUrl = (scheduleId: string) => {
    if (typeof window === "undefined") return `/s/${scheduleId}`;
    return `${window.location.origin}/s/${scheduleId}`;
  };

  const copyPublicScheduleLink = async (schedule: Schedule) => {
    try {
      await navigator.clipboard.writeText(getPublicScheduleUrl(schedule.id));
      appToast.success("Share link copied", {
        action: "scheduleShare",
        duration: 2000,
        icon: <Copy className="h-5 w-5 text-success" />,
      });
    } catch (error) {
      console.error("Error copying share link:", error);
      appToast.error("Failed to copy share link", {
        action: "scheduleShare",
        icon: <AlertCircle className="h-5 w-5 text-destructive" />,
      });
    }
  };

  const handleToggleShare = async (schedule: Schedule, isPublic: boolean) => {
    if (!session?.access_token) {
      appToast.error("You must be logged in to share schedules", {
        action: "scheduleShare",
        icon: <AlertCircle className="h-5 w-5 text-destructive" />,
      });
      return;
    }

    setSharingScheduleId(schedule.id);
    try {
      const res = await fetch("/api/shareSchedule", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ scheduleId: schedule.id, isPublic }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update sharing");
      }

      const updatedSchedule = {
        ...schedule,
        isPublic: data.isPublic,
      };
      updateScheduleInList(schedule.id, updatedSchedule);

      appToast.success(
        data.isPublic
          ? "Schedule sharing enabled"
          : "Schedule sharing disabled",
        {
          action: "scheduleShare",
          duration: 2000,
          icon: <Share2 className="h-5 w-5 text-success" />,
        },
      );
    } catch (err: unknown) {
      console.error("Error updating schedule sharing:", err);
      appToast.error(
        err instanceof Error ? err.message : "Failed to update sharing",
        {
          action: "scheduleShare",
          icon: <AlertCircle className="h-5 w-5 text-destructive" />,
        },
      );
    } finally {
      setSharingScheduleId(null);
    }
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
      appToast.error("You must be logged in to delete schedules", {
        action: "scheduleDelete",
        icon: <AlertCircle className="h-5 w-5 text-destructive" />,
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
      appToast.success("Schedule deleted", {
        action: "scheduleDelete",
        duration: 2000,
        icon: <Trash2 className="h-5 w-5 text-success" />,
      });
    } catch (err: unknown) {
      console.error("Error deleting schedule:", err);
      appToast.error(
        err instanceof Error ? err.message : "Failed to delete schedule",
        {
          action: "scheduleDelete",
          icon: <AlertCircle className="h-5 w-5 text-destructive" />,
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
        <div className="fixed left-0 right-0 z-50" style={{ top: topOffset }}>
          {/* Mobile Header Bar */}
          <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleMobileMenu}
                className="cursor-pointer rounded-md p-1.5 transition hover:bg-muted"
              >
                <Menu
                  size={22}
                  className={`transition-transform duration-300 ${
                    mobileMenuOpen ? "rotate-90" : ""
                  }`}
                />
              </button>
              <span className="font-figtree text-sm font-bold text-foreground">
                {activeSchedule?.name || draftScheduleName || "Schedules"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {user?.is_anonymous && (
                <Link href="/upgrade">
                  <Button
                    variant="outline"
                    size="sm"
                    className="cursor-pointer font-dmsans border-2 border-crimson font-bold text-crimson hover:bg-accent hover:text-crimson text-xs py-1 px-2 h-7"
                  >
                    <UserPlus className="h-3 w-3 mr-1" />
                    Sign Up
                  </Button>
                </Link>
              )}
              <Link
                href="/profile"
                className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
              >
                <User className="h-4 w-4" />
                <span className="font-figtree truncate max-w-20">
                  {user?.is_anonymous ? "Guest" : user?.email?.split("@")[0]}
                </span>
              </Link>
              <button
                type="button"
                aria-label="Open settings"
                onClick={() => setSettingsDialogOpen(true)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Settings className="h-4 w-4" />
              </button>
              <TooltipProvider>
                <Tooltip delayDuration={200}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="Sign out"
                      onClick={onSignOut}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Sign Out</TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
                  className="fixed inset-0 bg-foreground/50 z-40"
                  style={{ top: topOffset + 52 }}
                  onClick={toggleMobileMenu}
                />
                {/* Dropdown Panel */}
                <motion.div
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={mobileDropdownVariants}
                  className="relative z-50 overflow-hidden border-b border-border bg-card shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-4 max-h-[70vh] overflow-y-auto">
                    <h2 className="display mb-3 text-[22px]">Your Schedules</h2>

                    {/* Semester Section */}
                    <div className="mb-3">
                      <div className="form-label mb-2 flex items-center gap-2">
                        <ChevronDown className="h-4 w-4" />
                        <span>Spring 2026</span>
                      </div>

                      {/* New schedule input */}
                      <div className="pl-4">
                        <Label
                          htmlFor="mobile-schedule-name"
                          className="mb-1 font-dmsans text-xs text-muted-foreground"
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
                            className="h-9 flex-1 border border-border font-inter text-xs selection:bg-ballpoint placeholder:text-xs"
                          />
                          <Button
                            type="submit"
                            disabled={loading}
                            onClick={() => {
                              handleCreateSchedule(newScheduleName);
                              setMobileMenuOpen(false);
                            }}
                            className="h-9 cursor-pointer bg-primary px-3 font-dmsans text-xs text-primary-foreground hover:bg-primary/90"
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
                            <p className="py-2 text-xs text-muted-foreground">
                              No schedules found.
                            </p>
                          ) : (
                            <AnimatePresence initial={false}>
                              {visibleSchedules.map((schedule, index) => (
                                <motion.div
                                  key={
                                    schedule.id?.trim() ||
                                    `mobile-schedule-${index}-${schedule.name?.trim() || "untitled"}`
                                  }
                                  layout="position"
                                  initial="hidden"
                                  animate="visible"
                                  exit="exit"
                                  variants={scheduleItemVariants}
                                  className={`flex items-center justify-between rounded-lg text-sm font-inter ${
                                    activeSchedule?.id === schedule.id
                                      ? "bg-accent font-semibold"
                                      : "bg-muted hover:bg-accent"
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
                                        disabled={isRenamingSaving}
                                        className="h-8 flex-1 border-border bg-card text-xs disabled:opacity-50"
                                      />
                                      {isRenamingSaving ? (
                                        <Loader2 className="h-4 w-4 text-muted-foreground animate-spin shrink-0" />
                                      ) : (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleRenameSchedule(
                                                schedule.id,
                                                renameValue,
                                              )
                                            }
                                            className="cursor-pointer rounded p-1.5 transition hover:bg-accent"
                                          >
                                            <Check className="h-4 w-4 text-success" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={cancelRenaming}
                                            className="cursor-pointer rounded p-1.5 transition hover:bg-accent"
                                          >
                                            <X className="h-4 w-4 text-destructive" />
                                          </button>
                                        </>
                                      )}
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
                                        <span className="flex min-w-0 items-center gap-1.5">
                                          <span className="truncate">
                                            {schedule.name}
                                          </span>
                                          {schedule.isPublic && (
                                            <LinkIcon className="h-3.5 w-3.5 shrink-0 text-success" />
                                          )}
                                        </span>
                                      </button>
                                      <div className="flex items-center gap-1 pr-2">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleToggleShare(
                                              schedule,
                                              !schedule.isPublic,
                                            )
                                          }
                                          disabled={
                                            sharingScheduleId === schedule.id
                                          }
                                          className="cursor-pointer rounded p-1.5 transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                                          title={
                                            schedule.isPublic
                                              ? "Disable sharing"
                                              : "Enable sharing"
                                          }
                                        >
                                          {sharingScheduleId === schedule.id ? (
                                            <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                                          ) : (
                                            <Share2
                                              className={`h-4 w-4 ${
                                                schedule.isPublic
                                                  ? "text-success"
                                                  : "text-muted-foreground"
                                              }`}
                                            />
                                          )}
                                        </button>
                                        {schedule.isPublic && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              copyPublicScheduleLink(schedule)
                                            }
                                            className="cursor-pointer rounded p-1.5 transition hover:bg-accent"
                                            title="Copy share link"
                                          >
                                            <Copy className="h-4 w-4 text-muted-foreground" />
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          onClick={() =>
                                            startRenaming(schedule)
                                          }
                                          className="cursor-pointer rounded p-1.5 transition hover:bg-accent"
                                        >
                                          <Edit2 className="h-4 w-4 text-muted-foreground" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleDeleteSchedule(schedule.id)
                                          }
                                          className="cursor-pointer rounded p-1.5 transition hover:bg-accent"
                                        >
                                          <Trash2 className="h-4 w-4 text-destructive" />
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
            isSidebarWide ? "mr-[min(280px,25vw)]" : "mr-[70px]"
          } z-45 transition-all duration-300 ease-out`}
        >
          <div
            className={`sidebar flex flex-col justify-between fixed left-0 transition-all duration-300 ease-out ${
              isSidebarWide
                ? "min-w-[min(280px,25vw)] max-w-[min(280px,25vw)] border-r-2 border-crimson bg-card"
                : "bg-transparent min-w-[70px] max-w-[70px]"
            } overflow-hidden p-4 lg:p-5`}
            style={{ top: topOffset, height: `calc(100vh - ${topOffset}px)` }}
          >
            {/* Top section */}
            <div>
              <div className="buttons-container flex items-center justify-between mb-4 lg:mb-5">
                <button
                  type="button"
                  className={`p-2 rounded-xl transition-all duration-300 cursor-pointer ${
                    open ? "hover:bg-muted" : "hover:bg-muted"
                  }`}
                  onClick={toggleSidebar}
                >
                  <SidebarIcon
                    size={22}
                    className={`text-muted-foreground transition-transform duration-500 ease-out ${
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
                    className="flex flex-col h-full overflow-hidden w-[calc(min(280px,25vw)-2rem)] lg:w-[calc(min(280px,25vw)-2.5rem)] shrink-0"
                  >
                    <h1 className="display mb-3 text-[24px] lg:mb-4 lg:text-[28px]">
                      Your Schedules
                    </h1>

                    <Accordion
                      type="multiple"
                      defaultValue={["spring-2026"]}
                      className="font-figtree flex-1 overflow-hidden flex flex-col"
                    >
                      <AccordionItem
                        value="spring-2026"
                        className="border-b-0 flex flex-col flex-1 min-h-0"
                      >
                        <AccordionTrigger className="form-label shrink-0 py-2 text-[12.5px] transition-colors hover:cursor-pointer hover:bg-accent hover:no-underline">
                          Spring 2026
                        </AccordionTrigger>
                        <AccordionContent className="font-inter flex flex-col">
                          {/* New schedule input */}
                          <Label
                            htmlFor="schedule-name"
                            className="mb-1 shrink-0 font-dmsans text-xs text-muted-foreground lg:text-sm"
                          >
                            Make new schedule
                          </Label>
                          <div className="flex flex-row items-center justify-between gap-2 mb-3 lg:mb-4 shrink-0">
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
                              className="h-9 rounded-lg border border-border bg-card font-inter text-xs transition-colors placeholder:text-xs focus:border-ballpoint focus:ring-0"
                            />
                            <Button
                              type="submit"
                              disabled={loading}
                              onClick={() => {
                                handleCreateSchedule(newScheduleName);
                              }}
                              className="h-9 cursor-pointer rounded-lg bg-primary px-3 font-dmsans text-xs font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
                            >
                              {loading ? (
                                <Spinner className="h-3 w-3" />
                              ) : (
                                "Create"
                              )}
                            </Button>
                          </div>

                          {/* Schedule list with overflow indicator */}
                          <div className="relative flex-1 min-h-0">
                            <ul
                              ref={scheduleListRef}
                              className="list-none overflow-y-auto overflow-x-hidden scrollbar-hidden h-full"
                            >
                              {isLoadingSchedules ? (
                                <div className="flex items-center justify-center gap-2 py-6">
                                  <Spinner className="size-4 text-success" />
                                  <span className="text-xs text-muted-foreground">
                                    Loading...
                                  </span>
                                </div>
                              ) : userSchedules.length === 0 ? (
                                <p className="px-4 py-4 font-inter text-xs text-muted-foreground">
                                  No schedules found.
                                </p>
                              ) : (
                                <AnimatePresence initial={false}>
                                  {visibleSchedules.map((schedule, index) => (
                                    <motion.li
                                      key={
                                        schedule.id?.trim() ||
                                        `desktop-schedule-${index}-${schedule.name?.trim() || "untitled"}`
                                      }
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
                                      className="flex items-center my-0.5 px-1"
                                    >
                                      {renamingScheduleId === schedule.id ? (
                                        <div className="flex items-center gap-1 lg:gap-2 w-full px-2 py-1.5">
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
                                            disabled={isRenamingSaving}
                                            className="h-7 flex-1 border-border bg-card text-xs disabled:opacity-50"
                                          />
                                          {isRenamingSaving ? (
                                            <Loader2 className="h-4 w-4 text-muted-foreground animate-spin shrink-0" />
                                          ) : (
                                            <>
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  handleRenameSchedule(
                                                    schedule.id,
                                                    renameValue,
                                                  )
                                                }
                                                className="cursor-pointer rounded p-1 transition hover:bg-muted"
                                              >
                                                <Check className="h-4 w-4 text-success" />
                                              </button>
                                              <button
                                                type="button"
                                                onClick={cancelRenaming}
                                                className="cursor-pointer rounded p-1 transition hover:bg-muted"
                                              >
                                                <X className="h-4 w-4 text-destructive" />
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      ) : (
                                        <div
                                          className={`flex items-center w-full rounded-lg transition-colors duration-150 ${
                                            activeSchedule?.id === schedule.id
                                              ? "bg-muted"
                                              : "hover:bg-secondary"
                                          }`}
                                        >
                                          <span
                                            className={`ml-3 h-1.5 w-1.5 shrink-0 rounded-full ${
                                              activeSchedule?.id === schedule.id
                                                ? "bg-success"
                                                : ""
                                            }`}
                                          />
                                          <button
                                            type="button"
                                            className="flex-1 min-w-0 py-2 px-2 cursor-pointer text-left truncate"
                                            onClick={() => {
                                              loadSchedule(schedule.id);
                                              setActiveSemester(
                                                schedule.semester,
                                              );
                                            }}
                                          >
                                            <span className="flex min-w-0 items-center gap-1.5">
                                              <span
                                                className={`truncate font-dmsans text-xs ${
                                                  activeSchedule?.id ===
                                                  schedule.id
                                                    ? "font-semibold text-foreground"
                                                    : "text-muted-foreground"
                                                }`}
                                              >
                                                {schedule.name}
                                              </span>
                                              {schedule.isPublic && (
                                                <LinkIcon className="h-3 w-3 shrink-0 text-success" />
                                              )}
                                            </span>
                                          </button>
                                          {hoveredScheduleId === schedule.id ? (
                                            <Popover>
                                              <PopoverTrigger asChild>
                                                <button
                                                  type="button"
                                                  className="flex items-center z-50 cursor-pointer"
                                                >
                                                  <MoreHorizontal className="mr-2 h-4 w-4 text-muted-foreground" />
                                                </button>
                                              </PopoverTrigger>
                                              <PopoverContent className="w-fit rounded-md border border-border bg-card p-2">
                                                <div className="flex flex-col items-start justify-between gap-1 text-sm">
                                                  <div className="flex w-full items-center justify-between gap-4 rounded-md p-2 font-inter text-foreground">
                                                    <span className="flex items-center gap-2">
                                                      <Share2 className="h-4 w-4" />
                                                      Share
                                                    </span>
                                                    {sharingScheduleId ===
                                                    schedule.id ? (
                                                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                    ) : (
                                                      <Switch
                                                        checked={Boolean(
                                                          schedule.isPublic,
                                                        )}
                                                        onCheckedChange={(
                                                          checked,
                                                        ) =>
                                                          handleToggleShare(
                                                            schedule,
                                                            checked,
                                                          )
                                                        }
                                                      />
                                                    )}
                                                  </div>
                                                  {schedule.isPublic && (
                                                    <button
                                                      type="button"
                                                      className="flex w-full cursor-pointer flex-row items-center justify-start gap-2 rounded-md p-2 font-inter text-foreground transition hover:bg-muted"
                                                      onClick={() =>
                                                        copyPublicScheduleLink(
                                                          schedule,
                                                        )
                                                      }
                                                    >
                                                      <Copy className="h-4 w-4" />
                                                      Copy link
                                                    </button>
                                                  )}
                                                  <hr className="w-full border-t border-border" />
                                                  <button
                                                    type="button"
                                                    className="flex w-full cursor-pointer flex-row items-center justify-start gap-2 rounded-md p-2 font-inter text-foreground transition hover:bg-muted"
                                                    onClick={() =>
                                                      startRenaming(schedule)
                                                    }
                                                  >
                                                    <Edit2 className="h-4 w-4" />
                                                    Rename
                                                  </button>
                                                  <hr className="w-full border-t border-border" />
                                                  <button
                                                    type="button"
                                                    className="flex w-full cursor-pointer flex-row items-center justify-start gap-2 rounded-md p-2 font-inter text-destructive transition hover:bg-destructive"
                                                    onClick={() =>
                                                      handleDeleteSchedule(
                                                        schedule.id,
                                                      )
                                                    }
                                                  >
                                                    <Trash2 className="h-4 w-4" />
                                                    Delete
                                                  </button>
                                                </div>
                                              </PopoverContent>
                                            </Popover>
                                          ) : activeSchedule?.id ===
                                            schedule.id ? (
                                            <span className="form-label mr-3 shrink-0 text-[10.5px] text-ballpoint">
                                              Active
                                            </span>
                                          ) : null}
                                        </div>
                                      )}
                                    </motion.li>
                                  ))}
                                </AnimatePresence>
                              )}
                            </ul>
                            {showTopShadow && (
                              <div className="pointer-events-none absolute top-0 left-0 right-0 h-8 bg-linear-to-b from-white to-transparent" />
                            )}
                            {showBottomShadow && (
                              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-linear-to-t from-white to-transparent" />
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
            <div className="mt-4 flex w-full shrink-0 flex-col gap-3 border-t border-border pt-4">
              {/* Upgrade button for guest users */}
              <AnimatePresence initial={false}>
                {open && user?.is_anonymous && (
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={sidebarContentVariants}
                    className="w-full"
                  >
                    <Link href="/upgrade">
                      <Button
                        variant="outline"
                        className="w-full cursor-pointer font-dmsans border-2 border-crimson font-bold text-crimson hover:bg-accent hover:text-crimson text-xs lg:text-sm py-1.5 lg:py-2"
                      >
                        <UserPlus className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
                        Create Account
                      </Button>
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* User info — links to profile page */}
              <div
                className={`flex w-full flex-row items-center gap-1 ${
                  open ? "" : "justify-center"
                }`}
              >
                <Link
                  href="/profile"
                  className={`flex min-w-0 flex-row items-center gap-1.5 rounded-md px-1 py-1 transition-colors hover:bg-muted lg:gap-2 ${
                    open ? "flex-1 justify-start" : "shrink-0 justify-center"
                  }`}
                >
                  <User className="h-4 w-4 shrink-0 lg:h-5 lg:w-5" />
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={sidebarContentVariants}
                        key={user?.email || "guest"}
                        className="min-w-0 truncate font-figtree text-xs lg:text-sm"
                      >
                        {user?.is_anonymous ? "Guest" : user?.email}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Link>
                {open && (
                  <>
                    <button
                      type="button"
                      aria-label="Open settings"
                      onClick={() => setSettingsDialogOpen(true)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                    <TooltipProvider>
                      <Tooltip delayDuration={200}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            aria-label="Sign out"
                            onClick={onSignOut}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          >
                            <LogOut className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Sign Out</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <AppSettingsDialog
        open={settingsDialogOpen}
        onOpenChange={setSettingsDialogOpen}
      />

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog
        open={deletingScheduleId !== null}
        onOpenChange={(open) => !open && setDeletingScheduleId(null)}
      >
        <AlertDialogContent className="border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-figtree text-foreground">
              Delete Schedule?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-inter text-muted-foreground">
              This action cannot be undone. This will permanently delete this
              schedule from your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border bg-card font-dmsans text-foreground hover:bg-muted">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive/60 hover:bg-destructive/70 text-primary-foreground border-destructive font-dmsans"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
