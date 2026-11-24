---
name: JeepTrack Live Design System
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#5c403c'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#916f6b'
  outline-variant: '#e6bdb8'
  surface-tint: '#bf0715'
  primary: '#b70011'
  on-primary: '#ffffff'
  primary-container: '#dc2626'
  on-primary-container: '#fff6f5'
  inverse-primary: '#ffb4ab'
  secondary: '#855300'
  on-secondary: '#ffffff'
  secondary-container: '#fea619'
  on-secondary-container: '#684000'
  tertiary: '#006645'
  on-tertiary: '#ffffff'
  tertiary-container: '#008259'
  on-tertiary-container: '#e1ffec'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad6'
  primary-fixed-dim: '#ffb4ab'
  on-primary-fixed: '#410002'
  on-primary-fixed-variant: '#93000b'
  secondary-fixed: '#ffddb8'
  secondary-fixed-dim: '#ffb95f'
  on-secondary-fixed: '#2a1700'
  on-secondary-fixed-variant: '#653e00'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
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

This design system powers a real-time transit tracking, boarding, and commuter micro-rewards ecosystem built specifically for Philippine daily public transit commuters, jeepney operators, and urban bus networks. The visual identity bridges iconic Filipino street transit culture—celebrating the chromatic vibrancy, fast-paced grit, and unmistakable signage of Philippine jeepneys—with the precision and reliability of modern global transit technologies.

The experience is centered around three pillars: **TRACK** (instant satellite route awareness and live vehicle telemetry), **VIEW** (glanceable stops, crowd density, and accurate fare calculations), and **EARN** (integrated commuter loyalty points, wallet top-ups, and fare cashback). 

The aesthetic marries **Modern Functional Transit UI** with **High-Contrast Tactical Clarity**. Commuters access the interface under harsh tropical midday glare, crowded terminals, and bumpy jeepney rides. Therefore, visual components avoid delicate low-contrast styling in favor of structured card containers, ultra-crisp border treatments, high-legibility typography, prominent floating action controls, and decisive color-coded transit telemetry badges.

## Colors

The palette balances energetic street-level dynamism with sunlight-proof legibility:

- **Primary (`#DC2626` / Transit Red):** The pulsating brand identity inspired by classic jeepney exterior coachwork. Used for high-priority CTAs, primary active route lines on maps, live vehicle icons, and critical transit notices.
- **Secondary (`#F59E0B` / Amber Jeepney Accent):** Represents fare transactions, cash rewards, wallet balances (₱), and intermediate vehicle statuses ("Approaching / Congested / Stopped").
- **Tertiary (`#10B981` / Active Emerald):** Communicates operational efficiency, moving transit units with verified GPS telemetry, completed rides, and positive micro-earnings.
- **Neutral Surface & Typography (`#0F172A` / Deep Slate):** Formulates the structural ground for map overlays, solid bottom navigation icons, and deep contrast body text that remains readable when exposed to strong outdoor sunlight.
- **Supportive Neutrals:** Crisp white (`#FFFFFF`) forms the elevated surface layer for cards, bottom sheets, and route pills. Soft background tint (`#F8FAFC`) grounds the viewport beneath floating map canvas controls. Warning and fault telemetry utilize `#EF4444` (GPS Lost / Route Alert) and `#64748B` (Offline / Parked Terminal).

## Typography

The typography stack pairs **Plus Jakarta Sans** for expressive, geometric headers with **Inter** for dense, clean functional copy and tabular telemetry.

- **Numerics & Tabular Data:** All transit metrics (Philippine Peso `₱` fare counters, estimated time of arrival `min`, distance meters `m/km`, and seat capacity) must enforce tabular figure alignment (`font-variant-numeric: tabular-nums`) to prevent layout shifts during live tracking updates.
- **Headings:** Set in bold and extrabold weights of Plus Jakarta Sans to instantly communicate route origin-destination terminals (e.g., "QUIAPO via ESPAÑA").
- **Labels & Microcopy:** Handled by Inter SemiBold and Bold in uppercase treatments with slight positive tracking for glanceability on vehicle type indicators (`MODERN JEEP`, `TRADITIONAL`, `CITY BUS`).

## Layout & Spacing

This design system operates primarily on a high-efficiency mobile-first 4-column layout model with dynamic vertical card nesting and fluid viewports. 

- **Grid & Margins:** Default mobile canvas adopts a `1rem` (16px) outer margin and `1rem` column gutters. For tablet dashboards or dispatch views, the grid expands to an 8-column layout with `1.5rem` margins.
- **Rhythm:** An 8pt spatial baseline determines all spacing tokens: `space-xs` (4px) for inner tag badges and pin offsets; `space-sm` (8px) for icon-label pairing and compact chip lists; `space-md` (16px) for interior card padding; `space-lg` (24px) for section separation; and `space-xl` (32px) for bottom action float clearances.
- **Safe Area Insets:** Floating panels and bottom action drawers strictly respect standard mobile viewport home indicators (`env(safe-area-inset-bottom)`) with added clearance above persistent bottom navigation tab bars.

