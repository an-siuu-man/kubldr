"use client";

import { AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export default function MaintenanceBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="w-full bg-yellow-500/15 border border-yellow-500/40 text-yellow-200 px-4 py-3 text-center"
    >
      <div className="flex items-center justify-center gap-2 max-w-4xl mx-auto">
        <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0" />
        <p className="text-sm font-inter">
          <span className="font-semibold text-yellow-400">
            Critical Maintenance:
          </span>{" "}
          We are under critical maintenance for an undisclosed length of time.
          We are solving the issues with full diligence and apologize for any
        inconvenience. For the time being, you will not be able to access your
        account.
        </p>
      </div>
    </motion.div>
  );
}
