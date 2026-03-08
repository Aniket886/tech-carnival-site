import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

interface VisibleSection {
  section_key: string;
  section_name: string;
}

const sectionToNav: Record<string, { label: string; href: string }> = {
  hero: { label: "Home", href: "#home" },
  about: { label: "About", href: "#about" },
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

  const navLinks = visibleSections
    ? visibleSections.filter((s) => sectionToNav[s.section_key]).map((s) => sectionToNav[s.section_key])
    : Object.values(sectionToNav);

  const showRegister = visibleSections ? visibleSections.some((s) => s.section_key === "registration") : true;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNav = (href: string) => {
    setMobileOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav role="navigation" aria-label="Main navigation" className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled || mobileOpen ? "glass-strong shadow-lg" : "bg-transparent"}`}>
      <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <button onClick={() => handleNav("#home")} className="font-bold text-lg tracking-wider gradient-text">Tech Carnival</button>
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <button key={link.href} onClick={() => handleNav(link.href)} className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 tracking-wide">{link.label}</button>
          ))}
          {showRegister && <Button variant="neon" size="sm" onClick={() => handleNav("#register")}>Register</Button>}
        </div>
        <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${mobileOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="glass-strong border-t border-border">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
            {navLinks.map((link) => (
              <button key={link.href} onClick={() => handleNav(link.href)} className="text-sm text-muted-foreground hover:text-primary transition-colors py-2 text-left tracking-wide">{link.label}</button>
            ))}
            {showRegister && <Button variant="neon" size="sm" onClick={() => handleNav("#register")}>Register</Button>}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
