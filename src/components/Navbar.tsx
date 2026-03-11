import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Menu, Rocket, Home, Info, CalendarDays, Clock, HelpCircle, MessageSquare } from "lucide-react";
import { useSiteVisibility } from "@/hooks/useSiteVisibility";
import { motion, AnimatePresence } from "framer-motion";

const sectionIcons: Record<string, React.ReactNode> = {
  home: <Home className="h-4 w-4" />,
  about: <Info className="h-4 w-4" />,
  events: <CalendarDays className="h-4 w-4" />,
  schedule: <Clock className="h-4 w-4" />,
  faq: <HelpCircle className="h-4 w-4" />,
  contact: <MessageSquare className="h-4 w-4" />,
};

const allNavLinks = [
  { label: "Home", href: "#home", sectionKey: "hero" },
  { label: "About", href: "#about", sectionKey: "about" },
  { label: "Events", href: "#events", sectionKey: "events" },
  { label: "Schedule", href: "#schedule", sectionKey: "schedule" },
  { label: "FAQ", href: "#faq", sectionKey: "faq" },
  { label: "Contact", href: "#contact", sectionKey: "contact" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const { isSectionVisible } = useSiteVisibility();

  const navLinks = allNavLinks.filter((link) => isSectionVisible(link.sectionKey));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
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

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-background/40 backdrop-blur-2xl border-b border-primary/10 shadow-[0_4px_30px_hsl(var(--primary)/0.05)]"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        {/* Logo */}
        <a href="#home" className="text-xl font-black tracking-tight text-gradient relative group">
          Tech Carnival
          <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-gradient-to-r from-primary to-accent group-hover:w-full transition-all duration-300" />
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = activeSection === link.href.replace("#", "");
            return (
              <a
                key={link.href}
                href={link.href}
                className={`relative px-3.5 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full bg-primary/10 border border-primary/20"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{link.label}</span>
              </a>
            );
          })}
          {isSectionVisible("events") && (
            <Button asChild size="sm" className="ml-3 rounded-full px-5 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_hsl(var(--primary)/0.25)] hover:shadow-[0_0_30px_hsl(var(--primary)/0.4)] transition-shadow duration-300">
              <a href="#events">
                <Rocket className="h-3.5 w-3.5" />
                Register
              </a>
            </Button>
          )}
        </div>

        {/* Mobile */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="text-foreground hover:bg-primary/10 min-w-[44px] min-h-[44px]">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-background/80 backdrop-blur-2xl border-primary/10 w-[280px]">
            <SheetTitle className="text-gradient font-black text-lg">Tech Carnival</SheetTitle>
            <div className="flex flex-col gap-1.5 mt-8">
              <AnimatePresence>
                {open && navLinks.map((link, i) => {
                  const isActive = activeSection === link.href.replace("#", "");
                  const sectionId = link.href.replace("#", "");
                  return (
                    <motion.a
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.25, ease: "easeOut" }}
                      className={`flex items-center gap-3 text-base px-4 py-3 min-h-[48px] rounded-xl transition-all duration-200 ${
                        isActive
                          ? "text-primary bg-primary/10 border border-primary/20 font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                      }`}
                    >
                      <span className={isActive ? "text-primary" : "text-muted-foreground"}>
                        {sectionIcons[sectionId] || sectionIcons["home"]}
                      </span>
                      {link.label}
                      {isActive && (
                        <motion.div
                          layoutId="mobile-active-dot"
                          className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)]"
                        />
                      )}
                    </motion.a>
                  );
                })}
              </AnimatePresence>
              {isSectionVisible("events") && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: navLinks.length * 0.05 + 0.1, duration: 0.25 }}
                >
                  <Button asChild className="mt-4 w-full rounded-full gap-2 min-h-[48px] shadow-[0_0_20px_hsl(var(--primary)/0.25)]">
                    <a href="#events" onClick={() => setOpen(false)}>
                      <Rocket className="h-4 w-4" />
                      Register Now
                    </a>
                  </Button>
                </motion.div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </motion.nav>
  );
};

export default Navbar;
