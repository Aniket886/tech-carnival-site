import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useSiteVisibility } from "@/hooks/useSiteVisibility";

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
  const { isSectionVisible } = useSiteVisibility();

  const navLinks = allNavLinks.filter((link) => isSectionVisible(link.sectionKey));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "glass border-b shadow-lg" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <a href="#home" className="text-xl font-bold text-gradient">
          Tech Carnival
        </a>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </a>
          ))}
          {isSectionVisible("events") && (
            <Button asChild size="sm" className="neon-glow rounded-full px-5">
              <a href="#events">Register</a>
            </Button>
          )}
        </div>

        {/* Mobile */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-background border-border">
            <SheetTitle className="text-gradient">Tech Carnival</SheetTitle>
            <div className="flex flex-col gap-4 mt-8">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-lg text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </a>
              ))}
              {isSectionVisible("events") && (
                <Button asChild className="neon-glow mt-4 rounded-full">
                  <a href="#events" onClick={() => setOpen(false)}>
                    Register Now
                  </a>
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
};

export default Navbar;
