import { Button } from "@/components/ui/button";
import CountdownTimer from "@/components/home/CountdownTimer";
import StarField from "@/components/home/StarField";

const Hero = () => {
  const scrollToRegister = () => {
    document.querySelector("#events")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* Layer 1: Neon blue glow - top center */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 60% 50% at 50% 20%, hsl(195 100% 50% / 0.12) 0%, transparent 70%)"
        }} />

      {/* Layer 2: Purple glow - bottom right */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 50% 60% at 75% 80%, hsl(270 80% 60% / 0.1) 0%, transparent 70%)"
        }} />

      {/* Layer 3: Angled neon beam streaks */}
      <div
        className="absolute inset-0"
        style={{
          background:
          "linear-gradient(135deg, hsl(195 100% 50% / 0.06) 0%, transparent 40%, transparent 60%, hsl(270 80% 60% / 0.05) 100%)"
        }} />

      <div
        className="absolute inset-0"
        style={{
          background:
          "linear-gradient(225deg, hsl(195 100% 50% / 0.04) 0%, transparent 35%, transparent 65%, hsl(270 80% 60% / 0.03) 100%)"
        }} />

      {/* Layer 4: Atmospheric fog near bottom */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to top, hsl(195 80% 70% / 0.04) 0%, transparent 30%)" }} />

      {/* Star field */}
      <StarField />

      {/* Animated gradient orbs - slightly more intense */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/15 blur-[120px] animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-accent/15 blur-[120px] animate-pulse-glow [animation-delay:1.5s]" />

      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="animate-fade-in-up">
          <div className="inline-block glass rounded-full px-5 py-2 mb-6 neon-border">
            <p className="text-primary font-display text-xs sm:text-sm tracking-[0.3em] uppercase">📅 MARCH 27-28, 2026</p>
          </div>
          <h1 className="text-5xl sm:text-7xl lg:text-9xl font-display font-black leading-none mb-3 gradient-text drop-shadow-lg">
            Tech Carnival
          </h1>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-display font-bold text-foreground/90 mb-6 tracking-wider text-glow">
            2K26
          </h2>
          <div className="flex items-center justify-center gap-3 mb-10">
            <span className="h-px w-12 bg-primary/40" />
            <p className="text-lg sm:text-xl text-muted-foreground font-medium">Innovation Meets Celebration</p>
            <span className="h-px w-12 bg-primary/40" />
          </div>
        </div>

        <div className="animate-fade-in-up [animation-delay:0.3s] opacity-0 flex justify-center mb-14">
          <CountdownTimer />
        </div>

        <div className="animate-fade-in-up [animation-delay:0.6s] opacity-0 flex flex-col sm:flex-row gap-5 justify-center">
          <MagneticWrapper>
            <button
              onClick={scrollToRegister}
              className="btn-golden h-14 px-12 text-lg font-bold inline-flex items-center justify-center">
              <span>🚀 Register Now</span>
            </button>
          </MagneticWrapper>
          <MagneticWrapper>
            <button
              className="btn-golden h-14 px-12 text-lg inline-flex items-center justify-center"
              onClick={() => document.querySelector("#about")?.scrollIntoView({ behavior: "smooth" })}>
              <span>Learn More →</span>
            </button>
          </MagneticWrapper>
        </div>
      </div>
    </section>
  );
};

export default Hero;
