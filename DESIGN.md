---
version: 1.0
name: Aegis-UI-design-system
description: Single source of truth for all Aegis UI work. Aegis is a dark, premium, macOS-quality desktop security console. The language synthesizes Apple's typographic restraint and translucent chrome, Raycast's shadowless surface-ladder elevation and soft semantic accents, and Linear's single-accent discipline and deep near-black canvas. It is an original combination — not a copy of any brand's identity, logo, or marketing layout.

colors:
  # ---- Canvas (never pure black, never glowing) ----
  canvas: "#0c0e12"            # primary app background; near-black with a subtle cool tint
  canvas-deep: "#08090c"       # recessed wells: chart plot areas, code/terminal regions
  # ---- Surface ladder (3 main levels + 1 raised) ----
  surface-1: "#13161c"         # cards, panels, sidebar background
  surface-2: "#181c24"         # elevated: hovered cards, menus, popovers, active rows
  surface-3: "#1e232d"         # deepest raised: tooltips, floating command surface
  # ---- Hairlines (the only borders the system needs) ----
  hairline: "#232733"          # default 1px border on surfaces
  hairline-strong: "#2d3340"   # stronger border: hover, emphasized dividers
  hairline-faint: "rgba(255,255,255,0.05)"  # inner dividers, chart gridlines
  # ---- Text ----
  text-primary: "#eceef2"      # headings, primary content, active nav
  text-secondary: "#c3c8d1"    # default body / explanations
  text-muted: "#98a0ad"        # metadata, captions, table headers
  text-faint: "#6b7280"        # disabled, placeholder, least-emphasis
  text-on-accent: "#ffffff"    # label color on the accent fill
  # ---- Single UI accent (actions, selection, focus, links) ----
  accent: "#5f6ae0"
  accent-hover: "#7e89ea"
  accent-pressed: "#4853bd"
  accent-soft: "rgba(95,106,224,0.14)"     # tinted chip/selected background
  accent-ring: "rgba(95,106,224,0.45)"     # focus ring
  # ---- Semantic colors (DATA ONLY — never decorative chrome) ----
  semantic-critical: "#e5484d"      # critical / DoS
  semantic-critical-soft: "rgba(229,72,77,0.12)"
  semantic-warning: "#e3963a"       # warning / probe / elevated
  semantic-warning-soft: "rgba(227,150,58,0.12)"
  semantic-success: "#3fb68a"       # normal / healthy
  semantic-success-soft: "rgba(63,182,138,0.12)"
  semantic-info: "#6db3e6"          # informational only when genuinely required
  semantic-info-soft: "rgba(109,179,230,0.12)"
  # ---- Gloss (extremely restrained) ----
  gloss-top: "rgba(255,255,255,0.06)"  # 1px top-edge highlight on elevated surfaces
  scrim: "rgba(0,0,0,0.5)"             # modal overlay

typography:
  family-ui: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  family-mono: "ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Consolas, monospace"
  display:
    fontFamily: "{typography.family-ui}"
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: -0.4px     # page titles; rare inside the desktop app
  title:
    fontFamily: "{typography.family-ui}"
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: -0.3px     # section headers, card titles
  subtitle:
    fontFamily: "{typography.family-ui}"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: -0.2px     # component titles, metric-group headers
  body-lg:
    fontFamily: "{typography.family-ui}"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0         # empty states, plain-language alert summaries
  body:
    fontFamily: "{typography.family-ui}"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: 0         # default UI text and explanations
  body-strong:
    fontFamily: "{typography.family-ui}"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: 0
  caption:
    fontFamily: "{typography.family-ui}"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0         # metadata, secondary descriptions, table cells
  label:
    fontFamily: "{typography.family-ui}"
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0.1px     # buttons, form labels, nav, badges
  micro:
    fontFamily: "{typography.family-ui}"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0.2px     # optional only: column micro-labels, legal. NEVER for content.
  mono:
    fontFamily: "{typography.family-mono}"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0         # IPs, ports, packet values, protocol ids, hashes
  mono-strong:
    fontFamily: "{typography.family-mono}"
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: 0

