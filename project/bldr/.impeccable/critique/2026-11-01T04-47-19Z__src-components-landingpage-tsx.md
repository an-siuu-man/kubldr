---
target: landing page
total_score: 18
max_score: 32
na_heuristics: 7,9
p0_count: 2
p1_count: 2
target_identity: "file:D:\\College Projects\\EECS-581-Team-29-Project-3\\project\\bldr\\src\\components\\LandingPage.tsx"
target_fingerprint: "sha256:ccb0ebf67784bad512f836b4d80647377b05b169064eb5a6fa46b93b619a2e98"
target_path: "D:\\College Projects\\EECS-581-Team-29-Project-3\\project\\bldr\\src\\components\\LandingPage.tsx"
timestamp: 2026-11-01T04-47-19Z
slug: src-components-landingpage-tsx
---
# Critique: bldr landing page (src/components/LandingPage.tsx)
Score 18/32 (7, 9 n/a) — Acceptable. Design specificity: FAILS (category-interchangeable SaaS template).

## Priority issues
- [P0] Generic decoration stack: radial glow blobs (:85), 72px grid overlay (:86), sparkle pill badge (:163-166), floating icon tiles (FloatingTiles.tsx), fake macOS browser chrome (CalendarPreview.tsx:65-73), white-glow pill CTAs. Delete; replace with one product-specific visual idea.
- [P0] Hero doesn't prove its claim: "Browse every schedule" over a single frozen schedule; sub-copy commented out (:176-180). Make the hero calendar cycle permutations ("3 of 47"), restore one-line plain sub-headline.
- [P1] Templated feature section: icon-in-rounded-square x5, gradient card surfaces, italic fake-quote + breezy reply x5, bento. Lead with permutations + seats at size; demote auth/guest to a line.
- [P1] Accessibility: infinite float + entrance motion ignore prefers-reduced-motion; white/25-45 text fails contrast; 8-9px calendar text; sticky header has no background.
- [P2] Typography sprawl (Figtree, Inter, DM Sans, mono on one page; 5 families loaded). Guest path buried in "Log in or continue as guest". No closing CTA / footer. Stale "Fall 2025" + "Dr. Jane Doe" in mocks.

## Strengths
Previews mirror real app components; "not just the first one" is an ownable idea; FAQ answers real objections.
