
# Tech Carnival – 2K26 Event Website

## Design System
- **Theme**: Dark background with neon blue (`#00D4FF`) and purple (`#A855F7`) accents
- **Gradients**: Blue-to-purple gradient mesh for hero, glowing neon effects on buttons/headings
- **Typography**: Bold, modern — large display text for headings, clean sans-serif body text
- **Animations**: Floating gradient blobs in hero, smooth countdown timer, fade-in on scroll

## Page Sections (Single Page, Scroll-Based)

### 1. Sticky Navbar
- Dark glassmorphism navbar (backdrop blur)
- "Tech Carnival" logo/text on the left
- Nav links: Home, Events, Schedule, Register, Contact (smooth scroll)
- Highlighted neon "Register" button
- Mobile: hamburger menu with slide-out drawer

### 2. Hero Section (Full Screen)
- Large bold title: **"Tech Carnival – 2K26"**
- Tagline: *"Where Innovation Meets Celebration"*
- Animated countdown timer (days, hours, minutes, seconds) to a placeholder date
- Glowing "Register Now" CTA button that scrolls to registration section
- Animated gradient mesh background with floating blobs

### 3. About the Event
- Brief paragraph with placeholder text about the event
- Clean card layout with subtle neon border glow

### 4. Events Section
- Placeholder grid of event cards (Hackathon, Workshop, etc.) with icons and descriptions

### 5. Schedule Section
- Simple timeline/table showing day and time slots with placeholder data

### 6. Registration Section
- Registration form with fields: Name, Email, Phone, College, Event selection
- Form stores submissions in **Supabase** database (registrations table)
- Success toast notification on submit

### 7. Contact Section
- Contact info: placeholder email and phone
- Simple contact form or info display

### 8. Footer
- College name placeholder
- Social media icons (Instagram, LinkedIn, YouTube) using Lucide icons
- Contact details
- "© 2026 Tech Carnival – All Rights Reserved"

## Backend (Supabase via Lovable Cloud)
- **registrations** table: id, name, email, phone, college, selected_event, created_at
- No auth required — public registration form
