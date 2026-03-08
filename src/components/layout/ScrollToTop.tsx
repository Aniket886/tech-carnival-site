import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

const CIRCLE_SIZE = 46;
const STROKE_WIDTH = 3;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const ScrollToTop = () => {
  const [visible, setVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const getHeroHeight = () => {
      const heroSection = document.querySelector("#home");
      return heroSection instanceof HTMLElement ? heroSection.offsetHeight : window.innerHeight;
    };
    const onScroll = () => {
      const heroHeight = getHeroHeight();
      const scrollTop = window.scrollY;
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollableHeight > 0 ? Math.min((scrollTop / scrollableHeight) * 100, 100) : 0;
      setVisible(scrollTop > heroHeight);
      setScrollProgress(progress);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
  }, []);

  if (!visible) return null;
  const strokeDashoffset = CIRCUMFERENCE - (scrollProgress / 100) * CIRCUMFERENCE;

  return (
    <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-background/85 border border-border/80 backdrop-blur-sm flex items-center justify-center text-primary hover:bg-background/95 hover:border-primary/60 transition-all duration-300 animate-in fade-in zoom-in-75" aria-label="Scroll to top">
      <svg className="absolute inset-0 -rotate-90" width={CIRCLE_SIZE} height={CIRCLE_SIZE} aria-hidden="true">
        <circle cx={CIRCLE_SIZE / 2} cy={CIRCLE_SIZE / 2} r={RADIUS} fill="none" stroke="hsl(var(--muted-foreground) / 0.25)" strokeWidth={STROKE_WIDTH} />
        <circle cx={CIRCLE_SIZE / 2} cy={CIRCLE_SIZE / 2} r={RADIUS} fill="none" stroke="hsl(var(--primary))" strokeWidth={STROKE_WIDTH} strokeDasharray={CIRCUMFERENCE} strokeDashoffset={strokeDashoffset} strokeLinecap="round" className="transition-[stroke-dashoffset] duration-150" />
      </svg>
      <ArrowUp size={18} className="relative z-10" />
    </button>
  );
};

export default ScrollToTop;
