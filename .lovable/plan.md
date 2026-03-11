

# Mobile Responsiveness Improvements

## Changes Overview

### 1. Navbar — Enhanced Mobile Drawer (`src/components/Navbar.tsx`)
The existing Sheet-based mobile menu already works but needs polish:
- Add staggered entry animations for each nav link using framer-motion
- Increase tap targets to minimum 44px height (currently `py-2.5` = ~40px, bump to `py-3`)
- Add section icons next to each nav link for visual clarity
- Add a subtle backdrop blur overlay effect (already has `bg-background/80 backdrop-blur-2xl` — good)
- Add active section indicator dot/line animation in mobile drawer

### 2. Gallery — Swipeable Carousel on Mobile (`src/components/home/GallerySection.tsx`)
- Use `embla-carousel-react` (already installed) to render a horizontal swipeable carousel on mobile (`< md` breakpoint)
- Keep the existing masonry grid for desktop (`>= md`)
- Use `useIsMobile()` hook to switch between layouts
- Show dot indicators below the carousel for pagination
- Captions always visible on mobile (no hover state on touch)
- Lightbox: add swipe left/right to navigate between images

### 3. Global Touch-Friendly Tap Targets
- Category filter buttons in Gallery: increase to `min-h-[44px] px-5 py-2.5`
- Pagination buttons: increase to `min-w-[44px] min-h-[44px]`
- FAQ accordion triggers: ensure `min-h-[48px]`
- Contact coordinator cards: ensure phone/email links have `min-h-[44px]` tap areas
- Lightbox close button: increase to `p-3` (48px touch target)

### Files to Modify
1. **`src/components/Navbar.tsx`** — Staggered mobile link animations, larger tap targets, section icons
2. **`src/components/home/GallerySection.tsx`** — Embla carousel for mobile, swipeable lightbox, always-visible captions on mobile, larger filter/pagination buttons
3. **`src/components/home/FAQSection.tsx`** — Larger accordion tap targets
4. **`src/components/home/ContactSection.tsx`** — Larger phone/email link tap areas

