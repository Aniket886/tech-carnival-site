import { Mail, Phone, MapPin, Instagram, Globe, ArrowUp } from "lucide-react";

const Footer = () => {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <footer className="relative overflow-hidden">
      {/* Top accent */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="bg-card/30 backdrop-blur-md border-t border-border/10">
        {/* Main footer */}
        <div className="container mx-auto px-4 pt-14 pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1 space-y-4">
              <h3 className="font-display text-lg font-bold tracking-wide">
                Tech Carnival <span className="text-primary">2K26</span>
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                A two-day National Level Technical Competition by GM University, Davangere.
              </p>
              <div className="flex gap-2 pt-1">
                {[
                  { href: "https://instagram.com/techcarnival2k26", icon: Instagram, label: "Instagram" },
                  { href: "https://www.gmu.ac.in", icon: Globe, label: "GM University" },
                ].map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="w-9 h-9 rounded-lg bg-muted/40 border border-border/30 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all duration-200"
                  >
                    <s.icon size={15} />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-foreground/60">Explore</h4>
              <nav className="flex flex-col gap-2">
                {["about", "events", "schedule", "leaderboard"].map((id) => (
                  <a
                    key={id}
                    href={`#${id}`}
                    onClick={(e) => scrollToSection(e, id)}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors capitalize w-fit"
                  >
                    {id === "faq" ? "FAQ" : id}
                  </a>
                ))}
              </nav>
            </div>

            {/* More Links */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-foreground/60">More</h4>
              <nav className="flex flex-col gap-2">
                {["faq", "contact"].map((id) => (
                  <a
                    key={id}
                    href={`#${id}`}
                    onClick={(e) => scrollToSection(e, id)}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors capitalize w-fit"
                  >
                    {id === "faq" ? "FAQ" : id}
                  </a>
                ))}
                <a
                  href="#events"
                  onClick={(e) => scrollToSection(e, "events")}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors capitalize w-fit"
                >
                  Register
                </a>
              </nav>
            </div>

            {/* Contact */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-foreground/60">Contact</h4>
              <div className="space-y-2.5">
                <a
                  href="mailto:info@techcarnival.online"
                  className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                >
                  <Mail size={14} className="text-primary shrink-0" />
                  <span>info@techcarnival.online</span>
                </a>
                <a
                  href="tel:+918073491988"
                  className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Phone size={14} className="text-primary shrink-0" />
                  <span>+91 8073491988</span>
                </a>
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <MapPin size={14} className="text-accent shrink-0" />
                  <span>P.B. Road, Davangere – 577006</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border/15">
          <div className="container mx-auto px-4 py-5 flex flex-col items-center gap-2 text-center">
            <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3 text-xs text-muted-foreground">
              <span>© {new Date().getFullYear()} Tech Carnival 2K26 · GM University</span>
              <span className="hidden sm:inline text-border/40">|</span>
              <span>
                Built with <span className="text-destructive">❤️</span> by FCIT Tech Team
              </span>
            </div>
            <span className="text-[10px] text-foreground/40 tracking-wide select-all">
              Developed by Aniket Tegginamath
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
