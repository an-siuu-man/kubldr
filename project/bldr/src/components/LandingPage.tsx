"use client";

import { MotionConfig } from "framer-motion";
import { ArrowRight, Check, Link2, Lock, Scissors } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CarbonPad } from "@/components/landing/CarbonPad";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import "@/components/landing/landing.css";

// ─── Content ────────────────────────────────────────────────────────────────

const steps = [
  {
    title: "List your courses",
    body: "Search the KU catalog by department, number or title. EECS 168, MATH 125, whatever is on your degree map this term.",
  },
  {
    title: "bldr fills in every combination",
    body: "Every way your sections fit together without a time conflict, working around any busy blocks you mark for work, practice or sleep.",
  },
  {
    title: "Pick one, keep the rest",
    body: "Save the one you like as your plan, keep backups as versions, and send a read-only link to your advisor or roommate.",
  },
];

const versions = [
  { name: "Plan A", active: true },
  { name: "Plan B (no lab)", active: false },
  { name: "Early classes", active: false },
  { name: "No Fridays", active: false },
];

const faqs = [
  {
    q: "Is bldr free?",
    a: "Yes, completely. Start as a guest with no sign-up, or make a free account with your email.",
  },
  {
    q: "Do I need an account, or can I use it as a guest?",
    a: "Guest mode lets you build and browse schedules right away. A free account adds saved schedules, multiple versions and sharing.",
  },
  {
    q: "Is bldr only for KU students?",
    a: "bldr is built on the University of Kansas course catalog, so class search and seat data are KU-specific. The calendar and version tools work the same for anyone, but the courses are KU's.",
  },
  {
    q: "How current is the seat data?",
    a: "Class and seat data is synced from KU's class search on a schedule, not live. Treat seat counts as a guide and confirm in Enroll & Pay before you enroll.",
  },
  {
    q: "How does sharing work?",
    a: "Once a schedule is saved, turn on its public link in the share panel. Anyone with the link sees a read-only calendar of your courses and times. Your busy blocks are never shown.",
  },
  {
    q: "Is my schedule private?",
    a: "Yes, by default every schedule is visible only to you. Public links are opt-in, and you can turn them off at any time.",
  },
];

// ─── Guest start ────────────────────────────────────────────────────────────

