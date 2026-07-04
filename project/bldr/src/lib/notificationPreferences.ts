export const NOTIFICATION_TYPES = [
  "success",
  "warning",
  "error",
  "info",
] as const;

export const NOTIFICATION_ACTIONS = [
  "account",
  "auth",
  "busyBlock",
  "classAdd",
  "classRemove",
  "classPin",
  "conflict",
  "scheduleClear",
  "scheduleCreate",
  "scheduleDelete",
  "scheduleRename",
  "scheduleSave",
  "scheduleShare",
  "permutations",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
export type NotificationAction = (typeof NOTIFICATION_ACTIONS)[number];

export type NotificationPreferences = {
  enabled: boolean;
  types: Record<NotificationType, boolean>;
  actions: Record<NotificationAction, boolean>;
};

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  success: "Success",
  warning: "Warnings",
  error: "Errors",
  info: "Info",
};

export const NOTIFICATION_ACTION_LABELS: Record<NotificationAction, string> = {
  account: "Account",
  auth: "Login and logout",
  busyBlock: "Busy blocks",
  classAdd: "Add and replace classes",
  classRemove: "Remove classes",
  classPin: "Pin and unpin classes",
  conflict: "Conflicts",
  scheduleClear: "Clear and undo",
  scheduleCreate: "Create schedules",
  scheduleDelete: "Delete schedules",
  scheduleRename: "Rename schedules",
  scheduleSave: "Save schedules",
  scheduleShare: "Share schedules",
  permutations: "Schedule generation",
};

export const NOTIFICATION_ACTION_GROUPS: Array<{
  title: string;
  actions: NotificationAction[];
}> = [
  {
    title: "Schedule",
    actions: [
      "scheduleSave",
      "scheduleCreate",
      "scheduleRename",
      "scheduleDelete",
      "scheduleShare",
      "scheduleClear",
    ],
  },
  {
    title: "Builder",
    actions: [
      "classAdd",
      "classRemove",
      "classPin",
      "busyBlock",
      "conflict",
      "permutations",
    ],
  },
  {
    title: "Account",
    actions: ["auth", "account"],
  },
];

const DEFAULT_TYPE_PREFERENCES = Object.fromEntries(
  NOTIFICATION_TYPES.map((type) => [type, true]),
) as Record<NotificationType, boolean>;

const DEFAULT_ACTION_PREFERENCES = Object.fromEntries(
  NOTIFICATION_ACTIONS.map((action) => [action, true]),
) as Record<NotificationAction, boolean>;

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  enabled: true,
  types: DEFAULT_TYPE_PREFERENCES,
  actions: DEFAULT_ACTION_PREFERENCES,
};

export function normalizeNotificationPreferences(
  value: unknown,
): NotificationPreferences {
  const partial =
    value && typeof value === "object"
      ? (value as Partial<NotificationPreferences>)
      : {};

  return {
    enabled: partial.enabled ?? DEFAULT_NOTIFICATION_PREFERENCES.enabled,
    types: Object.fromEntries(
      NOTIFICATION_TYPES.map((type) => [
        type,
        partial.types?.[type] ?? DEFAULT_NOTIFICATION_PREFERENCES.types[type],
      ]),
    ) as Record<NotificationType, boolean>,
    actions: Object.fromEntries(
      NOTIFICATION_ACTIONS.map((action) => [
        action,
        partial.actions?.[action] ??
          DEFAULT_NOTIFICATION_PREFERENCES.actions[action],
      ]),
    ) as Record<NotificationAction, boolean>,
  };
}

export function shouldShowNotification(
  preferences: NotificationPreferences,
  type: NotificationType,
  action: NotificationAction,
) {
  return (
    preferences.enabled &&
    preferences.types[type] &&
    preferences.actions[action]
  );
}
