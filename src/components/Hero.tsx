import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

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
    <span className="text-[10px] sm:text-xs text-muted-foreground mt-2 uppercase tracking-[0.2em] font-medium">
      {label}
    </span>
  </div>
);

const Hero = () => {
  const [time, setTime] = useState(calcTimeLeft());

  useEffect(() => {
    const id = setInterval(() => setTime(calcTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Layer 1: Neon blue glow - top center */}
      <div
        className="pointer-events-none absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full opacity-30 blur-[120px]"
        style={{ background: "radial-gradient(ellipse at center, hsl(var(--primary)), transparent 70%)" }}
      />

      {/* Layer 2: Purple glow - bottom right */}
      <div
        className="pointer-events-none absolute bottom-[-15%] right-[-10%] w-[700px] h-[500px] rounded-full opacity-20 blur-[100px]"
        style={{ background: "radial-gradient(ellipse at center, hsl(var(--accent)), transparent 70%)" }}
      />

      {/* Layer 3: Angled neon beam streaks */}
      <div
        className="pointer-events-none absolute top-0 left-[10%] w-[2px] h-[60%] opacity-10 rotate-[15deg]"
        style={{ background: "linear-gradient(to bottom, transparent, hsl(var(--primary)), transparent)" }}
      />
      <div
        className="pointer-events-none absolute top-[20%] right-[15%] w-[1px] h-[50%] opacity-[0.07] -rotate-[20deg]"
        style={{ background: "linear-gradient(to bottom, transparent, hsl(var(--accent)), transparent)" }}
      />

      {/* Layer 4: Atmospheric fog near bottom */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-[30%] opacity-40"
        style={{ background: "linear-gradient(to top, hsl(var(--background)), transparent)" }}
      />

      {/* Star field */}
      <div className="starfield" />

      {/* Animated gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-[100px] animate-blob-float" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-[120px] animate-blob-float" style={{ animationDelay: "2s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-secondary/5 rounded-full blur-[150px] animate-blob-float" style={{ animationDelay: "4s" }} />

      <div className="relative z-10 container mx-auto px-4 text-center">
        {/* Content group */}
        <div className="flex flex-col items-center gap-1">
          {/* Date badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-primary/30 bg-primary/5 backdrop-blur-sm">
              <span className="text-sm">📅</span>
              <span className="text-sm font-medium tracking-[0.15em] text-primary uppercase">
                March 27-28, 2026
              </span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-extrabold tracking-tight text-gradient mb-2">
            Tech Carnival
          </h1>

          {/* 2K26 */}
          <div className="mb-4">
            <span className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-[0.15em] text-gradient opacity-80">
              2K26
            </span>
          </div>

          {/* Tagline */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <div className="h-px w-12 sm:w-20 bg-gradient-to-r from-transparent to-primary/40" />
            <p className="text-base sm:text-lg text-muted-foreground tracking-wide">
              Innovation Meets Celebration
            </p>
            <div className="h-px w-12 sm:w-20 bg-gradient-to-l from-transparent to-primary/40" />
          </div>
        </div>

        {/* Countdown */}
        <div className="flex justify-center gap-4 sm:gap-6 mb-12">
          <CountdownUnit value={time.days} label="Days" />
          <CountdownUnit value={time.hours} label="Hours" />
          <CountdownUnit value={time.minutes} label="Minutes" />
          <CountdownUnit value={time.seconds} label="Seconds" />
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild size="lg" className="neon-glow text-base px-8 py-6 rounded-full gap-2">
            <a href="#events">
              🚀 Register Now
            </a>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="text-base px-8 py-6 rounded-full border-primary/30 hover:bg-primary/10 hover:border-primary/50 text-foreground"
            onClick={() => document.querySelector("#about")?.scrollIntoView({ behavior: "smooth" })}
          >
            Learn More →
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
