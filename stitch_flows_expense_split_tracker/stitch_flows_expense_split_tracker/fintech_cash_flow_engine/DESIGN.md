---
name: Fintech Cash Flow Engine
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#c7c4d7'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#908fa0'
  outline-variant: '#464554'
  surface-tint: '#c0c1ff'
  primary: '#c0c1ff'
  on-primary: '#1000a9'
  primary-container: '#8083ff'
  on-primary-container: '#0d0096'
  inverse-primary: '#494bd6'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#ffb3ad'
  on-tertiary: '#68000a'
  tertiary-container: '#ff5451'
  on-tertiary-container: '#5c0008'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffdad7'
  tertiary-fixed-dim: '#ffb3ad'
  on-tertiary-fixed: '#410004'
  on-tertiary-fixed-variant: '#930013'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  display-lg:
    fontFamily: Space Grotesk
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.03em
  display-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  body-md:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  currency-lg:
    fontFamily: JetBrains Mono
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  currency-md:
    fontFamily: JetBrains Mono
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  currency-sm:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.06em
  label-sm:
    fontFamily: Manrope
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 0.75rem
  gutter-tablet: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 2.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system embodies high-precision fintech minimalism tailored for the modern Indian financial ecosystem. The experience is engineered for instantaneous glanceability, analytical rigor, and unwavering institutional trust. It balances the sleek, hyper-curated aesthetic of products like CRED with the clear, high-density utility of institutional wealth tracking.

### Core Tenets
- **Precision at Speed:** Complex cross-rail transactions (UPI auto-debits, NEFT/IMPS splits, cash reconciliations) must parse in milliseconds through high visual hierarchy and structured data layouts.
- **Controlled Density:** Financial snapshots avoid unnecessary visual noise. Space is deliberate; information density is calibrated to reduce cognitive fatigue during daily expense reviews.
- **Sovereign Dark Canvas:** Built ground-up for OLED mobile displays, maintaining razor-sharp contrast ratios that ensure complete legibility under bright outdoor daylight and low-light conditions.
- **Uncompromised Fidelity:** Numeric figures, transaction states, and ledger lines are treated with architectural precision—crisp geometric outlines, tabular numerals, and explicit semantic color coding.

## Colors

The palette operates on an intentional dark mode default, employing structural tiers of slate and charcoal to establish clear architectural depth without heavy drop shadows.

### Palette Architecture
- **Base Canvas (`#0F172A`):** Deep Slate serves as the foundational substrate, providing deep immersion while preventing the harsh contrast of pure `#000000`.
- **Containers & Surfaces (`#1E293B`):** Midnight Charcoal lifts interactive modules, transaction groups, and metrics cards off the base canvas.
- **Structural Outlines & Rules (`#334155`):** Muted Slate defines component boundaries, separating financial rows with sub-pixel sharpness.
- **Typography Matrix:**
  - Primary Content (`#F8FAFC`): Absolute optical clarity for currency figures, primary merchants, and titles.
  - Secondary Content (`#94A3B8`): Slate Gray for metadata, category labels, timestamps, and payment rails.
- **Semantic Cash Flow Tokens:**
  - Inflow / Credit: Emerald Green (`#10B981`) indicates balance accumulation, positive cash flow, and salary credits.
  - Outflow / Debit: Coral Red (`#EF4444`) with an interactive/soft variant Soft Crimson (`#F87171`) for expenses, recurring debits, and bill deductions.
  - Leak Alerts & Warnings: Amber (`#F59E0B`) highlights burn spikes, recurring subscription traps, and unmapped manual withdrawals.
- **Source & Ecosystem Badges:**
  - UPI Source Rails (GPay, PhonePe, Paytm, CRED): Electric Indigo (`#6366F1`).
  - Physical Cash Tracking: Mint Green (`#059669`).
  - WhatsApp Parsing & Actions: Official WhatsApp Teal (`#25D366`).

## Typography

The typography strategy leverages three distinct typefaces to separate qualitative context, narrative reading, and quantitative balance tracking.

### Typeface Roles
- **Space Grotesk (Headlines & High-Impact Values):** Provides a contemporary, engineered identity for overview figures, account titles, and performance metrics.
- **Manrope (Interface & Body Copy):** Offers geometric clarity with exceptional optical balance for merchant labels, descriptions, and account metadata.
- **JetBrains Mono (Monospace & Tabular Data):** Applied strictly to Indian Rupee (`₹`) amounts, transaction totals, rail source badges, and timestamps. It guarantees vertical alignment across multi-line expense feeds without layout jitter.

### Numeric Formatting Rule
All currency values must be prefixed with the standard Indian Rupee symbol (`₹`) formatted with tabular lining numbers. Multi-lakh and crore groupings follow the standard Indian numbering format (e.g., `₹12,45,890.00`).

## Layout & Spacing

This design system uses a fluid vertical layout optimized for thumb-reach mobile interactions, scaling to clean multi-column dashboard views on larger viewports.

