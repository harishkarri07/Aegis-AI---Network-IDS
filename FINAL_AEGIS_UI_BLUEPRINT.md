# FINAL AEGIS UI BLUEPRINT

> **Phase:** UI design review / blueprint only. No application code, CSS, Tailwind, tests,
> backend, detection, capture, or Electron behavior was modified to produce this document.
> All recommendations below are *proposals* to be executed in the UI-refinement phase.
>
> **Inputs audited:** `AegisDesktopApp.tsx`, all Network IDS views, all SIEM views,
> `LiveMonitor`, `Analytics`, `ModelPerformance`, `ExplainAlert`, `LogsPanel`, `SocOverview`,
> `LiveEventsView`, `AlertsInvestigationView`, `IncidentsView`, `DevicesView`,
> `DetectionRulesView`, `ReportsView`, `AttackSimulatorModal`, chart components
> (`TrafficChart`, `AnomalyChart`, `FeatureImportanceChart`, `ConfidenceGauge`),
> `MetricCard`, `AlertBox`, `index.css`, `tailwind.config.js`, `electron/main.ts`,
> `electron/preload.ts`, `src/types.ts`, `src/app/*`, reference docs
> (`DESIGN.md`, `apple/DESIGN.md`, `raycast/DESIGN.md`, `linear.app/DESIGN.md`),
> plus the current `Aegis` DESIGN.md synthesis.
>
> **Status of technical baseline:** validated and frozen (Stop-Capture verified in the
> packaged Windows app; capture/detection/DoS/Probe/decoder/flow-tracker/IPC/SIEM/backend
> are out of scope for UI work).

---

## 0. Executive summary

The current console is a **marketing-styled web page hosting a 12-tab application**:
neon tokens, gradient cards, glowing gauges, pulsing indicators, 9–11px uppercase micro-type,
a 12-item flat tab strip that horizontally scrolls, a website "return" bar and a marketing
footer rendered *inside* a native Electron window.

The existing `DESIGN.md` already correctly diagnoses almost all of this and specifies the
right direction (surface ladder, hairline borders, single accent, semantic-only color,
plain-language alerts, Inter discipline). **The gap is not strategy — it is that no UI code
has been migrated to the DESIGN.md system yet.** This blueprint therefore does two things:

1. **Confirms and hardens the existing DESIGN.md** into a final visual direction
   (with a fourth reference — Vercel/Geist — folded in and a few token/rule corrections).
2. **Maps that direction onto every screen** that actually exists today, with an explicit
   inventory of what to remove, replace, consolidate, and retain, plus an implementation order.

The single most important product change is the **Live Monitor restructure**: it must answer
"Is my network okay?" in seconds. Everything else is coherence work so all twelve surfaces
feel like one desktop instrument.

---

## 1. Final design philosophy

**One sentence:** *Aegis is a quiet instrument — a near-black, hairline-framed desktop
console in which severity color is data, chrome is neutral, plain language leads, and
technical evidence is always one deliberate step away.*

Governing rules (ordered, in priority):

1. **Answer the question.** Every screen answers one question. Live Monitor: *"Is my network
   okay right now?"* Alerts: *"What needs triage?"* Logs: *"Show me the evidence."* If a
   visual doesn't serve its screen's question, it goes.
2. **Calm at rest, precise in alarm.** The resting state is quiet and green-free-until-true.
   Red exists only when a real critical event exists. Steady-state "capturing" is **not** an
   alarm and must not pulse.
3. **Severity color is data.** Red/orange/amber/green encode security meaning only. The
   application chrome (navigation, buttons, inputs, cards, icons) is neutral. Exactly one
   accent color exists for interactivity.
4. **Plain language first, evidence second.** Human title → one-sentence explanation →
   concise evidence → expandable technical detail. Never the reverse.
5. **Elevation without shadow.** Depth = surface ladder + hairlines + spacing. No glows, no
   colored shadows, no decorative gradients, no glass on data cards.
6. **One application, not a web page in a window.** The shell is desktop grammar: native
   frame respected, persistent left navigation, no marketing footer, no "back to website"
   strip inside the packaged product.
7. **Stability under live data.** Live updates change *data*, never *layout*: fixed reading
   positions, tabular numerals, row ceilings, calm 120–180ms transitions.
8. **Density without clutter.** Information-dense is fine; equal prominence of everything is
   clutter. Every view has one primary focus.

---

## 2. Final reference hierarchy

Aegis borrows *principles*, never identity, layout, logos, or proprietary assets.

### From Apple
- **Near-black ink, never `#000`** for text/canvas; the "quiet premium" posture.
- **Typographic restraint:** weight ladder 400/500/600 (no 900 anywhere), 600 for headings,
  slight negative tracking on headings ≥ 16px, neutral tracking on body.
- **One interactive accent** used for every "click me" signal; press-state micro-interaction.
- **Persistent chrome = subtle translucency** (top app bar only), data cards stay solid.
- **Rhythm by whitespace and surface change**, not by boxes around everything.

### From Raycast
- **The shadowless surface ladder** (canvas → surface-1/2/3) + **hairline borders** as the
  entire elevation model.
- **Desktop component grammar:** compact 32px controls, tight in-card padding (16–24px),
  6–10px radii, keycap glyphs for shortcuts, dark-only continuity.
- **Soft semantic tint fills** (`*-soft` backgrounds with matching text) for chips/states —
  never full-card washes.
- Inter with `ss03` enabled is a legitimate brand-voice detail, but Aegis keeps standard
  Inter (`ss03` off) — Aegis does not need to imitate Raycast's signature glyph.

### From Linear
- **Deepest near-black canvas** with a faint cool tint; light-gray ink; strict mono-for-
  technical-tokens only.
- **Single chromatic accent used scarcely** (actions, selection, focus, links).
- **Dense, precise dark information hierarchy** — this is the model for our tables,
  investigation consoles, and multi-panel layouts.
- **Buttons are rectangles (6–8px), never pills**; pills are reserved for status/filter chips.

### From Vercel / Geist (new fourth reference)
- **Technical typography discipline:** three weights (400/500/600, no 700+), tabular
  numerals for all changing/columnar numbers, mono face reserved for code-like values,
  aggressive negative tracking reserved for display type only.
- **"Color only when it must"** and, when it appears, **status color at indicator scale**
  (dots/small chips) rather than surface fills.
- **Ghost-first buttons** (transparent default, hairline/surface on hover, accent only for
  the one primary action) and a consistent **double-ring focus** pattern.
- **Quiet confidence through density + precision**, not decoration.

### What remains uniquely Aegis (do not dilute)
- **The dual security surface:** a *network packet* plane and a *host-telemetry/SIEM* plane
  under one instrument (rare in consumer-visible products).
