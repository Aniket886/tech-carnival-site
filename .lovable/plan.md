

## Plan: Fix Pagination Scrolling to Wrong Section

### Problem
Clicking pagination buttons in the gallery causes the page to jump to the "Get in Touch" section. This happens because when the page state changes, the masonry grid re-renders (with AnimatePresence exit/enter animations), temporarily collapsing in height — the browser then adjusts scroll position, landing on the contact section below.

### Fix in `src/components/home/GallerySection.tsx`

1. **Add `type="button"`** to all three pagination buttons (prev, page numbers, next) to prevent any default behavior.

2. **Scroll to gallery section** on page change — update the `setPage` calls to also scroll the gallery section into view:

```tsx
const handlePageChange = (newPage: number) => {
  setPage(newPage);
  document.getElementById("gallery")?.scrollIntoView({ behavior: "smooth", block: "start" });
};
```

3. Replace all `setPage(...)` calls in the pagination buttons with `handlePageChange(...)`:
   - Previous button: `handlePageChange(Math.max(1, page - 1))`
   - Page number buttons: `handlePageChange(p)`
   - Next button: `handlePageChange(Math.min(totalPages, page + 1))`

### Files changed
- `src/components/home/GallerySection.tsx` — add helper function + update 3 button onClick handlers

