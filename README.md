<div align="center">

# 🎪 Tech Carnival 2K26

### A Full-Stack College Tech Fest Web Application

[![Live Demo](https://img.shields.io/badge/Live-Demo-00e5ff?style=for-the-badge&logo=vercel)](https://tech-carnival-site.lovable.app)
[![Built with React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?style=flat-square&logo=supabase)](https://supabase.com)

> A modern, feature-rich web platform for managing inter-college tech fests — complete with event registration, AI-powered chatbot, real-time leaderboard, and a full admin dashboard.

🌐 **Live at:** [tech-carnival-site.lovable.app](https://tech-carnival-site.lovable.app)

</div>

---

## 📸 Screenshots

> Add your screenshots to a `screenshots/` folder and update the paths below.

| Home Page | Events | Registration |
|:---------:|:------:|:------------:|
| ![Home](screenshots/home.png) | ![Events](screenshots/events.png) | ![Register](screenshots/register.png) |

| Leaderboard | Admin Dashboard | AI Chatbot |
|:-----------:|:---------------:|:----------:|
| ![Leaderboard](screenshots/leaderboard.png) | ![Admin](screenshots/admin.png) | ![Chatbot](screenshots/chatbot.png) |

---

## ✨ Features

### 🎯 Public Site
- **Animated Hero** — Neon-themed landing with countdown timer and star field background
- **Event Listings** — Browse events by category (Technical, Cultural, Sports, Fun) with detail modals
- **Online Registration** — Multi-step form with college picker, team member entry, and payment upload
- **Live Leaderboard** — Real-time college scores updated by admins
- **AI Chatbot (CarniBOT)** — Powered by LLaMA 3.1 via Groq, answers event queries instantly
- **Event Schedule** — Visual timeline/flow for both days of the fest
- **Photo Gallery** — Admin-managed image gallery with categories
- **Announcements Banner** — Scrolling announcements with links
- **Sponsors Section** — Tiered sponsor logos with links
- **FAQ Section** — Expandable accordion with admin-managed Q&As
- **Contact Form** — Messages stored in the database for admin review
- **Organizing Committee** — Team members section with photos and roles
- **Custom Cursor & Animations** — Framer Motion transitions and scroll animations throughout

### 🛡️ Admin Dashboard
- **Overview** — Stats, recent registrations, activity log
- **Page Manager** — Toggle visibility of site sections and individual cards
- **Registration Management** — View, filter, search, and export registrations
- **Payment Verification** — Review payment screenshots and approve/reject
- **Event Management** — CRUD events with rules, pricing, team sizes
- **College Management** — Approve/manage participating colleges
- **Score Management** — Enter scores per event, auto-calculates leaderboard
- **Announcement Manager** — Create/schedule/expire announcements
- **Team Manager** — Add/edit organizing committee members
- **Gallery Manager** — Upload and organize gallery images
- **Schedule Editor** — Configure the event flow/timeline
- **FAQ Manager** — Add/edit/reorder FAQs
- **CarniBOT Settings** — Manage bot FAQs and contact info
- **Email System** — Send bulk emails to registered participants
- **Contact Messages** — Read/manage messages from visitors
- **Sponsor Manager** — Add/edit sponsor logos and tiers
- **Admin Settings** — Manage admin users, session monitoring, idle timeout
- **Video Guide** — Embedded tutorial videos for admins
- **Activity Logging** — All admin actions are logged

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework with hooks & functional components |
| **TypeScript** | Type-safe development |
| **Vite** | Lightning-fast build tool & dev server |
| **Tailwind CSS** | Utility-first styling with custom design tokens |
| **shadcn/ui** | Radix UI–based component library |
| **Framer Motion** | Animations & page transitions |
| **React Router v6** | Client-side routing |
| **TanStack Query** | Server state management & caching |
| **React Hook Form + Zod** | Form handling with schema validation |
| **Recharts** | Charts & data visualization in admin |
| **Lucide React** | Icon library |
| **Sonner** | Toast notifications |

### Backend
| Technology | Purpose |
|------------|---------|
| **Supabase (PostgreSQL)** | Database, Auth, Storage, and Realtime |
| **Row Level Security (RLS)** | Fine-grained access control on all tables |
| **Deno Edge Functions** | Serverless API endpoints (email, chatbot, admin ops) |
| **Supabase Auth** | Admin authentication with role-based access |
| **Supabase Storage** | Payment screenshot & gallery image uploads |

### AI / ML
| Technology | Purpose |
|------------|---------|
| **Groq API** | LLaMA 3.1 inference for the CarniBOT chatbot |
| **Lovable AI Gateway** | Gemini Flash for fallback AI capabilities |

### DevOps & Tooling
| Technology | Purpose |
|------------|---------|
| **Lovable Cloud** | Hosting, CI/CD, and Supabase integration |
| **GitHub** | Version control |
| **ESLint** | Code linting |
| **Vitest** | Unit testing |

---

## 📁 Project Structure

```
├── public/                    # Static assets
├── src/
│   ├── assets/                # Images (team photos, QR codes)
│   ├── components/
│   │   ├── home/              # Public-facing page sections
│   │   ├── events/            # Event cards & modals
│   │   ├── registration/      # Registration form components
│   │   ├── schedule/          # Event timeline/flow
│   │   ├── chatbot/           # CarniBOT widget & messages
│   │   ├── layout/            # Navbar, Footer, Cursor, Loader
│   │   ├── ui/                # shadcn/ui components
│   │   └── AdminLayout.tsx    # Admin sidebar layout
│   ├── data/                  # Static event & schedule data
│   ├── hooks/                 # Custom hooks (auth, mobile, visibility)
│   ├── integrations/supabase/ # Auto-generated Supabase client & types
│   ├── lib/                   # Utilities & validators
│   ├── pages/
│   │   ├── admin/             # All admin dashboard pages
│   │   ├── Index.tsx          # Main landing page
│   │   ├── AdminLogin.tsx     # Admin login page
│   │   └── Poster.tsx         # Printable event poster
│   ├── styles/                # Additional CSS
│   └── main.tsx               # App entry point
├── supabase/
│   ├── functions/             # Deno Edge Functions
│   │   ├── carnibot/          # AI chatbot endpoint
│   │   ├── send-email/        # Email sending
│   │   ├── create-admin/      # Admin user creation
│   │   ├── delete-admin/      # Admin user removal
│   │   ├── kick-session/      # Session management
│   │   └── api/               # External API endpoint
│   └── config.toml            # Supabase configuration
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+) or [Bun](https://bun.sh/)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd tech-carnival-2k26

# Install dependencies
npm install
# or
bun install

# Start the development server
npm run dev
# or
bun dev
```

The app will be running at `http://localhost:8080`.

### Environment Variables

The project uses Lovable Cloud, which auto-configures the following in `.env`:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

---

## 📊 Database Schema

Key tables in PostgreSQL:

| Table | Purpose |
|-------|---------|
| `events` | All fest events with details, pricing, rules |
| `registrations` | Team registrations with payment info |
| `colleges` | Participating colleges directory |
| `college_scores` | Event scores for leaderboard |
| `contacts` | Visitor messages |
| `announcements` | Banner announcements |
| `faqs` | Frequently asked questions |
| `sponsors` | Sponsor logos and tiers |
| `team_members` | Organizing committee |
| `gallery_items` | Photo gallery |
| `schedule_events` | Event timeline data |
| `site_sections` | Page section visibility control |
| `user_roles` | Admin role management (RBAC) |
| `admin_sessions` | Active session tracking |
| `bot_faqs` / `bot_contacts` | CarniBOT knowledge base |

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