rounded:
  xs: 6px
  sm: 8px       # buttons, inputs, chips, small controls
  md: 10px      # default card radius
  lg: 12px      # large panels, dialogs
  pill: 9999px  # status chips, segmented filters, avatars — nothing else

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 20px
  xl: 24px
  xxl: 32px
  section: 48px   # gap between major content blocks in a page

motion:
  fast: 120ms
  base: 180ms
  slow: 260ms
  easing: "cubic-bezier(0.2, 0, 0, 1)"

components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.text-on-accent}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: 0 14px
    height: 32px
    hover: "{colors.accent-hover}"
    pressed: "{colors.accent-pressed}"
  button-secondary:
    backgroundColor: "{colors.surface-2}"
    border: "1px solid {colors.hairline}"
    textColor: "{colors.text-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: 0 14px
    height: 32px
    hover: "border {colors.hairline-strong}, background {colors.surface-3}"
  button-tertiary:
    backgroundColor: transparent
    textColor: "{colors.text-secondary}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: 0 10px
    height: 32px
    hover: "text {colors.text-primary}, background {colors.surface-1}"
  button-danger:
    backgroundColor: "{colors.semantic-critical-soft}"
    textColor: "{colors.semantic-critical}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: 0 14px
    height: 32px
  input:
    backgroundColor: "{colors.canvas-deep}"
    border: "1px solid {colors.hairline}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: 0 10px
    height: 32px
    focus: "1px {colors.accent} border + 2px {colors.accent-ring} ring"
    placeholder: "{colors.text-faint}"
  card:
    backgroundColor: "{colors.surface-1}"
    border: "1px solid {colors.hairline}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.md}"
    padding: "{spacing.md} {spacing.lg}"
  metric-card:
    backgroundColor: "{colors.surface-1}"
    border: "1px solid {colors.hairline}"
    rounded: "{rounded.md}"
    padding: "{spacing.md} {spacing.lg}"
  status-chip:
    backgroundColor: "transparent"
    rounded: "{rounded.pill}"
    typography: "{typography.label}"
    padding: "3px 10px"
  table:
    header: "{typography.caption} {colors.text-muted}"
    row: "hairline bottom {colors.hairline-faint}, hover row {colors.surface-2}"
    cell: "{typography.body}"
    technical-cell: "{typography.mono}"
  sidebar-item:
    height: 32px
    rounded: "{rounded.sm}"
    default: "{colors.text-muted}"
    hover: "{colors.surface-1}, text {colors.text-primary}"
    active: "{colors.accent-soft} background, {colors.accent} text/icon"
  tab:
    default: "{colors.text-muted}"
    active: "{colors.text-primary} + 2px {colors.accent} underline or soft chip fill"
  alert:
    severity: "soft-tint background + colored left edge, never full-card glow"
    title: "{typography.subtitle}"
    summary: "{typography.body} {colors.text-secondary}"
    details: "expandable {typography.mono} key/value rows, muted keys"
  dialog:
    backgroundColor: "{colors.surface-2}"
    border: "1px solid {colors.hairline-strong}"
    rounded: "{rounded.lg}"
    overlay: "{colors.scrim}"
  keycap:
    backgroundColor: "{colors.surface-3}"
    border: "1px solid {colors.hairline-strong}"
    rounded: "{rounded.xs}"
    typography: "{typography.caption}"
    padding: "1px 6px"
---

# Aegis UI Design System

## Purpose

This document is the **single source of truth** for every future Aegis UI decision. It is the synthesized result of three reference analyses — Apple, Raycast, and Linear (kept locally at `apple/DESIGN.md`, `raycast/DESIGN.md`, `linear.app/DESIGN.md`). Nothing in this document copies any of those brands; it borrows *principles* and merges them into an original language for a desktop security application.

