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
// VersionsPreview — simulates the saved-schedule version panel
// ---------------------------------------------------------------------------

const versions = [
  { name: "Plan A", active: true },
  { name: "Plan B (no lab)", active: false },
  { name: "Early classes", active: false },
  { name: "No Fridays", active: false },
];

export function VersionsPreview() {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-white/10 bg-[#111111] shadow-[0_24px_64px_rgba(0,0,0,0.5)]">
      <div className="border-b border-white/8 bg-[#1a1a1a] px-4 py-3">
        <p className="font-dmsans text-xs font-semibold uppercase tracking-widest text-white/40">
          My schedules
        </p>
      </div>
      <div className="divide-y divide-white/5">
        {versions.map((v) => (
          <div
            key={v.name}
            className={`flex items-center justify-between px-4 py-3 transition-colors ${
              v.active ? "bg-white/6" : "hover:bg-white/3"
            }`}
          >
            <div className="flex items-center gap-3">
              {v.active && (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              )}
              {!v.active && (
                <span className="h-1.5 w-1.5 rounded-full bg-transparent" />
              )}
              <span
                className={`font-dmsans text-sm ${v.active ? "font-semibold text-white" : "text-white/50"}`}
              >
                {v.name}
              </span>
            </div>
            {v.active && (
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-dmsans text-[10px] font-medium text-emerald-400">
                Active
              </span>
            )}
          </div>
        ))}

        {/* add new */}
        <div className="flex items-center gap-2 px-4 py-3 text-white/30 hover:text-white/50 transition-colors cursor-pointer">
          <svg
            aria-hidden="true"
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span className="font-dmsans text-xs">New schedule</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SectionDetailPreview — simulates the section info / seat detail card
// ---------------------------------------------------------------------------

export function SectionDetailPreview() {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-white/10 bg-[#111111] shadow-[0_24px_64px_rgba(0,0,0,0.5)]">
      <div className="border-b border-white/8 bg-[#1a1a1a] px-4 py-3">
        <p className="font-dmsans text-sm font-semibold text-white/90">
          EECS 168 — Programming I
        </p>
        <p className="font-inter text-xs text-white/40">Section 52 · Lecture</p>
      </div>
      <div className="space-y-3 p-4">
        {/* instructor */}
        <div className="flex items-start gap-3">
          <div className="mt-0.5 h-7 w-7 shrink-0 rounded-full bg-blue-500/20 flex items-center justify-center">
            <span className="font-dmsans text-[10px] font-bold text-blue-400">
              JD
            </span>
          </div>
          <div>
            <p className="font-dmsans text-xs font-semibold text-white/80">
              Dr. Jane Doe
            </p>
            <p className="font-inter text-[11px] text-white/35">Instructor</p>
          </div>
        </div>

        {/* days & times */}
        <div className="rounded-lg bg-white/4 px-3 py-2.5">
          <div className="flex items-center justify-between">
            <span className="font-dmsans text-[11px] text-white/50">Days</span>
            <span className="font-dmsans text-[11px] font-medium text-white/80">
              MWF
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="font-dmsans text-[11px] text-white/50">Time</span>
            <span className="font-dmsans text-[11px] font-medium text-white/80">
              10:00 – 10:50 AM
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="font-dmsans text-[11px] text-white/50">Room</span>
            <span className="font-dmsans text-[11px] font-medium text-white/80">
              Eaton 1005D
            </span>
          </div>
        </div>

        {/* seat availability */}
        <div className="flex items-center justify-between rounded-lg bg-white/4 px-3 py-2.5">
          <span className="font-dmsans text-[11px] text-white/50">
            Seats available
          </span>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-yellow-400" />
            <span className="font-dmsans text-[11px] font-medium text-yellow-400">
              7 of 35
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SharePreview — simulates the schedule-sharing panel
// ---------------------------------------------------------------------------

export function SharePreview() {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-white/10 bg-[#111111] shadow-[0_24px_64px_rgba(0,0,0,0.5)]">
      <div className="border-b border-white/8 bg-[#1a1a1a] px-4 py-3">
        <p className="font-dmsans text-sm font-semibold text-white/90">
          Share Schedule
        </p>
        <p className="font-inter text-xs text-white/40">Plan A · Fall 2025</p>
      </div>
      <div className="space-y-4 p-4">
        {/* toggle row */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-dmsans text-sm font-medium text-white/90">
              Public link
            </p>
            <p className="font-inter text-xs text-white/40">
              Anyone with the link can view
            </p>
          </div>
          {/* fake toggle — on */}
          <div className="relative h-6 w-11 cursor-pointer rounded-full bg-emerald-500">
            <div className="absolute right-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all" />
          </div>
        </div>

        {/* link row */}
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/4 px-3 py-2">
          <span className="flex-1 truncate font-mono text-[11px] text-white/40">
            bldr.app/s/f3a9b2c7
          </span>
          <div className="shrink-0 rounded-md border border-white/10 bg-white/8 px-2.5 py-1 font-dmsans text-[11px] font-medium text-white/70 hover:bg-white/12 transition-colors cursor-pointer">
            Copy
          </div>
        </div>

        {/* read-only note */}
        <p className="font-inter text-[11px] text-white/30">
          Recipients can only view your schedule — they cannot edit or copy it.
        </p>
      </div>
    </div>
  );
}
