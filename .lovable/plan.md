

## Plan: Change Desktop Pagination to 10 Images Per Page

### What
Update the `ITEMS_PER_PAGE` constant from 12 to 10 so the desktop masonry grid shows 10 images per page, creating a better collage layout.

### Change in `src/components/home/GallerySection.tsx`

**Line 16** — change the constant:
```tsx
// From:
const ITEMS_PER_PAGE = 12;
// To:
const ITEMS_PER_PAGE = 10;
```

That's it — single line change. The existing pagination logic, masonry grid (4 columns on lg, 3 on md, 2 on sm), and page controls all work automatically with the new count. Mobile carousel remains unaffected as it uses all filtered items.

### Files changed
- `src/components/home/GallerySection.tsx` — line 16

