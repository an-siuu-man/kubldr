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
import CurrentlySelected from "@/components/CurrentlySelected";
import { Spinner } from "@/components/ui/spinner";
import Link from "next/link";
import MaintenanceBanner from "@/components/MaintenanceBanner";

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
    draftSchedule,
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
            },
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
        icon: <Undo2 className="h-5 w-5" />,
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
      icon: <Undo2 className="h-5 w-5" />,
    });
  };

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-[#080808]">
      <MaintenanceBanner />
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-6 text-center px-4">
          <h1 className="text-2xl lg:text-3xl font-figtree font-semibold">
            <span className="font-dmsans font-bold">
              <span className="text-white">b</span>
              <span className="text-red-500">l</span>
              <span className="text-blue-600">d</span>
              <span className="text-yellow-300">r</span>
            </span>{" "}
            is under maintenance
          </h1>
          <p className="text-sm text-[#A8A8A8] font-inter max-w-md">
            We are solving the issues with full diligence and apologize for any
            inconvenience. You will not be able to create or update schedules at
            this time.
          </p>
          <Button
            onClick={handleLogout}
            variant="secondary"
            className="font-dmsans cursor-pointer text-sm px-6 py-2"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
