import { Mail, Phone, MapPin, ArrowUp, Instagram, Globe } from "lucide-react";

const Footer = () => {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="relative border-t border-border/40">
      <div className="absolute inset-0 bg-card/60 backdrop-blur-sm" />

      <div className="relative z-10 container mx-auto px-4">
        {/* Main row */}
        <div className="py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <h3 className="font-display text-lg font-bold text-foreground tracking-wide">
              Tech Carnival <span className="text-primary">2K26</span>
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-[240px]">
              Innovation meets celebration.<br />
              GM University, Davangere.
            </p>
            <div className="flex gap-2 pt-1">
              <a href="https://instagram.com/techcarnival2k26" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-8 h-8 rounded-md border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-all duration-200">
                <Instagram size={14} />
              </a>
              <a href="https://techcarnival.online" target="_blank" rel="noopener noreferrer" aria-label="Website" className="w-8 h-8 rounded-md border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-all duration-200">
                <Globe size={14} />
              </a>
            </div>
          </div>

          {/* Navigate */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60 mb-3">Navigate</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
              {["Events", "Schedule", "Leaderboard", "Register", "Contact", "FAQ"].map((item) => (
                <a key={item} href={`#${item.toLowerCase()}`} className="text-xs text-muted-foreground hover:text-foreground transition-colors py-0.5">
                  {item}
                </a>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60 mb-3">Contact</p>
            <div className="space-y-2.5">
              <a href="mailto:info@techcarnival.online" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <Mail size={13} className="text-primary/70 shrink-0" />
                info@techcarnival.online
              </a>
              <a href="tel:+918073491988" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <Phone size={13} className="text-primary/70 shrink-0" />
                +91 80734 91988
              </a>
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <MapPin size={13} className="text-primary/70 shrink-0 mt-0.5" />
                P.B. Road, Davangere<br />577006, Karnataka
              </div>
            </div>
          </div>

          {/* Back to top */}
          <div className="flex flex-col items-start lg:items-end justify-between">
            <button
              onClick={scrollToTop}
              className="group w-9 h-9 rounded-md border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-all duration-200"
              aria-label="Back to top"
            >
              <ArrowUp size={14} className="group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border/30 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[11px] text-muted-foreground/50">
            © {new Date().getFullYear()} Tech Carnival 2K26 · GM University
          </p>
          <p className="text-[11px] text-muted-foreground/40">
            Built with <span className="text-destructive/60">♥</span> by FCIT Tech Team
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
