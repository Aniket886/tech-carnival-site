

## Plan: Add Event Website Link to Event Detail Modal

### What exists today
- The `events` table already has a `website_url` column
- The admin `AdminEvents.tsx` form already has a `website_url` field in `FormData`
- The `EventData` interface in `EventsSection.tsx` does NOT include `website_url`
- The event mapping in `EventsSection.tsx` does NOT pass `website_url` to `EventData`
- The `EventDetailModal.tsx` does not render any website link

### Changes

**1. `src/components/events/EventsSection.tsx`**
- Add `websiteUrl: string | null` to the `EventData` interface
- Map `e.website_url` to `websiteUrl` in the fetch mapping

**2. `src/components/events/EventDetailModal.tsx`**
- Below the "Registration Fee" row in the Event Details card, add a conditional row that shows "Event Website" with an external link icon when `event.websiteUrl` is set
- The link opens in a new tab

**3. `src/data/events.ts`**
- Add `websiteUrl: null` to each fallback event object

**4. Admin side** -- already works. The `website_url` field exists in the admin event edit form (`AdminEvents.tsx`). Admins can already add/remove the URL from the event details dialog.

### UI Reference
Based on the uploaded screenshot, the new row will appear below "Registration Fee: ₹200" in the same style, with an external link icon and clickable URL text.

