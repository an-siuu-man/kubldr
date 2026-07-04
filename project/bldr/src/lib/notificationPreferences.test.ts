import { describe, expect, it } from "vitest";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  normalizeNotificationPreferences,
  shouldShowNotification,
} from "./notificationPreferences";

describe("notificationPreferences", () => {
  it("defaults every notification type and action to enabled", () => {
    expect(DEFAULT_NOTIFICATION_PREFERENCES.enabled).toBe(true);
    expect(DEFAULT_NOTIFICATION_PREFERENCES.types.success).toBe(true);
    expect(DEFAULT_NOTIFICATION_PREFERENCES.types.warning).toBe(true);
    expect(DEFAULT_NOTIFICATION_PREFERENCES.types.error).toBe(true);
    expect(DEFAULT_NOTIFICATION_PREFERENCES.types.info).toBe(true);
    expect(DEFAULT_NOTIFICATION_PREFERENCES.actions.scheduleSave).toBe(true);
    expect(DEFAULT_NOTIFICATION_PREFERENCES.actions.busyBlock).toBe(true);
  });

  it("normalizes partial stored preferences with defaults", () => {
    const normalized = normalizeNotificationPreferences({
      enabled: false,
      types: { success: false },
      actions: { scheduleSave: false },
    });

    expect(normalized.enabled).toBe(false);
    expect(normalized.types.success).toBe(false);
    expect(normalized.types.error).toBe(true);
    expect(normalized.actions.scheduleSave).toBe(false);
    expect(normalized.actions.classAdd).toBe(true);
  });

  it("requires both the type and action preference to be enabled", () => {
    const preferences = normalizeNotificationPreferences({
      types: { success: false, error: true },
      actions: { scheduleSave: true, busyBlock: false },
    });

    expect(shouldShowNotification(preferences, "success", "scheduleSave")).toBe(
      false,
    );
    expect(shouldShowNotification(preferences, "error", "busyBlock")).toBe(
      false,
    );
    expect(shouldShowNotification(preferences, "error", "scheduleSave")).toBe(
      true,
    );
  });

  it("suppresses every notification when the master switch is off", () => {
    const preferences = normalizeNotificationPreferences({ enabled: false });

    expect(shouldShowNotification(preferences, "error", "scheduleSave")).toBe(
      false,
    );
    expect(shouldShowNotification(preferences, "success", "classAdd")).toBe(
      false,
    );
  });
});
