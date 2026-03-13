import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface VisibleSection {
  section_key: string;
  section_name: string;
}

const sectionToNav: Record<string, { label: string; href: string }> = {
  hero: { label: "Home", href: "#home" },
  about: { label: "About", href: "#about" },
  how_to_register: { label: "How to Register", href: "#how-to-register" },
  events: { label: "Events", href: "#events" },
  schedule: { label: "Schedule", href: "#schedule" },
  faq: { label: "FAQ", href: "#faq" },
  contact: { label: "Contact", href: "#contact" },
};

interface NavbarProps {
  visibleSections?: VisibleSection[];
}

const Navbar = ({ visibleSections }: NavbarProps) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  const navLinks = visibleSections
    ? visibleSections.filter((s) => sectionToNav[s.section_key]).map((s) => sectionToNav[s.section_key])
    : Object.values(sectionToNav);

  const showRegister = visibleSections ? visibleSections.some((s) => s.section_key === "registration") : true;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    navLinks.forEach((link) => {
      const id = link.href.replace("#", "");
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id);
        },
        { threshold: 0.3 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [navLinks]);

  const handleNav = (href: string) => {
    setMobileOpen(false);
    setTimeout(() => {
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    }, 400);
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!navRef.current) return;
    const rect = navRef.current.getBoundingClientRect();
    setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  return (
    <motion.nav
      ref={navRef}
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      role="navigation"
      aria-label="Main navigation"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 overflow-hidden ${
        scrolled || mobileOpen
          ? "liquid-glass border-b border-primary/10"
          : "bg-transparent"
      }`}
    >
      {/* Cursor-following liquid glass glow — desktop only */}
      <div
        className="hidden md:block pointer-events-none absolute rounded-full transition-opacity duration-300"
        style={{
          width: 220,
          height: 220,
          left: cursorPos.x - 110,
          top: cursorPos.y - 110,
          opacity: isHovering ? 1 : 0,
          background: "radial-gradient(circle, hsl(195 100% 50% / 0.12) 0%, hsl(270 80% 60% / 0.06) 40%, transparent 70%)",
          filter: "blur(20px)",
        }}
      />

      {scrolled && (
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      )}

      <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between h-16 relative z-10">
        <button
          onClick={() => handleNav("#home")}
          className="font-bold text-lg tracking-wider text-gradient relative group"
        >
          Tech Carnival
          <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-gradient-to-r from-primary to-accent group-hover:w-full transition-all duration-300" />
        </button>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const id = link.href.replace("#", "");
            const isActive = activeSection === id;
            return (
              <button
                key={link.href}
                onClick={() => handleNav(link.href)}
                className={`relative px-3.5 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-liquid-pill"
                    className="absolute inset-0 rounded-full liquid-glass-intense"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{link.label}</span>
              </button>
            );
          })}
          {showRegister && (
            <Button
              variant="neon"
              size="sm"
              className="ml-3 rounded-full px-5"
              onClick={() => handleNav("#events")}
            >
              Register
            </Button>
          )}
        </div>

        <button
          className="md:hidden text-foreground p-2 min-w-[44px] min-h-[44px] rounded-xl hover:bg-primary/10 transition-colors relative z-50"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label="Toggle menu"
          type="button"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden overflow-hidden"
          >
            <div className="liquid-glass-intense border-t border-primary/10">
              <div className="container mx-auto px-4 py-4 flex flex-col gap-1.5">
                {navLinks.map((link, i) => {
                  const id = link.href.replace("#", "");
                  const isActive = activeSection === id;
                  return (
                    <motion.button
                      key={link.href}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.25 }}
                      onClick={() => handleNav(link.href)}
                      className={`text-sm py-3 px-4 text-left tracking-wide rounded-xl transition-all duration-200 ${
                        isActive
                          ? "text-primary bg-primary/10 border border-primary/20 font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                      }`}
                    >
                      {link.label}
                      {isActive && (
                        <motion.span
                          layoutId="mobile-liquid-dot"
                          className="inline-block ml-2 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)]"
                        />
                      )}
                    </motion.button>
                  );
                })}
                {showRegister && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: navLinks.length * 0.05 + 0.1 }}
                    className="pt-2 pb-1"
                  >
                    <Button variant="neon" size="sm" className="w-full rounded-full" onClick={() => handleNav("#events")}>
                      Register
                    </Button>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
