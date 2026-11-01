---
name: bldr
description: Every conflict-free KU schedule, drawn as a carbon-copy enrollment worksheet.
colors:
  # Paper worksheet (light, default). Source: :root in src/app/globals.css
  desk: "#ece5d3"
  background: "#f3eee1"
  paper: "#fbf8ef"
  foreground: "#2e2023"
  muted-foreground: "#6b4e52"
  crimson: "#a6192e"
  crimson-deep: "#85111f"
  ballpoint: "#0b4fa3"
  ballpoint-wash: "#e9edf3"
  ballpoint-deep: "#1f3f73"
  canary: "#f4d84f"
  pink: "#f4c3cf"
  rule: "rgb(166 25 46 / 0.2)"
  rule-strong: "rgb(166 25 46 / 0.55)"
  secondary: "#ece5d3"
  accent: "#f1e2d9"
  border: "#dcc6bf"
  input: "#cfb3ac"
  sidebar: "#f7f2e6"
  success: "#2f6b3c"
  warning: "#8a5a00"
  destructive: "#b3261e"
  on-crimson: "#ffffff"
  # Carbon sheet (dark variant). Source: .dark in src/app/globals.css
  desk-dark: "#0c111b"
  background-dark: "#0f1420"
  paper-dark: "#151b28"
  popover-dark: "#182030"
  foreground-dark: "#efe8d8"
  muted-foreground-dark: "#b3ab9b"
  crimson-dark: "#f06a7e"
  primary-dark: "#c8283f"
  ballpoint-dark: "#8fb4f2"
  canary-dark: "#3d3719"
  pink-dark: "#3f2630"
  rule-dark: "rgb(239 232 216 / 0.1)"
  rule-strong-dark: "rgb(240 106 126 / 0.5)"
  secondary-dark: "#1c2333"
  accent-dark: "#222a3c"
  border-dark: "#2a3245"
  input-dark: "#364055"
  sidebar-dark: "#121826"
  success-dark: "#7cc48c"
  warning-dark: "#e9cd45"
  destructive-dark: "#f0707a"
  # Course blocks: 12-colour pastel hash, identical in both themes
  course-ink: "#2e2023"
  course-pink: "#f5d2d2"
  course-peach: "#efd8c1"
  course-yellow: "#efefc1"
  course-lime: "#d8efc1"
  course-mint: "#c1efc1"
  course-aqua: "#c1efd8"
  course-cyan: "#c1efef"
  course-blue: "#c1d8ef"
  course-periwinkle: "#c1c1ef"
  course-lavender: "#d8c1ef"
  course-magenta: "#efc1ef"
  course-rose: "#efc1d8"
typography:
  display:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(2.75rem, 5.6vw, 5.25rem)"
    fontWeight: 900
    lineHeight: 0.92
    letterSpacing: "-0.03em"
    fontVariation: "'wdth' 115"
  display-sheet:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 7vw, 3.25rem)"
    fontWeight: 900
    lineHeight: 0.95
    letterSpacing: "-0.03em"
    fontVariation: "'wdth' 115"
  headline:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(2rem, 3.6vw, 3.25rem)"
    fontWeight: 900
    lineHeight: 0.98
    letterSpacing: "-0.025em"
    fontVariation: "'wdth' 112"
  panel-title:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 2.4vw, 2.25rem)"
    fontWeight: 900
    lineHeight: 0.95
    letterSpacing: "-0.03em"
    fontVariation: "'wdth' 115"
  numeral:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "56px"
    fontWeight: 900
    lineHeight: 1
    fontVariation: "'wdth' 125"
    fontFeature: "'tnum'"
  counter:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 900
    lineHeight: 1
    fontVariation: "'wdth' 115"
    fontFeature: "'tnum'"
  title:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 800
    lineHeight: 1.25
    fontVariation: "'wdth' 95"
  body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "0.06em"
    fontVariation: "'wdth' 72"
  tab:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "0.06em"
    fontVariation: "'wdth' 80"
  control:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 800
    lineHeight: 1
    fontVariation: "'wdth' 92"
  ballpoint:
    fontFamily: "Reenie Beanie, cursive"
    fontSize: "28px"
    fontWeight: 400
    lineHeight: 1
rounded:
  none: "0px"
  sm: "0px"
  md: "2px"
  lg: "2px"
  xl: "3px"
  2xl: "4px"
