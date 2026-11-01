"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCheck,
  Copy,
  Loader2,
  LogOut,
  Save,
  Share2,
  Trash2,
  Undo2,
  UserPlus,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import CalendarEditor from "@/components/CalendarEditor";
import ClassSearch from "@/components/ClassSearch";
import CurrentlySelected from "@/components/CurrentlySelected";
import PermutationBrowser from "@/components/PermutationBrowser";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import type { BusyBlock, ClassSection } from "@/types";

export default function Builder() {
  const { user, session, loading, signOut } = useAuth();
  const appToast = useAppToast();
  const {
    clearDraft,
    draftSchedule,
    setDraftSchedule,
    draftScheduleName,
    draftSemester,
    draftYear,
    draftBusyBlocks,
    setDraftBusyBlocks,
    existingScheduleId,
    setIsEditingExisting,
    setExistingScheduleId,
    syncPermutationIndex,
  } = useScheduleBuilder();
  const {
    activeSchedule,
    addScheduleToList,
    updateScheduleInList,
    fetchUserSchedules,
  } = useActiveSchedule();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isTogglingShare, setIsTogglingShare] = useState(false);
  const [creditHours, setCreditHours] = useState(0);
  const [isHydrated, setIsHydrated] = useState(false);
  const [showGuestBanner, _setShowGuestBanner] = useState(true);
  const calendarContainerRef = useRef<HTMLDivElement | null>(null);
  const [calendarHeight, setCalendarHeight] = useState(500);
  const bannerRef = useRef<HTMLDivElement | null>(null);
  const [bannerHeight, setBannerHeight] = useState(40);
  const [activeTab, setActiveTab] = useState<"search" | "selected">("search");

  // Check if user is a guest (anonymous)
  const isGuest = user?.is_anonymous === true;

  // Helper to compare schedules regardless of order
  const areSchedulesEqual = (
    a: ClassSection[] | undefined,
    b: ClassSection[] | undefined,
  ) => {
    if (!a && !b) return true;
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    const uuidsA = new Set(a.map((cls) => cls.uuid));
    const uuidsB = new Set(b.map((cls) => cls.uuid));
    if (uuidsA.size !== uuidsB.size) return false;
    for (const uuid of uuidsA) {
      if (!uuidsB.has(uuid)) return false;
    }
    return true;
  };

  // Compare busy blocks by content (day/time/label) rather than uuid, since
  // draft blocks carry temporary ids until the schedule is saved.
  const areBusyBlocksEqual = (
    a: BusyBlock[] | undefined,
    b: BusyBlock[] | undefined,
  ) => {
    const key = (block: BusyBlock) =>
      `${block.day}|${block.starttime}|${block.endtime}|${block.label}`;
    const keysA = (a ?? []).map(key).sort();
    const keysB = (b ?? []).map(key).sort();
    if (keysA.length !== keysB.length) return false;
    return keysA.every((k, i) => k === keysB[i]);
  };

  const schedulesMatch =
    areSchedulesEqual(activeSchedule?.classes, draftSchedule) &&
    areBusyBlocksEqual(activeSchedule?.busyBlocks, draftBusyBlocks);

  // Hydration check - ensures localStorage data is loaded
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    const calendarContainer = calendarContainerRef.current;
    if (!calendarContainer) return;

    const updateHeight = () => {
      const nextHeight = Math.round(
        calendarContainer.getBoundingClientRect().height,
      );
      if (nextHeight > 0) {
        setCalendarHeight(nextHeight);
      }
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(calendarContainer);
    return () => resizeObserver.disconnect();
  }, []);

  // Measure the instructor-warning banner so the sidebar's fixed panels and
  // the page's own height can leave exactly enough room for it.
  useEffect(() => {
    const bannerEl = bannerRef.current;
    if (!bannerEl) return;

    const updateBannerHeight = () => {
      const nextHeight = Math.round(bannerEl.getBoundingClientRect().height);
      if (nextHeight > 0) {
        setBannerHeight(nextHeight);
      }
    };

    updateBannerHeight();

    const resizeObserver = new ResizeObserver(updateBannerHeight);
    resizeObserver.observe(bannerEl);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Calculate credit hours after hydration and when draftSchedule changes
  useEffect(() => {
    if (!isHydrated) return;

    if (draftSchedule.length > 0) {
      // Use exactly one section per class (dept + code combination) for credit hours
      const seenClasses = new Set<string>();
      let totalCreditHours = 0;

      for (const cls of draftSchedule) {
        const classKey = `${cls.dept}-${cls.code}`;
        if (!seenClasses.has(classKey)) {
          seenClasses.add(classKey);
          totalCreditHours += Number(cls.credithours) || 0;
        }
      }

      setCreditHours(totalCreditHours);
    } else {
      setCreditHours(0);
    }
  }, [draftSchedule, isHydrated]);

  const handleLogout = async () => {
    try {
      await signOut();
      appToast.success("Logged out successfully", {
        action: "auth",
        duration: 2000,
        icon: <LogOut className="h-5 w-5 text-success" />,
      });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      appToast.error("Failed to logout", {
        action: "auth",
        duration: 3000,
        icon: <AlertCircle className="h-5 w-5 text-destructive" />,
      });
    }
  };

  const handleSaveSchedule = async () => {
    if (!session?.access_token) {
      appToast.error("You must be logged in to save schedules", {
        action: "scheduleSave",
        duration: 3000,
        icon: <AlertCircle className="h-5 w-5 text-destructive" />,
      });
      return;
    }

    if (!draftScheduleName || !draftSemester || !draftYear) {
      appToast.error("Please fill in schedule name, semester, and year", {
        action: "scheduleSave",
        duration: 3000,
        icon: <AlertCircle className="h-5 w-5 text-destructive" />,
      });
      return;
    }

    // if (draftSchedule.length === 0) {
    //   appToast.error("Cannot save an empty schedule", {
    //     action: "scheduleSave",
    //     duration: 3000,
    //     icon: <AlertCircle className="h-5 w-5" />,
    //   });
    //   return;
    // }

    setIsSaving(true);

    try {
      const response = await fetch("/api/saveSchedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          scheduleId: existingScheduleId,
          name: draftScheduleName,
          semester: draftSemester,
          year: draftYear,
          classes: draftSchedule,
          busyBlocks: draftBusyBlocks,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save schedule");
      }

      // Update context with saved schedule
      const savedSchedule = {
        id: data.scheduleId,
        name: draftScheduleName,
        semester: draftSemester,
        year: draftYear,
        classes: draftSchedule,
        busyBlocks: draftBusyBlocks,
        isActive: true,
        isPublic:
          existingScheduleId && activeSchedule?.id === existingScheduleId
            ? (activeSchedule?.isPublic ?? false)
            : false,
      };

      if (existingScheduleId) {
        // Update existing schedule
        updateScheduleInList(existingScheduleId, savedSchedule);
        appToast.success("Schedule updated successfully!", {
          action: "scheduleSave",
          duration: 3000,
          icon: <Check className="h-5 w-5 text-success" />,
        });
      } else {
        // Add new schedule
        addScheduleToList(savedSchedule);
        setIsEditingExisting(true);
        setExistingScheduleId(data.scheduleId);
        appToast.success("Schedule saved successfully!", {
          action: "scheduleSave",
          duration: 3000,
          icon: <Check className="h-5 w-5 text-success" />,
        });
      }

      // Show reminder for guest users after successful save
      if (isGuest) {
        setTimeout(() => {
          appToast.custom(
            <div className="flex flex-col gap-2">
              <p className="font-inter text-xs text-foreground lg:text-sm">
                Schedule saved! Create an account to keep it permanently.
              </p>
              <Link href="/upgrade">
                <Button
                  size="sm"
                  variant="secondary"
                  className="font-dmsans cursor-pointer text-xs px-3 py-1"
                  onClick={() => appToast.dismiss()}
                >
                  <UserPlus className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                  Upgrade Account
                </Button>
              </Link>
            </div>,
            {
              type: "warning",
              action: "account",
              duration: 6000,
              icon: <AlertTriangle className="h-5 w-5 text-warning" />,
            },
          );
        }, 500);
      }

      // Refresh the schedule list
      await fetchUserSchedules();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save schedule";
      console.error("Save schedule error:", error);
      appToast.error(errorMessage, {
        action: "scheduleSave",
        duration: 3000,
        icon: <AlertCircle className="h-5 w-5 text-destructive" />,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearSchedule = () => {
    appToast.custom(
      <div className="flex flex-col gap-2">
        <p className="font-inter text-xs text-foreground lg:text-sm">
          Clear all classes from schedule?
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              clearDraft();
              appToast.dismiss();
              appToast.success("Schedule cleared", {
                action: "scheduleClear",
                duration: 2000,
                icon: <Trash2 className="h-5 w-5 text-success" />,
              });
            }}
            className="font-dmsans cursor-pointer text-xs px-3 py-1"
          >
            <Check className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
            Confirm
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => appToast.dismiss()}
            className="font-dmsans cursor-pointer text-xs px-3 py-1"
          >
            <X className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
            Cancel
          </Button>
        </div>
      </div>,
      {
        type: "warning",
        action: "scheduleClear",
        duration: Infinity,
        icon: <AlertCircle className="h-5 w-5 text-warning" />,
      },
    );
  };

  const getPublicScheduleUrl = (scheduleId: string) => {
    if (typeof window === "undefined") return `/s/${scheduleId}`;
    return `${window.location.origin}/s/${scheduleId}`;
  };

  const handleToggleShare = async () => {
    const scheduleId = existingScheduleId || activeSchedule?.id;
    if (!scheduleId || !session?.access_token) {
      appToast.error("Save your schedule before sharing it", {
        action: "scheduleShare",
        duration: 3000,
        icon: <AlertCircle className="h-5 w-5 text-destructive" />,
      });
      return;
    }

    const nextIsPublic = !activeSchedule?.isPublic;
    setIsTogglingShare(true);
    try {
      const res = await fetch("/api/shareSchedule", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ scheduleId, isPublic: nextIsPublic }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update sharing");
      }

      if (activeSchedule) {
        updateScheduleInList(activeSchedule.id, {
          ...activeSchedule,
          isPublic: data.isPublic,
        });
      }

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
      setIsTogglingShare(false);
    }
  };

  const handleCopyShareLink = async () => {
    const scheduleId = existingScheduleId || activeSchedule?.id;
    if (!scheduleId) return;
    try {
      await navigator.clipboard.writeText(getPublicScheduleUrl(scheduleId));
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl flex gap-2 items-center font-dmsans mb-2">
            <Spinner className="h-6 w-6" /> Loading...
          </h2>
          <p className="font-inter text-muted-foreground">Please wait</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Rendered above both the calendar and the tabbed side panel so the two
  // stay height-aligned — see the invisible spacer clone above <Tabs>.
  const shareControls = activeSchedule && (
    <>
      <Button
        onClick={handleToggleShare}
        disabled={
          isTogglingShare || draftSchedule.length === 0 || !schedulesMatch
        }
        className={`h-auto cursor-pointer px-2 py-1 font-dmsans text-[10px] lg:px-3 lg:py-1.5 lg:text-xs ${
          activeSchedule.isPublic
            ? "bg-destructive/60 text-primary-foreground hover:bg-destructive/70"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        }`}
      >
        {isTogglingShare ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Share2 className="h-3 w-3 mr-0.5 lg:mr-1" />
        )}
        <span className="hidden sm:inline">
          {activeSchedule.isPublic ? "Stop Sharing" : "Share"}
        </span>
      </Button>
      {activeSchedule.isPublic && (
        <TooltipProvider>
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="Copy share link"
                onClick={handleCopyShareLink}
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md bg-primary text-primary-foreground transition-colors hover:bg-primary/90 lg:h-8 lg:w-8"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Copy share link</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </>
  );

  const handleRevertChanges = () => {
    if (!activeSchedule) {
      // No saved schedule to revert to - just clear the draft
      clearDraft();
      appToast.info("Draft cleared", {
        action: "scheduleClear",
        duration: 2000,
        icon: <Undo2 className="h-5 w-5 text-ballpoint" />,
      });
      return;
    }

    // Revert to the last saved state from activeSchedule
    const savedClasses = activeSchedule.classes || [];
    setDraftSchedule(savedClasses);
    setDraftBusyBlocks(activeSchedule.busyBlocks || []);
    // Sync the permutation index to match the saved schedule
    syncPermutationIndex(savedClasses);
    appToast.success("Reverted to last saved state", {
      action: "scheduleClear",
      duration: 2000,
      icon: <Undo2 className="h-5 w-5 text-success" />,
    });
  };

  return (
    <>
      {/* Instructor data warning — full-viewport-width banner pinned to the
          absolute top of the screen, above the sidebar and page content. */}
      <motion.div
        ref={bannerRef}
        initial={{ y: "-100%" }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-center justify-center gap-2 border-b-2 border-crimson bg-canary px-4 py-2 text-center"
      >
        <AlertTriangle className="h-3 w-3 lg:h-4 lg:w-4 text-crimson shrink-0" />
        <p className="text-[11px] text-foreground lg:text-[13px]">
          The University of Kansas now requires the user to be logged in with
          SSO to access instructor and location info for classes. We have to
          respect that decision. To see that info, check out{" "}
          <Link
            href="https://classes.ku.edu"
            target="_blank"
            className="font-bold text-crimson underline underline-offset-2"
          >
            classes.ku.edu
          </Link>
        </p>
      </motion.div>

      <div
        className="flex flex-col overflow-hidden bg-background md:flex-row"
        style={{ height: `calc(100vh - ${bannerHeight}px)` }}
      >
        {/* Sidebar */}
        <Sidebar onSignOut={handleLogout} topOffset={bannerHeight} />

        {/* Main Content */}
        <div className="flex-1 p-2 lg:p-4 xl:p-6 overflow-y-auto pt-[60px] md:pt-2 lg:pt-4 xl:pt-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="display mb-1 text-[clamp(1.5rem,2.4vw,2.25rem)]">
                  Schedule builder
                </h1>
                <p className="font-inter text-xs text-muted-foreground lg:text-sm">
                  Welcome back, {user.is_anonymous ? "Guest" : user.email}!
                </p>
              </div>
            </div>
            <AnimatePresence>
              {isGuest && showGuestBanner && (
                <motion.div
                  key="guest-mode-warning"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="mb-2 mt-3 flex items-center justify-between border-2 border-crimson bg-canary p-2 lg:mb-4 lg:p-3"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 lg:h-4 lg:w-4 text-crimson shrink-0" />
                    <div>
                      <p className="text-[11px] text-foreground lg:text-sm">
                        <span className="font-semibold">Guest mode.</span>{" "}
                        Schedules will be lost when you close this tab.{" "}
                        <Link
                          href="/upgrade"
                          className="font-bold text-crimson underline underline-offset-2"
                        >
                          Create an account
                        </Link>{" "}
                        to save them permanently.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_minmax(280px,380px)] gap-2 lg:gap-4">
              {/* Calendar Section */}
              <div className="flex flex-col items-center w-full">
                {activeSchedule && (
                  <div className="mb-1.5 flex w-full justify-end gap-1.5 lg:mb-2 lg:gap-2">
                    {shareControls}
                  </div>
                )}
                <div ref={calendarContainerRef} className="w-full">
                  <CalendarEditor />
                </div>
                {activeSchedule && (
                  <div className="mt-2 flex w-full max-w-[98%] flex-wrap items-center justify-between gap-2 lg:mt-3 lg:max-w-[95%] xl:max-w-[1100px] xl:flex-nowrap">
                    <div className="flex flex-1 basis-0 flex-wrap items-center justify-start gap-1.5 font-inter text-[10px] text-muted-foreground lg:gap-2 lg:text-xs">
                      <motion.div
                        layout
                        initial={false}
                        transition={{
                          layout: { duration: 0.22, ease: "easeOut" },
                        }}
                        className="inline-flex items-center border border-rule-strong bg-card px-2 py-0.5 text-foreground lg:py-1"
                      >
                        <span className="whitespace-nowrap text-[10px] lg:text-xs">
                          Credits:
                        </span>
                        <b className="ml-1">{creditHours}</b>
                      </motion.div>

                      <AnimatePresence mode="wait">
                        {schedulesMatch && (
                          <motion.div
                            key="saved-badge"
                            initial={{ opacity: 0, y: -6, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 6, scale: 0.98 }}
                            transition={{ duration: 0.22 }}
                            className="border-2 border-success px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.06em] text-success [font-stretch:80%] lg:py-1 lg:text-xs"
                          >
                            Saved
                          </motion.div>
                        )}

                        {!schedulesMatch && (
                          <motion.div
                            key="unsaved-badge"
                            initial={{ opacity: 0, y: -6, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 6, scale: 0.98 }}
                            transition={{ duration: 0.22 }}
                            className="border-2 border-crimson px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.06em] text-crimson [font-stretch:80%] lg:py-1 lg:text-xs"
                          >
                            Unsaved
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    {/* Permutation Browser - appears when multiple combinations are available */}
                    <div className="flex-1 basis-0 flex justify-center">
                      <PermutationBrowser />
                    </div>
                    <div className="flex-1 basis-0 flex flex-row items-center gap-1.5 lg:gap-2 justify-end">
                      <Button
                        onClick={handleRevertChanges}
                        className="h-auto cursor-pointer bg-primary px-2 py-1 font-dmsans text-[10px] text-primary-foreground hover:bg-primary/90 lg:px-3 lg:py-1.5 lg:text-xs"
                        disabled={schedulesMatch || isSaving}
                      >
                        <Undo2 className="h-3 w-3 mr-0.5 lg:mr-1" />
                        <span className="hidden sm:inline">Undo</span>
                      </Button>
                      <Button
                        onClick={handleSaveSchedule}
                        className="h-auto cursor-pointer bg-primary px-2 py-1 font-dmsans text-[10px] text-primary-foreground hover:bg-primary/90 lg:px-3 lg:py-1.5 lg:text-xs"
                        disabled={isSaving || schedulesMatch}
                      >
                        {isSaving ? (
                          <>
                            <Spinner className="h-3 w-3" />
                            <span className="hidden sm:inline">Saving...</span>
                          </>
                        ) : !schedulesMatch ? (
                          <>
                            <Save className="h-3 w-3 mr-0.5 lg:mr-1" />
                            <span className="hidden sm:inline">Save</span>
                          </>
                        ) : (
                          <>
                            <CheckCheck className="text-success h-3 w-3" />
                            <span className="hidden sm:inline">Synced</span>
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={handleClearSchedule}
                        className="font-dmsans bg-destructive/60 hover:bg-destructive/70 text-primary-foreground cursor-pointer text-[10px] lg:text-xs px-2 lg:px-3 py-1 lg:py-1.5 h-auto"
                        disabled={draftSchedule.length === 0}
                      >
                        <Trash2 className="h-3 w-3 mr-0.5 lg:mr-1" />
                        <span className="hidden sm:inline">Clear</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Tabbed Side Panel: Search + Currently Selected */}
              <div className="flex flex-col items-center xl:items-end w-full">
                {activeSchedule && (
                  <div
                    aria-hidden="true"
                    className="invisible mb-1.5 flex w-full justify-end gap-1.5 lg:mb-2 lg:gap-2"
                  >
                    {shareControls}
                  </div>
                )}
                <Tabs
                  value={activeTab}
                  onValueChange={(value) => {
                    if (value === "search" || value === "selected") {
                      setActiveTab(value);
                    }
                  }}
                  className="w-[280px] sm:w-[300px] md:w-[320px] lg:w-[360px] xl:w-[380px] flex flex-col gap-0 overflow-hidden"
                  style={{ height: `${calendarHeight}px` }}
                >
                  <TabsList className="relative isolate mb-0 h-11 w-full rounded-none border-2 border-b-0 border-crimson bg-secondary p-1">
                    <TabsTrigger
                      value="search"
                      className="relative z-10 flex-1 border-transparent bg-transparent text-[12px] font-bold uppercase tracking-[0.06em] text-muted-foreground shadow-none [font-stretch:80%] data-[state=active]:border-transparent data-[state=active]:bg-transparent data-[state=active]:text-crimson data-[state=active]:shadow-none lg:text-sm"
                    >
                      {activeTab === "search" && (
                        <motion.span
                          layoutId="builder-active-tab-pill"
                          transition={{
                            type: "spring",
                            stiffness: 420,
                            damping: 34,
                          }}
                          className="absolute inset-0 border-b-2 border-crimson bg-card"
                        />
                      )}
                      <span className="relative z-10">Search</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="selected"
                      className="relative z-10 flex-1 border-transparent bg-transparent text-[12px] font-bold uppercase tracking-[0.06em] text-muted-foreground shadow-none [font-stretch:80%] data-[state=active]:border-transparent data-[state=active]:bg-transparent data-[state=active]:text-crimson data-[state=active]:shadow-none lg:text-sm"
                    >
                      {activeTab === "selected" && (
                        <motion.span
                          layoutId="builder-active-tab-pill"
                          transition={{
                            type: "spring",
                            stiffness: 420,
                            damping: 34,
                          }}
                          className="absolute inset-0 border-b-2 border-crimson bg-card"
                        />
                      )}
                      <span className="relative z-10 inline-flex items-center gap-1.5">
                        <span>Selected</span>
                        {draftSchedule.length > 0 && (
                          <span className="inline-flex h-4 min-w-4 items-center justify-center bg-crimson px-1.5 text-[10px] leading-none text-primary-foreground tabular-nums">
                            {draftSchedule.length}
                          </span>
                        )}
                      </span>
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent
                    value={activeTab}
                    className="mt-0 min-h-0 overflow-hidden"
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={activeTab}
                        initial={{ y: 18, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -8, opacity: 0 }}
                        transition={{ duration: 0.24, ease: "easeOut" }}
                        className="h-full"
                      >
                        {activeTab === "search" ? (
                          <ClassSearch />
                        ) : (
                          <CurrentlySelected />
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
