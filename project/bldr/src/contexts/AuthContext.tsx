"use client";

import type { Session, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const clearPersistedStateForUser = () => {
      if (typeof window === "undefined") return;
      const keysToClear = [
        // ActiveScheduleContext persisted keys
        "activeSchedule",
        "activeSemester",
        "userSchedules",
        // ScheduleBuilderContext persisted keys
        "draftSchedule",
        "draftScheduleName",
        "draftSemester",
        "draftYear",
        "isEditingExisting",
        "existingScheduleId",
      ];
      try {
        keysToClear.forEach((k) => localStorage.removeItem(k));
      } catch (_e) {
        // ignore storage errors
      }
    };

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Clear persisted state when a fresh sign-in occurs so a new user
      // doesn't see another user's persisted drafts or selections.
      if (event === "SIGNED_IN") {
        clearPersistedStateForUser();
      }

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const signOut = async () => {
    await supabase.auth.signOut();
    if (typeof window !== "undefined") {
      try {
        // Clear persisted state when signing out to avoid leaking data
        localStorage.removeItem("activeSchedule");
        localStorage.removeItem("activeSemester");
        localStorage.removeItem("userSchedules");
        localStorage.removeItem("draftSchedule");
        localStorage.removeItem("draftScheduleName");
        localStorage.removeItem("draftSemester");
        localStorage.removeItem("draftYear");
        localStorage.removeItem("isEditingExisting");
        localStorage.removeItem("existingScheduleId");
      } catch (_e) {
        // ignore
      }
    }

    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
