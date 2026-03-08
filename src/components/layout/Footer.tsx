import { Mail, Phone, MapPin, Sparkles } from "lucide-react";

const Footer = () => {
  return (
    <footer id="contact-footer" className="relative py-5 overflow-hidden">
      {/* Glassmorphism background layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
      <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-2xl" />
      <div className="absolute top-0 left-1/4 w-72 h-72 rounded-full bg-primary/10 blur-[100px]" />
      <div className="absolute bottom-0 right-1/4 w-60 h-60 rounded-full bg-accent/10 blur-[100px]" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="relative z-10 container mx-auto px-4">
        {/* Main content */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-display text-2xl font-bold gradient-text tracking-wide">
              Tech Carnival 2K26
            </h3>
            <Sparkles className="h-5 w-5 text-accent" />
          </div>
          <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
            Where Innovation Meets Celebration — GM University, Davangere
          </p>
        </div>

        {/* Contact cards */}
        <div className="flex flex-wrap justify-center gap-4 mb-10">
          <a
            href="mailto:info@techcarnival.online"
            className="group flex items-center gap-3 px-5 py-3 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-sm hover:border-primary/40 hover:bg-primary/5 transition-all duration-300"
          >
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Mail size={16} className="text-primary" />
            </div>
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              info@techcarnival.online
            </span>
          </a>

          <a
            href="tel:+918073491988"
            className="group flex items-center gap-3 px-5 py-3 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-sm hover:border-primary/40 hover:bg-primary/5 transition-all duration-300"
          >
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Phone size={16} className="text-primary" />
            </div>
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              +91 80734 91988
            </span>
          </a>

          <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-sm">
            <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
              <MapPin size={16} className="text-accent" />
            </div>
            <span className="text-sm text-muted-foreground">
              P.B. Road, Davangere – 577006, Karnataka
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-6" />

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            © 2026 Tech Carnival – 2K26 · GM University · All Rights Reserved
          </p>
          <p className="text-xs text-muted-foreground/50">
            Made with <span className="text-red-400">❤️</span> by FCIT Tech Team
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
