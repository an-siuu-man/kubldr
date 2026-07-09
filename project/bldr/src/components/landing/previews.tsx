"use client";

// ---------------------------------------------------------------------------
// SearchPreview — simulates the class search panel
// ---------------------------------------------------------------------------

const searchResults = [
  {
    dept: "MATH",
    code: "116",
    title: "Calculus I",
    seats: 14,
    seatColor: "bg-emerald-500",
  },
  {
    dept: "EECS",
    code: "168",
    title: "Programming I",
    seats: 7,
    seatColor: "bg-yellow-400",
  },
  {
    dept: "CHEM",
    code: "184",
    title: "General Chemistry",
    seats: 2,
    seatColor: "bg-red-500",
  },
  {
    dept: "ENGL",
    code: "101",
    title: "Comp & Rhetoric",
    seats: 22,
    seatColor: "bg-emerald-500",
  },
];

export function SearchPreview() {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-white/10 bg-[#111111] shadow-[0_24px_64px_rgba(0,0,0,0.5)]">
      {/* search bar */}
      <div className="border-b border-white/8 bg-[#1a1a1a] px-4 py-3">
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#222222] px-3 py-2">
          <svg
            aria-hidden="true"
            className="h-4 w-4 shrink-0 text-white/30"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <span className="font-inter text-sm text-white/25">
            Search by dept, code, or title…
          </span>
        </div>
      </div>

      {/* result rows */}
      <div className="divide-y divide-white/5">
        {searchResults.map((r) => (
          <div
            key={r.code}
            className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-white/3"
          >
            <div>
              <span className="font-dmsans text-sm font-semibold text-white/90">
                {r.dept} {r.code}
              </span>
              <p className="font-inter text-xs text-white/45">{r.title}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`h-2 w-2 rounded-full ${r.seatColor}`} />
              <span className="font-mono text-xs text-white/40">
                {r.seats} seats
              </span>
              <div className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-dmsans text-xs text-white/60">
                Add
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// VersionsPreview — mirrors the real Sidebar schedule list (Sidebar.tsx):
// semester accordion header, dot indicator, hover/active states, and the
// same "Active" pill styling.
// ---------------------------------------------------------------------------

const versions = [
  { name: "Plan A", active: true },
  { name: "Plan B (no lab)", active: false },
  { name: "Early classes", active: false },
  { name: "No Fridays", active: false },
];

export function VersionsPreview() {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-white/10 bg-[#151515] shadow-[0_24px_64px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-2 border-b border-white/8 px-4 py-3">
        <svg
          aria-hidden="true"
          className="h-3.5 w-3.5 text-emerald-400"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
        <p className="font-figtree text-sm font-semibold text-emerald-400">
          Spring 2026
        </p>
      </div>
      <div className="space-y-0.5 p-2">
        {versions.map((v) => (
          <div
            key={v.name}
            className={`flex items-center rounded-lg transition-colors duration-150 ${
              v.active ? "bg-white/8" : "hover:bg-white/5"
            }`}
          >
            <span
              className={`ml-3 h-1.5 w-1.5 shrink-0 rounded-full ${
                v.active ? "bg-emerald-400" : ""
              }`}
            />
            <span
              className={`flex-1 min-w-0 truncate px-2 py-2 font-dmsans text-xs ${
                v.active ? "font-semibold text-white" : "text-white/55"
              }`}
            >
              {v.name}
            </span>
            {v.active && (
              <span className="mr-3 shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 font-dmsans text-[10px] font-medium text-emerald-400">
                Active
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SectionDetailPreview — mirrors the real hover tooltip rendered by
// CalendarEditor.tsx for a class block (same layout, colored top border,
// and Section/Room/Meeting/Instructor grid).
// ---------------------------------------------------------------------------

export function SectionDetailPreview() {
  return (
    <div
      className="w-80 max-w-full overflow-hidden rounded-md border border-[#404040] bg-[#181818] font-figtree shadow-[0_24px_64px_rgba(0,0,0,0.5)]"
      style={{ borderTopWidth: "3px", borderTopColor: "#c1efc1" }}
    >
      <div className="border-b border-white/10 px-3 py-2">
        <p className="text-sm font-bold text-slate-50">EECS 168 (LEC)</p>
        <p className="truncate text-xs text-slate-400">Programming I</p>
      </div>

      <div className="space-y-2.5 px-3 pt-2.5 pb-4 text-xs">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          <p className="min-w-0 leading-5">
            <span className="font-semibold text-slate-300">Section:</span>{" "}
            <span className="text-slate-100">#52</span>
          </p>
          <p className="min-w-0 leading-5">
            <span className="font-semibold text-slate-300">Room:</span>{" "}
            <span className="text-slate-100">Eaton 1005D</span>
          </p>
          <p className="col-span-2 min-w-0 leading-5">
            <span className="font-semibold text-slate-300">Meeting:</span>{" "}
            <span className="text-slate-100">MWF • 10:00 – 10:50 AM</span>
          </p>
          <p className="col-span-2 min-w-0 leading-5">
            <span className="font-semibold text-slate-300">Instructor:</span>{" "}
            <span className="text-slate-100">Dr. Jane Doe</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-white/10 pt-2.5 text-[11px] leading-5">
          <p className="min-w-0">
            <span className="font-semibold text-slate-300">Seats:</span>{" "}
            <span className="font-semibold text-yellow-400">7 of 35</span>
          </p>
          <p className="col-span-2 min-w-0 text-slate-400">
            <span className="font-semibold text-slate-300">Actions:</span>{" "}
            Double-click to pin; right-click for options
          </p>
        </div>
      </div>
    </div>
  );
}
