"use client";

import { useTheme } from "next-themes";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationAction,
  type NotificationPreferences,
  type NotificationType,
  normalizeNotificationPreferences,
} from "@/lib/notificationPreferences";

export type AppTheme = "dark" | "light";
export type TimeFormat = "12h" | "24h";

type AppSettings = {
  theme: AppTheme;
  timeFormat: TimeFormat;
  notificationPreferences: NotificationPreferences;
};

type AppSettingsContextType = AppSettings & {
  setThemePreference: (theme: AppTheme) => void;
  setTimeFormat: (timeFormat: TimeFormat) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setNotificationTypePreference: (
    type: NotificationType,
    enabled: boolean,
  ) => void;
  setNotificationActionPreference: (
    action: NotificationAction,
    enabled: boolean,
  ) => void;
};

const DEFAULT_SETTINGS: AppSettings = {
  theme: "dark",
  timeFormat: "24h",
  notificationPreferences: DEFAULT_NOTIFICATION_PREFERENCES,
};

const APP_SETTINGS_STORAGE_PREFIX = "bldr:app-settings";

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(
  undefined,
);

const isAppTheme = (value: unknown): value is AppTheme =>
  value === "dark" || value === "light";

const isTimeFormat = (value: unknown): value is TimeFormat =>
  value === "12h" || value === "24h";

const getSettingsStorageKey = (userId: string | undefined) =>
  `${APP_SETTINGS_STORAGE_PREFIX}:${userId ?? "anonymous"}`;

const readStoredSettings = (storageKey: string): AppSettings => {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;

  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return DEFAULT_SETTINGS;

    const parsed = JSON.parse(stored) as Partial<AppSettings>;
    return {
      theme: isAppTheme(parsed.theme) ? parsed.theme : DEFAULT_SETTINGS.theme,
      timeFormat: isTimeFormat(parsed.timeFormat)
        ? parsed.timeFormat
        : DEFAULT_SETTINGS.timeFormat,
      notificationPreferences: normalizeNotificationPreferences(
        parsed.notificationPreferences,
      ),
    };
  } catch (_error) {
    return DEFAULT_SETTINGS;
  }
};

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { setTheme } = useTheme();
  const storageKey = getSettingsStorageKey(user?.id);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loadedStorageKey, setLoadedStorageKey] = useState<string | null>(null);

  useEffect(() => {
    setSettings(readStoredSettings(storageKey));
    setLoadedStorageKey(storageKey);
  }, [storageKey]);

  useEffect(() => {
    setTheme(settings.theme);
  }, [settings.theme, setTheme]);

  useEffect(() => {
    if (loadedStorageKey !== storageKey || typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(settings));
    } catch (_error) {
      // Ignore unavailable storage; settings still work for the current render.
    }
  }, [loadedStorageKey, settings, storageKey]);

  const setThemePreference = useCallback((theme: AppTheme) => {
    setSettings((current) => ({ ...current, theme }));
  }, []);

  const setTimeFormat = useCallback((timeFormat: TimeFormat) => {
    setSettings((current) => ({ ...current, timeFormat }));
  }, []);

  const setNotificationsEnabled = useCallback((enabled: boolean) => {
    setSettings((current) => ({
      ...current,
      notificationPreferences: {
        ...current.notificationPreferences,
        enabled,
      },
    }));
  }, []);

  const setNotificationTypePreference = useCallback(
    (type: NotificationType, enabled: boolean) => {
      setSettings((current) => ({
        ...current,
        notificationPreferences: {
          ...current.notificationPreferences,
          types: {
            ...current.notificationPreferences.types,
            [type]: enabled,
          },
        },
      }));
    },
    [],
  );

  const setNotificationActionPreference = useCallback(
    (action: NotificationAction, enabled: boolean) => {
      setSettings((current) => ({
        ...current,
        notificationPreferences: {
          ...current.notificationPreferences,
          actions: {
            ...current.notificationPreferences.actions,
            [action]: enabled,
          },
        },
      }));
    },
    [],
  );

  const value = useMemo<AppSettingsContextType>(
    () => ({
      ...settings,
      setThemePreference,
      setTimeFormat,
      setNotificationsEnabled,
      setNotificationTypePreference,
      setNotificationActionPreference,
    }),
    [
      settings,
      setThemePreference,
      setTimeFormat,
      setNotificationsEnabled,
      setNotificationTypePreference,
      setNotificationActionPreference,
    ],
  );

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);

  if (!context) {
    throw new Error(
      "useAppSettings must be used within an AppSettingsProvider",
    );
  }

  return context;
};
