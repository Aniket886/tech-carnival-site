import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Calendar, Rocket } from "lucide-react";

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

const CountdownUnit = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center">
    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-background/40 border border-primary/30 flex items-center justify-center backdrop-blur-sm shadow-[0_0_20px_hsl(var(--primary)/0.15),inset_0_1px_0_hsl(var(--primary)/0.1)]">
      <span className="text-2xl sm:text-3xl font-mono font-bold text-primary tracking-wider">
        {String(value).padStart(2, "0")}
      </span>
    </div>
    <span className="text-[10px] sm:text-xs text-muted-foreground mt-2 uppercase tracking-[0.2em] font-medium">{label}</span>
  </div>
);

const Hero = () => {
  const [time, setTime] = useState(calcTimeLeft());

  useEffect(() => {
    const id = setInterval(() => setTime(calcTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Starfield */}
      <div className="starfield" />

      {/* Gradient overlays */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-accent/8 rounded-full blur-[150px]" />
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />

      <div className="container mx-auto px-4 text-center relative z-10">
        {/* Date badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-primary/30 bg-primary/5 backdrop-blur-sm">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium tracking-[0.15em] text-primary uppercase">
              March 27-28, 2026
            </span>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-extrabold tracking-tight text-gradient mb-2"
        >
          Tech Carnival
        </motion.h1>

        {/* 2K26 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mb-6"
        >
          <span className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-[0.15em] text-gradient opacity-80">
            2K26
          </span>
        </motion.div>

        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex items-center justify-center gap-4 mb-12"
        >
          <div className="h-px w-12 sm:w-20 bg-gradient-to-r from-transparent to-primary/40" />
          <p className="text-base sm:text-lg text-muted-foreground tracking-wide">
            Innovation Meets Celebration
          </p>
          <div className="h-px w-12 sm:w-20 bg-gradient-to-l from-transparent to-primary/40" />
        </motion.div>

        {/* Countdown */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex justify-center gap-4 sm:gap-6 mb-12"
        >
          <CountdownUnit value={time.days} label="Days" />
          <CountdownUnit value={time.hours} label="Hours" />
          <CountdownUnit value={time.minutes} label="Minutes" />
          <CountdownUnit value={time.seconds} label="Seconds" />
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button asChild size="lg" className="neon-glow text-base px-8 py-6 rounded-full gap-2">
            <a href="#register">
              <Rocket className="h-4 w-4" />
              Register Now
            </a>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-base px-8 py-6 rounded-full border-primary/30 hover:bg-primary/10 hover:border-primary/50 text-foreground">
            <a href="#about">Learn More →</a>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
