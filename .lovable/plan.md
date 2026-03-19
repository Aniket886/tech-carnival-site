

## Plan: Redesign README.md

Replace the current README with a modern, comprehensive version reflecting the actual codebase state.

### Key Updates

**1. Accurate project description** — Update from "three-day" to "two-day" (matches About component), target audience to "BCA, BSc CS & Diploma CS students"

**2. Complete database schema** — Add all 22 tables from the actual types.ts:
- `activity_log`, `admin_login_logs`, `admin_sessions`, `admin_settings`, `announcements`, `api_keys`, `bot_contacts`, `bot_faqs`, `college_scores`, `colleges`, `contacts`, `email_sends`, `event_updates`, `events`, `faqs`, `gallery_items`, `guide_videos`, `registration_drafts`, `registrations`, `schedule_events`, `section_cards`, `site_sections`, `sponsors`, `team_members`, `user_roles`, `visibility_log`

**3. Updated admin dashboard features** — Add missing pages: Payment Instructions, Drafts, Video Guide, Page Manager (section/card visibility)

**4. Updated edge functions** — List all 6: `api`, `carnibot`, `create-admin`, `delete-admin`, `kick-session`, `send-email`

**5. Accurate tech stack** — Update dependency versions from package.json (React 18.3, Framer Motion 12, etc.), add `react-markdown`, `html2pdf.js`, `@dnd-kit/sortable`, `dnd-kit`

**6. Updated project structure** — Reflect actual directory layout including `src/components/home/About.tsx`, `src/hooks/useSiteVisibility.tsx`, `src/hooks/useIsOwner.tsx`, admin drafts, payment instructions pages

**7. Cleaner design** — Modern badges, cleaner tables, remove placeholder screenshot section (or keep with note), remove duplicate/outdated info

**8. Event categories** — Update from "Technical, Cultural, Sports, Fun" to actual: "Technical, Gaming, Cultural"

**9. Live URL** — Update to `tech-carnival-site.lovable.app`

### File Changed
- `README.md` — Full rewrite

