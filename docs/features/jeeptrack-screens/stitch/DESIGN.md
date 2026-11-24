---
name: Electric Transit Engine
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#5b4137'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#8f7065'
  outline-variant: '#e4bfb1'
  surface-tint: '#a63b00'
  primary: '#a63b00'
  on-primary: '#ffffff'
  primary-container: '#ff5e00'
  on-primary-container: '#531900'
  inverse-primary: '#ffb599'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#006c4b'
  on-tertiary: '#ffffff'
  tertiary-container: '#00a876'
  on-tertiary-container: '#003422'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbce'
  primary-fixed-dim: '#ffb599'
  on-primary-fixed: '#370e00'
  on-primary-fixed-variant: '#7f2b00'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#71fbc0'
  tertiary-fixed-dim: '#50dea5'
  on-tertiary-fixed: '#002114'
  on-tertiary-fixed-variant: '#005137'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
  neon-orange-bright: '#ff6b00'
  neon-orange-deep: '#ea5200'
  neon-orange-subtle: '#fff1e8'
  neon-orange-glow: rgba(255, 94, 0, 0.28)
  amber-fare: '#f59e0b'
  emerald-active: '#00b37e'
  crimson-alert: '#e11d48'
  surface-bg: '#f8fafc'
  surface-card: '#ffffff'
  surface-border: '#e2e8f0'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.02em
  display-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.04em
  metric-display:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '800'
    lineHeight: 32px
    letterSpacing: -0.03em
  metric-tabular:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 24px
    letterSpacing: -0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-sm: 0.75rem
  margin: 1rem
  margin-lg: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system delivers a real-time transit telemetry, boarding, and commuter micro-rewards ecosystem built for high-density metropolitan transit corridors, modernized jeepneys, and urban express bus networks. The visual identity bridges iconic street-level transit energy—celebrating rapid-fire commuter movement, high-frequency boarding, and iconic route liveries—with the razor-sharp precision of high-visibility aerospace and digital dispatch systems.

The core product narrative revolves around three operational verbs: **TRACK** (real-time vehicle vectoring, telemetry pings, and satellite-calibrated stop arrivals), **NAVIGATE** (glanceable terminal density, dynamic fare calculation, and route congestion metrics), and **EARN** (instant commuter loyalty credits, digital micropayments, and route-check rewards).

The aesthetic approach is **Electric High-Contrast Transit UI**. Commuters interact with the interface under intense tropical glare, chaotic multi-lane interchanges, and jostling rides. To ensure instantaneous legibility from arm’s length, the UI avoids muted low-contrast styling in favor of luminous high-voltage neon orange accents, crisp light-slate architectural surfaces, high-legibility geometric display typography, and tactile floating interface cards engineered for immediate thumb-reach execution.

## Colors

The updated palette swaps dark transit red for an energetic, ultra-luminous **Neon Orange (`#ff5e00`)**, producing unmistakable visual pop against crisp light surfaces and desaturated street map cartography.

- **Primary (`#ff5e00` / Electric Neon Orange):** The defining core brand signature. Used for primary call-to-actions, active telemetry paths, live vehicle map markers, arrival countdown emphasis, and high-priority interactive triggers.
- **Secondary (`#0f172a` / Deep Transit Slate):** Anchors visual stability and legibility. Provides deep structural contrast for text hierarchies, route headers, dark chip surfaces, and navigation containers under intense ambient outdoor daylight.
- **Tertiary (`#00b37e` / Emerald Telemetry):** Denotes active on-time status, moving GPS vehicle indicators, verified biometric/tap boardings, and instant reward earnings.
- **Neutral (`#64748b` / Slate Grey):** Manages secondary metadata, inactive stop nodes, subtle borders, and unselected UI states.

