"use client";

import { Clock3, MonitorCog, Moon, Sun } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { AppTheme, TimeFormat } from "@/contexts/AppSettingsContext";
import { useAppSettings } from "@/contexts/AppSettingsContext";

type AppSettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AppSettingsDialog({
  open,
  onOpenChange,
}: AppSettingsDialogProps) {
  const { theme, timeFormat, setThemePreference, setTimeFormat } =
    useAppSettings();

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
      <DialogContent className="overflow-hidden border-slate-200 bg-white p-0 text-slate-950 shadow-2xl shadow-slate-950/10 dark:border-[#404040] dark:bg-[#171717] dark:text-[#fafafa] dark:shadow-black/40 sm:max-w-[480px]">
        <DialogHeader className="border-b border-slate-200 bg-slate-50 px-5 py-4 text-left dark:border-white/10 dark:bg-[#1f1f1f]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white">
              <MonitorCog className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="font-figtree text-base font-semibold text-slate-950 dark:text-[#fafafa]">
                Settings
              </DialogTitle>
              <DialogDescription className="mt-0.5 font-inter text-xs text-slate-600 dark:text-[#a1a1a1]">
                Manage app preferences.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 p-5">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-700 dark:bg-white/8 dark:text-[#d4d4d4]">
                  {theme === "light" ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-figtree text-sm font-medium text-slate-950 dark:text-[#fafafa]">
                    Theme
                  </div>
                  <p className="mt-0.5 font-inter text-xs text-slate-500 dark:text-[#888888]">
                    Choose the builder appearance.
                  </p>
                </div>
              </div>
              <ToggleGroup
                type="single"
                value={theme}
                onValueChange={handleThemeChange}
                className="grid grid-cols-2 rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-white/10 dark:bg-[#222222]"
                aria-label="Theme"
              >
                <ToggleGroupItem
                  value="light"
                  aria-label="Use light theme"
                  className="h-8 min-w-20 rounded-md px-3 font-dmsans text-xs text-slate-600 shadow-none hover:bg-white/70 hover:text-slate-950 data-[state=on]:bg-white data-[state=on]:text-slate-950 data-[state=on]:shadow-sm dark:text-[#d4d4d4] dark:hover:bg-white/10 dark:hover:text-white dark:data-[state=on]:bg-white dark:data-[state=on]:text-[#111111]"
                >
                  Light
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="dark"
                  aria-label="Use dark theme"
                  className="h-8 min-w-20 rounded-md px-3 font-dmsans text-xs text-slate-600 shadow-none hover:bg-white/70 hover:text-slate-950 data-[state=on]:bg-white data-[state=on]:text-slate-950 data-[state=on]:shadow-sm dark:text-[#d4d4d4] dark:hover:bg-white/10 dark:hover:text-white dark:data-[state=on]:bg-white dark:data-[state=on]:text-[#111111]"
                >
                  Dark
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-700 dark:bg-white/8 dark:text-[#d4d4d4]">
                  <Clock3 className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-figtree text-sm font-medium text-slate-950 dark:text-[#fafafa]">
                    Time format
                  </div>
                  <p className="mt-0.5 font-inter text-xs text-slate-500 dark:text-[#888888]">
                    Set how daily times are displayed.
                  </p>
                </div>
              </div>
              <ToggleGroup
                type="single"
                value={timeFormat}
                onValueChange={handleTimeFormatChange}
                className="grid grid-cols-2 rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-white/10 dark:bg-[#222222]"
                aria-label="Time format"
              >
                <ToggleGroupItem
                  value="12h"
                  aria-label="Use 12 hour time"
                  className="h-8 min-w-20 rounded-md px-3 font-dmsans text-xs text-slate-600 shadow-none hover:bg-white/70 hover:text-slate-950 data-[state=on]:bg-white data-[state=on]:text-slate-950 data-[state=on]:shadow-sm dark:text-[#d4d4d4] dark:hover:bg-white/10 dark:hover:text-white dark:data-[state=on]:bg-white dark:data-[state=on]:text-[#111111]"
                >
                  12H
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="24h"
                  aria-label="Use 24 hour time"
                  className="h-8 min-w-20 rounded-md px-3 font-dmsans text-xs text-slate-600 shadow-none hover:bg-white/70 hover:text-slate-950 data-[state=on]:bg-white data-[state=on]:text-slate-950 data-[state=on]:shadow-sm dark:text-[#d4d4d4] dark:hover:bg-white/10 dark:hover:text-white dark:data-[state=on]:bg-white dark:data-[state=on]:text-[#111111]"
                >
                  24H
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
