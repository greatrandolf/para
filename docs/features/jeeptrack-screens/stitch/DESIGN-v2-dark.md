---
name: JeepTrack Transit System
colors:
  surface: '#0f131c'
  surface-dim: '#0f131c'
  surface-bright: '#353943'
  surface-container-lowest: '#0a0e17'
  surface-container-low: '#181b25'
  surface-container: '#1c1f29'
  surface-container-high: '#262a34'
  surface-container-highest: '#31353f'
  on-surface: '#dfe2ef'
  on-surface-variant: '#e5beb2'
  inverse-surface: '#dfe2ef'
  inverse-on-surface: '#2c303a'
  outline: '#ac897e'
  outline-variant: '#5c4037'
  surface-tint: '#ffb59c'
  primary: '#ffb59c'
  on-primary: '#5c1900'
  primary-container: '#ff5708'
  on-primary-container: '#511500'
  inverse-primary: '#aa3600'
  secondary: '#bdf4ff'
  on-secondary: '#00363d'
  secondary-container: '#00e3fd'
  on-secondary-container: '#00616d'
  tertiary: '#ffba38'
  on-tertiary: '#432c00'
  tertiary-container: '#c08600'
  on-tertiary-container: '#3a2600'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdbcf'
  primary-fixed-dim: '#ffb59c'
  on-primary-fixed: '#390c00'
  on-primary-fixed-variant: '#822700'
  secondary-fixed: '#9cf0ff'
  secondary-fixed-dim: '#00daf3'
  on-secondary-fixed: '#001f24'
  on-secondary-fixed-variant: '#004f58'
  tertiary-fixed: '#ffdeac'
  tertiary-fixed-dim: '#ffba38'
  on-tertiary-fixed: '#281900'
  on-tertiary-fixed-variant: '#604100'
  background: '#0f131c'
  on-background: '#dfe2ef'
  surface-variant: '#31353f'
typography:
  display-hero:
    fontFamily: Space Grotesk
    fontSize: 56px
    fontWeight: '700'
    lineHeight: 64px
    letterSpacing: -0.03em
  display-hero-mobile:
    fontFamily: Space Grotesk
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-telemetry:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.04em
  label-eta:
    fontFamily: JetBrains Mono
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 24px
    letterSpacing: -0.01em
  label-badge:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.08em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-mobile: 0.75rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-mobile: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 2.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system is engineered for dynamic public mobility, rapid passenger wayfinding, and live transit telematics. It serves commuters, route operators, and dispatchers navigating dense urban transport networks under variable lighting conditions—from glare-heavy midday tropical sunlight to high-speed nighttime commutes.

The aesthetic fuses **High-Contrast Utilitarianism** with **Modern Telematics Dynamism**. It avoids unnecessary ornamentation, decorative gradients, or blurred surfaces that degrade under direct outdoor sunlight. Instead, the design relies on razor-sharp contrast, punchy chromatic hierarchy, disciplined geometric typography, and rugged modular cards to deliver instant situational awareness.

## Colors

The palette operates under a high-contrast dark canvas to maximize battery life on mobile OLED devices, reduce glare during night shifts, and provide an uncompromising visual backdrop for luminous vector transit lines.

- **Primary (`#FF5500` - Electric Neon Orange):** Used exclusively for priority visual cues: live vehicle markers, departure countdowns under 3 minutes, primary action targets, urgent route deviations, and selected transit lines.
- **Secondary (`#00E5FF` - Electric Transit Cyan):** Operates as the informational counterpart to primary orange. Used for active inbound routes, scheduled stops, GPS accuracy rings, live telemetry indicators, and verified system badges.
- **Tertiary (`#FFB300` - Transit Caution Amber):** Reserved for service advisories, moderate congestion, intermediate delays, and fare status notifications.
- **Neutral (`#0A0E17` - Deep Midnight Obsidian):** The foundational substrate. Paired with elevated container tiers (`#131B2B`, `#1A2438`) and crisp foreground text (`#F8FAFC` at 100%, `#94A3B8` at 65%) to ensure sunlight legibility and WCAG AAA compliance for critical trip information.

## Typography

Typography is split into three dedicated roles:

1. **Display & Headings (Space Grotesk):** Provides strong, technical, geometric personality suitable for terminal displays, route names, and primary wayfinding headers.
2. **Body & Interface (Hanken Grotesk):** Provides high x-height legibility and neutral rendering for complex route descriptions, commuter notices, and passenger settings.
3. **Telemetry & Timetables (JetBrains Mono):** Monospaced precision is mandatory for real-time ETAs, vehicle plate codes, fare calculations, and dynamic coordinate streams. This prevents visual jitter as numeric values decrement in real time.

## Layout & Spacing

The layout employs a responsive fluid grid optimized for dual-mode operational environments: dense handheld passenger navigation and expansive dispatcher workstation dashboards.

