import { Instagram, Linkedin, Youtube, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border py-12 relative">
    {/* Top glow line */}
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
    
    <div className="container mx-auto px-4">
      <div className="grid sm:grid-cols-3 gap-8 items-start">
        {/* Brand */}
        <div className="text-center sm:text-left">
          <p className="font-bold text-gradient text-xl mb-2">Tech Carnival</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">2K26</p>
          <p className="text-sm text-muted-foreground mt-2">XYZ College of Engineering</p>
        </div>

        {/* Social Links */}
        <div className="flex items-center justify-center gap-4">
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

        {/* Contact */}
        <div className="text-center sm:text-right space-y-1.5">
          <p className="text-sm text-muted-foreground flex items-center justify-center sm:justify-end gap-2">
            <Mail className="h-3.5 w-3.5 text-primary" /> techcarnival@college.edu
          </p>
          <p className="text-sm text-muted-foreground flex items-center justify-center sm:justify-end gap-2">
            <Phone className="h-3.5 w-3.5 text-primary" /> +91 98765 43210
          </p>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-border/50 text-center">
        <p className="text-xs text-muted-foreground">© 2026 Tech Carnival – All Rights Reserved</p>
      </div>
    </div>
  </footer>
);

export default Footer;
