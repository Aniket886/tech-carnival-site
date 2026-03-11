import { useState, useEffect, useRef } from "react";
import CountdownTimer from "@/components/home/CountdownTimer";
import { Instagram, Linkedin, Youtube } from "lucide-react";
import { motion } from "framer-motion";

const MaintenancePage = () => {
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      });
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center overflow-hidden select-none"
    >
      {/* Cinematic spotlight that follows cursor */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-700"
        style={{
          background: `radial-gradient(ellipse 45% 55% at ${mousePos.x * 100}% ${mousePos.y * 100}%, hsl(var(--primary) / 0.12) 0%, transparent 70%)`,
        }}
      />

      {/* Dramatic side beams */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(105deg, hsl(var(--secondary) / 0.06) 0%, transparent 30%, transparent 70%, hsl(var(--primary) / 0.06) 100%)",
        }}
      />

      {/* Top vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, transparent 40%, hsl(var(--background)) 100%)",
        }}
      />

      {/* Bottom fog */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-1/3"
        style={{
          background:
            "linear-gradient(to top, hsl(var(--primary) / 0.04) 0%, transparent 100%)",
        }}
      />

      {/* Floating particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-primary/20"
          style={{
            width: Math.random() * 3 + 1,
            height: Math.random() * 3 + 1,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30 - Math.random() * 40, 0],
            opacity: [0, 0.8, 0],
          }}
          transition={{
            duration: 4 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Content */}
      <div className="relative z-10 space-y-10 max-w-2xl">
        {/* Overline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex items-center justify-center gap-3"
        >
          <span className="h-px w-10 bg-primary/40" />
          <span className="text-xs tracking-[0.4em] uppercase text-primary font-medium">
            Coming Soon
          </span>
          <span className="h-px w-10 bg-primary/40" />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="text-5xl sm:text-7xl lg:text-8xl font-display font-black leading-none gradient-text drop-shadow-lg"
        >
          Tech Carnival
        </motion.h1>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-3xl sm:text-5xl font-display font-bold text-foreground/80 tracking-widest text-glow"
        >
          2K26
        </motion.h2>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.1 }}
          className="text-lg sm:text-xl text-muted-foreground max-w-md mx-auto"
        >
          We're crafting something extraordinary. Stay tuned for the ultimate
          tech celebration.
        </motion.p>

        {/* Countdown */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 1.4 }}
          className="flex justify-center pt-2"
        >
          <CountdownTimer />
        </motion.div>

        {/* Status badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.7 }}
          className="flex justify-center"
        >
          <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm tracking-wider">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            Under Construction
          </div>
        </motion.div>

        {/* Socials */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 2 }}
          className="flex justify-center gap-4 pt-4"
        >
          {[
            { icon: Instagram, href: "#", label: "Instagram" },
            { icon: Linkedin, href: "#", label: "LinkedIn" },
            { icon: Youtube, href: "#", label: "YouTube" },
          ].map(({ icon: Icon, href, label }) => (
            <a
              key={label}
              href={href}
              aria-label={label}
              className="w-11 h-11 rounded-lg glass flex items-center justify-center text-muted-foreground hover:text-primary hover:neon-border transition-all duration-300"
            >
              <Icon size={18} />
            </a>
          ))}
        </motion.div>
      </div>

      {/* Horizontal rule accent at bottom */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.5, delay: 2.2, ease: "easeOut" }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 w-40 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
      />
    </div>
  );
};

export default MaintenancePage;