spacing:
  hairline: "6px"
  sm: "12px"
  md: "20px"
  sheet: "28px"
  lg: "32px"
  xl: "40px"
  section: "64px"
  section-lg: "96px"
  gutter-mobile: "16px"
  gutter-tablet: "32px"
  gutter-desktop: "56px"
  container: "1360px"
  auth-sheet: "30rem"
components:
  button-primary:
    backgroundColor: "{colors.crimson}"
    textColor: "{colors.on-crimson}"
    typography: "{typography.control}"
    rounded: "{rounded.none}"
    padding: "0 20px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.crimson-deep}"
    textColor: "{colors.on-crimson}"
  button-primary-dark:
    backgroundColor: "{colors.primary-dark}"
    textColor: "{colors.on-crimson}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.crimson}"
    typography: "{typography.control}"
    rounded: "{rounded.none}"
    padding: "0 20px"
    height: "48px"
  button-outline-hover:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.crimson}"
  button-icon:
    backgroundColor: "transparent"
    textColor: "{colors.crimson}"
    rounded: "{rounded.none}"
    size: "44px"
  button-icon-hover:
    backgroundColor: "{colors.crimson}"
    textColor: "{colors.on-crimson}"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    height: "44px"
    padding: "0 12px"
  form-sheet:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.none}"
    padding: "{spacing.sheet}"
  form-sheet-dark:
    backgroundColor: "{colors.paper-dark}"
    textColor: "{colors.foreground-dark}"
  tab:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.muted-foreground}"
    typography: "{typography.tab}"
    rounded: "{rounded.none}"
    height: "44px"
  tab-active:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.crimson}"
  status-saved:
    backgroundColor: "transparent"
    textColor: "{colors.success}"
    typography: "{typography.tab}"
    rounded: "{rounded.none}"
    padding: "2px 8px"
  status-unsaved:
    backgroundColor: "transparent"
    textColor: "{colors.crimson}"
    typography: "{typography.tab}"
    rounded: "{rounded.none}"
    padding: "2px 8px"
  notice-strip:
    backgroundColor: "{colors.canary}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.none}"
    padding: "8px 16px"
  permutation-counter:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ballpoint}"
    typography: "{typography.counter}"
    rounded: "{rounded.none}"
    padding: "4px 8px"
  course-block:
    backgroundColor: "{colors.course-blue}"
    textColor: "{colors.course-ink}"
    rounded: "{rounded.none}"
    padding: "4px"
  class-block-landing:
    backgroundColor: "{colors.ballpoint-wash}"
    textColor: "{colors.ballpoint}"
    rounded: "{rounded.none}"
    padding: "5px 7px"
  stamp:
    backgroundColor: "transparent"
    textColor: "{colors.crimson}"
    rounded: "{rounded.none}"
    padding: "6px 16px 7px"
---

# Design System: bldr

> **Scope.** This system governs the **whole app**: landing page, login, signup, upgrade, builder, profile, the public share page `/s/[id]` and the 404 page. App-wide tokens live in `src/app/globals.css` (`:root` = paper worksheet, the default; `.dark` = carbon sheet) and are exposed to Tailwind as `crimson`, `ballpoint`, `canary`, `pink`, `paper`, `desk`, `rule`, `rule-strong`, `success`, `warning` alongside the shadcn semantic tokens. The landing page keeps its own `.form-world` scope in `src/components/landing/landing.css` and **always renders paper**, even when the app is in dark mode. Light is the default theme (ThemeProvider and AppSettingsContext); the Settings dialog still toggles dark.

## Overview

**Creative North Star: "Registrar Carbon Copy"**

Every schedule is one sheet in a triplicate KU enrollment pad. The app is a warm paper desk with forms lying on it: a white top copy, canary and pink copies peeking out beneath, crimson spot ink printing every rule, label and heading, and KU-blue ballpoint filling in the answers. On the landing page the pad flips through conflict-free combinations; in the builder the same pad becomes working panels framed in crimson, with the permutation count written in ballpoint ("577 of 3345").

Density is that of a real form: ruled hairlines, boxed fields, condensed uppercase captions, generous paper margins around tight data. Hierarchy comes from one typeface pushed across its width axis (expanded black for display, condensed for labels and tabs), not from extra families or color. Depth is physical: real paper planes offset and slightly rotated, not glows or floating cards.

