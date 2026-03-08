import { Mail, Phone, MapPin, Github, Instagram, Globe, ArrowUpRight } from "lucide-react";

const quickLinks = [
  { label: "Events", href: "#events" },
  { label: "Schedule", href: "#schedule" },
  { label: "Leaderboard", href: "#leaderboard" },
  { label: "Register", href: "#register" },
  { label: "Contact", href: "#contact" },
];

const socialLinks = [
  { icon: Instagram, href: "https://instagram.com/techcarnival2k26", label: "Instagram" },
  { icon: Globe, href: "https://techcarnival.online", label: "Website" },
];

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 bg-gradient-to-t from-card via-background to-background" />
      <div className="absolute bottom-0 left-1/3 w-96 h-96 rounded-full bg-primary/5 blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full bg-accent/5 blur-[120px]" />

      {/* Top edge line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="relative z-10 container mx-auto px-4 pt-16 pb-8">
        {/* Grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-12">
          {/* Brand column */}
          <div className="md:col-span-5 space-y-4">
            <h3 className="font-display text-2xl font-bold gradient-text tracking-wide">
              Tech Carnival 2K26
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              Where innovation meets celebration. A multi-day inter-college tech fest hosted by GM University, Davangere — featuring competitions, workshops, and unforgettable experiences.
            </p>
            <div className="flex gap-2 pt-2">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="w-9 h-9 rounded-lg border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all duration-300"
                >
                  <s.icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div className="md:col-span-3">
            <h4 className="font-display text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="group text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
                  >
                    {link.label}
                    <ArrowUpRight size={12} className="opacity-0 -translate-y-0.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact info */}
          <div className="md:col-span-4">
            <h4 className="font-display text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
              Get in Touch
            </h4>
            <div className="space-y-3">
              <a
                href="mailto:info@techcarnival.online"
                className="group flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Mail size={14} className="text-primary" />
                </div>
                info@techcarnival.online
              </a>
              <a
                href="tel:+918073491988"
                className="group flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Phone size={14} className="text-primary" />
                </div>
                +91 80734 91988
              </a>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <MapPin size={14} className="text-accent" />
                </div>
                P.B. Road, Davangere – 577006, Karnataka
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6">
          <p className="text-xs text-muted-foreground/70">
            © {year} Tech Carnival 2K26 · GM University · All Rights Reserved
          </p>
          <p className="text-xs text-muted-foreground/40">
            Crafted with <span className="text-red-400">♥</span> by FCIT Tech Team
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
