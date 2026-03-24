"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCheck,
  Info,
  LogOut,
  Save,
  Trash2,
  Undo2,
  UserPlus,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import CalendarEditor from "@/components/CalendarEditor";
import ClassSearch from "@/components/ClassSearch";
import CurrentlySelected from "@/components/CurrentlySelected";
import PermutationBrowser from "@/components/PermutationBrowser";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import toastStyle from "@/components/ui/toastStyle";
import { useActiveSchedule } from "@/contexts/ActiveScheduleContext";
import { useAuth } from "@/contexts/AuthContext";
import { useScheduleBuilder } from "@/contexts/ScheduleBuilderContext";
import type { ClassSection } from "@/types";

export default function Builder() {
  const { user, session, loading, signOut } = useAuth();
  const {
    clearDraft,
    draftSchedule,
    setDraftSchedule,
    draftScheduleName,
    draftSemester,
    draftYear,
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
  const [creditHours, setCreditHours] = useState(0);
  const [isHydrated, setIsHydrated] = useState(false);
  const [showGuestBanner, _setShowGuestBanner] = useState(true);
  const calendarContainerRef = useRef<HTMLDivElement | null>(null);
  const [calendarHeight, setCalendarHeight] = useState(500);
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

  const schedulesMatch = areSchedulesEqual(
    activeSchedule?.classes,
    draftSchedule,
  );

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
      toast.success("Logged out successfully", {
        style: { ...toastStyle },
        duration: 2000,
        icon: <LogOut className="h-5 w-5 text-green-500" />,
      });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout", {
        style: { ...toastStyle },
        duration: 3000,
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      });
    }
  };

  const handleSaveSchedule = async () => {
    if (!session?.access_token) {
      toast.error("You must be logged in to save schedules", {
        style: { ...toastStyle },
        duration: 3000,
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      });
      return;
    }

    if (!draftScheduleName || !draftSemester || !draftYear) {
      toast.error("Please fill in schedule name, semester, and year", {
        style: { ...toastStyle },
        duration: 3000,
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      });
      return;
    }

    // if (draftSchedule.length === 0) {
    //   toast.error("Cannot save an empty schedule", {
    //     style: { ...toastStyle },
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
        isActive: true,
      };

      if (existingScheduleId) {
        // Update existing schedule
        updateScheduleInList(existingScheduleId, savedSchedule);
        toast.success("Schedule updated successfully!", {
          style: { ...toastStyle },
          duration: 3000,
          icon: <Check className="h-5 w-5 text-green-500" />,
        });
      } else {
        // Add new schedule
        addScheduleToList(savedSchedule);
        setIsEditingExisting(true);
        setExistingScheduleId(data.scheduleId);
        toast.success("Schedule saved successfully!", {
          style: { ...toastStyle },
          duration: 3000,
          icon: <Check className="h-5 w-5 text-green-500" />,
        });
      }

      // Show reminder for guest users after successful save
      if (isGuest) {
        setTimeout(() => {
          toast(
            <div className="flex flex-col gap-2">
              <p className="font-inter text-white text-xs lg:text-sm">
                Schedule saved! Create an account to keep it permanently.
              </p>
              <Link href="/upgrade">
                <Button
                  size="sm"
                  variant="secondary"
                  className="font-dmsans cursor-pointer text-xs px-3 py-1"
                  onClick={() => toast.dismiss()}
                >
                  <UserPlus className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                  Upgrade Account
                </Button>
              </Link>
            </div>,
            {
              style: { ...toastStyle },
              duration: 6000,
              icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
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
      toast.error(errorMessage, {
        style: { ...toastStyle },
        duration: 3000,
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearSchedule = () => {
    toast(
      <div className="flex flex-col gap-2">
        <p className="font-inter text-white text-xs lg:text-sm">
          Clear all classes from schedule?
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              clearDraft();
              toast.dismiss();
              toast.success("Schedule cleared", {
                style: { ...toastStyle },
                duration: 2000,
                icon: <Trash2 className="h-5 w-5 text-green-500" />,
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
            onClick={() => toast.dismiss()}
            className="font-dmsans cursor-pointer text-xs px-3 py-1"
          >
            <X className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
            Cancel
          </Button>
        </div>
      </div>,
      {
        style: { ...toastStyle },
        duration: Infinity,
        icon: <AlertCircle className="h-5 w-5 text-yellow-500" />,
      },
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl flex gap-2 items-center font-dmsans mb-2">
            <Spinner className="h-6 w-6" /> Loading...
          </h2>
          <p className="text-[#A8A8A8] font-inter">Please wait</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleRevertChanges = () => {
    if (!activeSchedule) {
      // No saved schedule to revert to - just clear the draft
      clearDraft();
      toast.info("Draft cleared", {
        style: { ...toastStyle },
        duration: 2000,
        icon: <Undo2 className="h-5 w-5 text-blue-400" />,
      });
      return;
    }

    // Revert to the last saved state from activeSchedule
    const savedClasses = activeSchedule.classes || [];
    setDraftSchedule(savedClasses);
    // Sync the permutation index to match the saved schedule
    syncPermutationIndex(savedClasses);
    toast.success("Reverted to last saved state", {
      style: { ...toastStyle },
      duration: 2000,
      icon: <Undo2 className="h-5 w-5 text-green-500" />,
    });
  };

  return (
    <div className="flex flex-col md:flex-row h-screen max-h-screen overflow-hidden bg-[#080808]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 p-2 lg:p-4 xl:p-6 overflow-y-auto pt-[60px] md:pt-2 lg:pt-4 xl:pt-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl lg:text-2xl xl:text-3xl font-figtree font-semibold mb-1">
                <span className="font-dmsans font-bold">
                  <span className="text-white">b</span>
                  <span className="text-red-500">l</span>
                  <span className="text-blue-600">d</span>
                  <span className="text-yellow-300">r</span>
                </span>{" "}
                Schedule Builder
              </h1>
              <p className="text-xs lg:text-sm text-[#A8A8A8] font-inter">
                Welcome back, {user.is_anonymous ? "Guest" : user.email}!
              </p>
            </div>
            <Button
              onClick={handleLogout}
              variant="secondary"
              className="font-dmsans cursor-pointer text-xs lg:text-sm px-3 lg:px-4 py-2"
            >
              Logout
            </Button>
          </div>
          <AnimatePresence>
            <motion.div
              key="beta-note"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mb-2 lg:mb-4 bg-blue-900/40 border mt-2 lg:mt-3 border-blue-600/50 rounded-lg p-2 lg:p-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Info className="h-3 w-3 lg:h-4 lg:w-4 text-white shrink-0" />
                <div>
                  <p className="text-blue-200 font-inter text-[10px] lg:text-xs">
                    <span className="font-figtree">
                      This app is still in{" "}
                      <span className="font-mono">beta</span>. We're
                      continuously improving!
                    </span>
                  </p>
                </div>
              </div>
            </motion.div>
            <div
              key="instructor-warning"
              className="mb-2 lg:mb-4 bg-orange-900/40 border border-orange-600/50 rounded-lg p-2 lg:p-3 flex items-start gap-2"
            >
              <AlertTriangle className="h-3 w-3 lg:h-4 lg:w-4 text-orange-400 shrink-0 mt-0.5" />
              <p className="text-orange-100 font-inter text-[10px] lg:text-xs">
                We are facing some difficulties fetching accurate Instructor and
                Room information for the classes. The data you see in the
                builder may not be accurate.
              </p>
            </div>
            {isGuest && showGuestBanner && (
              <motion.div
                key="guest-mode-warning"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="mb-2 lg:mb-4 bg-yellow-900/40 border border-yellow-600/50 rounded-lg p-2 lg:p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3 lg:h-4 lg:w-4 text-yellow-500 shrink-0" />
                  <div>
                    <p className="text-yellow-200 font-figtree text-[10px] lg:text-xs">
                      <span className="font-semibold">Guest mode.</span>{" "}
                      Schedules will be lost when you close this tab.{" "}
                      <Link
                        href="/upgrade"
                        className="underline hover:bg-yellow-900/20 rounded-sm font-medium"
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
              <div ref={calendarContainerRef} className="w-full">
                <CalendarEditor />
              </div>
              {activeSchedule && (
                <div className="w-full max-w-[98%] lg:max-w-[95%] xl:max-w-[1100px] flex items-center justify-between gap-2 mt-2 lg:mt-3">
                  <div className="flex-1 basis-0 text-[10px] lg:text-xs flex flex-wrap gap-1.5 lg:gap-2 items-center text-[#A8A8A8] font-inter justify-start">
                    <motion.div
                      layout
                      initial={false}
                      transition={{
                        layout: { duration: 0.22, ease: "easeOut" },
                      }}
                      className="bg-white text-gray-950 rounded-full py-0.5 lg:py-1 px-2 inline-flex items-center"
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
                          className="bg-green-800/50 border border-green-600/50 text-green-300 rounded-full py-0.5 lg:py-1 px-2 text-[10px] lg:text-xs"
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
                          className="rounded-full py-0.5 lg:py-1 px-2 text-yellow-200 bg-yellow-800/40 border border-yellow-600/50 text-[10px] lg:text-xs"
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
                      className="font-dmsans cursor-pointer text-[10px] lg:text-xs px-2 lg:px-3 py-1 lg:py-1.5 h-auto"
                      disabled={schedulesMatch || isSaving}
                    >
                      <Undo2 className="h-3 w-3 mr-0.5 lg:mr-1" />
                      <span className="hidden sm:inline">Undo</span>
                    </Button>
                    <Button
                      onClick={handleSaveSchedule}
                      className="font-dmsans cursor-pointer text-[10px] lg:text-xs px-2 lg:px-3 py-1 lg:py-1.5 h-auto"
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
                          <CheckCheck className="text-green-600 h-3 w-3" />
                          <span className="hidden sm:inline">Synced</span>
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleClearSchedule}
                      className="font-dmsans bg-destructive/60 hover:bg-destructive/70 text-white cursor-pointer text-[10px] lg:text-xs px-2 lg:px-3 py-1 lg:py-1.5 h-auto"
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
            <div className="flex items-start justify-center xl:justify-end">
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
                <TabsList className="relative isolate w-full bg-[#181818] border border-[#303030] rounded-t-lg rounded-b-none mb-0">
                  <TabsTrigger
                    value="search"
                    className="relative z-10 flex-1 bg-transparent border-transparent shadow-none text-xs lg:text-sm font-figtree text-[#A8A8A8] data-[state=active]:text-green-400 dark:data-[state=active]:text-green-400 data-[state=active]:bg-transparent dark:data-[state=active]:bg-transparent data-[state=active]:border-transparent dark:data-[state=active]:border-transparent data-[state=active]:shadow-none"
                  >
                    {activeTab === "search" && (
                      <motion.span
                        layoutId="builder-active-tab-pill"
                        transition={{
                          type: "spring",
                          stiffness: 420,
                          damping: 34,
                        }}
                        className="absolute inset-0 rounded-md bg-[#2b2b2b]"
                      />
                    )}
                    <span className="relative z-10">Search</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="selected"
                    className="relative z-10 flex-1 bg-transparent border-transparent shadow-none text-xs lg:text-sm font-figtree text-[#A8A8A8] data-[state=active]:text-purple-400 dark:data-[state=active]:text-purple-400 data-[state=active]:bg-transparent dark:data-[state=active]:bg-transparent data-[state=active]:border-transparent dark:data-[state=active]:border-transparent data-[state=active]:shadow-none"
                  >
                    {activeTab === "selected" && (
                      <motion.span
                        layoutId="builder-active-tab-pill"
                        transition={{
                          type: "spring",
                          stiffness: 420,
                          damping: 34,
                        }}
                        className="absolute inset-0 rounded-md bg-[#2b2b2b]"
                      />
                    )}
                    <span className="relative z-10 inline-flex items-center gap-1.5">
                      <span>Selected</span>
                      {draftSchedule.length > 0 && (
                        <span className="inline-flex h-4 min-w-4 items-center justify-center bg-purple-900/60 text-purple-300 border border-purple-700/50 rounded-full text-[10px] px-1.5 leading-none">
                          {draftSchedule.length}
                        </span>
                      )}
                    </span>
                  </TabsTrigger>
                </TabsList>
                <TabsContent value={activeTab} className="mt-0 min-h-0 overflow-hidden">
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
  );
}
