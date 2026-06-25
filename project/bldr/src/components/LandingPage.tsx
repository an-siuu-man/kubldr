"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  FolderKanban,
  Info,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { CalendarPreview } from "@/components/landing/CalendarPreview";
import { FloatingTiles } from "@/components/landing/FloatingTiles";
import {
  SearchPreview,
  SectionDetailPreview,
  SharePreview,
  VersionsPreview,
} from "@/components/landing/previews";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

// ─── Content data ────────────────────────────────────────────────────────────

const faqs = [
  {
    q: "Is bldr free to use?",
    a: "Yes — bldr is completely free. Create an account with your email, or jump straight in as a guest with no sign-up required.",
  },
  {
    q: "Do I need to make an account, or can I use it as a guest?",
    a: "You can start as a guest without registering. Guest sessions let you build and explore schedules right away. Creating a free account unlocks saved schedules, multiple versions, and sharing.",
  },
  {
    q: "Is bldr only for KU students?",
    a: "bldr is built specifically for the University of Kansas course catalog, so the real-time class search and seat data are KU-specific. That said, the scheduling workflow is universal — any college student can find value in the calendar and version tools.",
  },
  {
    q: "How does schedule sharing work?",
    a: "Once you save a schedule, you can toggle on a public link in the share panel. Anyone with the link gets a read-only calendar view — they can see your courses and times, but they cannot edit or copy your schedule.",
  },
  {
    q: "Is my schedule data private?",
    a: "By default, all schedules are private and only visible to you. Public share links are strictly opt-in — you decide what gets shared, and you can revoke access at any time.",
  },
];

// ─── Section heading helper ────────────────────────────────────────────────────

