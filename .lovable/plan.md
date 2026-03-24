

## Plan: Add College Location + Full Member Details

### Changes to `src/pages/admin/AdminRegistrations.tsx`

**1. Fetch colleges data alongside registrations and events**
- Add `colleges` to the `fetchData` call: `supabase.from("colleges").select("id, name, city, state")`
- Build a `collegeMap` (by id) and a `collegeNameMap` (by name, for fallback when `college_id` is null)

**2. Show State & City in the expanded dropdown**
- After the "College" line in the detail grid, add "City" and "State" rows
- Look up via `college_id` first, fall back to matching by `college_name`

**3. Update CSV export to include all details**
- Add "City" and "State" columns to the CSV headers
- Replace the "Members" column (currently just a count) with individual member columns: expand each member's name, email, phone as separate columns (e.g., "Member 1 Name", "Member 1 Email", "Member 1 Phone", etc.)
- Determine max member count across filtered registrations to set the right number of member columns

### Technical details

```typescript
// College lookup helper
const getCollegeInfo = (r: Registration) => {
  if (r.college_id) return collegeMap.get(r.college_id);
  return collegeNameMap.get(r.college_name.toLowerCase());
};

// CSV: dynamic member columns
const maxMembers = Math.max(...filtered.map(r => Array.isArray(r.members) ? r.members.length : 0), 0);
const memberHeaders = Array.from({ length: maxMembers }, (_, i) => [
  `Member ${i+1} Name`, `Member ${i+1} Email`, `Member ${i+1} Phone`
]).flat();
// Headers: [...baseHeaders, "City", "State", ...memberHeaders]
```

### Files changed
- `src/pages/admin/AdminRegistrations.tsx` only

