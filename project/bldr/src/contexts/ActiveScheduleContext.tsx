"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from "react";
import { Schedule } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

interface ActiveScheduleContextType {
  // Active schedule being viewed/edited (could be saved or unsaved)
  activeSchedule: Schedule | null;
  setActiveSchedule: (schedule: Schedule | null) => void;

  // Active semester filter
  activeSemester: string;
  setActiveSemester: (semester: string) => void;

  // All user schedules
  userSchedules: Schedule[];
  setUserSchedules: (schedules: Schedule[]) => void;

  // Loading state for fetching schedules
  isLoadingSchedules: boolean;

  // Helper functions
  loadSchedule: (scheduleId: string) => void;
  clearActiveSchedule: () => void;
  addScheduleToList: (schedule: Schedule) => void;
  updateScheduleInList: (scheduleId: string, updatedSchedule: Schedule) => void;
  removeScheduleFromList: (scheduleId: string) => void;

  // Fetch user schedules from database
  fetchUserSchedules: () => Promise<void>;
}

const ActiveScheduleContext = createContext<
  ActiveScheduleContextType | undefined
>(undefined);

export const ActiveScheduleProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { user, session, loading } = useAuth();

  // Track the previous user ID to detect user changes
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  // Helper to sync state with localStorage
  const usePersistedState = <T,>(key: string, initialValue: T) => {
    const [state, setState] = useState<T>(() => {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : initialValue;
      }
      return initialValue;
    });

    useEffect(() => {
      if (typeof window !== "undefined") {
        localStorage.setItem(key, JSON.stringify(state));
      }
    }, [key, state]);

    return [state, setState] as const;
  };

  // Active schedule being viewed/edited
  const [activeSchedule, setActiveSchedule] =
    usePersistedState<Schedule | null>("activeSchedule", null);

  // Active semester filter
  const [activeSemester, setActiveSemester] = usePersistedState<string>(
    "activeSemester",
    ""
  );

  // All user schedules
  const [userSchedules, setUserSchedules] = usePersistedState<Schedule[]>(
    "userSchedules",
    []
  );

  // Loading state for schedules
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);

  // Load a specific schedule by ID
  const loadSchedule = (scheduleId: string) => {
    const schedule = userSchedules.find((s) => s.id === scheduleId);
    if (schedule) {
      setActiveSchedule(schedule);
    }
  };

  // Clear the active schedule
  const clearActiveSchedule = () => {
    setActiveSchedule(null);
  };

  // Add a new schedule to the list
  const addScheduleToList = (schedule: Schedule) => {
    setUserSchedules((prev) => [schedule, ...prev]);
    setActiveSchedule(schedule);
    console.log("Added new schedule:", schedule);
  };

  // Update an existing schedule in the list
  const updateScheduleInList = (
    scheduleId: string,
    updatedSchedule: Schedule
  ) => {
    setUserSchedules((prev) =>
      prev.map((s) => (s.id === scheduleId ? updatedSchedule : s))
    );

    // If this is the active schedule, update it too
    if (activeSchedule?.id === scheduleId) {
      setActiveSchedule(updatedSchedule);
    }
  };

  // Remove a schedule from the list
  const removeScheduleFromList = (scheduleId: string) => {
    setUserSchedules((prev) => prev.filter((s) => s.id !== scheduleId));

    // If this was the active schedule, clear it
    if (activeSchedule?.id === scheduleId) {
      setActiveSchedule(null);
    }
  };

  // Fetch user schedules from database using Supabase user ID
  const fetchUserSchedules = async () => {
    if (!user?.id || !session?.access_token) {
      console.log("No user logged in or no access token");
      return;
    }

    setIsLoadingSchedules(true);
    try {
      const response = await fetch("/api/getUserSchedules", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch schedules");
      }

      const data = await response.json();
      console.log("Fetched user schedules:", data.schedules);
      setUserSchedules(data.schedules || []);
    } catch (error) {
      console.error("Error fetching user schedules:", error);
      setUserSchedules([]);
    } finally {
      setIsLoadingSchedules(false);
    }
  };

  // Fetch schedules when user changes. Respect auth `loading` so we don't
  // clear persisted state while the auth library is still initializing
  // (this prevents wiping `activeSchedule` on page refresh).
  useEffect(() => {
    if (loading) return; // wait until auth has finished initializing

    const currentUserId = user?.id ?? null;
    const prevUserId = prevUserIdRef.current;

    // Detect user change (sign-out, sign-in as different user, or first load after sign-in)
    // Skip the very first render (prevUserId === undefined) to avoid clearing on page refresh
    if (prevUserId !== undefined && prevUserId !== currentUserId) {
      // User changed — clear all persisted state in React and localStorage
      setUserSchedules([]);
      setActiveSchedule(null);
      setActiveSemester("");

      // Also clear localStorage to prevent stale reads on next mount
      if (typeof window !== "undefined") {
        localStorage.removeItem("activeSchedule");
        localStorage.removeItem("activeSemester");
        localStorage.removeItem("userSchedules");
      }
    }

    // Update the ref for next comparison
    prevUserIdRef.current = currentUserId;

    if (user?.id) {
      fetchUserSchedules();
    }
  }, [user?.id, loading]);

  return (
    <ActiveScheduleContext.Provider
      value={{
        activeSchedule,
        setActiveSchedule,
        activeSemester,
        setActiveSemester,
        userSchedules,
        setUserSchedules,
        isLoadingSchedules,
        loadSchedule,
        clearActiveSchedule,
        addScheduleToList,
        updateScheduleInList,
        removeScheduleFromList,
        fetchUserSchedules,
      }}
    >
      {children}
    </ActiveScheduleContext.Provider>
  );
};

export const useActiveSchedule = () => {
  const context = useContext(ActiveScheduleContext);
  if (context === undefined) {
    throw new Error(
      "useActiveSchedule must be used within an ActiveScheduleProvider"
    );
  }
  return context;
};
