

## Plan: Add Manual Registration Count to College Management

The registration count column currently only reads from the `registrations` table via `college_id`. Since some colleges may have registrations not linked by `college_id` (or tracked externally), you need a manual override field.

### Approach

**1. Add `manual_registration_count` column to `colleges` table**
- New nullable integer column, default `null`
- Migration only — no existing data touched

**2. Update `AdminColleges.tsx` — Registration display**
- In the Registrations column, show: `(auto count from registrations table) + (manual_registration_count ?? 0)`
- Make the count clickable — clicking opens a small inline input/popover to set the manual count
- Show tooltip: "Auto: X | Manual: Y" so admin sees breakdown

**3. Update `AdminColleges.tsx` — Edit dialog**
- Add a "Manual Registration Count" number input field in the create/edit college dialog
- Include it in the save payload

### Files changed
- **Database migration**: Add `manual_registration_count integer default null` to `colleges`
- **`src/pages/admin/AdminColleges.tsx`**: Add manual count field to form, display combined count in table, clickable quick-edit for the count

### Notes
- Existing 2 real registrations in `registrations` table are untouched
- The auto-count continues working as before; manual count is additive

