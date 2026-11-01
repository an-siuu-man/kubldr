# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

University of Kansas students planning their classes for the upcoming term, most intensely in the days before and during their enrollment window. They already know which courses they need; the hard part is fitting sections together around labs, work, and preferred days.

## Product Purpose

bldr is a free, student-built schedule builder for KU. A student picks the courses they want, and bldr lays out every conflict-free combination of sections so they can browse them ("3 of 47") instead of hand-assembling one schedule at a time. Success is a student walking into enrollment with a plan they chose, plus backups.

## Positioning

Generating and browsing every valid combination of sections is the mechanism. Most schedule makers give you a blank grid and make you place classes yourself; bldr shows you all the schedules that fit and lets you pick.

## Operating Context

- Used ahead of KU enrollment, alongside KU's own class search and enrollment system.
- Data is KU-specific: departments, course codes (e.g. EECS 168), sections, rooms, instructors, seat counts.
- Students compare plans with friends via read-only share links.

## Capabilities and Constraints

- Class search over the KU catalog with section details (instructor, meeting times, room, seats).
- Schedule permutation generation and browsing (prev/next, jump to a number, shuffle).
- Visual weekly calendar editor; user-defined "Busy" blocks (never shown on public share pages).
- Multiple saved schedule versions per term; one active schedule.
- Read-only public share links, opt-in and revocable.
- Guest mode with no sign-up; free account adds saving, versions, and sharing.
- Seat and class data is synced periodically from KU's class search, not live. Do not claim "real-time" or "live" seat counts.

## Brand Commitments

- Name: "bldr", always lowercase. Existing mark at `public/logo.svg`.
- The user approved leaning heavily on KU identity (Jayhawk references, KU vocabulary, crimson and blue), accepting the trademark risk. bldr is not an official KU product and must not claim to be.
- Voice: student-to-student, plain, a little wry.

## Evidence on Hand

- Real product components to show honestly: calendar grid (`src/components/CalendarEditor.tsx`), permutation browser (`src/components/PermutationBrowser.tsx`), sidebar versions (`src/components/Sidebar.tsx`).
- No testimonials, user counts, or usage statistics exist. Do not invent them.

## Product Principles

1. Show the combinations: the permutation browser is the product's reason to exist and leads every story.
2. Try before you commit: guest mode is the front door, not a footnote.
3. Be honest about data: say "synced from KU class search", never imply live seats.
4. Made at KU, for KU: specific course codes, buildings, and enrollment rituals over generic college language.
