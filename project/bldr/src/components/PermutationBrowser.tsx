/**
 * PermutationBrowser.tsx
 *
 * A UI component that allows users to browse through valid schedule permutations.
 * Shows navigation arrows and the current position (x out of y).
 *
 * Features:
 * - Left/Right arrows to navigate between permutations
 * - Display of current position (e.g., "3 of 12")
 * - Loading state while generating permutations
 * - Only visible when there are multiple permutations available
 *
 * @component
 */
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScheduleBuilder } from "@/contexts/ScheduleBuilderContext";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * PermutationBrowser Component
 *
 * Renders a compact navigation UI for browsing schedule permutations.
 * Only visible when there is more than one valid permutation.
 *
 * @returns {JSX.Element | null} The permutation browser UI or null if not applicable
 */
export default function PermutationBrowser() {
  const {
    draftSchedule,
    permutations,
    permutationIndex,
    isGeneratingPermutations,
    nextPermutation,
    prevPermutation,
  } = useScheduleBuilder();

  // Don't show if draft is empty
  if (draftSchedule.length === 0) {
    return null;
  }

  // Show loading state while generating
  if (isGeneratingPermutations) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="flex items-center gap-1.5 bg-[#2c2c2c] border border-[#404040] rounded-lg px-2 py-1"
      >
        <Spinner className="h-3 w-3" />
        <span className="text-[10px] lg:text-xs text-[#A8A8A8] font-inter">
          Finding...
        </span>
      </motion.div>
    );
  }

  // Don't show if there's only one or no permutations
  if (permutations.length <= 1) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="flex items-center gap-1 lg:gap-1.5 bg-[#2c2c2c] border border-[#404040] rounded-lg px-1.5 lg:px-2 py-1"
      >
        <TooltipProvider>
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 text-blue-400">
                <Shuffle className="h-3 w-3" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="font-inter">
              <p className="text-xs">
                Browse through {permutations.length} schedule combinations
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Button
          variant="ghost"
          size="sm"
          onClick={prevPermutation}
          className="h-5 w-5 lg:h-6 lg:w-6 p-0 hover:bg-[#404040] cursor-pointer"
          aria-label="Previous permutation"
        >
          <ChevronLeft className="h-3 w-3 lg:h-4 lg:w-4 text-white" />
        </Button>

        <div className="flex items-center gap-0.5 min-w-10 lg:min-w-[50px] justify-center">
          <span className="text-[10px] lg:text-xs font-dmsans text-white font-medium">
            {permutationIndex + 1}
          </span>
          <span className="text-[9px] lg:text-[10px] text-[#A8A8A8] font-inter">
            /
          </span>
          <span className="text-[10px] lg:text-xs font-dmsans text-white font-medium">
            {permutations.length}
          </span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={nextPermutation}
          className="h-5 w-5 lg:h-6 lg:w-6 p-0 hover:bg-[#404040] cursor-pointer"
          aria-label="Next permutation"
        >
          <ChevronRight className="h-3 w-3 lg:h-4 lg:w-4 text-white" />
        </Button>
      </motion.div>
    </AnimatePresence>
  );
}