The dark variant is the **carbon sheet**: the same form read off the blue-black carbon paper, with paper-coloured type and lightened crimson and ballpoint impressions. Copy stock goes dim because it fills whole regions.

The world explicitly refuses the generic SaaS shell: no glow blobs, no icon-in-rounded-square feature cards, no gradient surfaces, no pill badges or eyebrow pills.

**Key Characteristics:**
- Two inks only: crimson (printed form) and ballpoint blue (what the student writes in).
- Canary and pink are paper stock, filling whole sections, strips or copies.
- Archivo across its `wdth` axis for everything; Reenie Beanie only for short handwritten asides.
- Square or near-square corners (0 to 4px); 2px crimson frames, 1px tinted hairlines.
- Depth from stacked, offset, rotated paper planes.
- Two themes, one form: paper worksheet (default) and carbon sheet (dark).

## Colors

A warm paper ground printed in a single crimson spot ink, written on in KU-blue ballpoint, with canary and pink copy stock; in dark mode the same roles invert onto blue-black carbon.

### Primary
- **Registrar Crimson** (`crimson`; carbon `crimson-dark`): the printed spot ink. Panel frames (calendar, search, selected classes, sidebar edge, sheets), form labels, display titles, the wordmark, links, outline-button text and borders, active tabs and their underline, the "Unsaved" stamp, rubber stamps.
- **Primary Fill** (`crimson`; carbon `primary-dark`): solid button fill. In dark mode the fill stays a deeper crimson so white text keeps its contrast, while crimson-as-ink lightens to `crimson-dark`.
- **Dried Crimson** (`crimson-deep`): hover state of the landing primary button and links, and text-selection ink on the landing page.

### Secondary
- **KU Ballpoint** (`ballpoint`; carbon `ballpoint-dark`): the student's pen. The permutation counter numeral, landing class blocks, the second clause of the hero headline, filled-in values, the active version, the "Guest" profile stamp, handwritten asides, the caret, focus rings and focused input borders (`ring`).
- **Ballpoint Wash** (`ballpoint-wash`) and **Pressed Ballpoint** (`ballpoint-deep`): fill and room line of the landing page's sample class blocks only.

### Tertiary
- **Canary Copy** (`canary`; carbon `canary-dark`): the second carbon copy. Full-bleed "How it works" band, the builder's guest/notice strips, profile notices, the middle copy beneath auth sheets, and text selection.
- **Pink Copy** (`pink`; carbon `pink-dark`): the third carbon copy. The FAQ band, the sharing panel, the rear copy beneath auth sheets.

### Neutral
- **Desk Manila** (`desk`; carbon `desk-dark`): the surface sheets lie on: auth, profile, 404 and share pages, landing background.
- **Worksheet Ground** (`background`; carbon `background-dark`): the builder's body background.
- **Form Paper** (`paper` / `card`; carbon `paper-dark`): every sheet and panel face. Popovers use paper in light and `popover-dark` in carbon.
- **Carbon Ink** (`foreground`; carbon `foreground-dark`, a paper-coloured type): body copy and titles.
- **Faded Carbon** (`muted-foreground`; carbon `muted-foreground-dark`): descriptions, footnotes, inactive tabs.
- **Desk Tint** (`secondary`, `accent`, `sidebar`): quiet fills for the tab strip, hover washes and the sidebar body.
- **Field Edge** (`border`, `input`): default hairlines and input strokes.
- **Form Rule** / **Strong Rule** (`rule`, `rule-strong`): grid hairlines and list dividers / internal panel dividers, header underlines, busy-block hatching, the scrollbar thumb. In carbon the weak rule turns paper-white at 10% and the strong rule lightened crimson at 50%.

### Status
- **Approved Green** (`success`; carbon `success-dark`): "Saved" stamp, success toasts and checks, LAB components.
- **Pending Amber** (`warning`; carbon `warning-dark`): seat or conflict warnings, REC/SEM components, pinned icons.
- **Void Red** (`destructive`; carbon `destructive-dark`): destructive actions and conflict alerts.

