"use client";

import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { getToastStyle } from "@/components/ui/toastStyle";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import type {
  NotificationAction,
  NotificationType,
} from "@/lib/notificationPreferences";
import { shouldShowNotification } from "@/lib/notificationPreferences";

type ToastContent = Parameters<typeof toast>[0];
type ToastOptions = Parameters<typeof toast>[1];

type AppToastOptions = ToastOptions & {
  action: NotificationAction;
};

type ToastMethod = (message: ToastContent, options?: ToastOptions) => unknown;

const typeMethods = {
  success: toast.success,
  warning: toast.warning,
  error: toast.error,
  info: toast.info,
} satisfies Record<NotificationType, ToastMethod>;

export function useAppToast() {
  const { theme, notificationPreferences } = useAppSettings();
  const appToastStyle = useMemo(() => getToastStyle(theme), [theme]);

  const withStyle = useCallback(
    (options: AppToastOptions): ToastOptions => {
      const { action: _action, style, ...rest } = options;
      return {
        ...rest,
        style: { ...appToastStyle, ...style },
      };
    },
    [appToastStyle],
  );

  const show = useCallback(
    (
      type: NotificationType,
      message: ToastContent,
      options: AppToastOptions,
    ) => {
      if (
        !shouldShowNotification(notificationPreferences, type, options.action)
      ) {
        return undefined;
      }

      return typeMethods[type](message, withStyle(options));
    },
    [notificationPreferences, withStyle],
  );

  const custom = useCallback(
    (
      message: ToastContent,
      options: AppToastOptions & { type: NotificationType },
    ) => {
      if (
        !shouldShowNotification(
          notificationPreferences,
          options.type,
          options.action,
        )
      ) {
        return undefined;
      }

      const { type: _type, ...rest } = options;
      return toast(message, withStyle(rest));
    },
    [notificationPreferences, withStyle],
  );

  const success = useCallback(
    (message: ToastContent, options: AppToastOptions) =>
      show("success", message, options),
    [show],
  );

  const warning = useCallback(
    (message: ToastContent, options: AppToastOptions) =>
      show("warning", message, options),
    [show],
  );

  const error = useCallback(
    (message: ToastContent, options: AppToastOptions) =>
      show("error", message, options),
    [show],
  );

  const info = useCallback(
    (message: ToastContent, options: AppToastOptions) =>
      show("info", message, options),
    [show],
  );

  return useMemo(
    () => ({
      success,
      warning,
      error,
      info,
      custom,
      dismiss: toast.dismiss,
    }),
    [custom, error, info, success, warning],
  );
}
