import { Instagram, Linkedin, Youtube, Mail, Phone } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-primary/10 py-12 relative">
    {/* Top glow line */}
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

    <div className="container mx-auto px-4">
      <div className="grid sm:grid-cols-3 gap-8 items-start">
        {/* Brand */}
        <div className="text-center sm:text-left">
          <p className="font-black text-gradient text-xl mb-2 italic">Tech Carnival 2K26</p>
          <p className="text-sm text-muted-foreground">GM University P.B. Road, Davanagere</p>
          <p className="text-sm text-muted-foreground">Davangere – 577006 Karnataka,</p>
        </div>

        {/* Contact Us */}
        <div className="text-center space-y-3">
          <p className="font-bold text-foreground uppercase tracking-[0.15em] text-sm mb-4">Contact Us</p>
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Mail className="h-3.5 w-3.5 text-primary" /> aniket.gmu@gmail.com
          </p>
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Phone className="h-3.5 w-3.5 text-primary" /> +918073491988
          </p>
        </div>

        {/* Follow Us */}
        <div className="text-center sm:text-right">
          <p className="font-bold text-foreground uppercase tracking-[0.15em] text-sm mb-4">Follow Us</p>
          <div className="flex items-center justify-center sm:justify-end gap-3">
            <a href="#" className="w-10 h-10 rounded-full border border-border bg-card/30 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-all" aria-label="Instagram">
              <Instagram className="h-4 w-4" />
            </a>
            <a href="#" className="w-10 h-10 rounded-full border border-border bg-card/30 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-all" aria-label="LinkedIn">
              <Linkedin className="h-4 w-4" />
            </a>
            <a href="#" className="w-10 h-10 rounded-full border border-border bg-card/30 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-all" aria-label="YouTube">
              <Youtube className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-border/50 text-center space-y-1">
        <p className="text-xs text-muted-foreground">© 2026 Tech Carnival – All Rights Reserved</p>
        <p className="text-xs text-muted-foreground">Developing By Aniket Tegginamath</p>
      </div>
    </div>
  </footer>
);

export default Footer;