## Elevation & Depth

Visual hierarchy employs a multi-tiered layer system that ensures critical route information floats clearly over continuous vector map textures:

- **Level 0 (Map Canvas):** Base cartography layer set to a neutral, slightly desaturated palette to allow red transit vectors and route markers to stand out.
- **Level 1 (Docked Containers & List Cells):** `#FFFFFF` surfaces with subtle border strokes (`1px solid #E2E8F0`) and soft ambient shadows (`0 2px 8px -2px rgba(15, 23, 42, 0.06)`).
- **Level 2 (Floating Action Buttons & Route Cards):** Interactive elements floating over the map (e.g., recenter pin, compass, quick filter chips) utilize elevated ambient drop shadows (`0 10px 25px -5px rgba(15, 23, 42, 0.12), 0 4px 6px -2px rgba(15, 23, 42, 0.04)`).
- **Level 3 (Modal Sheets & Bottom Arrival Drawers):** Heavy diffuse shadows (`0 -12px 32px rgba(15, 23, 42, 0.15)`) coupled with top boundary highlight strokes to isolate high-priority vehicle manifest sheets.
- **Level 4 (Live Pulse Pins & Toast Alerts):** Floating location pins utilize energetic concentric pulse rings with radial alpha falloff (`rgba(220, 38, 38, 0.25)` to `transparent`) to communicate live transit motion without cluttering map street names.

## Shapes

The design system applies a **Rounded (Level 2)** shape standard across all mobile UI surfaces.

- **Base Components:** Standard input fields, route summary cards, and list containers feature `0.5rem` (8px) corner radii.
- **Large Panels & Sheets:** Bottom action drawers, sheet modals, and primary map summary cards adopt `1rem` (16px) radii on their top corners.
- **Badges, Chips & Floating CTAs:** Full-pill profiles (`9999px`) are reserved exclusively for live status chips, vehicle type indicators, wallet balance tags, and the central action buttons to distinguish rapid tap targets from informative rectangular card panels.

## Components

### Buttons & Action Bars
- **Primary Transit Action:** Solid vibrant red (`#DC2626`) fill, white bold label, `0.75rem` vertical padding, with a subtle tactile press compression (`scale(0.98)`).
- **Secondary / Earnings Action:** Amber tint surface (`#FEF3C7`) with amber text (`#D97706`) and optional coin icon for wallet top-ups or commuter reward claims.
- **Floating Icon Controls:** White circle buttons (`44px × 44px`) housing crisp dark slate icons (`#0F172A`) for location centering, transit layers, and SOS triggers.

### Chips & Route Badges
- **Vehicle Mode Tags:** High-contrast compact pills. Jeepney uses red outline/fill badge (`#FEE2E2` background, `#DC2626` text, bold `JEEP`); Bus uses deep slate pill (`#0F172A` background, `#FFFFFF` text, `BUS`).
- **Telemetry Status Badges:** Compact pills with an inset `6px` solid status circle:
  - *Moving:* Emerald (`#ECFDF5` background, `#059669` text, `#10B981` dot).
  - *Congested/Stopped:* Amber (`#FFFBEB` background, `#D97706` text, `#F59E0B` dot).
  - *Offline:* Slate (`#F1F5F9` background, `#64748B` text, `#94A3B8` dot).

### Transit Cards & Bottom Drawers
- **Arrival Card:** White surface, `1rem` rounded corners, 1px border (`#E2E8F0`). Left side showcases large arrival countdown (`e.g., "4 min"` in `display-sm`), center contains destination terminal name and route code, right contains live fare (`₱13.00` in tabular numerals).
- **Bottom Modal Drawer:** Draggable bottom sheet with a central handle (`36px × 4px`, `#CBD5E1`), containing multi-stop progress bars with vertical stop nodes, passenger capacity gauges, and quick ride-confirmation buttons.

### Form Inputs & Search Fields
- **Terminal Search Input:** Pill or soft-corner input with crisp white interior, `#E2E8F0` border, search icon prefix, and microphone/clear suffix. Focused state triggers a `#DC2626` 2px ring.

### Navigation & Live Pulse Pins
- **Bottom Navigation Bar:** Pure white bar with 4-5 tabs (Live Map, Routes, Pay/Earn, Activity, Profile). Active tab is tinted Transit Red (`#DC2626`) with a miniature red indicator dot underneath the icon.
- **Live Vehicle Map Pin:** Directional pointer icon housed in a circular red shield with a radiating semi-transparent animated wave representing satellite GPS ping frequency.