### Course Palette
Twelve flat pastels (`course-pink` through `course-rose`) assigned by hashing the course, with **fixed dark ink** (`course-ink`) and a 15% black hairline. They are deliberately theme-independent: a course keeps its colour, and stays legible, in both paper and carbon.

### Named Rules
**The Two Inks Rule.** Crimson is the printed form; ballpoint is what a person wrote on it. Anything that is part of the template (frames, labels, headings, controls) is crimson. Anything that is a student's data or choice (counts, the active plan, filled values, notes) is ballpoint. Course pastels and status colours are the only exceptions, and both carry meaning.

**The Copy Stock Rule.** Canary and pink are paper, not accents. They fill whole sections, strips, panels or copy planes; they are never used as text colour, small badges or highlights.

**The Carbon Inversion Rule.** Dark mode is the carbon sheet, not a new palette: every role keeps its job, inks lighten (`crimson-dark`, `ballpoint-dark`), copy stock dims (`canary-dark`, `pink-dark`), and solid fills stay deep enough for white text (`primary-dark`). Course blocks do not invert.

## Typography

**Display Font:** Archivo variable with the `wdth` axis (`--font-archivo`, fallback system-ui, sans-serif). Every font utility in the app (`font-sans`, `font-inter`, `font-dmsans`, `font-figtree`) resolves to Archivo.
**Body Font:** Archivo (same family)
**Handwriting Font:** Reenie Beanie (`--font-ballpoint`, fallback cursive)

**Character:** One grotesque stretched wide and black for the printed headings, squeezed narrow and uppercase for captions and tabs; a loose ballpoint scrawl appears only where a student would have scribbled in the margin.

### Hierarchy
- **Display** (900, `clamp(2.75rem, 5.6vw, 5.25rem)`, lh 0.92, -0.03em, wdth 115%): the landing hero headline.
- **Display Sheet** (shared `.display` primitive: 900, wdth 115%, -0.03em, lh 0.95, crimson; set at `clamp(2.5rem, 7vw, 3.25rem)` on auth sheets, up to `clamp(2.5rem, 8vw, 3.75rem)` on 404, `clamp(2.25rem, 6vw, 3rem)` on profile): the title of any standalone sheet.
- **Headline** (900, `clamp(2rem, 3.6vw, 3.25rem)`, lh 0.98, -0.025em, wdth 112%): landing section headings.
- **Panel Title** (`.display` at `clamp(1.5rem, 2.4vw, 2.25rem)`; sidebar 22 to 28px; share page `clamp(1.75rem, 4vw, 2.75rem)`): schedule names and sidebar headings.
- **Numeral** (900, 56px, wdth 125%): landing step numbers; wordmark 900 at 24 to 30px, wdth 125%, -0.03em.
- **Counter** (900, 15px mobile / 18px desktop, wdth 115%, tabular, ballpoint): the builder's permutation index. Landing pad counter uses 44px.
- **Title** (800, 22px, wdth 95%): step titles; FAQ questions 18px.
- **Body** (400, 16px, lh 1.6 to 1.65): explanatory copy, 36 to 62ch; descriptions in Faded Carbon.
- **Label** (shared `.form-label`: 700, 12px, wdth 72%, 0.06em, uppercase, crimson; landing uses 12.5px): field captions, masthead strips, calendar day/hour axis, panel captions. Small stamps step down to 10 to 10.5px.
- **Tab** (700, 12px to 14px, wdth 80%, 0.06em, uppercase): builder tabs and Saved/Unsaved stamps.
- **Control** (800, 17 to 18px, wdth 92%): sheet-level buttons. Nav links 700, 15px, wdth 88%.
- **Ballpoint** (shared `.ballpoint`: Reenie Beanie 400, 26 to 32px, lh 1, ballpoint; rotated -2deg on landing): margin notes.

### Named Rules
**The Width Axis Rule.** Hierarchy is set on Archivo's width axis, not with new families: expanded (112 to 125%) means printed heading, numeral or count; condensed (72 to 92%) means label, tab or control. Never introduce a second sans or a display serif.

**The Margin Note Rule.** Reenie Beanie carries only short, decorative asides (marked `aria-hidden`) a few words long. Never put information, instructions or controls in the handwriting face.

## Layout

A single centred container (max 1360px) with side gutters of 16px (mobile), 32px (≥640px) and 56px (≥1024px) for marketing and public pages. Standalone sheets (auth, 404, profile) sit centred on the desk at 30 to 34rem wide with 40 to 64px of vertical breathing room; inner padding is 20px, 28px from 640px.

