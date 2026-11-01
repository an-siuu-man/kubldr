"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

// Illustrative sample data: real KU course numbers and buildings, invented
// sections. Labelled as a sample in the UI.

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const FIRST_HOUR = 8;
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16];
const TOTAL = 47;

type Block = {
  code: string;
  room: string;
  days: number[];
  start: number; // hour, e.g. 9.5 = 9:30
  length: number; // hours
  busy?: boolean;
};

type Sample = { number: number; note: string; blocks: Block[] };

const samples: Sample[] = [
  {
    number: 3,
    note: "no Fridays after 11!",
    blocks: [
      {
        code: "ENGL 102",
        room: "Wescoe 4012",
        days: [1, 3],
        start: 8,
        length: 1.25,
      },
      {
        code: "MATH 125",
        room: "Snow 152",
        days: [0, 2, 4],
        start: 9,
        length: 1,
      },
      {
        code: "EECS 168",
        room: "LEEP2 G415",
        days: [0, 2],
        start: 11,
        length: 1.25,
      },
      {
        code: "CHEM 130",
        room: "Malott 3004",
        days: [1],
        start: 13,
        length: 2.5,
      },
      {
        code: "HIST 129",
        room: "Fraser 101",
        days: [0, 2],
        start: 14,
        length: 1,
      },
    ],
  },
  {
    number: 12,
    note: "done by 2 every day",
    blocks: [
      {
        code: "MATH 125",
        room: "Snow 152",
        days: [0, 2, 4],
        start: 8,
        length: 1,
      },
      {
        code: "ENGL 102",
        room: "Wescoe 4012",
        days: [1, 3],
        start: 9.5,
        length: 1.25,
      },
      {
        code: "EECS 168",
        room: "LEEP2 G415",
        days: [0, 2, 4],
        start: 10,
        length: 1,
      },
      {
        code: "HIST 129",
        room: "Fraser 101",
        days: [1, 3],
        start: 11,
        length: 1.25,
      },
      {
        code: "CHEM 130",
        room: "Malott 3004",
        days: [4],
        start: 11,
        length: 2.5,
      },
    ],
  },
  {
    number: 27,
    note: "works around my shifts",
    blocks: [
      {
        code: "Busy · work",
        room: "Union",
        days: [1, 3],
        start: 8,
        length: 3,
        busy: true,
      },
      {
        code: "MATH 125",
        room: "Snow 152",
        days: [0, 2, 4],
        start: 10,
        length: 1,
      },
      {
        code: "EECS 168",
        room: "LEEP2 G415",
        days: [1, 3],
        start: 11.5,
        length: 1.25,
      },
      {
        code: "ENGL 102",
        room: "Wescoe 4012",
        days: [0, 2],
        start: 13,
        length: 1.25,
      },
      {
        code: "CHEM 130",
        room: "Malott 3004",
        days: [3],
        start: 13.5,
        length: 2.5,
      },
      {
        code: "HIST 129",
        room: "Fraser 101",
        days: [1],
        start: 14,
        length: 1.25,
      },
    ],
  },
  {
    number: 41,
    note: "sleep in. every day.",
    blocks: [
      {
        code: "EECS 168",
        room: "LEEP2 G415",
        days: [0, 2, 4],
        start: 11,
        length: 1,
      },
      {
        code: "ENGL 102",
        room: "Wescoe 4012",
        days: [1, 3],
        start: 11,
        length: 1.25,
      },
      {
        code: "MATH 125",
        room: "Snow 152",
        days: [0, 2, 4],
        start: 13,
        length: 1,
      },
      {
        code: "HIST 129",
        room: "Fraser 101",
        days: [1, 3],
        start: 14,
        length: 1.25,
      },
      {
        code: "CHEM 130",
        room: "Malott 3004",
        days: [0],
        start: 14,
        length: 2.5,
      },
    ],
  },
];

const AUTO_FLIP_MS = 3800;
const ease = [0.16, 1, 0.3, 1] as const;

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function BlockLayer({ blocks, ghost }: { blocks: Block[]; ghost?: boolean }) {
  return (
    <>
      {blocks.flatMap((b) =>
        b.days.map((d) => {
          const style = {
            "--day": d,
            "--start": b.start - FIRST_HOUR,
            "--len": b.length,
          } as React.CSSProperties;
          if (ghost) {
            return (
              <div
                key={`${b.code}-${d}`}
                className="carbon-block carbon-block--ghost"
                style={style}
              />
            );
          }
          return (
            <div
              key={`${b.code}-${d}`}
              className={`carbon-block ${b.busy ? "carbon-block--busy" : ""}`}
              style={style}
            >
              <span className="carbon-block__code">{b.code}</span>
              <span className="carbon-block__room">{b.room}</span>
            </div>
          );
        }),
      )}
    </>
  );
}

