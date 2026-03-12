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
    <div className="fixed bottom-24 right-6 z-40">
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Back to top"
        className="w-10 h-10 rounded-xl bg-primary/20 backdrop-blur-sm border border-primary/40 flex items-center justify-center text-primary shadow-[0_0_15px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_25px_hsl(var(--primary)/0.6)] hover:bg-primary/30 hover:border-primary/60 transition-all duration-300"
      >
        <ArrowUp size={16} />
      </button>
    </div>
  );
};

export default ScrollToTop;
