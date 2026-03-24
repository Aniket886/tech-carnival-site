

## Plan: Add Auto-Sync to Remaining Admin Pages

Most admin pages already have 10-second auto-refresh. Only 4 pages are missing it.

### Current State
- **10 pages** already use `setInterval(fetchData, 10_000)` — no changes needed
- **6 pages** use `useAdminRefresh` context (10s interval from AdminLayout) — no changes needed
- **4 pages** lack auto-refresh and need updating

### Changes

**1. `src/pages/admin/AdminSettings.tsx`**
- Add `setInterval` around `fetchAdmins` + `fetchTimeout` calls (10s)
- Clean up interval on unmount

**2. `src/pages/admin/AdminPaymentInstructions.tsx`**
- Add `setInterval` around its fetch function (10s)
- Clean up interval on unmount

**3. `src/pages/admin/AdminVideoGuide.tsx`**
- Already has realtime subscription, but add a 10s `setInterval` as fallback (consistent with other pages)
- Clean up interval on unmount

**4. `src/pages/admin/AdminEmail.tsx`**
- Add `setInterval` to refresh events and registrations data (10s)
- Clean up interval on unmount

### Technical Details
Each page will follow the same pattern already used across the codebase:
```typescript
useEffect(() => {
  fetchData();
  const interval = setInterval(fetchData, 10_000);
  return () => clearInterval(interval);
}, [fetchData]);
```

### Files Changed
- `src/pages/admin/AdminSettings.tsx`
- `src/pages/admin/AdminPaymentInstructions.tsx`
- `src/pages/admin/AdminVideoGuide.tsx`
- `src/pages/admin/AdminEmail.tsx`

