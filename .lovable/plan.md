

## Plan: Update CarniBOT with Dynamic Schedule from Database

### Problem
The CarniBOT edge function has a **hardcoded `SCHEDULE_TEXT`** (lines 10-29) that is outdated — it doesn't match the current event data in the database. Key mismatches include:
- "Battle Ground – Free Fire" → now "Battle Ground – BGMI"
- Myth Busters timing changed from 9-11 AM to 2:30-5:00 PM
- Updated venues (e.g., "GMU Central Library", "G M Halamma Auditorium")
- Team sizes changed (Code Compass: Solo → 2, Dance Mania: 6-12 → 4-8, Myth Busters: Solo → 2, Scitopia: 5-10 → 8-10)
- Pitch Perfect no longer active
- Hack Momentum venue changed

### Solution
Replace the hardcoded `SCHEDULE_TEXT` with a **dynamic fetch from the `schedule_events` table**, so the bot always has up-to-date schedule info. Also update the hardcoded schedule in `src/data/schedule.ts` to match current DB data.

### Changes

**1. `supabase/functions/carnibot/index.ts`**
- Remove the hardcoded `SCHEDULE_TEXT` constant (lines 9-29)
- Add `schedule_events` to the parallel fetch block alongside events, contacts, faqs, scores
- Build the schedule text dynamically from the fetched `schedule_events` data, converting decimal hours to readable times
- Keep the same format the system prompt expects

**2. `src/data/schedule.ts`**
- Update fallback schedule data to match current DB values:
  - Myth Busters: startHour 14.5, endHour 17, venue "Seminar Hall B", teamSize "2"
  - Hack Momentum: venue "GMU Central Library"
  - Brain Quest: remove "(Mega Quiz)" subtitle
  - Battle Ground: rename to "Battle Ground – BGMI", endHour 17
  - Dance Mania: venue "G M Halamma Auditorium", teamSize "4-8"
  - Scitopia: teamSize "8-10", venue "G M Halamma Auditorium"
  - Assemble: venue "Main Auditorium" (matches DB)
  - Pixel Perfect: venue "Room No. 310, 3 Floor, Degree Block, GMU Campus"

**3. `src/data/events.ts`** (fallback events)
- Update to match DB: remove Pitch Perfect (no longer active), update team sizes, descriptions, and prices to match current DB values

