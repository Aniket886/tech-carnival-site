import { Instagram, Linkedin, Youtube } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border py-10">
    <div className="container mx-auto px-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="text-center sm:text-left">
          <p className="font-bold text-gradient text-lg">Tech Carnival – 2K26</p>
          <p className="text-sm text-muted-foreground mt-1">XYZ College of Engineering</p>
        </div>

        <div className="flex items-center gap-4">
          <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Instagram">
            <Instagram className="h-5 w-5" />
          </a>
          <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="LinkedIn">
            <Linkedin className="h-5 w-5" />
          </a>
          <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="YouTube">
            <Youtube className="h-5 w-5" />
          </a>
        </div>

        <div className="text-center sm:text-right text-sm text-muted-foreground">
          <p>techcarnival@college.edu | +91 98765 43210</p>
          <p className="mt-1">© 2026 Tech Carnival – All Rights Reserved</p>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
