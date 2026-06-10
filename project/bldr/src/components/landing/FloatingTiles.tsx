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
  edgeColor: string;
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
    edgeColor: "border-l-blue-500",
    glowColor: "shadow-[0_0_24px_rgba(59,130,246,0.25)]",
    top: "10%",
    left: "3%",
    floatDelay: 0,
  },
  {
    id: "search",
    icon: Search,
    edgeColor: "border-l-red-500",
    glowColor: "shadow-[0_0_20px_rgba(239,68,68,0.22)]",
    top: "4%",
    right: "8%",
    floatDelay: 0.4,
  },
  {
    id: "clock",
    icon: Clock,
    edgeColor: "border-l-yellow-400",
    glowColor: "shadow-[0_0_20px_rgba(250,204,21,0.2)]",
    top: "52%",
    left: "1%",
    floatDelay: 0.8,
  },
  {
    id: "share",
    icon: Share2,
    edgeColor: "border-l-emerald-500",
    glowColor: "shadow-[0_0_20px_rgba(16,185,129,0.2)]",
    top: "70%",
    right: "3%",
    floatDelay: 0.3,
  },
  {
    id: "folder",
    icon: FolderKanban,
    edgeColor: "border-l-rose-500",
    glowColor: "shadow-[0_0_20px_rgba(244,63,94,0.2)]",
    top: "18%",
    right: "3%",
    floatDelay: 0.6,
  },
  {
    id: "book",
    icon: BookOpen,
    edgeColor: "border-l-cyan-400",
    glowColor: "shadow-[0_0_20px_rgba(34,211,238,0.2)]",
    bottom: "12%",
    left: "4%",
    floatDelay: 1.0,
  },
];

function FloatTile({ tile }: { tile: Tile }) {
  const Icon = tile.icon;
  return (
    <motion.div
      className={`absolute hidden lg:flex h-[56px] w-[56px] items-center justify-center rounded-[14px] border border-white/10 border-l-[3px] ${tile.edgeColor} bg-[#111111] ${tile.glowColor}`}
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
      <Icon className="h-5 w-5 text-white/70" />
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
