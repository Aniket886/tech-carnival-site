

## Plan: Add Fallback for Public Page When Database Is Unreachable

### Root Cause
- The backend database is intermittently timing out (confirmed in auth logs and live query attempts).
- `useSiteVisibility` fetches `site_sections` from the database. When this fails, `orderedSectionKeys` remains an empty array.
- `Index.tsx` iterates over `orderedSectionKeys` — if empty, nothing renders. Result: black screen with only the navbar.

### Fix: Default section keys as fallback

**File: `src/hooks/useSiteVisibility.tsx`**

1. Define a `DEFAULT_SECTION_KEYS` constant with all section keys in default order (hero, sponsors, about, how_to_register, events, schedule, leaderboard, gallery, faq, contact, organizing_committee, core_team, footer).

2. In `fetchData`, wrap the `Promise.all` in a try/catch. On failure, fall back to defaults:
   - Set `orderedSectionKeys` to `DEFAULT_SECTION_KEYS`
   - Set all sections visible in the map
   - Set `loading` to false

3. Also update the 5-second timeout fallback: if `orderedSectionKeys` is still empty when the timeout fires, apply the defaults.

This ensures the public site always renders content even if the database is temporarily down.

### Admin login timeout
This is purely a transient backend issue — the auth service can't reach the database. No code fix needed; it will work once the database stabilizes. However, we should add a timeout to the login flow so "Signing in..." doesn't hang forever.

**File: `src/pages/AdminLogin.tsx`**

4. Add a 15-second timeout around `loginAndCheckRole`. If it exceeds 15s, show an error toast ("Login timed out — please try again") and re-enable the button.

### Summary of changes
- `src/hooks/useSiteVisibility.tsx` — add default fallback for failed DB queries
- `src/pages/AdminLogin.tsx` — add login timeout so it doesn't hang indefinitely