function useGuestStart() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setPending(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error || !data.user) {
        setError(
          "Couldn't start a guest session. Try again, or log in instead.",
        );
        return;
      }
      router.push("/builder");
      router.refresh();
    } catch {
      setError("Couldn't reach bldr. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  };

  return { start, pending, error };
}

function PrimaryAction({
  isLoggedIn,
  guest,
  className = "",
}: {
  isLoggedIn: boolean;
  guest: ReturnType<typeof useGuestStart>;
  className?: string;
}) {
  if (isLoggedIn) {
    return (
      <Link href="/builder" className={`form-button ${className}`}>
        Open your builder
        <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2.5} />
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={guest.start}
      disabled={guest.pending}
      className={`form-button ${className}`}
    >
      {guest.pending ? (
        <>
          <Spinner className="h-4 w-4" />
          Opening the builder…
        </>
      ) : (
        <>
          Try it as a guest
          <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2.5} />
        </>
      )}
    </button>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { user } = useAuth();
  const isLoggedIn = Boolean(user);
  const guest = useGuestStart();

  return (
    <MotionConfig reducedMotion="user">
      <div className="form-world min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-[var(--form-rule-strong)] bg-[var(--form-desk)]/95 backdrop-blur-[2px]">
          <div className="mx-auto flex max-w-[1360px] items-center justify-between gap-4 px-4 py-3 sm:px-8 lg:px-14">
            <Link
              href="/"
              className="flex items-center gap-2.5"
              aria-label="bldr home"
            >
              <img
                src="/logo.svg"
                alt=""
                className="h-9 w-auto"
                draggable={false}
              />
              <span className="font-black text-[30px] leading-none tracking-[-0.03em] text-[var(--crimson)] [font-stretch:125%]">
                bldr
              </span>
            </Link>
            <nav className="flex items-center gap-1 sm:gap-2">
              <a href="#how" className="form-nav-link hidden md:inline-flex">
                How it works
              </a>
              <a href="#faq" className="form-nav-link hidden md:inline-flex">
                FAQ
              </a>
              {isLoggedIn ? (
                <Link href="/builder" className="form-nav-link">
                  Your builder
                </Link>
              ) : (
                <>
                  <Link href="/login" className="form-nav-link">
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="form-nav-link form-nav-link--boxed hidden sm:inline-flex"
                  >
                    Sign up free
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>

        <main>
          {/* ── Hero: the carbon pad ── */}
          <section className="mx-auto max-w-[1360px] px-4 pb-20 pt-8 sm:px-8 sm:pt-12 lg:px-14 lg:pb-28">
            <div className="carbon-pad">
              <div className="carbon-copy carbon-copy--pink" aria-hidden />
              <div className="carbon-copy carbon-copy--canary" aria-hidden />

              <div className="carbon-copy carbon-copy--top grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
                <div className="flex items-center justify-between gap-4 border-b-2 border-[var(--crimson)] px-5 py-3 sm:px-8 lg:col-span-2 lg:px-10">
                  <p className="form-label">
                    Enrollment worksheet · for KU students
                  </p>
                  <p className="form-label hidden sm:block">
                    Spring 2027 · form bldr-27
                  </p>
                </div>

                <div className="flex flex-col border-b border-[var(--form-rule-strong)] p-5 sm:p-8 lg:border-b-0 lg:border-r lg:p-10">
                  <h1 className="text-balance font-black text-[clamp(2.75rem,5.6vw,5.25rem)] leading-[0.92] tracking-[-0.03em] text-[var(--crimson)] [font-stretch:115%]">
                    Every schedule that fits.{" "}
                    <span className="text-[var(--ballpoint)]">
                      Not just the first.
                    </span>
                  </h1>

                  <p className="mb-9 mt-6 max-w-[34rem] text-pretty text-[clamp(1.05rem,1.3vw,1.2rem)] leading-[1.55] text-[var(--form-ink)]">
                    Add the classes you need. bldr lays out every conflict-free
                    combination of sections, and you flip through them until one
                    feels right.
                  </p>

                  <div className="mt-auto border-2 border-[var(--crimson)]">
                    <p className="form-label border-b border-[var(--crimson)] px-3 py-1.5">
                      {isLoggedIn
                        ? "Welcome back"
                        : "Start here · no account needed"}
                    </p>
                    <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-3.5">
                      <span
                        className="ballpoint text-[32px] leading-none"
                        aria-hidden
                      >
                        {isLoggedIn ? "back at it —" : "just looking —"}
                      </span>
                      <PrimaryAction
                        isLoggedIn={isLoggedIn}
                        guest={guest}
                        className="w-full sm:w-auto"
                      />
                    </div>
                  </div>
                  {guest.error && (
                    <p
                      role="alert"
                      className="mt-3 text-[15px] font-semibold text-[var(--crimson)]"
                    >
                      {guest.error}
                    </p>
                  )}
                  {!isLoggedIn && (
                    <p className="mt-4 text-[15px] leading-relaxed text-[var(--form-ink)]">
                      Want to keep your plans?{" "}
                      <Link href="/signup" className="form-link">
                        Create a free account
                      </Link>{" "}
                      or{" "}
                      <Link href="/login" className="form-link">
                        log in
                      </Link>
                      .
                    </p>
                  )}
                </div>

                <div className="p-5 sm:p-8 lg:p-10">
                  <CarbonPad />
                </div>
              </div>

              <div className="carbon-tabs" aria-hidden>
                <span className="bg-[var(--form-paper)]">
                  White · your plan
                </span>
                <span className="bg-[var(--canary)]">Canary · backup</span>
                <span className="bg-[var(--pink)]">Pink · advisor</span>
              </div>
            </div>
          </section>

          {/* ── How it works: canary copy ── */}
          <section
            id="how"
            className="scroll-mt-20 border-y-2 border-[var(--crimson)] bg-[var(--canary)]"
          >
            <div className="mx-auto max-w-[1360px] px-4 py-16 sm:px-8 lg:px-14 lg:py-24">
              <h2 className="max-w-[18ch] text-balance font-black text-[clamp(2rem,3.6vw,3.25rem)] leading-[0.98] tracking-[-0.025em] text-[var(--crimson)] [font-stretch:112%]">
                How to fill out this worksheet
              </h2>
              <ol className="mt-10 grid border-t-2 border-[var(--crimson)] md:grid-cols-3">
                {steps.map((s, i) => (
                  <li
                    key={s.title}
                    className="border-b border-[var(--form-rule-strong)] py-6 md:border-b-0 md:border-l md:px-7 md:py-8 md:first:border-l-0 md:first:pl-0"
                  >
                    <span className="font-black text-[56px] leading-none text-[var(--crimson)] [font-stretch:125%]">
                      {i + 1}
                    </span>
                    <h3 className="mt-4 font-extrabold text-[22px] leading-tight text-[var(--form-ink)] [font-stretch:95%]">
                      {s.title}
                    </h3>
                    <p className="mt-2.5 max-w-[38ch] text-[16px] leading-[1.6] text-[var(--form-ink)]">
                      {s.body}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* ── The fine print: what's on the sheet ── */}
          <section className="mx-auto max-w-[1360px] px-4 py-16 sm:px-8 lg:px-14 lg:py-24">
            <h2 className="max-w-[20ch] text-balance font-black text-[clamp(2rem,3.6vw,3.25rem)] leading-[0.98] tracking-[-0.025em] text-[var(--crimson)] [font-stretch:112%]">
              The fine print, filled in for you
            </h2>

            <div className="form-sheet mt-10 grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
              {/* Section detail */}
              <div className="border-b border-[var(--form-rule-strong)] p-5 sm:p-8 lg:border-b-0 lg:border-r">
                <p className="form-label">Section detail</p>
                <p className="mt-3 max-w-[40ch] text-[17px] leading-[1.6]">
                  Know the section before you commit: instructor, room, meeting
                  times and seats left, right on the block.
                </p>
                <dl className="mt-6 grid grid-cols-2 border-2 border-[var(--crimson)] text-[15px]">
                  <div className="col-span-2 border-b border-[var(--crimson)] px-3 py-2.5">
                    <dt className="form-label">Course</dt>
                    <dd className="mt-0.5 font-extrabold text-[20px] text-[var(--ballpoint)]">
                      EECS 168 · Programming I{" "}
                      <span className="font-semibold text-[var(--form-muted)]">
                        (LEC)
                      </span>
                    </dd>
                  </div>
                  <div className="border-b border-r border-[var(--crimson)] px-3 py-2.5">
                    <dt className="form-label">Section</dt>
                    <dd className="mt-0.5 font-semibold">52</dd>
                  </div>
                  <div className="border-b border-[var(--crimson)] px-3 py-2.5">
                    <dt className="form-label">Room</dt>
                    <dd className="mt-0.5 font-semibold">LEEP2 G415</dd>
                  </div>
                  <div className="border-b border-r border-[var(--crimson)] px-3 py-2.5">
                    <dt className="form-label">Meets</dt>
                    <dd className="mt-0.5 font-semibold">MW · 11:00–12:15</dd>
                  </div>
                  <div className="border-b border-[var(--crimson)] px-3 py-2.5">
                    <dt className="form-label">Instructor</dt>
                    <dd className="mt-0.5 font-semibold">Staff</dd>
                  </div>
                  <div className="col-span-2 flex items-center justify-between gap-3 px-3 py-2.5">
                    <div>
                      <dt className="form-label">Seats</dt>
                      <dd className="mt-0.5 font-extrabold text-[var(--crimson)]">
                        7 of 35 left
                      </dd>
                    </div>
                    <span
                      className="ballpoint text-[26px] leading-none"
                      aria-hidden
                    >
                      grab it early
                    </span>
                  </div>
                </dl>
                <p className="mt-4 text-[14px] leading-relaxed text-[var(--form-muted)]">
                  Sample section. Seat data is synced from KU's class search, so
                  confirm in Enroll &amp; Pay before you enroll.
                </p>
              </div>

              {/* Versions + sharing */}
              <div className="flex flex-col">
                <div className="border-b border-[var(--form-rule-strong)] p-5 sm:p-8">
                  <p className="form-label">Versions</p>
                  <p className="mt-3 max-w-[36ch] text-[17px] leading-[1.6]">
                    Keep backups. If your 8 AM fills before your enrollment
                    time, Plan B is one click away.
                  </p>
                  <ul className="mt-5">
                    {versions.map((v) => (
                      <li
                        key={v.name}
                        className={`flex items-center justify-between border-b border-[var(--form-rule)] py-2.5 text-[16px] ${
                          v.active
                            ? "font-extrabold text-[var(--ballpoint)]"
                            : "text-[var(--form-ink)]"
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <span className="grid h-[18px] w-[18px] place-items-center border-2 border-[var(--crimson)]">
                            {v.active && (
                              <Check
                                className="h-3 w-3 text-[var(--ballpoint)]"
                                strokeWidth={4}
                              />
                            )}
                          </span>
                          {v.name}
                        </span>
                        {v.active && <span className="form-label">Active</span>}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-[var(--pink)] p-5 sm:p-8 lg:flex-1">
                  <p className="form-label">Sharing</p>
                  <ul className="mt-3 space-y-3 text-[16px] leading-[1.55]">
                    <li className="flex gap-3">
                      <Link2
                        className="mt-1 h-[18px] w-[18px] shrink-0 text-[var(--crimson)]"
                        strokeWidth={2.5}
                      />
                      <span>
                        Send a read-only link to your advisor or roommate. Turn
                        it off whenever you like.
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <Lock
                        className="mt-1 h-[18px] w-[18px] shrink-0 text-[var(--crimson)]"
                        strokeWidth={2.5}
                      />
                      <span>
                        Schedules are private by default, and busy blocks never
                        show on a shared link.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* ── FAQ: pink copy ── */}
          <section
            id="faq"
            className="scroll-mt-20 border-y-2 border-[var(--crimson)] bg-[var(--pink)]"
          >
            <div className="mx-auto grid max-w-[1360px] gap-8 px-4 py-16 sm:px-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:px-14 lg:py-24">
              <h2 className="max-w-[14ch] text-balance font-black text-[clamp(2rem,3.6vw,3.25rem)] leading-[0.98] tracking-[-0.025em] text-[var(--crimson)] [font-stretch:112%]">
                Questions at the window
              </h2>
              <Accordion
                type="single"
                collapsible
                className="border-t-2 border-[var(--crimson)]"
              >
                {faqs.map((faq) => (
                  <AccordionItem
                    key={faq.q}
                    value={faq.q}
                    className="border-b border-[var(--form-rule-strong)]"
                  >
                    <AccordionTrigger className="py-5 text-left font-extrabold text-[18px] text-[var(--form-ink)] hover:no-underline focus-visible:ring-0 [font-stretch:95%] [&>svg]:size-5 [&>svg]:text-[var(--crimson)]">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="max-w-[62ch] pb-5 text-[16px] leading-[1.65] text-[var(--form-ink)]">
                        {faq.a}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </section>

          {/* ── Close: tear-off slip ── */}
          <section className="mx-auto max-w-[1360px] px-4 py-16 sm:px-8 lg:px-14 lg:py-24">
            <div className="tear-slip">
              <Scissors
                className="tear-slip__scissors h-5 w-5 text-[var(--crimson)]"
                strokeWidth={2.25}
                aria-hidden
              />
              <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="max-w-[22ch] text-balance font-black text-[clamp(1.9rem,3.2vw,2.9rem)] leading-[1] tracking-[-0.025em] text-[var(--crimson)] [font-stretch:112%]">
                    Walk into enrollment with a plan, and a backup.
                  </p>
                </div>
                <PrimaryAction isLoggedIn={isLoggedIn} guest={guest} />
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t-2 border-[var(--crimson)]">
          <div className="mx-auto flex max-w-[1360px] flex-col gap-3 px-4 py-8 text-[14px] leading-relaxed text-[var(--form-muted)] sm:px-8 md:flex-row md:justify-between lg:px-14">
            <p>
              <span className="font-black text-[var(--crimson)] [font-stretch:125%]">
                bldr
              </span>{" "}
              is built by KU students. It is not affiliated with or endorsed by
              the University of Kansas.
            </p>
            <p>Seat data is synced from KU's class search and may lag.</p>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}
