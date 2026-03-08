import { Mail, Phone, MapPin, ArrowUp, Instagram, Globe } from "lucide-react";

const Footer = () => {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="relative">
      {/* Top glow line */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="bg-card/40 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-12">
          {/* Two-column layout */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">
            {/* Left — Brand + tagline */}
            <div className="space-y-4 max-w-xs">
              <h3 className="font-display text-xl font-bold tracking-wide">
                Tech Carnival <span className="text-primary">2K26</span>
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Where innovation meets celebration — a multi-day inter-college tech fest by GM University, Davangere.
              </p>
              <div className="flex gap-2">
                <a href="https://instagram.com/techcarnival2k26" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-9 h-9 rounded-full border border-border/40 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-all duration-200">
                  <Instagram size={15} />
                </a>
                <a href="https://techcarnival.online" target="_blank" rel="noopener noreferrer" aria-label="Website" className="w-9 h-9 rounded-full border border-border/40 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-all duration-200">
                  <Globe size={15} />
                </a>
              </div>
            </div>

            {/* Right — Contact + back to top */}
            <div className="flex flex-col sm:flex-row gap-8 sm:gap-14 items-start">
              <div className="space-y-3">
                <a href="mailto:info@techcarnival.online" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Mail size={14} className="text-primary" />
                  </div>
                  info@techcarnival.online
                </a>
                <a href="tel:+918073491988" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Phone size={14} className="text-primary" />
                  </div>
                  +91 80734 91988
                </a>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                    <MapPin size={14} className="text-accent" />
                  </div>
                  P.B. Road, Davangere – 577006
                </div>
              </div>

              <button
                onClick={scrollToTop}
                aria-label="Back to top"
                className="hidden md:flex w-10 h-10 rounded-full border border-border/40 items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-200 mt-1"
              >
                <ArrowUp size={16} />
              </button>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-10 pt-5 border-t border-border/20 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-[11px] text-muted-foreground/50">
              © {new Date().getFullYear()} Tech Carnival 2K26 · GM University · All Rights Reserved
            </p>
            <p className="text-[11px] text-muted-foreground/35">
              Built with <span className="text-destructive/50">♥</span> by FCIT Tech Team
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