- **The plain-language security narrative system** ("Port scan detected → this device
  contacted many ports quickly → evidence") — human-first alerting at the packet level, not
  just rule IDs.
- **Deterministic, explainable detection as a feature** (Detection Engine / Explain Alert):
  the product explains *why* it alarmed, with thresholds and weights, not a black box.
- **Restraint with teeth:** severity color exists and is used decisively *when the data
  demands it*, unlike pure-minimalist tools that would hide a critical alert.

---

## 3. Final color system

Keep the token set from `DESIGN.md` (canonical), with **three corrections/adjustments**
explained below. All colors below are proposal values carried over from DESIGN.md v1.0
except where noted.

### 3.1 Neutral chrome (never decorative)

| Token | Value | Use |
|---|---|---|
| `canvas` | `#0c0e12` | App background (not pure black; cool tint) |
| `canvas-deep` | `#08090c` | Recessed wells: plot areas, log/mono wells, input fills |
| `surface-1` | `#13161c` | Cards, panels, sidebar |
| `surface-2` | `#181c24` | Hover, menus, popovers, active rows, dialogs |
| `surface-3` | `#1e232d` | Tooltips, floating command surface |
| `hairline` | `#232733` | Default 1px borders |
| `hairline-strong` | `#2d3340` | Hover borders, emphasized dividers |
| `hairline-faint` | `rgba(255,255,255,0.05)` | Row dividers, chart gridlines |
| `gloss-top` | `rgba(255,255,255,0.06)` | 1px top highlight on the highest surface only |

Text ladder (kept from DESIGN.md): `text-primary #eceef2` / `text-secondary #c3c8d1` /
`text-muted #98a0ad` / `text-faint #6b7280`.

### 3.2 Interactive accent (one, and only one)

| Token | Value | Notes |
|---|---|---|
| `accent` | `#5f6ae0` | Primary actions, selected nav, focus, links, brand mark |
| `accent-hover` / `accent-pressed` | `#7e89ea` / `#4853bd` | Quiet hover/press steps |
| `accent-soft` | `rgba(95,106,224,0.14)` | Selected-row / chip background |
| `accent-ring` | `rgba(95,106,224,0.45)` | Keyboard focus ring |

**Decision (conflict with current code, aligns with DESIGN.md):** the current cyan
`#00d4ff` used everywhere (buttons, links, active tabs, icons, header, chips) is a *second
decorative brand color*, not an accent system. Replace all interactive-cyan with `accent`.

### 3.3 Semantic severity (data only)

**Correction to DESIGN.md (v1.0):** it defines four data colors (critical/warning/success/
info) but does not map the product's actual *four-tier severity* values
(`CRITICAL/HIGH/MEDIUM/LOW`) onto them, which is why the code drifted into
"critical=red, high=orange, medium=cyan, low=green". Green for a *Low alert* is wrong —
green means healthy/safe. Final mapping:

| Data meaning | Token | Value | Where it appears |
|---|---|---|---|
| Critical (confirmed attack / DoS / compromise) | `semantic-critical` | `#e5484d` | Severity CRITICAL |
| High / suspicious / probe / elevated risk | `semantic-warning` | `#e3963a` (orange) | Severity HIGH |
| Medium risk — caution | **new** `semantic-medium` | `#d9a13b` (amber) | Severity MEDIUM |
| Informational / Low (no tint) | neutral | `text-muted` chip, no fill | Severity LOW + INFO events |
| Healthy / safe / resolved / all-clear | `semantic-success` | `#3fb68a` | "Healthy", "Resolved", "No threats" states |
| Genuine info (only when needed) | `semantic-info` | `#6db3e6` | e.g., informational system events |

Each semantic color has a matching `*-soft` background at ~12% alpha for chips/dots/left
edges. **Never** paint an entire card a severity color; never glow.

**Why the new `semantic-medium` amber:** HIGH (orange) and MEDIUM (amber) must remain
distinguishable at a glance in triage lists; without a distinct amber, MEDIUM collides with
HIGH in hue. This is the only new color token proposed.

### 3.4 Current-code → token migration map (implementation reference)

| Current value | Current use | Replace with |
|---|---|---|
| `#00d4ff` cyan | interactive everything | `accent` `#5f6ae0` (or neutral) |
| `#00ff88` green | action buttons, "Live", healthy | `semantic-success` only for *healthy/safe* states; Start button → `accent` |
| `#ff3333` red | Stop button, critical, DoS | `semantic-critical` for severity only; Stop → secondary/danger outline |
| `#ff8800` / `#ffaa00` orange | Probe, high | `semantic-warning` |
| `#ff3366` pink-red | incidents badge, some critical | `semantic-critical` |
| `#ff44aa` pink | anomalies, U2R | remove from chrome; anomaly encoding via `semantic-warning`/threshold band |
| `#ffcc00` yellow | R2L | `semantic-medium` family |
| `#1e3a5f` blue-gray borders/fills | hairline-ish everywhere | `hairline` / `hairline-strong` / neutral surfaces |
| `#0a0e1a`, `#070b14`, `#0f172a`, `#111827`, `#1e293b` | ad-hoc surfaces | `canvas` / `canvas-deep` / `surface-1` / `surface-2` |
| `#7090b0`, `#b0c4de`, `#e0e6f0`, `#cbd5e1` | ad-hoc text | `text-muted` / `text-secondary` / `text-primary` |
| `.ids-card` gradient+shadow, `.glow-*`, `.alert-*` tinted cards, `neon-gradient-text` | card/chrome | delete from `index.css`; replaced by `surface-1` + hairline cards |

`index.css` and `tailwind.config.js` get rebuilt to the token vocabulary (no `neon-*`,
`glow-*`, gradient card classes remain). That is part of the *implementation phase* and is
explicitly not done yet.

---

## 4. Final typography system

- **UI face:** Inter 400/500/600, loaded for real (see weakness W2 — currently *referenced*
  but never *loaded*; Windows falls back to Segoe UI). Self-host via `next/font` so the
  static export/Electron build stays offline-safe. Enable `calt, kern, liga` (no `ss03`;
  Aegis is not Raycast).
- **Mono face:** system mono stack for *technical values only*: IPs, ports, packet counts,
  protocol IDs, rule IDs, alert IDs, hashes, timestamps in tables.
- **Weights:** 400 body, 500 labels/emphasis, 600 headings. **No 700–900 anywhere in the
  console** (current code uses `font-black`/900 repeatedly — remove). This matches
  Apple/Linear/Geist three-to-four weight discipline.
- **Numerals:** `font-variant-numeric: tabular-nums` on all counters, metrics, table cells,
  gauges, and clock.

| Token | Size/Wt | Use |
|---|---|---|
| `display` | 24/600, -0.4px | Rare page titles (largest in app — the Live Monitor is a desktop screen, not a hero) |
| `title` | 20/600, -0.3px | Section / card-group headers |
| `subtitle` | 16/600, -0.2px | Card titles, alert titles |
| `body-lg` | 16/400 | Empty states, alert summaries |
| `body` | 14/400 | Default text — the workhorse |
| `label` | 13/500 | Buttons, nav, form labels |
| `caption` | 13/400 | Metadata, table cells |
| `micro` | 12/400 | Only auxiliary chrome (column micro-labels) — **never meaningful content** |
| `mono` | 13/400 (+500 strong) | Technical values |

**Explicit corrections to current practice:**
- Minimum meaningful UI content = **13px**. Today many screens use 9–11px for content
  (AlertBox labels at 9px, table rows 11px, LogsPanel 11px, headers 10px, badges 10px,
  SocOverview 10–11px). All of that moves up.
- **Kill the all-caps default.** Current code uses `uppercase tracking-widest` on nearly
  every heading and label (which is why text must stay tiny to fit). New rule: sentence
  case for headings and labels; uppercase allowed only for: literal protocol/mode tokens
  ("TCP", "ONLINE", "CRITICAL" severity values), status words inside chips where they mirror
  the data value, and a single `micro` eyebrow per card — never a whole screen.
- No marketing-scale type inside the console (the `text-xl font-black neon-gradient-text
  uppercase` console title in the header, and "Traffic Intelligence Report"
  gradient text, go away).

---

## 5. Final spacing system

Adopt DESIGN.md spacing tokens (`xxs 4 / xs 8 / sm 12 / md 16 / lg 20 / xl 24 / xxl 32 /
section 48`) and enforce these patterns:

- **Content gutter:** 24px (`xl`) around the content column; consistent on every screen.
- **Between major blocks in a view:** 24–32px. Between *cards in a group*: 16px (`md`).
- **In-card padding:** 16–20px horizontal, 16–24px vertical. Dense tables may run 16px with
  8–12px row padding.
- **Metric rows:** cards separated by 16px gutters; never 4px-cramped.
- **Sidebar:** 232–248px expanded, 64px icon rail collapsed, item height 32px.
- **Breakpoint behavior** from DESIGN.md stands: 4→3→2→1 column metric grids; tables
  horizontal-scroll with sticky identity column; nothing important ever clips.

---

## 6. Final radius system

Keep DESIGN.md (`xs 6 / sm 8 / md 10 / lg 12 / pill`). Tighten usage:

- **Buttons, inputs, selects, search, sidebar items:** `sm` (8px).
- **Cards / panels / tables container / metric cards:** `md` (10px).
- **Dialogs, large drawers:** `lg` (12px).
- **Chips, status pills, filter chips, dots:** `pill`.
- Nothing else is pill; no decorative 16–24px marketing rounding inside the console
  (current `rounded-2xl` in the simulator modal → `lg`).

---

## 7. Final surface/elevation system

The complete depth model (from DESIGN.md, confirmed):

```
canvas → surface-1 (cards/sidebar) → surface-2 (hover/menus/dialogs) → surface-3 (tooltips)
        ↑ all separated by hairline borders; elevation = lighter tone, never shadow
```

Rules:
1. **No drop shadows on cards.** Remove `shadow-lg`/`shadow-2xl`/`shadow-xl` from every
   console surface. (Subtle scrim + slight blur for modal overlay is allowed.)
2. **No `backdrop-blur` on data cards.** Glass is reserved for the persistent top app bar
   when it floats over scrolling content.
3. **Hover = border brighten (`hairline-strong`) and/or +1 surface step**, no lift/scale.
4. Selected alert/list row = `surface-2` (or `accent-soft` for nav/selection where the
   DESIGN.md prescribes accent-tinted active state).
5. The **focus ring is always visible**: 1px accent border + 2px accent-ring (Geist-style
   double ring: an inner neutral gap ring + outer accent ring is also acceptable).

---

## 8. Final semantic severity system

**(a) Severity chip grammar (shared component, replaces ~6 bespoke chip styles):**
`pill` radius, `*-soft` background, semantic text color, `label`/`caption` size 12–13px,
text always present (never color alone). Examples: `CRITICAL` (red), `HIGH` (orange),
`MEDIUM` (amber), `LOW` (neutral — surface fill + muted text), `RESOLVED`/`HEALTHY` (green).

**(b) Rules for using severity:**
- The **alarm signal** = the chip/dot/left-edge. Rest of the row/card is neutral.
- **Status dot** = 8px, semantic fill; static when healthy, **slow 1.5–2s calm pulse only
  for an active critical state** (never for "capturing"/"online"/"heartbeat healthy").
- Do not tint entire alert rows/cards by severity; do not glow; do not use severity color on
  icons of neutral actions.
- Keep red for *genuinely dangerous* (critical severity / confirmed attack); medium-risk and
  informational events get amber/neutral so red keeps its meaning.

**(c) Category → color mapping for packet categories** (used in TrafficChart, LogsPanel,
AlertBox, LiveMonitor list) follows the same ladder:
`DoS` critical · `U2R` critical · `Probe` warning · `R2L` warning · `NORMAL` neutral
(muted, no fill). This removes the out-of-family pink (`U2R`) and yellow (`R2L`) hues.

---

## 9. Final navigation architecture

**Decision: grouped compact left sidebar (hybrid desktop grammar), not the current 12-tab
top strip.** Rationale:

1. **12 flat tabs = no hierarchy.** Two genuinely different domains exist (the *packet/IDS
   plane* and the *host/SIEM plane*), yet all twelve items have identical weight and the
   Live Monitor — the product's answer to "is my network okay" — is just another tab.
2. **The strip already fails to fit** — `overflow-x-auto` horizontal scrolling at default
   widths, with icons+uppercase text+badges crammed in.
3. **Desktop convention:** persistent navigation belongs on the left in a native-frame
   Electron app; top tabs are the marketing page's grammar and are partly why the console
   reads as "a website".
4. A sidebar can hold the badge counts without churn and can show the two-domain grouping
   that top tabs cannot.

**Sidebar structure:**

```
AEGIS (brand mark, 40px)
─────────────────────
NETWORK PROTECTION
  Live Monitor          ← home, default (pin / always reachable)
  Traffic Logs
  Analytics
  Detection Engine      ← folds Detection Engine + Explain Alert as internal segments
─────────────────────
SOC / ENDPOINTS
  SOC Overview
  Alerts & Triage
  Attack Chains
  Telemetry Events
  Endpoints
  SIEM Rules
  Audit Reports
─────────────────────
(system footer: environment chip, version, docs link)
```

- Items: 32px, icon 16px neutral (`text-muted`), label 13px; active = `accent-soft` fill +
  accent icon/text (DESIGN.md sidebar-item spec).
- Section labels are `micro` muted, sentence case ("Network protection", not all-caps
  tracking-wide banners).
- Badges: small neutral chip (accent text on `surface-2`), **only on counts that matter
  and change slowly**: Open alerts, Open attack chains. Remove the live-updating Traffic
  Logs packet-count badge and the color-pink incidents badge (see §18 churn rules).
- Collapse to a 64px icon rail below ~1080px (tooltips on icons), honoring Electron's
  1024px min-width.
- View-internal navigation (e.g., Detection Engine: *Overview | Explain a detection*) uses a
  small segmented control or sub-tabs — do **not** promote internal modes to sidebar items.

**Conflict with current code resolved:** the DESIGN.md frame sketch (glass top bar with
traffic-light dots + sidebar) was never implemented; the app kept a header + horizontal tab
strip. The blueprint adopts DESIGN.md's *sidebar* half and drops the fake-traffic-lights
half (see §20 — the Electron window is natively framed, so window dots are already supplied
by the OS).

---

## 10. Final application shell

Current problems: three stacked chrome rows (website-return strip, tall marketing header,
tab strip), a content max-width wrapper with `max-w-7xl` that whitespaces-out on large
windows, and a marketing footer. In Electron the website-return strip is shown *inside the
desktop product*.

**Target shell (single coherent frame):**

```
┌──────────────────────────────────────────────────────────┐
│  Native OS title bar (Electron — do not fake)            │
├───────────┬──────────────────────────────────────────────┤
│  Sidebar  │  Top app bar (64px, surface-1 + hairline,    │
│  (surface-1│   translucency optional only if it floats)   │
│  232px)   │   [view title] ... [env chip] [clock]        │
│           │   [global actions: Refresh, Attack Simulator]│
│           ├──────────────────────────────────────────────┤
│           │  Content area (canvas)                       │
│           │  - one scroll region                         │
│           │  - consistent 24px gutters                   │
│           │  - per-view header block with title +        │
│           │    one-line description + contextual action  │
│           └──────────────────────────────────────────────┘
```

Shell rules:
1. **Top app bar** holds: current view title (`title` 20/600), a live **environment/status
   chip** (e.g., `PCAP capturing — Wi-Fi` in neutral, or `IDS standby`), the UTC clock
   (mono, muted — no bold caption text), global actions (SIEM refresh; Attack Simulator).
2. The **big green/red Start-Stop capture control** lives on the *Live Monitor status bar*
   (primary action of the default screen), not in the global header.
3. **Footer removed** from the console. Desktop products don't carry marketing footers.
   Status claims ("5-Tuple classifier active", "SQLite online") either belong in the
   environment chip/system status or are dropped — they are not content.
4. **Website-return controls** belong to the website surface only (see §21). Inside the
   Electron app, `showWebsiteNavReturn` is off; in the web preview the strip is slim,
   neutral, and outside the console frame.
5. Content no longer needs `max-w-7xl mx-auto` centering; full-bleed within gutters (which
   is how a 1400×900 instrument should use its pixels).
6. Preserve every DOM `id` that automated UI checks rely on (`start-monitoring-btn`,
   `stop-system-btn`, `traffic-interface-select`, `tab-btn-*`, filter/search/download ids,
   etc.); when an element moves or splits, keep its id on the new equivalent and only add ids
   for genuinely new elements. (Frozen tests must keep passing.)

---

## 11. Live Monitor wireframe / layout description

The current screen is: 5 equal metric cards → two-card row (traffic bar chart | "Latest
System Alert" + ConfidenceGauge) → full-width anomaly chart. Equal cards give no answer
hierarchy, and at rest the right column is mostly an empty dashed circle.

**New information hierarchy (answers the three questions in order):**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. PROTECTION STATE (status bar — always visible)            │
│    [Interface select] [pps setting]  ●──[ Start capture ]   │
│    Capturing Wi-Fi · 10s window · 1,248 pkts · ~42 pkt/s     │
│    (mono counts, tabular; standby state explains the mode)   │
├─────────────────────────────────────────────────────────────┤
│ 2. WHAT NEEDS ATTENTION (single hero band)                   │
│    AT REST:  "No threats detected"  + muted summary of what  │
│              is being watched (normal traffic, last event)   │
│    ON EVENT: [Critical · DoS] "Port scan detected"           │
│              "This device contacted many ports on one host   │
│               in a short time — possible reconnaissance."    │
│              [View evidence ▸]  (src → dst, ports, proto,    │
│               confidence, rule, time — expandable mono grid) │
│              [Investigate in Alerts] (tertiary, when appli-  │
│               cable)  — red appears ONLY here, restrained     │
├─────────────────────────────────────────────────────────────┤
│ 3. IMPORTANT ACTIVITY                                        │
│    Traffic composition (bar)     |  Anomaly score timeline   │
│    (both answer "what changed"; see §14 for chart rules)     │
├─────────────────────────────────────────────────────────────┤
│ 4. RECENT EVENTS (compact activity feed, ~15 rows)           │
│    time · chip(category) · human summary · src → dst (mono)  │
│    click row → expands technical detail inline               │
│    [View all in Traffic Logs ▸]                              │
├─────────────────────────────────────────────────────────────┤
│ 5. DEEPER (no content here — links only, in the page header) │
│    → Traffic Logs · Analytics · Detection Engine             │
└─────────────────────────────────────────────────────────────┘
```

Behavior specifics:

- **Metric strip** (if kept as a thin 3–4 card row under the status bar): each card gets a
  *meaning*, not a bare number — see §13. A row of five equal counters with no trend or
  context is exactly the "672 attacks detected" failure mode; that five-card row is
  **removed** and replaced by at most three contextual cards, with the numbers that matter
  already present in the status bar and hero band.
- **Reading order stability:** rows insert at top of the Recent Events feed; new item gets a
  single 180ms fade; the user's scroll position is untouched. The feed ceiling stays at the
  existing 500-packet buffer (keep — the renderer cap is validated behavior; only the
  presentation of it changes).
- **At-rest default** shows the calm "watching" state so a fresh user immediately learns the
  expected baseline. "No alerts" is shown as *positive information*, not an empty hole.
- The anomaly score timeline is reduced in height (see §14) and no longer dominates the
  fold.

---

## 12. Alert design (packet alerts, SIEM alerts, incidents)

### 12.1 Packet alert (AlertBox — used in Live Monitor hero)

Current: tinted gradient `alert-*` card, icon, all-caps colored title, 9px labels, mono
timestamp, "Anomaly Detected" pink chip, analyst narrative buried in `<details>`.

New (shared component `SecurityAlertCard`):
```
[Critical]  Port scan detected                      14:32:07
This device contacted 23 ports on 192.168.1.1 within
a few seconds — commonly a sign of reconnaissance.
┌ evidence (expandable) ─────────────────────────────┐
  source    203.0.113.50    rule      PROBE-… (mono)
  target    192.168.1.1     confidence 88%
  ports     22, 80, 443…    protocol  TCP
  anomaly    yes (iso −0.42)
└────────────────────────────────────────────────────┘
[View evidence ▸]  [Explain this alert ▸]
```
- Card surface is **neutral** (`surface-1`); severity shows only in the chip + a 3px left
  edge (colored at 60% alpha) for scanability. No full-card tint, no glow.
- Titles are human attack names already available (`explanation.attack_name`); the
  one-sentence summary comes from `explanation.narrative` when present (reword to plain
  language, never a raw rule string as the lead).
- Mono only inside evidence; all labels ≥ 13px.

### 12.2 SIEM alert (AlertsInvestigationView) & Incident (IncidentsView)

Both already have the right *structure* (list + detail, chain stages, rationale, MITRE,
remediation) — they need visual migration + consistency:
- Severity chips use the shared grammar (§8); remove `severity (risk)` colored pill on the
  alert card where the severity chip already says it; risk score appears in the detail only.
- "Why did this alert fire?" boxes: stop using accent-cyan borders as if they were alerting;
  use neutral wells with an accent icon.
- Status actions (**Acknowledge / Resolve / Re-open**) use the button grammar (secondary /
  danger-outline), not three colored translucent pills.
- The **selected alert** in the list: `surface-2` + hairline-strong border (no cyan glow
  shadow — remove `shadow-[0_0_15px…]`).
- Incidents banner on SOC Overview: remove `animate-pulse`; calm but prominent critical
  treatment (left edge + chip + action). Incident chain steps: neutral `surface-deep` chips
  joined by muted arrows; the "current stage" chip carries the severity tint.
- Recommended remediation callouts use **one** shared "action" treatment (neutral surface +
  accent icon + plain-language text) rather than green/red per-context tinting that implies
  the recommendation is itself a status.

### 12.3 Attack Simulator modal

It's a *test/demo* instrument — keep it visually distinct from real telemetry so nobody
mistakes simulated events for real ones: style it as a "Lab / Test" surface (neutral,
warning-ish only for the Run button which stays `accent`), header text "Attack scenario
simulator", success banner neutral instead of green-glow. This is a label/semantics change,
not a behavior change.

---

## 13. Metric design

Principle: **every metric card carries a question and an implied baseline.** A raw
cumulative number ("Attacks Detected: 672") with no context and no trend is not UX.

New metric card anatomy (shared `MetricCard`):
```
  label (caption, muted, sentence case)      [tiny trend dot/spark]
  value (20px/600, tabular numerals)          <- primary
  context line (13px, text-secondary)         e.g. "6 in last minute ·
                                                3 new since last check"
```

Live Monitor metric set (replaces the 5 equal cards) — all computable from **existing
state only** (`history`, `attackCounts`, `anomalyScores`, `totalPackets`, timestamps):

1. **Traffic processed** — total + derived live rate (pkts/s over the recent window) +
   "capturing" vs "standby" context. Replaces the bare "Total Packets".
2. **Threats detected** — total, with an inline mini-breakdown (`DoS 4 · Probe 12 · Other 2`)
   and "last detection Ns/m ago" (from `latestSecurityAlert.timestamp`). Replaces bare
   "Attacks Detected" **and** the separate "DoS Events" / "Probe Events" cards (the raw
   splits belong in the breakdown line and the Traffic Logs filter, not in three
   equal-weight cards).
3. **Anomalous activity** — count from `history` + the 60-sample score trend sparkline,
   with a note of the anomaly band. Replaces bare "Anomalies" and the neon-pink icon.

SOC Overview KPI cards migrate to the same anatomy and keep their context lines, which are
already decent ("Requiring analyst triage" etc.); their **icon chips lose their per-color
tinting** (Activity cyan, Server green, Alerts amber, Critical pink — that's decorative
color on chrome). Icons are muted neutral; severity shows in text and one status dot.

Numbers rule: always `tabular-nums`; never animate a count faster than ~1 change/50ms;
counts freeze exactly at Stop (already the validated behavior — keep it).

---

## 14. Chart / data-visualization rules

Every chart must answer a question; delete charts that don't.

1. **Traffic Chart** (Live Monitor + distribution) — *keep, restyle.* Answers "what is the
   traffic mix this session?" Single bar per category; **NORMAL is neutral muted**, attack
   categories take their severity hue (§8c). Remove the multi-saturated legend; label in
   12–13px; tooltips minimal.
2. **Anomaly score timeline** — *keep, redesign.* It answers "is anything deviating from
   baseline?" Current issues: decorative cyan→transparent gradient fill, an SVG glow-free
   recharts gradient, a red zero-threshold line that reads as "everything above 0 is bad,"
   hidden time axis, 10px ticks. New design: neutral line on `canvas-deep`, **no gradient**,
   anomaly direction encoded by a subtle tinted band **below the actual anomaly threshold**
   (the engine flags `is_anomaly = iso_score < 0`, so the <0 region is the meaningful band);
   show "anomaly threshold" as a quiet dashed hairline with a muted label; point-tint only
   samples whose packets were flagged anomalous; add a time axis; height reduced (~140px).
   No glow, no pulse, `isAnimationActive={false}`.
3. **Analytics donut ("Traffic Composition")** — *keep, restyle.* Reduce palette to neutral
   (normal) + severity hues; consider collapsing `NORMAL` dominance by splitting "Normal" /
   "Suspicious" and, on hover/click, showing the split. Tooltip surface = `surface-3`.
4. **Analytics "Attack Vector" bar** — *keep, restyle* (it answers "which attack types"),
   bars in severity hues, horizontal layout retained, remove all-cyan/red fills.
5. **ConfidenceGauge** — **remove the gauge** (see below). Replace with inline confidence.
6. **FeatureImportanceChart** (Detection Engine / Explain) — *keep, restyle*: horizontal
   bars, neutral track, `accent` fill for the top contributing feature and `text-secondary`
   for the rest (weights are data, but they are *not* severity); mono feature labels ≥ 13px;
   drop the gradient + glow.
7. **No new decorative charts.** Sparklines permitted only in metric context (§13).

### 14.1 Confidence gauge decision (explicit)

**Remove the semicircular ConfidenceGauge.** Reasons:
- It implies *risk* (red/orange/green arc) but confidence is *certainty* — conflating the two
  is exactly the semantic confusion this design forbids. High confidence in an attack is not
  the same as "danger"; severity already encodes danger.
- It burns a third of the "Latest Alert" card's height for one number.
- Its SVG glow filter contradicts the no-glow rule.

**Replacement:** a compact inline confidence readout — mono `88%` at 14–16px next to the
word "Confidence" (`caption`), optionally a 4px-tall hairline progress bar (neutral fill to
value; no hue). In the Explain screen the confidence value sits with the detection-logic
summary; severity remains the chip. This applies to both usages (Live Monitor hero evidence,
ExplainAlert panel).

---

## 15. Table / log design

Unify all tables (Traffic Logs, Telemetry Events, Analytics summary, plus list-style feeds
in SOC/Alerts) behind one table grammar:

- Container: `surface-1`, hairline border, `md` radius, header inside a `surface-deep` or
  transparent strip.
- **Header row:** 13px/500, `text-muted`, sentence case, hairline under-row. Not 10px
  uppercase tracking-widest.
- **Rows:** 13px minimum content; hairline-faint separators; hover = `surface-2`; row
  height ~36–40px (dense but ≥ 13px type).
- **Zebra:** none.
- **Column ordering:** human column first (what it means / category as readable label),
  technical values in mono after.
- **Technical cells (IP, port, IDs, timestamps):** mono 13px, tabular-nums for times/counts.
- **Status/severity in tables:** shared chip grammar, chip text ≥ 12px.
- **Row actions:** hover-reveal icon or kebab menu (Traffic Logs currently has none; add
  "Expand" affordance). Never a column of visible buttons.
- **Empty rows:** full-width calm message + optional action (see §17).
- **Row ceilings:** keep current caps (Traffic Logs shows first 50 of the 500 buffer;
  Telemetry fetches 100; alerts 50) — they are performance-validated. Add "showing first
  N of M — refine with filters" hint instead of silently truncating.
- **Traffic Logs specifics:** the whole `<tbody>` is currently `font-mono` — mono should be
  *per-cell* for technical values only; category/status cells are UI font. The red row tint
  (`bg-neon-red/5`) for attack rows is acceptable only as a *very* subtle left-edge marker,
  not a full-row wash.
- **LiveEventsView "Inspect" modal and other log detail drawers** use the dialog grammar
  (§16): JSON/raw blocks are `canvas-deep` mono wells with a copy affordance.

---

## 16. Dialog / modal design

Shared `Dialog` grammar (currently 3 bespoke overlays: Download, Event Inspector, Attack
Simulator — plus the console's full-tab "details" panels which should feel consistent):

- Overlay: `scrim` black 50–70% (no heavy blur); optional 8px blur only over dense content.
- Panel: `surface-2`, hairline-strong border, `lg` radius, max-width ~640px, 24px padding.
- Header: title `subtitle` + close button (neutral, top-right). Footer: actions right-
  aligned; **one primary accent button max**; secondary buttons to its left.
- Escape closes; focus traps; first actionable control receives focus; `role="dialog"`.
- Key/value grids inside dialogs use `caption` labels + mono values on `canvas-deep` wells.
- Distinguish modal type visually by a small "type" eyebrow (e.g., "Download desktop app",
  "Event inspection", "Attack simulator · test data") instead of colored headers.

---

## 17. Empty / loading / error states

- **Empty states** (currently: dashed pulsing circle on Live Monitor; plain italic lines in
  list views): calm illustration-free block — icon (muted, 28px) optional, `body-lg` title
  sentence-case, 14px explanation of what the surface shows, and **one next-step action**
  ("Start capture", "Run the endpoint agent", "Clear filters"). Never animate.
- **Loading:** skeletons (muted `surface-2` blocks, no shimmer/gradient) or, for list/data
  fetches, preserve layout with a subtle top progress line; the current full-screen spinning
  border loader and `animate-spin` refresh icons are acceptable only as micro-affordances on
  the button that triggered them.
- **Error states:** one shared `ErrorBanner` — plain-language title ("Capture is
  unavailable"), one-sentence cause in 14px text, and a retry/action button; optional
  expandable `details` for the technical error string (currently `captureError` renders
  uppercase mono bold text in a red card). Red *text/fill* is permitted here because it is a
  genuine error state, but shape stays neutral + red left edge, no glow.
- The **"CAPTURE UNAVAILABLE: …"** long mono string becomes this component. Also
  ReportsView gets an error state when the fetch fails (today it fails silently to blank).

---

## 18. Live-data behavior guidelines

1. **Layout never shifts with data.** Fixed row heights, tabular numerals, reserved spaces
   for time/counters; no width jumps when numbers grow digits.
2. **Reading position is stable.** New rows prepend; scroll is not reset; no auto-scroll of
   a table the user is reading (only the *live* areas like the monitor feed move).
3. **Badge churn rule:** a count that changes multiple times per second must not live in
   navigation or a header badge. Remove the `history.length` badge from Traffic Logs (it
   re-renders at ~20Hz). Keep badges to: open alerts, open attack chains, online endpoints
   (refresh cadence ~10s), and rules (static).
4. **Update cadence:** UI flushes at 50ms (20Hz) — validated, keep. Transitions for value
   changes ≤ 180ms opacity/color only.
5. **No pulsing for healthy states.** Remove `animate-pulse` from the capture-active dot,
   heartbeat dots, and the incident banner. Allow one slow pulse only for an *active
   critical* condition, and only in the alert band.
6. **Anomaly/alert arrival:** a new detection updates the hero band and prepends one feed
   row with a single fade. It does not flash the screen, spin icons, or replay animation.
7. **Stop behavior stays exactly as validated:** counters freeze at the stop instant; the
   buffer is dropped; the UI returns to standby/Start with state preserved for inspection
   (user can still scroll logs from the frozen session). The *visual* freeze is correct;
   only the chrome around it changes.
8. **`prefers-reduced-motion`:** all transitions degrade to opacity-only/none.

---

## 19. Accessibility / readability rules

- Contrast: body text ≥ WCAG AA on its surface; semantic text checked against its `*-soft`
  fill, not the canvas.
- Keyboard: every control reachable; visible focus ring (accent) everywhere — never
  `focus:outline-none` without a replacement (today most inputs/buttons have
  `focus:outline-none focus:border-cyan`; the border-only cue is weak — use ring).
- Hit targets ≥ 28–32px; controls 32px height per component tokens.
- Color never alone: severity chips always pair color + word; icon states pair with text.
- Screen-reader labels on icon-only buttons (close, refresh, expand).
- **Type minimum 13px for meaningful content**; do not reintroduce 9–11px technical text
  anywhere. Mono rows remain ≥ 12.5–13px.
- No full-uppercase sentences; no animated/glowing text.
- Honest labels: "Live", "Online", "Capturing" reflect the actual mode (they already map to
  `isRunning` / status fields — keep that mapping strict).
- Desktop keyboard affordances: advertise core shortcuts with keycap hints (see §22) —
  Start/Stop, switch view, focus search, open command palette if built later.

---

## 20. Electron-specific visual treatment

- The BrowserWindow is **natively framed** (`width 1400, min 1024×700`, standard frame, no
  `titleBarStyle`/`frame:false`). Therefore: **do not draw fake macOS traffic lights in the
  DOM** and do not build a custom drag region — the OS already provides the title bar. The
  DESIGN.md "traffic-light dots in a glass top bar" sketch does not match this window and
  should be corrected in DESIGN.md (weakness W4).
- The DOM's first visible element is the **app top bar**; it should carry a consistent
  background (`surface-1` + hairline) that visually continues under the native title bar.
  The window `backgroundColor` and `<body>` background must match `canvas` to avoid a
  white/flash mismatch on launch (currently both are old `#0a0e1a` — migrate to `canvas`
  together).
- **Single boot target (required, one-line routing change — explicitly deferred to the
  implementation phase):** today a packaged app lands on the marketing home page and the
  console requires clicking "Open Live Console", which stacks a *second* website-return bar
  above the console in Electron. In the desktop product, boot directly to the console route
  (`/app`) so the app opens on Live Monitor; gate `showWebsiteNavReturn` off when
  `window.aegisApi` is present. The web preview (browser) keeps its website→console
  relationship unchanged. Nothing else in `electron/main.ts` changes.
- The environment chip in the app bar replaces the current shouting
  "OPERATIONAL ENVIRONMENT: ELECTRON NATIVE (LOCAL IDS)" banner: a small neutral chip
  ("Native capture" vs "Web preview") in the header.
- Scrollbars, selection color, and focus rings styled to the dark palette for a native feel
  (`::selection` neutral-accent, not cyan).
- Keep window title meaningful; per-view document titles are a bonus, not required.

---

## 21. Public website relationship

- **Two surfaces, one brand DNA:** the website keeps its marketing energy; the console keeps
  operational clarity. Do not port the website's neon tokens, mono-everything headers,
  uppercase type, or glowing CTAs into the console, and do not port the console's severity
  colors onto the website chrome.
- Website's "Open Live Console" targets the console route as today; in a browser it shows a
  slim "Web preview — full packet capture requires the desktop app" notice instead of
  pretending to capture (the existing download-first gating on Start is correct; restyle its
  modal with the dialog grammar).
- **Shared brand DNA** is limited to: the Aegis mark, the Inter typeface, the dark
  near-black base, and the general "restrained security" tone. The two surfaces may share
  the mark but will not share component CSS.
- Remove the *console's* "Back to Public Product Website" / "Docs & Setup Guide" /
  "Get Desktop Runner" links from the Electron frame (external browser links belong in the
  sidebar's system footer as quiet text links at most).

---

## 22. Component / primitives plan

Consolidate the current one-off markup into a primitives layer (in the existing
`src/components` structure; new shared files — no libraries beyond what's installed —
all Tailwind + tokens):

**Foundation**
1. `tokens.css`-replacement work: rebuild `index.css` + `tailwind.config.js` onto DESIGN.md
   tokens (colors incl. `semantic-medium`; type scale; spacing; radii). No new dependency.
2. `cn()` helper already exists in `MetricCard` — promote to a shared util.

**Primitives (new/refactored shared components)**
- `Button` (primary/secondary/tertiary/danger-outline; 32px; focus ring)
- `Card` (surface-1 + hairline + md radius; optional hover step; `CardHeader`)
- `MetricCard` (refactor existing: label/value/context/sparkline anatomy)
- `SeverityChip`, `StatusDot`, `CategoryChip` (packet categories), `PillFilter` (segmented)
- `Input`, `Select`, `SearchField` (one grammar; label > 13px)
- `Table` primitives: `DataTable`, `TechnicalValue` (mono), `RowActions`
- `SecurityAlertCard` (plain-language alert w/ evidence details — replaces `AlertBox` usage)
- `InlineConfidence` (replaces `ConfidenceGauge`)
- `ExpandableDetails` (evidence / raw payload / analyst narrative)
- `Dialog` (shared modal chrome) — used by Download, Event Inspector, Simulator
- `EmptyState`, `LoadingSkeleton`, `ErrorBanner`
- `Keycap` (shortcut hints)
- `SidebarNav` (grouped nav + badges + collapse)
- `SectionHeader` (title + description + actions) — used by every view
- `MiniBars`/`Sparkline` (tiny neutral trend visuals; no recharts dependency needed)

**Chart refactor** happens inside the four chart components (`TrafficChart`,
`AnomalyChart`, `FeatureImportanceChart`, Analytics charts) with token colors only.

**View refactors** consume the primitives; per-view bespoke class strings (dozens of
`bg-[#111827] border-[#1e3a5f] …` blocks) are deleted in favor of primitives.

---

## 23. Implementation order

Suggested sequence (each step shippable/verifiable; backend untouched throughout):

1. **Token foundation:** rewrite `tailwind.config.js` + `index.css` onto DESIGN.md tokens;
   delete `.ids-card`, `.glow-*`, `.alert-*`, `neon-*` classes. Visual: everything shifts to
   neutral dark surfaces + hairlines (a big calm-down in one step).
2. **Typography pass:** load Inter (next/font), enforce scale/weights, remove `font-black`
   and content below 13px, replace uppercase labels, tabular numerals. Keep all DOM ids.
3. **Shell:** sidebar + app bar replace header/tab-strip/footer; grouped nav; migrate view
   mounting to sidebar state (same `activeTab` keys so behavior/state logic is untouched).
4. **Live Monitor restructure** (highest value): status bar, attention band, contextual
   metrics, restyled charts, recent-events feed, removal of gauge + five-card row.
5. **Alert + metric + chip primitives**; migrate AlertBox, SocOverview KPIs, severity chips,
   buttons, badges across all views (bulk consistency pass).
6. **Tables/logs** across Traffic Logs, Telemetry, Analytics summary, Alerts list.
7. **Dialogs + states:** shared Dialog/Empty/Loading/Error components across the four
   overlay usages and all empty/loading/error branches.
8. **Detection Engine + Explain Alert** consolidation pass (internal segments) and chart
   restyles.
9. **Electron shell pass** (deferred, §20): boot target to `/app`, `showWebsiteNavReturn`
   gating, environment chip, canvas background alignment. (The only Electron-touching item;
   everything before it is renderer-only.)
10. **QA:** full console walkthrough in web preview and packaged app; verify Start/Stop
    visual behavior identical to validated baseline; confirm frozen test suites and UI-check
    ids still pass; check narrow widths ≥1024.

---

## 24. Explicit "must NOT change" list (frozen baseline)

UI redesign consumes existing data differently but must **never** modify:

1. Capture service / start-stop state machine (`capture-service.ts`) and its validated
   Stop behavior (buffers dropped, counters freeze, UI→standby).
2. Detection engine rules, thresholds, category logic, anomaly scoring, DoS state machine,
   Probe rules (`detection-engine.ts`).
3. Packet decoder and flow tracker field semantics (`packet-decoder.ts`, `flow-tracker.ts`).
4. Electron IPC surface: channel names, preload `aegisApi` contract, batching cadence
   (50ms IPC / 1s SIEM flush, 100/500 caps), main-process SIEM proxy routing, security
   boundaries (`electron/main.ts`, `preload.ts`). The only permitted Electron change is the
   explicitly-scoped boot target (§20 item, implementation step 9).
5. SIEM backend: Python CLI, DB schema/queries, alert/incident/rule/device/report logic,
   simulation ingestion.
6. Data contracts in `src/types.ts` (Packet fields, SOCMetrics, SecurityAlert, etc.) — views
   may *derive* presentation values (rates, trends, breakdowns, summaries) from existing
   fields, never add/alter backend-fed fields.
7. Tests (TypeScript detection tests, Python SIEM tests, and the manual Electron UI-check
   scripts that query DOM ids — ids must be preserved).
8. React state/performance architecture in `AegisDesktopApp`: packet batching to React at
   20Hz, the 500-packet history cap, the 60-sample anomaly array, SIEM 10s polling, ref
   mirrors for the running gate. Presentation refactors must keep the same state keys.
9. The Next.js static-export + local-HTTP-server architecture.

---

## 25. Explicit inventory: remove / replace / consolidate / retain

### REMOVE
- **Visual vocabulary:** all `.glow-*`, `.ids-card` gradients+shadows, `neon-gradient-text`,
  `.alert-critical/high/normal` tinted-card classes, `neon-*` tokens, per-screen raw hex
  chrome (`bg-[#111827]`, `border-[#1e3a5f]`, `text-[#00d4ff]`, etc.) in favor of tokens.
- **ConfidenceGauge** component + its SVG glow (both usages).
- **Live Monitor five-card metric row** (as-is) — replaced by ≤3 contextual metrics + status
  bar data.
- **Marketing footer** in the console; **website-return bar** inside Electron (see §20);
  duplicate second bar when console is embedded in the site preview.
- **12-item top tab strip** — replaced by grouped sidebar (§9).
- **`animate-pulse` on healthy indicators** (capture dot, heartbeat, incident banner).
- `font-black`/900 and 9–11px content; all-caps-everything treatment; decorative icon color
  chips on chrome.
- Traffic Logs **live packet-count nav badge** (churn) and pink `#ff3366` incidents badge.
- **Decorative chart gradients/glows** (AnomalyChart fill, FeatureImportance gradient,
  chart gridline colors) and multi-rainbow palette (TrafficChart, donut).

### REPLACE
- Start/Stop buttons: green `glow-green` → **accent** Start (primary); Stop → secondary
  with critical-soft outline (red fill reserved for destructive confirm, per DESIGN.md).
  Keep semantics readable: while capturing, the Stop control may carry a small red square
  icon; it is an action, not a severity display.
- "Latest System Alert" column → **attention hero band** (§11/§12) with evidence expansion.
- Anomaly score timeline → threshold-banded neutral line (§14).
- AlertBox → `SecurityAlertCard` (plain-language first).
- `MetricCard` → contextual anatomy with trend/context (§13).
- SOC Overview severity tiles → shared chips (neutral surfaces; text + one dot).
- Environment banner text → neutral chip in the app bar.
- Download/Inspect/Simulator overlays → shared `Dialog`.
- ModelPerformance/ExplainAlert "cards with colored left borders/green fills" → neutral
  surfaces + semantic chips.
- Logs/Telemetry tables → unified table grammar with per-cell mono.
- Status-action buttons on alerts/incidents → shared button variants.

### CONSOLIDATE
- **Detection Engine tab + Explain Alert tab** into one "Detection Engine" nav item with two
  internal segments (*Overview / Explain a detection*) — both are explainability surfaces
  fed by the same static architecture data; keeps 12 top items from becoming 12 sidebar
  items. (Optional but recommended; pure IA, no behavior change.)
- **All chip/badge styles** → `SeverityChip`/`CategoryChip`/`StatusDot`.
- **All "status: ONLINE/OPEN/RESOLVED…" chips** (Devices, Alerts, Events) → one chip grammar.
- **All "why/evidence/conditions/MITRE/recommendation" blocks** in SIEM detail views →
  shared key-value + callout primitives.
- **Traffic distribution + anomaly chart** remain on Live Monitor but drop to consistent
  height/grammar; Analytics keeps donut+bar+summary as its "report" surface (no duplicate
  chart added to Live Monitor).

### RETAIN (with restyle only)
- Every view's underlying function and data model (all 12 surfaces keep their jobs).
- Start/Stop flow and its validated freeze semantics; interface + pps selectors.
- The 500-packet buffer, 50-row log display cap, 60-sample anomaly window, 10s SIEM poll.
- Plain-language narrative fields already in the data (`attack_name`, `narrative`,
  `mitigation`, alert `description`/`recommendation`) — these power the new alert design.
- Empty/loading/error *behavior* of each screen (restyled).
- Export CSV, search, filters, refresh affordances (restyled, ids preserved).
- All DOM ids used by validation scripts.
- Inter as the UI face (once actually loaded), mono for technical values, single-accent +
  semantic-severity color discipline (as tokens).

---

## 26. Weaknesses in the current DESIGN.md (and corrections this blueprint makes)

| # | Weakness in DESIGN.md v1.0 | Correction in this blueprint |
|---|---|---|
| W1 | **No concrete severity-tier mapping.** It defines colors but not how `CRITICAL/HIGH/MEDIUM/LOW` (the actual data) map to them, which is why code uses green for LOW and cyan for MEDIUM. | §3.3: explicit 4-tier + healthy + info mapping; add one new `semantic-medium` amber token. |
| W2 | **Claims "Inter (already in use — keep it)"** — but Inter is never loaded anywhere (only a `font-family` fallback string in `index.css`; Windows renders Segoe UI). | §4: actually load Inter via `next/font` (self-hosted, offline-safe for the static export). |
| W3 | **Frame sketch is unrealizable as drawn.** It prescribes a glass top bar with macOS traffic-light dots, but the Electron window is natively framed; fake dots would duplicate the OS title bar and belong only to a frameless design. | §20: native frame respected; glass limited to the app bar if it floats; sidebar + app bar shell per §10. |
| W4 | **No live-data stability rules** (reading position, badge churn, freeze semantics, cadence) beyond generic motion guidance — yet this is a real-time tool and these rules matter most. | §18 (new section). |
| W5 | **No per-screen map.** The doc describes a system, not what happens to the twelve existing screens/metric cards/gauge/tab strip; teams can (and did) keep legacy chrome indefinitely. | §11–§17 and §25 provide the screen-level inventory. |
| W6 | **Metric guidance is thin** ("label + large value + trend dot"), permitting raw-count cards with no context or baseline. | §13 anatomy: question + context line + trend; Live Monitor metric set specified. |
| W7 | **Missing categorical color guidance** for packet *categories* (DoS/Probe/R2L/U2R/NORMAL) — code invented pink/yellow/cyan per category. | §8c: categories map onto the severity ladder; chrome stays neutral. |
| W8 | **No Electron/website split of chrome.** The doc never says the console must not carry the website's return-bar/footer/CTAs, so those persist inside the desktop app. | §10/§20/§21: single-frame shell, footer removed, surface separation rules. |
| W9 | **No explicit "one boot target" decision** for the packaged app (website vs console first). | §20: boot to `/app`; keep web preview unchanged. |
| W10 | **Geist/Vercel reference absent** from the synthesis (only Apple/Raycast/Linear were folded in). | §2 adds the fourth reference and its concrete adoptions (weight cap 600, tabular numerals, indicator-scale status color, double-ring focus, ghost-first buttons). |

**Direction of conflicts:** where this blueprint changes a DESIGN.md stance, it is because
(1) the doc was ambiguous and the codebase resolved the ambiguity wrongly (severity tiers,
medium color), (2) the doc described chrome the actual window cannot use (traffic lights),
or (3) the doc was silent on live-data/desktop-integration behavior that materially affects
the result. The blueprint is a superset amendment — DESIGN.md should be updated (during the
implementation phase, as part of step 1) to absorb §3.3, §4 (font loading), §8c, §18, and
the corrected §20 frame note.

---

## 27. Close-out

This blueprint is the review deliverable. **No code, CSS, Tailwind, tests, backend, or
Electron behavior has been changed.** The next phase (implementation) should begin with
§23 step 1 (token foundation) and step 3 (shell), because those two steps convert the
entire console to the final grammar in the fewest, safest moves; Live Monitor work (step 4)
follows immediately after.

Remaining open product question worth one decision before implementation: whether the
packaged desktop app should boot straight to the console (`/app`) — this blueprint
recommends yes (§20), but it is the only item that touches Electron routing, so it is
called out for explicit approval rather than assumed.
