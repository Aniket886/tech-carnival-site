import { useState, useEffect, useRef } from "react";
import CountdownTimer from "@/components/home/CountdownTimer";
import { Instagram, Linkedin, Youtube, Zap } from "lucide-react";
import { motion } from "framer-motion";

/* ── Animated grid background ── */
const GridBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Grid lines */}
    <div
      className="absolute inset-0 opacity-[0.04]"
      style={{
        backgroundImage:
          "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }}
    />
    {/* Radial fade over grid */}
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background))_70%)]" />

    {/* Floating orbs */}
    <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-[hsl(var(--neon-blue))] opacity-[0.06] blur-[150px] animate-[blob-float_12s_ease-in-out_infinite]" />
    <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-[hsl(var(--neon-purple))] opacity-[0.06] blur-[130px] animate-[blob-float_15s_ease-in-out_infinite_reverse]" />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-[hsl(var(--primary))] opacity-[0.03] blur-[100px] animate-[pulse-glow_4s_ease-in-out_infinite]" />

    {/* Scan line effect */}
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[hsl(var(--primary)/0.15)] to-transparent animate-[scan_8s_linear_infinite]"
        style={{ top: "0%" }}
      />
    </div>
  </div>
);

/* ── Glitch text effect ── */
const GlitchText = ({ children }: { children: string }) => (
  <span className="relative inline-block">
    <span className="relative z-10">{children}</span>
    <span
      className="absolute inset-0 text-[hsl(var(--neon-blue))] opacity-0 animate-[glitch-1_3s_ease-in-out_infinite]"
      aria-hidden
    >
      {children}
    </span>
    <span
      className="absolute inset-0 text-[hsl(var(--neon-purple))] opacity-0 animate-[glitch-2_3s_ease-in-out_infinite]"
      aria-hidden
    >
      {children}
    </span>
  </span>
);

/* ── Floating particles ── */
const Particles = () => {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-[hsl(var(--primary))]"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

/* ── Status indicator ── */
const StatusPulse = () => (
  <div className="flex items-center gap-2.5 px-4 py-2 rounded-full border border-primary/20 bg-primary/5">
    <span className="relative flex h-2.5 w-2.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(var(--neon-blue))] opacity-75" />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[hsl(var(--neon-blue))] shadow-[0_0_8px_hsl(var(--neon-blue)/0.6)]" />
    </span>
    <span className="text-xs font-medium tracking-wider uppercase text-primary">
      System Upgrading
    </span>
  </div>
);

const socials = [
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Youtube, href: "#", label: "YouTube" },
];

const MaintenancePage = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center relative overflow-hidden">
      <GridBackground />
      <Particles />

      <div className="relative z-10 flex flex-col items-center max-w-2xl">
        {/* Status badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <StatusPulse />
        </motion.div>

        {/* Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 mb-6 relative"
        >
          <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center backdrop-blur-sm shadow-[0_0_40px_hsl(var(--primary)/0.15)]">
            <Zap className="w-9 h-9 text-primary" strokeWidth={1.5} />
          </div>
          {/* Glow ring */}
          <div className="absolute inset-0 rounded-2xl animate-[pulse-glow_3s_ease-in-out_infinite] border border-primary/10" />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-4xl sm:text-5xl md:text-6xl font-bold font-display tracking-tight mb-4"
        >
          <span className="text-gradient">
            <GlitchText>Tech Carnival</GlitchText>
          </span>
          <br />
          <span className="text-foreground text-2xl sm:text-3xl md:text-4xl font-semibold tracking-widest opacity-80">
            2K26
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-lg sm:text-xl text-foreground/80 mb-2 font-medium"
        >
          We're building something extraordinary
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-sm text-muted-foreground max-w-md mb-10"
        >
          Our systems are currently being upgraded with cutting-edge tech. We'll be back online shortly.
        </motion.p>

        {/* Countdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mb-12"
        >
          <p className="text-xs text-muted-foreground uppercase tracking-[0.2em] mb-4 font-medium">
            Launching In
          </p>
          <CountdownTimer />
        </motion.div>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="w-48 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent mb-8"
        />

        {/* Social links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex justify-center gap-3"
        >
          {socials.map(({ icon: Icon, href, label }) => (
            <a
              key={label}
              href={href}
              aria-label={label}
              className="group relative w-12 h-12 rounded-xl glass flex items-center justify-center text-muted-foreground hover:text-primary transition-all duration-300 hover:shadow-[0_0_20px_hsl(var(--primary)/0.2)] hover:border-primary/30 min-w-[48px] min-h-[48px]"
            >
              <Icon size={20} className="transition-transform duration-300 group-hover:scale-110" />
            </a>
          ))}
        </motion.div>

        {/* Bottom tag */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="mt-12 text-xs text-muted-foreground/50 tracking-wider"
        >
          GM University • Davangere
        </motion.p>
      </div>

      {/* Inline keyframes for scan & glitch */}
      <style>{`
        @keyframes scan {
          0% { top: -2px; }
          100% { top: 100%; }
        }
        @keyframes glitch-1 {
          0%, 90%, 100% { opacity: 0; transform: translate(0); }
          92% { opacity: 0.7; transform: translate(2px, -1px); }
          94% { opacity: 0; transform: translate(-2px, 1px); }
          96% { opacity: 0.5; transform: translate(1px, 2px); }
        }
        @keyframes glitch-2 {
          0%, 88%, 100% { opacity: 0; transform: translate(0); }
          91% { opacity: 0.6; transform: translate(-2px, 1px); }
          93% { opacity: 0; transform: translate(2px, -2px); }
          95% { opacity: 0.4; transform: translate(-1px, -1px); }
        }
      `}</style>
    </div>
  );
};

export default MaintenancePage;