### Grid & Breakpoints
- **Mobile (< 640px):** Single-column layout with 16px (`1rem`) outer canvas margins and 12px (`0.75rem`) gutters between horizontal chips and split metrics. Content stays within easy thumb zones at the lower two-thirds of the display.
- **Tablet (640px – 1024px):** 6-column fluid grid with 24px (`1.5rem`) outer margins. Dual-card view (e.g., aggregate cash flow balance alongside daily run rate).
- **Desktop (> 1024px):** 12-column fixed grid capped at 1200px container width with 40px (`2.5rem`) outer margins, displaying multi-rail tracking feeds side by side with analytics.

### Spacing Principles
- Dynamic padding conforms strictly to an 8px base rhythm (`0.25rem` to `1.5rem`).
- Spacing within transaction cells adheres to compact tokens (`space-sm` to `space-md`), keeping information dense enough to show 6–8 transactions above the mobile fold without scrolling.

## Elevation & Depth

This design system deliberately rejects heavy, murky drop shadows in favor of crisp tonal stacking and calibrated ghost borders. Visual elevation is rendered through surface luminescence and hairline borders.

### Surface Hierarchy
1. **Base Surface (Level 0):** Canvas `#0F172A`. Root canvas for backgrounds, headers, and bottom tab structures.
2. **Surface Mid (Level 1):** `#1E293B`. Elevated parent cards, main account balances, grouped transaction ledgers, and cash flow summaries.
3. **Surface High (Level 2):** `#243248`. Floating modals, bottom sheets, context menus, and inline alert banners.

### Ghost Outlines & Micro-Depth
- Every elevated card and surface container uses a continuous 1px solid border using Muted Slate (`#334155`).
- On interactive hover or tap, borders step up to 1px solid `#475569` or glow subtly with primary `#6366F1` at 20% opacity.
- Floating bottom drawers and sticky action bars employ a subtle directional shadow tinted with ambient slate: `0 -8px 24px -4px rgba(15, 23, 42, 0.6)`.

## Shapes

The interface balances sharp architectural lines with ergonomic corner curvature. 

### Geometric Rationale
- **Structural Containers & Cards:** Fixed corner radius of 12px (`0.75rem`, corresponding to `rounded-lg`). Provides a modern silhouette that anchors data grids and ledger tables without looking playful.
- **Interactive Pills & Action Buttons:** Pill-shaped radius (9999px) for primary CTAs, filter toggles, UPI source badges, and quick-tag chips. The circular contrast sets apart interactive touch targets from static cards.
- **Form Inputs & Quick Actions:** 10px to 12px corner rounding to match parent container geometry.

## Components

### Buttons
- **Primary Action (Pill):** Height 48px, background `#6366F1`, text `#F8FAFC`, typography `headline-sm`, corner radius 9999px. Active tap scales down to `0.98` with 80% opacity.
- **Secondary / Ghost:** Height 48px, background transparent, 1px border `#334155`, text `#F8FAFC`, corner radius 9999px. Hover/focus shifts border to `#6366F1`.
- **Special Action (WhatsApp Sync):** Background `#25D366` with high-contrast `#0F172A` text for automated receipt-forwarding and WhatsApp statement parsing.

### Transaction Cards & Grouped Ledgers
- **Container:** Background `#1E293B`, 1px border `#334155`, corner radius 12px, padding `space-md`.
- **Row Elements:** Merchant icon (40x40px, rounded-full, `#0F172A` background with `#94A3B8` icon), merchant title (`body-lg`), source rail badge, timestamp (`body-sm`), and tabular transaction amount (`currency-md`).
- **Semantic Inflow/Outflow Rows:** Outflows render `- ₹Amount` in `#F8FAFC` (with an optional `#EF4444` indicator dot); Inflows render `+ ₹Amount` in `#10B981`.

### Source Rail Badges
- **UPI Rails (GPay, PhonePe, Paytm, CRED):** Height 20px, horizontal padding `space-sm`, pill shape. Background `rgba(99, 102, 241, 0.15)`, text `#6366F1`, typography `label-caps`.
- **Cash Counter:** Background `rgba(5, 150, 105, 0.15)`, text `#059669`, typography `label-caps`.

### Cash Flow Health & Leak Alert Banners
- **Leak Warning:** Rounded 12px card, background `rgba(245, 158, 11, 0.08)`, 1px border `rgba(245, 158, 11, 0.3)`. Left accent line in solid `#F59E0B`. Headline in `#F59E0B`, body in `#F8FAFC`.

### Form Inputs & Search Fields
- **Container:** Height 48px, background `#0F172A`, 1px border `#334155`, corner radius 12px, padding horizontal `space-lg`.
- **Typography:** Value `body-lg` in `#F8FAFC`, placeholder in `#94A3B8`.
- **Focus State:** 1px border `#6366F1` with an ambient glow outline `0 0 0 2px rgba(99, 102, 241, 0.2)`.

### Filter Chips
- **Resting:** Height 32px, pill-shaped, background `#1E293B`, border 1px solid `#334155`, text `#94A3B8`, typography `label-sm`.
- **Active:** Background `#6366F1`, border 1px solid `#6366F1`, text `#F8FAFC`.