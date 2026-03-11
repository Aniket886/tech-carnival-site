

# Redesign Maintenance Page — Implementation Plan

## Problem Found
During end-to-end testing, I confirmed that the **previous redesign edits were never applied** to the file. `src/components/home/MaintenancePage.tsx` still contains the original code with the wrench emoji, old text, and social media links.

## Test Results
1. **Admin Page Manager** — Maintenance Mode toggle works correctly (hides all sections, shows toast)
2. **Maintenance Page** — Renders but shows the **old design** (wrench emoji + social links)
3. **Toggle off** — Site returns to full view correctly

## Plan

### 1. Rewrite `src/components/home/MaintenancePage.tsx`
Apply the clean & minimal redesign:
- Remove wrench emoji, replace with a subtle "Under Construction" status pill with live ping indicator
- Gradient text title "Tech Carnival – 2K26"
- Clean subtitle text
- Existing `CountdownTimer` component
- Thin divider line
- **No social media links** (per your request)
- Staggered fade-in animations using `framer-motion`
- Subtle background gradient orb (`bg-primary/5 blur-[120px]`)

### 2. No other files need changes
- `Index.tsx` already imports from the correct path
- `CountdownTimer` component remains unchanged
- `useSiteVisibility` hook and maintenance mode logic work correctly (verified via testing)