The landing page splits on asymmetric 5fr/7fr grids at ≥1024px and alternates paper stock by section: desk, canary band, desk, pink band, desk, footer, with full-bleed bands closed by 2px crimson rules.

The builder is a working form: a crimson-edged sidebar, a calendar panel, and search/selected panels, each framed in 2px crimson on a paper face. A tab strip sits flush on top of its panel (no bottom border on the strip, so the active tab joins the sheet). Notice strips run full width in canary under a 2px crimson rule.

Weekly grids are time-by-day tables with crimson condensed labels on the axes. On the landing page: 52px time column and 52px hour rows (38px / 44px below 640px), blocks inset 3px.

## Elevation & Depth

Depth is physical paper, not light. A sheet that stands alone is a stack: pink at the back, canary in the middle, white on top, each with a 2px crimson border, offset and rotated slightly. Landing pad: pink `translate(20px, 18px) rotate(0.9deg)`, canary `translate(10px, 9px) rotate(0.45deg)` (halved on mobile). Auth sheets: pink 12px/12px at 0.8deg, canary 6px/6px at 0.4deg. Only the top copy of a stack casts a shadow. Working panels in the builder are flat and separated by frames and rules.

### Shadow Vocabulary
- **Top sheet** (`box-shadow: 0 18px 40px -24px rgb(74 30 20 / 0.45)`): the uppermost paper in a stack (landing pad, auth sheet).
- **Button pool** (`box-shadow: 0 10px 20px -12px rgb(133 17 31 / 0.7)`): soft crimson pool under the landing primary button.
- **Course block** (`box-shadow: 0 1px 2px rgb(0 0 0 / 0.12)`): a barely-there lift so pastel blocks read as stickers on the grid.

### Named Rules
**The Paper Stack Rule.** Depth is shown by offset, slightly rotated paper planes. Shadows belong only to the top sheet of a stack, the landing primary button and course blocks; panels, sheets and bands are otherwise flat and divided by rules.

Not part of the system: the landing primary button also carries a hard 2px offset lip (`0 2px 0 var(--crimson-deep)`, collapsing to 1px on press). It is a hard offset shadow in a non-neobrutalist world; do not reuse it, and drop it when the landing CSS is next touched.

## Shapes

Corners are square or nearly so. Radius tokens are flattened to `sm` 0, `md`/`lg` 2px, `xl` 3px, `2xl` 4px, so shadcn primitives that ask for `rounded-md` read as square paper. Frames, sheets, tabs, stamps, buttons and blocks are authored at 0px.

Borders do the work radius would elsewhere:
- **2px crimson** solid: panel frames, sheets, copy planes, outline buttons, the permutation counter box, tab strips, stamps (3px for rubber stamps).
- **2px input** solid, turning **ballpoint** on focus: text fields.
- **1px Strong Rule**: internal dividers, header underlines.
- **1px Form Rule** / **border**: grid hairlines and list rows.
- **Dashed**: reserved for things not quite there: busy time (1px dashed Strong Rule over a -45deg hatch of `rule-strong` stripes 1.5px wide every 8px), drag previews (dashed ballpoint), the "Finding..." loading state of the permutation counter, the landing carbon ghost, tear-off perforations.

## Components

### Buttons
Printed and pressable, like a stamped box on a form.
- **Primary:** crimson fill (`primary-dark` in carbon), white text, Control type, 48px tall (52px on landing), 20 to 22px side padding, trailing arrow at 18px stroke 2.5. Hover drops to 90% fill (landing: Dried Crimson).
- **Outline:** transparent, 2px crimson border, crimson Control text; hover adds the accent wash. Used for secondary actions ("Back to home", sidebar actions at 12 to 14px).
- **Icon:** 44px square with 2px crimson border on landing; compact 24 to 28px borderless crimson glyph buttons in the permutation counter.
- **Focus:** ballpoint ring (2px outline, 3px offset on landing).

### Inputs / Fields
- 44px tall, 2px `input` border, paper face, 16px text, no shadow, no ring; the border turns ballpoint on focus. The class search wraps its field in the same treatment with `focus-within`.
- Captioned by a `.form-label` 6px above.