function SectionHeading({
  eyebrow,
  headline,
}: {
  eyebrow: string;
  headline: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="font-dmsans text-xs uppercase tracking-[0.3em] text-white/40">
        {eyebrow}
      </p>
      <h2 className="mt-3 font-figtree text-3xl font-semibold tracking-tight text-white sm:text-5xl">
        {headline}
      </h2>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function LandingPage() {
  const { user } = useAuth();
  const isLoggedIn = Boolean(user);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080808] text-white">
      {/* ── Background layers ── */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(250,204,21,0.14),_transparent_24%),radial-gradient(circle_at_bottom,_rgba(239,68,68,0.12),_transparent_32%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:72px_72px] opacity-25" />

      {/* ═══════════════════════════════════════════════════════════════════════
          HEADER — sticky, blurred
      ═══════════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-8 lg:px-10">
          {/* Wordmark */}
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/logo.svg"
              alt="bldr logo"
              className="h-10 w-auto"
              draggable={false}
            />
            <span className="font-dmsans text-3xl font-bold tracking-tight">
              <span className="text-white">b</span>
              <span className="text-red-500">l</span>
              <span className="text-blue-500">d</span>
              <span className="text-yellow-300">r</span>
            </span>
          </Link>

          {/* Nav CTAs */}
          <div className="flex items-center gap-2.5">
            {isLoggedIn ? (
              <Button
                asChild
                variant="ghost"
                className="bg-white font-dmsans text-[#101010] shadow-[0_8px_28px_rgba(255,255,255,0.14)] hover:bg-[#e8e8e8]"
              >
                <Link href="/builder">
                  Go to Builder
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  className="hidden border border-white/10 bg-white/5 font-dmsans text-white hover:bg-white/10 sm:inline-flex"
                >
                  <Link href="/login">Log in</Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  className="bg-white font-dmsans text-[#101010] shadow-[0_8px_28px_rgba(255,255,255,0.14)] hover:bg-[#e8e8e8]"
                >
                  <Link href="/signup">
                    Start building
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* ═══════════════════════════════════════════════════════════════════
            HERO — centered, Notion-style, with CalendarPreview
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="relative mx-auto max-w-7xl px-4 pb-16 pt-20 sm:px-8 lg:px-10 lg:pt-28">
          {/* Floating accent tiles (desktop only) */}
          <FloatingTiles />

          {/* Centered headline block */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto max-w-3xl text-center"
          >
            {/* Badge */}
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-4 py-2 font-inter text-sm text-blue-100">
              <Sparkles className="h-4 w-4 text-blue-300" />
              Designed to make class registration less chaotic
            </div>

            {/* Headline */}
            <h1 className="font-figtree text-5xl font-semibold leading-[1.08] tracking-tight text-white sm:text-7xl lg:text-[88px]">
              Your semester,
              <br />
              finally in one view.
            </h1>

            {/* Sub-copy */}
            {/* <p className="mx-auto mt-6 max-w-xl font-inter text-base leading-7 text-white/55 sm:text-lg">
              bldr combines live course search, a visual weekly calendar,
              schedule versioning, and section-level seat data so you can plan
              faster — with fewer tabs and fewer surprises.
            </p> */}

            {/* Dual CTA */}
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              {isLoggedIn ? (
                <Button
                  asChild
                  size="lg"
                  variant="ghost"
                  className="bg-white font-dmsans text-[#101010] shadow-[0_16px_48px_rgba(255,255,255,0.14)] hover:bg-[#e8e8e8]"
                >
                  <Link href="/builder">
                    Go to Builder
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button
                    asChild
                    size="lg"
                    variant="ghost"
                    className="bg-white font-dmsans text-[#101010] shadow-[0_16px_48px_rgba(255,255,255,0.14)] hover:bg-[#e8e8e8]"
                  >
                    <Link href="/signup">
                      Create a free account
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="ghost"
                    className="border border-white/12 bg-white/5 font-dmsans text-white hover:bg-white/10"
                  >
                    <Link href="/login">Log in or continue as guest</Link>
                  </Button>
                </>
              )}
            </div>
          </motion.div>

          {/* Product preview — calendar in browser chrome */}
          <motion.div
            initial={{ opacity: 0, y: 48 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.75,
              delay: 0.18,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="mx-auto mt-14 max-w-5xl"
          >
            <CalendarPreview />
          </motion.div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            FEATURE BLOCKS
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="mx-auto max-w-7xl space-y-24 px-4 pb-24 pt-10 sm:px-8 lg:px-10">
          {/* Section heading */}
          <SectionHeading
            eyebrow="Core features"
            headline="Everything the builder needs, without the usual registration clutter."
          />

          {/* ── Compact 2-up row: auth + visual calendar (no preview needed) ── */}
          <div className="grid gap-5 sm:grid-cols-2">
            {[
              {
                icon: ShieldCheck,
                accent: "text-emerald-300",
                surface: "from-emerald-500/12 to-emerald-500/3",
                title: "Secure accounts and guest access",
                description:
                  "Sign up with email or jump straight in as a guest. Your schedules are scoped to your account and private by default.",
              },
              {
                icon: CalendarDays,
                accent: "text-amber-300",
                surface: "from-amber-500/12 to-amber-500/3",
                title: "Visual weekly calendar",
                description:
                  "See your full week on a Monday–Friday grid with color-coded blocks and time labels — before you commit to anything.",
              },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className={`rounded-[20px] border border-white/8 bg-gradient-to-br ${f.surface} p-6`}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-white/10 bg-[#101010]">
                    <Icon className={`h-5 w-5 ${f.accent}`} />
                  </div>
                  <h3 className="mt-5 font-figtree text-xl font-semibold text-white">
                    {f.title}
                  </h3>
                  <p className="mt-3 font-inter text-sm leading-6 text-white/55">
                    {f.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* ── Block A: Real-time class search (full-width split) ── */}
          <div>
            <div className="overflow-hidden rounded-[24px] border border-white/8 bg-[#0f0f0f]">
              <div className="grid gap-0 lg:grid-cols-2">
                {/* Copy side */}
                <div className="flex flex-col justify-center p-8 lg:p-12">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-white/10 bg-[#1a1a1a]">
                    <Search className="h-5 w-5 text-blue-300" />
                  </div>
                  <h3 className="mt-6 font-figtree text-2xl font-semibold text-white sm:text-3xl">
                    Real-time class search.
                  </h3>
                  <p className="mt-4 font-inter text-base leading-7 text-white/55">
                    Search KU classes by department, code, or title. Add
                    sections to your draft without taking your hands off the
                    keys.
                  </p>
                </div>
                {/* Preview side */}
                <div className="flex items-center justify-center border-t border-white/6 bg-[#0a0a0a] p-8 lg:border-l lg:border-t-0">
                  <SearchPreview />
                </div>
              </div>
            </div>
          </div>

          {/* ── Block B: 2-col grid — Versions + Section details ── */}
          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <div className="flex h-full flex-col overflow-hidden rounded-[24px] border border-white/8 bg-[#0f0f0f]">
                <div className="flex flex-col p-8">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-white/10 bg-[#1a1a1a]">
                    <FolderKanban className="h-5 w-5 text-rose-300" />
                  </div>
                  <h3 className="mt-5 font-figtree text-xl font-semibold text-white sm:text-2xl">
                    Multiple schedule versions.
                  </h3>
                  <p className="mt-3 font-inter text-sm leading-6 text-white/55">
                    Create and save alternate semester plans. Switch between
                    versions before enrollment opens and keep every option
                    intact.
                  </p>
                </div>
                <div className="mt-auto border-t border-white/6 bg-[#0a0a0a] p-6">
                  <VersionsPreview />
                </div>
              </div>
            </div>

            <div>
              <div className="flex h-full flex-col overflow-hidden rounded-[24px] border border-white/8 bg-[#0f0f0f]">
                <div className="flex flex-col p-8">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-white/10 bg-[#1a1a1a]">
                    <Info className="h-5 w-5 text-cyan-300" />
                  </div>
                  <h3 className="mt-5 font-figtree text-xl font-semibold text-white sm:text-2xl">
                    Section details and seat visibility.
                  </h3>
                  <p className="mt-3 font-inter text-sm leading-6 text-white/55">
                    Check instructor, meeting days, and live seat availability
                    before adding a class to your draft.
                  </p>
                </div>
                <div className="mt-auto border-t border-white/6 bg-[#0a0a0a] p-6">
                  <SectionDetailPreview />
                </div>
              </div>
            </div>
          </div>

          {/* ── Block C: Shareable schedules (full-width reversed split) ── */}
          <div>
            <div className="overflow-hidden rounded-[24px] border border-white/8 bg-[#0f0f0f]">
              <div className="grid gap-0 lg:grid-cols-2">
                {/* Preview side (left on desktop) */}
                <div className="flex items-center justify-center border-b border-white/6 bg-[#0a0a0a] p-8 lg:border-b-0 lg:border-r">
                  <SharePreview />
                </div>
                {/* Copy side */}
                <div className="flex flex-col justify-center p-8 lg:p-12">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-white/10 bg-[#1a1a1a]">
                    <Share2 className="h-5 w-5 text-lime-300" />
                  </div>
                  <h3 className="mt-6 font-figtree text-2xl font-semibold text-white sm:text-3xl">
                    Shareable read-only schedules.
                  </h3>
                  <p className="mt-4 font-inter text-base leading-7 text-white/55">
                    Toggle on a public link for any saved schedule. Anyone with
                    the link gets a read-only view — revoke access anytime.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            FAQ ACCORDION
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="mx-auto max-w-3xl px-4 pb-28 pt-4 sm:px-8 lg:px-10">
          <h2 className="mb-10 font-figtree text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            FAQ
          </h2>

          <Accordion
            type="single"
            collapsible
            className="divide-y divide-white/8 border-t border-white/8"
          >
            {faqs.map((faq) => (
              <AccordionItem key={faq.q} value={faq.q} className="border-b-0">
                <AccordionTrigger className="py-5 font-figtree text-base font-medium text-white/90 hover:text-white hover:no-underline sm:text-lg [&>svg]:text-white/40">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent>
                  <p className="pb-5 font-inter text-sm leading-7 text-white/50">
                    {faq.a}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </main>
    </div>
  );
}
