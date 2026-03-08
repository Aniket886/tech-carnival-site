import { Instagram, Linkedin, Youtube, Mail, Phone } from "lucide-react";

const Footer = () => {
  return (
    <footer id="contact-footer" className="border-t border-border py-12 relative">
      <div className="absolute inset-0 bg-gradient-to-t from-card/30 to-transparent" />
      <div className="relative z-10 container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="font-bold text-lg gradient-text mb-3">Tech Carnival 2K26</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              GM University P.B. Road, Davanagere
              <br />
              Davangere - 577006 Karnataka,
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm tracking-wider uppercase text-foreground mb-3">Contact Us</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <a href="mailto:aniket.gmu@gmail.com" className="flex items-center gap-2 hover:text-primary transition-colors">
                <Mail size={14} /> aniket.gmu@gmail.com
              </a>
              <a href="tel:+918073491988" className="flex items-center gap-2 hover:text-primary transition-colors">
                <Phone size={14} /> +918073491988
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm tracking-wider uppercase text-foreground mb-3">Follow Us</h4>
            <div className="flex gap-4">
              {[
                { icon: Instagram, href: "#", label: "Instagram" },
                { icon: Linkedin, href: "#", label: "LinkedIn" },
                { icon: Youtube, href: "#", label: "YouTube" },
              ].map(({ icon: Icon, href, label }) => (
                <a key={label} href={href} aria-label={label} className="w-10 h-10 rounded-lg glass flex items-center justify-center text-muted-foreground hover:text-primary hover:neon-border transition-all duration-300">
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-border pt-6 text-center">
          <p className="text-xs text-muted-foreground">© 2026 Tech Carnival – 2K26 | Organized by GM University | All Rights Reserved</p>
          <p className="text-[11px] text-muted-foreground/60 mt-1">Made with ❤️ by FCIT Tech Team</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
