<div align="center">

# 🎪 Tech Carnival 2K26

### A Full-Stack College Tech Fest Platform

[![Live](https://img.shields.io/badge/🌐_Live-tech--carnival--site.lovable.app-00e5ff?style=for-the-badge)](https://tech-carnival-site.lovable.app)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?style=flat-square&logo=supabase)](https://supabase.com)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-12-FF0055?style=flat-square&logo=framer)](https://www.framer.com/motion/)

> A modern, feature-rich platform for managing inter-college tech fests — with event registration, AI chatbot, real-time leaderboard, drag-and-drop scheduling, and a comprehensive admin dashboard.

**Built for BCA, BSc CS & Diploma CS students across Karnataka**

</div>

---

## ✨ Features

### 🎯 Public Site

| Feature | Description |
|---------|-------------|
| **Animated Hero** | Neon-themed landing with countdown timer and interactive star field |
| **Event Listings** | Browse by category (Technical, Gaming, Cultural) with detail modals |
| **Online Registration** | Multi-step form with college picker, team entry, and payment upload |
| **Live Leaderboard** | Real-time college scores updated by admins |
| **AI Chatbot (CarniBOT)** | Powered by Groq (LLaMA 3.1) with Gemini Flash fallback |
| **Event Schedule** | Visual two-day timeline with drag-and-drop admin editing |
| **Photo Gallery** | Admin-managed image gallery with categories |
| **Announcements** | Scrolling banner with scheduled start/expiry and links |
| **Sponsors** | Tiered sponsor logos (Title, Gold, Silver, Bronze) |
| **FAQ** | Expandable accordion with admin-managed Q&As |
| **Contact Form** | Messages stored in DB with read/unread tracking |
| **Organizing Committee** | Team members with photos, roles, and sections |
| **How to Register** | Step-by-step registration guide |
| **Custom Cursor & Animations** | Framer Motion transitions, scroll animations, page loader |
| **Maintenance Mode** | Admin-toggleable maintenance page |

### 🛡️ Admin Dashboard

| Module | Description |
|--------|-------------|
| **Overview** | Stats, recent registrations, activity log |
| **Page Manager** | Toggle visibility of site sections and individual cards |
| **Registrations** | View, filter, search, and export registrations |
| **Payment Verification** | Review screenshots, approve/reject, manage instructions |
| **Event Management** | CRUD events with rules, pricing, team sizes, rulebook URLs |
| **College Management** | Approve/manage participating colleges with details |
| **Score Management** | Enter scores per event, auto-calculates leaderboard |
| **Announcements** | Create/schedule/expire with type, links, and visibility |
| **Team Manager** | Add/edit organizing committee by section |
| **Gallery Manager** | Upload and organize gallery images by category |
| **Schedule Editor** | Configure two-day event timeline with lanes |
| **FAQ Manager** | Add/edit/reorder FAQs with links |
| **CarniBOT Settings** | Manage bot FAQs and contact info per event |
| **Email System** | Send bulk emails to registered participants |
| **Contact Messages** | Read/manage visitor messages |
| **Sponsor Manager** | Add/edit sponsor logos and tiers |
| **Registration Drafts** | View and manage incomplete registrations |
| **Payment Instructions** | Configure payment details shown to registrants |
| **Admin Settings** | Manage admin users, session monitoring, idle timeout |
| **Video Guide** | Embedded tutorial videos for admins |
| **Activity Logging** | All admin actions logged with timestamps |

---

## 🛠️ Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3 | UI framework |
| TypeScript | 5.8 | Type safety |
| Vite | 5.4 | Build tool & dev server |
| Tailwind CSS | 3.4 | Utility-first styling with custom neon design tokens |
| shadcn/ui | — | Radix UI component library |
| Framer Motion | 12 | Animations & page transitions |
| React Router | 6.30 | Client-side routing |
| TanStack Query | 5.83 | Server state & caching |
| React Hook Form + Zod | 7.61 / 3.25 | Form handling with schema validation |
| @dnd-kit/sortable | 10 | Drag-and-drop reordering |
| Recharts | 2.15 | Admin charts & data visualization |
| html2pdf.js | 0.10 | PDF export (poster generation) |
| react-markdown | 10.1 | Markdown rendering in chatbot |
| Lucide React | 0.462 | Icon library |
| Sonner | 1.7 | Toast notifications |

### Backend (Lovable Cloud)

| Technology | Purpose |
|------------|---------|
| PostgreSQL | Relational database (26 tables) |
| Row Level Security | Fine-grained access control |
| Deno Edge Functions | Serverless API endpoints (6 functions) |
| Auth | Admin authentication with role-based access (RBAC) |
| Storage | Payment screenshots & gallery image uploads |
| Realtime | Live updates for leaderboard & registrations |

### Edge Functions

| Function | Purpose |
|----------|---------|
| `api` | External API endpoint for event integrations |
| `carnibot` | AI chatbot (Groq LLaMA 3.1 + Gemini fallback) |
| `create-admin` | Secure admin user creation (owner-gated) |
| `delete-admin` | Admin removal with owner protection |
| `kick-session` | Force-logout admin sessions |
| `send-email` | Bulk email to registered participants |

---

## 📊 Database Schema (26 Tables)

### Core

| Table | Purpose |
|-------|---------|
| `events` | All fest events with pricing, rules, team sizes, venues |
| `registrations` | Team registrations with payment info & status |
| `registration_drafts` | Incomplete/saved registration drafts |
| `colleges` | Participating colleges with approval workflow |
| `college_scores` | Event scores for leaderboard ranking |
| `contacts` | Visitor messages with read/unread status |

### Content Management

| Table | Purpose |
|-------|---------|
| `announcements` | Banner announcements with scheduling |
| `faqs` | FAQ entries with ordering and links |
| `gallery_items` | Photo gallery with categories |
| `sponsors` | Sponsor logos and tier levels |
| `team_members` | Organizing committee by section |
| `schedule_events` | Two-day event timeline data |
| `guide_videos` | Admin tutorial videos |

### Bot & Communication

| Table | Purpose |
|-------|---------|
| `bot_faqs` | CarniBOT knowledge base |
| `bot_contacts` | Bot contact info per event |
| `email_sends` | Email send history and filters |

### Admin & Security

| Table | Purpose |
|-------|---------|
| `user_roles` | RBAC with owner flag (admin/moderator/user) |
| `admin_sessions` | Active session tracking with IP & user agent |
| `admin_login_logs` | Login audit trail |
| `admin_settings` | Configurable admin preferences |
| `activity_log` | All admin action logging |
| `visibility_log` | Section/card visibility change history |

### Site Configuration

| Table | Purpose |
|-------|---------|
| `site_sections` | Page section visibility control |
| `section_cards` | Individual card visibility within sections |
| `api_keys` | Per-event API keys for external integrations |
| `event_updates` | Sync log for external event updates |

---

## 📁 Project Structure

```
├── public/                          # Static assets
├── src/
│   ├── assets/                      # Images (team photos, QR codes)
│   ├── components/
│   │   ├── home/                    # Public sections (Hero, About, Leaderboard, etc.)
│   │   ├── events/                  # Event cards & detail modals
│   │   ├── registration/            # Registration form & college picker
│   │   ├── schedule/                # Event timeline
│   │   ├── chatbot/                 # CarniBOT widget & messages
│   │   ├── layout/                  # Navbar, Footer, Cursor, Loader, ScrollAnimate
│   │   ├── ui/                      # shadcn/ui + custom components
│   │   └── AdminLayout.tsx          # Admin sidebar layout
│   ├── data/                        # Static event & schedule seed data
│   ├── hooks/
│   │   ├── useAdminAuth.tsx         # Admin auth context & session management
│   │   ├── useIsOwner.tsx           # Owner-only permission check
│   │   ├── useSiteVisibility.tsx    # Section visibility provider
│   │   └── use-mobile.tsx           # Responsive breakpoint hook
│   ├── integrations/supabase/       # Auto-generated client & types
│   ├── lib/                         # Utilities & validators
│   ├── pages/
│   │   ├── admin/                   # 20 admin dashboard pages
│   │   ├── Index.tsx                # Main landing page
│   │   ├── AdminLogin.tsx           # Admin login
│   │   ├── Poster.tsx               # Printable event poster
│   │   └── NotFound.tsx             # 404 page
│   └── styles/                      # Additional CSS (poster)
├── supabase/
│   ├── functions/                   # 6 Deno Edge Functions
│   └── config.toml                  # Function configuration
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18+ or [Bun](https://bun.sh/)

### Installation

```bash
git clone <your-repo-url>
cd tech-carnival-2k26
npm install   # or bun install
npm run dev   # or bun dev
```

The app runs at `http://localhost:8080`.

### Environment

Lovable Cloud auto-configures these in `.env`:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

---

## 🔐 Security

- **RBAC** via `user_roles` table with `has_role()` security definer function
- **Owner protection** — Owner accounts cannot be deleted; destructive operations are owner-gated
- **RLS** on all tables with appropriate policies
- **Edge function auth** — Bearer token verification with admin role checks
- **Session management** — Active session tracking, idle timeout, force-logout capability
- **Activity logging** — All admin actions are audited

---

## 👨‍💻 Author

**Aniket Tegginamath**

[![Linktree](https://img.shields.io/badge/Linktree-Connect-43E55E?style=for-the-badge&logo=linktree&logoColor=white)](https://linktr.ee/anikettegginamath)

---

## 📄 License

This project is proprietary. All rights reserved.

---

<div align="center">

Built with ❤️ using [Lovable](https://lovable.dev)

</div>
