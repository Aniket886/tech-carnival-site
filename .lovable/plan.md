

## Plan: Capture Abandoned Leads with Only Name, Email, Phone

### Problem
Currently, the abandoned draft is only saved when **all four** fields (name, email, phone, college) are filled. The user wants it captured even if only name, email, and phone are filled (without college).

### Changes in `src/components/RegistrationModal.tsx`

Three locations need the same change — remove the `college_name` requirement from the guard condition:

1. **Line 441** (`saveAbandonedDraft` function): Change the guard from requiring all 4 fields to only requiring name + email + phone:
   ```ts
   // Before
   if (!f.leader_name.trim() || !f.leader_email.trim() || !f.leader_phone.trim() || !f.college_name.trim()) return;
   // After
   if (!f.leader_name.trim() || !f.leader_email.trim() || !f.leader_phone.trim()) return;
   ```

2. **Line 480** (`beforeunload` handler): Same change — remove `f.college_name.trim()` check.

3. **Line 492** (`resetAndClose` function): Same change — remove `form.college_name.trim()` check.

The `college_name` column in `registration_drafts` has a default of `''`, so empty values are fine. No database changes needed.

