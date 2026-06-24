"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  CalendarDays,
  Clock,
  FolderKanban,
  Search,
  Share2,
} from "lucide-react";

type Tile = {
  id: string;
  icon: React.ElementType;
  spineColor: string;
  iconColor: string;
  glowColor: string;
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  floatDelay: number;
};

const heroTiles: Tile[] = [
  {
    id: "calendar",
    icon: CalendarDays,
    spineColor: "bg-blue-500",
    iconColor: "text-blue-300",
    glowColor: "shadow-[0_4px_24px_rgba(59,130,246,0.28)]",
    top: "10%",
    left: "3%",
    floatDelay: 0,
  },
  {
    id: "search",
    icon: Search,
    spineColor: "bg-red-500",
    iconColor: "text-red-300",
    glowColor: "shadow-[0_4px_20px_rgba(239,68,68,0.25)]",
    top: "4%",
    right: "8%",
    floatDelay: 0.4,
  },
  {
    id: "clock",
    icon: Clock,
    spineColor: "bg-yellow-400",
    iconColor: "text-yellow-300",
    glowColor: "shadow-[0_4px_20px_rgba(250,204,21,0.22)]",
    top: "52%",
    left: "1%",
    floatDelay: 0.8,
  },
  {
    id: "share",
    icon: Share2,
    spineColor: "bg-emerald-500",
    iconColor: "text-emerald-300",
    glowColor: "shadow-[0_4px_20px_rgba(16,185,129,0.22)]",
    top: "70%",
    right: "3%",
    floatDelay: 0.3,
  },
  {
    id: "folder",
    icon: FolderKanban,
    spineColor: "bg-rose-500",
    iconColor: "text-rose-300",
    glowColor: "shadow-[0_4px_20px_rgba(244,63,94,0.22)]",
    top: "18%",
    right: "3%",
    floatDelay: 0.6,
  },
  {
    id: "book",
    icon: BookOpen,
    spineColor: "bg-cyan-400",
    iconColor: "text-cyan-300",
    glowColor: "shadow-[0_4px_20px_rgba(34,211,238,0.22)]",
    bottom: "12%",
    left: "4%",
    floatDelay: 1.0,
  },
];

function FloatTile({ tile }: { tile: Tile }) {
  const Icon = tile.icon;
  return (
    <motion.div
      className={`absolute hidden lg:block h-[68px] w-[50px] rounded-[7px] border border-white/12 bg-[#111111] overflow-hidden ${tile.glowColor}`}
      style={{
        top: tile.top,
        bottom: tile.bottom,
        left: tile.left,
        right: tile.right,
      }}
      initial={{ opacity: 0, y: 8 }}
      animate={{
        opacity: 1,
        y: [0, -8, 0],
      }}
      transition={{
        opacity: { duration: 0.6, delay: tile.floatDelay },
        y: {
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: tile.floatDelay,
        },
      }}
    >
      {/* Spine */}
      <div className={`absolute left-0 top-0 bottom-0 w-[9px] ${tile.spineColor} opacity-80`} />
      {/* Spine shadow / page edge */}
      <div className="absolute left-[9px] top-0 bottom-0 w-[2px] bg-black/30" />
      {/* Ruled lines on cover */}
      <div
        className="absolute top-0 bottom-0 right-0"
        style={{
          left: "11px",
          backgroundImage:
            "repeating-linear-gradient(transparent, transparent 8px, rgba(255,255,255,0.045) 8px, rgba(255,255,255,0.045) 9px)",
          backgroundPosition: "0 14px",
        }}
      />
      {/* Icon */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ paddingLeft: "11px" }}
      >
        <Icon className={`h-4 w-4 ${tile.iconColor}`} />
      </div>
    </motion.div>
  );
}

export function FloatingTiles() {
  return (
    <>
      {heroTiles.map((tile) => (
        <FloatTile key={tile.id} tile={tile} />
      ))}
    </>
  );
}
