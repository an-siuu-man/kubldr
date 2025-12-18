"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useScheduleBuilder } from "@/contexts/ScheduleBuilderContext";
import { useActiveSchedule } from "@/contexts/ActiveScheduleContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  LogOut,
  AlertCircle,
  Trash2,
  X,
  Check,
  Save,
  CheckCheck,
  AlertTriangle,
  UserPlus,
  Info,
  Undo2,
} from "lucide-react";
import toastStyle from "@/components/ui/toastStyle";
import ClassSearch from "@/components/ClassSearch";
import { Sidebar } from "@/components/Sidebar";
import CalendarEditor from "@/components/CalendarEditor";
import PermutationBrowser from "@/components/PermutationBrowser";
import { Spinner } from "@/components/ui/spinner";
import Link from "next/link";

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
  const [showGuestBanner, setShowGuestBanner] = useState(true);

  // Check if user is a guest (anonymous)
  const isGuest = user?.is_anonymous === true;

  // Helper to compare schedules regardless of order
  const areSchedulesEqual = (a: any[] | undefined, b: any[] | undefined) => {
    if (!a && !b) return true;
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    const uuidsA = new Set(a.map((cls: any) => cls.uuid));
    const uuidsB = new Set(b.map((cls: any) => cls.uuid));
    if (uuidsA.size !== uuidsB.size) return false;
    for (const uuid of uuidsA) {
      if (!uuidsB.has(uuid)) return false;
    }
    return true;
  };

  const schedulesMatch = areSchedulesEqual(
    activeSchedule?.classes,
    draftSchedule
  );

  // Hydration check - ensures localStorage data is loaded
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
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
        icon: <LogOut className="h-5 w-5" />,
      });
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout", {
        style: { ...toastStyle },
        duration: 3000,
        icon: <AlertCircle className="h-5 w-5" />,
      });
    }
  };

  const handleSaveSchedule = async () => {
    if (!session?.access_token) {
      toast.error("You must be logged in to save schedules", {
        style: { ...toastStyle },
        duration: 3000,
        icon: <AlertCircle className="h-5 w-5" />,
      });
      return;
    }

    if (!draftScheduleName || !draftSemester || !draftYear) {
      toast.error("Please fill in schedule name, semester, and year", {
        style: { ...toastStyle },
        duration: 3000,
        icon: <AlertCircle className="h-5 w-5" />,
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
            }
          );
        }, 500);
      }

      // Refresh the schedule list
      await fetchUserSchedules();
    } catch (error: any) {
      console.error("Save schedule error:", error);
      toast.error(error.message || "Failed to save schedule", {
        style: { ...toastStyle },
        duration: 3000,
        icon: <AlertCircle className="h-5 w-5" />,
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
                icon: <Trash2 className="h-5 w-5" />,
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
      }
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
        icon: <Undo2 className="h-5 w-5" />,
      });
      return;
    }

    // Revert to the last saved state from activeSchedule
    setDraftSchedule(activeSchedule.classes || []);
    toast.success("Reverted to last saved state", {
      style: { ...toastStyle },
      duration: 2000,
      icon: <Undo2 className="h-5 w-5" />,
    });
  };

  return (
    <div className="flex min-h-screen bg-[#080808]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 p-4 lg:p-6 xl:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Guest Warning Banner */}

          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl lg:text-3xl xl:text-4xl font-figtree font-semibold mb-2">
                <span className="font-dmsans font-bold">
                  <span className="text-white">b</span>
                  <span className="text-red-500">l</span>
                  <span className="text-blue-600">d</span>
                  <span className="text-yellow-300">r</span>
                </span>{" "}
                Schedule Builder
              </h1>
              <p className="text-sm lg:text-base text-[#A8A8A8] font-inter">
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
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mb-6 bg-blue-900/40 border mt-4 border-blue-600/50 rounded-lg p-3 lg:p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-2 lg:gap-3">
                <Info className="h-4 w-4 lg:h-5 lg:w-5 text-white shrink-0" />
                <div>
                  <p className="text-blue-200 font-inter text-xs lg:text-sm">
                    <span className="font-figtree">
                      Please note that this app is still in{" "}
                      <span className="font-mono">beta</span>. We will be
                      continuously improving the experience and adding new
                      features, so kindly bear with us!
                    </span>{" "}
                  </p>
                </div>
              </div>
            </motion.div>
            {isGuest && showGuestBanner && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="mb-6 bg-yellow-900/40 border border-yellow-600/50 rounded-lg p-3 lg:p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-2 lg:gap-3">
                  <AlertTriangle className="h-4 w-4 lg:h-5 lg:w-5 text-yellow-500 shrink-0" />
                  <div>
                    <p className="text-yellow-200 font-figtree text-xs lg:text-sm">
                      <span className="font-semibold">
                        You're using guest mode.
                      </span>{" "}
                      Your schedules will be lost when you close this tab.{" "}
                      <Link
                        href="/upgrade"
                        className="underline hover:text-yellow-100 font-medium"
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
          <div className="grid grid-cols-1 xl:grid-cols-[3fr_7fr] gap-4 lg:gap-6">
            {/* Class Search Section */}
            <div className="flex justify-center items-start">
              <ClassSearch />
            </div>

            {/* Calendar Section */}
            <div className="flex flex-col items-end">
              <CalendarEditor />
              {activeSchedule && (
                <div className="w-full flex flex-row justify-between gap-3 mt-4">
                  <div className="text-xs lg:text-sm flex gap-2 items-center text-[#A8A8A8] font-inter">
                    <motion.div
                      layout
                      initial={false}
                      transition={{
                        layout: { duration: 0.22, ease: "easeOut" },
                      }}
                      className="bg-white text-gray-950 rounded-full py-1 px-2 lg:px-3 inline-flex items-center"
                    >
                      <span className="md:whitespace-nowrap text-xs lg:text-sm">
                        Total Credit Hours:
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
                          className="bg-green-800/50 border border-green-600/50 text-green-300 rounded-full py-1 px-2 lg:px-3 text-xs lg:text-sm"
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
                          className="rounded-full py-1 px-2 text-yellow-200 bg-yellow-800/40 border border-yellow-600/50 text-xs lg:text-sm"
                        >
                          Unsaved
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  {/* Permutation Browser - appears when multiple combinations are available */}
                  <div className="w-full flex justify-center my-2">
                    <PermutationBrowser />
                  </div>
                  <div className="flex flex-col md:flex-row items-center gap-2 w-full md:w-auto md:justify-end">
                    <Button
                      onClick={handleRevertChanges}
                      className="font-dmsans cursor-pointer w-full md:w-auto max-w-[600px] text-xs lg:text-sm px-3 lg:px-4 py-2"
                      disabled={schedulesMatch}
                    >
                      <Undo2 className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
                      Undo
                    </Button>
                    <Button
                      onClick={handleSaveSchedule}
                      className="font-dmsans cursor-pointer w-full md:w-auto max-w-[600px] text-xs lg:text-sm px-3 lg:px-4 py-2"
                      disabled={isSaving || schedulesMatch}
                    >
                      {isSaving ? (
                        <>
                          <Spinner />
                          Saving...
                        </>
                      ) : (
                        <>
                          {!schedulesMatch ? (
                            <>
                              <Save className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
                              Save
                            </>
                          ) : (
                            <>
                              <CheckCheck className="text-green-600" />
                              Synced
                            </>
                          )}
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleClearSchedule}
                      className="font-dmsans bg-destructive/60 hover:bg-destructive/70 text-white cursor-pointer w-full md:w-auto max-w-[600px] text-xs lg:text-sm px-3 lg:px-4 py-2"
                      disabled={draftSchedule.length === 0}
                    >
                      <Trash2 className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
                      Clear
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
