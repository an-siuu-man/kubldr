/**
 * Unit tests for AuthContext / AuthProvider
 *
 * Verifies that:
 * 1. localStorage is cleared on SIGNED_IN events (prevents cross-user data leaks)
 * 2. localStorage is cleared on signOut()
 * 3. Initial session is loaded and exposed via useAuth()
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "./AuthContext";

// ─── Keys that AuthContext manages ────────────────────────────────────────────

const MANAGED_KEYS = [
  "activeSchedule",
  "activeSemester",
  "userSchedules",
  "draftSchedule",
  "draftScheduleName",
  "draftSemester",
  "draftYear",
  "isEditingExisting",
  "existingScheduleId",
];

// ─── Mock @/lib/supabase/client ───────────────────────────────────────────────

let authStateCallback: ((event: string, session: unknown) => void) | null =
  null;

const mockUnsubscribe = vi.fn();

const mockAuth = {
  getSession: vi.fn(),
  onAuthStateChange: vi.fn((cb: (event: string, session: unknown) => void) => {
    authStateCallback = cb;
    return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
  }),
  signOut: vi.fn(),
};

const mockSupabaseClient = { auth: mockAuth };

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(AuthProvider, null, children);
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  authStateCallback = null;

  // Default: no active session
  mockAuth.getSession.mockResolvedValue({ data: { session: null } });
  mockAuth.onAuthStateChange.mockImplementation(
    (cb: (event: string, session: unknown) => void) => {
      authStateCallback = cb;
      return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
    },
  );
  mockAuth.signOut.mockResolvedValue({ error: null });
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("AuthProvider", () => {
  it("exposes null user and session when there is no active session", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
  });

  it("exposes the user from the initial session", async () => {
    const fakeUser = { id: "user-1", email: "a@b.com" };
    const fakeSession = { user: fakeUser, access_token: "tok" };
    mockAuth.getSession.mockResolvedValue({ data: { session: fakeSession } });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toEqual(fakeUser);
    expect(result.current.session).toEqual(fakeSession);
  });

  it("clears persisted localStorage keys on SIGNED_IN event", async () => {
    // Pre-populate storage with data from a previous user
    for (const key of MANAGED_KEYS) {
      localStorage.setItem(key, JSON.stringify({ staleData: true }));
    }

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    const fakeUser = { id: "new-user", email: "new@b.com" };
    const fakeSession = { user: fakeUser, access_token: "tok2" };

    // Simulate SIGNED_IN event from Supabase
    act(() => {
      authStateCallback?.("SIGNED_IN", fakeSession);
    });

    // All managed keys should be cleared
    for (const key of MANAGED_KEYS) {
      expect(localStorage.getItem(key)).toBeNull();
    }
  });

  it("clears localStorage on signOut()", async () => {
    for (const key of MANAGED_KEYS) {
      localStorage.setItem(key, "some-value");
    }

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.signOut();
    });

    expect(mockAuth.signOut).toHaveBeenCalledOnce();
    for (const key of MANAGED_KEYS) {
      expect(localStorage.getItem(key)).toBeNull();
    }
    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
  });

  it("unsubscribes from auth state changes on unmount", async () => {
    const { unmount } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => {
      expect(mockAuth.onAuthStateChange).toHaveBeenCalled();
    });
    unmount();
    expect(mockUnsubscribe).toHaveBeenCalledOnce();
  });
});