### Semantic & Luminous Color Logic
- **Neon Orange Glow (`rgba(255, 94, 0, 0.28)`):** Applied as an ambient radial aura around live moving vehicle pins and urgent boarding countdown badges.
- **Surface Foundations:** Grounded on a clean light slate foundation (`#f8fafc`) with elevated pure white card layers (`#ffffff`) and crisp architectural boundary lines (`#e2e8f0`).
- **Telemetry Indicators:** Moving vehicles trigger Emerald (`#00b37e`), congested terminals highlight Amber (`#f59e0b`), while re-routing and dispatch interruptions trigger Crimson (`#e11d48`).

## Typography

The typography pairings unify **Plus Jakarta Sans** for high-energy geometric transit titling with **Inter** for dense, clean, readable UI telemetry.

- **Tabular Alignment:** All numerical outputs—such as real-time estimated arrivals (`2 min`), fares (`₱15.00`), crowd capacities (`18/22`), and GPS distances—must strictly enable `tabular-nums` (`font-variant-numeric: tabular-nums`) to prevent horizontal jitter during second-by-second data updates.
- **Route & Terminal Identifiers:** Set in uppercase, tight-tracked **Plus Jakarta Sans** (e.g., `FAIRVIEW - AYALA via EDSA`) to guarantee fast recognition even through glancing peripheral vision.
- **Sub-Labels & Badges:** Use condensed uppercase treatments of **Inter** (`label-sm`) with `0.04em` letter-spacing for vehicle types and dispatch states (`EXPRESS`, `MODERN PUV`, `LIVE FEED`).

## Layout & Spacing

The layout is built mobile-first, prioritizing thumb-zone interaction within a dense transit tracking environment.

- **Layout Grid:** A responsive 4-column layout on mobile devices (`< 768px`) with `1rem` outer canvas padding and `1rem` column gutters. For tablet operator tablets or multi-route monitoring dashboards (`>= 768px`), the grid adapts to an 8-column layout with `1.5rem` margins.
- **Rhythm & Padding:** All interior component padding and layout gaps strictly adhere to an 8px base grid. Compact badge tags use `space-xs` (4px), component icon gaps use `space-sm` (8px), card bodies enforce `space-md` (16px), and floating sheet offsets use `space-lg` (24px) to `space-xl` (32px).
- **Floating Map Overlays:** Bottom sheets, search inputs, and quick-filter pills float above the cartography canvas with a dynamic `env(safe-area-inset-bottom)` margin offset, maintaining at least 16px clearance from the lower edges of the screen.

## Elevation & Depth

Visual depth establishes a distinct multi-layer hierarchy where interactive transit elements float gracefully above neutral cartography and dense spatial data layers.

- **Level 0 (Map & Canvas Ground):** Base cartography layer rendered with low-contrast monochrome landmasses and muted streets (`#f1f5f9`), ensuring bright route vectors remain luminous and uncluttered.
- **Level 1 (Docked Containers & Nested Cards):** Crisp pure white surfaces (`#ffffff`) bounded by clean structural borders (`1px solid #e2e8f0`) with subtle ambient baseline shadows (`0 2px 8px -2px rgba(15, 23, 42, 0.05)`).
- **Level 2 (Floating Action Buttons & Route Summary Chips):** Recenter location triggers, filter tags, and quick-route pills floating over the map utilize sharp ambient elevation (`0 10px 20px -5px rgba(15, 23, 42, 0.10), 0 4px 6px -2px rgba(15, 23, 42, 0.04)`).
- **Level 3 (Arrival Drawers & Modal Sheets):** High-priority sliding manifests, vehicle capacities, and route profiles utilize deep diffuse vertical shadows (`0 -16px 36px -8px rgba(15, 23, 42, 0.16)`) coupled with a sharp top highlight border (`1px solid rgba(255, 255, 255, 0.9)`).
- **Level 4 (Luminous Neon Pulse Pins):** Real-time GPS vehicle beacons feature energetic animated concentric rings using neon orange falloff (`0 0 0 8px rgba(255, 94, 0, 0.22), 0 0 16px rgba(255, 94, 0, 0.45)`).

