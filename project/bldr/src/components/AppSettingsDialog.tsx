"use client";

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
      <DialogContent className="border-slate-200 bg-white text-slate-950 dark:border-[#404040] dark:bg-[#1a1a1a] dark:text-[#fafafa] sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="font-figtree text-slate-950 dark:text-[#fafafa]">
            Settings
          </DialogTitle>
          <DialogDescription className="font-inter text-slate-600 dark:text-[#888888]">
            Manage app preferences.
          </DialogDescription>
        </DialogHeader>

        <div className="divide-y divide-slate-200 rounded-md border border-slate-200 dark:divide-white/10 dark:border-white/10">
          <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="font-figtree text-sm font-medium text-slate-950 dark:text-[#fafafa]">
                Theme
              </div>
            </div>
            <ToggleGroup
              type="single"
              value={theme}
              onValueChange={handleThemeChange}
              className="rounded-md border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-[#222222]"
              aria-label="Theme"
            >
              <ToggleGroupItem
                value="light"
                aria-label="Use light theme"
                className="h-8 min-w-16 text-slate-600 hover:bg-slate-100 hover:text-slate-950 data-[state=on]:bg-slate-950 data-[state=on]:text-white dark:text-[#d4d4d4] dark:hover:bg-white/10 dark:hover:text-white dark:data-[state=on]:bg-white dark:data-[state=on]:text-[#111111]"
              >
                Light
              </ToggleGroupItem>
              <ToggleGroupItem
                value="dark"
                aria-label="Use dark theme"
                className="h-8 min-w-16 text-slate-600 hover:bg-slate-100 hover:text-slate-950 data-[state=on]:bg-slate-950 data-[state=on]:text-white dark:text-[#d4d4d4] dark:hover:bg-white/10 dark:hover:text-white dark:data-[state=on]:bg-white dark:data-[state=on]:text-[#111111]"
              >
                Dark
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="font-figtree text-sm font-medium text-slate-950 dark:text-[#fafafa]">
                Time format
              </div>
            </div>
            <ToggleGroup
              type="single"
              value={timeFormat}
              onValueChange={handleTimeFormatChange}
              className="rounded-md border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-[#222222]"
              aria-label="Time format"
            >
              <ToggleGroupItem
                value="12h"
                aria-label="Use 12 hour time"
                className="h-8 min-w-16 text-slate-600 hover:bg-slate-100 hover:text-slate-950 data-[state=on]:bg-slate-950 data-[state=on]:text-white dark:text-[#d4d4d4] dark:hover:bg-white/10 dark:hover:text-white dark:data-[state=on]:bg-white dark:data-[state=on]:text-[#111111]"
              >
                12H
              </ToggleGroupItem>
              <ToggleGroupItem
                value="24h"
                aria-label="Use 24 hour time"
                className="h-8 min-w-16 text-slate-600 hover:bg-slate-100 hover:text-slate-950 data-[state=on]:bg-slate-950 data-[state=on]:text-white dark:text-[#d4d4d4] dark:hover:bg-white/10 dark:hover:text-white dark:data-[state=on]:bg-white dark:data-[state=on]:text-[#111111]"
              >
                24H
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
