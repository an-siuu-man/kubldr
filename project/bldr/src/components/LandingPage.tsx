"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  FolderKanban,
  Info,
  Search,
  ShieldCheck,
  Sparkles,
  TabletSmartphone,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const featureCards = [
  {
    title: "Secure accounts and guest access",
    description:
      "Sign up with email, log in securely, or start as a guest while protected routes and Supabase-backed sessions keep your work isolated.",
    icon: ShieldCheck,
    accent: "text-emerald-300",
    surface: "from-emerald-500/15 to-emerald-500/5",
  },
  {
    title: "Real-time class search",
    description:
      "Search KU classes instantly with department, course code, and title matching, plus keyboard-friendly results for quick selection.",
    icon: Search,
    accent: "text-blue-300",
    surface: "from-blue-500/15 to-blue-500/5",
  },
  {
    title: "Visual weekly calendar",
    description:
      "Build schedules on a Monday through Friday calendar with color-coded blocks, meeting times, and a clear view of how your week fits together.",
    icon: CalendarDays,
    accent: "text-amber-300",
    surface: "from-amber-500/15 to-amber-500/5",
  },
  {
    title: "Multiple schedule versions",
    description:
      "Create, rename, switch, and save alternate semester plans so you can compare different combinations before enrollment opens.",
    icon: FolderKanban,
    accent: "text-rose-300",
    surface: "from-rose-500/15 to-rose-500/5",
  },
  {
    title: "Section details and seat visibility",
    description:
      "Review instructors, meeting days, section types, and seat availability indicators before you commit a class to a schedule draft.",
    icon: Info,
    accent: "text-cyan-300",
    surface: "from-cyan-500/15 to-cyan-500/5",
  },
  {
    title: "Responsive, student-friendly UX",
    description:
      "A dark interface, smooth motion, toasts, and responsive layouts keep the builder usable across laptops, tablets, and smaller screens.",
    icon: TabletSmartphone,
    accent: "text-violet-300",
    surface: "from-violet-500/15 to-violet-500/5",
  },
];

const workflowSteps = [
  {
    title: "Search courses fast",
    description:
      "Start with a class name, department, or course code and pull up the sections you actually care about.",
  },
  {
    title: "Compare your week visually",
    description:
      "Drop selected sections into the calendar view and catch conflicts, gaps, and overloaded days before registration.",
  },
  {
    title: "Save the best version",
    description:
      "Keep multiple semester scenarios, revisit them later, and refine the one that works best for your goals.",
  },
];

const builderSignals = [
  "Real-time course lookup",
  "Seat alerts",
  "Saved schedule variants",
  "Guest mode",
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080808] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(250,204,21,0.14),_transparent_24%),radial-gradient(circle_at_bottom,_rgba(239,68,68,0.12),_transparent_32%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:72px_72px] opacity-25" />

      <header className="relative z-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 sm:px-8 lg:px-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-[0_0_40px_rgba(255,255,255,0.04)]">
              <span className="font-dmsans text-lg font-bold tracking-tight">
                <span className="text-white">b</span>
                <span className="text-red-500">l</span>
                <span className="text-blue-500">d</span>
                <span className="text-yellow-300">r</span>
              </span>
            </div>
            <div>
              <p className="font-figtree text-lg font-semibold tracking-tight">
                Flagship Schedule Builder
              </p>
              <p className="font-inter text-xs text-[#A8A8A8]">
                Built for University of Kansas students
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Button
              asChild
              variant="ghost"
              className="hidden border border-white/10 bg-white/5 font-dmsans text-white hover:bg-white/10 sm:inline-flex"
            >
              <Link href="/login">Log in</Link>
            </Button>
            <Button
              asChild
              className="font-dmsans text-[#101010] shadow-[0_12px_36px_rgba(255,255,255,0.15)]"
            >
              <Link href="/signup">
                Start building
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex max-w-7xl flex-col gap-20 px-6 pb-20 sm:px-8 lg:px-10">
        <section className="pt-8 lg:pt-14">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-4xl"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-4 py-2 text-sm text-blue-100">
              <Sparkles className="h-4 w-4 text-blue-300" />
              Designed to make class registration less chaotic
            </div>

            <h1 className="font-figtree text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
              Build a cleaner KU schedule before enrollment gets messy.
            </h1>
            <p className="mt-6 max-w-xl font-inter text-base leading-7 text-[#B8B8B8] sm:text-lg">
              bldr combines live course search, a visual weekly calendar,
              schedule versioning, and section-level detail so you can plan
              faster with fewer tabs and fewer surprises.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="font-dmsans text-[#101010] shadow-[0_16px_40px_rgba(255,255,255,0.12)]"
              >
                <Link href="/signup">
                  Create an account
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/10 bg-white/5 font-dmsans text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/login">Log in or continue as guest</Link>
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {builderSignals.map((signal) => (
                <div
                  key={signal}
                  className="inline-flex items-center gap-2 rounded-full border border-[#404040] bg-white/5 px-3 py-2 font-inter text-sm text-[#D6D6D6]"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  {signal}
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        <section>
          <div className="mb-8 max-w-2xl">
            <p className="font-dmsans text-sm uppercase tracking-[0.28em] text-[#A8A8A8]">
              Core features
            </p>
            <h2 className="mt-3 font-figtree text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Everything the builder needs, without the usual registration
              clutter.
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {featureCards.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{
                    duration: 0.45,
                    delay: index * 0.05,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className={`rounded-[24px] border border-white/10 bg-gradient-to-br ${feature.surface} p-6 shadow-[0_20px_45px_rgba(0,0,0,0.3)]`}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-[#101010]">
                    <Icon className={`h-5 w-5 ${feature.accent}`} />
                  </div>
                  <h3 className="mt-5 font-figtree text-xl font-semibold text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-3 font-inter text-sm leading-6 text-[#C3C3C3]">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div className="max-w-xl">
            <p className="font-dmsans text-sm uppercase tracking-[0.28em] text-[#A8A8A8]">
              How it works
            </p>
            <h2 className="mt-3 font-figtree text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              The workflow stays simple even when your semester is not.
            </h2>
            <p className="mt-5 font-inter text-base leading-7 text-[#B8B8B8]">
              bldr focuses on the three things students usually split across too
              many tabs: finding classes, seeing how they fit, and keeping the
              schedule versions worth revisiting.
            </p>
          </div>

          <div className="space-y-4">
            {workflowSteps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: 18 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{
                  duration: 0.45,
                  delay: index * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="rounded-[24px] border border-white/10 bg-white/5 p-6 backdrop-blur"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#101010] font-dmsans text-sm font-bold text-white">
                    0{index + 1}
                  </div>
                  <div>
                    <h3 className="font-figtree text-xl font-semibold text-white">
                      {step.title}
                    </h3>
                    <p className="mt-2 font-inter text-sm leading-6 text-[#C3C3C3]">
                      {step.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
