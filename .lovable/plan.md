

# Admin Panel Enhancements — Plan

## Overview
Four new features for the admin panel, prioritized by impact:

1. **Announcements / Notices** — Create banners shown on the public site
2. **Activity Log / Audit Trail** — View admin actions history  
3. **Gallery / Media Manager** — Upload and manage event photos
4. **Bulk Notifications to Participants** — Email filtered groups

---

## 1. Announcements / Notices

### Database
- New `announcements` table: `id`, `title`, `message`, `type` (info/warning/urgent), `link_url`, `link_label`, `is_active`, `starts_at`, `expires_at`, `created_by`, `created_at`
- RLS: public SELECT where `is_active = true AND now() BETWEEN starts_at AND expires_at`, admin ALL

### Admin Page (`/admin/announcements`)
- List active/expired announcements with toggle
- Create/edit modal: title, message, type (color-coded), optional link, start/end datetime
- Delete with confirmation

### Public Site
- New `AnnouncementBanner` component at top of Index page
- Fetches active announcements from DB, renders as dismissible top banner
- Color by type: blue (info), amber (warning), red (urgent)
- Slides in with framer-motion animation

### Sidebar
- Add "Announcements" link with `Megaphone` icon

---

## 2. Activity Log / Audit Trail

The `activity_log` table already exists with `action`, `reason`, `admin_email`, `created_at`. It just needs a dedicated viewer page.

### Admin Page (`/admin/activity-log`)
- Fetch from `activity_log` ordered by `created_at DESC`
- Searchable/filterable table: filter by action type, date range
- Show admin email, action, reason, timestamp
- Auto-refresh with `useAdminRefresh`

### Logging Integration
- Add helper function `logActivity(action, reason?)` that inserts into `activity_log`
- Wire into key admin actions: registration status changes, event edits, FAQ changes, admin invites/removals, payment confirmations

### Sidebar
- Add "Activity Log" link with `ScrollText` icon

---

## 3. Gallery / Media Manager

### Database & Storage
- New storage bucket: `gallery-images` (public)
- New `gallery_items` table: `id`, `image_url`, `caption`, `category` (event name or general), `display_order`, `is_visible`, `uploaded_by`, `created_at`
- RLS: public SELECT where `is_visible = true`, admin ALL

### Admin Page (`/admin/gallery`)
- Grid view of uploaded images with captions
- Upload button → file picker, uploads to `gallery-images` bucket
- Edit caption, category, visibility, display order
- Delete with confirmation (removes from storage + DB)
- Filter by category/event

### Public Site (optional, can be added later)
- New `Gallery` section component with masonry/grid layout
- Added to Index page, controlled by site_sections visibility

### Sidebar
- Add "Gallery" link with `Image` icon

---

## 4. Bulk Email / Notifications

The existing `AdminEmail.tsx` already has email templates and sending via the `send-email` edge function. This enhancement adds:

### Admin Page Enhancement (extend `/admin/email`)
- New "Bulk Send" tab alongside existing compose/templates
- Recipient filter: by event, by college, by registration status
- Preview count of matching recipients before sending
- Batch send via edge function (chunks of 10-20 to avoid timeouts)
- Send history log in a new `email_sends` table: `id`, `template_id`, `subject`, `recipient_count`, `sent_by`, `sent_at`

### Database
- New `email_sends` table for tracking bulk sends
- RLS: admin only

---

## Implementation Order (recommended)
1. **Announcements** — highest user-facing impact, relatively simple
2. **Activity Log** — table exists, just needs UI + logging hooks
3. **Gallery** — needs storage bucket + upload logic
4. **Bulk Email** — extends existing email system, most complex

## Files to Create/Modify
- **New pages**: `AdminAnnouncements.tsx`, `AdminActivityLog.tsx`, `AdminGallery.tsx`
- **New components**: `AnnouncementBanner.tsx` (public site)
- **Modified**: `AdminLayout.tsx` (sidebar links), `App.tsx` (routes), `Index.tsx` (banner), `AdminEmail.tsx` (bulk tab)
- **Database**: 3 migrations (announcements, gallery_items, email_sends tables + storage bucket)
- **Utility**: `logActivity` helper used across admin pages

