import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Calendar, Rocket, Sparkles } from "lucide-react";

const EVENT_DATE = new Date("2026-03-28T09:00:00");

const calcTimeLeft = () => {
  const diff = EVENT_DATE.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
};

const CountdownUnit = ({ value, label, delay }: { value: number; label: string; delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="flex flex-col items-center group"
  >
    <div className="relative">
      {/* Outer glow ring */}
      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-b from-primary/20 to-accent/20 blur-sm opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative w-18 h-18 sm:w-24 sm:h-24 rounded-2xl bg-card/60 border border-primary/20 flex items-center justify-center backdrop-blur-xl overflow-hidden">
        {/* Inner scanline effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-accent/5" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
        <span className="relative text-3xl sm:text-4xl font-mono font-black text-primary tracking-wider tabular-nums drop-shadow-[0_0_12px_hsl(var(--primary)/0.5)]">
          {String(value).padStart(2, "0")}
        </span>
      </div>
    </div>
    <span className="text-[10px] sm:text-xs text-muted-foreground mt-3 uppercase tracking-[0.25em] font-semibold">{label}</span>
  </motion.div>
);

/* Floating particle component */
const CosmicParticle = ({ delay, x, y, size }: { delay: number; x: string; y: string; size: number }) => (
  <motion.div
    className="absolute rounded-full bg-primary/40"
    style={{ left: x, top: y, width: size, height: size }}
    animate={{
      opacity: [0, 0.8, 0],
      scale: [0.5, 1.2, 0.5],
      y: [0, -30, 0],
    }}
    transition={{
      duration: 4,
      delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  />
);

const Hero = () => {
  const [time, setTime] = useState(calcTimeLeft());

  useEffect(() => {
    const id = setInterval(() => setTime(calcTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  const particles = [
    { delay: 0, x: "10%", y: "20%", size: 3 },
    { delay: 1.2, x: "80%", y: "15%", size: 2 },
    { delay: 0.5, x: "25%", y: "70%", size: 4 },
    { delay: 2, x: "70%", y: "60%", size: 2 },
    { delay: 0.8, x: "50%", y: "30%", size: 3 },
    { delay: 1.5, x: "90%", y: "80%", size: 2 },
    { delay: 0.3, x: "15%", y: "85%", size: 3 },
    { delay: 2.5, x: "60%", y: "10%", size: 2 },
  ];

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Starfield */}
      <div className="starfield" />

      {/* Cosmic nebula layers */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/3 w-[700px] h-[700px] bg-primary/6 rounded-full blur-[200px] animate-pulse-glow" />
        <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-accent/8 rounded-full blur-[180px] animate-pulse-glow" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[400px] bg-secondary/4 rounded-full blur-[250px] rotate-12" />
      </div>

      {/* Orbital rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] sm:w-[800px] sm:h-[800px] rounded-full border border-primary/5 -z-5 animate-[spin_60s_linear_infinite]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] sm:w-[550px] sm:h-[550px] rounded-full border border-accent/5 -z-5 animate-[spin_45s_linear_infinite_reverse]" />

      {/* Floating particles */}
      {particles.map((p, i) => (
        <CosmicParticle key={i} {...p} />
      ))}

      {/* Grid overlay */}
      <div className="absolute inset-0 -z-5 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
        backgroundSize: "80px 80px",
      }} />

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background via-background/80 to-transparent z-10" />

      <div className="container mx-auto px-4 text-center relative z-10">
        {/* Date badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-center mb-6"
        >
          <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-md shadow-[0_0_20px_hsl(var(--primary)/0.08)]">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold tracking-[0.2em] text-primary/90 uppercase">
              March 27–28, 2026
            </span>
          </div>
        </motion.div>

        {/* Glitch-style title */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-2"
        >
          <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-[10rem] font-black tracking-tighter text-gradient leading-[0.85] drop-shadow-[0_0_40px_hsl(var(--primary)/0.2)]">
            TECH
          </h1>
          <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-[10rem] font-black tracking-tighter leading-[0.85]">
            <span className="text-gradient drop-shadow-[0_0_40px_hsl(var(--accent)/0.2)]">CARNIVAL</span>
          </h1>
        </motion.div>

        {/* Year with circuit line accents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="flex items-center justify-center gap-4 mb-4"
        >
          <div className="h-px w-16 sm:w-24 bg-gradient-to-r from-transparent via-primary/40 to-primary/10">
            <div className="w-1.5 h-1.5 rounded-full bg-primary/60 ml-auto -mt-[2px]" />
          </div>
          <span className="text-2xl sm:text-3xl md:text-4xl font-black tracking-[0.3em] text-gradient opacity-70 font-mono">
            2K26
          </span>
          <div className="h-px w-16 sm:w-24 bg-gradient-to-l from-transparent via-accent/40 to-accent/10">
            <div className="w-1.5 h-1.5 rounded-full bg-accent/60 mr-auto -mt-[2px]" />
          </div>
        </motion.div>

        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35 }}
          className="flex items-center justify-center gap-3 mb-14"
        >
          <Sparkles className="h-3.5 w-3.5 text-accent/60" />
          <p className="text-sm sm:text-base text-muted-foreground tracking-[0.15em] uppercase font-medium">
            Innovation Meets Celebration
          </p>
          <Sparkles className="h-3.5 w-3.5 text-primary/60" />
        </motion.div>

        {/* Countdown */}
        <div className="flex justify-center gap-3 sm:gap-5 mb-14">
          <CountdownUnit value={time.days} label="Days" delay={0.45} />
          <div className="flex items-center text-primary/30 text-2xl font-light self-start mt-6 sm:mt-8">:</div>
          <CountdownUnit value={time.hours} label="Hours" delay={0.5} />
          <div className="flex items-center text-primary/30 text-2xl font-light self-start mt-6 sm:mt-8">:</div>
          <CountdownUnit value={time.minutes} label="Minutes" delay={0.55} />
          <div className="flex items-center text-primary/30 text-2xl font-light self-start mt-6 sm:mt-8">:</div>
          <CountdownUnit value={time.seconds} label="Seconds" delay={0.6} />
        </div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button asChild size="lg" className="relative text-base px-8 py-6 rounded-full gap-2 overflow-hidden group bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_30px_hsl(var(--primary)/0.3)] hover:shadow-[0_0_50px_hsl(var(--primary)/0.5)] transition-shadow duration-500">
            <a href="#events">
              <span className="absolute inset-0 bg-gradient-to-r from-primary via-accent/30 to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Rocket className="h-4 w-4 relative z-10" />
              <span className="relative z-10">Register Now</span>
            </a>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-base px-8 py-6 rounded-full border-primary/20 hover:bg-primary/5 hover:border-primary/40 text-foreground backdrop-blur-sm transition-all duration-300">
            <a href="#about">Learn More →</a>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
