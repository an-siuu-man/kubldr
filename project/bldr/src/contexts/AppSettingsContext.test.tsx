import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/lib/notificationPreferences";
import { AppSettingsProvider, useAppSettings } from "./AppSettingsContext";

const mocks = vi.hoisted(() => ({
  authState: {
    user: { id: "user-1" },
  },
  setTheme: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mocks.authState,
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({ setTheme: mocks.setTheme }),
}));

const storageKey = "bldr:app-settings:user-1";

function wrapper({ children }: { children: ReactNode }) {
  return <AppSettingsProvider>{children}</AppSettingsProvider>;
}

beforeEach(() => {
  window.localStorage.clear();
  mocks.authState.user = { id: "user-1" };
  mocks.setTheme.mockClear();
});

describe("AppSettingsProvider", () => {
  it("uses dark theme and 24 hour time by default", async () => {
    const { result } = renderHook(() => useAppSettings(), { wrapper });

    expect(result.current.theme).toBe("dark");
    expect(result.current.timeFormat).toBe("24h");
    expect(result.current.notificationPreferences).toEqual(
      DEFAULT_NOTIFICATION_PREFERENCES,
    );

    await waitFor(() => {
      expect(mocks.setTheme).toHaveBeenCalledWith("dark");
      expect(
        JSON.parse(window.localStorage.getItem(storageKey) ?? "{}"),
      ).toEqual({
        theme: "dark",
        timeFormat: "24h",
        notificationPreferences: DEFAULT_NOTIFICATION_PREFERENCES,
      });
    });
  });

  it("loads stored settings for the signed-in user", async () => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        theme: "light",
        timeFormat: "12h",
        notificationPreferences: {
          enabled: false,
          types: { success: false },
          actions: { scheduleSave: false },
        },
      }),
    );

    const { result } = renderHook(() => useAppSettings(), { wrapper });

    await waitFor(() => {
      expect(result.current.theme).toBe("light");
      expect(result.current.timeFormat).toBe("12h");
      expect(result.current.notificationPreferences.enabled).toBe(false);
      expect(result.current.notificationPreferences.types.success).toBe(false);
      expect(result.current.notificationPreferences.types.error).toBe(true);
      expect(result.current.notificationPreferences.actions.scheduleSave).toBe(
        false,
      );
      expect(result.current.notificationPreferences.actions.classAdd).toBe(
        true,
      );
      expect(mocks.setTheme).toHaveBeenLastCalledWith("light");
    });
  });

  it("persists setting changes", async () => {
    const { result } = renderHook(() => useAppSettings(), { wrapper });

    act(() => {
      result.current.setThemePreference("light");
      result.current.setTimeFormat("12h");
      result.current.setNotificationsEnabled(false);
      result.current.setNotificationTypePreference("success", false);
      result.current.setNotificationActionPreference("scheduleSave", false);
    });

    expect(result.current.theme).toBe("light");
    expect(result.current.timeFormat).toBe("12h");
    expect(result.current.notificationPreferences.enabled).toBe(false);
    expect(result.current.notificationPreferences.types.success).toBe(false);
    expect(result.current.notificationPreferences.actions.scheduleSave).toBe(
      false,
    );

    await waitFor(() => {
      expect(mocks.setTheme).toHaveBeenLastCalledWith("light");
      expect(
        JSON.parse(window.localStorage.getItem(storageKey) ?? "{}"),
      ).toEqual({
        theme: "light",
        timeFormat: "12h",
        notificationPreferences: {
          ...DEFAULT_NOTIFICATION_PREFERENCES,
          enabled: false,
          types: {
            ...DEFAULT_NOTIFICATION_PREFERENCES.types,
            success: false,
          },
          actions: {
            ...DEFAULT_NOTIFICATION_PREFERENCES.actions,
            scheduleSave: false,
          },
        },
      });
    });
  });
});
