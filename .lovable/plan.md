

# Plan: Remove and Rebuild Liquid Glass Feature

## What's happening

The liquid glass CSS classes and styling were added to the codebase but never made it to the published site. Rather than debugging the deploy pipeline further, we'll remove the entire liquid glass implementation and rebuild it cleanly.

## Scope of removal

**CSS classes to remove** (in `src/index.css`):
- `.liquid-glass` (lines 126–143)
- `.liquid-glass-intense` (lines 145–162)

**Component references to revert** (replace `liquid-glass` / `liquid-glass-intense` with the original `glass` class):

| File | What changes |
|------|-------------|
| `src/components/layout/Navbar.tsx` | `liquid-glass` → `glass`, `liquid-glass-intense` → `glass-strong` (nav pill + mobile menu) |
| `src/components/home/About.tsx` | `liquid-glass-intense` → `glass-strong` |
| `src/components/home/FAQSection.tsx` | `liquid-glass` → `glass` (accordion items) |
| `src/components/home/ContactSection.tsx` | `liquid-glass` → `glass` (form, coordinator cards, address card) |
| `src/components/home/CoreTeam.tsx` | Remove inline liquid-glass styles on avatar ring, use simple gradient border |
| `src/components/ui/button.tsx` | Remove `neon` and `neon-outline` variants (revert to standard) |

## Rebuild — Clean liquid glass v2

After removal, re-add the liquid glass system from scratch with the same visual intent but as a single clean commit:

1. **CSS** — Re-add `.liquid-glass` and `.liquid-glass-intense` in `src/index.css` with identical definitions
2. **Components** — Re-apply the classes to the same 5 components listed above
3. **Button variants** — Re-add `neon` and `neon-outline` variants

This ensures a fresh, clean application of the feature that will be included in the next publish.

## Steps

1. Remove `.liquid-glass` and `.liquid-glass-intense` from `src/index.css`
2. Replace all `liquid-glass` / `liquid-glass-intense` references in components with `glass` / `glass-strong`
3. Revert CoreTeam inline liquid-glass styles to simpler styling
4. Immediately re-add the liquid glass CSS classes back to `src/index.css`
5. Re-apply `liquid-glass` / `liquid-glass-intense` classes across all 5 components
6. Verify button variants are intact

This is effectively a "touch every file" approach — ensuring every file is marked as changed so the next publish picks them all up.

