/**
 * Loader.tsx
 * 
 * A simple animated loading spinner component using Framer Motion.
 * Displays a rotating circular border to indicate loading state.
 * 
 * Features:
 * - Smooth infinite rotation animation
 * - Lightweight and reusable
 * - Consistent 8x8 size
 * - Transparent background for overlay use
 * 
 * @component
 */
import React from "react";
import { motion } from "framer-motion";

/**
 * Loader Component
 * 
 * Renders an animated spinning loader indicator.
 * Used throughout the app to show loading states.
 * 
 * @returns {JSX.Element} An animated spinning circle loader
 */
export default function Loader() {
  return (
    // Container with fixed dimensions
    <div className="w-8 h-8 flex items-center justify-center bg-transparent">
      {/* Spinning circle with transparent top border for the "gap" effect */}
      <motion.div
        className="w-8 h-8 border-4 border-gray-500 border-t-transparent rounded-full"
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity }} // Continuous 1-second rotation
      />
    </div>
  );
}
