

## Plan: Add Pagination to Admin Drafts

### Changes to `src/pages/admin/AdminDrafts.tsx`

1. **Add pagination state**: `currentPage` (default 1), `pageSize` (default 15)
2. **Compute paginated data**: Slice `filtered` array based on current page
3. **Reset page to 1** when filters/search change
4. **Add pagination controls** below the table using `Button` components (Previous/Next + page numbers)
5. **Update footer text** to show range (e.g., "Showing 1-15 of 27")

### Technical details
- `totalPages = Math.ceil(filtered.length / pageSize)`
- `paginatedDrafts = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)`
- Render the table with `paginatedDrafts` instead of `filtered`
- Page number buttons with ellipsis for large page counts
- Add a page size selector (10, 15, 25, 50)

### File changed
- `src/pages/admin/AdminDrafts.tsx` only