### Tabs
- A strip of uppercase condensed labels (Tab type) on the desk tint, framed in 2px crimson on three sides. The active tab becomes paper with a 2px crimson underline and crimson text; inactive tabs are Faded Carbon.

### Status Stamps
- **Saved / Unsaved:** 2px bordered rectangles in success or crimson, Tab type at 10 to 12px. **Guest / Account** on the profile use the same shape in ballpoint or crimson.
- **Rubber stamp:** 3px crimson border, 900 condensed-wide uppercase at 22 to 28px, rotated -6 to -7deg, 90% opacity, multiply blend on landing; "47 FIT", "Not found".

### Cards / Containers (Form Sheet)
- Paper face, 2px crimson frame, square corners, flat unless top of a stack.
- Opens with a **masthead strip**: `.form-label` captions left and right ("Returned to sender · Error 404") over a 2px crimson rule.
- Footer separated by a 1px Strong Rule.

### Navigation
- Header on the desk with a Strong Rule underneath; logo plus crimson wordmark at wdth 125%; crimson condensed links 40px tall, hover accent wash; sign-up boxed in 2px crimson.

### Signature: Permutation Counter (builder)
A 2px crimson box on paper: crimson shuffle glyph, prev/next crimson chevrons, the current index in Counter type (ballpoint, tabular, editable with a 2px ballpoint underline), a crimson "of" label, and the total in 800 crimson tabular figures. While computing it becomes a dashed Strong Rule box reading "Finding...".

### Signature: Carbon Pad (landing)
Week grid on the top copy of a triplicate stack, auto-flipping every 3800ms (paused on hover/focus, stopped after manual control, off under reduced motion) with `cubic-bezier(0.16, 1, 0.3, 1)`: the outgoing sheet lifts away over 550ms, the counter rolls in 450ms, and the previous layout fades as a dashed ballpoint ghost over 2200ms. Sample class blocks are 2px ballpoint frames on Ballpoint Wash; busy blocks dashed crimson over a hatch.

### Course Blocks (builder calendar)
Flat pastel from the Course Palette, 1px 15% black hairline, fixed `course-ink` text, Course-block shadow; pinned and conflict icons in warning and destructive. Busy blocks: dashed Strong Rule border over the busy hatch with crimson text.

### Auth Sheet (login, signup, upgrade)
One worksheet slip (max 30rem) on the desk with canary and pink copies offset beneath, top-sheet shadow, masthead strip ("Flagship Schedule Builder"), Display Sheet title, Faded Carbon description, captioned fields, footer under a Strong Rule.

## Do's and Don'ts

### Do:
- **Do** build every surface from the app tokens in `globals.css` (`crimson`, `ballpoint`, `canary`, `pink`, `paper`, `desk`, `rule`, `rule-strong`, `success`, `warning`) and the shared `.form-label`, `.ballpoint`, `.display` primitives.
- **Do** print template elements in crimson and write student data in ballpoint (The Two Inks Rule).
- **Do** frame working panels in 2px crimson and open standalone sheets with a masthead strip.
- **Do** let canary and pink own whole bands, strips or copy planes.
- **Do** build hierarchy with Archivo's width axis: expanded black for titles and counts, condensed uppercase for labels and tabs.
- **Do** check every new surface in both paper and carbon; keep solid fills deep enough for white text in carbon.
- **Do** keep course blocks on the fixed pastel palette with dark ink in both themes.
- **Do** reserve dashed lines for busy time, previews, loading, carbon ghosts and perforations.
- **Do** honor reduced motion and provide a pause control for anything that moves on its own.

### Don't:
- **Don't** use pill shapes, `rounded-full` badges or radii above 4px.
- **Don't** add glows, blurred colour blobs, decorative gradients or glassy surfaces; the only gradients are mechanical patterns (hatching, ruled lines).
- **Don't** cast shadows from flat panels or bands; only stack tops, the landing primary button and course blocks get one.
- **Don't** introduce a third ink, a second sans or a display serif.
- **Don't** set information or controls in Reenie Beanie.
- **Don't** place a small label directly above a section headline as an eyebrow; labels caption fields, panels and mastheads.
- **Don't** reuse the landing button's hard 2px offset lip.
- **Don't** let the landing page's `.form-world` follow dark mode; it is paper only.