export function CarbonPad() {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [ghost, setGhost] = useState<{ key: number; blocks: Block[] } | null>(
    null,
  );
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  // Once someone takes the controls (prev/next/pause), auto-flip stays off.
  const [stopped, setStopped] = useState(false);
  const ghostKey = useRef(0);
  const indexRef = useRef(0);

  // The sheet being flipped away leaves a fading carbon impression behind.
  const go = useCallback((dir: 1 | -1) => {
    const current = indexRef.current;
    const next = (current + dir + samples.length) % samples.length;
    ghostKey.current += 1;
    indexRef.current = next;
    setGhost({ key: ghostKey.current, blocks: samples[current].blocks });
    setIndex(next);
  }, []);

  const autoFlipping = !reduceMotion && !stopped;

  useEffect(() => {
    if (!autoFlipping || hovered || focused) return;
    const id = window.setInterval(() => go(1), AUTO_FLIP_MS);
    return () => window.clearInterval(id);
  }, [go, autoFlipping, hovered, focused]);

  const step = (dir: 1 | -1) => {
    setStopped(true);
    go(dir);
  };

  const sample = samples[index];

  return (
    <section
      aria-label="Sample schedules generated by bldr"
      className="carbon-sheet-body"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setFocused(false);
        }
      }}
    >
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-[var(--form-rule-strong)] pb-3">
        <div>
          <p className="form-label">5 courses · sample</p>
          <p className="ballpoint mt-1 text-[28px] leading-none" aria-hidden>
            {sample.note}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => step(-1)}
            className="form-icon-button"
            aria-label="Previous schedule"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
          </button>
          <p
            className="flex items-baseline gap-2"
            aria-live={stopped ? "polite" : "off"}
          >
            <span className="sr-only">Schedule</span>
            <span className="relative inline-block h-[44px] w-[1.45em] overflow-hidden font-black text-[44px] leading-[44px] text-[var(--ballpoint)] [font-stretch:115%] tabular-nums">
              <AnimatePresence initial={false} mode="popLayout">
                <motion.span
                  key={sample.number}
                  className="absolute inset-0"
                  initial={reduceMotion ? false : { y: "100%" }}
                  animate={{ y: 0 }}
                  exit={reduceMotion ? undefined : { y: "-100%" }}
                  transition={{ duration: 0.45, ease }}
                >
                  {pad(sample.number)}
                </motion.span>
              </AnimatePresence>
            </span>
            <span className="form-label leading-tight">
              of {TOTAL}
              <br />
              schedules
            </span>
          </p>
          <button
            type="button"
            onClick={() => step(1)}
            className="form-icon-button"
            aria-label="Next schedule"
          >
            <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={() => setStopped((s) => !s)}
            className="form-icon-button motion-reduce:hidden"
            aria-label={stopped ? "Play schedules" : "Pause schedules"}
          >
            {stopped ? (
              <Play className="h-[18px] w-[18px]" strokeWidth={2.5} />
            ) : (
              <Pause className="h-[18px] w-[18px]" strokeWidth={2.5} />
            )}
          </button>
        </div>
      </div>

      <div className="carbon-grid relative mt-3">
        <div className="carbon-grid__head">
          <span />
          {DAYS.map((d) => (
            <span key={d} className="form-label">
              {d}
            </span>
          ))}
        </div>
        <div className="carbon-grid__body">
          {HOURS.map((h) => (
            <div key={h} className="carbon-grid__row">
              <span className="form-label carbon-grid__hour">
                {h > 12 ? h - 12 : h}:00
              </span>
            </div>
          ))}

          <div className="carbon-grid__plot">
            <AnimatePresence>
              {ghost && !reduceMotion && (
                <motion.div
                  key={ghost.key}
                  className="absolute inset-0"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 2.2, ease: "easeOut" }}
                  aria-hidden
                >
                  <BlockLayer blocks={ghost.blocks} ghost />
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence initial={false} mode="popLayout">
              <motion.div
                key={sample.number}
                className="absolute inset-0"
                initial={
                  reduceMotion ? false : { opacity: 0, y: 10, rotate: 0.4 }
                }
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                exit={
                  reduceMotion
                    ? undefined
                    : {
                        opacity: 0,
                        y: -26,
                        rotate: -1.6,
                        filter: "blur(1.5px)",
                      }
                }
                transition={{ duration: 0.55, ease }}
              >
                <BlockLayer blocks={sample.blocks} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        <div className="form-stamp" aria-hidden>
          {TOTAL} fit
          <small>no time conflicts</small>
        </div>
      </div>

      <p className="form-label mt-3 text-[var(--form-muted)]">
        Sample schedules · illustrative sections
      </p>
    </section>
  );
}
