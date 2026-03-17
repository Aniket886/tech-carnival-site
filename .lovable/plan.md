

## Abandoned Registrations Tracker

### Goal
Capture participant details (name, email, phone, college, semester, team name, members) when they complete Step 1 (Details) and click "Next" -- before they reach payment. This lets admins contact participants who got stuck or abandoned the registration.

### Database Changes

**New table: `registration_drafts`**
- `id` (uuid, PK)
- `event_id` (uuid, not null)
- `event_name` (text)
- `leader_name` (text)
- `leader_email` (text)
- `leader_phone` (text)
- `college_name` (text)
- `semester` (text, nullable)
- `team_name` (text, nullable)
- `members` (jsonb, nullable)
- `status` (text, default `'abandoned'`) -- abandoned / completed
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

RLS policies:
- Public INSERT (anyone can save a draft)
- Public UPDATE on own drafts (match by leader_email + event_id)
- Admin SELECT/DELETE/UPDATE (full access)

Enable realtime: `ALTER PUBLICATION supabase_realtime ADD TABLE public.registration_drafts;`

### Frontend Changes

**1. RegistrationModal.tsx & RegisterSection.tsx** -- In the `goNext()` function, when moving from step 0 to step 1, upsert the form data into `registration_drafts`. On successful final registration, update the draft status to `'completed'`.

**2. New admin page: `src/pages/admin/AdminDrafts.tsx`**
- Table showing all drafts with status `abandoned` (i.e., not completed)
- Columns: Event, Leader Name, Email, Phone, College, Team Name, Members count, Time ago
- Real-time subscription for live auto-sync
- Filters: by event, search by name/email/phone
- Click-to-call (tel: link) and click-to-email (mailto: link) for quick contact
- Mark as "Contacted" action button
- Auto-refresh via realtime channel

**3. AdminLayout.tsx** -- Add "Abandoned Leads" link with `UserX` icon in the sidebar nav.

**4. App.tsx** -- Add route `/admin/drafts` pointing to the new page.

### Flow
1. Participant fills Step 1 details and clicks "Next"
2. Data is upserted to `registration_drafts` (keyed on event_id + leader_email)
3. If they complete registration, the draft status becomes `'completed'`
4. Admin panel shows only non-completed drafts in real-time
5. Admins can call/email participants directly from the table

