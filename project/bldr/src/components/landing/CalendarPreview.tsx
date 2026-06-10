"use client";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

// Compact time labels shown on the left spine (8am–6pm)
const HOURS = [
  "8am",
  "9am",
  "10am",
  "11am",
  "12pm",
  "1pm",
  "2pm",
  "3pm",
  "4pm",
  "5pm",
];
const TOTAL_ROWS = HOURS.length; // 10 one-hour slots

type Block = {
  day: number; // 0=Mon … 4=Fri
  start: number; // 0-indexed row offset within the 10 slots
  span: number; // how many rows tall
  label: string;
  sub: string;
  color: string; // pastel bg
};

// Fake but realistic-looking KU schedule
const blocks: Block[] = [
  {
    day: 0,
    start: 1,
    span: 2,
    label: "MATH 116",
    sub: "Calculus I",
    color: "#c1d8ef",
  }, // baby blue
  {
    day: 0,
    start: 5,
    span: 2,
    label: "EECS 168",
    sub: "Programming I",
    color: "#d8efc1",
  }, // yellow-green
  {
    day: 1,
    start: 0,
    span: 2,
    label: "ENGL 101",
    sub: "Comp & Rhetoric",
    color: "#f5d2d2",
  }, // soft pink
  {
    day: 1,
    start: 4,
    span: 2,
    label: "CHEM 184",
    sub: "General Chem",
    color: "#efd8c1",
  }, // peach
  {
    day: 2,
    start: 1,
    span: 2,
    label: "MATH 116",
    sub: "Calculus I",
    color: "#c1d8ef",
  },
  {
    day: 2,
    start: 5,
    span: 2,
    label: "EECS 168",
    sub: "Programming I",
    color: "#d8efc1",
  },
  {
    day: 3,
    start: 0,
    span: 2,
    label: "ENGL 101",
    sub: "Comp & Rhetoric",
    color: "#f5d2d2",
  },
  {
    day: 3,
    start: 4,
    span: 2,
    label: "CHEM 184",
    sub: "General Chem",
    color: "#efd8c1",
  },
  {
    day: 4,
    start: 2,
    span: 2,
    label: "HIST 128",
    sub: "World History",
    color: "#efc1d8",
  }, // rose
  {
    day: 4,
    start: 6,
    span: 2,
    label: "BIOL 150",
    sub: "Principles Bio",
    color: "#c1efef",
  }, // light cyan
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

      {/* Calendar body */}
      <div className="overflow-hidden rounded-b-2xl bg-[#1e1e1e]">
        {/* Day headers */}
        <div
          className="grid border-b border-[#404040]"
          style={{ gridTemplateColumns: "44px repeat(5, 1fr)" }}
        >
          <div /> {/* time spine spacer */}
          {DAYS.map((d) => (
            <div
              key={d}
              className="py-2 text-center font-dmsans text-xs font-semibold uppercase tracking-widest text-white/40"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Grid rows */}
        <div
          className="relative grid"
          style={{
            gridTemplateColumns: "44px repeat(5, 1fr)",
            gridTemplateRows: `repeat(${TOTAL_ROWS}, 40px)`,
          }}
        >
          {/* Hour labels + horizontal rules */}
          {HOURS.map((h, rowIdx) => (
            <div key={h} className="contents">
              {/* time label */}
              <div
                className="flex items-start justify-end pr-2 pt-1 font-mono text-[10px] text-white/25"
                style={{ gridColumn: 1, gridRow: rowIdx + 1 }}
              >
                {h}
              </div>
              {/* horizontal rule across all 5 day columns */}
              {DAYS.map((day, colIdx) => (
                <div
                  key={`${h}-${day}`}
                  className="border-t border-[#2e2e2e]"
                  style={{ gridColumn: colIdx + 2, gridRow: rowIdx + 1 }}
                />
              ))}
            </div>
          ))}

          {/* Class blocks */}
          {blocks.map((b) => (
            <div
              key={`${b.label}-${b.day}-${b.start}`}
              className="z-10 m-0.5 overflow-hidden rounded-md p-1 text-[#333333] shadow-sm"
              style={{
                gridColumn: b.day + 2,
                gridRow: `${b.start + 1} / span ${b.span}`,
                backgroundColor: b.color,
              }}
            >
              <p className="truncate font-dmsans text-[9px] font-bold leading-tight">
                {b.label}
              </p>
              <p className="truncate font-inter text-[8px] leading-tight opacity-75">
                {b.sub}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
