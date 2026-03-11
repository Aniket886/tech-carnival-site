import CountdownTimer from "@/components/home/CountdownTimer";
import { Instagram, Linkedin, Youtube } from "lucide-react";

const MaintenancePage = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
      <div className="space-y-8 max-w-lg">
        <div className="text-6xl">🛠️</div>
        <h1 className="text-3xl sm:text-4xl font-bold gradient-text">Tech Carnival – 2K26</h1>
        <p className="text-xl text-foreground">We're getting ready for something amazing!</p>
        <p className="text-muted-foreground">Tech Carnival – 2K26 is coming soon. Stay tuned!</p>
        <div className="py-4">
          <CountdownTimer />
        </div>
        <div className="flex justify-center gap-4 pt-4">
          {[
            { icon: Instagram, href: "#", label: "Instagram" },
            { icon: Linkedin, href: "#", label: "LinkedIn" },
            { icon: Youtube, href: "#", label: "YouTube" },
          ].map(({ icon: Icon, href, label }) => (
            <a
              key={label}
              href={href}
              aria-label={label}
              className="w-10 h-10 rounded-lg glass flex items-center justify-center text-muted-foreground hover:text-primary hover:neon-border transition-all duration-300"
            >
              <Icon size={18} />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage;

//Aniket
