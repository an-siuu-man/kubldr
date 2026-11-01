"use client";

import { Bell, Clock3, MonitorCog, Moon, Sun } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { AppTheme, TimeFormat } from "@/contexts/AppSettingsContext";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import {
  NOTIFICATION_ACTION_GROUPS,
  NOTIFICATION_ACTION_LABELS,
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATION_TYPES,
} from "@/lib/notificationPreferences";

type AppSettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AppSettingsDialog({
  open,
  onOpenChange,
}: AppSettingsDialogProps) {
  const {
    theme,
    timeFormat,
    notificationPreferences,
    setThemePreference,
    setTimeFormat,
    setNotificationsEnabled,
    setNotificationTypePreference,
    setNotificationActionPreference,
  } = useAppSettings();

  const handleThemeChange = (value: string) => {
    if (value === "dark" || value === "light") {
      setThemePreference(value as AppTheme);
    }
  };

  const handleTimeFormatChange = (value: string) => {
    if (value === "12h" || value === "24h") {
      setTimeFormat(value as TimeFormat);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(720px,92vh)] overflow-hidden border-border bg-card p-0 text-foreground shadow-2xl sm:max-w-[520px]">
        <DialogHeader className="border-b border-border bg-secondary px-5 py-4 text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-foreground shadow-sm">
              <MonitorCog className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="font-figtree text-base font-semibold text-foreground">
                Settings
              </DialogTitle>
              <DialogDescription className="mt-0.5 font-inter text-xs text-muted-foreground">
                Manage app preferences.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[calc(min(720px,92vh)-82px)] space-y-3 overflow-y-auto p-5">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-foreground">
                  {theme === "light" ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-figtree text-sm font-medium text-foreground">
                    Theme
                  </div>
                  <p className="mt-0.5 font-inter text-xs text-muted-foreground">
                    Choose the builder appearance.
                  </p>
                </div>
              </div>
              <ToggleGroup
                type="single"
                value={theme}
                onValueChange={handleThemeChange}
                className="grid grid-cols-2 rounded-lg border border-border bg-muted p-1"
                aria-label="Theme"
              >
                <ToggleGroupItem
                  value="light"
                  aria-label="Use light theme"
                  className="h-8 min-w-20 rounded-md px-3 font-dmsans text-xs text-muted-foreground shadow-none hover:bg-accent hover:text-foreground data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-sm"
                >
                  Light
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="dark"
                  aria-label="Use dark theme"
                  className="h-8 min-w-20 rounded-md px-3 font-dmsans text-xs text-muted-foreground shadow-none hover:bg-accent hover:text-foreground data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-sm"
                >
                  Dark
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-foreground">
                  <Clock3 className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-figtree text-sm font-medium text-foreground">
                    Time format
                  </div>
                  <p className="mt-0.5 font-inter text-xs text-muted-foreground">
                    Set how daily times are displayed.
                  </p>
                </div>
              </div>
              <ToggleGroup
                type="single"
                value={timeFormat}
                onValueChange={handleTimeFormatChange}
                className="grid grid-cols-2 rounded-lg border border-border bg-muted p-1"
                aria-label="Time format"
              >
                <ToggleGroupItem
                  value="12h"
                  aria-label="Use 12 hour time"
                  className="h-8 min-w-20 rounded-md px-3 font-dmsans text-xs text-muted-foreground shadow-none hover:bg-accent hover:text-foreground data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-sm"
                >
                  12H
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="24h"
                  aria-label="Use 24 hour time"
                  className="h-8 min-w-20 rounded-md px-3 font-dmsans text-xs text-muted-foreground shadow-none hover:bg-accent hover:text-foreground data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-sm"
                >
                  24H
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-foreground">
                <Bell className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-figtree text-sm font-medium text-foreground">
                  Notifications
                </div>
                <p className="mt-0.5 font-inter text-xs text-muted-foreground">
                  A toast appears only when notifications, its type, and its
                  action are enabled.
                </p>

                <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary px-3 py-2">
                  <div>
                    <span className="font-inter text-xs font-medium text-foreground">
                      Show notifications
                    </span>
                    <p className="mt-0.5 font-inter text-[11px] text-muted-foreground">
                      Turn all notifications on or off.
                    </p>
                  </div>
                  <Switch
                    checked={notificationPreferences.enabled}
                    onCheckedChange={setNotificationsEnabled}
                    aria-label="Show notifications"
                  />
                </div>

                <div className="mt-4">
                  <p className="mb-2 font-dmsans text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    By type
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {NOTIFICATION_TYPES.map((type) => (
                      <div
                        key={type}
                        className="flex items-center justify-between gap-2 rounded-lg border border-border bg-secondary px-3 py-2"
                      >
                        <span className="font-inter text-xs text-foreground">
                          {NOTIFICATION_TYPE_LABELS[type]}
                        </span>
                        <Switch
                          checked={notificationPreferences.types[type]}
                          onCheckedChange={(checked) =>
                            setNotificationTypePreference(type, checked)
                          }
                          aria-label={`Show ${NOTIFICATION_TYPE_LABELS[type]} notifications`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <p className="font-dmsans text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    By action
                  </p>
                  {NOTIFICATION_ACTION_GROUPS.map((group) => (
                    <div key={group.title}>
                      <p className="mb-2 font-inter text-xs font-medium text-muted-foreground">
                        {group.title}
                      </p>
                      <div className="space-y-2">
                        {group.actions.map((action) => (
                          <div
                            key={action}
                            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary px-3 py-2"
                          >
                            <span className="font-inter text-xs text-foreground">
                              {NOTIFICATION_ACTION_LABELS[action]}
                            </span>
                            <Switch
                              checked={notificationPreferences.actions[action]}
                              onCheckedChange={(checked) =>
                                setNotificationActionPreference(action, checked)
                              }
                              aria-label={`Show ${NOTIFICATION_ACTION_LABELS[action]} notifications`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
