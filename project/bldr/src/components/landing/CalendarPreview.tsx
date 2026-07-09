"use client";

// Mirrors the real weekly grid rendered by CalendarEditor.tsx (dark theme):
// same "Time" + day-abbreviation header row, hourly rows from 8am–8pm, and
// the same course-block color palette / label format ("DEPT CODE (Comp)").

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

const HOURS = [
  "8 AM",
  "9 AM",
  "10 AM",
  "11 AM",
  "12 PM",
  "1 PM",
  "2 PM",
  "3 PM",
  "4 PM",
  "5 PM",
  "6 PM",
  "7 PM",
  "8 PM",
];

// Same 12-color palette CalendarEditor hashes course codes into
const colors = [
  "#f5d2d2", // soft pink
  "#efd8c1", // peach
  "#efefc1", // pastel yellow
  "#d8efc1", // yellow-green
  "#c1efc1", // mint
  "#c1efd8", // aqua
  "#c1efef", // light cyan
  "#c1d8ef", // baby blue
  "#c1c1ef", // periwinkle
  "#d8c1ef", // lavender
  "#efc1ef", // light magenta
  "#efc1d8", // rose
];

type Block = {
  day: number; // 0=Mon … 4=Fri
  start: number; // 0-indexed hour offset from 8am
  label: string;
  color: string;
};

const blocks: Block[] = [
  { day: 0, start: 1, label: "MATH 116 (LEC)", color: colors[7] },
  { day: 0, start: 5, label: "EECS 168 (LEC)", color: colors[3] },
  { day: 1, start: 0, label: "ENGL 101 (LEC)", color: colors[0] },
  { day: 1, start: 4, label: "CHEM 184 (LAB)", color: colors[1] },
  { day: 2, start: 1, label: "MATH 116 (LEC)", color: colors[7] },
  { day: 2, start: 5, label: "EECS 168 (LEC)", color: colors[3] },
  { day: 3, start: 0, label: "ENGL 101 (LEC)", color: colors[0] },
  { day: 3, start: 4, label: "CHEM 184 (LAB)", color: colors[1] },
  { day: 4, start: 2, label: "HIST 128 (LEC)", color: colors[11] },
  { day: 4, start: 6, label: "BIOL 150 (LEC)", color: colors[6] },
];

export function CalendarPreview() {
  return (
    /* Browser chrome wrapper */
    <div className="w-full overflow-hidden rounded-2xl border border-white/10 bg-[#111111] shadow-[0_40px_100px_rgba(0,0,0,0.6)]">
      {/* Traffic-light title bar */}
      <div className="flex items-center gap-2 border-b border-white/8 bg-[#1a1a1a] px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-red-500/80" />
        <span className="h-3 w-3 rounded-full bg-yellow-400/80" />
        <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
        <div className="ml-3 flex-1 rounded-md bg-white/5 px-3 py-1 font-mono text-xs text-white/30">
          bldr — Fall 2025 — Plan A
        </div>
      </div>

      {/* Calendar body — matches CalendarEditor's grid container */}
      <div className="p-4">
        <div className="relative rounded-[10px] border-2 border-[#404040] bg-[#2c2c2c] px-2 py-2 text-white">
          <table className="w-full table-fixed border-collapse">
            <thead>
              <tr>
                <th className="h-6 w-8 text-center font-figtree text-[10px] font-semibold lg:h-8 lg:w-10">
                  Time
                </th>
                {DAYS.map((day) => (
                  <th
                    key={day}
                    className="p-0.5 text-center font-figtree text-[10px] font-semibold lg:p-1"
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS.map((h, rowIdx) => (
                <tr
                  key={h}
                  className="relative h-[34px] border-t border-[#404040]"
                >
                  <td className="whitespace-nowrap pr-1 text-right align-top font-figtree text-[8px] text-white lg:text-[10px]">
                    {h}
                  </td>
                  {DAYS.map((day, colIdx) => (
                    <td key={`${h}-${day}`} className="relative w-[18%]">
                      <div className="absolute top-1/2 z-0 w-full -translate-y-1/2 border-t border-dashed border-[#424242]" />
                      {blocks
                        .filter((b) => b.day === colIdx && b.start === rowIdx)
                        .map((b) => (
                          <div
                            key={`${b.label}-${b.day}-${b.start}`}
                            className="absolute left-0.5 right-0.5 top-0.5 z-10 m-0.5 overflow-hidden rounded-md p-1 text-[#333333] shadow-md"
                            style={{ backgroundColor: b.color }}
                          >
                            <p className="truncate font-dmsans text-[9px] font-bold leading-tight">
                              {b.label}
                            </p>
                          </div>
                        ))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
