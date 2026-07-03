import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

    await waitFor(() => {
      expect(mocks.setTheme).toHaveBeenCalledWith("dark");
      expect(window.localStorage.getItem(storageKey)).toBe(
        JSON.stringify({ theme: "dark", timeFormat: "24h" }),
      );
    });
  });

  it("loads stored settings for the signed-in user", async () => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({ theme: "light", timeFormat: "12h" }),
    );

    const { result } = renderHook(() => useAppSettings(), { wrapper });

    await waitFor(() => {
      expect(result.current.theme).toBe("light");
      expect(result.current.timeFormat).toBe("12h");
      expect(mocks.setTheme).toHaveBeenLastCalledWith("light");
    });
  });

  it("persists setting changes", async () => {
    const { result } = renderHook(() => useAppSettings(), { wrapper });

    act(() => {
      result.current.setThemePreference("light");
      result.current.setTimeFormat("12h");
    });

    expect(result.current.theme).toBe("light");
    expect(result.current.timeFormat).toBe("12h");

    await waitFor(() => {
      expect(mocks.setTheme).toHaveBeenLastCalledWith("light");
      expect(window.localStorage.getItem(storageKey)).toBe(
        JSON.stringify({ theme: "light", timeFormat: "12h" }),
      );
    });
  });
});