- **Mobile (< 768px):** 4-column layout with 16px outer safe margins and 12px gutters. Primary actions and live ETA cards dock to the bottom 40% viewport safe area to accommodate one-handed operation while holding handrails or carrying bags.
- **Tablet / In-Vehicle Terminals (768px - 1024px):** 8-column split view. Left column (35%) hosts fixed real-time stop sequences; right column (65%) hosts interactive live-tracking maps.
- **Desktop / Control Hub (> 1024px):** 12-column layout with 40px outer margins and 24px gutters. Modular telematics panels flank the central tracking canvas.

Spacing rhythm follows a strict 4px/8px modular cadence. Touch targets for outdoor and mobile use enforce a minimum bounding box of 48px height and 48px width, with `space-md` separation between consecutive interactive controls to prevent accidental inputs during vehicle transit vibrations.

## Elevation & Depth

Visual hierarchy is maintained without heavy diffusive drop-shadows, which wash out in bright daylight. The system instead utilizes **Structured Tonal Layers**, **High-Contrast Borders**, and targeted **High-Luminance Edge Glows**.

- **Canvas (Ground Level):** `#0A0E17` base layer for spatial maps, street vectors, and application backgrounds.
- **Surface Tier 1 (Stationary Modules):** `#131B2B` with a 1px solid border of `#1E293B`. Used for route cards, static stop lists, and secondary panels.
- **Surface Tier 2 (Dynamic Overlays & Sheets):** `#1A2438` with a 1px border of `#334155`. Used for bottom drawers, modal inspection sheets, and active stop trackers.
- **Active / Hero Telematics Elevation:** Elevated vehicle beacons and active selected route paths utilize a concentrated luminous outer glow: `0px 0px 16px rgba(255, 85, 0, 0.45)` for primary orange and `0px 0px 16px rgba(0, 229, 255, 0.40)` for secondary transit cyan.

## Shapes

The interface embraces a **Soft Angular / Technical Industrial** geometry (`roundedness: 1`). Radii are kept crisp and disciplined to reinforce telematics hardware aesthetics:

- **Buttons, Field Inputs, Chips:** `4px` (`0.25rem`) corner radius.
- **Containers, Route Cards, Modal Drawers:** `8px` (`0.5rem`) corner radius.
- **Live Vehicle Markers & Status Indicator Rings:** Strict circles (`9999px`) to visually differentiate dynamic kinetic objects on maps from structured UI containers.

## Components

### Buttons
- **Primary Action (Board, Book, Track Live):** Background in Solid `#FF5500`, label in High-Contrast `#0A0E17` bold typography. Hover/Focus activates an intense `#FF7733` fill. Active tap scales down to `0.98`.
- **Secondary Action (View Timetable, Alternate Route):** Dark container `#131B2B` with a 1.5px border of `#00E5FF` and cyan text `#00E5FF`.
- **Ghost Action:** Transparent background with `#94A3B8` text, transitioning to `#F8FAFC` on hover.

### Chips & Route Badges
- **Route Identifier Badges:** Compact rectangular badges with `4px` radius. Monospaced bold typography. Route code in white over a dark surface framed by the designated route color border (Orange for express trunk lines, Cyan for feeder lines).
- **Status Filter Chips:** Container `#131B2B` with 1px border `#334155`. When toggled, the active chip gains a solid `#00E5FF` background with dark `#0A0E17` text.

### Vehicle Telematics Cards
- Built using Surface Tier 1 (`#131B2B`) with an assertive 1px border.
- The card header features the real-time vehicle identifier (`JetBrains Mono`), current capacity meter (4-segment progress bar), and large live ETA countdown in Neon Orange.
- The card footer provides direct actionable controls: "Pin Vehicle" and "Set Alert".

### Live Transit Timeline / Lists
- Stop lists are connected by a vertical 2px continuous line.
- Completed stops are muted `#475569`; upcoming stops are vibrant `#00E5FF`; current vehicle location is flagged with an animated pulsing `#FF5500` node.
- Each row displays arrival delta (e.g., `-2 MIN`) right-aligned in `label-eta` typography.

### Input Fields & Search Bars
- Background `#131B2B` with a 1px border `#334155`.
- Text is `#F8FAFC` with placeholder text in `#64748B`.
- On focus, the field border transitions to `#00E5FF` with a subtle `0px 0px 8px rgba(0, 229, 255, 0.25)` perimeter glow.
- Includes quick-clear tactile buttons and dedicated geolocation shortcuts.

### Specialized Component: Live Capacity Indicator
- A segmented 4-block horizontal gauge indicating passenger density:
  - 1-2 blocks filled (Cyan): Seats Available.
  - 3 blocks filled (Amber): Standing Room Only.
  - 4 blocks filled (Orange): Full / Express Pass Only.