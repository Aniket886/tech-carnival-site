import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

const ScrollToTop = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const heroSection = document.querySelector("#home");
      const heroHeight = heroSection instanceof HTMLElement ? heroSection.offsetHeight : window.innerHeight;
      setVisible(window.scrollY > heroHeight);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 right-6 z-40">
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Back to top"
        className="w-10 h-10 rounded-xl bg-card/80 backdrop-blur-sm border border-border/30 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 shadow-lg"
      >
        <ArrowUp size={16} />
      </button>
    </div>
  );
};

export default ScrollToTop;
