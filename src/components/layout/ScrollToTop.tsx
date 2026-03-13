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
        className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 active:translate-y-[1px]"
        style={{
          background: 'linear-gradient(145deg, hsl(var(--primary) / 0.35), hsl(var(--primary) / 0.15))',
          border: '1px solid hsl(var(--primary) / 0.25)',
          boxShadow: `
            6px 6px 14px rgba(0, 0, 0, 0.5),
            -3px -3px 10px hsl(var(--primary) / 0.06),
            inset 2px 2px 4px rgba(255, 255, 255, 0.1),
            inset -2px -2px 4px rgba(0, 0, 0, 0.3)
          `,
          color: 'hsl(var(--primary))',
          textShadow: '0 0 10px hsl(var(--primary) / 0.5)',
        }}
      >
        <ArrowUp size={18} />
      </button>
    </div>
  );
};

export default ScrollToTop;