## Shapes

The design system employs a **Rounded (Level 2)** shape model to combine tactical efficiency with a contemporary digital feel.

- **Base Components:** Standard search text fields, route information cards, fare breakdown containers, and terminal cells use `0.5rem` (8px) corner radii.
- **Major Panels & Sheets:** Map sheets, slide-up arrival sheets, and confirmation dialogs employ `1rem` (16px) radii on upper edges.
- **Badges, Chips & Action Buttons:** Full pill geometry (`9999px`) is applied to route identifiers, ETA tags, filter chips, and primary floating action buttons to distinguish interactive tap zones from structural card panels.

## Components

### Buttons & Action Bars
- **Primary CTA:** Luminous electric neon orange fill (`#ff5e00`), crisp white bold label (`#ffffff`), `0.75rem` vertical padding, with a subtle tactile active press state (`transform: scale(0.98)`). Glow accents (`box-shadow: 0 4px 14px rgba(255, 94, 0, 0.35)`) emphasize the main action.
- **Secondary Action:** Deep slate background (`#0f172a`), white text (`#ffffff`), pill radius. Used for terminal switching or secondary trip details.
- **Subtle / Micropayment Action:** Neon orange tint container (`#fff1e8`) with rich neon orange text (`#ea5200`) and optional coin or QR icon.
- **Floating Controls:** Circular white surfaces (`44px × 44px`) housing crisp dark slate icons (`#0f172a`) with subtle 1px border (`#e2e8f0`) for GPS recalibration, SOS, and layer controls.

### Chips & Route Badges
- **Mode Indicators:** Full-pill tags.
  - *Modern Jeepney:* Luminous neon orange outline and surface (`#fff1e8` fill, `#ea5200` text, bold `JEEP`).
  - *Bus / Express:* Deep slate pill (`#0f172a` fill, `#ffffff` text, bold `BUS`).
- **Telemetry Status Badges:** Compact pills with an inset 6px indicator:
  - *Active Moving:* Emerald tint (`#ecfdf5` fill, `#00b37e` text, `#00b37e` pulse dot).
  - *Heavy Traffic:* Amber tint (`#fffbeb` fill, `#b45309` text, `#f59e0b` solid dot).
  - *Standby / Departs Soon:* Slate tint (`#f1f5f9` fill, `#64748b` text, `#94a3b8` solid dot).

### Transit Cards & Bottom Drawers
- **Arrival Telemetry Card:** Pure white container (`#ffffff`), `1rem` border radius, `1px solid #e2e8f0` edge. Left side displays the dynamic arrival countdown in electric neon orange (`#ff5e00` in `display-sm`), center shows destination terminal name and route number, right side indicates fare (`₱14.00` in `metric-tabular`).
- **Bottom Slide Manifest:** Smooth-sliding drawer with a top drag handle (`36px × 4px`, `#cbd5e1`). Contains vertical route stop progressions, live passenger density gauges, and instant ride booking CTAs.

### Form Inputs & Terminal Search
- **Route Search Field:** Pill-shaped pure white container with a 1px border (`#e2e8f0`), search prefix icon, and voice/clear action buttons. Active focus state triggers an electric neon orange outer focus ring (`box-shadow: 0 0 0 3px rgba(255, 94, 0, 0.25)`).

### Selection Controls (Checkboxes & Radios)
- **Checkboxes & Radios:** Default state features a 1.5px slate border (`#cbd5e1`) on white ground. Active selected state fills with `#ff5e00` and displays a crisp white check or center pip, accompanied by a soft orange outer ring on focus.

### Map Telemetry Pins
- **Vehicle Vector Pin:** Sharp directional arrow set inside an electric neon orange circular shield (`#ff5e00`) featuring high-contrast white vehicle glyphs and continuous radial pulse animations representing real-time satellite updates.