**The product goal:** Aegis must feel like a polished, native-quality macOS/desktop security application — minimal, premium, clean, dark, glossy but restrained, subtly translucent, and understandable to someone who does not know cybersecurity, while remaining credible and dense enough for a professional analyst.

**Hard boundary:** This document defines the UI language only. The detection/capture/backend behavior is frozen (see [Backend Freeze](#backend-freeze)).

---

## Design Philosophy

### North Star

> Make the network's story calm and legible. Chrome recedes; the data speaks in plain language first, technical detail second.

Aegis is **not** a dashboard that shouts. It is a well-made instrument: quiet at rest, precise when something happens, and instantly explainable to a non-expert when an alert fires.

### Where the language comes from

| Source | What Aegis adopts | What Aegis rejects |
|---|---|---|
| **Apple** | Typographic restraint (negative tracking on headings, weight 400/600 ladder), translucent persistent chrome via backdrop blur, near-black ink instead of pure black, quiet single-accent interactivity, press micro-interaction | Light-dominant marketing canvas, pill-everything grammar, 17px reading body / 2.41 link line-height, 10–12px legal text, hero display scale |
| **Raycast** | Shadowless elevation built from a surface ladder + hairlines, dark-only continuity, soft semantic accent fills (`*-soft`), keycap glyphs, tight 16–24px in-card padding, compact 8px controls | White-as-primary CTA, positive letter-spacing everywhere, red hero stripe gradients, decorative one-off moments, saturated accents outside illustration/data |
| **Linear** | Deepest near-black canvas (never `#000`), single chromatic accent used scarcely (actions/focus/selection/links), mono reserved for technical tokens, buttons at 8px (never pill), hairline ladders | Marketing layout grammar, product-screenshot hero panels, inverse white surfaces, oversized CTA banners |

### Core rules

1. **Minimal first.** If a decoration doesn't carry meaning, remove it.
2. **One accent.** Exactly one UI/action accent exists. Every primary action, selected state, focus ring, and important link uses it. Nothing else is colored for emphasis.
3. **Color means severity.** Red/orange/green (and blue, only when required) are reserved for *security semantics* — data states, not decoration.
4. **Depth without shadows.** Elevation comes from surface tone, hairline borders, and spacing — not drop shadows, glows, or colored borders.
5. **Glass signals persistence.** Translucency is reserved for persistent chrome (header, sidebar, floating surfaces). Data cards stay solid.
6. **Plain language first.** Title and meaning are human; technical strings are support material underneath.
7. **Calm motion.** Motion exists to explain state changes, not to entertain.

---

## What Aegis Is NOT (Explicit Rejections)

The following are banned from the current visual language:

- Neon cyan/green visual dominance and the RGB/cyberpunk/gaming aesthetic
- Glowing cards, colored card shadows, glow borders, `.glow-*` treatment
- Decorative background gradients and gradient text
- Excessive glassmorphism / glass on every card
- Giant hero/marketing typography inside the desktop app
- Excessive pill buttons (pills are status chips and filters only)
- Cluttered SOC-dashboard appearance: excessive cards, borders, and chrome
- Tiny unreadable technical text (no 10–11px content)
- Constant pulsing, decorative animation, or glowing animated elements
- Unnecessary color of any kind
- Copying any brand's identity, logo, or proprietary visual language

---

## Design Tokens

Tokens above in the front matter are canonical. Rules for using them:

- Reference tokens (`{colors.surface-1}`, `{typography.body}`, `{rounded.sm}`, `{spacing.md}`) everywhere; never inline raw hex.
- When mapping to Tailwind, extend the theme with exactly these names — no parallel "neon" vocabulary.
- Semantic tokens may only appear where they represent a data/severity state.

### Color usage

| Purpose | Token | Notes |
|---|---|---|
| App background | `{colors.canvas}` | Never `#000000`. The cool tint is intentional and subtle. |
| Recessed wells | `{colors.canvas-deep}` | Chart plot areas, mono/log wells. |
| Cards/panels/sidebar | `{colors.surface-1}` | The default resting surface. |
| Hover/popovers/menus | `{colors.surface-2}` | Elevation = one step lighter, never a shadow. |
| Tooltips/floating chrome | `{colors.surface-3}` | Rarely needed. |
| Borders | `{colors.hairline}` / `{colors.hairline-strong}` | All edges are hairlines; there are no card drop shadows. |
| Interactive accent | `{colors.accent}` | Actions, selected nav, focus, links, brand mark. |
| Severity | `semantic-critical/warning/success/info` | Data only — see [Alerts](#alerts). |

**Never** use a semantic color for a decorative purpose (icon fill on a mute control, hover state, empty-state ornament). When in doubt, the element is neutral (`text-muted`) and its meaning is conveyed by text.

### Severity mapping

| Severity | Token | Meaning (plain language) |
|---|---|---|
| Critical | `{colors.semantic-critical}` | Attack confirmed / DoS / host compromised |
| Warning | `{colors.semantic-warning}` | Suspicious / probe / elevated risk |
| Normal / healthy | `{colors.semantic-success}` | All clear / normal traffic / resolved |
| Info (only if genuinely needed) | `{colors.semantic-info}` | Informational events |

Semantic rendering rules:

- Status = **soft tinted background + colored text/chip** (`*-soft` fills with the matching text color), or a **small status dot / left edge**, or a **chart series color**.
- Never paint an entire card red/orange/green. Never make cards glow.
- Prefer the color to *reinforce* a word ("Critical", "Probe detected") — never be the only signal. Always pair with text.

---

## Typography

### Family

- **UI:** Inter (already in use — keep it). Weights used: **400** (body), **500** (labels/emphasis), **600** (headings). There is no 700+ and no 300.
- **Mono:** system mono stack for *technical values only* — IP addresses, ports, packet counts/values, protocol identifiers, hashes, IDs, timestamps in tables.
- Explanations and every user-facing sentence use the UI font, never mono.

### Scale (desktop app)

| Token | Size / Weight | Use |
|---|---|---|
| `{typography.display}` | 24 / 600 | Rare page titles — the largest size inside the app. Never marketing-scale. |
| `{typography.title}` | 20 / 600 | Section headers, alert titles, card titles |
| `{typography.subtitle}` | 16 / 600 | Component titles, alert titles |
| `{typography.body-lg}` | 16 / 400 | Empty states, alert summaries |
| `{typography.body}` | 14 / 400 | Default UI text, explanations — the workhorse |
| `{typography.caption}` | 13 / 400 | Metadata, table cells, secondary description |
| `{typography.label}` | 13 / 500 | Buttons, nav, form labels, badges |
| `{typography.micro}` | 12 / 400 | Optional only; never for important content |
| `{typography.mono}` | 13 / 400 | Technical values |

Rules:

- Headings 16px+ carry slight negative tracking (see tokens); body is neutral. Never positive-tracking body text.
- **Minimum readable size is 13px for anything that carries meaning.** 12px is allowed only for genuinely auxiliary chrome (column micro-labels, legal). Important information is never tiny.
- Enable tabular numerals (`font-feature-settings: "tnum"`) wherever numbers update or align in columns (metrics, tables, gauges).

---

## Layout & App Chrome

### Frame (desktop)

```
┌─────────────────────────────────────────────┐
│ Top bar  (glass — translucent, persistent)  │  ← traffic-light dots, title, status, global actions
├──────────┬──────────────────────────────────┤
│ Sidebar  │  Content area                    │
│ (surface-1, │  (canvas, generous spacing,    │
│  hairline   │   max comfortable measure,     │
│  right edge)│   scrollable region)           │
│           │                                  │
└──────────┴──────────────────────────────────┘
```

- **Top bar / persistent header:** the one place glass is expected — translucent (`~72–80%` surface tint) with backdrop blur. Contains window chrome affordances, current view title, live status, primary global action.
- **Sidebar / navigation:** solid `surface-1` with a hairline right edge. Compact, obvious active state (soft accent tint + accent text/icon). Can collapse to an icon rail in narrow windows. If a floating/overlay variant is needed it may use glass, consistent with the top bar.
- **Content area:** `canvas`. Generous spacing between blocks (`{spacing.section}` 48px). One primary focus per view; no wall of identical cards.

### Window sizes / responsiveness

The UI must stay usable at maximized, medium, and narrow window widths:

| Window | Behavior |
|---|---|
| Wide (≥ 1400px) | Full layouts; content max-width with comfortable gutters |
| Default (960–1400px) | Metric grids 3–4 across; charts full width |
| Compact (720–960px) | Metric grids 2 across; sidebar may collapse to icon rail; tables scroll horizontally with sticky identity column |
| Narrow (< 720px) | Single column; critical info never clipped or hidden behind overflow; charts reflow, never fixed oversized |

- No fixed oversized layouts. No reliance on a particular aspect ratio.
- Breakpoints are about *reflow*, never about hiding meaning.

---

## Components

### Buttons

Three default levels plus a destructive variant. Only one primary button per view.

| Variant | Fill | Text | Use |
|---|---|---|---|
| `{component.button-primary}` | `{colors.accent}` | white | The one main action in a view |
| `{component.button-secondary}` | `{colors.surface-2}` + hairline | `text-primary` | Common actions, next to primary |
| `{component.button-tertiary}` | transparent | `text-secondary` | Low-emphasis actions, "View details", inline |
| `{component.button-danger}` | `critical-soft` tint | `semantic-critical` | Destructive confirm actions (restrained, not glowing) |

- All buttons: 32px height, `{rounded.sm}` (8px) radius. Never pill. Icons allowed at 16px, same label color.
- Press state: subtle scale/dim or the documented pressed color. Hover = documented hover color — quiet, not luminous.
- Do not make every button loud: most views should have zero or one filled primary, and plenty of tertiary text actions.

### Inputs & form controls

- Background `canvas-deep` (slightly recessed), 1px `hairline` border, 8px radius, 32px height, placeholder `text-faint`.
- **Focus is unmistakable and consistent:** 1px `accent` border + 2px `accent-ring` ring. Keyboard users always see it.
- Selects, search fields, and number inputs inherit the input grammar. Keep labels in `{typography.label}` `text-secondary`, 13px minimum.
- Validation messages are text-first (`text-secondary`/semantic color), never a colored border alone.

### Navigation

- Clean and compact. Active item: soft `accent-soft` fill with `accent` text/icon (or a 2px accent indicator). Inactive: `text-muted`, hover `surface-1`.
- Icons are neutral (`text-muted`) — never glowing or gradient.
- Tabs: text with a small accent underline or soft chip fill on the active tab; no heavy segmented boxes everywhere.

### Cards

- `surface-1` + hairline border, `{rounded.md}` (10px), padding 16–24px. No shadow, no glow, no gradient.
- Hierarchy inside a card: title (`{typography.subtitle}` or `label`-strong) → value/content → muted metadata.
- Hover elevation = border brightens to `hairline-strong` and/or surface steps to `surface-2`. No lift animations.
- **Metric cards:** label in `text-muted` (`caption`), value large and numeric (`title`, tabular numerals). Trend/state uses a small semantic dot or text, not a tinted card.
- Gloss is limited to an optional 1px `gloss-top` highlight on the top edge of elevated surfaces — never reflections or sheens.

### Tables

- Readable and restrained: header row `caption`/`text-muted` with hairline underline; rows separated by faint hairlines; no zebra striping by default; hover row = `surface-2`.
- **Technical values render in mono** (`IP`, `Port`, `Proto`, packet fields); human columns (what it means) render in normal UI text and come first.
- Strong hierarchy: the first column is the identity; keep it sticky on horizontal scroll in narrow windows.
- Row actions appear on hover or in an overflow menu — not a row of buttons always visible.

### Badges & chips

- Status chips are `{rounded.pill}` with `*-soft` tint + semantic text (e.g., "Critical", "Resolved").
- Filter chips / segmented filters are pills only in the "filter" role; selected = soft surface lift or accent tint.
- Anything that is a *button* is not a pill.

### Alerts

The most important component — see [Plain-Language Alerts](#plain-language-alerts).

### Charts & visualizations

- Clean, minimal, no unnecessary decoration: faint `hairline-faint` gridlines, no chart-area gradients, no glow, no 3D.
- Series colors: neutral baseline (muted neutral or low-alpha accent steps) + semantic colors for meaning (e.g., attack traffic = critical red). Never a rainbow.
- Legends and axis labels ≥ 12–13px readable; technical tick values may be mono.
- Live updates animate subtly (fade/step), never strobing or pulsing.

### Dialogs, popovers, tooltips

- Dialogs: `surface-2` + `hairline-strong`, `{rounded.lg}` (12px), `scrim` overlay. Escape closes. Focus traps in.
- Popovers/menus: `surface-2` (or glass only when floating over dense content), hairline, small radius.
- Tooltips: `surface-3`, short text, keyboard-triggerable. Never the only place information lives.
- Keycap hints (`⌘K`) render with `{component.keycap}` styling when advertising shortcuts.

### Empty, loading, and error states

- Empty states explain in plain language what the user is looking at and what to do next (`body-lg` text + one tertiary action). No decorative illustrations required.
- Loading keeps layout stable (skeleton = muted surface blocks, no shimmering gradients).
- Errors state what happened and the next step — no raw stack traces as the primary message.

---

## Plain-Language Alerts

Aegis UX rule: **meaning first, technical detail second.** Anyone — including someone who does not know cybersecurity — must understand an alert.

Structure of an alert row/card:

1. **Title (plain language):** what happened, in human terms. E.g., "Host Sweep Detected".
2. **Summary (one clear sentence):** why it matters in plain English. E.g., "Your device contacted an unusually large number of hosts in a short time."
3. **Technical details (expandable/secondary):** the analyst-facing data beneath, using mono for values and muted keys:
   - Source: `172.19.3.37`
   - Destination count: `8`
   - Protocol: `UDP`
   - Port: `5353`
   - Severity: Warning (chip)

Rules:

- Never present an intimidating technical string (rule name, raw counts, hex) as the *primary* explanation.
- Severity is communicated by a semantic chip/dot *and* its word — never color alone.
- Do not hide meaning behind jargon: prefer "unusually large number of hosts" over "high fan-out UDP mDNS activity" as the lead.
- The analyst path stays one click away: expandable details, never a maze.

---

## Glass, Gloss & Depth

### Translucency policy

Glass (backdrop blur + translucent surface tint) communicates *persistence and layering*. It is reserved for:

- The persistent top bar / header
- Sidebar or navigation chrome when it floats over content
- Floating surfaces that overlay content (command palette, draggable inspectors)

**Data cards stay solid.** No glass on every card, no blur stacks, no "frosted metric" effect. Where glass is used, tint sits at ~72–80% so text underneath stays legible and content never fights the blur.

### Depth model

There is one depth model in the system:

1. Flat canvas (`canvas`) → 2. surfaces (`surface-1/2/3`) → 3. hairlines — and nothing else.

No drop shadows on cards, no glowing borders, no colored shadows, no elevation gradients. A subtle top-edge `gloss-top` highlight is permitted on the most elevated surface in a layer (e.g., dialogs, active sidebar region).

---

## Motion

- Durations: `{motion.fast}` 120ms / `{motion.base}` 180ms / `{motion.slow}` 260ms, with one shared easing curve.
- Allowed: hover, press, navigation transitions, panel appearance (fade + slight slide), live-data value/row updates, focus movement.
- Forbidden: constant pulsing, glowing/flashing animations, decorative looping motion, bouncy overshoot, motion for its own sake.
- Respect `prefers-reduced-motion`: reduce to opacity-only or none.
- Live-data updates should read as calm changes, not alarms — the alarm is the alert component, not the animation.

---

## Accessibility & Keyboard

- Every control is keyboard-reachable with a visible `accent-ring` focus state. Never remove outlines without replacement.
- Text contrast: body text meets WCAG AA on its surface; semantic text on `*-soft` fills is checked against the soft fill, not the canvas.
- Buttons/controls target ≥ 28–32px height with adequate hit area; respect platform conventions.
- Semantic meaning is never conveyed by color alone (always pair with text/icons).
- Provide keyboard shortcuts for frequent actions and advertise them with keycaps — this is a desktop app; keyboard fluency is part of the premium feel.
- Chromium/Electron specifics: honor system dark appearance; do not ship a light mode.

---

## Backend Freeze

This document governs the UI only. The following are **frozen** and must never be modified by UI redesign work:

- Detection engine
- Detection thresholds
- DoS state machine
- Probe rules
- Packet decoder
- Flow tracker
- Packet capture
- Electron IPC
- Security behavior
- Backend behavior

UI changes may **consume existing data differently** (reorder, regroup, re-present, re-word, expand/collapse) but must never change the underlying detection behavior, thresholds, rules, or any backend/capture logic. Tests are part of the frozen baseline.

---

## Do's and Don'ts

### Do

- Keep the app dark, calm, and near-black (`canvas`, never `#000`), with no glow and no background gradients.
- Use exactly one accent for all interactivity; use semantic colors for data states only.
- Build elevation with surface steps + hairlines + spacing — never shadows or glows.
- Reserve glass for persistent chrome (top bar, sidebar, floating surfaces); keep data cards solid.
- Lead every alert with plain language; keep technical strings for the expandable detail layer.
- Set body in Inter 14/400, headings 600 with light negative tracking, content ≥ 13px.
- Render technical values (IPs, ports, packets, protocol ids) in mono; explanations in the UI font.
- Use 8px buttons, 10–12px cards, pills only for status/filter chips.
- Keep motion short, purposeful, and reducible.

### Don't

- Don't reintroduce neon/glow/gradient/gaming vocabulary or any `neon-*`/`glow-*` token.
- Don't use more than one accent color, or semantic colors as decoration.
- Don't make entire cards red/orange/green, don't glow cards by severity.
- Don't put glass on data cards or blur stacks.
- Don't use giant marketing typography, pill buttons for actions, or tiny unreadable type.
- Don't lead with raw technical strings as the user-facing explanation.
- Don't decorate: no unnecessary borders, shadows, gradients, animations, or color.
- Don't modify any frozen backend/capture/detection behavior, thresholds, or rules.

---

## Implementation Notes (mapping from current codebase)

- `src/index.css` currently defines the old vocabulary (`--neon-*`, `.glow-*`, gradient card classes). When UI work begins, replace these with the token names above; do not layer the new system on top of the old one.
- `tailwind.config.js` currently extends `neon-*`/`bg-*` colors. Map to the canonical token names above during implementation.
- Chart and metric surfaces should map to `surface-1`/`hairline` with semantic series colors only.
- Severity chips replace the current tinted full-card alert backgrounds; the alert structure becomes plain-language title → summary → expandable mono details.

---

## Reference Sources

This system was synthesized from three local reference analyses produced by the getdesign CLI (see the reports reviewed before this document):

- `apple/DESIGN.md` — Apple design analysis
- `raycast/DESIGN.md` — Raycast design analysis
- `linear.app/DESIGN.md` — Linear design analysis

Provenance note: adopted principles are summarized in the [Where the language comes from](#where-the-language-comes-from) table. Brand identities, logos, proprietary typefaces, and marketing layouts from the references are explicitly not reproduced here.
